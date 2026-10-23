// Stream role classifier: structural, content-free, heuristic. Synthetic inputs only (no browser, no
// capture, no network). Inputs are built the way the product builds them: raw L1 records go through a
// StreamReducer, and summary()/eventsOf()/assembled()/applyStreamMap() are what the classifier gets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StreamReducer } from '../../src/replay/reducer.mjs';
import { detectStreamMap, applyStreamMap } from '../../src/profiles/stream-map.mjs';
import {
  classifyStreamRole, streamingEvidence, resolveClassifierOptions, STREAM_ROLES, CONFIDENCE_LEVELS, EVIDENCE_FEATURES,
} from '../../src/replay/stream-role.mjs';

const SENTINEL = 'ZQSENTINEL';
const HOST = 'https://private-host.example.test';
const seen = []; // every result produced below; checked by the contract test at the end

function classify(stream, opts) {
  const r = classifyStreamRole(stream, opts);
  seen.push(r);
  return r;
}

const featureNames = (r) => r.evidence.map((e) => e.feature);
const countOf = (r, f) => r.evidence.find((e) => e.feature === f)?.count ?? 0;

// ---- product-shaped inputs -------------------------------------------------------------------
function http(sid, { url = `${HOST}/api/thing`, method = 'GET', type = 'Fetch', mime = 'application/json', chunks = [], status = 200 } = {}) {
  const recs = [];
  let seq = 1; let t = 1000;
  recs.push({ k: 'req', sid, seq: seq++, t: t++, url, method, type });
  recs.push({ k: 'res', sid, seq: seq++, t: t++, status, mime, protocol: 'h2' });
  for (const c of chunks) recs.push({ k: 'chunk', sid, seq: seq++, t: t++, b64: Buffer.from(c).toString('base64') });
  recs.push({ k: 'done', sid, seq: seq++, t: t++, encodedDataLength: 1 });
  return recs;
}
function eventSource(sid, datas, { url = `${HOST}/events` } = {}) {
  const recs = [{ k: 'req', sid, seq: 1, t: 1000, url, method: 'GET', type: 'EventSource' }];
  datas.forEach((d, i) => recs.push({ k: 'es.msg', sid, seq: 2 + i, t: 1001 + i, eventName: 'message', data: d }));
  return recs;
}
function product(recs, sid) {
  const r = new StreamReducer();
  r.ingestAll(recs);
  const summary = r.summary().streams.find((s) => s.sid === sid);
  const events = r.eventsOf(sid);
  const det = detectStreamMap(events);
  return { summary, events, assembled: r.assembled(sid), map: det.map ? applyStreamMap(det.map, events) : undefined };
}
const sse = (payloads) => payloads.map((p) => `data: ${typeof p === 'string' ? p : JSON.stringify(p)}\n\n`).join('');
const split = (s, n) => { const k = Math.ceil(s.length / n); return Array.from({ length: n }, (_, i) => s.slice(i * k, (i + 1) * k)).filter(Boolean); };

// Same shapes as the committed dialect fixtures, with sentinel text.
const claudeReply = () => sse([
  { type: 'message_start', message: { id: 'msg_1', role: 'assistant', content: [] } },
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: `${SENTINEL} Hel` } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'lo, ' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'friend' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '!' } },
  { type: 'content_block_stop', index: 0 },
  { type: 'message_stop' },
]);
const gptReply = (withNullErrors) => sse([
  { v: { message: { id: 'm1', author: { role: 'assistant' }, content: { content_type: 'text', parts: [''] }, status: 'in_progress' }, ...(withNullErrors ? { error: null, error_code: null } : {}) } },
  { p: '/message/content/parts/0', o: 'append', v: `${SENTINEL} Hello` },
  { v: ' wor' }, { v: 'ld, ' }, { v: 'again' },
  '[DONE]',
]);

// ---- 1. static config arrays vs message history ---------------------------------------------
const CONFIG_DOC = JSON.stringify({
  models: [
    { id: 'm-1', name: 'Alpha', role: 'default', enabled: true },
    { id: 'm-2', name: 'Beta', role: 'assistant', enabled: false },
    { id: 'm-3', name: 'Gamma', role: 'system', enabled: true },
  ],
  features: { voice: true, canvas: false, search: true },
  limits: { maxFiles: 10 },
});

