// Stream-to-component map characterization. Synthetic fixtures only (made-up text).
// Path under test: raw SSE text -> SseDecoder -> events with sid/seq -> stream map engine.
// Assertions are by property (component text, keys, ops, reasons), not whole-document deepEqual.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SseDecoder } from '../../src/decode/decoders.mjs';
import {
  STREAM_MAP_SCHEMA,
  DEFAULT_STREAM_MAPS,
  validateStreamMap,
  applyStreamMap,
  detectStreamMap,
} from '../../src/profiles/stream-map.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(here, '..', 'fixtures', 'ai-chat-dialects');
const load = (name) => JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf8'));

// Same SSE rendering as test/unit/ai-chat-dialects.test.mjs.
function toSse(payloads) {
  return payloads.map((p) => {
    if (typeof p === 'string') return `data: ${p}\n\n`;
    const ev = typeof p.type === 'string' ? `event: ${p.type}\n` : '';
    return `${ev}data: ${JSON.stringify(p)}\n\n`;
  }).join('');
}

function decodeSse(payloads) {
  const dec = new SseDecoder();
  return [...dec.push(Buffer.from(toSse(payloads), 'utf8')), ...dec.end()];
}

// Decoded events carry no sid/seq of their own; the test stamps them the way a session would.
function streamEvents(payloads, sid = 'syn-sid') {
  return decodeSse(payloads).map((ev, i) => ({ ...ev, sid, seq: i }));
}

const MAP = Object.fromEntries(DEFAULT_STREAM_MAPS.map((m) => [m.id, m]));
const claudeMap = MAP['claude-typed-events'];
const chatgptMap = MAP['chatgpt-path-ops'];
const responsesMap = MAP['openai-responses'];

const claudePayloads = load('claude-typedevents.json').payloads;
const chatgptPayloads = load('chatgpt-pathops.json').payloads;
const responsesPayloads = load('openai-responses.json').payloads;

const CHATGPT_DELTAS = ['Hello from ', 'a made-up ', 'synthetic ', 'stream. ', 'Second sentence.'];
const claudeText = (idx) => claudePayloads
  .filter((p) => p.type === 'content_block_delta' && p.index === idx)
  .map((p) => p.delta.text)
  .join('');
const responsesText = responsesPayloads
  .filter((p) => p.type === 'response.output_text.delta')
  .map((p) => p.delta)
  .join('');

// Deterministic shuffle (no Math.random) so the "unknown dialect" test is reproducible.
function shuffled(items, seed = 7) {
  const a = items.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const byKey = (components, key) => components.find((c) => c.componentKey === key);

// ---------------------------------------------------------------------------------------------
// Validation of the built-in maps
// ---------------------------------------------------------------------------------------------

test('schema constant is the documented capture-studio.stream-map/1', () => {
  assert.equal(STREAM_MAP_SCHEMA, 'capture-studio.stream-map/1');
});

test('each default map validates', () => {
  assert.deepEqual(DEFAULT_STREAM_MAPS.map((m) => m.id), ['claude-typed-events', 'chatgpt-path-ops', 'openai-responses']);
  for (const m of DEFAULT_STREAM_MAPS) {
    const v = validateStreamMap(m);
    assert.equal(v.ok, true, `${m.id}: ${v.errors.join('; ')}`);
    assert.deepEqual(v.errors, []);
  }
});

test('validateStreamMap rejects an unknown op', () => {
  const bad = structuredClone(claudeMap);
  bad.stream.ops[0].op = 'explode';
  const v = validateStreamMap(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /unknown op "explode"/.test(e)));
});

test('validateStreamMap rejects open without a component', () => {
  const bad = structuredClone(claudeMap);
  delete bad.stream.ops[1].component;
  const v = validateStreamMap(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /open needs a component/.test(e)));
});

test('validateStreamMap rejects textPath on a non-append op', () => {
  const bad = structuredClone(claudeMap);
  bad.stream.ops[3].textPath = 'delta.text'; // content_block_stop is a close op
  const v = validateStreamMap(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /textPath is only allowed on append/.test(e)));
});

test('validateStreamMap rejects a duplicate identical when', () => {
  const bad = structuredClone(claudeMap);
  bad.stream.ops.push({ when: { type: 'ping' }, op: 'ignore' });
  const v = validateStreamMap(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /duplicate when/.test(e)));
});

