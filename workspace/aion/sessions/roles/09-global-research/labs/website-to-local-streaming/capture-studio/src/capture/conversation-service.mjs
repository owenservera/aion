/**
 * Lifecycle foundation. Browser implementation and cross-process lease are runtime responsibilities.
 * One service instance owns one conversation; callers MUST NOT open the same snapshot twice.
 * A shared browser/CLI lease is required before live use. Cancellation is deliberately deferred.
 *
 * Injected adapter contract (all async; no retries, fallback sends or implicit navigation):
 * connect(binding) -> { binding, sessionId }; attaches/arms capture on that exact target only.
 * preflight(binding) -> { binding, draft:{present,chars}, boundary:{sequence,transcriptCount} };
 *   read-only, current composer/binding check immediately before type; never clears a draft.
 * type({binding,turnId,prompt}) -> void; types once, never submits or clears existing content.
 * submit({binding,turnId,payloadDigest}) -> observation|null; ONE send action, never types.
 * reconcile({binding,turnId,payloadDigest,boundary}) -> observation|null; strictly read-only.
 * stop({binding,sessionId}) -> void; resolves only after capture stop/flush succeeds.
 * closeTab(binding) -> void; closes precisely the Studio-owned bound target.
 *
 * Observation: { binding, evidence:{turnId,payloadDigest,sessionId,sequence,kind,source} }.
 * kind='outgoing-request'/'new-user-turn'; source='network'/'page' respectively. Evidence must
 * be attributable to THIS attempt, with sequence > persisted pre-typing boundary; timestamps,
 * old DOM, user assertions and arbitrary response-stream text are not submission evidence.
 * The adapter is a trusted evidence boundary, not a user-supplied observation API. A real adapter
 * must prove this correlation from durable capture records, not manufacture it from timing.
 * The attempt journal has no prompt/reply bodies; recordReply stores protected local reply data.
 * This is not reply assembly or acceptance. Runtime list/history must strip reply bodies.
 */
import * as fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const now = () => new Date().toISOString();
const error = (code) => Object.assign(new Error(code), { code });
const exactBinding = (a, b) => a?.targetId === b?.targetId && a?.origin === b?.origin;
const phases = ['preparing', 'dispatching', 'observed', 'uncertain', 'needs-reconciliation', 'blocked'];

function validSnapshot(s, id) {
  if (!s || s.version !== 1 || s.id !== id || !Number.isSafeInteger(s.revision) || s.revision < 0
    || !['disconnected', 'attaching', 'ready', 'busy', 'blocked', 'needs-reconciliation', 'finalizing', 'closed'].includes(s.state)
    || !Array.isArray(s.attempts) || s.attempts.length > 50 || !Array.isArray(s.assertions)
    || !s.finish || typeof s.finish.requested !== 'boolean'
    || !['idle', 'stopping', 'stopped', 'closing', 'done', 'failed', 'interrupted'].includes(s.finish.phase)
    || s.finish.requested !== (s.finish.phase !== 'idle')
    || !(s.sessionId === null || typeof s.sessionId === 'string' && s.sessionId.length > 0)
    || !(s.uncertainty === null || typeof s.uncertainty === 'string')
    || !Number.isFinite(Date.parse(s.createdAt)) || !Number.isFinite(Date.parse(s.updatedAt))) return false;
  if (s.binding && (typeof s.binding.targetId !== 'string' || !s.binding.targetId || typeof s.binding.origin !== 'string' || typeof s.binding.ownedByStudio !== 'boolean')) return false;
  if (s.binding) {
    try { const url = new URL(s.binding.origin); if (url.origin !== s.binding.origin || url.protocol !== 'https:') return false; } catch { return false; }
  }
  if (s.state !== 'disconnected' && !s.binding) return false;
  // A deliberate resend (new key) after an unobserved attempt is allowed, so several attempts may exist; only one may be observed.
  if (s.attempts.filter((a) => a?.send?.state === 'observed').length > 1) return false;
  return s.attempts.every((a) => typeof a.key === 'string' && a.key.length > 0 && typeof a.id === 'string'
    && /^[a-f0-9]{64}$/.test(a.payloadDigest) && phases.includes(a.phase)
    && Number.isFinite(Date.parse(a.createdAt)) && Number.isFinite(Date.parse(a.updatedAt))
    && ['not-attempted', 'submitting', 'observed', 'uncertain'].includes(a.send?.state)
    && (a.boundary === null || Number.isSafeInteger(a.boundary?.sequence) && a.boundary.sequence >= 0 && Number.isSafeInteger(a.boundary?.transcriptCount) && a.boundary.transcriptCount >= 0));
}