test('static config JSON split across chunks is config, not history and not application streaming', () => {
  const p = product(http('c1', { chunks: split(CONFIG_DOC, 4) }), 'c1');
  assert.ok(p.summary.chunks >= 2, 'fixture really is multi-chunk');
  assert.equal(p.events.filter((e) => e.json !== undefined).length, 1, 'one decoded document');
  const r = classify(p);
  assert.equal(r.role, 'config');
  assert.ok(['medium', 'high'].includes(r.confidence));
  assert.ok(countOf(r, 'descriptor_array_entries') >= 3);
  assert.ok(countOf(r, 'boolean_leaves') >= 3);
  assert.equal(countOf(r, 'message_entries'), 0, 'role-named model entries without content are not messages');
});

test('role-valued entries with empty or absent content never count as history', () => {
  const doc = { items: [{ role: 'assistant', content: '' }, { role: 'user', content: [] }, { role: 'system' }, { role: 'user', text: '   ' }] };
  const r = classify({ events: [{ json: doc }] });
  assert.notEqual(r.role, 'history-load');
  assert.equal(countOf(r, 'message_entries'), 0);
});

test('a real typed message collection is history-load (also through a mapping container)', () => {
  const body = JSON.stringify({ conversation: { messages: [
    { role: 'user', content: `${SENTINEL} question` },
    { role: 'assistant', content: [{ type: 'text', text: 'an answer' }] },
  ] } });
  const r = classify(product(http('h1', { chunks: [body] }), 'h1'));
  assert.equal(r.role, 'history-load');
  assert.equal(r.confidence, 'high');
  assert.equal(countOf(r, 'message_entries'), 2);
  assert.equal(countOf(r, 'message_roles_distinct'), 2);

  const mapping = { mapping: {
    a: { id: 'a', message: { author: { role: 'user' }, content: { parts: ['one'] } } },
    b: { id: 'b', message: { author: { role: 'assistant' }, content: { parts: ['two'] } } },
    root: { id: 'root', message: null },
  } };
  const r2 = classify({ events: [{ json: mapping }] });
  assert.equal(r2.role, 'history-load');
});

test('a single message-like object is not enough for history', () => {
  const r = classify({ events: [{ json: { message: { role: 'assistant', content: 'one lonely message' } } }] });
  assert.notEqual(r.role, 'history-load');
});

// ---- 2. telemetry with typed evidence --------------------------------------------------------
test('timestamped numeric records with a repeated shape are telemetry, with typed evidence', () => {
  const batch = { batch: [0, 1, 2, 3].map((i) => ({ ts: 1760000000000 + i * 1000, cpu: 0.3 + i / 100, mem: 2048 + i, ok: true })) };
  const r = classify(product(http('t1', { method: 'POST', chunks: [JSON.stringify(batch)] }), 't1'));
  assert.equal(r.role, 'telemetry');
  assert.ok(countOf(r, 'timestamp_values') >= 4);
  assert.ok(countOf(r, 'numeric_leaves') >= 8);
  assert.ok(countOf(r, 'repeated_record_shape') >= 4);
  assert.equal(countOf(r, 'message_entries'), 0);
});

test('numeric records without any time evidence stay unknown; key names like metrics do not help', () => {
  const batch = { metrics: [1, 2, 3, 4].map((i) => ({ a: i, b: i * 2, c: i * 3 })) };
  const r = classify({ events: [{ json: batch }] });
  assert.equal(r.role, 'unknown');
});

// ---- 3. genuine reply: mapped / delta evidence ---------------------------------------------
test('typed-event reply with a matching stream map is chat-reply with high confidence', () => {
  const p = product(http('r1', { method: 'POST', mime: 'text/event-stream', chunks: split(claudeReply(), 3) }), 'r1');
  assert.ok(p.map, 'a built-in stream map matched');
  const r = classify(p);
  assert.equal(r.role, 'chat-reply');
  assert.equal(r.confidence, 'high');
  assert.ok(countOf(r, 'mapped_text_components') >= 1);
  assert.ok(countOf(r, 'delta_growth_steps') >= 4);
  assert.ok(countOf(r, 'delta_growth_targets') >= 1);
  assert.ok(countOf(r, 'mapped_message_components') >= 1);
  assert.ok(countOf(r, 'assistant_role_frames') >= 1);
});

