'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const backend=fs.readFileSync(require('node:path').join(__dirname,'../gas/GradebookBackend.gs'),'utf8');
const context={console,Date,JSON,Math,Number,String,Array,Object,Set,Map,Error,RegExp};
vm.runInNewContext(backend+'\n;globalThis.__authz={parseAccess_,scopeMatches_,recordVisible_,assertRecordWriteAllowed_,listRecords_,listTrash_,changeRecordStatus_,users_,CONFIG};',context);
const {parseAccess_,scopeMatches_,recordVisible_,assertRecordWriteAllowed_,listRecords_,listTrash_,changeRecordStatus_,users_,CONFIG}=context.__authz;
const a={schoolId:'s1',subjectId:'sub1',courseId:'c1',divisionId:'d1'}, b={schoolId:'s2',subjectId:'sub2',courseId:'c2',divisionId:'d2'};
const teacher={role:'docente',scopes:[a],profile:{mail:'a@example.test',name:'Docente A'}};
assert.deepEqual(JSON.parse(JSON.stringify(parseAccess_('admin',''))),{role:'admin',scopes:[]});
assert.equal(CONFIG.MAX_USERS,200);assert.equal(CONFIG.MAX_SCOPES,20);
context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[['usuario','pass','rol','alcances','mail','nombre'],['admin','not-a-real-password','admin','[]','admin@example.test','Administración'],['teacher-a','not-a-real-password','docente',JSON.stringify([a]),'a@example.test','Docente A'],['teacher-b','not-a-real-password','docente',JSON.stringify([b]),'b@example.test','Docente B']]})})})};
assert.deepEqual(Array.from(users_(),x=>x.username),['admin','teacher-a','teacher-b']);assert.equal(users_()[1].profile.mail,'a@example.test');assert.equal(users_()[1].profile.name,'Docente A');
context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[['usuario','pass','rol','alcances','mail','nombre'],['admin','not-a-real-password','admin','[{}]','admin@example.test','Admin']]})})})};
assert.throws(()=>users_(),e=>e.message==='USERS_SHEET_INVALID');
context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[['usuario','pass','rol','alcances','mail','nombre'],['admin','x','admin','[]','admin@example.test','Admin'],['bad-user','x','docente','[]','bad@example.test','Bad']]})})})};
assert.throws(()=>users_(),e=>e.message==='USERS_SHEET_INVALID');
const userHeaders=['usuario','pass','rol','alcances','mail','nombre'];context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[userHeaders,...Array.from({length:201},(_,i)=>['u'+i,'x','admin','[]','u'+i+'@example.test','Admin'])]})})})};assert.throws(()=>users_(),e=>e.message==='USERS_SHEET_INVALID');
context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[userHeaders,['admin','x','admin','[]','a@example.test','Admin'],['admin','x','admin','[]','a@example.test','Admin']]})})})};assert.throws(()=>users_(),e=>e.message==='USERS_SHEET_INVALID');
context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[userHeaders,['admin','x','admin','[]','a@example.test','Admin'],[' ',' ',' ',' ',' ',' ']]})})})};assert.equal(Array.from(users_()).length,1);assert.equal(users_()[0].profile.name,'Admin');
context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[['usuario','pass','rol','alcances'],['admin','x','admin','[]']]})})})};assert.throws(()=>users_(),e=>e.message==='USERS_SHEET_INVALID');
context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getDataRange:()=>({getDisplayValues:()=>[['usuario','pass','rol','alcances','mail','nombre'],['admin','x','admin','[]','','Admin']]})})})};assert.throws(()=>users_(),e=>e.message==='USERS_SHEET_INVALID');
assert.deepEqual(JSON.parse(JSON.stringify(parseAccess_('docente',JSON.stringify([a,b])))),{role:'docente',scopes:[a,b]});
for(const [role,scopes] of [['', '[]'],['docente','{}'],['docente','[{}]'],['admin','[{}]'],['root','[]'],['docente','bad'],['docente','[]'],['docente',JSON.stringify([{...a,other:'x'}])],[ 'docente',JSON.stringify([a,a]) ]]) assert.throws(()=>parseAccess_(role,scopes),e=>e.message==='USERS_SHEET_INVALID');
assert.throws(()=>parseAccess_('docente',JSON.stringify(Array.from({length:21},(_,i)=>({...a,divisionId:'d'+i})))),e=>e.message==='USERS_SHEET_INVALID');
assert.equal(scopeMatches_({...a,extra:'ignored'},teacher.scopes),true);
assert.equal(scopeMatches_(b,teacher.scopes),false);
const rows=[
 ['school::s1','school','s1',JSON.stringify({name:'School 1'}),1,'ACTIVE'],
 ['subject::sub1','subject','sub1',JSON.stringify({name:'Subject 1'}),1,'ACTIVE'],
 ['course::c1','course','c1',JSON.stringify({name:'Course 1'}),1,'ACTIVE'],
 ['division::d1','division','d1',JSON.stringify({name:'Division 1'}),1,'ACTIVE'],
 ['student::stu1','student','stu1',JSON.stringify({studentId:'stu1',fullName:'Student 1'}),1,'ACTIVE'],
 ['school::s2','school','s2',JSON.stringify({name:'School 2'}),1,'ACTIVE'],
 ['subject::sub2','subject','sub2',JSON.stringify({name:'Subject 2'}),1,'ACTIVE'],
 ['course::c2','course','c2',JSON.stringify({name:'Course 2'}),1,'ACTIVE'],
 ['division::d2','division','d2',JSON.stringify({name:'Division 2'}),1,'ACTIVE'],
 ['student::stu2','student','stu2',JSON.stringify({studentId:'stu2',fullName:'Student 2'}),1,'ACTIVE'],
 ['membership::m1','membership','m1',JSON.stringify({studentId:'stu1',...a}),1,'ACTIVE'],
 ['membership::m2','membership','m2',JSON.stringify({studentId:'stu2',...b}),1,'ACTIVE'],
 ['schedule::sch1','schedule','sch1',JSON.stringify(a),1,'ACTIVE'],
 ['schedule::sch2','schedule','sch2',JSON.stringify(b),1,'ACTIVE'],
 ['attendance::att1','attendance','att1',JSON.stringify({...a,studentId:'stu1'}),1,'ACTIVE'],
 ['attendance::att2','attendance','att2',JSON.stringify({...b,studentId:'stu2'}),1,'ACTIVE'],
 ['observation::ob1','observation','ob1',JSON.stringify(a),1,'ACTIVE'],
 ['topic::tp2','topic','tp2',JSON.stringify(b),1,'ACTIVE'],
 ['assessment::as1','assessment','as1',JSON.stringify({id:'as1',...a,scaleId:'sc1',cutoffId:'co1'}),1,'ACTIVE'],
 ['assessment::as2','assessment','as2',JSON.stringify({id:'as2',...b,scaleId:'sc2',cutoffId:'co2'}),1,'ACTIVE'],
 ['scale::sc1','scale','sc1','{}',1,'ACTIVE'], ['scale::sc2','scale','sc2','{}',1,'ACTIVE'],
 ['cutoff::co1','cutoff','co1','{}',1,'ACTIVE'], ['cutoff::co2','cutoff','co2','{}',1,'ACTIVE']
];
const rec=(type,id,data)=>({type,id,data});
const dataOf=(type,id)=>JSON.parse(rows.find(r=>r[1]===type&&r[2]===id)[3]);
assert.equal(recordVisible_(rec('assessment','as1',dataOf('assessment','as1')),rows,teacher),true);
assert.equal(recordVisible_(rec('assessment','as2',dataOf('assessment','as2')),rows,teacher),false);
assert.equal(recordVisible_(rec('student','stu1',{studentId:'stu1'}),rows,teacher),true);
assert.equal(recordVisible_(rec('student','stu2',{studentId:'stu2'}),rows,teacher),false);
assert.equal(recordVisible_(rec('grade','g1',{studentId:'stu1',assessmentId:'as1'}),rows,teacher),true);
assert.equal(recordVisible_(rec('grade','g2',{studentId:'stu2',assessmentId:'as2'}),rows,teacher),false);
assert.equal(recordVisible_(rec('scale','sc1',{}),rows,teacher),true);
assert.equal(recordVisible_(rec('scale','sc2',{}),rows,teacher),false);
assert.equal(recordVisible_(rec('school','s1',{}),rows,teacher),true);
assert.equal(recordVisible_(rec('school','s2',{}),rows,teacher),false);
assert.equal(recordVisible_(rec('membership','m1',dataOf('membership','m1')),rows,teacher),true);
assert.equal(recordVisible_(rec('membership','m2',dataOf('membership','m2')),rows,teacher),false);
assert.equal(recordVisible_(rec('schedule','sch1',a),rows,teacher),true);
assert.equal(recordVisible_(rec('attendance','att1',{...a,studentId:'stu1'}),rows,teacher),true);
assert.equal(recordVisible_(rec('attendance','att2',{...b,studentId:'stu2'}),rows,teacher),false);
assert.equal(recordVisible_(rec('observation','ob1',a),rows,teacher),true);
assert.equal(recordVisible_(rec('topic','tp2',b),rows,teacher),false);
assert.equal(recordVisible_(rec('student','stu2',{studentId:'stu2'}),rows,{role:'admin',scopes:[]}),true);
assert.throws(()=>recordVisible_(rec('student','stu2',{studentId:'stu2'}),rows,null),e=>e.message==='UNAUTHORIZED');
assert.throws(()=>recordVisible_(rec('student','stu2',{studentId:'stu2'}),rows,{role:'unknown',scopes:[]}),e=>e.message==='ACCESS_DENIED');
assertRecordWriteAllowed_({type:'grade',id:'g3',data:{studentId:'stu1',assessmentId:'as1',status:'pending'}},[{type:'grade',id:'g3',data:{studentId:'stu1',assessmentId:'as1',status:'pending'}}],rows,teacher);
assert.throws(()=>assertRecordWriteAllowed_({type:'grade',id:'g4',data:{studentId:'stu2',assessmentId:'as2',status:'pending'}},[],rows,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>assertRecordWriteAllowed_({type:'assessment',id:'as3',data:{...a,scaleId:'sc1',cutoffId:'co1'}},[],rows,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>assertRecordWriteAllowed_({type:'grade',id:'g3',data:{studentId:'stu1',assessmentId:'as1',status:'pending'}},[],rows,null),e=>e.message==='UNAUTHORIZED');
assert.throws(()=>assertRecordWriteAllowed_({type:'grade',id:'g3',data:{studentId:'stu1',assessmentId:'as1',status:'pending'}},[],rows,{role:'auditor',scopes:[]}),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>assertRecordWriteAllowed_({type:'school',id:'s3',data:{name:'Outside'}},[],rows,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>assertRecordWriteAllowed_({type:'student',id:'stu3',data:{studentId:'stu3'}},[{type:'membership',id:'m3',data:{studentId:'stu3',...a}}],rows,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>assertRecordWriteAllowed_({type:'membership',id:'m3',data:{studentId:'stu1',...a}},[],rows,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>assertRecordWriteAllowed_({type:'attendance',id:'att3',data:{studentId:'stu1',...b}},[],rows,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>assertRecordWriteAllowed_({type:'observation',id:'ob3',data:{studentId:'stu2',...a}},[],rows,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>assertRecordWriteAllowed_({type:'topic',id:'tp3',data:b},[],rows,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>changeRecordStatus_({recordId:'grade::g1',expectedVersion:1},true,teacher),e=>e.message==='ACCESS_DENIED');
assert.throws(()=>listTrash_({},teacher),e=>e.message==='ACCESS_DENIED');
assertRecordWriteAllowed_({type:'school',id:'s3',data:{name:'New'}},[],rows,{role:'admin',scopes:[]});
const fakeRows=[['recordId','type','id','dataJson','version','status','updatedAt','createdAt'],...rows];let pageRead=0;const fakeSheet={getLastRow:()=>fakeRows.length,getRange(r,c,n,m){return{getValues:()=>{pageRead++;return fakeRows.slice(r-1,r-1+n).map(x=>x.slice(c-1,c-1+m));},getDisplayValues:()=>[CONFIG.HEADERS]};}};context.PropertiesService={getScriptProperties:()=>({getProperty:k=>k==='DATA_VERSION'?'9':null})};context.SpreadsheetApp={openById:()=>({getSheetByName:name=>name==='Config'?{getDataRange:()=>({getDisplayValues:()=>[['key','value']]})}:fakeSheet})};const pageA=listRecords_({limit:300},{username:'teacherA',...teacher});const pageB=listRecords_({limit:300},{username:'teacherB',role:'docente',scopes:[b],profile:{mail:'b@example.test',name:'Docente B'}});assert.deepEqual(Array.from(pageA.records,r=>r.id).sort(),['as1','att1','c1','co1','d1','m1','ob1','s1','sc1','sch1','stu1','sub1']);assert.deepEqual(Array.from(pageB.records,r=>r.id).sort(),['as2','att2','c2','co2','d2','m2','s2','sc2','sch2','stu2','sub2','tp2']);assert.equal(pageA.records.some(r=>r.id==='as2'),false);assert.equal(pageB.records.some(r=>r.id==='as1'),false);assert.equal(pageA.username,'teacherA');assert.equal(pageB.username,'teacherB');assert.equal(pageA.profile.name,'Docente A');assert.equal(pageB.profile.mail,'b@example.test');assert.equal(pageRead,2);
console.log('Multi-user course-scope authorization and filtered pagination tests PASS');
