// AION P2 — account REGISTRATION email read.
//
// The properties held here:
//   1. one explicit request, one origin, one deadline, one bounded body read
//   2. exactly one field is projected: user.email
//   3. every failure is a FIXED code: no status, no URL, no body, no exception
//      message, and never a token
//   4. an oversized body is refused by the ACTUAL bytes, not by the header
//   5. the local part keeps its case and is never provider-normalised
//
// No browser, no network, no donor code: fake bounded streams and a fake fetch.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  readChatGptRegistrationEmail,
  canonicalizeEmail,
  REGISTRATION_EMAIL_CODE,
  REGISTRATION_EMAIL_MAX_BYTES,
  REGISTRATION_EMAIL_PATH,
  REGISTRATION_EMAIL_TIMEOUT_MS,
} from '../src/providers/chatgpt/account-registration.js';

const PAGE_URL = 'https://chatgpt.com/c/12345678-abcd';
const SECRET_TOKEN = 'sk-super-secret-access-token-value';

/* ------------------------------------------------------------------ fakes */

/** A bounded fake stream: the chunks it is given, then done (or a hang). */
function fakeStream(chunks, { hang = false } = {}) {
  let index = 0;
  return {
    getReader() {
      return {
        async read() {
          if (index < chunks.length) {
            const value = chunks[index];
            index += 1;
            return { done: false, value };
          }
          if (hang) return new Promise(() => {}); // never settles
          return { done: true, value: undefined };
        },
        async cancel() {},
        releaseLock() {},
      };
    },
  };
}

function fakeResponse({
  status = 200,
  ok,
  redirected = false,
  headers = {},
  chunks = [],
  hang = false,
} = {}) {
  return {
    ok: ok === undefined ? status >= 200 && status < 300 : ok,
    status,
    redirected,
    headers: { get: (name) => headers[String(name).toLowerCase()] ?? null },
    body: fakeStream(chunks, { hang }),
  };
}

/** A fetch that records its calls and answers with one canned response. */
function fakeFetch(response) {
  const calls = [];
  const impl = async (url, options) => {
    calls.push({ url, options });
    if (response instanceof Error) throw response;
    return response;
  };
  impl.calls = calls;
  return impl;
}

function jsonChunks(payload, { chunkSize = 64 } = {}) {
  const text = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(text);
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(bytes.slice(i, i + chunkSize));
  }
  return chunks;
}

/* --------------------------------------------------------------- the happy path */