test('path-op reply (bare continuation values) is chat-reply', () => {
  const p = product(http('r2', { method: 'POST', mime: 'text/event-stream', chunks: [gptReply(false)] }), 'r2');
  const r = classify(p);
  assert.equal(r.role, 'chat-reply');
  assert.ok(countOf(r, 'delta_growth_steps') >= 4);
});

test('delta growth alone (no stream map, chat-completions shape) is chat-reply at medium', () => {
  const body = sse([
    { id: 'c1', choices: [{ index: 0, delta: { role: 'assistant', content: '' } }] },
    { choices: [{ index: 0, delta: { content: 'The ' } }] },
    { choices: [{ index: 0, delta: { content: 'quick ' } }] },
    { choices: [{ index: 0, delta: { content: 'fox' } }] },
    { choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] },
    '[DONE]',
  ]);
  const p = product(http('r3', { method: 'POST', mime: 'text/event-stream', chunks: [body] }), 'r3');
  // Only the [DONE] terminal matches a built-in map; no reply text is mapped.
  assert.equal(p.map?.components.length ?? 0, 0);
  const r = classify(p);
  assert.equal(r.role, 'chat-reply');
  assert.equal(r.confidence, 'medium');
  assert.equal(countOf(r, 'mapped_text_components'), 0);
  assert.ok(countOf(r, 'assistant_role_frames') >= 1);
});

test('cumulative snapshot growth is incremental text but, alone, not a chat reply', () => {
  const events = ['Hel', 'Hello', 'Hello wor', 'Hello world'].map((text, i) => ({ seq: i, json: { id: 'x', status: 'running', output: text } }));
  const ev = streamingEvidence({ events });
  assert.equal(ev.incrementalText, true);
  assert.equal(ev.chatCorroborated, false);
  assert.equal(ev.strong, false);
  const r = classify({ events });
  assert.equal(r.role, 'unknown');
  assert.ok(featureNames(r).includes('weak_evidence_only'));
  assert.ok(countOf(r, 'delta_growth_steps') >= 3, 'the growth itself is still reported');

  // the same growth next to a typed assistant frame is a chat reply
  const framed = [{ json: { message: { role: 'assistant', content: '' } } }, ...events];
  assert.equal(streamingEvidence({ events: framed }).strong, true);
  assert.equal(classify({ events: framed }).role, 'chat-reply');
});

test('generic incremental text (editor, log, notification, growing document) is never chat-reply', () => {
  const editor = ['alpha ', 'beta ', 'gamma ', 'delta '].map((text) => ({ json: { type: 'doc_delta', index: 0, delta: { type: 'text_delta', text } } }));
  const logs = [{ p: '/log', o: 'append', v: 'boot ok\n' }, { v: 'net up\n' }, { v: 'disk ok\n' }, { v: 'ready\n' }].map((json) => ({ json }));
  const notice = ['New ', 'message ', 'from ', 'system'].map((t) => ({ json: { choices: [{ index: 0, delta: { content: t } }] } }));
  const growingDoc = ['Quarterly', 'Quarterly report', 'Quarterly report draft', 'Quarterly report draft v2'].map((title) => ({ json: { kind: 'article', title, n: 1 } }));
  // a model list with an assistant-valued entry but no content slot is not an assistant frame
  const withModelList = [{ json: { models: [{ id: 'a', name: 'A', role: 'assistant' }] } }, ...editor];
  // a user-only role frame is not an assistant frame
  const userFrame = [{ json: { role: 'user', content: 'hi' } }, ...editor];
  for (const events of [editor, logs, notice, growingDoc, withModelList, userFrame]) {
    const ev = streamingEvidence({ events });
    assert.equal(ev.incrementalText, true);
    assert.equal(ev.strong, false);
    const r = classify({ events });
    assert.notEqual(r.role, 'chat-reply');
    assert.equal(countOf(r, 'assistant_role_frames'), 0);
  }
});

