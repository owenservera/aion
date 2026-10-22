// Real browser seam; runtime tests inject an adapter instead. No network/body decoder here.
import { createHash } from 'node:crypto';
import { listTargets } from '../cdp/discovery.mjs';
import { listSessions } from '../store/session.mjs';
import { Recorder } from './recorder.mjs';
import { evaluate, findComposer, focusComposer, typeText, sendMessage, sendState, readTranscript, waitForCompletion, detectAuthWall, detectSiteFailure } from './actions.mjs';
import { setTimeout as sleep } from 'node:timers/promises';

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const problem = (code) => Object.assign(new Error(code), { code, status: 409 });

// Specific user-authored nodes, not generic markdown/sidebar text. Keep duplicate text: two
// identical prompts are two turns. Require the entire old prefix unchanged before attributing one.
export async function readUserTurns(page) {
  return evaluate(page, `(() => {
    const sels = '[data-message-author-role="user"],[data-content-search-unit-key$="user"],[data-chatgpt-search-unit-key$="user"],[data-testid="user-message"]';
    const nodes = [...document.querySelectorAll(sels)].filter(el => {
      const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1;
    });
    return nodes.filter(el => !nodes.some(other => other !== el && other.contains(el)))
      .map(el => String(el.innerText ?? el.textContent ?? '').replace(/\\r\\n/g, '\\n'));
  })()`);
}

