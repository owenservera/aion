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
//   request   : { action: 'ping' | 'state' | 'run-turn' | 'read-final' | 'stop' }
//   response  : the action is echoed back with the result; an unknown action
//               answers { ok:false, reason:'unknown_action' }
//   run-turn  : REQUIRES user_gesture === true, then fills the composer,
//               submits, waits for generation, correlates the answer and
//               replies { ok, verdict, envelope, state }
//   read-final: read-only correlation of the last assistant turn

import { validateEnvelope } from '../lib/index.js';

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
  READ_FINAL: 'read-final',
  STOP: 'stop',
});

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
});

/** Bounds. A prompt longer than this is refused, not truncated and sent. */
export const MAX_TEXT_CHARS = 8000;
export const MAX_ID_CHARS = 128;

/** Durable per-correlation dispatch bookkeeping. */
export const DISPATCH_SCHEMA = 'aion.chatgpt.dispatch/0.1';
export const DISPATCH_KEY = 'aion.relay.chatgpt.dispatch.v1';

/** A reservation is either outstanding or finished. Neither expires on its own. */
export const DISPATCH_STATE = Object.freeze({ IN_FLIGHT: 'IN_FLIGHT', COMPLETED: 'COMPLETED' });

/**
 * HARD CEILINGS for a submitted turn.
 *
 * Why a ceiling below the content script's own 300s: the operator UI has its own
 * deadline, and a request that outlives the UI's patience leaves a panel that has
 * already given up while the page is still generating. The worker must always
 * finish answering BEFORE the UI stops listening.
 *
 *   MAX_RUN_TIMEOUT_MS  the longest `timeout_ms` handed to the page  (120s)
 *   MAX_PORT_GUARD_MS   the longest the worker waits for the reply   (150s)
 *
 * Both are strictly below the 180s UI deadline. They are constants, not options:
 * no caller may widen them, because "let me wait longer" is exactly how a turn
 * outlives the operator who asked for it.
 *
 * Declared BEFORE DEFAULT_CHATGPT_TIMEOUTS, which reads MAX_RUN_TIMEOUT_MS:
 * these are `const`, so the reverse order is a TDZ ReferenceError at import.
 */
export const MAX_RUN_TIMEOUT_MS = 120_000;
export const MAX_PORT_GUARD_MS = 150_000;

/**
 * Default per-action budget.
 *
 * A turn is bounded by the ceilings above; these are the values the worker uses
 * when the caller does not say. Tests pass small ones so a suite never waits on a
 * real timer.
 */
export const DEFAULT_CHATGPT_TIMEOUTS = Object.freeze({
  ping: 5_000,
  state: 5_000,
  read: 15_000,
  run: MAX_RUN_TIMEOUT_MS,
  stop: 10_000,
});

/**
 * Grace added on top of a turn's own budget before the worker gives up.
 *
 * The content script may spend a moment answering after its internal deadline.
 * Kept configurable so a test suite never has to wait out a production-sized
 * grace period, and so the value is visible rather than a magic constant buried
 * in a call.
 */