test('validateStreamMap rejects a componentMap target outside the family enum', () => {
  const bad = structuredClone(claudeMap);
  bad.dom.componentMap.paragraph = 'sparkle';
  const v = validateStreamMap(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /dom\.componentMap\.paragraph targets "sparkle"/.test(e)));
});

test('validateStreamMap rejects wrong schema and unknown dialect', () => {
  const bad = { ...structuredClone(claudeMap), schema: 'other/1', dialect: 'mystery' };
  const v = validateStreamMap(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /schema must be/.test(e)));
  assert.ok(v.errors.some((e) => /unknown dialect/.test(e)));
});

test('applyStreamMap refuses an invalid map instead of guessing', () => {
  const bad = structuredClone(claudeMap);
  bad.stream.ops[1].op = 'bogus';
  assert.throws(() => applyStreamMap(bad, streamEvents(claudePayloads)), /invalid stream map/);
});

// ---------------------------------------------------------------------------------------------
// Claude typed events
// ---------------------------------------------------------------------------------------------

test('claude: each block component text equals its concatenated text_delta values', () => {
  const r = applyStreamMap(claudeMap, streamEvents(claudePayloads));
  const paragraphs = r.components.filter((c) => c.component === 'paragraph');
  assert.equal(paragraphs.length, 2);
  assert.equal(byKey(r.components, 'syn-msg-claude-001:0').text, claudeText(0));
  assert.equal(byKey(r.components, 'syn-msg-claude-001:1').text, claudeText(1));
});

test('claude: component keys are <message id>:<index>; the message container has no index so null', () => {
  const r = applyStreamMap(claudeMap, streamEvents(claudePayloads));
  const message = r.components.find((c) => c.component === 'message');
  assert.equal(message.componentKey, null);
  assert.deepEqual(r.components.map((c) => c.componentKey), [null, 'syn-msg-claude-001:0', 'syn-msg-claude-001:1']);
});

test('claude: ping and message_delta (usage/stop reason) land in ignore, not unmapped', () => {
  const r = applyStreamMap(claudeMap, streamEvents(claudePayloads));
  assert.equal(r.unmapped.length, 0);
  const ignored = r.timeline.filter((t) => t.op === 'ignore');
  assert.deepEqual(ignored.map((t) => t.seq), [4, 11]);
});

test('claude: stats count every payload once and the stream is finalized by message_stop', () => {
  const r = applyStreamMap(claudeMap, streamEvents(claudePayloads));
  assert.equal(r.stats.events, claudePayloads.length);
  assert.equal(r.stats.mapped, 11);
  assert.equal(r.stats.ignored, 2);
  assert.equal(r.stats.unmapped, 0);
  assert.equal(r.stats.finalized, true);
  assert.equal(r.stats.openComponents, 0);
  assert.ok(r.components.every((c) => c.closed !== null));
  assert.equal(r.components.find((c) => c.component === 'message').closed.seq, 12);
});

test('claude: a block without an id (no message_start in the stream) gets a null key, text still correct', () => {
  const r = applyStreamMap(claudeMap, streamEvents(claudePayloads.slice(1)));
  assert.ok(r.components.filter((c) => c.component === 'paragraph').every((c) => c.componentKey === null));
  assert.equal(r.components.filter((c) => c.component === 'paragraph')[0].text, claudeText(0));
});

test('claude: an event type the map does not know is unmapped with a reason and never forced into a component', () => {
  const events = streamEvents(claudePayloads);
  events.push({ sid: 'syn-sid', seq: events.length, event: 'mystery', data: '{"type":"mystery.thing"}', json: { type: 'mystery.thing' } });
  const r = applyStreamMap(claudeMap, events);
  assert.equal(r.unmapped.length, 1);
  assert.equal(r.unmapped[0].seq, claudePayloads.length);
  assert.match(r.unmapped[0].reason, /no_rule_matched/);
  assert.match(r.unmapped[0].reason, /mystery\.thing/);
  assert.equal(r.timeline.some((t) => t.seq === claudePayloads.length), false);
});

test('claude: truncated stream (last three events dropped) reports finalized false and closed null', () => {
  // Drops content_block_stop(index 1), message_delta and message_stop.
  const r = applyStreamMap(claudeMap, streamEvents(claudePayloads.slice(0, -3)));
  assert.equal(r.stats.finalized, false);
  assert.equal(byKey(r.components, 'syn-msg-claude-001:0').closed !== null, true);
  assert.equal(byKey(r.components, 'syn-msg-claude-001:1').closed, null);
  assert.equal(r.components.find((c) => c.component === 'message').closed, null);
  assert.equal(r.stats.openComponents, 2);
});

