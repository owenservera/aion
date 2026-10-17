// AION Chrome Relay Station — ChatGPT introspection core: reply extraction,
// correlation and negative-case rejection.
//
// BINDING SOURCES
//   workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md — acceptance contract,
//     step 5: a mismatched correlation, a reply not produced by the assistant, or a
//     reply that never arrived must be REJECTED rather than reported as a turn.
//   workspace/aion/ops/chrome-relay/ENVELOPE-CONTRACT.md — correlation_id semantics.
//   extensions/chatgpt/content.js — the proven capture technique. `leanTurns`,
//     `msgTextOf` and the `channel === 'final'` assistant disambiguation below are
//     ported from that file rather than reinvented; every deviation is commented.
//
// WHY THIS FILE IS HOST-FREE ON PURPOSE
//   It is the safety-critical core. It is imported by the page-side adapter (which
//   has a real host available) and by the Node test runner (which has none). If a
//   host reference appeared here, the tests that prove the negative case could not
//   run at all, so every ambient dependency is injected: the clock, the sleeper,
//   and the "is an answer being written right now" probe. There is no timer of
//   its own and no direct read of the conversation tree — the adapter hands over
//   text plus its provenance and this module decides.
//
// IT READS NO SECRET
//   No cookie jar, no storage bag, no session token, no page bootstrap payload is
//   read here or anywhere below the adapter. A reply is accepted or rejected purely
//   from its own text and from where it came from.

/* ------------------------------------------------------------------ constants */

/** Verdict schema tag. Bump only together with a contract revision. */
export const VERDICT_SCHEMA = 'aion.chatgpt-verdict/0.1';

/**
 * Every outcome this module can produce, as a machine-readable code.
 *
 * WHY A CLOSED SET: step 5 of the acceptance contract requires that a rejection be
 * checkable rather than merely narrated. A verifier must be able to switch on the
 * code, so the code is a fixed vocabulary and `detail` carries only the prose. The
 * rejection tests assert membership in this list, which is what makes a new
 * rejection path unable to appear without being declared.
 */
export const REASON = Object.freeze({
  /** The only accepting outcome. */
  ACCEPTED: 'accepted',
  /** The caller's expectation itself is unusable (no correlation id, etc.). */
  BAD_EXPECTATION: 'bad_expectation',
  /** The input was not a usable candidate at all. */
  BAD_INPUT: 'bad_input',

  /** The answer was read before generation finished, so it may be partial. */
  GENERATION_INCOMPLETE: 'generation_incomplete',
  /** Generation never finished inside the bound. */
  GENERATION_TIMEOUT: 'generation_timeout',
  /** Generation never visibly started inside the bound — nothing was answered. */
  GENERATION_NEVER_STARTED: 'generation_never_started',

  /** The candidate is not an assistant answer at all. */
  NOT_ASSISTANT: 'not_assistant',
  /** An assistant message exists but is not the final channel (commentary, recap…). */
  NOT_FINAL_CHANNEL: 'not_final_channel',
  /** No assistant final block exists in the captured turns. */
  NO_FINAL_BLOCK: 'no_final_block',
  /** No text could be read at all. */
  NO_REPLY: 'no_reply',

  /** The candidate is the outbound prompt coming back, not an answer. */
  ECHO_ONLY: 'echo_only',
  /** The answer does not carry this turn's correlation id. */
  CORRELATION_MISMATCH: 'correlation_mismatch',
  /** The answer does not carry the expected reply token. */
  REPLY_TOKEN_MISMATCH: 'reply_token_mismatch',
});

/** Sources that can only ever hold the outbound prompt, never an answer. */
export const ECHO_SOURCES = Object.freeze([
  'user-turn',
  'user-block',
  'outbound',
  'outbound-echo',
  'composer',
]);

/** Where a reply token must appear. Default is the strict, proven one. */
export const TOKEN_MODES = Object.freeze(['line-exact', 'contains']);

