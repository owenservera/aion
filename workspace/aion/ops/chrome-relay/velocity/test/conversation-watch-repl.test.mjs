// AION P4 — the watch-only REPL loop.
//
// Everything here is HERMETIC: the host is a fake link with a scripted
// worker. No browser, no real IPC endpoint, no live effect of any kind.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWatchRepl} from '../src/conversation/repl.mjs';
import {
  createConversationEvent,createConversationSnapshot,
} from '../../extension/src/lib/conversation-contract.js';

const BINDING={
  provider:'chatgpt.com',account_key:'acct-hermetic-1',conversation_id:'c-hermetic-1',
  ref:'https://chatgpt.com/c/hermetic-1',revision:1,
};
const COVERAGE={complete_history:false,reason:'dom_history_not_proven',bounded:false,ambiguousIdentity:false};

function message(key,role,text,{revision=1,identity='provider_dom_id'}={}){
  return {
    messageKey:key,role,text,textTruncated:false,incomplete:false,identity,
    completion:role==='assistant'?'inferred_settled':'not_assistant',revision,
  };
}
function event(key,role,text,{epoch='page-1',sequence=1,revision=1}={}){
  return createConversationEvent({
    binding:BINDING,pageEpoch:epoch,cursor:{epoch:'stream-1',sequence},
    message:message(key,role,text,{revision}),coverage:COVERAGE,observedAtMs:1000,
  });
}
function snapshot(messages,{epoch='page-1',sequence=1}={}){
  return createConversationSnapshot({
    binding:BINDING,pageEpoch:epoch,cursor:{epoch:'stream-1',sequence},
    messages,coverage:COVERAGE,observedAtMs:1000,
  });
}

/** A scripted worker: the answers a real host+worker would give. */
function createWorker({snapshot:initial,pages=[]}={}){
  const state={snapshot:initial,pages:[...pages],pageIndex:0,subscribed:false,unsubscribed:false};
  return {
    state,
    async handle(type,payload){
      if(type==='conversation.subscribe'){
        state.subscribed=true;
        return {ok:true,read_only:true,status:'observing'};
      }
      if(type==='conversation.unsubscribe'){
        state.subscribed=false;
        state.unsubscribed=true;
        return {ok:true,read_only:true,status:'revoked'};
      }
      if(type==='conversation.read'){
        if(state.failRead)return {ok:false,read_only:true,code:'READ_FAILED'};
        return {ok:true,read_only:true,snapshot:state.snapshot,cursor:state.snapshot.cursor,
          page_epoch:state.snapshot.page_epoch};
      }
      if(type==='conversation.replay'){
        const page=state.pages[state.pageIndex]??state.pages.at(-1)??null;
        if(page&&state.pageIndex<state.pages.length-1)state.pageIndex+=1;
        if(!page)return {ok:false,read_only:true,code:'NO_PAGE'};
        return {ok:true,read_only:true,page};
      }
      return {ok:false,read_only:true,code:'UNKNOWN_ACTION'};
    },
  };
}

/** A fake host link: request/onEvent/onDisconnect, like the real one. */
function createFakeLink(worker){
  const eventHandlers=new Set();
  const disconnectHandlers=new Set();
  const link={
    calls:[],
    closed:false,
    async request(type,payload){
      link.calls.push({type,payload});
      return worker.handle(type,payload);
    },
    onEvent(handler){eventHandlers.add(handler);return ()=>eventHandlers.delete(handler);},
    onDisconnect(handler){disconnectHandlers.add(handler);return ()=>disconnectHandlers.delete(handler);},
    close(){link.closed=true;},
    emit(event){for(const handler of [...eventHandlers])handler(event);},
    drop(){for(const handler of [...disconnectHandlers])handler('HOST_LINK_LOST');},
  };
  return link;
}

async function waitFor(predicate,{timeoutMs=3000}={}){
  const deadline=Date.now()+timeoutMs;
  while(Date.now()<deadline){
    if(predicate())return true;
    await new Promise(resolve=>setTimeout(resolve,5));
  }
  return predicate();
}

test('the watch subscribes FIRST and then reads the initial snapshot',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const link=createFakeLink(worker);
  const lines=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>link,
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
  });
  const started=await repl.start();
  assert.equal(started.ok,true);
  assert.deepEqual(link.calls.map(c=>c.type),['conversation.subscribe','conversation.read']);
  assert.equal(lines.some(l=>l.includes('baseline snapshot')),true);
  assert.equal(lines.some(l=>l.includes('baseline_history_coverage_unproven')),true);
  assert.equal(lines.some(l=>l.includes('[user] rev1: hello')),true);
  // WATCH ONLY: nothing but conversation.* was ever called.
  assert.equal(link.calls.every(c=>c.type.startsWith('conversation.')),true);
});

