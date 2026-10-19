// The REAL service worker routes `aion/bus-*` behind its existing sender check,
// hydrates one bus with the ChatGPT adapter and the ACP executor adapter, and
// keeps bus state out of the relay's own storage keys.
import test from 'node:test';
import assert from 'node:assert/strict';

const EXTENSION_ID = 'kgjfielmhcdlggjppmliabpiljnonhki';
const worker = await import('../src/background/service-worker.js');
const { __testing, handleMessage, installRuntimeListeners } = worker;

function fakeChrome() {
  const storage = new Map();
  const alarmsCreated = [];
  const listeners = { alarm: [] };
  const api = {
    runtime: { id: EXTENSION_ID, connectNative() { throw new Error('Specified native messaging host not found.'); },
      onMessage: { addListener() {} }, onInstalled: { addListener() {} }, onStartup: { addListener() {} } },
    storage: { local: {
      async get(key) { return storage.has(key) ? { [key]: structuredClone(storage.get(key)) } : {}; },
      async set(bag) { for (const [k, v] of Object.entries(bag)) storage.set(k, structuredClone(v)); },
    } },
    alarms: { create: (n, o) => alarmsCreated.push([n, o]), clear() {}, onAlarm: { addListener: (f) => listeners.alarm.push(f) } },
    action: { onClicked: { addListener() {} } },
    sidePanel: { open: async () => {} },
    tabs: { async query() { return []; }, connect() { throw new Error('Receiving end does not exist.'); } },
  };
  return { api, storage, alarmsCreated, listeners };
}
const page = { id: EXTENSION_ID, url: `chrome-extension://${EXTENSION_ID}/src/panel/sidepanel.html` };
const send = (message, sender = page) => new Promise((resolve) => { handleMessage(message, sender, resolve); });

async function withWorker(body) {
  const fake = fakeChrome();
  __testing.reset();
  globalThis.chrome = fake.api;
  installRuntimeListeners(fake.api);
  try { await body(fake); } finally {
    try { __testing.transport?.close?.(); } catch { /* closed */ }
    globalThis.chrome = undefined;
    __testing.reset();
  }
}

test('bus endpoints refuse web pages, tabs and other extensions', async () => {
  await withWorker(async () => {
    for (const sender of [{}, { id: EXTENSION_ID, tab: { id: 1 } }, { id: 'a'.repeat(32) }]) {
      const reply = await send({ type: 'aion/bus-status' }, sender);
      assert.equal(reply.ok, false);
      assert.equal(reply.code, 'sender_not_trusted');
    }
  });
});

test('status from the panel shows the seeded registry, both adapters, kill off, watch off', async () => {
  await withWorker(async (fake) => {
    const reply = await send({ type: 'aion/bus-status' });
    assert.equal(reply.ok, true, JSON.stringify(reply));
    assert.deepEqual(reply.adapters.map((a) => a.name).sort(), ['acp', 'chatgpt.com']);
    assert.equal(reply.config.watch, false);
    assert.equal(reply.kill.engaged, false);
    assert.ok(reply.agents.some((a) => a.agent_id === 'opencode' && a.kind === 'executor'));
    assert.ok(reply.adapters.every((a) => a.capabilities.live_verified === false), 'nothing claims live verification');
    assert.ok(__testing.bus);
    // Reading status writes nothing to the bus key.
    assert.equal(fake.storage.has('aion.relay.bus.v1'), false);
  });
});

test('gesture gate and kill switch through the real router; tab chain unaffected', async () => {
  await withWorker(async (fake) => {
    assert.equal((await send({ type: 'aion/bus-agent', action: 'bind', agent_id: 'role-06', ref: 'https://chatgpt.com/c/x', confirmed_by: 'o' })).code, 'explicit_command_required');
    const bound = await send({ type: 'aion/bus-agent', action: 'bind', agent_id: 'role-06', ref: 'https://chatgpt.com/c/x?y=1', confirmed_by: 'owner:test', user_gesture: true });
    assert.equal(bound.ok, true, JSON.stringify(bound));
    assert.equal(bound.agent.binding.ref, 'https://chatgpt.com/c/x');
    const killed = await send({ type: 'aion/bus-kill', reason: 'test' });
    assert.equal(killed.ok, true);
    assert.equal(fake.storage.get('aion.relay.bus.v1').kill.engaged, true);
    // The bus never touches the ChatGPT no-resend ledger keys by itself.
    assert.equal(fake.storage.has('aion.relay.chatgpt.tasks.v1'), false);
    assert.equal(fake.storage.has('aion.relay.chatgpt.dispatch.v1'), false);
  });
});

test('the commander scan endpoint is routed and read-only when no tab is open', async () => {
  await withWorker(async () => {
    const reply = await send({ type: 'aion/chatgpt-commander-scan', tab_id: 1 });
    assert.equal(reply.ok, false);
    assert.equal(reply.read_only, true);
    assert.equal('submitted' in reply && reply.submitted === true, false);
  });
});

test('executor delivery with no native host is a positive NOT_SENT, never unknown', async () => {
  await withWorker(async () => {
    const g = { user_gesture: true };
    await send({ type: 'aion/bus-agent', action: 'bind', agent_id: 'aion', ref: 'https://chatgpt.com/c/cmd', confirmed_by: 'o', ...g });
    await send({ type: 'aion/bus-agent', action: 'bind', agent_id: 'opencode', adapter: 'acp', ref: 'opencode', confirmed_by: 'o', ...g });
    await send({ type: 'aion/bus-commander', agent_id: 'aion', ...g });
    await send({ type: 'aion/bus-grant', grant: { grant_id: 'g', ref: 'owner', agents: ['opencode', 'aion'], ops: ['send'], max_count: 2, rate_per_hour: 5, expires_utc: '2099-01-01T00:00:00.000Z' }, ...g });
    const bus = __testing.bus.bus;
    const r = await bus.ingestStructured({ op: 'send', to: 'opencode', text: 'list sessions', nonce: 'nohost-01' });
    assert.equal(r.accepted, true, JSON.stringify(r));
    const d = await bus.dispatch(r.command_id);
    assert.equal(d.state, 'REJECTED');
    const c = (await bus.status()).commands.find((x) => x.command_id === r.command_id);
    assert.equal(c.delivery, 'NOT_SENT');
  });
});
