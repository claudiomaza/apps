'use strict';
const assert=require('node:assert/strict');
const Gradebook=require('../gradebook.js');
const student=(cohortYear)=>({recordId:'student::s1',type:'student',id:'s1',data:{studentId:'S1',fullName:'Ana',...(cohortYear===undefined?{}:{cohortYear})}});
assert.doesNotThrow(()=>Gradebook.validateRecord(student('2026')));
assert.doesNotThrow(()=>Gradebook.validateRecord(student(undefined)),'old records stay valid when cohort is missing');
for(const invalid of ['26','202A','1899','2101',' 2026'])assert.throws(()=>Gradebook.validateRecord(student(invalid)),/INVALID_STUDENT/);
console.log('PASS: entry cohort accepts only valid four-digit years and preserves legacy records without cohort.');
