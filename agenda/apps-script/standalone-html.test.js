'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=__dirname,markdown=fs.readFileSync(path.join(dir,'Agenda.html.md'),'utf8'),guide=fs.readFileSync(path.join(dir,'PUBLICAR-SOLO-APPS-SCRIPT.md'),'utf8'),readme=fs.readFileSync(path.join(dir,'README.md'),'utf8');
const match=markdown.match(/```html\n([\s\S]*?)\n```/);assert.ok(match,'complete HTML code block exists');const html=match[1],scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.match(html,/window\.APP_CONFIG = Object\.freeze\(\{ API_URL: <\?!= JSON\.stringify\(apiUrl\) \?>/);
assert.match(html,/window\.AGENDA_APPS_SCRIPT_STANDALONE = true/);assert.equal(scripts.length,4);assert.match(html,/<style>[\s\S]*<\/style>/);assert.doesNotMatch(html,/<script\s+src=|<link\s+rel="stylesheet"|<link\s+rel="manifest"|(?:src|href)="\.\.?\//);assert.match(scripts[2],/atob\('/);assert.match(scripts[3],/window\.loadEmbeddedXlsx\(\)/);assert.match(scripts[3],/if\(!window\.AGENDA_APPS_SCRIPT_STANDALONE&&'serviceWorker'in navigator\)/);assert.match(scripts[3],/StageStore\.(?:replace|list)\('calendario'/);
assert.match(guide,/function doGet\(e\)/);assert.match(guide,/ScriptApp\.getService\(\)\.getUrl\(\)/);assert.match(guide,/El resto de `Code\.gs`, incluido `doPost\(e\)`, se mantiene/);assert.match(guide,/CORS/);assert.match(readme,/PUBLICAR-SOLO-APPS-SCRIPT\.md/);
fs.writeFileSync(path.join(dir,'standalone-index.check.html'),html);scripts.forEach((x,i)=>fs.writeFileSync(path.join(dir,`standalone-script-${i}.check.js`),x));
console.log('Agenda Apps Script standalone HTML and publication guide contract PASS');
