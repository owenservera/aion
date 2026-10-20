// AION P4 — the watch REPL against the REAL bounded receive journal.
//
// Nothing here is faked except the transport endpoints: the events come from
// the real `BoundedReceiveJournal` (extension/src/lib/receive-journal.js) and
// cross the real local IPC endpoint (P3) through the real `createReceiveCall`.
//
// The journal's page is the CANONICAL one: `status`, `items`, `nextCursor`,
// `hasMore` (camelCase). It is served UNCHANGED — no test-side renaming.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {privateStateDir} from '../fixtures/private-state-dir.mjs';
import {startHostEndpoint,connectHost,EVENT_FRAME_TYPE} from '../src/transport/local-ipc.mjs';
import {createReceiveCall,createReceiveEventStream,RECEIVE_HINT_TYPE} from '../src/browser/remote-call.mjs';
import {createWatchRepl} from '../src/conversation/repl.mjs';
import {BoundedReceiveJournal} from '../../extension/src/lib/receive-journal.js';
import {
  createConversationEvent,createConversationSnapshot,validateConversationEvent,
} from '../../extension/src/lib/conversation-contract.js';

const BINDING={
  provider:'chatgpt.com',account_key:'acct-hermetic-1',conversation_id:'c-hermetic-1',
  ref:'https://chatgpt.com/c/hermetic-1',revision:1,
};
const PAGE_EPOCH='page-epoch-journal-1';
const STREAM_EPOCH='stream-epoch-journal-1';
const COVERAGE={complete_history:false,reason:'dom_history_not_proven',bounded:false,ambiguousIdentity:false};

function message(key,role,text){
  return {
    messageKey:key,role,text,textTruncated:false,incomplete:false,identity:'provider_dom_id',
    completion:role==='assistant'?'inferred_settled':'not_assistant',revision:1,
  };
}

/** The REAL journal, filled with `count` canonical events. */
function filledJournal(count,{retained=200}={}){
  const journal=new BoundedReceiveJournal({
    bindingKey:BINDING.ref,pageEpoch:PAGE_EPOCH,streamEpoch:STREAM_EPOCH,
    validateEvent:validateConversationEvent,retained,
  });
  for(let i=1;i<=count;i+=1){
    const key=`dom-${i}`;
    const event=createConversationEvent({
      binding:BINDING,pageEpoch:PAGE_EPOCH,cursor:{epoch:STREAM_EPOCH,sequence:i},
      message:message(key,i%2===1?'user':'assistant',`message ${i}`),
      coverage:COVERAGE,observedAtMs:1000,
    });
    const published=journal.publish({
      event,bindingKey:BINDING.ref,pageEpoch:PAGE_EPOCH,messageKey:key,revision:1,
    });
    assert.equal(published.accepted,true);
  }
  return journal;
}

/** An empty but canonical baseline snapshot at the stream cursor 0. */
function baselineSnapshot(){
  return createConversationSnapshot({
    binding:BINDING,pageEpoch:PAGE_EPOCH,cursor:{epoch:STREAM_EPOCH,sequence:0},
    messages:[],coverage:COVERAGE,observedAtMs:1000,
  });
}

/**
 * The worker behind the real IPC endpoint. It serves the journal's page
 * UNCHANGED: no field is renamed, nothing is normalized.
 */
function workerFor(journal,{snapshot=baselineSnapshot(),replayCursor=null}={}){
  const calls=[];
  const state={replayCursor};
  return {
    calls,
    state,
    async handle(call_type,payload){
      calls.push({call_type,payload});
      if(call_type==='conversation.subscribe')return {ok:true,read_only:true,status:'observing'};
      if(call_type==='conversation.unsubscribe')return {ok:true,read_only:true,status:'revoked'};
      if(call_type==='conversation.read'){
        return {ok:true,read_only:true,snapshot,cursor:snapshot.cursor,page_epoch:snapshot.page_epoch};
      }
      if(call_type==='conversation.replay'){
        const cursor=state.replayCursor??payload.cursor;
        return {ok:true,read_only:true,page:journal.readPage({cursor,limit:payload.limit})};
      }
      return {ok:false,read_only:true,code:'UNKNOWN_ACTION'};
    },
  };
}

/** The DATA-ONLY hint frame the host puts on the wire. */
function hintFrame(cursor){
  return {
    type:EVENT_FRAME_TYPE,
    event:{type:RECEIVE_HINT_TYPE,binding:BINDING,page_epoch:PAGE_EPOCH,cursor},
  };
}

