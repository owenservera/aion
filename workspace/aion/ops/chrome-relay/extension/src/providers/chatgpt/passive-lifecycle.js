/**
 * AION P2 — bounded, read-only passive lifecycle for ONE exact binding.
 *
 * WHAT THIS IS
 *   The page-side controller behind the read-only conversation receive port
 *   (`aion-conversation-receive`, see src/chatgpt/receive.js). It owns exactly
 *   one observation of one authenticated binding and nothing else.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   No Send, no composer fill, no click, no keyboard, no network call, no
 *   private endpoint, no storage and no transcript persistence. The only things
 *   that leave this module are (a) a canonical snapshot, (b) a canonical
 *   journal page and (c) a DATA-ONLY hint that carries no message text.
 *
 * THE ACCOUNT (a LOCAL REGISTRATION, not a challenge)
 *   The owner registered the account of this lane once, explicitly. This
 *   module reuses that registration: it is read ONCE when the subscription
 *   starts and it is not re-read per sample. There is no account polling, no
 *   repeated identity challenge and no per-sample account lookup.
 *
 *   The registered address is an IDENTIFIER, not a promise that a particular
 *   account is signed in right now: if the owner signs a different account
 *   into the same profile, that switch is deliberately NOT detected here and
 *   an explicit re-registration is required. The route, the page epoch and
 *   the binding itself still terminate the subscription.
 *
 * BOUNDS
 *   - one binding, one page epoch, one observer, one page;
 *   - samples are coalesced and rate-limited to at most 4 per second;
 *   - the DOM window is bounded and the journal is bounded;
 *   - the FIRST sample is a silent baseline: it establishes what is already on
 *     the page and emits no events at all.
 *
 * FAIL CLOSED
 *   Exact route, exact binding, exact registered account. A URL change, a
 *   revoked subscription or an explicit stop terminates the subscription,
 *   disconnects the observer and DROPS every retained text — nothing is kept
 *   "just in case".
 */
import { createChatGptConversationSource } from './source.js';
import { chatGptConversationFromUrl } from './profile.js';
import { validateConversationBinding } from '../../lib/conversation-contract.js';

export const PASSIVE_LIMITS = Object.freeze({
  /** Bounded DOM window per sample. */
  maxMessages: 100,
  /** Minimum spacing between two samples: 4 samples per second, no more. */
  sampleIntervalMs: 250,
  /** Canonical journal page size for a replay. */
  replayPage: 100,
});

/** Machine-readable outcomes. Stable strings; callers branch on these. */
export const PASSIVE_CODE = Object.freeze({
  NOT_STARTED: 'not_started',
  INVALID_BINDING: 'invalid_binding',
  ACCOUNT_UNPROVEN: 'account_identity_unproven',
  ACCOUNT_MISMATCH: 'account_mismatch',
  /**
   * Kept for compatibility. A manual account switch inside a lane is NOT
   * detected any more: the registered address is read once, at start.
   */
  ACCOUNT_DRIFT: 'account_drift',
  CONVERSATION_MISMATCH: 'conversation_mismatch',
  URL_DRIFT: 'url_drift',
  LOGGED_OUT: 'logged_out',
  REMOUNTED: 'remounted',
  BINDING_CONFLICT: 'binding_conflict',
  UNBOUND: 'unbound',
  REVOKED: 'revoked',
  OBSERVER_UNAVAILABLE: 'observer_unavailable',
  ADAPTER_ERROR: 'adapter_error',
});

export const PASSIVE_STATUS = Object.freeze({
  IDLE: 'idle',
  OBSERVING: 'observing',
  REVOKED: 'revoked',
});

/**
 * @param {object} options
 * @param {object} options.binding        canonical AION binding (P1 contract shape)
 * @param {string} options.pageEpoch       page lifetime token for THIS document
 * @param {string} options.streamEpoch     observation cursor epoch for this subscription
 * @param {string} [options.registeredAccountKey]
 *        The REGISTERED account of this lane, sent by the owner as CONTEXT.
 *        It is read ONCE, at start, and never per sample.
 * @param {() => (string|null)} [options.getAccountKey]
 *        Compatibility seam for the same value. It is read at most ONCE, when
 *        the subscription starts.
 * @param {() => any} [options.root]       DOM root to read messages from
 * @param {() => string} [options.pageUrl] current page URL (origin + path)
 * @param {(hint: object) => void} [options.onHint] DATA-ONLY hint sink
 */