test('the success path returns exactly the email and nothing else', async () => {
  const fetchImpl = fakeFetch(fakeResponse({
    chunks: jsonChunks({ user: { email: 'Owner.Name@Example.com' } }),
  }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.deepEqual(result, { ok: true, email: 'Owner.Name@example.com' });
  assert.deepEqual(Object.keys(result).sort(), ['email', 'ok']);
  assert.equal(fetchImpl.calls.length, 1);
});

test('the request is the one registration endpoint, with the fixed options', async () => {
  const fetchImpl = fakeFetch(fakeResponse({
    chunks: jsonChunks({ user: { email: 'owner@example.com' } }),
  }));
  await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  const [call] = fetchImpl.calls;
  assert.equal(call.url, `https://chatgpt.com${REGISTRATION_EMAIL_PATH}`);
  assert.equal(call.url.includes('/backend-api'), false);
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.credentials, 'include');
  assert.equal(call.options.cache, 'no-store');
  assert.equal(call.options.redirect, 'error');
  assert.equal(typeof call.options.signal, 'object');
  assert.ok(call.options.signal);
  assert.equal(call.options.headers, undefined, 'no Authorization header is ever built');
});

test('the default deadline is four seconds', async () => {
  assert.equal(REGISTRATION_EMAIL_TIMEOUT_MS, 4000);
  const fetchImpl = fakeFetch(fakeResponse({
    chunks: jsonChunks({ user: { email: 'owner@example.com' } }),
  }));
  const before = Date.now();
  await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.ok(Date.now() - before < REGISTRATION_EMAIL_TIMEOUT_MS);
});

/* ------------------------------------------------------------- the projection */

test('only the email leaves: privileged user fields are discarded', async () => {
  const fetchImpl = fakeFetch(fakeResponse({
    chunks: jsonChunks({
      user: {
        email: 'owner@example.com',
        id: 'user_123',
        role: 'owner',
        is_admin: true,
        plan: 'enterprise',
        organization_ids: ['org_1'],
      },
      accessToken: SECRET_TOKEN,
      expires: 'never',
    }),
  }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.deepEqual(result, { ok: true, email: 'owner@example.com' });
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(SECRET_TOKEN), false, 'no token may appear in the result');
  assert.equal(serialized.includes('is_admin'), false);
  assert.equal(serialized.includes('org_1'), false);
});

test('a missing email is refused with a fixed code', async () => {
  for (const payload of [{}, { user: {} }, { user: { id: 'u1' } }, { user: null }]) {
    const fetchImpl = fakeFetch(fakeResponse({ chunks: jsonChunks(payload) }));
    const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
    assert.equal(result.ok, false);
    assert.equal(result.code, REGISTRATION_EMAIL_CODE.EMAIL_MISSING, JSON.stringify(payload));
    assert.deepEqual(Object.keys(result).sort(), ['code', 'ok']);
  }
});

test('an invalid email is refused with a fixed code', async () => {
  const invalid = [
    'not-an-email',
    'a@b@c.com',
    '@example.com',
    'owner@',
    'owner@localhost',
    'owner @example.com',
    'owner@exa mple.com',
    'owner@example.c',
    `${'a'.repeat(250)}@example.com`,
    'own..er@example.com',
    '.owner@example.com',
  ];
  for (const email of invalid) {
    const fetchImpl = fakeFetch(fakeResponse({ chunks: jsonChunks({ user: { email } }) }));
    const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
    assert.equal(result.ok, false, email);
    assert.equal(result.code, REGISTRATION_EMAIL_CODE.EMAIL_INVALID, email);
    assert.deepEqual(Object.keys(result).sort(), ['code', 'ok']);
  }
});

test('a non-string email is invalid, not missing', async () => {
  const fetchImpl = fakeFetch(fakeResponse({ chunks: jsonChunks({ user: { email: 42 } }) }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.EMAIL_INVALID);
});

test('a body that is not JSON is refused without leaking its text', async () => {
  const fetchImpl = fakeFetch(fakeResponse({
    chunks: [new TextEncoder().encode(`not json ${SECRET_TOKEN}`)],
  }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.BODY_INVALID);
  assert.equal(JSON.stringify(result).includes(SECRET_TOKEN), false);
});

/* ---------------------------------------------------------------- the failures */

test('an unauthorized session is refused with a fixed code', async () => {
  const fetchImpl = fakeFetch(fakeResponse({ status: 401, chunks: [] }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.HTTP_UNAUTHORIZED);
  assert.deepEqual(Object.keys(result).sort(), ['code', 'ok']);
});

test('a server error is refused with a fixed code', async () => {
  const fetchImpl = fakeFetch(fakeResponse({ status: 500, chunks: [] }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.HTTP_ERROR);
});

test('a redirected response is refused, never followed', async () => {
  const fetchImpl = fakeFetch(fakeResponse({
    status: 200,
    ok: true,
    redirected: true,
    chunks: jsonChunks({ user: { email: 'owner@example.com' } }),
  }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.REDIRECT_REFUSED);
});

test('a rejected fetch is refused without its message', async () => {
  const fetchImpl = fakeFetch(new Error(`network down ${SECRET_TOKEN}`));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.FETCH_REJECTED);
  assert.deepEqual(Object.keys(result).sort(), ['code', 'ok']);
  assert.equal(JSON.stringify(result).includes(SECRET_TOKEN), false);
});

test('a fetch that throws synchronously is a rejected request, not a crash', async () => {
  const fetchImpl = () => { throw new Error(`sync boom ${SECRET_TOKEN}`); };
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.FETCH_REJECTED);
  assert.equal(JSON.stringify(result).includes(SECRET_TOKEN), false);
});

test('a timeout while the body is still arriving is refused as a timeout', async () => {
  const fetchImpl = fakeFetch(fakeResponse({
    chunks: [new TextEncoder().encode('{"user":{"email":"own')],
    hang: true,
  }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL, timeoutMs: 40 });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.TIMEOUT);
  assert.deepEqual(Object.keys(result).sort(), ['code', 'ok']);
});

test('the caller abort is honoured and reported as an abort', async () => {
  const controller = new AbortController();
  const fetchImpl = fakeFetch(fakeResponse({
    chunks: [new TextEncoder().encode('{"user":{"email":"own')],
    hang: true,
  }));
  const pending = readChatGptRegistrationEmail({
    fetchImpl,
    url: PAGE_URL,
    signal: controller.signal,
    timeoutMs: 5000,
  });
  controller.abort();
  const result = await pending;
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.ABORTED);
});

test('an already aborted signal never issues a request', async () => {
  const controller = new AbortController();
  controller.abort();
  const fetchImpl = fakeFetch(fakeResponse({ chunks: [] }));
  const result = await readChatGptRegistrationEmail({
    fetchImpl,
    url: PAGE_URL,
    signal: controller.signal,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.ABORTED);
  assert.equal(fetchImpl.calls.length, 0);
});

/* --------------------------------------------------------------- the bounds */

test('a declared length over the cap is refused before the body is read', async () => {
  const fetchImpl = fakeFetch(fakeResponse({
    headers: { 'content-length': String(REGISTRATION_EMAIL_MAX_BYTES + 1) },
    chunks: jsonChunks({ user: { email: 'owner@example.com' } }),
  }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.RESPONSE_TOO_LARGE);
});

test('a lying content length cannot smuggle an oversized body past the cap', async () => {
  const big = jsonChunks({ user: { email: 'owner@example.com' }, filler: 'x'.repeat(20000) }, { chunkSize: 4096 });
  const fetchImpl = fakeFetch(fakeResponse({
    headers: { 'content-length': '12' }, // advisory, and a lie
    chunks: big,
  }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.BODY_TOO_LARGE);
  assert.deepEqual(Object.keys(result).sort(), ['code', 'ok']);
});

test('a body just under the cap is still read', async () => {
  const filler = 'x'.repeat(REGISTRATION_EMAIL_MAX_BYTES - 200);
  const fetchImpl = fakeFetch(fakeResponse({
    chunks: jsonChunks({ user: { email: 'owner@example.com' }, filler }),
  }));
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, true);
  assert.equal(result.email, 'owner@example.com');
});

test('a response without a readable stream is not readable here', async () => {
  const fetchImpl = fakeFetch({
    ok: true,
    status: 200,
    redirected: false,
    headers: { get: () => null },
    body: null,
  });
  const result = await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(result.ok, false);
  assert.equal(result.code, REGISTRATION_EMAIL_CODE.BODY_UNREADABLE);
});

/* ----------------------------------------------------------------- the origin */

test('any origin other than chatgpt.com is refused without a request', async () => {
  const urls = [
    'https://example.com/',
    'http://chatgpt.com/',
    'https://chat.openai.com/c/12345678-abcd',
    'https://evil.chatgpt.com/',
    'https://chatgpt.com.evil.test/',
    'not a url',
    '',
  ];
  for (const url of urls) {
    const fetchImpl = fakeFetch(fakeResponse({ chunks: [] }));
    const result = await readChatGptRegistrationEmail({ fetchImpl, url });
    assert.equal(result.ok, false, url);
    assert.equal(result.code, REGISTRATION_EMAIL_CODE.ORIGIN_NOT_ALLOWED, url);
    assert.equal(fetchImpl.calls.length, 0, url);
  }
});

/* ------------------------------------------------------------------ one shot */

test('exactly one request is made and nothing is retried', async () => {
  const fetchImpl = fakeFetch(fakeResponse({ status: 500, chunks: [] }));
  await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(fetchImpl.calls.length, 1);
});

test('a failed call is never retried', async () => {
  const fetchImpl = fakeFetch(new Error('boom'));
  await readChatGptRegistrationEmail({ fetchImpl, url: PAGE_URL });
  assert.equal(fetchImpl.calls.length, 1);
});

/* ---------------------------------------------------------- the address rules */

test('the local part keeps its case and is never provider-normalised', () => {
  assert.equal(canonicalizeEmail('Owner.Name+tag@Example.COM'), 'Owner.Name+tag@example.com');
  assert.equal(canonicalizeEmail('first.last@gmail.com'), 'first.last@gmail.com');
  assert.equal(canonicalizeEmail('firstlast@gmail.com'), 'firstlast@gmail.com');
  assert.equal(canonicalizeEmail('  spaced@example.com  '), 'spaced@example.com');
  assert.equal(canonicalizeEmail('no-at-sign'), null);
  assert.equal(canonicalizeEmail(''), null);
  assert.equal(canonicalizeEmail(null), null);
  // Surrounding whitespace is trimmed; whitespace or control INSIDE the
  // address is refused.
  assert.equal(canonicalizeEmail('owner@example.com\n'), 'owner@example.com');
  assert.equal(canonicalizeEmail('own\ner@example.com'), null);
  assert.equal(canonicalizeEmail('owner@example.com\r\n'), 'owner@example.com');
  assert.equal(canonicalizeEmail('owner\t@example.com'), null);
});
