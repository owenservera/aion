// AION Bus V2 — the REAL native host, run in-process, as a relay object.
//
// Node-side bus runners (CLI, MCP ingress) need to reach the same ACP executor
// the extension reaches through Chrome native messaging. Rather than writing a
// second ACP path, this runs `createHost` unchanged over in-memory streams and
// speaks Chrome's framed protocol to it. Every host check still applies: the
// origin gate (pinned extension id), cwd allowlist, idempotency dedupe, lazy
// session creation, secret redaction and agent-loss alerts.
//
// The returned object has the extension transport's relay shape:
//   sendEnvelope(env) -> Promise<reply>   onMessage(fn) -> unsubscribe
//   cancel(correlationId) -> Promise<reply>   ping()  hello()  close()
// A host `relay.error` rejects with "<code>: <message>", exactly like the
// extension's native transport, so adapters classify both the same way.

import { PassThrough } from 'node:stream';
import { validateEnvelope } from '../../extension/src/lib/index.js';
import { createHost, createRedactingLogger } from './host.js';
import { createNativeFrameDecoder, encodeNativeFrame } from './framing.js';

export function createInProcessRelay({ config, spawn, client, logger, requestTimeoutMs = 30_000, clock = globalThis } = {}) {
  if (!config) throw new TypeError('createInProcessRelay requires a validated host config');
  const input = new PassThrough();
  const output = new PassThrough();
  const subscribers = new Set();
  const pending = new Map();
  let nextId = 1;
  let closed = false;

  const host = createHost({
    config, input, output, spawn, client,
    logger: logger ?? createRedactingLogger({ level: 'error', sink: () => {} }),
    // In-process: the caller IS the configured extension identity, so the
    // pinned origin is presented. A config with no pinned id still refuses.
    initialOrigin: config.expectedExtensionId,
  });
  // A refused origin executes nothing; say so now instead of timing out later.
  if (host.state.refused) throw Object.assign(new Error('origin_not_allowed: in-process relay refused by the host origin gate'), { code: 'origin_not_allowed' });

  const decoder = createNativeFrameDecoder({
    onMessage(message) {
      if (!message || typeof message !== 'object') return;
      if (message.type === 'relay.event') {
        if (!validateEnvelope(message.envelope).valid) return;
        for (const fn of [...subscribers]) { try { fn(message.envelope); } catch { /* a subscriber cannot break the relay */ } }
        return;
      }
      const entry = message.id != null ? pending.get(message.id) : undefined;
      if (!entry) return;
      pending.delete(message.id);
      clock.clearTimeout(entry.timer);
      if (message.type === 'relay.error') entry.reject(new Error(`${message.code}: ${message.message}`));
      else entry.resolve(message);
    },
  });
  output.on('data', (chunk) => decoder.push(chunk));

  function request(type, payload = {}) {
    if (closed) return Promise.reject(new Error('native host unavailable: relay closed'));
    return new Promise((resolve, reject) => {
      const id = `b${nextId++}`;
      const timer = clock.setTimeout(() => {
        pending.delete(id);
        reject(new Error(`native request ${type} timed out after ${requestTimeoutMs}ms`));
      }, requestTimeoutMs);
      pending.set(id, { resolve, reject, timer });
      try { input.write(encodeNativeFrame({ ...payload, type, id })); }
      catch (err) { pending.delete(id); clock.clearTimeout(timer); reject(new Error(`failed to post ${type}: ${err?.message ?? err}`)); }
    });
  }

  return {
    host,
    ping: () => request('relay.ping'),
    hello: () => request('relay.hello'),
    async sendEnvelope(envelope) {
      const check = validateEnvelope(envelope);
      if (!check.valid) throw Object.assign(new Error(`refusing to send invalid envelope: ${check.errors.join('; ')}`), { code: 'invalid_outbound_envelope' });
      const reply = await request('relay.send', { envelope });
      return { ...reply, ok: reply.ok === true, transport: 'in-process', execution_confirmed: false, host: reply };
    },
    cancel: (correlationId) => request('relay.cancel', { correlation_id: correlationId }),
    onMessage(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    async close() {
      if (closed) return;
      try { await request('relay.shutdown').catch(() => {}); } finally {
        closed = true;
        for (const [, entry] of pending) { clock.clearTimeout(entry.timer); entry.reject(new Error('native host unavailable: relay closed')); }
        pending.clear();
        input.end();
      }
    },
  };
}
