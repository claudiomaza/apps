'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'app.js'),'utf8');
function harness(overrides={}){
  const calls=[],pending=new Map(),session={},elements={
    '#sync-button':{dataset:{},disabled:false,addEventListener(){},onclick:null},'#sync-state':{textContent:''},
    '#toast':{dataset:{},classList:{add(){},remove(){}},append(){},replaceChildren(){},style:{}},
    '#events':{innerHTML:'',addEventListener(){}},'#connection':{textContent:'',className:''},'#login-panel':{hidden:false},'#app-content':{hidden:true},
  };
  const fallback={textContent:'',dataset:{},classList:{add(){},remove(){}},append(){},replaceChildren(){},style:{},hidden:false,disabled:false,addEventListener(){},querySelector(){return this},querySelectorAll(){return[]},elements:{reminderMinutes:{addEventListener(){},value:'60'},repeat:{addEventListener(){},value:'none'},repeatUnit:{addEventListener(){}},repeatEnd:{addEventListener(){}},},reset(){},showModal(){},close(){},click(){},focus(){},setAttribute(){},removeAttribute(){},reportValidity(){return true}};
  const document={querySelector:s=>elements[s]||fallback,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({classList:{add(){},remove(){}},setAttribute(){},append(){},style:{}}),body:{append(){}}};
  const context={console,Date,JSON,Math,Number,String,Array,Object,Set,Map,Error,RegExp,Promise,Uint8Array,TextDecoder,TextEncoder,crypto:{randomUUID:()=>`uuid-${Math.random()}`,subtle:{digest:async()=>new Uint8Array(32).buffer}},Intl,setTimeout,clearTimeout,requestAnimationFrame:f=>f(),URL,AbortController,sessionStorage:{getItem:k=>session[k]||'',setItem:(k,v)=>session[k]=v,removeItem:k=>delete session[k]},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},window:{APP_CONFIG:{API_URL:'test'},addEventListener(){},navigator:{}},navigator:{},document,confirm:overrides.confirm||(()=>true),StageStore:{async replace(app,owner,items){pending.clear();for(const x of items)pending.set(x.eventId,x)},async list(){return [...pending.values()]}},fetch:async(_url,opts)=>{const body=JSON.parse(opts.body);calls.push(body);if(overrides.fetch)return overrides.fetch(body,calls);let result;if(body.action==='getOperation')result={ok:true,found:false};else if(body.action==='getEvent')result={ok:true,found:false};else if(body.action==='create')result={ok:true,record:{eventId:body.eventId,version:1,...body.changes}};else if(body.action==='list')result={ok:true,records:[],calendarName:'QA'};else result={ok:true};return{json:async()=>result};}};
  context.window.document=document;context.window.location={origin:'https://example.test'};
  vm.runInNewContext(source+';globalThis.__stageEvent=stageEvent;globalThis.__syncPending=syncPending;globalThis.__setOwner=x=>{stageOwner=x};globalThis.__setAuth=x=>{sessionToken=x};',context);context.__setOwner('owner-a');context.__setAuth('test-session');
  return {context,calls,pending};
}
(async()=>{
  {
    const h=harness();await h.context.__stageEvent({action:'create',eventId:'event-create',changes:{title:'QA'}});
    assert.equal(h.calls.length,0,'staging does not mutate the backend');await h.context.__syncPending();
    assert.equal(h.calls.filter(x=>x.action==='create').length,1,'explicit Sync sends create once');assert.equal(h.pending.size,0,'confirmed create leaves the stage');
  }
  {
    const h=harness({confirm:()=>false,fetch:async(body)=>{if(body.action==='getOperation')return{json:async()=>({ok:true,found:false})};if(body.action==='getEvent')return{json:async()=>({ok:true,found:true,record:{eventId:'event-edit',version:2,status:'ACTIVE',title:'Remote'}})};return{json:async()=>({ok:true})};}});
    await h.context.__stageEvent({action:'update',eventId:'event-edit',expectedVersion:1,changes:{title:'Local'}});await h.context.__syncPending();
    assert.equal(h.calls.some(x=>x.action==='update'),false,'declined conflict never writes');assert.equal(h.pending.size,1,'declined conflict keeps staged edit');
  }
  {
    let confirmCount=0;const h=harness({confirm:()=>{confirmCount++;return true;},fetch:async(body)=>{if(body.action==='getOperation')return{json:async()=>({ok:true,found:false})};if(body.action==='getEvent')return{json:async()=>({ok:true,found:true,record:{eventId:'event-rebase',version:3,status:'ACTIVE',title:'Remote'}})};if(body.action==='update')return{json:async()=>({ok:true,record:{eventId:body.eventId,version:4}})};return{json:async()=>({ok:true,records:[],calendarName:'QA'})};}});
    await h.context.__stageEvent({action:'update',eventId:'event-rebase',expectedVersion:2,changes:{title:'Local'}});const firstKey=h.pending.get('event-rebase').stageId;await h.context.__syncPending();
    const sent=h.calls.find(x=>x.action==='update');assert.equal(confirmCount,1,'stale edit requires explicit approval');assert.equal(sent.expectedVersion,3,'approved edit rebases to current version');assert.notEqual(sent.idempotencyKey,firstKey,'rebased edit receives a fresh idempotency key');assert.equal(h.pending.size,0,'confirmed rebased edit leaves stage');
  }
  {
    const h=harness({fetch:async(body)=>{if(body.action==='getOperation')return{json:async()=>({ok:true,found:true,state:'DONE'})};return{json:async()=>({ok:true})};}});
    await h.context.__stageEvent({action:'create',eventId:'event-done',changes:{title:'Already committed'}});await h.context.__syncPending();
    assert.equal(h.calls.some(x=>x.action==='create'),false,'journal DONE is reconciled without replay');assert.equal(h.pending.size,0,'journal DONE removes confirmed stage');
  }
  {
    let unknown=false;const h=harness({fetch:async(body)=>{if(body.action==='getOperation')return{json:async()=>unknown?{ok:true,found:true,state:'UNKNOWN'}:{ok:true,found:false}};if(body.action==='getEvent')return{json:async()=>({ok:true,found:false})};if(body.action==='create'){unknown=true;throw Error('REQUEST_TIMEOUT');}return{json:async()=>({ok:true})};}});
    await h.context.__stageEvent({action:'create',eventId:'event-ambiguous',changes:{title:'Maybe committed'}});await h.context.__syncPending();
    assert.equal(h.pending.size,1,'ambiguous create remains staged');assert.equal(h.calls.filter(x=>x.action==='create').length,1,'first attempt happened once');await h.context.__syncPending();
    assert.equal(h.calls.filter(x=>x.action==='create').length,1,'UNKNOWN journal blocks blind retry');assert.equal(h.pending.size,1,'UNKNOWN operation is retained for reconciliation');
  }
  {
    const h=harness({fetch:async(body)=>{if(body.action==='getOperation')return{json:async()=>({ok:true,found:false})};if(body.action==='getEvent')return{json:async()=>({ok:true,found:true,record:{eventId:'event-same',version:1,status:'ACTIVE',title:'Same'}})};return{json:async()=>({ok:true})};}});
    await h.context.__stageEvent({action:'create',eventId:'event-same',changes:{title:'Same'}});await h.context.__syncPending();
    assert.equal(h.calls.some(x=>x.action==='create'),false,'matching existing create is reconciled without duplicate');assert.equal(h.pending.size,0,'matching existing record clears stage');
  }
  console.log('Calendar stage/sync tests PASS: success, conflict decline, approved rebase, DONE reconciliation, UNKNOWN no-retry, idempotent existing create');
})().catch(e=>{console.error(e);process.exitCode=1;});
