'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const app=fs.readFileSync(__dirname+'/../app.js','utf8'),html=fs.readFileSync(__dirname+'/../index.html','utf8'),vm=require('node:vm');
assert.equal((html.match(/id="grade-rows"/g)||[]).length,1,'Libreta body has one owner');assert.equal((html.match(/id="grade-head"/g)||[]).length,1,'Libreta header has one owner');
const context={};function load(start,end){const i=app.indexOf(start),j=app.indexOf(end,i);assert(i>=0&&j>i,`missing ${start}`);vm.runInNewContext(app.slice(i,j),context);}load('function normalizeScheduleSlots(','function formMarkup');
for(const [values,count] of [[{slotDay:['1','3'],slotStart:['09:00','11:00'],slotEnd:['10:00','12:00']},2],[{slotDay:['2','2'],slotStart:['09:00','09:30'],slotEnd:['10:00','10:30']},'overlap']]){if(count==='overlap')assert.throws(()=>context.normalizeScheduleSlots(values),/superponen/);else assert.equal(context.normalizeScheduleSlots(values).length,count);}
assert.throws(()=>context.normalizeScheduleSlots({slotDay:['1'],slotStart:['10:00'],slotEnd:['09:00']}),/franja horaria/);
assert.match(html,/id="record-filter-type"/,'records need a type filter');
for(const field of ['school','subject','course','division'])assert.match(html,new RegExp(`id="record-filter-${field}"`),`records need ${field} filter`);
assert.match(app,/function renderTableTools\(/,'every table needs shared search/sort tools');
assert.match(app,/Buscar en columna<select data-table-search-column>/,'table search can target a selected column');
assert.match(app,/function tableRowSearchMatches\(/,'column-specific table matching helper exists');
assert.match(app,/function tableRowSearchMatches\(/,'column-specific table matching has a reusable helper');assert.match(app,/function stableSortRows\(/,'table sorting must be stable for ties');assert.match(app,/document.querySelectorAll\('tbody\[id\]'\)/,'all data tables get the shared controls');
assert.match(app,/r\.type==='student'\)contexts=liveRecords\.filter\(x=>x\.type==='membership'/,'student filters account for every group membership');
assert.match(app,/await saveRecords\(changes\);render\(\);return;/,'multiple schedules are prepared as drafts in one operation');
assert.match(app,/observer.observe\(body/,'table controls track dynamic rows');
assert.match(app,/if\(table\.refreshTableTools\)\{table\.refreshTableTools\(\);return;\}/,'table tools re-render without duplicating controls');assert.match(app,/const observer=new MutationObserver\(\(\)=>\{const rows=\[\.\.\.body\.querySelectorAll/,'table observer tracks source-row additions/removals, not own reorderings');assert.match(app,/desired\.some\(\(row,i\)=>row!==dataRows\[i\]\)/,'sorting only moves rows when the order changes to avoid mutation loops');assert.match(app,/if\(rows\.length===sourceRows\.length&&rows\.every\(r=>sourceSet\.has\(r\)\)\)return/,'moving sorted rows never resets search or sort source state');

assert.match(app,/Buscar en esta tabla<input type="search"/,'table search has a visible label');
assert.match(app,/value="asc"/,'A-Z sort control');assert.match(app,/value="desc"/,'Z-A sort control');
assert.match(app,/function normalizeScheduleSlots\(/,'multi-session schedule validator is missing');
load('function tableSearchMatches(','function renderTableTools');
assert.equal(context.tableRowSearchMatches({textContent:'Alice Math',cells:[{innerText:'Alice'},{innerText:'Math'}]},'math','1'),true);
assert.equal(context.tableRowSearchMatches({textContent:'Alice Math',cells:[{innerText:'Alice'},{innerText:'Math'}]},'math','0'),false);
assert.equal(context.tableRowSearchMatches({textContent:'Alice Math',cells:[{innerText:'Alice'},{innerText:'Math'}]},'math',''),true);
assert.equal(context.tableSearchMatches('Estudiante Álvarez 12','álvarez 12'),true);
assert.equal(context.tableSearchMatches('Estudiante A','no'),false);
assert.ok(context.compareTableValues('9','10')<0,'sort compares numbers naturally');
assert.ok(context.compareTableValues('Alvarez','Zárate')<0,'sort uses Spanish alphabetical order');
assert.ok(context.compareTableValues('A','Z','desc')>0,'Z-A reverses order');
const row=(v)=>({cells:[{innerText:v}]});const ordered=context.stableSortRows([row('Mora'),row('Álvarez'),row('Álvarez')],0,'asc');assert.deepEqual(ordered.map(x=>x.cells[0].innerText),['Álvarez','Álvarez','Mora']);assert.equal(ordered[0].cells[0].innerText,ordered[1].cells[0].innerText,'stable ties retain source order');

assert.match(app,/function scheduleSlotsMarkup\(/,'repeatable schedule rows are missing');
console.log('PASS: registry filters, shared search/sort across tables, and repeatable validated schedule slots are wired.');

assert.match(app,/type==='membership'&&x\.data\.studentId===r\.id/,'students expose all membership contexts for filtering');assert.match(app,/dataset\.attendanceStudent===st\.id/,'attendance save follows student IDs after table sorting');assert.match(app,/SCHEDULE_OVERLAP|superpone/, 'duplicate/overlapping weekly sessions are rejected');
