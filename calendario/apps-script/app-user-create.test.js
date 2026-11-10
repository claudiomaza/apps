'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync(__dirname+'/Code.gs','utf8'),ctx={Date,JSON,Math,Number,String,Array,Object,Set,Map,Error,RegExp,Utilities:{getUuid:()=> 'uuid',base64EncodeWebSafe:x=>String(x),computeDigest:(a,v)=>v,DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF-8'}}};
vm.createContext(ctx);vm.runInContext(code+';globalThis.api={roleAllows_,publicError_,normalizeAppUserInput_};',ctx);const {roleAllows_,publicError_,normalizeAppUserInput_}=ctx.api,parse=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(parse(normalizeAppUserInput_({username:'  ana@example.org  ',password:' x '})),{username:'ana@example.org',password:' x '});
for(const input of [{username:'',password:'x'},{username:'x'.repeat(255),password:'x'},{username:'bad\nname',password:'x'},{username:'ana',password:''},{username:'ana',password:'x'.repeat(201)}])assert.throws(()=>normalizeAppUserInput_(input));
assert.equal(roleAllows_('owner','createAppUser'),true);assert.equal(roleAllows_('editor','createAppUser'),false);assert.equal(roleAllows_('reader','createAppUser'),false);
assert.match(code,/action==='createAppUser'\)return json_\(createAppUser_\(body,user\)\)/);assert.match(code,/APP_USER_EXISTS/);assert.equal(publicError_({message:'APP_USER_EXISTS'}),'APP_USER_EXISTS');
const create=code.slice(code.indexOf('function createAppUser_'),code.indexOf('\n',code.indexOf('function createAppUser_')));assert.match(create,/limpiarCacheUsuarios\(\)/);assert.match(create,/appendRow\(\[account\.username,account\.password\]\)/);assert.match(create,/return\{ok:true,username:account\.username\}/);assert.doesNotMatch(create,/password:/);
// Exercise the actual doPost gate and write path with service boundaries stubbed.
const accounts=[{username:'owner',pass:'old'}],written=[];let role='owner',cacheClears=0;
ctx.requireSession_=()=>({sub:'owner'});ctx.json_=x=>x;ctx.setCalendarContext_=(body,user,action)=>{if(action!=='createAppUser'||role!=='owner')throw Error('CALENDAR_ADMIN_REQUIRED');return{};};ctx.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})};ctx.limpiarCacheUsuarios=()=>{cacheClears++;};ctx.loadUsers_=()=>accounts.slice();ctx.SpreadsheetApp={openById:()=>({getSheetByName:()=>({appendRow:r=>{written.push(r);accounts.push({username:r[0],pass:r[1]});}})})};ctx.CONFIG={SPREADSHEET_ID:'test',USERS_SHEET:'Usuarios'};
const post=(username,password)=>ctx.doPost({postData:{contents:JSON.stringify({action:'createAppUser',username,password})}});
const created=post('new.user','init');assert.deepEqual(parse(created),{ok:true,username:'new.user'});assert.deepEqual(parse(written),[['new.user','init']]);assert.ok(cacheClears>=2);assert.equal(JSON.stringify(created).includes('init'),false);
assert.equal(post('OWNER','pw').error,'APP_USER_EXISTS');role='reader';assert.equal(post('other','pw').error,'CALENDAR_ADMIN_REQUIRED');assert.equal(written.length,1);
console.log('App-user creation validation, actual doPost owner gate, duplicate handling and safe response PASS');
