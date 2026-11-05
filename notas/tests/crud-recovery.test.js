'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
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
assert.match(app,/Fecha de nota o recuperación/);
assert.match(app,/Ausente/);
assert.match(app,/gradeKey\(data.studentId,data.assessmentId\)/);
assert.match(app,/data-grade=\"gradeDate\"/);
assert.match(app,/status==='graded'/);
assert.match(app,/data-save-grade/);
assert.match(app,/gradeDate=String\(values.gradeDate/);
assert.match(app,/status==='absent'/);
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
 ['grade::u::a','grade','u::a','{"studentId":"u","assessmentId":"a","status":"absent","value":"","gradeDate":"2026-11-05","observation":""}',1,'ACTIVE','t','t']
];
const props=new Map([['DATA_VERSION','7']]);
const sheetRows=[['recordId','type','entityId','dataJson','version','status','updatedAt','createdAt'],...rows.map(x=>x.slice())];
const sheet={getLastRow:()=>sheetRows.length,getDataRange(){return{getDisplayValues:()=>[sheetRows[0].map(String)]}},getRange(r,c,n=1,m=1){return{getValues(){return sheetRows.slice(r-1,r-1+n).map(x=>x.slice(c-1,c-1+m));},getDisplayValues(){return this.getValues().map(row=>row.map(String));},setValues(vals){vals.forEach((v,i)=>{sheetRows[r-1+i].splice(c-1,m,...v);});}};}};
const context={console,Date,JSON,Math,Number,String,Array,Object,Set,Map,Error,RegExp,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},SpreadsheetApp:{openById:()=>({getSheetByName:(name)=>name==='Config'?{getDataRange:()=>({getDisplayValues:()=>[['key','value']]})}:sheet}),flush:()=>{}},Utilities:{},};
vm.runInNewContext(backend+'\n;globalThis.__test={changeRecordStatus_,listTrash_,hasActiveDependents_,hasMissingParents_};',context);
const api=context.__test;
assert.throws(()=>api.changeRecordStatus_({recordId:'assessment::a',expectedVersion:1},true),e=>e.message==='RECORD_HAS_DEPENDENTS');
assert.throws(()=>api.changeRecordStatus_({recordId:'division::d',expectedVersion:1},true),e=>e.message==='RECORD_HAS_DEPENDENTS');
const deleted=api.changeRecordStatus_({recordId:'grade::u::a',expectedVersion:1},true);
assert.equal(deleted.record.status,'DELETED');
assert.equal(deleted.record.version,2);
assert.equal(sheetRows[10][5],'DELETED');
assert.equal(api.listTrash_({}).records.length,1);
const gradeJson=JSON.parse(sheetRows[10][3]);
assert.equal(gradeJson.status,'absent');
assert.throws(()=>api.changeRecordStatus_({recordId:'grade::u::a',expectedVersion:1},false),e=>e.message==='DATA_CONFLICT');
const restored=api.changeRecordStatus_({recordId:'grade::u::a',expectedVersion:2},false);
assert.equal(restored.record.status,'ACTIVE');
assert.equal(restored.record.version,3);
assert.equal(api.listTrash_({}).records.length,0);
// Simulate a normal optimistic save after recovery: same stable grade ID, new value/date.
gradeJson.status='graded';gradeJson.value='8';gradeJson.gradeDate='2026-11-12';
sheetRows[10][3]=JSON.stringify(gradeJson);sheetRows[10][4]=4;
assert.equal(JSON.parse(sheetRows[10][3]).gradeDate,'2026-11-12');
assert.equal(JSON.parse(sheetRows[10][3]).value,'8');
const recovered=api.changeRecordStatus_({recordId:'grade::u::a',expectedVersion:4},true);
assert.equal(recovered.record.data.gradeDate,'2026-11-12');
assert.equal(recovered.record.data.value,'8');
assert.equal(recovered.record.data.status,'graded');
assert.equal(recovered.record.version,5);
assert.equal(api.listTrash_({}).records.length,1);
assert.throws(()=>api.changeRecordStatus_({recordId:'no::such',expectedVersion:1},true),e=>e.message==='RECORD_NOT_FOUND');
console.log('CRUD UI contract + soft-delete, restore, dependencies, optimistic version tests PASS');
