// AION Relay Station — side panel controller.
//
// Truthfulness rules this file implements on purpose:
//
//  1. "No data" is UNKNOWN everywhere. It is never rendered as idle, healthy or
//     zero. Unknown values carry the word UNKNOWN and a dashed/hatched frame.
//  2. A role tab being open is UI metadata, not executor liveness. The tab fact
//     and the executor fact are separate rows with separate labels. Nothing in
//     this file can set a role to running from tab presence.
//  3. Transport status and proof status are separate fields in separate panels.
//     A delivery ACK never fills the proof field.
//  4. An approval-gated item is rendered as HELD, in its own gated block, and
//     never as progress.
//
// Degradation: this file is also the standalone-review entry point. When chrome.*
// is absent (HTML opened directly from disk) every observed field falls back to
// UNKNOWN and the knowledge bar says so. It does not invent a plausible state.

import { ROLES, ROLE_COUNT, ownerConfirmationRoles } from '../roles.js';

const UNKNOWN = 'UNKNOWN';

/* ------------------------------------------------------------------ *
 * chrome.* availability
 * ------------------------------------------------------------------ */

const runtime = typeof chrome !== 'undefined' && chrome && chrome.runtime ? chrome.runtime : null;

function canTalkToWorker() {
  return !!runtime && typeof runtime.sendMessage === 'function' && runtime.id !== undefined;
}

/* ------------------------------------------------------------------ *
 * Constants with a stated basis, never invented per-render
 * ------------------------------------------------------------------ */

const EVIDENCE_STALE_MS = 15 * 60 * 1000;      // proof evidence older than this is stale
const EVIDENCE_VERY_STALE_MS = 60 * 60 * 1000; // and critically stale past an hour
const OBSERVATION_STALE_MS = 5 * 60 * 1000;    // a worker reading older than this is stale
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// FALLBACK-AND-ACCEPTANCE.md, "Five progressive modes".
const FALLBACK_MODES = Object.freeze({
  A: 'NATIVE_CONNECTED',
  B: 'LOCAL_CONNECTED',
  C: 'GITHUB_DELAYED',
  D: 'OFFLINE_BUFFERED',
  E: 'SAFE_MANUAL'
});

const MODE_DESCRIPTIONS = Object.freeze({
  A: 'Native messaging host connected.',
  B: 'Authorized loopback relay connected.',
  C: 'No live local relay. Queue moves through the AION GitHub channel.',
  D: 'No host, no network. Drafts queued and marked UNSENT.',
  E: 'Extension unavailable or disabled. External executor may still finish accepted work.'
});

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

function el(id) {
  return document.getElementById(id);
}

function setField(node, value, state) {
  if (!node) return;
  node.textContent = value === null || value === undefined || value === '' ? UNKNOWN : String(value);
  node.dataset.state = state || 'known';
}

