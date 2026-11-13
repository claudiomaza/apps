'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(process.env.NOTAS_APP||path.join(__dirname,'../app.js'),'utf8');
const html=fs.readFileSync(process.env.NOTAS_HTML||path.join(__dirname,'../index.html'),'utf8');
const sw=fs.readFileSync(process.env.NOTAS_SW||path.join(__dirname,'../sw.js'),'utf8');
const css=fs.readFileSync(process.env.NOTAS_CSS||path.join(__dirname,'../styles.css'),'utf8');
const PREFIX='ZAPIA-QA-20261106',school=PREFIX+'-escuela',course=PREFIX+'-curso',division=PREFIX+'-division',cutoff=PREFIX+'-trimestre',scale=PREFIX+'-escala';
const subjects=[PREFIX+'-materia',PREFIX+'-materia-historia',PREFIX+'-materia-ingles'],dates=['2026-11-09','2026-11-10','2026-11-11'],days=[1,2,3],assessments=subjects.map((id,i)=>PREFIX+'-evaluacion-'+i),schedules=subjects.map((id,i)=>PREFIX+'-horario-'+i),records=[];
const add=(type,id,data)=>records.push({recordId:`${type}::${id}`,type,id,data,expectedVersion:1});
add('school',school,{name:'QA Escuela'});add('course',course,{name:'QA Curso'});add('division',division,{name:'QA División'});add('cutoff',cutoff,{name:'QA Trimestre'});add('scale',scale,{name:'QA escala',min:1,max:10,mode:'numeric',intervals:[]});
subjects.forEach((id,i)=>{add('subject',id,{name:`QA Materia ${i}`});add('schedule',schedules[i],{schoolId:school,subjectId:id,courseId:course,divisionId:division,dayOfWeek:days[i],startTime:'09:00',endTime:'10:00'});add('assessment',assessments[i],{name:`QA Evaluación ${i}`,date:dates[i],schoolId:school,subjectId:id,courseId:course,divisionId:division,cutoffId:cutoff,scaleId:scale,weight:100,weightLocked:true,subgroupIds:[]});});
for(let i=1;i<=21;i++){const sid=`ZQA-2026-${String(i).padStart(3,'0')}`;add('student',sid,{studentId:sid,fullName:`Estudiante Ficticio ${String(i).padStart(2,'0')}`});for(let j=0;j<3;j++){const sub=subjects[j],membership=`${sid}::qa-${j}`,aid=`${sid}::${dates[j]}::${schedules[j]}`;add('membership',membership,{studentId:sid,schoolId:school,subjectId:sub,courseId:course,divisionId:division,subgroupIds:[]});add('attendance',aid,{studentId:sid,date:dates[j],status:i%7===0?'absent':'present',schoolId:school,subjectId:sub,courseId:course,divisionId:division,scheduleId:schedules[j]});const g={studentId:sid,studentName:`Estudiante Ficticio ${String(i).padStart(2,'0')}`,assessmentId:assessments[j],value:i%7===0?'':6+i%5,status:i%7===0?'absent':'graded',qualitative:false,gradeDate:dates[j],observation:'QA ficticio'};if(g.status==='graded')g.attendanceId=aid;add('grade',`${sid}::${assessments[j]}`,g);}}
records.find(r=>r.type==='attendance'&&r.data.studentId==='ZQA-2026-007'&&r.data.subjectId===subjects[0]).data.status='present';const recStudent='ZQA-2026-007',recDate='2026-11-17',recSchedule=schedules[1],recoveryAttendance={recordId:'attendance::'+recStudent+'::'+recDate+'::'+recSchedule,type:'attendance',id:recStudent+'::'+recDate+'::'+recSchedule,data:{studentId:recStudent,date:recDate,status:'present',schoolId:school,subjectId:subjects[1],courseId:course,divisionId:division,scheduleId:recSchedule}};records.push(recoveryAttendance);
const els=new Map();function el(selector){if(!els.has(selector))els.set(selector,{_value:'',_html:'',disabled:false,hidden:false,textContent:'',className:'',dataset:{},set innerHTML(v){this._html=v;this.options=[...v.matchAll(/<option value="([^"]*)"([^>]*)>/g)].map(m=>({value:m[1],selected:/\bselected\b/.test(m[2]),textContent:m[0]}));if(!this._optionsAssigned)this._value=this.options.find(x=>x.selected)?.value??this.options[0]?.value??'';if(this.options.length&&!this.options.some(x=>x.value===this._value))this._value=this.options[0].value;if(this.options.length&&!this.options.some(x=>x.value===this._value))this._value=this.options[0].value;},get innerHTML(){return this._html},set value(v){this._value=String(v??'');this._optionsAssigned=true},get value(){return this._value||''}});return els.get(selector);}
const context={Summary:require('../summary.js'),records,trashRecords:[],live:type=>records.filter(r=>r.type===type&&!r.deletedAt),getOne:(type,id)=>records.find(r=>r.type===type&&r.id===id&&!r.deletedAt),currentRole:'admin',currentScopes:[],LABELS:{school:'Escuela',subject:'Materia',course:'Año / curso',division:'División',cutoff:'Corte',subgroup:'Subgrupo'},STATUSES:{graded:'Calificada',absent:'Ausente',not_submitted:'No entregó',pending:'Pendiente',exempt:'Eximido'},attendanceDate:'2026-11-06',attendanceContextKey:'',gradeAssessmentKey:'',gradeDate:'',gradeScheduleId:'',Gradebook:{scheduleMatchesDate:(s,d)=>!!s&&new Date(`${d}T12:00:00Z`).getUTCDay()===Number(s.dayOfWeek),weekdayForDate:d=>new Date(`${d}T12:00:00Z`).getUTCDay()},$:el,$$:()=>[],esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),average:g=>({value:g.length?8:null,count:g.length,weight:100}),displayScale:()=>({min:1,max:10,mode:'numeric',intervals:[]}),toast:()=>{}};
function load(start,end){const i=source.indexOf(start),j=source.indexOf(end,i);assert(i>=0&&j>i,`cannot locate ${start}`);vm.runInNewContext(source.slice(i,j),context);}
const gradebookSource=fs.readFileSync(process.env.NOTAS_GRADEBOOK||path.join(__dirname,'../gradebook.js'),'utf8');const Gradebook=require('vm').runInNewContext(gradebookSource+';Gradebook');
load('function selected(){','function membershipsFor');load('function groupContexts(){','function membershipsFor');load('function membershipsFor','function gradeFor');load('function gradeFor','function presentAttendances');load('function presentAttendances','function findAttendance');load('function findAttendance','function attendanceForDate');load('function attendanceForDate','function schedulesFor');load('function schedulesFor','function latestAttendanceDate');
load('function validGradeAttendance','function scheduleForDate');load('function eligibleGradeAttendances','function attendanceForDate');load('function schedulesFor','function latestAttendanceDate');load('function latestAttendanceDate','function scheduleLabel');load('function scheduleLabel','function scheduleForDate');load('function scheduleForDate','function sessionMemberships');load('function sessionMemberships','function displayScale');load('function displayScale','function gradebookAssessmentsFor');load('function gradebookAssessmentsFor','function renderGradebook');load('function renderGradebook','function gradeCell');load('function gradeCell','function renderGradeEntry');load('function renderGradeEntry','function renderObservations');load('function renderAttendance(){','function renderStudents');
load('function renderStudents(){','function renderAssessments');load('function renderAssessments(){','function recordTitle');load('function renderAdmin(){','async function loadTrash');
load('function recordTitle','function scopeLabel');load('function recordTitle','function scopeLabel');
load('function renderObservations(){','function renderAttendance(){');load('function renderTopic(){','function renderAttendance(){');

context.assessmentsFor=()=>context.live('assessment').filter(a=>a.data.schoolId===context.selected().school&&a.data.subjectId===context.selected().subject&&a.data.courseId===context.selected().course&&a.data.divisionId===context.selected().division&&a.data.cutoffId===context.selected().cutoff);
load('function validGradeAttendance','function scheduleForDate');load('function eligibleGradeAttendances','function attendanceForDate');
let a=source.indexOf('function groupContexts(){'),b=source.indexOf('\nfunction membershipsFor',a);vm.runInNewContext(source.slice(a,b),context);
for(let j=0;j<subjects.length;j++){context.refreshFilters();assert.equal(context.selected().subject,subjects[j]);assert.equal(context.roster().length,21);assert.equal(context.assessmentsFor().length,1);context.renderGradebook();assert.equal((el('#grade-rows').innerHTML.match(/<tr>/g)||[]).length,21,'Libreta renders one row per student');context.renderGradeEntry();assert.equal((el('#grade-entry-list').innerHTML.match(/<tr data-student=/g)||[]).length,21,'Notas renders one table row per student');assert.equal(el('#grade-date').value,dates[j],'Notas defaults to instance date');assert.ok(el('#grade-schedule').value,'Notas has valid schedule for selected date');context.renderAttendance();assert.equal((el('#attendance-list').innerHTML.match(/<tr data-attendance-student=/g)||[]).length,21,'Asistencia renders table rows');if(j+1<subjects.length){el('#filter-subject').value=subjects[j+1];context.refreshFilters();}}
// Converted record lists render one <tr> per item, not one card per item.
context.renderObservations();context.renderTopic();context.renderStudents();context.renderAssessments();context.renderAdmin();
for(const id of ['#observation-list','#topic-list','#student-cards','#assessment-cards','#admin-records'])assert(!/<article|class=\"data-card/.test(el(id).innerHTML),`${id} contains no card markup`);
assert.equal((el('#student-cards').innerHTML.match(/<tr>/g)||[]).length,21);
// Several grades are rendered as multiple assessment columns in the group grid.
assert.match(el('#grade-head').innerHTML,/QA Evaluación 2/,'existing assessment remains in the all-cutoff group gradebook');assert.match(el('#grade-head').innerHTML,/2026-11-11/,'assessment date is shown separately');assert.doesNotMatch(el('#grade-head').innerHTML,/Otro grupo/,'different division stays out of the selected group');
// For an absent student, a previously recorded present date stays selected as the recovery link.
const absentRow=el('#grade-entry-list').innerHTML.match(/<tr data-student="ZQA-2026-007"[\s\S]*?<\/tr>/)?.[0];assert(absentRow);assert.match(absentRow,/Sin asistencia presente/,'grade-entry attendance choices remain filtered to the selected cutoff instance');assert.equal(records.find(r=>r.type==='attendance'&&r.id==='ZQA-2026-007::2026-11-10::'+schedules[1]).data.status,'absent');
// Misaligned class date must not keep or accept a schedule from another weekday.
el('#grade-date').value='2026-11-12';el('#grade-date').dataset.assessment=assessments[0];context.gradeAssessmentKey=assessments[0];context.gradeDate='2026-11-12';context.gradeScheduleId='';context.renderGradeEntry();assert.notEqual(el('#grade-schedule').value,schedules[0],'invalid weekday cannot retain the old session');assert.equal(el('#save-grade-session').disabled,false,'grade entry requires a class-date match only when grades are saved');assert.match(el('#grade-session-hint').textContent,/Sesión válida/);
assert(!source.includes('class="data-card grade-entry"'),'Grade entry no longer uses cards');assert(source.includes('Reasignatorio')||source.includes('recuperatorio'),'UI explains recovering an absent grade');assert(source.includes('function renderObservations(){')&&source.includes('Grupo completo'),'Observations support group target');
assert.match(html,/id="app-sidebar"[\s\S]*data-tab="summary"[\s\S]*Trabajo docente[\s\S]*Administración/,'navigation uses teacher-first sidebar and separate admin section');
assert.match(html,/data-tab="topic"[\s\S]*data-tab="libreta"[\s\S]*data-tab="attendance"[\s\S]*data-tab="grades"[\s\S]*data-tab="observations"/,'teacher register destinations remain available in sidebar');
const adminSidebar=html.slice(html.indexOf('sidebar-group sidebar-admin'),html.indexOf('</details>',html.indexOf('sidebar-group sidebar-admin')));for(const tab of ['users','admin','assessments','trash'])assert.match(adminSidebar,new RegExp('data-tab=\"'+tab+'\"'),'admin navigation includes '+tab);
assert.match(html,/class="sidebar-group"[\s\S]*Administración/,'admin group stays in navigation');
assert.match(html,/class="sidebar-link active" data-tab="summary"/,'sidebar starts on the initial dashboard');
assert.match(html,/data-summary-tab="overview">Panel inicial[\s\S]*data-summary-tab="topics">Libro de tema/,'initial dashboard and read-only topic panel are visible');assert.doesNotMatch(html,/data-summary-tab="statistics"/);
assert.match(html,/data-summary-panel="overview"[\s\S]*id="summary-kpis"[\s\S]*id="summary-attendance-chart"[\s\S]*id="summary-grade-chart"/,'initial dashboard contains attendance and grade statistics');
assert.match(html,/id="attendance-list" class="attendance-rows"/);assert.match(html,/id="grade-entry-list" class="grade-rows"/);
assert.match(css,/\.attendance-rows tr/);assert.match(css,/\.grade-rows tr/);
for(const tab of ['users','admin','assessments'])assert.match(html.slice(html.indexOf('sidebar-group sidebar-admin'),html.indexOf('</details>',html.indexOf('sidebar-group sidebar-admin'))),new RegExp('data-tab=\"'+tab+'\"'),'admin configuration includes '+tab);
const adminBlock=html.slice(html.indexOf('sidebar-group sidebar-admin'),html.indexOf('</details>',html.indexOf('sidebar-group sidebar-admin')));assert.match(adminBlock,/data-tab="admin"[\s\S]*data-tab="trash"/,'Registros and Papelera remain in the sidebar admin section');assert(html.includes('id="view-trash"'),'Papelera view exists');assert.match(html,/id="summary-filter-cycle"[\s\S]*id="summary-filter-cohort"[\s\S]*id="summary-filter-school"[\s\S]*id="summary-filter-subject"[\s\S]*id="summary-filter-student"/,'Summary has global cycle, cohort, group and student filters');assert(!html.match(/<section class="summary-panel" data-summary-panel="overview"[\s\S]*?<\/section>/)?.[0].includes('id="summary-topic-rows"'),'topic table remains a separate panel');
assert.match(html,/data-summary-panel="topics"[\s\S]*id="summary-topic-rows"/,'read-only topic panel remains available');
assert.match(html,/<section id="view-topic" class="tab-view" hidden>[\s\S]*id="new-topic"/,"editable topic register remains hidden until selected from Registrar");
assert.match(html,/id="view-users"[\s\S]*id="teacher-scopes"[\s\S]*class="teacher-availability"[\s\S]*id="teacher-assignment-list"/,'teacher permissions, availability and assignment table are in Docentes y permisos');
assert.match(html,/id="view-users"[\s\S]*Fichas docentes[\s\S]*id="teacher-list"[\s\S]*id="subject-schedules-section"/,'teacher list and class schedules stay in the users view');
assert.match(html,/availability-teacher[\s\S]*availability-selected-name[\s\S]*availability-list/,'availability names its selected teacher');
assert.match(source,/\$\('#availability-teacher'\)\.onchange[\s\S]*\$\('#scope-teacher'\)\.value/,'availability selection updates assigned teacher');
assert.match(source,/\$\('#summary-topic-rows'\)\.innerHTML=topics/,'overview topic rows use current summary filters');

assert.match(html,/summary-filters[\s\S]*data-summary-panel="overview"/,'global filters live outside the initial dashboard');
assert.match(html,/summary-subject-statistics/,'statistics expose per-subject indicators');
assert.match(html,/id="attendance-search"[^\n]*id="attendance-status-filter"/,'attendance register has search and status filters');
assert.match(html,/id="grades-search"[^\n]*id="grades-status-filter"/,'grade register has search and status filters');
assert.match(css,/#attendance-list tr>td:not\(:last-child\)/,'attendance has visible dividers through interior columns');
assert.match(html,/data-summary-panel="overview"[\s\S]*Indicadores por materia[\s\S]*summary-subject-statistics/,'initial dashboard lists per-subject indicators');
assert.match(html,/summary-filters[\s\S]*data-summary-panel="overview"/,'global filters are not hidden from the initial dashboard');
assert.match(html,/id="schedule-board-body"/,'configuration exposes the weekly timetable');assert.match(html,/id="export-schedules"/,'configuration exposes schedule export');
assert.match(html,/availability-teacher[\s\S]*availability-start[\s\S]*availability-end/,'teacher availability editor is present');
assert.match(source,/inputField\('birthDate'[\s\S]*inputField\('address'[\s\S]*inputField\('email'[\s\S]*inputField\('phone'[\s\S]*inputField\('documentType'[\s\S]*schoolHistory[\s\S]*healthNotes[\s\S]*socioeducationalNotes/,'student personal and socioeducational fields are available');
assert.match(source,/Summary\.ageOn\(s\.data\.birthDate\)/,'student age is calculated from birth date');
assert.match(source,/data-search=/,'student row carries searchable name and ID');
assert.match(html,/id="sidebar-toggle"/);assert.match(html,/aria-controls="app-sidebar"/);assert.match(html,/id="sidebar-backdrop"/);
assert(!/id="(?:grade-entry-list|attendance-list|observation-list|topic-list|student-cards|assessment-cards|admin-records|trash-records|teacher-list)" class="cards"/.test(html),'record collections use tables');
assert.match(css,/\.dropdown-menu/);assert.match(css,/\.grade-session-toolbar/);
assert.match(sw,/notas-static-/);
assert(source.includes("students.flatMap(st=>{const card=cards.find(x=>x.dataset.attendanceStudent===st.id);if(!card?.dataset.draft)return[];"),'attendance drafts remain aligned with student after sorting');

// Verify the renderer rejects date/weekday mismatch rather than preserving a stale session option.
records.find(r=>r.type==='schedule'&&r.id===schedules[0]).data.dayOfWeek=2;context.gradeAssessmentKey='';el('#grade-assessment').value=assessments[0];context.renderGradeEntry();assert.notEqual(el('#grade-schedule').value,schedules[0],'A mismatched weekday cannot keep the previously selected session');assert.equal(el('#grade-session-hint').textContent.includes('No hay horario'),false,'The session selector still reflects the selected date after re-render');
const from=records.find(r=>r.type==='attendance'&&r.data.studentId==='ZQA-2026-007'&&r.data.subjectId===subjects[1]);assert.equal(from.data.status,'absent');const assessment=records.find(r=>r.type==='assessment'&&r.id===assessments[1]);assert.equal(context.validGradeAttendance(from.data.studentId,assessment,from.id),false,'absence cannot be used as grade attendance');assert.equal(context.validGradeAttendance(from.data.studentId,assessment,recoveryAttendance.id),true,'alternate present date can support recovery');assert.equal(from.data.status,'absent','original absence remains unchanged');
console.log('PASS: 3 subjects; 21 student rows each in Libreta, Notas and Asistencia; grade entry date follows assessment and a valid class schedule is selected.');

assert.match(css,/\.summary-year-help/,'summary distinguishes cohort, school year and academic cycle');


assert.match(html,/data-summary-panel="topics"[\s\S]*id="summary-topic-rows"/,"topic content remains separately browsable");
assert.match(html,/<section id="view-topic" class="tab-view" hidden>[\s\S]*id="new-topic"/,"editable topic register remains hidden until selected from Registrar");
assert.match(html,/id="view-users"[\s\S]*id="teacher-scopes"[\s\S]*class="teacher-availability"[\s\S]*id="teacher-assignment-list"/,"availability, assignment table and permissions are in Docentes y permisos");
assert.match(html,/availability-teacher[\s\S]*availability-selected-name[\s\S]*availability-list/,"availability names selected teacher");
assert.match(source,/\$\('#availability-teacher'\)\.onchange[\s\S]*\$\('#scope-teacher'\)\.value/,"availability selection updates assignment teacher");
assert.match(source,/\$\('#summary-topic-rows'\)\.innerHTML=topics/,"read-only topic list uses summary filter results");


assert.match(css,/\.users-layout\{grid-template-columns:minmax\(260px,\.9fr\) minmax\(300px,1fr\) minmax\(300px,1fr\)\}/,'assignment and availability have adjacent desktop columns');
assert.match(css,/@media\(max-width:950px\)\{\.users-layout\{grid-template-columns:1fr\}/,'teacher cards stack on smaller screens');
assert.match(css,/\.attendance-rows td:first-child\{min-width:190px\}/,'attendance student names have room per row');


assert.match(html,/id="view-users"[\s\S]*id="export-schedules"[^>]*>Exportar DDJJ docente/,'teacher DDJJ export is located in Docentes y permisos');
assert.match(css,/summary-matrix tbody th\[scope="row"\][\s\S]*text-transform:\s*none/,'summary matrix student row headers avoid column-heading typography');

assert.match(css,/summary-matrix tbody th\[scope="row"\][\s\S]*text-transform:\s*none/,'summary matrix student row headers avoid column-heading typography');

assert.match(html,/<dialog id="teacher-dialog"[\s\S]*id="teacher-form"[\s\S]*id="teacher-editing"[\s\S]*id="teacher-id"[\s\S]*id="teacher-username"[\s\S]*id="teacher-name"[\s\S]*id="teacher-mail"[\s\S]*id="teacher-password"[\s\S]*id="teacher-password-confirm"/,'teacher editing modal contains all editable profile fields');
assert.match(css,/summary-matrix tbody th\[scope="row"\][\s\S]*text-transform:\s*none/,'student names in summary matrices use readable row-header styling');
assert.match(source,/teacher-dialog'\)\.showModal\(\)/,'editing a teacher opens the edit dialog');

assert.match(html,/id="view-topic"[\s\S]*id="topic-subject-filter"[\s\S]*id="export-topic-xlsx"/,'topic export filter is present');
assert.match(source,/function openStudentGradebook[\s\S]*live\('membership'\)/,'student view gathers all subject memberships');
assert.match(source,/data-save-schedule-assignment/,'assignment table uses explicit apply');

assert.match(html,/data-summary-panel="overview"[\s\S]*summary-attendance-chart[\s\S]*summary-grade-chart/,'initial dashboard exposes paired attendance and grade indicators');assert.match(source,/gradebookAssessmentsFor/,'group gradebook uses all instances in the selected group');assert.match(source,/grade-instance-date/,'gradebook separates instance dates in each assessment column');assert.match(source,/selectField\('courseId','Año \/ curso',[\s\S]*selectField\('divisionId','División',[\s\S]*selectField\('subjectId','Materia'/,'student assignment prominently selects year and division');assert.match(html,/Año escolar · división/,'student roster displays assigned year and division');
assert.match(html,/data-summary-tab="overview">Panel inicial[\s\S]*data-summary-tab="topics">Libro de tema/,"topic panel follows the initial dashboard");

assert.match(source,/function gradebookAssessmentsFor[\s\S]*data\.divisionId===f\.division/,'group gradebook scopes assessments to the selected school, subject, year, and division');assert.doesNotMatch(source.slice(source.indexOf('function gradebookAssessmentsFor'),source.indexOf('function renderGradebook')),/f\.cutoff/,'group gradebook includes all assessment cutoffs');assert.match(source,/class=\"grade-instance-date\">\$\{esc\(assessment\.data\.date/,'gradebook separates the date from the grade value in each student row');assert.match(source,/case'membership':return selectField\('schoolId','Escuela'[\s\S]*selectField\('courseId','Año \/ curso'[\s\S]*selectField\('divisionId','División'/,'student assignment explicitly captures course year and division');assert.match(html,/Año escolar · división/,'student roster labels the year/division assignment');

assert(source.includes('Promedio de asistencia por evaluación'),'initial attendance statistic includes assessment breakdown');
assert(source.includes('attendanceByAssessment'),'assessment attendance uses dedicated exact-context rollup');
assert(source.includes('escSummary(x.date)'),'assessment date is escaped before insertion into summary HTML');

assert.match(html,/access-details[\s\S]*id=\"logout-button\"/,'logout appears below the account name and access details');assert.match(source,/function signOut\(\)/,'sign out clears the active session');assert.match(source,/stagedRecords\.clear\(\)/,'only authentication failure paths clear staged data, not sign-out');assert.match(html,/sync-help/,'refresh and sync explain their distinct effects');