test('a map that only matched a terminal is not a mapped reply; a real mapped reply is', () => {
  const done = product(http('d1', { method: 'POST', mime: 'text/event-stream', chunks: [sse(['[DONE]'])] }), 'd1');
  assert.ok(done.map, 'the terminal matched a built-in map');
  assert.equal(done.map.components.length, 0);
  const r = classify(done);
  assert.equal(r.role, 'unknown');
  assert.equal(countOf(r, 'mapped_message_components'), 0);
  assert.equal(streamingEvidence(done).chatCorroborated, false);

  const real = product(http('d2', { method: 'POST', mime: 'text/event-stream', chunks: [claudeReply()] }), 'd2');
  const ev = streamingEvidence(real);
  assert.ok(ev.mappedMessageComponents >= 1);
  assert.equal(ev.strong, true);
  assert.equal(ev.kinds, 3);
  // container-less text components (a stream cut before message_start) are not corroboration by themselves
  assert.equal(streamingEvidence({ map: { components: [{ component: 'paragraph', textLength: 40 }], stats: { mapped: 5 } } }).chatCorroborated, false);
});

// ---- delta-shaped but not text: must not be chat -------------------------------------------
test('delta-shaped config updates are not chat-reply', () => {
  const toggles = ['dark', 'light', 'dark', 'light', 'dark'].map((v) => ({ json: { type: 'config_delta', delta: { theme: v } } }));
  const patches = ['dark', 'light', 'dark', 'light'].map((value) => ({ json: [{ op: 'replace', path: '/theme', value }] }));
  const pathOps = [{ p: '/ui/theme', o: 'replace', v: 'dark' }, { p: '/ui/lang', o: 'replace', v: 'en' }, { p: '/ui/font', o: 'replace', v: 'mono' }, { p: '/ui/size', o: 'replace', v: 'lg' }].map((json) => ({ json }));
  const counters = ['1', '2', '3', '4'].map((v) => ({ json: { type: 'counter_delta', delta: { count: v } } }));
  const numericAppend = [{ p: '/n', o: 'append', v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }].map((json) => ({ json }));
  for (const events of [toggles, patches, pathOps, counters, numericAppend]) {
    assert.equal(streamingEvidence({ events }).strong, false);
    const r = classify({ events });
    assert.notEqual(r.role, 'chat-reply');
    assert.equal(countOf(r, 'delta_growth_steps'), 0);
  }
});

test('many chunks or SSE framing alone never prove chat', () => {
  const body = sse(Array.from({ length: 12 }, (_, i) => ({ seq: i, level: 'info', ok: true, region: 'eu' })));
  const p = product(http('g1', { mime: 'text/event-stream', chunks: split(body, 6) }), 'g1');
  assert.ok(p.summary.chunks >= 6);
  assert.ok(p.summary.streaming);
  assert.notEqual(classify(p).role, 'chat-reply');
});

// ---- 4. generic multi-chunk JSON -------------------------------------------------------------
test('generic multi-chunk JSON without structural evidence is unknown', () => {
  const doc = JSON.stringify({ alpha: 'one', beta: { gamma: 'two', delta: 'three' }, note: 'some words here', list: ['a', 'b', 'c'] });
  const p = product(http('j1', { chunks: split(doc, 5) }), 'j1');
  assert.ok(p.summary.chunks >= 5);
  const r = classify(p);
  assert.equal(r.role, 'unknown');
  assert.equal(r.confidence, 'none');
  assert.ok(featureNames(r).includes('no_structural_evidence'));
});

// ---- 5. assets -------------------------------------------------------------------------------
test('image and stylesheet responses are assets (media type and resource type, no JSON)', () => {
  const png = product(http('a1', { mime: 'image/png', type: 'Image', chunks: [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])] }), 'a1');
  const r = classify(png);
  assert.equal(r.role, 'asset');
  assert.equal(r.confidence, 'high');
  assert.equal(countOf(r, 'asset_media_type'), 1);
  assert.equal(countOf(r, 'asset_resource_type'), 1);

  const css = product(http('a2', { mime: 'text/css', type: 'Stylesheet', chunks: ['body{color:red}'] }), 'a2');
  assert.equal(classify(css).role, 'asset');

  assert.equal(classify({ summary: { mime: 'font/woff2', bytes: 900, chunks: 1 } }).role, 'asset');
});