/**
 * Correlation id shape, as observed on the AION outbound family
 * (`AION-M05-20261016-COC-001`). Deliberately generic over the segments so a
 * future milestone prefix still parses.
 *
 * Used only to DETECT foreign ids, so that a reply carrying somebody else's
 * correlation is refused rather than half-matched.
 */
const CORRELATION_ID_SHAPE = /\bAION-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+\b/g;

/**
 * Characters that may not sit next to a matched token.
 *
 * WHY `-` IS INCLUDED: correlation ids are hyphen-separated, so allowing `-` as a
 * boundary would let the id `AION-M05-20261016-COC-001` "match" inside
 * `AION-M05-20261016-COC-0011`. A plain substring test would then accept a
 * near-miss reply. This is the cheapest possible defence against a forged or
 * truncated id and it costs nothing on real replies, which put the id on its own
 * line.
 */
const TOKEN_NEIGHBOUR = /[A-Za-z0-9_-]/;

const MAX_PREVIEW_CHARS = 200;
const MAX_STORED_REPLY_CHARS = 8000;
const MAX_ID_LIST = 8;

/**
 * Minimum length (normalised, characters) for a span to count as SUBSTANTIVE.
 *
 * WHY: the probe protocol asks the model for a bare marker such as
 * `ACK-M05-COC-001`. That marker also appears verbatim inside the outbound prompt,
 * so it can never be used on its own to tell an answer from an echo of the prompt.
 * A protocol marker is short; a quotation of the instructions is not. Echo
 * detection therefore only ever fires on text at least this long, and the
 * authoritative echo defence is provenance (see `looksLikeEcho`).
 */
const SUBSTANTIVE_MIN_CHARS = 32;

/** Proven bounds for the page-side wait. The adapter may narrow them. */
export const DEFAULT_TIMEOUT_MS = 180000;
export const DEFAULT_POLL_MS = 250;
/**
 * How long the "no answer in progress" state must hold before the turn counts as
 * finished. Without it the stop control can vanish for one tick mid-stream and the
 * partial text would be read as a complete reply.
 */
export const DEFAULT_SETTLE_MS = 750;

/* ---------------------------------------------------------------- text helpers */

/**
 * Normalise for line-oriented checks: CRLF/CR to LF, runs of spaces/tabs and
 * non-breaking spaces to one space, three or more newlines to two.
 *
 * Markdown answers arrive with soft-wrapped lines, so `ACK-M05-COC-001` can be
 * split by a newline; callers that need a whitespace-insensitive match use
 * `flatText` instead.
 */
export function normalizeText(value) {
  if (typeof value !== 'string' || value === '') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Collapse every whitespace run to a single space and trim. */
export function flatText(value) {
  if (typeof value !== 'string' || value === '') return '';
  return value.replace(/\s+/g, ' ').trim();
}

/** True when `haystack` contains `needle` as a standalone token, not a fragment. */
function containsToken(haystack, needle) {
  if (!needle) return false;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    const before = at === 0 ? '' : haystack[at - 1];
    const afterIndex = at + needle.length;
    const after = afterIndex >= haystack.length ? '' : haystack[afterIndex];
    if (!TOKEN_NEIGHBOUR.test(before) && !TOKEN_NEIGHBOUR.test(after)) return true;
    from = at + 1;
  }
}

/**
 * Does `text` carry `correlation_id` as a whole token?
 *
 * NOT a substring test: see `TOKEN_NEIGHBOUR`. Case-insensitive because an answer
 * may quote the id inside prose; the id is not a secret and case-folding does not
 * weaken the rejection paths (a wrong id is still a wrong id).
 */
export function hasCorrelationId(text, correlationId) {
  const hay = flatText(text).toLowerCase();
  const needle = flatText(correlationId).toLowerCase();
  if (!hay || !needle) return false;
  return containsToken(hay, needle);
}

