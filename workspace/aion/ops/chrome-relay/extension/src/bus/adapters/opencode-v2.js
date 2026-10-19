// AION Bus V2 — OpenCode 2.0 shared-service adapter (OPTIONAL companion to ACP).
//
// SOURCES (Context7 /websites/opencode_ai_v2, queried 2026-10-19):
//   POST /api/session                       { location:{directory}, title }   -> { data: Session.Info }
//   POST /api/session/{id}/prompt           { text }   "durably admit one session input"; 409 ConflictError
//   POST /api/session/{id}/interrupt?resume=false
//   GET  /api/session/{id}/message          projected messages, cursor paging
//   GET  /api/event                         text/event-stream, VOLATILE: no replay, slow consumers dropped
//   GET  /api/info                          identity / readiness
// UNVERIFIED (no live V2 host was available): the exact Session.Info id field
// name, the projected-message item schema, and the native event names other
// than `session.idle` (documented for plugins). Those are read TOLERANTLY in
// extractSession/extractAssistant/eventSession below and are the first things
// to confirm on a real host (README §V2 conformance).
//
// DESIGN
//   - ACP stays the compatibility path; this adapter is used only when the
//     owner binds an executor to it.
//   - One fresh session per command, at the GRANT's directory (never a path
//     from command text). A missing grant cwd is a refusal.
//   - Loopback only. Remote pairing needs a separate owner decision.
//   - The session id is returned as `session_ref` and persisted on the command,
//     so a restarted runner reconciles from the SERVER (messages + completion
//     markers), never from the event stream, which may have gaps.

import { ADAPTER_MANIFEST_SCHEMA, AGENT_KIND, REASON, refuse } from '../contracts.js';

export const OPENCODE_V2_ADAPTER = 'opencode-v2';
const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d{1,5})?$/;

export class HttpError extends Error {
  constructor(status, body) { super(`http_${status}`); this.status = status; this.body = body; }
}

export function createOpenCodeHttpClient({ baseUrl, headers = {}, fetch: fetchFn = globalThis.fetch, timeoutMs = 15000 } = {}) {
  const base = String(baseUrl ?? '').replace(/\/+$/, '');
  if (!LOOPBACK.test(base)) refuse(REASON.BAD_VALUE, 'OpenCode V2 base URL must be loopback http (127.0.0.1/localhost/[::1]); remote pairing is not authorised');
  if (typeof fetchFn !== 'function') refuse(REASON.NO_ADAPTER, 'fetch is unavailable');
  async function call(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchFn(`${base}${path}`, { method, signal: controller.signal,
        headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body) });
      const text = await res.text();
      let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      if (!res.ok) throw new HttpError(res.status, json);
      return json;
    } finally { clearTimeout(timer); }
  }
  const sid = (id) => encodeURIComponent(String(id));
  return {
    info: () => call('GET', '/api/info'),
    createSession: ({ directory, title }) => call('POST', '/api/session', { location: { directory }, title }),
    prompt: ({ sessionID, text }) => call('POST', `/api/session/${sid(sessionID)}/prompt`, { text }),
    interrupt: ({ sessionID }) => call('POST', `/api/session/${sid(sessionID)}/interrupt?resume=false`, {}),
    messages: ({ sessionID }) => call('GET', `/api/session/${sid(sessionID)}/message`),
    /** Async iterator over SSE frames { id, event, data }. Ends on disconnect; never reconnects by itself. */
    async *events({ signal } = {}) {
      const res = await fetchFn(`${base}/api/event`, { headers: { accept: 'text/event-stream', ...headers }, signal });
      if (!res.ok || !res.body) throw new HttpError(res.status ?? 0, null);
      const decoder = new TextDecoder();
      let buffer = '';
      for await (const chunk of res.body) {
        buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        let at;
        while ((at = buffer.indexOf('\n\n')) >= 0) {
          const frame = buffer.slice(0, at); buffer = buffer.slice(at + 2);
          const ev = { id: null, event: 'message', data: null };
          const data = [];
          for (const line of frame.split('\n')) {
            if (line.startsWith('id:')) ev.id = line.slice(3).trim();
            else if (line.startsWith('event:')) ev.event = line.slice(6).trim();
            else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
          }
          try { ev.data = data.length ? JSON.parse(data.join('\n')) : null; } catch { ev.data = null; }
          yield ev;
        }
      }
    },
  };
}

/* -------------------------------------------- tolerant schema readers */

export function extractSession(body) {
  const d = body?.data ?? body;
  const id = d?.id ?? d?.sessionID ?? d?.session?.id ?? null;
  return typeof id === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(id) ? id : null;
}
function items(body) {
  const d = body?.data ?? body;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.messages)) return d.messages;
  return [];
}
function roleOf(item) { return item?.role ?? item?.info?.role ?? item?.type ?? null; }
function textOf(item) {
  const out = [];
  if (typeof item?.text === 'string') out.push(item.text);
  if (typeof item?.content === 'string') out.push(item.content);
  for (const part of [...(Array.isArray(item?.parts) ? item.parts : []), ...(Array.isArray(item?.content) ? item.content : [])]) {
    if (part && (part.type === 'text' || part.type === undefined) && typeof part.text === 'string') out.push(part.text);
  }
  return out.join('');
}
function completed(item) {
  return item?.completed === true || item?.status === 'completed' || !!item?.time?.completed || !!item?.info?.time?.completed || !!item?.finish;
}
export function extractAssistant(body) {
  const assistant = items(body).filter((i) => roleOf(i) === 'assistant');
  const text = assistant.map(textOf).filter(Boolean).join('\n').slice(0, 16000);
  const last = assistant[assistant.length - 1];
  return { count: assistant.length, text, complete: !!last && completed(last) };
}
export function eventSession(ev) {
  const d = ev?.data ?? {};
  const type = d.type ?? ev?.event;
  const id = d.sessionID ?? d.properties?.sessionID ?? d.data?.sessionID ?? null;
  return { type, sessionID: typeof id === 'string' ? id : null };
}

