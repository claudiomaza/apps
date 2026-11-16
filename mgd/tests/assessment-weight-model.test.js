'use strict';
const assert=require('node:assert/strict'),Gradebook=require('../gradebook.js');
const names=['Nota de Proceso 1','Nota de Proceso 2','Nota de Proceso 3','Autoevaluación','Evaluación Final'];
const equal=Gradebook.equalWeights(names.map(id=>({id,weight:0,weightLocked:false})));
assert.deepEqual(equal.map(x=>x.weight),[20,20,20,20,20]);
const oneFixed=Gradebook.allocateWeights([{id:'p1',weight:25,weightLocked:true},...names.slice(1).map((id,i)=>({id:`p${i+2}`,weight:0,weightLocked:false}))]);
assert.deepEqual(oneFixed.map(x=>x.weight),[25,18.75,18.75,18.75,18.75]);assert.equal(oneFixed.reduce((sum,x)=>sum+x.weight,0),100);
assert.throws(()=>Gradebook.allocateWeights([{id:'p1',weight:100,weightLocked:true},{id:'p2',weight:1,weightLocked:true}]),e=>e.message==='WEIGHT_REMAINDER');
console.log('Five assessment templates split 100%, redistribute remaining weight, and reject >100% fixed weights: PASS');
