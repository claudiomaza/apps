'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
assert.match(app,/script\.src='\.\/vendor\/xlsx\.full\.min\.js'/);
assert.equal(new URL('./vendor/xlsx.full.min.js','https://claudiomaza.github.io/apps/calendario/').pathname,'/apps/calendario/vendor/xlsx.full.min.js');
console.log('Calendar Excel component URL resolves within /calendario/ PASS');
