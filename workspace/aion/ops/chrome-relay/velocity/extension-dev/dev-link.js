// AION Track B dev build ONLY. Copied into the B dev extension by
// `aion setup browser`; never loaded by the Track A extension.
//
// Opens one native port to com.aion.relay.dev and answers allowlisted calls by
// invoking the worker's EXISTING runChatGPTCommand — the same bounded runner
// the in-worker Bus uses, with the same gesture/scope gates and durable
// no-resend task store. No DOM code, no retries, no queue.
export const DEV_HOST = 'com.aion.relay.dev';
export const DEV_CALLS = Object.freeze(['aion/chatgpt-tabs', 'aion/chatgpt-observe',
  'aion/chatgpt-submit', 'aion/chatgpt-dispose', 'aion.b.ping']);
const ALLOWED = new Set(DEV_CALLS);
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function createDevLink({ chrome, run, hostName = DEV_HOST, maxReconnects = 5, schedule = setTimeout } = {}) {
  if (!chrome?.runtime?.connectNative) throw new TypeError('chrome.runtime.connectNative required');
  if (typeof run !== 'function') throw new TypeError('run(message) required');
  let port = null;
  let state = 'IDLE';
  let failures = 0;
  const status = () => ({ state, failures, host: hostName });

  async function answer(msg) {
    const { id, call_type: type } = msg;
    const sendKind = type === 'aion/chatgpt-submit';
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
      if (state === 'RECONNECTING') schedule(connect, Math.min(30_000, 1000 * 2 ** (failures - 1)));
    });
    port.postMessage({ type: 'aion.b.hello' });
    return status();
  }
  return Object.freeze({ connect, status });
}
