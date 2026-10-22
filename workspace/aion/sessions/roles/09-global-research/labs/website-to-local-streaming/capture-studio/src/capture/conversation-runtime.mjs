// §15 shared library runtime. Browser effects live in the injected adapter, never GET/list.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { listTargets } from '../cdp/discovery.mjs';
import { getAdapter, ADAPTER_IDS } from '../profiles/sites/index.mjs';
import { listSessions } from '../store/session.mjs';
import { createConversationService } from './conversation-service.mjs';
import { createConversationBrowserAdapter } from './conversation-browser-adapter.mjs';
import { acquireDriveLease } from './drive-lease.mjs';

const fail = (status, code) => Object.assign(new Error(code), { status, code });
function outward(e) {
  if (e.status) return e;
  return Object.assign(e, { status: /INVALID_|CONFIRM_REQUIRED/.test(e.code ?? '') ? 400 : 409 });
}

export function createConversationRuntime({ paths, profileStore, familyStore, port = 9222, dependencies = {} } = {}) {
  const d = { listTargets, getAdapter, createAdapter: createConversationBrowserAdapter, acquireLease: acquireDriveLease,
    listSessions, ownerIsAlive: (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code !== 'ESRCH'; } },
    maxDurationMs: 15 * 60 * 1000, maxBytes: 256 * 1024 * 1024, ...dependencies };
  const directory = path.join(paths.root, 'conversations');
  mkdirSync(directory, { recursive: true });
  const entries = new Map(); let closed = false;
  const active = () => { if (closed) throw fail(503, 'RUNTIME_CLOSED'); };
  const ids = () => readdirSync(directory).filter((n) => n.endsWith('.conversation.json')).map((n) => n.slice(0, -'.conversation.json'.length));
  function load(id) {
    if (!/^[a-z0-9][a-z0-9_-]{0,127}$/i.test(id ?? '')) throw fail(400, 'INVALID_CONVERSATION_ID');
    if (entries.has(id)) return entries.get(id);
    if (!ids().includes(id)) throw fail(404, 'CONVERSATION_NOT_FOUND');
    // No browser/recorder reattachment on restart. Owner metadata repairs the attach/save window
    // without making an interrupted capture appear finalized or replaying any action.
    const owned = d.listSessions(paths.sessions).filter((s) => s.conversationOwner?.conversationId === id);
    let header; try { header = JSON.parse(readFileSync(path.join(directory, `${id}.conversation.json`), 'utf8')); }
    catch { throw fail(409, 'CORRUPT_OR_UNREADABLE_SNAPSHOT'); }
    const pid = owned[0]?.conversationOwner?.pid ?? header?.owner?.pid;
    const readOnly = Number.isInteger(pid) && pid > 0 && d.ownerIsAlive(pid);
    const adapter = { async reconcile() { return null; }, async stop() { throw fail(409, 'RECOVERED_CAPTURE_INCOMPLETE'); } };
    const service = createConversationService({ dataDir: directory, id, adapter, recover: !readOnly, context: { restarted: true, recoveredSessionId: owned[0]?.id } });
    const entry = { service, adapter, recovered: true, readOnly, registration: Promise.resolve(), work: Promise.resolve(), lease: null };
    entries.set(id, entry); return entry;
  }
  function view(entry, summary = false, selectedTurn) {
    const s = entry.service.read(), a = selectedTurn ?? s.attempts.at(-1);
    const reply = { ...s.reply }; if (summary) delete reply.text;
    const capture = { ...s.capture, bytesWritten: entry.recovered ? s.capture.bytesWritten ?? 0 : entry.adapter.bytesWritten ?? 0 };
    capture.limitReason = entry.adapter.limitReason ?? capture.limitReason;
    if (!entry.recovered && entry.adapter.active === false && capture.state === 'recording') capture.state = 'incomplete';
    if (entry.recovered && !entry.readOnly && capture.state === 'recording') capture.state = 'incomplete';
    return { id: s.id, revision: s.revision, state: s.state, site: s.site, binding: s.binding, sessionId: s.sessionId,
      turn: a ? { id: a.id, phase: a.phase, reason: a.reason ?? null, send: structuredClone(a.send) } : null,
      readiness: s.readiness, diagnostic: { finishPhase: s.finish.phase, finishError: s.finish.error ?? null, uncertainty: s.uncertainty },
      reply, capture, limitations: [...s.limitations, ...(entry.recovered ? ['Recovered snapshot only; interrupted capture ownership requires reconciliation, never automatic replay'] : [])] };
  }
  function observeReply(entry) {
    if (entry.replyWork || entry.finishing || entry.recovered) return entry.replyWork;
    let latest = { state: 'waiting', text: entry.service.read().reply.text }, timer, ended = false, writes = Promise.resolve();
    const flush = () => {
      clearTimeout(timer); timer = null;
      const value = { ...latest };
      writes = writes.then(() => entry.service.recordReply(value));
      writes.catch(() => {});
    };
    entry.replyWork = (async () => {
      await entry.service.recordReply(latest);
      try {
        const reply = await entry.adapter.readReply((update) => {
          if (ended || entry.finishing) return;
          latest = { state: 'streaming', text: String(update.text ?? '') };
          if (!timer) { timer = setTimeout(flush, d.replyUpdateMs ?? 100); timer.unref?.(); }
        });
        ended = true; clearTimeout(timer); await writes;
        await entry.service.recordReply(entry.finishing ? { state: 'interrupted', text: latest.text } : reply);
      } catch {
        ended = true; clearTimeout(timer); await writes.catch(() => {});
        await entry.service.recordReply({ state: entry.finishing ? 'interrupted' : 'unknown', text: latest.text });
      }
    })();
    entry.replyWork.catch(() => {});
    return entry.replyWork;
  }
  async function finishEntry(entry, body = {}) {
    if (entry.readOnly) {
      if (!entry.service.read().finish.requested) throw fail(409, 'CONVERSATION_OWNED_BY_ANOTHER_RUNTIME');
      return view(entry);
    }
    if (body.closeTab !== undefined && typeof body.closeTab !== 'boolean') throw fail(400, 'INVALID_CLOSE_TAB');
    if (entry.finishing) return entry.finishing;
    entry.service.stopSubmission(); // Synchronous latch, including a type operation already in flight.
    entry.finishing = (async () => {
      clearTimeout(entry.timer); entry.adapter.stopWaiting?.();
      await entry.work.catch(() => {});
      await entry.replyWork?.catch(() => {});
      await entry.service.finish(body);
      await entry.service.recordCapture({ state: 'incomplete', integrity: entry.adapter.integrity ?? null,
        bytesWritten: entry.adapter.bytesWritten ?? 0, limitReason: entry.adapter.limitReason ?? entry.service.read().capture.limitReason });
      // A failed stop leaves resources/lease owned. Do not pretend a later close/restart fixed it.
      if (entry.service.read().finish.captureStopped || entry.service.read().finish.phase === 'done') entry.lease?.release();
      return view(entry);
    })();
    return entry.finishing;
  }
  return {
    async targets() {
      active();
      const sites = (await Promise.all(ADAPTER_IDS.map(async (id) => { const a = await d.getAdapter(id); return a ? { id, adapter: a.id, url: a.url } : null; }))).filter(Boolean);
      const targets = [];
      const recordings = d.listSessions(paths.sessions).filter((s) => ['recording', 'stopping'].includes(s.status));
      for (const t of await d.listTargets({ port })) {
        if (t.type && t.type !== 'page') continue;
        let url; try { url = new URL(t.url); } catch { continue; }
        if (url.protocol !== 'https:') continue;
        const a = await d.getAdapter(url.href); if (!a || !ADAPTER_IDS.includes(a.id)) continue;
        const recording = recordings.find((s) => s.target?.id === t.id);
        targets.push({ id: t.id, targetId: t.id, site: a.id, url: url.origin, title: a.id,
          ownedByStudio: false, recorderOwner: recording ? { sessionId: recording.id, kind: recording.conversationOwner ? 'conversation' : 'unknown' } : null, visibility: 'unknown' });
      }
      return { sites, targets };
    },
    async list() { return [...new Set([...ids(), ...entries.keys()])].map((id) => view(load(id), true)).sort((a, b) => b.id.localeCompare(a.id)); },
    async get(id) { return view(load(id)); },
    isSessionActive(id) {
      if (!id) return false;
      for (const key of new Set([...ids(), ...entries.keys()])) {
        const entry = load(key), s = entry.service.read();
        if (s.sessionId === id && !s.finish.captureStopped && s.finish.phase !== 'done') return true;
      }
      return false;
    },
    async connect(body = {}) {
      active();
      if (!ADAPTER_IDS.includes(body.site) || body.freshTab !== undefined && typeof body.freshTab !== 'boolean'
        || body.targetId !== undefined && (typeof body.targetId !== 'string' || !body.targetId)) throw fail(400, 'INVALID_CONNECT');
      const freshTab = body.freshTab ?? !body.targetId;
      if (freshTab && body.targetId || !freshTab && !body.targetId) throw fail(400, 'INVALID_TARGET_SELECTION');
      const siteAdapter = await d.getAdapter(body.site);
      if (!siteAdapter?.url) throw fail(400, 'SITE_ADAPTER_UNAVAILABLE');
      let origin = new URL(siteAdapter.url).origin;
      if (!freshTab) {
        const target = (await d.listTargets({ port })).find((t) => t.id === body.targetId);
        if (!target) throw fail(404, 'TARGET_NOT_FOUND');
        const matched = await d.getAdapter(target.url);
        if (matched?.id !== body.site || new URL(target.url).protocol !== 'https:') throw fail(409, 'TARGET_SITE_MISMATCH');
        origin = new URL(target.url).origin;
      }
      const id = randomUUID(), lease = d.acquireLease({ port, root: d.leaseRoot, holder: { kind: 'conversation', id } });
      let entry;
      try {
        const adapter = d.createAdapter({ paths, profileStore, familyStore, port, siteAdapter, targetId: body.targetId,
          freshTab, conversationId: id, ownerToken: lease.token, maxBytes: d.maxBytes });
        const service = createConversationService({ dataDir: directory, id, adapter, io: d.io,
          context: { site: body.site, owner: { pid: process.pid, token: lease.token, port }, capture: { endsAt: new Date(Date.now() + d.maxDurationMs).toISOString(), maxBytes: d.maxBytes, bytesWritten: 0, limitReason: null } } });
        entry = { service, adapter, lease, registration: Promise.resolve(), work: Promise.resolve(), recovered: false };
        entries.set(id, entry);
        await service.connect({ targetId: body.targetId ?? `pending-${id}`, origin, ownedByStudio: freshTab, expectedRevision: service.read().revision });
        entry.timer = setTimeout(() => {
          entry.service.recordCapture({ limitReason: 'duration-budget' }).then(() => finishEntry(entry)).catch(() => {});
        }, Math.max(1, Date.parse(service.read().capture.endsAt) - Date.now())); entry.timer.unref?.();
        return view(entry);
      } catch (e) {
        if (!entry?.adapter.mayOwnResources && !entry?.service.read().sessionId) lease.release();
        throw Object.assign(outward(e), { conversationId: id });
      }
    },
    async submit(id, body = {}) {
      active(); const entry = load(id);
      const registered = entry.registration.then(async () => {
        if (entry.recovered || entry.finishing) throw fail(409, 'CONVERSATION_NOT_WRITABLE');
        if (typeof body.key !== 'string' || !body.key || body.key.length > 200 || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 2000) throw fail(400, 'INVALID_SUBMISSION');
        const s = entry.service.read(), original = s.attempts.find((a) => a.key === body.key);
        if (original) {
          if (original.payloadDigest !== createHash('sha256').update(body.prompt).digest('hex')) throw fail(409, 'IDEMPOTENCY_CONFLICT');
          if (s.finish.requested) throw fail(409, 'CONVERSATION_FINISHED');
          return view(entry, false, original);
        }
        let resolve, reject;
        const ack = new Promise((yes, no) => { resolve = yes; reject = no; });
        const execution = entry.service.submit(body, { registered: () => resolve(view(entry)) });
        entry.work = execution.then(async (attempt) => {
          if (attempt.send.state === 'observed' && !entry.finishing) await observeReply(entry);
        }).catch(async (e) => {
          reject(outward(e));
          if (entry.service.read().attempts.at(-1)?.phase !== 'blocked' && entry.service.read().attempts.length && !entry.replyWork) {
            try { await entry.service.recordReply({ state: 'unknown', text: '' }); } catch {}
          }
        });
        execution.catch((e) => reject(outward(e)));
        return ack;
      });
      entry.registration = registered.then(() => {}, () => {});
      return registered;
    },
    async reconcile(id, body = {}) {
      const entry = load(id);
      if (entry.readOnly) throw fail(409, 'CONVERSATION_OWNED_BY_ANOTHER_RUNTIME');
      if (entry.finishing) await entry.finishing;
      try {
        await entry.service.reconcile(body);
        if (entry.service.read().attempts.at(-1)?.send.state === 'observed') observeReply(entry);
        return view(entry);
      } catch (e) { throw outward(e); }
    },
    async finish(id, body = {}) { try { return await finishEntry(load(id), body); } catch (e) { throw outward(e); } },
    async close() {
      closed = true;
      await Promise.all([...entries.values()].filter((e) => !e.recovered && e.lease).map((entry) => finishEntry(entry)));
    },
  };
}
