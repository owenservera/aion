// AION Bus V2 — OpenCode 2.0 shared-service adapter (OPTIONAL companion to ACP).
//
// SOURCES: live OpenCode 2.0.32 /openapi.json and read-only agent/model/session
// GETs inspected 2026-10-20. The live service OpenAPI is the contract source;
// temporary inspection filenames are not durable evidence references.
//   GET /api/agent, /api/model              ?location[directory]=... -> { location, data: [] }
//   GET /api/session/{id}                   -> { data: Session.Info }
//   POST /api/session                       { location:{directory}, title, agent?, model:{providerID,id,variant?}?, parentID? }
//   POST /api/session/{id}/prompt           { text, files?:[{uri,name?}] } -> { data: Session.Inbox.User }
// Official V2 attachment docs corroborate local file:/// URIs (not HTTP(S));
// attachment admission is contract/offline-tested, NOT live-send verified.
// Session prompt durably admits input (not a reply); 409 ConflictError.
//   POST /api/session/{id}/interrupt?resume=false
//   GET  /api/session/{id}/message          projected messages, cursor paging
//   GET  /api/event                         text/event-stream, VOLATILE: no replay, slow consumers dropped
//   GET  /api/info                          identity / readiness
// VERIFIED against a real OpenCode 2.0.32 service (sandbox, no credentials,
// 2026-10-19): auth is HTTP Basic `opencode:<password>` from the service's own
// state file; create returns `data.id`; prompt returns `data.{id,sessionID,
// type,payload.text,delivery}`; the message list is NEWEST-FIRST and carries
// an explicit `idle` item (`outcome`, optional `error`) when the loop stops;
// assistant items carry `content[]`, `finish`, `time.completed`, `error`.
// (fixture: tests/fixtures/opencode-v2-real-messages.json). Event names on
// /api/event other than `session.idle` remain unverified; events are hints.
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

import { ADAPTER_MANIFEST_SCHEMA, AGENT_KIND, REASON, refuse, isPlain } from '../contracts.js';

export const OPENCODE_V2_ADAPTER = 'opencode-v2';
const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d{1,5})?$/;

// Windows directory identity is case-insensitive; POSIX remains case-sensitive.
export function sameSessionDirectory(a, b) {
  if (typeof a !== 'string' || !a || typeof b !== 'string' || !b) return false;
  const windows = p => /^(?:[A-Za-z]:[\\/]|[\\/]{2})/.test(p);
  const clean = p => {
    const slashes = p.replace(/\\/g, '/');
    const prefix = slashes.startsWith('//') ? '//' : slashes.startsWith('/') ? '/' : '';
    const segments = [];
    for (const part of slashes.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') {
        // Never let a drive or UNC server/share identity be popped away.
        const floor = prefix === '//' ? 2 : /^[A-Za-z]:$/.test(segments[0] ?? '') ? 1 : 0;
        if (segments.length > floor) segments.pop();
      } else segments.push(part);
    }
    return prefix + segments.join('/');
  };
  return windows(a) && windows(b) ? clean(a).toLowerCase() === clean(b).toLowerCase() : clean(a) === clean(b);
}

class NativeServiceError extends Error {
  constructor(cause) { super('native service request failed'); this.cause = cause; }
}
async function nativeRequest(call) {
  try { return await call(); } catch (error) { throw new NativeServiceError(error); }
}
function beforePromptFailure(error, detail, sessionID = null) {
  const source = error instanceof NativeServiceError ? error.cause : null;
  const reason = !source ? REASON.BAD_VALUE : source.name === 'AbortError' ? REASON.TIMEOUT
    : source instanceof HttpError ? REASON.TARGET_REFUSED : REASON.TRANSPORT_LOST;
  return { outcome: 'not_sent', reason, detail, ...(sessionID ? { session_ref: sessionID } : {}) };
}
function catalogRows(body) {
  if (!Array.isArray(body?.data) || body.data.some(row => !isPlain(row))) throw new TypeError('invalid native catalog shape');
  return body.data;
}
function selectionOf(session) {
  const selection = { agent: session?.agent ?? null, providerID: session?.model?.providerID ?? null,
    id: session?.model?.id ?? null, variant: session?.model?.variant ?? null };
  if (session?.model !== undefined && !isPlain(session.model)) throw new TypeError('invalid session model');
  if (Object.values(selection).some(v => v !== null && (typeof v !== 'string' || !v || v.length > 128 || /[\x00-\x1f]/.test(v)))) throw new TypeError('invalid session selection');
  return selection;
}

