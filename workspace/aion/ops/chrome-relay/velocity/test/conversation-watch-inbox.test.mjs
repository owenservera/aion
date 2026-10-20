// AION P4 — the pure, memory-only inbox reducer.
//
// No transport, no file, no socket: the inbox is fed canonical P1 data and
// produces a bounded, ordered, escaped view.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createInbox,escapeForTerminal,COVERAGE_LABEL,INBOX_LIMITS} from '../src/conversation/inbox.mjs';
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
function event(key,role,text,{epoch='page-1',sequence=1,revision=1,identity='provider_dom_id'}={}){
  return createConversationEvent({
    binding:BINDING,pageEpoch:epoch,cursor:{epoch:'stream-1',sequence},
    message:message(key,role,text,{revision,identity}),
    coverage:COVERAGE,observedAtMs:1000,
  });
}
function snapshot(messages,{epoch='page-1',sequence=1}={}){
  return createConversationSnapshot({
    binding:BINDING,pageEpoch:epoch,cursor:{epoch:'stream-1',sequence},
    messages,coverage:COVERAGE,observedAtMs:1000,
  });
}

test('the initial snapshot is a BASELINE and its history coverage stays unproven',()=>{
  const inbox=createInbox();
  const applied=inbox.applySnapshot(snapshot([
    message('m1','user','hello'),
    message('m2','assistant','hi'),
  ]));
  assert.equal(applied.applied,2);
  const status=inbox.status();
  assert.equal(status.count,2);
  assert.equal(status.baseline_captured,true);
  assert.equal(status.coverage.complete_history,false);
  assert.equal(status.coverage.label,COVERAGE_LABEL.BASELINE_UNPROVEN);
});

test('untrusted text cannot drive the terminal',()=>{
  const inbox=createInbox();
  const hostile='\u001b[31mred\u001b[0m\u0007\u202e\u000b';
  inbox.applySnapshot(snapshot([message('m1','user',hostile)]));
  const view=inbox.view();
  assert.equal(view.length,1);
  assert.equal(/[\u001b\u0000-\u001f\u007f-\u009f\u202a-\u202e]/.test(view[0].text),false);
  assert.equal(view[0].text.includes('\\x1b'),true);
  assert.equal(escapeForTerminal('\u001b[2J'),'\\x1b[2J');
});

test('a higher revision updates the message and stays visible',()=>{
  const inbox=createInbox();
  const first=inbox.applyEvent(event('m1','assistant','first',{revision:1}));
  assert.equal(first.change,'first_seen');
  const stale=inbox.applyEvent(event('m1','assistant','first',{revision:1}));
  assert.equal(stale.applied,false);
  assert.equal(stale.reason,'stale_or_duplicate_revision');
  const revised=inbox.applyEvent(event('m1','assistant','second',{revision:2}));
  assert.equal(revised.change,'revised');
  const view=inbox.view();
  assert.equal(view.length,1);
  assert.equal(view[0].revision,2);
  assert.equal(view[0].text,'second');
  assert.equal(view[0].revised,true);
});

test('a stable provider id is ONE message across reconnects',()=>{
  const inbox=createInbox();
  inbox.applySnapshot(snapshot([message('m1','user','hello')]));
  inbox.applyEvent(event('m1','user','hello',{epoch:'page-2',sequence:9}));
  assert.equal(inbox.status().count,1);
});

test('a provisional page position only merges inside its own page epoch',()=>{
  const inbox=createInbox();
  inbox.applyEvent(event('pos-0','user','a',{epoch:'page-1',identity:'provisional_page_position'}));
  inbox.applyEvent(event('pos-0','user','a',{epoch:'page-1',identity:'provisional_page_position'}));
  assert.equal(inbox.status().count,1);
  inbox.applyEvent(event('pos-0','user','a',{epoch:'page-2',identity:'provisional_page_position'}));
  assert.equal(inbox.status().count,2);
});

test('the inbox keeps at most 200 messages and counts what it dropped',()=>{
  const inbox=createInbox();
  // A P1 snapshot carries at most 200 messages; the inbox bound applies to
  // the accumulating view as well.
  const messages=[];
  for(let i=0;i<200;i+=1)messages.push(message(`m${i}`,'user',`text ${i}`));
  inbox.applySnapshot(snapshot(messages));
  for(let i=200;i<250;i+=1)
    inbox.applyEvent(event(`m${i}`,'user',`text ${i}`,{sequence:i,epoch:'page-1'}));
  const status=inbox.status();
  assert.equal(status.count,INBOX_LIMITS.messages);
  assert.equal(status.dropped,50);
  // The NEWEST messages are the ones that survive.
  assert.equal(inbox.view().at(-1).key,'m249');
});

test('a gap page is never applied: the caller must read a snapshot',()=>{
  const inbox=createInbox();
  const applied=inbox.applyPage({
    status:'gap',reason:'cursor_before_retained_range',items:[],has_more:false,next_cursor:null,
  });
  assert.equal(applied.applied,0);
  assert.equal(inbox.status().gap,true);
  assert.equal(inbox.status().coverage.label,COVERAGE_LABEL.UNCERTAIN);
});

test('a page is applied in ascending sequence order',()=>{
  const inbox=createInbox();
  const applied=inbox.applyPage({
    status:'ok',reason:'',hasMore:false,nextCursor:{epoch:'stream-1',sequence:2},complete_history:false,
    items:[
      {sequence:2,revision:1,event:event('m2','user','second',{sequence:2})},
      {sequence:1,revision:1,event:event('m1','user','first',{sequence:1})},
    ],
  });
  assert.equal(applied.applied,2);
  assert.equal(applied.hasMore,false);
  assert.deepEqual(applied.nextCursor,{epoch:'stream-1',sequence:2});
  assert.deepEqual(inbox.view().map(v=>v.key),['m1','m2']);
  // The cursor of the view is the STREAM cursor of the page.
  assert.deepEqual(inbox.status().cursor,{epoch:'stream-1',sequence:2});
});

test('the snake_case page alias of the P3 wire is read as well',()=>{
  const inbox=createInbox();
  const applied=inbox.applyPage({
    status:'ok',reason:'',has_more:true,next_cursor:{epoch:'stream-1',sequence:5},complete_history:false,
    items:[{sequence:5,revision:1,event:event('m5','user','fifth',{sequence:5})}],
  });
  assert.equal(applied.applied,1);
  assert.equal(applied.hasMore,true);
  assert.deepEqual(applied.nextCursor,{epoch:'stream-1',sequence:5});
});

test('a page without a cursor never fabricates one from the page epoch',()=>{
  const inbox=createInbox();
  inbox.applySnapshot(snapshot([message('m1','user','hello')],{epoch:'page-9'}));
  const applied=inbox.applyPage({
    status:'ok',reason:'',hasMore:true,nextCursor:null,complete_history:false,
    items:[{sequence:2,revision:1,event:event('m2','user','second',{epoch:'page-9',sequence:2})}],
  });
  assert.equal(applied.applied,1);
  assert.equal(applied.cursor_missing,true);
  // The cursor comes from the event's own canonical STREAM cursor, never
  // from the page epoch.
  assert.equal(inbox.status().cursor.epoch,'stream-1');
  assert.notEqual(inbox.status().cursor.epoch,'page-9');
  assert.equal(inbox.status().cursor.sequence,2);
});

test('clearing the inbox drops every retained text',()=>{
  const inbox=createInbox();
  inbox.applySnapshot(snapshot([message('m1','user','hello')]));
  inbox.clear();
  assert.equal(inbox.status().count,0);
  assert.equal(inbox.view().length,0);
});
