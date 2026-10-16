# AION-BFF-003-VERCEL-INBOX receipt

- correlation_id: AION-BFF-003-VERCEL-INBOX
- timestamp_iso: 2026-10-16T04:45:13+02:00
- scope: `pm/dashboard/` (+ this receipt in `ops/evidence/`)
- outcome: **implemented, syntax-clean, offline smoke green. NOT deployed.**
- repo state at receipt: `1c32f8d` (auto-commits are produced by the pre-existing autopush daemon, not by this task)

## Files created

| Path | Purpose |
| --- | --- |
| `pm/dashboard/api/_lib/github.js` | token lookup, redacting fetch helpers, JSON/OPTIONS plumbing, body reader, one-line truncator |
| `pm/dashboard/api/inbox/send.js` | `POST /api/inbox/send` — write to issue #14 |
| `pm/dashboard/api/inbox/recent.js` | `GET /api/inbox/recent` — newest-first readback |
| `pm/dashboard/scripts/smoke-inbox.mjs` | offline handler harness, 57 assertions, mocked `globalThis.fetch` |
| `pm/dashboard/scripts/smoke-inbox.sh` | `node --check` wrapper + optional live curl checks |
| `pm/dashboard/INBOX-CONTRACT.md` | request/response shapes, PENDING_AION_READ semantics, env setup, test plan |
| `ops/evidence/AION-BFF-003-VERCEL-INBOX-receipt.md` | this file |

## Files changed

| Path | Change |
| --- | --- |
| `pm/dashboard/src/index.html` | in-page Send button, recent-comments readback panel, amber warning banner, dark-theme CSS for both |
| `pm/dashboard/vercel.json` | added `Cache-Control: no-store` for `/api/inbox/(.*)`, placed before the catch-all; existing `/data.json` and `X-Robots-Tag` rules untouched |
| `pm/dashboard/README.md` | inbox API summary, env var name, link to INBOX-CONTRACT.md |
| `pm/dashboard/src/index.html` | file ownership corrected root -> box (it was 0644 root-owned and not writable) |

## Verification

### `node --check`

```
PASS  pm/dashboard/api/_lib/github.js
PASS  pm/dashboard/api/inbox/send.js
PASS  pm/dashboard/api/inbox/recent.js
PASS  pm/dashboard/scripts/smoke-inbox.mjs
```

Both inline `<script>` blocks in `src/index.html` were also extracted and `node --check`ed: PASS, PASS.

### `node build.mjs`

```
built 43 items, 10 risks
dist/data.json  118888 B
dist/index.html  17746 B   (updated page present in build output)
```

### `./scripts/smoke-inbox.sh`

**57 passed, 0 failed — exit 0.** No network calls, no token required. Coverage:

1. no token -> `503` on both endpoints, exact error string, `fetch` never invoked
2. send success: `id`->`commentId`, `html_url`->`htmlUrl`, `created_at`->`createdAt`,
   `status === "PENDING_AION_READ"`, no ack/woken wording anywhere in the payload
3. marker prefix `[AION→BFF via dashboard]\n\n` + raw text preserved
4. outbound GitHub headers (`Accept`, `X-GitHub-Api-Version`, `User-Agent`, `Bearer`) asserted
5. `body`/`message` aliases, 400 on empty/whitespace/non-string/malformed JSON
6. 4xx forwarded as-is, 5xx -> 502, unreachable -> 502 with a generic message
7. token scrubbed from a hostile GitHub error message (`[REDACTED]`)
8. recent: newest-first ordering, `limit` default 10 / clamp 30 / garbage fallback,
   200-char single-line truncation, non-array body -> 502
9. `405` on wrong method, `OPTIONS` -> `204` with `Allow: GET, POST, OPTIONS`

> Harness note: an early revision restored the stubbed `globalThis.fetch` before the async body
> finished, which caused one real request to `api.github.com` with the throwaway test token
> (rejected 401, no state change). Fixed by awaiting inside `withToken()`; the harness now installs
> a guard stub that throws on any unstubbed fetch. No real credential was involved at any point.

## Follow-up fix (same day): `recent` returned the OLDEST comments

**Bug.** `GET /repos/{owner}/{repo}/issues/{n}/comments` returns comments **oldest-first** and has
no sort parameter. The handler fetched `per_page=<limit>&page=1` — the *oldest* `limit` comments —
and then re-sorted them newest-first. On an issue with more than `limit` comments, "recent
readback" silently showed the beginning of the thread instead of the end.

**Fix** (`pm/dashboard/api/inbox/recent.js` + two new helpers in `pm/dashboard/api/_lib/github.js`,
`parseLinkLastPage` / `readLinkHeader`):

1. First request stays `per_page=<limit>&page=1` — with the final `per_page`, so the page indices in
   its `Link` header are the ones that apply to the second request.
2. The `Link` header is parsed for `rel="last"`; if it yields a page `> 1`, the handler re-fetches
   `per_page=<limit>&page=<lastPage>`, which is the newest `limit` comments (still oldest-first
   inside that page, then re-sorted as before). Response shape is unchanged.
