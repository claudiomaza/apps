/* Per-app, per-user durable outbox. Never stores auth/session credentials. */
(function(){
  'use strict';
  const DB='apps-stage-v1',STORE='mutations';let opening;
  function open(){return opening||(opening=new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(Error('INDEXEDDB_UNAVAILABLE'));return;}const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:['app','owner','recordId']});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('INDEXEDDB_OPEN_FAILED'));req.onblocked=()=>reject(Error('INDEXEDDB_BLOCKED'));}));}
  async function list(app,owner){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).getAll(IDBKeyRange.bound([app,owner,''],[app,owner,'\uffff']));req.onsuccess=()=>resolve(req.result.map(x=>x.payload));req.onerror=()=>reject(req.error||Error('INDEXEDDB_READ_FAILED'));tx.onabort=()=>reject(tx.error||Error('INDEXEDDB_READ_FAILED'));});}
  async function replace(app,owner,items){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),range=IDBKeyRange.bound([app,owner,''],[app,owner,'\uffff']),req=store.openCursor(range);req.onsuccess=()=>{const cursor=req.result;if(cursor){cursor.delete();cursor.continue();return;}for(const payload of items)store.put({app,owner,recordId:payload.recordId||payload.eventId,payload});};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('INDEXEDDB_WRITE_FAILED'));tx.onabort=()=>reject(tx.error||Error('INDEXEDDB_WRITE_FAILED'));});}
  window.StageStore={list,replace};
})();
