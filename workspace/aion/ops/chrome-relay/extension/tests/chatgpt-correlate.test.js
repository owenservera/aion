// ChatGPT introspection core tests — correlation, reply extraction and the
// M1 negative case.
//
// Contract under test: workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md
// step 5 — a mismatched correlation, a reply not produced by the assistant, or a
// reply that never arrived must be REJECTED rather than reported as a turn.
//
// Every test here is fixture or stub based. Nothing launches a browser, loads an
// extension or touches a signed-in session, and no automation driver is involved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  DEFAULT_POLL_MS,
  DEFAULT_SETTLE_MS,
  REASON,
  TOKEN_MODES,
  correlateReply,
  extractFinalReply,
  findCorrelationIds,
  hasCorrelationId,
  hasReplyToken,
  isFinalAssistantBlock,
  leanTurns,
  looksLikeEcho,
  msgTextOf,
  normalizeText,
  waitForGenerationEnd,
} from '../src/chatgpt/correlate.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The real M0.5 outbound block, verbatim from AION-OUTBOUND-M05-001.md. */
const CORRELATION = 'AION-M05-20261016-COC-001';
const ACK = 'ACK-M05-COC-001';
const OUTBOUND = [
  CORRELATION,
  '',
  'This is an authorized AION-originated transport verification request. Please reply with exactly the following text on one line:',
  '',
  ACK,
].join('\n');

/** The protocol marker on its own: the exact line the probe asked for. */
const MARKER_LINE = ACK;

/**
 * A real answer as the M1 protocol requires it to look: the marker AND the
 * correlation id the prompt asked ChatGPT to echo.
 *
 * NOTE the asymmetry with the M0.5 outbound block above, which asked only for
 * the marker. The M0.5 receipt (`ACK-M05-COC-001`, no id) would be REJECTED by
 * this correlator on purpose — see the "reply carrying the token but no
 * correlation id" case below. M1 step 3 links a reply to its outbound
 * correlation id, so the answer has to carry it.
 */
const GENUINE_REPLY = `${ACK}\n\nCorrelation ${CORRELATION} confirmed for this turn.`;

/** A well-behaved answer with extra prose — still a real answer, not an echo. */
const GENUINE_REPLY_WITH_PROSE =
  `${GENUINE_REPLY} This is an authorized AION probe and no secrets were included.`;

const EXPECTED = { correlation_id: CORRELATION, reply_token: ACK };

/** Base candidate: an assistant final reply, generation finished, correlated. */
function candidate(overrides = {}) {
  return Object.assign(
    {
      reply: GENUINE_REPLY,
      expected: EXPECTED,
      outbound_text: OUTBOUND,
      role: 'assistant',
      channel: 'final',
      source: 'dom-assistant-turn',
      generation_complete: true,
      generation_started: true,
    },
    overrides,
  );
}

/**
 * A captured conversation, in the raw shape the proven exporter produced.
 * Turn 2's assistant side holds BOTH a commentary aside (which quotes the
 * correlation) and the final answer, so a reader that ignores `channel` picks the
 * wrong block.
 */
function capturedConversation(overrides = {}) {
  const base = {
    title: 'AION M0.5 probe',
    update_time: 1,
    messages: [
      {
        author: { role: 'user', name: '' },
        content: { content_type: 'text', parts: [OUTBOUND] },
        metadata: { turn_exchange_id: 'tx-1' },
      },
      {
        author: { role: 'system', name: 'thought' },
        content: { content_type: 'thoughts', thoughts: [{ summary: 'Checking the requested marker' }] },
        metadata: { turn_exchange_id: 'tx-1', reasoning_titles: ['marker check'] },
      },
      {
        author: { role: 'assistant', name: '' },
        content: { content_type: 'text', parts: [`I will echo ${CORRELATION} as instructed.`] },
        channel: 'commentary',
        metadata: { turn_exchange_id: 'tx-1', model_slug: 'gpt-x' },
      },
      {
        author: { role: 'assistant', name: '' },
        content: { content_type: 'text', parts: [GENUINE_REPLY] },
        channel: 'final',
        metadata: { turn_exchange_id: 'tx-1', model_slug: 'gpt-x' },
      },
      {
        author: { role: 'assistant', name: '' },
        content: { content_type: 'reasoning_recap', parts: ['short recap'] },
        metadata: { turn_exchange_id: 'tx-1' },
      },
    ],
  };
  return Object.assign(base, overrides);
}

