#!/usr/bin/env bun
// opencode.models drift audit — READ-ONLY, zero dependencies, bun-first.
// Compares declared routing (ROUTING.json) against live config state and the
// embedded catalog snapshot. Never mutates anything; exits 0 on ok/warn,
// 1 on error. Run: bun workspace/aion/ops/opencode-models/audit.mjs

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROUTING_PATH = path.join(HERE, 'ROUTING.json');
const REPO_ROOT = path.resolve(HERE, '..', '..', '..', '..');
const CFG_DIR = path.join(os.homedir(), '.config', 'opencode');
const SLIM_PATH = path.join(CFG_DIR, 'oh-my-opencode-slim.json');
const OC_PATH = path.join(CFG_DIR, 'opencode.json');
const SUPERVISOR_PATH = path.join(REPO_ROOT, 'workspace', 'aion', 'ops', 'model-failover', 'supervisor.js');

const routing = JSON.parse(readFileSync(ROUTING_PATH, 'utf8'));
const laneById = new Map(routing.lanes.map((l) => [l.lane, l]));
const exemptSet = new Set(routing.variant_exemptions || []);
const snapModels = new Map(
  [
    ...Object.values(routing.catalog_snapshot.providers).flat(),
    ...(routing.catalog_snapshot.supplements?.models ?? []),
  ].map((m) => [m.id, m])
);

const rows = [];
const say = (level, msg) => rows.push({ level, msg });
const modelRefFor = (lane) => `${lane.model}${lane.variant ? '#' + lane.variant : ''}`;

function checkConfigModel(place, declaredLane, entry) {
  if (!entry || typeof entry !== 'object') {
    say('WARN', `${place}: missing — expected ${modelRefFor(declaredLane)} (see OPENCODE-FREE-MODEL-PLAYBOOK.md §5 recipes)`);
    return;
  }
  const live = `${entry.model ?? '(none)'}${entry.variant ? '#' + entry.variant : ''}`;
  if (exemptSet.has(place)) {
    say('OK', `${place}: ${entry.model ?? '(none)'}${entry.variant ? '#' + entry.variant : ''} [variant exempt]`);
  } else if (entry.model !== declaredLane.model) {
    say('WARN', `${place}: model drift — live '${entry.model ?? '(none)'}' vs declared '${declaredLane.model}'`);
  } else if ((entry.variant ?? null) !== (declaredLane.variant ?? null)) {
    say('WARN', `${place}: variant drift — live '${entry.variant ?? '(none)'}' vs declared '${declaredLane.variant ?? '(none)'}'`);
  } else {
    say('OK', `${place}: ${live}`);
  }
}

// 1. Lane sanity inside ROUTING.json — catalog presence is advisory, variant truth is hard
for (const lane of routing.lanes) {
  const known = snapModels.get(lane.model);
  if (!known) {
    say('WARN', `lane '${lane.lane}': model '${lane.model}' NOT in catalog snapshot/supplements at ${routing.catalog_snapshot.observed_at} — route unverified, do not rely without a fresh check (catalog churns both ways)`);
  } else if (lane.variant && Array.isArray(known.variants) && known.variants.length && !known.variants.includes(lane.variant)) {
    say('ERROR', `lane '${lane.lane}': variant '${lane.variant}' not offered by '${lane.model}' (has: ${known.variants.join(', ') || 'none'})`);
  } else {
    say('OK', `lane '${lane.lane}': ${modelRefFor(lane)} [${lane.tier}]`);
  }
}

// 2. Slim preset vs declared
let slim = null;
try {
  slim = JSON.parse(readFileSync(SLIM_PATH, 'utf8'));
  const presetName = slim.preset || 'zen-free';
  const preset = (slim.presets || {})[presetName];
  if (!preset) {
    say('ERROR', `slim preset '${presetName}' not found in ${path.basename(SLIM_PATH)}`);
  } else {
    for (const [agentName, laneId] of Object.entries(routing.slim_agent_lane_map)) {
      const lane = laneById.get(laneId);
      if (agentName === 'council') continue; // handled separately
      checkConfigModel(`slim:${presetName}.${agentName}`, lane, preset[agentName]);
    }
    const seats = ((slim.council || {}).presets || {})[(slim.council || {}).default_preset || 'default'] || {};
    const councilLane = laneById.get('council');
    for (const seat of ['alpha', 'beta', 'gamma', 'delta']) {
      checkConfigModel(`slim:council.${seat}`, councilLane, seats[seat]);
    }
  }
} catch (e) {
  say('ERROR', `cannot read slim config: ${e.message}`);
}

// 3. opencode.json agent.* model overrides (informational)
try {
  const oc = JSON.parse(readFileSync(OC_PATH, 'utf8'));
  const ovr = Object.entries(oc.agent || {}).filter(([, v]) => v && (v.model || v.variant));
  if (!ovr.length) say('OK', 'opencode.json: no per-agent model overrides (preset routing owns defaults)');
  for (const [name, v] of ovr) say('OK', `opencode.json override agent.${name}: ${v.model ?? ''}${v.variant ? '#' + v.variant : ''}`);
} catch (e) {
  say('ERROR', `cannot read opencode.json: ${e.message}`);
}

// 4. Failover fallback alignment (staged supervisor)
try {
  if (!existsSync(SUPERVISOR_PATH)) {
    say('WARN', `supervisor not found: ${SUPERVISOR_PATH}`);
  } else {
    const src = readFileSync(SUPERVISOR_PATH, 'utf8');
    const bareId = String(routing.failover.fallback).split('/').pop();
    const found = src.includes(routing.failover.fallback) || src.includes(bareId);
    say(
      found ? 'OK' : 'WARN',
      `failover fallback '${routing.failover.fallback}' ${found ? 'present in' : 'NOT found in'} supervisor.js — update both if you change the production fallback`
    );
  }
} catch (e) {
  say('WARN', `failover alignment check skipped: ${e.message}`);
}

// 5. Baseline config state (per playbook: configs already point at the corrected default)
say('INFO', `routing updated_at=${routing.updated_at}  catalog snapshot=${routing.catalog_snapshot.observed_at}  free entries=${routing.catalog_snapshot.total_free_entries}`);
say('INFO', `supervisor status=${routing.failover.status} — keep inactive until host contract validation`);

const counts = { OK: 0, INFO: 0, WARN: 0, ERROR: 0 };
for (const r of rows) counts[r.level]++;
for (const r of rows) console.log(`${r.level.padEnd(5)} ${r.msg}`);
console.log(`\naudit summary: ${counts.OK} ok, ${counts.INFO} info, ${counts.WARN} warn, ${counts.ERROR} error`);
console.log('exit ' + (counts.ERROR ? 1 : 0));
process.exit(counts.ERROR ? 1 : 0);
