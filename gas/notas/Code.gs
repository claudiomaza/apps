/**
 * Backend de Registro de notas para Apps Script vinculado al Sheet.
 * Las cuentas activas se administran en la pestaña `Usuarios` del Sheet,
 * columnas `usuario` (o el encabezado heredado `mail`) y `pass`.
 * El usuario puede tener cualquier formato; las claves se guardan en texto plano.
 * La pestaña Config (key/value) controla los límites operativos sin redeploy.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1eH_SMJcaPoA6tEkKakETRKS1TsvGXxHSXHlFB5m02yE',
  DATA_SHEET: 'Notas',
  USERS_SHEET: 'Usuarios',
  CACHE_SECONDS: 45,
  SESSION_SECONDS: 8 * 60 * 60,
  MAX_PAGE_SIZE: 300,
  MAX_BATCH_SIZE: 100,
  HEADERS: ['gradeId','studentId','studentName','courseId','courseName','assessmentId','assessmentName','score','maxScore','gradeDate','observation','status','version','createdAt','updatedAt']
});
function configValues_() {
  const cache=CacheService.getScriptCache(),key='app:config:v1',hit=cache.get(key);
  if(hit)return JSON.parse(hit);
  const sheet=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Config');
  if(!sheet)throw Error('CONFIG_SHEET_NOT_FOUND');
  const last=sheet.getLastRow(),rows=last?sheet.getRange(1,1,last,2).getDisplayValues():[];
  if(!rows.length||rows[0][0]!=='key'||rows[0][1]!=='value')throw Error('CONFIG_SHEET_INVALID');
  const values={};
  rows.slice(1).forEach(([rawKey,rawValue])=>{
    const key=String(rawKey||'').trim(),value=String(rawValue||'');
    if(!key&&!value)return;
    if(!/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(key)||/[\u0000-\u001F\u007F]/.test(value)||value.length>500||Object.prototype.hasOwnProperty.call(values,key))throw Error('CONFIG_SHEET_INVALID');
    values[key]=value;
  });
  cache.put(key,JSON.stringify(values),30);
  return values;
}
function configInteger_(key,defaultValue,min,max) {
  const raw=configValues_()[key];
  if(raw===undefined||raw.trim()==='')return defaultValue;
  if(!/^\d+$/.test(raw.trim()))throw Error('CONFIG_VALUE_INVALID');
  const value=Number(raw);
  if(!isFinite(value)||Math.floor(value)!==value||value<min||value>max)throw Error('CONFIG_VALUE_INVALID');
  return value;
}
function limpiarCacheConfig(){CacheService.getScriptCache().remove('app:config:v1');}
function doGet() { return json_({ok:true,service:'apps-gradebook',schemaVersion:1}); }
function doPost(e) {
  try {
    const b=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    configValues_();
    if(b.action==='auth')return json_(authenticate_(String(b.user!==undefined?b.user:(b.mail||'')),String(b.pass||'')));
    requireSession_(b.sessionToken);
    if(b.action==='list')return json_(listGrades_(b));
    if(b.action==='createBatch')return json_(createGradesBatch_(b));
    if(!['create','update','delete'].includes(b.action))throw Error('INVALID_ACTION');
    return json_(mutateGrade_(b.action,b));
  } catch(e) { return json_({ok:false,error:publicError_(e)}); }
}
function authenticate_(username,password) {
  if(String(username||'').length>254||String(password||'').length>200)throw Error('INVALID_CREDENTIALS');
  const wanted=String(username||'').trim().toLowerCase();
  const user=loadUsers_().find(x=>x.username.toLowerCase()===wanted);
  if(!user||!constantTimeEqual_(password,user.pass))throw Error('INVALID_CREDENTIALS');
  const now=Date.now(),payload={iat:now,exp:now+CONFIG.SESSION_SECONDS*1000,nonce:Utilities.getUuid(),sub:user.username,credentialTag:credentialTag_(user)};
  const encoded=base64Url_(Utilities.newBlob(JSON.stringify(payload)).getBytes());
  return {ok:true,sessionToken:encoded+'.'+sign_(encoded),expiresAt:new Date(payload.exp).toISOString(),username:user.username};
}
function requireSession_(token) {
  if(!token||typeof token!=='string')throw Error('UNAUTHORIZED');
  const parts=token.split('.');
  if(parts.length!==2||!constantTimeEqual_(parts[1],sign_(parts[0])))throw Error('UNAUTHORIZED');
  let payload;
  try { payload=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); }
  catch(_) { throw Error('UNAUTHORIZED'); }
  const activeUser=loadUsers_().find(x=>x.username.toLowerCase()===String(payload.sub||'').toLowerCase());
  if(!payload.exp||Date.now()>payload.exp||!payload.nonce||!activeUser||payload.credentialTag!==credentialTag_(activeUser))throw Error('SESSION_EXPIRED');
}
function credentialTag_(user){return sign_('credential:'+user.username+':'+user.pass);}
function loadUsers_(){
  const cache=CacheService.getScriptCache(),key='auth:users:v2',hit=cache.get(key);
  if(hit)return JSON.parse(hit);
  const sheet=SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.USERS_SHEET);
  if(!sheet)throw Error('USERS_SHEET_NOT_FOUND');
  const last=sheet.getLastRow();
  const values=last?sheet.getRange(1,1,last,2).getDisplayValues():[];
  if(!values.length||!['mail','usuario'].includes(String(values[0][0]).toLowerCase())||values[0][1]!=='pass')throw Error('USERS_SHEET_INVALID');
  const users=[],seen=new Set();
  values.slice(1).forEach(row=>{
    const username=String(row[0]||'').trim(),pass=String(row[1]||'');
    if(!username&&!pass)return;
    if(!username||username.length>254||/[\u0000-\u001F\u007F]/.test(username)||pass.length<1||pass.length>200)throw Error('USERS_SHEET_INVALID');
    if(users.length>=200)throw Error('USERS_SHEET_INVALID');
    const normalized=username.toLowerCase();
    if(seen.has(normalized))throw Error('USERS_SHEET_INVALID');
    seen.add(normalized);users.push({username,pass});
  });
  if(users.length>200)throw Error('USERS_SHEET_INVALID');
  cache.put(key,JSON.stringify(users),15);
  return users;
}
function limpiarCacheUsuarios(){const c=CacheService.getScriptCache();c.remove('auth:users:v1');c.remove('auth:users:v2');}
function sign_(value) {
  const p=PropertiesService.getScriptProperties();let secret=p.getProperty('APP_SESSION_SIGNING_KEY');
  if(!secret){secret=Utilities.getUuid()+Utilities.getUuid()+Utilities.getUuid();p.setProperty('APP_SESSION_SIGNING_KEY',secret);}
  return base64Url_(Utilities.computeHmacSha256Signature(value,secret));
}
function base64Url_(bytes){return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/,'');}
function constantTimeEqual_(a,b){a=String(a);b=String(b);let diff=a.length^b.length,n=Math.max(a.length,b.length);for(let i=0;i<n;i++)diff|=(a.charCodeAt(i%Math.max(a.length,1))||0)^(b.charCodeAt(i%Math.max(b.length,1))||0);return diff===0;}

function listGrades_(q) {
  const pageSize=configInteger_('maxPageSize',CONFIG.MAX_PAGE_SIZE,1,CONFIG.MAX_PAGE_SIZE),limit=Math.min(Math.max(Number(q.limit)||100,1),pageSize),p=PropertiesService.getScriptProperties();
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
  const maxBatch=configInteger_('maxBatchSize',CONFIG.MAX_BATCH_SIZE,1,CONFIG.MAX_BATCH_SIZE),items=b.records;if(!Array.isArray(items)||items.length<1||items.length>maxBatch)throw Error('INVALID_BATCH');
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
function publicError_(e){const ok=['CONFIG_SHEET_NOT_FOUND','CONFIG_SHEET_INVALID','CONFIG_VALUE_INVALID','INVALID_ACTION','INVALID_GRADE_ID','INVALID_GRADE','INVALID_BATCH','BUSY_RETRY','NOT_FOUND','CONFLICT','SHEET_NOT_FOUND','HEADER_MISMATCH','USERS_SHEET_NOT_FOUND','USERS_SHEET_INVALID','INVALID_CREDENTIALS','UNAUTHORIZED','SESSION_EXPIRED'];return ok.includes(e.message)?e.message:'INTERNAL_ERROR';}
