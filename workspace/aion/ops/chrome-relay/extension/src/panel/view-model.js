// AION Relay Station — shared view model for the human panel and the machine view.
//
// Pure functions only: no DOM, no chrome.*, no timers of their own. Both views
// import this module so they describe the same facts the same way, and so the
// Node test runner can exercise exactly the code the extension runs.
//
// Truth contract (inherited from panel.js, kept on purpose):
//   1. A value nobody observed is the string "UNKNOWN". It is never 0, "idle",
//      "ok" or an empty string. Counts that were not read are "UNKNOWN", not 0.
//   2. Transport, proof, approval and tab facts are separate fields. Nothing here
//      derives one from another.
//   3. "Next step" guidance is derived ONLY from results the panel has already
//      shown. It never claims the relay works; it names the next action a person
//      could take, and it never takes that action.
//   4. Nothing here can send. The only message this module's readStatus() ever
//      posts is the read-only { type: 'aion/status' }.

export const UNKNOWN = 'UNKNOWN';
export const SNAPSHOT_SCHEMA = 'aion.relay-view.v1';

/** Same rules as the panel's own validation (panel.js). A test pins them together. */
export const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
export const MAX_IDENTIFIER_LENGTH = 128;
export const MAX_PROMPT_LENGTH = 2000;

/** Mirrors panel.js FALLBACK_MODES (FALLBACK-AND-ACCEPTANCE.md, modes A to E). */
export const FALLBACK_MODES = Object.freeze({
  A: 'NATIVE_CONNECTED',
  B: 'LOCAL_CONNECTED',
  C: 'GITHUB_DELAYED',
  D: 'OFFLINE_BUFFERED',
  E: 'SAFE_MANUAL'
});

/* ------------------------------------------------------------------ *
 * Transport classification (mirrors panel.js classifyTransport)
 * ------------------------------------------------------------------ */

export function classifyTransport(statusText) {
  const value = String(statusText || '').toUpperCase();
  if (!value || value === UNKNOWN) return 'unknown';
  if (value.includes('FAIL') || value.includes('ERROR') || value.includes('DENY') || value.includes('DEAD')) {
    return 'stopped';
  }
  if (value.includes('DEGRADE') || value.includes('STALE') || value.includes('RETRY') || value.includes('PARTIAL')) {
    return 'degraded';
  }
  if (value.includes('CONNECT') || value.includes('LIVE') || value.includes('READY')) return 'live';
  if (value.includes('DISABLE') || value.includes('OFFLINE') || value.includes('CLOSED') || value.includes('DOWN')) {
    return 'degraded';
  }
  return 'known';
}

/* ------------------------------------------------------------------ *
 * Snapshot: one observation, in a stable machine-readable shape
 * ------------------------------------------------------------------ */

function text(value) {
  return typeof value === 'string' && value !== '' ? value : UNKNOWN;
}

function count(value) {
  return Number.isFinite(value) ? value : UNKNOWN;
}

/**
 * Turn one worker status reply into the machine snapshot.
 *
 * @param {object|null} status  the reply to { type: 'aion/status' }, or a failure
 *                              object `{ observed: false, error }`
 * @param {number} now          epoch ms the snapshot was taken (injected, never read here)
 */
export function snapshotFromStatus(status, now) {
  const observed = !!status && status.observed === true;
  const relay = observed && status.relay && typeof status.relay === 'object' ? status.relay : null;
  const fallback = observed && status.fallback && typeof status.fallback === 'object' ? status.fallback : null;
  const proof = observed && status.proof && typeof status.proof === 'object' ? status.proof : null;
  const outbox = observed && status.outbox && typeof status.outbox === 'object' ? status.outbox : null;
  const approval = observed && status.approval && typeof status.approval === 'object' ? status.approval : null;

  const mode = fallback && Object.prototype.hasOwnProperty.call(FALLBACK_MODES, fallback.mode) ? fallback.mode : null;
  const pending = approval ? count(approval.pending) : UNKNOWN;
  const evidenceAt = proof && typeof proof.last_evidence_at === 'string' && proof.last_evidence_at !== ''
    ? proof.last_evidence_at
    : null;

  return {
    schema: SNAPSHOT_SCHEMA,
    taken_at: new Date(now).toISOString(),
    observed,
    observed_at: observed ? text(status.observed_at) : UNKNOWN,
    // Why nothing was observed, when that is the case. null while observed.
    problem: observed ? null : text(status && status.error),
    link: {
      transport: relay ? text(relay.status) : UNKNOWN,
      transport_class: relay ? classifyTransport(relay.status) : 'unknown',
      adapter: relay ? text(relay.name) : UNKNOWN,
      adapter_enabled: relay ? relay.enabled === true : UNKNOWN,
      detail: relay ? text(relay.degraded_reason || relay.detail) : UNKNOWN,
      worker_boot_count: relay ? count(relay.boot_count) : UNKNOWN,
      worker_started_at: relay ? text(relay.worker_started_at) : UNKNOWN
    },
    mode: {
      code: mode || UNKNOWN,
      name: mode ? FALLBACK_MODES[mode] : UNKNOWN,
      reason: fallback ? text(fallback.reason) : UNKNOWN
    },
    approval: {
      pending,
      // HELD is its own state. A held task is not progressing and has not been sent.
      state: pending === UNKNOWN ? UNKNOWN : pending > 0 ? 'HELD' : 'CLEAR'
    },
    proof: {
      // "No proof observed" is only assertable if something was actually read.
      state: !observed ? UNKNOWN : evidenceAt ? 'EVENT_OBSERVED_NOT_VERIFIED' : 'NONE_OBSERVED',
      last_evidence_at: evidenceAt || UNKNOWN
    },
    outbox: {
      queued: outbox ? count(outbox.count) : UNKNOWN,
      cursor: outbox ? count(outbox.cursor) : UNKNOWN
    }
  };
}

