// EXHAUSTIVE crash injection. For a full commander -> agent -> report cycle on
// the ChatGPT pilot path (real driver, real task store, real bus), crash the
// process at EVERY storage write (bus ledger and task store separately), then
// restart, reconcile, flush reports and re-process the same commander turn.
// Invariants checked after every scenario:
//   I1 no correlation is ever submitted to a page more than once
//   I2 no submission happens without a consumed grant unit
//   I3 the same owner turn never yields a second command
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBus } from '../src/bus/bus.js';
import { createChatGPTAdapter, createDriverCall } from '../src/bus/adapters/chatgpt.js';
import { scriptedChatGPT } from './fixtures/bus-chatgpt-page.js';
import { memoryStorage } from './fixtures/bus-memory.js';

const CMD = 'https://chatgpt.com/c/crash-commander', A = 'https://chatgpt.com/c/crash-agent';
const TURN = { source: { adapter: 'chatgpt.com', ref: CMD }, turn_sig: 'cs-crash-turn-1', user_head: 'AION> go',
  assistant_text: '```AION_CMD_V1\nop: send\nto: role-06\ntext: crash test\nnonce: crash-0001\n```' };

function crashable(target) {
  const realSet = target.set.bind(target);
  let n = 0, failAt = 0, fired = false;
  target.set = async (v) => { n += 1; if (n === failAt) { fired = true; throw new Error(`crash at write ${n}`); } return realSet(v); };
  return { arm(k) { n = 0; failAt = k; fired = false; }, disarm() { failAt = 0; }, get writes() { return n; }, get fired() { return fired; } };
}

async function scenario({ where, k }) {
  const page = scriptedChatGPT({ tabs: [[7, CMD], [9, A]] });
  const busStorage = memoryStorage();
  let ids = 0;
  const make = () => createBus({ storage: busStorage, adapters: [createChatGPTAdapter({ call: createDriverCall(page.driver) })], randomId: () => `cx${String(ids += 1).padStart(10, '0')}` });
  let bus = make();
  await bus.bind('aion', { adapter: 'chatgpt.com', ref: CMD, confirmed_by: 'o' });
  await bus.bind('role-06', { adapter: 'chatgpt.com', ref: A, confirmed_by: 'o' });
  await bus.designateCommander('aion');
  await bus.grant({ grant_id: 'g', ref: 'o', agents: ['aion', 'role-06'], ops: ['send'], max_count: 10, rate_per_hour: 10, expires_utc: '2099-01-01T00:00:00.000Z' });
  const busCrash = crashable(busStorage);
  const taskCrash = crashable(page.api.storage.local);
  (where === 'bus' ? busCrash : taskCrash).arm(k);
  let crashed = false;
  try { await bus.process(TURN); } catch { crashed = true; }
  const fired = (where === 'bus' ? busCrash : taskCrash).fired;
  busCrash.disarm(); taskCrash.disarm();
  // "Restart": fresh bus object over the same storage, then recover.
  bus = make();
  for (let i = 0; i < 2; i += 1) {
    try { await bus.reconcile(); } catch { /* recovery itself must not throw the invariants away */ }
    try { await bus.flushReports(); } catch { /* idem */ }
    try { await bus.process({ ...TURN }); } catch { /* idem */ }
  }
  const submits = page.submits();
  const byCorrelation = new Map();
  for (const s of submits) byCorrelation.set(s.correlation_id, (byCorrelation.get(s.correlation_id) ?? 0) + 1);
  const status = await bus.status();
  return { crashed: crashed || fired, fired, submits, byCorrelation, status };
}

test('baseline cycle (no crash) for reference', async () => {
  const r = await scenario({ where: 'bus', k: 0 });
  assert.equal(r.crashed, false);
  assert.equal(r.submits.filter((s) => s.url === A).length, 1);
  assert.equal(r.submits.filter((s) => s.url === CMD).length, 1);
});

for (const where of ['bus', 'task']) {
  test(`crash at every ${where} write: no resend, no ungranted send, one command per turn`, async () => {
    let k = 1, crashes = 0;
    for (; k <= 40; k += 1) {
      const r = await scenario({ where, k });
      if (r.fired) crashes += 1;
      for (const [corr, count] of r.byCorrelation) assert.ok(count <= 1, `I1 violated at ${where} write ${k}: ${corr} submitted ${count}x`);
      const used = r.status.grants[0].used_count;
      assert.ok(r.submits.length <= used, `I2 violated at ${where} write ${k}: ${r.submits.length} submits, ${used} units`);
      const sends = r.status.commands.filter((c) => c.op === 'send');
      assert.ok(sends.length <= 1, `I3 violated at ${where} write ${k}: ${sends.length} commands`);
      if (!r.fired && k > 1) break; // past the last write: nothing left to crash
    }
    assert.ok(crashes >= 3, `expected several injected crashes at ${where} writes, got ${crashes}`);
    test.diagnostic?.(`${where}: crashed at ${crashes} distinct write points`);
  });
}
