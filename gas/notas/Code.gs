/**
 * Backend de Registro de notas para Apps Script vinculado al Sheet.
 * Reemplazar CLAVE_ACCESO antes de desplegar; no subir la clave real al repo.
 * Antes de cada operación, el frontend obtiene y envía un sessionToken firmado.
 */
// Reemplazar por una clave larga, aleatoria y exclusiva antes de desplegar.
const CLAVE_ACCESO = 'REEMPLAZAR_POR_CLAVE_LARGA_ALEATORIA';
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1eH_SMJcaPoA6tEkKakETRKS1TsvGXxHSXHlFB5m02yE',
  DATA_SHEET: 'Notas',
  CACHE_SECONDS: 45,
  SESSION_SECONDS: 8 * 60 * 60,
  MAX_PAGE_SIZE: 300,
  MAX_BATCH_SIZE: 100,
  HEADERS: ['gradeId','studentId','studentName','courseId','courseName','assessmentId','assessmentName','score','maxScore','gradeDate','observation','status','version','createdAt','updatedAt']
});
function doGet() { return json_({ok:true,service:'apps-gradebook',schemaVersion:1}); }
function doPost(e) {
  try {
    const b=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    if(b.action==='auth')return json_(authenticate_(String(b.password||'')));
    requireSession_(b.sessionToken);
    if(b.action==='list')return json_(listGrades_(b));
    if(b.action==='createBatch')return json_(createGradesBatch_(b));
    if(!['create','update','delete'].includes(b.action))throw Error('INVALID_ACTION');
    return json_(mutateGrade_(b.action,b));
  } catch(e) { return json_({ok:false,error:publicError_(e)}); }
}
function authenticate_(password) {
  if(!CLAVE_ACCESO||CLAVE_ACCESO.indexOf('REEMPLAZAR_')===0)throw Error('PASSWORD_NOT_CONFIGURED');
  if(!constantTimeEqual_(password,CLAVE_ACCESO))throw Error('INVALID_PASSWORD');
  const now=Date.now(),payload={iat:now,exp:now+CONFIG.SESSION_SECONDS*1000,nonce:Utilities.getUuid()};
  const encoded=base64Url_(Utilities.newBlob(JSON.stringify(payload)).getBytes());
  return {ok:true,sessionToken:encoded+'.'+sign_(encoded),expiresAt:new Date(payload.exp).toISOString()};
}
function requireSession_(token) {
  if(!token||typeof token!=='string')throw Error('UNAUTHORIZED');
  const parts=token.split('.');
  if(parts.length!==2||!constantTimeEqual_(parts[1],sign_(parts[0])))throw Error('UNAUTHORIZED');
  let payload;
  try { payload=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); }
  catch(_) { throw Error('UNAUTHORIZED'); }
  if(!payload.exp||Date.now()>payload.exp||!payload.nonce)throw Error('SESSION_EXPIRED');
}
function sign_(value) {
  const p=PropertiesService.getScriptProperties();let secret=p.getProperty('APP_SESSION_SIGNING_KEY');
  if(!secret){secret=Utilities.getUuid()+Utilities.getUuid()+Utilities.getUuid();p.setProperty('APP_SESSION_SIGNING_KEY',secret);}
  return base64Url_(Utilities.computeHmacSha256Signature(value,secret));
}
function base64Url_(bytes){return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/,'');}
function constantTimeEqual_(a,b){a=String(a);b=String(b);let diff=a.length^b.length,n=Math.max(a.length,b.length);for(let i=0;i<n;i++)diff|=(a.charCodeAt(i%Math.max(a.length,1))||0)^(b.charCodeAt(i%Math.max(b.length,1))||0);return diff===0;}