/** Every correlation-shaped id present in `text`, de-duplicated, order preserved. */
export function findCorrelationIds(text) {
  const flat = flatText(text);
  const found = [];
  const seen = new Set();
  let match;
  CORRELATION_ID_SHAPE.lastIndex = 0;
  while ((match = CORRELATION_ID_SHAPE.exec(flat)) !== null) {
    if (found.length >= MAX_ID_LIST) break;
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      found.push(match[0]);
    }
  }
  return found;
}

/**
 * Does the expected reply token appear?
 *
 * `line-exact` (default) requires a whole trimmed line to equal the token. That is
 * the rule the proven M0.5 adapter used (`verifyReply`) and it is the strict one:
 * a model that paraphrases the instruction but does not emit the line is not a
 * match.
 *
 * `contains` is opt-in for answers where the marker is embedded in a sentence
 * (e.g. "The marker is ACK-M05-COC-001."). Even then the match is token-bounded,
 * so `ACK-M05-COC-0011` cannot satisfy `ACK-M05-COC-001`.
 */
export function hasReplyToken(text, token, mode = 'line-exact') {
  const expected = flatText(token);
  if (!expected) return false;
  if (mode === 'contains') return containsToken(flatText(text).toLowerCase(), expected.toLowerCase());
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.trim());
  return lines.some((line) => line === expected);
}

/* ------------------------------------------------------------------- echo rules */

/**
 * Is this candidate the outbound prompt coming back rather than an answer?
 *
 * TWO INDEPENDENT TRIGGERS, because either alone is defeatable:
 *
 *  1. Provenance (checked by the caller and recorded here as `by_provenance`):
 *     a candidate taken from the user's own turn cannot be an answer, whatever it
 *     contains. The outbound prompt contains BOTH the correlation id and the
 *     expected token, so a text-only check would happily accept it.
 *
 *  2. Verbatim reproduction: normalised reply equal to, contained in, or
 *     containing the normalised outbound text, at SUBSTANTIVE length. Short
 *     protocol markers are exempt — see `SUBSTANTIVE_MIN_CHARS`.
 *
 * Both triggers are exact-structure comparisons. No fuzzy/similarity threshold is
 * used: a near-miss must not be silently "close enough" to pass a safety gate.
 */
export function looksLikeEcho(reply, outbound, meta = {}) {
  const byProvenance =
    meta.role === 'user' ||
    meta.by_provenance === true ||
    (typeof meta.source === 'string' && ECHO_SOURCES.includes(meta.source));
  if (byProvenance) {
    return {
      echo: true,
      trigger: 'provenance',
      detail:
        'candidate came from the outbound/user side (' +
        String(meta.source || meta.role || 'user turn') +
        '); it cannot be an assistant answer',
    };
  }

  const out = flatText(outbound).toLowerCase();
  const rep = flatText(reply).toLowerCase();
  if (!out || !rep) return { echo: false, trigger: null, detail: '' };

  // Every text trigger is gated on the REPLY being substantive. A reply shorter
  // than the gate is, by protocol, a bare marker — and that marker is verbatim
  // inside the outbound prompt, so gating on the outbound length instead would
  // reject every genuine answer. The marker case is covered by trigger 1.
  if (rep.length < SUBSTANTIVE_MIN_CHARS) return { echo: false, trigger: null, detail: '' };

  if (rep === out) {
    return { echo: true, trigger: 'verbatim_whole', detail: 'reply is the outbound text verbatim' };
  }
  if (out.includes(rep)) {
    return {
      echo: true,
      trigger: 'verbatim_span',
      detail: 'reply is a verbatim span of the outbound text and adds nothing',
    };
  }
  if (rep.includes(out)) {
    return {
      echo: true,
      trigger: 'verbatim_restatement',
      detail: 'reply is the outbound text restated with no additional answer',
    };
  }
  return { echo: false, trigger: null, detail: '' };
}

