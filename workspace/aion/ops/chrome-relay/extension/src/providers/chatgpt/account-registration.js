/**
 * AION P2 — account REGISTRATION email read (explicit, one-shot, read-only).
 *
 * WHAT THIS IS FOR
 *   When the OWNER explicitly registers an account, they want to know WHICH
 *   account the signed-in session belongs to. The owner already knows that
 *   account; this is an identifier the owner asked for, not a secret AION
 *   invented to hide the person behind. It is therefore returned in the clear
 *   and never replaced by a hash-only "hidden identity".
 *
 * WHEN IT RUNS
 *   ONLY inside an explicit, owner-initiated REGISTRATION call. It is NOT part
 *   of the passive subscribe / read / replay / watch path, and nothing in the
 *   receive lifecycle imports it: an observation must never turn into an
 *   account probe. One call, one request, no polling and no retry.
 *
 * THE METHOD IS NOT PROVEN LIVE
 *   `/api/auth/session` has NOT been exercised against a real signed-in
 *   ChatGPT session in this repository. The shape below is the owner's
 *   documented expectation of that endpoint; an authorized live run must
 *   confirm it before the result is trusted. Until then the only proven facts
 *   are the local ones: the request options, the bounds and the projection.
 *
 * WHAT IT DOES NOT DO
 *   No bearer token extraction, no Authorization header, no `/backend-api`, no
 *   cookies API, no MAIN-world injection, no retry, no storage, no logging, no
 *   notification, no spread of the response and no exception text in the
 *   result. The response body may carry tokens, ids, plan names and roles:
 *   only `user.email` is ever read, and nothing else is returned, spread or
 *   logged — not even the message of an exception.
 *
 * PROVENANCE
 *   The request-options shape (same-origin check, injected fetch, an
 *   AbortController with a 4 s deadline, `credentials: 'include'`,
 *   `cache: 'no-store'`, `redirect: 'error'`) follows the donor pattern in
 *   chatgpt-bridge `content/conversationReconciliation.js` lines 63-77,
 *   upstream 0ffdae90239988f253058c05253226152acd55d2 (MIT, (c) 2026 Serhii
 *   Tkachenko, `harvest/external/landing/donors/chatgpt-bridge/LICENSE`).
 *   NO backend route and NO token logic was taken from that file: this module
 *   reads one registration endpoint and projects one field.
 */

/** The one endpoint this module may read, on the one allowed origin. */
export const REGISTRATION_EMAIL_PATH = '/api/auth/session';
/** The only origin AION's host permission covers for this provider. */
export const REGISTRATION_EMAIL_ORIGIN = 'https://chatgpt.com';
/** Hard cap on the response body this module will read at all. */
export const REGISTRATION_EMAIL_MAX_BYTES = 16 * 1024;
/** The whole request, including the body, runs under this deadline. */
export const REGISTRATION_EMAIL_TIMEOUT_MS = 4000;

/**
 * Every failure is one of these fixed codes.
 *
 * They are FIXED STRINGS on purpose: a code never carries a status, a URL, a
 * header, a body fragment or an exception message, so a failure cannot smuggle
 * session data out of the page.
 */
export const REGISTRATION_EMAIL_CODE = Object.freeze({
  ORIGIN_NOT_ALLOWED: 'origin_not_allowed',
  FETCH_UNAVAILABLE: 'fetch_unavailable',
  FETCH_REJECTED: 'fetch_rejected',
  REDIRECT_REFUSED: 'redirect_refused',
  HTTP_UNAUTHORIZED: 'http_unauthorized',
  HTTP_ERROR: 'http_error',
  RESPONSE_TOO_LARGE: 'response_too_large',
  BODY_TOO_LARGE: 'body_too_large',
  BODY_UNREADABLE: 'body_unreadable',
  BODY_INVALID: 'body_invalid',
  EMAIL_MISSING: 'email_missing',
  EMAIL_INVALID: 'email_invalid',
  TIMEOUT: 'timeout',
  ABORTED: 'aborted',
  INTERNAL_ERROR: 'internal_error',
});

const MAX_EMAIL_CHARS = 254;
const MAX_LOCAL_CHARS = 64;
/** RFC-style unquoted local part characters. */
const LOCAL_PART = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
/** One or more dot-separated labels of letters, digits and inner hyphens. */
const DOMAIN_LABEL = /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/;
/** Whitespace and control characters are never part of an address. */
const FORBIDDEN = /[\s\u0000-\u001F\u007F]/;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: false });

/** Our own failure marker: a fixed code and NOTHING else. */
function fail(code) {
  return { aionCode: code };
}

/**
 * The canonical form of an address, or null when it is not an address.
 *
 * The LOCAL PART keeps its case exactly as written: an address is an
 * identifier the owner asked for, and no provider-specific normalisation
 * (Gmail dots, `+tag` stripping, ...) is applied, because those rules are
 * provider guesses about an account the owner knows by name.
 */
