// Studio: a loopback-only local web UI + JSON API over the recorder, sessions and profiles.
// Security: binds 127.0.0.1 only; random access token (exchanged once for an HttpOnly,
// SameSite=Strict cookie); Host and Origin checks to defeat DNS rebinding / cross-site requests.
import http from 'node:http';
import { readFileSync, createReadStream, mkdtempSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { Recorder } from '../capture/recorder.mjs';
import { listTargets, browserVersion, isReachable } from '../cdp/discovery.mjs';
import { launchChrome } from '../chrome/launch.mjs';
import { Session, listSessions } from '../store/session.mjs';
import { derive, streamBytes, stateAt, search } from '../replay/derive.mjs';
import { exportDataset, exportTranscript } from '../export/export.mjs';
import { applySuggestion } from '../profiles/apply.mjs';
import { profileDiff, normalizeProfile } from '../profiles/profiles.mjs';
import { applyModelOp } from '../profiles/model-ops.mjs';
import { extractFamilyRecords } from '../families/families.mjs';
import { ruleMatchesEvent, extractRecords } from '../shapes/extract.mjs';
import { StreamReducer } from '../replay/reducer.mjs';
import { VERSION } from '../config.mjs';
import { ScopedLearner } from '../intel/learn.mjs';
import { buildSiteContinuity, siteFromSession, continuityTime } from '../intel/continuity.mjs';

const UI = new URL('./ui/index.html', import.meta.url);

export async function startStudio({ paths, profileStore, familyStore, cdpPort = 9222, port = 7878, token = randomBytes(18).toString('base64url'), rawOptions } = {}) {
  // Persistent learning state (role models, corrections, calibration) lives in the data dir.
  const learner = new ScopedLearner(paths.learner ?? path.join(paths.root, 'learner'));
  const recorder = new Recorder({ sessionsDir: paths.sessions, profileStore, familyStore, port: cdpPort, rawOptions, learner });
  const famOpt = { families: familyStore, learner };
  const replayCache = new Map();
  // Replayed reducers for saved sessions (bounded cache) so previews run on real captured data.
  async function reducerFor(session, profile) {
    const key = session.id;
    if (replayCache.has(key)) return replayCache.get(key);
    const r = new StreamReducer({ deltaDialect: profile?.decode?.delta ?? 'auto', keepEvents: true, maxEventsPerStream: 3000 });
    for await (const rec of session.records()) r.ingest(rec);
    replayCache.set(key, r);
    if (replayCache.size > 3) replayCache.delete(replayCache.keys().next().value);
    return r;
  }
  const clients = new Set();
  const broadcast = (type, data) => { const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const c of clients) c.write(msg); };

  recorder.on('status', (s) => broadcast('status', s));
  recorder.on('started', (s) => broadcast('started', s));
  recorder.on('stopped', (r) => broadcast('stopped', { id: r.id, reason: r.reason, verify: r.verify }));
  recorder.on('warn', (e) => broadcast('warn', { message: String(e.message ?? e) }));
  recorder.on('record', (r) => broadcast('record', preview(r)));
  recorder.on('event', (e) => broadcast('event', previewEvent(e)));

  const tokenBuf = Buffer.from(token);
  const authed = (req) => {
    const cookie = /(?:^|;\s*)studio_token=([^;]+)/.exec(req.headers.cookie ?? '')?.[1];
    const given = Buffer.from(cookie ?? req.headers['x-studio-token'] ?? '');
    return given.length === tokenBuf.length && timingSafeEqual(given, tokenBuf);
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      const host = (req.headers.host ?? '').toLowerCase();
      if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(host)) return send(res, 421, { error: 'bad host' });
      if (req.headers.origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(req.headers.origin)) return send(res, 403, { error: 'bad origin' });
      if (url.pathname === '/' && url.searchParams.get('token') === token) {
        res.writeHead(302, { 'set-cookie': `studio_token=${token}; HttpOnly; SameSite=Strict; Path=/`, location: '/' });
        return res.end();
      }
      if (!authed(req)) return send(res, 401, url.pathname.startsWith('/api') ? { error: 'unauthorized' } : 'Open the studio using the tokenized URL printed in the terminal.');
      if (url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:" }); return res.end(readFileSync(UI)); }
      if (!url.pathname.startsWith('/api/')) return send(res, 404, { error: 'not found' });
      const body = req.method === 'POST' ? await readBody(req) : {};
      return await route(req, res, url, body);
    } catch (e) {
      send(res, 500, { error: String(e.message ?? e) });
    }
  });

  async function route(req, res, url, body) {
    const p = url.pathname.slice(5).split('/').map(decodeURIComponent);
    const q = Object.fromEntries(url.searchParams);
    const [a, b, c, d] = p;
    const sessionOf = (id) => Session.open(paths.sessions, id);

    if (a === 'status') {
      const reachable = await isReachable({ port: cdpPort });
      return send(res, 200, { version: VERSION, cdpPort, chrome: reachable ? (await browserVersion({ port: cdpPort })).Browser : null, recorder: recorder.status(), dataDir: paths.root });
    }
    if (a === 'live' && req.method === 'GET' && !b) {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(`event: status\ndata: ${JSON.stringify(recorder.status())}\n\n`);
      clients.add(res);
      const ka = setInterval(() => res.write(': ka\n\n'), 15000);
      req.on('close', () => { clients.delete(res); clearInterval(ka); });
      return;
    }
    if (a === 'targets') return send(res, 200, await listTargets({ port: cdpPort }));
    if (a === 'chrome' && b === 'launch') return send(res, 200, await launchChrome({ profileDir: paths.chromeProfile, port: cdpPort, url: body.url || 'about:blank' }));
    if (a === 'record' && b === 'start') { recorder.maxSessionBytes = Number(body.maxSessionBytes ?? 0); const s = await recorder.start({ target: body.target, profile: body.profile || undefined, label: body.label || undefined }); return send(res, 200, { id: s.id }); }
    if (a === 'record' && b === 'stop') {
      const r = await recorder.stop({ reason: 'user_stop' });
      if (!r) return send(res, 409, { error: 'not recording' });
      const s = sessionOf(r.id);
      const dres = await derive(s, profileStore.load(s.meta.profile.name), famOpt);
      return send(res, 200, { id: r.id, verify: r.verify, receipt: dres.receipt, recordCounts: dres.recordCounts, familyCounts: dres.familyCounts });
    }
    if (a === 'live') {
      if (recorder.state !== 'recording') return send(res, 409, { error: 'not recording' });
      if (b === 'streams') return send(res, 200, recorder.reducer.summary());
      if (b === 'stream' && d === 'events') return send(res, 200, recorder.reducer.eventsOf(c).slice(-Number(q.limit ?? 500)).map(previewEvent));
      if (b === 'stream' && d === 'assembled') return send(res, 200, recorder.reducer.assembled(c));
      if (b === 'shapes') return send(res, 200, recorder.liveReport());
      if (b === 'pause') return send(res, 200, { paused: recorder.pause() || recorder.paused });
      if (b === 'resume') return send(res, 200, { resumed: recorder.resume() });
      if (b === 'turns') return send(res, 200, await recorder.domTurns());
      if (b === 'reload') return send(res, 200, { reloaded: await recorder.reloadPage() });
      if (b === 'blocks') return send(res, 200, await recorder.domBlocks(Number(c)));
      if (b === 'inspect-dom') return send(res, 200, await recorder.inspectDom());
      if (b === 'highlight') return send(res, 200, { ok: await recorder.highlight(body.id) });
      if (b === 'snapshot') return send(res, 200, await recorder.snapshotDom());
      if (b === 'session') return send(res, 200, { id: recorder.session.id });
    }
    if (a === 'sessions' && !b) return send(res, 200, listSessions(paths.sessions));
    if (a === 'sessions') {
      const s = sessionOf(b);
      if (!c) return send(res, 200, { meta: s.meta, state: s.kv.get('STATE'), receipt: s.kv.get('RECEIPT'), datasets: listDatasets(s) });
      if (c === 'derive') { replayCache.delete(s.id); const r = await derive(s, profileStore.load(body.profile ?? s.meta.profile.name), famOpt); return send(res, 200, { records: r.records, receipt: r.receipt, recordCounts: r.recordCounts, familyCounts: r.familyCounts, transportCounts: r.summary.transportCounts }); }
      if (c === 'verify') return send(res, 200, await s.verify());
      if (c === 'streams') return send(res, 200, await s.dataset('streams').toArray());
      if (c === 'shapes') return send(res, 200, s.kv.get('SHAPES') ?? null);
      if (c === 'model') return send(res, 200, s.kv.get('MODEL') ?? null);
      if (c === 'graph') return send(res, 200, s.kv.get('GRAPH') ?? null);
      if (c === 'continuity') {
        if (req.method !== 'GET') return send(res, 405, { error: 'GET required' });
        const site = siteFromSession(s.meta);
        if (!site) return send(res, 409, { error: 'Session target has no verified site scope.' });
        if (q.at !== undefined && continuityTime(q.at) === null) return send(res, 400, { error: 'Invalid as-of timestamp.' });
        return send(res, 200, await buildSiteContinuity(paths.sessions, {
          site, eid: q.eid ?? null, asOf: q.at ?? null, limit: q.limit ?? 50,
          includeHistory: !!q.eid,
        }));
      }
      if (c === 'hypotheses') return send(res, 200, s.kv.get('HYPOTHESES') ?? null);
      if (c === 'assembled') return send(res, 200, d ? (s.kv.get('ASSEMBLED') ?? {})[d] ?? null : s.kv.get('ASSEMBLED') ?? {});
      if (c === 'dom') return send(res, 200, s.kv.get('DOM_BLOCKS') ?? []);
      if (c === 'turns') return send(res, 200, s.kv.get('DOM_TURNS') ?? []);
      if (c === 'inspect') return send(res, 200, s.kv.get('DOM_INSPECT') ?? null);
      if (c === 'dataset') return send(res, 200, await s.dataset(d).toArray(Number(q.limit ?? 500)));
      if (c === 'delete') {
        if (body.confirm !== true) return send(res, 400, { error: 'confirm required' });
        if (recorder.state === 'recording' && recorder.session?.id === s.id) return send(res, 409, { error: 'stop the recording first' });
        replayCache.delete(s.id); rmSync(s.dir, { recursive: true, force: true });
        return send(res, 200, { deleted: s.id });
      }
      if (c === 'timeline') return send(res, 200, await s.dataset('timeline').toArray(5000));
      if (c === 'raw' && d) {
        const { bytes, map } = await streamBytes(s, d);
        const max = Number(q.max ?? 2 * 1024 * 1024);
        const chunks = map.filter((m) => m.offset < max).map((m) => ({ ...m, text: bytes.subarray(m.offset, Math.min(m.offset + m.length, max)).toString('utf8') }));
        return send(res, 200, { total: bytes.length, chunks, truncatedForView: bytes.length > max });
      }
      if (c === 'events' && d) {
        const out = [];
        for await (const ev of s.dataset('events').iterate()) { if (ev.sid === d) out.push(previewEvent(ev)); if (out.length >= Number(q.limit ?? 2000)) break; }
        return send(res, 200, out);
      }
      if (c === 'revision' && d) {
        // Assembled document of one stream at revision n (intermediate vs final states).
        const { DeltaAssembler } = await import('../decode/delta.mjs');
        const prof = profileStore.load(s.meta.profile.name);
        const asm = new DeltaAssembler(prof.decode?.delta ?? 'auto');
        const n = Number(q.n ?? Infinity);
        let total = 0, lastSeq = null, lastT = null;
        for await (const ev of s.dataset('events').iterate()) {
          if (ev.sid !== d || ev.json === undefined) continue;
          if (asm.revisions >= n) { if (asm.apply(structuredClone(ev.json))) total = asm.revisions; continue; }
          asm.apply(ev.json); total = asm.revisions; lastSeq = ev.seq; lastT = ev.t;
        }
        const at = new DeltaAssembler(prof.decode?.delta ?? 'auto');
        let cnt = 0, seqAt = null, tAt = null;
        for await (const ev of s.dataset('events').iterate()) { if (ev.sid !== d || ev.json === undefined) continue; if (cnt >= n) break; if (at.apply(ev.json)) { cnt = at.revisions; seqAt = ev.seq; tAt = ev.t; } }
        return send(res, 200, { revision: cnt, total, seq: seqAt, t: tAt, doc: at.doc, texts: at.texts(1).slice(0, 5) });
      }
      if (c === 'at') return send(res, 200, await stateAt(s, Number(q.t), profileStore.load(s.meta.profile.name)));
      if (c === 'export') {
        const dir = mkdtempSync(path.join(os.tmpdir(), 'studio-export-'));
        const fmt = q.format ?? 'jsonl';
        const file = path.join(dir, `${s.id}-${q.dataset}.${fmt}`);
        await exportDataset(s, q.dataset, fmt, file);
        res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-disposition': `attachment; filename="${path.basename(file)}"` });
        return createReadStream(file).pipe(res);
      }
      if (c === 'transcript') {
        const file = path.join(mkdtempSync(path.join(os.tmpdir(), 'studio-export-')), `${s.id}.md`);
        await exportTranscript(s, file);
        res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8', 'content-disposition': `attachment; filename="${path.basename(file)}"` });
        return createReadStream(file).pipe(res);
      }
    }
    if (a === 'search') {
      const ids = q.session ? [q.session] : listSessions(paths.sessions).slice(0, Number(q.sessions ?? 20)).map((x) => x.id);
      return send(res, 200, await search(ids.map((i) => sessionOf(i)), q.q ?? '', { limit: Number(q.limit ?? 100) }));
    }
    if (a === 'profiles' && !b) return send(res, 200, profileStore.names().map((n) => { const p = profileStore.load(n); return { name: n, current: profileStore.current(n), versions: profileStore.versions(n), family: p.family, hosts: p.match?.hosts ?? [], records: (p.records ?? []).length }; }));
    if (a === 'profiles' && b === '_import') { const pr = body.profile; const saved = profileStore.save(pr.name, pr, 'imported in studio'); return send(res, 200, saved); }
    if (a === 'families' && !b) return send(res, 200, familyStore ? familyStore.names().map((n) => { const f = familyStore.load(n); return { name: n, version: f.version, description: f.description, members: f.members, entities: Object.keys(f.entities) }; }) : []);
    if (a === 'families' && b === '_register') return send(res, 200, familyStore.register(body.name, { description: body.description, entities: body.entities ?? {}, fromProfile: body.fromProfile }));
    if (a === 'families' && !c) return send(res, 200, familyStore.load(b));
    if (a === 'families' && c === 'records') {
      // Cross-site, cross-session library of canonical records for one family entity.
      const ds = `family-${b}-${q.entity ?? 'message'}`;
      const out = [];
      for (const meta of listSessions(paths.sessions)) {
        const sess = sessionOf(meta.id);
        if (!existsSync(sess.dataset(ds).file)) continue;
        for await (const r of sess.dataset(ds).iterate()) { out.push(r); if (out.length >= Number(q.limit ?? 500)) return send(res, 200, out); }
      }
      return send(res, 200, out);
    }
    if (a === 'preview') {
      // Apply a DRAFT profile to real captured data without saving it.
      const draft = normalizeProfile(body.profile ?? profileStore.load(body.profileName));
      let reducer, domTurns;
      if (body.source?.kind === 'live') { if (recorder.state !== 'recording') return send(res, 409, { error: 'not recording' }); reducer = recorder.reducer; domTurns = recorder.lastTurns ?? []; }
      else { const sess = sessionOf(body.source?.id); reducer = await reducerFor(sess, draft); domTurns = sess.kv.get('DOM_TURNS') ?? []; }
      const records = {};
      for (const rule of draft.records ?? []) {
        const rows = [];
        for (const st of reducer.streams.values()) for (const ev of st._events ?? []) if (ruleMatchesEvent(rule, ev, st)) rows.push(...extractRecords(rule, ev, st));
        records[rule.name] = { count: rows.length, sample: rows.slice(-Number(body.limit ?? 30)) };
      }
      const fam = extractFamilyRecords(draft, reducer, { session: { id: body.source?.id }, domTurns });
      const family = Object.fromEntries(Object.entries(fam).map(([k, v]) => [k, { count: v.length, sample: v.slice(-Number(body.limit ?? 30)) }]));
      return send(res, 200, { records, family });
    }
    if (a === 'profiles') {
      if (!c) return send(res, 200, profileStore.load(b, q.version ? Number(q.version) : undefined));
      if (c === 'apply') {
        const { profile, note } = applySuggestion(profileStore.load(b), body.suggestion, { action: body.action, edits: body.edits ?? {} });
        const saved = profileStore.save(b, profile, note);
        if (saved.family && familyStore?.has(saved.family)) familyStore.addMember(saved.family, b);
        if (recorder.state === 'recording' && recorder.profile.name === b) { recorder.profile = saved; recorder.net.setProfile(saved); }
        // The user's decision is a calibration signal for this suggestion kind (raw confidence is the bin input).
        const sg = body.suggestion;
        if (sg?.kind && Number.isFinite(Number(sg.confidence))) { learner.calibrator.observe(`suggestion:${sg.kind}`, Number(sg.confidence), body.action !== 'reject'); learner.save(); }
        return send(res, 200, saved);
      }
      if (c === 'rollback') return send(res, 200, profileStore.rollback(b, Number(body.version)));
      if (c === 'save') return send(res, 200, profileStore.save(b, body.profile, body.note ?? 'edited in studio'));
      if (c === 'clone') { const src = profileStore.load(body.from ?? 'generic'); return send(res, 200, profileStore.save(b, { ...src, name: b, match: { hosts: body.hosts ?? src.match.hosts }, description: body.description ?? `Site profile created from ${src.name}` }, `created from ${src.name}@v${src.version}`)); }
      if (c === 'diff') return send(res, 200, profileDiff(profileStore.load(b, Number(q.a)), profileStore.load(b, Number(q.b))));
      if (c === 'model-draft') {
        // Apply one operation to an unsaved draft; nothing is written until "save".
        const { profile, note } = applyModelOp(normalizeProfile(body.draft ?? profileStore.load(b)), body.op);
        return send(res, 200, { profile, note });
      }
      if (c === 'model') {
        const { profile, note } = applyModelOp(profileStore.load(b), body);
        const saved = profileStore.save(b, profile, note);
        if (recorder.state === 'recording' && recorder.profile.name === b) { recorder.profile = saved; recorder.net.setProfile(saved); }
        return send(res, 200, saved);
      }
      if (c === 'export') { res.writeHead(200, { 'content-type': 'application/json', 'content-disposition': `attachment; filename="${b}.profile.json"` }); return res.end(JSON.stringify(profileStore.load(b), null, 2)); }
    }
    return send(res, 404, { error: 'unknown endpoint' });
  }

  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  const actualPort = server.address().port;
  port = actualPort;
  return { server, recorder, port: actualPort, token, url: `http://127.0.0.1:${actualPort}/?token=${token}`, close: async () => { if (recorder.state === 'recording') await recorder.stop({ reason: 'studio_shutdown' }); for (const c of clients) c.end(); server.close(); } };
}