function listGrades_(q) {
  const limit=Math.min(Math.max(Number(q.limit)||100,1),CONFIG.MAX_PAGE_SIZE),p=PropertiesService.getScriptProperties();
  const version=p.getProperty('DATA_VERSION')||'0',key=`grades:v1:${version}:${limit}`,cache=CacheService.getScriptCache(),hit=cache.get(key);
  if(hit)return JSON.parse(hit);
  const sh=dataSheet_(),last=sh.getLastRow(),records=[];
  // Lee bloques desde el final y frena al completar la página; evita cargar toda la hoja.
  for(let end=last;end>=2&&records.length<limit;){
    const start=Math.max(2,end-499),rows=sh.getRange(start,1,end-start+1,CONFIG.HEADERS.length).getValues();
    for(let i=rows.length-1;i>=0&&records.length<limit;i--){const r=rows[i];if(r[0]&&r[11]!=='DELETED')records.push(rowObject_(r));}
    end=start-1;
  }
  const result={ok:true,records};cache.put(key,JSON.stringify(result),CONFIG.CACHE_SECONDS);return result;
}
function mutateGrade_(action,b) {
  const id=String(b.gradeId||'');if(!/^[\w-]{8,80}$/.test(id))throw Error('INVALID_GRADE_ID');
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('BUSY_RETRY');
  try {
    const sh=dataSheet_(),last=sh.getLastRow(),ids=last>1?sh.getRange(2,1,last-1,1).getDisplayValues().flat():[],i=ids.indexOf(id),now=new Date().toISOString();let row;
    if(action==='create'){
      if(i>=0)return {ok:true,record:rowObject_(sh.getRange(i+2,1,1,CONFIG.HEADERS.length).getValues()[0]),duplicate:true};
      const d=validateGrade_(b.changes||{});
      row=[id,d.studentId,d.studentName,d.courseId,d.courseName,d.assessmentId,d.assessmentName,d.score,d.maxScore,d.gradeDate,d.observation,'ACTIVE',1,now,now];
      sh.getRange(last+1,1,1,row.length).setValues([row]);
    } else {
      if(i<0)throw Error('NOT_FOUND');
      const rn=i+2,current=sh.getRange(rn,1,1,CONFIG.HEADERS.length).getValues()[0];
      if(Number(b.expectedVersion)!==Number(current[12]))throw Error('CONFLICT');
      if(current[11]==='DELETED')throw Error('NOT_FOUND');
      if(action==='delete'){current[11]='DELETED';current[12]=Number(current[12])+1;current[14]=now;}
      else {const d=validateGrade_(Object.assign(rowObject_(current),b.changes||{}));[current[1],current[2],current[3],current[4],current[5],current[6],current[7],current[8],current[9],current[10]]=[d.studentId,d.studentName,d.courseId,d.courseName,d.assessmentId,d.assessmentName,d.score,d.maxScore,d.gradeDate,d.observation];current[12]=Number(current[12])+1;current[14]=now;}
      row=current;sh.getRange(rn,1,1,row.length).setValues([row]);
    }
    SpreadsheetApp.flush();incrementDataVersion_();return {ok:true,record:rowObject_(row)};
  } finally {lock.releaseLock();}
}
function createGradesBatch_(b) {
  const items=b.records;if(!Array.isArray(items)||items.length<1||items.length>CONFIG.MAX_BATCH_SIZE)throw Error('INVALID_BATCH');
  const seen=new Set(),prepared=items.map(x=>{const id=String(x.gradeId||'');if(!/^[\w-]{8,80}$/.test(id)||seen.has(id))throw Error('INVALID_BATCH');seen.add(id);return {id,d:validateGrade_(x.changes||{})};});
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))throw Error('BUSY_RETRY');
  try {
    const sh=dataSheet_(),last=sh.getLastRow(),existing=new Set(last>1?sh.getRange(2,1,last-1,1).getDisplayValues().flat():[]),fresh=prepared.filter(x=>!existing.has(x.id));
    if(fresh.length){const now=new Date().toISOString(),rows=fresh.map(({id,d})=>[id,d.studentId,d.studentName,d.courseId,d.courseName,d.assessmentId,d.assessmentName,d.score,d.maxScore,d.gradeDate,d.observation,'ACTIVE',1,now,now]);sh.getRange(last+1,1,rows.length,CONFIG.HEADERS.length).setValues(rows);SpreadsheetApp.flush();incrementDataVersion_();}
    return {ok:true,accepted:fresh.map(x=>x.id),duplicates:prepared.filter(x=>existing.has(x.id)).map(x=>x.id)};
  } finally {lock.releaseLock();}
}
function incrementDataVersion_(){const p=PropertiesService.getScriptProperties();p.setProperty('DATA_VERSION',String(Number(p.getProperty('DATA_VERSION')||0)+1));}
function validateGrade_(d) {
  const score=Number(d.score),max=Number(d.maxScore),studentName=String(d.studentName||'').trim(),assessmentName=String(d.assessmentName||'').trim(),gradeDate=String(d.gradeDate||'');
  if(!studentName||studentName.length>120||!assessmentName||assessmentName.length>160||!Number.isFinite(score)||!Number.isFinite(max)||score<0||max<=0||score>max||!/^\d{4}-\d{2}-\d{2}$/.test(gradeDate))throw Error('INVALID_GRADE');
  return {studentId:String(d.studentId||'').slice(0,80),studentName,courseId:String(d.courseId||'').slice(0,80),courseName:String(d.courseName||'').trim().slice(0,100),assessmentId:String(d.assessmentId||'').slice(0,80),assessmentName,score,maxScore:max,gradeDate,observation:String(d.observation||'').slice(0,1000)};
}
function dataSheet_(){const s=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.DATA_SHEET);if(!s)throw Error('SHEET_NOT_FOUND');ensureHeaders_(s);return s;}
function ensureHeaders_(s){if(s.getLastRow()===0){s.getRange(1,1,1,CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);return;}const actual=s.getRange(1,1,1,CONFIG.HEADERS.length).getDisplayValues()[0];if(CONFIG.HEADERS.some((h,i)=>actual[i]!==h))throw Error('HEADER_MISMATCH');}
function rowObject_(r){const o={};CONFIG.HEADERS.forEach((h,i)=>o[h]=r[i] instanceof Date?r[i].toISOString():r[i]);return o;}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function publicError_(e){const ok=['INVALID_ACTION','INVALID_GRADE_ID','INVALID_GRADE','INVALID_BATCH','BUSY_RETRY','NOT_FOUND','CONFLICT','SHEET_NOT_FOUND','HEADER_MISMATCH','PASSWORD_NOT_CONFIGURED','INVALID_PASSWORD','UNAUTHORIZED','SESSION_EXPIRED'];return ok.includes(e.message)?e.message:'INTERNAL_ERROR';}
