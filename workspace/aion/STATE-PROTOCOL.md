# AION — Persistent State Protocol (v1)
This is the update contract for the **single permanent root entry point** `README.md` and the machine-readable **mutable** snapshot `workspace/aion/STATE.json`. Persistence comes from GitHub commits and links; this is not a daemon, shared ChatGPT memory or automatic streaming bus.

## Data roles
- `README.md`: **permanent universal entry URL**. Do not rename/move; use relative links only to stable paths.
- `workspace/aion/STATE.json`: **current operational snapshot**, machine-readable, maintained with every verified transition. Treat `updated_utc` as observation date, not heartbeats.
- `workspace/aion/ONBOARDING.md`: human/agent launch protocol.
- `workspace/aion/canon/`: enduring mission, Windows architecture, methods and experiment registry.
- GitHub issues / commits / source hashes: **append-only evidence trail**; current snapshot only points to evidence. Uploaded ZIP bytes may not exist in GitHub just because a SHA is recorded.

## State transition rules
1. Any actor starts from the current root README and pulls `STATE.json` at a fresh Git commit. Find newer issue receipts.
2. Before a status change, collect the **actual receiver-side proof** (command output, commit, source hash, observed browser session, real ACK, independent review), UTC time, machine/environment, author and exact scope. Claim `UNKNOWN` if inaccessible.
3. Record evidence in the canonical issue or versioned evidence file; immutable tests/receipts are never overwritten to imply newer results.
4. Update `STATE.json` using the current blob SHA (optimistic concurrency), revise only affected keys, update `updated_utc` (and ideally include last evidence links). On 409 conflict, re-read, reconcile, retry; never blind overwrite.
5. If milestone/architecture/experiment semantics changed, update corresponding canon file with backward cross-links. Update `README.md` only if the navigation or top-level summary changes.
6. Independently fetch updated file(s), verify links, JSON validity and commit SHA. Report VERIFIED vs PENDING correctly.
7. Onboarding reads latest state and facts; not a prompt to execute work. GitHub messages don't automatically wake ChatGPT conversations or start agents.

## Acceptance state machine (M1)
`WINDOWS_PRELIVE_REUSE_ASSESSMENT` -> `WINDOWS_PREPARED` -> `LIVE_TEST_AUTHORIZED` -> `REAL_BROWSER_SENT` -> `REAL_REPLY_CAPTURED` -> `AION_CONSUMED` -> `INDEPENDENTLY_VERIFIED`.
Failures: `BLOCKED`, `REJECTED`, `UNKNOWN`.
Transport ACK != actual model reply != AION consumption. Never skip a state on self-report. `m1_verified:true` only following full real authenticated Windows ChatGPT exchange, AION-origin proof, readback and negative case verified independently.

## Safety and consistency
- Owner's Windows system is the master; BFF Linux optional; Z.ai mock only.
- Current recorded host/browser **stop order remains**, so publishing this infrastructure does not authorize a live test, installs or account access.
- No Playwright/Puppeteer anywhere in AION work.
- No secrets, browser cookies, access tokens or sensitive transcripts in snapshot, GitHub issues or logs.
- Store source SHA and evidence location separately; never claim a ZIP is attached to GitHub when only its digest is known.
- No automatic sync schedule or background updates are installed by these Markdown/JSON files; a future authorized Windows runner can implement durable auto-refresh subject to tests and permissions.

## Health test for a new hire
Can they start at `https://github.com/owenservera/aion`, locate Windows master, M1 contract, experiment hashes, current blockers and next action, and give an honest `AION_HANDOFF_V1` with no extra chat context? If yes, onboarding works. If they expect the page to autonomously execute or relay messages, it does not.
