'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

const G=require('../gradebook.js');
const attId='stu::2026-11-12::sch::sub::course::div';
assert.throws(()=>G.validateRecord({type:'grade',id:'stu::ass',recordId:'grade::stu::ass',data:{studentId:'stu',assessmentId:'ass',status:'graded',attendanceId:''}}),/GRADE_REQUIRES_PRESENT_ATTENDANCE/);
assert.equal(G.validateRecord({type:'grade',id:'stu::ass',recordId:'grade::stu::ass',data:{studentId:'stu',assessmentId:'ass',status:'graded',attendanceId:attId}}).data.attendanceId,attId);
assert.throws(()=>G.validateRecord({type:'attendance',id:'wrong',recordId:'attendance::wrong',data:{studentId:'',date:'2026-11-12',schoolId:'sch',subjectId:'sub',courseId:'course',divisionId:'div',status:'present'}}),/INVALID_ATTENDANCE/);

const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const backend=fs.readFileSync(path.join(root,'gas/GradebookBackend.gs'),'utf8');
assert.match(html,/data-tab="admin"/);
assert.match(html,/id="admin-records"/);
assert.match(html,/id="trash-records"/);
assert.match(app,/trashRecord/);
assert.match(app,/restoreRecord/);
assert.match(app,/listTrash/);
assert.match(app,/data-delete-record/);
assert.match(app,/data-restore-record/);
assert.match(app,/Fecha en que estuvo presente/);
assert.match(app,/Ausente/);
assert.match(app,/gradeKey\(data.studentId,data.assessmentId\)/);
assert.match(app,/data-grade=\"attendanceId\"/);
assert.match(app,/status==='graded'/);
assert.match(app,/data-save-grade/);
assert.match(app,/gradeDate=att\?\.data\.date/);
assert.match(app,/status==='absent'/);
assert.match(html,/data-tab="attendance"/);
assert.match(html,/attendance-date/);
assert.match(app,/presentAttendances/);

assert.match(backend,/DUPLICATE_ATTENDANCE/);
assert.match(app,/attendanceForDate/);
assert.match(app,/data\._recordId/);
assert.match(app,/status==='present'/);
assert.doesNotMatch(app,/data-grade=\"gradeDate\"/);
assert.match(app,/attendanceId/);
assert.match(backend,/GRADE_REQUIRES_PRESENT_ATTENDANCE/);
assert.match(backend,/ATTENDANCE_HAS_GRADED_RECORD/);
assert.match(backend,/validateGradeAttendance_/);
const rows=[
 ['school::s','school','s','{"name":"S"}',1,'ACTIVE','t','t'],
 ['subject::m','subject','m','{"name":"M"}',1,'ACTIVE','t','t'],
 ['course::c','course','c','{"name":"C"}',1,'ACTIVE','t','t'],
 ['division::d','division','d','{"name":"D"}',1,'ACTIVE','t','t'],
 ['subgroup::sg','subgroup','sg','{"name":"SG","divisionId":"d"}',1,'ACTIVE','t','t'],
 ['cutoff::o','cutoff','o','{"name":"O"}',1,'ACTIVE','t','t'],
 ['scale::x','scale','x','{"name":"X","min":1,"max":10,"mode":"numeric","intervals":[]}',1,'ACTIVE','t','t'],
 ['student::u','student','u','{"studentId":"QA-1","fullName":"Demo"}',1,'ACTIVE','t','t'],
 ['assessment::a','assessment','a','{"name":"A","schoolId":"s","subjectId":"m","courseId":"c","divisionId":"d","cutoffId":"o","scaleId":"x","weight":100,"weightLocked":true}',1,'ACTIVE','t','t'],
 ['attendance::u::2026-11-05::s::m::c::d','attendance','u::2026-11-05::s::m::c::d','{"studentId":"u","date":"2026-11-05","schoolId":"s","subjectId":"m","courseId":"c","divisionId":"d","status":"present"}',1,'ACTIVE','t','t'],
 ['grade::u::a','grade','u::a','{"studentId":"u","assessmentId":"a","status":"absent","value":"","gradeDate":"2026-11-05","attendanceId":"u::2026-11-05::s::m::c::d","observation":""}',1,'ACTIVE','t','t']
];
const props=new Map([['DATA_VERSION','7']]);
const sheetRows=[['recordId','type','entityId','dataJson','version','status','updatedAt','createdAt'],...rows.map(x=>x.slice())];
const sheet={getLastRow:()=>sheetRows.length,getDataRange(){return{getDisplayValues:()=>[sheetRows[0].map(String)]}},getRange(r,c,n=1,m=1){return{getValues(){return sheetRows.slice(r-1,r-1+n).map(x=>x.slice(c-1,c-1+m));},getDisplayValues(){return this.getValues().map(row=>row.map(String));},setValues(vals){vals.forEach((v,i)=>{sheetRows[r-1+i].splice(c-1,m,...v);});}};}};
const context={console,Date,JSON,Math,Number,String,Array,Object,Set,Map,Error,RegExp,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},SpreadsheetApp:{openById:()=>({getSheetByName:(name)=>name==='Config'?{getDataRange:()=>({getDisplayValues:()=>[['key','value']]})}:sheet}),flush:()=>{}},Utilities:{},};
vm.runInNewContext(backend+'\n;globalThis.__test={changeRecordStatus_,listTrash_,hasActiveDependents_,hasMissingParents_,validateGradeAttendance_};',context);
const api=context.__test;
const assessmentData=JSON.parse(rows.find(x=>x[1]==='assessment')[3]),attendanceData=JSON.parse(rows.find(x=>x[1]==='attendance')[3]);
assert.equal(api.validateGradeAttendance_({studentId:'u',assessmentId:'a',attendanceId:'u::2026-11-05::s::m::c::d',gradeDate:'2026-11-05'},rows.slice(1),[]),true);
assert.throws(()=>api.validateGradeAttendance_({studentId:'u',assessmentId:'a',attendanceId:'u::2026-11-05::s::m::c::d',gradeDate:'2026-11-12'},rows.slice(1),[]),e=>e.message==='GRADE_REQUIRES_PRESENT_ATTENDANCE');
const absentRows=rows.slice(1).map(r=>r.slice());const attendanceRow=absentRows.find(r=>r[1]==='attendance');attendanceData.status='absent';attendanceRow[3]=JSON.stringify(attendanceData);
assert.throws(()=>api.validateGradeAttendance_({studentId:'u',assessmentId:'a',attendanceId:attendanceRow[2],gradeDate:'2026-11-05'},absentRows,[]),e=>e.message==='GRADE_REQUIRES_PRESENT_ATTENDANCE');
assert.throws(()=>api.changeRecordStatus_({recordId:'assessment::a',expectedVersion:1},true),e=>e.message==='RECORD_HAS_DEPENDENTS');
assert.throws(()=>api.changeRecordStatus_({recordId:'attendance::u::2026-11-05::s::m::c::d',expectedVersion:1},true),e=>e.message==='RECORD_HAS_DEPENDENTS');
assert.throws(()=>api.changeRecordStatus_({recordId:'student::u',expectedVersion:1},true),e=>e.message==='RECORD_HAS_DEPENDENTS');
assert.throws(()=>api.changeRecordStatus_({recordId:'division::d',expectedVersion:1},true),e=>e.message==='RECORD_HAS_DEPENDENTS');
const noMembershipRows=rows.slice(1).filter(r=>r[1]!=='membership');
assert.equal(api.hasMissingParents_({type:'attendance',data:{studentId:'u',schoolId:'s',subjectId:'m',courseId:'c',divisionId:'d'}},noMembershipRows),true);
const deleted=api.changeRecordStatus_({recordId:'grade::u::a',expectedVersion:1},true);
assert.equal(deleted.record.status,'DELETED');
assert.equal(deleted.record.version,2);
assert.equal(sheetRows[11][5],'DELETED');
assert.equal(api.listTrash_({}).records.length,1);
const gradeJson=JSON.parse(sheetRows[11][3]);
assert.equal(gradeJson.status,'absent');
assert.throws(()=>api.changeRecordStatus_({recordId:'grade::u::a',expectedVersion:1},false),e=>e.message==='DATA_CONFLICT');
const restored=api.changeRecordStatus_({recordId:'grade::u::a',expectedVersion:2},false);
assert.equal(restored.record.status,'ACTIVE');
assert.equal(restored.record.version,3);
assert.equal(api.listTrash_({}).records.length,0);
// Simulate a normal optimistic save after recovery: same stable grade ID, new value/date.
gradeJson.status='graded';gradeJson.value='8';gradeJson.gradeDate='2026-11-12';
sheetRows[11][3]=JSON.stringify(gradeJson);sheetRows[11][4]=4;
assert.equal(JSON.parse(sheetRows[11][3]).gradeDate,'2026-11-12');
assert.equal(JSON.parse(sheetRows[11][3]).value,'8');
const recovered=api.changeRecordStatus_({recordId:'grade::u::a',expectedVersion:4},true);
assert.equal(recovered.record.data.gradeDate,'2026-11-12');
assert.equal(recovered.record.data.value,'8');
assert.equal(recovered.record.data.status,'graded');
assert.equal(recovered.record.version,5);
assert.equal(api.listTrash_({}).records.length,1);
assert.throws(()=>api.changeRecordStatus_({recordId:'no::such',expectedVersion:1},true),e=>e.message==='RECORD_NOT_FOUND');
console.log('Attendance-derived grade date + CRUD recovery, dependencies, optimistic version tests PASS');
