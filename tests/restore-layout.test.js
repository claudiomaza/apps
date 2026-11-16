'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const notes = path.join(__dirname,'..');
const html = fs.readFileSync(path.join(notes,'index.html'),'utf8');
for (const name of ['config.js','gradebook.js','summary.js','stage-store.js','xlsx-lazy.js','app.js']) {
  assert(html.includes(`src="./${name}?`), `${name} uses its local URL`);
  assert(fs.statSync(path.join(notes,name)).isFile(), `${name} exists in mgd/`);
}
for (const name of ['manifest.json','vendor/xlsx.full.min.js','apps-script/Code.gs'])
  assert(fs.statSync(path.join(notes,name)).isFile(),`${name} exists in mgd/`);
assert.match(fs.readFileSync(path.join(notes,'xlsx-lazy.js'),'utf8'), /s\.src='\.\/vendor\/xlsx\.full\.min\.js'/, 'Excel bundle resolves within mgd/');
const rootHtml=fs.readFileSync(path.join(notes,'..','index.html'),'utf8');
assert(rootHtml.includes('href="./mgd/"') && rootHtml.includes('href="./agenda/"'), 'root landing links both apps');
console.log('Root landing, MGD scripts, backend and vendor layout PASS');
