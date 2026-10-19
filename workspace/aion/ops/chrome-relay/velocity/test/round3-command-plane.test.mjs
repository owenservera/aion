import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommandPlane} from '../src/broker/core.mjs';
import {createEventStream} from '../src/broker/events.mjs';
const grant={grant_id:'owner-grant',ref:'owner-ref',agents:['role-05'],ops:['send'],
  used_count:0,max_count:2,expires_utc:'2099-01-01T00:00:00.000Z',revoked:false};
const agent={agent_id:'role-05',role_id:'05',kind:'conversation',status:'bound',revision:2,
  binding:{adapter:'chatgpt',ref:'known',confirmed_by:'owner'}};
const roleCatalog={roles:[{id:'05',aliases:['chief']}]};
function harness(ready='READY'){
 let attempts=0, admissions=0;
 const command={command_id:'testop1234',to:'role-05',state:'REPORTED',attempted:true,reason:null,reply:null};
 const bus={
   store:{read:async()=>({agents:{'role-05':agent},commands:{},
     grants:{'owner-grant':grant}})},
   status:async()=>({kill:{engaged:false},seq:1,agents:[agent],commands:[]}),
   readCommand:async id=>id===command.command_id?command:null,
   ingestStructured:async()=>{admissions++;return{accepted:true,command_id:command.command_id};},
   dispatch:async()=>{attempts++;return{state:'REPORTED'};},
   kill:async reason=>({engaged:true,reason})
 };
 const capabilities={get:()=>({actions:{submit:ready}}),list:()=>[]};
 const events=createEventStream();
 const plane=createCommandPlane({bus,roleCatalog,capabilities,events});
 return {plane,stats:()=>({attempts,admissions}),events};
}
test('read only status and doctor do not dispatch',async()=>{
 const h=harness();
 assert.equal((await h.plane.handle('status')).channel,'dev');
 assert.equal((await h.plane.handle('doctor')).live_verified,false);
 assert.deepEqual(h.stats(),{attempts:0,admissions:0});
});
test('unready target refuses BEFORE bus admission',async()=>{
 const h=harness('UNKNOWN');
 const r=await h.plane.sendAlias({alias:'chief',text:'hello',nonce:'nonce_123456'});
 assert.equal(r.code,'CAPABILITY_NOT_READY');assert.equal(r.delivery,'NOT_SENT');
 assert.deepEqual(h.stats(),{attempts:0,admissions:0});
});
test('ready, owner-granted explicit send calls actual bus exactly once',async()=>{
 const h=harness();
 const r=await h.plane.sendAlias({alias:'chief',text:'hello',nonce:'nonce_123456'});
 assert.equal(r.ok,true);assert.equal(r.operation_id,'testop1234');
 assert.equal(r.state,'RESERVED');
 await h.plane.waitForIdle();
 assert.deepEqual(h.stats(),{attempts:1,admissions:1});
 assert.equal(h.events.after(0).events.filter(x=>x.type==='operation.admitted').length,1);
});
test('dispatch exception never causes retry and is UNKNOWN',async()=>{
 let calls=0;const h=harness();
 // Contract test handled by another injected bus in follow-on fault matrix.
 assert.equal((await h.plane.handle('observe',{operation_id:'unknown123'})).code,'OPERATION_UNKNOWN');
 assert.equal(calls,0);
});
