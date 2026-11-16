'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
for(const x of ['id="change-password-button"','id="password-dialog"','name="currentPassword"','name="newPassword"','name="confirmPassword"'])assert.ok(html.includes(x),x);
assert.match(html,/name="newPassword"[^>]*minlength="12"/);assert.match(app,/newPassword!==f\.elements\.confirmPassword\.value/);assert.match(app,/apiRequest\('changePassword'/);assert.match(app,/change-password-button'\)\.hidden=!sessionToken/);
console.log('Password change dialog, validation, authenticated request and session-only visibility PASS');
