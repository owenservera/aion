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
import { chatGPTCommandName, resolveCommandDeadline } from '../lib/command-deadlines.js';

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
 * Every ChatGPT outer wait is calculated by the same pure policy as the worker:
 * complete command absolute budget (including hydration/preparation/storage)
 * plus bounded response margin. Native ping/hello retain their existing budgets.
 */
const DIAGNOSTIC_TIMEOUT_MS = 5000;
const HELLO_TIMEOUT_MS = 20000;
const CHATGPT_PING_TIMEOUT_MS = resolveCommandDeadline({ command: 'ping' }).panelMs;
const LIVE_RUN_TIMEOUT_MS = resolveCommandDeadline({ command: 'run-turn' }).panelMs;

/**
 * The split engine's own budgets, read from the same policy the worker uses.
 *
 * The submit is a submission-observation bound, not a generation bound: it
 * reserves durably, arms the page observer, activates once and returns the
 * first receipt. The observe is a short read-only poll of an already-armed
 * observer. Neither budget is derived from the run budget, so a poll can
 * never outlast — let alone move — the operation it is asking about.
 */
const SUBMIT_TIMEOUT_MS = resolveCommandDeadline({ command: 'submit-turn' }).panelMs;
const OBSERVE_TIMEOUT_MS = resolveCommandDeadline({ command: 'observe-turn' }).panelMs;
const READ_TIMEOUT_MS = resolveCommandDeadline({ command: 'read-final' }).panelMs;

/**
 * The read-only reconciliation budget.
 *
 * A reconcile reads the durable record and, where an observer identity is
 * known, asks the PAGE about that observer — the same read-only action the
 * poll uses. It is a read budget, so it is the same shape as the poll's and
 * it can never outlast the operation it is asking about.
 */
const RECONCILE_TIMEOUT_MS = resolveCommandDeadline({ command: 'reconcile-turn' }).panelMs;

/**
 * The approval every commanded turn acts under.
 *
 * The worker refuses a run or a submit whose command carries no
 * `approved_scope_ref`: a user gesture says a human clicked, it is not
 * authorisation, and the panel must not claim the authority to grant itself.
 *
 * So the reference is OPERATOR-SUPPLIED and starts EMPTY. The panel holds no
 * grant of its own, and it refuses to send until the operator names the
 * approval their own authorization record names. The bound mirrors the
 * worker's: a non-empty, trimmed, 1-128 character reference from a
 * deliberately narrow charset, and never one of the names a plain object
 * would inherit.
 */
