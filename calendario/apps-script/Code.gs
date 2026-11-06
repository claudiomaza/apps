/**
 * Backend Calendario para Apps Script vinculado al Sheet.
 * Las cuentas activas se administran en la pestaña `Usuarios` del Sheet,
 * columnas `usuario` (o el encabezado heredado `mail`) y `pass`.
 * El usuario puede tener cualquier formato; las claves se guardan en texto plano.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0',
  DATA_SHEET: 'Eventos',
  USERS_SHEET: 'Usuarios',
  CACHE_SECONDS: 60,
  SESSION_SECONDS: 8 * 60 * 60,
  MAX_PAGE_SIZE: 300,
  MAX_BATCH_SIZE: 100,
  HEADERS: ['eventId','title','startAt','endAt','allDay','location','description','ownerEmail','status','version','createdAt','updatedAt','deletedAt','calendarEventId','calendarId','recurrence','reminderMinutes','reminderAt']
});

function doGet() {
  return json_({ok:true,service:'apps-calendar',schemaVersion:1});
}

function doPost(e) {
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (body.action === 'auth') {
      const result=authenticate_(String(body.user !== undefined ? body.user : (body.mail || '')),String(body.pass || ''));
      result.calendarName=calendarDisplayName_();
      if(body.includeInitialList===true){try{result.records=listEvents_({from:body.from,limit:body.limit}).records;}catch(err){result.initialListError=publicError_(err);}}
      return json_(result);
    }
    requireSession_(body.sessionToken);
    if (body.action === 'list') {const result=listEvents_(body);result.calendarName=calendarDisplayName_();return json_(result);}
    if(body.action==='getEvent')return json_(getEventById_(body));
    if(body.action==='getOperation')return json_(getOperation_(body));
    if (body.action === 'exportEvents') {const result=exportEventsPage_(body);result.calendarName=calendarDisplayName_();return json_(result);}
    if (body.action === 'createBatch') throw new Error('SYNC_REQUIRED');
    if (!['create','update','delete'].includes(body.action)) throw new Error('INVALID_ACTION');
    return json_(mutateEvent_(body.action, body));
  } catch (err) {
    return json_({ok:false,error:publicError_(err)});
  }
}

function authenticate_(username,password) {
  if(String(username||'').length>254||String(password||'').length>200)throw new Error('INVALID_CREDENTIALS');
  const wanted=String(username||'').trim().toLowerCase();
  const user=loadUsers_().find(x=>x.username.toLowerCase()===wanted);
  if(!user||!constantTimeEqual_(password,user.pass))throw new Error('INVALID_CREDENTIALS');
  const now=Date.now();
  const payload={iat:now,exp:now+CONFIG.SESSION_SECONDS*1000,nonce:Utilities.getUuid(),sub:user.username,credentialTag:credentialTag_(user)};
  const encoded=base64Url_(Utilities.newBlob(JSON.stringify(payload)).getBytes());
  return {ok:true,sessionToken:encoded+'.'+sign_(encoded),expiresAt:new Date(payload.exp).toISOString(),username:user.username};
}
function requireSession_(token) {
  if (!token || typeof token !== 'string') throw new Error('UNAUTHORIZED');
  const parts = token.split('.');
  if (parts.length !== 2 || !constantTimeEqual_(parts[1], sign_(parts[0]))) throw new Error('UNAUTHORIZED');
  let payload;
  try { payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); }
  catch (_) { throw new Error('UNAUTHORIZED'); }
  const activeUser=loadUsers_().find(x=>x.username.toLowerCase()===String(payload.sub||'').toLowerCase());
  if(!payload.exp||Date.now()>payload.exp||!payload.nonce||!activeUser||payload.credentialTag!==credentialTag_(activeUser))throw new Error('SESSION_EXPIRED');
}
function credentialTag_(user){return sign_('credential:'+user.username+':'+user.pass);}
function loadUsers_(){
  const cache=CacheService.getScriptCache(),key='auth:users:v2',hit=cache.get(key);
  if(hit)return JSON.parse(hit);
  const sheet=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.USERS_SHEET);
  if(!sheet)throw new Error('USERS_SHEET_NOT_FOUND');
  const last=sheet.getLastRow();
  const values=last?sheet.getRange(1,1,last,2).getDisplayValues():[];
  if(!values.length||!['mail','usuario'].includes(String(values[0][0]).toLowerCase())||values[0][1]!=='pass')throw new Error('USERS_SHEET_INVALID');
  const users=[],seen=new Set();
  values.slice(1).forEach(row=>{
    const username=String(row[0]||'').trim(),pass=String(row[1]||'');
    if(!username&&!pass)return;
    if(!username||username.length>254||/[\u0000-\u001F\u007F]/.test(username)||pass.length<1||pass.length>200)throw new Error('USERS_SHEET_INVALID');
    if(users.length>=200)throw new Error('USERS_SHEET_INVALID');
    const normalized=username.toLowerCase();
    if(seen.has(normalized))throw new Error('USERS_SHEET_INVALID');
    seen.add(normalized);users.push({username,pass});
  });
  if(users.length>200)throw new Error('USERS_SHEET_INVALID');
  cache.put(key,JSON.stringify(users),15);
  return users;
}
function limpiarCacheUsuarios(){const c=CacheService.getScriptCache();c.remove('auth:users:v1');c.remove('auth:users:v2');}
function sign_(value) {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('APP_SESSION_SIGNING_KEY');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('APP_SESSION_SIGNING_KEY', secret);
  }
  return base64Url_(Utilities.computeHmacSha256Signature(value, secret));
}
function base64Url_(bytes) { return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/,''); }
function constantTimeEqual_(a,b) {
  a=String(a); b=String(b);
  let diff=a.length ^ b.length;
  const n=Math.max(a.length,b.length);
  for(let i=0;i<n;i++) diff |= (a.charCodeAt(i%Math.max(a.length,1))||0) ^ (b.charCodeAt(i%Math.max(b.length,1))||0);
  return diff===0;
}

function listEvents_(q) {
  const from = String(q.from || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new Error('INVALID_FROM');
  const limit = Math.min(Math.max(Number(q.limit)||100,1),CONFIG.MAX_PAGE_SIZE),month=from.slice(0,7);
  const version = PropertiesService.getScriptProperties().getProperty('DATA_VERSION') || '0';
  const key = 'events:v1:'+version+':'+month+':'+limit;
  const cache = CacheService.getScriptCache();
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const sheet = dataSheet_(),records=[],last=sheet.getLastRow();
  const rangeStart=new Date(month+'-01T00:00:00-03:00'),rangeEnd=new Date(rangeStart.getFullYear(),rangeStart.getMonth()+1,1),windowStart=new Date(rangeStart.getTime()-86400000),windowEnd=new Date(rangeEnd.getTime()+86400000);
  for(let start=2;start<=last&&records.length<limit;){
    const count=Math.min(500,last-start+1),rows=sheet.getRange(start,1,count,CONFIG.HEADERS.length).getValues();
    for(const r of rows){if(!r[0]||r[8]==='DELETED')continue;const record=rowObject_(r);if(record.recurrence&&record.recurrence.frequency&&record.recurrence.frequency!=='none'){const cal=CalendarApp.getCalendarById(String(record.calendarId||''));if(!cal)continue;const series=cal.getEventSeriesById(String(record.calendarEventId||''));if(!series)continue;cal.getEvents(windowStart,windowEnd).forEach(instance=>{if(records.length<limit&&instance.getStartTime()>=rangeStart&&instance.getStartTime()<rangeEnd&&instance.isRecurringEvent()&&instance.getEventSeries().getId()===record.calendarEventId){const occurrence=Object.assign({},record,{seriesStartAt:record.startAt,seriesEndAt:record.endAt,startAt:instance.getStartTime().toISOString(),endAt:instance.getEndTime().toISOString()});records.push(occurrence);}});if(records.length>=limit)break;continue;}const begins=new Date(record.startAt);if(begins>=rangeStart&&begins<rangeEnd){records.push(record);if(records.length>=limit)break;}}
    start+=count;
  }
  const result = {ok:true,records};
  cache.put(key,JSON.stringify(result),CONFIG.CACHE_SECONDS);
  return result;
}
function exportEventsPage_(q){
  const cursor=q.cursor===undefined?0:Number(q.cursor),limit=Math.min(Math.max(Number(q.limit)||100,1),CONFIG.MAX_PAGE_SIZE);
  if(!Number.isInteger(cursor)||cursor<0)throw new Error('INVALID_CURSOR');
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw new Error('BUSY_RETRY');
  try{
    const version=PropertiesService.getScriptProperties().getProperty('DATA_VERSION')||'0';
    if(q.version!==undefined&&String(q.version)!==version)throw new Error('EXPORT_CHANGED');
    const sheet=dataSheet_(),last=sheet.getLastRow(),records=[];let row=Math.max(2,cursor+1),nextCursor=0;
    while(row<=last&&records.length<limit){
      const count=Math.min(500,last-row+1),values=sheet.getRange(row,1,count,CONFIG.HEADERS.length).getValues();
      for(let i=0;i<values.length;i++){
        const current=row+i,data=values[i];
        if(data[0]&&data[8]!=='DELETED')records.push(rowObject_(data));
        if(records.length>=limit){nextCursor=current;break;}
      }
      if(records.length>=limit)break;
      row+=count;nextCursor=row-1;
    }
    if(String(PropertiesService.getScriptProperties().getProperty('DATA_VERSION')||'0')!==version)throw new Error('EXPORT_CHANGED');
    return {ok:true,records,nextCursor,done:nextCursor===0||nextCursor>=last,version};
  } finally {lock.releaseLock();}
}

function getEventById_(body){const id=String(body.eventId||'');if(!/^[\w-]{8,80}$/.test(id))throw new Error('INVALID_EVENT_ID');const sheet=dataSheet_(),last=sheet.getLastRow(),ids=last>1?sheet.getRange(2,1,last-1,1).getDisplayValues().flat():[],index=ids.indexOf(id);if(index<0)return{ok:true,found:false};return{ok:true,found:true,record:rowObject_(sheet.getRange(index+2,1,1,CONFIG.HEADERS.length).getValues()[0])};}

function operationSheet_(){const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);let sh=ss.getSheetByName('SyncOperations');if(!sh){sh=ss.insertSheet('SyncOperations');sh.getRange(1,1,1,7).setValues([['idempotencyKey','requestHash','state','eventId','action','version','updatedAt']]);}const expected=['idempotencyKey','requestHash','state','eventId','action','version','updatedAt'];if(sh.getRange(1,1,1,expected.length).getDisplayValues()[0].some((x,i)=>x!==expected[i]))throw new Error('OPERATION_SHEET_INVALID');return sh;}
function operationHash_(action,body){const request=JSON.stringify({action,eventId:String(body.eventId||''),expectedVersion:Number(body.expectedVersion||0),changes:body.changes||{}});return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,request,Utilities.Charset.UTF_8)).replace(/=+$/,'');}
function beginOperation_(action,body){const key=String(body.idempotencyKey||'');if(!/^[\w-]{8,100}$/.test(key))throw new Error('INVALID_IDEMPOTENCY_KEY');const sh=operationSheet_(),last=sh.getLastRow(),rows=last>1?sh.getRange(2,1,last-1,7).getValues():[],hash=operationHash_(action,body),index=rows.findIndex(r=>r[0]===key);if(index>=0){const row=rows[index];if(row[1]!==hash||row[3]!==String(body.eventId||'')||row[4]!==action)throw new Error('IDEMPOTENCY_KEY_REUSED');if(row[2]==='DONE')return{done:true,record:{eventId:row[3],version:Number(row[5]||0)}};if(row[2]==='UNKNOWN'||row[2]==='PENDING')throw new Error('OUTCOME_UNKNOWN');const rn=index+2;sh.getRange(rn,3,1,5).setValues([['PENDING',row[3],action,Number(row[5]||0),new Date().toISOString()]]);return{done:false,rowNumber:rn,key,hash};}const rn=last+1;sh.getRange(rn,1,1,7).setValues([[key,hash,'PENDING',String(body.eventId||''),action,Number(body.expectedVersion||0),new Date().toISOString()]]);return{done:false,rowNumber:rn,key,hash};}
function finishOperation_(op,state,eventId,version){if(!op||op.done)return;operationSheet_().getRange(op.rowNumber,3,1,5).setValues([[state,eventId||'',op.action||'',Number(version||0),new Date().toISOString()]]);}
function getOperation_(body){const key=String(body.idempotencyKey||'');if(!/^[\w-]{8,100}$/.test(key))throw new Error('INVALID_IDEMPOTENCY_KEY');const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw new Error('BUSY_RETRY');try{const sh=operationSheet_(),last=sh.getLastRow(),rows=last>1?sh.getRange(2,1,last-1,7).getValues():[],index=rows.findIndex(x=>x[0]===key);if(index<0)return{ok:true,found:false};let r=rows[index];if(r[2]==='PENDING'){const sheet=dataSheet_(),n=sheet.getLastRow(),ids=n>1?sheet.getRange(2,1,n-1,1).getDisplayValues().flat():[],i=ids.indexOf(String(r[3]));if(i>=0){const event=rowObject_(sheet.getRange(i+2,1,1,CONFIG.HEADERS.length).getValues()[0]),expected=Number(r[5]||0),committed=r[4]==='create'?event.status==='ACTIVE'&&Number(event.version)===1:r[4]==='update'?event.status==='ACTIVE'&&Number(event.version)===expected+1:r[4]==='delete'?event.status==='DELETED'&&Number(event.version)===expected+1:false;if(committed){finishOperation_({rowNumber:index+2,action:r[4]},'DONE',r[3],event.version);return{ok:true,found:true,state:'DONE',eventId:r[3],version:Number(event.version)};}}}return{ok:true,found:true,state:r[2],eventId:r[3],version:Number(r[5]||0)};}finally{lock.releaseLock();}}

function mutateEvent_(action, body) {
  const eventId = String(body.eventId || '');
  if (!/^[\w-]{8,80}$/.test(eventId)) throw new Error('INVALID_EVENT_ID');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('BUSY_RETRY');
  let operation=null,calendarSideEffect=false;
  try {
    const sheet = dataSheet_();
    const last = sheet.getLastRow();
    const ids = last > 1 ? sheet.getRange(2,1,last-1,1).getDisplayValues().flat() : [];
    const index = ids.indexOf(eventId);
    const now = new Date().toISOString();
    operation=beginOperation_(action,body);if(operation.done)return{ok:true,duplicate:true,record:operation.record};operation.action=action;
    let row;
    if (action === 'create') {
      if(index>=0){const prior=rowObject_(sheet.getRange(index+2,1,1,CONFIG.HEADERS.length).getValues()[0].slice(0,CONFIG.HEADERS.length)),wanted=validateEvent_(body.changes||{}),same=['title','startAt','endAt','location','description','reminderMinutes','reminderAt'].every(k=>JSON.stringify(prior[k])===JSON.stringify(wanted[k]))&&JSON.stringify(prior.recurrence||{frequency:'none'})===JSON.stringify(wanted.recurrence||{frequency:'none'});if(!same)throw new Error('CONFLICT');finishOperation_(operation,'DONE',eventId,prior.version);return{ok:true,record:prior,duplicate:true};}
      const d = validateEvent_(body.changes || {});
      calendarSideEffect=true;const created = createCalendarEvent_(d);
      row = [eventId,d.title,d.startAt,d.endAt,d.allDay,d.location,d.description,'','ACTIVE',1,now,now,'',created.event.getId(),created.calendarId,JSON.stringify(d.recurrence),d.reminderMinutes,d.reminderAt];
      sheet.getRange(last+1,1,1,row.length).setValues([row]);
    } else {
      if (index < 0) throw new Error('NOT_FOUND');
      const rowNumber = index+2;
      const existing = sheet.getRange(rowNumber,1,1,CONFIG.HEADERS.length).getValues()[0];
      while(existing.length<CONFIG.HEADERS.length)existing.push('');
      if(existing[8]==='DELETED'){if(action==='delete'){const duplicate=rowObject_(existing);finishOperation_(operation,'DONE',eventId,duplicate.version);return{ok:true,duplicate:true,record:duplicate};}throw new Error('NOT_FOUND');}
      if(Number(body.expectedVersion)!==Number(existing[9])){if(action==='update'){const desired=validateEvent_(Object.assign(rowObject_(existing),body.changes||{})),current=rowObject_(existing),same=Object.keys(body.changes||{}).every(k=>JSON.stringify(current[k])===JSON.stringify(desired[k]));if(same){finishOperation_(operation,'DONE',eventId,current.version);return{ok:true,duplicate:true,record:current};}}throw new Error('CONFLICT');}
      if (action === 'delete') {
        calendarSideEffect=true;deleteCalendarEvent_(String(existing[13] || ''),String(existing[14] || ''),parseRecurrence_(existing[15]));
        existing[8]='DELETED'; existing[9]=Number(existing[9])+1; existing[11]=now; existing[12]=now;
      } else {
        const merged=Object.assign(rowObject_(existing),body.changes||{});if(!(body.changes&&Object.prototype.hasOwnProperty.call(body.changes,'recurrence')))merged.recurrence=parseRecurrence_(existing[15]);
        const d=validateEvent_(merged);
        calendarSideEffect=true;const calEvent = updateCalendarEvent_(String(existing[13] || ''),d,String(existing[14] || ''),parseRecurrence_(existing[15]));
        existing[1]=d.title; existing[2]=d.startAt; existing[3]=d.endAt; existing[4]=d.allDay;
        existing[5]=d.location; existing[6]=d.description; existing[9]=Number(existing[9])+1;
        existing[11]=now; existing[13]=calEvent.event.getId(); existing[14]=calEvent.calendarId; existing[15]=JSON.stringify(d.recurrence); existing[16]=d.reminderMinutes; existing[17]=d.reminderAt;
      }
      row=existing; sheet.getRange(rowNumber,1,1,row.length).setValues([row]);
    }
    SpreadsheetApp.flush();
    incrementDataVersion_();
    const result={ok:true,record:rowObject_(row)};finishOperation_(operation,'DONE',eventId,result.record.version);return result;
  } catch(err){if(typeof operation!=='undefined'&&operation&&!operation.done)finishOperation_(operation,calendarSideEffect?'UNKNOWN':'FAILED',eventId,body.expectedVersion);throw err;} finally { lock.releaseLock(); }
}

function createEventsBatch_(body) {
  const records = body.records;
  if (!Array.isArray(records) || records.length < 1 || records.length > CONFIG.MAX_BATCH_SIZE) throw new Error('INVALID_BATCH');
  const ids = new Set();
  const prepared = records.map(item => {
    const id=String(item.eventId||'');
    if(!/^[\w-]{8,80}$/.test(id)||ids.has(id))throw new Error('INVALID_BATCH');
    ids.add(id); return {id,d:validateEvent_(item.changes||{})};
  });
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))throw new Error('BUSY_RETRY');
  const created=[];
  try {
    const sheet=dataSheet_(),last=sheet.getLastRow();
    const existing=new Set(last>1?sheet.getRange(2,1,last-1,1).getDisplayValues().flat():[]);
    const fresh=prepared.filter(x=>!existing.has(x.id));
    if(!fresh.length)return {ok:true,accepted:[],duplicates:prepared.map(x=>x.id)};
    const now=new Date().toISOString();
    const rows=fresh.map(({id,d})=>{
      const calEvent=createCalendarEvent_(d),recurring=d.recurrence&&d.recurrence.frequency!=='none';created.push({event:calEvent.event,calendarId:calEvent.calendarId,recurring});
      return [id,d.title,d.startAt,d.endAt,d.allDay,d.location,d.description,'','ACTIVE',1,now,now,'',calEvent.event.getId(),calEvent.calendarId,JSON.stringify(d.recurrence),d.reminderMinutes,d.reminderAt];
    });
    sheet.getRange(last+1,1,rows.length,CONFIG.HEADERS.length).setValues(rows);
    SpreadsheetApp.flush(); incrementDataVersion_();
    return {ok:true,accepted:fresh.map(x=>x.id),duplicates:prepared.filter(x=>existing.has(x.id)).map(x=>x.id)};
  } catch(err) {
    created.forEach(item=>{try{if(item.recurring)item.event.deleteEventSeries();else item.event.deleteEvent();}catch(_){}});
    throw err;
  } finally { lock.releaseLock(); }
}

function getAppCalendar_() {
  const id=configValue_('calendarId');
  const calendar=id?CalendarApp.getCalendarById(id):CalendarApp.getDefaultCalendar();
  if(!calendar)throw new Error('CALENDAR_NOT_FOUND');
  return calendar;
}
function recurrenceRule_(r,startAt){
  if(!r||r.frequency==='none')return null;
  if(!['custom','daily','weekly','monthly','yearly'].includes(r.frequency))throw new Error('INVALID_RECURRENCE');
  const interval=Number(r.interval||1);
  if(!Number.isInteger(interval)||interval<1||interval>99)throw new Error('INVALID_RECURRENCE');
  const unit=r.frequency==='custom'?({day:'daily',week:'weekly',month:'monthly',year:'yearly'}[r.unit]||''):r.frequency;
  if(r.end!=='never'&&r.end!=='date'&&r.end!=='count')throw new Error('INVALID_RECURRENCE');
  if(r.weekdays&&(!Array.isArray(r.weekdays)||r.weekdays.some(d=>!Number.isInteger(Number(d))||Number(d)<0||Number(d)>6)||new Set(r.weekdays.map(Number)).size!==r.weekdays.length))throw new Error('INVALID_RECURRENCE');
  const recurrence=CalendarApp.newRecurrence();let rule;
  if(unit==='daily')rule=recurrence.addDailyRule();
  else if(unit==='weekly')rule=recurrence.addWeeklyRule();
  else if(unit==='monthly')rule=recurrence.addMonthlyRule();
  else if(unit==='yearly')rule=recurrence.addYearlyRule();
  else throw new Error('INVALID_RECURRENCE');
  rule.interval(interval);
  if(unit==='weekly'){
    const weekdays={0:CalendarApp.Weekday.SUNDAY,1:CalendarApp.Weekday.MONDAY,2:CalendarApp.Weekday.TUESDAY,3:CalendarApp.Weekday.WEDNESDAY,4:CalendarApp.Weekday.THURSDAY,5:CalendarApp.Weekday.FRIDAY,6:CalendarApp.Weekday.SATURDAY};
    const selected=r.weekdays&&r.weekdays.length?r.weekdays.map(Number):[new Date(startAt).getDay()];if(selected.some(d=>weekdays[d]===undefined)||new Set(selected).size!==selected.length)throw new Error('INVALID_RECURRENCE');
    rule.onlyOnWeekdays(selected.map(d=>weekdays[d]));
  }
  if(r.end==='count'){
    const count=Number(r.count);if(!Number.isInteger(count)||count<2||count>1000)throw new Error('INVALID_RECURRENCE');rule.times(count);
  } else if(r.end==='date'){
    const match=String(r.until||'').match(/^(\d{4})-(\d{2})-(\d{2})$/),until=match?new Date(Number(match[1]),Number(match[2])-1,Number(match[3])):null;
    if(!until||until.getFullYear()!==Number(match[1])||until.getMonth()!==Number(match[2])-1||until.getDate()!==Number(match[3])||r.until<startAt.slice(0,10))throw new Error('INVALID_RECURRENCE');until.setHours(23,59,59,999);rule.until(until);
  } else if(r.end!=='never')throw new Error('INVALID_RECURRENCE');
  return recurrence;
}
function createCalendarEvent_(d) {
  const calendar=getAppCalendar_(),start=new Date(d.startAt),end=new Date(d.endAt),options={location:d.location,description:d.description};
  const recurring=d.recurrence&&d.recurrence.frequency&&d.recurrence.frequency!=='none';
  const event=recurring?calendar.createEventSeries(d.title,start,end,recurrenceRule_(d.recurrence,start.toISOString()),options):calendar.createEvent(d.title,start,end,options);
  applyReminder_(event,d.reminderMinutes);
  return {event,calendarId:calendar.getId()};
}
function applyReminder_(event,minutes){
  if(minutes===null||minutes===undefined){event.resetReminders();return;}
  event.removeAllReminders();event.addPopupReminder(Number(minutes));
}
function updateCalendarEvent_(id,d,calendarId,oldRecurrence) {
  const calendar=calendarId?CalendarApp.getCalendarById(calendarId):CalendarApp.getDefaultCalendar();
  if(!calendar)throw new Error('CALENDAR_NOT_FOUND');const desired=configValue_('calendarName');if(desired&&calendar.getName()!==desired)calendar.setName(desired);
  const oldSeries=oldRecurrence&&oldRecurrence.frequency&&oldRecurrence.frequency!=='none',newSeries=d.recurrence&&d.recurrence.frequency&&d.recurrence.frequency!=='none';
  if(oldSeries&&newSeries){
    let series=calendar.getEventSeriesById(id);if(!series){const instance=calendar.getEvents(new Date(d.startAt),new Date(new Date(d.startAt).getTime()+86400000)).find(event=>event.isRecurringEvent()&&event.getEventSeries().getId()===id);series=instance&&instance.getEventSeries();}if(!series)throw new Error('NOT_FOUND');
    series.setTitle(d.title);series.setDescription(d.description);series.setLocation(d.location);
    series.setRecurrence(recurrenceRule_(d.recurrence,new Date(d.startAt).toISOString()),new Date(d.startAt),new Date(d.endAt));
    applyReminder_(series,d.reminderMinutes);
    return {event:series,calendarId:calendar.getId()};
  }
  if(oldSeries||newSeries){
    const replacement=createCalendarEvent_(d);
    try{
      if(oldSeries){let series=calendar.getEventSeriesById(id);if(!series){const instance=calendar.getEvents(new Date(d.startAt),new Date(new Date(d.startAt).getTime()+86400000)).find(event=>event.isRecurringEvent()&&event.getEventSeries().getId()===id);series=instance&&instance.getEventSeries();}if(!series)throw new Error('NOT_FOUND');series.deleteEventSeries();}
      else {const event=calendar.getEventById(id);if(event)event.deleteEvent();else throw new Error('NOT_FOUND');}
    }catch(err){try{if(newSeries)replacement.event.deleteEventSeries();else replacement.event.deleteEvent();}catch(_){}throw err;}
    return replacement;
  }
  const event=id?calendar.getEventById(id):null;
  if(!event)return createCalendarEvent_(d);
  event.setTitle(d.title);event.setTime(new Date(d.startAt),new Date(d.endAt));
  event.setLocation(d.location);event.setDescription(d.description);applyReminder_(event,d.reminderMinutes);
  return {event,calendarId:calendar.getId()};
}
function configValue_(key) {
  const cache=CacheService.getScriptCache(),cacheKey='calendar:config:v1',hit=cache.get(cacheKey),values=hit?JSON.parse(hit):null;
  let config=values;
  if(!config){
    const sheet=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Config');
    if(!sheet)throw new Error('CONFIG_SHEET_NOT_FOUND');
    config={};sheet.getDataRange().getDisplayValues().slice(1).forEach(row=>{if(row[0])config[String(row[0]).trim()]=String(row[1]||'').trim();});
    cache.put(cacheKey,JSON.stringify(config),30);
  }
  return config[key]||'';
}
function calendarDisplayName_(){const id=configValue_('calendarId'),calendar=id?CalendarApp.getCalendarById(id):CalendarApp.getDefaultCalendar();if(!calendar)throw new Error('CALENDAR_NOT_FOUND');const desired=configValue_('calendarName');if(desired&&calendar.getName()!==desired)calendar.setName(desired);return calendar.getName();}
function limpiarCacheConfig(){CacheService.getScriptCache().remove('calendar:config:v1');}
function deleteCalendarEvent_(id,calendarId,recurrence) {
  if(!id)return;
  const calendar=calendarId?CalendarApp.getCalendarById(calendarId):CalendarApp.getDefaultCalendar();
  if(!calendar)throw new Error('CALENDAR_NOT_FOUND');const desired=configValue_('calendarName');if(desired&&calendar.getName()!==desired)calendar.setName(desired);
  if(recurrence&&recurrence.frequency&&recurrence.frequency!=='none'){
    const series=calendar.getEventSeriesById(id);
    if(series){series.deleteEventSeries();return;}
    const occurrence=calendar.getEvents(new Date(Date.now()-365*86400000),new Date(Date.now()+365*86400000)).find(event=>event.isRecurringEvent()&&event.getEventSeries().getId()===id);if(occurrence){occurrence.getEventSeries().deleteEventSeries();return;}
    throw new Error('NOT_FOUND');
  }
  const event=calendar.getEventById(id);if(event)event.deleteEvent();
}
function incrementDataVersion_() {
  const p=PropertiesService.getScriptProperties();
  p.setProperty('DATA_VERSION',String(Number(p.getProperty('DATA_VERSION')||0)+1));
}
function validateEvent_(d) {
  const title=String(d.title||'').trim(), startAt=String(d.startAt||''), endAt=String(d.endAt||'');
  let raw=d.recurrence||{frequency:'none'};if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch(_){raw={frequency:'none'};}}
  if(!title||title.length>160||isNaN(Date.parse(startAt))||isNaN(Date.parse(endAt))||Date.parse(endAt)<=Date.parse(startAt))throw new Error('INVALID_EVENT');
  const frequency=String(raw.frequency||'none');if(!['none','daily','weekly','monthly','yearly','custom'].includes(frequency))throw new Error('INVALID_RECURRENCE');
  const recurrence=frequency==='custom'?{frequency:'custom',unit:String(raw.unit||''),interval:Number(raw.interval||1),weekdays:Array.isArray(raw.weekdays)?raw.weekdays.map(Number):[],end:String(raw.end||'never'),until:String(raw.until||''),count:Number(raw.count||0)}:{frequency,unit:'',interval:Number(raw.interval||1),weekdays:Array.isArray(raw.weekdays)?raw.weekdays.map(Number):[],end:String(raw.end||'never'),until:String(raw.until||''),count:Number(raw.count||0)};
  if(recurrence.frequency!=='none')recurrenceRule_(recurrence,startAt);
  const reminderMinutes=d.reminderMinutes===''||d.reminderMinutes===null||d.reminderMinutes===undefined?null:Number(d.reminderMinutes),reminderAt=d.reminderAt?String(d.reminderAt):'';
  if(reminderMinutes!==null&&(!Number.isInteger(reminderMinutes)||reminderMinutes<5||reminderMinutes>40320))throw new Error('INVALID_REMINDER');
  if(reminderAt&&(isNaN(Date.parse(reminderAt))||!reminderMinutes||Math.abs((Date.parse(startAt)-Date.parse(reminderAt))/60000-reminderMinutes)>1))throw new Error('INVALID_REMINDER');
  return {title,startAt,endAt,allDay:false,location:String(d.location||'').slice(0,160),description:String(d.description||'').slice(0,1000),recurrence,reminderMinutes,reminderAt};
}
function dataSheet_() {
  const ss=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet=ss.getSheetByName(CONFIG.DATA_SHEET);
  if(!sheet)throw new Error('SHEET_NOT_FOUND');
  ensureHeaders_(sheet);
  return sheet;
}
function ensureHeaders_(sheet) {
  if(sheet.getLastRow()===0){sheet.getRange(1,1,1,CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);return;}
  const width=Math.min(CONFIG.HEADERS.length,Math.max(sheet.getLastColumn(),15));
  const actual=sheet.getRange(1,1,1,width).getDisplayValues()[0];
  for(let i=0;i<width;i++)if(actual[i]&&actual[i]!==CONFIG.HEADERS[i])throw new Error('HEADER_MISMATCH');
  for(let i=0;i<CONFIG.HEADERS.length;i++)if(!actual[i])sheet.getRange(1,i+1).setValue(CONFIG.HEADERS[i]);
}
function parseRecurrence_(value){if(!value)return {frequency:'none'};if(typeof value==='object')return value;try{return JSON.parse(value);}catch(_){return {frequency:'none'};}}
function rowObject_(r) { const o={}; CONFIG.HEADERS.forEach((h,i)=>o[h]=r[i] instanceof Date?r[i].toISOString():r[i]);if(CONFIG.HEADERS.includes('recurrence'))o.recurrence=parseRecurrence_(o.recurrence);return o; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function publicError_(err) {
  const allowed=['INVALID_ACTION','SYNC_REQUIRED','INVALID_IDEMPOTENCY_KEY','IDEMPOTENCY_KEY_REUSED','OUTCOME_UNKNOWN','OPERATION_SHEET_INVALID','INVALID_FROM','INVALID_CURSOR','EXPORT_CHANGED','BUSY_RETRY','INVALID_RECURRENCE','INVALID_REMINDER','INVALID_EVENT_ID','INVALID_EVENT','INVALID_BATCH','NOT_FOUND','CONFLICT','SHEET_NOT_FOUND','CONFIG_SHEET_NOT_FOUND','CALENDAR_NOT_FOUND','USERS_SHEET_NOT_FOUND','USERS_SHEET_INVALID','INVALID_CREDENTIALS','UNAUTHORIZED','SESSION_EXPIRED'];
  return allowed.includes(err.message)?err.message:'INTERNAL_ERROR';
}

