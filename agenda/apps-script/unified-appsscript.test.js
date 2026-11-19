'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const dir=__dirname,code=fs.readFileSync(path.join(dir,'Code.gs'),'utf8'),html=fs.readFileSync(path.join(dir,'Agenda.html'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'appsscript.json'),'utf8'));
assert.match(code,/function doGet\(e\)[\s\S]*?createHtmlOutputFromFile\('Agenda'\)/,'GET serves the integrated HtmlService UI');
assert.match(code,/function doPost\(e\)/,'POST API remains for Pages');
assert.match(code,/function runAgendaApi\(request\)/,'AIO RPC enters the shared API dispatcher');
assert.match(code,/function runAgendaMaintenance\(action,payload\)/,'maintenance RPC is kept in the same backend project');
assert.doesNotMatch(code,/AGENDA_AIO_WEB_APP_URL|UrlFetchApp\.fetch/,'no second AIO endpoint or proxy');
assert.match(html,/google\.script\.run[\s\S]*?runAgendaApi\(request\)/,'HtmlService UI calls shared server API');
assert.match(html,/\.runAgendaMaintenance\(action/,'maintenance is server-side');
assert.doesNotMatch(html,/AGENDA_BACKEND_URL|script\.google\.com\/macros\/s\//);
assert.ok(manifest.oauthScopes.includes('https://www.googleapis.com/auth/spreadsheets'));
assert.ok(manifest.oauthScopes.includes('https://www.googleapis.com/auth/calendar.acls.readonly'));
assert.ok(manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.container.ui'));
assert.ok(manifest.oauthScopes.includes('https://www.googleapis.com/auth/userinfo.email'),'Session.getActiveUser().getEmail requires explicit email scope');
assert.ok(!manifest.oauthScopes.includes('https://www.googleapis.com/auth/script.external_request'));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'agenda-unified-'));
try{const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert.ok(scripts.length>=4);scripts.forEach((script,i)=>{const f=path.join(tmp,i+'.js');fs.writeFileSync(f,script);execFileSync(process.execPath,['--check',f],{stdio:'pipe'});});}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log('Agenda unified Apps Script GET/UI + POST/Pages + google.script.run + single manifest PASS');
