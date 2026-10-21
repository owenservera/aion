// L1 network capture for one tab (plus its auto-attached iframes/workers).
//
// Read-only by construction: uses Network.* observation only. It never uses Fetch.* interception
// (taking an intercepted body stream would require the collector to re-supply the response).
//
// Per in-scope response:
//   1. Network.streamResourceContent(requestId) is armed at responseReceived. Its bufferedData holds
//      bytes received before arming (recorded with pre:true); afterwards each Network.dataReceived
//      carries the next chunk as base64, in order.
//   2. If arming fails (unsupported, already finished, ...), the failure is recorded and, when the
//      profile allows, Network.getResponseBody is attempted at loadingFinished (marked retrospective).
//   3. WebSocket frames and browser-parsed EventSource messages are recorded as separate views.
import { EventEmitter } from 'node:events';
import { redactHeaders, redactUrl, isSensitiveUrl, scrubSecrets, scrubText } from './redact.mjs';
import { inScope } from '../profiles/profiles.mjs';

export class NetworkRecorder extends EventEmitter {
  constructor({ append, profile, getPageUrl, options = {} }) {
    super();
    this.append = append;              // (rec) => seq|null  — writes to raw log + live pipeline
    this.profile = profile;
    this.getPageUrl = getPageUrl;
    this.options = options;
    this.reqs = new Map();             // sid -> state
    this.stats = { requests: 0, outOfScope: 0, metadataOnly: 0, streamed: 0, armFailed: 0, retrospective: 0, chunks: 0, bytes: 0, wsFrames: 0, esMessages: 0, sensitiveExcluded: 0, redactions: 0 };
    this.sessions = new Map();         // sessionId -> tag
  }

  setProfile(p) { this.profile = p; }

  _sid(tag, requestId) { return `${tag}:${requestId}`; }

  _policy(url, resourceType) {
    const pageUrl = this.getPageUrl();
    const c = this.profile.capture ?? {};
    if (!url.startsWith('http') && !url.startsWith('ws')) return { capture: false, reason: 'non_network_scheme' };
    if (!inScope(this.profile, url, pageUrl)) {
      return this.profile.scope?.thirdParty === 'metadata' ? { capture: true, body: false, reason: 'third_party_metadata' } : { capture: false, reason: 'out_of_scope' };
    }
    if (isSensitiveUrl(url, c.sensitive ?? [])) return { capture: true, body: false, reason: 'credential_policy' };
    if ((c.exclude ?? []).some((re) => new RegExp(re, 'i').test(url))) return { capture: true, body: false, reason: 'profile_exclude' };
    if (this.options.allBodies) return { capture: true, body: true };
    if ((c.include ?? []).some((re) => new RegExp(re, 'i').test(url))) return { capture: true, body: true };
    if (resourceType && !(c.bodyResourceTypes ?? []).includes(resourceType)) return { capture: true, body: false, reason: 'resource_type_metadata_only' };
    return { capture: true, body: true };
  }

  async attach(session, tag, targetInfo = {}) {
    this.sessions.set(session.sessionId, tag);
    const on = (ev, fn) => session.on(ev, (p) => { try { fn(p); } catch (e) { this.emit('error', e); } });
    on('Network.requestWillBeSent', (p) => this._onRequest(session, tag, p, targetInfo));
    on('Network.responseReceived', (p) => this._onResponse(session, tag, p));
    on('Network.dataReceived', (p) => this._onData(tag, p));
    on('Network.loadingFinished', (p) => this._onFinished(session, tag, p));
    on('Network.loadingFailed', (p) => this._onFailed(tag, p));
    on('Network.eventSourceMessageReceived', (p) => this._onEventSource(tag, p));
    on('Network.webSocketCreated', (p) => this._onWsCreated(tag, p, targetInfo));
    on('Network.webSocketHandshakeResponseReceived', (p) => this._onWsHandshake(tag, p));
    on('Network.webSocketFrameReceived', (p) => this._onWsFrame(tag, p, 'in'));
    on('Network.webSocketFrameSent', (p) => this._onWsFrame(tag, p, 'out'));
    on('Network.webSocketFrameError', (p) => { const st = this.reqs.get(this._sid(tag, p.requestId)); if (st) this.append({ k: 'ws.error', sid: st.sid, error: p.errorMessage }); });
    on('Network.webSocketClosed', (p) => { const st = this.reqs.get(this._sid(tag, p.requestId)); if (!st) return; if (!st.ignored) this.append({ k: 'ws.close', sid: st.sid, ct: p.timestamp }); this.reqs.delete(st.sid); });
    await session.send('Network.enable', { maxTotalBufferSize: 256 * 1024 * 1024, maxResourceBufferSize: 64 * 1024 * 1024, maxPostDataSize: 1024 * 1024 });
    // Keep the browser cache from hiding traffic? No: altering cache behaviour changes the page.
  }

