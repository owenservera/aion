// AION Chrome Relay Station — MV3 service worker.
//
// MV3 discipline: this worker is event-driven and is terminated by Chrome
// whenever it is idle. Nothing here may assume an immortal JS global. Every
// entry point rehydrates from chrome.storage.local first, mutates, persists.
//
// MVP constraint (OPENCODE-BUILD-ORDER.md, first bounded deliverable):
// transports are fixture / disabled only. This worker MUST NOT open a native
// messaging port, a websocket, or any outbound connection in MVP. The native
// adapter is constructed in its disabled form and stays that way.
//
// It reads no web page content. There is no content script in this manifest.

import { createEventStore, createTransport, isExpired, TASK_STATES } from '../lib/index.js';

const STORAGE_KEY = 'aion.relay.state.v1';
const EVENTS_KEY = 'aion.relay.events.v1';
const SCHEMA = 'aion.relay.worker-state/0.1';

// Presence refresh cadence. Two minutes is well inside Chrome's alarm floor of
// 30 seconds for unpacked MV3 workers and keeps polling cheap.
const PRESENCE_ALARM = 'aion.presence.refresh';
const PRESENCE_PERIOD_MINUTES = 2;
const MAX_EVENTS = 500;

// State names are the literals named in ENVELOPE-CONTRACT.md. TASK_STATES is
// used only to CONFIRM they are real states. If the contract and the lib ever
// disagree, this worker reports UNKNOWN rather than counting a state that does
// not exist and showing a confident zero.
const APPROVAL_PENDING_STATE = 'APPROVAL_PENDING';
const OUTBOX_STATE = 'OUTBOX';

const STATE_NAMES_CONFIRMED =
  Array.isArray(TASK_STATES) &&
  TASK_STATES.includes(APPROVAL_PENDING_STATE) &&
  typeof OUTBOX_STATE === 'string';

/* ------------------------------------------------------------------ *
 * chrome.* availability
 * ------------------------------------------------------------------ */

const hasChrome = typeof chrome !== 'undefined' && chrome && chrome.runtime;
const hasStorage = hasChrome && !!chrome.storage && !!chrome.storage.local;
const hasAlarms = hasChrome && !!chrome.alarms;

/* ------------------------------------------------------------------ *
 * Storage adapter
 * ------------------------------------------------------------------ */

function readStorage() {
  if (!hasStorage) return Promise.resolve(null);
  try {
    return chrome.storage.local.get(STORAGE_KEY).then(
      (bag) => (bag && bag[STORAGE_KEY]) || null,
      () => null
    );
  } catch (error) {
    return Promise.resolve(null);
  }
}

/**
 * Write one value under STORAGE_KEY.
 *
 * Takes the value itself, not a pre-keyed object. Wrapping here and again at
 * the call site produced a doubly-nested record that readStorage could never
 * unwrap, which silently reset the boot counter on every restart.
 */
