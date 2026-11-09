'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
assert.match(app,/async function apiRequest\(/,'API helper must not collide with browser globals named api');
assert.doesNotMatch(app,/\bapi\(/,'all requests must call the renamed helper');
assert.match(app,/\$\('#login-form'\)\.addEventListener\('submit'/,'login form must install its submit handler');
console.log('Login helper global-name regression contract PASS');
