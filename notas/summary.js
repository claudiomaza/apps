'use strict';
function yearOf(r, records) {const d=r.data||{};if(d.date||d.gradeDate)return String(d.date||d.gradeDate).slice(0,4);if(d.assessmentId)return String(records.find(x=>x.type==='assessment'&&x.id===d.assessmentId)?.data?.date||'').slice(0,4);return '';}
function cohortOf(id, records) {const s=records.find(x=>x.type==='student'&&x.id===id),v=s?.data?.cohortYear??s?.data?.cohort??'';return /^\d{4}$/.test(String(v))?String(v):'unassigned';}
function cohortLabel(id,records) {const s=records.find(x=>x.type==='student'&&x.id===id),year=cohortOf(id,records),date=String(s?.data?.cohortStartDate||'');return year==='unassigned'?'Cohorte pendiente':/^\d{4}-\d{2}-\d{2}$/.test(date)?`${year} · ${date.slice(8,10)}/${date.slice(5,7)}`:year;}
function matchesContext(filters,d={}) {return ['school','subject','course','division'].every(k=>!filters[k]||d[k+'Id']===filters[k]);}
function sameGroup(a={},b={}) {return ['schoolId','subjectId','courseId','divisionId'].every(k=>(a[k]||'')===(b[k]||''));}
function schoolYears(studentId,records,filters={}) {return [...new Set(records.filter(r=>r.type==='membership'&&r.data?.studentId===studentId&&matchesContext(filters,r.data)).map(m=>records.find(r=>r.type==='course'&&r.id===m.data.courseId)?.data?.name||'').filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));}
function hasActivity(m,records,filters={}) {return records.some(r=>['attendance','assessment','grade','topic','observation'].includes(r.type)&&['schoolId','subjectId','courseId','divisionId'].every(k=>r.data?.[k]===m.data?.[k])&&(!filters.cycle||yearOf(r,records)===String(filters.cycle))&&(!filters.from||!(r.data?.date||r.data?.gradeDate)||String(r.data.date||r.data.gradeDate)>=filters.from)&&(!filters.to||!(r.data?.date||r.data?.gradeDate)||String(r.data.date||r.data.gradeDate)<=filters.to));}
function filterRecords(input, records, filters={}) {
 const live=records.filter(x=>!x.deletedAt&&x.status!=='DELETED'),students=live.filter(x=>x.type==='student'),studentIds=new Set(students.filter(s=>(!filters.cohort||cohortOf(s.id,live)===filters.cohort)&&(!filters.student||s.id===filters.student)).map(s=>s.id));
 return input.filter(r=>{const d=r.data||{},date=d.date||d.gradeDate||'';if(filters.cycle&&yearOf(r,live)!==String(filters.cycle)&&!['student','school','subject','course','division'].includes(r.type))return false;const rangeDate=date||(r.type==='grade'?live.find(a=>a.type==='assessment'&&a.id===d.assessmentId)?.data.date||'':'');if(!['student','school','subject','course','division'].includes(r.type)&&((filters.from&&rangeDate&&rangeDate<filters.from)||(filters.to&&rangeDate&&rangeDate>filters.to)))return false;
  if(r.type==='student')return studentIds.has(r.id)&&live.some(m=>m.type==='membership'&&m.data.studentId===r.id&&matchesContext(filters,m.data)&&(!filters.cycle&&!filters.from&&!filters.to||hasActivity(m,live,filters)));
  if(r.type==='grade'){const a=live.find(x=>x.type==='assessment'&&x.id===d.assessmentId);return (!d.studentId||studentIds.has(d.studentId))&&(!a||matchesContext(filters,a.data))&&(!filters.cycle||yearOf(a||r,live)===String(filters.cycle))&&(!filters.from||!a?.data?.date||a.data.date>=filters.from)&&(!filters.to||!a?.data?.date||a.data.date<=filters.to);}
  if(['school','subject','course','division'].includes(r.type)){const key={school:'schoolId',subject:'subjectId',course:'courseId',division:'divisionId'}[r.type];return live.some(m=>m.type==='membership'&&m.data[key]===r.id&&studentIds.has(m.data.studentId)&&matchesContext(filters,m.data)&&(!filters.cycle&&!filters.from&&!filters.to||hasActivity(m,live,filters)));}
  if(d.studentId&&!studentIds.has(d.studentId))return false;
  if(['attendance','topic','observation','assessment','schedule','membership'].includes(r.type)){if(r.type==='membership')return studentIds.has(d.studentId)&&matchesContext(filters,d)&&hasActivity(r,live,filters);const ms=d.studentId?live.filter(m=>m.type==='membership'&&m.data.studentId===d.studentId):live.filter(m=>m.type==='membership'&&['schoolId','subjectId','courseId','divisionId'].every(k=>m.data[k]===d[k]));return ms.some(m=>studentIds.has(m.data.studentId)&&matchesContext(filters,d.studentId?m.data:d));}
  return true;
 });
}
function stats({attendance=[],grades=[],students=[],topics=[],subjects=[]}) {const marked=attendance.filter(x=>['present','absent'].includes(x.data?.status)),present=marked.filter(x=>x.data.status==='present').length,numeric=grades.filter(x=>x.data?.status==='graded'&&Number.isFinite(Number(x.data.value))).map(x=>Number(x.data.value)),sessions=attendanceSessions(attendance),classDates=new Set([...topics.map(x=>{const d=x.data||{};return[d.date,d.schoolId,d.subjectId,d.courseId,d.divisionId].join('|')}),...sessions.map(x=>[x.date,x.context.schoolId,x.context.subjectId,x.context.courseId,x.context.divisionId].join('|'))]);return{students:students.length,subjects:subjects.length,attendanceRate:marked.length?Math.round(present*100/marked.length):null,present,absent:marked.length-present,marked:marked.length,averageGrade:numeric.length?Math.round(numeric.reduce((a,b)=>a+b,0)/numeric.length*100)/100:null,classes:topics.length,sessions:sessions.length,graded:numeric.length,pending:grades.filter(x=>x.data?.status==='pending').length,notSubmitted:grades.filter(x=>x.data?.status==='not_submitted').length,gradeAbsent:grades.filter(x=>x.data?.status==='absent').length,exempt:grades.filter(x=>x.data?.status==='exempt').length};}

