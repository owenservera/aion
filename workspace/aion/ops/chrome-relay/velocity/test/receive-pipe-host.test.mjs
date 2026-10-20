// P3 receive pipe: the AUTHENTICATED host side.
//
// CLI (authenticated token) -> host -> native host -> worker, and the
// DATA-ONLY hint path back. Real sockets, real native framing, fake worker.
// No Chrome, no ChatGPT, no page, no live claim.
//
// What is proved here:
//   - the client's binding is a CLAIM: the owner decides, and with no owner
//     seam the host fails closed;
//   - read/replay need an OWNED subscription for the exact binding;
//   - a hint reaches ONLY the sockets subscribed to that exact binding;
//   - only validated P1 data leaves the host; errors carry FIXED codes only;
//   - a departing subscriber takes its subscription with it.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {privateStateDir} from '../fixtures/private-state-dir.mjs';
import {connectHost} from '../src/transport/local-ipc.mjs';
import {runDevHost,CONVERSATION_CALLS,WORKER_RECEIVE_CODES} from '../src/native-host/relay.mjs';
import {writeAccountRegistration,readAccountRegistration} from '../src/conversation/registration.mjs';
import {createReceiveCall,createReceiveEventStream} from '../src/browser/remote-call.mjs';
import {encodeNativeFrame,createNativeFrameDecoder} from '../../bridge/src/framing.js';
import {
  validateConversationBinding,validateConversationSnapshot,
} from '../../extension/src/lib/conversation-contract.js';

