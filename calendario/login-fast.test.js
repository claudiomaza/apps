'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync(__dirname+'/app.js','utf8'),backend=fs.readFileSync(__dirname+'/apps-script/Code.gs','utf8');
const auth=backend.match(/if\(body\.action==='auth'\)[^\n]*/)?.[0]||'';
assert.match(auth,/return json_\(authenticate_\(/);assert.doesNotMatch(auth,/listEvents_|listGroups_|CalendarApp|SpreadsheetApp/);
const client=app.match(/async function authenticate\(\)[\s\S]*?\nfunction /)?.[0]||app.slice(app.indexOf('async function authenticate()'),app.indexOf('\nfunction ',app.indexOf('async function authenticate()')));
assert.match(client,/api\('auth',\{user:[^}]+pass:[^}]+\},30000\)/);assert.doesNotMatch(client,/includeInitialList/);assert.match(app,/async function initializeAfterLogin\(month\)/);assert.ok(client.indexOf("$('#login-panel').hidden=true")<client.indexOf('initializeAfterLogin(month)'),'show authenticated app state before the separate event load');
console.log('Login fast-path contract PASS: auth verifies credentials only; calendar initialization is separate');
