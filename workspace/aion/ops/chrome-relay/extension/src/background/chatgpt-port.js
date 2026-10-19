// AION Chrome Relay Station — ChatGPT tab port driver (worker side).
//
// WHAT THIS IS
//   The worker half of the `aion-chatgpt` port that src/chatgpt/content.js
//   listens on. It opens a short-lived port per request, asks the content
//   script for exactly one action, and returns the answer. It is deliberately
//   NOT a session manager: there is no reconnect loop, no queue and no retry,
//   because every one of those would eventually re-submit something the
//   operator only asked for once.
//
// TRUST (ARCHITECTURE.md §Authority model)
//   - The page is untrusted. This driver only ever sends a fixed, named action
//     from this file. It never forwards a caller's key as an action, and it
//     never lets anything the content script replies instruct a browser
//     command. A reply is DATA: it is validated and reported, never obeyed.
//   - Nothing here reads a cookie, a token, storage or page bootstrap payload,
//     and nothing here can reach a tab that is not chatgpt.com.
//   - `runTurn` composes AND SUBMITS text into a signed-in ChatGPT session. It
//     refuses unless the caller passes `user_gesture: true`, refuses a second
//     concurrent turn in the same tab, and performs exactly one attempt. There
//     is no auto-send, no replay after a restart and no timer.
//
// CONTENT-SCRIPT CONTRACT (read from content.js, not guessed)
//   port name : 'aion-chatgpt'
//   request   : { action: 'ping' | 'state' | 'run-turn' | 'submit-turn' |
//                         'observe-turn' | 'read-final' | 'stop' }
//   response  : the action is echoed back with the result; an unknown action
//               answers { ok:false, reason:'unknown_action' }
//   run-turn  : REQUIRES user_gesture === true, then composes, submits, waits
//               for generation, correlates the answer and replies
//               { ok, verdict, envelope, state }. It is content.js's
//               COMPATIBILITY WRAPPER over the same turn engine that
//               submit-turn/observe-turn drive.
//   submit-turn: the split engine's single activation. It reserves nothing and
//               replays nothing: it arms the page observer, activates once and
//               answers with that observer's FIRST receipt — full identity
//               (task_id/operation_key/correlation_id/observer_id/
//               page_instance_id) plus the arm facts, and no verdict yet.
//   observe-turn: read-only, repeatable poll of an ALREADY-ARMED observer.
//               Exact identity or nothing. Never fills, clicks, stops, or
//               extends the page's own observation deadline.
//   read-final: read-only correlation of the last assistant turn

import { validateEnvelope } from '../lib/index.js';
import { COMMAND_POLICY, COMMAND_WORK, resolveCommandDeadline, resolveSettlementDeadline, validateCommandPolicy } from '../lib/command-deadlines.js';
import { createBoundedLifecycle } from '../lib/bounded-lifecycle.js';
import { createChatGPTTaskStore, prepareTask, MAX_OBSERVER_ANNOTATION, storedReplyToken } from '../lib/chatgpt-tasks.js';
import { VERDICT_SCHEMA, REASON } from '../chatgpt/correlate.js';

/** Must equal `PORT_NAME` in src/chatgpt/content.js. */
export const CHATGPT_PORT_NAME = 'aion-chatgpt';

/** The only origin this driver will talk to. Matches the manifest match. */
export const CHATGPT_ORIGIN = 'https://chatgpt.com';

/** Tab-query filter handed to chrome.tabs.query; the JS filter repeats it. */
export const CHATGPT_TAB_PATTERN = 'https://chatgpt.com/*';

/** The content script's own action names, restated so a typo cannot invent one. */
export const CHATGPT_ACTION = Object.freeze({
  PING: 'ping',
  STATE: 'state',
  RUN_TURN: 'run-turn',
  SUBMIT_TURN: 'submit-turn',
  OBSERVE_TURN: 'observe-turn',
  READ_FINAL: 'read-final',
  STOP: 'stop',
  COMMANDER_SCAN: 'commander-scan',
});

/**
 * Actions that can put text into a signed-in session.
 *
 * Both arm and activate exactly once. `run-turn` is content.js's blocking
 * compatibility wrapper over the same engine; it is not a second send path, and
 * it is marked here so a timeout on either one is reported as "may have
 * activated", never as "did not send".
 */
const SEND_CAPABLE_ACTIONS = new Set([CHATGPT_ACTION.RUN_TURN, CHATGPT_ACTION.SUBMIT_TURN]);

/**
 * Read-only. The page answers these with a machine-readable reason when it has
 * no observer evidence; that reason is carried through verbatim.
 */
const OBSERVER_REFUSAL_REASONS = new Set(['observer_evidence_required', 'observer_identity_mismatch']);

/** Every refusal reason this module can produce. Stable strings; callers branch on these. */
export const CHATGPT_ERROR = Object.freeze({
  NO_TABS_API: 'tabs_unavailable',
  QUERY_FAILED: 'tabs_query_failed',
  TAB_NOT_FOUND: 'tab_not_found',
  NOT_A_CHATGPT_TAB: 'not_a_chatgpt_tab',
  NO_CHATGPT_TAB: 'no_chatgpt_tab',
  NO_CONTENT_SCRIPT: 'no_content_script',
  CONNECT_FAILED: 'connect_failed',
  PORT_CLOSED: 'port_closed',
  POST_FAILED: 'post_failed',
  TIMEOUT: 'content_timeout',
  MALFORMED_REPLY: 'malformed_reply',
  REPLY_MISMATCH: 'reply_action_mismatch',
  UNKNOWN_ACTION: 'unknown_action',
  INVALID_ENVELOPE: 'invalid_envelope',
  EXPLICIT_COMMAND_REQUIRED: 'explicit_command_required',
  APPROVAL_REQUIRED: 'approval_required',
  DISPATCH_IN_FLIGHT: 'dispatch_in_flight',
  ALREADY_DISPATCHED: 'already_dispatched',
  RESERVATION_FAILED: 'reservation_failed',
  PREFLIGHT_REFUSED: 'preflight_refused',
  TEXT_REQUIRED: 'text_required',
  TEXT_TOO_LONG: 'text_too_long',
  CORRELATION_REQUIRED: 'correlation_id_required',
  TURN_IN_FLIGHT: 'turn_in_flight',
  TURN_REFUSED: 'turn_refused',
  BAD_ARGUMENT: 'bad_argument',
  // Split submit/observe engine.
  IDENTITY_REQUIRED: 'operation_identity_required',
  OPERATION_NOT_RESERVED: 'operation_not_reserved',
  OBSERVER_IDENTITY_REQUIRED: 'observer_identity_required',
  OBSERVER_IDENTITY_MISMATCH: 'observer_identity_mismatch',
  OBSERVER_ARM_UNAVAILABLE: 'observer_arm_unavailable',
  TASK_ALREADY_RESOLVED: 'task_already_resolved',
  SUBMIT_PENDING: 'submit_pending',
  OBSERVATION_PENDING: 'observation_pending',
  ADAPTER_CONTRACT: 'adapter_acceptance_mismatch',
  // The caller supplied a token that is not the one this operation was sent
  // with. The stored one is authoritative, so the read is refused rather than
  // checked against the wrong marker.
  TOKEN_MISMATCH: 'expected_reply_token_mismatch',
});

/** Bounds. A prompt longer than this is refused, not truncated and sent. */
export const MAX_TEXT_CHARS = 8000;
export const MAX_ID_CHARS = 128;

/**
 * Bound on one page-supplied annotation (phase/method/reason), mirroring the
 * store's own limit. Exported so a test can hold the two in step.
 */
export const MAX_ANNOTATION_CHARS = MAX_OBSERVER_ANNOTATION;

/** Durable per-correlation dispatch bookkeeping. */
export const DISPATCH_SCHEMA = 'aion.chatgpt.dispatch/0.1';
export const DISPATCH_KEY = 'aion.relay.chatgpt.dispatch.v1';

/** A reservation is either outstanding or finished. Neither expires on its own. */
export const DISPATCH_STATE = Object.freeze({ IN_FLIGHT: 'IN_FLIGHT', COMPLETED: 'COMPLETED' });

/**
 * HARD CEILINGS for a submitted turn.
 *
 * WHY THE 2026-10-18 VALUES WERE TOO TIGHT. A real dispatch was observed to
 * outlive a 120s run budget: the click submitted, generation started, and the
 * page read its candidate while the model was still writing, so a correct reply
 * arrived seconds later and was refused as `generation_incomplete`. That is a
 * bound-versus-latency failure, not a correctness failure, and the honest fix is
 * a finite budget above real latency — never a looser completion check.
 *
 * The shared command-deadlines policy derives stage and absolute budgets from
 * command semantics. A run exchange includes the selected generation budget,
 * 400ms composer setup and bounded response grace. Hydration, tab resolution,
 * preflight and storage also have bounded stages, all consuming one absolute
 * lifecycle. The panel uses that complete plan plus a bounded response margin.
 * No heartbeat, traffic, or nested driver call renews the lifecycle.
 *
 * The page side clamps independently at content.js's `MAX_TIMEOUT_MS`, which is
 * 300s — the same ceiling. A worker budget above that would be silently
 * truncated by the page, so `tests/panel-controls.test.js` asserts the two
 * stay in step rather than trusting this comment.
 *
 * Declared BEFORE DEFAULT_CHATGPT_TIMEOUTS, which reads MAX_RUN_TIMEOUT_MS:
 * these are `const`, so the reverse order is a TDZ ReferenceError at import.
 */
export const MAX_RUN_TIMEOUT_MS = COMMAND_WORK['run-turn'];
// Compatibility export only. Actual waits use each command plan and remaining
// elapsed budget; this is not a timer or a global worker guard.
export const MAX_PORT_GUARD_MS = resolveCommandDeadline({ command: 'run-turn' }).stages.exchange;

/**
 * Default per-action budget.
 *
 * A turn is bounded by the ceilings above; these are the values the worker uses
 * when the caller does not say. Tests pass small ones so a suite never waits on a
 * real timer.
 */
export const DEFAULT_CHATGPT_TIMEOUTS = Object.freeze({
  ping: COMMAND_WORK.ping,
  state: COMMAND_WORK.state,
  read: COMMAND_WORK['read-final'],
  run: MAX_RUN_TIMEOUT_MS,
  stop: COMMAND_WORK.stop,
  submit: COMMAND_WORK['submit-turn'],
  observe: COMMAND_WORK['observe-turn'],
  reconcile: COMMAND_WORK['reconcile-turn'],
});

/**
 * Grace added on top of a turn's own budget before the worker gives up.
 *
 * The content script may spend a moment answering after its internal deadline.
 * Kept configurable so a test suite never has to wait out a production-sized
 * grace period, and so the value is visible rather than a magic constant buried
 * in a call.
 *
 * Test overrides may narrow this positive budget, never widen central policy.
 */
export const DEFAULT_CHATGPT_GRACE_MS = COMMAND_POLICY.grace;

/** `DEFAULT_CHATGPT_TIMEOUTS` key -> command-deadlines command name. */
const TIMEOUT_KEY_TO_COMMAND = Object.freeze({
  ping: 'ping', state: 'state', read: 'read-final', run: 'run-turn', stop: 'stop',
  submit: 'submit-turn', observe: 'observe-turn', reconcile: 'reconcile-turn',
});

/** Driver method -> command-deadlines command name (its absolute budget). */
const METHOD_COMMANDS = Object.freeze({
  listTabs: 'tabs', ping: 'ping', runTurn: 'run-turn', submitTurn: 'submit-turn',
  observeTurn: 'observe-turn', readFinal: 'read-final', commanderScan: 'commander-scan',
  reconcileTurn: 'reconcile-turn',
});

/** Command name -> `DEFAULT_CHATGPT_TIMEOUTS` key. */
const COMMAND_TO_TIMEOUT_KEY = Object.freeze({
  'read-final': 'read', 'run-turn': 'run', 'submit-turn': 'submit', 'observe-turn': 'observe',
  'reconcile-turn': 'reconcile',
});

/** Is this a chatgpt.com tab URL? Exact origin match; nothing else. */
export function isChatGptUrl(url) {
  if (typeof url !== 'string' || url === '') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return parsed.hostname.toLowerCase() === 'chatgpt.com';
  } catch {
    return false;
  }
}

/**
 * Strip a URL down to origin + path.
 *
 * Query strings and fragments are dropped: on chatgpt.com they carry
 * conversation ids, share tokens and `__NEXT_DATA__`-style bootstrap markers.
 * None of that is needed to identify a tab, and all of it is page content.
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string' || url === '') return null;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
}

/**
 * The ONLY tab shape this module hands back.
 *
 * Deliberately absent: `title` (a chatgpt.com document title is the
 * conversation title, i.e. page content), the full `url`, and anything else
 * Chrome happens to attach. id + sanitized url + window + active + status is
 * what "which tab" needs and nothing more.
 */
export function sanitizeTab(tab) {
  if (!tab || typeof tab !== 'object') return null;
  const id = Number.isInteger(tab.id) ? tab.id : null;
  if (id === null) return null;
  const url = sanitizeUrl(tab.url);
  if (url === null || !isChatGptUrl(tab.url)) return null;
  return {
    tab_id: id,
    url,
    window_id: Number.isInteger(tab.windowId) ? tab.windowId : null,
    active: tab.active === true,
    status: typeof tab.status === 'string' ? tab.status : 'unknown'
  };
}

/**
 * Create the driver.
 *
 * @param {object} options
 * @param {object} options.chrome       the extension API surface (tabs required)
 * @param {(fn: Function, ms: number) => *} [options.setTimeout]
 * @param {(handle: *) => void} [options.clearTimeout]
 * @param {object} [options.timeouts]   per-action overrides, ms
 */
