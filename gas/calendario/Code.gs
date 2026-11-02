/**
 * Backend Calendario para Apps Script vinculado al Sheet.
 * Configurar en Project Settings > Script Properties:
 *   APP_ACCESS_PASSWORD = una clave larga y aleatoria (no subirla al repo)
 * El frontend debe llamar primero {action:"auth", password:"..."} y enviar
 * el sessionToken retornado en los POST siguientes.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0',
  DATA_SHEET: 'Eventos',
  CACHE_SECONDS: 60,
  SESSION_SECONDS: 8 * 60 * 60,
  MAX_PAGE_SIZE: 300,
  MAX_BATCH_SIZE: 100,
  HEADERS: ['eventId','title','startAt','endAt','allDay','location','description','ownerEmail','status','version','createdAt','updatedAt','deletedAt','calendarEventId']
});

function doGet() {
  return json_({ok:true,service:'apps-calendar',schemaVersion:1});
}

function doPost(e) {
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (body.action === 'auth') return json_(authenticate_(String(body.password || '')));
    requireSession_(body.sessionToken);
    if (body.action === 'list') return json_(listEvents_(body));
    if (body.action === 'createBatch') return json_(createEventsBatch_(body));
    if (!['create','update','delete'].includes(body.action)) throw new Error('INVALID_ACTION');
    return json_(mutateEvent_(body.action, body));
  } catch (err) {
    return json_({ok:false,error:publicError_(err)});
  }
}

function authenticate_(password) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty('APP_ACCESS_PASSWORD');
  if (!expected) throw new Error('PASSWORD_NOT_CONFIGURED');
  if (!constantTimeEqual_(password, expected)) throw new Error('INVALID_PASSWORD');
  const now = Date.now();
  const payload = {iat:now,exp:now + CONFIG.SESSION_SECONDS * 1000,nonce:Utilities.getUuid()};
  const encoded = base64Url_(Utilities.newBlob(JSON.stringify(payload)).getBytes());
  const token = encoded + '.' + sign_(encoded);
  return {ok:true,sessionToken:token,expiresAt:new Date(payload.exp).toISOString()};
}
function requireSession_(token) {
  if (!token || typeof token !== 'string') throw new Error('UNAUTHORIZED');
  const parts = token.split('.');
  if (parts.length !== 2 || !constantTimeEqual_(parts[1], sign_(parts[0]))) throw new Error('UNAUTHORIZED');
  let payload;
  try { payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); }
  catch (_) { throw new Error('UNAUTHORIZED'); }
  if (!payload.exp || Date.now() > payload.exp || !payload.nonce) throw new Error('SESSION_EXPIRED');
}
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
  const limit = Math.min(Math.max(Number(q.limit)||100,1),CONFIG.MAX_PAGE_SIZE);
  const version = PropertiesService.getScriptProperties().getProperty('DATA_VERSION') || '0';
  const key = 'events:v1:'+version+':'+from.slice(0,7)+':'+limit;
  const cache = CacheService.getScriptCache();
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const sheet = dataSheet_();
  const values = sheet.getDataRange().getValues();
  const records = values.slice(1)
    .filter(r => r[0] && r[8] !== 'DELETED' && String(r[2]).slice(0,7) === from.slice(0,7))
    .slice(0,limit).map(rowObject_);
  const result = {ok:true,records};
  cache.put(key,JSON.stringify(result),CONFIG.CACHE_SECONDS);
  return result;
}

function mutateEvent_(action, body) {
  const eventId = String(body.eventId || '');
  if (!/^[\w-]{8,80}$/.test(eventId)) throw new Error('INVALID_EVENT_ID');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('BUSY_RETRY');
  try {
    const sheet = dataSheet_();
    const last = sheet.getLastRow();
    const ids = last > 1 ? sheet.getRange(2,1,last-1,1).getDisplayValues().flat() : [];
    const index = ids.indexOf(eventId);
    const now = new Date().toISOString();
    let row;
    if (action === 'create') {
      if (index >= 0) return {ok:true,record:rowObject_(sheet.getRange(index+2,1,1,CONFIG.HEADERS.length).getValues()[0]),duplicate:true};
      const d = validateEvent_(body.changes || {});
      const calEvent = createCalendarEvent_(d);
      row = [eventId,d.title,d.startAt,d.endAt,d.allDay,d.location,d.description,'','ACTIVE',1,now,now,'',calEvent.getId()];
      sheet.getRange(last+1,1,1,row.length).setValues([row]);
    } else {
      if (index < 0) throw new Error('NOT_FOUND');
      const rowNumber = index+2;
      const existing = sheet.getRange(rowNumber,1,1,CONFIG.HEADERS.length).getValues()[0];
      if (Number(body.expectedVersion) !== Number(existing[9])) throw new Error('CONFLICT');
      if (existing[8] === 'DELETED') throw new Error('NOT_FOUND');
      if (action === 'delete') {
        deleteCalendarEvent_(String(existing[13] || ''));
        existing[8]='DELETED'; existing[9]=Number(existing[9])+1; existing[11]=now; existing[12]=now;
      } else {
        const d=validateEvent_(Object.assign(rowObject_(existing),body.changes||{}));
        const calEvent = updateCalendarEvent_(String(existing[13] || ''),d);
        existing[1]=d.title; existing[2]=d.startAt; existing[3]=d.endAt; existing[4]=d.allDay;
        existing[5]=d.location; existing[6]=d.description; existing[9]=Number(existing[9])+1;
        existing[11]=now; existing[13]=calEvent.getId();
      }
      row=existing; sheet.getRange(rowNumber,1,1,row.length).setValues([row]);
    }
    SpreadsheetApp.flush();
    incrementDataVersion_();
    return {ok:true,record:rowObject_(row)};
  } finally { lock.releaseLock(); }
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
      const calEvent=createCalendarEvent_(d); created.push(calEvent);
      return [id,d.title,d.startAt,d.endAt,d.allDay,d.location,d.description,'','ACTIVE',1,now,now,'',calEvent.getId()];
    });
    sheet.getRange(last+1,1,rows.length,CONFIG.HEADERS.length).setValues(rows);
    SpreadsheetApp.flush(); incrementDataVersion_();
    return {ok:true,accepted:fresh.map(x=>x.id),duplicates:prepared.filter(x=>existing.has(x.id)).map(x=>x.id)};
  } catch(err) {
    created.forEach(event=>{try{event.deleteEvent();}catch(_){}});
    throw err;
  } finally { lock.releaseLock(); }
}

function createCalendarEvent_(d) {
  const cal=CalendarApp.getDefaultCalendar();
  return cal.createEvent(d.title,new Date(d.startAt),new Date(d.endAt),{location:d.location,description:d.description});
}
function updateCalendarEvent_(id,d) {
  const event=id?CalendarApp.getEventById(id):null;
  if(!event)return createCalendarEvent_(d);
  event.setTitle(d.title); event.setTime(new Date(d.startAt),new Date(d.endAt));
  event.setLocation(d.location); event.setDescription(d.description);
  return event;
}
function deleteCalendarEvent_(id) {
  if(!id)return;
  const event=CalendarApp.getEventById(id);
  if(event)event.deleteEvent();
}
function incrementDataVersion_() {
  const p=PropertiesService.getScriptProperties();
  p.setProperty('DATA_VERSION',String(Number(p.getProperty('DATA_VERSION')||0)+1));
}
function validateEvent_(d) {
  const title=String(d.title||'').trim(), startAt=String(d.startAt||''), endAt=String(d.endAt||'');
  if(!title||title.length>160||isNaN(Date.parse(startAt))||isNaN(Date.parse(endAt))||Date.parse(endAt)<=Date.parse(startAt))throw new Error('INVALID_EVENT');
  return {title,startAt,endAt,allDay:Boolean(d.allDay),location:String(d.location||'').slice(0,160),description:String(d.description||'').slice(0,1000)};
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
  const actual=sheet.getRange(1,1,1,CONFIG.HEADERS.length).getDisplayValues()[0];
  if(CONFIG.HEADERS.some((h,i)=>actual[i]!==h))throw new Error('HEADER_MISMATCH');
}
function rowObject_(r) { const o={}; CONFIG.HEADERS.forEach((h,i)=>o[h]=r[i] instanceof Date?r[i].toISOString():r[i]); return o; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function publicError_(err) {
  const allowed=['INVALID_ACTION','INVALID_FROM','INVALID_EVENT_ID','INVALID_EVENT','INVALID_BATCH','BUSY_RETRY','NOT_FOUND','CONFLICT','SHEET_NOT_FOUND','PASSWORD_NOT_CONFIGURED','INVALID_PASSWORD','UNAUTHORIZED','SESSION_EXPIRED'];
  return allowed.includes(err.message)?err.message:'INTERNAL_ERROR';
}
