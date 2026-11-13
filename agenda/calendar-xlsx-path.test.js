'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
assert.match(app,/script\.src='\.\/vendor\/xlsx\.full\.min\.js'/);
assert.equal(new URL('./vendor/xlsx.full.min.js','https://claudiomaza.github.io/apps/agenda/').pathname,'/apps/agenda/vendor/xlsx.full.min.js');
console.log('Agenda Excel component URL resolves within /agenda/ PASS');