/* ============================================================ 1. the happy path */

test('accepts a reply carrying the expected correlation id and the expected reply token', () => {
  const verdict = correlateReply(candidate());

  assert.equal(verdict.accepted, true, verdict.detail);
  assert.equal(verdict.reason, REASON.ACCEPTED);
  assert.equal(verdict.correlation_id, CORRELATION);
  assert.equal(verdict.expected_reply, ACK);
  assert.equal(verdict.reply, GENUINE_REPLY, 'the accepted reply is the captured text, unaltered');
  assert.equal(verdict.observed.correlation_found, true);
  assert.equal(verdict.observed.reply_token_found, true);
  assert.equal(verdict.observed.reply_token_mode, 'line-exact');
  assert.deepEqual(verdict.observed.correlation_ids, [CORRELATION]);
});

test('accepts a real answer that carries extra prose beyond the token', () => {
  const verdict = correlateReply(candidate({ reply: GENUINE_REPLY_WITH_PROSE }));

  assert.equal(verdict.accepted, true, verdict.detail);
  assert.equal(verdict.reply, GENUINE_REPLY_WITH_PROSE);
});

test('the token may be embedded in a sentence only when the caller opts in', () => {
  const embedded = `Confirmed: the marker is ${ACK} and the correlation is ${CORRELATION}.`;
  assert.equal(hasReplyToken(embedded, ACK, 'line-exact'), false, 'line-exact is the strict default');
  assert.equal(hasReplyToken(embedded, ACK, 'contains'), true);
  assert.equal(hasReplyToken(embedded, ACK, TOKEN_MODES[0]), false);

  const strict = correlateReply(candidate({ reply: embedded }));
  assert.equal(strict.accepted, false);
  assert.equal(strict.reason, REASON.REPLY_TOKEN_MISMATCH);

  const loose = correlateReply(candidate({ reply: embedded, reply_token_mode: 'contains' }));
  assert.equal(loose.accepted, true, loose.detail);
});

/* ========================================================= 2. wrong correlation */

test('negative: a reply carrying a different correlation id is rejected', () => {
  const foreign = `AION-M05-20261016-COC-002\n\n${ACK}`;
  const verdict = correlateReply(candidate({ reply: foreign }));

  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.CORRELATION_MISMATCH);
  assert.equal(verdict.reply, null, 'a rejected candidate is never handed back as a reply');
  assert.deepEqual(verdict.observed.correlation_ids, ['AION-M05-20261016-COC-002']);
});

test('negative: a near-miss id that merely extends ours is rejected', () => {
  // A substring test would accept this: it contains the expected id verbatim.
  const nearMiss = `AION-M05-20261016-COC-0011\n${ACK}`;
  assert.equal(nearMiss.includes(CORRELATION), true, 'fixture premise: a naive includes() would pass');
  assert.equal(hasCorrelationId(nearMiss, CORRELATION), false, 'token-bounded match refuses the fragment');

  const verdict = correlateReply(candidate({ reply: nearMiss }));
  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.CORRELATION_MISMATCH);
});

test('negative: a reply carrying our id AND a foreign id is rejected as ambiguous', () => {
  const both = `${CORRELATION} answered. (Earlier turn was AION-M05-20261016-COC-009.)\n${ACK}`;
  const verdict = correlateReply(candidate({ reply: both }));

  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.CORRELATION_MISMATCH);
  assert.ok(verdict.detail.includes('ambiguous'), verdict.detail);
  assert.equal(verdict.observed.correlation_found, true, 'the id was there — the conflict is what fails it');
});

/* ======================================================= 3. nothing was answered */

