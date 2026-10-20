// AION Track B dev service worker entry (built extension: src/dev/dev-worker.js).
// Loads the UNCHANGED worker (it registers its own listeners at import) and adds
// the dev native link. The open native port also keeps the MV3 worker alive.
//
// THE LANE AND THE REGISTRATION
//   This profile owns a LANE: a cryptographically random id that is persisted
//   in chrome.storage.local and never leaves this machine. Two Chrome profiles
//   of the SAME extension have DIFFERENT lanes, so the extension id alone
//   never proves which profile is talking.
//
//   The lane also holds the owner's REGISTERED account address. The
//   registration is written ONLY by an explicit `aion account register`:
//   nothing in the watch path, the reconnect path or the page registers
//   implicitly, and there is no account polling anywhere.
//
// THE RECEIVE PLANE (P3)
//   The four `conversation.*` calls are answered by the dedicated receive
//   router (./receive-router.js), which talks to the P2 page-side receive port
//   `aion-conversation-receive`. They NEVER reach runChatGPTCommand.
//
//   The router is imported dynamically so a dev extension that was built
//   before the router existed keeps its LEGACY path alive instead of failing
//   to load entirely. The receive plane reports itself unavailable until the
//   router is present.
import { __testing as worker } from '../background/service-worker.js';
import { createDevLink } from './dev-link.js';
import {
  validateConversationBinding,
  validateConversationSnapshot,
  validateConversationEvent,
  validateObservationCursor,
} from '../lib/conversation-contract.js';
import { canonicalizeEmail } from '../providers/chatgpt/account-registration.js';

const validators = {
  validateConversationBinding,
  validateConversationSnapshot,
  validateConversationEvent,
  validateObservationCursor,
};

/** The ONE storage key of the local account registration. */
export const REGISTRATION_STORAGE_KEY = 'aion.account.registration.v1';
/** The schema of the stored registration record. */
export const REGISTRATION_SCHEMA = 'aion.account-registration/1';

/**
 * The local registration store of THIS profile.
 *
 * It holds exactly the lane id, the registered address and the moment of the
 * registration. It is never written by the watch path, and the address is
 * never sent to the CLI: the CLI only learns THAT an account is registered.
 */
export function createLocalRegistrationStore({ chrome, storage = chrome?.storage?.local } = {}) {
  const read = async () => {
    if (!storage?.get) return null;
    let raw;
    try { raw = await storage.get(REGISTRATION_STORAGE_KEY); }
    catch { return null; }
    const record = raw?.[REGISTRATION_STORAGE_KEY];
    if (!record || typeof record !== 'object') return null;
    if (record.schema !== REGISTRATION_SCHEMA) return null;
    if (typeof record.lane_id !== 'string' || !record.lane_id) return null;
    return {
      schema: REGISTRATION_SCHEMA,
      lane_id: record.lane_id,
      email: typeof record.email === 'string' && record.email ? record.email : null,
      registered_utc: typeof record.registered_utc === 'string' ? record.registered_utc : null,
    };
  };
  const write = async (record) => {
    if (!storage?.set) return null;
    try { await storage.set({ [REGISTRATION_STORAGE_KEY]: record }); }
    catch { return null; }
    return record;
  };
  return {
    read,
    /** The lane, minted ONCE and then persisted for this profile. */
    async ensure() {
      const existing = await read();
      if (existing) return existing;
      const crypto = globalThis.crypto;
      let lane = null;
      if (crypto && typeof crypto.randomUUID === 'function') lane = crypto.randomUUID();
      else if (crypto && typeof crypto.getRandomValues === 'function') {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        lane = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      }
      if (!lane) return null;
      const record = {
        schema: REGISTRATION_SCHEMA,
        lane_id: lane.replace(/-/g, '_'),
        email: null,
        registered_utc: null,
      };
      return (await write(record)) ?? record;
    },
    /** Store the registered address of THIS lane. */
    async setEmail(email) {
      const canonical = canonicalizeEmail(email);
      if (!canonical) return null;
      const current = (await read()) ?? (await this.ensure());
      if (!current) return null;
      const record = {
        schema: REGISTRATION_SCHEMA,
        lane_id: current.lane_id,
        email: canonical,
        registered_utc: new Date().toISOString(),
      };
      return await write(record);
    },
  };
}

let router = null;
let link = null;

async function boot() {
  const store = createLocalRegistrationStore({ chrome });
  const registration = await store.ensure();
  const lane = registration?.lane_id ?? null;

  link = createDevLink({
    chrome,
    run: (message) => worker.runChatGPTCommand(message),
    onCall: (type, payload) => (router
      ? router.handleCall(type, payload)
      : { ok: false, read_only: true, code: 'receive_not_available' }),
    // The lane and the registered account travel on the LOCAL native link
    // only. The host pins the extension id and matches the lane; the CLI
    // never sees either.
    helloPayload: {
      lane_id: lane,
      registration: registration?.email
        ? { email: registration.email, registered_utc: registration.registered_utc }
        : null,
    },
    // A broken native link ends every receive subscription: no page text is
    // retained across a reconnect. The CLI has to subscribe and read again.
    onDisconnect: () => { try { router?.stopAll(); } catch { /* nothing retained */ } },
  });

  try {
    const module = await import('./receive-router.js');
    router = module.createReceiveRouter({
      chrome,
      publishEvent: (event) => link.publishEvent(event),
      validators,
      canonicalizeEmail,
      // The REGISTERED account of this lane, read from this profile's own
      // storage. There is no global placeholder and no account polling.
      getAccountKey: () => registration?.email ?? null,
      registrationStore: async (email) => {
        const stored = await store.setEmail(email);
        if (stored) registration.email = stored.email;
        return stored;
      },
    });
  } catch {
    router = null;
  }
  link.connect();
}

void boot();
chrome.runtime.onStartup?.addListener(() => link?.connect());
chrome.runtime.onInstalled?.addListener(() => link?.connect());