/** One line a person or a screenshot reader can take in at a glance. */
export function stateLine(snapshot) {
  const s = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const pick = (group, key) => (s[group] && s[group][key] !== undefined ? String(s[group][key]) : UNKNOWN);
  return [
    'HOST_LINK=' + pick('link', 'transport'),
    'MODE=' + pick('mode', 'code'),
    'APPROVALS=' + pick('approval', 'state'),
    'PROOF=' + pick('proof', 'state'),
    'OUTBOX=' + pick('outbox', 'queued')
  ].join(' ');
}

const VOLATILE_PATHS = new Set(['taken_at', 'observed_at']);

function flatten(value, prefix, out) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) flatten(value[key], prefix ? prefix + '.' + key : key, out);
  } else {
    out[prefix] = value;
  }
  return out;
}

/** What changed between two snapshots. Clock fields are ignored: they always change. */
export function diffSnapshots(previous, next) {
  if (!previous) return [];
  const a = flatten(previous, '', {});
  const b = flatten(next, '', {});
  const changes = [];
  for (const path of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (VOLATILE_PATHS.has(path)) continue;
    if (a[path] !== b[path]) changes.push({ path, from: a[path] === undefined ? UNKNOWN : a[path], to: b[path] === undefined ? UNKNOWN : b[path] });
  }
  return changes;
}

/** Dotted path and value for every leaf, in snapshot order. Drives the fields table. */
export function snapshotRows(snapshot) {
  const flat = flatten(snapshot, '', {});
  return Object.keys(flat).map((path) => ({ path, value: flat[path] === null ? 'none' : String(flat[path]) }));
}

/**
 * Snapshot as embeddable JSON text. `<` is escaped so the text can never close a
 * surrounding <script> element, even if a worker string contains "</script>".
 */
export function snapshotJson(snapshot) {
  return JSON.stringify(snapshot, null, 2).replace(/</g, '\\u003c');
}

/* ------------------------------------------------------------------ *
 * Catalog: what exists, and who may use it
 * ------------------------------------------------------------------ */

/**
 * Every worker endpoint, by what it does. A test pins this list to the worker's
 * real endpoint tables, so it cannot silently drift.
 *
 *   kind 'status'  reads the worker's own state
 *   kind 'probe'   asks the host or one tab a question; sends no message
 *   kind 'send'    sends one message into a ChatGPT tab
 *
 * `machine_view` is whether the machine view may call it. Only status reads are.
 * Every other row is operated by a person, from the human view, one click each.
 */
export const ACTION_CATALOG = Object.freeze([
  { type: 'aion/status', kind: 'status', machine_view: true, summary: 'Read the relay state the worker currently holds.' },
  { type: 'aion/refresh', kind: 'status', machine_view: false, summary: 'Ask the worker to re-read and stamp a refresh time.' },
  { type: 'aion/native-ping', kind: 'probe', machine_view: false, summary: 'Check that the local relay host answers.' },
  { type: 'aion/native-hello', kind: 'probe', machine_view: false, summary: 'Start the handshake with the OpenCode agent. No session is created.' },
  { type: 'aion/chatgpt-tabs', kind: 'probe', machine_view: false, summary: 'List open chatgpt.com tabs by id and cleaned address.' },
  { type: 'aion/chatgpt-ping', kind: 'probe', machine_view: false, summary: 'Check that one chosen tab answers. Reads nothing from the page.' },
  { type: 'aion/chatgpt-run', kind: 'send', machine_view: false, summary: 'Send exactly one message into one chosen tab. Cannot be unsent.' },
  { type: 'aion/chatgpt-read', kind: 'probe', machine_view: false, summary: 'Read back the final reply for one correlation id.' }
]);