// ---------------------------------------------------------------------------------------------
// ChatGPT path-ops
// ---------------------------------------------------------------------------------------------

test('chatgpt: paragraph text equals the concatenated deltas (bare, patch-nested and direct appends)', () => {
  const r = applyStreamMap(chatgptMap, streamEvents(chatgptPayloads));
  const para = byKey(r.components, 'syn-msg-chatgpt-001:0');
  assert.equal(para.component, 'paragraph');
  assert.equal(para.text, CHATGPT_DELTAS.join(''));
});

test('chatgpt: patch envelope is expanded; its sub-operations keep the parent seq and carry a sub index', () => {
  const r = applyStreamMap(chatgptMap, streamEvents(chatgptPayloads));
  const subs = r.timeline.filter((t) => t.seq === 4);
  assert.deepEqual(subs.map((t) => [t.sub, t.op]), [[0, 'ignore'], [1, 'append']]);
  assert.equal(subs[1].text, 'stream. ');
});

test('chatgpt: [DONE] finalizes, status replace is ignored, and the status text never reaches the paragraph', () => {
  const r = applyStreamMap(chatgptMap, streamEvents(chatgptPayloads));
  assert.equal(r.unmapped.length, 0);
  assert.equal(r.stats.finalized, true);
  assert.equal(r.timeline.filter((t) => t.op === 'ignore').length, 2);
  assert.equal(r.timeline[r.timeline.length - 1].op, 'finalize');
  assert.equal(byKey(r.components, 'syn-msg-chatgpt-001:0').text.includes('finished_successfully'), false);
});

test('chatgpt: the first full-message frame opens the message container with a null key (no index)', () => {
  const r = applyStreamMap(chatgptMap, streamEvents(chatgptPayloads));
  assert.equal(r.components[0].component, 'message');
  assert.equal(r.components[0].componentKey, null);
});

test('chatgpt: truncated stream (no [DONE]) leaves the paragraph closed null', () => {
  const r = applyStreamMap(chatgptMap, streamEvents(chatgptPayloads.slice(0, -1)));
  assert.equal(r.stats.finalized, false);
  assert.equal(byKey(r.components, 'syn-msg-chatgpt-001:0').closed, null);
});

// ---------------------------------------------------------------------------------------------
// OpenAI Responses
// ---------------------------------------------------------------------------------------------

test('responses: output_text deltas build the paragraph; keys use response id and output_index', () => {
  const r = applyStreamMap(responsesMap, streamEvents(responsesPayloads));
  const para = byKey(r.components, 'syn-resp-openai-001:0');
  assert.equal(para.component, 'paragraph');
  assert.equal(para.text, responsesText);
  assert.equal(para.text, responsesPayloads.find((p) => p.type === 'response.output_text.done').text);
  assert.equal(r.components[0].componentKey, null);
});

test('responses: output_item.added is ignored; output_text.done closes the paragraph; response.completed finalizes', () => {
  const r = applyStreamMap(responsesMap, streamEvents(responsesPayloads));
  assert.equal(r.timeline.find((t) => t.seq === 1).op, 'ignore');
  const para = byKey(r.components, 'syn-resp-openai-001:0');
  assert.equal(para.closed.seq, 6);
  assert.equal(r.stats.finalized, true);
  assert.equal(r.unmapped.length, 0);
  assert.equal(r.stats.openComponents, 0);
});

// ---------------------------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------------------------

test('detectStreamMap picks the right built-in map for each fixture', () => {
  assert.equal(detectStreamMap(streamEvents(claudePayloads)).map.id, 'claude-typed-events');
  assert.equal(detectStreamMap(streamEvents(chatgptPayloads)).map.id, 'chatgpt-path-ops');
  assert.equal(detectStreamMap(streamEvents(responsesPayloads)).map.id, 'openai-responses');
});

