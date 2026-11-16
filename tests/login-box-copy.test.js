'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const panel=html.slice(html.indexOf('<section id="login-panel"'),html.indexOf('</section>',html.indexOf('<section id="login-panel"')));
assert.match(panel,/<h1>Tu aula<\/h1>[\s\S]*class="trama-tagline">en un solo lugar<\/p>/,'login box shows the requested two-line copy');
assert.doesNotMatch(panel,/TU ESPACIO ESCOLAR|<h1>MGD<\/h1>|Tu aula en un solo lugar/,'old login box identity is removed');
console.log('Login box copy PASS');