/** Rules a reader (agent or person) needs to interpret every field correctly. */
export const READING_RULES = Object.freeze([
  'UNKNOWN means nobody observed it. It does not mean idle, zero, healthy or failed.',
  'HOST_LINK says only whether the local host answers. It is not task execution and not proof.',
  'An open ChatGPT tab is browser metadata. It does not mean an agent is running in it.',
  'HELD means an approval is pending. A held task is not progressing and has not been sent.',
  'EVENT_OBSERVED_NOT_VERIFIED means an evidence event was seen. This view does not verify it.',
  'A capture from a tab is a capture, not a proof receipt.',
  'This view cannot send or approve anything. A person does that from the human view.'
]);

/* ------------------------------------------------------------------ *
 * Status read (read-only)
 * ------------------------------------------------------------------ */

/**
 * Read the worker's status once. Posts exactly `{ type: 'aion/status' }`.
 *
 * A worker that never answers is UNKNOWN, not idle and not failed, so absence of
 * an answer is reported as `{ observed: false, error }` and never invented away.
 */
export function readStatus(runtime, options = {}) {
  const timeoutMs = options.timeoutMs ?? 3000;
  const setTimer = options.setTimeout ?? globalThis.setTimeout;
  const clearTimer = options.clearTimeout ?? globalThis.clearTimeout;

  if (!runtime || typeof runtime.sendMessage !== 'function' || runtime.id === undefined) {
    return Promise.resolve({
      observed: false,
      error: 'No extension runtime. This page is running standalone; nothing has been observed.'
    });
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimer(() => {
      finish({ observed: false, error: 'Service worker did not answer within ' + timeoutMs / 1000 + 's. State is unknown, not idle.' });
    }, timeoutMs);
    try {
      runtime.sendMessage({ type: 'aion/status' }, (reply) => {
        clearTimer(timer);
        const lastError = runtime.lastError;
        if (lastError) {
          finish({ observed: false, error: 'Worker message failed: ' + lastError.message });
          return;
        }
        if (!reply || reply.observed !== true) {
          finish({ observed: false, error: (reply && reply.error) || 'Worker returned no observation.' });
          return;
        }
        finish(reply);
      });
    } catch (error) {
      clearTimer(timer);
      finish({ observed: false, error: 'Worker message threw: ' + String(error && error.message) });
    }
  });
}

/* ------------------------------------------------------------------ *
 * Human guide: what could a person do next?
 * ------------------------------------------------------------------ */

/**
 * Pick the next step from what the panel has already shown.
 *
 * `input` is read off the page, never invented:
 *   hostState      data-state of #result-native  ('ok' | 'warn' | 'error' | 'unknown' | ...)
 *   tabsListed     number of real tab options in #tab-select
 *   tabSelected    whether a tab is selected
 *   tabState       data-state of #result-chatgpt. That node is shared by "find tabs" and
 *                  "check tab", so only a failure is read from it; success is not
 *                  taken to mean the tab was checked, and checking is optional.
 *   hasText, correlationValid, tokenValid, confirmed   probe form facts
 *   armed          whether the run button is currently enabled
 *   probePhase     data-hold of #probe-hold ('clear' | 'unknown' | 'settled')
 *
 * Returns { id, step, text, target, tone }. `target` is an element id the page may
 * move focus to. This function never selects, confirms or sends anything.
 */
