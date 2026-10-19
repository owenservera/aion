import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {runDevHost} from '../src/native-host/relay.mjs';
import {encodeNativeFrame} from '../../bridge/src/framing.js';

const DEV_ID='b'.repeat(32);
async function harness({forwardTimeoutMs=30}={}){
 const stdin=new PassThrough(),stdout=new PassThrough();
 let onRequest,closed=0;
 const host=await runDevHost({
   argv:['chrome-extension://'+DEV_ID+'/'],stdin,stdout,
   stateDir:'/fixture/owned-only',expectedExtensionId:DEV_ID,
   forwardTimeoutMs,
   startEndpoint:async options=>{
     onRequest=options.onRequest;
     return {session_id:'fixture-session',close:async()=>{closed++;}};
   }
 });
 stdin.write(encodeNativeFrame({type:'aion.b.hello'}));
 for(let i=0;i<100&&!onRequest;i++)await new Promise(r=>setTimeout(r,1));
 assert.equal(typeof onRequest,'function');
 return {host,stdin,stdout,request:onRequest,get closed(){return closed}};
}
test('silent Chrome worker returns bounded UNKNOWN rather than leaving a hanging promise',async()=>{
 const h=await harness({forwardTimeoutMs:15});
 await assert.rejects(h.request({call_type:'aion.b.ping',payload:{}}),{code:'WORKER_REPLY_TIMEOUT'});
 await h.host.shutdown('test');
 assert.equal(h.closed,1);
});
test('host refuses overload without forwarding a new native call',async()=>{
 const h=await harness({forwardTimeoutMs:1000});
 const waiting=Array.from({length:32},()=>h.request({call_type:'aion.b.ping',payload:{}}));
 await assert.rejects(h.request({call_type:'aion.b.ping',payload:{}}),{code:'HOST_BUSY'});
 await h.host.shutdown('test');
 const outcomes=await Promise.allSettled(waiting);
 assert.equal(outcomes.filter(o=>o.status==='rejected').length,32);
 assert.equal(h.closed,1);
});
test('invalid bounded timeout is refused before host startup',async()=>{
 await assert.rejects(runDevHost({argv:[],stdin:new PassThrough(),stdout:new PassThrough(),
  expectedExtensionId:DEV_ID,forwardTimeoutMs:0}),RangeError);
});
