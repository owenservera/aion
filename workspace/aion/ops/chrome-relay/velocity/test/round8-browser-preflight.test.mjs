import test from 'node:test';
import assert from 'node:assert/strict';
import {runBrowserPreflight} from '../src/browser/preflight.mjs';
import {CHATGPT_ADAPTER} from '../../extension/src/bus/adapters/chatgpt.js';

const ID='b'.repeat(32), REF='https://chatgpt.com/c/test-role-five';
function harness({connected=true,bound=true,grant=true,tabs=[{tab_id:7,url:REF}],busy=false,
  stop=false,wrongId=false}={}){
 let opened=0,closed=0,reads=0,mutations=0;
 const agent={agent_id:'role-05',kind:'conversation',role_id:'05',status:bound?'bound':'unbound',revision:1,
   binding:bound?{adapter:CHATGPT_ADAPTER,ref:REF,confirmed_by:'owner'}:null};
 const grants=grant?{'g1':{grant_id:'g1',ref:'owner',agents:['role-05'],ops:['send'],
   max_count:1,used_count:0,rate_per_hour:10,revoked:false,expires_utc:'2099-01-01T00:00:00.000Z'}}:{};
 const state={kill:{engaged:stop},agents:{'role-05':agent},grants,commands:busy?{
    op1:{command_id:'op1',to:'role-05',state:'UNRESOLVED'}}:{}};
 const rt={browser:connected?{
   ok:true,extension_id:wrongId?'c'.repeat(32):ID,
   link:{request:async type=>{reads++;assert.equal(type,'aion/chatgpt-tabs');return{ok:true,tabs};}}
 }:{ok:false,state:'NOT_CONNECTED',reason:'HOST_NOT_RUNNING'},
 bus:{store:{read:async()=>state}},
 roleCatalog:{roles:[{id:'05',aliases:['chief']}]},
 async close(){closed++;}};
 return {opts:{stateDir:'/tmp/track-b',
   inspect:()=>({ok:true,extension_id:ID}),
   open:async()=>{opened++;return rt;}},get stats(){return {opened,closed,reads,mutations};}};
}
test('readiness is NOT a claim that a real Send has already worked',async()=>{
 const h=harness(),r=await runBrowserPreflight(h.opts);
 assert.equal(r.ok,true);
 assert.equal(r.code,'READY_FOR_OWNER_LIVE_TEST');
 assert.equal(r.live_send_verified,false);
 assert.equal(r.send_actuation,'NOT_YET_LIVE_VERIFIED');
 assert.equal(h.stats.reads,1);
 assert.equal(h.stats.closed,1);
});
test('not installed: no Bus opens, no Chrome calls',async()=>{
 const h=harness();h.opts.inspect=()=>({ok:false,code:'SETUP_NOT_APPLIED'});
 const r=await runBrowserPreflight(h.opts);
 assert.equal(r.stage,'SETUP');assert.equal(h.stats.opened,0);assert.equal(r.ok,false);
});
test('missing host, wrong extension and unbound role all refuse',async()=>{
 for(const settings of [{connected:false},{wrongId:true},{bound:false}]){
   const h=harness(settings);
   const r=await runBrowserPreflight(h.opts);
   assert.equal(r.ok,false);assert.equal(r.live_send_verified,false);
   assert.equal(h.stats.closed,1);
 }
});
test('grant missing, target duplicate and unresolved operation refuse',async()=>{
 for(const settings of [{grant:false},{tabs:[{tab_id:2,url:REF},{tab_id:3,url:REF}]},{busy:true},{stop:true}]){
   const h=harness(settings);
   const r=await runBrowserPreflight(h.opts);
   assert.equal(r.ok,false);assert.notEqual(r.next_action,undefined);
   assert.equal(h.stats.closed,1);
 }
});
test('preflight does not submit, admit, bind or create grants',async()=>{
 const h=harness();
 const r=await runBrowserPreflight(h.opts);
 assert.equal(r.ok,true);assert.equal(h.stats.mutations,0);
});

test('foreign registered host never prompts the owner to overwrite it',async()=>{
 const h=harness();h.opts.inspect=()=>({ok:false,code:'FOREIGN_DEV_REGISTRATION'});
 const result=await runBrowserPreflight(h.opts);
 assert.equal(result.ok,false);
 assert.equal(result.stage,'SETUP');
 assert.match(result.next_action,/do not overwrite/i);
 assert.equal(h.stats.opened,0);
});
