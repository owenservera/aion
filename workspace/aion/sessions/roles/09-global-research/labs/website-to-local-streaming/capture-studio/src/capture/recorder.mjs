// Recorder: one capture run against one user-selected tab.
// Wires CDP -> NetworkRecorder (L1) + DomObserver (L3) -> RawLog, and mirrors every persisted
// record through the StreamReducer (L2) so the live studio shows exactly what replay would.
import { EventEmitter } from 'node:events';
import os from 'node:os';
import { CdpConnection, sleep } from '../cdp/client.mjs';
import { browserVersion, listTargets, pickTarget, browserWsUrl, targetStillPresent } from '../cdp/discovery.mjs';
import { Session } from '../store/session.mjs';
import { NetworkRecorder } from './network.mjs';
import { DomObserver } from './dom.mjs';
import { StreamReducer } from '../replay/reducer.mjs';
import { ShapeInferencer } from '../shapes/infer.mjs';
import { redactUrl } from './redact.mjs';
import { collectorSourceSha, VERSION } from '../config.mjs';

export class Recorder extends EventEmitter {
  constructor({
    sessionsDir, profileStore, familyStore = null, port = 9222, rawOptions = {}, allBodies = false,
    liveEventsPerStream = 2000, maxSessionBytes = 0, learner = null, maxStreamBytes = 0,
    reconnect = true, maxReconnectAttempts = 6, reconnectBaseDelayMs = 400, heartbeatMs = 15_000,
  }) {
    super();
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
  }