export function canonicalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_EMAIL_CHARS) return null;
  if (FORBIDDEN.test(trimmed)) return null;
  const at = trimmed.indexOf('@');
  if (at <= 0 || at !== trimmed.lastIndexOf('@')) return null;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  if (!local || local.length > MAX_LOCAL_CHARS) return null;
  if (!LOCAL_PART.test(local)) return null;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null;
  if (!domain || domain.length > 255) return null;
  const labels = domain.split('.');
  if (labels.length < 2) return null;
  for (const label of labels) {
    if (!DOMAIN_LABEL.test(label)) return null;
  }
  if (!/^[A-Za-z]{2,}$/.test(labels[labels.length - 1])) return null;
  return `${local}@${domain}`;
}

/** The request origin, or null when the page is not the allowed origin. */
function resolveOrigin(rawUrl) {
  const candidate = typeof rawUrl === 'string' && rawUrl
    ? rawUrl
    : (globalThis.location && typeof globalThis.location.href === 'string' ? globalThis.location.href : '');
  if (!candidate) return null;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.hostname.toLowerCase() !== 'chatgpt.com') return null;
  if (parsed.port && parsed.port !== '443') return null;
  return REGISTRATION_EMAIL_ORIGIN;
}

function toBytes(chunk) {
  if (chunk instanceof Uint8Array) return chunk;
  if (chunk instanceof ArrayBuffer) return new Uint8Array(chunk);
  if (typeof chunk === 'string') return encoder.encode(chunk);
  if (chunk && typeof chunk === 'object' && typeof chunk.byteLength === 'number') {
    return new Uint8Array(chunk.buffer ? chunk.buffer : chunk);
  }
  return new Uint8Array(0);
}

/** The declared length, when the response advertises a usable one. */
function declaredLength(response) {
  const headers = response && response.headers;
  if (!headers || typeof headers.get !== 'function') return null;
  let raw;
  try {
    raw = headers.get('content-length');
  } catch {
    return null;
  }
  if (raw === null || raw === undefined || raw === '') return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/**
 * Run `promise` under the deadline and the caller's abort.
 *
 * The deadline covers the WHOLE operation: the request AND the body read. The
 * abort is the caller's, and it wins over the deadline when both happen.
 */
function withLimits(promise, { deadlineAt, signal }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;
    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (signal && typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', onAbort);
      }
    };
    const finish = (settle, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      settle(value);
    };
    function onAbort() {
      finish(reject, fail(REGISTRATION_EMAIL_CODE.ABORTED));
    }
    if (signal && signal.aborted) {
      onAbort();
      return;
    }
    if (signal && typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onAbort, { once: true });
    }
    const remaining = deadlineAt - Date.now();
    if (remaining <= 0) {
      finish(reject, fail(REGISTRATION_EMAIL_CODE.TIMEOUT));
      return;
    }
    timer = setTimeout(() => finish(reject, fail(REGISTRATION_EMAIL_CODE.TIMEOUT)), remaining);
    promise.then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error),
    );
  });
}

/**
 * Read the body through a BOUNDED stream reader.
 *
 * The declared `Content-Length` is advisory: a response that claims more than
 * the cap is refused before a byte is read, and the ACTUAL bytes are counted
 * as they arrive, because a lying header is exactly how an unbounded body
 * would slip past a cap.
 */
async function readBoundedBody(response, { deadlineAt, signal }) {
  const body = response && response.body;
  if (!body || typeof body.getReader !== 'function') {
    throw fail(REGISTRATION_EMAIL_CODE.BODY_UNREADABLE);
  }
  const reader = body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      if (Date.now() >= deadlineAt) throw fail(REGISTRATION_EMAIL_CODE.TIMEOUT);
      let pending;
      try {
        pending = Promise.resolve(reader.read());
      } catch {
        throw fail(REGISTRATION_EMAIL_CODE.BODY_UNREADABLE);
      }
      const step = await withLimits(pending, { deadlineAt, signal });
      if (!step || step.done) break;
      const bytes = toBytes(step.value);
      total += bytes.length;
      if (total > REGISTRATION_EMAIL_MAX_BYTES) {
        try {
          const cancelled = reader.cancel();
          if (cancelled && typeof cancelled.catch === 'function') cancelled.catch(() => {});
        } catch {
          /* a reader that cannot be cancelled is still abandoned */
        }
        throw fail(REGISTRATION_EMAIL_CODE.BODY_TOO_LARGE);
      }
      chunks.push(bytes);
    }
  } finally {
    try {
      if (typeof reader.releaseLock === 'function') reader.releaseLock();
    } catch {
      /* the lock is gone either way */
    }
  }
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return decoder.decode(merged);
}

