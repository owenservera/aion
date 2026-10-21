// Minimal, dependency-free Chrome DevTools Protocol client.
// One browser-level WebSocket; per-target sessions use flatten mode (sessionId on each message).
// Node >= 22 provides a global WebSocket implementation.
import { EventEmitter } from 'node:events';

export class CdpError extends Error {
  constructor(method, error) {
    super(`${method}: ${error?.message ?? 'CDP error'}${error?.data ? ` (${error.data})` : ''}`);
    this.code = error?.code;
    this.method = method;
  }
}

export class CdpSession extends EventEmitter {
  constructor(connection, sessionId, targetInfo) {
    super();
    this.setMaxListeners(100);
    this.connection = connection;
    this.sessionId = sessionId;
    this.targetInfo = targetInfo;
    this.detached = false;
  }
  send(method, params = {}) {
    if (this.detached) return Promise.reject(new CdpError(method, { message: 'session detached' }));
    return this.connection._send(method, params, this.sessionId);
  }
}

export class CdpConnection extends EventEmitter {
  static async connect(wsUrl, { timeoutMs = 10_000 } = {}) {
    assertLoopbackUrl(wsUrl);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`CDP connect timeout: ${wsUrl}`)), timeoutMs);
      ws.addEventListener('open', () => { clearTimeout(t); resolve(); }, { once: true });
      ws.addEventListener('error', (e) => { clearTimeout(t); reject(new Error(`CDP connect failed: ${e?.message ?? wsUrl}`)); }, { once: true });
    });
    return new CdpConnection(ws);
  }

  constructor(ws) {
    super();
    this.setMaxListeners(100);
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.sessions = new Map();
    this.closed = false;
    ws.addEventListener('message', (ev) => this._onMessage(ev.data));
    ws.addEventListener('close', () => this._onClose());
    ws.addEventListener('error', () => {});
  }

  _send(method, params, sessionId) {
    if (this.closed) return Promise.reject(new CdpError(method, { message: 'connection closed' }));
    const id = this.nextId++;
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify(msg));
    });
  }

  send(method, params = {}) { return this._send(method, params, undefined); }

  _onMessage(data) {
    const text = typeof data === 'string' ? data : Buffer.from(data).toString('utf8');
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    if (msg.id !== undefined) {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new CdpError(p.method, msg.error));
      else p.resolve(msg.result ?? {});
      return;
    }
    if (msg.method === 'Target.attachedToTarget') {
      const { sessionId, targetInfo } = msg.params;
      if (!this.sessions.has(sessionId)) this.sessions.set(sessionId, new CdpSession(this, sessionId, targetInfo));
    }
    if (msg.method === 'Target.detachedFromTarget') {
      const s = this.sessions.get(msg.params.sessionId);
      if (s) { s.detached = true; this.sessions.delete(msg.params.sessionId); s.emit('detached', msg.params); }
    }
    const target = msg.sessionId ? this.sessions.get(msg.sessionId) : this;
    if (target) {
      target.emit(msg.method, msg.params ?? {});
      target.emit('*', msg.method, msg.params ?? {});
    }
    // Child-session attach events are delivered to the parent session; expose them globally too.
    if (msg.sessionId && msg.method === 'Target.attachedToTarget') this.emit('child-attached', msg.params, msg.sessionId);
  }

  _onClose() {
    this.closed = true;
    for (const [, p] of this.pending) p.reject(new CdpError(p.method, { message: 'connection closed' }));
    this.pending.clear();
    for (const s of this.sessions.values()) { s.detached = true; s.emit('detached', { reason: 'connection closed' }); }
    this.sessions.clear();
    this.emit('close');
  }

  async attach(targetId) {
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    let s = this.sessions.get(sessionId);
    if (!s) { s = new CdpSession(this, sessionId, { targetId }); this.sessions.set(sessionId, s); }
    return s;
  }

  session(sessionId) { return this.sessions.get(sessionId); }

  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

// Remote debugging must never be reached over a non-loopback interface.
export function assertLoopbackUrl(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    throw new Error(`Refusing non-loopback DevTools endpoint: ${host}. Bind Chrome with --remote-debugging-address=127.0.0.1.`);
  }
}
