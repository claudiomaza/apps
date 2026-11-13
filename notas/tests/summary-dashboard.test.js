'use strict';
const assert=require('node:assert/strict');
const Summary=require('../summary.js');
const subjectStats=Summary.statisticsBySubject({
 memberships:[{data:{studentId:'s1',schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1'}},{data:{studentId:'s1',schoolId:'b',subjectId:'hist',courseId:'c2',divisionId:'d2'}}],
 attendance:[{data:{studentId:'s1',schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1',date:'2026-04-10',scheduleId:'m1',status:'present'}},{data:{studentId:'s1',schoolId:'b',subjectId:'hist',courseId:'c2',divisionId:'d2',date:'2026-04-10',scheduleId:'h1',status:'absent'}}],
 grades:[{data:{studentId:'s1',assessmentId:'am',status:'graded',value:8}},{data:{studentId:'s1',assessmentId:'ah',status:'pending',value:''}}],
 assessments:[{id:'am',data:{schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1'}},{id:'ah',data:{schoolId:'b',subjectId:'hist',courseId:'c2',divisionId:'d2'}}],
 subjects:[{id:'math',data:{name:'Matemática'}},{id:'hist',data:{name:'Historia'}}]
});
assert.deepEqual(subjectStats.map(x=>[x.subjectId,x.present,x.absent,x.attendanceRate,x.averageGrade,x.pending]).sort((a,b)=>a[0].localeCompare(b[0])),[['hist',0,1,0,null,1],['math',1,0,100,8,0]],'statistics stay separate by subject and exact group for a student with simultaneous attendance and absence');
assert.equal(Summary.attendancePercent([{data:{status:'present'}},{data:{status:'absent'}},{data:{status:'pending'}}]),50,'attendance ratio counts only explicit present/absent marks');
assert.equal(Summary.ageOn('2000-11-08',new Date('2026-11-07T12:00:00Z')),25,'age uses birthday, not a rounded 365-day divisor');
assert.equal(Summary.ageOn('2000-11-07',new Date('2026-11-07T12:00:00Z')),26,'age advances on birthday');
assert.equal(Summary.ageOn('2000-02-30',new Date('2026-11-07T12:00:00Z')),null,'invalid birth dates do not produce an age');
const htmlBefore=require('node:fs').readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
assert.match(htmlBefore,/data-summary-tab="overview">Panel inicial[\s\S]*data-summary-tab="topics">Libro de tema/,'topic book appears as a separate summary panel');
assert.match(htmlBefore,/data-summary-panel="topics"[\s\S]*id="summary-topic-rows"/,'topic book has its own read-only panel');
assert.match(htmlBefore,/summary-filters[\s\S]*data-summary-panel="overview"[\s\S]*summary-kpis/,'global filters remain outside the initial panel');
assert.match(htmlBefore,/summary-subject-statistics/,'Statistics includes a per-subject and group indicators table');
assert.match(htmlBefore,/id="attendance-search"[\s\S]*id="attendance-status-filter"/,'attendance has explicit search and status filters');
assert.match(htmlBefore,/id="grades-search"[\s\S]*id="grades-status-filter"/,'grade entry has explicit search and status filters');
assert.match(htmlBefore,/Indicadores por materia[\s\S]*Presentes[\s\S]*Ausentes[\s\S]*Promedio[\s\S]*Pendientes[\s\S]*Eximidos/,'statistics table enumerates attendance and grade indicators for every subject');

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
assert.match(app,/inputField\('cohortStartDate','Fecha de inicio \(cohorte\)'/,'student editor captures exact cohort start date');
assert.match(app,/data\.cohortYear=data\.cohortStartDate\.slice\(0,4\)/,'cohort year is derived from start date');
assert.match(app,/cohortStartDate\|\|''/,'legacy records can be edited without inventing a start day');
assert.match(app,/Summary\.cohortLabel\(s\.id,all\)/,'student list displays cohort year and start day/month when known');
const exactStartStudents=students.map(s=>s.id==='s1'?{...s,data:{...s.data,cohortStartDate:'2024-03-15'}}:s);
assert.equal(Summary.cohortLabel('s1',exactStartStudents),'2024 · 15/03','cohort display includes the exact month and day');
assert.match(app,/data\.cohortYear=data\.cohortStartDate\.slice\(0,4\)/,'saving a student derives and persists its cohort year from the date');
assert.match(app,/Summary\.cohortLabel\(s\.id,all\)/,'legacy students without a start date remain identified without fabricated day/month');
assert.equal(Summary.cohortLabel('s3',students),'Cohorte pendiente','students without cohort remain explicitly identified');
assert.match(app,/Año escolar \(grupo\)/,'student summary distinguishes current year of study from entry cohort');
assert.match(app,/Summary\.yearOf\(r,all\)/,'student row gets current academic cycle from dated records, not cohort or school year');
assert.deepEqual(Summary.schoolYears('s1',[...all,{type:'course',id:'c1',data:{name:'2°'}},{type:'course',id:'c2',data:{name:'3°'}}]).sort(),['2°','3°'],'school years are read from each current course membership, not guessed from cohort');
assert.deepEqual(Summary.schoolYears('s1',[...all,{type:'course',id:'c1',data:{name:'2°'}},{type:'course',id:'c2',data:{name:'3°'}}],{school:'a'}),['2°'],'school-year labels follow active summary context');
const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
assert.match(html,/Ciclo lectivo \(año cursado\)/,'cycle filter means year of course activity');
assert.match(html,/Cohorte \(año de ingreso\)/,'cohort filter means year student started');
assert.match(html,/La cohorte se identifica por el año.*día y mes de inicio/,'summary explains cohort year and its exact start day/month');
assert.match(app,/Fecha de inicio \(cohorte\)/,'student form distinguishes entry date from school year');
assert.match(html,/<th>Cohorte de ingreso<\/th><th>Ciclo lectivo<\/th><th>Año escolar \(grupo\)<\/th><th>Materias y grupos<\/th>/,'student table displays entry year, academic year, and course level separately');
assert.match(app,/Summary\.yearOf\(r,all\)/,'student cycle year is derived from dated records, never from cohort or school year');
assert.deepEqual(Summary.schoolYears('s1',[...all,{type:'course',id:'c1',data:{name:'2.º'}},{type:'course',id:'c2',data:{name:'3.º'}}]).sort(),['2.º','3.º'],'course year comes from current group membership');
console.log('PASS: cohort is editable, persists per student and leaves historical blanks intact.');

const attendanceMatrix=Summary.attendanceSessions(all.filter(x=>x.type==='attendance'));
assert.deepEqual(attendanceMatrix.map(x=>[x.date,x.students.s1||'',x.students.s2||'']),[['2026-04-10','present',''],['2026-04-11','','absent'],['2026-04-11','present','']],'attendance sessions remain separate by context/date');
const detailed=Summary.stats({attendance:all.filter(x=>x.type==='attendance'),grades:[{data:{status:'graded',value:8}},{data:{status:'exempt'}},{data:{status:'pending'}}],students,topics:all.filter(x=>x.type==='topic'),subjects:[]});
assert.equal(detailed.present,2);assert.equal(detailed.absent,1);assert.equal(detailed.sessions,3);assert.equal(detailed.exempt,1);assert.equal(detailed.pending,1);assert.equal(detailed.classes,2);
assert.deepEqual(Summary.schoolYears('s1',[...all,{type:'course',id:'c1',data:{name:'2.º'}},{type:'course',id:'c2',data:{name:'3.º'}}]).sort(),['2.º','3.º'],'school years are read from memberships, not inferred from cohort');
assert.deepEqual(Summary.schoolYears('s1',[...all,{type:'course',id:'c1',data:{name:'2.º'}},{type:'course',id:'c2',data:{name:'3.º'}}],{school:'a'}),['2.º'],'school-year labels follow active summary filters');
assert.deepEqual(Summary.attendanceByDay(all.filter(x=>x.type==='attendance')).map(x=>[x.weekday,x.present,x.absent]),[['viernes',1,0],['sábado',1,1]],'attendance charts group present/absent by weekday');
assert.deepEqual(Summary.gradesByAssessment([{data:{assessmentId:'a',status:'graded',value:'8'}},{data:{assessmentId:'a',status:'exempt'}},{data:{assessmentId:'b',status:'pending'}}],[{id:'a',data:{name:'Evaluación 1',date:'2026-04-10',subjectId:'math'}},{id:'b',data:{name:'Evaluación 2',date:'2026-04-11',subjectId:'math'}}]).map(x=>[x.name,x.average,x.graded,x.exempt,x.pending]),[['Evaluación 1',8,1,1,0],['Evaluación 2',null,0,0,1]]);
const summaryBody=app.slice(app.indexOf('function renderSummary(){'),app.indexOf('function renderSummaryPanel('));assert(summaryBody.indexOf('const row=(cells)')<summaryBody.indexOf("$('#summary-subject-statistics')"),'summary table helper is initialized before its first use');
assert.match(app,/summary-instance-name/,'grade matrix has a separate instance-name line under date');assert.match(app,/Summary\.statisticsBySubject/,'summary computes indicators per subject and exact group');
assert.match(app,/\$\('#summary-subject-statistics'\)\.innerHTML=subjectStatistics/,'subject summary table is populated from context-specific stats');assert.match(app,/label:`\$\{a\.data\.date\|\|'Sin fecha'\}\\n\$\{assessmentName\(a\.id\)\}`/,'assessment name is rendered under its date in grade matrix headers');
assert.doesNotMatch(app,/Exentas|Eximidas/);assert.match(app,/Eximidos/);assert.match(app,/summary-attendance-matrix/);assert.match(app,/summary-grade-matrix/);assert.match(app,/attendanceSessions/);assert.match(app,/gradeMark/);
assert(html.indexOf('aria-controls="configuration-menu"')<html.indexOf('data-tab="admin"')&&html.indexOf('data-tab="admin"')<html.indexOf('data-tab="trash"'),'Registros y Papelera están dentro de Configuración');
assert.match(html,/app\.js\?v=20261113-toastlayout2/);assert.match(html,/summary\.js\?v=20261113-notas-sidebar1/);

const membership={schoolId:'a',subjectId:'math',courseId:'c1',divisionId:'d1',subgroupIds:['sub1']};
assert.equal(Summary.sameGroup(membership,all.find(x=>x.type==='attendance').data),true,'extra membership fields must not hide attendance');assert.equal(Summary.sameGroup(membership,{...membership,subjectId:'hist'}),false,'different groups never mix');


const rollupAttendance=[];
const weekdayFixtures=[['lunes',4,94,10],['martes',4,95,9],['miércoles',4,95,9]];
const startDate=new Date('2026-11-09T12:00:00');
for(const [weekday,sessionCount,present,absent] of weekdayFixtures){
  let presentLeft=present,absentLeft=absent;
  for(let n=0;n<sessionCount;n++){
    const date=new Date(startDate);date.setDate(startDate.getDate()+['lunes','martes','miércoles'].indexOf(weekday)+n*7);
    const day=date.toISOString().slice(0,10),p=Math.min(26,presentLeft),a=Math.min(26-p,absentLeft);presentLeft-=p;absentLeft-=a;
    for(let i=0;i<p+a;i++)rollupAttendance.push({data:{studentId:`${weekday}-${n}-${i}`,date:day,scheduleId:`${weekday}-${n}`,schoolId:'s',subjectId:'math',courseId:'year',divisionId:'A',status:i<p?'present':'absent'}});
  }
}
assert.equal(typeof Summary.attendanceByAssessment,'function','assessment attendance helper is exported');
const assessmentAttendance=Summary.attendanceByAssessment([
 {data:{date:'2026-11-09',schoolId:'s',subjectId:'math',courseId:'year',divisionId:'A',studentId:'p1',status:'present'}},
 {data:{date:'2026-11-09',schoolId:'s',subjectId:'math',courseId:'year',divisionId:'A',studentId:'p2',status:'absent'}},
 {data:{date:'2026-11-09',schoolId:'s',subjectId:'math',courseId:'year',divisionId:'B',studentId:'other-division',status:'present'}},
 {data:{date:'2026-11-09',schoolId:'s',subjectId:'history',courseId:'year',divisionId:'A',studentId:'other-subject',status:'present'}},
 {data:{date:'2026-11-10',schoolId:'s',subjectId:'math',courseId:'year',divisionId:'A',studentId:'p3',status:'present'}},
], [
 {id:'exam-a',data:{name:'Evaluación A',date:'2026-11-09',schoolId:'s',subjectId:'math',courseId:'year',divisionId:'A'}},
 {id:'exam-b',data:{name:'Evaluación B',date:'2026-11-10',schoolId:'s',subjectId:'math',courseId:'year',divisionId:'A'}},
 {id:'exam-empty',data:{name:'Sin asistencia',date:'2026-11-11',schoolId:'s',subjectId:'math',courseId:'year',divisionId:'A'}},
]);
assert.deepEqual(assessmentAttendance.map(x=>[x.name,x.date,x.present,x.absent,x.marked,x.attendanceRate]),[['Evaluación A','2026-11-09',1,1,2,50],['Evaluación B','2026-11-10',1,0,1,100]],'date/context rollup excludes other groups and sessions without marks');
const sessions=Summary.attendanceSessions(rollupAttendance),attendanceByDay=Summary.attendanceByDay(rollupAttendance),attendanceStats=Summary.stats({attendance:rollupAttendance});
assert.equal(sessions.length,12,'dashboard counts one marked class per date/schedule/context');
assert.deepEqual(attendanceByDay.map(x=>[x.weekday,x.present,x.absent]),[['lunes',94,10],['martes',95,9],['miércoles',95,9]],'weekly rollup aggregates all sessions by weekday');
assert.deepEqual([attendanceStats.marked,attendanceStats.present,attendanceStats.absent,attendanceStats.attendanceRate],[312,284,28,91],'dashboard attendance counts use marked records, not session count');
const assessmentSpecs=[['ZAPIA QA — Evaluación de prueba','2026-11-09',29,0,0,2,7.52],['ZAPIA QA — Evaluación de Historia (ficticia)','2026-11-10',27,0,0,4,8.04],['ZAPIA QA — Evaluación de Inglés (ficticia)','2026-11-11',27,0,0,4,6.63],['ZAPIA QA — Ciencias: evaluación 1 (ficticia)','2026-11-23',17,0,2,2,7.29],['ZAPIA QA — Historia: evaluación 1 (ficticia)','2026-11-24',16,1,2,2,7.19],['ZAPIA QA — Inglés: evaluación 1 (ficticia)','2026-11-25',17,1,1,2,6.82],['ZAPIA QA — Ciencias: evaluación 2 (ficticia)','2026-11-30',18,1,2,0,7.33],['ZAPIA QA — Historia: evaluación 2 (ficticia)','2026-12-01',18,1,2,0,7.33],['ZAPIA QA — Inglés: evaluación 2 (ficticia)','2026-12-02',18,1,2,0,6.89]];
const qaAssessments=assessmentSpecs.map(([name,date],i)=>({id:`qa-${i}`,data:{name,date,subjectId:'math'}}));
const qaGrades=assessmentSpecs.flatMap(([,date,graded,pending,notSubmitted,absent,average],i)=>[
  ...Array.from({length:graded},(_,j)=>({data:{assessmentId:`qa-${i}`,gradeDate:date,status:'graded',value:average}})),
  ...Array.from({length:pending},()=>({data:{assessmentId:`qa-${i}`,gradeDate:date,status:'pending'}})),
  ...Array.from({length:notSubmitted},()=>({data:{assessmentId:`qa-${i}`,gradeDate:date,status:'not_submitted'}})),
  ...Array.from({length:absent},()=>({data:{assessmentId:`qa-${i}`,gradeDate:date,status:'absent'}})),
]);
const qaGradeRollup=Summary.gradesByAssessment(qaGrades,qaAssessments),qaGradeStats=Summary.stats({grades:qaGrades});
assert.deepEqual(qaGradeRollup.map(x=>[x.name,x.date,x.graded,x.pending,x.notSubmitted,x.absent,x.exempt,x.average]),assessmentSpecs.map(x=>[...x.slice(0,2),...x.slice(2,6),0,x[6]]),'grade dashboard reports every assessment with independent date, average and status counts');
assert.deepEqual([qaGradeStats.graded,qaGradeStats.pending,qaGradeStats.notSubmitted,qaGradeStats.gradeAbsent,qaGradeStats.exempt,qaGradeStats.averageGrade],[187,5,11,16,0,7.26],'grade KPI rollup matches the shared dashboard example');
console.log('PASS: dashboard attendance/grade rollups match supplied synthetic data.');

assert.match(html,/data-summary-tab=\"overview\">Panel inicial[\s\S]*data-summary-tab=\"activity\">Actividad reciente/,'recent activity tab follows dashboard tab');
assert.match(app,/Promedio de asistencia por evaluación/,'attendance subsection title is explicit');
assert.match(html,/Presentes \(marcas\)/,'subject table labels present attendance records as marks');
assert.match(html,/Asistencia \(\% de marcas\)/,'subject table labels attendance as a percentage');
assert.match(html,/Promedio \(puntos de escala\)/,'subject table labels grades in scale points');