const DEV_ID='d'.repeat(32);
const LANE='lane-aaaaaaaaaaaaaaaa';
const OTHER_LANE='lane-bbbbbbbbbbbbbbbb';
const EMAIL='owner@example.com';
const BINDING={provider:'chatgpt.com',account_key:EMAIL,conversation_id:'c-123',ref:'ref-1',revision:1};
const OTHER_BINDING={...BINDING,conversation_id:'c-999',ref:'ref-999'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(predicate,{timeoutMs=5000,step=5}={}){
  const deadline=Date.now()+timeoutMs;
  while(Date.now()<deadline){
    if(predicate())return true;
    await sleep(step);
  }
  return false;
}

/** A fake Chrome + worker: answers native calls and can push native events. */
function fakeWorker({answer}){
  const stdin=new PassThrough(),stdout=new PassThrough();
  const seen=[];
  const dec=createNativeFrameDecoder({onMessage:async msg=>{
    seen.push(msg);
    if(msg.type==='aion.b.call'){
      const result=await answer(msg);
      if(result!==undefined)stdin.write(encodeNativeFrame({type:'aion.b.reply',id:msg.id,result}));
    }
  }});
  stdout.on('data',c=>dec.push(c));
  return {
    stdin,stdout,seen,
    hello:(lane_id=LANE)=>stdin.write(encodeNativeFrame({type:'aion.b.hello',lane_id})),
    pushEvent:event=>stdin.write(encodeNativeFrame({type:'aion.b.event',event})),
    callsOf:type=>seen.filter(m=>m.type==='aion.b.call'&&m.call_type===type),
    close:()=>stdin.end(),
  };
}

async function startHost(t,{answer=async()=>({ok:true}),readBinding=null,
  registered={lane_id:LANE,email:EMAIL},helloLane=LANE}={}){
  const stateDir=privateStateDir('aion-p3-host-');
  if(registered){
    const wrote=await writeAccountRegistration({stateDir,extension_id:DEV_ID,...registered});
    assert.equal(wrote.ok,true,'the owner registration is written through the real writer');
  }
  const w=fakeWorker({answer});
  const host=await runDevHost({
    argv:[`chrome-extension://${DEV_ID}/`],stdin:w.stdin,stdout:w.stdout,
    stateDir,expectedExtensionId:DEV_ID,readBinding,
    readRegistration:()=>readAccountRegistration({stateDir}),
  });
  assert.equal(host.ok,true);
  t.after(async()=>{
    try{await host.endpoint?.close();}catch{}
    try{w.close();}catch{}
    try{await host.shutdown('test');}catch{}
  });
  w.hello(helloLane);
  const opened=await waitFor(()=>Boolean(host.endpoint),{timeoutMs:20000});
  assert.ok(opened,'endpoint opened after the worker hello');
  return {stateDir,w,host};
}

const authorized=()=>({...BINDING});
const snapshotFor=binding=>({
  schema:'aion.conversation.snapshot/1',
  binding,
  page_epoch:'page-1',
  cursor:{epoch:'stream-1',sequence:1},
  observed_at_ms:1700000000000,
  messages:[],
  coverage:{complete_history:false,reason:'not_proven',bounded:true,ambiguous_identity:false},
});

test('receive: the client binding is a claim - the owner decides and the host fails closed',async t=>{
  const {w,stateDir}=await startHost(t,{readBinding:null});
  const link=await connectHost({stateDir});
  const call=createReceiveCall({link});
  const result=await call('conversation.subscribe',{binding:BINDING});
  assert.deepEqual(result,{ok:false,read_only:true,code:'BINDING_AUTHORITY_UNAVAILABLE'});
  assert.equal(w.callsOf('conversation.subscribe').length,0,'nothing is forwarded without authority');
  link.close();
});

test('receive: registration is required, the lane must match and the account key must be the registered email',async t=>{
  const none=await startHost(t,{readBinding:authorized,registered:null});
  const l0=await connectHost({stateDir:none.stateDir});
  assert.equal((await createReceiveCall({link:l0})('conversation.subscribe',{binding:BINDING})).code,'REGISTRATION_MISSING');
  l0.close();

  const wrongLane=await startHost(t,{readBinding:authorized,helloLane:OTHER_LANE});
  const l1=await connectHost({stateDir:wrongLane.stateDir});
  assert.equal((await createReceiveCall({link:l1})('conversation.subscribe',{binding:BINDING})).code,'REGISTRATION_LANE_MISMATCH');
  assert.equal(wrongLane.w.callsOf('conversation.subscribe').length,0);
  l1.close();

  const wrongAcct=await startHost(t,{readBinding:authorized});
  const l2=await connectHost({stateDir:wrongAcct.stateDir});
  const denied=await createReceiveCall({link:l2})('conversation.subscribe',{binding:{...BINDING,account_key:'other@example.com'}});
  assert.equal(denied.code,'BINDING_NOT_AUTHORIZED');
  assert.equal(wrongAcct.w.callsOf('conversation.subscribe').length,0);
  l2.close();
});

test('receive: a binding the owner does not hold is refused before the worker sees it',async t=>{
  const {w,stateDir}=await startHost(t,{readBinding:()=>null});
  const link=await connectHost({stateDir});
  const call=createReceiveCall({link});
  const denied=await call('conversation.subscribe',{binding:BINDING});
  assert.equal(denied.code,'BINDING_NOT_AUTHORIZED');
  assert.equal(w.callsOf('conversation.subscribe').length,0);
  link.close();

  const other=await startHost(t,{readBinding:()=>({...OTHER_BINDING})});
  const link2=await connectHost({stateDir:other.stateDir});
  const call2=createReceiveCall({link:link2});
  const wrong=await call2('conversation.subscribe',{binding:BINDING});
  assert.equal(wrong.code,'BINDING_NOT_AUTHORIZED');
  assert.equal(other.w.callsOf('conversation.subscribe').length,0);
  link2.close();
});

test('receive: subscribe/read/replay/unsubscribe need the exact owned subscription',async t=>{
  const seenPayloads=[];
  const {w,stateDir}=await startHost(t,{
    readBinding:authorized,
    answer:async msg=>{
      if(msg.call_type==='conversation.subscribe'){
        seenPayloads.push(msg.payload);
        return {ok:true,read_only:true,status:'observing',snapshot:snapshotFor(BINDING)};
      }
      if(msg.call_type==='conversation.read')return {ok:true,read_only:true,snapshot:snapshotFor(BINDING)};
      if(msg.call_type==='conversation.replay')return {ok:true,read_only:true,page:{status:'ok',items:[],nextCursor:{epoch:'stream-1',sequence:1},hasMore:false}};
      if(msg.call_type==='conversation.unsubscribe')return {ok:true,read_only:true};
      return {ok:true};
    },
  });
  const link=await connectHost({stateDir});
  const call=createReceiveCall({link});

  // read BEFORE subscribe: no owned subscription, no data.
  const early=await call('conversation.read',{binding:BINDING});
  assert.deepEqual(early,{ok:false,read_only:true,code:'SUBSCRIPTION_REQUIRED'});

  const subscribed=await call('conversation.subscribe',{binding:BINDING});
  assert.equal(subscribed.ok,true);
  assert.equal(subscribed.read_only,true);
  assert.ok(validateConversationSnapshot(subscribed.snapshot),'the snapshot is canonical P1');
  // The worker only ever sees the five canonical binding fields.
  assert.deepEqual(Object.keys(seenPayloads[0].binding).sort(),
    ['account_key','conversation_id','provider','ref','revision']);

  const read=await call('conversation.read',{binding:BINDING});
  assert.equal(read.ok,true);
  assert.ok(validateConversationSnapshot(read.snapshot));

  const replay=await call('conversation.replay',{binding:BINDING,cursor:{epoch:'stream-1',sequence:0},limit:10});
  assert.equal(replay.ok,true);
  assert.deepEqual(replay.page.items,[]);
  assert.deepEqual(replay.page.next_cursor,{epoch:'stream-1',sequence:1});

  // Another binding is not owned by this socket.
  const other=await call('conversation.read',{binding:OTHER_BINDING});
  assert.equal(other.code,'SUBSCRIPTION_REQUIRED');

  const stopped=await call('conversation.unsubscribe',{binding:BINDING});
  assert.equal(stopped.ok,true);
  assert.equal(w.callsOf('conversation.unsubscribe').length,1);
  const afterStop=await call('conversation.read',{binding:BINDING});
  assert.equal(afterStop.code,'SUBSCRIPTION_REQUIRED');
  link.close();
});

test('receive: a hint reaches only the socket subscribed to that exact binding',async t=>{
  const {w,stateDir}=await startHost(t,{
    readBinding:binding=>({...binding}),
    answer:async msg=>({ok:true,read_only:true,status:'observing'}),
  });
  const linkA=await connectHost({stateDir});
  const linkB=await connectHost({stateDir});
  const eventsA=[],eventsB=[];
  linkA.onEvent(event=>eventsA.push(event));
  linkB.onEvent(event=>eventsB.push(event));

  const callA=createReceiveCall({link:linkA});
  const callB=createReceiveCall({link:linkB});
  assert.equal((await callA('conversation.subscribe',{binding:BINDING})).ok,true);
  assert.equal((await callB('conversation.subscribe',{binding:OTHER_BINDING})).ok,true);

  w.pushEvent({type:'aion.conversation.hint',binding:BINDING,page_epoch:'page-1',
    cursor:{epoch:'stream-1',sequence:3}});
  assert.ok(await waitFor(()=>eventsA.length===1),'the subscribed socket received the hint');
  await sleep(50);
  assert.equal(eventsB.length,0,'an unrelated subscriber receives nothing');
  assert.deepEqual(eventsA[0],{
    type:'aion.conversation.hint',binding:BINDING,page_epoch:'page-1',
    cursor:{epoch:'stream-1',sequence:3},
  });

  // A hint for a binding nobody owns is dropped, not broadcast.
  w.pushEvent({type:'aion.conversation.hint',binding:{...BINDING,ref:'ref-none'},
    page_epoch:'page-1',cursor:{epoch:'stream-1',sequence:4}});
  await sleep(50);
  assert.equal(eventsA.length,1);
  assert.equal(eventsB.length,0);

  // A malformed hint never reaches a subscriber.
  w.pushEvent({type:'aion.conversation.hint',binding:BINDING,page_epoch:'page-1',cursor:{sequence:3}});
  w.pushEvent({type:'aion.conversation.hint',binding:{provider:'x'},page_epoch:'p',cursor:{epoch:'e',sequence:1}});
  await sleep(50);
  assert.equal(eventsA.length,1,'only validated hints are forwarded');
  linkA.close();linkB.close();
});

test('receive: unvalidated or leaky worker answers become fixed codes only',async t=>{
  const {stateDir}=await startHost(t,{
    readBinding:authorized,
    answer:async msg=>{
      if(msg.call_type==='conversation.subscribe')
        return {ok:true,read_only:true,snapshot:{schema:'aion.conversation.snapshot/1',binding:OTHER_BINDING}};
      return {ok:false,code:'something went wrong in the page','error':'secret page text','reason':'boom'};
    },
  });
  const link=await connectHost({stateDir});
  const call=createReceiveCall({link});
  const bad=await call('conversation.subscribe',{binding:BINDING});
  assert.deepEqual(bad,{ok:false,read_only:true,code:'INVALID_SNAPSHOT'});
  assert.equal(JSON.stringify(bad).includes('secret'),false,'no page text leaves the host');

  const leaky=await call('conversation.read',{binding:BINDING});
  assert.equal(leaky.code,'SUBSCRIPTION_REQUIRED');
  link.close();
});

test('receive: an unbound payload is refused before anything is forwarded',async t=>{
  const {w,stateDir}=await startHost(t,{readBinding:authorized});
  const link=await connectHost({stateDir});
  const call=createReceiveCall({link});
  assert.equal((await call('conversation.subscribe',{binding:{provider:'x'}})).code,'INVALID_BINDING');
  assert.equal((await call('conversation.subscribe',{binding:BINDING,cursor:{epoch:'e'}})).code,'INVALID_CURSOR');
  assert.equal((await call('conversation.subscribe',{binding:BINDING,limit:100000})).code,'INVALID_LIMIT');
  assert.equal(w.callsOf('conversation.subscribe').length,0);
  link.close();
});

test('receive: a departing subscriber takes its subscription with it',async t=>{
  const {w,stateDir}=await startHost(t,{
    readBinding:authorized,
    answer:async msg=>({ok:true,read_only:true,status:'observing'}),
  });
  const link=await connectHost({stateDir});
  const call=createReceiveCall({link});
  assert.equal((await call('conversation.subscribe',{binding:BINDING})).ok,true);
  link.close();
  assert.ok(await waitFor(()=>w.callsOf('conversation.unsubscribe').length===1),
    'the worker is told to stop so no page text is retained');
});

test('receive: one peer leaving does not stop a binding another peer still holds',async t=>{
  const {w,stateDir}=await startHost(t,{
    readBinding:authorized,
    answer:async msg=>({ok:true,read_only:true,status:'observing'}),
  });
  const linkA=await connectHost({stateDir});
  const linkB=await connectHost({stateDir});
  const callA=createReceiveCall({link:linkA});
  const callB=createReceiveCall({link:linkB});
  assert.equal((await callA('conversation.subscribe',{binding:BINDING})).ok,true);
  assert.equal((await callB('conversation.subscribe',{binding:BINDING})).ok,true);
  assert.equal((await callA('conversation.unsubscribe',{binding:BINDING})).ok,true);
  await sleep(100);
  assert.equal(w.callsOf('conversation.unsubscribe').length,0,
    'the worker keeps observing while a holder remains');
  linkA.close();
  await sleep(100);
  linkB.close();
  assert.ok(await waitFor(()=>w.callsOf('conversation.unsubscribe').length===1),
    'the last holder leaving stops the worker observation');
});

test('receive: the legacy command path is untouched',async t=>{
  const {w,stateDir}=await startHost(t,{
    readBinding:authorized,
    answer:async msg=>({ok:true,got:msg.payload}),
  });
  const link=await connectHost({stateDir});
  assert.deepEqual(await link.request('aion/chatgpt-tabs',{a:1}),{ok:true,got:{a:1}});
  await assert.rejects(link.request('aion/chatgpt-run',{}),{code:'CALL_NOT_ALLOWED'});
  assert.equal(w.callsOf('aion/chatgpt-run').length,0);
  link.close();
});

test('receive: the host and the worker agree on the fixed code set',async()=>{
  const {ROUTER_CODES}=await import('../extension-dev/receive-router.js');
  assert.deepEqual([...WORKER_RECEIVE_CODES].sort(),Object.values(ROUTER_CODES).sort());
  assert.deepEqual([...CONVERSATION_CALLS].sort(),
    ['conversation.read','conversation.replay','conversation.subscribe','conversation.unsubscribe']);
});
