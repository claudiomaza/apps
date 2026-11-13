(function(root){
 function key(c){return JSON.stringify([c.schoolId||'',c.subjectId||'',c.courseId||'',c.divisionId||'']);}
 function label(c,names){return [names.school(c.schoolId),names.subject(c.subjectId),`${names.course(c.courseId)} · ${names.division(c.divisionId)}`].filter(Boolean).join(' · ');}
 function cohorts(c,memberships,students,cohortLabel){const ids=new Set(memberships.filter(m=>key(m.data)===key(c)).map(m=>m.data.studentId));return [...new Set(students.filter(s=>ids.has(s.id)).map(s=>cohortLabel(s.id)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));}
 const api={key,label,cohorts};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NotesContext=api;
})(typeof globalThis!=='undefined'?globalThis:this);