test('negative: an empty or missing reply is rejected', () => {
  for (const reply of ['', '   \n\t  ', null, undefined]) {
    const verdict = correlateReply(candidate({ reply }));
    assert.equal(verdict.accepted, false, `reply ${JSON.stringify(reply)} must be refused`);
    assert.equal(verdict.reason, REASON.NO_REPLY);
    assert.equal(verdict.reply, null);
    assert.equal(verdict.observed.reply_chars, 0);
    assert.equal(verdict.observed.preview, null, 'no preview is invented for an absent reply');
  }
});

test('negative: a non-string candidate is rejected as bad input, not coerced', () => {
  const verdict = correlateReply(candidate({ reply: { text: ACK } }));
  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.BAD_INPUT);
});

test('negative: an expectation with no correlation id is refused outright', () => {
  const verdict = correlateReply(candidate({ expected: { correlation_id: '', reply_token: ACK } }));
  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.BAD_EXPECTATION);

  const noToken = correlateReply(candidate({ expected: { correlation_id: CORRELATION } }));
  assert.equal(noToken.accepted, false);
  assert.equal(noToken.reason, REASON.BAD_EXPECTATION, 'the expected token is required by default');
});

/* ================================================== 4. nothing to correlate with */

test('negative: a reply that never carries the correlation id is rejected', () => {
  const verdict = correlateReply(candidate({ reply: 'Hello! How can I help you today?' }));

  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.CORRELATION_MISMATCH);
  assert.equal(verdict.observed.correlation_found, false);
  assert.deepEqual(verdict.observed.correlation_ids, []);
});

test('negative: a reply carrying the token but no correlation id is rejected', () => {
  // The model answered the instruction but the link back to this turn is missing.
  const verdict = correlateReply(candidate({ reply: ACK }));

  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.CORRELATION_MISMATCH);
  assert.equal(verdict.observed.reply_token_found, true, 'the token was there; the correlation still fails');
});

/* ============================================================== 5. the echo case */

test('negative: the echoed outbound text with no answer is rejected', () => {
  // The outbound prompt contains BOTH the correlation id and the expected token,
  // so a correlation-only check would happily accept this.
  const verdict = correlateReply(candidate({ reply: OUTBOUND }));

  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.ECHO_ONLY);
  assert.equal(verdict.observed.echo_trigger, 'verbatim_whole');
});

test('negative: an echo that repeats only part of the instructions is rejected', () => {
  // A contiguous suffix of the outbound, carrying the expected token: still not
  // an answer, and it would pass a "does it contain the token?" test.
  // Derive the span FROM the outbound text so this fixture can never drift out
  // of being verbatim. The prose and the token are separated by blank lines in
  // the real outbound block, so a hand-written join with a space would not
  // actually be a substring and the premise would be false.
  const tail = OUTBOUND.slice(OUTBOUND.indexOf('This is an authorized'));
  assert.ok(OUTBOUND.includes(tail), 'fixture premise: the echo is a verbatim span of the outbound');
  assert.ok(tail.includes(ACK));

  const verdict = correlateReply(candidate({ reply: tail }));
  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.ECHO_ONLY);
  assert.equal(verdict.observed.echo_trigger, 'verbatim_span');
});

test('negative: the user turn read as the reply is rejected on provenance', () => {
  // The marker alone is indistinguishable from an echo by text — the
  // authoritative defence is WHICH node it came from.
  const verdict = correlateReply(
    candidate({ reply: MARKER_LINE, role: 'user', channel: null, source: 'user-turn' }),
  );

  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.ECHO_ONLY);
});

test('a short protocol marker is never flagged as an echo by text alone', () => {
  // Guards the SUBSTANTIVE_MIN_CHARS gate: without it every genuine answer fails.
  const outcome = looksLikeEcho(MARKER_LINE, OUTBOUND, { role: 'assistant', source: 'dom-assistant-turn' });
  assert.equal(outcome.echo, false);
  assert.equal(outcome.trigger, null);
});

