// Local metadata only. This is a no-replay foundation, not an observer or grant
// validator. All writes (including compatibility ledger writes) share ONE gate.
export const DISPATCH_KEY = 'aion.relay.chatgpt.dispatch.v1';
export const DISPATCH_SCHEMA = 'aion.chatgpt.dispatch/0.1';
export const TASKS_KEY = 'aion.relay.chatgpt.tasks.v1';
export const TASKS_SCHEMA = 'aion.chatgpt.tasks/1';
export const MAX_TASKS = 1024;
/**
 * Free-form page annotations one observer record carries: phase, method, reason.
 *
 * Exported so the driver's normalization and this validator cannot drift apart.
 * Page data longer than this is bounded on the way IN (chatgpt-port.js); refusing
 * it here instead would lose the observer identity this record exists to keep
 * and wedge the conversation lock against a merely unresolved operation.
 */
export const MAX_OBSERVER_ANNOTATION = 64;
const gates = new WeakMap();
const own = (value, key) => Object.hasOwn(value, key);
const dangerous = new Set(['__proto__', 'prototype', 'constructor']);
const phases = ['SUBMIT_RESERVED', 'NEEDS_RECONCILIATION', 'REFUSED_NO_SUBMIT', 'REPLY_CHECKED'];
function refuse(code, message = code) { throw Object.assign(new Error(message), { code }); }
function plain(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) refuse('reservation_failed', 'invalid storage object');
  if (Object.getOwnPropertySymbols(value).length) refuse('reservation_failed', 'unsafe storage symbol');
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (dangerous.has(key) || !own(descriptor, 'value') || !descriptor.enumerable) refuse('reservation_failed', 'unsafe storage field');
  }
  return value;
}
function exact(value, fields) {
  plain(value);
  if (Object.keys(value).length !== fields.length || fields.some((key) => !own(value, key))) refuse('reservation_failed', 'invalid task fields');
}

/**
 * The durable task record's fields.
 *
 * `expected_reply_token` is OPTIONAL in the sense that a record written before
 * it existed simply does not carry it: an absent field and an explicit null
 * both mean "this operation has no stored token". Every other field is
 * required, and NO other field is tolerated — an unexpected key is refused,
 * because a record that can carry arbitrary extra keys is a record that can
 * carry a prompt or a credential.
 */
const TASK_FIELDS = ['task_id', 'operation_key', 'correlation_id', 'payload_hash', 'payload_chars', 'conversation_key',
  'target', 'approved_scope_ref', 'created_at', 'updated_at', 'phase', 'lock_active', 'observer', 'facts'];

/**
 * The task record's field set: every required field present, the one optional
 * field allowed, and NOTHING else.
 *
 * `exact()` is the wrong tool for a record that gained one optional field: it
 * would refuse every record written before that field existed. This is the
 * same strictness with one named exception — an unexpected key is still
 * refused, so the record can never carry a prompt, a reply or a credential.
 */
function exactTaskFields(value) {
  plain(value);
  for (const key of Object.keys(value)) {
    if (!TASK_FIELDS.includes(key) && key !== 'expected_reply_token') refuse('reservation_failed', 'invalid task fields');
  }
  for (const key of TASK_FIELDS) if (!own(value, key)) refuse('reservation_failed', 'invalid task fields');
}
function id(value, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > 128 || dangerous.has(value)) refuse('bad_argument', 'invalid task identifier');
  return value;
}
function utc(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
    || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) refuse('reservation_failed', 'invalid task timestamp');
}
function hash(value) { if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) refuse('reservation_failed', 'invalid payload digest'); }

/**
 * The token a record carries, or null. Absent and null are the same fact.
 */
export function storedReplyToken(record) {
  return typeof record?.expected_reply_token === 'string' ? record.expected_reply_token : null;
}

/**
 * The record as a MACHINE VIEW sees it.
 *
 * The expected reply token is NOT part of it. The token is a correlation
 * marker, not a credential, but it is also not a fact any listing needs: it
 * is held for one operation, it is checked against the page's own verdict, and
 * it is dropped the moment the operation resolves. A general view of the store
 * therefore does not carry it.
 */
function redactTask(record) {
  if (!record || typeof record !== 'object') return record;
  const { expected_reply_token, ...rest } = record;
  return rest;
}

