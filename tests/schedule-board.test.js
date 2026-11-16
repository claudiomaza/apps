'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const records=[
 {type:'schedule',id:'s-mon',data:{dayOfWeek:1,startTime:'09:00',endTime:'10:00',schoolId:'sc',subjectId:'ma',courseId:'c1',divisionId:'d1',teacherId:'D1'}},
 {type:'schedule',id:'s-tue',data:{dayOfWeek:2,startTime:'09:00',endTime:'10:00',schoolId:'sc',subjectId:'hi',courseId:'c1',divisionId:'d1',teacherId:'D1'}},
 {type:'subject',id:'ma',data:{name:'Matemática'}},{type:'subject',id:'hi',data:{name:'Historia'}},
 {type:'course',id:'c1',data:{name:'2.º'}},{type:'division',id:'d1',data:{name:'A'}}
];
const elements=new Map();function $(s){if(!elements.has(s))elements.set(s,{innerHTML:'',value:'',dataset:{}});return elements.get(s);}
const ctx={records,live:t=>records.filter(r=>r.type===t),teachers:[{teacherId:'D1',name:'Docente Uno'}],esc:x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),$};
const start=source.indexOf('function renderScheduleBoard(){'),end=source.indexOf('\nfunction renderAdmin',start);assert(start>=0&&end>start,'schedule-board renderer found');vm.runInNewContext(source.slice(start,end)+';globalThis.__renderScheduleBoard=renderScheduleBoard;',ctx);ctx.__renderScheduleBoard();
assert.match($('#schedule-board-head').innerHTML,/Lunes[\s\S]*Martes[\s\S]*Miércoles[\s\S]*Viernes/);
assert.match($('#schedule-board-body').innerHTML,/Matemática[\s\S]*2\.º · A[\s\S]*Docente Uno/);
assert.match($('#schedule-board-body').innerHTML,/Historia/);
assert.equal((($('#schedule-board-body').innerHTML.match(/<tr>/g)||[]).length),1,'same time slot renders once and cells carry different weekday lessons');
console.log('Schedule board renderer PASS: weekday columns, time rows, lesson/group and teacher attribution.');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
assert.match(html,/id="schedule-board-head"[\s\S]*id="schedule-board-body"/,'Registry exposes the weekly board');
assert.match(html,/id="teacher-proposal-dialog"[\s\S]*id="teacher-proposal-rows"/,'teacher proposal can be reviewed as a complete schedule table');
assert.match(html,/id="propose-teacher-assignments" data-admin-only/,'only admins can open teacher proposal generator');
assert.match(html,/id="apply-teacher-proposal"/,'proposal has a separate prepare action');assert.match(html,/id="cancel-teacher-proposal"/,'proposal has a separate cancel action');
assert.match(html,/id="export-schedules"/,'Admin can export teacher schedules');
assert.match(html,/id="availability-teacher"[\s\S]*id="availability-start"[\s\S]*id="availability-end"/,'Admin can capture teacher unavailability');
console.log('Schedule board UI and teacher availability controls present.');
