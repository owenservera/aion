// P3 receive pipe: the WORKER side.
//
// The dev service worker's receive router and the dev native link. No Chrome,
// no page, no live claim: a fake tab list, a fake port and a fake native port.
//
// What is proved here:
//   - the tab is matched EXACTLY and no tab is ever listed to a caller;
//   - the account proof is INDEPENDENT: the binding's own account_key is
//     never used as proof and no proof means no subscription;
//   - a receive call NEVER reaches the worker's command runner;
//   - a hint becomes a DATA-ONLY event frame on the native port;
//   - unvalidated page data and free-form page text never leave the router.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createReceiveRouter,ROUTER_CODES,RECEIVE_PORT_NAME} from '../extension-dev/receive-router.js';
import {createDevLink} from '../extension-dev/dev-link.js';
import {
  validateConversationBinding,validateConversationSnapshot,validateConversationEvent,
  validateObservationCursor,
} from '../../extension/src/lib/conversation-contract.js';

const validators={validateConversationBinding,validateConversationSnapshot,
  validateConversationEvent,validateObservationCursor};
const BINDING={provider:'chatgpt.com',account_key:'acct-1',conversation_id:'c-123',ref:'ref-1',revision:1};
const TAB_URL='https://chatgpt.com/c/c-123';

/** A fake receive port that answers one request shape. */
function fakePort(answer){
  let onMessage=null,onDisconnect=null;
  const posted=[];
  return {
    posted,
    postMessage(message){
      posted.push(message);
      const reply=answer?answer(message):undefined;
      if(reply!==undefined)queueMicrotask(()=>onMessage?.({...reply,id:message.id}));
    },
    onMessage:{addListener:fn=>{onMessage=fn;}},
    onDisconnect:{addListener:fn=>{onDisconnect=fn;}},
    deliver:message=>onMessage?.(message),
    disconnect:()=>onDisconnect?.(),
  };
}
function fakeChrome({tabs=[],port=null}={}){
  const connected=[];
  return {
    connected,
    tabs:{
      query:async()=>tabs,
      connect:(tabId,options)=>{
        if(!port)throw new Error('no receive port in this tab');
        connected.push({tabId,name:options?.name});
        return port;
      },
    },
  };
}
const okReply={ok:true,read_only:true,status:'observing'};

test('router: the bound tab is matched exactly and is never listed to the caller',async()=>{
  const port=fakePort(()=>okReply);
  const chrome=fakeChrome({tabs:[{id:7,url:TAB_URL},{id:8,url:'https://chatgpt.com/c/other'}],port});
  const router=createReceiveRouter({chrome,validators,getAccountKey:()=>'acct-1',
    publishEvent:()=>{}});
  const result=await router.handleCall('conversation.subscribe',{binding:BINDING});
  assert.equal(result.ok,true);
  assert.equal(chrome.connected.length,1);
  assert.equal(chrome.connected[0].tabId,7);
  assert.equal(chrome.connected[0].name,RECEIVE_PORT_NAME);
  const text=JSON.stringify(result);
  assert.equal(text.includes('chatgpt.com'),false,'no tab url leaves the router');
  assert.equal(text.includes('tab'),false,'no tab identity leaves the router');
});

test('router: no tab, two tabs and a wrong tab are refused with fixed codes',async()=>{
  const port=fakePort(()=>okReply);
  const none=createReceiveRouter({chrome:fakeChrome({tabs:[],port}),validators,
    getAccountKey:()=>'acct-1',publishEvent:()=>{}});
  assert.equal((await none.handleCall('conversation.subscribe',{binding:BINDING})).code,
    ROUTER_CODES.BINDING_TARGET_MISSING);

  const two=createReceiveRouter({chrome:fakeChrome({tabs:[{id:7,url:TAB_URL},{id:9,url:TAB_URL}],port}),
    validators,getAccountKey:()=>'acct-1',publishEvent:()=>{}});
  assert.equal((await two.handleCall('conversation.subscribe',{binding:BINDING})).code,
    ROUTER_CODES.BINDING_AMBIGUOUS);

  const other=createReceiveRouter({chrome:fakeChrome({tabs:[{id:8,url:'https://chatgpt.com/c/other'}],port}),
    validators,getAccountKey:()=>'acct-1',publishEvent:()=>{}});
  assert.equal((await other.handleCall('conversation.subscribe',{binding:BINDING})).code,
    ROUTER_CODES.BINDING_TARGET_MISSING);
});

