const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1OypDck9kNKtTPHOdNWPLCqU9Sjr591a9bL6S3YhjFH0',
  DATA_SHEET: 'Eventos',
  CACHE_SECONDS: 60,
  MAX_PAGE_SIZE: 300,
  HEADERS: ['eventId','title','startAt','endAt','allDay','location','description','ownerEmail','status','version','createdAt','updatedAt','deletedAt','calendarEventId']
});

function doPost(e) {
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    const action = String(body.action || '');
    if (action === 'list') return json_(listEvents_(body));
    if (action === 'createBatch') return json_(createEventsBatch_(body));
    if (!['create','update','delete'].includes(action)) throw new Error('INVALID_ACTION');
    return json_(mutateEvent_(action, body));
  } catch (err) {
    return json_({ok:false,error:publicError_(err)});
  }
}
function doGet() { return json_({ok:true,service:'apps-calendar',schemaVersion:1}); }
function listEvents_(q) {
  const from = String(q.from || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new Error('INVALID_FROM');
  const limit = Math.min(Math.max(Number(q.limit)||100,1),CONFIG.MAX_PAGE_SIZE);
  const version = PropertiesService.getScriptProperties().getProperty('DATA_VERSION') || '0';
  const key = 'events:v1:'+version+':'+from+':'+limit;
  const cache = CacheService.getScriptCache();
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const sheet = dataSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).filter(r => r[0] && r[8] !== 'DELETED' && String(r[2]).slice(0,7) === from.slice(0,7)).slice(0,limit).map(rowObject_);
  const result = {ok:true,records:rows};
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
      row = [eventId,d.title,d.startAt,d.endAt,d.allDay,d.location,d.description,'','ACTIVE',1,now,now,'',''];
      sheet.getRange(last+1,1,1,row.length).setValues([row]);
    } else {
      if (index < 0) throw new Error('NOT_FOUND');
      const rowNumber = index+2;
      const existing = sheet.getRange(rowNumber,1,1,CONFIG.HEADERS.length).getValues()[0];
      if (Number(body.expectedVersion) !== Number(existing[9])) throw new Error('CONFLICT');
      if (existing[8] === 'DELETED') throw new Error('NOT_FOUND');
      if (action === 'delete') {
        existing[8]='DELETED'; existing[9]=Number(existing[9])+1; existing[11]=now; existing[12]=now;
      } else {
        const d=validateEvent_(Object.assign(rowObject_(existing),body.changes||{}));
        existing[1]=d.title; existing[2]=d.startAt; existing[3]=d.endAt; existing[4]=d.allDay; existing[5]=d.location; existing[6]=d.description; existing[9]=Number(existing[9])+1; existing[11]=now;
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
  if (!Array.isArray(records) || records.length < 1 || records.length > 100) throw new Error('INVALID_BATCH');
  const ids = new Set();
  const prepared = records.map(item => {
    const id = String(item.eventId || '');
    if (!/^[\\w-]{8,80}$/.test(id) || ids.has(id)) throw new Error('INVALID_BATCH');
    ids.add(id);
    const d = validateEvent_(item.changes || {});
    return {id,d};
  });
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('BUSY_RETRY');
  try {
    const sheet = dataSheet_();
    const last = sheet.getLastRow();
    const existing = new Set(last > 1 ? sheet.getRange(2,1,last-1,1).getDisplayValues().flat() : []);
    const fresh = prepared.filter(x => !existing.has(x.id));
    if (fresh.length) {
      const now = new Date().toISOString();
      const rows = fresh.map(({id,d}) => [id,d.title,d.startAt,d.endAt,d.allDay,d.location,d.description,'','ACTIVE',1,now,now,'','']);
      sheet.getRange(last+1,1,rows.length,CONFIG.HEADERS.length).setValues(rows);
      SpreadsheetApp.flush();
      incrementDataVersion_();
    }
    return {ok:true,accepted:fresh.map(x=>x.id),duplicates:prepared.filter(x=>existing.has(x.id)).map(x=>x.id)};
  } finally { lock.releaseLock(); }
}
function incrementDataVersion_() {
  const p = PropertiesService.getScriptProperties();
  p.setProperty('DATA_VERSION', String(Number(p.getProperty('DATA_VERSION') || 0) + 1));
}
function validateEvent_(d) {
  const title=String(d.title||'').trim(), startAt=String(d.startAt||''), endAt=String(d.endAt||'');
  if (!title || title.length>160 || isNaN(Date.parse(startAt)) || isNaN(Date.parse(endAt)) || Date.parse(endAt)<=Date.parse(startAt)) throw new Error('INVALID_EVENT');
  return {title,startAt,endAt,allDay:Boolean(d.allDay),location:String(d.location||'').slice(0,160),description:String(d.description||'').slice(0,1000)};
}
function dataSheet_() { const s=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.DATA_SHEET); if(!s) throw new Error('SHEET_NOT_FOUND'); return s; }
function rowObject_(r) { const o={}; CONFIG.HEADERS.forEach((h,i)=>o[h]=r[i] instanceof Date?r[i].toISOString():r[i]); return o; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function publicError_(err) { const allowed=['INVALID_ACTION','INVALID_FROM','INVALID_EVENT_ID','INVALID_EVENT','INVALID_BATCH','BUSY_RETRY','NOT_FOUND','CONFLICT','SHEET_NOT_FOUND']; return allowed.includes(err.message)?err.message:'INTERNAL_ERROR'; }