export function createChatGPTPortDriver(options = {}) {
  const api = options.chrome && options.chrome.tabs ? options.chrome : null;
  const setTimer = typeof options.setTimeout === 'function'
    ? options.setTimeout
    : (fn, ms) => setTimeout(fn, ms);
  const clearTimer = typeof options.clearTimeout === 'function'
    ? options.clearTimeout
    : (handle) => clearTimeout(handle);
  const timeouts = { ...DEFAULT_CHATGPT_TIMEOUTS, ...(options.timeouts || {}) };
  const policy = validateCommandPolicy({ ...options.policy,
    ...(options.graceMs === undefined ? {} : { grace: options.graceMs }) });
  for (const [name, value] of Object.entries(timeouts)) {
    resolveCommandDeadline({ command: TIMEOUT_KEY_TO_COMMAND[name] ?? name, requestedWorkMs: value }, policy);
  }
  const validateEnvelope = makeValidator(options.validateEnvelope);
  const reservations = options.reservations && typeof options.reservations.get === 'function'
    ? options.reservations
    : createReservationStore({ chrome: api });

  /** tab id -> true while a turn is running there. One turn per tab, ever. */
  const turnsInFlight = new Set();

  /* --------------------------------------------------------------- helpers */

  function fail(code, detail = {}) {
    return { ok: false, code, error: `${code}${detail.message ? `: ${detail.message}` : ''}`, ...detail };
  }

  async function queryChatGptTabs(lifecycle) {
    if (!api) throw new Error(`${CHATGPT_ERROR.NO_TABS_API}: chrome.tabs is unavailable in this context`);
    let found;
    try {
      found = await lifecycle.wait('resolveTab', () => api.tabs.query({ url: CHATGPT_TAB_PATTERN }));
    } catch (err) {
      if (err.code === CHATGPT_ERROR.TIMEOUT) throw err;
      throw new Error(`${CHATGPT_ERROR.QUERY_FAILED}: ${err && err.message ? err.message : err}`);
    }
    if (!Array.isArray(found)) return [];
    // Filter again in JS: the query filter is a convenience, not the authority.
    return found.map(sanitizeTab).filter(Boolean);
  }

  /**
   * Resolve the tab to act on.
   *
   * A caller-supplied id is only accepted after it has been shown to BE a
   * chatgpt.com tab. Without that check this driver would be a generic
   * "post this message to any tab" primitive, which is exactly the capability
   * the architecture forbids the extension from having.
   */
  async function resolveTab(tabId, lifecycle) {
    const tabs = await queryChatGptTabs(lifecycle);
    lifecycle.assertActive();
    if (tabId === undefined || tabId === null) {
      if (tabs.length === 0) return { error: fail(CHATGPT_ERROR.NO_CHATGPT_TAB) };
      return { tab: tabs[0], tabs };
    }
    const wanted = Number(tabId);
    if (!Number.isInteger(wanted)) return { error: fail(CHATGPT_ERROR.BAD_ARGUMENT, { message: 'tab_id must be an integer' }) };
    const found = tabs.find((tab) => tab.tab_id === wanted);
    if (!found) {
      return {
        error: fail(tabs.length === 0 ? CHATGPT_ERROR.NO_CHATGPT_TAB : CHATGPT_ERROR.NOT_A_CHATGPT_TAB, {
          tab_id: wanted,
          message: tabs.length === 0
            ? 'no chatgpt.com tab is open'
            : 'that tab id is not a chatgpt.com tab'
        })
      };
    }
    return { tab: found, tabs };
  }

  /**
   * One request, one response, one port.
   *
   * A fresh port per request is deliberate: a persistent port would need
   * reconnection logic, and reconnection logic for a port that can submit text
   * is a replay waiting to happen.
   */
  function exchange(tabId, action, payload, lifecycle, stage = 'exchange') {
    return lifecycle.wait(stage, () => new Promise((resolve) => {
      let port;
      let settled = false;
      let disconnected = false;
      let removeCleanup = () => {};
      const onMessage = (message) => finish(message);
      const onDisconnect = () => finish(fail(CHATGPT_ERROR.PORT_CLOSED, { tab_id: tabId, action }));
      const cleanup = () => {
        for (const [event, handler] of [[port?.onMessage, onMessage], [port?.onDisconnect, onDisconnect]]) {
          try { event?.removeListener?.(handler); } catch { /* best effort, token still rejects late events */ }
        }
        if (!disconnected) {
          disconnected = true;
          try { port?.disconnect?.(); } catch { /* already closed */ }
        }
      };
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value); // settle before cleanup can emit synchronous disconnect
        removeCleanup();
        cleanup();
      };
      try {
        lifecycle.assertActive();
        port = api.tabs.connect(tabId, { name: CHATGPT_PORT_NAME });
      } catch (err) {
        // Chrome throws "Could not establish connection. Receiving end does
        // not exist." when the content script has not loaded in that tab.
        const message = String((err && err.message) || err);
        finish(fail(
          /receiving end|content script|no matching/i.test(message)
            ? CHATGPT_ERROR.NO_CONTENT_SCRIPT
            : CHATGPT_ERROR.CONNECT_FAILED,
          { tab_id: tabId, message }
        ));
        return;
      }
      if (!port || typeof port.postMessage !== 'function') {
        finish(fail(CHATGPT_ERROR.CONNECT_FAILED, { tab_id: tabId, message: 'chrome.tabs.connect returned no port' }));
        return;
      }
      // Fail fast rather than sit out the whole budget: a port that cannot
      // receive is never going to answer, and waiting out a timeout on it looks
      // exactly like a hung worker.
      if (!port.onMessage || typeof port.onMessage.addListener !== 'function') {
        finish(fail(CHATGPT_ERROR.CONNECT_FAILED, { tab_id: tabId, message: 'the returned port cannot receive replies' }));
        return;
      }

      removeCleanup = lifecycle.addCleanup(() => { settled = true; cleanup(); });
      try {
        lifecycle.assertActive();
        port.onMessage.addListener(onMessage);
        if (settled) { cleanup(); return; }
        lifecycle.assertActive();
        port.onDisconnect?.addListener(onDisconnect);
        if (settled) { cleanup(); return; }
        lifecycle.assertActive();
        // A read-only action learns nothing about a submitted operation. The
        // worker wrapper uses this to avoid claiming `submitted:false` about the
        // operation on a transport failure — that would be a no-send statement
        // this poll is not entitled to make.
        if (SEND_CAPABLE_ACTIONS.has(action)) lifecycle.possibleSend = true;
        else lifecycle.readOnly = true;
        port.postMessage({ action, ...payload });
      } catch (err) {
        finish(fail(CHATGPT_ERROR.POST_FAILED, { tab_id: tabId, action, message: String((err && err.message) || err) }));
      }
    }));
  }

  /** Reject anything that is not a reply to the action we asked. */
  function checkReply(reply, action, tabId) {
    if (!reply || typeof reply !== 'object' || Array.isArray(reply)) {
      return { error: fail(CHATGPT_ERROR.MALFORMED_REPLY, { tab_id: tabId, action }) };
    }
    if (reply.action !== action) {
      return { error: fail(CHATGPT_ERROR.REPLY_MISMATCH, { tab_id: tabId, action, reply_action: String(reply.action) }) };
    }
    if (reply.ok === false && reply.reason === CHATGPT_ERROR.UNKNOWN_ACTION) {
      return { error: fail(CHATGPT_ERROR.UNKNOWN_ACTION, { tab_id: tabId, action, message: String(reply.error || '') }) };
    }
    return { reply };
  }

  /**
   * Is this a TRANSPORT failure rather than a content-script answer?
   *
   * The two are easy to confuse and conflating them loses real information: the
   * content script answers `ok:false` for a perfectly ordinary refusal (a turn
   * is already running, generation timed out, the reply did not correlate), and
   * that carries a verdict. Only the driver's own refusals carry a `code`.
   */
  function isTransportFailure(value) {
    return Boolean(value) && typeof value.code === 'string';
  }

  /* ------------------------------------------------------------------- API */

  const methods = {
    portName: CHATGPT_PORT_NAME,

    /** Sanitized chatgpt.com tabs. Never any other tab, never a title. */
    async listTabs(command, lifecycle) {
      try {
        const tabs = await queryChatGptTabs(lifecycle);
        return { ok: true, count: tabs.length, tabs };
      } catch (err) {
        return { ok: false, code: codeOf(err, CHATGPT_ERROR.NO_TABS_API), error: String(err && err.message ? err.message : err), tabs: [] };
      }
    },

    /** Read-only probe. Nothing is composed and nothing is sent. */
    async ping(command = {}, lifecycle) {
      const resolved = await resolveTab(command.tab_id, lifecycle);
      if (resolved.error) return resolved.error;
      const answer = await exchange(resolved.tab.tab_id, CHATGPT_ACTION.PING, {}, lifecycle);
      if (isTransportFailure(answer)) return { ...answer, tab: resolved.tab };
      const checked = checkReply(answer, CHATGPT_ACTION.PING, resolved.tab.tab_id);
      if (checked.error) return { ...checked.error, tab: resolved.tab };
      const reply = checked.reply;
      return {
        ok: reply.ok === true,
        tab: resolved.tab,
        action: CHATGPT_ACTION.PING,
        // href is already origin+path (content.js builds it that way); re-sanitize
        // anyway so a future content script cannot widen what leaves the worker.
        href: sanitizeUrl(reply.href),
        // `title` is intentionally NOT returned: on chatgpt.com it is the
        // conversation title, which is page content.
        state: sanitizeState(reply.state),
        note: typeof reply.note === 'string' ? reply.note : null
      };
    },

    /**
     * Compose AND SUBMIT one turn.
     *
     * The gate is `user_gesture === true`, the same field name the content
     * script requires, so the assertion is carried end to end without being
     * renamed into something a caller could satisfy by accident. It is checked
     * BEFORE any port is opened: a mis-wired caller cannot produce a send. One
     * attempt, never retried.
     *
     * COMPATIBILITY WRAPPER, NOT A SECOND SEND PATH. This posts content.js's
     * blocking `run-turn`, which is that file's own wrapper over the SAME
     * `createTurnEngine` that `submit-turn`/`observe-turn` drive, and it goes
     * through the same reservation, lock and settlement guards below. Nothing
     * about the split engine may be bypassed by calling this instead.
     */
    async runTurn(command = {}, lifecycle) {
      let prepared = null;
      try {
        prepared = await reserveSend(command, lifecycle, CHATGPT_ACTION.RUN_TURN);
      } catch (error) {
        // The reservation itself failed (a preflight that could not be
        // answered, for example). Nothing was reserved, so there is no record
        // to settle and nothing was sent.
        return failureAfterError(error, null, { ok: false, sendPosted: false }, CHATGPT_ACTION.RUN_TURN, {
          submitted: false
        });
      }
      if (prepared.error) return prepared.error;
      const { tab, correlationKey, startedAt, settle, release, timeoutMs, expectedToken, text } = prepared;

      try {
        lifecycle.assertActive();
        const answer = await exchange(tab.tab_id, CHATGPT_ACTION.RUN_TURN, {
          // The content script refuses without this exact flag.
          user_gesture: true,
          text,
          correlation_id: correlationKey,
          expected_reply_token: typeof expectedToken === 'string' ? expectedToken.trim() : '',
          timeout_ms: timeoutMs
        }, lifecycle);

        if (isTransportFailure(answer)) {
          await settle(null);
          return { ...answer, tab, correlation_id: correlationKey, submitted: true, uncertain: true, started_at: startedAt, captured: false };
        }
        const checked = checkReply(answer, CHATGPT_ACTION.RUN_TURN, tab.tab_id);
        if (checked.error) {
          await settle(null);
          return { ...checked.error, tab, correlation_id: correlationKey, submitted: true, uncertain: true, started_at: startedAt, captured: false };
        }
        const reply = checked.reply;

        if (reply.ok !== true) {
          // The turn ran but did not produce a correlated answer. Report it as a
          // refusal with the script's own reason; never as a success.
          await settle(false, { noSubmit: reply.submitted === false });
          const sanitizedVerdict = sanitizeVerdict(reply.verdict);
          // An early refusal (for example `send_button_disabled`) carries a
          // machine `reason` and no verdict. Falling back to `no_reason` there
          // threw away the only fact the page gave us.
          const fallbackReason = typeof reply.reason === 'string' && reply.reason !== ''
            ? reply.reason
            : null;
          const refusalReason = (sanitizedVerdict && sanitizedVerdict.reason) || fallbackReason || 'no_reason';
          const verdict = sanitizedVerdict
            ? { ...sanitizedVerdict, reason: refusalReason }
            : (fallbackReason === null
              ? null
              : {
                schema: null,
                accepted: false,
                reason: fallbackReason,
                correlation_id: correlationKey,
                expected_reply: null
              });
          // PROVEN no-send is an explicit field on the content script's reply.
          // Prose such as "nothing was submitted", a missing verdict, or an
          // empty envelope proves nothing about the page, so those keep the
          // outcome uncertain.
          const provenNoSubmit = reply.submitted === false;
          return {
            ok: false,
            code: CHATGPT_ERROR.TURN_REFUSED,
            error: `${CHATGPT_ERROR.TURN_REFUSED}: ${refusalReason}`,
            tab,
            action: CHATGPT_ACTION.RUN_TURN,
            correlation_id: correlationKey,
            // The expected reply token is NOT echoed. It is a marker this
            // operation was sent with, not a fact about the outcome, and the
            // machine reply has no need to carry it back.
            verdict,
            envelope: null,
            captured: false,
            submitted: provenNoSubmit ? false : true,
            ...(provenNoSubmit ? { uncertain: false } : {}),
            started_at: startedAt,
            finished_at: new Date().toISOString()
          };
        }

        // An accepted turn carries a relay envelope. It is validated here so a
        // half-trusted object cannot leave the worker.
        const envelopeCheck = validateEnvelope(reply.envelope);
        const replyChecked = envelopeCheck.valid && acceptedAdapterContract(reply, correlationKey,
          typeof expectedToken === 'string' ? expectedToken.trim() : '');
        await settle(replyChecked, { replyChecked });
        if (!envelopeCheck.valid) {
          return {
            ok: false,
            code: CHATGPT_ERROR.INVALID_ENVELOPE,
            error: `${CHATGPT_ERROR.INVALID_ENVELOPE}: ${envelopeCheck.errors.join('; ')}`,
            tab,
            correlation_id: correlationKey,
            verdict: sanitizeVerdict(reply.verdict),
            envelope: null,
            captured: false,
            submitted: true,
            started_at: startedAt,
            finished_at: new Date().toISOString()
          };
        }

        if (!replyChecked) {
          return fail(CHATGPT_ERROR.TURN_REFUSED, {
            tab, action: CHATGPT_ACTION.RUN_TURN, correlation_id: correlationKey,
            message: 'adapter_acceptance_mismatch: accepting verdict/envelope/payload contract is missing or contradictory',
            verdict: sanitizeVerdict(reply.verdict), envelope: null,
            submitted: true, uncertain: true, captured: false,
            started_at: startedAt, finished_at: new Date().toISOString(),
          });
        }

        return {
          ok: true,
          tab,
          action: CHATGPT_ACTION.RUN_TURN,
          correlation_id: correlationKey,
          // The expected reply token is NOT echoed: it is a marker, not an
          // outcome, and the machine reply does not need it back.
          verdict: sanitizeVerdict(reply.verdict),
          // The envelope ITSELF, not the validation result: validateEnvelope
          // returns {valid, errors}, so handing that on would ship the verdict
          // of a check in the place of the checked object.
          envelope: structuredClone(reply.envelope),
          // `captured` is the panel's question: was an answer taken back. It is
          // true only for a correlated, schema-valid reply.
          captured: true,
          state: sanitizeState(reply.state),
          submitted: true,
          started_at: startedAt,
          finished_at: new Date().toISOString()
        };
      } catch (error) {
        // THE COMMAND FAILED. A lifecycle timeout, a dropped port or a
        // transport error throws out of the exchange, and the reservation that
        // was already written would otherwise stay SUBMIT_RESERVED with no
        // observer and no outcome — unobservable and unresolvable, with the
        // conversation locked forever. The record is settled here instead, and
        // the answer says exactly which outcome was recorded.
        const settlement = await settleAfterFailure(lifecycle, prepared);
        return failureAfterError(error, prepared, settlement, CHATGPT_ACTION.RUN_TURN, {
          started_at: startedAt, finished_at: new Date().toISOString()
        });
      } finally {
        release();
      }
    },

    /**
     * `submit-turn` — the split engine's single, guarded activation.
     *
     * Identical gates and identical durable reservation to `runTurn` (both call
     * `reserveSend`; there is one send implementation here). What differs is
     * the page action and the reading of the receipt:
     *
     *   1. the page arms its task-bound observer and activates ONCE;
     *   2. the reply carries the observer identity and the arm facts;
     *   3. THIS WORKER persists that identity durably BEFORE it judges or
     *      settles anything, so a later poll can prove it is asking the same
     *      page about the same observer;
     *   4. only a positive no-send or a contract-valid accepted reply releases
     *      the conversation lock. A pending receipt is not an outcome: the
     *      record stays NEEDS_RECONCILIATION with the lock held.
     *
     * Arm-before-activation itself is the page's invariant (content.js installs
     * the MutationObserver before it fires the one click). What this side owns
     * is the ordering above: no settlement, no release and no reported
     * activation happens before the arm facts are on disk.
     */
    async submitTurn(command = {}, lifecycle) {
      let prepared = null;
      try {
        prepared = await reserveSend(command, lifecycle, CHATGPT_ACTION.SUBMIT_TURN, { requireIdentity: true });
      } catch (error) {
        // The reservation itself failed. Nothing was reserved, so there is no
        // record to settle and nothing was sent.
        return failureAfterError(error, null, { ok: false, sendPosted: false }, CHATGPT_ACTION.SUBMIT_TURN, {
          submitted: false
        });
      }
      if (prepared.error) return prepared.error;
      const { tab, correlationKey, startedAt, settle, release, timeoutMs, expectedToken, text, task } = prepared;

      try {
        lifecycle.assertActive();
        const answer = await exchange(tab.tab_id, CHATGPT_ACTION.SUBMIT_TURN, {
          user_gesture: true,
          text,
          correlation_id: correlationKey,
          task_id: task.task_id,
          operation_key: task.operation_key,
          expected_reply_token: typeof expectedToken === 'string' ? expectedToken.trim() : '',
          timeout_ms: timeoutMs
        }, lifecycle);

        if (isTransportFailure(answer)) {
          await settle(null);
          return { ...answer, tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            submitted: true, uncertain: true, captured: false, started_at: startedAt };
        }
        const checked = checkReply(answer, CHATGPT_ACTION.SUBMIT_TURN, tab.tab_id);
        if (checked.error) {
          await settle(null);
          return { ...checked.error, tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            submitted: true, uncertain: true, captured: false, started_at: startedAt };
        }
        const receipt = checked.reply;

        // POSITIVE NO-SEND, BEFORE ANY IDENTITY REQUIREMENT.
        //
        // content.js's `refuse()` answers {ok:false, reason, submitted:false,
        // no_send:true} and names NO observer, because nothing was armed: a turn
        // already in flight, an unusable request, an outbound text that carries
        // no correlation, an identity the page has already seen, an unreadable
        // baseline, a full page-side store. Requiring identity first reported
        // every one of those as `observer_identity_mismatch`, settled
        // NEEDS_RECONCILIATION and held the conversation lock against an
        // operation that never started. Identity is required only where the page
        // COULD have armed an observer: a pending or terminal turn receipt.
        if (receipt.no_send === true && receipt.submitted === false) {
          await settle(false, { noSubmit: true });
          const reason = pageRefusalReason(receipt) ?? 'no_submit';
          return {
            ok: false,
            code: CHATGPT_ERROR.TURN_REFUSED,
            error: `${CHATGPT_ERROR.TURN_REFUSED}: ${reason}`,
            tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            reason, verdict: sanitizeVerdict(receipt.verdict), envelope: null,
            // Nothing was armed, so no observer session is recorded or claimed.
            observer: null,
            captured: false, submitted: false, uncertain: false,
            started_at: startedAt, finished_at: new Date().toISOString(),
          };
        }

        // Identity first. A receipt that does not name this exact operation and
        // observer is not evidence about this operation, and it is never
        // recorded as such.
        const identityProblem = receiptIdentityProblem(receipt, task, correlationKey);
        if (identityProblem) {
          await settle(null);
          return fail(CHATGPT_ERROR.OBSERVER_IDENTITY_MISMATCH, {
            tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            message: identityProblem, submitted: true, uncertain: true, captured: false,
            started_at: startedAt, finished_at: new Date().toISOString(),
          });
        }

        // DURABLE BEFORE JUDGED. If this write fails, the identity is lost and no
        // later poll can honestly claim to be the same observer, so the outcome
        // stays uncertain with the lock held; it is never a checked reply.
        const armed = await recordObserverFacts(receipt, task, lifecycle);
        if (!armed.ok) {
          // The observer identity could not be recorded, so this record would
          // otherwise sit in SUBMIT_RESERVED with no observer and no outcome —
          // exactly the state a later poll can never resolve. The activation was
          // attempted, so the only honest outcome is "uncertain, still locked".
          await settle(null);
          return fail(armed.code, {
            tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            message: armed.message, submitted: true, uncertain: true, captured: false,
            started_at: startedAt, finished_at: new Date().toISOString(),
          });
        }

        const fact = armFacts(receipt, armed.at);
        const terminal = receipt.pending === false;
        // A page that says it did not accept is reporting an OUTCOME. It is not a
        // contract violation and must never be reported as one: the proof.rejected
        // envelope is exactly what a rejection looks like, and `runTurn` reads the
        // same shape the same way.
        const refusedOutcome = terminal && !claimsAcceptance(receipt);

        const capture = refusedOutcome
          ? { ok: false, contracted: false, invalid: false, reports: false, errors: '' }
          : (receipt.envelope !== undefined && receipt.envelope !== null
            ? envelopeAndContract(validateEnvelope(receipt.envelope), receipt, correlationKey, expectedToken)
            : { ok: false, contracted: false, invalid: false, reports: false, errors: '' });
        // Only an accepted contract or a proven no-send releases the lock; a
        // rejection keeps it, because the operation still has no checked reply.
        await settle(capture.ok ? true : null, capture.ok ? { replyChecked: true } : {});
        if (refusedOutcome) {
          const reason = pageRefusalReason(receipt) ?? 'no_accepted_reply';
          return {
            ok: false,
            code: CHATGPT_ERROR.TURN_REFUSED,
            error: `${CHATGPT_ERROR.TURN_REFUSED}: ${reason}`,
            tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            reason, verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
            pending: false, captured: false, submitted: true, uncertain: true,
            started_at: startedAt, finished_at: new Date().toISOString(),
          };
        }
        if (capture.invalid) {
          return {
            ok: false,
            code: CHATGPT_ERROR.INVALID_ENVELOPE,
            error: `${CHATGPT_ERROR.INVALID_ENVELOPE}: ${capture.errors}`,
            tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
            captured: false, submitted: true, started_at: startedAt, finished_at: new Date().toISOString(),
          };
        }
        if (capture.contracted) {
          return fail(CHATGPT_ERROR.ADAPTER_CONTRACT, {
            tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            message: 'adapter_acceptance_mismatch: accepting verdict/envelope/payload contract is missing or contradictory',
            verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
            submitted: true, uncertain: true, captured: false,
            started_at: startedAt, finished_at: new Date().toISOString(),
          });
        }
        if (capture.ok) {
          return {
            ok: true,
            tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            // The expected reply token is NOT echoed: it is a marker, not an
            // outcome, and the machine reply does not need it back.
            verdict: sanitizeVerdict(receipt.verdict),
            envelope: structuredClone(receipt.envelope),
            observer: fact,
            captured: true,
            submitted: true,
            started_at: startedAt,
            finished_at: new Date().toISOString(),
          };
        }
        if (terminal) {
          // The page CLAIMED an accepted capture and supplied nothing that can be
          // checked against it. A claim with no envelope behind it is a contract
          // mismatch, never a capture — and never a pending outcome either.
          return fail(CHATGPT_ERROR.ADAPTER_CONTRACT, {
            tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
            message: 'adapter_acceptance_mismatch: the page reported a terminal, accepted receipt with no envelope to check it against',
            verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
            submitted: true, uncertain: true, captured: false, pending: false,
            started_at: startedAt, finished_at: new Date().toISOString(),
          });
        }

        // GENUINELY PENDING (`pending !== false`). The activation was attempted
        // and the reply has not settled. That is not an outcome: the conversation
        // stays locked and the record stays unresolved until an observe-turn
        // reaches a terminal one. What the page actually reported is named here
        // rather than flattened into a stronger claim than it made.
        return {
          ok: false,
          code: CHATGPT_ERROR.SUBMIT_PENDING,
          error: `${CHATGPT_ERROR.SUBMIT_PENDING}: activation attempted; submission_observed=${fact.submission_observed}, `
            + `generation_complete=${fact.generation_complete}, generation_started=${fact.generation_started}`,
          tab, action: CHATGPT_ACTION.SUBMIT_TURN, correlation_id: correlationKey,
          verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
          pending: true, captured: false, submitted: true, uncertain: true,
          started_at: startedAt, finished_at: new Date().toISOString(),
        };
      } catch (error) {
        // THE COMMAND FAILED. A lifecycle timeout, a dropped port or a
        // transport error throws out of the exchange, and the reservation that
        // was already written would otherwise stay SUBMIT_RESERVED with no
        // observer and no outcome. The record is settled here instead.
        const settlement = await settleAfterFailure(lifecycle, prepared);
        return failureAfterError(error, prepared, settlement, CHATGPT_ACTION.SUBMIT_TURN, {
          started_at: startedAt, finished_at: new Date().toISOString()
        });
      } finally {
        release();
      }
    },

    /**
     * `observe-turn` — read-only, repeatable poll of an armed observer.
     *
     * There is no path from here to a fill, a click, a stop, a reservation or a
     * replay: the only message this ever writes is `observe-turn`, and it
     * carries no `timeout_ms`, because the page's own observation deadline is
     * set when the task was armed and must not move. Exact identity or nothing —
     * the identity comes from the durable record, never from the caller.
     */
    async observeTurn(command = {}, lifecycle) {
      // A POLL NEVER CLAIMS WHAT THE OPERATION DID. `submitted` describes the
      // activation, not this read-only call, and a poll that failed to learn
      // anything must not turn "we do not know" into "nothing was sent". Only a
      // receipt actually read from the page may carry that claim.
      const pollOnly = (result, extra = {}) => {
        const { submitted, ...rest } = result;
        return { ...rest, ...extra, read_only: true, captured: false };
      };
      const correlationId = command.correlation_id;
      if (typeof correlationId !== 'string' || correlationId.trim() === '' || correlationId.length > MAX_ID_CHARS) {
        return pollOnly(fail(CHATGPT_ERROR.CORRELATION_REQUIRED, {
          message: `observeTurn reads an existing operation; correlation_id must name it (max ${MAX_ID_CHARS} chars)`,
        }));
      }
      const task = await durableTask(correlationId.trim(), lifecycle, { required: true });
      if (task.error) return pollOnly(task.error);
      // The token this operation was sent with is durable, so a poll does not
      // need the original caller to supply it. A caller token that contradicts
      // the stored one is refused, and the lock is kept.
      const token = resolveExpectedToken(task.record, command.expected_reply_token);
      if (token.mismatch) {
        return pollOnly(fail(CHATGPT_ERROR.TOKEN_MISMATCH, {
          correlation_id: correlationId.trim(),
          phase: task.record.phase,
          reason: 'expected_reply_token_mismatch',
          message: 'the expected_reply_token supplied by the caller is not the one this operation was sent with; the stored marker is authoritative and nothing is checked against the wrong one',
        }));
      }
      if (task.record.observer === null) {
        return pollOnly(fail(CHATGPT_ERROR.OBSERVER_IDENTITY_REQUIRED, {
          correlation_id: correlationId.trim(),
          reason: 'observer_identity_required',
          message: 'this operation has no recorded page observer, so there is nothing to observe; it was never armed',
        }));
      }
      if (!task.record.lock_active) {
        return pollOnly(fail(CHATGPT_ERROR.TASK_ALREADY_RESOLVED, {
          correlation_id: correlationId.trim(),
          phase: task.record.phase,
          reason: 'observer_terminal',
          message: `this operation is already ${task.record.phase}; it is not observed again and nothing is re-sent`,
        }));
      }
      if (command.tab_id !== undefined && command.tab_id !== null && Number(command.tab_id) !== task.record.target.tab_id) {
        return pollOnly(fail(CHATGPT_ERROR.NOT_A_CHATGPT_TAB, {
          tab_id: Number.isInteger(Number(command.tab_id)) ? Number(command.tab_id) : null,
          message: 'this operation belongs to a different tab; the observer is bound to the page it was armed on',
        }));
      }

      const identity = observerIdentity(task.record);
      const answer = await exchange(task.record.target.tab_id, CHATGPT_ACTION.OBSERVE_TURN, {
        task_id: task.record.task_id,
        operation_key: task.record.operation_key,
        correlation_id: task.record.correlation_id,
        observer_id: identity.observer_id,
        page_instance_id: identity.page_instance_id,
      }, lifecycle);
      // The page was asked and did not answer. That is uncertainty about the
      // operation, not a statement that nothing was submitted.
      if (isTransportFailure(answer)) {
        return pollOnly(answer, {
          tab: task.record.target.tab_id, action: CHATGPT_ACTION.OBSERVE_TURN, uncertain: true,
        });
      }
      const checked = checkReply(answer, CHATGPT_ACTION.OBSERVE_TURN, task.record.target.tab_id);
      if (checked.error) return pollOnly(checked.error, { uncertain: true });
      const receipt = checked.reply;

      const identityProblem = receiptIdentityProblem(receipt, task.record, task.record.correlation_id);
      if (identityProblem) {
        return pollOnly(fail(CHATGPT_ERROR.OBSERVER_IDENTITY_MISMATCH, {
          ...identity, action: CHATGPT_ACTION.OBSERVE_TURN, reason: 'observer_identity_mismatch',
          message: identityProblem,
        }));
      }

      // Record what was observed before judging it, exactly as submit-turn does:
      // the durable evidence must not depend on the outcome being nice.
      const armed = await recordObserverFacts(receipt, task.record, lifecycle);
      if (!armed.ok) {
        return pollOnly(fail(armed.code, { ...identity, action: CHATGPT_ACTION.OBSERVE_TURN, message: armed.message }));
      }
      const fact = armFacts(receipt, armed.at);

      const terminal = receipt.pending === false;
      if (!terminal) {
        // A poll that has not settled changes nothing durable except the
        // observation facts already written. The lock stays held.
        return {
          ok: false,
          code: CHATGPT_ERROR.OBSERVATION_PENDING,
          error: `${CHATGPT_ERROR.OBSERVATION_PENDING}: the observer has not settled`,
          action: CHATGPT_ACTION.OBSERVE_TURN,
          ...identity,
          correlation_id: task.record.correlation_id,
          observer: fact,
          pending: true, uncertain: true, captured: false, read_only: true,
        };
      }

      const provenNoSubmit = receipt.submitted === false && receipt.no_send === true;
      // A page that says it did not accept is reporting an OUTCOME, not breaking a
      // contract: `proof.rejected` IS what a rejection looks like, and a terminal
      // receipt can carry `ok:true` beside a rejected verdict. Reading that as
      // `adapter_acceptance_mismatch` replaces the page's real diagnosis with a
      // claim about the adapter's own honesty. `adapter_acceptance_mismatch` is
      // reserved for a page that CLAIMED acceptance and cannot back it up.
      const refusedOutcome = !provenNoSubmit && !claimsAcceptance(receipt);
      const capture = refusedOutcome || receipt.envelope === undefined || receipt.envelope === null
        ? { ok: false, contracted: false, invalid: false, reports: false, errors: '' }
        : envelopeAndContract(validateEnvelope(receipt.envelope), receipt, task.record.correlation_id, token.token);
      // Only these two release the conversation lock.
      await task.settle(provenNoSubmit ? false : (capture.ok ? true : null),
        provenNoSubmit ? { noSubmit: true } : (capture.ok ? { replyChecked: true } : {}));

      if (provenNoSubmit) {
        const reason = pageRefusalReason(receipt) ?? 'no_submit';
        return {
          ok: false, code: CHATGPT_ERROR.TURN_REFUSED,
          error: `${CHATGPT_ERROR.TURN_REFUSED}: ${reason}`,
          action: CHATGPT_ACTION.OBSERVE_TURN, ...identity,
          correlation_id: task.record.correlation_id, reason,
          verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
          captured: false, submitted: false, uncertain: false, read_only: true,
        };
      }
      if (refusedOutcome) {
        // Terminal but not accepted: the page's own reason is carried verbatim,
        // the facts are kept, and the lock stays held.
        const reason = pageRefusalReason(receipt) ?? 'no_accepted_reply';
        return {
          ok: false,
          code: CHATGPT_ERROR.TURN_REFUSED,
          error: `${CHATGPT_ERROR.TURN_REFUSED}: ${reason}`,
          action: CHATGPT_ACTION.OBSERVE_TURN, ...identity,
          correlation_id: task.record.correlation_id, reason,
          verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
          pending: false, captured: false, submitted: true, uncertain: true, read_only: true,
        };
      }
      if (capture.invalid) {
        return {
          ok: false, code: CHATGPT_ERROR.INVALID_ENVELOPE,
          error: `${CHATGPT_ERROR.INVALID_ENVELOPE}: ${capture.errors}`,
          action: CHATGPT_ACTION.OBSERVE_TURN, ...identity,
          correlation_id: task.record.correlation_id, verdict: sanitizeVerdict(receipt.verdict),
          envelope: null, observer: fact, captured: false, submitted: true, uncertain: true, read_only: true,
        };
      }
      if (capture.contracted) {
        return fail(CHATGPT_ERROR.ADAPTER_CONTRACT, {
          action: CHATGPT_ACTION.OBSERVE_TURN, ...identity,
          correlation_id: task.record.correlation_id,
          message: 'adapter_acceptance_mismatch: accepting verdict/envelope/payload contract is missing or contradictory',
          verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
          submitted: true, uncertain: true, captured: false, read_only: true,
        });
      }
      if (capture.ok) {
        return {
          ok: true, action: CHATGPT_ACTION.OBSERVE_TURN, ...identity,
          correlation_id: task.record.correlation_id,
          verdict: sanitizeVerdict(receipt.verdict),
          envelope: structuredClone(receipt.envelope),
          observer: fact, captured: true, submitted: true, pending: false, read_only: true,
        };
      }
      // Terminal, claimed accepted, and nothing to check the claim against: a
      // contract mismatch rather than a capture — and never a pending outcome.
      return fail(CHATGPT_ERROR.ADAPTER_CONTRACT, {
        action: CHATGPT_ACTION.OBSERVE_TURN, ...identity,
        correlation_id: task.record.correlation_id,
        message: 'adapter_acceptance_mismatch: the page reported a terminal, accepted receipt with no envelope to check it against',
        verdict: sanitizeVerdict(receipt.verdict), envelope: null, observer: fact,
        submitted: true, uncertain: true, captured: false, pending: false, read_only: true,
      });
    },

    /**
     * `commander-scan` — Bus commander watcher, READ-ONLY.
     *
     * Asks the page for pair signatures after `baseline_sig`, the armed first
     * line of each user turn (only when armed) and the AION_CMD_V1 blocks of
     * each answer. Composes nothing, clicks nothing, reserves nothing. Every
     * field the page returns is re-bounded here: page output is data.
     */
    async commanderScan(command = {}, lifecycle) {
      const resolved = await resolveTab(command.tab_id, lifecycle);
      if (resolved.error) return { ...resolved.error, read_only: true };
      const answer = await exchange(resolved.tab.tab_id, CHATGPT_ACTION.COMMANDER_SCAN, {
        baseline_sig: typeof command.baseline_sig === 'string' ? command.baseline_sig.slice(0, 128) : null,
        arm_token: typeof command.arm_token === 'string' ? command.arm_token.slice(0, 32) : null,
      }, lifecycle);
      if (isTransportFailure(answer)) return { ...answer, tab: resolved.tab, read_only: true };
      const checked = checkReply(answer, CHATGPT_ACTION.COMMANDER_SCAN, resolved.tab.tab_id);
      if (checked.error) return { ...checked.error, tab: resolved.tab, read_only: true };
      const reply = checked.reply;
      if (reply.ok !== true) return fail(CHATGPT_ERROR.MALFORMED_REPLY, { tab: resolved.tab, read_only: true, message: String(reply.reason ?? 'scan refused').slice(0, 64) });
      const sig = (value) => typeof value === 'string' && /^cs-[A-Za-z0-9-]{1,80}$/.test(value);
      const pairs = (Array.isArray(reply.pairs) ? reply.pairs : []).slice(0, 10).filter((p) => p && sig(p.turn_sig)).map((p) => ({
        turn_sig: p.turn_sig,
        user_head: typeof p.user_head === 'string' ? p.user_head.slice(0, 200) : '',
        assistant_text: typeof p.assistant_text === 'string' ? p.assistant_text.slice(0, 16384) : '',
        block_count: Number.isSafeInteger(p.block_count) ? p.block_count : 0,
      }));
      return { ok: true, read_only: true, tab: resolved.tab, href: sanitizeUrl(reply.href),
        tail_sig: sig(reply.tail_sig) ? reply.tail_sig : null, pair_count: Number.isSafeInteger(reply.pair_count) ? reply.pair_count : null,
        baseline_found: reply.baseline_found === true, generating: reply.generating === true, pairs };
    },

    /**
     * `reconcile-turn` — the READ-ONLY resolution path.
     *
     * WHY IT EXISTS. An operation that cannot settle on its own used to have no
     * way out at all. A terminal non-accepted settle leaves NEEDS_RECONCILIATION
     * with the conversation locked; a submission that never settled leaves a
     * reservation nobody can observe; a lost observer leaves an identity that
     * can never be presented again. Each of those holds the lock, and a
     * conversation that maps to the conservative home key holds EVERY
     * conversation. The lock must not be dropped on a guess, so the answer is
     * not a release: it is an honest, addressable, machine-readable report of
     * what is actually known.
     *
     * WHAT IT IS NOT. It is never send-capable. It composes nothing, clicks
     * nothing, stops nothing, re-arms nothing, resubmits nothing and never
     * offers the page a new deadline. The only page action it may use is the
     * same read-only observer poll the poll path uses, and it presents the
     * DURABLE identity — never one the caller supplies.
     *
     * WHAT IT MAY RELEASE. Only two things, and only when they are proven: a
     * positive no-submit from the page, and a fully validated accepted reply.
     * A timeout, a lost observer, a pending observer and a terminal refusal all
     * keep the lock. Reconciling is not a way to clear a lock; it is a way to
     * find out whether the lock may be released, and to say so honestly when it
     * may not.
     */
    async reconcileTurn(command = {}, lifecycle) {
      const report = (result, extra = {}) => ({ ...result, ...extra, read_only: true, action: 'reconcile-turn' });
      const correlationId = typeof command.correlation_id === 'string' ? command.correlation_id.trim() : '';
      const taskId = typeof command.task_id === 'string' ? command.task_id.trim() : '';
      if (correlationId === '' && taskId === '') {
        return report(fail(CHATGPT_ERROR.CORRELATION_REQUIRED, {
          message: `reconcile reads an existing operation; correlation_id or task_id must name it (max ${MAX_ID_CHARS} chars)`,
        }));
      }
      if (correlationId.length > MAX_ID_CHARS || taskId.length > MAX_ID_CHARS) {
        return report(fail(CHATGPT_ERROR.BAD_ARGUMENT, {
          message: `correlation_id and task_id must be at most ${MAX_ID_CHARS} characters`,
        }));
      }

      // The record comes from the durable store. Every identity below is read
      // from it, never from the caller.
      const found = correlationId !== ''
        ? await durableTask(correlationId, lifecycle, { required: true })
        : await durableTaskByTaskId(taskId, lifecycle);
      if (found.error) return report(found.error);
      const record = found.record;
      // Two selectors that disagree are refused, not silently resolved in
      // favour of one of them.
      if (taskId !== '' && record.task_id !== taskId) {
        return report(fail(CHATGPT_ERROR.BAD_ARGUMENT, {
          correlation_id: record.correlation_id,
          task_id: record.task_id,
          message: 'the task_id does not name the operation the correlation_id names; the operation is selected by one of them, not by a pair that disagrees',
        }));
      }

      const token = resolveExpectedToken(record, command.expected_reply_token);
      if (token.mismatch) {
        return report(fail(CHATGPT_ERROR.TOKEN_MISMATCH, {
          correlation_id: record.correlation_id,
          reason: 'expected_reply_token_mismatch',
          message: 'the expected_reply_token supplied by the caller is not the one this operation was sent with; the stored marker is authoritative and nothing is checked against the wrong one',
        }));
      }
      if (command.tab_id !== undefined && command.tab_id !== null
        && Number(command.tab_id) !== record.target.tab_id) {
        return report(fail(CHATGPT_ERROR.NOT_A_CHATGPT_TAB, {
          tab_id: Number.isInteger(Number(command.tab_id)) ? Number(command.tab_id) : null,
          correlation_id: record.correlation_id,
          message: 'this operation belongs to a different tab; the observer is bound to the page it was armed on',
        }));
      }

      // THE DURABLE FACTS. These are reported whatever the page says, because
      // they are what the operation actually knows.
      const base = {
        correlation_id: record.correlation_id,
        task_id: record.task_id,
        operation_key: record.operation_key,
        phase: record.phase,
        lock_active: record.lock_active,
        observer: record.observer ? { ...record.observer } : null,
        facts: { ...record.facts },
        conversation_key: record.conversation_key,
        tab_id: record.target.tab_id,
        created_at: record.created_at,
        updated_at: record.updated_at
      };

      // ALREADY RESOLVED. A durable outcome is recorded, so there is nothing to
      // reconcile and nothing to ask the page about.
      if (!record.lock_active) {
        return report({ ...base, ok: true, settled: false, resolved: true,
          reason: 'operation_already_resolved', captured: false });
      }

      // NO OBSERVER. Nothing was armed, or the arm was never recorded, so the
      // page cannot be asked about THIS operation: an observer poll has to
      // present an identity, and inventing one is forbidden. The report says
      // so, and the lock stays.
      if (!record.observer) {
        return report({ ...base, ok: false, settled: false, resolved: false,
          reason: 'observer_not_armed', captured: false, uncertain: true });
      }

      // ASK THE PAGE ABOUT THAT OBSERVER. The same read-only action the poll
      // uses, with the durable identity, and WITHOUT a timeout: the page's own
      // observation deadline was set when the task was armed and must not move.
      const identity = observerIdentity(record);
      const answer = await exchange(record.target.tab_id, CHATGPT_ACTION.OBSERVE_TURN, {
        task_id: record.task_id,
        operation_key: record.operation_key,
        correlation_id: record.correlation_id,
        observer_id: identity.observer_id,
        page_instance_id: identity.page_instance_id,
      }, lifecycle);

      // The page was asked and did not answer. That is uncertainty about the
      // operation, never a statement that nothing was submitted.
      if (isTransportFailure(answer)) {
        return report({ ...base, ok: false, settled: false, resolved: false,
          reason: 'page_unreachable', captured: false, uncertain: true });
      }
      const checked = checkReply(answer, CHATGPT_ACTION.OBSERVE_TURN, record.target.tab_id);
      if (checked.error) {
        return report({ ...base, ok: false, settled: false, resolved: false,
          reason: 'page_unreadable', captured: false, uncertain: true });
      }
      const receipt = checked.reply;
      const pageReason = typeof receipt.reason === 'string' && receipt.reason !== '' ? receipt.reason : null;

      // The page's OWN refusal — it holds no evidence for this operation, or
      // the observer is gone — is carried verbatim. It is the lost-observer
      // case, and it is never a reason to release the lock.
      if (pageReason !== null && OBSERVER_REFUSAL_REASONS.has(pageReason)) {
        return report({ ...base, ok: false, settled: false, resolved: false,
          reason: pageReason, page_reason: pageReason, captured: false, uncertain: true });
      }
      const identityProblem = receiptIdentityProblem(receipt, record, record.correlation_id);
      if (identityProblem) {
        return report({ ...base, ok: false, settled: false, resolved: false,
          reason: 'observer_identity_mismatch', page_reason: pageReason,
          message: identityProblem, captured: false, uncertain: true });
      }

      // Record what was observed before judging it, exactly as the poll does:
      // the durable evidence must not depend on the outcome being nice. The
      // observer IDENTITY is immutable, so this can never clear an armed
      // observer or swap it for another one.
      const armed = await recordObserverFacts(receipt, record, lifecycle);
      if (!armed.ok) {
        return report({ ...base, ok: false, settled: false, resolved: false,
          reason: 'observer_record_failed', captured: false, uncertain: true });
      }
      const fact = armFacts(receipt, armed.at);

      if (receipt.pending !== false) {
        // Still running. The observation facts are durable; the lock stays and
        // nothing is settled.
        return report({ ...base, ok: false, settled: false, resolved: false,
          reason: 'observation_pending', observer: fact, pending: true,
          captured: false, uncertain: true });
      }

      // TERMINAL. Exactly two outcomes may release the lock, and both have to
      // be proven here.
      const provenNoSubmit = receipt.submitted === false && receipt.no_send === true;
      const refusedOutcome = !provenNoSubmit && !claimsAcceptance(receipt);
      const capture = refusedOutcome || receipt.envelope === undefined || receipt.envelope === null
        ? { ok: false, contracted: false, invalid: false, reports: false, errors: '' }
        : envelopeAndContract(validateEnvelope(receipt.envelope), receipt, record.correlation_id, token.token);

      if (provenNoSubmit) {
        // POSITIVE NO-SEND. The only refusal that frees a conversation — and
        // it frees it only if the release was actually RECORDED. A settlement
        // that could not be written releases nothing, so the report says
        // `not_recorded`, `resolved:false` and the ACTUAL phase and lock.
        //
        // BUT A WRITE THAT LANDED AND LOST ITS ACKNOWLEDGEMENT IS NOT A WRITE
        // THAT DID NOT HAPPEN. The durable outcome is read back from the
        // record, so a release that IS on disk is reported as resolved even
        // though the acknowledgement never arrived. The acknowledgement and the
        // durable state are two different facts and the report keeps them apart.
        const settled = await settleQuietly(found, false, { noSubmit: true }, lifecycle);
        const durableResolved = settled.phase === 'REFUSED_NO_SUBMIT' && settled.lock_active === false;
        const recorded = settled.ok === true || durableResolved;
        return report({ ...base,
          ok: recorded, settled: settled.ok === true, resolved: recorded,
          settlement: settled.ok === true ? 'recorded' : durableResolved ? 'recorded_unacked' : 'not_recorded',
          phase: settled.phase, lock_active: settled.lock_active,
          ...(settled.settlement_error ? { settlement_error: settled.settlement_error } : {}),
          reason: 'no_submit_proven', page_reason: pageReason, observer: fact,
          submitted: false, captured: false });
      }
      if (capture.ok) {
        // A FULLY VALIDATED ACCEPTED REPLY. The checked reply is available and
        // the lock may be released — but only once that release is recorded.
        // As above, the durable outcome is read back: a release that landed
        // without its acknowledgement is a released operation, and saying
        // otherwise contradicts the record it is reporting.
        const settled = await settleQuietly(found, true, { replyChecked: true }, lifecycle);
        const durableResolved = settled.phase === 'REPLY_CHECKED' && settled.lock_active === false;
        const recorded = settled.ok === true || durableResolved;
        return report({ ...base,
          ok: recorded, settled: settled.ok === true, resolved: recorded,
          settlement: settled.ok === true ? 'recorded' : durableResolved ? 'recorded_unacked' : 'not_recorded',
          phase: settled.phase, lock_active: settled.lock_active,
          ...(settled.settlement_error ? { settlement_error: settled.settlement_error } : {}),
          reason: 'reply_checked', observer: fact,
          // The page's capture is a fact about the page and is reported as
          // one; what the failed write changed is the RELEASE, and that is
          // what `resolved` and `lock_active` now say.
          captured: true, verdict: sanitizeVerdict(receipt.verdict),
          envelope: structuredClone(receipt.envelope) });
      }

      // Terminal but not accepted, or a contract mismatch. The facts are kept
      // and the lock STAYS: a refusal is not a checked reply, and a mismatch is
      // not an outcome. The DURABLE phase and lock come from the settlement
      // itself, so a write that did not land is reported as the state it
      // really left behind.
      //
      // A refusal resolves nothing either way, so `ok`, `settled` and
      // `resolved` stay false whatever the write did. What the write DID do is
      // classified: a re-read that shows the intended durable state — the
      // record held in NEEDS_RECONCILIATION with the lock still on — is
      // reported as `recorded_unacked`, because the state IS recorded even
      // though the acknowledgement was lost.
      const settled = await settleQuietly(found, null, {}, lifecycle);
      const durableHeld = settled.phase === 'NEEDS_RECONCILIATION' && settled.lock_active === true;
      const reason = refusedOutcome ? 'terminal_refusal' : 'adapter_acceptance_mismatch';
      return report({ ...base,
        // A refusal resolves nothing, so `settled` and `resolved` stay false
        // whatever the write did; only the phase and the lock are the
        // settlement's to report.
        ok: false, settled: false, resolved: false,
        settlement: settled.ok === true ? 'recorded' : durableHeld ? 'recorded_unacked' : 'not_recorded',
        phase: settled.phase, lock_active: settled.lock_active,
        ...(settled.settlement_error ? { settlement_error: settled.settlement_error } : {}),
        reason, page_reason: pageReason ?? (refusedOutcome ? pageRefusalReason(receipt) : null),
        observer: fact, captured: false, uncertain: true,
        ...(capture.invalid ? { code: CHATGPT_ERROR.INVALID_ENVELOPE, error: `${CHATGPT_ERROR.INVALID_ENVELOPE}: ${capture.errors}` } : {}),
        ...(capture.contracted ? { code: CHATGPT_ERROR.ADAPTER_CONTRACT,
          error: 'adapter_acceptance_mismatch: accepting verdict/envelope/payload contract is missing or contradictory' } : {}) });
    },

    /**
     * Read the last assistant turn and correlate it. Read-only: it never
     * composes, never clicks, and needs no gesture.
     *
     * When a durable operation exists for this correlation, the FULL identity
     * set from that record is sent, so the page can answer about this observer
     * rather than scanning an idle document. A page that reports
     * `observer_evidence_required` or `observer_identity_mismatch` is reporting
     * honestly that it holds no evidence for this operation; that reason is
     * carried through verbatim and never collapsed into "unknown".
     */
    async readFinal(command = {}, lifecycle) {
      const correlationId = command.correlation_id;
      if (correlationId !== undefined && correlationId !== null
        && (typeof correlationId !== 'string' || correlationId.length > MAX_ID_CHARS)) {
        return fail(CHATGPT_ERROR.BAD_ARGUMENT, { message: 'correlation_id must be a string' });
      }
      const known = typeof correlationId === 'string' && correlationId.trim() !== ''
        ? await durableTask(correlationId.trim(), lifecycle) : { record: null };
      // A READ THAT FAILED CLAIMS NOTHING ABOUT THE OPERATION. Nothing was
      // submitted BY THIS CALL, but the operation may have been submitted
      // earlier, so `submitted:false` would be a no-send statement this read is
      // not entitled to make. The claim is ABSENT, not false.
      if (known.error) return { ...known.error, read_only: true, captured: false };

      const identity = known.record ? observerIdentity(known.record) : null;
      const tabId = command.tab_id === undefined || command.tab_id === null
        ? (known.record ? known.record.target.tab_id : undefined)
        : command.tab_id;
      // A read aimed at a different tab than the one this operation was bound to
      // is refused, not redirected: the observer lives in that one document.
      if (identity && tabId !== undefined && Number(tabId) !== known.record.target.tab_id) {
        return fail(CHATGPT_ERROR.NOT_A_CHATGPT_TAB, {
          tab_id: Number.isInteger(Number(tabId)) ? Number(tabId) : null,
          message: 'this operation belongs to a different tab; the observer is bound to the page it was armed on',
          // No `submitted` claim: this refusal says nothing about whether the
          // operation was activated.
          read_only: true, captured: false,
        });
      }
      const resolved = await resolveTab(tabId, lifecycle);
      if (resolved.error) return resolved.error;

      // The stored marker is authoritative for a read about a known operation,
      // and a caller marker that contradicts it is refused rather than used.
      const resolvedToken = resolveExpectedToken(known.record, command.expected_reply_token);
      if (resolvedToken.mismatch) {
        return fail(CHATGPT_ERROR.TOKEN_MISMATCH, {
          correlation_id: typeof correlationId === 'string' ? correlationId.trim() : null,
          reason: 'expected_reply_token_mismatch',
          message: 'the expected_reply_token supplied by the caller is not the one this operation was sent with; the stored marker is authoritative and nothing is checked against the wrong one',
          // No `submitted` claim: a refused read learned nothing about the
          // activation.
          read_only: true, captured: false,
        });
      }
      const token = resolvedToken.token ?? '';
      const correlationKey = typeof correlationId === 'string' ? correlationId.trim() : '';
      const answer = await exchange(resolved.tab.tab_id, CHATGPT_ACTION.READ_FINAL, {
        correlation_id: correlationKey,
        ...(known.record ? {
          task_id: known.record.task_id,
          operation_key: known.record.operation_key,
          observer_id: identity.observer_id,
          page_instance_id: identity.page_instance_id,
        } : {}),
        expected_reply_token: token,
        outbound_text: typeof command.outbound_text === 'string' ? command.outbound_text : null,
        generation_complete: command.generation_complete === true
      }, lifecycle);

      if (isTransportFailure(answer)) return { ...answer, tab: resolved.tab };
      const checked = checkReply(answer, CHATGPT_ACTION.READ_FINAL, resolved.tab.tab_id);
      if (checked.error) return { ...checked.error, tab: resolved.tab };
      const reply = checked.reply;
      // The page's own machine-readable reason wins over a synthesized verdict
      // reason: "no evidence here" is a fact, "unknown reason" is not.
      const pageReason = typeof reply.reason === 'string' && reply.reason !== '' ? reply.reason : null;
      const sanitized = sanitizeVerdict(reply.verdict);
      const reason = pageReason ?? (sanitized ? sanitized.reason : null);
      const verdict = sanitized
        ? { ...sanitized, ...(reason === null ? {} : { reason }) }
        : (reason === null ? null : { schema: null, accepted: false, reason, correlation_id: correlationKey, expected_reply: null });

      // A capture is only accepted when the SAME accepting contract the send
      // path uses is satisfied. A read that reports acceptance without it (or
      // with contradictory data) is uncertain, never accepted.
      const claimed = reply.ok === true && Boolean(verdict && verdict.accepted);
      const capture = reply.envelope !== undefined && reply.envelope !== null
        ? envelopeAndContract(validateEnvelope(reply.envelope), reply, correlationKey, token)
        : { ok: false, contracted: false, invalid: false, reports: false, errors: '' };
      // NO BYPASS FOR A MISSING ENVELOPE. The same full accepting contract applies
      // to every capture, and a claim with no envelope behind it is a contract
      // mismatch rather than an acceptance: "the page said yes" is exactly what
      // this check exists to stop being enough.
      const accepted = claimed && capture.reports && capture.ok;
      const contractBroken = capture.contracted || (claimed && !capture.reports);
      const honestRefusal = OBSERVER_REFUSAL_REASONS.has(pageReason);

      return {
        // `ok` means "a correlated final reply was read", the same meaning it has
        // for runTurn. A read that found nothing correlating is not a success,
        // and saying otherwise is how a stale answer gets treated as current.
        ok: accepted,
        tab: resolved.tab,
        action: CHATGPT_ACTION.READ_FINAL,
        ...(identity ? { task_id: known.record.task_id, operation_key: known.record.operation_key,
          observer_id: identity.observer_id, page_instance_id: identity.page_instance_id } : {}),
        verdict,
        ...(reason === null ? {} : { reason }),
        ...(capture.invalid ? { code: CHATGPT_ERROR.INVALID_ENVELOPE,
          error: `${CHATGPT_ERROR.INVALID_ENVELOPE}: ${capture.errors}` } : {}),
        ...(contractBroken && !capture.invalid ? { code: CHATGPT_ERROR.ADAPTER_CONTRACT,
          error: claimed && !capture.reports
            ? 'adapter_acceptance_mismatch: the page claimed an accepted capture but sent no envelope to check it against'
            : (token === ''
              ? 'adapter_acceptance_mismatch: the page reported a capture, but this operation has no expected_reply_token — neither stored nor supplied — to check it against.'
              : 'adapter_acceptance_mismatch: accepting verdict/envelope/payload contract is missing or contradictory') } : {}),
        ...(claimed && !accepted ? { captured: false, uncertain: true } : { captured: accepted }),
        generation: reply.generation && typeof reply.generation === 'object'
          ? { complete: reply.generation.complete === true, asserted_by_caller: reply.generation.asserted_by_caller === true }
          : null,
        ...(honestRefusal ? { read_only: true, uncertain: true, captured: false } : { read_only: true })
      };
    }
  };

  // One lifecycle is shared with worker hydration; direct/test callers get the
  // same policy starting here. No nested reset of the absolute clock.
  return Object.fromEntries([['portName', CHATGPT_PORT_NAME], ...Object.entries(METHOD_COMMANDS).map(([method, name]) => [method,
    async (command = {}, sharedLifecycle) => {
      let lifecycle = sharedLifecycle;
      let possibleSend = false;
      let result = null;
      try {
        const defaultMs = timeouts[COMMAND_TO_TIMEOUT_KEY[name] ?? name];
        const plan = resolveCommandDeadline({ command: name, requestedWorkMs: command.timeout_ms === undefined ? defaultMs : command.timeout_ms }, policy);
        lifecycle ??= createBoundedLifecycle(plan, { now: options.now, setTimeout: setTimer, clearTimeout: clearTimer });
        lifecycle.assertActive();
        // The actual dispatch marker is set immediately before posting RUN_TURN.
        result = await methods[method](command, lifecycle);
        lifecycle.assertActive();
        return lifecycle.taskIdentity ? { ...result, ...lifecycle.taskIdentity } : result;
      } catch (error) {
        possibleSend = lifecycle?.possibleSend === true;
        // `submitted` describes the ACTIVATION, not the call that failed. A
        // send-capable command that never reached a port really did not submit
        // anything; a READ-ONLY one that failed (a poll that timed out, a read
        // that could not resolve its tab) says nothing at all about the operation
        // it was asked about, so it claims nothing and reports the uncertainty.
        //
        // AND THE METHOD'S OWN ANSWER WINS. When the method already produced an
        // answer, that answer knows whether the activation happened — a
        // PROVEN no-send stays a proven no-send, even though a send-capable
        // port was opened. `possibleSend` is only the fallback for a method
        // that never got that far.
        const outcome = possibleSend
          ? (result && typeof result === 'object' && Object.hasOwn(result, 'submitted')
            ? { submitted: result.submitted === true,
              ...(result.submitted === true ? { uncertain: true } : {}),
              ...(Object.hasOwn(result, 'uncertain') ? { uncertain: result.uncertain === true } : {}),
              ...(Object.hasOwn(result, 'captured') ? { captured: result.captured === true } : { captured: false }) }
            : { submitted: true, uncertain: true, captured: false })
          : (SEND_CAPABLE_ACTIONS.has(name)
            ? { submitted: false, captured: false }
            : { read_only: true, uncertain: true, captured: false });
        // The method's own facts survive the expiry. WHICH PHASE WAS RECORDED
        // and WHETHER THE LOCK IS HELD are facts the method established, not
        // claims about the budget, and they are exactly what a caller needs to
        // find and reconcile the operation afterwards. The diagnostic fields
        // (code, error, stage) stay the expiry's, because the expiry is what
        // they describe.
        const facts = result && typeof result === 'object'
          ? Object.fromEntries(Object.entries(result).filter(([key]) =>
            !['ok', 'code', 'error', 'stage', 'timeout_ms', 'absolute_ms', 'elapsed_ms'].includes(key)))
          : {};
        return fail(error.code ?? (error instanceof TypeError || error instanceof RangeError ? CHATGPT_ERROR.BAD_ARGUMENT : CHATGPT_ERROR.TURN_REFUSED), {
          ...facts,
          stage: error.stage ?? null, timeout_ms: error.timeout_ms ?? null,
          absolute_ms: error.absolute_ms ?? null, elapsed_ms: error.elapsed_ms ?? null,
          message: String(error.message ?? error),
          ...lifecycle?.taskIdentity,
          ...outcome,
        });
      } finally { if (!sharedLifecycle) lifecycle?.finish(); }
    }
  ])]);

  /* ------------------------------------------------------------- internals */

  /**
   * Everything a submission must satisfy BEFORE a port is opened.
   *
   * One list for both send actions. A gesture is a human click, not
   * authorisation: the contract's rule is that "the extension cannot grant its
   * own permissions", so the approval reference is required too, and it is
   * recorded durably with the dispatch.
   *
   * `requireIdentity` is the split path's addition: `submit-turn` must name a
   * stable task AND operation, because that identity — not a fresh correlation
   * marker — is what a later poll and the durable lock are keyed on.
   */
  function validateSubmissionRequest(command, { requireIdentity = false } = {}) {
    if (command.user_gesture !== true) {
      return {
        error: fail(CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED, {
          message: 'this composes and submits into a signed-in session; pass user_gesture:true to do it once',
          submitted: false
        })
      };
    }
    const scopeRef = command.approved_scope_ref;
    if (typeof scopeRef !== 'string' || scopeRef.trim() === '' || scopeRef.length > MAX_ID_CHARS) {
      return {
        error: fail(CHATGPT_ERROR.APPROVAL_REQUIRED, {
          message: `approved_scope_ref must name the approval this turn acts under (max ${MAX_ID_CHARS} chars); a user gesture alone is not authorisation`,
          submitted: false
        })
      };
    }
    const text = command.text;
    if (typeof text !== 'string' || text.trim() === '') {
      return { error: fail(CHATGPT_ERROR.TEXT_REQUIRED, { message: 'text must be a non-empty string' }) };
    }
    if (text.length > MAX_TEXT_CHARS) {
      return { error: fail(CHATGPT_ERROR.TEXT_TOO_LONG, { chars: text.length, max: MAX_TEXT_CHARS }) };
    }
    const correlationId = command.correlation_id;
    if (typeof correlationId !== 'string' || correlationId.trim() === '' || correlationId.length > MAX_ID_CHARS) {
      return {
        error: fail(CHATGPT_ERROR.CORRELATION_REQUIRED, {
          message: `correlation_id must be a non-empty string of at most ${MAX_ID_CHARS} characters`
        })
      };
    }
    const expectedToken = command.expected_reply_token;
    if (expectedToken !== undefined && expectedToken !== null
      && (typeof expectedToken !== 'string' || expectedToken.length > MAX_ID_CHARS)) {
      return { error: fail(CHATGPT_ERROR.BAD_ARGUMENT, { message: 'expected_reply_token must be a string' }) };
    }
    const taskId = command.task_id === undefined ? correlationId : command.task_id;
    const operationKey = command.operation_key === undefined ? correlationId : command.operation_key;
    for (const [name, value] of [['task_id', taskId], ['operation_key', operationKey]]) {
      if (typeof value !== 'string' || value.trim() === '' || value.length > MAX_ID_CHARS) {
        return { error: fail(CHATGPT_ERROR.BAD_ARGUMENT, { message: `${name} must be a non-empty string of at most ${MAX_ID_CHARS} characters` }) };
      }
    }
    if (requireIdentity && (command.task_id === undefined || command.operation_key === undefined)) {
      return {
        error: fail(CHATGPT_ERROR.IDENTITY_REQUIRED, {
          message: 'submit-turn requires an explicit task_id and operation_key; a correlation marker alone cannot select or create an operation',
          submitted: false
        })
      };
    }
    return { ok: true, text, correlationId, expectedToken, taskId, operationKey, scopeRef };
  }

  /**
   * THE ONE SEND PATH.
   *
   * `runTurn` and `submitTurn` both come through here, so the gates, the durable
   * reservation, the conversation lock and the settlement rules cannot drift
   * apart between the legacy wrapper and the split engine. The only thing the
   * caller decides afterwards is which page action was posted and how the
   * receipt is read back.
   *
   * Returns `{ error }` for every refusal, or the state the caller needs to
   * exchange exactly once and then settle exactly once.
   */
  async function reserveSend(command, lifecycle, action, request = {}) {
    // Immutable primitive request snapshot across awaits: a caller mutating its
    // object mid-flight must not change what is hashed, reserved or sent.
    command = { ...command };
    const validated = validateSubmissionRequest(command, request);
    if (validated.error) return validated;
    const { text, correlationId, expectedToken } = validated;
    const timeoutMs = lifecycle.plan.workMs;

    const resolved = await resolveTab(command.tab_id, lifecycle);
    if (resolved.error) return resolved;
    if (turnsInFlight.has(resolved.tab.tab_id)) {
      return { error: fail(CHATGPT_ERROR.TURN_IN_FLIGHT, { tab_id: resolved.tab.tab_id }) };
    }

    // READ-ONLY PREFLIGHT, before anything is reserved or typed.
    //
    // This asks the page for state and composes nothing. It is not a
    // substitute for the content script's own gate — that one runs first and
    // this one is a second, independent refusal — it exists so a tab that
    // plainly cannot take a turn is reported WITHOUT a dispatch reservation
    // being burned on it, and without the operator seeing a submitted turn
    // that never happened.
    const preflight = await preflightComposer(resolved.tab, lifecycle);
    if (preflight.ok !== true) {
      return { error: { ...preflight, tab: resolved.tab, correlation_id: correlationId.trim(), submitted: false, captured: false } };
    }

    // Durable reservation FIRST. Everything below this line can touch a live
    // page; nothing above it has written anything that would survive a crash.
    const correlationKey = correlationId.trim();
    let prior;
    let task;
    try {
      ({ prior, task } = await lifecycle.wait('reservationRead', async () => {
        // Digest injection, like the clock/validator seams, is constructor-
        // local for deterministic tests; runtime commands cannot select it.
        const prepared = await prepareTask(command, resolved.tab, lifecycle, options.digest);
        const existing = await reservations.get(correlationKey, lifecycle);
        return { prior: existing, task: prepared };
      }));
    } catch (error) {
      // FAIL CLOSED. An unreadable reservation store is not "no reservations":
      // treating it as empty is precisely how the same correlation gets
      // submitted a second time. Refuse before any send-capable port is opened;
      // the read-only preflight above may have opened one, and "composed
      // nothing" is not the same claim as "never touched the page".
      //
      // The stage and the original code are carried, so the refusal says WHICH
      // read failed and why instead of collapsing every cause into one word.
      return {
        error: fail(CHATGPT_ERROR.RESERVATION_FAILED, {
          correlation_id: correlationKey,
          submitted: false,
          captured: false,
          message: `existing dispatches could not be read, so this one was refused: ${String((error && error.message) || error)}`
        })
      };
    }
    if (prior && prior.state === DISPATCH_STATE.IN_FLIGHT) {
      return {
        error: fail(CHATGPT_ERROR.DISPATCH_IN_FLIGHT, {
          correlation_id: correlationKey,
          started_at: prior.started_at ?? null,
          message: 'this correlation already has an unfinished dispatch; it is NOT re-sent. Reconcile it explicitly.'
        })
      };
    }
    if (prior && prior.state === DISPATCH_STATE.COMPLETED) {
      return {
        error: fail(CHATGPT_ERROR.ALREADY_DISPATCHED, {
          correlation_id: correlationKey,
          finished_at: prior.finished_at ?? null,
          message: 'this correlation was already dispatched; a repeat submission is refused. Reconcile it explicitly.'
        })
      };
    }

    lifecycle.assertActive();
    if (turnsInFlight.has(resolved.tab.tab_id)) return { error: fail(CHATGPT_ERROR.TURN_IN_FLIGHT) };
    turnsInFlight.add(resolved.tab.tab_id);
    const startedAt = task.created_at;
    const identity = { task_id: task.task_id, operation_key: task.operation_key };
    lifecycle.taskIdentity = identity;
    let pendingReservation = null;
    try {
      if (typeof reservations.reserveOperation !== 'function') throw new Error('operation guard unavailable');
      const persisted = await lifecycle.wait('reservationWrite', () => {
        pendingReservation = reservations.reserveOperation(task, lifecycle);
        return pendingReservation;
      });
      if (persisted === false || reservations.durable === false) throw new Error('durable storage unavailable');
    } catch (error) {
      turnsInFlight.delete(resolved.tab.tab_id);
      // THE RESERVATION ITSELF FAILED, and TWO SHAPES ARE POSSIBLE:
      //   (a) both records landed and the lifecycle expired after the write,
      //       so a SUBMIT_RESERVED task holds the conversation lock with no
      //       observer and no outcome;
      //   (b) only the legacy IN_FLIGHT landed, so there is no task at all and
      //       the conversation is locked by an orphan tombstone.
      // Neither can have sent anything — the reservation is durable BEFORE any
      // page exchange — so both are settled to a positive no-submit here.
      // Left alone, either one wedges the conversation forever.
      const settlement = await settleIncompleteReservation(correlationKey, pendingReservation);
      return {
        error: fail(error.code ?? CHATGPT_ERROR.RESERVATION_FAILED, {
          ...identity,
          correlation_id: correlationKey,
          stage: error.stage ?? null,
          timeout_ms: error.timeout_ms ?? null,
          absolute_ms: error.absolute_ms ?? null,
          elapsed_ms: error.elapsed_ms ?? null,
          message: `the dispatch could not be recorded, so it was not submitted: ${String((error && error.message) || error)}`,
          submitted: false,
          captured: false,
          // The durable truth after the settlement, so the operation stays
          // ADDRESSABLE: a caller can find it by correlation, task or
          // operation and see whether the lock is still held.
          phase: settlement.phase,
          lock_active: settlement.lock_active,
          settlement: settlement.settlement
        })
      };
    }

    // Finish the reservation whatever happens. It is never rolled back to
    // "nothing happened": the page may have received the text even if the reply
    // was lost, and pretending otherwise is how a duplicate gets typed.
    const settle = (captured, options) => settleOperation(lifecycle, task, captured, options);

    return {
      ok: true, action, tab: resolved.tab, task, text, expectedToken, correlationKey,
      startedAt, timeoutMs, settle,
      release: () => turnsInFlight.delete(resolved.tab.tab_id),
    };
  }

  /**
   * Settle a reservation whose own write failed.
   *
   * The settlement runs on its own small, policy-derived budget, because the
   * command's budget is exactly what has just expired — the same rule
   * `settleAfterFailure` follows.
   *
   * IT WAITS FOR THE FAILED WRITE FIRST. The failed write may still be
   * landing: its acknowledgement was lost, not its data. The SHAPE of the
   * store — a task, a legacy entry, or both — decides what may honestly be
   * settled, and a settlement that raced its own write would report a shape
   * that never existed (or settle one that did).
   *
   * It never claims a release it could not write. A store that cannot be read
   * or written is reported as `not_recorded` with null phase/lock, and the
   * caller is told the truth rather than a lock that is still held.
   */
  async function settleIncompleteReservation(correlation, pending) {
    const life = createBoundedLifecycle(resolveSettlementDeadline(policy), {
      now: options.now, setTimeout: setTimer, clearTimeout: clearTimer
    });
    try {
      if (typeof reservations.settleIncompleteReservation !== 'function') {
        return { settlement: 'not_recorded', phase: null, lock_active: null };
      }
      await awaitPendingWrite(pending);
      const settled = await life.wait('settlement', () =>
        reservations.settleIncompleteReservation(correlation, { noSend: true }, life));
      if (settled && settled.settlement === 'not_recorded') {
        return { settlement: 'not_recorded', phase: settled.phase ?? null,
          lock_active: settled.lock_active ?? null, reason: settled.reason ?? null };
      }
      return { settlement: 'recorded', phase: settled?.phase ?? null, lock_active: settled?.lock_active ?? null };
    } catch (error) {
      return { settlement: 'not_recorded', phase: null, lock_active: null,
        reason: String((error && error.message) || error) };
    } finally {
      life.finish();
    }
  }

  /**
   * Wait for an in-flight storage write to land, bounded by the very budget
   * that write was issued under.
   *
   * The failed write may still be landing: its acknowledgement was lost, not
   * its data. The SHAPE of the store decides what may honestly be settled, and
   * a settlement that raced its own write would report a shape that never
   * existed — or settle one that did.
   *
   * WHY A REAL TIMER. The command's own clock is injectable and may be a fake
   * that never advances on its own, and a wait bounded by a clock that does
   * not move would never end: a command that must answer would hang instead.
   * The bound is therefore a REAL, finite delay, and it is the budget the
   * failed write was issued under — the write gets at most that long again to
   * land. A write that never lands costs this wait its bound and is reported
   * as not recorded, never as a release.
   */
  async function awaitPendingWrite(pending) {
    if (!pending) return;
    let handle = null;
    const expiry = new Promise((resolve) => {
      handle = globalThis.setTimeout(resolve, Math.max(1, policy.reservationWrite));
    });
    try {
      await Promise.race([
        Promise.resolve(pending).then(() => undefined, () => undefined),
        expiry
      ]);
    } finally {
      if (handle !== null) globalThis.clearTimeout(handle);
    }
  }

  /**
   * Settle one operation, on the lifecycle given.
   *
   * The lifecycle is a parameter, not an ambient fact, for one reason: a
   * command that has already run out of budget cannot settle anything on a
   * dead lifecycle, and that is exactly the case where a settlement matters
   * most. See `settleAfterFailure`.
   */
  async function settleOperation(life, record, captured, { noSubmit = false, replyChecked = false } = {}) {
    try {
      return await life.wait('settlement', () => reservations.settleOperation(record, { captured, noSubmit, replyChecked }, life));
    } catch (error) {
      if (error.code === CHATGPT_ERROR.TIMEOUT) throw error;
      throw Object.assign(new Error('task settlement not acknowledged; reconcile without resending'), { code: CHATGPT_ERROR.RESERVATION_FAILED });
    }
  }

  /**
   * A settlement that REPORTS its failure instead of throwing it.
   *
   * A reconciliation that cannot be written must still report what it found:
   * the facts are worth more than the write, and a write that was refused is
   * reported as refused rather than swallowed or turned into a crash.
   *
   * AND IT RE-READS THE RECORD. A refused write is not proof that the durable
   * state is unchanged — the write may have landed and lost its
   * acknowledgement — so the SAME record is read again and ITS phase and lock
   * are what the report carries. A lock is never released on a write that did
   * not land, and never reported as held on a write that did.
   */
  async function settleQuietly(found, captured, options, lifecycle) {
    try {
      const record = await found.settle(captured, options);
      return { ok: true, record, phase: record.phase, lock_active: record.lock_active, settlement: 'recorded' };
    } catch (error) {
      let record = null;
      try {
        record = await lifecycle.wait('reservationRead', () =>
          reservations.getTaskByCorrelation(found.record.correlation_id, lifecycle));
      } catch { record = null; }
      return {
        ok: false,
        settlement: 'not_recorded',
        settlement_error: String((error && error.message) || error),
        // The ACTUAL durable phase and lock, or null when even the re-read
        // could not be made. Never an invented release.
        phase: record ? record.phase : null,
        lock_active: record ? record.lock_active : null
      };
    }
  }

  /**
   * The settlement that runs when a command has ALREADY failed.
   *
   * WHY IT EXISTS. `runTurn` and `submitTurn` reserve durably, then talk to
   * the page. A lifecycle timeout, a dropped port or a transport failure can
   * throw out of that exchange. Without this, the record stays SUBMIT_RESERVED
   * with no observer and no outcome: the reservation exists, so the operation
   * can never be sent again, and nothing can ever observe it, so nothing can
   * ever resolve it. The conversation stays locked forever.
   *
   * WHAT IT SETTLES. Only one honest outcome is available after an error:
   *
   *   - the send-capable message WAS posted  -> the submission is UNCERTAIN ->
   *     NEEDS_RECONCILIATION, the lock is kept, every known fact is kept.
   *   - the send-capable message was NEVER posted -> positive pre-dispatch
   *     evidence that nothing was activated -> REFUSED_NO_SUBMIT, and the
   *     lock is released because the conversation is demonstrably free.
   *
   * It never claims an acceptance, and it never releases a lock on the
   * strength of a timeout alone.
   *
   * The settlement runs on its own small, finite, policy-derived budget
   * because the command's own budget has usually just expired; that budget
   * comes from the shared command policy, not from a hardcoded timer.
   */
  async function settleAfterFailure(lifecycle, prepared) {
    const sendPosted = lifecycle?.possibleSend === true;
    const life = createBoundedLifecycle(resolveSettlementDeadline(policy), {
      now: options.now, setTimeout: setTimer, clearTimeout: clearTimer
    });
    try {
      const record = await settleOperation(life, prepared.task, sendPosted ? null : false,
        sendPosted ? {} : { noSubmit: true });
      return { ok: true, record, sendPosted };
    } catch (failure) {
      // THE ACKNOWLEDGEMENT WAS LOST, NOT THE WRITE. The settlement may have
      // landed anyway, so the record is read again and reported as it really
      // is: reporting `not_recorded` over a durable NEEDS_RECONCILIATION
      // would under-report a capture that DID happen.
      let record = null;
      try {
        record = await life.wait('settlement', () =>
          reservations.getTaskByCorrelation(prepared.correlationKey, life));
      } catch { record = null; }
      return { ok: false, failure, sendPosted, record };
    } finally {
      life.finish();
    }
  }

  /**
   * The honest answer to a command that threw.
   *
   * The record's addressable identity (correlation, task, operation) is always
   * in the answer, so the operation can be found and reconciled afterwards.
   */
  function failureAfterError(error, prepared, settlement, action, extra = {}) {
    const sent = settlement?.sendPosted === true;
    // The durable truth after the failure settlement, whenever it could be
    // read — whether the write was acknowledged or only observed afterwards.
    // `null` means there is no record at all (nothing was reserved) or that
    // even the re-read could not be made, which is itself reported rather
    // than hidden.
    const record = settlement?.record ?? null;
    return {
      ok: false,
      code: error.code ?? (error instanceof TypeError || error instanceof RangeError
        ? CHATGPT_ERROR.BAD_ARGUMENT
        : CHATGPT_ERROR.TURN_REFUSED),
      error: String(error.message ?? error),
      stage: error.stage ?? null,
      timeout_ms: error.timeout_ms ?? null,
      absolute_ms: error.absolute_ms ?? null,
      elapsed_ms: error.elapsed_ms ?? null,
      action,
      ...(prepared ? {
        correlation_id: prepared.correlationKey,
        task_id: prepared.task.task_id,
        operation_key: prepared.task.operation_key,
        tab: prepared.tab
      } : {}),
      phase: record ? record.phase : null,
      lock_active: record ? record.lock_active : null,
      settlement: settlement?.ok === true ? 'recorded' : 'not_recorded',
      // `submitted` describes the ACTIVATION. A send-capable message that was
      // posted may or may not have reached the page, so the outcome is
      // uncertain; one that was never posted is a fact, and no uncertainty is
      // claimed about it.
      submitted: sent,
      ...(sent ? { uncertain: true } : {}),
      // THE CAPTURE IS A FACT ABOUT THE DURABLE RECORD, not a fixed answer.
      // A checked reply whose settlement landed but whose acknowledgement was
      // lost is still a checked reply, and the record says so: `captured` is
      // derived from the phase, never hardcoded.
      captured: record ? record.phase === 'REPLY_CHECKED' : false,
      // And the operation is resolved exactly when the record says the lock is
      // not held any more.
      resolved: record ? record.lock_active === false : false,
      ...extra
    };
  }

  /**
   * Read the durable record for a correlation, under a bounded storage stage.
   *
   * `required` is the difference between the two callers: a poll cannot exist
   * without an operation, while a legacy bounded read with no durable store (or
   * no record) keeps its old page-read shape rather than inventing an identity
   * — and reports honestly when the page then has no evidence either.
   *
   * EVERY FAILURE ENVELOPE HERE IS READ-ONLY, so none of them claims anything
   * about the activation: `submitted` is ABSENT, not false. A store that could
   * not be read says nothing about whether the operation was submitted earlier,
   * and a no-send statement this read is not entitled to make is exactly the
   * kind of claim that gets a duplicate typed.
   */
  async function durableTask(correlation, lifecycle, { required = false } = {}) {
    if (!reservations || typeof reservations.getTaskByCorrelation !== 'function' || reservations.durable === false) {
      if (!required) return { record: null };
      return {
        error: fail(CHATGPT_ERROR.RESERVATION_FAILED, {
          correlation_id: correlation, captured: false,
          message: 'no durable task store is available, so no operation identity can be proven; nothing was asked of the page'
        })
      };
    }
    let record;
    try {
      record = await lifecycle.wait('reservationRead', () => reservations.getTaskByCorrelation(correlation, lifecycle));
    } catch (error) {
      return {
        error: fail(error.code ?? CHATGPT_ERROR.RESERVATION_FAILED, {
          correlation_id: correlation, captured: false,
          message: `the durable task record could not be read, so nothing was asked of the page: ${String((error && error.message) || error)}`
        })
      };
    }
    if (record === null) {
      if (!required) return { record: null };
      return { error: fail(CHATGPT_ERROR.OPERATION_NOT_RESERVED, {
        correlation_id: correlation, captured: false,
        message: 'no operation is reserved for this correlation; nothing is observed and nothing is sent',
      }) };
    }
    const settle = async (captured, { noSubmit = false, replyChecked = false } = {}) => {
      try {
        return await lifecycle.wait('settlement', () => reservations.settleOperation(record, { captured, noSubmit, replyChecked }, lifecycle));
      } catch (error) {
        if (error.code === CHATGPT_ERROR.TIMEOUT) throw error;
        throw Object.assign(new Error('task settlement not acknowledged; reconcile without resending'), { code: CHATGPT_ERROR.RESERVATION_FAILED });
      }
    };
    return { record, settle };
  }

  /**
   * The durable record for a TASK id, with the same discipline as the
   * correlation lookup: the identity comes from the store, never from the
   * caller.
   *
   * The general task view redacts the stored reply token, so the operation is
   * re-read by its correlation to obtain the full record the acceptance
   * contract has to be checked against. Two reads, one durable source of truth,
   * and no way for a caller to name somebody else's operation.
   *
   * LIKE EVERY OTHER READ-ONLY FAILURE HERE, these envelopes claim NOTHING
   * about the activation: `submitted` is absent, not false.
   */
  async function durableTaskByTaskId(taskId, lifecycle) {
    if (!reservations || typeof reservations.getTask !== 'function' || reservations.durable === false) {
      return {
        error: fail(CHATGPT_ERROR.RESERVATION_FAILED, {
          correlation_id: null, captured: false,
          message: 'no durable task store is available, so no operation identity can be proven; nothing was asked of the page'
        })
      };
    }
    let summary;
    try {
      summary = await lifecycle.wait('reservationRead', () => reservations.getTask(taskId, lifecycle));
    } catch (error) {
      return {
        error: fail(error.code ?? CHATGPT_ERROR.RESERVATION_FAILED, {
          correlation_id: null, captured: false,
          message: `the durable task record could not be read, so nothing was asked of the page: ${String((error && error.message) || error)}`
        })
      };
    }
    if (summary === null) {
      return { error: fail(CHATGPT_ERROR.OPERATION_NOT_RESERVED, {
        correlation_id: null, captured: false,
        message: 'no operation is reserved for this task; nothing is reconciled and nothing is sent',
      }) };
    }
    return durableTask(summary.correlation_id, lifecycle, { required: true });
  }

  /**
   * Persist the page's observer identity and reported facts.
   *
   * Called after the exchange and before anything is judged or settled. A
   * failure here is NOT recoverable by re-observing: the identity is the thing
   * every later poll must present, so losing it leaves the operation exactly as
   * uncertain as it was, with the lock held.
   */
  async function recordObserverFacts(receipt, task, lifecycle) {
    try {
      const next = await lifecycle.wait('observerArm', () => reservations.recordObserver(task, observerRecord(receipt), lifecycle));
      return { ok: true, at: next && typeof next.updated_at === 'string' ? next.updated_at : new Date().toISOString() };
    } catch (error) {
      return {
        ok: false,
        code: error.code === CHATGPT_ERROR.TIMEOUT ? CHATGPT_ERROR.TIMEOUT : CHATGPT_ERROR.OBSERVER_ARM_UNAVAILABLE,
        message: `the page observer identity could not be recorded, so no capture is claimed for this operation: ${String((error && error.message) || error)}`,
      };
    }
  }

  /** The identity a poll must present, taken from the durable record only. */
  function observerIdentity(record) {
    if (!record || !record.observer) return { observer_id: null, page_instance_id: null };
    return { observer_id: record.observer.observer_id, page_instance_id: record.observer.page_instance_id };
  }

  /**
   * The token a read must check the page's own verdict against.
   *
   * THE STORED TOKEN IS AUTHORITATIVE. It is the marker this operation was
   * actually sent with, it is durable, and it is what a later worker needs
   * after a restart — which is the whole point of storing it: acceptance used
   * to be reachable only while the original caller was still holding the
   * marker, so a restarted worker could never settle a lock it was holding.
   *
   * A caller's token is a FALLBACK for an operation that has none stored (a
   * record written before the token was durable), and a caller token that
   * CONTRADICTS the stored one is REFUSED rather than used: checking a
   * verdict against the wrong marker is how a foreign reply is accepted.
   *
   * The values themselves are never echoed, logged or returned: only the
   * mismatch is.
   */
  function resolveExpectedToken(record, callerToken) {
    const stored = storedReplyToken(record);
    const caller = typeof callerToken === 'string' ? callerToken.trim() : '';
    if (stored !== null && caller !== '' && stored !== caller) return { mismatch: true, token: null };
    return { mismatch: false, token: stored ?? (caller === '' ? null : caller) };
  }

  /**
   * Ask the page whether it can take a turn, without asking it to take one.
   *
   * Uses the same `ping` action the operator panel already uses, so it adds no
   * new capability to the content script. A refusal carries a machine-readable
   * `reason` through unchanged, so the caller learns WHY and not merely that
   * something was refused.
   */
  async function preflightComposer(tab, lifecycle) {
    const answer = await exchange(tab.tab_id, CHATGPT_ACTION.PING, {}, lifecycle, 'preflight');
    if (isTransportFailure(answer)) {
      return fail(CHATGPT_ERROR.PREFLIGHT_REFUSED, {
        tab_id: tab.tab_id,
        reason: 'preflight_unreachable',
        message: `the tab could not be asked for its state, so nothing was sent: ${answer.error}`
      });
    }
    const checked = checkReply(answer, CHATGPT_ACTION.PING, tab.tab_id);
    if (checked.error) {
      return {
        ...checked.error,
        code: CHATGPT_ERROR.PREFLIGHT_REFUSED,
        reason: 'preflight_unreadable',
        message: 'the tab did not answer the preflight in a readable form; nothing was sent'
      };
    }
    const state = sanitizeState(checked.reply.state);
    const count = state ? state.composer_visible_count : null;

    if (state && state.generating) {
      return fail(CHATGPT_ERROR.PREFLIGHT_REFUSED, {
        tab_id: tab.tab_id,
        reason: 'generation_active',
        composer_visible_count: count,
        state,
        message: 'a generation is already running in that tab; nothing was typed or sent'
      });
    }
    if (count === null) {
      // A content script that does not report the count cannot be preflighted.
      // Refusing is the only safe reading: the whole point of the check is that
      // "exactly one" is a fact rather than an assumption.
      return fail(CHATGPT_ERROR.PREFLIGHT_REFUSED, {
        tab_id: tab.tab_id,
        reason: 'composer_count_unknown',
        message: 'the page did not report a visible-composer count; refusing to guess. Nothing was typed or sent'
      });
    }
    if (count !== 1) {
      return fail(CHATGPT_ERROR.PREFLIGHT_REFUSED, {
        tab_id: tab.tab_id,
        reason: count === 0 ? 'composer_missing' : 'composer_ambiguous',
        composer_visible_count: count,
        state,
        message: `${count} visible composers; exactly one is required. Nothing was typed or sent`
      });
    }

    // SEND CONTROL, also before any reservation or text. An empty composer
    // legitimately renders Send disabled, so disablement alone is not a refusal
    // here; what must be refused is a control that is missing or ambiguous.
    // `sendPresent` is carried by every content script this driver supports, so
    // a false value is a refusal even when an older page supplies no count. The
    // count itself is enforced only when it was supplied and validated.
    const sendCount = state.send_control_count;
    if (sendCount !== null && sendCount > 1) {
      return fail(CHATGPT_ERROR.PREFLIGHT_REFUSED, {
        tab_id: tab.tab_id,
        reason: 'send_ambiguous',
        composer_visible_count: count,
        send_control_count: sendCount,
        send_present: state.send_present,
        state,
        message: `${sendCount} visible Send controls; refusing to guess which one submits. Nothing was typed or sent`
      });
    }
    if (state.send_present !== true || sendCount === 0) {
      return fail(CHATGPT_ERROR.PREFLIGHT_REFUSED, {
        tab_id: tab.tab_id,
        reason: 'send_missing',
        composer_visible_count: count,
        send_control_count: sendCount,
        send_present: state.send_present,
        state,
        message: 'the page did not report exactly one visible Send control; nothing was typed or sent'
      });
    }
    return { ok: true, composer_visible_count: count, send_control_count: sendCount, state };
  }

  /**
   * Composer/send-button facts, reduced to booleans and one count.
   *
   * `composer_visible_count` is preserved because the preflight needs it: a
   * boolean "has composer" cannot distinguish one composer from two, and that
   * distinction is the whole safety property.
   */
  function sanitizeState(state) {
    if (!state || typeof state !== 'object') return null;
    const out = {
      generating: state.generating === true,
      send_present: state.sendPresent === true,
      send_disabled: state.sendDisabled === true
    };
    const count = Number(state.composer_visible_count);
    out.composer_visible_count = Number.isInteger(count) && count >= 0 ? count : null;
    // content.js sends `sendControlCount` (camelCase). Keep it distinct from the
    // composer count: "one composer, zero send buttons" is exactly the refusal
    // the preflight must make before a reservation is written. Only a validated
    // nonnegative integer survives; anything else becomes null (absent), never
    // zero, because zero is a fact and absence is not.
    const sendCount = state.sendControlCount;
    out.send_control_count = typeof sendCount === 'number' && Number.isInteger(sendCount) && sendCount >= 0
      ? sendCount
      : null;
    return out;
  }

  /**
   * The verdict, minus anything that could be page text.
   *
   * `correlate.js` puts the matched reply text into the verdict. The operator
   * can already get the transcript deliberately, via readFinal; folding it into
   * every run reply would make the message bus carry page content by default.
   */
  function sanitizeVerdict(verdict) {
    if (!verdict || typeof verdict !== 'object') return null;
    const out = {
      schema: typeof verdict.schema === 'string' ? verdict.schema : null,
      accepted: verdict.accepted === true,
      reason: typeof verdict.reason === 'string' ? verdict.reason : null,
      correlation_id: typeof verdict.correlation_id === 'string' ? verdict.correlation_id : null,
      expected_reply: typeof verdict.expected_reply === 'string' ? verdict.expected_reply : null
    };
    if (verdict.detail && typeof verdict.detail === 'object') {
      out.detail = {
        generation_started: verdict.detail.generation_started ?? null,
        generation_complete: verdict.detail.generation_complete ?? null,
        observed: verdict.detail.observed ?? null,
        channel: verdict.detail.channel ?? null
      };
    }
    return out;
  }

}

