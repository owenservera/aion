#!/usr/bin/env node
// AION Bus — Node runner / operator CLI.
//
// Runs the SAME bus core as the extension against a file ledger, with Node-side
// executor adapters (ACP through the real bridge host in-process; optional
// OpenCode V2 over loopback HTTP). It never touches a browser or ChatGPT.
//
//   node bin/aion-bus.mjs status | tree
//   node bin/aion-bus.mjs bind <agent> --adapter acp|opencode-v2 --ref opencode --confirmed-by "<owner ref>"
//   node bin/aion-bus.mjs grant --id g1 --agents opencode --ops send,cancel --max 3 --hours 4 --cwd C:/work --ref "<owner ref>"
//   node bin/aion-bus.mjs revoke <grant_id>
//   node bin/aion-bus.mjs send --to opencode --text "..." [--nonce X]     (live executor: needs --live)
//   node bin/aion-bus.mjs dispatch-pending [--max-age-s 300]               (MCP ingress reservations)
//   node bin/aion-bus.mjs observe <command_id> | reconcile
//   node bin/aion-bus.mjs kill [reason] | resume
//   node bin/aion-bus.mjs demo                                             (offline, fakes only)
//
// Options: --state <file> (default ~/.aion/bus/state.json, or AION_BUS_STATE)
//          --host-config-dir <dir> (bridge dir holding host.config.json; ACP executor)
//          --opencode-url http://127.0.0.1:4096 | auto (enables the opencode-v2 adapter; auto reads the service state file)
//          --json
// Starting an executor (spawning `opencode acp`) only happens for `send`,
// `dispatch-pending`, `observe` or `reconcile`, and only with --live.

import { homedir, tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';

import { createBus } from '../../extension/src/bus/bus.js';
import { ORIGIN } from '../../extension/src/bus/contracts.js';
import { createAcpExecutorAdapter } from '../../extension/src/bus/adapters/acp-executor.js';
import { createOpenCodeHttpClient, createOpenCodeV2Adapter } from '../../extension/src/bus/adapters/opencode-v2.js';
import { createFileStorage } from '../node-storage.js';
import { discoverOpenCodeService } from '../opencode-service.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const BRIDGE = resolve(HERE, '../../bridge');

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i += 1; }
    } else out._.push(a);
  }
  return out;
}

function defaultState() { return process.env.AION_BUS_STATE || join(homedir(), '.aion', 'bus', 'state.json'); }

async function liveAdapters(args) {
  const adapters = [];
  const closers = [];
  const { loadHostConfig } = await import('../../bridge/bin/aion-relay-host.mjs');
  const { assertValidConfig } = await import('../../bridge/src/config.js');
  const { createInProcessRelay } = await import('../../bridge/src/bus-relay.js');
  const config = loadHostConfig(resolve(args['host-config-dir'] ?? BRIDGE));
  assertValidConfig(config);
  const relay = createInProcessRelay({ config, requestTimeoutMs: Number(args['timeout-ms'] ?? 60_000) });
  adapters.push(createAcpExecutorAdapter({ relay }));
  closers.push(() => relay.close());
  return { adapters, closers };
}

function offlineAcpPlaceholder() {
  // Same manifest as the real adapter so bind/grant/status work without
  // spawning anything; any attempt to deliver is a positive no-send.
  return createAcpExecutorAdapter({ relay: null });
}

