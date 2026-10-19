import { test, expect } from 'bun:test';
import { Supervisor, PRIMARY, FALLBACK, classify } from './supervisor.js';

const rules = [{ providerID: 'openai', code: 'insufficient_quota', source: 'https://example.invalid/test-fixture-only' }];
const quota = { type: 'provider.error', message: '{"error":{"code":"insufficient_quota"}}', status: 429 };
function fixture() {
  let saved;
  const calls = [], notices = [];
  const identities = { sesRoot: { id: 'sesRoot', projectID: 'projectA', model: PRIMARY },
    sesChild: { id: 'sesChild', projectID: 'projectA', parentID: 'sesRoot', model: PRIMARY } };
  const store = { get: async () => structuredClone(saved), set: async (_, value) => { saved = structuredClone(value); } };
  const host = {
    capabilities: { dispatchFence: true, futureChildren: true },
    identity: async id => identities[id], notice: value => notices.push(value),
    inspectSafe: async sessionID => ({ sessionID, projectID: 'projectA', rootID: 'sesRoot',
      terminal: true, toolsSettled: true, inboxEmpty: true, sideEffectsKnown: true }),
    switchModel: async ({ sessionID, model }) => { calls.push(['switch', sessionID]); identities[sessionID].model = model; },
    admitRecovery: async ({ sessionID }) => { calls.push(['admit', sessionID]); return { admitted: true }; },
  };
  const make = () => new Supervisor({ store, host, projectID: 'projectA', rootID: 'sesRoot', verifiedCodes: rules });
  const event = (sessionID = 'sesRoot', model = PRIMARY, error = quota) => ({ sessionID, model, error, attempt: 2 });
  return { store, host, calls, notices, identities, make, event, saved: () => saved };
}
async function triggered(f = fixture()) {
  const s = f.make(); await s.initialize(); await s.retry(f.event()); return { ...f, s };
}

test('no default quota marker; generic 429 is throttling', () => {
  expect(classify(PRIMARY, quota)).toBe('throttle');
  expect(classify(PRIMARY, { ...quota, message: 'quota credits exhausted' }, rules)).toBe('throttle');
  expect(classify(PRIMARY, quota, rules)).toBe('quota');
  expect(classify(FALLBACK, quota, rules)).toBe('throttle');
});
for (const [name, error, expected] of [
  ['auth', { ...quota, status: 401 }, 'auth'],
  ['context', { ...quota, type: 'provider.context-overflow' }, 'context'],
  ['invalid', { message: 'bad input', type: 'provider.invalid-request' }, 'invalid'],
  ['DNS', { message: 'ENOTFOUND' }, 'unavailable'],
  ['malformed', {}, 'unknown'],
]) test(`classify ${name} separately`, () => expect(classify(PRIMARY, error, rules)).toBe(expected));