/**
 * Read the registration email of the signed-in account, ONCE.
 *
 * @param {object} options
 * @param {Function} [options.fetchImpl]  injected fetch (defaults to globalThis.fetch)
 * @param {string}  [options.url]         the page URL; its origin must be chatgpt.com
 * @param {AbortSignal} [options.signal]  the caller's abort
 * @param {number}  [options.timeoutMs]   the whole-operation deadline (default 4000)
 * @returns {Promise<{ok: true, email: string} | {ok: false, code: string}>}
 */
export async function readChatGptRegistrationEmail({
  fetchImpl,
  url,
  signal,
  timeoutMs = REGISTRATION_EMAIL_TIMEOUT_MS,
} = {}) {
  const origin = resolveOrigin(url);
  if (!origin) return { ok: false, code: REGISTRATION_EMAIL_CODE.ORIGIN_NOT_ALLOWED };

  const doFetch = typeof fetchImpl === 'function' ? fetchImpl : globalThis.fetch;
  if (typeof doFetch !== 'function') {
    return { ok: false, code: REGISTRATION_EMAIL_CODE.FETCH_UNAVAILABLE };
  }

  const budget = Number.isSafeInteger(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : REGISTRATION_EMAIL_TIMEOUT_MS;
  const deadlineAt = Date.now() + budget;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, budget);
  const onCallerAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else if (typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  try {
    // An already aborted call never reaches the network.
    if (signal && signal.aborted) throw fail(REGISTRATION_EMAIL_CODE.ABORTED);
    const requestUrl = `${origin}${REGISTRATION_EMAIL_PATH}`;
    // No headers at all: this request carries the session cookie and nothing
    // else. There is no Authorization header to build and no token to read.
    const options = {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    };

    let response;
    let pending;
    try {
      pending = Promise.resolve(doFetch(requestUrl, options));
    } catch {
      // A fetch that throws synchronously is a rejected request, not a crash.
      pending = Promise.reject(fail(REGISTRATION_EMAIL_CODE.FETCH_REJECTED));
    }
    try {
      response = await withLimits(pending, { deadlineAt, signal });
    } catch (error) {
      if (error && typeof error.aionCode === 'string') throw error;
      if (signal && signal.aborted) throw fail(REGISTRATION_EMAIL_CODE.ABORTED);
      if (timedOut) throw fail(REGISTRATION_EMAIL_CODE.TIMEOUT);
      throw fail(REGISTRATION_EMAIL_CODE.FETCH_REJECTED);
    }

    if (signal && signal.aborted) throw fail(REGISTRATION_EMAIL_CODE.ABORTED);
    if (timedOut) throw fail(REGISTRATION_EMAIL_CODE.TIMEOUT);
    // `redirect: 'error'` normally makes the fetch throw; a response that
    // says it was redirected anyway is refused rather than followed.
    if (response && response.redirected === true) {
      throw fail(REGISTRATION_EMAIL_CODE.REDIRECT_REFUSED);
    }
    const status = Number(response && response.status);
    if (!response || response.ok !== true) {
      if (status === 401 || status === 403) throw fail(REGISTRATION_EMAIL_CODE.HTTP_UNAUTHORIZED);
      throw fail(REGISTRATION_EMAIL_CODE.HTTP_ERROR);
    }

    const declared = declaredLength(response);
    if (declared !== null && declared > REGISTRATION_EMAIL_MAX_BYTES) {
      throw fail(REGISTRATION_EMAIL_CODE.RESPONSE_TOO_LARGE);
    }

    const text = await readBoundedBody(response, { deadlineAt, signal });
    if (typeof text !== 'string') throw fail(REGISTRATION_EMAIL_CODE.BODY_UNREADABLE);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw fail(REGISTRATION_EMAIL_CODE.BODY_INVALID);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw fail(REGISTRATION_EMAIL_CODE.BODY_INVALID);
    }
    // THE ONLY FIELD READ. Nothing else in the response is touched, returned,
    // spread or logged.
    const user = parsed.user;
    if (!user || typeof user !== 'object' || Array.isArray(user)) {
      throw fail(REGISTRATION_EMAIL_CODE.EMAIL_MISSING);
    }
    const raw = user.email;
    if (raw === undefined || raw === null) throw fail(REGISTRATION_EMAIL_CODE.EMAIL_MISSING);
    const email = canonicalizeEmail(raw);
    if (!email) throw fail(REGISTRATION_EMAIL_CODE.EMAIL_INVALID);
    return { ok: true, email };
  } catch (error) {
    const code = error && typeof error.aionCode === 'string'
      ? error.aionCode
      : signal && signal.aborted
        ? REGISTRATION_EMAIL_CODE.ABORTED
        : timedOut
          ? REGISTRATION_EMAIL_CODE.TIMEOUT
          : REGISTRATION_EMAIL_CODE.INTERNAL_ERROR;
    return { ok: false, code };
  } finally {
    clearTimeout(timer);
    if (signal && typeof signal.removeEventListener === 'function') {
      signal.removeEventListener('abort', onCallerAbort);
    }
  }
}
