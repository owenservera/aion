// AION Bus V2 — local executor adapter over the existing ACP v1 relay.
//
//   bus command ─▶ task.approved envelope ─▶ relay.sendEnvelope ─▶ native host
//     host: cwd allowlist check, idempotency dedupe, session/new (lazy), session/prompt
//   ◀─ task.progress (agent_message_chunk text) … ◀─ terminal: prompt.finished /
//      task.cancelled / task.blocked  (envelope-map STOP_REASON_EVENTS)
//
// `relay` is anything with the native transport's shape:
//   sendEnvelope(env) -> Promise<reply>   onMessage(fn) -> unsubscribe   cancel(correlation) -> Promise
// In the extension it is the worker's native transport; in Node it is the
// bridge host run in-process (bridge/src/bus-relay.js). The adapter never
// spawns anything, never chooses a working directory (the GRANT's cwd is
// forwarded and the host refuses it unless allowlisted), and never approves
// an executor permission prompt.
//
// HONESTY RULES
//   - A host ACK is delivery, not execution. `end_turn` is an executor
//     statement, not proof (ENVELOPE-CONTRACT): the report says "executor
//     reported", and nothing here promotes it to PROOF_SUBMITTED.
//   - The native request can time out while the ACP turn keeps running. The
//     subscription stays open; a terminal envelope that arrives later is
//     buffered (in memory) and returned by observe(). A worker restart loses
//     that buffer, and the command honestly stays OUTCOME_UNKNOWN.

import { createEnvelope } from '../../lib/envelope.js';
import { ADAPTER_MANIFEST_SCHEMA, AGENT_KIND, REASON, refuse } from '../contracts.js';

export const ACP_ADAPTER = 'acp';
const TERMINAL_EVENTS = new Set(['task.cancelled', 'task.blocked']);
const MAX_COLLECT_CHARS = 16000;

/** Host refusals that happen BEFORE the envelope is stored or a prompt starts. */
const HOST_NO_SEND = new Set(['cwd_not_allowed', 'invalid_envelope', 'invalid_command', 'unknown_command', 'origin_not_allowed', 'origin_missing']);

function isTerminal(env) {
  if (TERMINAL_EVENTS.has(env.event_type)) return true;
  return env.event_type === 'task.progress' && env.payload?.stage === 'prompt.finished';
}