test('an asset-looking URL does not make a JSON response an asset', () => {
  const p = product(http('a3', { url: `${HOST}/static/logo.png`, chunks: ['{"x":"y"}'] }), 'a3');
  assert.notEqual(classify(p).role, 'asset');
  assert.equal(classify({ summary: { mime: 'image/png', resourceType: 'Image', bytes: 20, chunks: 1 }, events: [{ json: { alpha: 'one' } }] }).role === 'asset', false);
});

// ---- 6. ambiguous endpoint -------------------------------------------------------------------
test('URL and key-name hints are insufficient: a chat-looking endpoint with flat JSON is unknown', () => {
  const p = product(http('u1', { url: `${HOST}/api/conversation/stream`, method: 'POST', chunks: ['{"ok":"yes","id":"abc"}'] }), 'u1');
  assert.equal(classify(p).role, 'unknown');
  const named = [{ json: { message: 'x', role: 'assistant', content: 'one', error: 'x' } }];
  assert.equal(classify({ events: named }).role, 'unknown');
});

// ---- 7. empty stream -------------------------------------------------------------------------
test('empty or missing input is unknown with an empty_stream marker', () => {
  for (const input of [undefined, null, {}, { events: [] }, { summary: { sid: 's', chunks: 0, bytes: 0, events: 0 } }]) {
    const r = classify(input);
    assert.equal(r.role, 'unknown');
    assert.equal(r.confidence, 'none');
    assert.deepEqual(featureNames(r), ['empty_stream']);
  }
  const opened = product([{ k: 'req', sid: 'e1', seq: 1, t: 1, url: `${HOST}/x`, method: 'GET', type: 'Fetch' }], 'e1');
  assert.deepEqual(featureNames(classify(opened)), ['empty_stream']);
  const emptyImage = classify({ summary: { mime: 'image/png', resourceType: 'Image', bytes: 0, chunks: 0, events: 0 } });
  assert.equal(emptyImage.role, 'unknown');
});

// ---- 8. null error keys ----------------------------------------------------------------------
test('null error / error_code keys are not errors and do not change the role', () => {
  const clean = classify(product(http('n1', { method: 'POST', mime: 'text/event-stream', chunks: [gptReply(false)] }), 'n1'));
  const withNulls = classify(product(http('n2', { method: 'POST', mime: 'text/event-stream', chunks: [gptReply(true)] }), 'n2'));
  assert.equal(withNulls.role, 'chat-reply');
  assert.equal(withNulls.role, clean.role);
  assert.equal(withNulls.confidence, clean.confidence);
  assert.deepEqual(withNulls.evidence, clean.evidence);
  assert.ok(!featureNames(withNulls).some((f) => /error/.test(f)));

  const cfg = classify({ events: [{ json: { error: null, error_code: null, a: true, b: false, c: true, d: 1 } }] });
  assert.ok(!featureNames(cfg).some((f) => /error/.test(f)));
});

// ---- 9. conflicting evidence -----------------------------------------------------------------
test('substantial history and reply evidence together stay unknown and say so', () => {
  const events = [
    { json: { messages: [{ role: 'user', content: 'q' }, { role: 'assistant', content: 'a' }] } },
    ...['one ', 'two ', 'three ', 'four'].map((text) => ({ json: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } } })),
  ];
  const r = classify({ events });
  assert.equal(r.role, 'unknown');
  assert.equal(r.confidence, 'none');
  assert.ok(featureNames(r).includes('conflicting_role_evidence'));
  assert.ok(featureNames(r).includes('delta_growth_steps'));
  assert.ok(featureNames(r).includes('message_entries'));
});

