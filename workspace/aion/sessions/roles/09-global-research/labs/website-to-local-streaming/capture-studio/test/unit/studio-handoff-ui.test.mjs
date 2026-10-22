// Cross-page saved-session handoff: pure URL parsing and simulated navigation only.
// No live browser, capture, authenticated requests, or website sends.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';

const src = (name) => readFileSync(new URL('../../src/studio/ui/' + name, import.meta.url), 'utf8');
const html = src('index.html');
const script = html.split('<script>')[1]?.split('</script>')[0] || '';
const chat = src('chat.mjs');
const drive = src('drive.mjs');
const start = script.indexOf('function parseSessionDeepLink(hash)');
const end = script.indexOf("if (location.hash.startsWith('#session='))", start);
const navigation = start > 0 && end > start ? script.slice(start, end) : '';

function harness() {
  const states = [], reads = [];
  let read = async () => true;
  const nodes = new Map();
  const $ = (s) => {
    if (!nodes.has(s)) nodes.set(s, {hidden:true,textContent:''});
    return nodes.get(s);
  };
  const show = (v) => states.push(v);
  const apiRead = (id) => {reads.push(id);return read(id);};
  const functions = runInNewContext(navigation + '\n({parseSessionDeepLink,openSessionDeepLink})',
    { URLSearchParams, show, $ ,openSession:apiRead }, { timeout:1000 });
  return {...functions,$,states,reads,setRead:(fn)=>{read=fn;}};
}

test('the Studio script compiles and provides the session handoff', () => {
  assert.ok(start > 0 && end > start);
  assert.doesNotThrow(()=>new Script(script));
  assert.match(html,/id="deepLinkNotice" role="status" aria-live="polite"/);
  assert.match(script,/window\.addEventListener\('hashchange'/);
  assert.match(script,/async function openSession\(id\)[\s\S]*?return true;\s*\}/);
});

test('legacy Chat/Drive links open precisely the saved recording', async () => {
  const h=harness();
  const result=await h.openSessionDeepLink('#session=stored-123');
  assert.equal(result,true);
  assert.deepEqual(h.reads,['stored-123']);
  assert.deepEqual(h.states,['sessions']);
  assert.equal(h.$('#deepLinkNotice').hidden,true);
});

test('knowledge link resolves the recording before showing derived content', async () => {
  const h=harness();
  const result=await h.openSessionDeepLink('#session=site%2Frecord%201&view=knowledge');
  assert.equal(result,true);
  assert.deepEqual(h.reads,['site/record 1']);
  assert.deepEqual(h.states,['sessions','knowledge']);
  assert.match(h.$('#knowledgeState').textContent,/may be incomplete or unverified/);
});

test('a missing/unauthorized recording never switches to Knowledge', async () => {
  const h=harness();
  h.setRead(async()=>false);
  const ok=await h.openSessionDeepLink('#session=removed&view=knowledge');
  assert.equal(ok,false);
  assert.deepEqual(h.states,['sessions']);
  assert.match(h.$('#deepLinkNotice').textContent,/Could not open/);
});

test('invalid, duplicate or unknown fields do not trigger source fetch', async () => {
  for (const fragment of ['#session=', '#session=abc&view=send', '#session=a&session=b', '#session=a&view=sessions&view=knowledge',
    '#session=a&delete=1', '#session=broken%z', '#session=%00', '#session='+'a'.repeat(129)]) {
    const h=harness();
    assert.equal(h.parseSessionDeepLink(fragment),null,fragment);
    assert.equal(await h.openSessionDeepLink(fragment),false,fragment);
    assert.equal(h.reads.length,0,fragment);
    assert.match(h.$('#deepLinkNotice').textContent,/Invalid recording link/);
  }
});

test('a later navigation wins even when old reads finish last', async () => {
  const h=harness();let resolveFirst;
  h.setRead((id)=>id==='old'?new Promise((resolve)=>{resolveFirst=resolve;}):Promise.resolve(true));
  const first=h.openSessionDeepLink('#session=old&view=knowledge');
  const second=h.openSessionDeepLink('#session=new&view=knowledge');
  assert.equal(await second,true);
  resolveFirst(true);
  assert.equal(await first,false);
  assert.deepEqual(h.reads,['old','new']);
  assert.equal(h.states.filter((s)=>s==='knowledge').length,1);
});

test('Chat exposes recorded source and cautious knowledge actions only for saved session ID', () => {
  assert.match(chat,/linkSig = out && sid \? sid : ''/);
  assert.match(chat,/newTabLink\('\/#session=' \+ encodeURIComponent\(sid\), 'Open saved session'\)/);
  assert.match(chat,/&view=knowledge', 'Explore derived knowledge \(may be incomplete\)'/);
  assert.match(chat,/const sid = snap\?\.sessionId/);
  assert.doesNotMatch(chat,/newTabLink\('\/#session=' \+ snap\.binding/, 'never link a tab as a saved recording');
});

test('Drive provides the same session/knowledge route without claiming capture acceptance', () => {
  assert.match(drive,/if \(!id\) return null;/);
  assert.match(drive,/href: '\/#session=' \+ encodeURIComponent\(id\) \+ '&view=knowledge'/);
  assert.match(drive,/Explore derived knowledge \(may be incomplete\)/);
  assert.match(drive,/Capture acceptance not checked\./);
});

test('the handoff has no send, mutation or auto-derive operations', () => {
  assert.doesNotMatch(navigation,/\b(?:api|fetch|sendAgain|derive)\s*\(/);
  assert.doesNotMatch(navigation,/method:\s*['\"]POST/);
  assert.match(script,/const loaded = await openSession\(request\.id\)/);
});