export function nextStep(input) {
  const i = input && typeof input === 'object' ? input : {};

  if (i.probePhase === 'unknown') {
    return {
      id: 'probe-unsettled',
      step: 3,
      tone: 'hold',
      text: 'A probe was sent and its outcome is unknown. Reconcile it once it has settled.',
      target: 'btn-probe-reconcile'
    };
  }
  if (i.hostState === 'error' || i.hostState === 'warn') {
    return {
      id: 'host-needs-attention',
      step: 1,
      tone: 'stop',
      text: 'The last host check did not succeed. Read the result, then check the host again.',
      target: 'btn-native-ping'
    };
  }
  if (i.hostState !== 'ok') {
    return {
      id: 'check-host',
      step: 1,
      tone: 'go',
      text: 'Check that the relay host answers.',
      target: 'btn-native-ping'
    };
  }
  if (!(i.tabsListed > 0)) {
    return {
      id: 'find-tabs',
      step: 2,
      tone: 'go',
      text: 'Find your open ChatGPT tabs.',
      target: 'btn-chatgpt-tabs'
    };
  }
  if (!i.tabSelected) {
    return {
      id: 'choose-tab',
      step: 2,
      tone: 'go',
      text: 'Choose which ChatGPT tab to test.',
      target: 'tab-select'
    };
  }
  if (i.tabState === 'error' || i.tabState === 'warn') {
    return {
      id: 'tab-needs-attention',
      step: 2,
      tone: 'stop',
      text: 'The last tab check did not succeed. Read the result, then check the tab again.',
      target: 'btn-chatgpt-ping'
    };
  }
  if (!i.hasText) {
    return {
      id: 'write-message',
      step: 3,
      tone: 'go',
      text: 'Write the message, or use the starter message.',
      target: 'probe-text'
    };
  }
  if (!i.correlationValid || !i.tokenValid) {
    return {
      id: 'fill-ids',
      step: 3,
      tone: 'go',
      text: 'Add a correlation id and a reply token. Generate them if you like.',
      target: !i.correlationValid ? 'probe-correlation' : 'probe-token'
    };
  }
  if (!i.confirmed) {
    return {
      id: 'confirm',
      step: 3,
      tone: 'hold',
      text: 'Review the message, then confirm you want to send it.',
      target: 'probe-confirm'
    };
  }
  if (i.armed) {
    return {
      id: 'ready',
      step: 3,
      tone: 'hold',
      text: 'Everything is filled in and confirmed. Run one probe when you are ready. Nothing is sent until you click.',
      target: 'btn-chatgpt-run'
    };
  }
  return {
    id: 'blocked',
    step: 3,
    tone: 'stop',
    text: 'The run button is still closed. The notes under it say why.',
    target: 'probe-blockers'
  };
}

/** Which step a person is on, for dimming later steps. 1-based. */
export function currentStepNumber(input) {
  return nextStep(input).step;
}

/* ------------------------------------------------------------------ *
 * Generated identifiers and the starter message (user-triggered only)
 * ------------------------------------------------------------------ */

function hex(bytes) {
  return Array.from(bytes, (b) => (b & 0xff).toString(16).padStart(2, '0')).join('');
}

/**
 * Build a correlation id, a reply token and a starter message from random bytes.
 *
 * `randomBytes(n)` is injected (crypto.getRandomValues in the page, a fixed array
 * in tests). Both identifiers satisfy IDENTIFIER_PATTERN by construction. The
 * token is a random label, not a secret: it only lets the panel recognise a reply.
 */
/**
 * A message that asks for the two things a reply must carry to be accepted:
 * the correlation id anywhere, and the token as a whole line of its own
 * (chatgpt/correlate.js: hasCorrelationId, hasReplyToken in its default
 * 'line-exact' mode).
 *
 * Two traps this wording avoids, both found by running it against the real rules:
 *   - asking for the token alone is refused as a correlation mismatch;
 *   - ending the message with the two reply lines back to back makes a perfect
 *     reply a verbatim span of the message, which looksLikeEcho refuses as an
 *     echo. So each value sits on its own instruction line, with words between.
 */
export function starterMessage(correlation, token) {
  return (
    'Reply with exactly two lines and nothing else.\n' +
    'First line: only this id: ' + correlation + '\n' +
    'Second line: only this token: ' + token
  );
}

export function generateProbeSet(randomBytes) {
  const correlation = 'probe-' + hex(randomBytes(6));
  const token = 'ack-' + hex(randomBytes(5));
  return { correlation, token, message: starterMessage(correlation, token) };
}

/* ------------------------------------------------------------------ *
 * Review summary and field checks
 * ------------------------------------------------------------------ */

/** Plain facts for the "check before you send" block. Empty means not provided. */
export function reviewSummary({ tabLabel, text: message, correlation, token }) {
  const body = typeof message === 'string' ? message : '';
  const c = typeof correlation === 'string' ? correlation.trim() : '';
  const t = typeof token === 'string' ? token.trim() : '';
  return {
    tab: tabLabel ? String(tabLabel) : UNKNOWN,
    message_length: body.length,
    message_limit: MAX_PROMPT_LENGTH,
    message_over_limit: body.length > MAX_PROMPT_LENGTH,
    correlation_valid: IDENTIFIER_PATTERN.test(c),
    token_valid: IDENTIFIER_PATTERN.test(t),
    // A reply is accepted only if it carries the correlation id and the token on a
    // line of its own, so the message has to ask for both.
    message_mentions_correlation: c !== '' && body.includes(c),
    message_mentions_token: t !== '' && body.includes(t)
  };
}