// ---- push-presence and auth ------------------------------------------------------------------
test('heartbeats plus small flat state frames on a push channel are push-presence', () => {
  const p = product(eventSource('p1', ['{"online":true}', 'ping', '{"online":false}', 'ping', '{"online":true}']), 'p1');
  assert.ok(p.summary.esMessages >= 5);
  const r = classify(p);
  assert.equal(r.role, 'push-presence');
  assert.ok(countOf(r, 'heartbeat_events') >= 2);
  assert.ok(countOf(r, 'small_flat_payloads') >= 3);
});

test('presence-looking keys without heartbeats are unknown; heartbeats alone are unknown', () => {
  const named = product(eventSource('p2', Array.from({ length: 3 }, () => '{"presence":"online","typing":true}')), 'p2');
  assert.equal(classify(named).role, 'unknown');
  const beatsOnly = product(eventSource('p3', ['ping', 'ping', 'ping']), 'p3');
  assert.equal(classify(beatsOnly).role, 'unknown');
});

const JWT = 'eyJhbGciOiJI.eyJzdWIiOiIx.c2lnbmF0dXJl'; // synthetic, three base64url-looking segments

test('a typed token-exchange response (token slot + expiry slot, POST 2xx) is auth', () => {
  const body = JSON.stringify({ access_token: JWT, token_type: 'Bearer', expires_in: 3600 });
  const a = classify(product(http('x1', { method: 'POST', chunks: [body] }), 'x1'));
  assert.equal(a.role, 'auth');
  assert.equal(countOf(a, 'token_exchange_structure'), 1);
  assert.equal(countOf(a, 'token_exchange_request'), 1);
  // the credential is never decoded or emitted
  assert.ok(!JSON.stringify(a).includes('eyJ'));

  // a capture-masked token slot still counts as a slot, but only WITH the expiry structure
  const masked = classify({ summary: { method: 'POST', status_code: 200, bytes: 90 }, events: [{ json: { access_token: '*'.repeat(24), expires_in: 3600 } }] });
  assert.equal(masked.role, 'auth');
  // no request metadata: structure alone still reaches auth, one level lower
  const bare = classify({ events: [{ json: { data: { accessToken: JWT, expiresAt: 1760003600 } } }] });
  assert.equal(bare.role, 'auth');
  assert.equal(bare.confidence, 'medium');
});

test('credential-shaped values, masking and redactions are weak hints, never auth alone', () => {
  const cases = {
    'plain values under token keys': [{ json: { access_token: 'abc', token_type: 'Bearer', expires_in: 3600 } }],
    'token with no expiry': [{ json: { access_token: JWT, token_type: 'Bearer' } }],
    'expiry with no token': [{ json: { expires_in: 3600, theme: 'x' } }],
    'jwt-shaped value under a neutral key': [{ json: { value: JWT, expires_in: 3600 } }],
    'arbitrary dot-separated value': [{ json: { build: 'aaaaaaaa.bbbbbbbb.cccccccc', label: 'x' } }],
    'starred markdown / rating': [{ json: { rating: '*****', summary: '***bold*** and ********** more', n: 1 } }],
    'masked arbitrary payload': [{ json: { a: '*'.repeat(32), b: 'x' } }],
  };
  for (const [name, events] of Object.entries(cases)) {
    for (const summary of [{ bytes: 100 }, { bytes: 100, redactions: 5, method: 'POST', status_code: 200 }]) {
      const r = classify({ summary, events });
      assert.notEqual(r.role, 'auth', name);
      assert.equal(r.role, 'unknown', name);
    }
  }
  // redactions alone, with an otherwise empty-looking payload
  assert.equal(classify({ summary: { bytes: 10, redactions: 3 }, events: [{ json: { ok: 'yes' } }] }).role, 'unknown');
});

test('an exchange-shaped body on a failed or odd-method response, or on a push channel, is not auth', () => {
  const doc = { access_token: JWT, expires_in: 3600 };
  assert.equal(classify({ summary: { method: 'POST', status_code: 401, bytes: 90 }, events: [{ json: doc }] }).role, 'unknown');
  assert.equal(classify({ summary: { method: 'DELETE', status_code: 200, bytes: 90 }, events: [{ json: doc }] }).role, 'unknown');
  assert.equal(classify({ summary: { method: 'POST', status_code: 200, bytes: 90, esMessages: 3 }, events: [{ json: doc }] }).role, 'unknown');
  assert.equal(classify({ summary: { method: 'POST', status_code: 200, bytes: 999999 }, events: [{ json: doc }] }).role, 'unknown');
});

