'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const start=app.indexOf('function renderSummary(){');
const end=app.indexOf('\nfunction matchesSummaryContext',start);
assert(start>=0&&end>start,'renderSummary source is present');
const elements=new Map();
const $=selector=>{if(!elements.has(selector))elements.set(selector,{value:'',innerHTML:'',textContent:''});return elements.get(selector);};
const summary={
  cohortOf:()=>'',filterRecords:items=>items,stats:()=>({students:0,subjects:0,attendanceRate:null,present:0,marked:0,absent:0,classes:0,sessions:0,averageGrade:null,graded:0,pending:0,notSubmitted:0,gradeAbsent:0,exempt:0}),
  statisticsBySubject:()=>[{subjectName:'Matemática',context:{schoolId:'school1',courseId:'course1',divisionId:'division1'},students:0,present:0,absent:0,attendanceRate:null,averageGrade:null,graded:0,pending:0,notSubmitted:0,gradeAbsent:0,exempt:0}],
  gradesByAssessment:()=>[],attendanceByAssessment:()=>[],attendanceByDay:()=>[],attendanceSessions:()=>[],
};
const context={
  $, $$:()=>[],live:()=>[],currentRole:'admin',STATUSES:{},Summary:summary,
  matchesSummaryContext:()=>true,
};
vm.createContext(context);
vm.runInContext(app.slice(start,end)+'\nglobalThis.runSummary=renderSummary;',context);
assert.doesNotThrow(()=>context.runSummary(),'post-login render with a subject/group statistics row must not throw');
assert.match($('#summary-subject-statistics').innerHTML,/Matemática/,'the affected group row renders after Sheets data loads');
assert.match(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/app\.js\?v=20261113-cohortchips5/,'the simplified frontend has a new cache-buster');
console.log('Notes summary render context TDZ regression PASS');