export function canonicalConversation(url) {
  if (typeof url !== 'string' || url.length > 2048) refuse('bad_argument', 'invalid target');
  const parsed = new URL(url);
  if (parsed.origin !== 'https://chatgpt.com' || parsed.username || parsed.password) refuse('bad_argument', 'invalid target origin');
  // Unknown/non-conversation paths share the home lock. Do not invent a new
  // conversation ID or assume new-chat tabs (including synced drafts) differ.
  // Only /c/<id> is supported here; project/arbitrary prefix routes are not
  // verified aliases and must not mint independent conversation locks.
  const path = parsed.pathname.replace(/\/+$/, '') || '/';
  return /^\/c\/[^/]+$/.test(path) ? `${parsed.origin}${path}` : `${parsed.origin}/`;
}

function validateObserver(record) {
  if (record === null) return null;
  exact(record, ['page_instance_id', 'observer_id', 'armed_at', 'recorded_at', 'phase', 'method',
    'click_attempted', 'submission_observed', 'generation_started', 'generation_complete',
    'continuity', 'terminal', 'reason']);
  // Adapter-created identity. Neither is accepted from page content as
  // authority: they are RECORDED here so a later read-only poll can prove it is
  // asking the same page the same observer, and are never taken as a grant.
  id(record.page_instance_id); id(record.observer_id);
  utc(record.armed_at); utc(record.recorded_at);
  for (const field of ['click_attempted', 'submission_observed', 'generation_started',
    'generation_complete', 'terminal']) {
    if (typeof record[field] !== 'boolean') refuse('reservation_failed', 'invalid observer fact');
  }
  // "False with affirmative evidence" is not "not reported": a poll that never
  // said anything about continuity leaves it null rather than inventing a break.
  if (record.continuity !== null && typeof record.continuity !== 'boolean') refuse('reservation_failed', 'invalid observer continuity');
  // ONE rule for every annotation, so no field can be stricter than the others
  // and page-supplied text cannot single one out for a write refusal. `phase` is
  // required (the driver defaults it), `method` and `reason` are optional.
  const annotation = (value, nullable) => {
    if (value === null) {
      if (nullable) return;
      refuse('reservation_failed', 'invalid observer annotation');
    }
    if (typeof value !== 'string' || value.length === 0 || value.length > MAX_OBSERVER_ANNOTATION
      || value !== value.trim()) refuse('reservation_failed', 'invalid observer annotation');
  };
  annotation(record.phase, false);
  annotation(record.method, true);
  annotation(record.reason, true);
  return record;
}

function validateTask(record, key) {
  exactTaskFields(record);
  for (const field of ['task_id', 'operation_key', 'correlation_id', 'approved_scope_ref']) id(record[field]);
  if (record.operation_key !== key) refuse('reservation_failed', 'operation index mismatch');
  hash(record.payload_hash);
  if (!Number.isSafeInteger(record.payload_chars) || record.payload_chars < 1 || record.payload_chars > 8000) refuse('reservation_failed', 'invalid payload length');
  exact(record.target, ['url', 'tab_id', 'role_id', 'binding_revision']);
  if (typeof record.target.url !== 'string' || record.target.url.length > 2048) refuse('reservation_failed', 'invalid target URL');
  const url = new URL(record.target.url);
  if (`${url.origin}${url.pathname}` !== record.target.url || canonicalConversation(record.target.url) !== record.conversation_key) refuse('reservation_failed', 'target/lock mismatch');
  if (!Number.isSafeInteger(record.target.tab_id) || record.target.tab_id < 0) refuse('reservation_failed', 'invalid target tab');
  id(record.target.role_id, true); id(record.target.binding_revision, true);
  utc(record.created_at); utc(record.updated_at);
  if (!phases.includes(record.phase) || typeof record.lock_active !== 'boolean') refuse('reservation_failed', 'invalid task phase');
  // The expected reply token is EITHER absent/null or a bounded identifier. It
  // is stored so that a later worker can check the page's own verdict against
  // the token this operation was actually sent with; it is not a credential and
  // it is never written to the legacy dispatch record.
  if (record.expected_reply_token !== undefined && record.expected_reply_token !== null) id(record.expected_reply_token);
  validateObserver(record.observer);
  exact(record.facts, ['activation_possible', 'click_attempted', 'submission_observed', 'generation_started', 'generation_complete', 'reply_checked', 'no_submit', 'consumed']);
  const f = record.facts;
  // This engine does NOT observe clicks, matching user turns or generation
  // transitions. Those fields stay unknown; an accepted legacy adapter verdict
  // is recorded separately, never recast as DOM submission proof.
  if (typeof f.activation_possible !== 'boolean' || f.click_attempted !== null || f.submission_observed !== null
    || f.generation_started !== null || f.generation_complete !== null || typeof f.reply_checked !== 'boolean'
    || typeof f.no_submit !== 'boolean' || f.consumed !== false) refuse('reservation_failed', 'invalid task facts');
  const resolved = record.phase === 'REFUSED_NO_SUBMIT' || record.phase === 'REPLY_CHECKED';
  if (record.lock_active === resolved || f.no_submit !== (record.phase === 'REFUSED_NO_SUBMIT')
    || f.reply_checked !== (record.phase === 'REPLY_CHECKED') || f.activation_possible === f.no_submit) refuse('reservation_failed', 'inconsistent task facts');
  // A RESOLVED operation keeps no token: the outcome is already durably
  // recorded, and the marker is retained only while the outcome is open.
  if (resolved && record.expected_reply_token) refuse('reservation_failed', 'resolved task keeps a reply token');
}