test('a hint pulls the pages in ascending order until the source says there is no more',async()=>{
  const worker=createWorker({
    snapshot:snapshot([message('m1','user','hello')],{sequence:1}),
    pages:[
      {status:'ok',reason:'',hasMore:true,nextCursor:{epoch:'stream-1',sequence:2},complete_history:false,
        items:[{sequence:2,revision:1,event:event('m2','assistant','second',{sequence:2})}]},
      {status:'ok',reason:'',hasMore:false,nextCursor:{epoch:'stream-1',sequence:3},complete_history:false,
        items:[{sequence:3,revision:1,event:event('m3','user','third',{sequence:3})}]},
    ],
  });
  const link=createFakeLink(worker);
  const lines=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>link,
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
  });
  await repl.start();
  link.emit({type:'aion.conversation.hint',binding:BINDING,page_epoch:'page-1',cursor:{epoch:'stream-1',sequence:3}});
  const done=await waitFor(()=>lines.some(l=>l.includes('[user] rev1: third')));
  assert.equal(done,true);
  const replays=link.calls.filter(c=>c.type==='conversation.replay');
  assert.equal(replays.length,2);
  assert.deepEqual(replays[0].payload.cursor,{epoch:'stream-1',sequence:1});
  assert.deepEqual(replays[1].payload.cursor,{epoch:'stream-1',sequence:2});
  assert.equal(link.calls.every(c=>c.type.startsWith('conversation.')),true);
});

test('a gap page is never applied: the REPL reads a fresh snapshot instead',async()=>{
  const worker=createWorker({
    snapshot:snapshot([message('m1','user','hello')],{sequence:1}),
    pages:[{status:'gap',reason:'cursor_before_retained_range',items:[],has_more:false,next_cursor:null}],
  });
  const link=createFakeLink(worker);
  const lines=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>link,
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
  });
  await repl.start();
  link.emit({type:'aion.conversation.hint',binding:BINDING,page_epoch:'page-1',cursor:{epoch:'stream-1',sequence:2}});
  const done=await waitFor(()=>link.calls.filter(c=>c.type==='conversation.read').length===2);
  assert.equal(done,true);
  assert.equal(lines.some(l=>l.includes('gap')),true);
});

test('a hint for ANOTHER binding is ignored',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const link=createFakeLink(worker);
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>link,
    authority:async()=>({authorized:true}),
    output:()=>{},
  });
  await repl.start();
  link.emit({type:'aion.conversation.hint',binding:{...BINDING,conversation_id:'c-other'},page_epoch:'page-1',
    cursor:{epoch:'stream-1',sequence:9}});
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(link.calls.filter(c=>c.type==='conversation.replay').length,0);
});

test('a lost link reconnects, re-subscribes and re-reads — and causes no effect',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const first=createFakeLink(worker);
  const second=createFakeLink(worker);
  let created=0;
  const lines=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>{created+=1;return created===1?first:second;},
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
    limits:{replayPages:100,replayEvents:150,pageLimit:100,reconnectAttempts:3,reconnectDelayMs:1,authorityIntervalMs:0},
  });
  await repl.start();
  first.drop();
  const done=await waitFor(()=>second.calls.length>=2);
  assert.equal(done,true);
  assert.deepEqual(second.calls.map(c=>c.type),['conversation.subscribe','conversation.read']);
  // The dead link is closed and NO non-conversation call was ever made.
  assert.equal(first.closed,true);
  assert.equal([...first.calls,...second.calls].every(c=>c.type.startsWith('conversation.')),true);
  assert.equal(lines.some(l=>l.includes('reconnected')),true);
});

test('the reconnect is bounded: after the last attempt the watch stops',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const first=createFakeLink(worker);
  let attempts=0;
  const stops=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>{attempts+=1;if(attempts===1)return first;throw Object.assign(new Error('down'),{code:'HOST_UNREACHABLE'});},
    authority:async()=>({authorized:true}),
    output:()=>{},
    onStop:info=>stops.push(info),
    limits:{replayPages:100,replayEvents:150,pageLimit:100,reconnectAttempts:3,reconnectDelayMs:1,authorityIntervalMs:0},
  });
  await repl.start();
  first.drop();
  const done=await waitFor(()=>stops.length===1);
  assert.equal(done,true);
  assert.equal(stops[0].reason,'link_lost');
  assert.equal(attempts,4); // the first link plus three bounded attempts
});

test('a revoked binding stops the watch, unsubscribes and clears the inbox',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const link=createFakeLink(worker);
  const stops=[];
  let authorized=true;
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>link,
    authority:async()=>authorized?{authorized:true}:{authorized:false,code:'CHIEF_UNBOUND'},
    output:()=>{},
    onStop:info=>stops.push(info),
    limits:{replayPages:100,replayEvents:150,pageLimit:100,reconnectAttempts:3,reconnectDelayMs:1,
      authorityIntervalMs:5},
  });
  await repl.start();
  assert.equal(repl.status().count,1);
  authorized=false;
  // The periodic authority re-check sees the revocation and stops the watch.
  const done=await waitFor(()=>stops.length===1);
  assert.equal(done,true);
  assert.equal(stops[0].reason,'revoked');
  assert.equal(stops[0].code,'CHIEF_UNBOUND');
  assert.equal(repl.status().count,0,'the inbox is cleared');
  assert.equal(worker.state.unsubscribed,true);
});