export async function openBus(args) {
  const state = resolve(args.state ?? defaultState());
  mkdirSync(dirname(state), { recursive: true });
  const storage = createFileStorage(state, { log: (m) => process.stderr.write(`${m}\n`) });
  let adapters = [];
  let closers = [];
  if (args.live) ({ adapters, closers } = await liveAdapters(args));
  else adapters.push(offlineAcpPlaceholder());
  if (args['opencode-url']) {
    // `--opencode-url auto` discovers the running local service (url + Basic auth) from its state file.
    const svc = args['opencode-url'] === 'auto' ? discoverOpenCodeService({ stateFile: args['opencode-state'] }) : { url: args['opencode-url'], headers: {} };
    adapters.push(createOpenCodeV2Adapter({ client: createOpenCodeHttpClient({ baseUrl: svc.url, headers: svc.headers }) }));
  }
  // A Node runner usually has no commander conversation; reports stay held.
  const bus = createBus({ storage, adapters, initialConfig: { report_back: false, ops_enabled: ['send', 'status', 'cancel'] } });
  return { bus, state, close: async () => { for (const c of closers) await c(); } };
}

function print(value, json) {
  if (json || typeof value !== 'string') process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  else process.stdout.write(`${value}\n`);
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const [cmd, ...rest] = args._;
  if (cmd === 'demo') { const { runDemo } = await import('./demo.mjs'); return runDemo({ json: !!args.json }); }
  if (!cmd || cmd === 'help') { print('see the header of bin/aion-bus.mjs or bus/README.md'); return 0; }
  const needsLive = ['send', 'dispatch-pending', 'observe', 'reconcile'].includes(cmd);
  if (needsLive && !args.live && !args['opencode-url']) {
    process.stderr.write(`${cmd} reaches a real executor; re-run with --live (ACP) or --opencode-url (V2) once the owner has granted it\n`);
    return 2;
  }
  const { bus, close } = await openBus(args);
  try {
    switch (cmd) {
      case 'status': { const s = await bus.status(); print(args.json ? s : `kill: ${s.kill.engaged}\ncommander: ${s.commander}\n${s.tree}\n\n${s.commands.map((c) => `${c.command_id} ${c.op}->${c.to} ${c.state}/${c.delivery} ${c.reason ?? ''}`).join('\n') || '(no commands)'}`, false); return 0; }
      case 'tree': print((await bus.status()).tree); return 0;
      case 'bind': print(await bus.bind(rest[0], { adapter: args.adapter, ref: args.ref, label: args.label ?? null, confirmed_by: args['confirmed-by'] })); return 0;
      case 'grant': {
        const expires = args.expires ?? new Date(Date.now() + Number(args.hours ?? 1) * 3600e3).toISOString();
        print(await bus.grant({ grant_id: args.id, ref: args.ref, agents: String(args.agents ?? '').split(',').filter(Boolean),
          ops: String(args.ops ?? 'send').split(',').filter(Boolean), max_count: Number(args.max ?? 1), rate_per_hour: Number(args.rate ?? 10),
          expires_utc: new Date(expires).toISOString(), cwd: args.cwd ?? null }));
        return 0;
      }
      case 'revoke': print(await bus.revoke(rest[0])); return 0;
      case 'kill': print(await bus.kill(rest.join(' ') || 'cli kill')); return 0;
      case 'resume': print(await bus.resume('cli')); return 0;
      case 'send': {
        const r = await bus.ingestStructured({ op: 'send', to: args.to, text: String(args.text ?? ''), nonce: args.nonce ?? `cli-${randomBytes(6).toString('hex')}`,
          origin_kind: ORIGIN.OPERATOR_CLI, origin_ref: 'cli' });
        if (!r.accepted) { print(r); return 3; }
        print({ ...r, dispatched: await bus.dispatch(r.command_id) });
        return 0;
      }
      case 'dispatch-pending': print(await bus.dispatchPending({ maxAgeMs: Number(args['max-age-s'] ?? 300) * 1000 })); return 0;
      case 'observe': print(await bus.observe(rest[0])); return 0;
      case 'reconcile': print(await bus.reconcile()); return 0;
      default: process.stderr.write(`unknown command ${cmd}\n`); return 2;
    }
  } catch (error) {
    process.stderr.write(`${error.code ?? 'error'}: ${error.detail ?? error.message}\n`);
    return 1;
  } finally { await close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => { process.exitCode = code; });
}
export { tmpdir };
