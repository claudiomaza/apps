'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const start=source.indexOf('function planTeacherAssignments('),end=source.indexOf('\nfunction renderScheduleBoard',start);
assert(start>=0&&end>start,'pure teacher assignment planner is defined before the board renderer');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
assert.match(html,/id="propose-teacher-assignments" data-admin-only/,'administration exposes an explicit teacher proposal action to admins only');
assert.match(html,/id="apply-teacher-proposal"/,'proposal requires explicit preparation action');
assert.match(html,/id="teacher-proposal-dialog"[\s\S]*id="teacher-proposal-rows"/,'proposal is shown as a complete reviewable table');
assert.match(html,/id="cancel-teacher-proposal"/,'proposal can be cancelled before preparing changes');
assert.match(source,/\$\('#apply-teacher-proposal'\)\.onclick[\s\S]*await loadTeachers\(\)[\s\S]*planTeacherAssignments\(live\('schedule'\),teachers,teacherAvailability\)[\s\S]*await saveRecords\(plan\.map/,'prepare rechecks schedules, teacher scopes and availability before staging changes');
assert.match(source,/stagedRecords\.size\+additions>100/,'proposal respects the existing staged-change limit');
assert.match(source,/pendingTeacherProposal=plan/,'complete proposal is retained for review');
const context={};vm.runInNewContext(source.slice(start,end)+'\nglobalThis.plan=planTeacherAssignments;',context);
const scope={schoolId:'s1',subjectId:'math',courseId:'c1',divisionId:'d1'};
const schedules=[
 {id:'a',data:{...scope,dayOfWeek:1,startTime:'09:00',endTime:'10:00',teacherId:''}},
 {id:'b',data:{...scope,dayOfWeek:2,startTime:'09:00',endTime:'10:00',teacherId:''}},
 {id:'c',data:{...scope,dayOfWeek:1,startTime:'09:30',endTime:'10:30',teacherId:'T3'}}
];
const teachers=[
 {teacherId:'T2',scopes:[scope]},
 {teacherId:'T1',scopes:[scope]},
 {teacherId:'T3',scopes:[scope]}
];
const result=context.plan(schedules,teachers,[{teacherId:'T1',dayOfWeek:1,startTime:'08:30',endTime:'09:15'}]);
assert.deepEqual(JSON.parse(JSON.stringify(result)),[{id:'a',teacherId:'T2'},{id:'b',teacherId:'T1'}],'planner skips unavailable/overlapping teacher and picks balanced deterministic scope-compatible candidates');
assert.deepEqual(JSON.parse(JSON.stringify(context.plan(schedules,[{teacherId:'T9',scopes:[{...scope,divisionId:'d2'}]}],[]))),[],'no teacher outside the exact group scope is assigned');
assert.deepEqual(JSON.parse(JSON.stringify(context.plan(schedules,[{teacherId:'T1',scopes:[scope]}],[{teacherId:'T1',dayOfWeek:1,startTime:'09:00',endTime:'10:00'},{teacherId:'T1',dayOfWeek:2,startTime:'09:00',endTime:'10:00'}]))),[],'returns no proposed assignment when all eligible teachers are unavailable');
console.log('Schedule teacher assignment planner contract PASS');