  _onRequest(session, tag, p, targetInfo) {
    const sid = this._sid(tag, p.requestId);
    const url = p.request.url;
    // Redirects reuse the requestId: close the previous hop explicitly.
    const prev = this.reqs.get(sid);
    if (prev && p.redirectResponse) {
      this.append({ k: 'res', sid, status: p.redirectResponse.status, mime: p.redirectResponse.mimeType, headers: redactHeaders(p.redirectResponse.headers), redirect: true });
      this.append({ k: 'done', sid, redirectedTo: redactUrl(url) });
    }
    const pol = this._policy(url, p.type);
    this.stats.requests++;
    if (!pol.capture) { this.stats.outOfScope++; this.reqs.set(sid, { sid, ignored: true }); return; }
    const st = { sid, url, body: pol.body, reason: pol.reason, armed: false, chunks: 0, bytes: 0, session };
    this.reqs.set(sid, st);
    if (!pol.body) this.stats.metadataOnly++;
    if (pol.reason === 'credential_policy') this.stats.sensitiveExcluded++;
    const rec = {
      k: 'req', sid, method: p.request.method, url: redactUrl(url), type: p.type, frameId: p.frameId,
      initiator: p.initiator?.type, ct: p.timestamp, wallTime: p.wallTime, target: targetInfo.type ?? 'page',
      headers: redactHeaders(p.request.headers), hasPostData: !!p.request.hasPostData,
      policy: pol.body ? 'body' : `metadata_only:${pol.reason}`,
    };
    if (this.profile.capture?.requestBodies && pol.body && p.request.postData) {
      const { text, redactions } = scrubText(p.request.postData);
      rec.postData = text;
      if (redactions.length) rec.postDataRedactions = redactions.length;
    }
    this.append(rec);
  }

  async _onResponse(session, tag, p) {
    const sid = this._sid(tag, p.requestId);
    const st = this.reqs.get(sid);
    if (!st || st.ignored) return;
    const r = p.response;
    this.append({
      k: 'res', sid, status: r.status, mime: r.mimeType, protocol: r.protocol, type: p.type, ct: p.timestamp,
      headers: redactHeaders(r.headers), fromServiceWorker: !!r.fromServiceWorker, fromCache: !!(r.fromDiskCache || r.fromPrefetchCache), encodedDataLength: r.encodedDataLength,
    });
    if (!st.body) { this.append({ k: 'body.excluded', sid, reason: st.reason }); return; }
    if (p.type === 'WebSocket') return;
    st.arming = true;
    try {
      const res = await session.send('Network.streamResourceContent', { requestId: p.requestId });
      st.armed = true;
      this.stats.streamed++;
      this.append({ k: 'stream.armed', sid, mode: 'stream', bufferedBytes: res.bufferedData ? Buffer.from(res.bufferedData, 'base64').length : 0 });
      if (res.bufferedData) this._chunk(st, Buffer.from(res.bufferedData, 'base64'), { pre: true });
    } catch (e) {
      this.stats.armFailed++;
      st.armFailed = String(e.message ?? e);
      this.append({ k: 'stream.arm_failed', sid, error: st.armFailed });
    } finally {
      st.arming = false;
      // Chunks that raced the arming response are written after bufferedData, preserving byte order.
      for (const d of st.pendingData ?? []) this._chunk(st, d.buf, d.extra);
      st.pendingData = null;
      if (st.finishedWhileArming) this._finalize(st.finishedWhileArming.session, st, st.finishedWhileArming.p);
    }
  }

  _chunk(st, buf, extra = {}) {
    const { bytes, redactions } = scrubSecrets(buf);
    st.chunks++; st.bytes += bytes.length;
    this.stats.chunks++; this.stats.bytes += bytes.length;
    if (redactions.length) this.stats.redactions += redactions.length;
    const rec = { k: 'chunk', sid: st.sid, n: bytes.length, b64: bytes.toString('base64'), ...extra };
    if (redactions.length) rec.redactions = redactions;
    this.append(rec);
  }

  _onData(tag, p) {
    const st = this.reqs.get(this._sid(tag, p.requestId));
    if (!st || st.ignored || !st.body) return;
    if (p.data) {
      const buf = Buffer.from(p.data, 'base64'), extra = { ct: p.timestamp, enc: p.encodedDataLength };
      if (st.arming) (st.pendingData ??= []).push({ buf, extra }); else this._chunk(st, buf, extra);
    }
    else if (!st.armed) st.unarmedDataEvents = (st.unarmedDataEvents ?? 0) + 1; // bytes are in bufferedData or the retrospective body
  }

