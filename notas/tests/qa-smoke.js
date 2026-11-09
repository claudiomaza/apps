'use strict';
const assert=require('node:assert/strict');
const html=awaitless();
function awaitless(){return require('node:fs').readFileSync('notas/index.html','utf8')}
const css=require('node:fs').readFileSync('notas/styles.css','utf8');
assert.match(html,/<form id="login-form">/);
for(const p of ['config','gradebook','summary','stage-store','xlsx-lazy','app'])assert.match(html,new RegExp(`src="\\./${p}\\.js\\?`),`${p} path`);
assert.match(css,/@media\(max-width:560px\)/);
for(const pattern of [/\.dropdown-menu\{[^}]*position:fixed/,/\.users-layout\{[^}]*grid-template-columns/,/\.teacher-form\{[^}]*display:grid/])assert.match(css,pattern);
console.log('Notes route assets/login/mobile CSS static smoke PASS');
