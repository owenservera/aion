// Node runner: file storage durability + cross-process locking, CLI gates and the offline demo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { createFileStorage } from '../node-storage.js';
import { createBusStore } from '../../extension/src/bus/ledger.js';
import { parseArgs } from '../bin/aion-bus.mjs';

const CLI = fileURLToPath(new URL('../bin/aion-bus.mjs', import.meta.url));
const dir = () => mkdtempSync(join(tmpdir(), 'aion-bus-runner-'));
const cli = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 60000 });

test('file storage round-trips and writes atomically (no temp file left)', async () => {
  const p = join(dir(), 'state.json');
  const s = createFileStorage(p);
  assert.deepEqual(await s.get('k'), {});
  await s.set({ k: { a: 1 } });
  assert.deepEqual(await s.get('k'), { k: { a: 1 } });
  assert.ok(!existsSync(`${p}.${process.pid}.tmp`));
});

test('an empty or non-object state file is corruption, not absence', async () => {
  const p = join(dir(), 'state.json');
  writeFileSync(p, '');
  await assert.rejects(createFileStorage(p).get('k'), /bus_store_corrupt/);
  writeFileSync(p, '[1]');
  await assert.rejects(createFileStorage(p).get('k'), /bus_store_corrupt/);
});

test('two PROCESSES mutating one ledger never lose an update', async () => {
  const p = join(dir(), 'state.json');
  const worker = `
    import { createFileStorage } from ${JSON.stringify(new URL('../node-storage.js', import.meta.url).href)};
    import { createBusStore } from ${JSON.stringify(new URL('../../extension/src/bus/ledger.js', import.meta.url).href)};
    const store = createBusStore({ storage: createFileStorage(process.argv[1]) });
    for (let i = 0; i < 15; i += 1) await store.mutate((s) => { s.nonces[process.argv[2] + '-' + i] = 'x'; });`;
  const run = (tag) => new Promise((res, rej) => { const c = spawn(process.execPath, ['--input-type=module', '-e', worker, p, tag], { stdio: 'inherit' }); c.on('exit', (code) => code === 0 ? res() : rej(new Error(`exit ${code}`))); });
  await Promise.all([run('a'), run('b'), run('c')]);
  const state = await createBusStore({ storage: createFileStorage(p) }).read();
  assert.equal(Object.keys(state.nonces).length, 45);
  assert.equal(state.seq, 45);
  assert.ok(!existsSync(`${p}.lock`), 'lock released');
});

test('a stale lock from a crashed holder is broken', async () => {
  const p = join(dir(), 'state.json');
  writeFileSync(`${p}.lock`, '{}');
  const s = createFileStorage(p, { staleMs: 0 });
  await new Promise((r) => setTimeout(r, 5));
  const store = createBusStore({ storage: s });
  await store.mutate((st) => { st.nonces.x = 'y'; });
  assert.equal((await store.read()).nonces.x, 'y');
});

test('CLI: bind/grant/status work offline; send refuses without --live; nothing spawned', () => {
  const state = join(dir(), 'state.json');
  assert.equal(cli(['bind', 'opencode', '--adapter', 'acp', '--ref', 'OpenCode', '--confirmed-by', 'owner:test', '--state', state]).status, 0);
  assert.equal(cli(['grant', '--id', 'g1', '--agents', 'opencode', '--ops', 'send', '--max', '1', '--hours', '1', '--ref', 'owner', '--state', state]).status, 0);
  const status = JSON.parse(cli(['status', '--json', '--state', state]).stdout);
  assert.equal(status.agents.find((a) => a.agent_id === 'opencode').status, 'bound');
  assert.equal(status.grants[0].used_count, 0);
  const send = cli(['send', '--to', 'opencode', '--text', 'hi', '--state', state]);
  assert.equal(send.status, 2);
  assert.match(send.stderr, /--live/);
  assert.equal(JSON.parse(readFileSync(state, 'utf8'))['aion.relay.bus.v1'].grants.g1.used_count, 0);
});

test('CLI demo: all three offline demonstrations pass', () => {
  const r = cli(['demo']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal((r.stdout.match(/OFFLINE_PASS/g) ?? []).length, 3);
});

test('argument parser', () => {
  assert.deepEqual(parseArgs(['send', '--to', 'x', '--live', '--text', 'a b']), { _: ['send'], to: 'x', live: true, text: 'a b' });
});
