// FAKE non-ChatGPT browser-chat provider ("example-chat"). PORTABILITY PROOF
// ONLY: it shows the bus core runs unchanged against a provider with a
// different URL scheme, framing and correlation check. It is not a live pilot
// and never touches a browser.
//
// Each room has a scripted behaviour:
//   reply      answers immediately with a correlated reply
//   pending    accepts; the reply appears on the next observe()
//   never      accepts; never answers
//   refuse     positively refuses before submitting (not_sent)
//   throw      throws after the call began (must be read as unknown)
//   foreign    answers with ANOTHER correlation id (must be rejected)
//   partial    answers without the reply token (must be rejected)
//   ambiguous  times out without knowing if it landed (unknown)
import { ADAPTER_MANIFEST_SCHEMA } from '../../src/bus/contracts.js';

export function createExampleChat({ responder = (text, room) => `${room} received ${text.length} chars` } = {}) {
  const rooms = new Map();
  const delivered = []; // every submission that reached a room, for duplicate checks
  const room = (ref) => {
    if (!rooms.has(ref)) rooms.set(ref, { behaviour: 'reply', inbox: [], pendingReply: null });
    return rooms.get(ref);
  };
  const manifest = {
    schema: ADAPTER_MANIFEST_SCHEMA, name: 'example-chat', version: '0.0.1-fixture', kind: 'conversation', provider: 'example-chat (fake)',
    capabilities: { deliver: true, observe: true, cancel: false, report_target: true, max_text_chars: 1500, concurrency: 1,
      durable_readback: false, live_verified: false },
  };
  function canonicalRef(ref) {
    const m = /^example:\/\/room\/([a-z0-9-]{1,40})\/?$/.exec(String(ref).trim().toLowerCase());
    if (!m) throw Object.assign(new Error('bad_value: not an example-chat room'), { code: 'bad_value' });
    return `example://room/${m[1]}`;
  }
  // Provider-specific framing: a different envelope than ChatGPT's, same contract.
  const frame = (req) => `<<${req.correlation_id}>> ${req.text} <<reply-with:${req.reply_token}>>`;
  const answer = (req, ref) => `${req.correlation_id}\n${responder(req.text, ref, req)}\n${req.reply_token}`;
  function check(reply, req) {
    const lines = reply.split('\n');
    if (lines[0] !== req.correlation_id) return { outcome: 'unknown', reason: 'reply_rejected', detail: 'foreign correlation' };
    if (lines[lines.length - 1] !== req.reply_token) return { outcome: 'unknown', reason: 'reply_partial', detail: 'reply token missing' };
    return { outcome: 'reply', reply: lines.slice(1, -1).join('\n') };
  }
  return {
    manifest, canonicalRef, rooms, delivered,
    setBehaviour(ref, behaviour) { room(canonicalRef(ref)).behaviour = behaviour; },
    async deliver(req) {
      const ref = canonicalRef(req.binding.ref);
      const r = room(ref);
      if (r.behaviour === 'refuse') return { outcome: 'not_sent', reason: 'target_refused_no_send', detail: 'room closed' };
      delivered.push({ ref, correlation_id: req.correlation_id, framed: frame(req) });
      r.inbox.push(frame(req));
      switch (r.behaviour) {
        case 'reply': return check(answer(req, ref), req);
        case 'pending': r.pendingReply = answer(req, ref); return { outcome: 'sent', detail: 'accepted' };
        case 'never': return { outcome: 'sent', detail: 'accepted' };
        case 'throw': throw new Error('socket reset mid-send');
        case 'foreign': return check(`AION-BUS-20261019-someoneelse\nhijack\n${req.reply_token}`, req);
        case 'partial': return check(`${req.correlation_id}\nhalf an answer`, req);
        case 'ambiguous': return { outcome: 'unknown', reason: 'timeout', detail: 'no acknowledgement' };
        default: return { outcome: 'unknown' };
      }
    },
    async observe(req) {
      const r = room(canonicalRef(req.binding.ref));
      if (r.pendingReply && r.pendingReply.startsWith(req.correlation_id)) {
        const reply = r.pendingReply; r.pendingReply = null;
        return check(reply, req);
      }
      return { outcome: 'pending' };
    },
  };
}