export const SCOPE_REF_PATTERN = /^[A-Za-z0-9._:/-]{1,128}$/;
const DANGEROUS_REFERENCE_NAMES = new Set(['__proto__', 'prototype', 'constructor']);

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
  let budget = typeof deadlineMs === 'number' && Number.isFinite(deadlineMs) && deadlineMs > 0
    ? deadlineMs
    : DIAGNOSTIC_TIMEOUT_MS;
  const command = chatGPTCommandName(message.type);
  if (command) {
    try {
      const source = message.command ?? message;
      const plan = resolveCommandDeadline({ command, requestedWorkMs: source.timeout_ms });
      budget = plan.panelMs;
      message = { ...message, command: { ...source, timeout_ms: plan.workMs } };
    } catch (error) {
      return Promise.resolve({ ok: false, dispatched: false, error: String(error.message ?? error) });
    }
  }
  if (!canTalkToWorker()) {
    return Promise.resolve({
      ok: false,
      error: 'No extension runtime. Operator actions are unavailable in standalone review.'
    });
  }
  return new Promise((resolve) => {
    let settled = false;
    let timer;
    let armed = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
      if (armed) { try { clearTimeout(timer); } catch { /* callback remains token-gated */ } }
    };
    try {
      timer = setTimeout(() => {
        finish({
          ok: false,
          uncertain: true,
          error: 'No reply within ' + Math.round(budget / 1000) + 's. Outcome unknown.'
        });
      }, budget);
      armed = true;
      if (settled) { try { clearTimeout(timer); } catch { /* already expired */ } return; }
      runtime.sendMessage(message, (reply) => {
        if (settled) return;
        try {
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
        } catch (error) {
          finish({ ok: false, uncertain: true, error: 'Worker callback failed: ' + String(error.message ?? error) });
        }
      });
    } catch (error) {
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
 *
 * TWO ID SPELLINGS, one value. The worker's port driver emits `tab_id`, while a
 * raw tab from chrome.tabs carries `id`. Reading only `id` rejected every real
 * entry and left the selector empty with the rejects counter climbing. Both are
 * accepted; a record carrying BOTH and disagreeing is refused rather than
 * resolved, because a record with two ids is either a bug or a forgery and
 * picking one would guess which tab an operator is about to type into.
 */
export function sanitizeTab(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const idOk = (value) => typeof value === 'number' && Number.isInteger(value) && value >= 0;
  const hasTabId = raw.tab_id !== undefined;
  const hasId = raw.id !== undefined;

  // A provided id must be a real number. Presence with a bad shape is a refusal,
  // not a reason to fall through to the other spelling.
  if (hasTabId && !idOk(raw.tab_id)) return null;
  if (hasId && !idOk(raw.id)) return null;
  if (!hasTabId && !hasId) return null;
  if (hasTabId && hasId && raw.tab_id !== raw.id) return null;

  const id = hasTabId ? raw.tab_id : raw.id;
  const url = sanitizeChatgptUrl(raw.url);
  if (url === null) return null;
  return { id, url };
}

/**
 * The problem with an approval reference, or null when it is usable.
 *
 * The bound is the worker's own: a non-empty, trimmed, 1-128 character
 * reference. The charset is deliberately narrower than "any string" so a
 * stray paste of a URL, a path with a space, or a credential is refused by
 * the field rather than carried into a durable dispatch record. A name a
 * plain object would inherit is refused too, for the same reason the task
 * store refuses it.
 *
 * Exported so the checking lane can assert the same rules without
 * duplicating them.
 */
export function scopeRefProblem(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'Approval reference is required: a click alone is not authorisation.';
  }
  const trimmed = value.trim();
  if (trimmed.length > 128) {
    return 'Approval reference must be 1-128 characters.';
  }
  if (!SCOPE_REF_PATTERN.test(trimmed) || DANGEROUS_REFERENCE_NAMES.has(trimmed)) {
    return 'Approval reference must be 1-128 characters of A-Z a-z 0-9 . _ : / -';
  }
  return null;
}

/**
 * Validate the probe fields.
 *
 * Returns the per-field problem list. An empty list means the operator may
 * arm the probe. Exported so the checking lane can assert the same rules
 * without duplicating them.
 *
 * `scopeRef` is required: the worker refuses a send whose command carries no
 * approval reference, and the panel holds no grant of its own to fall back
 * on. An empty reference is a refusal here, before anything is dispatched.
 */
export function validateProbeInput({ text, correlationId, token, tabId, confirmed, scopeRef }) {
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
  const scopeProblem = scopeRefProblem(scopeRef);
  if (scopeProblem) problems.push(scopeProblem);
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

/* ---- the ChatGPT tab ping's own reply ---- */

// A note or state value is a string from the content script. It is rendered
// through textContent, so it cannot add markup; this only flattens it to one
// bounded line so a pathological value cannot flood the result box.
const MAX_PING_TEXT = 240;

function safePingLine(value, max = MAX_PING_TEXT) {
  if (typeof value !== 'string') return '';
  const oneLine = value
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (oneLine === '') return '';
  return oneLine.length > max ? oneLine.slice(0, max) + '…' : oneLine;
}

/** Render the driver's sanitized composer state without inventing absent keys. */
function describePingState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return '';
  const parts = [];
  for (const key of Object.keys(state).sort()) {
    const value = state[key];
    if (value === true || value === false) {
      parts.push(key + '=' + String(value));
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      parts.push(key + '=' + String(value));
    } else if (typeof value === 'string' && value !== '') {
      parts.push(key + '=' + safePingLine(value, 40));
    }
  }
  return parts.join(', ');
}

/**
 * Render an `aion/chatgpt-ping` reply from the real driver contract.
 *
 * The driver answers `{ ok, tab:{ tab_id, url, ... }, action:'ping', href,
 * state, note }` and the worker wraps it as `{ ok, code, error, result, ...body }`.
 * The panel previously read `tab_id`, `status` and `detail`, none of which that
 * contract carries, so a successful ping displayed three UNKNOWNs. This reads
 * the fields that are really there and shows nothing that is not.
 *
 * A successful ping is TAB REACHABILITY ONLY: the content script answered a
 * read-only probe, and nothing was composed or sent. It is not ACP initialized,
 * not an executor session, and not M1 proof. A failed ping keeps the driver's
 * stable code so the operator can tell a missing content script (`no_content_script`)
 * from a timed-out page (`content_timeout`) instead of seeing one vague failure.
 */
function describeChatgptPing(reply) {
  if (!replyOk(reply)) {
    const reason = safePingLine(pick(reply, 'error') || pick(reply, 'reason'))
      || 'No reason reported by the worker.';
    const uncertain = pick(reply, 'uncertain') === true;
    const code = pick(reply, 'code');
    const lines = [(uncertain ? 'UNCERTAIN — ' : 'FAILED — ') + reason];
    const codeText = safePingLine(code, 64);
    if (codeText !== '') lines.push('Code: ' + codeText);
    return { text: lines.join('\n'), state: uncertain ? 'warn' : 'error' };
  }

  const tab = pick(reply, 'tab');
  const tabRecord = tab && typeof tab === 'object' && !Array.isArray(tab) ? tab : null;
  const tabId = tabRecord ? tabRecord.tab_id : undefined;

  // Never coerce an id: the selector refuses `'7'`, so the report must too.
  const lines = ['Tab: ' + (Number.isInteger(tabId) && tabId >= 0 ? String(tabId) : UNKNOWN)];

  const url = tabRecord ? sanitizeChatgptUrl(tabRecord.url) : null;
  if (url !== null) lines.push('URL: ' + url);

  if (pick(reply, 'action') === 'ping') lines.push('Action: ping');

  lines.push('Status: ANSWERED — tab reachability only; not ACP or M1 proof.');

  const state = describePingState(pick(reply, 'state'));
  if (state !== '') lines.push('State: ' + state);

  const note = safePingLine(pick(reply, 'note'));
  if (note !== '') lines.push('Note: ' + note);

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
  const reply = await sendOperatorMessage({ type: 'aion/chatgpt-ping', tabId }, CHATGPT_PING_TIMEOUT_MS);
  const shown = describeChatgptPing(reply);
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

/**
 * The operation this panel is currently addressing.
 *
 * The correlation id and the expected reply token are how a later read-only
 * poll names the SAME operation — including after this panel's own deadline
 * expired, which is exactly when the operator most needs to be able to ask
 * again. They are therefore kept from the moment of dispatch until an
 * explicit new run replaces them.
 *
 * `source` says WHICH control dispatched it, and it is not cosmetic:
 *   'submit' — the split engine. It reserves the turn durably, arms the page
 *              observer and records the observer's identity, so the operation
 *              can be polled and reconciled.
 *   'run'    — the legacy blocking path. It never arms an observer, so a poll
 *              against it could only ever answer `observer_identity_required`.
 *
 * The token is deliberately never rendered. It is in state, and in the
 * operator's own field, and nowhere else: not in a result, not in a receipt,
 * not in a log line.
 */
let addressedOperation = null;

/**
 * In-flight guards for the three read-only controls.
 *
 * They exist so one click is one command: a second click while a poll, a read
 * or a reconcile is still waiting cannot queue a second request. They are NOT a
 * send lock — a read-only control never changes the send state, and a held or
 * timed-out send never blocks them.
 */
let observeInFlight = false;
let readInFlight = false;
let reconcileInFlight = false;

function rememberOperation({ correlationId, token, tabId, source }) {
  addressedOperation = { correlationId, token, tabId, source };
}

function forgetOperation() {
  addressedOperation = null;
}

/**
 * Whether the addressed operation has a durable observer to poll.
 *
 * ONLY the split engine's submit arms one: it reserves the turn durably, arms
 * the page observer and records that observer's identity. A legacy "run one
 * probe" never arms an observer, so a poll against it could only ever answer
 * `observer_identity_required` — the panel must not offer a control whose only
 * possible answer is a refusal.
 *
 * The READ control stays available for both, because it can scan the page for
 * a reply without a durable observer.
 */
function observerAvailable() {
  return addressedOperation !== null && addressedOperation.source === 'submit';
}

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
 *
 * Reconciling is the EXPLICIT NEW RUN: it drops the addressable operation, so
 * a later poll can no longer name the previous one. That is the point of it —
 * the operator is declaring that the previous operation is done with.
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
  forgetOperation();
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
  const scopeRef = scopeRefValue();

  const problems = validateProbeInput({ text, correlationId, token, tabId, confirmed, scopeRef });
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
  // The operation is remembered BEFORE the request goes out, so a panel
  // timeout can still be followed by a read-only poll that names THIS
  // operation. The correlation id and the reply token are the address, so
  // they are NOT blanked here; only the message and the confirmation are.
  // `source` records that this was the LEGACY run: it arms no observer, so
  // only the read-back may follow it.
  rememberOperation({
    correlationId: correlationId.trim(),
    token: token.trim(),
    tabId,
    source: 'run'
  });
  clearSendFields();
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
        approved_scope_ref: scopeRef,
        user_gesture: true
      }
    },
    LIVE_RUN_TIMEOUT_MS
  );

  probeInFlight = false;
  probePhase = 'settled';

  if (replyOk(reply)) {
    // The reply token is never echoed. It is in panel state so a later poll
    // can address this operation, and nowhere else.
    const shown = describeReply(reply, [
      ['Correlation id', 'correlation_id'],
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

/* ---- Step 3b: the split engine's send ---- */

/**
 * A reply from the split engine, rendered for a person.
 *
 * The split engine's answers are often "not settled yet" states rather than
 * plain failures, so the worker's own stable code is carried next to the
 * reason: `submit_pending` and `observation_pending` mean the operation is
 * still going, and a code the operator can quote is worth more than a
 * paraphrase. A field nobody sent stays UNKNOWN, and the reply token is never
 * among the fields.
 */
function describeSplitReply(reply, fields) {
  const shown = describeReply(reply, fields);
  if (replyOk(reply)) return shown;
  const code = safePingLine(pick(reply, 'code'), 64);
  if (code === '') return shown;
  return { text: shown.text + '\nCode: ' + code, state: shown.state };
}

/**
 * Submit one turn through the split engine.
 *
 * The same gates the run path uses — an explicit gesture and the operator's
 * own approval reference — plus the stable identity the split engine
 * requires: it keys the operation on a task and an operation key and refuses
 * a correlation marker alone. The operator's correlation id names both, so
 * the operation the worker reserves is exactly the one a later poll selects.
 *
 * One click, one submission. There is no loop and no automatic retry: this
 * uses the same lock as the run path, so a second send is impossible until
 * the operator reconciles.
 */
async function submitTurn() {
  const tabId = selectedTabId();
  const text = (el('probe-text') && el('probe-text').value) || '';
  const correlationId = ((el('probe-correlation') && el('probe-correlation').value) || '').trim();
  const token = ((el('probe-token') && el('probe-token').value) || '').trim();
  const confirmNode = el('probe-confirm');
  const confirmed = !!confirmNode && confirmNode.checked === true;
  const scopeRef = scopeRefValue();

  const problems = validateProbeInput({ text, correlationId, token, tabId, confirmed, scopeRef });
  if (problems.length > 0 || probePhase !== 'idle' || probeInFlight) {
    const reason = probePhase === 'idle' ? problems[0] : 'A turn is already dispatched or unsettled.';
    setResult('result-submit', 'NOT SENT — ' + (reason || 'action already in flight.'), 'warn');
    updateOperatorGate();
    return;
  }

  probePhase = 'dispatched';
  probeInFlight = true;
  // Remembered BEFORE the request goes out, so a panel timeout can still be
  // followed by a read-only poll that names THIS operation. The split engine
  // arms the page observer, so this operation may be polled and reconciled.
  rememberOperation({ correlationId, token, tabId, source: 'submit' });
  clearSendFields();
  setHold('Submitted to tab ' + tabId + '. Outcome unknown until the worker reports.', 'unknown');
  setResult('result-submit', 'Submitted. Waiting for the worker...', 'known');
  updateOperatorGate();

  const reply = await sendOperatorMessage(
    {
      type: 'aion/chatgpt-submit',
      tabId,
      command: {
        text: text.trim(),
        correlation_id: correlationId,
        expected_reply_token: token,
        approved_scope_ref: scopeRef,
        user_gesture: true,
        // The split engine keys the operation on a stable identity and refuses
        // a correlation marker alone. The operator's correlation id names it.
        task_id: correlationId,
        operation_key: correlationId
      }
    },
    SUBMIT_TIMEOUT_MS
  );

  probeInFlight = false;
  probePhase = 'settled';

  const shown = describeSplitReply(reply, [
    ['Correlation id', 'correlation_id'],
    ['Observer', 'observer'],
    ['Detail', 'detail']
  ]);

  if (replyOk(reply)) {
    setHold('Submitted and reported. Still not independently verified.', 'settled');
    setResult('result-submit', 'SUBMITTED — not independently verified.\n' + shown.text, 'captured');
    updateOperatorGate();
    return;
  }

  // Past this point the request could have reached the page, so the panel must
  // not claim NOT SENT. A definite `submitted: false` from the worker is the
  // only evidence-backed NOT SENT: it refused before anything was sent.
  const submittedByWorker = pick(reply, 'submitted');
  // `shown` already carries the worker's own reason, the worker's code and the
  // right UNCERTAIN/FAILED word, so it is used as it is rather than re-worded.
  const uncertain = shown.state === 'warn';

  if (submittedByWorker === false) {
    setHold('Worker refused the submission before anything was sent. Locked until reconciled.', 'settled');
    setResult('result-submit', 'NOT SENT — the worker refused this before dispatch.\n' + shown.text, 'warn');
  } else {
    setHold(
      uncertain
        ? 'Submitted, no definite outcome. May still be running. Locked until reconciled.'
        : 'Submitted and refused. Locked until reconciled.',
      'settled'
    );
    setResult(
      'result-submit',
      shown.text + '\nA submission was dispatched. Whether a message was sent is not known here.',
      shown.state
    );
  }

  updateOperatorGate();
}

/* ---- Step 4: the split engine's read-only side ---- */

/** Bounded reply text: control characters out, line breaks kept, length capped. */
function safeReplyText(value, max = 4000) {
  if (typeof value !== 'string') return '';
  const cleaned = value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u001F\u007F]/g, (ch) => (ch === '\n' ? '\n' : ' '))
    .trim();
  return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
}

/**
 * Poll the armed observer once.
 *
 * One click is one poll. There is no loop, no timer and no automatic
 * resend: the operator decides when to ask again. The poll names the
 * operation this panel dispatched and carries nothing that could send — no
 * text, no gesture, no approval, and no timeout the page could act on. The
 * page's own observation deadline was set when the task was armed, and a
 * poll cannot move it.
 */
async function observeOnce() {
  const operation = addressedOperation;
  if (!operation) {
    setResult('result-observe', 'NOT OBSERVED — there is no operation to address. Send a turn first.', 'warn');
    return;
  }
  if (!observerAvailable()) {
    // The legacy run path arms no observer, so a poll could only ever answer
    // `observer_identity_required`. The panel says so instead of pretending
    // there is something to poll.
    setResult(
      'result-observe',
      'NOT OBSERVED — this turn has no armed observer. Only a submitted turn has one.',
      'warn'
    );
    return;
  }
  if (observeInFlight) {
    setResult('result-observe', 'A poll is already in flight. Wait for its answer.', 'warn');
    return;
  }
  observeInFlight = true;
  setResult('result-observe', 'Polling the observer once...', 'known');
  // The gate is recomputed HERE, so the control is visibly closed while this
  // one poll is in flight.
  updateOperatorGate();

  const reply = await sendOperatorMessage(
    {
      type: 'aion/chatgpt-observe',
      tabId: operation.tabId,
      command: {
        correlation_id: operation.correlationId,
        expected_reply_token: operation.token
      }
    },
    OBSERVE_TIMEOUT_MS
  );

  observeInFlight = false;
  const shown = describeSplitReply(reply, [
    ['Correlation id', 'correlation_id'],
    ['Observer', 'observer'],
    ['Reason', 'reason']
  ]);
  setResult('result-observe', 'Read-only poll of one operation. Nothing was sent.\n' + shown.text, shown.state);
  updateOperatorGate();
}

/**
 * Read the final reply back for the operation this panel dispatched.
 *
 * Read-only, like the poll: it composes nothing, clicks nothing and needs
 * no gesture. It names the operation by its correlation id, which the panel
 * kept from the moment of dispatch, so it still works after this panel's own
 * deadline has expired.
 *
 * It carries NO TEXT. The prompt is not re-transmitted with the read: the
 * read-back is a question about the operation, and a control that is read-only
 * must not carry anything that could be composed into a session.
 */
async function readFinalReply() {
  const operation = addressedOperation;
  if (!operation) {
    setResult('result-read', 'NOT READ — there is no operation to address. Send a turn first.', 'warn');
    return;
  }
  if (readInFlight) {
    setResult('result-read', 'A read is already in flight. Wait for its answer.', 'warn');
    return;
  }
  readInFlight = true;
  setResult('result-read', 'Reading the final reply...', 'known');
  // The gate is recomputed HERE, so the control is visibly closed while this
  // one read is in flight.
  updateOperatorGate();

  const reply = await sendOperatorMessage(
    {
      type: 'aion/chatgpt-read',
      tabId: operation.tabId,
      command: {
        correlation_id: operation.correlationId,
        expected_reply_token: operation.token
      }
    },
    READ_TIMEOUT_MS
  );

  readInFlight = false;

  if (!replyOk(reply)) {
    const shown = describeSplitReply(reply, [
      ['Correlation id', 'correlation_id'],
      ['Reason', 'reason']
    ]);
    setResult('result-read', 'Read-only read-back. Nothing was sent.\n' + shown.text, shown.state);
    updateOperatorGate();
    return;
  }

  const verdict = pick(reply, 'verdict');
  const verdictRecord = verdict && typeof verdict === 'object' && !Array.isArray(verdict) ? verdict : null;
  const lines = ['Read-only read-back. Nothing was sent.'];
  const correlation = pick(reply, 'correlation_id');
  lines.push('Correlation id: ' + (typeof correlation === 'string' && correlation !== '' ? correlation : UNKNOWN));
  const verdictReason = verdictRecord && typeof verdictRecord.reason === 'string' ? verdictRecord.reason : '';
  if (verdictReason !== '') lines.push('Verdict reason: ' + safePingLine(verdictReason, 200));
  const replyText = verdictRecord ? safeReplyText(verdictRecord.reply) : '';
  if (replyText !== '') lines.push('Reply:\n' + replyText);
  else lines.push('Reply: ' + UNKNOWN);
  setResult('result-read', lines.join('\n'), 'ok');
  updateOperatorGate();
}

/**
 * Render the worker's reconciliation report.
 *
 * The report is DATA, never an instruction, and it is shown whatever the
 * verdict is: the durable facts it carries — the phase, the lock, whether the
 * operation settled — are what the operation actually holds, and they are the
 * answer the operator asked for. A refusal keeps the worker's own reason and
 * code, so "the lock is still held" and "the page could not be reached" stay
 * distinguishable instead of collapsing into one vague failure.
 */
function describeReconcileReply(reply) {
  const fields = [
    ['Phase', 'phase'],
    ['Lock active', 'lock_active'],
    ['Settlement', 'settled'],
    ['Reason', 'reason']
  ];
  if (replyOk(reply)) {
    return describeReply(reply, fields);
  }
  const reason =
    safePingLine(pick(reply, 'error'), 200) ||
    safePingLine(pick(reply, 'reason'), 200) ||
    'No reason reported by the worker.';
  const uncertain = pick(reply, 'uncertain') === true;
  const lines = [(uncertain ? 'UNCERTAIN — ' : 'FAILED — ') + reason];
  const code = safePingLine(pick(reply, 'code'), 64);
  if (code !== '') lines.push('Code: ' + code);
  for (const [label, key] of fields) {
    if (key === 'reason') continue;
    const value = pick(reply, key);
    lines.push(
      label + ': ' + (value === undefined || value === null || value === '' ? UNKNOWN : String(value))
    );
  }
  return { text: lines.join('\n'), state: uncertain ? 'warn' : 'error' };
}

/**
 * Reconcile ONE addressed operation, read-only.
 *
 * The worker's reconciliation path is the answer to an operation that cannot
 * settle on its own: a terminal refusal, a lost observer, a submission that
 * never settled. It names the operation by the correlation id the panel kept
 * from the moment of dispatch, and it reports what the durable record holds.
 *
 * ONE CLICK IS ONE COMMAND. There is no loop, no timer, no auto-poll and no
 * resend. The control carries NO text, NO gesture and NO approval, because
 * nothing is composed and nothing is sent: it has no send authority at all, so
 * there is nothing for an approval to authorise.
 *
 * It also changes NOTHING here. It does not clear the address, does not settle
 * the panel's own lock and does not re-arm the run or submit buttons. Dropping
 * the address is the explicit new-run reset's job; this one only reports.
 */
async function reconcileOperation() {
  const operation = addressedOperation;
  if (!operation) {
    setResult(
      'result-reconcile',
      'NOT RECONCILED — there is no operation to address. Send a turn first.',
      'warn'
    );
    return;
  }
  if (reconcileInFlight) {
    setResult('result-reconcile', 'A reconciliation is already in flight. Wait for its answer.', 'warn');
    return;
  }
  reconcileInFlight = true;
  setResult('result-reconcile', 'Reconciling one operation...', 'known');
  // The gate is recomputed HERE, so the door is visibly closed while this one
  // command is in flight: one click is one command, and the second click
  // finds it closed.
  updateOperatorGate();

  const reply = await sendOperatorMessage(
    {
      type: 'aion/chatgpt-reconcile',
      tabId: operation.tabId,
      command: {
        correlation_id: operation.correlationId,
        expected_reply_token: operation.token
      }
    },
    RECONCILE_TIMEOUT_MS
  );

  reconcileInFlight = false;
  const shown = describeReconcileReply(reply);
  setResult(
    'result-reconcile',
    'Read-only reconciliation. Nothing was sent and nothing was changed here.\n' + shown.text,
    shown.state
  );
  updateOperatorGate();
}

/**
 * Clear the message and the confirmation, and nothing else.
 *
 * Used the moment a request is dispatched. The correlation id and the reply
 * token are deliberately left in place: they are the address of the operation
 * that was just dispatched, and a read-only poll needs them long after this
 * panel's own deadline has expired.
 */
function clearSendFields() {
  const text = el('probe-text');
  const confirmNode = el('probe-confirm');
  if (text) {
    text.value = '';
    text.removeAttribute('aria-invalid');
  }
  if (confirmNode) confirmNode.checked = false;
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

/** The approval reference the operator typed, trimmed, or '' when there is none. */
function scopeRefValue() {
  const node = el('probe-scope-ref');
  const raw = (node && node.value) || '';
  return typeof raw === 'string' ? raw.trim() : '';
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
 * and cannot strand a probe. The run and submit buttons additionally require
 * the probe to be in the idle phase, and the reconcile button requires it to
 * be held and no longer in flight — an in-flight request cannot yet be
 * declared over.
 *
 * The three read-only controls have their own rule, and it is deliberately a
 * different one: they need an operation to address, and nothing else. They
 * are NOT gated on the send lock, because a timed-out send is exactly when
 * the operator most needs to ask about the operation, and they never change
 * the send state themselves. The poll has one extra requirement of its own —
 * a durable observer — because only a submitted turn has one.
 */
function updateOperatorGate() {
  const select = el('tab-select');
  const pingButton = el('btn-chatgpt-ping');
  const runButton = el('btn-chatgpt-run');
  const submitButton = el('btn-chatgpt-submit');
  const observeButton = el('btn-chatgpt-observe');
  const readButton = el('btn-chatgpt-read');
  const reconcileButton = el('btn-chatgpt-reconcile');
  const probeReconcileButton = el('btn-probe-reconcile');
  const confirmNode = el('probe-confirm');
  const text = (el('probe-text') && el('probe-text').value) || '';
  const correlationId = (el('probe-correlation') && el('probe-correlation').value) || '';
  const token = (el('probe-token') && el('probe-token').value) || '';
  const scopeRef = scopeRefValue();

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
    confirmed: !!confirmNode && confirmNode.checked === true,
    scopeRef
  });

  const textNode = el('probe-text');
  const correlationNode = el('probe-correlation');
  const tokenNode = el('probe-token');
  const scopeNode = el('probe-scope-ref');
  if (textNode) markInvalid(textNode, text.trim() === '' || text.length > MAX_PROMPT_LENGTH);
  if (correlationNode) markInvalid(correlationNode, !IDENTIFIER_PATTERN.test(correlationId.trim()));
  if (tokenNode) markInvalid(tokenNode, !IDENTIFIER_PATTERN.test(token.trim()));
  if (scopeNode) markInvalid(scopeNode, scopeRefProblem(scopeRef) !== null);

  const locked = probePhase !== 'idle';
  if (runButton) {
    const armed = problems.length === 0 && !locked && !probeInFlight;
    runButton.disabled = !armed;
    runButton.setAttribute('aria-disabled', String(!armed));
  }
  if (submitButton) {
    // The same lock as the run button: one send at a time, whichever path
    // sends it.
    const armed = problems.length === 0 && !locked && !probeInFlight;
    submitButton.disabled = !armed;
    submitButton.setAttribute('aria-disabled', String(!armed));
  }
  if (observeButton) {
    // An observer exists ONLY for a submitted turn: the split engine arms it
    // and records its identity. A legacy run arms none, so the poll is not
    // offered — a control whose only possible answer is a refusal is not a
    // control an operator should be given.
    const addressable = observerAvailable() && !probeInFlight && !observeInFlight;
    observeButton.disabled = !addressable;
    observeButton.setAttribute('aria-disabled', String(!addressable));
  }
  if (readButton) {
    // The read-back may scan the page for a reply, so it needs no durable
    // observer: it is available for any addressed operation.
    const addressable = addressedOperation !== null && !probeInFlight && !readInFlight;
    readButton.disabled = !addressable;
    readButton.setAttribute('aria-disabled', String(!addressable));
  }
  if (reconcileButton) {
    // The read-only reconciliation door. It needs an operation to name and no
    // second reconciliation in flight; it is never closed by the send lock,
    // because it does not send and it does not touch the send state.
    const reconcilable = addressedOperation !== null && !reconcileInFlight;
    reconcileButton.disabled = !reconcilable;
    reconcileButton.setAttribute('aria-disabled', String(!reconcilable));
  }
  if (probeReconcileButton) {
    // Reconciling means "the previous probe is no longer running". While the
    // request is still in flight that is not yet true, so reconcile stays
    // closed and only a settled outcome re-opens it.
    const reconcilable = locked && !probeInFlight;
    probeReconcileButton.disabled = !reconcilable;
    probeReconcileButton.setAttribute('aria-disabled', String(!reconcilable));
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
  bind('btn-chatgpt-submit', () => {
    submitTurn();
  });
  bind('btn-chatgpt-observe', () => {
    observeOnce();
  });
  bind('btn-chatgpt-read', () => {
    readFinalReply();
  });
  bind('btn-chatgpt-reconcile', () => {
    reconcileOperation();
  });
  bind('btn-probe-reconcile', () => {
    reconcileProbe();
  });

  const select = el('tab-select');
  if (select) select.addEventListener('change', updateOperatorGate);

  for (const id of ['probe-text', 'probe-correlation', 'probe-token', 'probe-scope-ref']) {
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
