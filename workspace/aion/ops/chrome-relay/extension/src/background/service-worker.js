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

import { createEventStore, createTransport, isExpired } from '../lib/index.js';

const STORAGE_KEY = 'aion.relay.state.v1';
const SCHEMA = 'aion.relay.worker-state/0.1';

// Presence refresh cadence. Two minutes is well inside Chrome's alarm floor of
// 30 seconds for unpacked MV3 workers and keeps polling cheap.
const PRESENCE_ALARM = 'aion.presence.refresh';
const PRESENCE_PERIOD_MINUTES = 2;
const MAX_EVENTS = 500;

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
function defaultState() {
  return {
    schema: SCHEMA,
    worker_started_at: null,
    worker_boot_count: 0,
    last_refresh_at: null,
    last_evidence_at: null,
    fallback_mode: 'E',
    fallback_reason: 'Service worker not yet evaluated in this browser session.',
    transport_name: 'fixture',
    transport_enabled: false,
    transport_detail: 'Fixture transport only. Native adapter disabled in MVP.',
    approval_required_count: 0,
    approval_note: 'No approval-gated item observed.',
    outbox_count: 0,
    outbox_oldest_created_at: null,
    event_cursor: 0,
    degraded_reason: null
  };
}

/**
 * Adapter handed to createEventStore({ persist }). The library's exact call
 * signature is owned by the parallel lib lane, so this adapter accepts the
 * trailing argument as the snapshot to keep. If that contract changes, the
 * adapter still persists something coherent rather than silently dropping it.
 */
function makePersistAdapter() {
  return function persistSnapshot(...args) {
    const snapshot = args.length > 0 ? args[args.length - 1] : null;
    if (snapshot === null || snapshot === undefined) return Promise.resolve(false);
    return writeStorage({ [STORAGE_KEY + '.events']: snapshot });
  };
}

let cachedState = null;
let cachedStore = null;
let cachedTransport = null;

async function rehydrate() {
  const stored = await readStorage();
  const state = Object.assign(defaultState(), stored && stored.state ? stored.state : {});

  if (state.worker_started_at) {
    state.worker_boot_count = (Number(state.worker_boot_count) || 0) + 1;
  }
  state.worker_started_at = new Date().toISOString();

  cachedState = state;
  cachedStore = createEventStore({ persist: makePersistAdapter() });
  // MVP: fixture transport, no real sockets. Transport selection is not a
  // runtime decision in this build; the disabled adapters exist so the panel
  // can report that they are disabled rather than absent.
  cachedTransport = createTransport('fixture', {});
  return state;
}

async function ensureReady() {
  if (cachedState && cachedStore && cachedTransport) return cachedState;
  return rehydrate();
}

async function persistState() {
  if (!cachedState) return false;
  const ok = await writeStorage({ [STORAGE_KEY]: cachedState });
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
  let events = [];
  try {
    const listed = store.list();
    events = Array.isArray(listed) ? listed.slice(-MAX_EVENTS) : [];
  } catch (error) {
    events = [];
  }

  const live = events.filter((event) => {
    try {
      return !isExpired(event);
    } catch (error) {
      return true;
    }
  });

  let approvalPending = 0;
  let newestEvidenceAt = state.last_evidence_at || null;

  for (const event of live) {
    if (event && event.task_state === 'APPROVAL_PENDING') approvalPending += 1;
    const at = event && (event.created_at || event.produced_at);
    if (at && (newestEvidenceAt === null || Date.parse(at) > Date.parse(newestEvidenceAt))) {
      if (event && typeof event.event_type === 'string' && event.event_type.startsWith('proof.')) {
        newestEvidenceAt = at;
      }
    }
  }

  let transportStatus = 'UNKNOWN';
  let transportDetail = 'Transport status not observed.';
  try {
    const reported = transport.status();
    if (reported && typeof reported === 'object') {
      transportStatus = reported.state || reported.status || 'UNKNOWN';
      transportDetail = reported.detail || 'No detail reported by transport.';
    }
  } catch (error) {
    transportStatus = 'UNKNOWN';
    transportDetail = 'Transport status call failed.';
  }

  let outbox = 0;
  let outboxOldest = null;
  try {
    const pending = store.list({ delivery_state: 'OUTBOX' });
    if (Array.isArray(pending)) {
      outbox = pending.length;
      for (const event of pending) {
        const at = event && event.created_at;
        if (at && (outboxOldest === null || Date.parse(at) < Date.parse(outboxOldest))) outboxOldest = at;
      }
    }
  } catch (error) {
    outbox = 0;
  }

  return {
    observed: true,
    observed_at: new Date().toISOString(),
    relay: {
      name: state.transport_name,
      enabled: state.transport_enabled === true,
      status: transportStatus,
      detail: transportDetail,
      boot_count: state.worker_boot_count,
      worker_started_at: state.worker_started_at,
      degraded_reason: state.degraded_reason
    },
    outbox: {
      count: outbox,
      oldest_created_at: outboxOldest,
      cursor: state.event_cursor
    },
    proof: {
      last_evidence_at: newestEvidenceAt,
      note:
        newestEvidenceAt === null
          ? 'No proof event observed. Transport delivery would not change this field.'
          : 'Newest proof event timestamp. Verification is a separate claim.'
    },
    approval: {
      pending: approvalPending,
      note:
        approvalPending === 0
          ? state.approval_note
          : 'Tasks held at APPROVAL_PENDING. They are not progressing.'
    },
    fallback: {
      mode: state.fallback_mode,
      reason: state.fallback_reason
    },
    role_tab_presence_note:
      'Tab presence is browser UI metadata. It is never evidence that an agent is running.',
    task_note:
      'A delivery ACK proves delivery only. Executor acceptance is a separate event.'
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