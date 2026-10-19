import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../src/commands.mjs';
import { run } from '../bin/aion-velocity.mjs';

test('one-command grammar returns intent without dispatch', () => {
  assert.deepEqual(parseCommand(['send','chief','Review','integration']), {
    command: 'send', alias: 'chief', text: 'Review integration', json: false
  });
});
test('unknown flags, ambiguous aliases and excessive text fail', () => {
  assert.throws(() => parseCommand(['send', 'chief', 'hi', '--live']));
  assert.throws(() => parseCommand(['send', '?', 'hi']));
  assert.throws(() => parseCommand(['send', 'chief', 'x'.repeat(2001)]));
});
test('offline scaffold refuses to send and never invents operation ID', () => {
  const lines = [];
  assert.equal(run(['send','chief','hello'], x => lines.push(x)), 3);
  const r = JSON.parse(lines[0]);
  assert.equal(r.delivery, 'NOT_SENT');
  assert.equal(r.operation_id, null);
  assert.equal(r.execution_enabled, false);
});
test('offline doctor reports unconnected, never READY', () => {
  const lines = [];
  assert.equal(run(['doctor','--json'], x => lines.push(x)), 0);
  const r = JSON.parse(lines[0]);
  assert.equal(r.local_runtime, 'NOT_CONNECTED');
  assert.equal(r.adapter_readiness.actions.submit, 'UNKNOWN');
});