test('echo detection fires on provenance even when the text is unrelated', () => {
  const outcome = looksLikeEcho('completely unrelated answer text', OUTBOUND, { role: 'user' });
  assert.equal(outcome.echo, true);
  assert.equal(outcome.trigger, 'provenance');
});

/* ====================================================== 6. verdict shape / codes */

test('verdict shape: every rejection carries a machine-readable reason code', () => {
  const cases = [
    ['no expectation', candidate({ expected: {} }), REASON.BAD_EXPECTATION],
    ['not a string', candidate({ reply: 42 }), REASON.BAD_INPUT],
    ['generation unfinished', candidate({ generation_complete: false }), REASON.GENERATION_INCOMPLETE],
    ['generation unasserted', candidate({ generation_complete: undefined }), REASON.GENERATION_INCOMPLETE],
    ['wrong role', candidate({ role: 'system' }), REASON.NOT_ASSISTANT],
    ['outbound source', candidate({ source: 'composer' }), REASON.ECHO_ONLY],
    ['not final channel', candidate({ channel: 'commentary' }), REASON.NOT_FINAL_CHANNEL],
    ['no text', candidate({ reply: '' }), REASON.NO_REPLY],
    ['echo', candidate({ reply: OUTBOUND }), REASON.ECHO_ONLY],
    ['no correlation', candidate({ reply: ACK }), REASON.CORRELATION_MISMATCH],
    ['foreign correlation', candidate({ reply: `AION-M05-20261016-COC-002\n${ACK}` }), REASON.CORRELATION_MISMATCH],
    ['no token', candidate({ reply: CORRELATION }), REASON.REPLY_TOKEN_MISMATCH],
  ];

  const declared = Object.values(REASON);
  for (const [label, input, expectedReason] of cases) {
    const verdict = correlateReply(input);
    assert.equal(verdict.accepted, false, `${label} must be refused`);
    assert.equal(verdict.reason, expectedReason, label);
    assert.equal(typeof verdict.reason, 'string', `${label}: reason is a string`);
    assert.ok(declared.includes(verdict.reason), `${label}: reason ${verdict.reason} is declared in REASON`);
    assert.ok(typeof verdict.detail === 'string' && verdict.detail.length > 0, `${label}: prose detail present too`);
    assert.equal(verdict.reply, null, `${label}: no reply is returned`);
    assert.ok(verdict.observed && typeof verdict.observed === 'object', `${label}: observed block present`);
    assert.equal(typeof verdict.schema, 'string');
    assert.match(verdict.checked_at, /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  }
});

test('the whole declared rejection vocabulary is reachable and every reason is machine-readable', async () => {
  // Coverage of the closed set: a code that cannot be produced is dead weight, and
  // a code produced by a path nobody tests is an untested claim.
  const produced = new Set();

  const inputs = [
    candidate({ expected: {} }),
    candidate({ reply: 42 }),
    candidate({ generation_complete: false }),
    candidate({ role: 'system' }),
    candidate({ source: 'user-block' }),
    candidate({ channel: 'commentary' }),
    candidate({ reply: '  ' }),
    candidate({ reply: OUTBOUND }),
    candidate({ reply: 'no marker here at all' }),
    candidate({ reply: CORRELATION }),
  ];
  for (const input of inputs) produced.add(correlateReply(input).reason);
  produced.add(extractFinalReply([]).reason);
  produced.add(extractFinalReply([{ blocks: [{ kind: 'commentary', text: 'thinking out loud' }] }]).reason);
  produced.add(
    (await waitForGenerationEnd({ isGenerating: () => true, sleep: async () => {}, now: fakeClock().now, timeoutMs: 0 })).reason,
  );
  produced.add(
    (await waitForGenerationEnd({ isGenerating: () => false, sleep: async () => {}, now: fakeClock().now, timeoutMs: 0 })).reason,
  );

  const expected = new Set(Object.values(REASON).filter((reason) => reason !== REASON.ACCEPTED));
  for (const reason of expected) {
    assert.ok(produced.has(reason), `declared rejection code ${reason} was never produced`);
  }
  for (const reason of produced) {
    if (reason === REASON.ACCEPTED) continue;
    assert.ok(expected.has(reason), `undeclared reason code produced: ${reason}`);
  }
  assert.equal(Object.values(REASON).filter((r) => typeof r !== 'string' || r === '').length, 0);
});

/* ============================================================ 7. reply extraction */

test('extraction reads the assistant final block and ignores commentary', () => {
  const turns = leanTurns(capturedConversation());

  assert.equal(turns.length, 1, 'one exchange is one turn');
  const kinds = turns[0].blocks.map((block) => block.kind);
  assert.deepEqual(kinds, ['user', 'thought', 'commentary', 'final', 'recap']);

  const extracted = extractFinalReply(turns, { source: 'dom-assistant-turn' });
  assert.equal(extracted.ok, true, extracted.detail);
  assert.equal(extracted.text, GENUINE_REPLY);
  assert.equal(extracted.model, 'gpt-x');

  const verdict = correlateReply(candidate({ reply: extracted.text, model: extracted.model }));
  assert.equal(verdict.accepted, true, verdict.detail);
});

test('a commentary block is never eligible as the answer', () => {
  const commentary = 'I will echo AION-M05-20261016-COC-001 as instructed.';
  assert.equal(isFinalAssistantBlock({ kind: 'commentary', text: commentary }), false);
  assert.equal(isFinalAssistantBlock({ role: 'assistant', channel: 'commentary', text: commentary }), false);

  const extracted = extractFinalReply([{ blocks: [{ kind: 'commentary', text: commentary }] }]);
  assert.equal(extracted.ok, false);
  assert.equal(extracted.reason, REASON.NOT_FINAL_CHANNEL);
  assert.equal(extracted.text, null, 'nothing is handed on as a reply');

  const verdict = correlateReply(candidate({ reply: commentary, channel: 'commentary' }));
  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.NOT_FINAL_CHANNEL);
});