async function waitFor(predicate,{timeoutMs=5000}={}){
  const deadline=Date.now()+timeoutMs;
  while(Date.now()<deadline){
    if(predicate())return true;
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  return predicate();
}

test('150 retained events are replayed 100 + 50 and ALL of them are shown',async()=>{
  const stateDir=privateStateDir('aion-p4-journal-');
  const journal=filledJournal(150);
  const worker=workerFor(journal);
  let peer=null;
  const endpoint=await startHostEndpoint({
    stateDir,
    onRequest:async(msg,peerArg)=>{
      if(msg.call_type==='conversation.subscribe')peer=peerArg;
      return worker.handle(msg.call_type,msg.payload);
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
    assert.equal((await repl.start()).ok,true);

    peer.publish({
      type:EVENT_FRAME_TYPE,
      event:{type:RECEIVE_HINT_TYPE,binding:BINDING,page_epoch:PAGE_EPOCH,
        cursor:{epoch:STREAM_EPOCH,sequence:150}},
    });
    const shown=await waitFor(()=>lines.filter(l=>l.startsWith('[')).length===150);
    assert.equal(shown,true,`only ${lines.filter(l=>l.startsWith('[')).length} of 150 messages were shown`);

    // The replay happened in ascending pages: 100 first, then the last 50.
    const replays=worker.calls.filter(c=>c.call_type==='conversation.replay');
    assert.equal(replays.length,2);
    assert.deepEqual(replays[0].payload.cursor,{epoch:STREAM_EPOCH,sequence:0});
    assert.deepEqual(replays[1].payload.cursor,{epoch:STREAM_EPOCH,sequence:100});
    assert.equal(replays[0].payload.limit,100);

    // The cursor of the view is the STREAM cursor, never the page epoch.
    const status=repl.status();
    assert.equal(status.cursor.epoch,STREAM_EPOCH);
    assert.notEqual(status.cursor.epoch,PAGE_EPOCH);
    assert.equal(status.epoch,PAGE_EPOCH);
    assert.equal(status.count,150);
  }finally{
    await endpoint.close();
  }
});

test('a cursor AHEAD of the stream is a reset: the REPL re-reads a snapshot',async()=>{
  const stateDir=privateStateDir('aion-p4-ahead-');
  const journal=filledJournal(20);
  const worker=workerFor(journal,{replayCursor:{epoch:STREAM_EPOCH,sequence:9999}});
  let peer=null;
  const endpoint=await startHostEndpoint({
    stateDir,
    onRequest:async(msg,peerArg)=>{
      if(msg.call_type==='conversation.subscribe')peer=peerArg;
      return worker.handle(msg.call_type,msg.payload);
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
    await repl.start();
    const before=worker.calls.filter(c=>c.call_type==='conversation.read').length;
    peer.publish(hintFrame({epoch:STREAM_EPOCH,sequence:9999}));
    const done=await waitFor(()=>worker.calls.filter(c=>c.call_type==='conversation.read').length>before);
    assert.equal(done,true,'a reset cursor forces a fresh snapshot');
    assert.equal(lines.some(l=>l.includes('cursor reset')),true);
  }finally{
    await endpoint.close();
  }
});

test('a cursor from another epoch is a reset and a lost retention is a gap: both re-read',async()=>{
  const stateDir=privateStateDir('aion-p4-epochgap-');
  // A journal that retains only the newest 10 of 150 events: the older ones
  // are GONE and the coverage of a resume is a gap.
  const journal=filledJournal(150,{retained:10});
  const worker=workerFor(journal);
  let peer=null;
  const endpoint=await startHostEndpoint({
    stateDir,
    onRequest:async(msg,peerArg)=>{
      if(msg.call_type==='conversation.subscribe')peer=peerArg;
      return worker.handle(msg.call_type,msg.payload);
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
    await repl.start();

    // A cursor from ANOTHER stream epoch: the journal answers 'reset'.
    worker.state.replayCursor={epoch:'another-stream-epoch',sequence:5};
    let before=worker.calls.filter(c=>c.call_type==='conversation.read').length;
    peer.publish(hintFrame({epoch:STREAM_EPOCH,sequence:5}));
    let done=await waitFor(()=>worker.calls.filter(c=>c.call_type==='conversation.read').length>before);
    assert.equal(done,true,'an epoch reset forces a fresh snapshot');
    assert.equal(lines.some(l=>l.includes('cursor reset')),true);

    // A cursor BEFORE the retained range: the journal answers 'gap'.
    worker.state.replayCursor={epoch:STREAM_EPOCH,sequence:0};
    before=worker.calls.filter(c=>c.call_type==='conversation.read').length;
    peer.publish(hintFrame({epoch:STREAM_EPOCH,sequence:0}));
    done=await waitFor(()=>worker.calls.filter(c=>c.call_type==='conversation.read').length>before);
    assert.equal(done,true,'a gap forces a fresh snapshot');
    assert.equal(lines.some(l=>l.includes('gap')),true);
  }finally{
    await endpoint.close();
  }
});

test('an exhausted replay budget with pages pending is an EXPLICIT resnapshot',async()=>{
  const stateDir=privateStateDir('aion-p4-budget-');
  const journal=filledJournal(150);
  const worker=workerFor(journal);
  let peer=null;
  const endpoint=await startHostEndpoint({
    stateDir,
    onRequest:async(msg,peerArg)=>{
      if(msg.call_type==='conversation.subscribe')peer=peerArg;
      return worker.handle(msg.call_type,msg.payload);
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
      limits:{replayPages:100,replayEvents:10,pageLimit:100,reconnectAttempts:3,
        reconnectDelayMs:1,authorityIntervalMs:0},
    });
    await repl.start();
    const before=worker.calls.filter(c=>c.call_type==='conversation.read').length;
    peer.publish(hintFrame({epoch:STREAM_EPOCH,sequence:150}));
    const done=await waitFor(()=>worker.calls.filter(c=>c.call_type==='conversation.read').length>before);
    assert.equal(done,true,'the exhausted budget must force a fresh snapshot');
    assert.equal(lines.some(l=>l.includes('budget exhausted')),true);
  }finally{
    await endpoint.close();
  }
});