/* ---------------------------------------------------------- turn / block shaping */

/** Ported from extensions/chatgpt/content.js `msgTextOf`, unchanged in behaviour. */
export function msgTextOf(message) {
  const content = (message && message.content) || {};
  if (Array.isArray(content.parts)) {
    return content.parts.filter((part) => typeof part === 'string').join('\n');
  }
  if (typeof content.text === 'string') return content.text;
  if (typeof content.content === 'string') return content.content;
  return '';
}

/**
 * Turn/group caps.
 *
 * DEVIATION from the reference, with reason: the reference truncates every block
 * (4000 chars for a final answer). Truncation is safe for an exporter and unsafe
 * here, because a correlation token living past the cut would be removed from the
 * very string this module has to verify, producing a false rejection that looks
 * like a missing answer. The caps are therefore raised and, more importantly, are
 * applied only to the STORED copy — correlation always runs on the full text.
 */
const DEFAULT_CAPS = Object.freeze({
  user: 8000,
  thought: 4000,
  recap: 400,
  code: 4000,
  exec: 4000,
  tool: 3000,
  final: 20000,
  commentary: 3000,
});

/**
 * Flatten a captured conversation into a flat block list, newest order preserved.
 *
 * Accepts, without guessing wildly:
 *   - a `leanTurns()` result: `[{ blocks: [...] }, ...]`
 *   - one turn: `{ blocks: [...] }`
 *   - `{ turns: [...] }`
 *   - a bare block list: `[{ kind: 'final', text: '…' }]`
 *
 * Returns `null` for anything it cannot read, which the callers turn into a
 * NO_REPLY / BAD_INPUT rejection rather than an empty success.
 */
export function collectBlocks(input) {
  if (input === null || input === undefined) return null;
  if (Array.isArray(input)) {
    const blocks = [];
    for (const item of input) {
      if (item && typeof item === 'object' && Array.isArray(item.blocks)) {
        for (const block of item.blocks) blocks.push(block);
      } else if (item && typeof item === 'object') {
        blocks.push(item);
      } else {
        return null;
      }
    }
    return blocks;
  }
  if (typeof input !== 'object') return null;
  if (Array.isArray(input.turns)) return collectBlocks(input.turns);
  if (Array.isArray(input.blocks)) return collectBlocks(input.blocks);
  if (typeof input.kind === 'string' || typeof input.role === 'string' || typeof input.channel === 'string') {
    return [input];
  }
  if (Array.isArray(input.messages)) return collectBlocks(leanTurns(input));
  return null;
}

/** Is this block the assistant's final answer? Everything else is disqualified. */
export function isFinalAssistantBlock(block) {
  if (!block || typeof block !== 'object') return false;
  const kind = typeof block.kind === 'string' ? block.kind : '';
  const role = typeof block.role === 'string' ? block.role : '';
  const channel = typeof block.channel === 'string' ? block.channel : '';

  if (kind === 'user' || role === 'user') return false;
  if (channel && channel !== 'final') return false;
  if (kind === 'commentary') return false;
  // A channel wins over a kind, because `channel` is the field the proven
  // exporter keyed its final-answer selection on.
  if (channel === 'final') return true;
  if (kind === 'final') return true;
  return false;
}

/** Is this block an assistant message of some kind (final or not)? */
function isAssistantBlock(block) {
  if (!block || typeof block !== 'object') return false;
  const kind = typeof block.kind === 'string' ? block.kind : '';
  const role = typeof block.role === 'string' ? block.role : '';
  if (kind === 'user' || role === 'user') return false;
  if (kind === 'final' || kind === 'commentary' || kind === 'recap') return true;
  if (role === 'assistant') return true;
  return typeof block.channel === 'string';
}