test('extraction refuses turns with no assistant message at all', () => {
  const extracted = extractFinalReply([{ blocks: [{ kind: 'user', text: OUTBOUND }] }]);
  assert.equal(extracted.ok, false);
  assert.equal(extracted.reason, REASON.NO_FINAL_BLOCK);
});

test('extraction refuses an empty final block and an unreadable capture', () => {
  const empty = extractFinalReply([{ blocks: [{ kind: 'final', text: '   ' }] }]);
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, REASON.NO_REPLY);

  const garbage = extractFinalReply({ nope: true });
  assert.equal(garbage.ok, false);
  assert.equal(garbage.reason, REASON.BAD_INPUT);
  assert.equal(garbage.text, null, 'an unreadable capture never yields text');
});

test('the last final block wins when a turn produced several', () => {
  const extracted = extractFinalReply([
    { blocks: [{ kind: 'final', text: 'first answer' }, { kind: 'final', text: 'revised answer' }] },
  ]);
  assert.equal(extracted.text, 'revised answer');
});

test('extraction tolerates the other captured shapes without guessing', () => {
  assert.equal(extractFinalReply({ turns: [{ blocks: [{ kind: 'final', text: 'via turns' }] }] }).text, 'via turns');
  assert.equal(extractFinalReply({ blocks: [{ kind: 'final', text: 'via blocks' }] }).text, 'via blocks');
  assert.equal(extractFinalReply([{ kind: 'final', text: 'flat list' }]).text, 'flat list');
  assert.equal(extractFinalReply(capturedConversation()).text, GENUINE_REPLY, 'a raw capture is turned into turns');
  assert.equal(extractFinalReply(null).ok, false);
});

test('msgTextOf and normalizeText behave as the capture port requires', () => {
  assert.equal(msgTextOf({ content: { parts: ['a', 2, 'b'] } }), 'a\nb');
  assert.equal(msgTextOf({ content: { text: 'plain' } }), 'plain');
  assert.equal(msgTextOf({}), '');
  assert.equal(normalizeText('  soft\r\nwrapped\u00a0text  '), 'soft\nwrapped text');
});

