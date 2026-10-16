// POST /api/inbox/send
// Writes a comment to the durable BFF inbox (GitHub issue owenservera/aion#14).
// A successful write means the note is STORED on GitHub. It does not mean AION
// has read it, and it is not a ChatGPT acknowledgement. status is therefore
// always PENDING_AION_READ.

const {
  getToken,
  commentsUrl,
  githubFetch,
  readError,
  sendJson,
  sendNoToken,
  preflight,
  readJsonBody,
} = require('../_lib/github.js');

const MARKER = '[AION→BFF via dashboard]';

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;

  if ((req.method || '').toUpperCase() !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Use POST with a JSON body: { "text": "..." }' });
    return;
  }

  const token = getToken();
  if (!token) {
    sendNoToken(res);
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (_) {
    sendJson(res, 400, { ok: false, error: 'Body must be JSON' });
    return;
  }

  const raw =
    (typeof payload.text === 'string' && payload.text) ||
    (typeof payload.body === 'string' && payload.body) ||
    (typeof payload.message === 'string' && payload.message) ||
    '';
  const text = String(raw).trim();
  if (!text) {
    sendJson(res, 400, { ok: false, error: 'Field "text" is required and must be a non-empty string' });
    return;
  }

  const body = `${MARKER}\n\n${text}`;

  let res2;
  try {
    res2 = await githubFetch(token, commentsUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
  } catch (err) {
    sendJson(res, 502, { ok: false, error: 'Could not reach GitHub API' });
    return;
  }

  if (!res2.ok) {
    const error = await readError(res2, token);
    // Pass through 4xx as-is (the caller can act on it); collapse 5xx/other to 502.
    const status = res2.status >= 400 && res2.status < 500 ? res2.status : 502;
    sendJson(res, status, { ok: false, error });
    return;
  }

  let created;
  try {
    created = await res2.json();
  } catch (_) {
    sendJson(res, 502, { ok: false, error: 'GitHub write succeeded but returned an unreadable body' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    commentId: created.id,
    htmlUrl: created.html_url,
    createdAt: created.created_at,
    // Never claim an ACK or that AION woke up.
    status: 'PENDING_AION_READ',
  });
};