export function createAcpExecutorAdapter({ relay, name = ACP_ADAPTER, provider = 'opencode-acp-v1', maxTextChars = 8000,
  liveVerified = false, producerNode = 'node-ext-bus' } = {}) {
  const manifest = Object.freeze({
    schema: ADAPTER_MANIFEST_SCHEMA, name, version: '1.0.0', kind: AGENT_KIND.EXECUTOR, provider,
    capabilities: Object.freeze({ deliver: true, observe: true, cancel: true, report_target: false,
      max_text_chars: maxTextChars, concurrency: 1, durable_readback: false, live_verified: liveVerified }),
  });
  /** correlation -> { chunks, chars, terminal, stop_reason, sessionId, unsubscribe } */
  const turns = new Map();

  function track(correlationId) {
    const turn = { chunks: [], chars: 0, terminal: null, stop_reason: null, session: null, unsubscribe: null };
    if (relay && typeof relay.onMessage === 'function') {
      turn.unsubscribe = relay.onMessage((env) => {
        if (!env || typeof env !== 'object' || env.correlation_id !== correlationId) return;
        const p = env.payload ?? {};
        if (typeof p.acp_session_id === 'string') turn.session = p.acp_session_id;
        if (env.event_type === 'task.progress' && p.kind === 'agent_message_chunk' && typeof p.text === 'string' && turn.chars < MAX_COLLECT_CHARS) {
          turn.chunks.push(p.text); turn.chars += p.text.length;
        }
        if (isTerminal(env) && !turn.terminal) {
          turn.terminal = env.event_type;
          turn.stop_reason = typeof p.stop_reason === 'string' ? p.stop_reason : (env.event_type === 'task.cancelled' ? 'cancelled' : 'unknown');
          try { turn.unsubscribe?.(); } catch { /* already gone */ }
        }
      });
    }
    turns.set(correlationId, turn);
    if (turns.size > 64) { const [oldest] = turns.keys(); turns.get(oldest)?.unsubscribe?.(); turns.delete(oldest); }
    return turn;
  }

  function finished(turn) {
    const text = turn.chunks.join('').slice(0, MAX_COLLECT_CHARS).trim();
    const tail = `[executor reported stop_reason=${turn.stop_reason}; an executor statement, not verified proof]`;
    return { outcome: 'reply', reply: text ? `${text}\n${tail}` : tail,
      evidence: { stop_reason: turn.stop_reason, terminal_event: turn.terminal, session: turn.session ? 'present' : null } };
  }

  return {
    manifest,
    canonicalRef(ref) {
      const v = String(ref ?? '').trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9._@-]{0,63}$/.test(v)) refuse(REASON.BAD_VALUE, 'executor ref must be a short executor id, e.g. "opencode"');
      return v;
    },
    async deliver(req) {
      if (!relay || typeof relay.sendEnvelope !== 'function') return { outcome: 'not_sent', reason: REASON.NO_ADAPTER, detail: 'no native relay in this context' };
      const prompt = `${req.text}\n\n(AION bus command ${req.command_id}, correlation ${req.correlation_id})`;
      const env = createEnvelope({
        producer_node: producerNode, target_node: 'node-native-01', target_role: req.agent?.agent_id ?? null,
        event_type: 'task.approved', task_state: 'APPROVED', delivery_state: 'OUTBOX',
        correlation_id: req.correlation_id, causation_id: null, idempotency_key: `bus:${req.command_id}`,
        approved_scope_ref: `bus:${req.grant.grant_id}`, expires_at: null, payload_ref: null, payload_hash: null,
        payload: { text: prompt, ...(req.grant.cwd ? { cwd: req.grant.cwd } : {}), origin: 'aion-bus', command_id: req.command_id },
      });
      const turn = track(req.correlation_id);
      let reply;
      try {
        reply = await relay.sendEnvelope(env);
      } catch (error) {
        const msg = String(error?.message ?? error);
        // The transport rejects a host `relay.error` as "<code>: <message>".
        const hostCode = /^([a-z_]+): /.exec(msg)?.[1] ?? null;
        if (HOST_NO_SEND.has(hostCode)) {
          turn.unsubscribe?.(); turns.delete(req.correlation_id);
          return { outcome: 'not_sent', reason: hostCode === 'cwd_not_allowed' ? REASON.GRANT_SCOPE : REASON.TARGET_REFUSED, detail: msg.slice(0, 200) };
        }
        if (/busy|in.?flight|already active|one active prompt/i.test(msg)) {
          return turn.terminal ? finished(turn) : { outcome: 'unknown', reason: REASON.EXECUTOR_BUSY, detail: msg.slice(0, 200) };
        }
        // Refused before anything was posted: positive no-send.
        if (error?.code === 'invalid_outbound_envelope' || /native host unavailable|failed to post/.test(msg)) {
          turn.unsubscribe?.(); turns.delete(req.correlation_id);
          return { outcome: 'not_sent', reason: REASON.TRANSPORT_LOST, detail: msg.slice(0, 200) };
        }
        // Timed out or dropped AFTER posting: the prompt may be running.
        return turn.terminal ? finished(turn) : { outcome: 'unknown', reason: /timed out/.test(msg) ? REASON.TIMEOUT : REASON.TRANSPORT_LOST, detail: msg.slice(0, 200) };
      }
      if (reply?.replayed === true) return { outcome: 'unknown', reason: REASON.NONCE_REPLAYED, detail: 'host deduplicated this idempotency key; not executed again' };
      if (reply?.ok !== true) {
        const code = reply?.host?.code ?? reply?.code ?? null;
        if (HOST_NO_SEND.has(code)) { turn.unsubscribe?.(); turns.delete(req.correlation_id); return { outcome: 'not_sent', reason: code === 'cwd_not_allowed' ? REASON.GRANT_SCOPE : REASON.TARGET_REFUSED, detail: String(code) }; }
        if (/busy|in.?flight|already active/i.test(String(reply?.error ?? reply?.host?.error ?? ''))) {
          return { outcome: 'unknown', reason: REASON.EXECUTOR_BUSY, detail: 'executor reported a prompt already active' };
        }
        return { outcome: 'unknown', reason: REASON.ADAPTER_ERROR, detail: String(code ?? reply?.error ?? 'host error').slice(0, 200) };
      }
      if (typeof reply.stop_reason === 'string' && !turn.terminal) { turn.terminal = 'relay.reply'; turn.stop_reason = reply.stop_reason; }
      return turn.terminal ? finished(turn) : { outcome: 'sent', detail: 'host accepted; executor turn not finished' };
    },
    async observe(req) {
      const turn = turns.get(req.correlation_id);
      if (!turn) return { outcome: 'pending', reason: REASON.OUTCOME_UNKNOWN, detail: 'no in-memory stream for this command (restart?); outcome stays unknown' };
      return turn.terminal ? finished(turn) : { outcome: 'pending' };
    },
    async cancel(req) {
      if (!relay || typeof relay.cancel !== 'function') return { outcome: 'not_sent', reason: REASON.OP_NOT_SUPPORTED };
      try {
        const reply = await relay.cancel(req.cancel_target.correlation_id);
        if (reply?.ok === true) return { outcome: 'reply', reply: `cancel requested for ${req.cancel_target.command_id}; not confirmed until the executor reports stop_reason=cancelled` };
        return { outcome: 'not_sent', reason: REASON.TARGET_REFUSED, detail: String(reply?.code ?? reply?.error ?? 'refused').slice(0, 200) };
      } catch (error) {
        return { outcome: 'unknown', reason: REASON.TRANSPORT_LOST, detail: String(error?.message ?? error).slice(0, 200) };
      }
    },
    /** For tests/diagnostics only. */
    _turns: turns,
  };
}