3. No `Link` header, `rel="last"` pointing at page 1, or an unparsable `Link` → the single page 1
   response is used as-is, exactly one upstream request, same output as before.
4. A failing last-page fetch (5xx → `502`, unreachable → `502`, 4xx forwarded, non-array body →
   `502`) surfaces as an error. There is deliberately **no** silent fallback to page 1, because that
   would reinstate the oldest-page bug behind a `200`.

No new endpoints, no new dependencies, still CommonJS, still Node 18 global `fetch`. Unchanged: the
`503` when `GITHUB_TOKEN`/`AION_GITHUB_TOKEN` is unset, the `405` on `POST`, token never echoed, and
the `redact()` scrubbing of GitHub error strings.

**Verification.** `./scripts/smoke-inbox.sh` → **90 passed, 0 failed — exit 0** (was 57). New section 6
asserts, against a mocked `Link` header with `rel="last"`: two requests are made, the second is
`?per_page=10&page=3`, `per_page` matches on both, the payload is ids 120–129 with none of the
oldest-page ids leaking in, and the single-page path issues exactly one request when `Link` is
absent / `next`-only / `rel="last"` page=1 / malformed. Mutation check: forcing the handler back to
"never fetch the last page" fails 11 of those assertions and returns the oldest ids 100–109, so the
tests detect the original bug rather than restating the new code. INBOX-CONTRACT.md §3 and §4 note
the last-page behaviour; still **NOT deployed**.

## curl examples

Offline, no token set — this is the expected default state:

```bash
curl -s -X POST https://<deployment>/api/inbox/send \
  -H 'Content-Type: application/json' -d '{"text":"hello"}'
# HTTP 503
# {"ok":false,"error":"GITHUB_TOKEN (or AION_GITHUB_TOKEN) not configured on server"}

curl -s 'https://<deployment>/api/inbox/recent?limit=10'
# HTTP 503
# {"ok":false,"error":"GITHUB_TOKEN (or AION_GITHUB_TOKEN) not configured on server"}
```

After `GITHUB_TOKEN` is configured in Vercel (Vercel Authentication will 401/403 an unauthenticated
curl before the function is reached — use a signed-in browser session):

```bash
BASE=https://aion-pm-dashboard-owens-projects-11d54253.vercel.app

curl -sS -X POST "$BASE/api/inbox/send" \
  -H 'Content-Type: application/json' \
  -d '{"text":"AION-BFF-003 manual check"}'
# {"ok":true,"commentId":<n>,"htmlUrl":"...#issuecomment-<n>","createdAt":"<iso>","status":"PENDING_AION_READ"}

curl -sS "$BASE/api/inbox/recent?limit=10"
# {"ok":true,"comments":[{"id":..,"author":"..","createdAt":"..","bodyTruncated":"..","htmlUrl":".."}]}
```

## Security assertions

- No PAT, cookie, OpenCode key or other credential exists in any added or modified file.
  Verified by a repo-wide regex sweep for `gh[pousr]_*`, `github_pat_*`, `sk-*` and `Bearer <literal>`
  across `pm/dashboard/api`, `src`, `scripts`, `INBOX-CONTRACT.md`, `README.md`, `vercel.json`: clean.
- Token is read only from `process.env.GITHUB_TOKEN || process.env.AION_GITHUB_TOKEN` inside the
  function. The browser only calls same-origin `/api/...`.
- Error strings are scrubbed of literal token values, `gh*_` patterns and `Bearer …` fragments
  before leaving the server.
- Nothing was committed with a secret, no push was performed, nothing under
  `/usr/local/bin/aion-autopush` was touched, no other tree was modified.

## Blockers / not done

1. **Live deploy blocked until Owen sets the env var.** Both endpoints intentionally return 503
   without `GITHUB_TOKEN` / `AION_GITHUB_TOKEN`. Owen must add it in the Vercel project
   `aion-pm-dashboard` → Settings → Environment Variables with `issues: write` on `owenservera/aion`,
   then redeploy. No token value is recorded in this receipt or anywhere in the repo.
2. **The deploy file list must grow.** The dashboard is deployed via Vercel MCP `create_deployment`
   with an explicit file set (`pm-snapshot.json`, `build.mjs`, `src/index.html`, `vercel.json`).
   `api/` must be added to that set or `/api/inbox/*` will 404. See INBOX-CONTRACT.md §5.
3. **No deploy performed.** Per task constraint. `vercel.json` was left as headers-only
   deliberately — no `buildCommand`/`outputDirectory`/`rewrites` invented, so the working
   `data.json` / `index.html` serving is not disturbed.
4. **Not verified in a live browser.** UI checks are listed in INBOX-CONTRACT.md §7.4 but require a
   deployment; only static parse checks were run locally.

## Meaning of the receipt

This task produced a **write path** and a **readback path** to a durable GitHub issue, plus a
`PENDING_AION_READ` receipt for the write.

It did **not** establish ChatGPT delivery, did **not** wake AION, and did **not** produce an
acknowledgement. A GitHub comment is a note in a repository. Any claim stronger than "the comment
was stored" is unsupported by this work.