/**
 * Validate an envelope that arrived from a tab.
 *
 * The relay lib's own validator is the default, so the driver cannot drift from
 * the schema the store and the host enforce. `options.validateEnvelope` exists
 * only so a test can prove the injection point works; it is never a bypass.
 */
function makeValidator(override) {
  if (typeof override === 'function') return override;
  return (envelope) => validateEnvelope(envelope);
}

/**
 * The CURRENT content.js buildEnvelope/turn-engine contract, not caller-provided
 * completion or invented DOM proof.
 *
 * Check every accepting layer before either returning a capture or durably
 * releasing the conversation lock — from the submit path, the observe path and
 * the read path alike. Module scope on purpose: one rule, three callers.
 */
function acceptedAdapterContract(reply, correlationId, token) {
  const envelope = reply.envelope;
  const payload = envelope?.payload;
  const verdict = reply.verdict;
  const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const accepting = (value) => object(value) && value.schema === VERDICT_SCHEMA && value.accepted === true
    && value.reason === REASON.ACCEPTED && value.correlation_id === correlationId
    && value.expected_reply === token;
  const observed = (value) => object(value) && value.generation_started === true && value.generation_complete === true
    && value.source === 'dom-assistant-turn' && value.role === 'assistant' && value.channel === 'final'
    && value.correlation_found === true && value.reply_token_found === true
    && value.reply_token_mode === 'line-exact' && value.echo_trigger === null
    && Array.isArray(value.correlation_ids) && value.correlation_ids.every((id) => id === correlationId);
  return typeof token === 'string' && token.length > 0
    && envelope?.producer_node === 'node-ext-chatgpt' && envelope.target_node === 'node-native-01'
    && envelope.event_type === 'proof.submitted' && envelope.task_state === 'PROOF_SUBMITTED'
    && envelope.delivery_state === 'OUTBOX' && envelope.correlation_id === correlationId
    && envelope.idempotency_key === `chatgpt:${correlationId}`
    && accepting(verdict) && accepting(payload)
    && typeof verdict.reply === 'string' && verdict.reply.trim() !== '' && payload.reply_text === verdict.reply
    && observed(verdict.observed) && observed(payload.observed)
    && object(payload.generation) && payload.generation.started === true && payload.generation.complete === true
    && payload.generation.reason === REASON.ACCEPTED
    && object(payload.extraction) && payload.extraction.ok === true && payload.extraction.reason === REASON.ACCEPTED;
}

