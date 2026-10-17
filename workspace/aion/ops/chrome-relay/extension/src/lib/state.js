// AION Chrome Relay Station — state machines.
//
// Binding source: ENVELOPE-CONTRACT.md "Two independent state machines".
//
// The two machines are INDEPENDENT on purpose. An ACK moves DELIVERY_STATE
// only. It never moves TASK_STATE, because "the bytes arrived" is not "the
// executor accepted the task" and certainly not "the work is verified".

/** Task lifecycle values, in contract order. */
export const TASK_STATES = Object.freeze([
  'PROPOSED',
  'APPROVAL_PENDING',
  'APPROVED',
  'DISPATCHED',
  'ACCEPTED',
  'RUNNING',
  'PROOF_SUBMITTED',
  'VERIFIED',
  'REJECTED',
  'BLOCKED',
  'CANCELLED',
  'EXPIRED',
]);

/** Delivery lifecycle values, in contract order. */
export const DELIVERY_STATES = Object.freeze([
  'OUTBOX',
  'SENT',
  'ACKED',
  'RETRY',
  'DEAD_LETTER',
]);

/**
 * Task states with no outgoing edge.
 *
 * BLOCKED is deliberately NOT in here. The contract calls BLOCKED/CANCELLED/
 * EXPIRED "terminal or controlled recovery", and a blocked task genuinely has
 * a recovery path (see TASK_TRANSITIONS below), so classifying it as terminal
 * would be a lie the UI would display. CANCELLED/EXPIRED/VERIFIED/REJECTED
 * are final.
 */
export const TERMINAL_TASK_STATES = Object.freeze([
  'VERIFIED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
]);

/** Proof-bearing task states — evidence exists somewhere in the chain. */
export const PROOF_TASK_STATES = Object.freeze(['PROOF_SUBMITTED', 'VERIFIED', 'REJECTED']);

/**
 * Legal task edges.
 *
 * - The happy path is the contract's straight line, PROPOSED -> ... -> PROOF_SUBMITTED.
 * - PROPOSED -> APPROVAL_PENDING -> APPROVED is the permission gate: nothing
 *   may jump straight to APPROVED, because that edge is the whole reason the
 *   extension is not its own authority.
 * - BLOCKED is entered from any live state and recovered via BLOCKED ->
 *   PROPOSED, which forces a FRESH approval rather than resuming a grant
 *   (FALLBACK-AND-ACCEPTANCE: "require fresh approval for non-replayable
 *   action"). CANCELLED and EXPIRED are reachable from anywhere.
 */
const TASK_TRANSITIONS = Object.freeze({
  PROPOSED: ['APPROVAL_PENDING', 'BLOCKED', 'CANCELLED', 'EXPIRED'],
  APPROVAL_PENDING: ['APPROVED', 'PROPOSED', 'BLOCKED', 'CANCELLED', 'EXPIRED'],
  APPROVED: ['DISPATCHED', 'BLOCKED', 'CANCELLED', 'EXPIRED'],
  DISPATCHED: ['ACCEPTED', 'BLOCKED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['RUNNING', 'BLOCKED', 'CANCELLED', 'EXPIRED'],
  RUNNING: ['PROOF_SUBMITTED', 'BLOCKED', 'CANCELLED', 'EXPIRED'],
  PROOF_SUBMITTED: ['VERIFIED', 'REJECTED', 'BLOCKED', 'CANCELLED', 'EXPIRED'],
  VERIFIED: [],
  REJECTED: [],
  BLOCKED: ['PROPOSED', 'CANCELLED', 'EXPIRED'],
  CANCELLED: [],
  EXPIRED: [],
});

/**
 * Legal delivery edges.
 *
 * - OUTBOX -> SENT -> ACKED is the contract's line.
 * - SENT -> RETRY covers a dropped connection: the message may or may not have
 *   arrived, so it goes back for reconciliation, never straight to ACKED.
 * - RETRY -> DEAD_LETTER is the bounded stop; there is no infinite retry.
 * - ACKED -> ACKED is legal: a duplicate ACK must be a no-op, not an error.
 * - No edge out of DEAD_LETTER. A dead letter is inspected by a human.
 */
const DELIVERY_TRANSITIONS = Object.freeze({
  // OUTBOX has no edge back to RETRY: it has not been tried yet, so "retry" is
  // a lie. It can be sent, or dead-lettered when it is undeliverable.
  OUTBOX: ['SENT', 'DEAD_LETTER'],
  SENT: ['ACKED', 'RETRY'],
  RETRY: ['SENT', 'DEAD_LETTER'],
  ACKED: ['ACKED'],
  DEAD_LETTER: [],
});

/**
 * Is `from` -> `to` a legal task transition?
 *
 * Self-transitions return false: a transition is a change. (Idempotent
 * operations such as a duplicate ACK are the delivery machine's job.)
 */
export function canTransition(from, to) {
  const allowed = TASK_TRANSITIONS[from];
  if (!allowed || !TASK_STATES.includes(to)) return false;
  return allowed.includes(to);
}

/** Is this a final task state with no recovery edge? */
export function isTerminal(state) {
  return TERMINAL_TASK_STATES.includes(state);
}

/**
 * Is `from` -> `to` a legal delivery transition?
 *
 * Self-transitions ARE legal here, unlike the task machine: delivery
 * operations are idempotent by design (contract: duplicate ACK must not move
 * the cursor or change the outcome).
 */
export function deliveryTransition(from, to) {
  const allowed = DELIVERY_TRANSITIONS[from];
  if (!allowed || !DELIVERY_STATES.includes(to)) return false;
  return allowed.includes(to);
}

/** Does this task state imply proof evidence exists? */
export function isProofState(state) {
  return PROOF_TASK_STATES.includes(state);
}

/**
 * Default presence staleness window (2 minutes).
 *
 * WHY a threshold at all: a `role.tab_presence` beat is UI metadata. If the UI
 * showed the last beat unconditionally, a tab closed three hours ago would
 * keep rendering as "present", which is exactly the lie the architecture
 * forbids ("ChatGPT tab presence remains UI metadata" / "never claim they
 * independently think while idle").
 */
export const PRESENCE_STALE_AFTER_MS = 120_000;

/** Presence verdicts: the panel must be able to say UNKNOWN, not guess. */
export const PRESENCE_STATUS = Object.freeze({ FRESH: 'FRESH', STALE: 'STALE', UNKNOWN: 'UNKNOWN' });

/**
 * Classify a `role.tab_presence` envelope.
 *
 * Returns UNKNOWN (never FRESH) for anything that is not usable presence data,
 * because "we have no data" and "we have fresh data" must stay distinguishable.
 *
 * @param {object|null} env   the presence envelope
 * @param {{ now?: number, staleAfterMs?: number }} [opts]
 */
export function presenceStatus(env, opts = {}) {
  const now = Number.isFinite(opts.now) ? opts.now : Date.now();
  const staleAfterMs = Number.isFinite(opts.staleAfterMs)
    ? opts.staleAfterMs
    : PRESENCE_STALE_AFTER_MS;

  if (!env || typeof env !== 'object') return PRESENCE_STATUS.UNKNOWN;
  if (env.event_type !== 'role.tab_presence') return PRESENCE_STATUS.UNKNOWN;

  const seenAt = Date.parse(env.created_at);
  if (Number.isNaN(seenAt)) return PRESENCE_STATUS.UNKNOWN;

  return now - seenAt > staleAfterMs ? PRESENCE_STATUS.STALE : PRESENCE_STATUS.FRESH;
}
