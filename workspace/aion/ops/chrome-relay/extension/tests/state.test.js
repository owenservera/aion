// State machine tests — ENVELOPE-CONTRACT.md "Two independent state machines"
// plus the presence/proof separation the architecture depends on.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createEnvelope } from '../src/lib/envelope.js';
import {
  DELIVERY_STATES,
  PRESENCE_STATUS,
  PRESENCE_STALE_AFTER_MS,
  TASK_STATES,
  TERMINAL_TASK_STATES,
  canTransition,
  deliveryTransition,
  isProofState,
  isTerminal,
  presenceStatus,
} from '../src/lib/state.js';

test('the task state list is frozen and complete', () => {
  assert.ok(Object.isFrozen(TASK_STATES));
  assert.deepEqual([...TASK_STATES], [
    'PROPOSED', 'APPROVAL_PENDING', 'APPROVED', 'DISPATCHED', 'ACCEPTED', 'RUNNING',
    'PROOF_SUBMITTED', 'VERIFIED', 'REJECTED', 'BLOCKED', 'CANCELLED', 'EXPIRED',
  ]);
});

test('the delivery state list is frozen and complete', () => {
  assert.ok(Object.isFrozen(DELIVERY_STATES));
  assert.deepEqual([...DELIVERY_STATES], ['OUTBOX', 'SENT', 'ACKED', 'RETRY', 'DEAD_LETTER']);
});

test('the contract happy path is legal at every step', () => {
  const chain = [
    'PROPOSED', 'APPROVAL_PENDING', 'APPROVED', 'DISPATCHED',
    'ACCEPTED', 'RUNNING', 'PROOF_SUBMITTED', 'VERIFIED',
  ];
  for (let i = 0; i < chain.length - 1; i += 1) {
    assert.equal(canTransition(chain[i], chain[i + 1]), true, `${chain[i]} -> ${chain[i + 1]}`);
  }
  assert.equal(canTransition('PROOF_SUBMITTED', 'REJECTED'), true, 'proof rejection is a legal branch');
});

test('the permission gate cannot be skipped', () => {
  // The whole reason the extension is not its own authority.
  assert.equal(canTransition('PROPOSED', 'APPROVED'), false);
  assert.equal(canTransition('PROPOSED', 'DISPATCHED'), false);
  assert.equal(canTransition('PROPOSED', 'RUNNING'), false);
});

test('a task cannot skip straight to proof or verification', () => {
  assert.equal(canTransition('RUNNING', 'VERIFIED'), false);
  assert.equal(canTransition('APPROVED', 'PROOF_SUBMITTED'), false);
  assert.equal(canTransition('PROPOSED', 'PROOF_SUBMITTED'), false);
});

test('illegal transitions are rejected, including VERIFIED -> PROPOSED', () => {
  assert.equal(canTransition('VERIFIED', 'PROPOSED'), false);
  assert.equal(canTransition('VERIFIED', 'RUNNING'), false);
  assert.equal(canTransition('CANCELLED', 'PROPOSED'), false);
  assert.equal(canTransition('EXPIRED', 'APPROVED'), false);
  assert.equal(canTransition('REJECTED', 'PROOF_SUBMITTED'), false);
});

test('unknown states are rejected rather than defaulted', () => {
  assert.equal(canTransition('PROPOSED', 'MOSTLY_DONE'), false);
  assert.equal(canTransition('NOT_A_STATE', 'PROPOSED'), false);
  assert.equal(canTransition(null, 'PROPOSED'), false);
});

test('a self-transition is not a transition', () => {
  assert.equal(canTransition('RUNNING', 'RUNNING'), false);
  assert.equal(canTransition('VERIFIED', 'VERIFIED'), false);
});

test('BLOCKED and CANCELLED are reachable from every live state', () => {
  const live = ['PROPOSED', 'APPROVAL_PENDING', 'APPROVED', 'DISPATCHED', 'ACCEPTED', 'RUNNING', 'PROOF_SUBMITTED'];
  for (const from of live) {
    assert.equal(canTransition(from, 'BLOCKED'), true, `${from} -> BLOCKED`);
    assert.equal(canTransition(from, 'CANCELLED'), true, `${from} -> CANCELLED`);
    assert.equal(canTransition(from, 'EXPIRED'), true, `${from} -> EXPIRED`);
  }
});

test('BLOCKED recovers only through a fresh approval', () => {
  // Recovery must re-enter at PROPOSED so a new approval is required; it must
  // never resume straight into RUNNING on the original grant.
  assert.equal(canTransition('BLOCKED', 'PROPOSED'), true);
  assert.equal(canTransition('BLOCKED', 'RUNNING'), false);
  assert.equal(canTransition('BLOCKED', 'APPROVED'), false);
  assert.equal(canTransition('BLOCKED', 'CANCELLED'), true);
});

test('terminal task states have no outgoing edge', () => {
  for (const state of TERMINAL_TASK_STATES) {
    assert.equal(isTerminal(state), true, `${state} is terminal`);
    for (const target of TASK_STATES) {
      if (target === state) continue;
      assert.equal(canTransition(state, target), false, `${state} -> ${target} must be refused`);
    }
  }
});

test('BLOCKED is recoverable, so it is not classified as terminal', () => {
  // The contract calls BLOCKED "terminal or controlled recovery"; it has a
  // real recovery edge, so reporting it as final would be a lie in the UI.
  assert.equal(isTerminal('BLOCKED'), false);
  assert.equal(canTransition('BLOCKED', 'PROPOSED'), true);
  assert.equal(isTerminal('RUNNING'), false);
});

