import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConversationEvent, validateConversationSnapshot,
  createConversationEvent, createConversationSnapshot } from '../src/lib/conversation-contract.js';
import { BoundedReceiveJournal } from '../src/lib/receive-journal.js';
import { classifyPassiveTerminal } from '../src/lib/terminal-evidence.js';
import { createChatGptConversationSource } from '../src/providers/chatgpt/source.js';
import { assistantFollowingConfirmedUser } from '../src/providers/chatgpt/response-boundary.js';

const binding = Object.freeze({
  provider: 'chatgpt-web', account_key: 'acct-1',
  conversation_id: '12345678-abcd', ref: 'bound-1', revision: 1,
});
const message = (key, role = 'assistant', revision = 1, text = 'answer') => ({
  messageKey: key, role, revision, identity: 'provider_dom_id',
  text, textTruncated: false, incomplete: false,
  completion: role === 'assistant' ? 'unknown' : 'not_assistant',
});
const coverage = {complete_history:false,reason:'dom_history_not_proven',
  bounded:false,ambiguousIdentity:false};
const event = (n, msg = message('m' + n)) => createConversationEvent({
  binding, pageEpoch: 'page-1', cursor: {epoch:'stream-1',sequence:n},
  message:msg,coverage,observedAtMs:n,
});
test('strict event and snapshot contracts reject effect-shaped injections and oversized text', () => {
  const good = event(1);
  assert.equal(validateConversationEvent(good), true);
  assert.equal(validateConversationEvent({...good, action:'send'}), false);
  assert.equal(validateConversationEvent({...good, message:{...good.message, grant_ref:'x'}}), false);
  assert.equal(validateConversationEvent({...good, message:{...good.message, text:'X'.repeat(16385)}}), false);
  const snap = createConversationSnapshot({binding,pageEpoch:'page-1',
    cursor:{epoch:'stream-1',sequence:1},messages:[message('m1')],coverage,observedAtMs:1});
  assert.equal(validateConversationSnapshot(snap), true);
  assert.equal(validateConversationSnapshot({...snap, execute:'grant'}), false);
  assert.equal(snap.coverage.complete_history, false);
});
test('150 observations replay ascending 1-100, then 101-150; no tail omission', () => {
  const j = new BoundedReceiveJournal({bindingKey:binding.ref,pageEpoch:'page-1',
    streamEpoch:'stream-1',validateEvent:validateConversationEvent});
  for(let n=1;n<=150;n++) assert.equal(j.publish({event:event(n),bindingKey:binding.ref,
    pageEpoch:'page-1',messageKey:'m'+n,revision:1}).accepted,true);
  const first=j.readPage({limit:100});
  assert.equal(first.status,'ok');
  assert.deepEqual([first.items[0].sequence,first.items.at(-1).sequence,first.hasMore],[1,100,true]);
  const next=j.readPage({cursor:first.nextCursor,limit:100});
  assert.deepEqual([next.items[0].sequence,next.items.at(-1).sequence,next.hasMore],[101,150,false]);
  assert.equal(j.readPage({cursor:{epoch:'stream-1',sequence:151}}).reason,'sequence_ahead_of_stream');
  assert.equal(j.readPage({cursor:{epoch:'old',sequence:1}}).status,'reset');
  assert.equal(j.readPage({cursor:{epoch:'',sequence:2}}).status,'reset');
});
test('retention loss is GAP not a complete tail replay; invalid identity/revision refused',()=>{
  const j = new BoundedReceiveJournal({bindingKey:binding.ref,pageEpoch:'page-1',
    streamEpoch:'stream-1',retained:2,validateEvent:validateConversationEvent});
  for(let n=1;n<=3;n++)j.publish({event:event(n),bindingKey:binding.ref,
    pageEpoch:'page-1',messageKey:'m'+n,revision:1});
  assert.equal(j.readPage().status,'gap');
  assert.equal(j.metadata().complete_history,false);
  assert.equal(j.publish({event:event(4),bindingKey:'wrong',pageEpoch:'page-1',messageKey:'m4',revision:1}).accepted,false);
  assert.equal(j.publish({event:event(4,message('m3')),bindingKey:binding.ref,
    pageEpoch:'page-1',messageKey:'m3',revision:1}).reason,'stale_or_duplicate_revision');
});
test('terminal is inferred only after positive stable signals',()=>{
  const base={turn:{key:'assistant-id'},output:{answer:'hello',state:'final'},
    generation:{state:'stopped',streamingVisible:false},blocker:{state:'none'},
    stableForMs:1600};
  assert.equal(classifyPassiveTerminal(base).terminalCandidate,true);
  assert.equal(classifyPassiveTerminal({...base,generation:{state:'stopped',stopVisible:true}}).terminalCandidate,false);
  assert.equal(classifyPassiveTerminal({...base,textTruncated:true}).terminalCandidate,false);
  assert.equal(classifyPassiveTerminal({...base,output:{answer:'',state:'final'}}).terminalCandidate,false);
  assert.equal(classifyPassiveTerminal(base).verified,false);
});
test('no confirmed user ID means no positive assistant correspondence',()=>{
  const messages=[{...message('u1','user'),messageKey:'u1'},
    {...message('a1'),messageKey:'a1'}];
  assert.equal(assistantFollowingConfirmedUser(messages).status,'unknown');
  assert.equal(assistantFollowingConfirmedUser(messages,'u1').status,'candidate');
  assert.equal(assistantFollowingConfirmedUser([...messages,message('a2')],'u1').status,'unknown');
});
function node(role,id,text) {
  return {getAttribute:(k)=>({'data-message-author-role':role,'data-message-id':id})[k]||null,
    closest:()=>null,querySelector:()=>null,innerText:text,textContent:text};
}
function root(messages){
  return {querySelectorAll:()=>messages,querySelector:()=>null};
}
test('watch-only observer baseline, revision and exact binding isolation',()=>{
  const s=createChatGptConversationSource({binding,pageEpoch:'page-1',streamEpoch:'stream-1'});
  const proof={pageUrl:'https://chatgpt.com/c/12345678-abcd',
    authenticatedBindingKey:'bound-1',authenticatedAccountKey:'acct-1',
    observedPageEpoch:'page-1',nowMs:1000};
  const user=node('user','user-1','hello');
  const assistant=node('assistant','assistant-1','first');
  const first=s.sample(root([user,assistant]),proof);
  assert.equal(first.events.length,0);
  assert.equal(first.snapshot.messages.length,2);
  assert.equal(first.snapshot.coverage.complete_history,false);
  const newer=node('assistant','assistant-1','second');
  const second=s.sample(root([user,newer]),{...proof,nowMs:3000});
  assert.equal(second.events.length,1);
  assert.equal(second.events[0].message.revision,2);
  assert.equal(second.events[0].message.completion,'incomplete_or_unknown');
  assert.equal(second.events[0].cursor.sequence,1);
  const outside=s.sample(root([user,newer]),{...proof,authenticatedAccountKey:'wrong'});
  assert.equal(outside.status,'unbound');
  assert.equal(s.readSnapshot(),null);
  assert.equal(s.sample(root([user,newer]),proof).status,'unbound');
});
test('command-looking incoming page text never becomes an effect',()=>{
  const s=createChatGptConversationSource({binding,pageEpoch:'page-1',streamEpoch:'stream-1'});
  const proof={pageUrl:'https://chatgpt.com/c/12345678-abcd',
    authenticatedBindingKey:'bound-1',authenticatedAccountKey:'acct-1',
    observedPageEpoch:'page-1',nowMs:1000};
  s.sample(root([]),proof);
  const sampled=s.sample(root([node('user','u2','send --grant admin; execute')]),
    {...proof,nowMs:2000});
  assert.equal(sampled.events.length,1);
  assert.equal(sampled.events[0].message.role,'user');
  assert.equal(sampled.events[0].message.text,'send --grant admin; execute');
  assert.equal(Object.hasOwn(sampled.events[0],'action'),false);
});