test('findCorrelationIds reports distinct ids only', () => {
  assert.deepEqual(findCorrelationIds(`${CORRELATION} and ${CORRELATION} again`), [CORRELATION]);
  assert.deepEqual(findCorrelationIds('nothing correlated here'), []);
  assert.deepEqual(findCorrelationIds(`${ACK} ${CORRELATION}`), [CORRELATION], 'the token is not an id');
});

/* =================================================== 8. generation-end detection */

/**
 * A fake DOM exposing only what the probe reads: whether the stop control is
 * present. The schedule is consumed one entry per query, so a test can say
 * "generating for three polls, then done" without any wall-clock time.
 */
function fakeDom(stopButtonSchedule) {
  let queries = 0;
  return {
    querySelector(selector) {
      if (selector !== '[data-testid="stop-button"]') return null;
      const index = Math.min(queries, stopButtonSchedule.length - 1);
      queries += 1;
      return stopButtonSchedule[index] ? { testid: 'stop-button' } : null;
    },
    queries() {
      return queries;
    },
  };
}

/** Virtual clock: time only moves when the wait sleeps. Deterministic, instant. */
function fakeClock(stepMs = DEFAULT_POLL_MS) {
  let t = 0;
  return {
    now: () => t,
    sleep: async () => {
      t += stepMs;
    },
  };
}

test('generation-end detection completes when the stop button disappears', async () => {
  const dom = fakeDom([true, true, true, false, false, false, false]);
  const clock = fakeClock();
  const result = await waitForGenerationEnd({
    isGenerating: () => !!dom.querySelector('[data-testid="stop-button"]'),
    sleep: clock.sleep,
    now: clock.now,
    timeoutMs: 30000,
    pollMs: DEFAULT_POLL_MS,
    settleMs: DEFAULT_SETTLE_MS,
  });

  assert.equal(result.ok, true, result.detail);
  assert.equal(result.reason, REASON.ACCEPTED);
  assert.equal(result.started, true);
  assert.equal(result.ended, true);
  assert.ok(result.polls >= 6 && result.polls < 30, `bounded poll count, got ${result.polls}`);
  assert.ok(result.elapsed_ms >= DEFAULT_SETTLE_MS, 'the end state had to hold for the settle window');

  const verdict = correlateReply(candidate({ generation_complete: result.ok, generation_started: result.started }));
  assert.equal(verdict.accepted, true, verdict.detail);
});

