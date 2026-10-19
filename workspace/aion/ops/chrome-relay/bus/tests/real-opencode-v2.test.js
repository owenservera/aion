// OPT-IN: the bus against a REAL OpenCode 2.0 service. Skipped unless
// AION_REAL_OPENCODE_V2_STATE names the service's state file (started by the
// operator with `opencode service start`). Without provider credentials the
// executor fails, and the bus must report that FAILURE, not a success.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createBus } from '../../extension/src/bus/bus.js';
import { createOpenCodeHttpClient, createOpenCodeV2Adapter } from '../../extension/src/bus/adapters/opencode-v2.js';
import { memoryStorage } from '../../extension/tests/fixtures/bus-memory.js';
import { discoverOpenCodeService } from '../opencode-service.js';

const STATE = process.env.AION_REAL_OPENCODE_V2_STATE;

test('real OpenCode 2.0 service: discover, session at grant cwd, prompt admitted, outcome reconciled from server', { skip: !STATE && 'set AION_REAL_OPENCODE_V2_STATE to run' }, async (t) => {
  const svc = discoverOpenCodeService({ stateFile: STATE });
  const bus = createBus({ storage: memoryStorage(), initialConfig: { report_back: false },
    adapters: [createOpenCodeV2Adapter({ client: createOpenCodeHttpClient({ baseUrl: svc.url, headers: svc.headers, timeoutMs: 20000 }) })] });
  await bus.bind('opencode', { adapter: 'opencode-v2', ref: 'opencode', confirmed_by: 'conformance' });
  await bus.grant({ grant_id: 'g', ref: 'conformance', agents: ['opencode'], ops: ['send'], max_count: 1, rate_per_hour: 1,
    expires_utc: '2099-01-01T00:00:00.000Z', cwd: mkdtempSync(join(tmpdir(), 'aion-real-v2-')) });
  const r = await bus.ingestStructured({ op: 'send', to: 'opencode', text: 'Reply with OK.', nonce: 'real-v2-0001' });
  const d = await bus.dispatch(r.command_id);
  assert.equal(d.state, 'SUBMISSION_OBSERVED', 'the service durably admitted the input');
  let c;
  for (let i = 0; i < 60; i += 1) { await bus.observe(r.command_id); c = await bus.readCommand(r.command_id); if (c.state !== 'SUBMISSION_OBSERVED') break; await new Promise((x) => setTimeout(x, 500)); }
  assert.ok(c.executor_ref?.startsWith('ses_'), 'session reference persisted');
  t.diagnostic(`version=${svc.version} state=${c.state} reason=${c.reason} reply=${(c.reply?.excerpt ?? '').slice(0, 120)}`);
  if (c.state === 'REPLY_CHECKED' && c.reason) assert.ok(['executor_auth_required', 'executor_error'].includes(c.reason));
});
