#!/usr/bin/env node
// Capture-path load lab (Phase A.1 of docs/DESIGN-live-drive-studio.md, section 16).
//
// QUESTION
//   Does Studio's CAPTURE PATH starve the Node event loop?
//
// WHAT THIS IS
//   A hermetic load generator. No Chrome, no browser, no network, no server, no real site.
//   Synthetic CDP frames are pushed through an in-process fake DevTools socket into the REAL
//   capture code (src/cdp/client.mjs -> src/capture/network.mjs -> src/capture/recorder.mjs
//   -> src/store/raw-log.mjs -> src/replay/reducer.mjs -> src/shapes/infer.mjs, plus
//   src/capture/dom.mjs for the rendered-DOM batch path).
//
//   Every scenario runs twice:
//     capture  - the real capture path is attached (network handlers, recorder._append,
//                reducer, shapes, dataset, raw log, the recorder's own 1 s status timer and
//                5 s persist timer).
//     baseline - the SAME emitter, the SAME CDP frame parsing, but no capture handlers are
//                attached (handlers no-op). The difference between the two is therefore the
//                capture path itself, not the synthetic load generator.
//
//   Each scenario runs in its own child process so peak RSS and event-loop delay are not
//   polluted by the other one.
//
// MEASURED
//   perf_hooks.monitorEventLoopDelay (p50/p99/max), wall time, bytes/s, peak RSS, sync fs call
//   counts (when the fs facade can be instrumented), and raw byte equality: the sha256 of the
//   bytes the fake browser emitted vs the sha256 of the bytes reassembled from the saved raw
//   log with the existing replay/derive reader.
//
// SAFETY
//   Everything is written under os.tmpdir() in a fresh mkdtemp directory that is removed at the
//   end (unless --keep). The real Capture Studio data dir and any session under LOCALAPPDATA
//   are never touched. The session dir is created with Session.create() inside the temp dir.
//
// USAGE
//   node scripts/loadlab.mjs [--mb N] [--chunk KB] [--streams N] [--dom-rows N]
//                             [--seed N] [--json] [--out FILE] [--keep] [--help]
//
//   --mb N        total synthetic payload bytes across all streams (default 64, hard cap 512)
//   --chunk KB    bytes per Network.dataReceived frame (default 64)
//   --streams N   parallel HTTP streams (default 4)
//   --dom-rows N  total rendered-DOM rows across DOM batches (default 2000)
//   --seed N      deterministic seed (default 1337)
//   --json        print the JSON report on stdout (the table goes to stderr)
//   --profile     attach a V8 CPU profile summary to each scenario (slower, but names the hot
//                 functions of the capture path)
//   --out FILE    also write the JSON report to FILE
//   --keep        keep the temp session dir and print its path
//
//   Headline run:  node scripts/loadlab.mjs --mb 64 --streams 4

import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const SELF = path.resolve(process.argv[1] ?? '');
const SCHEMA = 'aion-capture-studio.loadlab/1';
const MAX_MB = 512;

// ---------------------------------------------------------------------------------------------
// Which real code this lab drives, and what it cannot reach.
// ---------------------------------------------------------------------------------------------
const LAYERS = {
  exercised: [
    'src/cdp/client.mjs — CdpConnection._onMessage (per-frame JSON.parse + inline handler dispatch) and CdpSession (real attach handshake) over an in-process fake DevTools socket',
    'src/capture/network.mjs — NetworkRecorder.attach() plus the requestWillBeSent / responseReceived / dataReceived / loadingFinished handlers, _chunk() (scrubSecrets + re-encode) and _finalize()',
    'src/capture/recorder.mjs — Recorder._append() (raw append -> reducer.ingest -> events dataset push -> shapes.observeEvent) and Recorder.status() / _persist() / liveReport() on the recorder\'s own 1 s and 5 s timers',
    'src/store/session.mjs — Session.create(), Dataset.push() (events.jsonl) and Session.verify()',
    'src/store/raw-log.mjs — RawLog.append()/flush()/_fsync()/close() (segment rotation, sha256 manifest, streams.json locator, gap accounting)',
    'src/replay/reducer.mjs — StreamReducer.ingest() (decoders + delta assembler) and StreamReducer.summary() (the 1 s status rescan)',
    'src/shapes/infer.mjs — ShapeInferencer.observeEvent() and ShapeInferencer.report() (the 5 s liveReport)',
    'src/capture/dom.mjs — DomObserver._onMessage() (per-batch JSON.parse + scrubText) through the real Runtime.bindingCalled path',
    'src/replay/derive.mjs — streamBytes() (raw byte reassembly from disk) used for the sha256 equality check',
  ],
  notExercised: [
    'Chrome itself and the real DevTools WebSocket transport (replaced by an in-process fake socket that speaks the same JSON frames)',
    'Recorder.start()/stop() lifecycle: target discovery, multi-target attach, DevTools reconnect, real session metadata from a real target',
    'the in-page DOM agent (src/capture/page-agent.js): only the binding payload it would emit is injected',
    'Network.streamResourceContent against a real browser (the arm request is answered by the fake socket)',
    'Network.eventSourceMessageReceived (es.msg), WebSocket frame capture and the retrospective getResponseBody fallback',
    'the studio HTTP server / UI, and browser rendering, paint and scroll responsiveness (those need a real browser and are outside this lab)',
  ],
  notes:
    'Recorder.start() cannot run without a live Chrome (it needs /json/version, /json/list and a real WebSocket). ' +
    'The lab therefore builds a real Recorder instance and wires the same collaborators start() wires ' +
    '(Session, StreamReducer, ShapeInferencer, events dataset, NetworkRecorder, DomObserver, and the same 1 s status / 5 s persist timers). ' +
    'Every function in the capture path is the shipped one; only the browser underneath is synthetic.',
};

