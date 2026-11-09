'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const repo=path.resolve(__dirname,'../../..');
const notes=path.join(repo,'notas');
const html=fs.readFileSync(path.join(notes,'index.html'),'utf8');
const css=fs.readFileSync(path.join(notes,'styles.css'),'utf8');
const root=fs.readFileSync(path.join(repo,'index.html'),'utf8');
assert.match(root,/href="\.\/notas\/"/,'root Pages entry links to Notes subpath');
assert.match(root,/href="\.\/calendario\/"/,'root Pages entry links to Calendar subpath');
for(const app of ['notas','calendario'])assert.ok(fs.existsSync(path.join(repo,app,'index.html')),`Pages app directory exists: ${app}/`);
assert.match(html,/<form id="login-form">/);
for(const [,url] of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)(?:\?[^"]*)?"/g)){
 const asset=url.replace(/^\.\//,'');
 if(!asset.endsWith('/'))assert.ok(fs.existsSync(path.join(notes,asset)),`Pages route asset exists: notas/${asset}`);
}
assert.ok(fs.existsSync(path.join(notes,'vendor/xlsx.full.min.js')),'SheetJS vendor bundle is present under the Notes route');
assert.match(css,/@media\(max-width:560px\)/);
for(const pattern of [/\.dropdown-menu\{[^}]*position:fixed/,/\.users-layout\{[^}]*grid-template-columns/,/\.teacher-form\{[^}]*display:grid/])assert.match(css,pattern);
console.log('Notes Pages routes/assets/login/mobile CSS static smoke PASS');