// Structured local input only; never added to the commander text grammar.
export function normalizeSendOptions(value) {
  if (!isPlain(value)
    || Object.keys(value).some(k => !['agent','model','variant','files','session','parent'].includes(k))) throw new TypeError('invalid send options');
  const out = {};
  for (const k of ['agent','model','variant','session','parent']) {
    if (value[k] === undefined) continue;
    if (typeof value[k] !== 'string' || !value[k] || value[k].length > 256 || /[\s\x00-\x1f]/.test(value[k])) throw new TypeError(`invalid ${k}`);
    out[k] = value[k];
  }
  if (out.model && !/^[^/]+\/.+$/.test(out.model)) throw new TypeError('model requires provider/id');
  if (out.variant && !out.model) throw new TypeError('variant requires explicit model');
  for (const k of ['session','parent']) if (out[k] && !/^ses[A-Za-z0-9_-]{1,124}$/.test(out[k])) throw new TypeError(`invalid ${k}`);
  if (out.session && out.parent) throw new TypeError('session and parent are exclusive');
  if (out.session && (out.agent || out.model)) throw new TypeError('session reuse cannot override agent/model; use parent for a new configured child');
  if (value.files !== undefined) {
    if (!Array.isArray(value.files) || value.files.length > 8 || value.files.some(p => typeof p !== 'string' || !p || p.length > 4096 || /[\x00-\x1f]/.test(p))) throw new TypeError('invalid files');
    if (value.files.length) out.files = [...value.files];
  }
  return out;
}

async function localAttachments(paths, directory) {
  if (!paths?.length) return [];
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const { pathToFileURL, fileURLToPath } = await import('node:url');
  const root = await fs.realpath(directory);
  const files = [];
  let total = 0;
  const secret = p => /(?:^|[\\/])(?:\.env(?:\.[^\\/]*)?|\.ssh|\.aws|\.azure|\.gnupg|\.git|auth\.json|tokens?(?:\.[^\\/]*)?|credentials(?:\.[^\\/]*)?|secrets?(?:\.[^\\/]*)?)(?:[\\/]|$)/i.test(p)
    || /\.(?:pem|key|p12|pfx|keystore)$/i.test(p);
  for (const input of paths) {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input) && !input.startsWith('file://')) throw new TypeError('only local file attachments supported');
    const requested = input.startsWith('file://') ? fileURLToPath(input) : path.resolve(root, input);
    const real = await fs.realpath(requested);
    const rel = path.relative(root, real);
    if (secret(requested) || secret(real) || !rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw new TypeError('attachment outside grant cwd or secret path');
    if (!/\.(?:txt|md|json|csv|tsv|js|mjs|cjs|ts|tsx|jsx|py|rs|go|java|c|h|cpp|css|html|xml|yaml|yml|toml|log|png|jpg|jpeg|gif|webp)$/i.test(real)) throw new TypeError('unsupported attachment type');
    const stat = await fs.stat(real);
    total += stat.size;
    if (!stat.isFile() || stat.size > 20 * 1024 * 1024 || total > 20 * 1024 * 1024) throw new TypeError('attachments exceed 20 MiB or are not files');
    files.push({ uri: pathToFileURL(real).href, name: path.basename(real) });
  }
  return files;
}

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
    agents: ({ directory }) => call('GET', `/api/agent?location[directory]=${encodeURIComponent(directory)}`),
    models: ({ directory }) => call('GET', `/api/model?location[directory]=${encodeURIComponent(directory)}`),
    session: ({ sessionID }) => call('GET', `/api/session/${sid(sessionID)}`),
    createSession: ({ directory, title, agent, model, parentID }) => call('POST', '/api/session', { location: { directory }, title, ...(agent ? { agent } : {}), ...(model ? { model } : {}), ...(parentID ? { parentID } : {}) }),
    prompt: ({ sessionID, text, files }) => call('POST', `/api/session/${sid(sessionID)}/prompt`, { text, ...(files?.length ? { files } : {}) }),
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
function createdAt(item) { const t = item?.time?.created; return Number.isFinite(t) ? t : 0; }
/**
 * Read a session's projected messages (real 2.0.32 schema, tolerant of the
 * older shapes). Completion = an `idle` item newer than the latest `user`
 * input; its `outcome`/`error` (or the assistant's) is the executor's verdict.
 */
