# Z-FORGE — One-Heavy-Turn Mission Template v0.1

**Copy only after completing preflight.** Owner submits manually in the authenticated Z.ai WEB Full-Stack Agent Mode unless a separately approved transport actually exists. NOT a ZCode desktop work order.

## Header
MISSION_ID: ZFT-YYYYMMDD-NNN
TARGET: Z.ai web Full-Stack Agent (as actually shown)
MODEL_SELECTION: <exact visible model or OWNER_SELECTS>
SOURCE: <repo URL + SHA / safe attached context / self-contained fixture>
SCOPE: <one bounded product outcome>
SAFE_PERMISSIONS: <disposable isolated sandbox; no prod/private credentials>
TURN_BUDGET: <prefer one turn; when blocker stop and return diagnostic>
OUTPUT_DESTINATION: <allowed download, patch, or approved scoped GitHub route>

## Prompt
You are operating as a development team inside an isolated sandbox for one user-controlled engineering experiment.

**Primary outcome:** <one tangible build or measured capability test>

**Input:** <precise files/URLs/reference SHA and fallback if unreadable>

**Preflight:** Inspect only relevant runtime capabilities. Briefly state observed model (if visible), `node/git/chrome` and the filesystem path, and whether terminal/browser-preview/artifact-download/subagents are actually supported. Mark unavailable rather than assuming.

**Execution path:** 
1. Validate input, identify only the minimum independent subtasks.
2. If real subagent delegation exists, assign developer/tester or independent analysis units within this same turn; otherwise complete sequentially. Do not fabricate agents or tool calls.
3. Build/run the actual fixture. Keep all changes within a disposable working directory.
4. Run deterministic positive and negative tests; inspect native browser preview/DevTools only if available.
5. Produce an exportable artifact (ZIP, patch, or scoped Git commit if expressly approved) with manifest, file hashes and test output.
6. Close with a concise report of what was built, executed and exported, what was merely claimed and what failed.

**Limits:** No Playwright or Puppeteer. No browser credential/session harvesting. No broad repo writes, remote deployment or unexplained network access. The originating account and personal machine remain outside sandbox authority.

**Acceptance:**
- <checkable condition 1>
- <checkable condition 2>
- <negative test>
- <artifact export proof>
- <sha / git ref / screenshot if supported>

**Failure:** If source/permission/export capability absent, stop unsafe steps, complete useful local diagnostics, return exact blocker and downloadable or pasted minimal patch. Do not claim a test or GitHub push occurred without receipts.

**Required return format:** 
MISSION ID, selected visible model, actual sandbox runtime, actions performed, file tree, tests/results with commands, screenshots/preview evidence if real, exported artifact location or digest, observed limitations, recommended next mission.