export function createConversationService({ dataDir, id = randomUUID(), adapter, io = fs, context = {}, recover = true } = {}) {
  if (!/^[a-z0-9][a-z0-9_-]{0,127}$/i.test(id)) throw error('INVALID_CONVERSATION_ID');
  if (!adapter) throw error('ADAPTER_REQUIRED');
  const file = path.join(dataDir, `${id}.conversation.json`);
  let snapshot, existed = false;
  try { const raw = io.readFileSync(file, 'utf8'); existed = true; snapshot = JSON.parse(raw); }
  catch (e) { if (e.code !== 'ENOENT') throw error('CORRUPT_OR_UNREADABLE_SNAPSHOT'); }
  if (existed && !validSnapshot(snapshot, id)) throw error('CORRUPT_OR_UNREADABLE_SNAPSHOT');
  // JSON null is existing corrupt state, not a missing file.
  if (snapshot === null) throw error('CORRUPT_OR_UNREADABLE_SNAPSHOT');
  snapshot ??= { version: 1, id, revision: 0, state: 'disconnected', binding: null, sessionId: null,
    attempts: [], assertions: [], uncertainty: null, finish: { requested: false, phase: 'idle', error: null }, createdAt: now(), updatedAt: now() };
  snapshot.site ??= context.site ?? null;
  snapshot.owner ??= context.owner ?? null;
  snapshot.reply ??= { state: 'unknown', source: 'page', text: '', chars: 0, completion: 'unknown' };
  snapshot.capture ??= { state: 'incomplete', integrity: null, ...context.capture };
  snapshot.limitations ??= ['Page observations are not network completion or full capture acceptance', 'Cancellation is deferred'];
  snapshot.readiness ??= { ready: false, draft: { present: null, chars: null }, reason: 'NOT_CHECKED' };
  let poisoned = false, chain = Promise.resolve(), finishPromise = null;
  let submissionStopped = false;
  const view = () => structuredClone(snapshot);
  const serial = (fn) => { const result = chain.then(() => { if (poisoned) throw error('PERSISTENCE_FAILED_REOPEN_REQUIRED'); return fn(); }); chain = result.catch(() => {}); return result; };
  // Flush the entire replacement before rename, then sync the named final file explicitly.
  // Directory fsync is not portable on Windows; cross-process/durable-host guarantees are not claimed.
  function save() {
    snapshot.revision++; snapshot.updatedAt = now();
    const tmp = `${file}.${randomUUID()}.tmp`;
    let fd;
    try {
      io.mkdirSync(dataDir, { recursive: true });
      fd = io.openSync(tmp, 'wx', 0o600);
      io.writeFileSync(fd, `${JSON.stringify(snapshot, null, 2)}\n`);
      io.fsyncSync(fd); io.closeSync(fd); fd = undefined;
      io.renameSync(tmp, file);
      fd = io.openSync(file, 'r+'); io.fsyncSync(fd); io.closeSync(fd); fd = undefined;
    } catch {
      poisoned = true;
      throw error('PERSISTENCE_FAILED_REOPEN_REQUIRED');
    } finally {
      if (fd !== undefined) { try { io.closeSync(fd); } catch {} }
      try { io.unlinkSync(tmp); } catch {}
    }
  }
  function revision(expected) { if (expected !== snapshot.revision) throw error('STALE_REVISION'); }
  function writable() { if (snapshot.finish.requested) throw error('CONVERSATION_FINISHED'); }
  function updateAttempt(a, phase, send) { a.phase = phase; a.send.state = send; a.updatedAt = now(); }
  function observe(a, observation) {
    const e = observation?.evidence;
    if (!a || !a.boundary || !exactBinding(snapshot.binding, observation?.binding)
      || e?.turnId !== a.id || e?.payloadDigest !== a.payloadDigest || e?.sessionId !== snapshot.sessionId
      || !Number.isSafeInteger(e?.sequence) || e.sequence <= a.boundary.sequence
      || !(e.kind === 'outgoing-request' && e.source === 'network' || e.kind === 'new-user-turn' && e.source === 'page')) return false;
    // A preparing attempt never dispatched; unrelated records cannot turn it into a send.
    if (!['dispatching', 'uncertain', 'observed'].includes(a.phase)) return false;
    updateAttempt(a, 'observed', 'observed');
    a.send.observationSource = e.source;
    a.send.evidence = { sessionId: e.sessionId, sequence: e.sequence, kind: e.kind };
    snapshot.uncertainty = null;
    if (!snapshot.finish.requested) snapshot.state = 'ready';
    return true;
  }
  const interrupted = snapshot.attempts.at(-1);
  let recovered = false;
  if (recover && context.restarted && !snapshot.finish.requested && snapshot.state !== 'disconnected') {
    snapshot.state = 'needs-reconciliation'; snapshot.capture.state = 'incomplete';
    snapshot.uncertainty ??= 'runtime-restarted'; recovered = true;
  }
  if (recover && !snapshot.sessionId && context.recoveredSessionId) {
    snapshot.sessionId = context.recoveredSessionId; snapshot.capture.state = 'incomplete';
    snapshot.uncertainty = 'attachment-interrupted'; snapshot.state = 'needs-reconciliation'; recovered = true;
  }
  if (recover && interrupted?.phase === 'preparing') {
    updateAttempt(interrupted, 'needs-reconciliation', 'not-attempted');
    snapshot.uncertainty = 'partial-draft-possible'; snapshot.state = 'needs-reconciliation'; recovered = true;
  } else if (recover && interrupted?.phase === 'dispatching') {
    updateAttempt(interrupted, 'uncertain', 'uncertain');
    snapshot.uncertainty = 'send-acknowledgement-lost'; snapshot.state = 'needs-reconciliation'; recovered = true;
  }
  if (recover && ['stopping', 'stopped', 'closing'].includes(snapshot.finish.phase)) {
    snapshot.finish.phase = 'interrupted'; snapshot.finish.error = 'Finalization interrupted; no automatic stop or close replay';
    snapshot.state = 'needs-reconciliation'; recovered = true;
  } else if (recover && snapshot.state === 'attaching') {
    snapshot.state = 'needs-reconciliation'; snapshot.uncertainty = 'attachment-interrupted'; recovered = true;
  }
  if (recovered) save();

  return {
    id, file,
    // Local snapshots only, with no browser/adapter calls. A clone prevents caller mutation.
    read: () => view(),
    stopSubmission() { submissionStopped = true; },
    connect({ targetId, origin, ownedByStudio = false, expectedRevision } = {}) {
      return serial(async () => {
        writable(); revision(expectedRevision);
        if (snapshot.state !== 'disconnected') throw error('ALREADY_CONNECTED');
        let parsed; try { parsed = new URL(origin); } catch { throw error('INVALID_BINDING'); }
        if (typeof targetId !== 'string' || !targetId || parsed.origin !== origin || parsed.protocol !== 'https:' || typeof ownedByStudio !== 'boolean') throw error('INVALID_BINDING');
        snapshot.binding = { targetId, origin, ownedByStudio }; snapshot.state = 'attaching'; save();
        let attached;
        try { attached = await adapter.connect(structuredClone(snapshot.binding), {
          bind(binding) {
            if (binding.origin !== origin || binding.ownedByStudio !== ownedByStudio || typeof binding.targetId !== 'string' || !binding.targetId) throw error('INVALID_ATTACHMENT');
            snapshot.binding = structuredClone(binding); save();
          },
          ownSession(sessionId) {
            if (typeof sessionId !== 'string' || !sessionId) throw error('INVALID_ATTACHMENT');
            snapshot.sessionId = sessionId; snapshot.capture.state = 'recording'; save();
          },
        }); }
        catch (e) {
          // Keep only a coded reason (never transport/URL/content text) so the failure is diagnosable.
          snapshot.readiness = { ready: false, draft: { present: null, chars: null }, reason: /^[A-Z][A-Z0-9_]{0,79}$/.test(e?.code ?? '') ? e.code : 'ATTACH_FAILED' };
          snapshot.state = 'needs-reconciliation'; snapshot.uncertainty = 'attachment-failed'; save(); throw error('ATTACHMENT_FAILED');
        }
        if (!exactBinding(snapshot.binding, attached?.binding) || attached.binding.ownedByStudio !== ownedByStudio || typeof attached?.sessionId !== 'string' || !attached.sessionId) {
          snapshot.state = 'needs-reconciliation'; snapshot.uncertainty = 'attachment-binding-mismatch'; save(); throw error('INVALID_ATTACHMENT');
        }
        snapshot.sessionId = attached.sessionId; snapshot.capture.state = 'recording';
        snapshot.readiness = attached.readiness ?? { ready: true, draft: { present: false, chars: 0 }, reason: null };
        snapshot.state = snapshot.readiness.ready ? 'ready' : 'blocked'; save(); return view();
      });
    },
    submit({ key, prompt, expectedRevision, confirm } = {}, { registered } = {}) {
      return serial(async () => {
        if (typeof key !== 'string' || !key || key.length > 200 || typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2000) throw error('INVALID_SUBMISSION');
        const payloadDigest = createHash('sha256').update(prompt, 'utf8').digest('hex');
        const original = snapshot.attempts.find((a) => a.key === key);
        // Same key replays the original turn read-only, even after finish/restart; only NEW sends need a writable conversation.
        if (original) { if (original.payloadDigest !== payloadDigest) throw error('IDEMPOTENCY_CONFLICT'); registered?.(view()); return structuredClone(original); }
        writable();
        revision(expectedRevision);
        if (confirm !== true) throw error('CONFIRM_REQUIRED');
        // A new idempotency key is NOT authorization to repeat a potentially
        // dispatched action. Unknown delivery and partial draft remain blocked
        // even if a later read-only reconciliation sees no matching page turn.
        // A proven pre-typing rejection ('blocked' without typing) remains
        // eligible for one fresh attempt after the user clears the draft.
        const spent = snapshot.attempts.some((a) => a.phase !== 'blocked' || !!a.typingStartedAt);
        if (spent || snapshot.attempts.length >= 50) throw error('ONE_TURN_LIMIT');
        if (!['ready', 'blocked'].includes(snapshot.state)) throw error('NOT_READY');
        const attempt = { id: randomUUID(), key, payloadDigest, phase: 'preparing', createdAt: now(), updatedAt: now(),
          boundary: null, send: { state: 'not-attempted', observationSource: null }, reply: { state: 'unknown' }, evidence: { state: 'recording' } };
        snapshot.attempts.push(attempt); snapshot.state = 'busy'; save();
        registered?.(view());
        const stopped = () => {
          if (!submissionStopped) return false;
          snapshot.state = 'needs-reconciliation'; snapshot.uncertainty = attempt.typingStartedAt ? 'partial-draft-possible' : null;
          attempt.reason = 'SUBMISSION_STOPPED'; updateAttempt(attempt, 'needs-reconciliation', 'not-attempted'); save(); return true;
        };
        if (stopped()) return structuredClone(attempt);
        let preflight;
        try { preflight = await adapter.preflight(structuredClone(snapshot.binding)); }
        catch (e) {
          attempt.reason = /^[A-Z][A-Z0-9_]{0,79}$/.test(e.code ?? '') ? e.code : 'PREFLIGHT_FAILED';
          snapshot.readiness = { ready: false, draft: { present: null, chars: null }, reason: attempt.reason };
          snapshot.state = 'blocked'; updateAttempt(attempt, 'blocked', 'not-attempted'); save(); throw error('PREFLIGHT_FAILED');
        }
        snapshot.readiness = { ready: preflight?.draft?.present === false && preflight?.draft?.chars === 0,
          draft: { present: preflight?.draft?.present ?? null, chars: preflight?.draft?.chars ?? null }, reason: null };
        if (!exactBinding(snapshot.binding, preflight?.binding) || preflight?.draft?.present !== false || preflight?.draft?.chars !== 0
          || !Number.isSafeInteger(preflight?.boundary?.sequence) || preflight.boundary.sequence < 0
          || !Number.isSafeInteger(preflight?.boundary?.transcriptCount) || preflight.boundary.transcriptCount < 0) {
          attempt.reason = exactBinding(snapshot.binding, preflight?.binding) && preflight?.draft?.present ? 'DRAFT_PRESENT' : 'DRAFT_OR_BINDING_NOT_READY';
          snapshot.readiness.ready = false; snapshot.readiness.reason = attempt.reason;
          snapshot.state = 'blocked'; updateAttempt(attempt, 'blocked', 'not-attempted'); save(); throw error('DRAFT_OR_BINDING_NOT_READY');
        }
        if (stopped()) return structuredClone(attempt);
        attempt.boundary = { sequence: preflight.boundary.sequence, transcriptCount: preflight.boundary.transcriptCount }; save();
        attempt.typingStartedAt = now(); save();
        try { await adapter.type({ binding: structuredClone(snapshot.binding), turnId: attempt.id, prompt }); }
        catch { snapshot.state = 'needs-reconciliation'; snapshot.uncertainty = 'partial-draft-possible'; updateAttempt(attempt, 'needs-reconciliation', 'not-attempted'); save(); throw error('TYPING_INTERRUPTED'); }
        if (stopped()) return structuredClone(attempt);
        updateAttempt(attempt, 'dispatching', 'submitting'); save();
        let observation;
        try { observation = await adapter.submit({ binding: structuredClone(snapshot.binding), turnId: attempt.id, payloadDigest }); }
        catch (e) {
          if (e.notDispatched === true && /^[A-Z][A-Z0-9_]{0,79}$/.test(e.code ?? '')) {
            // Adapter proved nothing was dispatched (stop latch or sendMessage refusal): never 'uncertain'.
            snapshot.state = 'needs-reconciliation'; snapshot.uncertainty = 'partial-draft-possible'; attempt.reason = e.code;
            updateAttempt(attempt, 'needs-reconciliation', 'not-attempted'); save(); return structuredClone(attempt);
          }
          /* Unknown effect: never retry, even if the transport claims the send failed. */
        }
        if (!observe(attempt, observation)) {
          updateAttempt(attempt, 'uncertain', 'uncertain'); snapshot.uncertainty = 'send-acknowledgement-lost'; snapshot.state = 'needs-reconciliation';
        }
        save(); return structuredClone(attempt);
      });
    },
    reconcile({ expectedRevision, assertion } = {}) {
      return serial(async () => {
        revision(expectedRevision);
        if (assertion !== undefined) {
          if (typeof assertion !== 'boolean') throw error('INVALID_ASSERTION');
          snapshot.assertions.push({ provenance: 'user-asserted', sent: assertion, at: now() });
          snapshot.assertions = snapshot.assertions.slice(-20);
        }
        const attempt = snapshot.attempts.at(-1);
        if (!snapshot.sessionId) { save(); return view(); }
        // A pre-typing rejection is not a send attempt. "Check again" only refreshes current
        // readiness; the original blocked key remains blocked/idempotent, and a new key is needed.
        if (!snapshot.finish.requested && (!attempt || attempt.phase === 'blocked' && !attempt.typingStartedAt)) {
          save(); // Fail closed before the read-only browser inspection, as on the observation path.
          let preflight;
          try { preflight = await adapter.preflight(structuredClone(snapshot.binding)); }
          catch (e) {
            snapshot.readiness = { ready: false, draft: { present: null, chars: null },
              reason: /^[A-Z][A-Z0-9_]{0,79}$/.test(e.code ?? '') ? e.code : 'PREFLIGHT_FAILED' };
            snapshot.state = 'blocked'; save(); return view();
          }
          const bound = exactBinding(snapshot.binding, preflight?.binding);
          const validDraft = typeof preflight?.draft?.present === 'boolean' && Number.isSafeInteger(preflight?.draft?.chars)
            && preflight.draft.chars >= 0 && preflight.draft.present === (preflight.draft.chars > 0);
          const validBoundary = Number.isSafeInteger(preflight?.boundary?.sequence) && preflight.boundary.sequence >= 0
            && Number.isSafeInteger(preflight?.boundary?.transcriptCount) && preflight.boundary.transcriptCount >= 0;
          const ready = bound && validDraft && validBoundary && !preflight.draft.present;
          snapshot.readiness = { ready, draft: validDraft ? { present: preflight.draft.present, chars: preflight.draft.chars } : { present: null, chars: null },
            reason: ready ? null : !bound ? 'BINDING_CHANGED' : !validDraft || !validBoundary ? 'DRAFT_OR_BINDING_NOT_READY' : 'DRAFT_PRESENT' };
          snapshot.state = ready ? 'ready' : 'blocked'; save(); return view();
        }
        if (!attempt) { save(); return view(); }
        // Persist assertion/inspection intent before asking the trusted read-only adapter.
        save();
        let observation;
        try { observation = await adapter.reconcile({ binding: structuredClone(snapshot.binding), turnId: attempt.id, payloadDigest: attempt.payloadDigest, boundary: structuredClone(attempt.boundary) }); }
        catch { throw error('RECONCILIATION_UNAVAILABLE'); }
        observe(attempt, observation); save(); return view();
      });
    },
    recordReply(reply) {
      return serial(() => {
        snapshot.reply = { state: reply.state, source: 'page', text: String(reply.text ?? ''), chars: String(reply.text ?? '').length, completion: 'unknown' };
        save(); return view();
      });
    },
    addLimitation(text) {
      return serial(() => {
        const value = String(text ?? '').slice(0, 300);
        if (value && !snapshot.limitations.includes(value)) { snapshot.limitations = [...snapshot.limitations, value].slice(-20); save(); }
        return view();
      });
    },
    recordCapture(capture) {
      return serial(() => { snapshot.capture = { ...snapshot.capture, ...capture }; save(); return view(); });
    },
    finish({ closeTab = false } = {}) {
      submissionStopped = true;
      if (finishPromise) return finishPromise;
      finishPromise = serial(async () => {
        if (snapshot.finish.requested) return view(); // Restart: no replay of stop/close.
        snapshot.finish = { requested: true, phase: 'stopping', error: null }; snapshot.state = 'finalizing'; save();
        if (snapshot.sessionId) {
          try { await adapter.stop({ binding: structuredClone(snapshot.binding), sessionId: snapshot.sessionId }); }
          catch { snapshot.finish.phase = 'failed'; snapshot.finish.error = 'CAPTURE_STOP_FAILED'; snapshot.capture.state = 'incomplete'; snapshot.state = 'needs-reconciliation'; save(); return view(); }
        }
        snapshot.finish.phase = 'stopped';
        snapshot.finish.captureStopped = true;
        snapshot.capture.state = 'incomplete';
        for (const a of snapshot.attempts) a.evidence.state = 'incomplete';
        save();
        if (closeTab === true && snapshot.binding?.ownedByStudio && !snapshot.uncertainty && snapshot.sessionId) {
          snapshot.finish.phase = 'closing'; save();
          try { await adapter.closeTab(structuredClone(snapshot.binding)); }
          catch { snapshot.finish.phase = 'failed'; snapshot.finish.error = 'TAB_CLOSE_UNCONFIRMED'; snapshot.state = 'needs-reconciliation'; save(); return view(); }
        }
        snapshot.finish.phase = 'done'; snapshot.state = 'closed'; save(); return view();
      });
      return finishPromise;
    },
  };
}
