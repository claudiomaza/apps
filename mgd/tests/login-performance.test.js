'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '../../mgd/app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const start = app.indexOf('async function authenticate(){');
const end = app.indexOf('async function loadRemote(', start);
const authenticate = app.slice(start, end);
assert.match(authenticate,/includeInitialList:true[\s\S]*stageOwner=await stageOwnerKey\(currentUsername\);sessionStorage\.setItem\('gradesSession',sessionToken\);await restoreStage\(\);[\s\S]*await loadRemote\(0,/,'use auth response as first page, restoring drafts before finishing');
assert.equal((authenticate.match(/await loadRemote\(/g) || []).length,1,'authentication avoids a second initial read');
assert.match(app.slice(end, app.indexOf('\nfunction inputField', end)), /for\(const r of stagedRecords\.values\(\)\)/, 'remote load merges staged drafts into the loaded snapshot');
assert.match(html, /app\.js\?v=20261113-mgd4/, 'fresh app cache key');
console.log('Single-read login and staged-draft merge contract PASS');

assert.match(authenticate,/includeInitialList:true/,'authentication asks the backend to include the initial page');assert.doesNotMatch(authenticate,/await loadRemote\(\)/,'avoid a second first-read request after combined authentication');assert.match(authenticate,/app-loading[\s\S]*hidden=false[\s\S]*hidden=true/,'show app loading state while initial data is prepared');