function validateLegacy(raw) {
  if (raw === undefined) return {};
  plain(raw);
  if (!own(raw, 'schema') || !own(raw, 'reservations') || raw.schema !== DISPATCH_SCHEMA) refuse('reservation_failed', 'unknown dispatch schema');
  const records = plain(raw.reservations);
  for (const [key, record] of Object.entries(records)) {
    id(key); plain(record);
    if (!own(record, 'correlation_id') || !own(record, 'state') || record.correlation_id !== key
      || !['IN_FLIGHT', 'COMPLETED'].includes(record.state)) refuse('reservation_failed', 'invalid dispatch record');
  }
  return records;
}
function validateTasks(raw, legacy) {
  if (raw === undefined) return {};
  exact(raw, ['schema', 'operations']);
  if (raw.schema !== TASKS_SCHEMA) refuse('reservation_failed', 'unknown task schema');
  const records = plain(raw.operations);
  if (Object.keys(records).length > MAX_TASKS) refuse('reservation_failed', 'task store over limit');
  const taskIds = new Set(), correlations = new Set(), locks = new Set();
  for (const [key, record] of Object.entries(records)) {
    id(key); validateTask(record, key);
    if (taskIds.has(record.task_id) || correlations.has(record.correlation_id)
      || (record.lock_active && locks.has(record.conversation_key))) refuse('reservation_failed', 'conflicting task index');
    taskIds.add(record.task_id); correlations.add(record.correlation_id);
    if (record.lock_active) locks.add(record.conversation_key);
    const dispatch = own(legacy, record.correlation_id) ? legacy[record.correlation_id] : null;
    if (!dispatch || dispatch.operation_key !== key || dispatch.task_id !== record.task_id
      || dispatch.payload_hash !== record.payload_hash || dispatch.payload_chars !== record.payload_chars
      || dispatch.conversation_key !== record.conversation_key || dispatch.url !== record.target.url
      || dispatch.approved_scope_ref !== record.approved_scope_ref) refuse('reservation_failed', 'task/dispatch mismatch');
    if (!record.lock_active && dispatch.state !== 'COMPLETED') refuse('reservation_failed', 'resolved task without legacy settlement');
  }
  return records;
}
async function mutation(local, operation) {
  if (!local || typeof local.get !== 'function' || typeof local.set !== 'function') refuse('reservation_failed', 'durable storage unavailable');
  if (gates.has(local)) refuse('reservation_failed', 'reservation_store_busy');
  const token = {};
  gates.set(local, token);
  try { return await operation(); }
  finally { if (gates.get(local) === token) gates.delete(local); }
}

