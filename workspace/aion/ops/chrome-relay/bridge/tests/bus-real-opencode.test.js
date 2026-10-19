// OPT-IN conformance against a REAL OpenCode binary. Skipped unless
// AION_REAL_OPENCODE names the executable. Uses an isolated HOME, no
// credentials, and expects the prompt to be refused or to fail; it proves the
// real ACP handshake through the real host and that the bus classifies the
// executor's real refusals honestly. Never sends anything anywhere else.
import test from 'node:test';
import assert from 'node:assert/strict';
import { realpathSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createConfig } from '../src/config.js';
import { createInProcessRelay } from '../src/bus-relay.js';
import { createBus } from '../../extension/src/bus/bus.js';
import { createAcpExecutorAdapter } from '../../extension/src/bus/adapters/acp-executor.js';
import { memoryStorage } from '../../extension/tests/fixtures/bus-memory.js';

const BIN = process.env.AION_REAL_OPENCODE;
const slash = (v) => String(v).split(String.fromCharCode(92)).join('/');

test('real opencode acp: initialize through the real host; an unauthenticated prompt is never reported as success', { skip: !BIN && 'set AION_REAL_OPENCODE to run' }, async (t) => {
  const cwd = slash(mkdtempSync(join(tmpdir(), 'aion-real-oc-')));
  process.env.HOME = slash(mkdtempSync(join(tmpdir(), 'aion-real-oc-home-')));
  const config = createConfig({ expectedExtensionId: 'kgjfielmhcdlggjppmliabpiljnonhki', agentPath: slash(realpathSync(BIN)), agentArgs: ['acp'],
    sessionCwd: cwd, logLevel: 'error', timeouts: { spawnMs: 30000, requestMs: 30000, initializeMs: 30000, promptMs: 60000 } });
  const relay = createInProcessRelay({ config, requestTimeoutMs: 90000 });
  t.after(() => relay.close());
  const hello = await relay.hello();
  assert.equal(hello.ok, true);
  assert.equal(hello.protocol_version, 1, 'real OpenCode negotiates ACP protocol 1');
  const bus = createBus({ storage: memoryStorage(), adapters: [createAcpExecutorAdapter({ relay })], initialConfig: { report_back: false } });
  await bus.bind('opencode', { adapter: 'acp', ref: 'opencode', confirmed_by: 'conformance' });
  await bus.grant({ grant_id: 'g', ref: 'conformance', agents: ['opencode'], ops: ['send'], max_count: 1, rate_per_hour: 1, expires_utc: '2099-01-01T00:00:00.000Z' });
  const r = await bus.ingestStructured({ op: 'send', to: 'opencode', text: 'Reply with the single word OK.', nonce: 'real-oc-001' });
  const d = await bus.dispatch(r.command_id);
  const c = await bus.readCommand(r.command_id);
  // Without credentials the honest outcomes are: auth refusal (not sent) or an
  // unknown failure. A REPLY would mean credentials leaked into the sandbox.
  assert.ok(['REJECTED', 'UNRESOLVED'].includes(d.state), `${d.state} ${c.reason}`);
  if (/Authentication/.test(c.detail ?? '') || c.reason === 'executor_auth_required') assert.equal(c.reason, 'executor_auth_required');
  t.diagnostic(`binary=${BIN} state=${d.state} reason=${c.reason}`);
});
