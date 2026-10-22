// Recorder: one capture run, anchored on one user-selected tab (the "primary").
// Wires CDP -> NetworkRecorder (L1) + DomObserver (L3) -> RawLog, and mirrors every persisted
// record through the StreamReducer (L2) so the live studio shows exactly what replay would.
//
// Multi-target (one session, one raw log, sids prefixed by target tag):
//   p    primary tab (DOM observation stays bound to it)
//   tN   other tabs ({ tabs: 'all' }) and popups / new tabs opened by a recorded page (follow)
//   wN   service / shared workers of the recorded sites (follow)
//   cN   auto-attached children of any recorded target: OOPIFs, dedicated workers (recursive)
// Every attach/detach is a 'lifecycle' record and a 'target' event. recorder.tap(opts) returns a
// live decoded-event tap (see live-tap.mjs).
import { EventEmitter } from 'node:events';
import os from 'node:os';
import { fsyncSync, openSync, closeSync } from 'node:fs';
import { CdpConnection, sleep } from '../cdp/client.mjs';
import { browserVersion, listTargets, pickTarget, browserWsUrl, targetStillPresent } from '../cdp/discovery.mjs';
import { Session, listSessions } from '../store/session.mjs';
import { NetworkRecorder } from './network.mjs';
import { DomObserver } from './dom.mjs';
import { StreamReducer } from '../replay/reducer.mjs';
import { ShapeInferencer } from '../shapes/infer.mjs';
import { redactUrl } from './redact.mjs';
import { collectorSourceSha, VERSION } from '../config.mjs';
import { createLiveTap } from './live-tap.mjs';
import { followDecision, hostOf } from './targets.mjs';

export class Recorder extends EventEmitter {
  constructor({
    sessionsDir, profileStore, familyStore = null, port = 9222, rawOptions = {}, allBodies = false,
    liveEventsPerStream = 2000, maxSessionBytes = 0, learner = null, maxStreamBytes = 0,
    reconnect = true, maxReconnectAttempts = 6, reconnectBaseDelayMs = 400, heartbeatMs = 15_000,
    tabs = 'one', follow = true, maxTargets = 32, pauseNewTargets = null, ignoreTargetUrls = [],
  }) {
    super();
    // tabs: 'one' = the selected tab only; 'all' = every web tab in the browser.
    // follow: popups/new tabs opened by recorded pages + service/shared workers of recorded sites,
    // and recursive auto-attach of children (OOPIFs, dedicated workers).
    this.tabs = tabs === 'all' ? 'all' : 'one';
    this.follow = follow !== false;
    this.maxTargets = maxTargets;
    // Pause new child targets until Network is enabled on them, so their first requests are seen.
    this.pauseNewTargets = pauseNewTargets ?? this.follow;
    // Never follow these (string = URL prefix, RegExp = test). The studio should pass its own
    // origin so { tabs: 'all' } cannot record the studio's live feed into itself.
    this.ignoreTargetUrls = ignoreTargetUrls;
    this.setMaxListeners(50);
    this.sessionsDir = sessionsDir;
    this.profileStore = profileStore;
    this.port = port;
    this.rawOptions = rawOptions;
    this.allBodies = allBodies;
    this.liveEventsPerStream = liveEventsPerStream;
    this.familyStore = familyStore;
    this.learner = learner; // optional ScopedLearner: supplies the suggestion calibrator
    this.maxSessionBytes = maxSessionBytes; // 0 = unlimited; otherwise stop cleanly with reason quota_reached
    this.maxStreamBytes = maxStreamBytes;   // 0 = unlimited per-stream body cap
    // DevTools transport resilience. Reconnecting cannot resume a response body that was already
    // in flight (Chrome only streams content for requests armed while live), so every reconnect is
    // recorded with an explicit coverage note and affected streams are marked.
    this.reconnect = reconnect;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectBaseDelayMs = reconnectBaseDelayMs;
    this.heartbeatMs = heartbeatMs;
    this.reconnects = 0;
    this.paused = false;
    this.state = 'idle';
    this._resetTargets();
  }

