// GET /api/inbox/recent?limit=10
// Read-only readback of the newest comments on owenservera/aion#14.

const {
  getToken,
  commentsUrl,
  githubFetch,
  parseLinkLastPage,
  readLinkHeader,
  readError,
  sendJson,
  sendNoToken,
  preflight,
  oneLine,
} = require('../_lib/github.js');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

function parseLimit(raw) {
  const n = Number.parseInt(String(raw == null ? '' : raw), 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;

  const method = (req.method || '').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    sendJson(res, 405, { ok: false, error: 'Use GET' });
    return;
  }

  const token = getToken();
  if (!token) {
    sendNoToken(res);
    return;
  }

  let limit = DEFAULT_LIMIT;
  try {
    const u = new URL(req.url || 'http://localhost/', 'http://localhost');
    limit = parseLimit(u.searchParams.get('limit'));
  } catch (_) {
    /* keep the default */
  }

  let res2;
  try {
    res2 = await githubFetch(token, commentsUrl(`per_page=${limit}&page=1`), { method: 'GET' });
  } catch (err) {
    sendJson(res, 502, { ok: false, error: 'Could not reach GitHub API' });
    return;
  }

  if (!res2.ok) {
    const error = await readError(res2, token);
    const status = res2.status >= 400 && res2.status < 500 ? res2.status : 502;
    sendJson(res, status, { ok: false, error });
    return;
  }

  let list;
  try {
    list = await res2.json();
  } catch (_) {
    sendJson(res, 502, { ok: false, error: 'GitHub returned an unreadable body' });
    return;
  }

  if (!Array.isArray(list)) {
    sendJson(res, 502, { ok: false, error: 'GitHub returned an unexpected body' });
    return;
  }

  // GitHub pages issue comments oldest-first, so the page above is the OLDEST
  // batch. The newest `limit` comments only exist on the LAST page, whose index
  // is advertised by this same response's Link header — so the first request is
  // page 1 with the final per_page, and the page numbers stay meaningful. No
  // Link header (or a last page of 1) means the whole issue fits in one page and
  // what we already hold is the newest data available.
  const lastPage = parseLinkLastPage(readLinkHeader(res2));
  if (lastPage && lastPage > 1) {
    let last;
    try {
      last = await githubFetch(token, commentsUrl(`per_page=${limit}&page=${lastPage}`), {
        method: 'GET',
      });
    } catch (_) {
      sendJson(res, 502, { ok: false, error: 'Could not reach GitHub API' });
      return;
    }

    if (!last.ok) {
      const error = await readError(last, token);
      const status = last.status >= 400 && last.status < 500 ? last.status : 502;
      sendJson(res, status, { ok: false, error });
      return;
    }

    let lastList;
    try {
      lastList = await last.json();
    } catch (_) {
      sendJson(res, 502, { ok: false, error: 'GitHub returned an unreadable body' });
      return;
    }

    if (!Array.isArray(lastList)) {
      sendJson(res, 502, { ok: false, error: 'GitHub returned an unexpected body' });
      return;
    }

    list = lastList;
  }

  // Within the page GitHub still returns oldest-first; readback wants newest-first.
  const newestFirst = list
    .slice()
    .sort((a, b) => {
      const ta = Date.parse(a && a.created_at) || 0;
      const tb = Date.parse(b && b.created_at) || 0;
      if (tb !== ta) return tb - ta;
      return ((b && b.id) || 0) - ((a && a.id) || 0);
    })
    .slice(0, limit);

  sendJson(res, 200, {
    ok: true,
    comments: newestFirst.map((c) => ({
      id: c && c.id,
      author: (c && c.user && c.user.login) || 'unknown',
      createdAt: (c && c.created_at) || null,
      bodyTruncated: oneLine(c && c.body, 200),
      htmlUrl: (c && c.html_url) || null,
    })),
  });
};