export function extractAssistant(body) {
  const list = items(body).slice().sort((a, b) => createdAt(a) - createdAt(b));
  const lastUser = list.reduce((at, x, i) => (roleOf(x) === 'user' ? i : at), -1);
  const after = list.slice(lastUser + 1);
  const assistant = after.filter((i) => roleOf(i) === 'assistant');
  const idle = after.filter((i) => i?.type === 'idle').pop() ?? null;
  const text = assistant.map(textOf).filter(Boolean).join('\n').slice(0, 16000);
  const last = assistant[assistant.length - 1];
  const legacyDone = !!last && (last.completed === true || last.status === 'completed' || (!!last.info?.time?.completed));
  const error = idle?.error ?? last?.error ?? null;
  const outcome = idle?.outcome ?? (last?.finish === 'error' ? 'failed' : (idle || legacyDone ? 'completed' : null));
  return { count: assistant.length, text, complete: !!idle || legacyDone,
    outcome, error: error ? { type: String(error.type ?? 'error').slice(0, 64), message: String(error.message ?? '').slice(0, 200) } : null };
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
      let options, model, modelInfo, files, selection = null;
      try {
        options = normalizeSendOptions(req.send_options ?? {});
        if (options.agent) {
          const matches = catalogRows(await nativeRequest(() => client.agents({ directory: req.grant.cwd }))).filter(a => a.id === options.agent);
          // The inspected create contract accepts an agent ID but does not
          // establish a safe subagent-root/child exception. Refuse that mode.
          if (matches.length !== 1 || !['primary', 'all'].includes(matches[0].mode)) throw new TypeError('agent is not an exact primary/all agent ID');
        }
        if (options.model) {
          const at = options.model.indexOf('/');
          model = { providerID: options.model.slice(0, at), id: options.model.slice(at + 1), ...(options.variant ? { variant: options.variant } : {}) };
          const matches = catalogRows(await nativeRequest(() => client.models({ directory: req.grant.cwd }))).filter(m => m.providerID === model.providerID && m.id === model.id && m.enabled === true);
          if (matches.length !== 1 || !Array.isArray(matches[0].variants) || (model.variant && !matches[0].variants.some(v => v.id === model.variant))) throw new TypeError('unknown model or variant');
          modelInfo = matches[0];
        }
        files = await localAttachments(options.files, req.grant.cwd);
        if (files.some(f => /\.(png|jpe?g|gif|webp)$/i.test(f.name)) && !modelInfo?.capabilities?.input?.includes('image')) throw new TypeError('image attachments require an explicit image-capable model');
        const linked = options.session ?? options.parent;
        if (linked) {
          const session = (await nativeRequest(() => client.session({ sessionID: linked })))?.data;
          if (session?.id !== linked || !sameSessionDirectory(session.location?.directory, req.grant.cwd)) throw new TypeError('linked session location differs from grant cwd');
          if (options.session) selection = selectionOf(session);
        }
        if (options.session) {
          const previous = await nativeRequest(() => client.messages({ sessionID: options.session }));
          if (items(previous).length && !extractAssistant(previous).complete) {
            return { outcome: 'not_sent', reason: REASON.EXECUTOR_BUSY, detail: 'existing session is not durably idle' };
          }
        }
      } catch (error) {
        return beforePromptFailure(error, 'native send options, attachment or linked session validation failed');
      }
      let sessionID;
      try {
        if (options.session) sessionID = options.session;
        else {
          const created = await nativeRequest(() => client.createSession({ directory: req.grant.cwd, title: `AION bus ${req.correlation_id}`, agent: options.agent, model, parentID: options.parent }));
          sessionID = extractSession(created);
          let actual = created?.data;
          const incomplete = s => (options.agent && s?.agent === undefined)
            || (model && (s?.model?.providerID === undefined || s?.model?.id === undefined || (model.variant && s?.model?.variant === undefined)))
            || (options.parent && (s?.parentID === undefined || s?.location?.directory === undefined));
          // A known mismatch must never be hidden by a subsequent GET.
          const mismatch = s => (options.agent && s?.agent !== undefined && s.agent !== options.agent)
            || (model && ((s?.model?.providerID !== undefined && s.model.providerID !== model.providerID)
              || (s?.model?.id !== undefined && s.model.id !== model.id)
              || (model.variant && s?.model?.variant !== undefined && s.model.variant !== model.variant)))
            || (options.parent && s?.parentID !== undefined && s.parentID !== options.parent);
          if (actual?.location?.directory !== undefined && !sameSessionDirectory(actual.location.directory, req.grant.cwd)) {
            return { outcome: 'not_sent', reason: REASON.GRANT_SCOPE, detail: 'created session location differs from grant cwd', session_ref: sessionID };
          }
          if (actual?.model !== undefined && !isPlain(actual.model)) throw new TypeError('invalid created model shape');
          if (mismatch(actual)) throw new TypeError('created session settings differ from requested settings');
          if (sessionID && incomplete(actual)) actual = (await nativeRequest(() => client.session({ sessionID })))?.data;
          if (incomplete(actual) || mismatch(actual) || (sessionID && actual?.id !== sessionID)) throw new TypeError('created session settings are not confirmed');
          selection = selectionOf(actual);
          // A parent controls child location natively. Verify the returned child
          // too, in case its parent moved after the preflight GET.
          if (options.parent && !sameSessionDirectory(actual?.location?.directory, req.grant.cwd)) {
            return { outcome: 'not_sent', reason: REASON.GRANT_SCOPE, detail: 'created child location differs from grant cwd', session_ref: sessionID };
          }
        }
      } catch (error) {
        // No prompt has been sent yet, whatever happened: positive no-send.
        return beforePromptFailure(error, 'session creation or requested settings verification failed', sessionID);
      }
      if (!sessionID) return { outcome: 'not_sent', reason: REASON.ADAPTER_ERROR, detail: 'session create returned no recognisable id' };
      if (files.length) {
        try {
          const checked = await localAttachments(options.files, req.grant.cwd);
          if (JSON.stringify(checked) !== JSON.stringify(files)) throw new TypeError('attachment path changed');
        } catch { return { outcome: 'not_sent', reason: REASON.BAD_VALUE, detail: 'attachment changed before prompt admission', session_ref: sessionID }; }
      }
      const selectionEvidence = { session_agent: selection?.agent ?? null, session_provider: selection?.providerID ?? null,
        session_model: selection?.id ?? null, session_variant: selection?.variant ?? null };
      let promptId = null;
      try {
        const admitted = (await client.prompt({ sessionID, text: `${req.text}\n\n(AION bus command ${req.command_id}, correlation ${req.correlation_id})`, files }))?.data;
        if (admitted?.sessionID === sessionID && admitted?.type === 'user' && typeof admitted.id === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(admitted.id)) promptId = admitted.id;
      } catch (error) {
        if (error instanceof HttpError && error.status === 409) return { outcome: 'not_sent', reason: REASON.EXECUTOR_BUSY, detail: 'conflict: input not admitted', session_ref: sessionID };
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) return { outcome: 'not_sent', reason: REASON.TARGET_REFUSED, detail: `prompt refused: ${error.status}`, session_ref: sessionID };
        // 5xx, timeout or dropped connection: the input may have been admitted.
        return { outcome: 'unknown', reason: error.name === 'AbortError' ? REASON.TIMEOUT : REASON.TRANSPORT_LOST, detail: String(error.message).slice(0, 200), session_ref: sessionID, evidence: selectionEvidence };
      }
      return { outcome: 'sent', detail: 'input durably admitted by the service', session_ref: sessionID,
        evidence: { ...(promptId ? { prompt_id: promptId } : {}), ...selectionEvidence } };
    },
    async observe(req) {
      const sessionID = req.executor_ref;
      if (!sessionID) return { outcome: 'pending', reason: REASON.OUTCOME_UNKNOWN, detail: 'no session reference recorded' };
      let body;
      try { body = await client.messages({ sessionID }); } catch (error) {
        return { outcome: 'pending', reason: error.name === 'AbortError' ? REASON.TIMEOUT : REASON.TRANSPORT_LOST, detail: `readback failed: ${error.message}`.slice(0, 200) };
      }
      // A shared session's latest user is not necessarily our admitted input.
      // Bound readback by the durable returned inbox ID AND our exact marker.
      if (req.send_options?.session) {
        const list = items(body).slice().sort((a,b) => createdAt(a) - createdAt(b));
        const matches = list.filter(i => roleOf(i) === 'user' && i.id === req.executor_prompt_id);
        const user = matches[0];
        if (!req.executor_prompt_id || matches.length !== 1 || !req.command_id
          || !textOf(user).endsWith(`\n\n(AION bus command ${req.command_id}, correlation ${req.correlation_id})`)) {
          return { outcome: 'pending', reason: REASON.OUTCOME_UNKNOWN, detail: 'waiting for exact admitted inbox input' };
        }
        const start = list.indexOf(user);
        const nextUser = list.findIndex((i,index) => index > start && roleOf(i) === 'user');
        const segment = list.slice(start, nextUser < 0 ? undefined : nextUser);
        // No idle within our boundary means a concurrent input may have joined
        // the same loop. Never use its later assistant/idle as our completion.
        if (!segment.some(i => i.type === 'idle' && createdAt(i) > createdAt(user))) return { outcome: 'pending', reason: REASON.OUTCOME_UNKNOWN, detail: 'no isolated completion for admitted inbox input' };
        body = { data: segment };
      }
      const seen = extractAssistant(body);
      if (seen.complete && seen.error) {
        // A definitive executor FAILURE, reported as such, never as success.
        const reason = /auth/i.test(seen.error.type) ? REASON.EXECUTOR_AUTH_REQUIRED : REASON.EXECUTOR_ERROR;
        const text = `[executor outcome=${seen.outcome ?? 'failed'} error=${seen.error.type}: ${seen.error.message}]${seen.text ? `\n${seen.text}` : ''}`;
        return { ...finished(text, sessionID, 'idle item with error'), reason };
      }
      if (seen.complete) return finished(seen.text, sessionID, `idle item outcome=${seen.outcome ?? 'completed'}`);
      if (!req.send_options?.session && idle.get(sessionID) && seen.count > 0) return finished(seen.text, sessionID, 'session.idle event');
      return { outcome: 'pending', detail: gap ? 'event stream had a gap; reconciling from server state' : 'not idle yet', session_ref: sessionID };
    },
    async cancel(req) {
      if (req.cancel_target?.send_options?.session) return { outcome: 'not_sent', reason: REASON.OP_NOT_SUPPORTED, detail: 'cannot interrupt an externally reused session; dispose the local command explicitly instead' };
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