test('detectStreamMap returns map null for a shuffled, renamed (unknown) dialect and lists candidates', () => {
  // Claude events with every type renamed to an unknown vocabulary, then shuffled.
  const renamed = claudePayloads.map((p) => (typeof p.type === 'string' ? { ...p, type: `x.${p.type}` } : p));
  const events = shuffled(streamEvents(renamed)).map((e, i) => ({ ...e, seq: i }));
  const d = detectStreamMap(events);
  assert.equal(d.map, null);
  assert.deepEqual(d.candidates.map((c) => c.id), ['claude-typed-events', 'chatgpt-path-ops', 'openai-responses']);
  assert.ok(d.candidates.every((c) => c.matched === 0));
});

test('detectStreamMap returns map null on a tie', () => {
  const tie = [...streamEvents(responsesPayloads.slice(0, 1)), ...streamEvents(chatgptPayloads.slice(0, 1), 'other')];
  const d = detectStreamMap(tie);
  assert.equal(d.map, null);
  assert.equal(d.candidates.find((c) => c.id === 'chatgpt-path-ops').matched, 1);
});

// ---------------------------------------------------------------------------------------------
// Determinism and ordering
// ---------------------------------------------------------------------------------------------

test('applyStreamMap is deterministic: same input gives the same output twice', () => {
  const a = applyStreamMap(claudeMap, streamEvents(claudePayloads));
  const b = applyStreamMap(claudeMap, streamEvents(claudePayloads));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(JSON.stringify(detectStreamMap(streamEvents(chatgptPayloads))), JSON.stringify(detectStreamMap(streamEvents(chatgptPayloads))));
});

test('timeline is in input order (seq never goes backwards)', () => {
  for (const [m, p] of [[claudeMap, claudePayloads], [chatgptMap, chatgptPayloads], [responsesMap, responsesPayloads]]) {
    const r = applyStreamMap(m, streamEvents(p));
    for (let i = 1; i < r.timeline.length; i++) assert.ok(r.timeline[i].seq >= r.timeline[i - 1].seq, m.id);
  }
});

test('applyStreamMap does not mutate the default map', () => {
  const before = JSON.stringify(claudeMap);
  applyStreamMap(claudeMap, streamEvents(claudePayloads));
  assert.equal(JSON.stringify(claudeMap), before);
});

test('DOM-only block types that the family enum can represent keep their own identity', () => {
  // rule, equation and file exist in the ai-chat family enum, so collapsing them to unknown
  // would discard information the family model can hold. graphic and details have no equivalent.
  for (const map of Object.values(DEFAULT_STREAM_MAPS)) {
    const cm = map.dom.componentMap;
    assert.equal(cm.rule, 'rule');
    assert.equal(cm.equation, 'equation');
    assert.equal(cm.file, 'file');
    assert.equal(cm.graphic, 'unknown');
    assert.equal(cm.details, 'unknown');
    assert.equal(validateStreamMap(map).ok, true);
  }
});

// ---------------------------------------------------------------------------------------------
// ChatGPT survey labels (type=<json.type> event=<SSE event>). Synthetic values only.
// ---------------------------------------------------------------------------------------------

// The real ChatGPT frames are event=message with the protocol kind in json.type. toSse() above
// names the SSE event after payload.type, which would be wrong for these labels, so this helper
// takes the SSE event name explicitly. Each frame: { event?, json } or { event?, raw }.
function chatgptFrames(frames, sid = 'syn-sid') {
  const text = frames.map((f) => {
    const ev = f.event ? `event: ${f.event}\n` : '';
    const data = typeof f.raw === 'string' ? f.raw : JSON.stringify(f.json);
    return `${ev}data: ${data}\n\n`;
  }).join('');
  const dec = new SseDecoder();
  return [...dec.push(Buffer.from(text, 'utf8')), ...dec.end()].map((ev, i) => ({ ...ev, sid, seq: i }));
}

const CGPT_OPEN = {
  event: 'message',
  json: {
    message: { id: 'syn-msg-cgpt-002', author: { role: 'assistant' }, content: { content_type: 'text', parts: [''] }, status: 'in_progress' },
    conversation_id: 'syn-conv-cgpt-002',
  },
};
const cgptAppend = (path, v) => ({ event: 'message', json: { p: path, o: 'append', v } });
const cgptReplace = (path, v) => ({ event: 'message', json: { p: path, o: 'replace', v } });
const P0 = '/message/content/parts/0';

// Rule the timeline entry matched, read back from the map (so the test follows the map).
const ruleWhen = (r, seq, sub) => {
  const t = r.timeline.find((x) => x.seq === seq && (sub === undefined || x.sub === sub));
  assert.ok(t, `no timeline entry for seq ${seq}`);
  return chatgptMap.stream.ops[t.rule].when;
};

