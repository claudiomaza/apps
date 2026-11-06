'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'app.js'),'utf8');
const calls=[];
const pending=new Map();
const fakeState={date:new Date('2026-11-01T12:00:00-03:00'),events:[],monthCache:{}};
const session={};
let loadCalls=0;
const elements={
 '#sync-button':{dataset:{},disabled:false,addEventListener(){},onclick:null},'#sync-state':{textContent:''},
 '#toast':{dataset:{},classList:{add(){},remove(){}},append(){},replaceChildren(){},style:{}},
 '#events':{innerHTML:'',addEventListener(){}},'#connection':{textContent:'',className:''},'#login-panel':{hidden:false},'#app-content':{hidden:true},
};
const document={querySelector:s=>elements[s]||{textContent:'',dataset:{},classList:{add(){},remove(){}},append(){},replaceChildren(){},style:{},style:{},hidden:false,disabled:false,addEventListener(){},querySelector(){return this},querySelectorAll(){return[]},elements:{reminderMinutes:{addEventListener(){},value:'60'},repeat:{addEventListener(){},value:'none'},repeatUnit:{addEventListener(){}},repeatEnd:{addEventListener(){}},},reset(){},showModal(){},close(){},click(){},focus(){},setAttribute(){},removeAttribute(){},reportValidity(){return true}},querySelectorAll:()=>[],createElement:()=>({classList:{add(){},remove(){}},setAttribute(){},append(){},style:{}}),body:{append(){}}};
const context={console,Date,JSON,Math,Number,String,Array,Object,Set,Map,Error,RegExp,Promise,Uint8Array,TextDecoder,TextEncoder,crypto:{randomUUID:()=>`uuid-${Math.random()}`,subtle:{digest:async()=>new Uint8Array(32).buffer}},Intl,setTimeout,clearTimeout,requestAnimationFrame:f=>f(),URL,AbortController,sessionStorage:{getItem:k=>session[k]||'',setItem:(k,v)=>session[k]=v,removeItem:k=>delete session[k]},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},window:{APP_CONFIG:{API_URL:'test'},addEventListener(){},navigator:{}},navigator:{},document,confirm:()=>true,StageStore:{async replace(app,owner,items){pending.clear();for(const x of items)pending.set(x.eventId,x)},async list(){return [...pending.values()]}},fetch:async(_url,opts)=>{const body=JSON.parse(opts.body);calls.push(body);let result;if(body.action==='getOperation')result={ok:true,found:false};else if(body.action==='getEvent')result={ok:true,found:false};else if(body.action==='create')result={ok:true,record:{eventId:body.eventId,version:1,...body.changes}};else if(body.action==='list'){loadCalls++;result={ok:true,records:[],calendarName:'QA'};}else result={ok:true};return{json:async()=>result};}};
context.window.document=document;
context.window.location={origin:'https://example.test'};
vm.runInNewContext(source+';globalThis.__stageEvent=stageEvent;globalThis.__syncPending=syncPending;globalThis.__setOwner=x=>{stageOwner=x};globalThis.__setAuth=x=>{sessionToken=x};',context);context.__setOwner('owner-a');
(async()=>{
  await context.__stageEvent({action:'create',eventId:'event-1',changes:{title:'QA'}});
  assert.equal(calls.length,0,'staging a create must make no backend mutation');
  assert.equal(pending.size,1,'staged create must persist to IndexedDB adapter');
  context.__setAuth('test-session');await context.__syncPending();
  assert.equal(calls.filter(x=>x.action==='create').length,1,'explicit Sync sends create once');
  assert.equal(pending.size,0,'confirmed create is removed from stage');
  const deletes=calls.filter(x=>x.action==='delete');assert.equal(deletes.length,0);
  console.log('Calendar local stage, explicit sync, success removal tests PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
