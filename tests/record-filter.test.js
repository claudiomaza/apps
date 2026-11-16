'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync(__dirname+'/../app.js','utf8');
const start=app.indexOf('function renderAdmin(){'),end=app.indexOf('\nfunction ',start);assert(start>=0&&end>start);
const rows=[
 {recordId:'school::s1',type:'school',id:'s1',data:{name:'Escuela A'}}, {recordId:'school::s2',type:'school',id:'s2',data:{name:'Escuela B'}},
 {recordId:'subject::m1',type:'subject',id:'m1',data:{name:'Matemática'}}, {recordId:'subject::m2',type:'subject',id:'m2',data:{name:'Historia'}},
 {recordId:'course::c1',type:'course',id:'c1',data:{name:'1°'}}, {recordId:'division::d1',type:'division',id:'d1',data:{name:'A'}},
 {recordId:'student::st',type:'student',id:'st',data:{studentId:'123',fullName:'Ada'}},
 {recordId:'membership::one',type:'membership',id:'one',data:{studentId:'st',schoolId:'s1',subjectId:'m1',courseId:'c1',divisionId:'d1'}},
 {recordId:'membership::two',type:'membership',id:'two',data:{studentId:'st',schoolId:'s2',subjectId:'m2',courseId:'c1',divisionId:'d1'}},
 {recordId:'schedule::sch',type:'schedule',id:'sch',data:{schoolId:'s1',subjectId:'m1',courseId:'c1',divisionId:'d1',dayOfWeek:1,startTime:'09:00',endTime:'10:00'}}
];
const selects={};for(const key of ['type','school','subject','course','division'])selects['#record-filter-'+key]={_value:'',innerHTML:'',options:[],set value(v){this._value=String(v);},get value(){return this._value;},set innerHTML(v){this._html=v;this.options=[...v.matchAll(/<option value="([^\"]*)"/g)].map(x=>x[1]);if(!this.options.includes(this._value))this._value=this.options[0]||'';},get innerHTML(){return this._html||'';}};
const el={};for(const id of ['#refresh-trash','#trash-records','#admin-records'])el[id]={innerHTML:'',hidden:false};
const ctx={records:rows,trashRecords:[],currentRole:'admin',LABELS:{school:'Escuela',subject:'Materia',course:'Curso',division:'División',student:'Estudiante',membership:'Pertenencia',schedule:'Horario'},live:t=>rows.filter(r=>r.type===t),getOne:(t,id)=>rows.find(r=>r.type===t&&r.id===id),esc:x=>String(x),$:(s)=>selects[s]||el[s]||{value:'',innerHTML:'',hidden:false},recordTitle:r=>r.data.name||r.data.fullName||r.id};
vm.runInNewContext(app.slice(start,end)+';globalThis.run=renderAdmin;',ctx);
selects['#record-filter-school'].value='s1';ctx.run();const html=el['#admin-records'].innerHTML;assert.match(html,/Escuela A · Escuela B/,'student displays both school memberships');assert.match(html,/Matemática · Historia/,'student displays both subjects');
selects['#record-filter-school'].value='s2';ctx.run();assert.match(el['#admin-records'].innerHTML,/data-edit-record="student::st"/,'school filter includes student with membership in school B');assert.match(el['#admin-records'].innerHTML,/data-edit-record="membership::two"/,'school filter includes the B membership');assert.doesNotMatch(el['#admin-records'].innerHTML,/data-edit-record="schedule::sch"/,'school filter excludes school A schedule');
selects['#record-filter-type'].value='schedule';ctx.run();assert.doesNotMatch(el['#admin-records'].innerHTML,/data-edit-record="student::st"/,'combined type+school filters intersect and hide the student');
selects['#record-filter-type'].value='';selects['#record-filter-school'].value='s1';selects['#record-filter-subject'].value='m2';ctx.run();assert.doesNotMatch(el['#admin-records'].innerHTML,/data-edit-record="student::st"/,'filters cannot mix school from one membership with subject from another');
selects['#record-filter-subject'].value='m1';ctx.run();assert.match(el['#admin-records'].innerHTML,/data-edit-record="student::st"/,'all filters matching same membership include student');
console.log('PASS: registry context filters combine correctly, including students in multiple groups.');