export const DEFAULT_CHATGPT_GRACE_MS = 5_000;

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
  const graceMs = Number.isInteger(options.graceMs) && options.graceMs >= 0
    ? options.graceMs
    : DEFAULT_CHATGPT_GRACE_MS;
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

  async function queryChatGptTabs() {
    if (!api) throw new Error(`${CHATGPT_ERROR.NO_TABS_API}: chrome.tabs is unavailable in this context`);
    let found;
    try {
      found = await api.tabs.query({ url: CHATGPT_TAB_PATTERN });
    } catch (err) {
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
  async function resolveTab(tabId) {
    const tabs = await queryChatGptTabs();
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
  function exchange(tabId, action, payload, timeoutMs) {
    return new Promise((resolve) => {
      let port;
      try {
        port = api.tabs.connect(tabId, { name: CHATGPT_PORT_NAME });
      } catch (err) {
        // Chrome throws "Could not establish connection. Receiving end does
        // not exist." when the content script has not loaded in that tab.
        const message = String((err && err.message) || err);
        resolve(fail(
          /receiving end|content script|no matching/i.test(message)
            ? CHATGPT_ERROR.NO_CONTENT_SCRIPT
            : CHATGPT_ERROR.CONNECT_FAILED,
          { tab_id: tabId, message }
        ));
        return;
      }
      if (!port || typeof port.postMessage !== 'function') {
        resolve(fail(CHATGPT_ERROR.CONNECT_FAILED, { tab_id: tabId, message: 'chrome.tabs.connect returned no port' }));
        return;
      }
      // Fail fast rather than sit out the whole budget: a port that cannot
      // receive is never going to answer, and waiting out a timeout on it looks
      // exactly like a hung worker.
      if (!port.onMessage || typeof port.onMessage.addListener !== 'function') {
        try { if (typeof port.disconnect === 'function') port.disconnect(); } catch { /* already gone */ }
        resolve(fail(CHATGPT_ERROR.CONNECT_FAILED, { tab_id: tabId, message: 'the returned port cannot receive replies' }));
        return;
      }

      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimer(timer);
        try { if (typeof port.disconnect === 'function') port.disconnect(); } catch { /* already gone */ }
        resolve(value);
      };

      const timer = setTimer(() => {
        finish(fail(CHATGPT_ERROR.TIMEOUT, {
          tab_id: tabId,
          action,
          timeout_ms: timeoutMs,
          message: `the ${action} action was not answered in ${timeoutMs}ms; nothing is retried automatically`
        }));
      }, timeoutMs);

      try {
        if (port.onMessage && typeof port.onMessage.addListener === 'function') {
          port.onMessage.addListener((message) => finish(message));
        }
        if (port.onDisconnect && typeof port.onDisconnect.addListener === 'function') {
          // The tab navigated or the content script went away mid-request.
          port.onDisconnect.addListener(() => finish(fail(CHATGPT_ERROR.PORT_CLOSED, { tab_id: tabId, action })));
        }
        port.postMessage({ action, ...payload });
      } catch (err) {
        finish(fail(CHATGPT_ERROR.POST_FAILED, { tab_id: tabId, action, message: String((err && err.message) || err) }));
      }
    });
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

  return {
    portName: CHATGPT_PORT_NAME,

    /** Sanitized chatgpt.com tabs. Never any other tab, never a title. */
    async listTabs() {
      try {
        const tabs = await queryChatGptTabs();
        return { ok: true, count: tabs.length, tabs };
      } catch (err) {
        return { ok: false, code: codeOf(err, CHATGPT_ERROR.NO_TABS_API), error: String(err && err.message ? err.message : err), tabs: [] };
      }
    },

    /** Read-only probe. Nothing is composed and nothing is sent. */
    async ping(command = {}) {
      const resolved = await resolveTab(command.tab_id);
      if (resolved.error) return resolved.error;
      const answer = await exchange(resolved.tab.tab_id, CHATGPT_ACTION.PING, {}, timeouts.ping);
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
     */
    async runTurn(command = {}) {
      if (command.user_gesture !== true) {
        return fail(CHATGPT_ERROR.EXPLICIT_COMMAND_REQUIRED, {
          message: 'runTurn composes and submits into a signed-in session; pass user_gesture:true to do it once',
          submitted: false
        });
      }
      // A gesture says a human clicked. It is not authorisation on its own: the
      // contract's rule is that "the extension cannot grant its own
      // permissions", so a submission must also name the approval it is acting
      // under, and that reference is recorded durably with the dispatch.
      const scopeRef = command.approved_scope_ref;
      if (typeof scopeRef !== 'string' || scopeRef.trim() === '' || scopeRef.length > MAX_ID_CHARS) {
        return fail(CHATGPT_ERROR.APPROVAL_REQUIRED, {
          message: `approved_scope_ref must name the approval this turn acts under (max ${MAX_ID_CHARS} chars); a user gesture alone is not authorisation`,
          submitted: false
        });
      }
      const text = command.text;
      if (typeof text !== 'string' || text.trim() === '') {
        return fail(CHATGPT_ERROR.TEXT_REQUIRED, { message: 'text must be a non-empty string' });
      }
      if (text.length > MAX_TEXT_CHARS) {
        return fail(CHATGPT_ERROR.TEXT_TOO_LONG, { chars: text.length, max: MAX_TEXT_CHARS });
      }
      const correlationId = command.correlation_id;
      if (typeof correlationId !== 'string' || correlationId.trim() === '' || correlationId.length > MAX_ID_CHARS) {
        return fail(CHATGPT_ERROR.CORRELATION_REQUIRED, {
          message: `correlation_id must be a non-empty string of at most ${MAX_ID_CHARS} characters`
        });
      }
      const expectedToken = command.expected_reply_token;
      if (expectedToken !== undefined && expectedToken !== null
        && (typeof expectedToken !== 'string' || expectedToken.length > MAX_ID_CHARS)) {
        return fail(CHATGPT_ERROR.BAD_ARGUMENT, { message: 'expected_reply_token must be a string' });
      }
      const timeoutMs = boundedTimeout(command.timeout_ms, timeouts.run);

      const resolved = await resolveTab(command.tab_id);
      if (resolved.error) return resolved.error;
      if (turnsInFlight.has(resolved.tab.tab_id)) {
        return fail(CHATGPT_ERROR.TURN_IN_FLIGHT, { tab_id: resolved.tab.tab_id });
      }

      // READ-ONLY PREFLIGHT, before anything is reserved or typed.
      //
      // This asks the page for state and composes nothing. It is not a
      // substitute for the content script's own gate — that one runs first and
      // this one is a second, independent refusal — it exists so a tab that
      // plainly cannot take a turn is reported WITHOUT a dispatch reservation
      // being burned on it, and without the operator seeing a submitted turn
      // that never happened.
      const preflight = await preflightComposer(resolved.tab);
      if (preflight.ok !== true) return { ...preflight, tab: resolved.tab, correlation_id: correlationId.trim(), submitted: false, captured: false };

      // Durable reservation FIRST. Everything below this line can touch a live
      // page; nothing above it has written anything that would survive a crash.
      const correlationKey = correlationId.trim();
      let prior;
      try {
        prior = await reservations.get(correlationKey);
      } catch (error) {
        // FAIL CLOSED. An unreadable reservation store is not "no reservations":
        // treating it as empty is precisely how the same correlation gets
        // submitted a second time. Refuse before any RUN port is opened; the
        // read-only preflight above may have opened one, and "composed nothing"
        // is not the same claim as "never touched the page".
        return fail(CHATGPT_ERROR.RESERVATION_FAILED, {
          correlation_id: correlationKey,
          submitted: false,
          captured: false,
          message: `existing dispatches could not be read, so this one was refused: ${String((error && error.message) || error)}`
        });
      }
      if (prior && prior.state === DISPATCH_STATE.IN_FLIGHT) {
        return fail(CHATGPT_ERROR.DISPATCH_IN_FLIGHT, {
          correlation_id: correlationKey,
          started_at: prior.started_at ?? null,
          message: 'this correlation already has an unfinished dispatch; it is NOT re-sent. Reconcile it explicitly.'
        });
      }
      if (prior && prior.state === DISPATCH_STATE.COMPLETED) {
        return fail(CHATGPT_ERROR.ALREADY_DISPATCHED, {
          correlation_id: correlationKey,
          finished_at: prior.finished_at ?? null,
          message: 'this correlation was already dispatched; a repeat submission is refused. Reconcile it explicitly.'
        });
      }

      turnsInFlight.add(resolved.tab.tab_id);
      const startedAt = new Date().toISOString();
      const reservation = {
        correlation_id: correlationKey,
        state: DISPATCH_STATE.IN_FLIGHT,
        tab_id: resolved.tab.tab_id,
        approved_scope_ref: scopeRef.trim(),
        started_at: startedAt,
        finished_at: null,
        captured: null
      };
      try {
        await reservations.put(reservation);
      } catch (error) {
        turnsInFlight.delete(resolved.tab.tab_id);
        return fail(CHATGPT_ERROR.RESERVATION_FAILED, {
          correlation_id: correlationKey,
          message: `the dispatch could not be recorded, so it was not submitted: ${String((error && error.message) || error)}`,
          submitted: false
        });
      }

      // Finish the reservation whatever happens. It is never rolled back to
      // "nothing happened": the page may have received the text even if the reply
      // was lost, and pretending otherwise is how a duplicate gets typed.
      const settle = async (captured) => {
        try {
          await reservations.put({
            ...reservation,
            state: DISPATCH_STATE.COMPLETED,
            captured,
            finished_at: new Date().toISOString()
          });
        } catch {
          /* the reservation stays IN_FLIGHT, which is the safe direction */
        }
      };

      try {
        const answer = await exchange(resolved.tab.tab_id, CHATGPT_ACTION.RUN_TURN, {
          // The content script refuses without this exact flag.
          user_gesture: true,
          text,
          correlation_id: correlationId.trim(),
          expected_reply_token: typeof expectedToken === 'string' ? expectedToken.trim() : '',
          timeout_ms: timeoutMs
        }, Math.min(MAX_PORT_GUARD_MS, timeoutMs + graceMs));

        if (isTransportFailure(answer)) {
          await settle(null);
          return { ...answer, tab: resolved.tab, correlation_id: correlationKey, submitted: true, started_at: startedAt, captured: false };
        }
        const checked = checkReply(answer, CHATGPT_ACTION.RUN_TURN, resolved.tab.tab_id);
        if (checked.error) {
          await settle(null);
          return { ...checked.error, tab: resolved.tab, correlation_id: correlationKey, submitted: true, started_at: startedAt, captured: false };
        }
        const reply = checked.reply;

        if (reply.ok !== true) {
          // The turn ran but did not produce a correlated answer. Report it as a
          // refusal with the script's own reason; never as a success.
          await settle(false);
          return {
            ok: false,
            code: CHATGPT_ERROR.TURN_REFUSED,
            error: `${CHATGPT_ERROR.TURN_REFUSED}: ${String(reply.verdict && reply.verdict.reason || 'no_reason')}`,
            tab: resolved.tab,
            action: CHATGPT_ACTION.RUN_TURN,
            correlation_id: correlationKey,
            expected_reply_token: typeof expectedToken === 'string' ? expectedToken.trim() : null,
            verdict: sanitizeVerdict(reply.verdict),
            envelope: null,
            captured: false,
            submitted: true,
            started_at: startedAt,
            finished_at: new Date().toISOString()
          };
        }

        // An accepted turn carries a relay envelope. It is validated here so a
        // half-trusted object cannot leave the worker.
        const envelopeCheck = validateEnvelope(reply.envelope);
        await settle(envelopeCheck.valid);
        if (!envelopeCheck.valid) {
          return {
            ok: false,
            code: CHATGPT_ERROR.INVALID_ENVELOPE,
            error: `${CHATGPT_ERROR.INVALID_ENVELOPE}: ${envelopeCheck.errors.join('; ')}`,
            tab: resolved.tab,
            correlation_id: correlationKey,
            verdict: sanitizeVerdict(reply.verdict),
            envelope: null,
            captured: false,
            submitted: true,
            started_at: startedAt,
            finished_at: new Date().toISOString()
          };
        }

        return {
          ok: true,
          tab: resolved.tab,
          action: CHATGPT_ACTION.RUN_TURN,
          correlation_id: correlationKey,
          expected_reply_token: typeof expectedToken === 'string' ? expectedToken.trim() : null,
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
      } finally {
        turnsInFlight.delete(resolved.tab.tab_id);
      }
    },

    /**
     * Read the last assistant turn and correlate it. Read-only: it never
     * composes, never clicks, and needs no gesture.
     */
    async readFinal(command = {}) {
      const correlationId = command.correlation_id;
      if (correlationId !== undefined && correlationId !== null
        && (typeof correlationId !== 'string' || correlationId.length > MAX_ID_CHARS)) {
        return fail(CHATGPT_ERROR.BAD_ARGUMENT, { message: 'correlation_id must be a string' });
      }
      const resolved = await resolveTab(command.tab_id);
      if (resolved.error) return resolved.error;

      const answer = await exchange(resolved.tab.tab_id, CHATGPT_ACTION.READ_FINAL, {
        correlation_id: typeof correlationId === 'string' ? correlationId.trim() : '',
        expected_reply_token: typeof command.expected_reply_token === 'string' ? command.expected_reply_token.trim() : '',
        outbound_text: typeof command.outbound_text === 'string' ? command.outbound_text : null,
        generation_complete: command.generation_complete === true
      }, timeouts.read);

      if (isTransportFailure(answer)) return { ...answer, tab: resolved.tab };
      const checked = checkReply(answer, CHATGPT_ACTION.READ_FINAL, resolved.tab.tab_id);
      if (checked.error) return { ...checked.error, tab: resolved.tab };
      const reply = checked.reply;
      const verdict = sanitizeVerdict(reply.verdict);
      return {
        // `ok` means "a correlated final reply was read", the same meaning it has
        // for runTurn. A read that found nothing correlating is not a success,
        // and saying otherwise is how a stale answer gets treated as current.
        ok: reply.ok === true && Boolean(verdict && verdict.accepted),
        tab: resolved.tab,
        action: CHATGPT_ACTION.READ_FINAL,
        verdict,
        generation: reply.generation && typeof reply.generation === 'object'
          ? { complete: reply.generation.complete === true, asserted_by_caller: reply.generation.asserted_by_caller === true }
          : null,
        read_only: true
      };
    }
  };

  /* ------------------------------------------------------------- internals */

  /**
   * Ask the page whether it can take a turn, without asking it to take one.
   *
   * Uses the same `ping` action the operator panel already uses, so it adds no
   * new capability to the content script. A refusal carries a machine-readable
   * `reason` through unchanged, so the caller learns WHY and not merely that
   * something was refused.
   */
  async function preflightComposer(tab) {
    const answer = await exchange(tab.tab_id, CHATGPT_ACTION.PING, {}, timeouts.ping);
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
    return { ok: true, composer_visible_count: count, state };
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

  function boundedTimeout(value, fallback) {
    const ms = Number(value);
    if (!Number.isFinite(ms) || ms <= 0) return Math.min(fallback, MAX_RUN_TIMEOUT_MS);
    // Clamped, never trusted: the ceiling is what keeps the answer inside the
    // operator UI's own deadline.
    return Math.min(Math.floor(ms), MAX_RUN_TIMEOUT_MS);
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
 * Durable per-correlation dispatch reservations.
 *
 * WHY THIS EXISTS. An MV3 worker is killed constantly. If the only record of a
 * submitted turn lived in memory, a restart — or simply the 150s port guard
 * expiring — would leave the worker with no idea that `task-1` had already been
 * typed into a signed-in session. A retry then submits it a second time. That is
 * the one duplicate this path can produce, so the record is written BEFORE the
 * page is touched and is NEVER cleared automatically, not on timeout, not on
 * restart. Only an explicit reconcile by a human resolves it.
 *
 * Backed by chrome.storage.local, which survives the worker.
 */
export function createReservationStore({ chrome: api, key = DISPATCH_KEY } = {}) {
  const local = api && api.storage && api.storage.local ? api.storage.local : null;

  return {
    /**
     * In-memory only. With no storage there is no durable record, so a caller
     * that needs one must refuse rather than proceed on the in-flight set alone.
     */
    durable: !!local,

    async all() {
      if (!local) return {};
      // Errors PROPAGATE. An unreadable reservation store that resolves to an
      // empty map is indistinguishable from "nothing was ever dispatched", and
      // that is exactly the state in which a duplicate submission happens. The
      // caller turns a throw into a refusal.
      const bag = await local.get(key);
      const raw = bag && bag[key];
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
      // The stored value is a wrapper: { schema, reservations }. Returning the
      // wrapper itself would make every lookup miss, and a lookup that always
      // misses is exactly a duplicate submission waiting to happen.
      if (raw.schema !== undefined && raw.schema !== DISPATCH_SCHEMA) return {};
      const reservations = raw.reservations;
      return reservations && typeof reservations === 'object' && !Array.isArray(reservations) ? reservations : {};
    },

    async get(correlationId) {
      const all = await this.all();
      return Object.prototype.hasOwnProperty.call(all, correlationId) ? all[correlationId] : null;
    },

    /** Write one reservation. Throws if storage rejects: the caller must not submit. */
    async put(record) {
      if (!local) return false;
      const all = await this.all();
      all[record.correlation_id] = record;
      await local.set({ [key]: { schema: DISPATCH_SCHEMA, reservations: all } });
      return true;
    }
  };
}

/** First stable code inside an error message, else the fallback. */
function codeOf(err, fallback) {
  const message = String((err && err.message) || err);
  for (const code of Object.values(CHATGPT_ERROR)) {
    if (message.startsWith(`${code}:`)) return code;
  }
  return fallback;
}