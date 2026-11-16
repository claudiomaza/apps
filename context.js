(function(root){
 function key(c){return JSON.stringify([c.schoolId||'',c.subjectId||'',c.courseId||'',c.divisionId||'']);}
 function label(c,names){return [names.school(c.schoolId),names.subject(c.subjectId),`${names.course(c.courseId)} · ${names.division(c.divisionId)}`].filter(Boolean).join(' · ');}
 function cohorts(c,memberships){const years=memberships.filter(m=>key(m.data)===key(c)).map(m=>String(m.data.cohortYear||'')).map(y=>/^\d{4}$/.test(y)?y:'unassigned');return [...new Set(years)].sort((a,b)=>a==='unassigned'?1:b==='unassigned'?-1:Number(b)-Number(a));}
 const api={key,label,cohorts};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NotesContext=api;
})(typeof globalThis!=='undefined'?globalThis:this);
