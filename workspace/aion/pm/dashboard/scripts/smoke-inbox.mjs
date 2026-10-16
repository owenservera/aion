// Offline smoke test for the inbox API handlers.
// Runs the real exported handlers with a stubbed global fetch, so it needs no
// network access and no GitHub token. Correlation: AION-BFF-003-VERCEL-INBOX.

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.join(here, '..', 'api');

const send = require(path.join(apiDir, 'inbox', 'send.js'));
const recent = require(path.join(apiDir, 'inbox', 'recent.js'));

let pass = 0;
let fail = 0;

function ok(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? ' -> ' + extra : ''}`);
  }
}

function eq(name, actual, expected) {
  ok(name, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`);
}

function fakeRes() {
  const r = { statusCode: 0, headers: {}, body: '', ended: false };
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; };
  r.end = (b) => { r.body = b == null ? '' : String(b); r.ended = true; };
  return r;
}

/** A GitHub comments-list response, optionally carrying a `Link` header. */
function ghList(items, { link = null, status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => (String(k).toLowerCase() === 'link' ? link : null) },
    json: async () => items,
  };
}

/** GitHub comment shape; ids and timestamps both increase with `i`. */
function cmt(i) {
  return {
    id: 100 + i,
    user: { login: `user${i}` },
    created_at: new Date(Date.UTC(2026, 9, 16, 0, i)).toISOString(),
    body: `line one\nline two   with   spaces ${i}`,
    html_url: `https://github.com/owenservera/aion/issues/14#issuecomment-${100 + i}`,
  };
}

const COMMENTS_BASE = 'https://api.github.com/repos/owenservera/aion/issues/14/comments';

async function call(handler, { method = 'POST', url = '/api/inbox/send', body, headers } = {}) {
  const req = { method, url, headers: headers || {}, body };
  const res = fakeRes();
  await handler(req, res);
  let json = null;
  try { json = JSON.parse(res.body); } catch (_) { /* leave null */ }
  return { res, json };
}

async function withToken(token, fn) {
  const savedG = process.env.GITHUB_TOKEN;
  const savedA = process.env.AION_GITHUB_TOKEN;
  const savedFetch = globalThis.fetch;
  try {
    delete process.env.GITHUB_TOKEN;
    delete process.env.AION_GITHUB_TOKEN;
    if (token) process.env.GITHUB_TOKEN = token;
    // Any fetch that escapes the stub is a bug in this harness, not a live call.
    globalThis.fetch = async () => { throw new Error('UNSTUBBED FETCH: harness tried to reach the network'); };
    return await fn();
  } finally {
    globalThis.fetch = savedFetch;
    if (savedG === undefined) delete process.env.GITHUB_TOKEN; else process.env.GITHUB_TOKEN = savedG;
    if (savedA === undefined) delete process.env.AION_GITHUB_TOKEN; else process.env.AION_GITHUB_TOKEN = savedA;
  }
}

const SECRET = 'ghp_FAKE_TOKEN_FOR_TESTS_ONLY_not_real_0123456789';

console.log('\nAION-BFF-003-VERCEL-INBOX :: inbox API smoke (offline, mocked fetch)\n');

// ---------------------------------------------------------------- 1. no token -> 503
console.log('1. Missing token must yield 503 and never call GitHub');
await withToken(null, async () => {
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('fetch must not run'); };

  const s = await call(send, { body: { text: 'hello' } });
  ok('send -> 503', s.res.statusCode === 503, `status ${s.res.statusCode}`);
  eq('send -> ok:false', s.json && s.json.ok, false);
  eq(
    'send -> actionable error text',
    s.json && s.json.error,
    'GITHUB_TOKEN (or AION_GITHUB_TOKEN) not configured on server'
  );

  const r = await call(recent, { method: 'GET', url: '/api/inbox/recent' });
  ok('recent -> 503', r.res.statusCode === 503, `status ${r.res.statusCode}`);
  eq('recent -> same error text', r.json && r.json.error, s.json && s.json.error);
  ok('no network call attempted', called === false);
  ok('error body contains no token material', !/gh[pousr]_/.test(s.res.body));
});