test('a config document that merely carries a token stays config', () => {
  const cfg = { features: { a: true, b: false, c: true }, models: [{ id: 'm1', name: 'A' }, { id: 'm2', name: 'B' }, { id: 'm3', name: 'C' }], token: JWT };
  const r = classify({ summary: { method: 'GET', status_code: 200, bytes: 400 }, events: [{ json: cfg }] });
  assert.equal(r.role, 'config');
  assert.equal(countOf(r, 'token_exchange_structure'), 0);
});

test('a history load that merely carries a token stays history-load', () => {
  const doc = { access_token: JWT, messages: [{ role: 'user', content: 'a question' }, { role: 'assistant', content: 'an answer' }] };
  assert.equal(classify({ events: [{ json: doc }] }).role, 'history-load');
});

test('a reply that merely contains a credential-shaped value stays chat-reply', () => {
  const body = sse([
    { type: 'message_start', message: { id: 'msg_9', role: 'assistant', content: [] } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'key is ' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: JWT } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: ' ok' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_stop' },
  ]);
  const r = classify(product(http('x2', { mime: 'text/event-stream', chunks: [body] }), 'x2'));
  assert.equal(r.role, 'chat-reply');
});

// ---- options and truncation ----------------------------------------------------------------------
test('opts are validated: bad budgets fall back, growth thresholds can only tighten', () => {
  const d = resolveClassifierOptions();
  assert.deepEqual(d, resolveClassifierOptions({}));
  for (const bad of [NaN, -5, 0, Infinity, -Infinity, '9', null, {}, [], true]) {
    assert.deepEqual(resolveClassifierOptions({ maxEvents: bad, maxNodes: bad, minGrowthSteps: bad, minGrowthDistinct: bad, minGrowthChars: bad, smallDocBytes: bad }), d, String(bad));
  }
  assert.deepEqual(resolveClassifierOptions(null), d);
  assert.deepEqual(resolveClassifierOptions('x'), d);
  assert.equal(resolveClassifierOptions({ minGrowthSteps: 1, minGrowthDistinct: 1, minGrowthChars: 1 }).minGrowthSteps, d.minGrowthSteps, 'cannot loosen');
  assert.equal(resolveClassifierOptions({ minGrowthSteps: 10 }).minGrowthSteps, 10);
  assert.equal(resolveClassifierOptions({ maxEvents: 1e12 }).maxEvents, 100000);
  assert.equal(resolveClassifierOptions({ maxNodes: 1 }).maxNodes, 50);
  assert.equal(resolveClassifierOptions({ smallDocBytes: 1e9 }).smallDocBytes, 65536);
  assert.equal(resolveClassifierOptions({ maxEvents: 7.9 }).maxEvents, 7);
  assert.ok(Object.isFrozen(d));
});

test('hostile thresholds cannot manufacture a reply or lower the evidence bar', () => {
  const weak = [{ json: { message: { role: 'assistant', content: '' } } }, ...['a', 'b'].map((text) => ({ json: { type: 'x', delta: { text } } }))];
  for (const opts of [{ minGrowthSteps: 0 }, { minGrowthSteps: -1, minGrowthDistinct: NaN, minGrowthChars: -Infinity }, { minGrowthSteps: 1, minGrowthDistinct: 1, minGrowthChars: 1 }]) {
    assert.equal(classify({ events: weak }, opts).role, 'unknown');
    assert.equal(streamingEvidence({ events: weak }, opts).incrementalText, false);
  }
  // and the call does not throw on NaN / Infinity budgets
  assert.doesNotThrow(() => classify({ events: weak }, { maxEvents: NaN, maxNodes: Infinity }));
});