function parseTime(value) {
  if (!value || typeof value !== 'string') return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Age rendering. Returns { text, state }. Never guesses: an unparseable or
 * absent timestamp is UNKNOWN, not "0m".
 */
function ageOf(value, now) {
  const ms = parseTime(value);
  if (ms === null) return { text: UNKNOWN, state: 'unknown', ms: null };
  const delta = now - ms;
  if (delta < 0) return { text: 'in the future (clock skew)', state: 'degraded', ms: delta };
  if (delta < MINUTE) return { text: Math.floor(delta / 1000) + 's ago', state: 'known', ms: delta };
  if (delta < HOUR) return { text: Math.floor(delta / MINUTE) + 'm ago', state: 'known', ms: delta };
  return { text: Math.floor(delta / HOUR) + 'h ago', state: 'known', ms: delta };
}

function proofStaleness(evidenceAt, now) {
  const ms = parseTime(evidenceAt);
  if (ms === null) return { text: UNKNOWN + ' — no evidence timestamp exists', state: 'unknown' };
  const delta = now - ms;
  if (delta >= EVIDENCE_VERY_STALE_MS) {
    return { text: 'STALE — ' + Math.floor(delta / HOUR) + 'h since last proof event', state: 'stopped' };
  }
  if (delta >= EVIDENCE_STALE_MS) {
    return { text: 'STALE — ' + Math.floor(delta / MINUTE) + 'm since last proof event', state: 'degraded' };
  }
  return { text: 'FRESH — ' + Math.floor(delta / MINUTE) + 'm since last proof event', state: 'proof' };
}

function classifyTransport(statusText) {
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
 * Role tiles
 * ------------------------------------------------------------------ */

// Facts the registry knows without observing anything. These are configuration,
// so they render as known. Everything about live state stays UNKNOWN until a
// worker reports it.
function buildRoleTile(role) {
  const item = document.createElement('li');
  item.className = 'role';
  item.dataset.role = role.id;
  item.dataset.known = 'no';
  item.dataset.executor = 'unknown';

  const head = document.createElement('div');
  head.className = 'role__head';
  const id = document.createElement('span');
  id.className = 'role__id';
  id.textContent = role.id;
  const title = document.createElement('h3');
  title.className = 'role__title';
  title.textContent = role.code;
  head.append(id, title);

  const purpose = document.createElement('p');
  purpose.className = 'role__purpose';
  purpose.textContent = role.purpose;

  // Distinction 2: the tab fact lives in its own boxed, labelled row.
  const tabrow = document.createElement('div');
  tabrow.className = 'tabrow';
  tabrow.dataset.state = 'unknown';
  const tabLabel = document.createElement('span');
  tabLabel.className = 'tabrow__label';
  tabLabel.textContent = 'TAB';
  const tabValue = document.createElement('span');
  tabValue.className = 'tabrow__value';
  tabValue.dataset.state = 'unknown';
  tabValue.textContent = UNKNOWN;
  tabrow.append(tabLabel, tabValue);

  const facts = document.createElement('div');
  facts.className = 'role__facts';

  function addFact(key, value, state) {
    const row = document.createElement('div');
    row.className = 'fact';
    const k = document.createElement('span');
    k.className = 'fact__k';
    k.textContent = key;
    const v = document.createElement('span');
    v.className = 'fact__v';
    v.textContent = value;
    v.dataset.state = state;
    row.append(k, v);
    facts.append(row);
    return v;
  }

  const configuredNode = addFact('CONFIG', role.launch_state, 'known');

  // Executor liveness: strictly event-derived. There is no code path from tab
  // presence to this value.
  const executorNode = addFact('EXECUTOR', UNKNOWN + ' — no executor event observed', 'unknown');

  const taskNode = addFact('TASK', UNKNOWN, 'unknown');
  const proofNode = addFact('PROOF', UNKNOWN, 'unknown');
  const evidenceNode = addFact('EVIDENCE', UNKNOWN, 'unknown');

  const gateNode = document.createElement('p');
  gateNode.className = 'role__note';
  if (role.launch_policy === 'new_session_requires_owner_confirmation') {
    gateNode.textContent = 'HELD — a new session for this role requires owner confirmation. Not launched.';
    gateNode.dataset.gate = 'held';
    item.dataset.executor = 'held';
  } else {
    gateNode.textContent =
      'Launch requires an explicit user gesture. Launching a tab would still not start an agent.';
    gateNode.dataset.gate = 'clear';
  }

  item.append(head, purpose, tabrow, facts, gateNode);

  // Nothing observed yet: mark the tile so CSS can render it in the unknown
  // treatment rather than a healthy idle one.
  if (role.launch_state !== 'LIVE') {
    executorNode.dataset.state = 'unknown';
  }

  return {
    element: item,
    tabrow,
    tabValue,
    executorNode,
    taskNode,
    proofNode,
    evidenceNode,
    configuredNode
  };
}

const tiles = new Map();

function renderTiles() {
  const grid = el('role-grid');
  if (!grid) return;
  grid.textContent = '';
  for (const role of ROLES) {
    const tile = buildRoleTile(role);
    tiles.set(role.id, tile);
    grid.append(tile.element);
  }
}

function resetTilesToUnknown() {
  for (const [roleId, tile] of tiles) {
    tile.tabrow.dataset.state = 'unknown';
    tile.tabValue.textContent = UNKNOWN;
    tile.tabValue.dataset.state = 'unknown';
    tile.executorNode.textContent = UNKNOWN + ' — no executor event observed';
    tile.executorNode.dataset.state = 'unknown';
    tile.taskNode.textContent = UNKNOWN;
    tile.taskNode.dataset.state = 'unknown';
    tile.proofNode.textContent = UNKNOWN;
    tile.proofNode.dataset.state = 'unknown';
    tile.evidenceNode.textContent = UNKNOWN;
    tile.evidenceNode.dataset.state = 'unknown';
    tile.element.dataset.known = 'no';
    const role = ROLES.find((r) => r.id === roleId);
    tile.element.dataset.executor =
      role && role.launch_policy === 'new_session_requires_owner_confirmation' ? 'held' : 'unknown';
  }
}

/* ------------------------------------------------------------------ *
 * Worker query
 * ------------------------------------------------------------------ */

function requestStatus() {
  if (!canTalkToWorker()) {
    return Promise.resolve({
      observed: false,
      error: 'No extension runtime. Panel is running standalone; nothing has been observed.'
    });
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    // A suspended or absent worker never answers. Absence of an answer is
    // UNKNOWN, not failure and not idle.
    const timer = setTimeout(() => {
      finish({
        observed: false,
        error: 'Service worker did not answer within 3s. State is unknown, not idle.'
      });
    }, 3000);
    try {
      runtime.sendMessage({ type: 'aion/status' }, (reply) => {
        clearTimeout(timer);
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
      clearTimeout(timer);
      finish({ observed: false, error: 'Worker message threw: ' + String(error && error.message) });
    }
  });
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

function renderKnowledge(status) {
  const bar = el('knowledge-bar');
  const text = el('knowledge-text');
  if (!bar || !text) return;

  if (!status || status.observed !== true) {
    bar.dataset.state = 'error';
    // The distinction survives every failure mode, so the sentence is appended
    // rather than replaced by the error text.
    const why = (status && status.error) || 'No status has been read.';
    text.textContent = why + ' Every field below is UNKNOWN, which is not the same as idle.';
    return;
  }

  bar.dataset.state = 'observed';
  const stamp = ageOf(status.observed_at, Date.now());
  text.textContent =
    'Last read from the service worker ' +
    stamp.text +
    '. Fields reflect one observation, not a continuing guarantee.';
}

function renderMode(status, now) {
  const chip = el('mode-chip');
  if (!chip) return;
  const mode = status && status.fallback ? status.fallback.mode : null;
  const known = !!mode && Object.prototype.hasOwnProperty.call(FALLBACK_MODES, mode);
  if (!known) {
    chip.textContent = 'MODE ' + UNKNOWN;
    chip.dataset.state = 'unknown';
  } else {
    chip.textContent = 'MODE ' + mode + ' ' + FALLBACK_MODES[mode];
    chip.dataset.state = mode === 'A' ? 'live' : mode === 'B' ? 'live' : mode === 'E' ? 'stopped' : 'degraded';
  }

  const reason = el('fallback-reason');
  if (reason) {
    if (!known) {
      reason.textContent = 'Fallback reason: ' + UNKNOWN + ' — mode has not been observed.';
    } else {
      const why = status.fallback.reason || UNKNOWN;
      reason.textContent = 'Mode ' + mode + ' — ' + MODE_DESCRIPTIONS[mode] + ' Reason: ' + why;
    }
  }

  const refreshAge = ageOf(status && status.relay ? status.relay.worker_started_at : null, now);
  void refreshAge;
}

function renderRelay(status, now) {
  const relay = status && status.relay ? status.relay : null;
  const state = relay ? classifyTransport(relay.status) : 'unknown';

  setField(el('relay-transport'), relay ? relay.status : UNKNOWN, state);
  setField(
    el('relay-adapter'),
    relay ? relay.name + (relay.enabled ? ' (enabled)' : ' (disabled)') : UNKNOWN,
    relay && relay.enabled ? state : 'unknown'
  );
  setField(el('relay-detail'), relay ? relay.detail : UNKNOWN, relay ? 'known' : 'unknown');
  setField(
    el('relay-boots'),
    relay && Number.isFinite(relay.boot_count) ? String(relay.boot_count) : UNKNOWN,
    relay && Number.isFinite(relay.boot_count) ? 'known' : 'unknown'
  );
  setField(el('relay-started'), relay ? relay.worker_started_at || UNKNOWN : UNKNOWN, relay ? 'known' : 'unknown');

  if (relay && relay.degraded_reason) {
    setField(el('relay-detail'), relay.degraded_reason, 'degraded');
  }

  void now;
}

function renderProof(status, now) {
  const observed = !!status && status.observed === true;
  const proof = status && status.proof ? status.proof : null;
  const evidenceAt = proof ? proof.last_evidence_at : null;

  // "No proof seen" is only assertable if something was actually looked at.
  // With no observation there is no basis for the claim at all.
  if (!observed) {
    setField(el('proof-status'), UNKNOWN, 'unknown');
  } else if (!evidenceAt) {
    setField(el('proof-status'), 'NO PROOF OBSERVED', 'unknown');
  } else {
    setField(el('proof-status'), 'PROOF EVENT OBSERVED — NOT VERIFIED BY THIS PANEL', 'proof');
  }
  setField(el('proof-timestamp'), evidenceAt || UNKNOWN, evidenceAt ? 'proof' : 'unknown');

  const stale = proofStaleness(evidenceAt, now);
  setField(el('proof-staleness'), stale.text, stale.state);

  // Verification is an independent verifier's claim, distinct from the builder.
  // The MVP has no verifier identity, so it says UNKNOWN rather than assuming.
  setField(el('proof-verifier'), UNKNOWN + ' — no independent verifier has reported', 'unknown');

  const note = el('proof-note');
  if (note) {
    note.textContent =
      (proof && proof.note) ||
      'No proof event observed. Transport delivery would not change this field.';
    if (status && status.task_note) note.textContent += ' ' + status.task_note;
  }
}

function renderQueue(status, now) {
  const outbox = status && status.outbox ? status.outbox : null;
  const count = outbox && Number.isFinite(outbox.count) ? outbox.count : null;
  setField(
    el('queue-count'),
    count === null ? UNKNOWN : count === 0 ? '0 queued — empty outbox, nothing pending' : String(count) + ' queued, unsent',
    count === null ? 'unknown' : count === 0 ? 'known' : 'degraded'
  );

  if (count === 0) {
    setField(el('queue-oldest'), 'No queued items', 'known');
  } else if (count === null) {
    setField(el('queue-oldest'), UNKNOWN, 'unknown');
  } else {
    const age = ageOf(outbox.oldest_created_at, now);
    setField(el('queue-oldest'), age.text, age.state === 'known' ? 'degraded' : age.state);
  }

  setField(
    el('queue-cursor'),
    outbox && Number.isFinite(outbox.cursor) ? String(outbox.cursor) : UNKNOWN,
    outbox && Number.isFinite(outbox.cursor) ? 'known' : 'unknown'
  );
}

function renderGate(status) {
  const panel = el('gate-panel');
  const countNode = el('gate-count');
  const list = el('gate-list');
  const note = el('gate-note');
  const approval = status && status.approval ? status.approval : null;
  const pending = approval && Number.isFinite(approval.pending) ? approval.pending : null;

  // Role-level launch gates are known from the registry, not from observation.
  const ownerGated = ownerConfirmationRoles();

  if (panel) panel.dataset.gate = pending && pending > 0 ? 'blocked' : 'clear';

  if (pending === null) {
    setField(countNode, UNKNOWN + ' — approval state not observed', 'unknown');
  } else if (pending === 0) {
    setField(countNode, '0 tasks held for approval', 'known');
  } else {
    setField(countNode, String(pending) + ' task(s) HELD at APPROVAL_PENDING — not progressing', 'held');
  }

  if (list) {
    list.textContent = '';
    for (const role of ownerGated) {
      const li = document.createElement('li');
      li.textContent =
        role.id + ' ' + role.code + ': launch policy requires owner confirmation. Held, not launched.';
      list.append(li);
    }
    if (pending !== null && pending > 0) {
      const li = document.createElement('li');
      li.textContent = String(pending) + ' task(s) awaiting approval. An approval does not exist yet.';
      list.append(li);
    }
  }

  if (note) {
    note.textContent =
      (approval && approval.note) ||
      'Approval state not observed. Nothing is claimed to be in progress.';
  }
}

function render(status) {
  const now = Date.now();
  renderKnowledge(status);
  renderMode(status, now);
  renderRelay(status, now);
  renderProof(status, now);
  renderQueue(status, now);
  renderGate(status);
  if (!status || status.observed !== true) resetTilesToUnknown();
}

async function refresh() {
  const button = el('refresh-btn');
  if (button) button.setAttribute('aria-busy', 'true');
  try {
    const status = await requestStatus();
    render(status);
  } finally {
    if (button) button.removeAttribute('aria-busy');
  }
}

/* ------------------------------------------------------------------ *
 * Operator controls
 *
 * Five explicit actions. Each one sends exactly one message to the service
 * worker and waits for exactly one reply. Nothing in this section runs on
 * load, on focus, on a timer, or on a previous reply. There is no queue and
 * no retry: if an action does not answer, the operator clicks again.
 *
 * The worker owns live/browser behaviour. This file only builds requests and
 * renders replies, using textContent throughout. No reply content is ever
 * interpreted as markup.
 * ------------------------------------------------------------------ */

/**
 * Per-action deadlines.
 *
 * Diagnostics are cheap and must fail fast so a broken host is obvious. A live
 * run waits on the content side of the relay, which can legitimately take
 * minutes, so it gets its own much longer deadline rather than sharing the
 * diagnostic one. A shared short deadline made the panel declare failure while
 * the run was still in flight, then let the operator retry — which is exactly
 * the double-send this panel must not allow.
 *
 * The ACP handshake is the one exception: `aion/native-hello` drives a real
 * `initialize`, observed taking 4.7s on the owner host. Sharing the 5s
 * diagnostic deadline made it time out on a success that was still arriving,
 * so hello alone carries a bounded 20s budget. It stays bounded — this is a
 * widened deadline, not a removed one.
 *
 * LIVE_RUN_TIMEOUT_MS must stay at or above the content-side maximum. That
 * value is owned elsewhere; if it is raised, raise this too.
 */
const DIAGNOSTIC_TIMEOUT_MS = 5000;
const HELLO_TIMEOUT_MS = 20000;
const LIVE_RUN_TIMEOUT_MS = 180000;

/**
 * The approval every commanded run acts under.
 *
 * The worker refuses a run whose command carries no `approved_scope_ref`: a
 * user gesture says a human clicked, it is not authorisation, and the panel
 * must not claim the authority to grant itself. This constant names the
 * existing owner authorization record for this scope. It is a fixed reference,
 * not an operator input — the panel offers no way to widen its own approval.
 */
const APPROVED_SCOPE_REF = 'workspace/aion/ops/chrome-relay/AUTHORIZATION-2026-10-17.md';

// Correlation ids and reply tokens are operator-typed identifiers, not
// secrets. The charset is deliberately narrow so a stray paste of a URL or a
// credential is rejected by the field rather than sent to a tab.
const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_PROMPT_LENGTH = 2000;

/**
 * Send one message to the service worker and wait for one reply.
 *
 * `deadlineMs` is per call, not global: a caller that can legitimately take
 * minutes passes a longer one. A deadline expiring is an UNKNOWN outcome, not
 * a failure and not a negative result.
 */
function sendOperatorMessage(message, deadlineMs) {
  const budget = typeof deadlineMs === 'number' && Number.isFinite(deadlineMs) && deadlineMs > 0
    ? deadlineMs
    : DIAGNOSTIC_TIMEOUT_MS;
  if (!canTalkToWorker()) {
    return Promise.resolve({
      ok: false,
      error: 'No extension runtime. Operator actions are unavailable in standalone review.'
    });
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => {
      finish({
        ok: false,
        uncertain: true,
        error: 'No reply within ' + Math.round(budget / 1000) + 's. Outcome unknown.'
      });
    }, budget);
    try {
      runtime.sendMessage(message, (reply) => {
        clearTimeout(timer);
        const lastError = runtime.lastError;
        if (lastError) {
          finish({
            ok: false,
            uncertain: true,
            error: 'Worker message failed: ' + lastError.message
          });
          return;
        }
        finish(reply && typeof reply === 'object' ? reply : { ok: false, error: 'Worker returned nothing usable.' });
      });
    } catch (error) {
      clearTimeout(timer);
      finish({
        ok: false,
        uncertain: true,
        error: 'Worker message threw: ' + String(error && error.message)
      });
    }
  });
}

/* ---- reply shape tolerance ---- */

// The worker's response shape is not pinned yet. A value may arrive flat or
// nested under one of these wrappers. Nothing here invents a value: a key that
// is present in none of them stays UNKNOWN.
const REPLY_WRAPPERS = ['result', 'reply', 'verdict'];

function pick(reply, key) {
  if (!reply || typeof reply !== 'object') return undefined;
  if (reply[key] !== undefined) return reply[key];
  for (const wrapper of REPLY_WRAPPERS) {
    const inner = reply[wrapper];
    if (inner && typeof inner === 'object' && !Array.isArray(inner) && inner[key] !== undefined) {
      return inner[key];
    }
  }
  return undefined;
}

function replyOk(reply) {
  return pick(reply, 'ok') === true;
}

/**
 * Sanitize a ChatGPT tab URL.
 *
 * Accepts only an exact https://chatgpt.com origin with no port, no
 * credentials, no query and no fragment. Returns a rebuilt origin+pathname
 * string, or null. Nothing derived from a worker reply is ever echoed back
 * into the DOM without passing through here.
 */
export function sanitizeChatgptUrl(raw) {
  if (typeof raw !== 'string' || raw === '') return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (error) {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.hostname !== 'chatgpt.com') return null;
  if (parsed.port !== '') return null;
  if (parsed.username !== '' || parsed.password !== '') return null;
  if (parsed.search !== '' || parsed.hash !== '') return null;

  // Decode before reducing the charset, otherwise a percent escape is stripped
  // to its digits and the path shown to the operator is wrong.
  let pathname = parsed.pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch (error) {
    return null;
  }
  pathname = pathname.replace(/[^A-Za-z0-9/_-]/g, '');
  if (pathname === '') return null;
  return 'https://chatgpt.com/' + pathname.replace(/^\/+/, '');
}

/**
 * Accept a tab only if it carries a usable numeric id and an exact ChatGPT
 * origin URL.
 *
 * The id is checked by type, never coerced: Number(null) and Number('') are
 * both 0, and 0 is a real tab id, so a missing id would otherwise silently
 * address the wrong tab. A missing or unusable URL yields no option at all —
 * the parent check flagged that rendering a tab with an UNKNOWN url and then
 * letting it be selected is an unsafe selection.
 */
export function sanitizeTab(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id;
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 0) return null;
  const url = sanitizeChatgptUrl(raw.url);
  if (url === null) return null;
  return { id, url };
}

/**
 * Validate the probe fields.
 *
 * Returns the per-field problem list. An empty list means the operator may
 * arm the probe. Exported so the checking lane can assert the same rules
 * without duplicating them.
 */
export function validateProbeInput({ text, correlationId, token, tabId, confirmed }) {
  const problems = [];
  if (!tabId) problems.push('Select a ChatGPT tab first.');
  if (typeof text !== 'string' || text.trim() === '') problems.push('Prompt text is required.');
  else if (text.length > MAX_PROMPT_LENGTH) problems.push('Prompt text exceeds ' + MAX_PROMPT_LENGTH + ' characters.');
  if (typeof correlationId !== 'string' || !IDENTIFIER_PATTERN.test(correlationId.trim())) {
    problems.push('Correlation id must be 1-128 characters of A-Z a-z 0-9 . _ : -');
  }
  if (typeof token !== 'string' || !IDENTIFIER_PATTERN.test(token.trim())) {
    problems.push('Expected reply token must be 1-128 characters of A-Z a-z 0-9 . _ : -');
  }
  if (confirmed !== true) problems.push('Tick the confirmation to send.');
  return problems;
}

function setResult(id, text, state) {
  const node = el(id);
  if (!node) return;
  node.textContent = text;
  node.dataset.state = state || 'known';
}

/**
 * Render a worker reply as text.
 *
 * Only explicitly named fields are shown, every value is coerced to a string
 * and assigned through textContent, and a field present in no recognized
 * wrapper stays UNKNOWN. A reply can add structure to this console's output
 * but never markup to it, and it can never turn an unobserved field into a
 * plausible-looking value.
 */
function describeReply(reply, fields) {
  if (!replyOk(reply)) {
    const reason = pick(reply, 'error') || pick(reply, 'reason') || 'No reason reported by the worker.';
    const uncertain = pick(reply, 'uncertain') === true;
    return {
      text: (uncertain ? 'UNCERTAIN — ' : 'FAILED — ') + String(reason),
      state: uncertain ? 'warn' : 'error'
    };
  }
  const lines = [];
  for (const [label, key] of fields) {
    const value = pick(reply, key);
    if (value === undefined || value === null || value === '') {
      lines.push(label + ': ' + UNKNOWN);
    } else if (Array.isArray(value)) {
      lines.push(label + ': ' + value.length + ' item(s)');
    } else if (typeof value === 'object') {
      lines.push(label + ': ' + Object.keys(value).sort().join(', '));
    } else {
      lines.push(label + ': ' + String(value));
    }
  }
  return { text: lines.join('\n'), state: 'ok' };
}

/* ---- Step 1: host and ACP ---- */

async function checkHost() {
  setResult('result-native', 'Checking host...', 'known');
  const reply = await sendOperatorMessage({ type: 'aion/native-ping' }, DIAGNOSTIC_TIMEOUT_MS);
  const shown = describeReply(reply, [
    ['Host', 'host'],
    ['Transport', 'transport'],
    ['Status', 'status'],
    ['Detail', 'detail']
  ]);
  setResult('result-native', shown.text, shown.state);
}

async function initializeAcp() {
  setResult('result-native', 'Initializing ACP...', 'known');
  const reply = await sendOperatorMessage({ type: 'aion/native-hello' }, HELLO_TIMEOUT_MS);
  const shown = describeReply(reply, [
    ['Protocol', 'protocol'],
    ['Version', 'version'],
    ['Capabilities', 'capabilities'],
    ['Detail', 'detail']
  ]);
  setResult('result-native', shown.text, shown.state);
}

/* ---- Step 2: ChatGPT tabs ---- */

/**
 * Fill the tab selector from the worker reply.
 *
 * Entries that fail sanitization are dropped and counted, not rendered with a
 * placeholder. The selector is owned by this function on every path: an empty
 * list must never leave a usable selector behind.
 */
function populateTabs(rawTabs) {
  const select = el('tab-select');
  if (!select) return { added: 0, rejected: 0 };
  select.textContent = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'No tab selected';
  select.append(placeholder);

  let added = 0;
  let rejected = 0;
  for (const raw of Array.isArray(rawTabs) ? rawTabs : []) {
    const tab = sanitizeTab(raw);
    if (tab === null) {
      rejected += 1;
      continue;
    }
    const option = document.createElement('option');
    option.value = String(tab.id);
    option.textContent = 'tab ' + tab.id + ' — ' + tab.url;
    select.append(option);
    added += 1;
  }

  select.disabled = added === 0;
  select.value = '';
  return { added, rejected };
}

async function findChatgptTabs() {
  setResult('result-chatgpt', 'Searching for ChatGPT tabs...', 'known');
  const reply = await sendOperatorMessage({ type: 'aion/chatgpt-tabs' }, DIAGNOSTIC_TIMEOUT_MS);
  if (!replyOk(reply)) {
    const shown = describeReply(reply, [['Detail', 'detail']]);
    populateTabs([]);
    setResult('result-chatgpt', shown.text, shown.state);
    updateOperatorGate();
    return;
  }
  const rawTabs = pick(reply, 'tabs');
  if (!Array.isArray(rawTabs)) {
    populateTabs([]);
    setResult('result-chatgpt', 'Worker reported no tab list. Tab selection is unavailable.', 'warn');
    updateOperatorGate();
    return;
  }
  const { added, rejected } = populateTabs(rawTabs);
  const lines = [added + ' tab(s) listed.'];
  if (rejected > 0) lines.push(rejected + ' entr(y/ies) rejected: not an exact https://chatgpt.com tab.');
  lines.push('Select one to enable the next step.');
  setResult('result-chatgpt', lines.join('\n'), added === 0 ? 'warn' : 'ok');
  updateOperatorGate();
}

/* ---- Step 2b: selected tab ---- */

async function pingSelectedTab() {
  const tabId = selectedTabId();
  if (tabId === null) {
    setResult('result-chatgpt', 'FAILED — no tab selected.', 'error');
    return;
  }
  setResult('result-chatgpt', 'Checking selected tab...', 'known');
  const reply = await sendOperatorMessage({ type: 'aion/chatgpt-ping', tabId }, DIAGNOSTIC_TIMEOUT_MS);
  const shown = describeReply(reply, [
    ['Tab', 'tab_id'],
    ['Status', 'status'],
    ['Detail', 'detail']
  ]);
  setResult('result-chatgpt', shown.text, shown.state);
}

/* ---- Step 3: one authorized probe ---- */

/**
 * Probe lifecycle.
 *
 * idle      — nothing dispatched; the run button may be armed by the operator.
 * dispatched— the request reached sendMessage. The outcome is unknown. Locked.
 * settled   — a known outcome arrived, including a definite pre-dispatch
 *             rejection and including a timeout. Locked.
 *
 * There is deliberately no path from dispatched or settled back to idle except
 * an explicit reconcile click. A timeout or a dropped connection must not
 * re-arm the operator, because the previous probe may still be running.
 */
let probePhase = 'idle';
let probeInFlight = false;

function setHold(text, holdState) {
  const node = el('probe-hold');
  if (!node) return;
  node.textContent = text;
  node.dataset.hold = holdState || 'clear';
}

/**
 * Return the probe to idle without resending anything.
 *
 * This is the only path out of `dispatched` and `settled`, so it is refused
 * while the request is still in flight. While in flight the outcome is not yet
 * known, and clearing the lock early would re-arm the operator against a run
 * that may still be executing — the double-send this panel exists to prevent.
 * The control is disabled for the same reason; the guard is here so the
 * invariant does not depend on the button's disabled state.
 */
function reconcileProbe() {
  if (probePhase === 'idle') return;
  if (probeInFlight) {
    setHold('A probe is still in flight. Wait for the outcome before reconciling.', 'unknown');
    setResult('result-run', 'NOT RECONCILED — a probe is still in flight. Nothing was reset.', 'warn');
    updateOperatorGate();
    return;
  }
  probePhase = 'idle';
  probeInFlight = false;
  blankProbeFields();
  setHold('Probe state reconciled. Nothing was resent and nothing is armed.', 'clear');
  setResult('result-run', 'Not run.', 'unknown');
  updateOperatorGate();
}

async function runProbe() {
  const tabId = selectedTabId();
  const textNode = el('probe-text');
  const correlationNode = el('probe-correlation');
  const tokenNode = el('probe-token');
  const confirmNode = el('probe-confirm');

  const text = (textNode && textNode.value) || '';
  const correlationId = (correlationNode && correlationNode.value) || '';
  const token = (tokenNode && tokenNode.value) || '';
  const confirmed = !!confirmNode && confirmNode.checked === true;

  const problems = validateProbeInput({ text, correlationId, token, tabId, confirmed });
  if (problems.length > 0 || probePhase !== 'idle' || probeInFlight) {
    const reason = probePhase === 'idle' ? problems[0] : 'A probe is already dispatched or unsettled.';
    setResult('result-run', 'NOT SENT — ' + (reason || 'action already in flight.'), 'warn');
    updateOperatorGate();
    return;
  }

  // Lock BEFORE the send. If this call throws or the worker dies mid-flight the
  // panel is still locked, because the request may already have been delivered.
  probePhase = 'dispatched';
  probeInFlight = true;
  blankProbeFields();
  setHold('Request dispatched to tab ' + tabId + '. Outcome unknown until the worker reports.', 'unknown');
  setResult('result-run', 'Dispatched. Waiting for the worker...', 'known');
  updateOperatorGate();

  const reply = await sendOperatorMessage(
    {
      type: 'aion/chatgpt-run',
      tabId,
      command: {
        text: text.trim(),
        correlation_id: correlationId.trim(),
        expected_reply_token: token.trim(),
        approved_scope_ref: APPROVED_SCOPE_REF,
        user_gesture: true
      }
    },
    LIVE_RUN_TIMEOUT_MS
  );

  probeInFlight = false;
  probePhase = 'settled';

  if (replyOk(reply)) {
    const shown = describeReply(reply, [
      ['Correlation id', 'correlation_id'],
      ['Reply token seen', 'expected_reply_token'],
      ['Captured', 'captured'],
      ['Detail', 'detail']
    ]);
    setHold('Dispatched and reported. Still not independently verified.', 'settled');
    setResult('result-run', 'CAPTURED — not independently verified.\n' + shown.text, 'captured');
    // The outcome is now known, so the gate is recomputed here as well: the run
    // is still locked, and reconcile re-opens now that nothing is in flight.
    updateOperatorGate();
    return;
  }

  // Past this point the request could have reached the worker, so the panel
  // must not claim NOT SENT. Two worker statements are evidence-backed:
  // `dispatched: false` (rejected before dispatch) and `uncertain: false` (the
  // worker knows the outcome and reports it failed). Everything else, including
  // silence, is treated as uncertain.
  const dispatchedByWorker = pick(reply, 'dispatched');
  const reason = String(pick(reply, 'error') || pick(reply, 'reason') || 'no reason reported');
  const uncertain =
    pick(reply, 'uncertain') !== false && dispatchedByWorker !== false;

  if (dispatchedByWorker === false) {
    setHold('Worker rejected the request before dispatch. Locked until reconciled.', 'settled');
    setResult('result-run', 'NOT SENT — the worker rejected this before dispatch.\nReason: ' + reason, 'warn');
  } else {
    setHold(
      uncertain
        ? 'Dispatched, no definite outcome. May still be running. Locked until reconciled.'
        : 'Dispatched and rejected. Locked until reconciled.',
      'settled'
    );
    setResult(
      'result-run',
      (uncertain ? 'UNCERTAIN — ' : 'FAILED — ') +
        reason +
        '\nA request was dispatched. Whether a message was sent is not known here.',
      uncertain ? 'warn' : 'error'
    );
  }

  updateOperatorGate();
}

function blankProbeFields() {
  const text = el('probe-text');
  const correlation = el('probe-correlation');
  const token = el('probe-token');
  const confirmNode = el('probe-confirm');
  if (text) {
    text.value = '';
    text.removeAttribute('aria-invalid');
  }
  if (correlation) {
    correlation.value = '';
    correlation.removeAttribute('aria-invalid');
  }
  if (token) {
    token.value = '';
    token.removeAttribute('aria-invalid');
  }
  if (confirmNode) confirmNode.checked = false;
}

function selectedTabId() {
  const select = el('tab-select');
  if (!select) return null;
  const value = select.value;
  if (value === undefined || value === null || value === '') return null;
  const id = Number(value);
  return Number.isInteger(id) && id >= 0 ? id : null;
}

function renderBlockers(list) {
  const node = el('probe-blockers');
  if (!node) return;
  node.textContent = '';
  for (const item of list) {
    const li = document.createElement('li');
    li.textContent = item;
    node.append(li);
  }
}

/**
 * Single source of truth for which buttons may be used.
 *
 * Diagnostics are always available once there is a runtime; they are read-only
 * and cannot strand a probe. The run button additionally requires the probe to
 * be in the idle phase, and the reconcile button requires it to be held and
 * no longer in flight — an in-flight request cannot yet be declared over.
 */
function updateOperatorGate() {
  const select = el('tab-select');
  const pingButton = el('btn-chatgpt-ping');
  const runButton = el('btn-chatgpt-run');
  const reconcileButton = el('btn-probe-reconcile');
  const confirmNode = el('probe-confirm');
  const text = (el('probe-text') && el('probe-text').value) || '';
  const correlationId = (el('probe-correlation') && el('probe-correlation').value) || '';
  const token = (el('probe-token') && el('probe-token').value) || '';

  const tabId = selectedTabId();

  if (pingButton) {
    pingButton.disabled = tabId === null;
    pingButton.setAttribute('aria-disabled', String(tabId === null));
  }

  const problems = validateProbeInput({
    text,
    correlationId,
    token,
    tabId,
    confirmed: !!confirmNode && confirmNode.checked === true
  });

  const textNode = el('probe-text');
  const correlationNode = el('probe-correlation');
  const tokenNode = el('probe-token');
  if (textNode) markInvalid(textNode, text.trim() === '' || text.length > MAX_PROMPT_LENGTH);
  if (correlationNode) markInvalid(correlationNode, !IDENTIFIER_PATTERN.test(correlationId.trim()));
  if (tokenNode) markInvalid(tokenNode, !IDENTIFIER_PATTERN.test(token.trim()));

  const locked = probePhase !== 'idle';
  if (runButton) {
    const armed = problems.length === 0 && !locked && !probeInFlight;
    runButton.disabled = !armed;
    runButton.setAttribute('aria-disabled', String(!armed));
  }
  if (reconcileButton) {
    // Reconciling means "the previous probe is no longer running". While the
    // request is still in flight that is not yet true, so reconcile stays
    // closed and only a settled outcome re-opens it.
    const reconcilable = locked && !probeInFlight;
    reconcileButton.disabled = !reconcilable;
    reconcileButton.setAttribute('aria-disabled', String(!reconcilable));
  }

  if (locked) {
    renderBlockers([
      probePhase === 'dispatched'
        ? (probeInFlight
            ? 'A probe is dispatched and its outcome is unknown. It cannot be repeated or cancelled here.'
            : 'A probe is dispatched and its outcome is unknown. Reconcile explicitly before another one.')
        : 'A dispatched probe is unsettled. Reconcile explicitly before another one.'
    ]);
    return;
  }

  renderBlockers(problems);
  void select;
}

function markInvalid(node, invalid) {
  if (!node) return;
  if (invalid) node.setAttribute('aria-invalid', 'true');
  else node.removeAttribute('aria-invalid');
}

function wireOperatorControls() {
  const bind = (id, handler) => {
    const node = el(id);
    if (node) node.addEventListener('click', handler);
  };

  bind('btn-native-ping', () => {
    checkHost();
  });
  bind('btn-native-hello', () => {
    initializeAcp();
  });
  bind('btn-chatgpt-tabs', () => {
    findChatgptTabs();
  });
  bind('btn-chatgpt-ping', () => {
    pingSelectedTab();
  });
  bind('btn-chatgpt-run', () => {
    runProbe();
  });
  bind('btn-probe-reconcile', () => {
    reconcileProbe();
  });

  const select = el('tab-select');
  if (select) select.addEventListener('change', updateOperatorGate);

  for (const id of ['probe-text', 'probe-correlation', 'probe-token']) {
    const node = el(id);
    if (node) node.addEventListener('input', updateOperatorGate);
  }

  const confirmNode = el('probe-confirm');
  if (confirmNode) confirmNode.addEventListener('change', updateOperatorGate);

  // Fields ship blank and the gate is computed once here. No action is sent.
  blankProbeFields();
  // An empty selector must be unusable from the start, not only after a search.
  if (select) select.disabled = select.children.length === 0;
  updateOperatorGate();
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

function boot() {
  renderTiles();
  render(null);
  const button = el('refresh-btn');
  if (button) {
    button.addEventListener('click', () => {
      refresh();
    });
  }
  wireOperatorControls();
  refresh();

  // Re-read on visibility so a reopened panel is not showing a stale read.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Exported for the parallel test lane and for standalone review in a console.
export { FALLBACK_MODES, MODE_DESCRIPTIONS, refresh, render, ROLE_COUNT };