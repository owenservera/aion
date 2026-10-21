import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveRole} from '../src/broker/roles.mjs';
import {createEventStream} from '../src/broker/events.mjs';
import {createCapabilityIndex} from '../src/broker/capabilities.mjs';
const at = Date.parse('2026-10-19T19:30:00Z');
const roleCatalog = {roles:[{id:'05',aliases:['chief','05']}]};
const agent = {agent_id:'role-05',role_id:'05',kind:'conversation',status:'bound',
  revision:4,binding:{adapter:'chatgpt',ref:'https://chatgpt.com/c/known',confirmed_by:'owner'}};
test('role aliases require real bound state and return revision',()=>{
  assert.deepEqual(resolveRole('chief',roleCatalog,{'role-05':agent}).target,'role-05');
  assert.equal(resolveRole('chief',roleCatalog,{'role-05':{...agent,binding:null}}).reason,'ROLE_UNBOUND');
  assert.equal(resolveRole('chief',roleCatalog,{}).reason,'ROLE_UNBOUND');
  assert.equal(resolveRole('not-a-role',roleCatalog,{'role-05':agent}).reason,'ALIAS_UNKNOWN');
});
test('ambiguous alias and duplicate role agents refuse',()=>{
  assert.equal(resolveRole('chief',{roles:[...roleCatalog.roles,...roleCatalog.roles]}, {'role-05':agent}).reason,'ALIAS_AMBIGUOUS');
  assert.equal(resolveRole('chief',roleCatalog,{'role-05':agent, other:{...agent,agent_id:'other'}}).reason,'ROLE_AMBIGUOUS');
});
test('event stream redacts prompt, has replay and gap detection',()=>{
  const bus=createEventStream({capacity:2,now:()=>new Date(at).toISOString()});
  const events=[]; const unsubscribe=bus.subscribe(e=>events.push(e));
  bus.publish('runtime.started',{prompt:'secret'});
  bus.publish('operation.admitted',{operation_id:'abc123',text:'secret'});
  bus.publish('operation.settled',{operation_id:'abc123',state:'REPORTED'});
  unsubscribe();
  assert.equal(bus.after(0).gap,true);assert.equal(bus.after(1).events.length,2);
  assert.equal(events[1].text,undefined);assert.equal(bus.head,3);
});
test('capability readiness expires, invalidates, and never guesses send',()=>{
  const emitted=[];const index=createCapabilityIndex({now:()=>at,ttlMs:2000,publish:(...a)=>emitted.push(a)});
  assert.equal(index.get('chatgpt:chief').actions.submit,'UNKNOWN');
  const r=index.record({target:'chatgpt:chief',endpoint:'dev',health:'CONNECTED',observed_utc:new Date(at-500).toISOString(),
    identity_verified:true,authority:'GRANTED',actions:{submit:'READY'},submit_actuation_verified:false});
  assert.equal(r.actions.submit,'UNVERIFIED');
  assert.equal(index.list().length,1);
  assert.equal(index.invalidate('chatgpt:chief'),true);
  assert.equal(index.get('chatgpt:chief').actions.submit,'UNKNOWN');
  assert.equal(emitted.length,2);
});