// ---------------------------------------------------------------- 2. send success mapping
console.log('\n2. send: success mapping, marker line, PENDING_AION_READ');
await withToken(SECRET, async () => {
  let seenUrl = null;
  let seenInit = null;
  let seenHeaders = null;
  globalThis.fetch = async (url, init) => {
    seenUrl = url; seenInit = init; seenHeaders = init.headers;
    return {
      ok: true,
      status: 201,
      json: async () => ({
        id: 6206813304,
        html_url: 'https://github.com/owenservera/aion/issues/14#issuecomment-6206813304',
        created_at: '2026-10-16T02:39:53Z',
        body: 'echo',
      }),
    };
  };

  const out = await call(send, { body: { text: '  AION-BFF-003 smoke note  ' } });
  ok('status 200', out.res.statusCode === 200, `status ${out.res.statusCode}`);
  eq('ok:true', out.json.ok, true);
  eq('commentId <- id', out.json.commentId, 6206813304);
  eq('htmlUrl <- html_url', out.json.htmlUrl, 'https://github.com/owenservera/aion/issues/14#issuecomment-6206813304');
  eq('createdAt <- created_at', out.json.createdAt, '2026-10-16T02:39:53Z');
  eq('status is PENDING_AION_READ', out.json.status, 'PENDING_AION_READ');
  ok('no ACK/woken wording', !/ack|woken|awake|chatgpt/i.test(out.res.body), out.res.body);

  eq('posts to issue 14 comments', seenUrl, 'https://api.github.com/repos/owenservera/aion/issues/14/comments');
  eq('uses POST', seenInit.method, 'POST');
  eq('Accept header', seenHeaders.Accept, 'application/vnd.github+json');
  eq('API version header', seenHeaders['X-GitHub-Api-Version'], '2022-11-28');
  eq('User-Agent header', seenHeaders['User-Agent'], 'aion-pm-dashboard');
  ok('Authorization carries the server-side token', seenHeaders.Authorization === `Bearer ${SECRET}`);

  const sent = JSON.parse(seenInit.body);
  ok('body starts with the marker line', sent.body.startsWith('[AION→BFF via dashboard]\n\n'), JSON.stringify(sent.body.slice(0, 40)));
  ok('user text is preserved after the marker', sent.body.endsWith('AION-BFF-003 smoke note'), JSON.stringify(sent.body));
  ok('response never echoes the token', !out.res.body.includes(SECRET));
});

// ---------------------------------------------------------------- 3. aliases + validation
console.log('\n3. send: body aliases and input validation');
await withToken(SECRET, async () => {
  globalThis.fetch = async () => ({ ok: true, status: 201, json: async () => ({ id: 1, html_url: 'u', created_at: 'c' }) });

  const alias = await call(send, { body: JSON.stringify({ message: 'via message alias' }) });
  ok('accepts raw string body + message alias', alias.res.statusCode === 200, `status ${alias.res.statusCode}`);

  for (const [label, payload] of [
    ['missing text', {}],
    ['empty text', { text: '   ' }],
    ['non-string text', { text: 42 }],
  ]) {
    const bad = await call(send, { body: payload });
    ok(`${label} -> 400`, bad.res.statusCode === 400, `status ${bad.res.statusCode}`);
    ok(`${label} -> ok:false`, bad.json && bad.json.ok === false);
  }

  const malformed = await call(send, { body: '{not json' });
  ok('malformed JSON -> 400', malformed.res.statusCode === 400, `status ${malformed.res.statusCode}`);
});

// ---------------------------------------------------------------- 4. GitHub errors
console.log('\n4. send/recent: GitHub error forwarding without secrets');
await withToken(SECRET, async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ message: 'Not Found' }),
  });
  const r = await call(send, { body: { text: 'x' } });
  ok('4xx forwarded as-is', r.res.statusCode === 404, `status ${r.res.statusCode}`);
  eq('ok:false', r.json.ok, false);
  ok('error mentions GitHub message', /Not Found/.test(r.json.error), r.json.error);
  ok('no token in error', !r.res.body.includes(SECRET));

  // A hostile/verbose GitHub message must be scrubbed of token-like material.
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: `Bad credentials for ${SECRET}` }),
  });
  const leaked = await call(send, { body: { text: 'x' } });
  ok('token scrubbed from GitHub error', !leaked.res.body.includes(SECRET), leaked.res.body);
  ok('redaction marker present', /\[REDACTED\]/.test(leaked.res.body));

  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ message: 'boom' }) });
  const five = await call(recent, { method: 'GET', url: '/api/inbox/recent' });
  ok('5xx collapses to 502', five.res.statusCode === 502, `status ${five.res.statusCode}`);

  globalThis.fetch = async () => { throw new Error('socket hang up'); };
  const net = await call(recent, { method: 'GET', url: '/api/inbox/recent' });
  ok('network failure -> 502', net.res.statusCode === 502, `status ${net.res.statusCode}`);
  ok('network failure message is generic', !/socket hang up/.test(net.res.body), net.res.body);
});