/**
 * Port of `leanTurns()` from extensions/chatgpt/content.js.
 *
 * Groups a raw captured conversation by turn and keeps the block kinds the proven
 * exporter kept: user text, thoughts, recap, code, execution output, tool calls,
 * assistant commentary, and assistant `final`. The `channel === 'final'` test on
 * the assistant branch is the load-bearing line — without it a commentary aside
 * would be readable as the answer.
 *
 * DOM-free: it operates on the captured JSON only.
 */
export function leanTurns(raw, opts = {}) {
  const caps = Object.assign({}, DEFAULT_CAPS, opts.caps || {});
  const messages = raw && Array.isArray(raw.messages) ? raw.messages : [];
  const byTurn = new Map();

  messages.forEach((message, index) => {
    const metadata = (message && message.metadata) || {};
    const key = metadata.turn_exchange_id || metadata.turn_id || `__s${index}`;
    if (!byTurn.has(key)) byTurn.set(key, []);
    byTurn.get(key).push(message);
  });

  const turns = [];
  for (const group of byTurn.values()) {
    const blocks = [];
    for (const message of group) {
      const author = (message && message.author) || {};
      const content = (message && message.content) || {};
      const metadata = (message && message.metadata) || {};
      const role = author.role || '?';
      const name = author.name || '';
      const contentType = content.content_type || '';
      const text = msgTextOf(message);

      if (role === 'user' && contentType === 'text' && text.trim()) {
        blocks.push({ kind: 'user', text: text.slice(0, caps.user) });
      } else if (contentType === 'thoughts') {
        const summary = (content.thoughts || [])
          .map((item) => item && item.summary)
          .filter(Boolean)
          .join(' · ');
        const titles = (metadata.reasoning_titles || []).slice(0, 8).join(' → ');
        blocks.push({
          kind: 'thought',
          title: summary || 'Thinking',
          text: (titles || summary || '').slice(0, caps.thought),
        });
      } else if (contentType === 'reasoning_recap') {
        if (text.trim()) blocks.push({ kind: 'recap', text: text.slice(0, caps.recap) });
      } else if (contentType === 'code') {
        blocks.push({
          kind: 'code',
          name: name || role,
          lang: content.language || '',
          text: text.slice(0, caps.code),
        });
      } else if (contentType === 'execution_output') {
        blocks.push({ kind: 'exec', text: text.slice(0, caps.exec) });
      } else if (role === 'tool' && text.trim()) {
        blocks.push({ kind: 'tool', name, text: text.slice(0, caps.tool) });
      } else if (role === 'assistant' && contentType === 'text' && message.channel === 'final' && text.trim()) {
        blocks.push({
          kind: 'final',
          model: metadata.model_slug || metadata.resolved_model_slug || '',
          text: text.slice(0, caps.final),
        });
      } else if (role === 'assistant' && contentType === 'text' && text.trim()) {
        // NOT the answer. Kept so a verifier can see what was discarded, but
        // `isFinalAssistantBlock` refuses it.
        blocks.push({ kind: 'commentary', text: text.slice(0, caps.commentary) });
      }
    }
    if (blocks.length) turns.push({ blocks });
  }
  return turns;
}

/**
 * Read the last assistant final answer out of captured turns.
 *
 * @returns {{ ok: boolean, reason: string, detail: string, text: string|null,
 *             source: string|null, model: string|null }}
 */
