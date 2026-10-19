import test from 'node:test';
import assert from 'node:assert/strict';
import {main} from '../bin/aion-local.mjs';

const fixture=({engine=true,granted=true}={})=>{
 const stats={sends:0,observes:0};
 const runtime={
   statePath:'/tmp/aion-test',engine:engine?{ok:true,endpoint:'http://127.0.0.1:4096'}:{ok:false,reason:'unavailable'},
   refresh:async()=>granted,close:async()=>{},
   bus:{status:async()=>({kill:{engaged:false},seq:0,agents:[],commands:[]}),
        kill:async()=>({engaged:true}),resume:async()=>({engaged:false})},
   plane:{
     sendAlias:async()=>{stats.sends++;return{ok:true,operation_id:'EXACT1234'};},
     waitForIdle:async()=>{},
     handle:async(_method,params)=>{
       stats.observes++;
       return{ok:true,result:{operation_id:params.operation_id,
         status:stats.observes===1?'AWAITING_REPLY':'REPLY_OBSERVED',terminal:false}};
     }
   }
 };
 return {runtime,stats};
};
test('one local CLI send leads to one dispatch and read-only observations',async()=>{
 const {runtime,stats}=fixture();const lines=[];
 const status=await main(['send','opencode','hello'],
  {open:async()=>runtime,probe:async()=>runtime.engine,print:x=>lines.push(x),pause:async()=>{}});
 assert.equal(status,0);assert.equal(stats.sends,1);assert.equal(stats.observes,2);
 assert.equal(JSON.parse(lines[0]).code,'RESULT_OBSERVED');
});
test('missing engine refuses before command admission',async()=>{
 const {runtime,stats}=fixture({engine:false});const lines=[];
 const status=await main(['send','opencode','hello'],{open:async()=>runtime,print:x=>lines.push(x)});
 assert.equal(status,3);assert.equal(stats.sends,0);
 assert.equal(JSON.parse(lines[0]).code,'ENGINE_NOT_CONNECTED');
});
test('unavailable Chrome is never silently routed into OpenCode',async()=>{
 const {runtime,stats}=fixture();const lines=[];
 const status=await main(['send','chief','hello'],{open:async()=>runtime,print:x=>lines.push(x)});
 assert.equal(status,3);assert.equal(stats.sends,0);
 assert.equal(JSON.parse(lines[0]).code,'BROWSER_CONNECTOR_NOT_CONNECTED');
});
test('direct detach refuses before dispatch and requires actual broker',async()=>{
 const {runtime,stats}=fixture();const lines=[];
 const status=await main(['send','opencode','hello','--detach'],{open:async()=>runtime,print:x=>lines.push(x)});
 assert.equal(status,2);assert.equal(stats.sends,0);
 assert.equal(JSON.parse(lines[0]).code,'DETACH_REQUIRES_BROKER');
});
test('selftest works with no broker and propagates local failure',async()=>{
 const lines=[];const exit=await main(['selftest'],{print:x=>lines.push(x),
   tests:()=>({schema:'aion.selftest/1',all_pass:false,suites:[{state:'FAIL'}]})});
 assert.equal(exit,1);assert.equal(JSON.parse(lines[0]).all_pass,false);
});