export async function prepareTask(command, tab, lifecycle, digest = (bytes) => globalThis.crypto.subtle.digest('SHA-256', bytes)) {
  const correlation = id(command.correlation_id.trim());
  const url = new URL(tab.url);
  const target = { url: `${url.origin}${url.pathname}`, tab_id: tab.tab_id,
    role_id: command.role_id === undefined ? null : id(command.role_id),
    binding_revision: command.binding_revision === undefined ? null : id(command.binding_revision) };
  const conversation = canonicalConversation(target.url);
  if (command.conversation_key !== undefined && command.conversation_key !== conversation) refuse('bad_argument', 'conversation key mismatch');
  lifecycle.assertActive();
  const payloadDigest = await digest(new TextEncoder().encode(command.text));
  lifecycle.assertActive();
  const timestamp = new Date().toISOString();
  const record = {
    task_id: command.task_id === undefined ? correlation : id(command.task_id),
    operation_key: command.operation_key === undefined ? correlation : id(command.operation_key),
    correlation_id: correlation,
    payload_hash: [...new Uint8Array(payloadDigest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
    payload_chars: command.text.length, conversation_key: conversation, target,
    approved_scope_ref: id(command.approved_scope_ref.trim()), created_at: timestamp, updated_at: timestamp,
    phase: 'SUBMIT_RESERVED', lock_active: true, observer: null,
    // The expected reply token is stored HERE, before the record is written and
    // therefore before anything can be sent, so a later worker can check the
    // page's own verdict against the token this operation was actually sent
    // with. It is a correlation marker, not a credential: it is never written
    // to the legacy dispatch record, never logged, never returned in a machine
    // view, and it is dropped when the operation resolves.
    expected_reply_token: replyToken(command.expected_reply_token),
    facts: { activation_possible: true, click_attempted: null, submission_observed: null,
      generation_started: null, generation_complete: null, reply_checked: false, no_submit: false, consumed: false },
  };
  validateTask(record, record.operation_key);
  return record;
}

/**
 * The caller's expected reply token, normalized for storage.
 *
 * Absent, null and blank all mean "this operation expects no token" and are
 * stored as null. Anything else must be a bounded identifier: the same rule
 * every other stored identifier obeys.
 */
function replyToken(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') refuse('bad_argument', 'invalid expected reply token');
  const trimmed = value.trim();
  return trimmed === '' ? null : id(trimmed);
}

/**
 * Is this the SAME operation?
 *
 * The expected reply token is deliberately NOT part of this comparison. It is
 * held only while the operation is open and is dropped when it resolves, so
 * it is not a stable identity — and it does not need to be: the operation
 * itself can only be sent once, whatever marker it carries, and a read that
 * is handed the wrong marker is refused where the marker matters.
 */
function sameOperation(a, b) {
  return a.task_id === b.task_id && a.payload_hash === b.payload_hash && a.payload_chars === b.payload_chars
    && a.conversation_key === b.conversation_key && a.target.url === b.target.url
    && a.target.role_id === b.target.role_id && a.target.binding_revision === b.target.binding_revision
    && a.approved_scope_ref === b.approved_scope_ref;
}
function checkAvailable(record, legacy, tasks) {
  const prior = own(tasks, record.operation_key) ? tasks[record.operation_key] : null;
  if (prior) refuse(sameOperation(prior, record) ? 'already_dispatched' : 'operation_conflict');
  if (Object.values(tasks).some((task) => task.task_id === record.task_id)) refuse('operation_conflict', 'task identity already bound');
  if (own(legacy, record.correlation_id)) refuse(legacy[record.correlation_id].state === 'IN_FLIGHT' ? 'dispatch_in_flight' : 'already_dispatched');
  const home = 'https://chatgpt.com/';
  if (Object.values(tasks).some((task) => task.lock_active && (task.conversation_key === record.conversation_key
    || task.conversation_key === home || record.conversation_key === home))) refuse('conversation_locked');
  const represented = new Set(Object.values(tasks).map((task) => task.correlation_id));
  for (const entry of Object.values(legacy)) {
    if (represented.has(entry.correlation_id)) continue;
    if (entry.operation_key === record.operation_key || entry.task_id === record.task_id) refuse('dispatch_in_flight', 'orphan operation reservation');
    // COMPLETED alone is not positive no-submit or completion evidence. All
    // unrepresented legacy tombstones are conservatively unresolved.
    const savedUrl = entry.url ?? entry.target_url;
    if (savedUrl !== undefined) {
      const key = canonicalConversation(savedUrl);
      if (key === record.conversation_key || key === home || record.conversation_key === home) refuse('conversation_locked', 'unresolved legacy conversation');
    } else {
      // A saved tab locator cannot prove the old conversation is elsewhere (it
      // may have navigated/closed). Same-tab and unmappable orphans both block.
      refuse('conversation_locked', 'unmapped legacy reservation');
    }
  }
  if (Object.keys(tasks).length >= MAX_TASKS || Object.keys(legacy).length >= 10000) refuse('reservation_failed', 'guard store full');
}

/**
 * Rebuild the missing rich record from the legacy dispatch record.
 *
 * The legacy record is written FIRST and carries the whole identity of the
 * reservation, so a reservation whose rich write never landed can be
 * reconstructed exactly. Nothing is invented: every field comes from the
 * dispatch record, and a record that does not carry the fields a task needs is
 * REFUSED rather than guessed at — a guessed task is a lock that can be
 * released for an operation nobody can name.
 */
function rebuildTask(dispatch) {
  const required = ['task_id', 'operation_key', 'correlation_id', 'payload_hash', 'payload_chars',
    'conversation_key', 'url', 'tab_id', 'approved_scope_ref', 'started_at'];
  for (const field of required) {
    if (!own(dispatch, field) || dispatch[field] === undefined || dispatch[field] === null) {
      refuse('reservation_failed', 'the dispatch record cannot be rebuilt into a task record');
    }
  }
  return {
    task_id: dispatch.task_id,
    operation_key: dispatch.operation_key,
    correlation_id: dispatch.correlation_id,
    payload_hash: dispatch.payload_hash,
    payload_chars: dispatch.payload_chars,
    conversation_key: dispatch.conversation_key,
    // The dispatch record carries the URL and the tab, never the page's
    // role/binding metadata: those are null on a rebuilt record, which is the
    // same fact as "the reservation never named them".
    target: { url: dispatch.url, tab_id: dispatch.tab_id, role_id: null, binding_revision: null },
    approved_scope_ref: dispatch.approved_scope_ref,
    created_at: dispatch.started_at,
    updated_at: new Date().toISOString(),
    phase: 'REFUSED_NO_SUBMIT',
    lock_active: false,
    observer: null,
    // A rebuilt reservation never carried a marker: the rich record that would
    // have held it was never written.
    expected_reply_token: null,
    facts: { activation_possible: false, click_attempted: null, submission_observed: null,
      generation_started: null, generation_complete: null, reply_checked: false, no_submit: true, consumed: false },
  };
}

export function createChatGPTTaskStore({ chrome: api, key = DISPATCH_KEY } = {}) {
  const local = api?.storage?.local;
  if (key !== DISPATCH_KEY) refuse('bad_argument', 'dispatch key cannot change');
  const assert = (life) => life?.assertActive();
  async function read(life) {
    if (!local || typeof local.get !== 'function' || typeof local.set !== 'function') refuse('reservation_failed', 'durable storage unavailable');
    assert(life);
    const legacyBag = plain(await local.get(DISPATCH_KEY));
    assert(life);
    // Present undefined is corruption, not verified absence.
    if (own(legacyBag, DISPATCH_KEY) && legacyBag[DISPATCH_KEY] === undefined) refuse('reservation_failed', 'invalid dispatch storage');
    const legacy = validateLegacy(legacyBag[DISPATCH_KEY]);
    assert(life);
    const taskBag = plain(await local.get(TASKS_KEY));
    assert(life);
    if (own(taskBag, TASKS_KEY) && taskBag[TASKS_KEY] === undefined) refuse('reservation_failed', 'invalid task storage');
    const tasks = validateTasks(taskBag[TASKS_KEY], legacy);
    return { legacy, tasks };
  }
  async function write(key, value, life) {
    assert(life);
    const result = await local.set({ [key]: value });
    // The mutation gate remains held until this issued write settles, even if
    // its lifecycle already timed out. A late completion never starts a write.
    if (result === false) refuse('reservation_failed', 'storage write refused');
    assert(life);
  }
  async function observe(life) {
    if (local && gates.has(local)) refuse('reservation_failed', 'reservation_store_busy');
    return read(life);
  }
  return {
    durable: !!local,
    async all(life) { return (await observe(life)).legacy; },
    async get(correlation, life) { const { legacy } = await observe(life); return own(legacy, correlation) ? structuredClone(legacy[correlation]) : null; },
    async getTask(taskId, life) {
      id(taskId); const { tasks } = await observe(life);
      return redactTask(structuredClone(Object.values(tasks).find((task) => task.task_id === taskId) ?? null));
    },
    // The read-only lookup a poll needs: an operation is addressed by the
    // correlation the page was given, and every identity used afterwards must
    // come from THIS record rather than from the caller.
    //
    // This is the ONE accessor that returns the stored expected reply token:
    // the driver needs it to check the page's own verdict against the token
    // this operation was sent with. Every general view of the store redacts
    // it.
    async getTaskByCorrelation(correlation, life) {
      id(correlation); const { tasks } = await observe(life);
      return structuredClone(Object.values(tasks).find((task) => task.correlation_id === correlation) ?? null);
    },
    /**
     * Record the page/observer identity and the facts the page reported.
     *
     * Called after the one-shot exchange and BEFORE any settlement, so the
     * identity that a later read-only poll must present is durable before the
     * outcome is judged. The legacy dispatch record is not touched: it is the
     * no-resend tombstone and this adds evidence to the richer record only.
     *
     * Identity is IMMUTABLE once armed. A later receipt claiming a different
     * page or observer for the same operation is refused rather than merged —
     * that is the difference between following one observer and swapping it.
     */
    async recordObserver(record, observer, life) {
      plain(record);
      validateTask(record, record.operation_key);
      record = structuredClone(record);
      observer = structuredClone(validateObserver(observer));
      return mutation(local, async () => {
        const { tasks } = await read(life);
        assert(life);
        const prior = own(tasks, record.operation_key) ? tasks[record.operation_key] : null;
        if (!prior || !sameOperation(prior, record) || prior.correlation_id !== record.correlation_id
          || !prior.lock_active) refuse('reservation_failed', 'observer record mismatch');
        if (prior.observer && (prior.observer.page_instance_id !== observer.page_instance_id
          || prior.observer.observer_id !== observer.observer_id)) {
          refuse('reservation_failed', 'observer identity changed');
        }
        const next = { ...prior, updated_at: new Date().toISOString(), observer: { ...observer,
          armed_at: prior.observer ? prior.observer.armed_at : observer.armed_at } };
        validateTask(next, next.operation_key);
        await write(TASKS_KEY, { schema: TASKS_SCHEMA, operations: { ...tasks, [record.operation_key]: next } }, life);
        return next;
      });
    },
    async listTasks(life) { return structuredClone(Object.values((await observe(life)).tasks)).map(redactTask); },
    async reserveOperation(record, life) {
      plain(record);
      validateTask(record, record.operation_key);
      record = structuredClone(record);
      return mutation(local, async () => {
        const { legacy, tasks } = await read(life);
        assert(life); checkAvailable(record, legacy, tasks);
        const dispatch = { correlation_id: record.correlation_id, state: 'IN_FLIGHT', tab_id: record.target.tab_id,
          approved_scope_ref: record.approved_scope_ref, started_at: record.created_at, finished_at: null, captured: null,
          task_id: record.task_id, operation_key: record.operation_key, payload_hash: record.payload_hash,
          payload_chars: record.payload_chars, url: record.target.url, conversation_key: record.conversation_key };
        await write(DISPATCH_KEY, { schema: DISPATCH_SCHEMA, reservations: { ...legacy, [record.correlation_id]: dispatch } }, life);
        await write(TASKS_KEY, { schema: TASKS_SCHEMA, operations: { ...tasks, [record.operation_key]: structuredClone(record) } }, life);
        return true;
      });
    },
    async settleOperation(record, outcome, life) {
      plain(record);
      validateTask(record, record.operation_key);
      record = structuredClone(record);
      exact(outcome, ['captured', 'noSubmit', 'replyChecked']);
      if (![true, false, null].includes(outcome.captured) || typeof outcome.noSubmit !== 'boolean'
        || typeof outcome.replyChecked !== 'boolean' || (outcome.noSubmit && outcome.replyChecked)
        || (outcome.noSubmit && outcome.captured !== false) || (outcome.replyChecked && outcome.captured !== true)) refuse('reservation_failed', 'invalid settlement facts');
      outcome = { ...outcome };
      return mutation(local, async () => {
        const { legacy, tasks } = await read(life);
        const prior = own(tasks, record.operation_key) ? tasks[record.operation_key] : null;
        if (!prior || !sameOperation(prior, record) || prior.correlation_id !== record.correlation_id || !prior.lock_active) refuse('reservation_failed', 'task settlement mismatch');
        const noSubmit = outcome.noSubmit === true;
        const checked = !noSubmit && outcome.replyChecked === true;
        const next = { ...prior, updated_at: new Date().toISOString(),
          phase: noSubmit ? 'REFUSED_NO_SUBMIT' : checked ? 'REPLY_CHECKED' : 'NEEDS_RECONCILIATION',
          lock_active: !(noSubmit || checked),
          // BOUNDED RETENTION. The token is held only while the outcome is
          // open. Once the operation is resolved its marker is no longer
          // needed — the outcome is durably recorded — and the record stops
          // carrying it.
          expected_reply_token: (noSubmit || checked) ? null : prior.expected_reply_token ?? null,
          facts: { ...prior.facts, activation_possible: !noSubmit, no_submit: noSubmit, reply_checked: checked } };
        validateTask(next, next.operation_key);
        // Legacy completion alone never unlocks. If the second write fails, the
        // richer SUBMIT_RESERVED record still holds its unresolved lock.
        await write(DISPATCH_KEY, { schema: DISPATCH_SCHEMA, reservations: { ...legacy,
          [record.correlation_id]: { ...legacy[record.correlation_id], state: 'COMPLETED',
            finished_at: next.updated_at, captured: outcome.captured ?? null } } }, life);
        await write(TASKS_KEY, { schema: TASKS_SCHEMA, operations: { ...tasks, [record.operation_key]: next } }, life);
        return next;
      });
    },
    /**
     * Settle a reservation whose OWN WRITE FAILED, when nothing was sent.
     *
     * WHY IT EXISTS. `reserveOperation` writes the legacy dispatch record and
     * then the richer task record, and BOTH of them land before any page
     * exchange. So a reservation whose write failed can only be in one of two
     * shapes:
     *
     *   (a) both records landed and the lifecycle expired AFTER the write, so
     *       a SUBMIT_RESERVED task holds the conversation lock with no
     *       observer and no outcome — nothing can ever observe it and nothing
     *       can ever resolve it;
     *   (b) only the legacy IN_FLIGHT landed, so there is no task at all and
     *       the conversation is locked by an orphan tombstone forever.
     *
     * Neither shape can have sent anything: the send happens only after the
     * reservation is durable. So the honest outcome is available — a positive
     * no-submit, the lock released — and leaving either shape unresolved is
     * what wedges the conversation.
     *
     * WHAT IT REFUSES. A shape that does not match either of the two above
     * (a task with no matching legacy record, a legacy record that is already
     * COMPLETED, a dispatch record that cannot be rebuilt) is NOT settled and
     * NOT released: it is reported as not recorded. Inventing a release for an
     * operation nobody can name is exactly the failure this exists to stop.
     *
     * IT REFUSES AN OBSERVED TASK TOO. A rich record that already carries an
     * observer, or that has moved past SUBMIT_RESERVED, is evidence that the
     * page WAS reached — so a positive no-submit may not be written over it
     * and its lock may not be released on that basis. The record is left
     * exactly as it is and the refusal says so.
     *
     * RETURNS. The settled task record on success; `{ok:false,
     * settlement:'not_recorded', phase:null, lock_active:null, reason}` when
     * nothing could honestly be written.
     */
    async settleIncompleteReservation(correlation, options, life) {
      id(correlation);
      exact(options, ['noSend']);
      // A settlement here is only ever justified by a PROVEN no-send: the
      // reservation never reached a page, so nothing was activated.
      if (options.noSend !== true) refuse('reservation_failed', 'an incomplete reservation is only settled on proven no-send');
      return mutation(local, async () => {
        const { legacy, tasks } = await read(life);
        assert(life);
        const dispatch = own(legacy, correlation) ? legacy[correlation] : null;
        if (!dispatch) {
          return { ok: false, settlement: 'not_recorded', phase: null, lock_active: null,
            reason: 'no dispatch reservation exists for this correlation' };
        }
        if (dispatch.state !== 'IN_FLIGHT') {
          return { ok: false, settlement: 'not_recorded', phase: null, lock_active: null,
            reason: 'the dispatch reservation is not in flight; it was already settled' };
        }
        const task = Object.values(tasks).find((entry) => entry.correlation_id === correlation) ?? null;
        if (task) {
          // The two records must describe the SAME operation before one of
          // them is released: a task that does not match its dispatch record
          // is not this reservation's record.
          if (dispatch.task_id !== task.task_id || dispatch.operation_key !== task.operation_key
            || dispatch.payload_hash !== task.payload_hash) {
            return { ok: false, settlement: 'not_recorded', phase: null, lock_active: null,
              reason: 'the task record and the dispatch record describe different operations' };
          }
          // AN UNOBSERVED RESERVATION ONLY. This settlement exists for one
          // shape: a reservation that never reached a page, so nothing was
          // activated. A task that already carries an observer, or that has
          // moved past SUBMIT_RESERVED, is evidence that the page WAS reached
          // — so a positive no-submit may not be written over it, and the lock
          // may not be released on that basis. Defence in depth: the caller
          // only reaches here from the pre-exchange reservation write, but the
          // store is where the truth is, so the store refuses.
          if (task.phase !== 'SUBMIT_RESERVED' || task.observer !== null
            || task.facts.submission_observed !== null) {
            return { ok: false, settlement: 'not_recorded', phase: task.phase, lock_active: task.lock_active,
              reason: 'the task is not an unobserved reservation' };
          }
          const next = { ...task, updated_at: new Date().toISOString(), phase: 'REFUSED_NO_SUBMIT',
            lock_active: false, expected_reply_token: null,
            facts: { ...task.facts, activation_possible: false, no_submit: true, reply_checked: false } };
          validateTask(next, next.operation_key);
          await write(DISPATCH_KEY, { schema: DISPATCH_SCHEMA, reservations: { ...legacy,
            [correlation]: { ...dispatch, state: 'COMPLETED', finished_at: next.updated_at, captured: false } } }, life);
          await write(TASKS_KEY, { schema: TASKS_SCHEMA, operations: { ...tasks, [next.operation_key]: next } }, life);
          return next;
        }
        // No rich record: rebuild it from the dispatch record, which carries
        // the whole identity of the reservation.
        let rebuilt;
        try {
          rebuilt = rebuildTask(dispatch);
          validateTask(rebuilt, rebuilt.operation_key);
        } catch (error) {
          // A dispatch record that cannot be rebuilt is not settled and not
          // released: the shape is not one this store can speak about.
          return { ok: false, settlement: 'not_recorded', phase: null, lock_active: null,
            reason: String((error && error.message) || error) };
        }
        await write(DISPATCH_KEY, { schema: DISPATCH_SCHEMA, reservations: { ...legacy,
          [correlation]: { ...dispatch, state: 'COMPLETED', finished_at: rebuilt.updated_at, captured: false } } }, life);
        await write(TASKS_KEY, { schema: TASKS_SCHEMA, operations: { ...tasks, [rebuilt.operation_key]: rebuilt } }, life);
        return rebuilt;
      });
    },
    // Compatibility writer retained for internal/tests, never an alternate send
    // path. It cannot modify a correlation represented by a richer operation.
    async put(record, life) {
      plain(record);
      record = structuredClone(record);
      return mutation(local, async () => {
        const { legacy, tasks } = await read(life);
        id(record.correlation_id);
        if (Object.values(tasks).some((task) => task.correlation_id === record.correlation_id)
          || (record.state === 'IN_FLIGHT' && own(legacy, record.correlation_id))) refuse('reservation_failed', 'dispatch already reserved');
        const existing = own(legacy, record.correlation_id) ? legacy[record.correlation_id] : null;
        const nextRecord = existing ? { ...existing, state: record.state,
          captured: record.captured ?? existing.captured, finished_at: record.finished_at ?? existing.finished_at } : structuredClone(record);
        const next = { ...legacy, [record.correlation_id]: nextRecord };
        validateLegacy({ schema: DISPATCH_SCHEMA, reservations: next });
        await write(DISPATCH_KEY, { schema: DISPATCH_SCHEMA, reservations: next }, life);
        return true;
      });
    },
  };
}