  async start({ target: selector, profile: profileName, label } = {}) {
    if (this.state === 'recording') throw new Error('Already recording.');
    const version = await browserVersion({ port: this.port });
    const targets = await listTargets({ port: this.port });
    const target = pickTarget(targets, selector);
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
        options: { allBodies: this.allBodies },
      },
    });
    this.session.kv.set('INPUT', { target: selector ?? null, profile: profile.name, profileVersion: profile.version, port: this.port, allBodies: this.allBodies });
    this.session.kv.set('PROFILE_SNAPSHOT', profile);

    this.reducer = new StreamReducer({ deltaDialect: profile.decode?.delta ?? 'auto', maxEventsPerStream: this.liveEventsPerStream });
    this.shapes = new ShapeInferencer();
    this.eventsDs = this.session.dataset('events');

    const append = (rec) => this._append(rec);
    this.net = new NetworkRecorder({ append, profile, getPageUrl: () => this.pageUrl, options: { allBodies: this.allBodies, maxStreamBytes: this.maxStreamBytes } });
    this.net.on('error', (e) => this.emit('warn', e));
    this.dom = new DomObserver({ append, profile });

    this.targetId = target.id;
    this.conn = await CdpConnection.connect(version.webSocketDebuggerUrl, { requestTimeoutMs: 30_000 });
    if (this.heartbeatMs) this.conn.startHeartbeat({ intervalMs: this.heartbeatMs });
    this._wireConnection();
    this.page = await this.conn.attach(target.id);
    this._wirePage();

    this.state = 'recording';
    this.startedAt = Date.now();
    append({
      k: 'run.start', target: { id: target.id, url: redactUrl(target.url), title: target.title }, profile: { name: profile.name, version: profile.version },
      coverage: 'Requests and WebSocket connections opened before this record are not observed at all (a long-lived socket stays invisible until the page reconnects or is reloaded); history earlier than attach is unknown unless the page re-sends it.',
    });

    await this._setupPage({ reconnected: false });

    // Apify-style persistState: periodic durable run state for crash forensics/resume.
    this.persistTimer = setInterval(() => this._persist(), 5000);
    this.statusTimer = setInterval(() => this.emit('status', this.status()), 1000);
    this.emit('started', { id: this.session.id, target, profile: { name: profile.name, version: profile.version } });
    return this.session;
  }

  // Connection-level listeners. Re-wired on every (re)connection.
  _wireConnection() {
    this.conn.on('close', () => this._onLost('devtools_connection_closed'));
    this.conn.on('unhealthy', (e) => this._append({ k: 'lifecycle', event: 'devtools_heartbeat_failed', error: String(e?.message ?? e) }));
    this.childN ??= 0;
    // Child targets (out-of-process iframes, dedicated workers) carry their own network traffic.
    this.conn.on('child-attached', async (p, parentSessionId) => {
      if (parentSessionId !== this.page?.sessionId) return;
      const child = this.conn.session(p.sessionId);
      if (!child) return;
      const tag = `c${++this.childN}`;
      this._append({ k: 'lifecycle', event: 'child_target_attached', tag, targetType: p.targetInfo.type, url: redactUrl(p.targetInfo.url) });
      try {
        await this.net.attach(child, tag, p.targetInfo);
        await child.send('Runtime.runIfWaitingForDebugger').catch(() => {});
      } catch (e) { this._append({ k: 'lifecycle', event: 'child_target_failed', tag, error: String(e.message ?? e) }); }
      child.on('detached', () => this.net.detachSession(p.sessionId));
    });
  }

  _wirePage() {
    this.page.on('detached', (p) => this._onLost(`target_detached:${p?.reason ?? 'unknown'}`));
    this.page.on('Inspector.targetCrashed', () => this._onLost('target_crashed'));
  }

  // Everything that must exist on the page session: network observation, page lifecycle, the DOM
  // agent and auto-attach. Idempotent, so it can be re-run after a reconnect.
  async _setupPage({ reconnected = false } = {}) {
    const append = (rec) => this._append(rec);
    const profile = this.profile;
    if (reconnected) await this.net.reattach(this.page, 'p', { type: 'page' });
    else await this.net.attach(this.page, 'p', { type: 'page' });
    await this.page.send('Page.enable');
    this.page.on('Page.frameNavigated', ({ frame }) => {
      if (frame.parentId) return;
      this.pageUrl = frame.url;
      append({ k: 'nav', kind: 'document', url: redactUrl(frame.url) });
      this._maybeSwitchProfile(frame.url);
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
    await this.page.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true })
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
          this._wireConnection();
          this.page = await conn.attach(this.targetId);
          this._wirePage();
          await this._setupPage({ reconnected: true });
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

  async stop({ reason = 'user_stop' } = {}) {
    if (this.state !== 'recording') return null;
    this.state = 'stopping';
    clearInterval(this.persistTimer); clearInterval(this.statusTimer);
    this.conn?.stopHeartbeat?.();
    const open = this.net.openStreams();
    this._append({
      k: 'run.end', reason, openStreamsAtEnd: open, openStreamDetail: this.net.openStreamDetail?.() ?? undefined,
      reconnects: this.reconnects,
      coverage: open.length ? 'Streams listed in openStreamsAtEnd were still receiving data; their suffix is UNKNOWN.' : 'All observed streams reached a terminal state.',
    });
    // Final rendered-structure observation while still attached (feeds family records and shapes).
    if (this.profile.dom?.enabled !== false && this.page && !this.page.detached) {
      try { this.session.kv.set('DOM_INSPECT', await this.dom.inspect()); } catch (e) { this.session.kv.set('DOM_INSPECT', { error: String(e.message ?? e) }); }
      try { const t = await this.dom.turns(); this.session.kv.set('DOM_TURNS', t); this._append({ k: 'dom.turns', count: t.length, roles: [...new Set(t.map((x) => x.role))] }); } catch { /* page gone */ }
    }
    try { await this.dom.clearHighlight(); } catch { /* ignore */ }
    try { await this.page?.send('Network.disable'); } catch { /* ignore */ }
    try { if (this.page && !this.page.detached) await this.conn.send('Target.detachFromTarget', { sessionId: this.page.sessionId }); } catch { /* ignore */ }
    this.conn?.close();
    this._persist();
    await this.session.raw.close();
    const verify = await this.session.verify();
    this.session.meta.status = verify.ok ? 'complete' : 'complete_with_integrity_warnings';
    this.session.meta.endedAt = new Date().toISOString();
    this.session.meta.endReason = reason;
    this.session.meta.integrity = { ok: verify.ok, records: verify.records, gapRecords: verify.gapRecords, droppedRecords: verify.droppedRecords };
    this.session.meta.transport = { reconnects: this.reconnects, maxStreamBytes: this.maxStreamBytes || null };
    try { this.session.meta.rawIndex = this.session.rawStats(); } catch { /* index is derived data */ }
    this.session.saveMeta();
    this.state = 'idle';
    const result = { id: this.session.id, dir: this.session.dir, reason, verify, summary: this.reducer.summary() };
    this.emit('stopped', result);
    return result;
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