export function extractFinalReply(input, opts = {}) {
  const blocks = collectBlocks(input);
  if (blocks === null) {
    return {
      ok: false,
      reason: REASON.BAD_INPUT,
      detail: 'captured turns were not readable (expected a block/turn/leanTurns shape)',
      text: null,
      source: null,
      model: null,
    };
  }

  const finals = blocks.filter(isFinalAssistantBlock);
  if (finals.length === 0) {
    const hadAssistant = blocks.some(isAssistantBlock);
    return {
      ok: false,
      reason: hadAssistant ? REASON.NOT_FINAL_CHANNEL : REASON.NO_FINAL_BLOCK,
      detail: hadAssistant
        ? 'assistant messages were present but none on the final channel; the answer was not readable'
        : 'no assistant message was present in the captured turns',
      text: null,
      source: null,
      model: null,
    };
  }

  const last = finals[finals.length - 1];
  const raw = typeof last.text === 'string' ? last.text : '';
  if (!raw.trim()) {
    return {
      ok: false,
      reason: REASON.NO_REPLY,
      detail: 'the last assistant final block was empty; no reply was read',
      text: null,
      source: opts.source || null,
      model: typeof last.model === 'string' ? last.model : null,
    };
  }

  return {
    ok: true,
    reason: REASON.ACCEPTED,
    detail: 'assistant final block read',
    text: raw,
    source: opts.source || 'final-block',
    model: typeof last.model === 'string' ? last.model : null,
  };
}

/* ------------------------------------------------------- generation-end waiting */

/**
 * Bounded, non-blocking wait for the assistant to stop writing.
 *
 * Injecting `isGenerating`, `sleep` and `now` is what keeps this module host-free
 * AND makes the wait testable without any wall-clock time: the tests drive a fake
 * DOM stub and a virtual clock, so "times out" is asserted rather than waited for.
 *
 * `mustHaveStarted` (default true) exists because of a specific race: a tick or
 * two after the submit click the stop control may not have appeared yet, so a
 * naive "wait while generating" returns immediately and the previous turn's answer
 * gets read as this turn's. Requiring the generating state to have been observed
 * at least once closes that hole; if it never appears, the result is
 * GENERATION_NEVER_STARTED, never a success.
 *
 * Always resolves. Never rejects, never loops forever.
 */
export async function waitForGenerationEnd(opts = {}) {
  const probe = typeof opts.isGenerating === 'function' ? opts.isGenerating : null;
  const timeoutMs = numberOr(opts.timeoutMs, DEFAULT_TIMEOUT_MS);
  const pollMs = Math.max(1, numberOr(opts.pollMs, DEFAULT_POLL_MS));
  const settleMs = Math.max(0, numberOr(opts.settleMs, DEFAULT_SETTLE_MS));
  const mustHaveStarted = opts.mustHaveStarted !== false;
  const sleep = typeof opts.sleep === 'function' ? opts.sleep : defaultSleep;
  const now = typeof opts.now === 'function' ? opts.now : () => Date.now();

  if (!probe) {
    return {
      ok: false,
      reason: REASON.BAD_INPUT,
      detail: 'waitForGenerationEnd requires an isGenerating probe',
      elapsed_ms: 0,
      started: false,
      ended: false,
      polls: 0,
    };
  }

  const startAt = now();
  let polls = 0;
  let sawGenerating = !mustHaveStarted;
  let endedAt = null;

  for (;;) {
    polls += 1;
    let generating = false;
    try {
      generating = probe() === true;
    } catch (err) {
      return {
        ok: false,
        reason: REASON.GENERATION_TIMEOUT,
        detail: 'the generating probe threw: ' + String(err && err.message ? err.message : err),
        elapsed_ms: now() - startAt,
        started: sawGenerating,
        ended: false,
        polls,
      };
    }

    if (generating) {
      sawGenerating = true;
      endedAt = null;
    } else if (sawGenerating) {
      if (endedAt === null) endedAt = now();
      if (now() - endedAt >= settleMs) {
        return {
          ok: true,
          reason: REASON.ACCEPTED,
          detail: 'generation finished',
          elapsed_ms: endedAt - startAt,
          started: true,
          ended: true,
          polls,
        };
      }
    }

    if (now() - startAt >= timeoutMs) {
      const neverStarted = !sawGenerating;
      return {
        ok: false,
        reason: neverStarted ? REASON.GENERATION_NEVER_STARTED : REASON.GENERATION_TIMEOUT,
        detail: neverStarted
          ? 'no generation was observed inside the bound; nothing was answered and nothing is claimed'
          : 'generation was still in progress at the bound; no reply is claimed',
        elapsed_ms: now() - startAt,
        started: sawGenerating,
        ended: false,
        polls,
      };
    }

    await sleep(pollMs);
  }
}

