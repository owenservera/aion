# AION PM dashboard
Static single page (src/index.html) plus build.mjs, which bundles ../ledger.json, ../RISKS.md and ../DECISIONS.md into dist/data.json.
Vercel project: aion-pm-dashboard (Vercel Authentication on all deployments).
URL: https://aion-pm-dashboard-owens-projects-11d54253.vercel.app
Deploy today: run ./snapshot.sh, then a source deploy (Vercel MCP create_deployment) of pm-snapshot.json, build.mjs, src/index.html and vercel.json.
Git auto-deploy from owenservera/aion is connected but BLOCKED: autopush commits are authored by "AION BFF", who is not a member of the Vercel account.
The page re-fetches data.json every 60 s and re-renders when it changes.

## Inbox API (AION-BFF-003-VERCEL-INBOX)

`api/` holds two Vercel serverless functions backing the in-page compose/send/readback in the
`#aion-comms` section:

- `POST /api/inbox/send` — posts a note to GitHub issue owenservera/aion#14, returns
  `{ok, commentId, htmlUrl, createdAt, status:"PENDING_AION_READ"}`.
- `GET /api/inbox/recent?limit=10` — newest-first readback of that issue's comments.
- `api/_lib/github.js` — shared token lookup and fetch helpers.

Required environment variable (set in the Vercel project settings, never in this repo):
`GITHUB_TOKEN` or `AION_GITHUB_TOKEN` with `issues: write` on `owenservera/aion`. Until it is set
both endpoints return HTTP 503 `{"ok":false,"error":"GITHUB_TOKEN (or AION_GITHUB_TOKEN) not
configured on server"}`. No credential is present in any file here, and the browser only calls
same-origin `/api/...`.

Sending writes a GitHub comment. It does not inject anything into ChatGPT and does not wake AION —
`PENDING_AION_READ` means "stored on GitHub, not yet read", not an acknowledgement.

Full request/response shapes, env setup and test plan: [INBOX-CONTRACT.md](INBOX-CONTRACT.md).
Offline smoke test (syntax check + mocked handler runs, no token, no network):
`./scripts/smoke-inbox.sh`.
