// Integration test against the ACTUAL AION Bus V1/V2 and its durable file
// storage. The provider is an explicitly fake fixture, never a real Chrome tab.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createBus} from '../../extension/src/bus/bus.js';
import {ADAPTER_MANIFEST_SCHEMA,AGENT_KIND} from '../../extension/src/bus/contracts.js';
import {createFileStorage} from '../../bus/node-storage.js';
import {createCommandPlane} from '../src/broker/core.mjs';
import {createCapabilityIndex} from '../src/broker/capabilities.mjs';
import {createEventStream} from '../src/broker/events.mjs';

const catalog={roles:[{id:'05',aliases:['05','chief']}]};
function fakeAdapter(counter,behavior='sent') {
  return {
    manifest: {
      schema:ADAPTER_MANIFEST_SCHEMA,name:'fake.chrome',version:'0.1.0',
      kind:AGENT_KIND.CONVERSATION,provider:'fixture.invalid',
      capabilities:{deliver:true,observe:true,cancel:false,report_target:true,
        max_text_chars:2000,concurrency:1,durable_readback:true,live_verified:false}
    },
    canonicalRef:(ref)=>{
      if(ref!=='fixture://role-05')throw new Error('bad fixture ref');
      return ref;
    },
    async deliver(req){
      counter.deliver++;
      counter.requests.push({id:req.command_id,correlation:req.correlation_id,
        text:req.text,ref:req.binding.ref});
      if(behavior==='throw')throw new Error('transport lost AFTER attempt');
      return behavior==='reply'
        ? {outcome:'reply',reply:'AION test fixture reply'}
        : {outcome:'sent'};
    },
    async observe(req){
      counter.observe++;
      assert.equal(typeof req.correlation_id,'string');
      return {outcome:'reply',reply:'AION test fixture reply'};
    }
  };
}
async function setup(root,behavior='sent'){
  const counter={deliver:0,observe:0,requests:[]};
  const storage=createFileStorage(join(root,'dev-only-ledger.json'));
  const adapter=fakeAdapter(counter,behavior);
  const bus=createBus({storage,adapters:[adapter]});
  await bus.bind('role-05',{adapter:'fake.chrome',ref:'fixture://role-05',
    confirmed_by:'fixture-only-owner-confirmation'});
  await bus.grant({grant_id:'fixture-owner-grant',ref:'fixture-only-grant',
    agents:['role-05'],ops:['send'],max_count:3,rate_per_hour:10,
    expires_utc:'2099-01-01T00:00:00.000Z'});
  await bus.setConfig({report_back:false});
  const events=createEventStream();
  const capabilities=createCapabilityIndex({publish:(type,p)=>events.publish(type,p)});
  capabilities.record({target:'agent:role-05',endpoint:'fixture:dev-only',
    observed_utc:new Date().toISOString(),health:'CONNECTED',
    identity_verified:true,authority:'GRANTED',
    submit_actuation_verified:true,actions:{inspect:'READY',submit:'READY'}});
  const plane=createCommandPlane({bus,roleCatalog:catalog,capabilities,events});
  return {bus,counter,adapter,plane,events};
}

test('actual Bus: admit once, persist text deletion, observe once, restart cannot resend',async()=>{
  const root=mkdtempSync(join(tmpdir(),'aion-b-round6-'));
  try{
    const h=await setup(root,'sent');
    const sent=await h.plane.sendAlias({alias:'chief',text:'hello fixture',
      nonce:'fixture_nonce_1234'});
    assert.equal(sent.ok,true);
    assert.equal(sent.code,'ADMITTED');
    assert.match(sent.operation_id,/^[a-z0-9]{8,40}$/);
    await h.plane.waitForIdle();
    assert.equal(h.counter.deliver,1,'one external adapter invocation');
    const c=await h.bus.readCommand(sent.operation_id);
    assert.equal(c.attempted,true);
    assert.equal(c.text,null,'prompt irreversibly removed after attempt');
    assert.equal(c.state,'SUBMISSION_OBSERVED');
    const prior=await h.plane.sendAlias({alias:'chief',text:'hello fixture',
      nonce:'fixture_nonce_1234'});
    assert.equal(prior.code,'NONCE_REPLAYED');
    assert.equal(prior.operation_id,sent.operation_id);
    assert.equal(h.counter.deliver,1);
    const other=await h.plane.sendAlias({alias:'chief',text:'a second task',
      nonce:'fixture_nonce_5678'});
    assert.equal(other.code,'TARGET_BUSY','open operation locks bound conversation');
    assert.equal(h.counter.deliver,1);
    await h.bus.observe(sent.operation_id); // read-only provider observation
    const observed=await h.plane.handle('observe',{operation_id:sent.operation_id});
    assert.equal(observed.result.status,'REPLY_OBSERVED');
    assert.equal(observed.result.delivery,'REPLY_OBSERVED');
    assert.equal(h.counter.deliver,1);
    const restarted=createBus({storage:createFileStorage(join(root,'dev-only-ledger.json')),
      adapters:[h.adapter]});
    const skip=await restarted.dispatch(sent.operation_id);
    assert.equal(skip.dispatched,false);
    assert.equal(h.counter.deliver,1,'restart must not replay prompt');
    const check=await restarted.readCommand(sent.operation_id);
    assert.equal(check.text,null);
    const disk=readFileSync(join(root,'dev-only-ledger.json'),'utf8');
    assert.equal(disk.includes('hello fixture'),false,'no plaintext sent prompt on disk');
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('actual Bus: adapter exception after dispatch means UNKNOWN and no retry',async()=>{
  const root=mkdtempSync(join(tmpdir(),'aion-b-uncertain-'));
  try{
    const h=await setup(root,'throw');
    const first=await h.plane.sendAlias({alias:'chief',text:'no retry',
      nonce:'fixture_nonce_throw'});
    assert.equal(first.ok,true);
    await h.plane.waitForIdle();
    assert.equal(h.counter.deliver,1);
    const c=await h.bus.readCommand(first.operation_id);
    assert.equal(c.state,'UNRESOLVED');
    assert.equal(c.attempted,true);
    assert.equal(c.text,null);
    const again=await h.bus.dispatch(first.operation_id);
    assert.equal(again.dispatched,false);
    assert.equal(h.counter.deliver,1);
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('actual Bus: preflight refusal does not reserve, dispatch or consume grant',async()=>{
  const root=mkdtempSync(join(tmpdir(),'aion-b-no-send-'));
  try{
    const h=await setup(root,'sent');
    h.plane= createCommandPlane({bus:h.bus,roleCatalog:catalog,
      capabilities:{get:()=>({actions:{submit:'UNKNOWN'}}),list:()=>[]},events:h.events});
    const rejected=await h.plane.sendAlias({alias:'chief',text:'refuse',
      nonce:'fixture_nonce_refuse'});
    assert.equal(rejected.code,'CAPABILITY_NOT_READY');
    assert.equal(rejected.delivery,'NOT_SENT');
    assert.equal(h.counter.deliver,0);
    const status=await h.bus.status();
    assert.equal(status.commands.length,0);
    assert.equal(status.grants[0].used_count,0);
  }finally{rmSync(root,{recursive:true,force:true});}
});
