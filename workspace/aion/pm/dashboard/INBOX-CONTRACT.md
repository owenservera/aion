# Inbox API contract (AION-BFF-003-VERCEL-INBOX)

Serverless endpoints under `pm/dashboard/api/` that let the PM dashboard **write to** and **read
back from** the durable inbox, GitHub issue [`owenservera/aion#14`](https://github.com/owenservera/aion/issues/14).

Both endpoints are same-origin. The browser never holds a credential; it only calls `/api/...`.

---

## 1. Critical limitation (read this first)

**A GitHub issue comment is not ChatGPT and not AION.**

| This does **not** happen | This **does** happen |
| --- | --- |
| Inject text into a ChatGPT conversation | An HTTP `POST` of one comment to GitHub's REST API |
| Wake, spawn or message the AION agent | The comment is durably stored on GitHub |
| Produce an acknowledgement from ChatGPT | An immediate local HTTP receipt for the write |
| Start any browser or headless session | Nothing. Zero agent activity. |

`status: "PENDING_AION_READ"` is the **only** status this API can return for a successful write.
It is a storage receipt. Any downstream reader (for example the issue-14 poller) picks the comment
up on its own schedule, if it is running at all. A `PENDING_AION_READ` result is **not** an ACK,
not a delivery confirmation and not evidence that AION is running.

---

## 2. `POST /api/inbox/send`

Writes one comment to issue #14.

**Request**

```http
POST /api/inbox/send
Content-Type: application/json
```

```json
{ "text": "AION-BFF-003 smoke note" }
```

`body` and `message` are accepted as aliases for `text`. The value is trimmed and must be a
non-empty string.

**Success — HTTP 200**

```json
{
  "ok": true,
  "commentId": 6206813304,
  "htmlUrl": "https://github.com/owenservera/aion/issues/14#issuecomment-6206813304",
  "createdAt": "2026-10-16T02:39:53Z",
  "status": "PENDING_AION_READ"
}
```

| Field | Source |
| --- | --- |
| `commentId` | GitHub `id` |
| `htmlUrl` | GitHub `html_url` |
| `createdAt` | GitHub `created_at` |
| `status` | Always the literal `PENDING_AION_READ` |

**Outbound comment body.** The user's text is prefixed with a marker line and a blank line so
dashboard-originated notes are identifiable in the thread:

```
[AION→BFF via dashboard]

<user text>
```

**Upstream request** (server-side only — the token never leaves the function):

```
POST https://api.github.com/repos/owenservera/aion/issues/14/comments
Authorization: Bearer <token>
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
User-Agent: aion-pm-dashboard
Content-Type: application/json
```

**Errors**

| Status | When |
| --- | --- |
| `400` | Body is not JSON, or `text` is missing/empty/not a string |
| `405` | Method was not `POST` |
| `422` / `403` / `401` / `404` / `429` | Forwarded from GitHub |
| `502` | GitHub returned 5xx, the response body was unreadable, or GitHub was unreachable |
| `503` | No token configured (see §6) |

Every error body is `{"ok": false, "error": "<safe message>"}`. Messages are scrubbed: any literal
token value, `ghp_`/`gho_`/`ghs_`/`ghr_`-style strings and `Bearer …` fragments are replaced with
`[REDACTED]` and clipped to 500 characters.

---

## 3. `GET /api/inbox/recent`

Read-only readback.

```http
GET /api/inbox/recent?limit=10
```

| Param | Default | Max | Notes |
| --- | --- | --- | --- |
| `limit` | `10` | `30` | Non-numeric or `<= 0` falls back to `10`; values above `30` clamp to `30` |

**Success — HTTP 200**

```json
{
  "ok": true,
  "comments": [
    {
      "id": 6206813304,
      "author": "owenservera",
      "createdAt": "2026-10-16T02:39:53Z",
      "bodyTruncated": "[AION→BFF via dashboard] smoke note",
      "htmlUrl": "https://github.com/owenservera/aion/issues/14#issuecomment-6206813304"
    }
  ]
}
```

`author` is `user.login`, `createdAt` is `created_at`, `bodyTruncated` is the body flattened to a
single line (newlines and runs of whitespace collapsed) and clipped to 200 characters.

GitHub returns issue comments **oldest-first**, so the handler re-sorts by `created_at` descending
and slices the newest N. Errors and the missing-token `503` behave exactly as in §2. `POST` to this
route returns `405`.

---

## 4. Endpoints at a glance

| Route | Method | GitHub operation | Auth |
| --- | --- | --- | --- |
| `/api/inbox/send` | POST | create comment on issue #14 | server env token |
| `/api/inbox/recent` | GET | list comments on issue #14, page 1 | server env token |

Shared helpers live in `api/_lib/github.js`. The leading underscore keeps Vercel from routing it.

---

## 5. Deployment notes

The dashboard is deployed as a **source deploy with an explicit file list** (see `README.md`):
`pm-snapshot.json`, `build.mjs`, `src/index.html`, `vercel.json`.

**That list must now also include the `api/` directory.** Without it, `/api/inbox/*` returns 404 and
the UI falls back to "Readback unavailable". Nothing else changes: `build.mjs` still copies
`src/index.html` to `dist/index.html` and writes `dist/data.json`.

`vercel.json` intentionally keeps **headers only**. No `buildCommand`, `outputDirectory` or
`rewrites` were added, because:

- the Vercel project already has its build settings configured, and rewriting them here risks
  breaking the working `data.json` / `index.html` serving;
- Vercel builds `/api` serverless functions from the project root independently of the static
  `dist/` output, so `api/` and `dist/` coexist without rewrites.

The only addition to `vercel.json` is `Cache-Control: no-store` for `/api/inbox/(.*)`. The existing
`/data.json` rule and the catch-all `X-Robots-Tag: noindex` are unchanged, and the `/api/inbox/`
rule is listed **before** the catch-all so the more specific source wins.

If `/api/inbox/recent` 404s after a deploy, check that `api/_lib/github.js` and `api/inbox/*.js`
were part of the uploaded file set — that is the usual cause, not a config error.

## 6. Environment setup (Owen — required, do not commit)

Until the variable below is set, **both endpoints return HTTP 503** and the dashboard shows
"Readback unavailable". That is the expected, safe default — the API refuses to run rather than
inventing a fallback credential.

1. Open the Vercel project **`aion-pm-dashboard`** → **Settings** → **Environment Variables**.
2. Add **both** Production and Preview as appropriate:
   - Name: `GITHUB_TOKEN` (or `AION_GITHUB_TOKEN`; `GITHUB_TOKEN` wins if both are set)
   - Value: a **classic** or **fine-grained** token with `issues: write` on `owenservera/aion`.
3. Redeploy. Vercel only injects env vars into builds made after the variable exists.
4. Confirm with the curl in §7.3.

Never put the token in `vercel.json`, in `src/index.html`, in a URL, in a commit message, or in
`ops/evidence/`. The repo contains no token value by design. If a token ever leaks, revoke it on
GitHub and rotate — do not patch the file that leaked it.

---

## 7. Test plan

### 7.1 Offline (no token, no network)

```bash
cd pm/dashboard
./scripts/smoke-inbox.sh
```

Syntax-checks `api/_lib/github.js`, `api/inbox/send.js`, `api/inbox/recent.js` and the harness
with `node --check`, then executes the real exported handlers against a stubbed `globalThis.fetch`.
57 assertions, zero network calls, no token required. Exit code `0` means pass.

### 7.2 Expected responses when no token is set

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://<deployment>/api/inbox/send \
  -H 'Content-Type: application/json' -d '{"text":"hello"}'
# 503

curl -s https://<deployment>/api/inbox/recent
# {"ok":false,"error":"GITHUB_TOKEN (or AION_GITHUB_TOKEN) not configured on server"}
```

### 7.3 Live checks after the env var is set

The project has Vercel Authentication on all deployments, so an unauthenticated `curl` returns
401/403 before reaching the function. Either use a browser session that is already signed in, or
add a bypass for `/api/inbox/(.*)` in the Vercel Authentication settings if machine-to-machine
calls are wanted.

```bash
BASE=https://aion-pm-dashboard-owens-projects-11d54253.vercel.app

# expect 200 PENDING_AION_READ; check the comment really landed on issue #14
curl -sS -X POST "$BASE/api/inbox/send" \
  -H 'Content-Type: application/json' \
  -d '{"text":"AION-BFF-003 manual check"}'

# expect 200 with the new comment at the top of the list
curl -sS "$BASE/api/inbox/recent?limit=10"
```

### 7.4 UI checks

1. The comms panel shows the amber **warning** banner stating that sending does not inject into
   ChatGPT and does not wake AION.
2. On load, "Recent inbox comments" is populated from `/api/inbox/recent?limit=10`, newest first.
3. Clicking **Send to GitHub inbox** with an empty textarea reports "Write a note first" and does
   not send.
4. While a send is in flight the button is disabled and reads "Sending…"; it re-enables afterwards.
5. On success the panel shows `commentId`, a link to `htmlUrl`, and a `PENDING_AION_READ` pill;
   the textarea is cleared and the list refreshes.
6. On failure the panel shows the server's `error` string; the "Copy note + open inbox" button
   still works as a fallback.
7. Viewing source shows no token, and DevTools shows the GitHub token is never present in any
   browser-side response.

---

## 8. Correlation

`AION-BFF-003-VERCEL-INBOX`