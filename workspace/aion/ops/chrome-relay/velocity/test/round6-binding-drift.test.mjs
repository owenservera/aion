// Two TOCTOU gates for the real Bus, not a new lock or fake router.
// A changed conversation identity can never redirect a previously accepted send.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createBus} from '../../extension/src/bus/bus.js';
import {ADAPTER_MANIFEST_SCHEMA,AGENT_KIND,REASON} from '../../extension/src/bus/contracts.js';
import {createFileStorage} from '../../bus/node-storage.js';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

async function fixture(root) {
 let calls=0;
 const adapter={
   manifest:{schema:ADAPTER_MANIFEST_SCHEMA,name:'fixture.chrome',version:'0.1.0',
     kind:AGENT_KIND.CONVERSATION,provider:'fixture.invalid',
     capabilities:{deliver:true,observe:true,cancel:false,report_target:true,
       max_text_chars:2000,concurrency:1,durable_readback:true,live_verified:false}},
   canonicalRef:v=>{
     if(!['fixture://first','fixture://second'].includes(v))throw new Error('unrecognized fixture');
     return v;
   },
   deliver:async()=>{calls++;return{outcome:'sent'};},
   observe:async()=>({outcome:'pending'})
 };
 const bus=createBus({storage:createFileStorage(join(root,'ledger.json')),adapters:[adapter]});
 await bus.bind('role-05',{adapter:'fixture.chrome',ref:'fixture://first',confirmed_by:'fixture-owner'});
 await bus.grant({grant_id:'fixture-scope',ref:'fixture-grant',agents:['role-05'],
    ops:['send'],max_count:5,expires_utc:'2099-01-01T00:00:00.000Z'});
 return {bus,calls:()=>calls};
}
const command=(nonce,guard)=>({op:'send',to:'role-05',text:'safe fixture send',
 nonce,origin_kind:'operator_cli',origin_ref:'fixture-owner',target_guard:guard});
const bound=s=>({revision:s.agents['role-05'].revision,
 adapter:s.agents['role-05'].binding.adapter,ref:s.agents['role-05'].binding.ref});

test('changed revision is denied atomically at durable reservation',async()=>{
 const root=mkdtempSync(join(tmpdir(),'aion-b-binding-a-'));
 try{
   const {bus,calls}=await fixture(root);
   const before=bound(await bus.store.read());
   await bus.pause('role-05',true);
   const result=await bus.ingestStructured(command('nonce_drift_before_1',before));
   assert.equal(result.accepted,false);
   assert.equal(result.reason,REASON.BINDING_CHANGED);
   assert.equal((await bus.status()).commands.length,0);
   assert.equal((await bus.status()).grants[0].used_count,0);
   assert.equal(calls(),0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('rebind after reservation halts before external call; no wrong-target send',async()=>{
 const root=mkdtempSync(join(tmpdir(),'aion-b-binding-b-'));
 try{
   const {bus,calls}=await fixture(root);
   const guard=bound(await bus.store.read());
   const reserved=await bus.ingestStructured(command('nonce_drift_after_2',guard));
   assert.equal(reserved.accepted,true);
   await bus.unbind('role-05');
   await bus.bind('role-05',{adapter:'fixture.chrome',ref:'fixture://second',
     confirmed_by:'fixture-owner-rebind'});
   const result=await bus.dispatch(reserved.command_id);
   assert.equal(result.dispatched,false);
   const c=await bus.readCommand(reserved.command_id);
   assert.equal(c.state,'HALTED');
   assert.equal(c.reason,REASON.BINDING_CHANGED);
   assert.equal(c.text,null);
   assert.equal(c.attempted,false);
   assert.equal(calls(),0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('concurrent different nonces for same target yield one durable reservation',async()=>{
 const root=mkdtempSync(join(tmpdir(),'aion-b-binding-c-'));
 try{
   const {bus,calls}=await fixture(root);
   const guard=bound(await bus.store.read());
   const [a,b]=await Promise.all([
     bus.ingestStructured(command('nonce_concurrent_a_123',guard)),
     bus.ingestStructured(command('nonce_concurrent_b_456',guard))
   ]);
   assert.equal([a,b].filter(x=>x.accepted).length,1);
   assert.equal([a,b].filter(x=>!x.accepted)[0].reason,REASON.TARGET_BUSY);
   assert.equal((await bus.status()).grants[0].used_count,1);
   assert.equal(calls(),0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
