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
2. For ordinary development status, a commit and relevant test/output receipt suffice. For real M1 or security-sensitive acceptance, capture sender/receiver evidence, UTC time, identity/environment and an independent review. Claim `UNKNOWN` if inaccessible.
3. Record one useful evidence link with the task or commit; avoid duplicative issue comments, reports and ZIPs. Preserve acceptance receipts and never overwrite evidence to imply newer results.
4. Update `STATE.json` using the current blob SHA (optimistic concurrency), revise only affected keys, update `updated_utc` (and ideally include last evidence links). On 409 conflict, re-read, reconcile, retry; never blind overwrite.
5. Update canonical docs only when a decision or meaningful behavior changes; do not create a new design document for each iteration. Update README only if navigation changes.
6. Verify the actual Git operation and relevant tests; independent reread/reviewer only for material release/acceptance claims or suspected inconsistency. Do not demand a separate verifier for routine Markdown edits.
7. Onboarding reads latest state and facts; not a prompt to execute work. GitHub messages don't automatically wake ChatGPT conversations or start agents.

## Acceptance state machine (M1)
`WINDOWS_PRELIVE_REUSE_ASSESSMENT` -> `WINDOWS_PREPARED` -> `LIVE_TEST_AUTHORIZED` -> `REAL_BROWSER_SENT` -> `REAL_REPLY_CAPTURED` -> `AION_CONSUMED` -> `INDEPENDENTLY_VERIFIED`.
Failures: `BLOCKED`, `REJECTED`, `UNKNOWN`.
Transport ACK != actual model reply != AION consumption. Never skip a state on self-report. `m1_verified:true` only following full real authenticated Windows ChatGPT exchange, AION-origin proof, readback and negative case verified independently.

## Safety and consistency
- Owner's Windows system is the master; local Windows agents execute; ChatGPT and Claude collaborate and review; BFF Linux optional; Z.ai mock only (see `canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md`).
- For routine changes, the same local agent may build, test, commit and verify. For real M1 acceptance or high-risk security changes, require an independent check of the evidence. `main` is the integration target; worktrees and a centralized pusher are optional, not gates.
- Windows-driven coding, tests, local diagnostics and reversible development actions do not need a separate AION grant document. The earlier host/browser **stop order remains for real signed-in ChatGPT interaction and privileged account/host changes** until the owner explicitly authorizes that scope; ordinary clear owner instructions can provide that authority without a special template.
- No Playwright/Puppeteer in AION work (owner's standing tooling rule).
- No secrets, browser cookies, access tokens or sensitive transcripts in snapshot, GitHub issues or logs.
- Store source SHA and evidence location separately; never claim a ZIP is attached to GitHub when only its digest is known.
- No automatic sync or daemon is installed by these Markdown/JSON files. Add a runner only if it meaningfully reduces work; a daemon, ACL redesign, separate git integrator or additional verifier process is not a prerequisite.

## Health test for a new hire
Can they start at `https://github.com/owenservera/aion`, locate Windows master, M1 contract, experiment hashes, current blockers and next action, and give an honest `AION_HANDOFF_V1` with no extra chat context? If yes, onboarding works. If they expect the page to autonomously execute or relay messages, it does not.

## Bus V1/V2 state machines (PROPOSED, 2026-10-19)
Command: OBSERVED -> VALIDATED -> RESERVED -> DISPATCHED -> SUBMISSION_OBSERVED -> REPLY_CHECKED -> REPORTED; terminal REJECTED or HALTED. Acceptance for Bus V1/V2 is tracked under `bus_direction` in STATE.json and is separate from M1; no phase may be marked complete without a receipt. See [decision record](canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md).
