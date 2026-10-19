// Conditional bus ingress tools: absent by default, read-only status with a
// ledger path, reservation-only write tool behind an explicit switch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const server = resolve(import.meta.dirname, '../src/server.mjs');
const CLI = resolve(import.meta.dirname, '../../chrome-relay/bus/bin/aion-bus.mjs');

async function session(env, body) {
  const child = spawn(process.execPath, [server], { env: { ...process.env, AION_BUS_STATE: '', AION_MCP_BUS_WRITE: '', ...env }, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map(); let seq = 0;
  createInterface({ input: child.stdout }).on('line', (l) => { const m = JSON.parse(l); pending.get(m.id)?.(m); });
  const call = (method, params) => new Promise((res, rej) => { const id = ++seq; const t = setTimeout(() => rej(new Error(`timeout ${method}`)), 5000);
    pending.set(id, (m) => { clearTimeout(t); res(m); }); child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`); });
  try { await body(call); } finally { child.kill(); }
}
const names = async (call) => (await call('tools/list', {})).result.tools.map((t) => t.name).sort();
const tool = async (call, name, args = {}) => (await call('tools/call', { name, arguments: args })).result;

function ledger() {
  const state = join(mkdtempSync(join(tmpdir(), 'aion-mcp-bus-')), 'state.json');
  const run = (...a) => assert.equal(spawnSync(process.execPath, [CLI, ...a, '--state', state], { encoding: 'utf8' }).status, 0);
  run('bind', 'opencode', '--adapter', 'acp', '--ref', 'opencode', '--confirmed-by', 'owner:test');
  run('grant', '--id', 'g-mcp', '--agents', 'opencode', '--ops', 'send', '--max', '1', '--hours', '1', '--ref', 'owner');
  return state;
}

test('default: no bus tools, server stays read-only', async () => session({}, async (call) => {
  assert.deepEqual(await names(call), ['aion_receipts', 'aion_state', 'aion_verify_challenge']);
  assert.equal((await tool(call, 'aion_bus_command', { op: 'send', to: 'opencode', nonce: 'abcdef' })).isError, true);
}));

test('with a ledger: read-only status only, no command text', async () => {
  const state = ledger();
  await session({ AION_BUS_STATE: state }, async (call) => {
    assert.deepEqual(await names(call), ['aion_bus_status', 'aion_receipts', 'aion_state', 'aion_verify_challenge']);
    const s = (await tool(call, 'aion_bus_status')).structuredContent;
    assert.equal(s.agents.find((a) => a.agent_id === 'opencode').status, 'bound');
    assert.equal(s.grants[0].used, 0);
  });
});

test('write switch: reserves once under the grant; replay and exhaustion refused; nothing executed', async () => {
  const state = ledger();
  await session({ AION_BUS_STATE: state, AION_MCP_BUS_WRITE: '1' }, async (call) => {
    const def = (await call('tools/list', {})).result.tools.find((t) => t.name === 'aion_bus_command');
    assert.equal(def.annotations.readOnlyHint, false);
    const r = (await tool(call, 'aion_bus_command', { op: 'send', to: 'opencode', text: 'list sessions', nonce: 'mcp-000001' })).structuredContent;
    assert.equal(r.state, 'RESERVED');
    assert.equal((await tool(call, 'aion_bus_command', { op: 'send', to: 'opencode', text: 'again', nonce: 'mcp-000001' })).structuredContent.refused, 'nonce_replayed');
    assert.equal((await tool(call, 'aion_bus_command', { op: 'send', to: 'opencode', text: 'more', nonce: 'mcp-000002' })).structuredContent.refused, 'grant_exhausted');
    assert.equal((await tool(call, 'aion_bus_command', { op: 'send', to: 'role-06', text: 'x', nonce: 'mcp-000003' })).structuredContent.refused, 'agent_unbound');
    assert.equal((await tool(call, 'aion_bus_command', { op: 'send', to: 'opencode', nonce: 'mcp-000004', shell: 'x' })).isError, true);
  });
  const persisted = JSON.parse(readFileSync(state, 'utf8'))['aion.relay.bus.v1'];
  const cmd = Object.values(persisted.commands).find((c) => c.state === 'RESERVED');
  assert.equal(cmd.origin_kind, 'mcp_ingress');
  assert.equal(cmd.attempted, false, 'the MCP server never executes');
});
