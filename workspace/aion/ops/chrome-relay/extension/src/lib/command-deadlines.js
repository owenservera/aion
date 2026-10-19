// One-reply command policy. Traffic never renews an absolute deadline.
export const COMMAND_POLICY = Object.freeze({
  hydration: 10_000, resolveTab: 5_000, preflight: 5_000,
  reservationRead: 5_000, reservationWrite: 5_000, observerArm: 5_000, settlement: 5_000,
  setup: 400, grace: 5_000, responseMargin: 10_000,
});
export const COMMAND_WORK = Object.freeze({
  tabs: 5_000, ping: 5_000, state: 5_000,
  'read-final': 15_000, 'run-turn': 300_000, stop: 10_000,
  // SUBMIT/OBSERVE SPLIT (ARCHITECTURE.md §6). `submit-turn` is deliberately a
  // SUBMISSION-OBSERVATION bound, not a generation bound: it reserves durably,
  // asks the page to arm + activate once, and returns the first observer receipt
  // (submission observed, or an honest refusal). It must stay well inside the
  // `run-turn` envelope so the blocking compatibility wrapper still contains it.
  'submit-turn': 20_000,
  // A short, repeatable READ-ONLY poll of an already-armed observer. It can
  // never extend the page's own deadline, so it needs no generation budget.
  'observe-turn': 5_000,
  // Bus commander watcher: read-only scan of the commander conversation.
  'commander-scan': 5_000,
  // The READ-ONLY reconciliation path for an operation that cannot settle on
  // its own (a terminal refusal, a lost observer, a submission that never
  // settled). It reads the durable record and, where the observer identity is
  // known, asks the PAGE about that observer — the same read-only action the
  // poll uses. It has no path to a fill, a click, a stop, a re-arm, a resubmit
  // or a new deadline, so its budget is a read budget.
  'reconcile-turn': 5_000,
});

/**
 * Bounded stages each command may wait on, beyond hydration/resolveTab.
 *
 * A table, not `if (command === ...)`: a command with no entry would otherwise
 * silently get no storage stages, and `lifecycle.wait('settlement', ...)` would
 * then throw `invalid_command_stage` mid-command — a refusal that looks like a
 * page failure. Every key of COMMAND_WORK must appear here.
 */
const COMMAND_STAGES = Object.freeze({
  tabs: Object.freeze([]),
  ping: Object.freeze([]),
  state: Object.freeze([]),
  stop: Object.freeze([]),
  // Reads the durable guard so an identity can be proven before anything is
  // asked of the page.
  'read-final': Object.freeze(['reservationRead']),
  // Read-only poll: read the durable record, re-record observed facts, then
  // settle only a terminal outcome. It never reserves, never writes a
  // reservation and never sends.
  'observe-turn': Object.freeze(['reservationRead', 'observerArm', 'settlement']),
  'submit-turn': Object.freeze(['preflight', 'reservationRead', 'reservationWrite', 'observerArm', 'settlement']),
  'run-turn': Object.freeze(['preflight', 'reservationRead', 'reservationWrite', 'settlement']),
  'commander-scan': Object.freeze([]),
  // Read-only reconciliation: read the durable record, re-record what the
  // page reports about the SAME observer, and settle only a terminal outcome.
  // It never reserves, never writes a reservation and never sends.
  'reconcile-turn': Object.freeze(['reservationRead', 'observerArm', 'settlement']),
});

/** Commands whose exchange may put text into a signed-in session. */
const MUTATING_COMMANDS = new Set(['run-turn', 'submit-turn']);

/**
 * Is this command SEND-CAPABLE?
 *
 * A send-capable command may put text into a signed-in session, so a failure
 * in one is a statement about the operation: it may or may not have activated.
 * EVERY OTHER command is read-only, and a read-only command that failed
 * learned NOTHING about the operation it was asked about — so it must never
 * claim `submitted:false` about that operation. That claim is a no-send
 * statement about the OPERATION, and a poll is not entitled to make it.
 *
 * The command's own nature decides this, never what the command managed to do
 * before it failed: a send-capable command that failed BEFORE it opened a
 * port still did not send anything, and a read-only command that failed after
 * it asked the page still says nothing about the operation.
 */