function listDatasets(s) {
  try { return readdirSync(path.join(s.dir, 'datasets')).filter((f) => f.endsWith('.jsonl')).map((f) => f.replace(/\.jsonl$/, '')); } catch { return []; }
}

function send(res, code, data) {
  const isStr = typeof data === 'string';
  res.writeHead(code, { 'content-type': isStr ? 'text/plain; charset=utf-8' : 'application/json', 'cache-control': 'no-store' });
  res.end(isStr ? data : JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const parts = [];
    req.on('data', (c) => { n += c.length; if (n > 8 * 1024 * 1024) { reject(new Error('body too large')); req.destroy(); } else parts.push(c); });
    req.on('end', () => { try { resolve(parts.length ? JSON.parse(Buffer.concat(parts).toString('utf8')) : {}); } catch (e) { reject(e); } });
  });
}

// Live feed previews keep the UI responsive; full data stays on disk and in the detail endpoints.
function preview(r) {
  const out = { seq: r.seq, t: r.t, k: r.k, sid: r.sid };
  if (r.n !== undefined) out.n = r.n;
  if (r.url) out.url = r.url;
  if (r.method) out.method = r.method;
  if (r.status !== undefined) out.status = r.status;
  if (r.mime) out.mime = r.mime;
  if (r.policy) out.policy = r.policy;
  if (r.kind) out.kind = r.kind;
  if (r.event) out.event = r.event;
  if (r.reason) out.reason = r.reason;
  if (r.error || r.errorText) out.error = r.error ?? r.errorText;
  if (r.pre) out.pre = true;
  if (r.redactions) out.redactions = r.redactions.length;
  if (r.target?.label) out.label = r.target.label;
  if (r.items) out.items = r.items.length;
  if (r.droppedRecords) out.droppedRecords = r.droppedRecords;
  if (r.k === 'ws.frame') out.size = (r.payload ?? '').length;
  return out;
}

function previewEvent(e) {
  const out = { ...e };
  const cap = (s) => (typeof s === 'string' && s.length > 4000 ? s.slice(0, 4000) + `… [+${s.length - 4000} chars in full record]` : s);
  out.data = cap(out.data); out.text = cap(out.text);
  if (out.json !== undefined) { const j = JSON.stringify(out.json); if (j.length > 8000) { out.json = undefined; out.jsonPreview = j.slice(0, 8000) + '…'; } }
  return out;
}
