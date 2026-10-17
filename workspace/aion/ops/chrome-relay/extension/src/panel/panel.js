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