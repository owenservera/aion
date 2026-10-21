#!/usr/bin/env node
// always-on.mjs — supervise `studio record` so capture keeps running, restarting after crashes
// and rotating sessions so no single recording grows forever.
//
// Zero-dependency ESM (Node 22+). Facts this file depends on, verified in the tree:
//
//   * `record` and its real flags live in bin/commands/capture.mjs:77-94 (recordFlags).
//     `--tabs` is a string with choices all|one (capture.mjs:81), `--follow` is a boolean
//     (capture.mjs:82), `--duration SECONDS` (capture.mjs:86) is wired to a stop timer at
//     capture.mjs:193, and `--max-mb MB` (capture.mjs:89) becomes maxSessionBytes at
//     capture.mjs:130, which the recorder enforces as a clean `quota_reached` stop
//     (src/capture/recorder.mjs:499). So duration-based rotation is genuinely supported.
//   * `record` is ATTACH-ONLY: Recorder.start calls browserVersion({port})
//     (src/capture/recorder.mjs:77) and never launches Chrome. This script therefore does
//     NOT pass --no-launch (that flag exists only on `capture`, capture.mjs:250/259, not on
//     `record`). Launching the dedicated browser is done by the `launch` command
//     (capture.mjs:29-32, via ensureChrome/launchChrome in src/chrome/launch.mjs:35-77) and
//     lazily by `capture` (capture.mjs:258-263). Consequence, stated plainly: a cycle with no
//     browser serving DevTools on the port fails fast and is retried with backoff — run
//     `node bin/studio.mjs launch` once (or start the studio) before leaving this running.
//   * Data dir: CAPTURE_STUDIO_HOME (src/config.mjs:12), paths from dataPaths()
//     (src/config.mjs:18). DevTools port: setting `cdpPort`, env CAPTURE_STUDIO_CDP_PORT,
//     default 9222 (src/config.mjs:78). The port default here is read from resolveSettings(),
//     never invented.
//   * Global `--data-dir` and `--port` flags are accepted after the subcommand
//     (bin/lib/registry.mjs:7-10, parsed over the whole argv in bin/studio.mjs:55-56).
//   * With --json, `record` writes exactly one pretty-printed JSON object to stdout whose
//     `id` is the session id (bin/lib/ui.mjs:70-73, summarizeRecording capture.mjs:96-107);
//     progress/warnings go to stderr. The session id is therefore recovered by parsing the
//     accumulated stdout at exit, not per line.
//
// Usage: node scripts/always-on.mjs [--tabs all|one] [--rotate-min N] [--max-mb N] [--port N]
//        [--data-dir DIR] [--status] [--stop] [--json] [--once]
// --once runs one cycle and exits with the child's exit code; it writes no state file.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataPaths, defaultDataDir, resolveSettings } from '../src/config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STUDIO = path.join(ROOT, 'bin', 'studio.mjs');
const LOG_MAX_BYTES = 5 * 1024 * 1024;
const BACKOFF_MS = [2000, 4000, 8000, 16000, 32000, 60000];
const SHORT_CYCLE_MS = 60_000;
const MAX_SHORT_FAILURES = 15;
const STOP_WAIT_MS = 20_000;

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------
function usage(msg) {
  if (msg) process.stderr.write(`always-on: ${msg}\n`);
  process.stderr.write('usage: node scripts/always-on.mjs [--tabs all|one] [--rotate-min N] [--max-mb N] [--port N] [--data-dir DIR] [--status] [--stop] [--json] [--once]\n');
  process.exit(2);
}

function parseArgs(argv) {
  const o = { status: false, stop: false, json: false, once: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.startsWith('--') && a.includes('=') ? a.indexOf('=') : -1;
    const name = eq > 0 ? a.slice(0, eq) : a;
    const inline = eq > 0 ? a.slice(eq + 1) : null;
    const value = () => (inline !== null ? inline : argv[++i]);
    switch (name) {
      case '--tabs': o.tabs = value(); break;
      case '--rotate-min': o.rotateMin = value(); break;
      case '--max-mb': o.maxMb = value(); break;
      case '--port': o.port = value(); break;
      case '--data-dir': o.dataDir = value(); break;
      case '--status': o.status = true; break;
      case '--stop': o.stop = true; break;
      case '--json': o.json = true; break;
      case '--once': o.once = true; break;
      case '--help': case '-h': usage(); break;
      default: usage(`unknown argument "${a}"`);
    }
  }
  if (o.tabs !== undefined && !['all', 'one'].includes(o.tabs)) usage('--tabs must be all or one');
  const num = (v, label, min) => {
    if (v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min) usage(`--${label} expects a number >= ${min}`);
    return n;
  };
  o.rotateMin = num(o.rotateMin, 'rotate-min', 1) ?? 60;
  o.maxMb = num(o.maxMb, 'max-mb', 1) ?? 512;
  o.port = num(o.port, 'port', 1) ?? null;
  o.tabs = o.tabs ?? 'all';
  return o;
}