function writeStorage(value) {
  if (!hasStorage) return Promise.resolve(false);
  return chrome.storage.local.set({ [STORAGE_KEY]: value }).then(
    () => true,
    () => false
  );
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

// Defaults describe a station that has observed nothing. "never observed" is a
// distinct value from every live state; the panel renders it as UNKNOWN.
// fallback_mode is null, not "E": nothing has been determined yet, and claiming
// SAFE_MANUAL would be a claim this worker cannot support.
function defaultState() {
  return {
    schema: SCHEMA,
    worker_started_at: null,
    worker_boot_count: 0,
    last_refresh_at: null,
    fallback_mode: null,
    fallback_reason: 'No fallback mode has been determined. Nothing observed yet.',
    degraded_reason: null
  };
}

/**
 * Storage adapter for createEventStore({ persist }).
 *
 * The store requires an object with load()/save(events). save() receives the
 * full ordered event array. The event log lives under its own storage key so a
 * corrupt or oversized log cannot take the small status record with it.
 */
function makePersistAdapter() {
  return {
    async load() {
      if (!hasStorage) return [];
      try {
        const bag = await chrome.storage.local.get(EVENTS_KEY);
        const log = bag && bag[EVENTS_KEY];
        return Array.isArray(log) ? log : [];
      } catch (error) {
        // An unreadable log is not an empty log. Say so instead of silently
        // starting from zero and overwriting real outbox entries.
        return Promise.reject(new Error('event log could not be read: ' + String(error)));
      }
    },
    async save(events) {
      if (!hasStorage) return;
      await chrome.storage.local.set({ [EVENTS_KEY]: events });
    }
  };
}

let cachedState = null;
let cachedStore = null;
let cachedTransport = null;

async function rehydrate() {
  const stored = await readStorage();
  // readStorage() already unwrapped the storage key, so `stored` IS the state
  // record. Reading it as a nested object would silently discard everything
  // that was persisted.
  const state = Object.assign(defaultState(), stored && typeof stored === 'object' ? stored : {});

  if (state.worker_started_at) {
    state.worker_boot_count = (Number(state.worker_boot_count) || 0) + 1;
  }
  state.worker_started_at = new Date().toISOString();

  cachedState = state;

  // Persist immediately. Without this the boot counter never increments across
  // a suspension, because nothing else writes before the first event fires.
  await writeStorage(state);

  cachedStore = createEventStore({ persist: makePersistAdapter() });

  // MVP: the native adapter is constructed DISABLED. It performs no host
  // access, has no code path that could grow into one, and refuses send().
  // The panel therefore reports the real adapter as disabled rather than
  // borrowing a fixture's readiness as if it were a live relay.
  cachedTransport = createTransport('disabled-native', {});

  // Reading before ready() settles would look like an empty outbox.
  try {
    await cachedStore.ready();
  } catch (error) {
    state.degraded_reason = 'Event log failed to load; outbox contents are UNKNOWN.';
    cachedStore = null;
  }
  return state;
}

async function ensureReady() {
  if (cachedState && cachedTransport) return cachedState;
  return rehydrate();
}

async function persistState() {
  if (!cachedState) return false;
  const ok = await writeStorage(cachedState);
  if (!ok) {
    // Losing state is worse than being loud about it.
    cachedState.degraded_reason = 'chrome.storage.local write rejected; state not durable.';
  }
  return ok;
}

/* ------------------------------------------------------------------ *
 * Derived truth
 * ------------------------------------------------------------------ */

function deriveStatus(state, store, transport) {
  // A store that failed to hydrate must never be reported as an empty outbox.
  if (!store) {
    return {
      observed: true,
      observed_at: new Date().toISOString(),
      degraded: true,
      relay: {
        name: transport ? transport.name : 'unknown',
        enabled: false,
        status: 'UNKNOWN',
        detail: 'Event store unavailable; outbox, proof and approval are UNKNOWN.',
        boot_count: state.worker_boot_count,
        worker_started_at: state.worker_started_at,
        degraded_reason: state.degraded_reason
      },
      outbox: { count: null, oldest_created_at: null, cursor: null },
      proof: { last_evidence_at: null, note: 'Event store unavailable. No proof claim is made.' },
      approval: { pending: null, note: 'Approval state not observed; event store unavailable.' },
      fallback: { mode: state.fallback_mode, reason: state.degraded_reason || 'Event store unavailable.' },
      role_tab_presence_note:
        'Tab presence is browser UI metadata. It is never evidence that an agent is running.',
      task_note: 'A delivery ACK proves delivery only. Executor acceptance is a separate event.'
    };
  }

  let events = [];
  try {
    events = store.list().slice(-MAX_EVENTS);
  } catch (error) {
    events = [];
  }

  const now = Date.now();
  const live = events.filter((event) => {
    try {
      return !isExpired(event, now);
    } catch (error) {
      return true;
    }
  });

  let approvalPending = 0;
  let newestEvidenceAt = null;
  let queued = 0;
  let oldestQueuedAt = null;

  for (const event of live) {
    if (!event || typeof event !== 'object') continue;

    if (event.task_state === APPROVAL_PENDING_STATE) approvalPending += 1;

    if (event.delivery_state === OUTBOX_STATE) {
      queued += 1;
      const at = event.created_at;
      if (at && (oldestQueuedAt === null || Date.parse(at) < Date.parse(oldestQueuedAt))) {
        oldestQueuedAt = at;
      }
    }

    if (typeof event.event_type === 'string' && event.event_type.startsWith('proof.')) {
      const at = event.created_at;
      if (at && (newestEvidenceAt === null || Date.parse(at) > Date.parse(newestEvidenceAt))) {
        newestEvidenceAt = at;
      }
    }
  }

  // transport.status() returns a plain string, e.g. TRANSPORT_STATUS.DISABLED.
  let transportStatus = 'UNKNOWN';
  try {
    const reported = transport.status();
    transportStatus = typeof reported === 'string' && reported !== '' ? reported : 'UNKNOWN';
  } catch (error) {
    transportStatus = 'UNKNOWN';
  }

  let cursor = null;
  try {
    const value = store.cursor();
    if (Number.isFinite(value)) cursor = value;
  } catch (error) {
    cursor = null;
  }

  return {
    observed: true,
    observed_at: new Date().toISOString(),
    degraded: false,
    relay: {
      name: transport.name,
      enabled: transport.enabled === true,
      status: transportStatus,
      detail: transport.enabled
        ? 'Transport reports enabled. Readiness is not execution.'
        : 'Adapter is disabled in this build. No host was contacted.',
      boot_count: state.worker_boot_count,
      worker_started_at: state.worker_started_at,
      degraded_reason: state.degraded_reason
    },
    outbox: { count: queued, oldest_created_at: oldestQueuedAt, cursor },
    proof: {
      last_evidence_at: newestEvidenceAt,
      note:
        newestEvidenceAt === null
          ? 'No proof event observed. Transport delivery would not change this field.'
          : 'Newest proof event timestamp. Verification is a separate claim.'
    },
    approval: {
      pending: STATE_NAMES_CONFIRMED ? approvalPending : null,
      note: STATE_NAMES_CONFIRMED
        ? approvalPending === 0
          ? 'No task is currently held at APPROVAL_PENDING.'
          : 'Tasks held at APPROVAL_PENDING. They are not progressing.'
        : 'Task state vocabulary unconfirmed against the lib. Approval state is UNKNOWN.'
    },
    fallback: { mode: state.fallback_mode, reason: state.fallback_reason },
    role_tab_presence_note:
      'Tab presence is browser UI metadata. It is never evidence that an agent is running.',
    task_note: 'A delivery ACK proves delivery only. Executor acceptance is a separate event.'
  };
}

async function handleStatus() {
  await ensureReady();
  return deriveStatus(cachedState, cachedStore, cachedTransport);
}

/* ------------------------------------------------------------------ *
 * Events
 * ------------------------------------------------------------------ */

chrome.action.onClicked.addListener(async (tab) => {
  await ensureReady();
  if (tab && Number.isInteger(tab.windowId)) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (error) {
      // Side panel open can be refused by policy; say so instead of failing silently.
      cachedState.degraded_reason = 'Side panel open refused for this window.';
      await persistState();
    }
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await ensureReady();
  await refreshPresence('install');
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureReady();
  await refreshPresence('browser-start');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;
  const type = message.type;

  if (type === 'aion/status') {
    handleStatus().then(sendResponse, (error) =>
      sendResponse({ observed: false, error: String(error && error.message ? error.message : error) })
    );
    return true;
  }

  if (type === 'aion/refresh') {
    ensureReady()
      .then(() => refreshPresence(message.reason || 'manual'))
      .then(() => deriveStatus(cachedState, cachedStore, cachedTransport))
      .then(sendResponse, (error) =>
        sendResponse({ observed: false, error: String(error && error.message ? error.message : error) })
      );
    return true;
  }

  return false;
});

async function refreshPresence(reason) {
  await ensureReady();
  cachedState.last_refresh_at = new Date().toISOString();
  cachedState.worker_boot_count = Number(cachedState.worker_boot_count) || 0;
  await persistState();
  return { refreshed_at: cachedState.last_refresh_at, reason };
}

function schedulePresence() {
  if (!hasAlarms) return;
  try {
    chrome.alarms.create(PRESENCE_ALARM, { periodInMinutes: PRESENCE_PERIOD_MINUTES });
  } catch (error) {
    // An alarm we cannot create is an unknown refresh cadence, not a zero one.
    cachedState = cachedState || defaultState();
    cachedState.degraded_reason = 'Presence alarm could not be created; refresh cadence unknown.';
  }
}

if (hasAlarms && chrome.alarms.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (!alarm || alarm.name !== PRESENCE_ALARM) return;
    refreshPresence('alarm').catch(() => {});
  });
}

schedulePresence();