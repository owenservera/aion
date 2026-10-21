#!/usr/bin/env node
// Read-only AION registration failure/provenance triage. Never opens a browser, sends, registers or writes.
import { createHash } from 'node:crypto';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SOURCES = Object.freeze({
  host: 'workspace/aion/ops/chrome-relay/velocity/src/native-host/relay.mjs',
  worker: 'workspace/aion/ops/chrome-relay/velocity/extension-dev/receive-router.js',
});
const ALLOWED_DIAGNOSTICS = new Set([
  'fetch_rejected', 'http_error', 'body_unreadable', 'body_invalid', 'timeout',
  'aborted', 'origin_not_allowed', 'body_too_large', 'response_too_large',
  'redirect_refused', 'adapter_error', 'unknown_action',
]);
const FLAGS = new Set(['--repo', '--installed-host', '--installed-worker', '--code', '--diagnostic']);

function parseArgs(args) {
  const options = {};
  if (args.length === 1 && args[0] === '--help') return { help: true };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!FLAGS.has(key) || i + 1 >= args.length || options[key] !== undefined) {
      throw new Error('Invalid arguments; use --help for supported flags');
    }
    options[key] = args[i + 1];
  }
  return options;
}

function hashFile(filename) {
  try {
    const stats = statSync(filename);
    if (!stats.isFile() || stats.size > 2 * 1024 * 1024) return null;
    return createHash('sha256').update(readFileSync(filename)).digest('hex');
  } catch { return null; }
}

function compare(root, canonical, candidate) {
  const reference = hashFile(join(root, canonical));
  if (!reference) return { status: 'REFERENCE_UNAVAILABLE' };
  if (!candidate) return { status: 'NOT_SUPPLIED' };
  const observed = hashFile(resolve(candidate));
  if (!observed) return { status: 'CANDIDATE_UNREADABLE' };
  return { status: observed === reference ? 'FILE_MATCH' : 'FILE_MISMATCH', reference_sha256: reference, candidate_sha256: observed };
}

function gitState(root) {
  function run(...args) {
    const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 3000, maxBuffer: 65536, windowsHide: true });
    return r.status === 0 && !r.error ? r.stdout.trim() : null;
  }
  const sha = run('rev-parse', '--verify', 'HEAD');
  const dirty = sha ? run('status', '--porcelain', '--untracked-files=no') : null;
  return { revision: sha && /^[a-f0-9]{40,64}$/i.test(sha) ? sha : null, tracked_dirty: dirty === null ? null : dirty !== '' };
}

function triage(code, diagnostic) {
  // Never echo untrusted/error strings: this tool accepts fixed-classification codes only.
  const safeCode = typeof code === 'string' && /^(REGISTRATION_[A-Z_]+|BINDING_NOT_AUTHORIZED)$/.test(code) ? code : null;
  const safeDiagnostic = ALLOWED_DIAGNOSTICS.has(diagnostic) ? diagnostic : null;
  if (safeDiagnostic) {
    const focus = ({
      fetch_rejected: 'page fetch/transport', http_error: 'page HTTP status',
      body_unreadable: 'page response reading', body_invalid: 'page response validation',
      timeout: 'page request timeout', aborted: 'page aborted request',
      origin_not_allowed: 'page origin validation', body_too_large: 'page size guard',
      response_too_large: 'page size guard', redirect_refused: 'page redirect guard',
      adapter_error: 'page adapter', unknown_action: 'worker/page message contract',
    })[safeDiagnostic];
    return { code: safeCode, diagnostic: safeDiagnostic, focus, next: 'Confirm installed worker/host identity, then inspect only this boundary; diagnostic is not a root-cause proof.' };
  }
  if (safeCode === 'REGISTRATION_TAB_NOT_FOUND' || safeCode === 'REGISTRATION_TAB_AMBIGUOUS')
    return { code: safeCode, diagnostic: null, focus: 'exact bound Chrome tab matching', next: 'Check actual bound thread and tab presence without scraping transcript.' };
  if (safeCode === 'REGISTRATION_LANE_MISMATCH' || safeCode === 'REGISTRATION_URL_MISMATCH')
    return { code: safeCode, diagnostic: null, focus: 'lane or exact URL binding', next: 'Verify binding and runtime source; do not switch to a different conversation.' };
  if (safeCode === 'REGISTRATION_WRITE_FAILED')
    return { code: safeCode, diagnostic: null, focus: 'registration persistence/ACL', next: 'Use existing local private-state checks without publishing registration content.' };
  return { code: safeCode, diagnostic: null, focus: 'unclassified registration failure', next: 'Verify installed host and extension revisions before changing code; absence of diagnostics does not prove a stale build.' };
}

export function inspect(options) {
  const root = resolve(options['--repo'] ?? process.cwd());
  if (!existsSync(join(root, 'workspace/aion/ops/chrome-relay/velocity'))) {
    throw new Error('AION repo root not found; pass --repo <AION repository root>');
  }
  return {
    schema: 'aion.registration.triage.v1',
    evidence: 'READ_ONLY_FILE_SNAPSHOT_NOT_LOADED_RUNTIME',
    git: gitState(root),
    source_file_comparison: {
      host: compare(root, SOURCES.host, options['--installed-host']),
      worker: compare(root, SOURCES.worker, options['--installed-worker']),
    },
    triage: triage(options['--code'], options['--diagnostic']),
    live_registration_verified: false,
    exact_thread_i1_verified: false,
  };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log('Usage: node registration-triage.mjs --repo <AION-root> [--installed-host <verified-file-snapshot>] [--installed-worker <verified-file-snapshot>] [--code REGISTRATION_FAILED] [--diagnostic fetch_rejected]');
      console.log('Read-only file snapshots cannot establish what Chrome/native messaging has actually loaded. No browser or registration actions occur.');
      return;
    }
    console.log(JSON.stringify(inspect(options), null, 2));
  } catch (error) {
    console.error('TRIAGE_INPUT_ERROR: ' + error.message.replaceAll(/[^\x20-\x7e]/g, '?').slice(0, 180));
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();
