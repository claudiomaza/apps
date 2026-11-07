'use strict';
const assert=require('node:assert/strict');
const Summary=require('../summary.js');
const students=[
 {type:'student',id:'s1',data:{studentId:'001',fullName:'Alma',cohortYear:'2024'}},
 {type:'student',id:'s2',data:{studentId:'002',fullName:'Beto',cohortYear:'2025'}},
 {type:'student',id:'s3',data:{studentId:'003',fullName:'Cora'}},
];
const memberships=[
 {type:'membership',id:'m1',data:{studentId:'s1',schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1'}},
 {type:'membership',id:'m2',data:{studentId:'s1',schoolId:'b',subjectId:'hist',courseId:'c2',divisionId:'d2'}},
 {type:'membership',id:'m3',data:{studentId:'s2',schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1'}},
 {type:'membership',id:'m4',data:{studentId:'s3',schoolId:'a',subjectId:'hist',courseId:'c1',divisionId:'d1'}},
];
const all=[...students,...memberships,
 {type:'attendance',id:'at1',data:{studentId:'s1',schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1',date:'2026-04-10',status:'present'}},
 {type:'attendance',id:'at2',data:{studentId:'s2',schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1',date:'2026-04-11',status:'absent'}},
 {type:'attendance',id:'at3',data:{studentId:'s1',schoolId:'b',subjectId:'hist',courseId:'c2',divisionId:'d2',date:'2026-04-11',status:'present'}},
 {type:'topic',id:'t1',data:{schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1',date:'2026-04-10',topic:'Fractions'}},
 {type:'topic',id:'t2',data:{schoolId:'b',subjectId:'hist',courseId:'c2',divisionId:'d2',date:'2025-04-10',topic:'Ancient history'}},
 {type:'subject',id:'math',data:{name:'Matemática'}},{type:'subject',id:'hist',data:{name:'Historia'}},
];
const filter=(type,filters)=>Summary.filterRecords(all.filter(x=>x.type===type),all,filters);
assert.deepEqual(filter('student',{school:'a',subject:'math',course:'c1',division:'d1',cohort:'2024'}).map(x=>x.id),['s1'],'cohort and exact membership context intersect');
assert.deepEqual(filter('student',{school:'a',subject:'hist',course:'c1',division:'d1'}).map(x=>x.id),['s3'],'never combine school from one membership with subject from another');
assert.deepEqual(filter('attendance',{cycle:'2026',cohort:'2024'}).map(x=>x.id),['at1','at3'],'cycle is record year; cohort is student entry year across the student’s permitted memberships');
assert.deepEqual(filter('topic',{cycle:'2026',cohort:'2024'}).map(x=>x.id),['t1'],'group-only data is included when the context has a student from the selected cohort');
assert.deepEqual(filter('topic',{cycle:'2026',cohort:'2025'}).map(x=>x.id),['t1'],'a group-wide topic is visible when that context has any student in the selected cohort');
assert.deepEqual(filter('topic',{cycle:'2025'}).map(x=>x.id),['t2'],'cycle filter applies to date-based records');
assert.deepEqual(filter('subject',{school:'a',cohort:'2024'}).map(x=>x.id),['math'],'subject lists are related through matching memberships');
assert.deepEqual(filter('student',{cohort:'unassigned'}).map(x=>x.id),['s3'],'legacy unassigned students remain visible and filterable');
const stats=Summary.stats({attendance:filter('attendance',{cycle:'2026'}),grades:[{data:{status:'graded',value:8}},{data:{status:'graded',value:6}},{data:{status:'pending',value:''}}],students:filter('student',{}),topics:filter('topic',{})});
assert.equal(stats.attendanceRate,67);assert.equal(stats.averageGrade,7);assert.equal(stats.students,3);assert.equal(stats.classes,2);
console.log('PASS: global summary filters keep cycle year, entry cohort, and exact student memberships distinct.');
const app=require('node:fs').readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
assert.match(app,/inputField\('cohortYear','Cohorte de ingreso/,'student editor exposes cohort year');
assert.match(app,/data\.cohortYear=String\(values\.cohortYear\|\|''\)\.trim\(\)/,'saving a student persists its cohort');
assert.match(app,/s\.data\.cohortYear\|\|'Cohorte pendiente'/,'legacy students without cohort are explicitly identified');
console.log('PASS: cohort is editable, persists per student and leaves historical blanks intact.');