// ---------------------------------------------------------------------------------------------
// Sync fs call counting.
//
// node:fs named ESM exports are snapshotted when the builtin facade is first created, so the
// patch has to be installed before ANY module imports node:fs as ESM. The worker process is
// started fresh for that reason. When the facade already existed (for example inside a test
// runner) the patch cannot take effect and the report says so instead of guessing.
// ---------------------------------------------------------------------------------------------
const PROBE_FNS = ['writeSync', 'fsyncSync', 'fdatasyncSync', 'appendFileSync', 'writeFileSync', 'renameSync', 'mkdirSync', 'openSync', 'closeSync', 'readFileSync'];

function installFsProbe() {
  const counts = {};
  const patched = {};
  for (const name of PROBE_FNS) {
    const orig = fs[name];
    if (typeof orig !== 'function') continue;
    const wrapped = function (...args) {
      counts[name] = (counts[name] ?? 0) + 1;
      return orig.apply(this, args);
    };
    fs[name] = wrapped;
    patched[name] = wrapped;
  }
  return { counts, patched, measured: false, reason: null };
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------
const DEFAULTS = { mb: 64, chunkKb: 64, streams: 4, domRows: 2000, seed: 1337 };

function usage() {
  return [
    'Capture-path load lab — hermetic event-loop starvation probe for the Studio capture path.',
    '',
    'Usage: node scripts/loadlab.mjs [options]',
    '',
    `  --mb N         total synthetic payload bytes (default ${DEFAULTS.mb}, hard cap ${MAX_MB})`,
    `  --chunk KB     bytes per Network.dataReceived frame (default ${DEFAULTS.chunkKb})`,
    `  --streams N    parallel HTTP streams (default ${DEFAULTS.streams})`,
    `  --dom-rows N   total rendered-DOM rows across batches (default ${DEFAULTS.domRows})`,
    `  --seed N       deterministic seed (default ${DEFAULTS.seed})`,
    '  --json         print the JSON report on stdout (table goes to stderr)',
    '  --profile      attach a V8 CPU profile summary to each scenario (slower)',
    '  --out FILE     also write the JSON report to FILE',
    '  --keep         keep the temp session dir and print its path',
    '  --help         show this text',
    '',
    'Headline run: node scripts/loadlab.mjs --mb 64 --streams 4',
  ].join('\n');
}

function parseArgs(argv) {
  const cfg = { ...DEFAULTS, json: false, out: null, keep: false, help: false, worker: false, mode: null, profile: false };
  const num = (v, name) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) throw new Error(`--${name} expects a positive number (got ${v})`);
    return n;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} expects a value`);
      return v;
    };
    switch (a) {
      case '--mb': cfg.mb = num(next(), 'mb'); break;
      case '--chunk': cfg.chunkKb = num(next(), 'chunk'); break;
      case '--streams': cfg.streams = Math.round(num(next(), 'streams')); break;
      case '--dom-rows': cfg.domRows = Math.round(num(next(), 'dom-rows')); break;
      case '--seed': cfg.seed = Math.round(Number(next())); break;
      case '--json': cfg.json = true; break;
      case '--profile': cfg.profile = true; break;
      case '--out': cfg.out = next(); break;
      case '--keep': cfg.keep = true; break;
      case '--help': case '-h': cfg.help = true; break;
      case '--worker': cfg.worker = true; break;
      case '--mode': cfg.mode = next(); break;
      default:
        if (a.startsWith('--') && a.includes('=')) {
          const [k, v] = a.split(/=(.*)/s);
          argv.splice(i + 1, 0, v);
          argv[i] = k;
          i--;
          break;
        }
        throw new Error(`unknown argument: ${a}`);
    }
  }
  if (cfg.mb > MAX_MB) throw new Error(`--mb is capped at ${MAX_MB} MB (got ${cfg.mb})`);
  if (cfg.streams < 1 || cfg.streams > 64) throw new Error('--streams must be between 1 and 64');
  if (cfg.chunkKb > 8192) throw new Error('--chunk is capped at 8192 KB');
  return cfg;
}

// ---------------------------------------------------------------------------------------------
// Deterministic synthetic payloads.
//
// Four wire shapes are used so the lab exercises different decoder paths:
//   sse      text/event-stream          -> SseDecoder            (one event per data block)
//   json     application/json (array)   -> ChunkedJsonDecoder    (one event per array item)
//   ndjson   application/x-ndjson       -> NdjsonDecoder         (one event per line)
//   document application/json (object)  -> WholeBodyDecoder      (whole body parsed at end)
//
// The payload bytes are generated from a seeded PRNG, so two runs with the same --seed emit
// exactly the same bytes and the sha256 comparison is meaningful.
// ---------------------------------------------------------------------------------------------
const WORDS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango'];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A byte source that can produce exact-size chunks. It keeps a small pending remainder so
// record boundaries land mid-chunk, exactly like a real socket read.
//
//   sse      "data: {...}\n\n" blocks                       -> SseDecoder
//   json     "{"..."},\n" concatenated JSON documents       -> ChunkedJsonDecoder
//   ndjson   one JSON object per line                       -> NdjsonDecoder
//   document one JSON object of exactly `budget` bytes      -> WholeBodyDecoder
//
// The caller asks for exactly the bytes it still needs, so the total is always the budget and
// the sha256 of the emitted bytes is reproducible.
function byteSource(kind, rand, budget) {
  if (kind === 'document') {
    const doc = buildDocument(rand, budget);
    let off = 0;
    return {
      kind,
      budget,
      get produced() { return off; },
      get done() { return off >= doc.length; },
      next(size) {
        const n = Math.min(size, doc.length - off);
        const out = Buffer.from(doc.subarray(off, off + n));
        off += n;
        return out;
      },
    };
  }

  let pending = Buffer.alloc(0);
  let produced = 0;
  let item = 0;
  let first = true;

  const nextUnit = () => {
    const n = String(item++).padStart(6, '0');
    const v = Math.floor(rand() * 100000);
    const t = WORDS[Math.floor(rand() * WORDS.length)];
    if (kind === 'sse') {
      const w = () => WORDS[Math.floor(rand() * WORDS.length)];
      return Buffer.from(`data: {"delta":"${w()} ${w()} ${w()} ${w()}"}\n\n`, 'utf8');
    }
    if (kind === 'ndjson') {
      return Buffer.from(`{"name":"row-${n}","value":${v},"type":"${t}"}\n`, 'utf8');
    }
    // json: concatenated top-level JSON documents with no separator. That shape is sniffed as
    // "chunked-json" (the incremental JSON scanner), which is a different decoder path from the
    // ndjson framing and from the whole-body document below.
    const sep = first ? '' : '';
    first = false;
    return Buffer.from(`${sep}{"name":"item-${n}","value":${v},"type":"${t}","score":${rand().toFixed(3)}}`, 'utf8');
  };

  return {
    kind,
    budget,
    get produced() { return produced; },
    get done() { return produced >= budget; },
    next(size) {
      const out = Buffer.allocUnsafe(size);
      let off = 0;
      while (off < size) {
        if (!pending.length) pending = nextUnit();
        const take = Math.min(size - off, pending.length);
        pending.copy(out, off, 0, take);
        off += take;
        pending = pending.subarray(take);
      }
      produced += off;
      return out;
    },
  };
}

// One JSON object of exactly `budget` bytes. The pad value carries the slack so the body is
// byte-exact (and therefore byte-comparable) without ever being truncated.
function buildDocument(rand, budget) {
  for (let keys = 64; keys >= 1; keys--) {
    const parts = [];
    for (let i = 0; i < keys; i++) parts.push(`"k${String(i).padStart(3, '0')}":"${WORDS[i % WORDS.length].repeat(3)}"`);
    const skeleton = `{${parts.join(',')}}`;
    const padLen = budget - skeleton.length - 2; // the two quote characters of the pad value
    if (padLen < 0) continue;
    parts[0] = `"k000":"${'x'.repeat(padLen)}"`;
    const doc = `{${parts.join(',')}}`;
    if (doc.length !== budget) continue;
    return Buffer.from(doc, 'utf8');
  }
  // Fallback for budgets too small for even one key: a plain string document.
  const head = '{"pad":"';
  const tail = '"}';
  const padLen = Math.max(0, budget - head.length - tail.length);
  return Buffer.from(`${head}${'x'.repeat(padLen)}${tail}`, 'utf8');
}

// ---------------------------------------------------------------------------------------------
// In-process fake DevTools socket.
//
// It speaks the same JSON frames a real browser would send, and answers the CDP commands the
// capture path issues (Target.attachToTarget, Network.enable, Network.streamResourceContent,
// Runtime.enable, Page.getFrameTree, ...). No socket, no server, no network.
// ---------------------------------------------------------------------------------------------
class FakeCdpSocket {
  constructor(handlers = {}) {
    this.listeners = new Map();
    this.handlers = handlers;
    this.closed = false;
    this.sent = 0;
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
  }

  removeEventListener(type, fn) {
    this.listeners.get(type)?.delete(fn);
  }

  _emit(type, ev) {
    for (const fn of [...(this.listeners.get(type) ?? [])]) fn(ev);
  }

  send(text) {
    this.sent++;
    const msg = JSON.parse(text);
    const result = this.handlers[msg.method]?.(msg.params ?? {}) ?? {};
    const reply = { id: msg.id, result };
    queueMicrotask(() => { if (!this.closed) this.deliver(reply); });
  }

  deliver(obj) {
    this._emit('message', { data: JSON.stringify(obj) });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this._emit('close', { code: 1000, reason: 'loadlab' });
  }
}

const CDP_HANDLERS = {
  'Target.attachToTarget': () => ({ sessionId: 'LAB-SESSION-1' }),
  'Target.setAutoAttach': () => ({}),
  'Target.setDiscoverTargets': () => ({}),
  'Target.getTargets': () => ({ targetInfos: [] }),
  'Network.enable': () => ({}),
  'Network.disable': () => ({}),
  'Network.streamResourceContent': () => ({ bufferedData: '' }),
  'Network.getResponseBody': () => ({ body: '', base64Encoded: false }),
  'Runtime.enable': () => ({}),
  'Runtime.addBinding': () => ({}),
  'Runtime.evaluate': () => ({ result: { value: { blocks: [], turns: [] } } }),
  'Page.enable': () => ({}),
  'Page.addScriptToEvaluateOnNewDocument': () => ({}),
  'Page.getFrameTree': () => ({ frameTree: { frame: { id: 'LAB-FRAME-1' } } }),
  'Page.createIsolatedWorld': () => ({ executionContextId: 1 }),
  'Page.setLifecycleEventsEnabled': () => ({}),
};

// ---------------------------------------------------------------------------------------------
// One scenario (one child process).
// ---------------------------------------------------------------------------------------------
async function runScenario({ mode, cfg }) {
  const probe = installFsProbe();
  const warnings = [];
  const capture = mode === 'capture';

  // The capture stack is only imported when it is actually attached, so the baseline worker
  // really is "same emitter, handlers no-op" and does not even load the capture modules.
  // The import order matters for the fs probe: the first module that imports node:fs as ESM
  // creates the builtin facade, so the probe has to be installed before this point (it is).
  const { DomObserver } = await import('../src/capture/dom.mjs');
  const { CdpConnection } = await import('../src/cdp/client.mjs');
  const { normalizeProfile } = await import('../src/profiles/profiles.mjs');
  const { Recorder } = capture ? await import('../src/capture/recorder.mjs') : { Recorder: null };
  const { NetworkRecorder } = capture ? await import('../src/capture/network.mjs') : { NetworkRecorder: null };
  const { StreamReducer } = capture ? await import('../src/replay/reducer.mjs') : { StreamReducer: null };
  const { ShapeInferencer } = capture ? await import('../src/shapes/infer.mjs') : { ShapeInferencer: null };
  const { Session } = capture ? await import('../src/store/session.mjs') : { Session: null };
  const { streamBytes } = capture ? await import('../src/replay/derive.mjs') : { streamBytes: null };

  const esmFs = await import('node:fs');
  probe.measured = Object.keys(probe.patched).every((n) => esmFs[n] === probe.patched[n]);
  if (!probe.measured) probe.reason = 'node:fs ESM facade was created before the probe was installed (this process imported node:fs first)';

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-loadlab-'));
  const safeTmp = path.resolve(os.tmpdir());
  if (!path.resolve(tmpRoot).startsWith(safeTmp)) throw new Error(`Refusing to write outside the temp dir: ${tmpRoot}`);
  if (/capture-studio/i.test(tmpRoot)) throw new Error(`Refusing to use a capture-studio data path: ${tmpRoot}`);

  const profile = normalizeProfile({
    name: 'loadlab',
    capture: { websockets: false, retrospectiveFallback: true },
    dom: { enabled: true, flushMs: 100 },
  });

  const pageUrl = 'https://lab.invalid/';
  const rand = mulberry32(cfg.seed);

  // ---- plan the streams -------------------------------------------------------------------
  const totalBytes = Math.round(cfg.mb * 1024 * 1024);
  const chunkBytes = Math.round(cfg.chunkKb * 1024);
  const nStreams = cfg.streams;
  // The last stream is reserved for the whole-body JSON document shape, with a bounded budget
  // so that decoder never holds more than a few MB in memory.
  const documentBudget = Math.min(4 * 1024 * 1024, Math.floor(totalBytes / nStreams));
  const otherCount = Math.max(1, nStreams - (nStreams >= 4 ? 1 : 0));
  const otherBudget = Math.floor((totalBytes - documentBudget) / otherCount);
  const shapes = ['sse', 'json', 'ndjson', 'document'];
  const streams = [];
  for (let i = 0; i < nStreams; i++) {
    const isDocument = nStreams >= 4 && i === nStreams - 1;
    const budget = isDocument ? documentBudget : otherBudget;
    const kind = isDocument ? 'document' : shapes[i % 3];
    const mime = kind === 'sse' ? 'text/event-stream' : kind === 'ndjson' ? 'application/x-ndjson' : 'application/json';
    streams.push({
      index: i,
      kind,
      mime,
      budget,
      requestId: `lab-req-${i}`,
      sid: `p:lab-req-${i}`,
      url: `https://lab.invalid/api/feed/${kind}-${i}`,
      source: byteSource(kind, rand, budget),
      hash: crypto.createHash('sha256'),
      bytesEmitted: 0,
      chunks: 0,
    });
  }

  // ---- build the capture stack ------------------------------------------------------------
  let recorder = null;
  let session = null;
  let dom = null;
  let socket = null;
  let cdpSession = null;

  if (capture) {
    recorder = new Recorder({
      sessionsDir: tmpRoot,
      profileStore: null,
      liveEventsPerStream: 2000,
      maxStreamBytes: 0,
      allBodies: true,
    });
    recorder.profile = profile;
    recorder.pageUrl = pageUrl;
    recorder.state = 'recording';
    recorder.startedAt = Date.now();
    recorder.session = Session.create(tmpRoot, {
      site: 'loadlab',
      rawOptions: {},
      meta: {
        target: { id: 'LAB-TARGET', url: pageUrl, title: 'load lab' },
        profile: { name: profile.name, version: profile.version },
        options: { loadlab: true, mode },
        node: process.version,
      },
    });
    recorder.reducer = new StreamReducer({ deltaDialect: profile.decode?.delta ?? 'auto', maxEventsPerStream: 2000 });
    recorder.shapes = new ShapeInferencer();
    recorder.eventsDs = recorder.session.dataset('events');
    const append = (rec) => recorder._append(rec);
    recorder.net = new NetworkRecorder({
      append,
      profile,
      getPageUrl: () => recorder.pageUrl,
      options: { allBodies: true, maxStreamBytes: 0 },
    });
    recorder.net.on('error', (e) => warnings.push(`network handler error: ${e?.message ?? e}`));
    recorder.dom = new DomObserver({ append, profile });
    session = recorder.session;
    dom = recorder.dom;
  } else {
    // Baseline still builds the same collaborators (so the emitter is byte-identical) but never
    // attaches them to the session: the handlers are no-ops.
    dom = new DomObserver({ append: () => {}, profile });
  }

  socket = new FakeCdpSocket(CDP_HANDLERS);
  const conn = new CdpConnection(socket, { requestTimeoutMs: 0, url: 'ws://127.0.0.1:0/loadlab' });
  cdpSession = await conn.attach('LAB-TARGET');
  if (capture) {
    await recorder.net.attach(cdpSession, 'p', { type: 'page' });
    await recorder.dom.attach(cdpSession);
  }

  // The recorder's own periodic work (recorder.mjs:148-149). The lab reproduces the exact
  // cadence because start() cannot run without Chrome. The baseline has no recorder, so it has
  // no periodic work at all.
  let statusTicks = 0;
  let persistTicks = 0;
  const statusTimer = capture ? setInterval(() => {
    try { recorder.emit('status', recorder.status()); statusTicks++; } catch (e) { warnings.push(`status timer: ${e?.message ?? e}`); }
  }, 1000) : null;
  const persistTimer = capture ? setInterval(() => {
    try { recorder._persist(); persistTicks++; } catch (e) { warnings.push(`persist timer: ${e?.message ?? e}`); }
  }, 5000) : null;
  statusTimer?.unref?.();
  persistTimer?.unref?.();

  // ---- instrument --------------------------------------------------------------------------
  const { monitorEventLoopDelay } = await import('node:perf_hooks');
  const hist = monitorEventLoopDelay({ resolution: 10 });
  hist.enable();

  let datasetPushes = 0;
  if (capture) {
    const ds = recorder.eventsDs;
    const origPush = ds.push.bind(ds);
    ds.push = (items) => { datasetPushes++; return origPush(items); };
  }
  let rawFlushBatches = 0;
  if (capture) session.raw.on('written', () => { rawFlushBatches++; });

  const maxFrame = { ms: 0, method: null, kind: null, frame: null };
  const slowestFrames = [];
  let cdpFrames = 0;
  let dataFrames = 0;
  let controlFrames = 0;
  let domFrames = 0;

  const rssStart = process.memoryUsage().rss;
  let rssPeak = rssStart;
  const tick = () => new Promise((r) => setImmediate(r));

  const deliver = (obj, method, kind = null) => {
    const t0 = process.hrtime.bigint();
    socket.deliver(obj);
    const dt = Number(process.hrtime.bigint() - t0) / 1e6;
    cdpFrames++;
    if (dt > maxFrame.ms) { maxFrame.ms = dt; maxFrame.method = method; maxFrame.kind = kind; maxFrame.frame = cdpFrames; }
    slowestFrames.push({ ms: Math.round(dt * 1000) / 1000, method, kind, frame: cdpFrames });
    if (slowestFrames.length > 40) slowestFrames.sort((a, b) => b.ms - a.ms);
    if (cdpFrames % 32 === 0) { const r = process.memoryUsage().rss; if (r > rssPeak) rssPeak = r; }
  };

  // ---- emit the workload -------------------------------------------------------------------
  const t0 = process.hrtime.bigint();

  for (const s of streams) {
    deliver({
      method: 'Network.requestWillBeSent',
      sessionId: cdpSession.sessionId,
      params: {
        requestId: s.requestId,
        loaderId: 'LAB-LOADER',
        documentURL: pageUrl,
        request: { url: s.url, method: 'GET', headers: { accept: '*/*' }, hasPostData: false },
        timestamp: 1000 + s.index,
        wallTime: 1700000000 + s.index,
        initiator: { type: 'other' },
        type: 'Fetch',
        frameId: 'LAB-FRAME-1',
      },
    }, 'Network.requestWillBeSent');
    controlFrames++;
    await tick();

    deliver({
      method: 'Network.responseReceived',
      sessionId: cdpSession.sessionId,
      params: {
        requestId: s.requestId,
        timestamp: 1000.5 + s.index,
        type: 'Fetch',
        response: {
          url: s.url,
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': s.mime, 'content-length': String(s.budget) },
          mimeType: s.mime,
          protocol: 'h2',
          remoteIPAddress: '127.0.0.1',
          remotePort: 443,
          fromDiskCache: false,
          fromPrefetchCache: false,
          encodedDataLength: 0,
          securityState: 'secure',
        },
      },
    }, 'Network.responseReceived');
    controlFrames++;
    await tick();
  }

  // DOM batches are interleaved with the network traffic, like a page that keeps re-rendering.
  const domBatchRows = 100;
  const domBatches = Math.ceil(cfg.domRows / domBatchRows);
  let domRowsSent = 0;
  let domBatchIndex = 0;

  const emitDomBatch = () => {
    const rows = Math.min(domBatchRows, cfg.domRows - domRowsSent);
    if (rows <= 0) return;
    const items = [];
    for (let i = 0; i < rows; i++) {
      const n = domRowsSent + i;
      items.push({
        id: `row-${String(n).padStart(6, '0')}`,
        sig: `div.list > li.item:nth-child(${(n % 50) + 1})`,
        text: `Virtualized row ${n} — deterministic synthetic rendered text ${WORDS[n % WORDS.length]} ${WORDS[(n + 3) % WORDS.length]}`,
        tag: 'LI',
        op: n % 10 === 0 ? 'added' : 'updated',
      });
    }
    domRowsSent += rows;
    domBatchIndex++;
    deliver({
      method: 'Runtime.bindingCalled',
      sessionId: cdpSession.sessionId,
      params: { name: dom.binding, payload: JSON.stringify({ type: 'dom.batch', url: pageUrl, items }) },
    }, 'Runtime.bindingCalled');
    domFrames++;
  };

  const active = streams.filter((s) => s.budget > 0);
  let chunkIndex = 0;
  const domEvery = Math.max(1, Math.ceil(active.reduce((a, s) => a + Math.ceil(s.budget / chunkBytes), 0) / Math.max(1, domBatches)));
  while (active.length) {
    for (let i = active.length - 1; i >= 0; i--) {
      const s = active[i];
      const want = Math.min(chunkBytes, s.budget - s.bytesEmitted);
      if (want <= 0) { active.splice(i, 1); continue; }
      const buf = s.source.next(want);
      if (!buf.length) { active.splice(i, 1); continue; }
      s.hash.update(buf);
      s.bytesEmitted += buf.length;
      s.chunks++;
      deliver({
        method: 'Network.dataReceived',
        sessionId: cdpSession.sessionId,
        params: {
          requestId: s.requestId,
          timestamp: 1001 + chunkIndex * 0.001,
          data: buf.toString('base64'),
          encodedDataLength: buf.length,
        },
      }, 'Network.dataReceived', s.kind);
      dataFrames++;
      await tick();

      if (domBatchIndex < domBatches && chunkIndex % domEvery === 0) {
        emitDomBatch();
        await tick();
      }
      chunkIndex++;
    }
  }
  while (domBatchIndex < domBatches) {
    emitDomBatch();
    await tick();
  }

  for (const s of streams) {
    deliver({
      method: 'Network.loadingFinished',
      sessionId: cdpSession.sessionId,
      params: { requestId: s.requestId, timestamp: 2000 + s.index, encodedDataLength: s.bytesEmitted },
    }, 'Network.loadingFinished');
    controlFrames++;
    await tick();
  }

  const wallMs = Number(process.hrtime.bigint() - t0) / 1e6;
  hist.disable();

  rssPeak = Math.max(rssPeak, process.memoryUsage().rss);

  // ---- shut the capture stack down and verify the bytes ------------------------------------
  clearInterval(statusTimer);
  clearInterval(persistTimer);

  let integrity = null;
  const perStream = [];
  let bytesEqual = null;
  let rawBytes = 0;

  if (capture) {
    await session.raw.close();
    integrity = await session.verify();
    rawBytes = session.raw.stats.bytes;
    for (const s of streams) {
      const { bytes } = await streamBytes(session, s.sid);
      const reassembledSha = crypto.createHash('sha256').update(bytes).digest('hex');
      const emittedSha = s.hash.digest('hex');
      perStream.push({
        sid: s.sid,
        kind: s.kind,
        mime: s.mime,
        chunks: s.chunks,
        emittedBytes: s.bytesEmitted,
        emittedSha256: emittedSha,
        reassembledBytes: bytes.length,
        reassembledSha256: reassembledSha,
        equal: emittedSha === reassembledSha && bytes.length === s.bytesEmitted,
      });
    }
    bytesEqual = perStream.length > 0 && perStream.every((p) => p.equal);
  }

  const counters = {
    cdpFrames,
    dataFrames,
    controlFrames,
    domFrames,
    domBatches: domBatchIndex,
    domRows: domRowsSent,
    statusTicks,
    persistTicks,
    datasetPushes,
    rawFlushBatches,
    rawRecords: capture ? session.raw.stats.records : 0,
    rawIndexEntries: capture ? session.raw.stats.indexEntries : 0,
    rawGaps: capture ? session.raw.stats.gaps : 0,
    rawDroppedRecords: capture ? session.raw.stats.droppedRecords : 0,
    reducerEvents: capture ? recorder.reducer.totals.events : 0,
    reducerBytes: capture ? recorder.reducer.totals.bytes : 0,
    networkChunks: capture ? recorder.net.stats.chunks : 0,
    networkBytes: capture ? recorder.net.stats.bytes : 0,
    networkRedactions: capture ? recorder.net.stats.redactions : 0,
    handlerErrors: capture ? recorder.net.stats.handlerErrors : 0,
    domBlocks: capture ? recorder.reducer.dom.blocks.size : 0,
    shapeGroups: capture ? recorder.shapes.groups.size : 0,
  };

  const delay = {
    resolutionMs: 10,
    p50: round3(hist.percentile(50) / 1e6),
    p99: round3(hist.percentile(99) / 1e6),
    max: round3(hist.max / 1e6),
    mean: round3(hist.mean / 1e6),
    min: round3(hist.min / 1e6),
    samples: hist.count,
  };

  const syncFs = {
    measured: probe.measured,
    reason: probe.reason,
    ...(probe.measured
      ? { writeSync: probe.counts.writeSync ?? 0, fsyncSync: probe.counts.fsyncSync ?? 0, appendFileSync: probe.counts.appendFileSync ?? 0, writeFileSync: probe.counts.writeFileSync ?? 0, renameSync: probe.counts.renameSync ?? 0, mkdirSync: probe.counts.mkdirSync ?? 0, openSync: probe.counts.openSync ?? 0, closeSync: probe.counts.closeSync ?? 0, readFileSync: probe.counts.readFileSync ?? 0, total: Object.values(probe.counts).reduce((a, b) => a + b, 0) }
      : { total: null }),
  };

  const result = {
    mode,
    label: capture ? 'capture ON (real capture path)' : 'baseline OFF (same emitter, handlers no-op)',
    wallMs: round3(wallMs),
    bytesEmitted: streams.reduce((a, s) => a + s.bytesEmitted, 0),
    bytesPerSec: wallMs > 0 ? Math.round((streams.reduce((a, s) => a + s.bytesEmitted, 0) / wallMs) * 1000) : 0,
    eventLoopDelayMs: delay,
    maxFrameHandlerMs: { ms: round3(maxFrame.ms), method: maxFrame.method, kind: maxFrame.kind, frame: maxFrame.frame },
    slowestFrames: slowestFrames.sort((a, b) => b.ms - a.ms).slice(0, 5),
    memory: {
      peakRssMb: round3(Math.max(rssPeak, process.resourceUsage().maxRSS * 1024) / (1024 * 1024)),
      rssStartMb: round3(rssStart / (1024 * 1024)),
      rssEndMb: round3(process.memoryUsage().rss / (1024 * 1024)),
      processMaxRssMb: round3((process.resourceUsage().maxRSS * 1024) / (1024 * 1024)),
    },
    syncFs,
    counters,
    bytes: {
      equal: bytesEqual,
      rawLogBytes: rawBytes,
      perStream,
    },
    integrity: integrity
      ? { ok: integrity.ok, records: integrity.records, gapRecords: integrity.gapRecords, droppedRecords: integrity.droppedRecords, unexplainedSeqGaps: integrity.unexplainedSeqGaps ?? 0 }
      : null,
    warnings,
  };

  try { conn.close(); } catch { /* ignore */ }
  if (!cfg.keep) {
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* ignore */ }
  } else {
    result.tempDir = tmpRoot;
  }
  return result;
}