// ---------------------------------------------------------------- 5. recent readback
console.log('\n5. recent: newest-first ordering, limit clamp, truncation');
await withToken(SECRET, async () => {
  let seenUrl = null;
  const many = Array.from({ length: 12 }, (_, i) => cmt(i));
  globalThis.fetch = async (url) => {
    seenUrl = url;
    return ghList(many);
  };

  const out = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
  ok('status 200', out.res.statusCode === 200, `status ${out.res.statusCode}`);
  eq('10 comments returned', out.json.comments.length, 10);
  ok(
    'newest first',
    out.json.comments[0].id === 111 && out.json.comments[out.json.comments.length - 1].id === 102,
    `first=${out.json.comments[0].id} last=${out.json.comments[out.json.comments.length - 1].id}`
  );
  eq('author <- user.login', out.json.comments[0].author, 'user11');
  eq('htmlUrl mapped', out.json.comments[0].htmlUrl, 'https://github.com/owenservera/aion/issues/14#issuecomment-111');
  eq('body flattened to one line', out.json.comments[0].bodyTruncated, 'line one line two with spaces 11');
  ok('per_page/page query sent', /per_page=10&page=1$/.test(seenUrl), seenUrl);
  ok('no token in payload', !out.res.body.includes(SECRET));

  await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=999' });
  ok('limit clamped to 30', /per_page=30/.test(seenUrl), seenUrl);

  await call(recent, { method: 'GET', url: '/api/inbox/recent' });
  ok('default limit is 10', /per_page=10/.test(seenUrl), seenUrl);

  await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=abc' });
  ok('garbage limit falls back to 10', /per_page=10/.test(seenUrl), seenUrl);

  globalThis.fetch = async () => ghList([{ ...cmt(0), body: 'y'.repeat(400) }]);
  const long = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=1' });
  ok('bodyTruncated is ~200 chars', long.json.comments[0].bodyTruncated.length === 200, `len ${long.json.comments[0].bodyTruncated.length}`);
  ok('bodyTruncated ends with an ellipsis', long.json.comments[0].bodyTruncated.endsWith('…'));

  globalThis.fetch = async () => ghList({ nope: true });
  const bad = await call(recent, { method: 'GET', url: '/api/inbox/recent' });
  ok('non-array GitHub body -> 502', bad.res.statusCode === 502, `status ${bad.res.statusCode}`);
});

