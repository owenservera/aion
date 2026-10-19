// Round 6: one CLI SEND leads to one Bus admission and OBSERVE-only follow.
// Stubbed transport is deliberate; no browser, no Windows and no provider used.
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCommand} from '../src/commands.mjs';
import {main,followOperation} from '../bin/aion.mjs';

test('one-command options parsed narrowly; no grant fields or hidden flags',()=>{
 assert.equal(parseCommand(['send','chief','hello','--detach']).detach,true);
 assert.equal(parseCommand(['send','chief','hello','--wait-ms','2500']).wait_ms,2500);
 assert.equal(parseCommand(['observe','ABCDEF1234','--follow']).follow,true);
 assert.throws(()=>parseCommand(['send','chief','hello','--follow']),/observe only/);
 assert.throws(()=>parseCommand(['status','--detach']),/send only/);
 assert.throws(()=>parseCommand(['send','chief','hello','--wait-ms','1']),/outside/);
 assert.throws(()=>parseCommand(['send','chief','hello','--grant','forged']),/unsupported option/);
});
test('one human command: one SEND, then read-only OBSERVE until correlated reply',async()=>{
 let sends=0,observes=0;
 const transport=async({request})=>{
   if(request.method==='send'){
     sends++;assert.equal(request.schema,'aion.control/1');
     assert.equal(request.params.alias,'chief');
     assert.equal(Object.hasOwn(request.params,'grant_ref'),false);
     return {ok:true,result:{ok:true,operation_id:'ABCDEF1234',state:'RESERVED'}};
   }
   assert.equal(request.method,'observe');
   observes++;
   return {ok:true,result:{ok:true,operation_id:'ABCDEF1234',
     result:{schema:'aion.result/1',operation_id:'ABCDEF1234',
       status:observes===1?'AWAITING_REPLY':'REPLY_OBSERVED',
       terminal:false,delivery:observes===1?'SENT_OBSERVED':'REPLY_OBSERVED'}}};
 };
 const messages=[];
 const code=await main(['send','chief','hello','--json'],{
   socketPath:'/fixture/dev.sock',transport,write:x=>messages.push(x)});
 assert.equal(code,0);assert.equal(sends,1);assert.equal(observes,2);
 assert.equal(JSON.parse(messages[0]).code,'RESULT_OBSERVED');
});
test('detach gives durable ID and never polls',async()=>{
 let sends=0,observes=0;
 const transport=async({request})=>{
   if(request.method==='send'){sends++;return{ok:true,result:{ok:true,operation_id:'ABCDEF1234'}};}
   observes++;throw Error('observe not permitted in detach');
 };
 const lines=[];
 const code=await main(['send','chief','hi','--detach','--json'],
   {socketPath:'/fixture/dev.sock',transport,write:x=>lines.push(x)});
 assert.equal(code,0);assert.equal(sends,1);assert.equal(observes,0);
 assert.equal(JSON.parse(lines[0]).result.operation_id,'ABCDEF1234');
});
test('uncertain SEND lost ACK never retries',async()=>{
 let sends=0;
 const transport=async()=>{
   sends++;throw Object.assign(new Error('lost ack'),{code:'RPC_TIMEOUT_OUTCOME_UNKNOWN'});
 };
 const lines=[];const status=await main(['send','chief','hi','--json'],
   {socketPath:'/fixture/dev.sock',transport,write:x=>lines.push(x)});
 assert.equal(status,3);assert.equal(sends,1);
 assert.equal(JSON.parse(lines[0]).code,'OUTCOME_UNKNOWN');
});
test('follow timeout preserves last evidence and never calls SEND',async()=>{
 let now=100000,observes=0;
 const r=await followOperation({operationId:'ABCDEF1234',socketPath:'/fixture',
   waitMs:1000,clock:()=>now,pause:async ms=>{now+=ms;},
   transport:async({request})=>{
     assert.equal(request.method,'observe');observes++;
     return {ok:true,result:{ok:true,result:{operation_id:'ABCDEF1234',
       status:'AWAITING_REPLY',terminal:false,delivery:'SENT_OBSERVED'}}};
   }});
 assert.equal(r.code,'WAIT_TIMEOUT');
 assert.equal(r.delivery,'SENT_OBSERVED');
 assert.ok(observes>0);
});
test('wrong-operation observation cannot settle requested task',async()=>{
 const r=await followOperation({operationId:'ABCDEF1234',socketPath:'/fixture',
   transport:async()=>({ok:true,result:{ok:true,
     result:{operation_id:'FOREIGN1234',status:'SUCCEEDED',terminal:true}}})});
 assert.equal(r.code,'CORRELATION_MISMATCH');
});