/**
 * Envelope + accepting-contract result for ANY result that reports a capture.
 *
 * The submit, observe and read paths all come through here, so a reply that
 * claims a correlated capture is judged by exactly one rule. `contracted` marks
 * a schema-valid envelope whose inner verdict/payload/observed block
 * contradicts it: that is an UNCERTAIN outcome with the lock held, never a
 * checked reply.
 */
function envelopeAndContract(envelopeCheck, reply, correlationId, token) {
  const wanted = typeof token === 'string' ? token.trim() : '';
  const contracted = envelopeCheck.valid && acceptedAdapterContract(reply, correlationId, wanted);
  return {
    reports: true,
    invalid: !envelopeCheck.valid,
    errors: envelopeCheck.errors.join('; '),
    contracted: envelopeCheck.valid && !contracted,
    ok: contracted,
  };
}

/**
 * Did the page CLAIM an accepted outcome?
 *
 * The claim is `verdict.accepted === true`, which is what the page asserts. It is
 * deliberately separate from whether the claim survives `acceptedAdapterContract`:
 * a page that claims acceptance and cannot back it up is a contract mismatch, and
 * a page that never claimed it is reporting an outcome instead.
 */
function claimsAcceptance(receipt) {
  const verdict = receipt.verdict;
  return Boolean(verdict) && typeof verdict === 'object' && !Array.isArray(verdict)
    && verdict.accepted === true;
}