test('chatgpt map: the four original rules stay first and unchanged (appended rules cannot shadow them)', () => {
  assert.deepEqual(chatgptMap.stream.ops.slice(0, 4), [
    { when: { hasKey: 'message', type: null }, op: 'open', component: 'message' },
    { when: { path: '/message/content/parts/*', o: 'append' }, op: 'append', component: 'paragraph', textPath: 'v' },
    { when: { path: '/message/status' }, op: 'ignore' },
    { when: { terminal: true, data: '[DONE]' }, op: 'finalize' },
  ]);
  assert.equal(validateStreamMap(chatgptMap).ok, true);
});

test('chatgpt: message_stream_complete finalizes and closes every open component', () => {
  const r = applyStreamMap(chatgptMap, chatgptFrames([CGPT_OPEN, cgptAppend(P0, 'Made-up text.'), { event: 'message', json: { type: 'message_stream_complete', conversation_id: 'syn-conv-cgpt-002' } }]));
  const last = r.timeline[r.timeline.length - 1];
  assert.equal(last.op, 'finalize');
  assert.deepEqual(ruleWhen(r, last.seq), { event: 'message', type: 'message_stream_complete' });
  assert.equal(r.stats.finalized, true);
  assert.equal(r.stats.openComponents, 0);
  assert.ok(r.components.every((c) => c.closed !== null));
  assert.equal(r.unmapped.length, 0);
});

test('chatgpt: without message_stream_complete the stream stays unfinished (truncation still visible)', () => {
  const r = applyStreamMap(chatgptMap, chatgptFrames([CGPT_OPEN, cgptAppend(P0, 'Made-up text.')]));
  assert.equal(r.stats.finalized, false);
  assert.equal(r.components.find((c) => c.component === 'paragraph').closed, null);
});

test('chatgpt: non-content protocol types land in timeline as ignore with their own rule, never in unmapped', () => {
  const types = ['message_marker', 'title_generation', 'input_message', 'resume_conversation_token', 'server_ste_metadata', 'conversation_detail_metadata', 'user_signal_metadata'];
  for (const type of types) {
    const r = applyStreamMap(chatgptMap, chatgptFrames([{ event: 'message', json: { type, synthetic: 'made-up' } }]));
    assert.equal(r.unmapped.length, 0, type);
    assert.equal(r.timeline.length, 1, type);
    assert.equal(r.timeline[0].op, 'ignore', type);
    assert.equal(r.timeline[0].component, null, type);
    assert.deepEqual(ruleWhen(r, 0), { event: 'message', type }, type);
    assert.equal(r.components.length, 0, type);
  }
});

test('chatgpt: input_message echoes the user prompt and never becomes a component of the reply', () => {
  const r = applyStreamMap(chatgptMap, chatgptFrames([
    { event: 'message', json: { type: 'input_message', input: { parts: ['Synthetic user question?'] } } },
  ]));
  assert.equal(r.timeline[0].op, 'ignore');
  assert.equal(r.components.length, 0);
  assert.equal(r.unmapped.length, 0);
});

test('chatgpt: delta_encoding version frame is ignored', () => {
  const r = applyStreamMap(chatgptMap, chatgptFrames([{ event: 'delta_encoding', json: { encoding: 'syn-delta', version: 1 } }]));
  assert.equal(r.unmapped.length, 0);
  assert.equal(r.timeline[0].op, 'ignore');
  assert.deepEqual(ruleWhen(r, 0), { event: 'delta_encoding' });
});

test('chatgpt: metadata-path deltas (any op) and update_time/end_turn are ignored, not unmapped', () => {
  const metaFrames = [
    cgptAppend('/message/metadata/model_dil_v2/fallbackMarkdown', 'syn md'),
    cgptAppend('/message/metadata/model_dil_v2/constants', 'syn-const'),
    cgptReplace('/message/metadata/conversation_followup_suggestions_eligible', true),
    cgptAppend('/message/metadata', { syn: true }),
    cgptReplace('/message/metadata/model_dil_v2/code', 'syn'),
    cgptAppend('/message/metadata/streaming_parent_revision', 'syn-rev'),
    cgptReplace('/message/update_time', 1700000000),
    cgptReplace('/message/end_turn', true),
  ];
  const r = applyStreamMap(chatgptMap, chatgptFrames(metaFrames));
  assert.equal(r.unmapped.length, 0);
  assert.equal(r.timeline.length, metaFrames.length);
  assert.ok(r.timeline.every((t) => t.op === 'ignore'));
  assert.equal(r.components.length, 0);
});

