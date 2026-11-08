'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'app.js'),'utf8');
function extract(name,next){const start=source.indexOf(`function ${name}(`),end=source.indexOf(`\nfunction ${next}`,start);assert.notEqual(start,-1,`${name} exists`);assert.notEqual(end,-1,`${next} follows ${name}`);return source.slice(start,end).trimEnd();}
const grid={innerHTML:'',addEventListener(){}},events={innerHTML:''},title={textContent:''},list={innerHTML:''},closeButton={onclick:null},dialog={opened:false,showModal(){this.opened=true;}};
const context={state:{date:new Date(2026,10,1),events:[
  {eventId:'a',title:'Reunión',startAt:'2026-11-08T09:00:00-03:00',endAt:'2026-11-08T10:00:00-03:00'},
  {eventId:'b',title:'<Taller>',startAt:'2026-11-08T11:30:00-03:00',endAt:'2026-11-08T12:15:00-03:00'},
  ...Array.from({length:6},(_,i)=>({eventId:`extra-${i}`,title:`Extra ${i+1}`,startAt:`2026-11-08T${String(13+i).padStart(2,'0')}:00:00-03:00`,endAt:`2026-11-08T${String(14+i).padStart(2,'0')}:00:00-03:00`})),
  {eventId:'c',title:'Otro día',startAt:'2026-11-09T08:00:00-03:00',endAt:'2026-11-09T09:00:00-03:00'},
  {eventId:'d',title:'Eliminado',startAt:'2026-11-08T20:00:00-03:00',endAt:'2026-11-08T21:00:00-03:00',status:'DELETED'},
]},document:{querySelectorAll:()=>[]},weekStartsOn:()=>1,groupById:()=>null,$:(s)=>({'#month-label':{textContent:''},'#grid':grid,'#events':events,'#day-events-title':title,'#day-events-list':list,'#day-events-dialog':dialog,'#close-day-events':closeButton}[s]),isoDay:d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,escapeHtml:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),formatReminderDisplay:()=>'',formatRecurrence:()=> 'No se repite',Intl,Date,Map,String,Number,weekStartsOn:()=>1,groupById:()=>null};
vm.runInNewContext(`${extract('render','openDayEvents')}\n${extract('openDayEvents','escapeHtml')}`,context);
context.render();
assert.match(grid.innerHTML,/Ver 8 eventos del 8 de noviembre/,'day cell is keyboard-accessible with the event count');
assert.equal((grid.innerHTML.match(/class="day-dot color-/g)||[]).length,9,'all eight active events on Nov 8 and one on Nov 9 have a dot; deleted event excluded');
assert.equal((grid.innerHTML.match(/class="day-dot color-[0-5] /g)||[]).length,9,'all dots cycle through the palette');
assert.match(grid.innerHTML,/class="day-event-count">8</,'day count includes every active event, not only visible dots');
assert.equal((grid.innerHTML.match(/class="day-dot color-0 /g)||[]).length,3,'dot colors cycle for large event counts');
context.openDayEvents('2026-11-08');
assert.equal(dialog.opened,true,'selecting a day opens the native modal dialog');
assert.match(title.textContent,/8 de noviembre/,'dialog identifies the selected date');
const dayList=context.$('#day-events-list').innerHTML;
assert.match(dayList,/Reunión/);assert.match(dayList,/09:00/);assert.match(dayList,/10:00/);
assert.match(dayList,/&lt;Taller&gt;/,'event titles are HTML-escaped');assert.match(dayList,/11:30/);assert.match(dayList,/12:15/);
assert.doesNotMatch(dayList,/Otro día|Eliminado/,'dialog only contains active events for the selected day');
console.log('Calendar day grid tests PASS: all colored dots/count, accessible trigger, ordered day list, times, escaped titles, deleted events excluded');
