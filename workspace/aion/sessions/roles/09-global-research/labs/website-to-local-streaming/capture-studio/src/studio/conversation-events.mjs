// Incremental conversation state events for harness clients, over the studio's existing
// EventFeed SSE contract (epoch:sequence delivery cursors, bounded process-local replay,
// reset on cursor loss, heartbeats, slow-client disconnect).
//
// This is a DERIVED read-model, deliberately: a bounded diff pump re-reads the runtime's own
// conversation views and publishes one `conversation.changed` event per observed change. There
// is no second state store to diverge, no browser logic, and no new write path — the durable
// truth stays the conversation snapshot + thread-turn journal. The snapshot revision carried in
// every event is the durable state cursor; the SSE `id:` is only a delivery cursor.
//
// Reconnect contract (no blind replay): a client reconnects with Last-Event-ID / after and is
// replayed the retained window exactly once; if the cursor predates the retained window or the
// server restarted (epoch change), the client receives a `reset` event and re-reads state with
// an ordinary authenticated conversation GET. Events never instruct a resend; submission stays
// gated by the runtime (journal fence + writer window), so no event can cause a duplicate send.
//
// Privacy: events carry lifecycle metadata only (phases, send/reply states, revisions, writer
// and diagnostic accounting). Prompts and reply text are never included — bodies remain behind
// the authenticated conversation GET/read endpoints, consistent with list() redaction.
import { EventFeed } from './event-feed.mjs';
import { problem } from './http.mjs';

export const CONVERSATION_EVENT_TYPES = ['conversation.changed'];

const turnProjection = (t) => ({ id: t.id, key: t.key, phase: t.phase, reason: t.reason ?? null,
  send: { state: t.send?.state ?? null, observationSource: t.send?.observationSource ?? null },
  reply: { state: t.reply?.state ?? null, completion: t.reply?.completion ?? null,
    revision: t.reply?.evidence?.revision ?? null, identity: t.reply?.evidence?.identity ?? null },
  readiness: t.readiness?.state ?? null, completion: t.completion?.state ?? null });

const projection = (v) => ({ conversationId: v.id, revision: v.revision, state: v.state, site: v.site,
  identity: v.identity ?? null, readiness: v.readiness ?? null,
  writer: { active: v.writer?.active === true, releaseError: v.writer?.releaseError ?? null },
  diagnostic: v.diagnostic ?? null, turns: (v.turns ?? []).map(turnProjection) });

export function createConversationEvents({ runtime, intervalMs = 200, feedOptions = {} } = {}) {
  const feed = new EventFeed({ eventTypes: CONVERSATION_EVENT_TYPES, ...feedOptions });
  const watched = new Map(); // conversation id -> { last: string|null, missing: boolean }
  let timer = null;
  const start = () => { if (timer || watched.size === 0) return; timer = setInterval(() => { pump().catch(() => {}); }, intervalMs); timer.unref?.(); };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  async function pump() {
    for (const [id, state] of watched) {
      let view;
      try { view = await runtime.get(id); }
      catch (e) {
        // A vanished conversation is announced once; transient errors (closing, recovery,
        // corruption) are skipped and retried on the next tick — never guessed around.
        if (e?.status === 404 && !state.missing) { state.missing = true; feed.publish('conversation.changed', { conversationId: id, missing: true }, id); }
        continue;
      }
      state.missing = false;
      const next = JSON.stringify(projection(view));
      if (next === state.last) continue;
      state.last = next;
      feed.publish('conversation.changed', JSON.parse(next), id);
    }
    if (watched.size === 0) stop();
  }
  return {
    feed,
    // Start (or idempotently keep) diffing a conversation. The first observation publishes a
    // baseline event so a fresh subscriber does not have to guess the current state.
    watch(id) {
      if (!watched.has(id)) watched.set(id, { last: null, missing: false });
      start();
    },
    async subscribe(req, res, id, q = {}) {
      if (feed.closed) throw problem(503, 'Conversation event feed is closing');
      try { await runtime.get(id); } // Existence check: never stream an unknown conversation.
      catch (e) { throw e?.status ? e : problem(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND'); }
      this.watch(id);
      // The session filter is forced to this conversation; clients cannot eavesdrop on others.
      return feed.subscribe(req, res, { ...q, session: id }, { status: { conversationId: id, derived: 'conversation snapshot diff; prompt and reply text are never included', durable: false } });
    },
    info() { return { ...feed.info(), watched: [...watched.keys()] }; },
    close() { stop(); feed.close(); },
  };
}
