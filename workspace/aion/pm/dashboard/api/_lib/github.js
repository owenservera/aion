// Shared helpers for the AION inbox API. No dependencies, CommonJS, Node 18+ (global fetch).
// SECURITY: the GitHub token is read from the server environment only. It is never
// returned in a response, never logged and never sent to the browser.

const OWNER = 'owenservera/aion';
const ISSUE_NUMBER = 14;
const API_BASE = 'https://api.github.com';
const USER_AGENT = 'aion-pm-dashboard';
const API_VERSION = '2022-11-28';

const TOKEN_MISSING =
  'GITHUB_TOKEN (or AION_GITHUB_TOKEN) not configured on server';

function getToken() {
  const t = process.env.GITHUB_TOKEN || process.env.AION_GITHUB_TOKEN;
  return typeof t === 'string' && t.trim() ? t.trim() : null;
}

function commentsUrl(query) {
  return (
    `${API_BASE}/repos/${OWNER}/issues/${ISSUE_NUMBER}/comments` +
    (query ? `?${query}` : '')
  );
}

/**
 * Strip anything that could carry a secret out of a message before it is sent
 * to the browser. GitHub error bodies are echoed back verbatim, so this is a
 * hard requirement, not a nicety.
 */
function redact(value, token) {
  let s = typeof value === 'string' ? value : String(value ?? '');
  if (token) s = s.split(token).join('[REDACTED]');
  return s
    .replace(/gh[pousr]_[A-Za-z0-9]{16,}/g, '[REDACTED]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .slice(0, 500);
}

async function githubFetch(token, url, init) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': USER_AGENT,
      ...(init && init.headers ? init.headers : {}),
    },
  });
}

/**
 * This endpoint has no "sort=newest" parameter and returns comments
 * oldest-first, so the newest comments only exist on the LAST page. GitHub
 * advertises it in the `Link` response header; that header is the only way to
 * find the page index. Returns null when there is no usable rel="last" link
 * (single page, or a header shape we do not recognise) so callers can fall back
 * to the one page they already hold.
 */
function parseLinkLastPage(header) {
  if (typeof header !== 'string' || !header) return null;
  for (const part of header.split(',')) {
    const seg = part.trim();
    if (!seg) continue;
    const rel = /rel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^;,\s]+))/i.exec(seg);
    if (!rel) continue;
    const rels = (rel[1] || rel[2] || rel[3] || '')
      .trim()
      .toLowerCase()
      .split(/\s+/);
    if (!rels.includes('last')) continue;
    const target = /<([^>]*)>/.exec(seg);
    if (!target) continue;
    const page = /[?&]page=(\d+)(?:[&#>]|$)/.exec(target[1]);
    if (!page) continue;
    const n = Number.parseInt(page[1], 10);
    if (Number.isSafeInteger(n) && n > 0) return n;
  }
  return null;
}

/** Tolerant read of the `Link` header from a fetch Response or a stub. */
function readLinkHeader(res) {
  const h = res && res.headers;
  if (!h) return null;
  try {
    if (typeof h.get === 'function') return h.get('link');
    return h.link || h.Link || null;
  } catch (_) {
    return null;
  }
}

async function readError(res, token) {
  let msg = `GitHub responded ${res.status}`;
  try {
    const j = await res.json();
    if (j && typeof j.message === 'string' && j.message.trim()) {
      msg = `${res.status} ${j.message.trim()}`;
    }
  } catch (_) {
    /* body was not JSON; the status line is enough */
  }
  return redact(msg, token);
}

/** Same-origin JSON reply. */
function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendNoToken(res) {
  sendJson(res, 503, { ok: false, error: TOKEN_MISSING });
}

function preflight(req, res) {
  res.setHeader('Allow', 'GET, POST, OPTIONS');
  if ((req.method || '').toUpperCase() !== 'OPTIONS') return false;
  res.statusCode = 204;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end();
  return true;
}

/** Vercel may hand us a parsed object, a raw string, or (raw builds) a stream. */
async function readJsonBody(req) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  if (typeof b === 'string' && b.trim()) return JSON.parse(b);
  if (Buffer.isBuffer(b) && b.length) return JSON.parse(b.toString('utf8'));
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

/** Collapse a GitHub comment body to one line, clipped to ~200 chars. */
function oneLine(body, max) {
  const flat = String(body == null ? '' : body)
    .replace(/\r\n?/g, '\n')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const n = max || 200;
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
}

module.exports = {
  OWNER,
  ISSUE_NUMBER,
  TOKEN_MISSING,
  getToken,
  commentsUrl,
  githubFetch,
  parseLinkLastPage,
  readLinkHeader,
  readError,
  sendJson,
  sendNoToken,
  preflight,
  readJsonBody,
  oneLine,
  redact,
};