test('main and child preserve IDs, switch once, recover once; sticky root', async () => {
  const f = fixture(), s = f.make(); await s.initialize(); await s.enroll('sesChild');
  await s.retry(f.event('sesChild')); expect(await s.recover()).toBe('confirmed');
  expect(f.calls).toEqual([['switch', 'sesRoot'], ['admit', 'sesRoot'], ['switch', 'sesChild'], ['admit', 'sesChild']]);
  expect(await s.recover()).toBe('confirmed'); expect(f.calls.length).toBe(4);
  expect(f.saved().mode).toBe('fallback');
});
test('concurrent duplicate errors veto but do not reset progress', async () => {
  const f = await triggered(); const events = [f.event(), f.event()];
  expect(await Promise.all(events.map(e => f.s.retry(e)))).toEqual(['intent', 'intent']);
  for (const e of events) expect(e.decision).toEqual({ retry: false });
  await f.s.recover(); expect(f.calls.filter(x => x[0] === 'admit').length).toBe(1);
});
test('other project/session is ignored without raw data persistence', async () => {
  const f = fixture(), s = f.make(); await s.initialize(); const e = f.event('sesOther');
  expect(await s.retry(e)).toBe('outside_scope'); expect(e.decision).toBeUndefined();
  expect(JSON.stringify(f.saved())).not.toContain('insufficient_quota');
});
test('foreign project enrollment fails closed', async () => {
  const f = fixture(), s = f.make(); await s.initialize(); f.identities.sesChild.projectID = 'other';
  await expect(s.enroll('sesChild')).rejects.toThrow('supervisor_disabled'); expect(f.calls).toEqual([]);
});
for (const property of ['dispatchFence', 'futureChildren']) test(`missing ${property} blocks activation behavior`, async () => {
  const f = await triggered(); f.host.capabilities[property] = false;
  expect(await f.s.recover()).toBe('stopped'); expect(f.calls).toEqual([]);
});
for (const property of ['terminal', 'toolsSettled', 'inboxEmpty', 'sideEffectsKnown']) test(`unsafe ${property} never switches or submits`, async () => {
  const f = await triggered(), original = f.host.inspectSafe;
  f.host.inspectSafe = async id => ({ ...await original(id), [property]: false });
  expect(await f.s.recover()).toBe('stopped'); expect(f.calls).toEqual([]);
});
for (const error of [quota, { message: 'ENOTFOUND' }, { message: 'auth', status: 401 }]) test(`fallback ${error.message} stops bounded`, async () => {
  const f = await triggered(); await f.s.recover();
  const e = f.event('sesRoot', FALLBACK, error);
  expect(await f.s.retry(e)).toBe('stopped'); expect(e.decision.retry).toBe(false);
  expect(await f.s.recover()).toBe('stopped'); expect(f.calls.length).toBe(2);
});
test('future child enrolls sticky, with explicit-model override stopped', async () => {
  const f = await triggered(); await f.s.recover();
  expect(await f.s.enroll('sesChild')).toBe('fallback'); await f.s.recover();
  expect(f.identities.sesChild.model).toEqual(FALLBACK);
  expect(await f.s.retry(f.event('sesChild'))).toBe('stopped');
  expect(f.saved().reason).toBe('model_override');
});
test('switch success but recovery ACK lost never resubmits', async () => {
  const f = await triggered();
  f.host.admitRecovery = async ({ sessionID }) => { f.calls.push(['admit', sessionID]); throw new Error('SECRET raw error'); };
  await expect(f.s.recover()).rejects.toThrow('supervisor_disabled');
  expect(await f.make().recover()).toBe('stopped'); expect(f.saved().reason).toBe('admission_ambiguous');
  expect(f.calls.filter(x => x[0] === 'admit').length).toBe(1);
  expect(JSON.stringify(f.notices)).not.toContain('SECRET');
});
test('malformed persisted store and thrown store disable without host mutation', async () => {
  for (const get of [async () => ({}), async () => { throw new Error('secret'); }]) {
    const f = fixture(); f.store.get = get;
    await expect(f.make().recover()).rejects.toThrow('supervisor_disabled'); expect(f.calls).toEqual([]);
  }
});
// A crash is injected immediately before each durable transition, including after external actions.
for (const stage of ['intent', 'waiting', 'reconcile', 'switching', 'switched', 'admitting', 'confirmed']) {
  test(`restart after failed ${stage} persistence never duplicates admission`, async () => {
    const f = fixture(), s = f.make(); await s.initialize();
    const set = f.store.set; let crashed = false;
    f.store.set = async (key, record) => {
      if (!crashed && record.sessions.sesRoot.stage === stage) { crashed = true; throw new Error('crash'); }
      await set(key, record);
    };
    if (stage === 'intent') {
      await expect(s.retry(f.event())).rejects.toThrow();
      expect(await f.make().recover()).toBe('primary'); expect(f.calls).toEqual([]);
    } else {
      await s.retry(f.event()); await expect(s.recover()).rejects.toThrow();
      await f.make().recover();
      expect(f.calls.filter(x => x[0] === 'admit').length).toBeLessThanOrEqual(1);
    }
  });
}
test('successful switch with false model readback stops before admission', async () => {
  const f = await triggered(); f.host.switchModel = async () => {};
  expect(await f.s.recover()).toBe('stopped'); expect(f.saved().reason).toBe('switch_unconfirmed');
});
test('quota intent persistence failure still vetoes paid retry', async () => {
  const f = fixture(), s = f.make(); await s.initialize();
  f.store.set = async () => { throw new Error('private provider error'); };
  const e = f.event(); await expect(s.retry(e)).rejects.toThrow('supervisor_disabled');
  expect(e.decision).toEqual({ retry: false }); expect(f.calls).toEqual([]);
});
test('unverified codes never trigger automatic fallback', async () => {
  const f = fixture(), s = new Supervisor({ store: f.store, host: f.host, projectID: 'projectA', rootID: 'sesRoot' });
  await s.initialize(); expect(await s.retry(f.event())).toBe('ignored');
  expect(await s.recover()).toBe('primary'); expect(f.calls).toEqual([]);
});
test('missing inspection evidence fails closed', async () => {
  const f = await triggered(); f.host.inspectSafe = async () => undefined;
  expect(await f.s.recover()).toBe('stopped'); expect(f.calls).toEqual([]);
});