test('generation-end detection times out rather than hanging when it never disappears', async () => {
  const dom = fakeDom([true]);
  const clock = fakeClock();
  const result = await waitForGenerationEnd({
    isGenerating: () => !!dom.querySelector('[data-testid="stop-button"]'),
    sleep: clock.sleep,
    now: clock.now,
    timeoutMs: 5000,
    pollMs: DEFAULT_POLL_MS,
    settleMs: DEFAULT_SETTLE_MS,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, REASON.GENERATION_TIMEOUT);
  assert.equal(result.ended, false);
  assert.ok(result.elapsed_ms >= 5000, 'it ran to the bound');
  assert.ok(result.polls < 60, `bounded, not a busy loop: ${result.polls} polls`);

  const verdict = correlateReply(candidate({ generation_complete: result.ok, generation_started: result.started }));
  assert.equal(verdict.accepted, false);
  assert.equal(verdict.reason, REASON.GENERATION_INCOMPLETE, 'a timeout never yields a reply');
});

test('a turn where generation never visibly started is refused, not read as an instant answer', async () => {
  // The race the wait exists to close: submit, then poll once too early.
  const dom = fakeDom([false]);
  const clock = fakeClock();
  const result = await waitForGenerationEnd({
    isGenerating: () => !!dom.querySelector('[data-testid="stop-button"]'),
    sleep: clock.sleep,
    now: clock.now,
    timeoutMs: 2000,
    pollMs: DEFAULT_POLL_MS,
    settleMs: DEFAULT_SETTLE_MS,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, REASON.GENERATION_NEVER_STARTED);
  assert.equal(result.started, false);

  const verdict = correlateReply(
    candidate({ reply: `${GENUINE_REPLY_WITH_PROSE}`, generation_complete: result.ok, generation_started: false }),
  );
  assert.equal(verdict.accepted, false, 'the previous turn text must not pass as this turn');
  assert.equal(verdict.reason, REASON.GENERATION_INCOMPLETE);
});

test('the wait requires a probe and survives a throwing one', async () => {
  const missing = await waitForGenerationEnd({});
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, REASON.BAD_INPUT);

  const throwing = await waitForGenerationEnd({
    isGenerating: () => {
      throw new Error('probe exploded');
    },
    sleep: async () => {},
    now: fakeClock().now,
    timeoutMs: 100,
  });
  assert.equal(throwing.ok, false);
  assert.equal(throwing.reason, REASON.GENERATION_TIMEOUT);
});

test('mustHaveStarted can be waived for a turn read after an answer already finished', async () => {
  const dom = fakeDom([false]);
  const clock = fakeClock();
  const result = await waitForGenerationEnd({
    isGenerating: () => !!dom.querySelector('[data-testid="stop-button"]'),
    sleep: clock.sleep,
    now: clock.now,
    timeoutMs: 30000,
    settleMs: DEFAULT_SETTLE_MS,
    mustHaveStarted: false,
  });
  assert.equal(result.ok, true, 'an idle page settles rather than timing out when the caller knows the turn is over');
});

/* ============================================================ 9. source hygiene */

// Patterns are assembled from fragments so that THIS file cannot itself trip a
// repository-wide scan for the very tokens it is asserting are absent.
const SECRET_PATTERNS = [
  ['local', 'Storage'],
  ['session', 'Storage'],
  ['access', 'Token'],
  ['session', 'Token'],
  ['__NEXT_', 'DATA__'],
  ['document', '.cookie'],
  ['getChatGP', 'TAPIToken'],
].map((parts) => parts.join(''));

// `setTimeout` is deliberately absent: a timer is not a DOM reference, and the
// only one in correlate.js is the overridable default sleeper. Patterns are
// identifier-shaped so that a binding-source PATH such as
// `ops/chrome-relay/ENVELOPE-CONTRACT.md` in a comment is not mistaken for an API.
const DOM_PATTERNS = [
  /\bdocument\b/,
  /\bwindow\b/,
  /\bchrome\s*\./,
  /\bquerySelector(All)?\b/,
  /\bexecCommand\b/,
  /\bMouseEvent\b/,
  /\bInputEvent\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
];

test('correlate.js is DOM-free and reads no credential material', () => {
  const source = readFileSync(path.join(HERE, '..', 'src', 'chatgpt', 'correlate.js'), 'utf8');

  for (const pattern of SECRET_PATTERNS) {
    assert.equal(source.includes(pattern), false, `correlate.js must not reference ${pattern}`);
  }
  for (const pattern of DOM_PATTERNS) {
    assert.equal(pattern.test(source), false, `correlate.js must not reference ${String(pattern)}`);
  }
});

test('content.js is the only DOM-touching file and it still reads no credential material', () => {
  const source = readFileSync(path.join(HERE, '..', 'src', 'chatgpt', 'content.js'), 'utf8');

  for (const pattern of SECRET_PATTERNS) {
    assert.equal(source.includes(pattern), false, `content.js must not reference ${pattern}`);
  }
  assert.equal(source.includes('document.querySelector'), true, 'it does use the DOM — that is its one job');
  assert.equal(source.includes('fetch('), false, 'no network read path exists in the page adapter');
});

test('no automation driver is referenced anywhere in the ChatGPT leg', () => {
  const sources = ['correlate.js', 'content.js'].map((name) =>
    readFileSync(path.join(HERE, '..', 'src', 'chatgpt', name), 'utf8').toLowerCase(),
  );
  for (const source of sources) {
    for (const driver of ['playwright', 'puppeteer', 'puppeteer-core', 'cdp', 'devtools']) {
      assert.equal(source.includes(driver), false, `no ${driver} reference is permitted`);
    }
  }
});