/* ---------------------------------------------------------------- adapter */

export function createOpenCodeV2Adapter({ client, name = OPENCODE_V2_ADAPTER, maxTextChars = 8000, liveVerified = false } = {}) {
  if (!client) throw new TypeError('createOpenCodeV2Adapter requires a client');
  const manifest = Object.freeze({
    schema: ADAPTER_MANIFEST_SCHEMA, name, version: '0.1.0', kind: AGENT_KIND.EXECUTOR, provider: 'opencode-v2-service',
    capabilities: Object.freeze({ deliver: true, observe: true, cancel: true, report_target: false,
      max_text_chars: maxTextChars, concurrency: 1, durable_readback: true, live_verified: liveVerified }),
  });
  const idle = new Map(); // sessionID -> true (hint only)
  let gap = false;

  function finished(text, sessionID, how) {
    const tail = `[OpenCode V2 session ${sessionID} reported idle (${how}); an executor statement, not verified proof]`;
    return { outcome: 'reply', reply: text ? `${text}\n${tail}` : tail, session_ref: sessionID, evidence: { completion: how } };
  }

  return {
    manifest,
    canonicalRef(ref) {
      const v = String(ref ?? '').trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9._@-]{0,63}$/.test(v)) refuse(REASON.BAD_VALUE, 'executor ref must be a short executor id');
      return v;
    },
    async deliver(req) {
      if (!req.grant?.cwd) return { outcome: 'not_sent', reason: REASON.GRANT_SCOPE, detail: 'an OpenCode V2 command needs a grant cwd (session location)' };
      let sessionID;
      try {
        sessionID = extractSession(await client.createSession({ directory: req.grant.cwd, title: `AION bus ${req.correlation_id}` }));
      } catch (error) {
        // No prompt has been sent yet, whatever happened: positive no-send.
        return { outcome: 'not_sent', reason: error instanceof HttpError ? REASON.TARGET_REFUSED : REASON.TRANSPORT_LOST, detail: `session create failed: ${error.message}`.slice(0, 200) };
      }
      if (!sessionID) return { outcome: 'not_sent', reason: REASON.ADAPTER_ERROR, detail: 'session create returned no recognisable id' };
      try {
        await client.prompt({ sessionID, text: `${req.text}\n\n(AION bus command ${req.command_id}, correlation ${req.correlation_id})` });
      } catch (error) {
        if (error instanceof HttpError && error.status === 409) return { outcome: 'not_sent', reason: REASON.EXECUTOR_BUSY, detail: 'conflict: input not admitted', session_ref: sessionID };
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) return { outcome: 'not_sent', reason: REASON.TARGET_REFUSED, detail: `prompt refused: ${error.status}`, session_ref: sessionID };
        // 5xx, timeout or dropped connection: the input may have been admitted.
        return { outcome: 'unknown', reason: error.name === 'AbortError' ? REASON.TIMEOUT : REASON.TRANSPORT_LOST, detail: String(error.message).slice(0, 200), session_ref: sessionID };
      }
      return { outcome: 'sent', detail: 'input durably admitted by the service', session_ref: sessionID };
    },
    async observe(req) {
      const sessionID = req.executor_ref;
      if (!sessionID) return { outcome: 'pending', reason: REASON.OUTCOME_UNKNOWN, detail: 'no session reference recorded' };
      let body;
      try { body = await client.messages({ sessionID }); } catch (error) {
        return { outcome: 'pending', reason: REASON.TRANSPORT_LOST, detail: `readback failed: ${error.message}`.slice(0, 200) };
      }
      const seen = extractAssistant(body);
      if (seen.complete) return finished(seen.text, sessionID, 'server message marked complete');
      if (idle.get(sessionID) && seen.count > 0) return finished(seen.text, sessionID, 'session.idle event');
      return { outcome: 'pending', detail: gap ? 'event stream had a gap; reconciling from server state' : 'not idle yet', session_ref: sessionID };
    },
    async cancel(req) {
      const sessionID = req.cancel_target?.executor_ref;
      if (!sessionID) return { outcome: 'not_sent', reason: REASON.NOTHING_TO_CANCEL, detail: 'target has no session reference' };
      try {
        await client.interrupt({ sessionID });
        return { outcome: 'reply', reply: `interrupt requested for session ${sessionID}; not confirmed until the session reports idle` };
      } catch (error) {
        return error instanceof HttpError ? { outcome: 'not_sent', reason: REASON.TARGET_REFUSED, detail: `interrupt refused: ${error.status}` }
          : { outcome: 'unknown', reason: REASON.TRANSPORT_LOST, detail: String(error.message).slice(0, 200) };
      }
    },
    /**
     * Consume the volatile event stream as HINTS. Returns when the stream ends;
     * the caller re-subscribes after recovery. Any end marks a gap, and observe()
     * already reconciles from server state, so a missed event costs latency only.
     */
    async watchEvents({ signal } = {}) {
      try {
        for await (const ev of client.events({ signal })) {
          const { type, sessionID } = eventSession(ev);
          if (type === 'session.idle' && sessionID) idle.set(sessionID, true);
          if (idle.size > 512) idle.delete(idle.keys().next().value);
        }
      } catch { /* stream failure is a gap, never an outcome */ }
      gap = true;
      return { ended: true, gap };
    },
    _idle: idle,
  };
}