// ---------------------------------------------------------------- 6. last-page discovery
console.log('\n6. recent: newest comments come from the LAST page (oldest-first API)');
await withToken(SECRET, async () => {
  const LINK_3_PAGES =
    `<${COMMENTS_BASE}?per_page=10&page=2>; rel="next", ` +
    `<${COMMENTS_BASE}?per_page=10&page=3>; rel="last"`;

  // 30 comments, ids 100..129, oldest-first, 10 per page.
  const page1 = Array.from({ length: 10 }, (_, i) => cmt(i));
  const page3 = Array.from({ length: 10 }, (_, i) => cmt(20 + i));

  let urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    if (/page=3$/.test(url)) return ghList(page3);
    return ghList(page1, { link: LINK_3_PAGES });
  };

  const out = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
  ok('status 200', out.res.statusCode === 200, `status ${out.res.statusCode}`);
  eq('two requests made (discover + last page)', urls.length, 2);
  eq('first request is page 1 of 10 per page', urls[0], `${COMMENTS_BASE}?per_page=10&page=1`);
  eq('second request uses the Link rel="last" page', urls[1], `${COMMENTS_BASE}?per_page=10&page=3`);
  ok('per_page is identical on both requests', /per_page=10/.test(urls[0]) && /per_page=10/.test(urls[1]));

  eq('10 comments returned', out.json.comments.length, 10);
  eq('newest comment is first', out.json.comments[0].id, 129);
  eq('oldest of the last page is last', out.json.comments[out.json.comments.length - 1].id, 120);
  ok(
    'no oldest-page comments leak in',
    out.json.comments.every((c) => c.id >= 120),
    JSON.stringify(out.json.comments.map((c) => c.id))
  );

  // Single page: no Link header at all -> exactly one request, data reused as-is.
  urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return ghList(page1);
  };
  const single = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
  ok('no Link -> 200', single.res.statusCode === 200, `status ${single.res.statusCode}`);
  eq('no Link -> single request only', urls.length, 1);
  eq('no Link -> page 1 used as-is', urls[0], `${COMMENTS_BASE}?per_page=10&page=1`);
  eq('no Link -> newest of that page first', single.json.comments[0].id, 109);

  // rel="next" but no rel="last": nothing to discover, stay on one request.
  urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return ghList(page1, { link: `<${COMMENTS_BASE}?per_page=10&page=2>; rel="next"` });
  };
  const nextOnly = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
  ok('next-only Link -> 200', nextOnly.res.statusCode === 200, `status ${nextOnly.res.statusCode}`);
  eq('next-only Link -> single request', urls.length, 1);

  // rel="last" pointing at page 1 is a no-op.
  urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return ghList(page1, { link: `<${COMMENTS_BASE}?per_page=10&page=1>; rel="last"` });
  };
  await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
  eq('rel="last" page=1 -> single request', urls.length, 1);

  // Garbage Link headers must not produce a bogus page request.
  for (const link of ['garbage', '<nope>; rel="last"', `<${COMMENTS_BASE}?rel="last"`, ';;;']) {
    urls = [];
    globalThis.fetch = async (url) => {
      urls.push(url);
      return ghList(page1, { link });
    };
    const junk = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
    ok(`malformed Link ${JSON.stringify(link)} -> 200`, junk.res.statusCode === 200, `status ${junk.res.statusCode}`);
    eq(`malformed Link ${JSON.stringify(link)} -> single request`, urls.length, 1);
  }

  // limit drives per_page on both requests, so last-page maths stays consistent.
  urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    if (/page=2$/.test(url)) return ghList(page1);
    return ghList(page1, {
      link: `<${COMMENTS_BASE}?per_page=30&page=2>; rel="last"`,
    });
  };
  const wide = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=30' });
  ok('limit=30 -> 200', wide.res.statusCode === 200, `status ${wide.res.statusCode}`);
  eq('limit=30 discovery request', urls[0], `${COMMENTS_BASE}?per_page=30&page=1`);
  eq('limit=30 last-page request', urls[1], `${COMMENTS_BASE}?per_page=30&page=2`);

  // A failing last-page fetch must surface, not silently fall back to page 1.
  urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    if (/page=3$/.test(url)) return ghList([], { status: 500 });
    return ghList(page1, { link: LINK_3_PAGES });
  };
  const late = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
  ok('last-page 5xx -> 502 (no silent oldest-page fallback)', late.res.statusCode === 502, `status ${late.res.statusCode}`);
  eq('last-page failure body', late.json && late.json.ok, false);

  urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    if (/page=3$/.test(url)) throw new Error('socket hang up');
    return ghList(page1, { link: LINK_3_PAGES });
  };
  const dead = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
  ok('last-page network failure -> 502', dead.res.statusCode === 502, `status ${dead.res.statusCode}`);
  ok('last-page network failure message is generic', !/socket hang up/.test(dead.res.body), dead.res.body);

  urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    if (/page=3$/.test(url)) return ghList({ nope: true });
    return ghList(page1, { link: LINK_3_PAGES });
  };
  const weird = await call(recent, { method: 'GET', url: '/api/inbox/recent?limit=10' });
  ok('last-page non-array body -> 502', weird.res.statusCode === 502, `status ${weird.res.statusCode}`);
});

// ---------------------------------------------------------------- 7. method handling
console.log('\n7. Method handling and OPTIONS');
await withToken(SECRET, async () => {
  globalThis.fetch = async () => { throw new Error('fetch must not run'); };
  const wrong = await call(send, { method: 'GET', url: '/api/inbox/send' });
  ok('GET on /send -> 405', wrong.res.statusCode === 405, `status ${wrong.res.statusCode}`);

  const wrong2 = await call(recent, { method: 'POST', url: '/api/inbox/recent' });
  ok('POST on /recent -> 405', wrong2.res.statusCode === 405, `status ${wrong2.res.statusCode}`);

  const opt = await call(send, { method: 'OPTIONS', url: '/api/inbox/send' });
  ok('OPTIONS -> 204', opt.res.statusCode === 204, `status ${opt.res.statusCode}`);
  eq('Allow header advertised', opt.res.headers.allow, 'GET, POST, OPTIONS');
});

console.log(`\nResult: ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);