// ---------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007]*\u0007/g;
const stripAnsi = (s) => String(s).replace(ANSI, '');
const now = () => new Date().toISOString();

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function killTree(pid, { force = true } = {}) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  if (process.platform === 'win32') {
    const r = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    return r.status === 0;
  }
  try { process.kill(pid, force ? 'SIGKILL' : 'SIGTERM'); return true; } catch { return false; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitDead(pid, timeoutMs) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (!pidAlive(pid)) return true;
    await sleep(250);
  }
  return !pidAlive(pid);
}

function readJson(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

function writeJsonAtomic(file, value) {
  writeFileSync(`${file}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(`${file}.tmp`, file);
}

// ---------------------------------------------------------------------------------------------
// Logger: one line per event, appended, rotated at startup when over 5 MB.
// ---------------------------------------------------------------------------------------------
function makeLogger(file) {
  let fd = openSync(file, 'a');
  const write = (text) => {
    try { writeFileSync(fd, text); } catch { /* logging must never kill the supervisor */ }
  };
  return {
    file,
    line(kind, message) {
      const body = stripAnsi(message).replace(/\r/g, '').replace(/\n+$/, '');
      if (body === '') return;
      write(`[${now()}] ${kind} ${body}\n`);
    },
    close() { try { closeSync(fd); } catch { /* already closed */ } },
  };
}

function rotateLog(file) {
  try {
    if (existsSync(file) && statSync(file).size > LOG_MAX_BYTES) {
      const prev = `${file}.1`;
      if (existsSync(prev)) unlinkSync(prev);
      renameSync(file, prev);
    }
  } catch { /* a failed rotation is not fatal */ }
}

// ---------------------------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------------------------
function setup(argv) {
  const o = parseArgs(argv);
  const dataDir = o.dataDir ? path.resolve(o.dataDir) : defaultDataDir();
  const paths = dataPaths(dataDir);
  const settings = resolveSettings({ configFile: paths.config }).settings;
  const port = o.port ?? settings.cdpPort; // config.mjs:78 — no invented default
  mkdirSync(dataDir, { recursive: true });
  const stateFile = path.join(dataDir, 'always-on.json');
  const logFile = path.join(dataDir, 'always-on.log');
  return { ...o, dataDir, paths, port, stateFile, logFile };
}

// ---------------------------------------------------------------------------------------------
// --status
// ---------------------------------------------------------------------------------------------
function cmdStatus(cfg) {
  const state = readJson(cfg.stateFile);
  if (!state) {
    if (cfg.json) console.log(JSON.stringify({ running: false, stateFile: cfg.stateFile }, null, 2));
    else console.log(`not running (no state file at ${cfg.stateFile})`);
    return 0;
  }
  const supervisorAlive = pidAlive(state.pid);
  const childAlive = pidAlive(state.childPid);
  const running = supervisorAlive || childAlive;
  if (cfg.json) {
    console.log(JSON.stringify({ running, supervisorAlive, childAlive, ...state }, null, 2));
    return 0;
  }
  console.log(`state file: ${cfg.stateFile}`);
  console.log(`supervisor: pid ${state.pid} ${supervisorAlive ? 'alive' : 'dead'} (started ${state.startedAt})`);
  console.log(`recorder:   pid ${state.childPid ?? '-'} ${childAlive ? 'alive' : 'dead'} (started ${state.childStartedAt ?? '-'})`);
  console.log(`settings:   port ${state.port}, tabs ${state.tabs}, rotate ${state.rotateMin}m, max ${state.maxMb}MB`);
  console.log(`cycles:     ${state.cycles} (restarts ${state.restarts})`);
  console.log(`log:        ${state.logFile}`);
  console.log(running ? 'status: running' : 'status: not running (stale state file)');
  return 0;
}

// ---------------------------------------------------------------------------------------------
// --stop  (child first, then the supervisor)
// ---------------------------------------------------------------------------------------------
async function stopSignal(pid, label, log) {
  if (!pidAlive(pid)) return true;
  try { process.kill(pid, 'SIGINT'); } catch { /* win32 may refuse; taskkill follows */ }
  // On win32 process.kill(SIGINT) maps to TerminateProcess (no JS handler runs), so this wait
  // is short there and the /T /F fallback is what actually finishes the job.
  if (await waitDead(pid, STOP_WAIT_MS)) return true;
  log?.('warn', `${label} pid ${pid} ignored SIGINT for ${STOP_WAIT_MS / 1000}s; forcing`);
  return killTree(pid, { force: true });
}

async function cmdStop(cfg) {
  const state = readJson(cfg.stateFile);
  if (!state) {
    console.log('nothing is running (no state file)');
    return 0;
  }
  const log = makeLogger(cfg.logFile);
  const childAlive = pidAlive(state.childPid);
  const supervisorAlive = pidAlive(state.pid);
  if (!childAlive && !supervisorAlive) {
    log.line('info', 'stop requested but nothing is alive; removing stale state');
    log.close();
    try { unlinkSync(cfg.stateFile); } catch { /* already gone */ }
    console.log('nothing is running (removed stale state file)');
    return 0;
  }
  console.log(`stopping recorder pid ${state.childPid ?? '-'} then supervisor pid ${state.pid}`);
  log.line('info', `stop requested (child ${state.childPid ?? '-'}, supervisor ${state.pid})`);
  await stopSignal(state.childPid, 'recorder', log);          // child first
  if (state.pid !== process.pid) await stopSignal(state.pid, 'supervisor', log);
  try { unlinkSync(cfg.stateFile); } catch { /* already gone */ }
  log.line('info', 'stopped; state file removed');
  log.close();
  console.log('stopped');
  return 0;
}

// ---------------------------------------------------------------------------------------------
// One recording cycle
// ---------------------------------------------------------------------------------------------
function runCycle(cfg, log, onChild) {
  const args = [
    STUDIO, 'record',
    '--tabs', cfg.tabs,
    '--follow',
    '--duration', String(Math.round(cfg.rotateMin * 60)),
    '--max-mb', String(cfg.maxMb),
    '--json',
    '--data-dir', cfg.dataDir,
    '--port', String(cfg.port),
  ];
  const startedAt = Date.now();
  log.line('info', `spawn ${process.execPath} ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`);
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: { ...process.env, CAPTURE_STUDIO_HOME: cfg.dataDir, CAPTURE_STUDIO_CDP_PORT: String(cfg.port) },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  onChild?.(child);

  let stdout = '';
  const pump = (stream, tag) => {
    let buf = '';
    stream.setEncoding('utf8');
    stream.on('data', (d) => {
      if (tag === 'out') stdout += d;
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = stripAnsi(buf.slice(0, i));
        buf = buf.slice(i + 1);
        log.line(tag, line);
        if (tag === 'err' && line.trim() !== '') process.stdout.write(`${line}\n`);
      }
    });
    stream.on('end', () => {
      if (buf.trim() !== '') {
        const line = stripAnsi(buf);
        log.line(tag, line);
        if (tag === 'err' && line.trim() !== '') process.stdout.write(`${line}\n`);
      }
    });
  };
  pump(child.stdout, 'out');
  pump(child.stderr, 'err');

  return new Promise((resolve) => {
    child.on('error', (e) => {
      log.line('err', `spawn failed: ${e.message}`);
      resolve({ code: 1, signal: null, ms: Date.now() - startedAt, sessionId: null });
    });
    child.on('exit', (code, signal) => {
      let sessionId = null;
      try { sessionId = JSON.parse(stdout.trim())?.id ?? null; } catch { /* no JSON result */ }
      resolve({ code: code ?? (signal ? 1 : 0), signal, ms: Date.now() - startedAt, sessionId });
    });
  });
}

// ---------------------------------------------------------------------------------------------
// Supervisor loop
// ---------------------------------------------------------------------------------------------
async function cmdRun(cfg) {
  const existing = readJson(cfg.stateFile);
  if (existing && pidAlive(existing.pid)) {
    console.log(`already running (pid ${existing.pid})`);
    return 0;
  }
  rotateLog(cfg.logFile);
  const log = makeLogger(cfg.logFile);
  const state = {
    pid: process.pid,
    startedAt: now(),
    childPid: null,
    childStartedAt: null,
    port: cfg.port,
    tabs: cfg.tabs,
    rotateMin: cfg.rotateMin,
    maxMb: cfg.maxMb,
    logFile: cfg.logFile,
    cycles: 0,
    restarts: 0,
  };
  const persist = () => writeJsonAtomic(cfg.stateFile, state);
  persist();

  let child = null;
  let stopping = false;
  let backoffIndex = 0;
  let shortFailures = 0;

  const shutdown = async (why) => {
    if (stopping) return;
    stopping = true;
    log.line('info', `${why}; stopping recorder pid ${child?.pid ?? '-'}`);
    if (child && pidAlive(child.pid)) {
      try { child.kill('SIGINT'); } catch { /* ignore */ }
      if (!(await waitDead(child.pid, STOP_WAIT_MS))) killTree(child.pid, { force: true });
    }
    try { unlinkSync(cfg.stateFile); } catch { /* already gone */ }
    log.line('info', 'supervisor stopped');
    log.close();
    process.exit(0);
  };

  process.on('SIGINT', () => { shutdown('SIGINT').catch(() => process.exit(0)); });
  process.on('SIGTERM', () => { shutdown('SIGTERM').catch(() => process.exit(0)); });

  log.line('info', `supervisor pid ${process.pid} started (port ${cfg.port}, tabs ${cfg.tabs}, rotate ${cfg.rotateMin}m, max ${cfg.maxMb}MB)`);

  for (;;) {
    state.cycles += 1;
    state.childStartedAt = now();
    persist();
    log.line('info', `cycle ${state.cycles}: starting`);

    const result = await runCycle(cfg, log, (c) => {
      child = c;
      state.childPid = c.pid ?? null;
      persist();
    });

    state.childPid = null;
    persist();
    log.line(result.code === 0 ? 'info' : 'err',
      `cycle ${state.cycles} exited code=${result.code} signal=${result.signal ?? '-'} after ${Math.round(result.ms / 1000)}s` +
      (result.sessionId ? ` session=${result.sessionId}` : ' session=-'));

    if (stopping) return 0;

    const healthy = result.ms >= SHORT_CYCLE_MS;
    if (healthy) {
      backoffIndex = 0;
      shortFailures = 0;
    } else {
      shortFailures += 1;
      backoffIndex = Math.min(backoffIndex + 1, BACKOFF_MS.length - 1);
    }
    if (shortFailures >= MAX_SHORT_FAILURES) {
      log.line('fatal', `FATAL ${shortFailures} consecutive cycles shorter than ${SHORT_CYCLE_MS / 1000}s; giving up after ${state.cycles} cycles`);
      try { unlinkSync(cfg.stateFile); } catch { /* already gone */ }
      log.close();
      return 1;
    }

    const waitMs = BACKOFF_MS[backoffIndex];
    state.restarts += 1;
    persist();
    log.line('warn', `respawning in ${waitMs / 1000}s (short failures ${shortFailures}/${MAX_SHORT_FAILURES})`);
    const until = Date.now() + waitMs;
    while (Date.now() < until && !stopping) await sleep(Math.min(500, Math.max(50, until - Date.now())));
    if (stopping) return 0;
  }
}

async function cmdOnce(cfg) {
  rotateLog(cfg.logFile);
  const log = makeLogger(cfg.logFile);
  log.line('info', `one-shot cycle (port ${cfg.port}, tabs ${cfg.tabs}, rotate ${cfg.rotateMin}m, max ${cfg.maxMb}MB)`);
  const result = await runCycle(cfg, log);
  log.line(result.code === 0 ? 'info' : 'err',
    `one-shot exited code=${result.code} signal=${result.signal ?? '-'} after ${Math.round(result.ms / 1000)}s` +
    (result.sessionId ? ` session=${result.sessionId}` : ' session=-'));
  log.close();
  return result.code;
}

// ---------------------------------------------------------------------------------------------
const cfg = setup(process.argv.slice(2));
if (cfg.status) process.exit(cmdStatus(cfg));
if (cfg.stop) process.exit(await cmdStop(cfg));
if (cfg.once) process.exit(await cmdOnce(cfg));
process.exit(await cmdRun(cfg));