test('inspection caps are reported and lower confidence instead of silently returning a clean verdict', () => {
  const frame = { json: { message: { role: 'assistant', content: '' } } };
  const deltas = Array.from({ length: 6 }, (_, i) => ({ json: { type: 'x', index: 0, delta: { type: 'text_delta', text: `piece-${i} ` } } }));
  const events = [frame, ...deltas];
  const full = classify({ events });
  assert.equal(full.role, 'chat-reply');
  assert.ok(!featureNames(full).includes('inspection_truncated'));

  // event cap: only the first 3 events are looked at; the verdict cannot be reached, and the cut is reported
  const capped = classify({ events }, { maxEvents: 3 });
  assert.equal(capped.role, 'unknown');
  assert.ok(featureNames(capped).includes('inspection_truncated'));
  assert.equal(countOf(capped, 'inspection_truncated'), events.length - 3);

  // node cap: a wide document that cannot be fully walked reports the cut and steps confidence down
  const wide = { models: Array.from({ length: 20 }, (_, i) => ({ id: `m${i}`, name: `M${i}`, on: i % 2 === 0 })), flags: { a: true, b: false, c: true } };
  const complete = classify({ events: [{ json: wide }] });
  assert.equal(complete.role, 'config');
  const cut = classify({ events: [{ json: wide }] }, { maxNodes: 60 });
  assert.ok(featureNames(cut).includes('inspection_truncated'));
  assert.ok(CONFIDENCE_LEVELS.indexOf(cut.confidence) <= CONFIDENCE_LEVELS.indexOf(complete.confidence));
  assert.equal(streamingEvidence({ events: [{ json: wide }] }, { maxNodes: 60 }).truncated, true);
  assert.equal(streamingEvidence({ events: [{ json: wide }] }).truncated, false);

  // a verdict reached under a cap is one level lower than the same verdict without it
  const tail = Array.from({ length: 8 }, () => ({ json: { ok: true } }));
  const uncapped = classify({ events: [...events, ...tail] });
  const capped2 = classify({ events: [...events, ...tail] }, { maxEvents: events.length });
  assert.equal(uncapped.role, 'chat-reply');
  assert.equal(capped2.role, 'chat-reply');
  assert.ok(featureNames(capped2).includes('inspection_truncated'));
  assert.ok(CONFIDENCE_LEVELS.indexOf(capped2.confidence) < CONFIDENCE_LEVELS.indexOf(uncapped.confidence));
});

// ---- contract --------------------------------------------------------------------------------
test('evidence is enum features with positive integer counts and carries no content or URLs', () => {
  assert.ok(seen.length > 20);
  for (const r of seen) {
    assert.ok(STREAM_ROLES.includes(r.role), r.role);
    assert.ok(CONFIDENCE_LEVELS.includes(r.confidence), r.confidence);
    assert.ok(Array.isArray(r.evidence));
    for (const e of r.evidence) {
      assert.deepEqual(Object.keys(e).sort(), ['count', 'feature']);
      assert.ok(EVIDENCE_FEATURES.includes(e.feature), e.feature);
      assert.ok(Number.isInteger(e.count) && e.count > 0);
    }
    const flat = JSON.stringify(r);
    assert.ok(!flat.includes(SENTINEL) && !flat.includes('private-host') && !flat.includes('https://'));
    if (r.role === 'unknown') assert.equal(r.confidence, 'none');
    else assert.notEqual(r.confidence, 'none');
  }
  assert.deepEqual([...STREAM_ROLES].sort(), ['asset', 'auth', 'chat-reply', 'config', 'history-load', 'push-presence', 'telemetry', 'unknown']);
});

test('pure: frozen input is accepted, never mutated, and results are deterministic', () => {
  const p = product(http('z1', { method: 'POST', mime: 'text/event-stream', chunks: [claudeReply()] }), 'z1');
  const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
  const before = JSON.stringify(p);
  deepFreeze(p);
  const a = classify(p);
  const b = classify(p);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(p), before);
});

test('a bare reducer summary row is accepted and classified on what it can prove', () => {
  const p = product(http('b1', { mime: 'image/svg+xml', type: 'Image', chunks: ['<svg/>'] }), 'b1');
  assert.equal(classify(p.summary).role, 'asset');
  const q = product(http('b2', { chunks: [CONFIG_DOC] }), 'b2');
  assert.equal(classify(q.summary).role, 'unknown', 'a summary alone has no payload structure');
});