  async start({ target: selector, profile: profileName, label, tabs, follow, owner, onSessionCreated, exactTarget = false } = {}) {
    if (this.state === 'recording') throw new Error('Already recording.');
    this.paused = false;
    this.pausedCounts = {};
    this._stopPromise = null; this._runEndWritten = false;
    this._quotaHit = false;
    if (tabs !== undefined) this.tabs = tabs === 'all' ? 'all' : 'one';
    if (follow !== undefined) { this.follow = follow !== false; this.pauseNewTargets = this.follow; }
    this._resetTargets();
    const version = await browserVersion({ port: this.port });
    const targets = await listTargets({ port: this.port });
    // tabs:'all' records every web tab, so a missing --target must not fail: pick a deterministic
    // primary (index 0) and let target discovery attach the rest. A single tab already resolves.
    const fallbackSelector = this.tabs === 'all' && targets.length > 1 ? '0' : undefined;
    const target = exactTarget ? targets.find((t) => t.id === selector) : pickTarget(targets, selector || fallbackSelector);
    if (!target) throw new Error('Exact capture target disappeared; no substitute target was selected');
    if (listSessions(this.sessionsDir).some((s) => s.target?.id === target.id && ['recording', 'stopping'].includes(s.status))) {
      throw Object.assign(new Error('Exact target already has an active or unreconciled recorder'), { status: 409, code: 'TARGET_RECORDER_BUSY' });
    }
    const profile = profileName ? this.profileStore.load(profileName) : this.profileStore.selectFor(target.url);
    this.profile = profile;
    this.pageUrl = target.url;

    const host = (() => { try { return new URL(target.url).hostname; } catch { return 'page'; } })();
    this.session = Session.create(this.sessionsDir, {
      site: label || host,
      rawOptions: this.rawOptions,
      meta: {
        target: { id: target.id, url: redactUrl(target.url), title: target.title },
        browser: version.Browser, protocol: version['Protocol-Version'], userAgent: version['User-Agent'],
        os: `${os.type()} ${os.release()} ${os.arch()}`, node: process.version,
        collector: { name: 'aion-capture-studio', version: VERSION, sourceSha: collectorSourceSha() },
        profile: { name: profile.name, version: profile.version },
        options: { allBodies: this.allBodies, tabs: this.tabs, follow: this.follow },
        ...(owner ? { conversationOwner: owner } : {}),
      },
    });
    if (owner) {
      const fd = openSync(`${this.session.dir}/session.json`, 'r+');
      try { fsyncSync(fd); } finally { closeSync(fd); }
    }
    // Owner identity is in session meta before any attachment. The lifecycle journal can bind the
    // created session now, so a later attach/save failure remains recoverable by conversation ID.
    onSessionCreated?.(this.session);
    this.session.kv.set('INPUT', { target: selector ?? null, profile: profile.name, profileVersion: profile.version, port: this.port, allBodies: this.allBodies, tabs: this.tabs, follow: this.follow });
    this.session.kv.set('PROFILE_SNAPSHOT', profile);

    this.reducer = new StreamReducer({ deltaDialect: profile.decode?.delta ?? 'auto', maxEventsPerStream: this.liveEventsPerStream });
    this.shapes = new ShapeInferencer();
    this.eventsDs = this.session.dataset('events');

    const append = (rec) => this._append(rec);
    this.net = new NetworkRecorder({ append, profile, getPageUrl: (tag) => this._pageUrlFor(tag), options: { allBodies: this.allBodies, maxStreamBytes: this.maxStreamBytes } });
    this.net.on('error', (e) => this.emit('warn', e));
    this.dom = new DomObserver({ append, profile });

    this.targetId = target.id;
    this.conn = await CdpConnection.connect(version.webSocketDebuggerUrl, { requestTimeoutMs: 30_000 });
    if (this.heartbeatMs) this.conn.startHeartbeat({ intervalMs: this.heartbeatMs });
    this._wireConnection();
    this.page = await this.conn.attach(target.id);
    this._wirePage();
    this.targets.set(target.id, { targetId: target.id, tag: 'p', type: 'page', role: 'primary', url: target.url, session: this.page, attachedAt: Date.now() });
    this.tagRoot.set('p', 'p');

    this.state = 'recording';
    this.startedAt = Date.now();
    append({
      k: 'run.start', target: { id: target.id, url: redactUrl(target.url), title: target.title }, profile: { name: profile.name, version: profile.version },
      targets: { tabs: this.tabs, follow: this.follow, maxTargets: this.maxTargets },
      coverage: 'Requests opened before this record are not observed at all. A WebSocket opened earlier stays invisible unless the browser reports its later frames, in which case it is joined late (ws.open lateJoin: URL, handshake and earlier frames UNKNOWN). History earlier than attach is unknown unless the page re-sends it.',
    });
    this._emitTarget(this.targets.get(target.id), 'attached');

    await this._setupPage({ reconnected: false });
    if (this.follow || this.tabs === 'all') await this._setupDiscovery();

    // Apify-style persistState: periodic durable run state for crash forensics/resume.
    this.persistTimer = setInterval(() => this._persist(), 5000);
    this.statusTimer = setInterval(() => this.emit('status', this.status()), 1000);
    this.emit('started', { id: this.session.id, target, profile: { name: profile.name, version: profile.version } });
    return this.session;
  }

  // Connection-level listeners. Re-wired on every (re)connection.
  _wireConnection() {
    const conn = this.conn;
    conn.on('close', () => { if (conn !== this.conn) return; this._onLost('devtools_connection_closed'); });
    conn.on('unhealthy', (e) => this._append({ k: 'lifecycle', event: 'devtools_heartbeat_failed', error: String(e?.message ?? e) }));
    this.childN ??= 0;
    // Child targets (out-of-process iframes, dedicated workers) carry their own network traffic.
    // Accepted from ANY recorded session (primary, other tabs, workers, nested children).
    conn.on('child-attached', (p, parentSessionId) => { this._onChildAttached(conn, p, parentSessionId).catch((e) => this.emit('warn', e)); });
  }

