# ZFT-20261016-001 — First Z.ai Agent Mode production turn
**Status: READY-TO-COPY / NEVER SUBMITTED BY AION HERE**. Designed to validate real tool availability while producing a useful, portable MV3 artifact. The owner must start the selected model's web Full-Stack Agent run.

## WHY
One carefully scoped turn combines four high-leverage unknowns—actual Linux toolchain, code synthesis/testing, browser/Chrome extension preview and artifact export—with a useful small reusable AION Chrome Relay fixture. It avoids wasting a turn on generic marketing/docs.

## Copy-ready full turn
```
MISSION ZFT-20261016-001 — AION sandbox capability + Chrome MV3 fixture

You are a full-stack sandbox engineering agent working on ONE self-contained experiment. The account owner intentionally started this turn in the Z.ai WEB Full-Stack Agent experience and selected the current available model.

OUTCOME: Build a small, working Chrome Manifest V3 extension called "AION Relay Fixture" that shows eight role cards in its side panel and truthfully distinguishes browser/tab presence, transport connectivity, and actual executor activity. For this experiment all states come from fixture data, clearly labeled SIMULATED. Produce full source, deterministic tests, and a recoverable export.

STEP 1 — CAPABILITY PROBE (brief, do not over-research):
- Record current UTC time, OS/kernel and workspace, Node/runtime/git versions if available, and actual available terminal, browser-preview, Chrome extension-loading and artifact-export mechanisms. Do not infer abilities from product marketing.
- If you can see subagent delegation, assign independent implementation and test review within this same turn; otherwise perform sequentially and say so. Do not invent agents.
- Do not request private repo credentials or personal browser sessions. Work only in a new disposable directory.

STEP 2 — BUILD:
- Create manifest.json with necessary/minimal permissions and a side-panel or popup fallback where MV3/browser capability requires it.
- Implement service-worker state transfer, side-panel/popup UI, and a tiny fixture event store with eight static role identities and clearly DEMO-only presence, transport, task and proof states.
- Add an importable pure JavaScript message-envelope parser and explicit schema/expiry/idempotency validation.
- Implement a memory-backed durable-state simulation for reconnection across worker restarts; document what isn't truly durable until Chrome storage is integrated.
- No remote server; no authentication; no actual production task submission; no hidden browser content access.

STEP 3 — TEST:
- Run Node built-in `node --test` (or compatible native runner) for at least: schema positive, wrong version, expired event, duplicate message, transport ACK versus executor acceptance, restart recovery simulation, and fake VERIFIED rejected.
- Run a package/manifest syntax validation and static file existence tests.
- If actual built-in browser preview and unpacked-extension loading are supported in this sandbox, perform a real UI inspection with evidence. If unavailable, explicitly report "REAL BROWSER EXTENSION TEST NOT PERFORMED"; do not claim it happened.
- Never use Playwright or Puppeteer for any implementation or testing.

STEP 4 — HARVEST:
- Include README, manifest, extension files, Node tests, run commands, stdout, and a SHA-256 file manifest.
- Prefer actual downloadable ZIP of the fixture and report its UI location and SHA. If ZIP download impossible, return a structured textual patch/file listing and say export is blocked.
- No GitHub push, external deployment, credentials or modifications to any real repo.

SUCCESS: one real sandbox-built MV3 fixture with reproducible positive/negative tests, a truthful tool capability inventory, and an exportable artifact or precisely evidenced fallback. Summarize maximum 15 lines followed by artifact links/paths and test evidence.

If a precondition fails, still deliver the reusable evidence and stop the affected operation. Do not convert the turn into an open-ended architecture study.
```

## Independent AION acceptance after result
Open actual artifact outside sandbox; independently compute SHA-256 and run `node --test`. The role tiles are UI fixtures, **not live agent telemetry**. Mark VERIFIED only when file bytes, tests and optional browser inspection are independently confirmed. Route extension design learnings to TOOLSMITH, performance to Efficiency and actual implemented source to CoS/Chief.
