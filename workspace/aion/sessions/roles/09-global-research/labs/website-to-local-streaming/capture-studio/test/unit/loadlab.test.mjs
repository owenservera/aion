// Smoke test for the capture-path load lab (scripts/loadlab.mjs).
//
// Fast and deterministic on purpose: a tiny payload, no timing thresholds. The test asserts
// that the lab produces a well-formed report and that the bytes the fake browser emitted are
// byte-identical to the bytes reassembled from the saved raw log.
//
// It never asserts a latency budget: event-loop delay depends on the machine and would make
// the suite flaky. The numbers are for the report, not for CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'loadlab.mjs');

// Tiny payload: 50 KB over 4 streams, 16 KB per CDP frame, 50 rendered-DOM rows. Small
// enough to stay well under the 3 s budget, large enough that every stream shape is emitted
// at least once and the raw log really is written and read back.
const TINY = ['--mb', '0.05', '--chunk', '16', '--streams', '4', '--dom-rows', '50', '--json'];

// The lab is run once and shared: every worker is a separate process, so running it per test
// would triple the cost without testing anything new.
let cached = null;
function runLab(extra = []) {
  if (extra.length) {
    const res = spawnSync(process.execPath, [SCRIPT, ...extra], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 120_000 });
    return { res, report: null };
  }
  if (!cached) {
    const res = spawnSync(process.execPath, [SCRIPT, ...TINY], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 120_000 });
    assert.equal(res.status, 0, `loadlab exited ${res.status}\n${res.stderr || res.stdout}`);
    cached = JSON.parse(res.stdout);
  }
  return { res: null, report: cached };
}

test('load lab reports both modes with the expected shape', () => {
  const { report } = runLab();

  assert.equal(report.schema, 'aion-capture-studio.loadlab/1');
  assert.ok(Array.isArray(report.scenarios), 'scenarios must be an array');
  assert.equal(report.scenarios.length, 2, 'capture and baseline scenarios');

  const modes = report.scenarios.map((s) => s.mode).sort();
  assert.deepEqual(modes, ['baseline', 'capture']);

  assert.ok(Array.isArray(report.layers.exercised) && report.layers.exercised.length > 0);
  assert.ok(Array.isArray(report.layers.notExercised) && report.layers.notExercised.length > 0);
  assert.ok(report.layers.exercised.some((l) => l.includes('src/capture/recorder.mjs')));
  assert.ok(report.layers.exercised.some((l) => l.includes('src/store/raw-log.mjs')));

  for (const s of report.scenarios) {
    assert.equal(typeof s.wallMs, 'number');
    assert.ok(s.bytesEmitted > 0, 'the scenario must emit bytes');
    assert.equal(typeof s.bytesPerSec, 'number');
    assert.ok(s.eventLoopDelayMs, 'event loop delay must be reported');
    for (const k of ['p50', 'p99', 'max']) {
      assert.equal(typeof s.eventLoopDelayMs[k], 'number', `eventLoopDelayMs.${k} must be a number`);
    }
    assert.ok(s.memory && typeof s.memory.peakRssMb === 'number', 'peak RSS must be reported');
    assert.ok(s.syncFs && typeof s.syncFs.measured === 'boolean', 'sync fs accounting must be reported');
    assert.ok(s.counters && typeof s.counters.rawRecords === 'number', 'counters must be reported');
    assert.ok(Array.isArray(s.slowestFrames));
  }

  assert.ok(report.delta && typeof report.delta.p99Ms === 'number');
  assert.ok(report.verdict && typeof report.verdict.p99Over50ms.capture === 'boolean');
  assert.equal(typeof report.verdict.bytesEqual, 'boolean');
});

test('load lab reproduces the emitted bytes exactly from the raw log', () => {
  const { report } = runLab();
  const capture = report.scenarios.find((s) => s.mode === 'capture');

  assert.equal(capture.bytes.equal, true, 'reassembled raw bytes must equal the emitted bytes');
  assert.ok(capture.bytes.perStream.length >= 2, 'every stream must be checked');
  for (const p of capture.bytes.perStream) {
    assert.equal(p.equal, true, `stream ${p.sid} must match byte for byte`);
    assert.equal(p.emittedSha256, p.reassembledSha256);
    assert.equal(p.emittedBytes, p.reassembledBytes);
    assert.ok(p.emittedBytes > 0);
  }
  assert.ok(capture.integrity && capture.integrity.ok === true, 'the raw log must verify');
  assert.equal(capture.counters.rawGaps, 0, 'no record may be dropped');
  assert.equal(capture.counters.rawDroppedRecords, 0);
  assert.ok(capture.counters.reducerEvents > 0, 'the reducer must have decoded events');
  assert.ok(capture.counters.domBatches > 0, 'the DOM batch path must have run');

  const baseline = report.scenarios.find((s) => s.mode === 'baseline');
  assert.equal(baseline.bytes.equal, null, 'the baseline writes nothing, so there is nothing to compare');
  assert.equal(baseline.counters.rawRecords, 0, 'the baseline must not write raw records');
});

test('load lab refuses an oversized payload and prints its usage', () => {
  // One spawn covers both: the CLI prints the usage text with the error.
  const tooBig = spawnSync(process.execPath, [SCRIPT, '--mb', '4096'], { encoding: 'utf8', timeout: 60_000 });
  assert.notEqual(tooBig.status, 0, '--mb above the cap must fail');
  assert.match(tooBig.stderr, /capped at 512 MB/);
  assert.match(tooBig.stderr, /--mb N/);
  assert.match(tooBig.stderr, /--streams N/);
});