export function createPassiveLifecycle({
  binding,
  pageEpoch,
  streamEpoch,
  registeredAccountKey = '',
  getAccountKey = null,
  root = () => null,
  pageUrl = () => '',
  now = () => Date.now(),
  setTimeout: schedule = (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: unschedule = (handle) => globalThis.clearTimeout(handle),
  MutationObserver: Observer = globalThis.MutationObserver,
  onHint = () => {},
  maxMessages = PASSIVE_LIMITS.maxMessages,
  sampleIntervalMs = PASSIVE_LIMITS.sampleIntervalMs,
  createSource = createChatGptConversationSource,
} = {}) {
  if (!validateConversationBinding(binding)) {
    throw new TypeError('AION exact binding required');
  }
  if (typeof pageEpoch !== 'string' || !pageEpoch) {
    throw new TypeError('AION page epoch required');
  }
  if (typeof streamEpoch !== 'string' || !streamEpoch) {
    throw new TypeError('AION stream epoch required');
  }

  let source = null;
  let observer = null;
  let timer = null;
  let status = PASSIVE_STATUS.IDLE;
  let code = '';
  let reason = '';
  let lastIssue = '';
  let lastSampleAt = 0;
  let sampleCount = 0;
  let baselineCaptured = false;
  let latestSnapshot = null;
  // The REGISTERED account of this subscription, captured ONCE at start.
  let registeredAccount = null;

  function fail(codeValue, reasonValue) {
    return {
      ok: false,
      read_only: true,
      code: codeValue,
      reason: reasonValue || reason,
      status,
      page_epoch: pageEpoch,
      stream_epoch: streamEpoch,
      binding,
    };
  }

  /** Drop every retained text and detach from the page. */
  function revoke(codeValue, reasonValue) {
    status = PASSIVE_STATUS.REVOKED;
    code = codeValue;
    reason = reasonValue || reason;
    if (observer) {
      try { observer.disconnect(); } catch { /* already detached */ }
      observer = null;
    }
    if (timer !== null) {
      try { unschedule(timer); } catch { /* already fired */ }
      timer = null;
    }
    // The journal holds canonical events WITH message text and the snapshot
    // holds the current page text: both are dropped, never parked.
    source = null;
    latestSnapshot = null;
    baselineCaptured = false;
  }

  /**
   * The REGISTERED account of this lane, read ONCE.
   *
   * It is an identifier the owner registered, not a live challenge: nothing
   * here re-reads it per sample and nothing here polls for the current
   * signed-in account.
   */
  function readRegisteredAccountKey() {
    if (typeof registeredAccountKey === 'string' && registeredAccountKey.length > 0) {
      return registeredAccountKey;
    }
    if (typeof getAccountKey !== 'function') return null;
    try {
      const value = getAccountKey();
      return typeof value === 'string' && value.length > 0 ? value : null;
    } catch {
      return null;
    }
  }

  function cursorOf() {
    const meta = source ? source.status() : null;
    if (!meta) return null;
    return { epoch: meta.streamEpoch, sequence: meta.latestSequence };
  }

  function proofFor(accountKey) {
    return {
      pageUrl: pageUrl(),
      // The binding key is this subscription's own identity; the account key is
      // the REGISTERED one the owner supplied as context.
      authenticatedBindingKey: binding.ref,
      authenticatedAccountKey: accountKey,
      observedPageEpoch: pageEpoch,
      nowMs: now(),
    };
  }

  /**
   * One bounded read of the page.
   *
   * Order matters: the route is checked BEFORE anything is read, because a
   * page that is no longer the bound conversation must not be sampled at all.
   * The registered account was checked once, at start.
   */
  function sampleNow(trigger) {
    if (status === PASSIVE_STATUS.REVOKED) return fail(PASSIVE_CODE.REVOKED, reason);
    if (status !== PASSIVE_STATUS.OBSERVING || !source) {
      return fail(PASSIVE_CODE.NOT_STARTED, 'no subscription is observing');
    }

    // 1. EXACT ROUTE. The bound conversation must still be the page route.
    const conversationId = chatGptConversationFromUrl(pageUrl());
    if (conversationId !== binding.conversation_id) {
      revoke(PASSIVE_CODE.URL_DRIFT, 'the page is no longer the bound conversation route');
      return fail(PASSIVE_CODE.URL_DRIFT, reason);
    }

    // The REGISTERED account is NOT re-read here: it was captured once, at
    // start, and it is context - not a live challenge.

    const read = source.sample(root(), proofFor(registeredAccount));
    lastSampleAt = now();
    sampleCount += 1;

    if (read.status === 'unbound') {
      const mapped = read.reason === 'not_exact_thread_route' ? PASSIVE_CODE.URL_DRIFT
        : read.reason === 'logged_out_ui' ? PASSIVE_CODE.LOGGED_OUT
          : read.reason === 'binding_or_account_mismatch' ? PASSIVE_CODE.ACCOUNT_DRIFT
            : PASSIVE_CODE.UNBOUND;
      revoke(mapped, `the page is not the bound, signed-in conversation (${read.reason})`);
      return fail(code, reason);
    }
    if (read.status === 'reset_required') {
      revoke(PASSIVE_CODE.URL_DRIFT, 'the page epoch no longer describes this page');
      return fail(code, reason);
    }
    if (read.status !== 'observing') {
      // Degraded, not fatal: an unreadable or ambiguous DOM window yields NO
      // events and NO snapshot, and the subscription keeps trying.
      lastIssue = String(read.reason || 'dom_unavailable');
      return {
        ok: true,
        read_only: true,
        status,
        degraded: true,
        last_issue: lastIssue,
        events: [],
        snapshot: null,
        page_epoch: pageEpoch,
        stream_epoch: streamEpoch,
        binding,
      };
    }

    if (read.remount && read.remount.detected) {
      // The conversation tree was replaced. Whatever changed while it was
      // replaced is UNKNOWN, so the observer re-baselines silently and the
      // events of that sample are dropped instead of being reported as new.
      // The notice is sticky until the next real change: the observation
      // boundary moved, and a later read must not quietly forget it.
      lastIssue = PASSIVE_CODE.REMOUNTED;
    }

    const events = read.events ?? [];
    latestSnapshot = read.snapshot ?? latestSnapshot;
    baselineCaptured = true;
    if (events.length > 0) lastIssue = '';

    if (events.length > 0) {
      // DATA ONLY. The hint says "something changed, at this cursor"; it never
      // carries message text.
      const last = events[events.length - 1];
      try {
        onHint({
          type: 'aion.conversation.hint',
          binding,
          page_epoch: pageEpoch,
          cursor: last.cursor ?? cursorOf(),
        });
      } catch { /* a broken hint sink never breaks the observation */ }
    }

    return {
      ok: true,
      read_only: true,
      status,
      trigger,
      events,
      snapshot: latestSnapshot ? structuredClone(latestSnapshot) : null,
      cursor: cursorOf(),
      last_issue: lastIssue || null,
      page_epoch: pageEpoch,
      stream_epoch: streamEpoch,
      binding,
    };
  }

  /** Coalesce every mutation burst into ONE sample, at most 4 per second. */
  function scheduleSample() {
    if (status !== PASSIVE_STATUS.OBSERVING) return;
    if (timer !== null) return; // a sample is already scheduled: coalesce
    const elapsed = now() - lastSampleAt;
    const wait = Math.max(0, sampleIntervalMs - elapsed);
    timer = schedule(() => {
      timer = null;
      sampleNow('mutation');
    }, wait);
  }

  function start() {
    if (status === PASSIVE_STATUS.REVOKED) return fail(PASSIVE_CODE.REVOKED, reason);
    if (status === PASSIVE_STATUS.OBSERVING) {
      return {
        ok: true,
        read_only: true,
        status,
        already_active: true,
        snapshot: latestSnapshot ? structuredClone(latestSnapshot) : null,
        cursor: cursorOf(),
        page_epoch: pageEpoch,
        stream_epoch: streamEpoch,
        binding,
      };
    }

    // 1. THE REGISTERED ACCOUNT, read ONCE. No registration, no observation.
    const account = readRegisteredAccountKey();
    if (!account) {
      return fail(PASSIVE_CODE.ACCOUNT_UNPROVEN,
        'no registered account is available for this page; the owner must register the account explicitly');
    }
    if (account !== binding.account_key) {
      return fail(PASSIVE_CODE.ACCOUNT_MISMATCH,
        'the registered account is not the bound account');
    }
    // Captured for the lifetime of this subscription. It is never re-read.
    registeredAccount = account;

    // 2. EXACT ROUTE.
    const conversationId = chatGptConversationFromUrl(pageUrl());
    if (conversationId !== binding.conversation_id) {
      return fail(PASSIVE_CODE.CONVERSATION_MISMATCH,
        'the page route is not the bound conversation route');
    }

    source = createSource({ binding, pageEpoch, streamEpoch, maxMessages });
    status = PASSIVE_STATUS.OBSERVING;

    // 3. THE FIRST SAMPLE IS A BASELINE: it establishes what is already on the
    //    page and must emit no events.
    const first = sampleNow('baseline');
    if (!first.ok) return first;
    if (first.events.length > 0) {
      revoke(PASSIVE_CODE.ADAPTER_ERROR, 'the baseline sample produced events');
      return fail(PASSIVE_CODE.ADAPTER_ERROR, reason);
    }

    // 4. The observer goes in AFTER the baseline, so the baseline can never be
    //    mistaken for a change.
    const target = root();
    if (!target || typeof target.querySelectorAll !== 'function') {
      return fail(PASSIVE_CODE.OBSERVER_UNAVAILABLE, 'the page DOM root is not readable');
    }
    if (Observer) {
      try {
        observer = new Observer(() => scheduleSample());
        observer.observe(target, { subtree: true, childList: true, characterData: true });
      } catch {
        observer = null;
      }
    }

    return {
      ok: true,
      read_only: true,
      status,
      baseline_captured: baselineCaptured,
      degraded: Boolean(first.degraded),
      last_issue: lastIssue || null,
      observer: Boolean(observer),
      snapshot: latestSnapshot ? structuredClone(latestSnapshot) : null,
      cursor: cursorOf(),
      page_epoch: pageEpoch,
      stream_epoch: streamEpoch,
      binding,
    };
  }

  /** Authoritative read: sample now and return the canonical snapshot. */
  function read() {
    if (status === PASSIVE_STATUS.REVOKED) return fail(PASSIVE_CODE.REVOKED, reason);
    if (status !== PASSIVE_STATUS.OBSERVING) return fail(PASSIVE_CODE.NOT_STARTED, reason);
    const result = sampleNow('read');
    if (!result.ok) return result;
    if (result.degraded) {
      return {
        ok: true,
        read_only: true,
        status,
        degraded: true,
        last_issue: result.last_issue,
        snapshot: null,
        cursor: cursorOf(),
        page_epoch: pageEpoch,
        stream_epoch: streamEpoch,
        binding,
      };
    }
    return {
      ok: true,
      read_only: true,
      status,
      snapshot: result.snapshot,
      cursor: result.cursor,
      coverage: result.snapshot ? result.snapshot.coverage : null,
      last_issue: result.last_issue,
      page_epoch: pageEpoch,
      stream_epoch: streamEpoch,
      binding,
    };
  }

  /** Canonical replay of the bounded journal. */
  function replay({ cursor, limit } = {}) {
    if (status === PASSIVE_STATUS.REVOKED) return fail(PASSIVE_CODE.REVOKED, reason);
    if (status !== PASSIVE_STATUS.OBSERVING || !source) {
      return fail(PASSIVE_CODE.NOT_STARTED, reason);
    }
    const page = source.readPage({
      cursor: cursor ?? { epoch: '', sequence: 0 },
      limit: limit ?? PASSIVE_LIMITS.replayPage,
    });
    return {
      ok: true,
      read_only: true,
      status,
      page,
      page_epoch: pageEpoch,
      stream_epoch: streamEpoch,
      binding,
    };
  }

  /** Stop observing and DROP every retained text. */
  function stop(cause = 'subscription_stopped') {
    revoke(cause, 'the subscription was revoked; no page text is retained');
    return {
      ok: true,
      read_only: true,
      status,
      code: cause,
      page_epoch: pageEpoch,
      stream_epoch: streamEpoch,
      binding,
    };
  }

  function statusOf() {
    return {
      ok: true,
      read_only: true,
      status,
      code: code || null,
      reason: reason || null,
      last_issue: lastIssue || null,
      baseline_captured: baselineCaptured,
      observer: Boolean(observer),
      samples: sampleCount,
      page_epoch: pageEpoch,
      stream_epoch: streamEpoch,
      binding,
    };
  }

  return Object.freeze({
    start,
    read,
    replay,
    stop,
    status: statusOf,
    /** Same as stop(); named for the pagehide / disconnect paths. */
    revoke: (cause) => stop(cause),
  });
}