test('chatgpt: a /message/content/parts/0 append still builds the paragraph between metadata frames', () => {
  const r = applyStreamMap(chatgptMap, chatgptFrames([
    CGPT_OPEN,
    cgptAppend(P0, 'Alpha '),
    cgptAppend('/message/metadata/model_dil_v2/constants', 'syn-const'),
    cgptAppend(P0, 'Beta.'),
  ]));
  assert.equal(r.unmapped.length, 0);
  assert.equal(byKey(r.components, 'syn-msg-cgpt-002:0').text, 'Alpha Beta.');
});

test('chatgpt: an unknown-shape event stays unmapped and its reason names type and event', () => {
  const r = applyStreamMap(chatgptMap, chatgptFrames([
    { event: 'message', json: { synthetic: 'no type key here' } },
    { event: 'message', json: { type: 'syn_new_kind', value: 'x' } },
    { event: 'message', json: { p: '/message/weird', o: 'replace', v: 'x' } },
  ]));
  assert.equal(r.unmapped.length, 3);
  assert.match(r.unmapped[0].reason, /^no_rule_matched: type=- event=message$/);
  assert.match(r.unmapped[1].reason, /^no_rule_matched: type=syn_new_kind event=message$/);
  assert.match(r.unmapped[2].reason, /^no_rule_matched: type=- event=message path=\/message\/weird o=replace$/);
  assert.equal(r.components.length, 0);
});

test('chatgpt: full synthetic sequence yields one paragraph, finalized, no unmapped events', () => {
  const frames = [
    { event: 'delta_encoding', json: { encoding: 'syn-delta', version: 1 } },
    { event: 'message', json: { type: 'input_message', input: { parts: ['Synthetic user question?'] } } },
    { event: 'message', json: { type: 'message_marker', marker: 'syn-marker' } },
    CGPT_OPEN,
    cgptAppend(P0, 'Hello from '),
    { event: 'message', json: { v: 'a made-up ' } },
    { event: 'message', json: { o: 'patch', v: [
      { p: '/message/status', o: 'replace', v: 'in_progress' },
      { p: P0, o: 'append', v: 'stream. ' },
    ] } },
    { event: 'message', json: { v: 'Second sentence.' } },
    cgptAppend('/message/metadata/model_dil_v2/fallbackMarkdown', 'syn md'),
    cgptReplace('/message/metadata/conversation_followup_suggestions_eligible', true),
    cgptReplace('/message/update_time', 1700000000),
    cgptReplace('/message/end_turn', true),
    { event: 'message', json: { type: 'title_generation', title: 'Synthetic title' } },
    { event: 'message', json: { type: 'message_stream_complete', conversation_id: 'syn-conv-cgpt-002' } },
  ];
  const r = applyStreamMap(chatgptMap, chatgptFrames(frames));
  const paragraphs = r.components.filter((c) => c.component === 'paragraph');
  assert.equal(paragraphs.length, 1);
  assert.equal(paragraphs[0].text, 'Hello from a made-up stream. Second sentence.');
  assert.equal(paragraphs[0].componentKey, 'syn-msg-cgpt-002:0');
  assert.equal(r.stats.finalized, true);
  assert.equal(r.stats.openComponents, 0);
  assert.equal(r.stats.unmapped, 0);
  assert.equal(r.unmapped.length, 0);
  // 14 frames, one of which is a patch envelope with 2 sub-operations: 15 timeline entries.
  assert.equal(r.timeline.length, 15);
  assert.equal(r.stats.ignored, 9);
  assert.equal(r.stats.mapped, 6);
  assert.equal(r.timeline[r.timeline.length - 1].op, 'finalize');
});

test('chatgpt: the full synthetic sequence is deterministic', () => {
  const frames = [CGPT_OPEN, cgptAppend(P0, 'Alpha. '), cgptReplace('/message/update_time', 1), { event: 'message', json: { type: 'message_stream_complete' } }];
  const a = applyStreamMap(chatgptMap, chatgptFrames(frames));
  const b = applyStreamMap(chatgptMap, chatgptFrames(frames));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