function round3(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1000) / 1000;
}

// ---------------------------------------------------------------------------------------------
// Parent: run both scenarios and report.
// ---------------------------------------------------------------------------------------------
function runWorker(mode, cfg) {
  const args = [SELF, '--worker', '--mode', mode, '--mb', String(cfg.mb), '--chunk', String(cfg.chunkKb),
    '--streams', String(cfg.streams), '--dom-rows', String(cfg.domRows), '--seed', String(cfg.seed)];
  if (cfg.keep) args.push('--keep');
  let profileDir = null;
  if (cfg.profile) {
    profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-loadlab-prof-'));
    // The profiler flags must be real command line arguments (Node does not honour them through
    // spawnSync's execArgv), and they have to come before the script path.
    args.unshift(`--cpu-prof-dir=${profileDir}`, '--cpu-prof');
  }
  const res = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (profileDir) {
    try {
      const summary = summarizeProfile(profileDir);
      if (summary) res.profile = summary;
    } finally {
      try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }
  if (res.status !== 0) {
    throw new Error(`worker ${mode} failed (exit ${res.status}):\n${res.stderr || res.stdout || '(no output)'}`);
  }
  const line = (res.stdout || '').trim().split('\n').filter(Boolean).at(-1);
  if (!line) throw new Error(`worker ${mode} produced no output:\n${res.stderr || ''}`);
  let scenario;
  try {
    scenario = JSON.parse(line);
  } catch (e) {
    throw new Error(`worker ${mode} produced invalid JSON: ${e.message}\n${line.slice(0, 400)}`);
  }
  if (res.profile) scenario.cpuProfile = res.profile;
  return scenario;
}

// Self-time summary of a V8 CPU profile: which functions of the capture path actually burn
// the event loop. Only used with --profile.
function summarizeProfile(dir) {
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.cpuprofile')); } catch { return null; }
  if (!files.length) return null;
  const prof = JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf8'));
  const byId = new Map(prof.nodes.map((n) => [n.id, n]));
  const self = new Map();
  for (let i = 0; i < prof.samples.length; i++) {
    const id = prof.samples[i];
    const dt = prof.timeDeltas?.[i] ?? 0;
    self.set(id, (self.get(id) ?? 0) + dt);
  }
  const agg = new Map();
  for (const [id, t] of self) {
    const n = byId.get(id);
    if (!n) continue;
    const cf = n.callFrame;
    const file = (cf.url || '').split(/[\\/]/).slice(-2).join('/');
    const key = `${cf.functionName || '(anonymous)'} @ ${file}:${(cf.lineNumber ?? 0) + 1}`;
    agg.set(key, (agg.get(key) ?? 0) + t / 1000);
  }
  const total = [...agg.values()].reduce((a, b) => a + b, 0);
  return {
    totalMs: Math.round(total),
    top: [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
      .map(([fn, ms]) => ({ fn, ms: Math.round(ms), pct: +(ms / total * 100).toFixed(1) })),
  };
}

function buildReport(cfg, scenarios) {
  const capture = scenarios.find((s) => s.mode === 'capture');
  const baseline = scenarios.find((s) => s.mode === 'baseline');
  const d = (a, b) => (a === null || a === undefined || b === null || b === undefined ? null : round3(a - b));
  const threshold = 50;
  const over = (s) => !!s && s.eventLoopDelayMs.p99 !== null && s.eventLoopDelayMs.p99 > threshold;
  return {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    config: {
      mb: cfg.mb,
      chunkKb: cfg.chunkKb,
      streams: cfg.streams,
      domRows: cfg.domRows,
      seed: cfg.seed,
      eventLoopDelayResolutionMs: 10,
      p99ThresholdMs: threshold,
    },
    layers: LAYERS,
    scenarios,
    hotPath: capture?.cpuProfile
      ? { note: 'V8 CPU profile self time of the capture scenario (worker process, whole run).', totalMs: capture.cpuProfile.totalMs, top: capture.cpuProfile.top.slice(0, 12) }
      : null,
    delta: {
      wallMs: d(capture?.wallMs, baseline?.wallMs),
      bytesPerSec: capture && baseline ? round3(capture.bytesPerSec - baseline.bytesPerSec) : null,
      p50Ms: d(capture?.eventLoopDelayMs.p50, baseline?.eventLoopDelayMs.p50),
      p99Ms: d(capture?.eventLoopDelayMs.p99, baseline?.eventLoopDelayMs.p99),
      maxMs: d(capture?.eventLoopDelayMs.max, baseline?.eventLoopDelayMs.max),
      maxFrameHandlerMs: d(capture?.maxFrameHandlerMs.ms, baseline?.maxFrameHandlerMs.ms),
      peakRssMb: d(capture?.memory.peakRssMb, baseline?.memory.peakRssMb),
    },
    verdict: {
      p99Over50ms: { capture: over(capture), baseline: over(baseline) },
      captureStarvesLoop: !!(capture && baseline && capture.eventLoopDelayMs.p99 > threshold && capture.eventLoopDelayMs.p99 > (baseline.eventLoopDelayMs.p99 ?? 0) + 5),
      bytesEqual: capture?.bytes?.equal ?? null,
      note: 'p99 above 50 ms in the capture scenario but not in the baseline points at the capture path, not at the load generator.',
    },
  };
}

function table(report) {
  const rows = [];
  const pad = (v, n, right = true) => {
    const s = String(v);
    return right ? s.padStart(n) : s.padEnd(n);
  };
  const head = [
    pad('scenario', 22, false), pad('mode', 6), pad('wall ms', 10), pad('payload MB', 12), pad('MB/s', 9),
    pad('p50 ms', 9), pad('p99 ms', 9), pad('max ms', 10), pad('peak RSS MB', 13), pad('sync fs', 10), pad('bytes equal', 12),
  ].join(' ');
  rows.push(head);
  rows.push('-'.repeat(head.length));
  for (const s of report.scenarios) {
    rows.push([
      pad(s.mode, 22, false),
      pad(s.mode === 'capture' ? 'ON' : 'OFF', 6),
      pad(s.wallMs.toFixed(0), 10),
      pad((s.bytesEmitted / 1048576).toFixed(1), 12),
      pad((s.bytesPerSec / 1048576).toFixed(2), 9),
      pad(s.eventLoopDelayMs.p50?.toFixed(2), 9),
      pad(s.eventLoopDelayMs.p99?.toFixed(2), 9),
      pad(s.eventLoopDelayMs.max?.toFixed(2), 10),
      pad(s.memory.peakRssMb?.toFixed(0), 13),
      pad(s.syncFs.measured ? s.syncFs.total : 'n/a', 10),
      pad(s.bytes.equal === null ? 'n/a' : String(s.bytes.equal), 12),
    ].join(' '));
  }
  const d = report.delta;
  rows.push('-'.repeat(head.length));
  rows.push([
    pad('lag delta (capture - baseline)', 22, false), pad('', 6), pad(d.wallMs?.toFixed(0), 10), pad('', 12), pad('', 9),
    pad(d.p50Ms?.toFixed(2), 9), pad(d.p99Ms?.toFixed(2), 9), pad(d.maxMs?.toFixed(2), 10), pad(d.peakRssMb?.toFixed(0), 13), pad('', 10), pad('', 12),
  ].join(' '));
  rows.push('');
  rows.push(`p99 > ${report.config.p99ThresholdMs} ms: capture=${report.verdict.p99Over50ms.capture} baseline=${report.verdict.p99Over50ms.baseline}`);
  rows.push(`raw byte equality (capture): ${report.verdict.bytesEqual}`);
  const c = report.scenarios.find((s) => s.mode === 'capture');
  if (c) {
    rows.push(`capture counters: rawRecords=${c.counters.rawRecords} reducerEvents=${c.counters.reducerEvents} datasetPushes=${c.counters.datasetPushes} domBatches=${c.counters.domBatches} statusTicks=${c.counters.statusTicks} persistTicks=${c.counters.persistTicks} gaps=${c.counters.rawGaps} dropped=${c.counters.rawDroppedRecords}`);
    rows.push(`slowest single CDP frame: ${c.maxFrameHandlerMs.ms} ms (${c.maxFrameHandlerMs.method}${c.maxFrameHandlerMs.kind ? `, ${c.maxFrameHandlerMs.kind}` : ''})`);
  }
  if (report.hotPath) {
    rows.push('');
    rows.push(`hot path (capture, V8 self time, ${report.hotPath.totalMs} ms total):`);
    for (const h of report.hotPath.top.slice(0, 8)) rows.push(`  ${String(h.pct).padStart(5)}%  ${String(h.ms).padStart(7)} ms  ${h.fn}`);
  }
  return rows.join('\n');
}

async function main() {
  let cfg;
  try {
    cfg = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`loadlab: ${e.message}\n\n${usage()}\n`);
    process.exitCode = 2;
    return;
  }
  if (cfg.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (cfg.worker) {
    const mode = cfg.mode === 'baseline' ? 'baseline' : 'capture';
    const scenario = await runScenario({ mode, cfg });
    process.stdout.write(`${JSON.stringify(scenario)}\n`);
    return;
  }

  const scenarios = [];
  for (const mode of ['capture', 'baseline']) {
    process.stderr.write(`loadlab: running ${mode}...\n`);
    scenarios.push(runWorker(mode, cfg));
  }
  const report = buildReport(cfg, scenarios);
  const text = table(report);

  if (cfg.out) {
    fs.mkdirSync(path.dirname(path.resolve(cfg.out)), { recursive: true });
    fs.writeFileSync(path.resolve(cfg.out), `${JSON.stringify(report, null, 2)}\n`);
  }
  if (cfg.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.stderr.write(`${text}\n`);
  } else {
    process.stdout.write(`${text}\n`);
  }
}

await main();
