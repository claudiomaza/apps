'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync(__dirname+'/styles.css','utf8');
assert.match(css,/\.toolbar>\.calendar-actions\{grid-column:1\/-1;justify-self:start;max-width:100%\}/,'mobile actions menu must occupy a full-width row, stay left-aligned, and fit its container');
assert.match(css,/\.toolbar>\.calendar-actions \.action-menu-panel\{left:0;right:auto;min-width:0;width:min\(260px,calc\(100vw - 28px\)\)\}/,'mobile actions panel must stay within narrow viewports');
const row=css.indexOf('.toolbar>.calendar-actions{'),panel=css.indexOf('.toolbar>.calendar-actions .action-menu-panel{');
assert.ok(row>css.lastIndexOf('@media(max-width:650px)',row),'mobile menu row rule must be inside the mobile breakpoint');
assert.ok(panel>css.lastIndexOf('@media(max-width:650px)',panel),'mobile menu panel rule must be inside the mobile breakpoint');
console.log('Mobile calendar actions layout contract PASS');