test('router: the registered account is independent - the binding key is never the registration',async()=>{
  const port=fakePort(()=>okReply);
  const chrome=fakeChrome({tabs:[{id:7,url:TAB_URL}],port});
  // No registration at all: no subscription, no port.
  const noProof=createReceiveRouter({chrome,validators,publishEvent:()=>{}});
  const refused=await noProof.handleCall('conversation.subscribe',{binding:BINDING});
  assert.equal(refused.code,ROUTER_CODES.ACCOUNT_IDENTITY_UNPROVEN);
  assert.equal(chrome.connected.length,0,'nothing is opened without a registration');

  // A registration that DIFFERS from the binding's own account key is never
  // overridden by the binding's claim: the subscription is refused.
  const other=fakePort(()=>okReply);
  const otherChrome=fakeChrome({tabs:[{id:7,url:TAB_URL}],port:other});
  const mismatch=createReceiveRouter({chrome:otherChrome,
    validators,getAccountKey:()=>'established-by-the-owner',publishEvent:()=>{}});
  assert.equal((await mismatch.handleCall('conversation.subscribe',{binding:BINDING})).code,
    ROUTER_CODES.ACCOUNT_MISMATCH);
  assert.equal(otherChrome.connected.length,0,'a mismatched account opens no port');

  // The registered account equal to the binding's account key subscribes, and
  // the page is told the REGISTERED key.
  const proven=fakePort(()=>okReply);
  const router=createReceiveRouter({chrome:fakeChrome({tabs:[{id:7,url:TAB_URL}],port:proven}),
    validators,getAccountKey:()=>BINDING.account_key,publishEvent:()=>{}});
  assert.equal((await router.handleCall('conversation.subscribe',{binding:BINDING})).ok,true);
  const start=proven.posted.find(m=>m.action==='start');
  assert.equal(start.registered_account_key,BINDING.account_key);
});

test('dev-link: the hello carries the worker lane id',async()=>{
  const {chrome,posted}=nativeChrome();
  const link=createDevLink({chrome,run:async()=>({ok:true}),onCall:async()=>({ok:true}),
    helloPayload:{lane_id:'lane-aaaaaaaaaaaaaaaa'}});
  link.connect();
  const hello=posted.find(m=>m.type==='aion.b.hello');
  assert.ok(hello);
  assert.equal(hello.lane_id,'lane-aaaaaaaaaaaaaaaa');
});

test('router: an unvalidated snapshot is refused and no page text survives',async()=>{
  const port=fakePort(()=>({ok:true,read_only:true,snapshot:{schema:'aion.conversation.snapshot/1'}}));
  const router=createReceiveRouter({chrome:fakeChrome({tabs:[{id:7,url:TAB_URL}],port}),validators,
    getAccountKey:()=>'acct-1',publishEvent:()=>{}});
  const result=await router.handleCall('conversation.subscribe',{binding:BINDING});
  assert.equal(result.code,ROUTER_CODES.INVALID_SNAPSHOT);

  const leaky=fakePort(()=>({ok:false,code:'not_started',reason:'secret page text'}));
  const router2=createReceiveRouter({chrome:fakeChrome({tabs:[{id:7,url:TAB_URL}],port:leaky}),validators,
    getAccountKey:()=>'acct-1',publishEvent:()=>{}});
  const failed=await router2.handleCall('conversation.subscribe',{binding:BINDING});
  assert.equal(failed.code,ROUTER_CODES.SUBSCRIPTION_REQUIRED);
  assert.equal(JSON.stringify(failed).includes('secret'),false,'no page text leaves the router');
});

test('router: read and replay need a subscription of their own',async()=>{
  const router=createReceiveRouter({chrome:fakeChrome({tabs:[],port:fakePort(()=>okReply)}),validators,
    getAccountKey:()=>'acct-1',publishEvent:()=>{}});
  const read=await router.handleCall('conversation.read',{binding:BINDING});
  assert.equal(read.code,ROUTER_CODES.SUBSCRIPTION_REQUIRED);
  const replay=await router.handleCall('conversation.replay',{binding:BINDING});
  assert.equal(replay.code,ROUTER_CODES.SUBSCRIPTION_REQUIRED);
});

