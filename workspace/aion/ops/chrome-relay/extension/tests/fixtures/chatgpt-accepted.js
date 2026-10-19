// Synthetic fixture matching content.js runTurn/buildEnvelope, using the actual
// correlator/extractor. This models evidence; it is NOT live observation proof.
import { createEnvelope } from '../../src/lib/envelope.js';
import { correlateReply, extractFinalReply } from '../../src/chatgpt/correlate.js';

export function acceptedAdapterReply({ correlationId = 'task-1', token = 'ACK-1', replyText } = {}) {
  const text = replyText ?? `${correlationId}\nfixture answer\n${token}`;
  const extracted = extractFinalReply([{ kind: 'final', role: 'assistant', channel: 'final', text }], { source: 'dom-assistant-turn' });
  const verdict = correlateReply({ reply: extracted.text, expected: { correlation_id: correlationId, reply_token: token },
    outbound_text: 'synthetic outbound', role: 'assistant', channel: 'final', source: 'dom-assistant-turn',
    generation_started: true, generation_complete: true, model: extracted.model });
  if (!verdict.accepted) throw new Error('invalid accepting fixture');
  const timestamp = new Date().toISOString();
  const payload = { schema: verdict.schema, correlation_id: correlationId, accepted: verdict.accepted,
    reason: verdict.reason, detail: verdict.detail, reply_text: verdict.reply, expected_reply: verdict.expected_reply,
    model: extracted.model, generation: { started: true, complete: true, reason: 'accepted', elapsed_ms: 1 },
    extraction: { ok: extracted.ok, reason: extracted.reason, detail: extracted.detail }, observed: verdict.observed,
    source_url: 'https://chatgpt.com/c/fixture', started_at: timestamp, captured_at: timestamp };
  const envelope = createEnvelope({ producer_node: 'node-ext-chatgpt', target_node: 'node-native-01', target_role: null,
    event_type: 'proof.submitted', correlation_id: correlationId, causation_id: null,
    idempotency_key: `chatgpt:${correlationId}`, expires_at: null, approved_scope_ref: null,
    payload_ref: null, payload_hash: null, delivery_state: 'OUTBOX', task_state: 'PROOF_SUBMITTED', payload });
  return { action: 'run-turn', ok: true, verdict, envelope };
}

export function verdictForEnvelope(envelope) {
  const payload = envelope.payload;
  return { schema: payload.schema, accepted: payload.accepted, reason: payload.reason,
    correlation_id: payload.correlation_id, expected_reply: payload.expected_reply,
    reply: payload.reply_text, observed: payload.observed, detail: payload.detail, checked_at: payload.captured_at };
}