test('there is ONE reconnect loop: a second disconnect does not start a second one',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const first=createFakeLink(worker);
  let connectCalls=0;
  const stops=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>{
      connectCalls+=1;
      if(connectCalls===1)return first;
      throw Object.assign(new Error('down'),{code:'HOST_UNREACHABLE'});
    },
    authority:async()=>({authorized:true}),
    output:()=>{},
    onStop:info=>stops.push(info),
    limits:{replayPages:100,replayEvents:150,pageLimit:100,reconnectAttempts:3,reconnectDelayMs:1,authorityIntervalMs:0},
  });
  await repl.start();
  first.drop();
  first.drop();
  const done=await waitFor(()=>stops.length===1);
  assert.equal(done,true);
  assert.equal(stops[0].reason,'link_lost');
  assert.equal(connectCalls,4,'one loop: the first link plus three bounded attempts');
});

test('the previous listeners are detached before the reconnect',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const first=createFakeLink(worker);
  const second=createFakeLink(worker);
  let connectCalls=0;
  const lines=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>{connectCalls+=1;return connectCalls===1?first:second;},
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
    limits:{replayPages:100,replayEvents:150,pageLimit:100,reconnectAttempts:3,reconnectDelayMs:1,authorityIntervalMs:0},
  });
  await repl.start();
  first.drop();
  const done=await waitFor(()=>second.calls.length>=2);
  assert.equal(done,true);
  // The DEAD link must not be able to drive the loop again.
  first.drop();
  await new Promise(resolve=>setTimeout(resolve,60));
  assert.equal(connectCalls,2,'the detached old link starts no new reconnect');
  assert.equal(lines.filter(l=>l.includes('host link lost')).length,1);
});

test('"reconnected" is claimed only after a successful authorized snapshot',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  worker.state.failRead=true;
  const first=createFakeLink(worker);
  const stops=[];
  const lines=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>first,
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
    onStop:info=>stops.push(info),
    limits:{replayPages:100,replayEvents:150,pageLimit:100,reconnectAttempts:2,reconnectDelayMs:1,authorityIntervalMs:0},
  });
  // The FIRST read already fails, so the watch never starts.
  const started=await repl.start();
  assert.equal(started.ok,false);
  assert.equal(started.code,'READ_FAILED');
  assert.equal(lines.some(l=>l.includes('reconnected and re-read')),false);
});

test('a reconnect whose snapshot fails is NOT claimed as reconnected',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const first=createFakeLink(worker);
  const second=createFakeLink(worker);
  let connectCalls=0;
  const lines=[];
  const stops=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>{connectCalls+=1;return connectCalls===1?first:second;},
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
    onStop:info=>stops.push(info),
    limits:{replayPages:100,replayEvents:150,pageLimit:100,reconnectAttempts:2,reconnectDelayMs:1,authorityIntervalMs:0},
  });
  await repl.start();
  worker.state.failRead=true;
  first.drop();
  const done=await waitFor(()=>stops.length===1);
  assert.equal(done,true);
  assert.equal(lines.some(l=>l.includes('reconnected and re-read')),false,
    'a failed snapshot is never announced as a reconnect');
  assert.equal(lines.some(l=>l.includes('reconnect read failed')),true);
});

test('only /quit, /status and /resnapshot are accepted; every other line is rejected',async()=>{
  const worker=createWorker({snapshot:snapshot([message('m1','user','hello')])});
  const link=createFakeLink(worker);
  const lines=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>link,
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
  });
  await repl.start();
  const before=link.calls.length;
  const rejected=await repl.handleLine('send this to the chief');
  assert.equal(rejected.ok,false);
  assert.equal(rejected.code,'INPUT_REJECTED');
  assert.equal(link.calls.length,before,'a rejected input causes NO call at all');
  assert.equal(lines.some(l=>l.includes('watch-only')),true);
  const status=await repl.handleLine('/status');
  assert.equal(status.code,'STATUS');
  const resnapshot=await repl.handleLine('/resnapshot');
  assert.equal(resnapshot.code,'RESNAPSHOT');
  assert.equal(link.calls.filter(c=>c.type==='conversation.read').length,2);
  const quit=await repl.handleLine('/quit');
  assert.equal(quit.code,'QUIT');
  assert.equal(repl.isRunning(),false);
  assert.equal(worker.state.unsubscribed,true);
});

test('an incoming message that LOOKS like a command stays data',async()=>{
  const worker=createWorker({
    snapshot:snapshot([message('m1','user','/quit'),message('m2','user','/status')]),
  });
  const link=createFakeLink(worker);
  const lines=[];
  const repl=createWatchRepl({
    binding:BINDING,
    connect:async()=>link,
    authority:async()=>({authorized:true}),
    output:line=>lines.push(line),
  });
  await repl.start();
  assert.equal(lines.some(l=>l.includes('[user] rev1: /quit')),true);
  assert.equal(repl.isRunning(),true);
});
