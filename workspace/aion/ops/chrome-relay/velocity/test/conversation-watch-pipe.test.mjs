// AION P4 — the integrated receive path, hermetically.
//
//   browser FIXTURE (fake DOM)
//     -> P2 conversation source (canonical P1 events/snapshot)
//     -> P3 local IPC pipe (real startHostEndpoint / connectHost)
//     -> P4 CLI watch REPL
//
// and, in the second test, the REAL P3 receive router in front of the pipe:
//   P2 journal page -> P3 router -> P3 IPC pipe -> P4 CLI watch REPL
//
// There is NO real browser, NO real Chrome and NO live effect: the DOM is a
// fixture, the worker behind the endpoint is the real P2 source and the
// pages are served UNCHANGED (no field renaming, no test-side normalizing).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {privateStateDir} from '../fixtures/private-state-dir.mjs';
import {startHostEndpoint,connectHost,EVENT_FRAME_TYPE} from '../src/transport/local-ipc.mjs';
import {createReceiveCall,createReceiveEventStream,RECEIVE_HINT_TYPE} from '../src/browser/remote-call.mjs';
import {createWatchRepl} from '../src/conversation/repl.mjs';
import {createChatGptConversationSource} from '../../extension/src/providers/chatgpt/source.js';
import {createReceiveRouter,RECEIVE_PORT_NAME} from '../extension-dev/receive-router.js';
import {BoundedReceiveJournal} from '../../extension/src/lib/receive-journal.js';
import {
  createConversationEvent,createConversationSnapshot,validateConversationEvent,
  validateConversationBinding,validateConversationSnapshot,validateObservationCursor,
} from '../../extension/src/lib/conversation-contract.js';

const BINDING={
  provider:'chatgpt.com',
  account_key:'acct-hermetic-1',
  conversation_id:'hermetic-1',
  ref:'https://chatgpt.com/c/hermetic-1',
  revision:1,
};
const PAGE_EPOCH='page-epoch-fixture-1';
const STREAM_EPOCH='stream-epoch-fixture-1';
const COVERAGE={complete_history:false,reason:'dom_history_not_proven',bounded:false,ambiguousIdentity:false};
const VALIDATORS={
  validateConversationBinding,validateConversationSnapshot,validateConversationEvent,
  validateObservationCursor,
};

/** One fake DOM message node. */
function fakeNode({role,id,text,complete=true}){
  return {
    getAttribute:(name)=>({
      'data-message-author-role':role,
      'data-message-id':id,
    }[name]??null),
    closest:()=>null,
    querySelector:(selector)=>{
      if(String(selector).includes('copy-turn-action-button')&&complete)return {getAttribute:()=>null};
      return null;
    },
    innerText:text,
    textContent:text,
  };
}
function fakeRoot(nodes){
  return {querySelectorAll:()=>nodes,querySelector:()=>null};
}

