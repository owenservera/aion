// AION Track B dev build ONLY. Copied into the B dev extension by
// `aion setup browser`; never loaded by the Track A extension.
//
// Opens one native port to com.aion.relay.dev and answers allowlisted calls by
// invoking the worker's EXISTING runChatGPTCommand — the same bounded runner
// the in-worker Bus uses, with the same gesture/scope gates and durable
// no-resend task store. No DOM code, no retries, no queue.
//
// THE RECEIVE PLANE (P3)
//   The four `conversation.*` call types are DATA-ONLY and READ-ONLY. They
//   are answered by the dedicated receive router and NEVER reach
//   runChatGPTCommand: receive text is not a command. Their answers carry a
//   fixed code and never carry exception text or page text.
export const DEV_HOST = 'com.aion.relay.dev';
export const DEV_CALLS = Object.freeze(['aion/chatgpt-tabs', 'aion/chatgpt-observe',
  'aion/chatgpt-submit', 'aion/chatgpt-dispose', 'aion.b.ping']);
/** The read-only receive call types. Handled apart from the command runner. */
export const DEV_RECEIVE_CALLS = Object.freeze(['conversation.subscribe', 'conversation.read',
  'conversation.replay', 'conversation.unsubscribe']);
/** The EXPLICIT account registration call. Never issued implicitly. */
export const DEV_ACCOUNT_CALL = 'account.register';
/** The push frame from the worker to the host. DATA ONLY. */
export const EVENT_FRAME_TYPE = 'aion.b.event';
const ALLOWED = new Set(DEV_CALLS);
const RECEIVE_ALLOWED = new Set(DEV_RECEIVE_CALLS);
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function createDevLink({ chrome, run, onCall, onDisconnect, helloPayload = null,
  hostName = DEV_HOST, maxReconnects = 5, schedule = setTimeout } = {}) {
  if (!chrome?.runtime?.connectNative) throw new TypeError('chrome.runtime.connectNative required');
  if (typeof run !== 'function') throw new TypeError('run(message) required');
  let port = null;
  let state = 'IDLE';
  let failures = 0;
  const status = () => ({ state, failures, host: hostName });

  async function answer(msg) {
    const { id, call_type: type } = msg;
    const sendKind = type === 'aion/chatgpt-submit';

    if (RECEIVE_ALLOWED.has(type) || type === DEV_ACCOUNT_CALL) {
      // The receive plane and the explicit registration NEVER reach the
      // command runner.
      let result;
      try {
        result = typeof onCall === 'function'
          ? await onCall(type, msg.payload ?? {})
          : { ok: false, read_only: true, code: 'receive_not_available' };
      } catch {
        // No exception text, no page text: a fixed code only.
        result = { ok: false, read_only: true, code: 'receive_error' };
      }
      if (!isPlain(result)) result = { ok: false, read_only: true, code: 'receive_error' };
      try { port?.postMessage({ type: 'aion.b.reply', id, result }); } catch { /* port gone */ }
      return;
    }

    let result;
    if (!ALLOWED.has(type) || (msg.payload !== undefined && !isPlain(msg.payload))) {
      result = { ok: false, code: 'call_not_allowed', submitted: false };
    } else if (type === 'aion.b.ping') {
      result = { ok: true, pong: true, extension_id: chrome.runtime.id ?? null };
    } else {
      try {
        result = await run({ ...(msg.payload ?? {}), type });
      } catch (error) {
        const base = { ok: false, code: 'worker_error', error: String(error?.message ?? error).slice(0, 200) };
        result = sendKind ? { ...base, submitted: true, uncertain: true } : { ...base, read_only: true, uncertain: true };
      }
      if (!isPlain(result)) result = sendKind ? { ok: false, code: 'bad_worker_result', submitted: true, uncertain: true }
        : { ok: false, code: 'bad_worker_result', read_only: true, uncertain: true };
    }
    try { port?.postMessage({ type: 'aion.b.reply', id, result }); } catch { /* port gone: host fails the call as uncertain */ }
  }

  function connect() {
    if (port) return status();
    state = 'PORT_OPEN';
    port = chrome.runtime.connectNative(hostName);
    port.onMessage.addListener((msg) => {
      if (!isPlain(msg)) return;
      if (msg.type === 'aion.b.ready') { state = msg.error ? 'HOST_ERROR' : 'VERIFIED'; if (!msg.error) failures = 0; return; }
      if (msg.type === 'aion.b.call' && typeof msg.id === 'string') void answer(msg);
    });
    port.onDisconnect.addListener(() => {
      void chrome.runtime.lastError; // read to clear; not echoed (may contain host paths)
      port = null;
      failures += 1;
      state = failures > maxReconnects ? 'UNAVAILABLE' : 'RECONNECTING';
      // The host is gone with the port: every receive subscription dies with
      // it, so no page text is retained across a broken link.
      if (typeof onDisconnect === 'function') { try { onDisconnect(); } catch { /* never break the link */ } }
      if (state === 'RECONNECTING') schedule(connect, Math.min(30_000, 1000 * 2 ** (failures - 1)));
    });
    port.postMessage({ type: 'aion.b.hello', ...(isPlain(helloPayload) ? helloPayload : {}) });
    return status();
  }

  /**
   * Push ONE data-only frame to the host. Used by the receive router for
   * conversation hints. It carries no grant, no action and no command.
   */
  function publishEvent(event) {
    if (!isPlain(event)) return false;
    if (!port) return false;
    try { port.postMessage({ type: EVENT_FRAME_TYPE, event }); return true; } catch { return false; }
  }

  return Object.freeze({ connect, status, publishEvent });
}
