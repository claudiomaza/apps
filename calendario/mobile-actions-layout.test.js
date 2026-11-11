'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync(__dirname+'/styles.css','utf8');
assert.match(css,/\.calendar-action-row\{display:grid;grid-template-columns:auto auto minmax\(0,1fr\);gap:8px\}/,'mobile Today/Actions/view controls must share one compact row');
assert.match(css,/\.calendar-action-row \.view-switch\{grid-column:3;grid-row:1;justify-content:flex-end;min-width:0\}/,'mobile calendar/table buttons must stay on the controls row');
assert.match(css,/\.calendar-action-row \.calendar-actions \.action-menu-panel\{left:0;right:auto;min-width:0;width:min\(260px,calc\(100vw - 28px\)\)\}/,'mobile actions panel must stay within narrow viewports');
const row=css.indexOf('.calendar-action-row{display:grid;'),bp=css.lastIndexOf('@media(max-width:650px)',row);
assert.ok(row>bp,'mobile row rule must be inside mobile breakpoint');
console.log('Mobile calendar controls row layout contract PASS');