test('the delivery machine walks OUTBOX -> SENT -> ACKED', () => {
  assert.equal(deliveryTransition('OUTBOX', 'SENT'), true);
  assert.equal(deliveryTransition('SENT', 'ACKED'), true);
  assert.equal(deliveryTransition('RETRY', 'SENT'), true);
  assert.equal(deliveryTransition('RETRY', 'DEAD_LETTER'), true);
});

test('delivery cannot be acknowledged before it is sent', () => {
  assert.equal(deliveryTransition('OUTBOX', 'ACKED'), false);
  assert.equal(deliveryTransition('OUTBOX', 'RETRY'), false);
});

test('a duplicate ACK is a legal no-op, a late NACK is not', () => {
  assert.equal(deliveryTransition('ACKED', 'ACKED'), true);
  assert.equal(deliveryTransition('ACKED', 'RETRY'), false, 'an ACK proves delivery; a late nack cannot walk it back');
  assert.equal(deliveryTransition('ACKED', 'SENT'), false);
});

test('a dead letter is final', () => {
  for (const target of DELIVERY_STATES) {
    if (target === 'DEAD_LETTER') continue;
    assert.equal(deliveryTransition('DEAD_LETTER', target), false, `DEAD_LETTER -> ${target}`);
  }
});

test('the two machines are independent: delivery edges know nothing about tasks', () => {
  // canTransition and deliveryTransition share no edges. ACK moves delivery
  // only; it can never be read as executor progress.
  assert.equal(canTransition('RUNNING', 'ACKED'), false);
  assert.equal(canTransition('RUNNING', 'SENT'), false);
  for (const taskState of TASK_STATES) {
    assert.equal(deliveryTransition(taskState, 'ACKED'), false, `${taskState} is not a delivery state`);
  }
});

test('proof-bearing states are identifiable', () => {
  assert.equal(isProofState('PROOF_SUBMITTED'), true);
  assert.equal(isProofState('VERIFIED'), true);
  assert.equal(isProofState('REJECTED'), true);
  assert.equal(isProofState('RUNNING'), false);
  assert.equal(isProofState('OUTBOX'), false);
});

test('a fresh presence beat reads FRESH', () => {
  const now = Date.parse('2026-10-17T12:00:00.000Z');
  const presence = createEnvelope({
    producer_node: 'node-ext-01',
    target_role: '06',
    event_type: 'role.tab_presence',
    created_at: new Date(now - 5_000).toISOString(),
    payload: { tab_open: true },
  });
  assert.equal(presenceStatus(presence, { now }), PRESENCE_STATUS.FRESH);
});

test('a presence beat older than the staleness threshold reads STALE', () => {
  const now = Date.parse('2026-10-17T12:00:00.000Z');
  const stale = createEnvelope({
    producer_node: 'node-ext-01',
    target_role: '06',
    event_type: 'role.tab_presence',
    created_at: new Date(now - PRESENCE_STALE_AFTER_MS - 1).toISOString(),
    payload: { tab_open: true },
  });
  assert.equal(presenceStatus(stale, { now }), PRESENCE_STATUS.STALE);

  // An explicit threshold is honoured, and the boundary is exclusive.
  const env = stale;
  assert.equal(presenceStatus(env, { now, staleAfterMs: 60_000 }), PRESENCE_STATUS.STALE);
  assert.equal(
    presenceStatus(env, { now, staleAfterMs: PRESENCE_STALE_AFTER_MS + 1 }),
    PRESENCE_STATUS.FRESH,
    'exactly at the threshold is still fresh',
  );
});

test('an open role tab is never reported as RUNNING reasoning', () => {
  // The architecture's explicit prohibition: presence is UI metadata.
  const now = Date.parse('2026-10-17T12:00:00.000Z');
  const openTab = createEnvelope({
    producer_node: 'node-ext-01',
    target_role: '06',
    event_type: 'role.tab_presence',
    created_at: new Date(now).toISOString(),
    payload: { tab_open: true },
  });
  assert.equal(presenceStatus(openTab, { now }), PRESENCE_STATUS.FRESH);
  assert.notEqual(openTab.task_state, 'RUNNING');
  assert.notEqual(isProofState(openTab.task_state), true);
});

test('unusable presence data reads UNKNOWN, never FRESH', () => {
  const now = Date.now();
  assert.equal(presenceStatus(null, { now }), PRESENCE_STATUS.UNKNOWN);
  assert.equal(presenceStatus(undefined, { now }), PRESENCE_STATUS.UNKNOWN);
  assert.equal(presenceStatus({ event_type: 'task.proposed' }, { now }), PRESENCE_STATUS.UNKNOWN);
  assert.equal(presenceStatus({ event_type: 'role.tab_presence', created_at: 'nonsense' }, { now }), PRESENCE_STATUS.UNKNOWN);
  assert.equal(presenceStatus({ event_type: 'role.tab_presence' }, { now }), PRESENCE_STATUS.UNKNOWN);
});

test('a PRESENCE_STATUS constant is exposed so the UI need not hardcode strings', () => {
  assert.deepEqual(PRESENCE_STATUS, { FRESH: 'FRESH', STALE: 'STALE', UNKNOWN: 'UNKNOWN' });
});