function attendanceSessions(attendance=[]) {
 const sessions=new Map();
 for(const r of attendance){const d=r.data||{},context={schoolId:d.schoolId||'',subjectId:d.subjectId||'',courseId:d.courseId||'',divisionId:d.divisionId||''},key=JSON.stringify([d.date||'',...Object.values(context),d.scheduleId||'']);
  if(!sessions.has(key))sessions.set(key,{key,date:d.date||'',scheduleId:d.scheduleId||'',context,students:{}});
  sessions.get(key).students[d.studentId]=d.status;
 }
 return [...sessions.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
}
function attendanceByDay(attendance=[]) {
 const labels=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],groups=new Map();
 for(const r of attendance){const d=r.data||{};if(!['present','absent'].includes(d.status)||!/^\d{4}-\d{2}-\d{2}$/.test(d.date||''))continue;const weekday=labels[new Date(`${d.date}T12:00:00`).getDay()];if(!groups.has(weekday))groups.set(weekday,{weekday,present:0,absent:0});groups.get(weekday)[d.status]++;}
 return [...groups.values()].sort((a,b)=>labels.indexOf(a.weekday)-labels.indexOf(b.weekday));
}
function gradesByAssessment(grades=[],assessments=[]) {
 const by=new Map();for(const a of assessments)by.set(a.id,{id:a.id,name:a.data?.name||a.id,date:a.data?.date||'',subjectId:a.data?.subjectId||'',graded:0,pending:0,notSubmitted:0,absent:0,exempt:0,values:[]});
 for(const r of grades){const d=r.data||{};if(!by.has(d.assessmentId))by.set(d.assessmentId,{id:d.assessmentId,name:d.assessmentId||'Instancia sin nombre',date:d.gradeDate||'',subjectId:'',graded:0,pending:0,notSubmitted:0,absent:0,exempt:0,values:[]});const x=by.get(d.assessmentId);if(d.status==='graded'&&Number.isFinite(Number(d.value))){x.graded++;x.values.push(Number(d.value));}else if(d.status==='pending')x.pending++;else if(d.status==='not_submitted')x.notSubmitted++;else if(d.status==='absent')x.absent++;else if(d.status==='exempt')x.exempt++;}
 return [...by.values()].map(x=>({id:x.id,name:x.name,date:x.date,subjectId:x.subjectId,graded:x.graded,pending:x.pending,notSubmitted:x.notSubmitted,absent:x.absent,exempt:x.exempt,average:x.values.length?Math.round(x.values.reduce((a,b)=>a+b,0)*100/x.values.length)/100:null})).sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
}

const api={yearOf,cohortOf,cohortLabel,filterRecords,stats,attendanceSessions,attendanceByDay,gradesByAssessment,sameGroup,schoolYears};if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.Summary=api;