export function createConversationBrowserAdapter({ paths, profileStore, familyStore, port, siteAdapter, targetId,
  freshTab, conversationId, ownerToken, maxBytes = 256 * 1024 * 1024, dependencies = {} } = {}) {
  const d = { listTargets, listSessions, Recorder, fetch: globalThis.fetch, evaluate, findComposer, focusComposer,
    typeText, sendMessage, sendState, readTranscript, waitForCompletion, readUserTurns, detectAuthWall, detectSiteFailure,
    sleep, readinessTimeoutMs: 20000, readinessPollMs: 200, fetchTimeoutMs: 10000, connectGraceMs: 2000, ...dependencies };
  let recorder, binding, attempt, baselineReply, stopResult, tap;
  let mayOwnResources = false;
  let submissionStopped = false, connectAborted = false, finalized = false, createdTargetId = null, tabRequested = false;
  const waiting = new AbortController();
  // Hard bound for a step that may never settle (a fake or a wedged CDP/HTTP call). The timer is a
  // real timer on purpose: the race, not the callee's cooperation, guarantees the caller proceeds.
  function bounded(run, ms, code) {
    const controller = new AbortController(); let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(problem(code)); }, ms); });
    return Promise.race([Promise.resolve().then(() => run(controller.signal)), timeout]).finally(() => clearTimeout(timer));
  }
  const httpFetch = (url, init) => bounded((signal) => d.fetch(url, { ...init, signal }), d.fetchTimeoutMs, 'BROWSER_HTTP_TIMEOUT');
  async function closeCreatedTab(targetId) {
    const response = await httpFetch(`http://127.0.0.1:${port}/json/close/${encodeURIComponent(targetId)}`);
    if (!response.ok) throw problem('TAB_CLOSE_UNCONFIRMED');
  }
  async function readiness(end) {
    const blocked = (reason, draft = { present: null, chars: null }) => ({ ready: false, reason, draft });
    do {
      const target = (await d.listTargets({ port })).find((t) => t.id === binding.targetId);
      if (!target) return blocked('TARGET_DISAPPEARED');
      let actual; try { actual = new URL(target.url).origin; } catch { return blocked('BINDING_CHANGED'); }
      if (actual !== binding.origin) {
        if (!(freshTab && target.url === 'about:blank')) return blocked('BINDING_CHANGED');
      } else {
        const pageOrigin = await d.evaluate(recorder.page, 'location.origin');
        if (pageOrigin !== binding.origin) {
          if (!(freshTab && pageOrigin === 'null')) return blocked('BINDING_CHANGED');
        } else {
          const composer = await d.findComposer(recorder.page, siteAdapter);
          const auth = await d.detectAuthWall(recorder.page, siteAdapter);
          if (auth.blocked) return blocked('AUTH_WALL');
          const gate = await d.detectSiteFailure(recorder.page, siteAdapter);
          if (gate.failed) return blocked('SITE_GATE');
          if (composer.found) {
            const state = await d.sendState(recorder.page, siteAdapter);
            if (state.evalOk) {
              const draft = { present: state.draftChars > 0, chars: state.draftChars };
              return draft.present ? blocked('DRAFT_PRESENT', draft) : { ready: true, draft, reason: null };
            }
          }
        }
      }
      if (Date.now() >= end) break;
      await d.sleep(d.readinessPollMs);
    } while (Date.now() <= end);
    return blocked('READINESS_TIMEOUT');
  }
  async function check() {
    if (!recorder?.page || recorder.state !== 'recording') throw problem('CAPTURE_NOT_ACTIVE');
    const targets = await d.listTargets({ port });
    const target = targets.find((t) => t.id === binding.targetId);
    if (!target || new URL(target.url).origin !== binding.origin) throw problem('BINDING_CHANGED');
    if (await d.evaluate(recorder.page, 'location.origin') !== binding.origin) throw problem('BINDING_CHANGED');
    return { ...binding };
  }
  async function observation(args) {
    await check();
    const saved = attempt ?? recorder.session.kv.get('CONVERSATION_ATTEMPT');
    if (!saved || saved.turnId !== args.turnId || saved.payloadDigest !== args.payloadDigest) return null;
    const users = await d.readUserTurns(recorder.page);
    if (!Array.isArray(users) || users.length <= saved.users.length
      || !saved.users.every((text, i) => users[i] === text)
      || users.length !== saved.users.length + 1 || users.at(-1) !== saved.prompt.replace(/\r\n/g, '\n')) return null;
    const sequence = recorder.recordConversationObservation({ source: 'page', kind: 'new-user-turn', binding,
      turnId: args.turnId, payloadDigest: args.payloadDigest, userIndex: users.length - 1,
      text: users.at(-1), baselineSequence: saved.boundary.sequence });
    return { binding: { ...binding }, evidence: { turnId: args.turnId, payloadDigest: args.payloadDigest,
      sessionId: recorder.session.id, sequence, kind: 'new-user-turn', source: 'page' } };
  }
  async function connectSteps(initial, hooks, startedAt) {
    const aborted = () => { if (connectAborted) throw problem('CONNECT_ABORTED'); };
    binding = { ...initial };
    if (freshTab) {
      mayOwnResources = true; tabRequested = true; // An acknowledgement can be lost even if Chrome created the tab.
      const response = await httpFetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      if (!response.ok) throw problem('TAB_OPEN_FAILED');
      const target = await bounded(() => response.json(), d.fetchTimeoutMs, 'BROWSER_HTTP_TIMEOUT');
      if (!target.id) throw problem('TAB_OPEN_UNCONFIRMED');
      createdTargetId = target.id;
      if (connectAborted) { await closeCreatedTab(target.id).catch(() => {}); aborted(); }
      binding.targetId = target.id; hooks.bind(binding);
    } else {
      const target = (await d.listTargets({ port })).find((t) => t.id === targetId);
      aborted();
      if (!target || new URL(target.url).origin !== binding.origin) throw problem('BINDING_CHANGED');
      // Never replace/stop an unknown recorder, including an interrupted recorder with no proof
      // of finalization. Only the selected exact target is guarded; unrelated captures continue.
      if (d.listSessions(paths.sessions).some((s) => s.target?.id === targetId && ['recording', 'stopping'].includes(s.status))) throw problem('TARGET_RECORDER_BUSY');
    }
    let profile = siteAdapter.id;
    try { profileStore.load(profile); } catch { profile = 'generic'; profileStore.load(profile); }
    mayOwnResources = true;
    recorder = new d.Recorder({ sessionsDir: paths.sessions, profileStore, familyStore, port, tabs: 'one', follow: false,
      reconnect: false, maxSessionBytes: maxBytes });
    recorder.on('warn', () => {}); // Never leak transport/URL/content errors into shared summaries.
    const mine = recorder;
    await recorder.start({ target: binding.targetId, exactTarget: true, profile, label: siteAdapter.id, follow: false,
      owner: { conversationId, pid: process.pid, token: ownerToken, port },
      onSessionCreated: (session) => hooks.ownSession(session.id) });
    if (connectAborted) { await stopCapture().catch(() => {}); if (freshTab && createdTargetId) await closeCreatedTab(createdTargetId).catch(() => {}); aborted(); }
    tap = mine.tap({ decode: false, text: false }); // Reuse capture tap; no second answer decoder.
    if (freshTab) {
      await recorder.page.send('Page.navigate', { url: siteAdapter.url });
      // Navigation/composer readiness is checked on submit, not guessed from a navigate ACK.
    }
    aborted();
    const ready = await readiness(startedAt + d.readinessTimeoutMs);
    aborted();
    return { binding: { ...binding }, sessionId: recorder.session.id, readiness: ready };
  }
  // Shared by finish (stop) and failed-connect cleanup. Idempotent once finalized.
  async function stopCapture() {
    if (finalized) return;
    waiting.abort();
    if (!recorder?.session) throw problem('CAPTURE_OWNER_INCOMPLETE');
    if (['recording', 'stopping', 'stop_failed'].includes(recorder.state) || recorder._stopPromise) {
      stopResult = await recorder.stop({ reason: 'conversation_finish' });
      if (!stopResult) throw problem('CAPTURE_STOP_UNCONFIRMED');
    } else {
      // Attachment failed after creating a session. We still own its raw writer/connection;
      // finalize as incomplete, never infer a successful recording or close an uncertain tab.
      clearInterval(recorder.persistTimer); clearInterval(recorder.statusTimer);
      recorder.conn?.close(); await recorder.session.raw.close();
      recorder.session.meta.status = 'incomplete'; recorder.session.meta.endReason = 'conversation_attachment_failed'; recorder.session.saveMeta();
    }
    tap?.close(); mayOwnResources = false; finalized = true;
  }  return {
    get mayOwnResources() { return mayOwnResources; },
    get sessionId() { return recorder?.session?.id ?? null; },
    get integrity() { return stopResult?.verify ?? null; },
    get active() { return recorder?.state === 'recording' || recorder?.state === 'stopping'; },
    get limitReason() { return recorder?._quotaHit ? 'byte-budget' : null; },
    get bytesWritten() { return recorder?.session?.raw?.stats?.bytes ?? 0; },
    // Total connect time is bounded by readinessTimeoutMs + a small grace. A hung step fails closed
    // with CONNECT_TIMEOUT; whatever it creates late is cleaned up by the continuation itself.
    async connect(initial, hooks) {
      connectAborted = false;
      const startedAt = Date.now(), run = connectSteps(initial, hooks, startedAt); let timer;
      const timeout = new Promise((_, reject) => { timer = setTimeout(() => { connectAborted = true; reject(problem('CONNECT_TIMEOUT')); }, d.readinessTimeoutMs + d.connectGraceMs); });
      run.catch(() => {});
      try { return await Promise.race([run, timeout]); } finally { clearTimeout(timer); }
    },    async preflight() {
      await check();
      const composer = await d.findComposer(recorder.page, siteAdapter);
      if ((await d.detectAuthWall(recorder.page, siteAdapter)).blocked) throw problem('AUTH_WALL');
      if ((await d.detectSiteFailure(recorder.page, siteAdapter)).failed) throw problem('SITE_GATE');
      if (!composer.found) throw problem('COMPOSER_UNAVAILABLE');
      const state = await d.sendState(recorder.page, siteAdapter);
      if (!state.evalOk) throw problem('COMPOSER_UNREADABLE');
      const users = await d.readUserTurns(recorder.page);
      if (!Array.isArray(users)) throw problem('USER_TURNS_UNREADABLE');
      baselineReply = await d.readTranscript(recorder.page, siteAdapter);
      attempt = { users, boundary: { sequence: recorder.session.raw.seq, transcriptCount: users.length } };
      return { binding: { ...binding }, draft: { present: state.draftChars > 0, chars: state.draftChars }, boundary: attempt.boundary };
    },
    async type({ prompt, turnId }) {
      await check();
      await recorder.page.send('Page.bringToFront', {}); // Exact bound target only.
      const focus = await d.focusComposer(recorder.page, siteAdapter);
      if (!focus.ok) throw problem('COMPOSER_NOT_FOCUSED');
      const state = await d.sendState(recorder.page, siteAdapter);
      if (!state.evalOk || state.draftChars !== 0) throw problem('DRAFT_PRESENT');
      attempt = { ...attempt, turnId, prompt, payloadDigest: createHash('sha256').update(prompt).digest('hex') };
      recorder.session.kv.set('CONVERSATION_ATTEMPT', attempt); // Protected local capture storage only.
      const typed = await d.typeText(recorder.page, prompt);
      if (!typed.ok || norm(typed.typed) !== norm(prompt)) throw problem('TYPING_UNCONFIRMED');
    },
    async submit(args) {
      await check();
      if (submissionStopped) throw Object.assign(problem('SUBMISSION_STOPPED'), { notDispatched: true });
      const result = await d.sendMessage(recorder.page, siteAdapter, { canDispatch: () => !submissionStopped });
      if (result?.dispatched === false) {
        if (submissionStopped) throw Object.assign(problem('SUBMISSION_STOPPED'), { notDispatched: true });
        // Proven not dispatched = sendMessage's own preflight/button/latch refusal. Anything else
        // (dispatched undefined/true, dispatch errors, missing fields) stays ambiguous -> observation.
        if (result.sendStatus === 'not-attempted' && result.uncertain === false) throw Object.assign(problem('SEND_NOT_DISPATCHED'), { notDispatched: true });
      }
      return observation(args);
    },
    reconcile: observation,
    async readReply(onUpdate) {
      if (waiting.signal.aborted) return { state: 'interrupted', text: '' };
      await check();
      const result = await d.waitForCompletion(recorder.page, siteAdapter, { baseline: baselineReply?.last ?? '',
        baseCount: baselineReply?.count ?? 0, exclude: [attempt?.prompt ?? ''], signal: waiting.signal, onUpdate });
      return { state: result.interrupted ? 'interrupted' : result.done && !result.failed ? 'ready' : 'unknown', text: result.text ?? '' };
    },
    stopWaiting() { submissionStopped = true; waiting.abort(); },
    async stop() { await stopCapture(); },
    // Failed-connect cleanup: finalize any half-created session as incomplete, then close ONLY the
    // tab this Studio created (freshTab + exact id reported by Chrome). An owner/selected tab is never touched.
    async abortConnect() {
      connectAborted = true; submissionStopped = true;
      const out = { captureFinalized: true, tab: 'none', targetId: createdTargetId };
      if (recorder?.session) { try { await stopCapture(); } catch { out.captureFinalized = false; } }
      else mayOwnResources = false; // No session was ever created: no capture-side resource to finalize.
      if (freshTab) {
        if (!createdTargetId) out.tab = tabRequested ? 'unconfirmed' : 'none';
        else { try { await closeCreatedTab(createdTargetId); out.tab = 'closed'; } catch { out.tab = 'kept'; } }
      }
      return out;
    },
    async closeTab(b) {
      if (!b.ownedByStudio || b.targetId !== binding.targetId || b.origin !== binding.origin) throw problem('TAB_NOT_OWNED');
      await closeCreatedTab(b.targetId);
    },  };
}