  _onFinished(session, tag, p) {
    const st = this.reqs.get(this._sid(tag, p.requestId));
    if (!st) return;
    if (st.ignored) { this.reqs.delete(st.sid); return; }
    if (st.arming) { st.finishedWhileArming = { session, p }; return; }
    this._finalize(session, st, p);
  }

  async _finalize(session, st, p) {
    if (st.body && !st.armed && this.profile.capture?.retrospectiveFallback !== false) {
      try {
        const r = await session.send('Network.getResponseBody', { requestId: p.requestId });
        const buf = Buffer.from(r.body ?? '', r.base64Encoded ? 'base64' : 'utf8');
        this.stats.retrospective++;
        const { bytes, redactions } = scrubSecrets(buf);
        const rec = { k: 'body', sid: st.sid, n: bytes.length, b64: bytes.toString('base64'), retrospective: true };
        if (redactions.length) rec.redactions = redactions;
        this.append(rec);
      } catch (e) {
        this.append({ k: 'body.unavailable', sid: st.sid, error: String(e.message ?? e) });
      }
    }
    this.append({ k: 'done', sid: st.sid, ct: p.timestamp, encodedDataLength: p.encodedDataLength, chunks: st.chunks, bytes: st.bytes });
    this.reqs.delete(st.sid);
  }

  _onFailed(tag, p) {
    const st = this.reqs.get(this._sid(tag, p.requestId));
    if (!st) return;
    if (st.ignored) { this.reqs.delete(st.sid); return; }
    this.append({ k: 'fail', sid: st.sid, ct: p.timestamp, errorText: p.errorText, canceled: !!p.canceled, blockedReason: p.blockedReason, chunks: st.chunks, bytes: st.bytes });
    this.reqs.delete(st.sid);
  }

  _onEventSource(tag, p) {
    const st = this.reqs.get(this._sid(tag, p.requestId));
    if (!st || st.ignored || !st.body) return;
    this.stats.esMessages++;
    const { text } = scrubText(p.data ?? '');
    this.append({ k: 'es.msg', sid: st.sid, ct: p.timestamp, eventName: p.eventName, eventId: p.eventId, data: text });
  }

  _onWsCreated(tag, p, targetInfo) {
    const sid = this._sid(tag, p.requestId);
    if (!this.profile.capture?.websockets) { this.reqs.set(sid, { sid, ignored: true }); return; }
    const pol = this._policy(p.url, null); // WebSockets are governed by capture.websockets, not resource types
    if (!pol.capture || !pol.body) { this.reqs.set(sid, { sid, ignored: !pol.capture, body: false }); if (pol.capture) this.append({ k: 'ws.open', sid, url: redactUrl(p.url), policy: `metadata_only:${pol.reason}` }); return; }
    this.reqs.set(sid, { sid, ws: true, body: true, frames: 0 });
    this.append({ k: 'ws.open', sid, url: redactUrl(p.url), initiator: p.initiator?.type, target: targetInfo.type ?? 'page' });
  }

  _onWsHandshake(tag, p) {
    const st = this.reqs.get(this._sid(tag, p.requestId));
    if (!st || st.ignored) return;
    this.append({ k: 'ws.handshake', sid: st.sid, status: p.response?.status, headers: redactHeaders(p.response?.headers) });
  }

  _onWsFrame(tag, p, dir) {
    const st = this.reqs.get(this._sid(tag, p.requestId));
    if (!st || st.ignored || !st.body) return;
    const f = p.response ?? {};
    if (dir === 'out' && !this.profile.capture?.wsSentFrames) {
      this.append({ k: 'ws.frame_meta', sid: st.sid, dir, opcode: f.opcode, size: (f.payloadData ?? '').length, ct: p.timestamp });
      return;
    }
    this.stats.wsFrames++;
    let payload = f.payloadData ?? '';
    let redactions = [];
    if (f.opcode === 2) { const r = scrubSecrets(Buffer.from(payload, 'base64')); payload = r.bytes.toString('base64'); redactions = r.redactions; }
    else { const r = scrubText(payload); payload = r.text; redactions = r.redactions; }
    const rec = { k: 'ws.frame', sid: st.sid, dir, opcode: f.opcode, payload, ct: p.timestamp };
    if (redactions.length) { rec.redactions = redactions; this.stats.redactions += redactions.length; }
    this.append(rec);
  }

  openStreams() { return [...this.reqs.values()].filter((s) => !s.ignored).map((s) => s.sid); }
}