test('router: without the P1 validators the router refuses everything',async()=>{
  const router=createReceiveRouter({chrome:fakeChrome({tabs:[],port:fakePort(()=>okReply)}),
    getAccountKey:()=>'acct-1',publishEvent:()=>{}});
  const result=await router.handleCall('conversation.subscribe',{binding:BINDING});
  assert.equal(result.code,ROUTER_CODES.RECEIVE_NOT_AVAILABLE);
});

/** A fake native port of the dev link. */
function nativeChrome(){
  const posted=[];
  const state={onMessage:null,onDisconnect:null};
  const chrome={
    runtime:{
      id:'x'.repeat(32),
      lastError:undefined,
      connectNative(){
        return {
          postMessage:message=>posted.push(message),
          onMessage:{addListener:fn=>{state.onMessage=fn;}},
          onDisconnect:{addListener:fn=>{state.onDisconnect=fn;}},
        };
      },
    },
  };
  return {chrome,posted,state};
}

test('dev-link: a receive call never reaches the command runner',async()=>{
  const {chrome,posted,state}=nativeChrome();
  const runs=[];
  const router=createReceiveRouter({chrome:{
    tabs:{query:async()=>[{id:7,url:TAB_URL}],connect:()=>fakePort(()=>okReply)},
  },validators,getAccountKey:()=>'acct-1',publishEvent:()=>{}});
  const link=createDevLink({chrome,run:async m=>{runs.push(m);return {ok:true};},
    onCall:(type,payload)=>router.handleCall(type,payload)});
  link.connect();
  state.onMessage({type:'aion.b.call',id:'1',call_type:'conversation.subscribe',payload:{binding:BINDING}});
  await new Promise(r=>setTimeout(r,10));
  const reply=posted.find(m=>m.id==='1');
  assert.ok(reply,'the receive call is answered');
  assert.equal(reply.type,'aion.b.reply');
  assert.equal(runs.length,0,'receive text never reaches runChatGPTCommand');

  // The legacy path still works and still reaches the runner.
  state.onMessage({type:'aion.b.call',id:'2',call_type:'aion/chatgpt-observe',payload:{}});
  await new Promise(r=>setTimeout(r,10));
  assert.equal(runs.length,1);
  assert.equal(runs[0].type,'aion/chatgpt-observe');
  assert.ok(state.onDisconnect);
});

test('dev-link: a hint becomes a data-only event frame on the native port',async()=>{  const {chrome,posted,state}=nativeChrome();
  const port=fakePort(()=>okReply);
  const events=[];
  const router=createReceiveRouter({chrome:{
    tabs:{query:async()=>[{id:7,url:TAB_URL}],connect:()=>port},
  },validators,getAccountKey:()=>'acct-1',publishEvent:event=>events.push(event)});
  const link=createDevLink({chrome,run:async()=>({ok:true}),
    onCall:(type,payload)=>router.handleCall(type,payload)});
  link.connect();
  assert.equal((await router.handleCall('conversation.subscribe',{binding:BINDING})).ok,true);
  port.deliver({type:'aion.conversation.hint',binding:BINDING,page_epoch:'page-1',
    cursor:{epoch:'stream-1',sequence:2}});
  assert.equal(events.length,1);
  assert.deepEqual(events[0],{type:'aion.conversation.hint',binding:BINDING,
    page_epoch:'page-1',cursor:{epoch:'stream-1',sequence:2}});

  link.publishEvent(events[0]);
  const frame=posted.find(m=>m.type==='aion.b.event');
  assert.ok(frame,'the hint travels as an event frame');
  assert.equal(frame.event.type,'aion.conversation.hint');
  assert.equal(JSON.stringify(frame).includes('text'),false,'a hint carries no message text');
  assert.ok(state.onMessage);
});

test('the three planes agree on the frame and hint type names',async()=>{
  const {EVENT_FRAME_TYPE}=await import('../extension-dev/dev-link.js');
  const {RECEIVE_EVENT_FRAME,RECEIVE_HINT_TYPE}=await import('../src/native-host/relay.mjs');
  const {EVENT_FRAME_TYPE:IPC_FRAME_TYPE}=await import('../src/transport/local-ipc.mjs');
  const {RECEIVE_HINT_TYPE:ROUTER_HINT_TYPE}=await import('../extension-dev/receive-router.js');
  assert.equal(EVENT_FRAME_TYPE,RECEIVE_EVENT_FRAME);
  assert.equal(EVENT_FRAME_TYPE,IPC_FRAME_TYPE);
  assert.equal(RECEIVE_HINT_TYPE,ROUTER_HINT_TYPE);
});
