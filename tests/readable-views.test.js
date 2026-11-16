'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../apps-script/Code.gs'),'utf8');
const headers=['recordId','type','entityId','dataJson','version','status','updatedAt','createdAt'];
const now='2026-11-16T00:00:00.000Z';
class Sheet{
 constructor(name,values=[]){this.name=name;this.values=values.map(r=>[...r]);this.filter=null;this.frozen=0;}
 getLastRow(){return this.values.length;}
 getLastColumn(){return Math.max(0,...this.values.map(r=>r.length));}
 getRange(r,c,n=1,m=1){const s=this;return{
  getValues(){return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.values[r-1+i]?.[c-1+j]??''));},
  getDisplayValues(){return this.getValues().map(row=>row.map(v=>String(v??'')));},
  setValues(rows){for(let i=0;i<rows.length;i++){s.values[r-1+i]??=[];for(let j=0;j<rows[i].length;j++)s.values[r-1+i][c-1+j]=rows[i][j];}return this;},
  setValue(v){s.values[r-1]??=[];s.values[r-1][c-1]=v;return this;},
  setFontWeight(){return this;},setWrap(){return this;},createFilter(){s.filter={remove(){s.filter=null;}};return s.filter;}
 };}
 getDataRange(){return this.getRange(1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn()));}
 getFilter(){return this.filter;}
 clearContents(){this.values=[];return this;}
 setFrozenRows(n){this.frozen=n;}
}
class Book{
 constructor(sheets){this.sheets=sheets;}
 getSheetByName(n){return this.sheets.find(s=>s.name===n)||null;}
 insertSheet(n){const s=new Sheet(n);this.sheets.push(s);return s;}
}
const records=[
 ['school::s1','school','s1',JSON.stringify({name:'Escuela demo',code:'E1'}),2,'ACTIVE',now,now],
 ['course::c1','course','c1',JSON.stringify({schoolId:'s1',name:'Primero'}),1,'ACTIVE',now,now],
 ['division::d1','division','d1',JSON.stringify({schoolId:'s1',courseId:'c1',name:'A'}),1,'ACTIVE',now,now],
 ['student::st1','student','st1',JSON.stringify({studentId:'12345678',fullName:'Ada Ejemplo',email:'ada@example.test',newFutureField:'se conserva'}),1,'ACTIVE',now,now],
 ['membership::m1','membership','m1',JSON.stringify({studentId:'st1',schoolId:'s1',subjectId:'sb1',courseId:'c1',divisionId:'d1',cohortYear:'2026'}),1,'ACTIVE',now,now],
 ['grade::g1','grade','g1',JSON.stringify({studentId:'st1',assessmentId:'a1',value:9,status:'graded',gradeDate:'2026-11-15'}),1,'ACTIVE',now,now]
];
const users=[['usuario','pass','rol','alcances','mail','nombre','docenteId'],['admin','SECRET_ADMIN_PASS','admin','[]','admin@example.test','Administración',''],['profe','SECRET_TEACHER_PASS','docente','[{"schoolId":"s1","subjectId":"sb1","courseId":"c1","divisionId":"d1"}]','p@example.test','Profe Ejemplo','t1']];
const db=new Sheet('Registros',[headers,...records]);
const userSheet=new Sheet('Usuarios',users);
const book=new Book([db,userSheet,new Sheet('Config',[['key','value','description']]),new Sheet('Disponibilidad docente',[['availabilityId','teacherId','dayOfWeek','startTime','endTime','updatedAt','status']])]);
const context={console,Date,JSON,Math,Number,String,Array,Object,Set,Map,Error,RegExp,SpreadsheetApp:{openById:()=>book}};
vm.runInNewContext(source+'\n;globalThis.__viewTest={refreshReadableViews_,READABLE_VIEWS_};',context);
const {refreshReadableViews_,READABLE_VIEWS_}=context.__viewTest;
refreshReadableViews_();
for(const name of ['Escuelas','Cursos','Divisiones','Materias','Estudiantes','Pertenencias','Calificaciones','Docentes'])assert.ok(book.getSheetByName(name),`missing readable sheet ${name}`);
const students=book.getSheetByName('Estudiantes').values;
assert.equal(students[1][1],'st1');
assert.ok(students[0].includes('estudianteId'));
assert.ok(students[0].includes('newFutureField'),'unknown future entity fields must stay visible');
assert.equal(students[1][students[0].indexOf('newFutureField')],'se conserva');
const teacherView=book.getSheetByName('Docentes').values;
assert.deepEqual(teacherView[0],['teacherId','username','nombre','correo','alcances']);
assert.equal(teacherView.length,2,'only docente users, not admin, belong in Docentes view');
assert.equal(teacherView[1][0],'t1');
assert.equal(JSON.stringify(teacherView).includes('SECRET_'),false,'passwords must never appear in readable views');
assert.equal(book.getSheetByName('Calificaciones').values[1][book.getSheetByName('Calificaciones').values[0].indexOf('valor')],9);
records[0][3]=JSON.stringify({name:'Escuela actualizada'});db.values=[headers,...records];
refreshReadableViews_();
assert.equal(book.getSheetByName('Escuelas').values[1][book.getSheetByName('Escuelas').values[0].indexOf('nombre')],'Escuela actualizada');
assert.ok(book.getSheetByName('Estudiantes').filter,'readable table gets a filter');
const protectedSheet=book.getSheetByName('Escuelas');protectedSheet.values[0][1]='manual note';assert.throws(()=>refreshReadableViews_(),e=>String(e.message).startsWith('READABLE_VIEW_SCHEMA_MISMATCH:Escuelas'),'must fail closed before overwriting unrelated same-name sheets');
assert.match(source,/function onOpen\(\)[^\n]*addItem\('Actualizar tablas legibles','refreshReadableViewsFromMenu_'\)/);
assert.match(source,/function setupDatabase_\(\)[\s\S]*?refreshReadableViews_\(\)/);
assert.match(source,/function saveBatch_\([\s\S]*?refreshReadableViewsSafe_\(\)/);
assert.match(source,/function changeRecordStatus_\([\s\S]*?refreshReadableViewsSafe_\(\)/);
assert.match(source,/function saveTeacher_\([\s\S]*?refreshReadableViewsSafe_\(\)/);
console.log('Readable entity views, dynamic fields, password exclusion, refresh, schema-conflict safety, and hooks PASS');
