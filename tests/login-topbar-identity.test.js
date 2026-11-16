'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const topbar=html.slice(html.indexOf('<header class="topbar">'),html.indexOf('</header>'));
assert.match(topbar,/<span class="brand login-module-title">Módulo de Gestión Docente<\/span>/,'login bar shows only the module name');
assert.doesNotMatch(topbar,/>\s*MGD\s*</,'login bar has no MGD label');
assert.match(topbar,/id="connection"[^>]*>Iniciá sesión para conectar con Sheets</,'connection prompt remains');
console.log('Login top bar identity and Sheets prompt PASS');
