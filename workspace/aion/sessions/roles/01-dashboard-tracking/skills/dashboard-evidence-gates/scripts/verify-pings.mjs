#!/usr/bin/env node
// Review-only audit of Dashboard ping receipts. Not a canonical AION schema or a live test.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const REQUIRED_CHECKS = ['authorization', 'reconnect_replay', 'duplicate_handling', 'failure_case'];
const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonempty = v => typeof v === 'string' && v.trim().length > 0;
const parseUtc = v => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(v)) return NaN;
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : NaN;
};

export function auditPingPackage(pkg) {
  const errors = [];
  const add = msg => errors.push(msg);
  if (!isObject(pkg)) return { package_complete: false, live_verified: false, errors: ['Package must be a JSON object'], stats: {} };
  const sent = pkg.sent;
  const visible = pkg.visible;
  const checks = pkg.checks;
  if (!Array.isArray(sent) || !Array.isArray(visible)) {
    return { package_complete: false, live_verified: false, errors: ['sent and visible must be arrays'], stats: {} };
  }
  if (sent.length < 10) add('Expected at least 10 independently sourced sent observations; found ' + sent.length);
  const seenSent = new Map();
  for (const [i, event] of sent.entries()) {
    if (!isObject(event) || !nonempty(event.correlation_id) || !Number.isFinite(parseUtc(event.utc)) || !nonempty(event.evidence_ref)) {
      add('sent[' + i + '] missing correlation_id, UTC timestamp, or evidence_ref'); continue;
    }
    if (seenSent.has(event.correlation_id)) add('Duplicate sent correlation_id: ' + event.correlation_id);
    seenSent.set(event.correlation_id, event);
  }
  const seenVisible = new Map();
  const devices = new Set();
  let validPairs = 0, highestLatencyMs = null;
  for (const [i, obs] of visible.entries()) {
    if (!isObject(obs) || !nonempty(obs.correlation_id) || !Number.isFinite(parseUtc(obs.utc)) || !nonempty(obs.evidence_ref) || !['android','desktop'].includes(obs.device)) {
      add('visible[' + i + '] missing correlation_id, UTC, evidence_ref, or known device'); continue;
    }
    if (seenVisible.has(obs.correlation_id)) add('Duplicate visible receipt: ' + obs.correlation_id);
    seenVisible.set(obs.correlation_id, obs);
    devices.add(obs.device);
    const emitted = seenSent.get(obs.correlation_id);
    if (!emitted) { add('No originating sent observation for ' + obs.correlation_id); continue; }
    const latency = parseUtc(obs.utc) - parseUtc(emitted.utc);
    if (!Number.isFinite(latency) || latency < 0 || latency >= 5000) {
      add('Invalid or >=5000ms event-to-visible latency for ' + obs.correlation_id + ': ' + latency + 'ms'); continue;
    }
    validPairs++;
    highestLatencyMs = Math.max(highestLatencyMs ?? 0, latency);
  }
  for (const id of seenSent.keys()) if (!seenVisible.has(id)) add('Missing visible receipt for ' + id);
  for (const device of ['android','desktop']) if (!devices.has(device)) add('Missing visible observation on ' + device);
  if (!isObject(checks)) add('checks must contain independent evidence references');
  for (const name of REQUIRED_CHECKS) {
    if (!isObject(checks?.[name]) || checks[name].passed !== true || !nonempty(checks[name].evidence_ref)) {
      add('Missing passing result and evidence_ref for ' + name);
    }
  }
  return {
    package_complete: errors.length === 0,
    live_verified: false,
    verification_note: 'Structural evidence audit only. Independently inspect cited original observations before asserting operational or M1 acceptance.',
    errors,
    stats: { sent: sent.length, visible: visible.length, validPairs, highestLatencyMs, devices: [...devices].sort() }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) { console.error('Usage: node verify-pings.mjs <receipt-package.json>'); process.exitCode = 2; }
  else {
    try {
      const out = auditPingPackage(JSON.parse(readFileSync(file, 'utf8')));
      console.log(JSON.stringify(out, null, 2));
      if (!out.package_complete) process.exitCode = 1;
    } catch (e) { console.error('Cannot audit receipt package: ' + e.message); process.exitCode = 2; }
  }
}