/* ------------------------------------------------------------------- verdict */

/**
 * Decide whether a captured candidate may be reported as this turn's answer.
 *
 * FAIL-CLOSED ORDER — each step refuses rather than degrades:
 *   1. the expectation itself must be usable
 *   2. generation must have been observed to finish (`generation_complete` must be
 *      exactly true; an omitted flag is NOT taken as success)
 *   3. provenance must be the assistant's final channel
 *   4. text must exist
 *   5. the candidate must not be the outbound prompt coming back
 *   6. this turn's correlation id must be present as a whole token
 *   7. no foreign correlation id may be present
 *   8. the expected reply token must be present
 *
 * The returned verdict ALWAYS carries `accepted` and a machine-readable `reason`.
 * `detail` is prose for humans and is never the only signal. On rejection
 * `reply` is null: an unverified string is not handed back as if it were an
 * answer. `observed.preview` is a clearly-labelled, capped excerpt kept for the
 * rejection receipt — it is evidence about a failure, not a reply.
 *
 * @param {{
 *   reply?: string|null,
 *   expected: { correlation_id: string, reply_token?: string|null },
 *   outbound_text?: string|null,
 *   role?: string|null,
 *   channel?: string|null,
 *   source?: string|null,
 *   generation_complete?: boolean,
 *   generation_started?: boolean|null,
 *   reply_token_mode?: 'line-exact'|'contains',
 *   require_reply_token?: boolean,
 * }} input
 */