export function commandIsSendCapable(command) {
  return MUTATING_COMMANDS.has(command);
}

function positive(value, name) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`invalid_command_budget: ${name} must be a positive finite safe integer`);
  }
  return value;
}

export function validateCommandPolicy(overrides = {}) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new TypeError('invalid_command_policy');
  for (const key of Object.keys(overrides)) {
    if (!Object.hasOwn(COMMAND_POLICY, key)) throw new TypeError(`invalid_command_policy: ${key}`);
  }
  const policy = { ...COMMAND_POLICY, ...overrides };
  for (const [key, value] of Object.entries(policy)) {
    positive(value, key);
    if (value > COMMAND_POLICY[key]) throw new RangeError(`invalid_command_policy: ${key} exceeds ceiling`);
  }
  return Object.freeze(policy);
}

export function resolveCommandDeadline({ command, requestedWorkMs } = {}, overrides) {
  if (!Object.hasOwn(COMMAND_WORK, command) || !Object.hasOwn(COMMAND_STAGES, command)) throw new TypeError('unknown_command');
  const policy = validateCommandPolicy(overrides);
  const workMs = requestedWorkMs === undefined ? COMMAND_WORK[command]
    : Math.min(positive(requestedWorkMs, 'requestedWorkMs'), COMMAND_WORK[command]);
  const stages = { hydration: policy.hydration, resolveTab: Math.min(policy.resolveTab, command === 'tabs' ? workMs : policy.resolveTab) };
  for (const stage of COMMAND_STAGES[command]) stages[stage] = policy[stage];
  if (MUTATING_COMMANDS.has(command)) stages.exchange = workMs + policy.setup + policy.grace;
  else if (command !== 'tabs') stages.exchange = workMs;
  const absoluteMs = Object.values(stages).reduce((sum, value) => sum + value, 0);
  // The panel always outlasts the worker's whole absolute budget, so a panel
  // timeout can never race the worker's own stable refusal code. This is
  // structural for EVERY command here, not a per-command promise.
  const panelMs = absoluteMs + policy.responseMargin;
  if (!Number.isSafeInteger(panelMs)) throw new RangeError('invalid_command_budget: overflow');
  return Object.freeze({ command, workMs, stages: Object.freeze(stages), absoluteMs, panelMs, inactivity: null });
}

export function chatGPTCommandName(type) {
  return ({ 'aion/chatgpt-tabs': 'tabs', 'aion/chatgpt-ping': 'ping',
    'aion/chatgpt-run': 'run-turn', 'aion/chatgpt-read': 'read-final',
    'aion/chatgpt-submit': 'submit-turn', 'aion/chatgpt-observe': 'observe-turn',
    'aion/chatgpt-reconcile': 'reconcile-turn',
    'aion/chatgpt-commander-scan': 'commander-scan' })[type] ?? null;
}

/**
 * The budget for a settlement that has to happen AFTER the command's own
 * lifecycle has already ended.
 *
 * WHY THIS EXISTS. A command that runs out of budget mid-exchange throws out
 * of the exchange, and the record it had already reserved would then sit in
 * SUBMIT_RESERVED with no observer and no outcome — a reservation nobody can
 * ever resolve. The settlement that fixes that must NOT be governed by the
 * budget that just expired, so it gets its own small, finite, policy-derived
 * budget instead of a hardcoded timer.
 *
 * It is derived from the same shared policy as every other stage, it is finite,
 * and it is strictly smaller than the command budget it replaces. It is not a
 * global guard: it exists only while one settlement is being written.
 */
export function resolveSettlementDeadline(overrides = {}) {
  const policy = validateCommandPolicy(overrides);
  const stages = Object.freeze({ settlement: policy.settlement });
  const absoluteMs = policy.settlement;
  return Object.freeze({
    command: 'settlement',
    workMs: 0,
    stages,
    absoluteMs,
    // The panel margin is kept for shape: this plan is never shown to a panel,
    // but every plan in this module carries one and the rule is uniform.
    panelMs: absoluteMs + policy.responseMargin,
    inactivity: null
  });
}