  async _onChildAttached(conn, p, parentSessionId) {
    const child = conn.session(p.sessionId);
    if (!child) return;
    // A child may be paused waiting for us (waitForDebuggerOnStart): always release it.
    const release = () => child.send('Runtime.runIfWaitingForDebugger').catch(() => {});
    const parentTag = this.sessionTags.get(parentSessionId);
    if (!parentTag || this.state !== 'recording' || conn !== this.conn) { await release(); return; }
    const info = p.targetInfo ?? {};
    const tag = `c${++this.childN}`;
    const entry = { targetId: info.targetId, tag, type: info.type, role: 'child', parentTag, url: info.url, session: child, attachedAt: Date.now() };
    this.sessionTags.set(p.sessionId, tag);
    this.tagRoot.set(tag, this.tagRoot.get(parentTag) ?? parentTag);
    if (info.targetId) this.targets.set(info.targetId, entry);
    this._append({ k: 'lifecycle', event: 'child_target_attached', tag, parentTag, targetType: info.type, url: redactUrl(info.url ?? '') });
    child.on('detached', (d) => {
      this.sessionTags.delete(p.sessionId);
      if (info.targetId && this.targets.get(info.targetId) === entry) this.targets.delete(info.targetId);
      if (this.state !== 'recording') return;
      this.net.detachSession(p.sessionId);
      this._emitTarget(entry, 'detached', d?.reason);
    });
    try {
      await this.net.attach(child, tag, info);
      // Recursive auto-attach: workers inside OOPIFs, nested workers.
      if (this.follow) {
        await child.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: this.pauseNewTargets, flatten: true }).catch(() => {});
      }
    } catch (e) { this._append({ k: 'lifecycle', event: 'child_target_failed', tag, error: String(e.message ?? e) }); }
    finally { await release(); }
    this._emitTarget(entry, 'attached');
  }

  _wirePage() {
    this.page.on('detached', (p) => {
      // A dropped DevTools transport detaches every session; the connection-level 'close'
      // handler owns that case (it may reconnect). Only a real detach ends the run here.
      if (p?.reason === 'connection closed') return;
      this._onLost(`target_detached:${p?.reason ?? 'unknown'}`);
    });
    this.page.on('Inspector.targetCrashed', () => this._onLost('target_crashed'));
  }

  // ------------------------------------------------------------------------------------------
  // Multi-target bookkeeping
  // ------------------------------------------------------------------------------------------
  _resetTargets() {
    this.targets = new Map();      // targetId -> { targetId, tag, type, role, url, session, openerId, parentTag }
    this.sessionTags = new Map();  // CDP sessionId -> tag (recorded sessions only)
    this.tagRoot = new Map();      // tag -> tag of the tab/worker it belongs to (scope page)
    this._candidates = new Map();  // targetId -> targetInfo awaiting re-evaluation
    this._rejected = new Set();    // targetIds finally rejected by the follow policy
    this._attachingIds = new Set();
    this.childN = 0; this.tabN = 0; this.workerN = 0;
    this.targetCounts = {};        // role -> targets attached during the run
    this._maxTargetsNoted = false;
  }

  _pageUrlFor(tag) {
    const root = (tag && this.tagRoot?.get(tag)) ?? tag ?? 'p';
    if (!root || root === 'p') return this.pageUrl;
    for (const e of this.targets?.values() ?? []) if (e.tag === root) return e.url || this.pageUrl;
    return this.pageUrl;
  }

  _emitTarget(entry, state, reason) {
    if (!entry) return;
    if (state === 'attached') this.targetCounts[entry.role] = (this.targetCounts[entry.role] ?? 0) + 1;
    const openerTag = entry.openerId ? this.targets.get(entry.openerId)?.tag : undefined;
    this.emit('target', {
      targetId: entry.targetId, type: entry.type, url: redactUrl(entry.url ?? ''), tag: entry.tag, role: entry.role, state,
      ...(entry.parentTag ? { parentTag: entry.parentTag } : {}), ...(openerTag ? { openerTag } : {}), ...(reason ? { reason } : {}),
    });
  }

  _trackedHosts() {
    const out = new Set();
    for (const e of this.targets.values()) {
      if (e.role === 'child' || e.type !== 'page') continue;
      const h = hostOf(e.role === 'primary' ? (this.pageUrl ?? e.url) : e.url);
      if (h) out.add(h);
    }
    return out;
  }

  _followedCount() { let n = 0; for (const e of this.targets.values()) if (e.role === 'tab' || e.role === 'popup' || e.role === 'worker') n++; return n; }

  // Browser-level target discovery. setDiscoverTargets replays targetCreated for every existing
  // target, so already-open popups/workers/tabs go through the same policy as new ones.
  async _setupDiscovery() {
    const conn = this.conn;
    conn.on('Target.targetCreated', ({ targetInfo }) => { if (conn === this.conn) this._considerTarget(targetInfo); });
    conn.on('Target.targetInfoChanged', ({ targetInfo }) => { if (conn === this.conn) this._onTargetInfoChanged(targetInfo); });
    conn.on('Target.targetDestroyed', ({ targetId }) => { if (conn === this.conn) this._onTargetGone(targetId, 'target_destroyed'); });
    try { await conn.send('Target.setDiscoverTargets', { discover: true }); }
    catch (e) { this._append({ k: 'lifecycle', event: 'target_discovery_unavailable', error: String(e?.message ?? e) }); return; }
    // After a reconnect: followed targets that vanished meanwhile are closed out explicitly.
    const res = await conn.send('Target.getTargets').catch(() => null);
    if (res?.targetInfos) {
      const present = new Set(res.targetInfos.map((t) => t.targetId));
      for (const e of [...this.targets.values()]) {
        if ((e.role === 'tab' || e.role === 'popup' || e.role === 'worker') && !present.has(e.targetId)) this._onTargetGone(e.targetId, 'gone_during_reconnect');
      }
    }
  }

  _considerTarget(info) {
    if (this.state !== 'recording' || !info?.targetId) return;
    const id = info.targetId;
    const tracked = this.targets.get(id);
    if (tracked) {
      // Re-attach a followed target whose session was lost with the DevTools transport.
      if ((tracked.role === 'tab' || tracked.role === 'popup' || tracked.role === 'worker') && (!tracked.session || tracked.session.detached) && !this._attachingIds.has(id)) {
        this._attachTarget({ ...info }, tracked.role, tracked.tag).catch((e) => this.emit('warn', e));
      }
      return;
    }
    if (this._rejected.has(id) || this._attachingIds.has(id)) return;
    const u = String(info.url ?? '');
    if (u && (this.ignoreTargetUrls ?? []).some((p) => (p instanceof RegExp ? p.test(u) : u.startsWith(String(p))))) { this._candidates.delete(id); return; }
    const trackedIds = new Set();
    for (const e of this.targets.values()) if (e.type === 'page' && e.role !== 'child') trackedIds.add(e.targetId);
    const d = followDecision(info, {
      tabs: this.tabs, follow: this.follow, trackedIds, trackedHosts: this._trackedHosts(), count: this._followedCount(), maxTargets: this.maxTargets,
    });
    if (d.follow) {
      this._candidates.delete(id);
      this._attachTarget(info, d.role).catch((e) => this.emit('warn', e));
      return;
    }
    if (d.final) { this._rejected.add(id); this._candidates.delete(id); }
    else this._candidates.set(id, info);
    if (d.reason === 'max_targets' && !this._maxTargetsNoted) {
      this._maxTargetsNoted = true;
      this._append({ k: 'lifecycle', event: 'max_targets_reached', maxTargets: this.maxTargets, coverage: 'Further tabs/popups/workers are NOT recorded in this run.' });
    }
  }

  _onTargetInfoChanged(info) {
    if (this.state !== 'recording' || !info?.targetId) return;
    const e = this.targets.get(info.targetId);
    if (e) {
      if (e.role !== 'primary' && info.url && info.url !== e.url) {
        const hostChanged = hostOf(info.url) !== hostOf(e.url);
        e.url = info.url;
        if (hostChanged) this._reconsiderCandidates();
      }
      return;
    }
    if (this._candidates.has(info.targetId)) { this._candidates.set(info.targetId, info); this._considerTarget(info); }
  }

  _reconsiderCandidates() {
    for (const info of [...this._candidates.values()]) this._considerTarget(info);
  }

  async _attachTarget(info, role, existingTag = null) {
    const id = info.targetId;
    const reattach = !!existingTag;
    const tag = existingTag ?? (role === 'worker' ? `w${++this.workerN}` : `t${++this.tabN}`);
    const conn = this.conn;
    const entry = this.targets.get(id) ?? { targetId: id, tag, type: info.type, role, openerId: info.openerId, url: info.url, attachedAt: Date.now() };
    if (info.url) entry.url = info.url;
    entry.attaching = true;
    this.targets.set(id, entry);
    this.tagRoot.set(tag, tag);
    this._attachingIds.add(id);
    let attachSession = null;
    try {
      const session = await conn.attach(id);
      attachSession = session;
      if (conn !== this.conn || this.state !== 'recording') { conn.detach(session.sessionId).catch(() => {}); return null; }
      entry.session = session;
      this.sessionTags.set(session.sessionId, tag);
      session.on('detached', (p) => {
        if (p?.reason === 'connection closed') return; // kept for re-attach after reconnect
        this._onTargetGone(id, `target_detached:${p?.reason ?? 'unknown'}`, session);
      });
      const targetInfo = { type: info.type, targetId: id };
      if (reattach) await this.net.reattach(session, tag, targetInfo);
      else await this.net.attach(session, tag, targetInfo);
      if (info.type === 'page') await this._setupSecondaryPage(session, entry);
      else if (this.follow) await session.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: this.pauseNewTargets, flatten: true }).catch(() => {});
      this._append({
        k: 'lifecycle', event: reattach ? 'target_reattached' : 'target_attached', tag, role, targetType: info.type, url: redactUrl(entry.url ?? ''),
        ...(entry.openerId && this.targets.get(entry.openerId) ? { openerTag: this.targets.get(entry.openerId).tag } : {}),
        coverage: reattach
          ? 'Traffic of this target while the DevTools transport was down is UNOBSERVED.'
          : 'Requests this target made before this record are not observed.',
      });
      entry.attaching = false;
      this._emitTarget(entry, reattach ? 'reattached' : 'attached');
      return session;
    } catch (e) {
      this._append({ k: 'lifecycle', event: 'target_attach_failed', tag, role, targetType: info.type, error: String(e?.message ?? e) });
      if (!reattach && this.targets.get(id) === entry) { this.targets.delete(id); this._rejected.add(id); }
      return null;
    } finally {
      entry.attaching = false;
      this._attachingIds.delete(id);
      // A target may be paused waiting for the debugger (waitForDebuggerOnStart): always release
      // it, even when attach or session setup failed, mirrors _onChildAttached's finally.
      if (attachSession) { try { await attachSession.send('Runtime.runIfWaitingForDebugger'); } catch { /* ignore */ } }
    }
  }

  // Other tabs / popups: network + navigation + recursive auto-attach. DOM observation stays on
  // the primary tab; navigations are lifecycle records so primary-tab 'nav' history is unchanged.
  async _setupSecondaryPage(session, entry) {
    await session.send('Page.enable').catch(() => {});
    session.on('Page.frameNavigated', ({ frame }) => {
      if (frame.parentId || this.state !== 'recording') return;
      const hostChanged = hostOf(frame.url) !== hostOf(entry.url);
      entry.url = frame.url;
      this._append({ k: 'lifecycle', event: 'target_navigated', tag: entry.tag, role: entry.role, url: redactUrl(frame.url) });
      this._emitTarget(entry, 'navigated');
      if (hostChanged) this._reconsiderCandidates();
    });
    await session.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: this.pauseNewTargets, flatten: true })
      .catch((e) => this._append({ k: 'lifecycle', event: 'auto_attach_unavailable', tag: entry.tag, error: String(e.message) }));
  }

  _onTargetGone(targetId, reason, session = null) {
    const e = this.targets.get(targetId);
    if (!e || e.role === 'primary' || e.role === 'child') return; // primary: _wirePage; children: own handler
    if (session && e.session && e.session !== session) return;
    this.targets.delete(targetId);
    if (reason !== 'gone_during_reconnect') this._rejected.add(targetId);
    if (e.session) this.sessionTags.delete(e.session.sessionId);
    if (this.state !== 'recording') return;
    if (e.session) this.net.detachSession(e.session.sessionId);
    this._append({ k: 'lifecycle', event: 'target_detached', tag: e.tag, role: e.role, targetType: e.type, reason });
    this._emitTarget(e, 'detached', reason);
  }

  // Live decoded-event tap on this recorder (works before start, during, and across runs).
  tap(opts = {}) { return createLiveTap(this, opts); }

  targetList() {
    return [...(this.targets?.values() ?? [])].map((e) => ({
      targetId: e.targetId, tag: e.tag, type: e.type, role: e.role, url: redactUrl((e.role === 'primary' ? this.pageUrl : e.url) ?? ''),
      attached: !!e.session && !e.session.detached, ...(e.parentTag ? { parentTag: e.parentTag } : {}),
    }));
  }

  // Everything that must exist on the page session: network observation, page lifecycle, the DOM
  // agent and auto-attach. Idempotent, so it can be re-run after a reconnect.
  async _setupPage({ reconnected = false } = {}) {
    const append = (rec) => this._append(rec);
    const profile = this.profile;
    this.sessionTags.set(this.page.sessionId, 'p');
    const primary = this.targets.get(this.targetId);
    if (primary) primary.session = this.page;
    if (reconnected) await this.net.reattach(this.page, 'p', { type: 'page' });
    else await this.net.attach(this.page, 'p', { type: 'page' });
    await this.page.send('Page.enable');
    this.page.on('Page.frameNavigated', ({ frame }) => {
      if (frame.parentId) return;
      const hostChanged = hostOf(frame.url) !== hostOf(this.pageUrl);
      this.pageUrl = frame.url;
      if (primary) primary.url = frame.url;
      append({ k: 'nav', kind: 'document', url: redactUrl(frame.url) });
      this._maybeSwitchProfile(frame.url);
      if (hostChanged && this._candidates?.size) this._reconsiderCandidates();
    });
    this.page.on('Page.navigatedWithinDocument', ({ frameId, url }) => {
      if (frameId !== this.dom.mainFrameId) return;
      this.pageUrl = url;
      append({ k: 'nav', kind: 'same_document', url: redactUrl(url) });
    });
    this.page.on('Page.loadEventFired', () => append({ k: 'lifecycle', event: 'load' }));
    this.page.on('Page.lifecycleEvent', (p) => { if (p.name === 'networkIdle' && p.frameId === this.dom.mainFrameId) append({ k: 'lifecycle', event: 'network_idle' }); });
    await this.page.send('Page.setLifecycleEventsEnabled', { enabled: true }).catch(() => {});

    if (profile.dom?.enabled !== false) {
      try { await this.dom.attach(this.page); }
      catch (e) { append({ k: 'lifecycle', event: 'dom_agent_failed', error: String(e.message ?? e), reconnected }); }
    }
    await this.page.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: !!this.pauseNewTargets, flatten: true })
      .catch((e) => append({ k: 'lifecycle', event: 'auto_attach_unavailable', error: String(e.message) }));
  }

  // Reconnect the DevTools transport and re-attach to the same tab.
  // Returns true when recording continues; false when the run must stop.
  async _tryReconnect(reason) {
    if (!this.reconnect || this.state !== 'recording' || this._reconnecting) return false;
    this._reconnecting = true;
    const lostAt = Date.now();
    const openStreams = this.net.openStreams();
    this._append({ k: 'reconnect.attempt', reason, openStreams, coverage: 'Bytes delivered while the DevTools transport was down are UNOBSERVED; response bodies already in flight cannot be re-armed and are marked body.excluded.' });
    try {
      for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
        await sleep(Math.min(8000, this.reconnectBaseDelayMs * 2 ** (attempt - 1)));
        if (this.state !== 'recording') break;
        try {
          const present = await targetStillPresent(this.targetId, { port: this.port });
          if (!present.present) { this._append({ k: 'reconnect.failed', reason: 'target_gone', attempt }); return false; }
          const wsUrl = await browserWsUrl({ port: this.port });
          const conn = await CdpConnection.connect(wsUrl, { requestTimeoutMs: 30_000 });
          this.conn = conn;
          if (this.heartbeatMs) conn.startHeartbeat({ intervalMs: this.heartbeatMs });
          this.sessionTags.clear(); // every old session died with the transport
          this._wireConnection();
          this.page = await conn.attach(this.targetId).catch((e) => { try { conn.close(); } catch { /* ignore */ } throw e; });
          this._wirePage();
          await this._setupPage({ reconnected: true });
          // Re-discovers followed tabs/popups/workers and re-attaches them under their old tags.
          if (this.follow || this.tabs === 'all') await this._setupDiscovery();
          this.reconnects++;
          this._append({ k: 'reconnect.ok', reason, attempt, downtimeMs: Date.now() - lostAt, openStreams, reconnects: this.reconnects });
          this.emit('reconnected', { attempt, downtimeMs: Date.now() - lostAt });
          return true;
        } catch (e) {
          this._lastReconnectError = String(e?.message ?? e);
          this._append({ k: 'lifecycle', event: 'reconnect_attempt_failed', attempt, error: this._lastReconnectError });
        }
      }
      this._append({ k: 'reconnect.failed', reason, attempts: this.maxReconnectAttempts, error: this._lastReconnectError ?? 'unknown' });
      return false;
    } finally { this._reconnecting = false; }
  }

  _maybeSwitchProfile(url) {
    // Keep the chosen profile for the run; just flag when the page moved to a different site.
    try {
      const h = new URL(url).hostname;
      if (!this.profile.match?.hosts?.some((p) => p === '*' || p === h || (p.startsWith('*.') && h.endsWith(p.slice(1))))) {
        this._append({ k: 'lifecycle', event: 'navigated_outside_profile_hosts', host: h });
      }
    } catch { /* ignore */ }
  }

  // Pause: the user deliberately stops capturing without detaching. Records that arrive while paused
  // are counted per kind and declared in the resume record, so they are never mistaken for loss.
  pause() {
    if (this.state !== 'recording' || this.paused) return false;
    this._append({ k: 'pause', openStreams: this.net.openStreams() });
    this.paused = true; this.pausedCounts = {}; this.pausedAt = Date.now();
    this.emit('status', this.status());
    return true;
  }
  resume() {
    if (!this.paused) return false;
    this.paused = false;
    this._append({ k: 'resume', pausedMs: Date.now() - this.pausedAt, notCaptured: this.pausedCounts, coverage: 'Streams open across the pause are missing the bytes received while paused.' });
    this.emit('status', this.status());
    return true;
  }

  _append(rec) {
    if (!this.session || this.session.raw.closed) return null;
    if (this.paused && !['run.end', 'lifecycle', 'pause'].includes(rec.k)) { this.pausedCounts[rec.k] = (this.pausedCounts[rec.k] ?? 0) + 1; return null; }
    if (this.maxSessionBytes && this.session.raw.stats.bytes + this.session.raw.queueBytes > this.maxSessionBytes && this.state === 'recording' && !this._quotaHit) {
      this._quotaHit = true; setImmediate(() => this.stop({ reason: 'quota_reached' }));
    }
    const seq = this.session.raw.append(rec);
    if (seq === null) return null;
    const full = { seq, t: Date.now(), ...rec };
    const derived = this.reducer.ingest(full);
    if (derived.length) {
      this.eventsDs.push(derived.map(stripForDataset));
      for (const ev of derived) this.shapes.observeEvent(ev, this.reducer.streams.get(ev.sid));
    }
    this.emit('record', full);
    for (const ev of derived) this.emit('event', ev);
    return seq;
  }

  _persist() {
    if (!this.session) return;
    const st = this.status();
    this.session.kv.set('STATE', st);
    this.session.kv.set('SHAPES', this.liveReport());
    this.session.meta.stats = st.stats;
    this.session.saveMeta();
  }

  liveReport() {
    const families = this.familyStore ? this.familyStore.names().map((n) => this.familyStore.load(n)) : [];
    return this.shapes.report(this.reducer, { families, profile: this.profile, domInspect: this.lastInspect, domTurns: this.lastTurns, calibrator: this.learner?.calibrator });
  }

  status() {
    if (!this.session) return { state: this.state };
    return {
      state: this.state,
      paused: this.paused,
      id: this.session.id,
      startedAt: this.startedAt,
      pageUrl: redactUrl(this.pageUrl ?? ''),
      profile: { name: this.profile.name, version: this.profile.version },
      queue: this.session.raw.queueDepth,
      stats: { raw: { ...this.session.raw.stats }, network: { ...this.net.stats }, dom: { ...this.dom.stats } },
      openStreams: this.net.openStreams().length,
      targets: { tabs: this.tabs, follow: this.follow, list: this.targetList() },
      transport: {
        reconnects: this.reconnects,
        reconnecting: !!this._reconnecting,
        lastReconnectError: this._lastReconnectError ?? null,
        cdp: this.conn ? { closed: this.conn.closed, lastPingMs: this.conn.lastPingMs ?? null, sent: this.conn.stats.sent, events: this.conn.stats.events, timeouts: this.conn.stats.timeouts } : null,
      },
      summary: (() => { const s = this.reducer.summary(); return { transportCounts: s.transportCounts, transportDetailCounts: s.transportDetailCounts, appProtocols: s.appProtocols, gaps: this.reducer.gaps.length, stalledStreams: s.stalledStreams, totals: s.totals }; })(),
    };
  }

  async _onLost(reason) {
    if (this.state !== 'recording') return;
    // Only a dropped DevTools transport is recoverable: a detached or crashed target means the
    // tab the person chose is gone, and silently re-attaching to something else would be a lie.
    if (reason === 'devtools_connection_closed' && this.reconnect) {
      this.net.markConnectionLost(reason);
      if (await this._tryReconnect(reason)) return;
    }
    await this.stop({ reason });
  }

  // A failed stop is retryable: the cached rejected promise is dropped, the session metadata is
  // marked 'incomplete' (never left 'recording'), and the recorder sits in 'stop_failed' (never
  // 'stopping') so a later stop() re-runs the idempotent finalization steps.
  stop(options = {}) {
    if (this._stopPromise) return this._stopPromise;
    if (this.state !== 'recording' && this.state !== 'stop_failed') return Promise.resolve(null);
    const attempt = this._stop(options).catch((error) => {
      if (this._stopPromise === attempt) this._stopPromise = null;
      this._markStopFailed(error, options.reason);
      throw error;
    });
    this._stopPromise = attempt;
    return attempt;
  }

  _markStopFailed(error, reason = 'user_stop') {
    this.state = 'stop_failed';
    try { clearInterval(this.persistTimer); clearInterval(this.statusTimer); this.conn?.stopHeartbeat?.(); } catch { /* best effort */ }
    try {
      const meta = this.session?.meta;
      if (meta && meta.status !== 'complete' && meta.status !== 'complete_with_integrity_warnings') {
        meta.status = 'incomplete'; meta.endReason = `stop_failed:${reason}`;
        meta.stopError = String(error?.message ?? error).slice(0, 200);
        this.session.saveMeta();
      }
    } catch { /* metadata write is best effort here; the caller still receives the original error */ }
  }

  async _stop({ reason = 'user_stop' } = {}) {
    if (this.state !== 'recording' && this.state !== 'stop_failed') return null;
    this.state = 'stopping';
    clearInterval(this.persistTimer); clearInterval(this.statusTimer);
    this.conn?.stopHeartbeat?.();
    if (!this._runEndWritten) {
      const open = this.net.openStreams();
      this._append({
        k: 'run.end', reason, openStreamsAtEnd: open, openStreamDetail: this.net.openStreamDetail?.() ?? undefined,
        reconnects: this.reconnects,
        coverage: open.length ? 'Streams listed in openStreamsAtEnd were still receiving data; their suffix is UNKNOWN.' : 'All observed streams reached a terminal state.',
      });
      this._runEndWritten = true;
    }
    // Final rendered-structure observation while still attached (feeds family records and shapes).
    if (this.profile.dom?.enabled !== false && this.page && !this.page.detached) {
      try { this.session.kv.set('DOM_INSPECT', await this.dom.inspect()); } catch (e) { this.session.kv.set('DOM_INSPECT', { error: String(e.message ?? e) }); }
      try { const t = await this.dom.turns(); this.session.kv.set('DOM_TURNS', t); this._append({ k: 'dom.turns', count: t.length, roles: [...new Set(t.map((x) => x.role))] }); } catch { /* page gone */ }
    }
    try { await this.dom.clearHighlight(); } catch { /* ignore */ }
    try { await this.page?.send('Network.disable'); } catch { /* ignore */ }
    try { if (this.page && !this.page.detached) await this.conn.send('Target.detachFromTarget', { sessionId: this.page.sessionId }); } catch { /* ignore */ }
    // Followed tabs/popups/workers: detach so nothing stays paused or instrumented by us.
    for (const e of this.targets?.values() ?? []) {
      if (e.role === 'primary' || e.role === 'child' || !e.session || e.session.detached) continue;
      try { await this.conn.send('Target.detachFromTarget', { sessionId: e.session.sessionId }, { timeoutMs: 2000 }); } catch { /* ignore */ }
    }
    try { if (this.follow || this.tabs === 'all') await this.conn.send('Target.setDiscoverTargets', { discover: false }, { timeoutMs: 2000 }); } catch { /* ignore */ }
    this.conn?.close();
    this._persist();
    await this.session.raw.close();
    const verify = await this.session.verify();
    this.session.meta.status = verify.ok ? 'complete' : 'complete_with_integrity_warnings';
    this.session.meta.endedAt = new Date().toISOString();
    this.session.meta.endReason = reason;
    this.session.meta.integrity = { ok: verify.ok, records: verify.records, gapRecords: verify.gapRecords, droppedRecords: verify.droppedRecords };
    this.session.meta.transport = { reconnects: this.reconnects, maxStreamBytes: this.maxStreamBytes || null };
    this.session.meta.targets = { tabs: this.tabs, follow: this.follow, attachedByRole: { ...(this.targetCounts ?? {}) } };
    try { this.session.meta.rawIndex = this.session.rawStats(); } catch { /* index is derived data */ }
    this.session.saveMeta();
    this.state = 'idle';
    const result = { id: this.session.id, dir: this.session.dir, reason, verify, summary: this.reducer.summary() };
    this.emit('stopped', result);
    return result;
  }

  recordConversationObservation(record) {
    if (this.state !== 'recording') throw new Error('Capture is not recording');
    const seq = this._append({ ...record, k: 'conversation.observation' });
    if (seq === null) throw new Error('Observation was not recorded');
    const raw = this.session.raw;
    while (raw.queue.length || raw.dropped) {
      const count = raw.queue.length; raw.flush();
      if (raw.queue.length === count && raw.queue.length) throw new Error('Raw log did not drain');
    }
    fsyncSync(raw.fd); // Do not swallow persistence errors before claiming an observation.
    return seq;
  }

  // Studio helpers (only while recording).
  async inspectDom() { const r = await this.dom.inspect(); this.lastInspect = r; return r; }
  async domTurns() { const t = await this.dom.turns(); this.lastTurns = t; return t; }
  async domBlocks(id) { return this.dom.blocksOf(id); }
  async snapshotDom() {
    const snap = await this.dom.snapshot();
    if (snap) { this.session.kv.set(`DOM_SNAPSHOT_${Date.now()}.html`, snap.html); this._append({ k: 'dom.snapshot', url: redactUrl(snap.url), title: snap.title, bytes: Buffer.byteLength(snap.html ?? ''), redactions: snap.redactions }); }
    return snap ? { url: snap.url, title: snap.title, bytes: Buffer.byteLength(snap.html ?? '') } : null;
  }
  async highlight(id) { return this.dom.highlight(id); }
  // Only ever on an explicit user request: reloading changes the page, but it is the one way to
  // observe connections that were opened before recording started.
  async reloadPage() { this._append({ k: 'lifecycle', event: 'reload_requested_by_user' }); await this.page.send('Page.reload', { ignoreCache: false }); return true; }
}

function stripForDataset(ev) {
  // Dataset rows keep decoded content (local only) but not duplicate raw bytes.
  return ev;
}