export function correlateReply(input) {
  const args = input && typeof input === 'object' ? input : {};
  const expected = args.expected && typeof args.expected === 'object' ? args.expected : {};
  const correlationId = typeof expected.correlation_id === 'string' ? expected.correlation_id.trim() : '';
  const replyToken = typeof expected.reply_token === 'string' ? expected.reply_token.trim() : '';
  const tokenMode = TOKEN_MODES.includes(args.reply_token_mode) ? args.reply_token_mode : TOKEN_MODES[0];
  const requireToken = args.require_reply_token !== false;
  const generationComplete = args.generation_complete === true;

  const observed = {
    generation_complete: generationComplete,
    generation_started: args.generation_started === undefined ? null : args.generation_started === true,
    source: typeof args.source === 'string' ? args.source : null,
    role: typeof args.role === 'string' ? args.role : null,
    channel: typeof args.channel === 'string' ? args.channel : null,
    model: typeof args.model === 'string' ? args.model : null,
    reply_chars: 0,
    correlation_ids: [],
    correlation_found: false,
    reply_token_found: null,
    reply_token_mode: replyToken ? tokenMode : null,
    echo_trigger: null,
    preview: null,
  };

  const reject = (reason, detail) => ({
    schema: VERDICT_SCHEMA,
    accepted: false,
    reason,
    detail,
    correlation_id: correlationId || null,
    expected_reply: replyToken || null,
    reply: null,
    observed,
    checked_at: new Date().toISOString(),
  });

  /* 1 — the expectation must be usable. */
  if (!correlationId) {
    return reject(
      REASON.BAD_EXPECTATION,
      'no correlation_id was supplied; a reply cannot be bound to a turn without one',
    );
  }
  if (requireToken && !replyToken) {
    return reject(
      REASON.BAD_EXPECTATION,
      'an expected reply_token is required; accepting a reply that proves nothing is not offered',
    );
  }
  if (args.reply !== null && args.reply !== undefined && typeof args.reply !== 'string') {
    return reject(REASON.BAD_INPUT, 'the candidate reply was not a string');
  }

  const reply = typeof args.reply === 'string' ? args.reply : '';
  const normalized = normalizeText(reply);
  observed.reply_chars = normalized.length;
  if (normalized.length > 0) observed.preview = normalized.slice(0, MAX_PREVIEW_CHARS);

  /* 2 — generation must have been observed to finish. */
  if (!generationComplete) {
    return reject(
      REASON.GENERATION_INCOMPLETE,
      args.generation_complete === false
        ? 'the candidate was read while generation was still in progress; it may be partial'
        : 'generation completion was not asserted by the caller; an unasserted turn is refused',
    );
  }

  /* 3 — provenance. */
  if (args.role !== undefined && args.role !== null && args.role !== 'assistant') {
    return reject(
      args.role === 'user' ? REASON.ECHO_ONLY : REASON.NOT_ASSISTANT,
      `candidate role was ${JSON.stringify(args.role)}, not the assistant`,
    );
  }
  if (typeof args.source === 'string' && ECHO_SOURCES.includes(args.source)) {
    return reject(
      REASON.ECHO_ONLY,
      `candidate was read from the outbound side (${args.source}); an outbound message is not an answer`,
    );
  }
  if (args.channel !== undefined && args.channel !== null && args.channel !== 'final') {
    return reject(
      REASON.NOT_FINAL_CHANNEL,
      `candidate channel was ${JSON.stringify(args.channel)}; only the final assistant channel is an answer`,
    );
  }

  /* 4 — text must exist. */
  if (normalized.length === 0) {
    return reject(REASON.NO_REPLY, 'no reply text could be read; nothing is claimed');
  }

  /* 5 — must not be the outbound prompt coming back. */
  const echo = looksLikeEcho(normalized, args.outbound_text, {
    role: typeof args.role === 'string' ? args.role : null,
    source: typeof args.source === 'string' ? args.source : null,
  });
  if (echo.echo) {
    observed.echo_trigger = echo.trigger;
    return reject(REASON.ECHO_ONLY, echo.detail);
  }

  /* 6/7/8 — observe first, so a rejection receipt can still say what WAS present.
     The refusal order below is unchanged: correlation, then token. */
  const ids = findCorrelationIds(normalized);
  observed.correlation_ids = ids;
  observed.correlation_found = hasCorrelationId(normalized, correlationId);
  if (replyToken) observed.reply_token_found = hasReplyToken(normalized, replyToken, tokenMode);

  /* 6/7 — correlation. */
  if (!observed.correlation_found) {
    return reject(
      REASON.CORRELATION_MISMATCH,
      ids.length
        ? `the reply carries a different correlation id (${ids.join(', ')}); it is not this turn`
        : 'the reply carries no correlation id at all; it cannot be linked to this turn',
    );
  }
  const foreign = ids.filter((id) => id !== correlationId);
  if (foreign.length > 0) {
    return reject(
      REASON.CORRELATION_MISMATCH,
      `the reply carries this turn's id and a foreign one (${foreign.join(', ')}); the correlation is ambiguous`,
    );
  }

  /* 8 — the expected token. */
  if (replyToken && observed.reply_token_found !== true) {
    return reject(
      REASON.REPLY_TOKEN_MISMATCH,
      `the reply carries ${JSON.stringify(correlationId)} but not the expected ${tokenMode} token ` +
        JSON.stringify(replyToken),
    );
  }

  return {
    schema: VERDICT_SCHEMA,
    accepted: true,
    reason: REASON.ACCEPTED,
    detail: 'correlation id and expected reply token both present on the assistant final channel',
    correlation_id: correlationId,
    expected_reply: replyToken || null,
    // Correlation ran on the FULL text; only the stored copy is capped.
    reply: normalized.slice(0, MAX_STORED_REPLY_CHARS),
    observed,
    checked_at: new Date().toISOString(),
  };
}

/* ---------------------------------------------------------------- internals */

function numberOr(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function defaultSleep(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}