async function waitFor(predicate,{timeoutMs=5000}={}){
  const deadline=Date.now()+timeoutMs;
  while(Date.now()<deadline){
    if(predicate())return true;
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  return predicate();
}

test('a fixture conversation travels source -> pipe -> CLI and is shown read-only',async()=>{
  const stateDir=privateStateDir('aion-p4-pipe-');
  const source=createChatGptConversationSource({
    binding:BINDING,pageEpoch:PAGE_EPOCH,streamEpoch:STREAM_EPOCH,
  });

  // The browser fixture: two messages, then a third one arrives.
  let nodes=[
    fakeNode({role:'user',id:'dom-1',text:'first from the browser'}),
    fakeNode({role:'assistant',id:'dom-2',text:'answer from the browser'}),
  ];
  const proof=()=>({
    pageUrl:BINDING.ref,
    authenticatedBindingKey:BINDING.ref,
    authenticatedAccountKey:BINDING.account_key,
    observedPageEpoch:PAGE_EPOCH,
    nowMs:1000,
  });
  const first=source.sample(fakeRoot(nodes),proof());
  assert.equal(first.status,'observing');
  assert.equal(first.events.length,0,'the first sample is a baseline');

  const callTypes=[];
  let peer=null;
  const endpoint=await startHostEndpoint({
    stateDir,
    onRequest:async(msg,peerArg)=>{
      if(msg.call_type==='conversation.subscribe')peer=peerArg;
      callTypes.push(msg.call_type);
      if(msg.call_type==='conversation.read'){
        const snapshot=source.readSnapshot();
        return {ok:true,read_only:true,snapshot,cursor:snapshot.cursor,page_epoch:snapshot.page_epoch};
      }
      if(msg.call_type==='conversation.replay'){
        // The journal's OWN page, unchanged.
        return {ok:true,read_only:true,page:source.readPage({cursor:msg.payload.cursor,limit:msg.payload.limit})};
      }
      if(msg.call_type==='conversation.unsubscribe')return {ok:true,read_only:true,status:'revoked'};
      return {ok:true,read_only:true,status:'observing'};
    },
  });
  const lines=[];
  try{
    const link=await connectHost({stateDir});
    const repl=createWatchRepl({
      binding:BINDING,
      connect:async()=>link,
      receiveFor:(l)=>createReceiveCall({link:l}),
      streamFor:(l)=>createReceiveEventStream({link:l}),
      authority:async()=>({authorized:true}),
      output:line=>lines.push(line),
    });
    const started=await repl.start();
    assert.equal(started.ok,true,'the watch starts');
    assert.equal(lines.some(l=>l.includes('[user] rev1: first from the browser')),true);
    assert.equal(lines.some(l=>l.includes('[assistant] rev1: answer from the browser')),true);
    assert.equal(lines.some(l=>l.includes('baseline_history_coverage_unproven')),true);

    // A NEW message appears in the browser fixture and the page says so.
    nodes=[...nodes,fakeNode({role:'user',id:'dom-3',text:'third from the browser'})];
    const second=source.sample(fakeRoot(nodes),proof());
    assert.equal(second.events.length,1,'the new message produces one canonical event');
    const latest=source.readSnapshot();
    peer.publish({
      type:EVENT_FRAME_TYPE,
      event:{type:RECEIVE_HINT_TYPE,binding:BINDING,page_epoch:PAGE_EPOCH,cursor:latest.cursor},
    });

    const shown=await waitFor(()=>lines.some(l=>l.includes('[user] rev1: third from the browser')));
    assert.equal(shown,true,'the CLI shows the incoming message');

    // The cursor of the view is the STREAM cursor of the source.
    assert.equal(repl.status().cursor.epoch,STREAM_EPOCH);
    assert.notEqual(repl.status().cursor.epoch,PAGE_EPOCH);

    // Only read-only receive calls ever crossed the pipe.
    assert.deepEqual([...new Set(callTypes)].sort(),
      ['conversation.read','conversation.replay','conversation.subscribe']);
  }finally{
    await endpoint.close();
  }
});

/** A fake receive port for the REAL router: it answers the four actions. */
function fakePort({journal,snapshot}){
  let onMessage=null;
  let onDisconnect=null;
  return {
    postMessage(message){
      const reply=message.action==='start'?{ok:true,status:'observing',page_epoch:PAGE_EPOCH,
        stream_epoch:STREAM_EPOCH,binding:BINDING}
        :message.action==='read'?{ok:true,status:'observing',snapshot,cursor:snapshot.cursor,
          page_epoch:PAGE_EPOCH,stream_epoch:STREAM_EPOCH,binding:BINDING}
          :message.action==='replay'?{ok:true,status:'observing',
            page:journal.readPage({cursor:message.cursor,limit:message.limit}),
            page_epoch:PAGE_EPOCH,stream_epoch:STREAM_EPOCH,binding:BINDING}
          :{ok:true,status:'revoked',code:'subscription_stopped'};
      queueMicrotask(()=>onMessage?.({...reply,id:message.id}));
    },
    onMessage:{addListener:fn=>{onMessage=fn;}},
    onDisconnect:{addListener:fn=>{onDisconnect=fn;}},
    deliver:message=>onMessage?.(message),
    disconnect:()=>onDisconnect?.(),
  };
}

test('the real receive router serves the journal page to the CLI',async()=>{
  const stateDir=privateStateDir('aion-p4-router-');
  const journal=new BoundedReceiveJournal({
    bindingKey:BINDING.ref,pageEpoch:PAGE_EPOCH,streamEpoch:STREAM_EPOCH,
    validateEvent:validateConversationEvent,
  });
  const snapshot=createConversationSnapshot({
    binding:BINDING,pageEpoch:PAGE_EPOCH,cursor:{epoch:STREAM_EPOCH,sequence:0},
    messages:[],coverage:COVERAGE,observedAtMs:1000,
  });
  for(let i=1;i<=3;i+=1){
    const key=`dom-${i}`;
    const event=createConversationEvent({
      binding:BINDING,pageEpoch:PAGE_EPOCH,cursor:{epoch:STREAM_EPOCH,sequence:i},
      message:{messageKey:key,role:'user',text:`router message ${i}`,textTruncated:false,
        incomplete:false,identity:'provider_dom_id',completion:'not_assistant',revision:1},
      coverage:COVERAGE,observedAtMs:1000,
    });
    journal.publish({event,bindingKey:BINDING.ref,pageEpoch:PAGE_EPOCH,messageKey:key,revision:1});
  }
  const port=fakePort({journal,snapshot});
  const chrome={
    tabs:{
      query:async()=>[{id:7,url:BINDING.ref}],
      connect:(tabId,options)=>{
        assert.equal(tabId,7);
        assert.equal(options.name,RECEIVE_PORT_NAME);
        return port;
      },
    },
  };
  let peer=null;
  const router=createReceiveRouter({
    chrome,validators:VALIDATORS,getAccountKey:()=>BINDING.account_key,
    publishEvent:(event)=>{if(peer)peer.publish({type:EVENT_FRAME_TYPE,event});},
  });
  const endpoint=await startHostEndpoint({
    stateDir,
    onRequest:async(msg,peerArg)=>{
      if(msg.call_type==='conversation.subscribe')peer=peerArg;
      return router.handleCall(msg.call_type,msg.payload);
    },
  });
  const lines=[];
  try{
    const link=await connectHost({stateDir});
    const repl=createWatchRepl({
      binding:BINDING,connect:async()=>link,
      receiveFor:(l)=>createReceiveCall({link:l}),
      streamFor:(l)=>createReceiveEventStream({link:l}),
      authority:async()=>({authorized:true}),output:line=>lines.push(line),
    });
    assert.equal((await repl.start()).ok,true,'the watch starts through the router');
    // The page pushes a hint: the router publishes it to the subscribed peer.
    port.deliver({type:RECEIVE_HINT_TYPE,binding:BINDING,page_epoch:PAGE_EPOCH,
      cursor:{epoch:STREAM_EPOCH,sequence:3}});
    const shown=await waitFor(()=>lines.filter(l=>l.startsWith('[')).length===3);
    assert.equal(shown,true,`only ${lines.filter(l=>l.startsWith('[')).length} of 3 router messages were shown`);
    assert.equal(lines.some(l=>l.includes('router message 3')),true);
    assert.equal(repl.status().cursor.epoch,STREAM_EPOCH);
    assert.notEqual(repl.status().cursor.epoch,PAGE_EPOCH);
  }finally{
    await endpoint.close();
  }
});