/**
 * The page's own machine-readable reason, verbatim, in the page's own order.
 *
 * A verdict reason first (that is the outcome), then the reply-level reason, then
 * the observation's. Null means the page named nothing, which the callers state
 * as a named fallback rather than inventing a reason.
 */
function pageRefusalReason(receipt) {
  const verdict = receipt.verdict && typeof receipt.verdict === 'object' ? receipt.verdict : {};
  const observation = receipt.observation && typeof receipt.observation === 'object' ? receipt.observation : {};
  for (const value of [verdict.reason, receipt.reason, observation.reason]) {
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
}

/**
 * ONE normalization rule for every page-supplied string this driver persists.
 *
 * WHY THIS EXISTS. The observer record is OUR bookkeeping — it holds the identity a
 * later poll must present — while phase, method, reason and the page's own ids are
 * PAGE data. A write refused because one of those strings was long or padded with
 * spaces would lose the identity and wedge the conversation lock against an
 * operation that is merely unresolved. So page data is bounded here, once, on the
 * way in: trimmed, clipped to the store's own limit, and clipped AGAIN because
 * the cut can land on whitespace the store rightly rejects. `null` means "the page
 * said nothing usable", which is what an absent annotation already means.
 */
function boundedPageText(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const clipped = trimmed.length > max ? trimmed.slice(0, max) : trimmed;
  const safe = clipped.trim();
  return safe === '' ? null : safe;
}

/** One page annotation, bounded to the store's single limit for all three. */
const boundedAnnotation = (value) => boundedPageText(value, MAX_ANNOTATION_CHARS);

/**
 * The observer/page identity the page named, normalized the same way.
 *
 * Same input, same stored id: a poll that presents the record back therefore
 * matches what the page says, and a page that merely padded its id with spaces
 * cannot deny us the write.
 */
const boundedIdentity = (value) => boundedPageText(value, MAX_ID_CHARS);

/**
 * Does this receipt actually describe THIS operation on THIS page?
 *
 * The page echoes the identity it was armed with. Anything else — a foreign
 * task, a swapped observer, a reloaded document — is refused rather than
 * recorded, because the alternative is durable evidence about the wrong turn.
 * Both sides go through the same normalization, so a formatting difference never
 * reads as a different observer. Returns a message when it does not match, null
 * when it does.
 */
function receiptIdentityProblem(receipt, task, correlationId) {
  const mismatched = [];
  for (const field of ['task_id', 'operation_key']) {
    if (receipt[field] !== task[field]) mismatched.push(field);
  }
  if (receipt.correlation_id !== correlationId) mismatched.push('correlation_id');
  const named = {};
  for (const field of ['observer_id', 'page_instance_id']) {
    named[field] = boundedIdentity(receipt[field]);
    if (named[field] === null) mismatched.push(field);
  }
  if (task.observer) {
    if (named.observer_id !== boundedIdentity(task.observer.observer_id)) mismatched.push('observer_id');
    if (named.page_instance_id !== boundedIdentity(task.observer.page_instance_id)) mismatched.push('page_instance_id');
  }
  return mismatched.length
    ? `the page answered with a different operation identity (${[...new Set(mismatched)].join(', ')})`
    : null;
}

/**
 * The durable arm record: WHO observed, and what that observer reported.
 *
 * Bounded, identity-only fields. No transcript, no composer text, no reply
 * body: this record exists so a later poll can prove it is asking the same
 * observer about the same operation, and it must never become a page-content
 * store. `continuity` keeps "false with affirmative evidence" apart from "not
 * reported", so an absent fact is never read as a broken observation.
 */
function observerRecord(receipt) {
  const observation = receipt.observation && typeof receipt.observation === 'object' ? receipt.observation : {};
  const reported = (value) => (value === true ? true : value === false ? false : null);
  return {
    page_instance_id: boundedIdentity(receipt.page_instance_id),
    observer_id: boundedIdentity(receipt.observer_id),
    armed_at: new Date().toISOString(),
    recorded_at: new Date().toISOString(),
    phase: boundedAnnotation(observation.phase) ?? 'unknown',
    method: boundedAnnotation(observation.method),
    click_attempted: receipt.click_attempted === true,
    submission_observed: receipt.submission_observed === true,
    generation_started: observation.generation_started === true,
    generation_complete: observation.generation_complete === true,
    continuity: reported(observation.continuity),
    terminal: receipt.pending === false,
    reason: boundedAnnotation(receipt.reason) ?? boundedAnnotation(observation.reason),
  };
}

/**
 * The same facts, shaped for a caller instead of for storage.
 *
 * Normalized with the SAME rule the record uses, so what a caller reads back is
 * what was durably written rather than a second, looser rendering of it.
 */
function armFacts(receipt, recordedAt) {
  const observation = receipt.observation && typeof receipt.observation === 'object' ? receipt.observation : {};
  const reported = (value) => (value === true ? true : value === false ? false : null);
  const remaining = observation.remaining_ms;
  return {
    page_instance_id: boundedIdentity(receipt.page_instance_id),
    observer_id: boundedIdentity(receipt.observer_id),
    phase: boundedAnnotation(observation.phase),
    method: boundedAnnotation(observation.method),
    click_attempted: receipt.click_attempted === true,
    submission_observed: receipt.submission_observed === true,
    generation_started: observation.generation_started === true,
    generation_complete: observation.generation_complete === true,
    continuity: reported(observation.continuity),
    pending: receipt.pending !== false,
    remaining_ms: Number.isSafeInteger(remaining) && remaining >= 0 ? remaining : null,
    recorded_at: recordedAt,
  };
}

/**
 * Durable per-correlation dispatch reservations.
 *
 * WHY THIS EXISTS. An MV3 worker is killed constantly. If the only record of a
 * submitted turn lived in memory, a restart — or simply the port guard
 * expiring — would leave the worker with no idea that `task-1` had already been
 * typed into a signed-in session. A retry then submits it a second time. That is
 * the one duplicate this path can produce, so the record is written BEFORE the
 * page is touched and is NEVER cleared automatically, not on timeout, not on
 * restart. Only an explicit reconcile by a human resolves it.
 *
 * Backed by chrome.storage.local, which survives the worker.
 */
export function createReservationStore({ chrome: api, key = DISPATCH_KEY } = {}) {
  return createChatGPTTaskStore({ chrome: api, key });
}

/** First stable code inside an error message, else the fallback. */
function codeOf(err, fallback) {
  const message = String((err && err.message) || err);
  for (const code of Object.values(CHATGPT_ERROR)) {
    if (message.startsWith(`${code}:`)) return code;
  }
  return fallback;
}
