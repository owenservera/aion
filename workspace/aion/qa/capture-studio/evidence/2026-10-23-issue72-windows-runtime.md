# Issue 72 — Windows L0/L1 runtime execution

## Parent closeout verification

- At 2026-10-23 17:21 UTC, parent reran the expanded family/profile/UI focus set: **59 passed, zero failed**; `git diff --check` passed. Reviewed the source/test diffs and retained full-suite logs (1,016 unit passes, one TODO; 15 browser E2E passes). Parent also rechecked the running owner-data server: `/`, `/api/status`, `/api/sessions` each HTTP 200 at 17:21:47 UTC. This is executor/reviewer verification, not independent milestone acceptance or rendered UI proof.
- `LOCAL-INTEGRATION` is treated as the owner's scoped execution assignment; no canonical role alias was established. Bootstrap context was reviewed without inventing a duplicate role, changing another role's tracker, or modifying global memory.
- Publishing includes only the eight explicitly changed application/test files and this sanitized receipt. The five pre-existing owner files are excluded; private session content and raw logs remain local.

**Executor receipt, not independent QA acceptance.** Source HEAD `4fb16b2a9de062e4accdb8ac457665fe0607be52`, plus the documented uncommitted source/test changes below and five pre-existing owner files. Windows; native Node `v24.22.1`; Bun `1.4.2`; disposable Chrome `155.0.8059.85`. No Playwright/Puppeteer, logged-in site sends, commits, pushes or issue publication.

## Follow-up — synthetic browser fallback/privacy tests

The original two browser assertions assumed incremental arming always succeeds and filtered privacy is the default. Neither matches the current recorder contract. **No production recorder/network/decoder patch was made in this follow-up**, and `families/build.mjs` / `shapes/infer.mjs` were not changed again while under independent review.

- `test/e2e/capture.test.mjs` explicitly selects a filtered profile for its credential-exclusion checks. It accepts either armed capture or an explicitly diagnosed retrospective fallback, but compares the **entire saved response byte-for-byte** against the deterministic localhost fixture response. Incremental capability receipts must match actually armed streams; fallback alone is never called `SUPPORTED_AND_DATA`.
- New browser regression refuses only `_armStream` for one disposable recorder; the actual localhost request, browser-received body, `Network.getResponseBody`, persistence, replay and assembly still use real Chrome/Core. Local-raw saved bytes equal the browser's original response exactly; one fallback body only, complete terminal status, preserved request body and capture-mode marker, no unavailable/truncated/excluded body markers, correct assembled answer. Arming failure is retained, not disguised as incremental success.
- The filtered WebSocket case now closes only its own fixture socket/server-side upgraded connections before stopping. The fixture does not implement the close handshake; without this, the filtered guard correctly withholds its unfinished frame tail, contradicting the old assertion of three persisted frames. No owner tabs/profiles or unrelated sockets are touched.
- `test/e2e/universality.test.mjs` explicitly selects filtered privacy for `fixture-form`. Other profiles and local-raw behavior are unchanged.
- `test/e2e/helpers.mjs` refuses already occupied DevTools ports and checks the exact spawned child handle/executable/temporary-profile/port arguments before killing its still-owned child. No process-name kill or arbitrary port-discovered PID termination.
- Four affected browser cases passed: `bun run -- node --test --test-name-pattern='records L1|forced short-stream|long response fully|multi-step form' test/e2e/capture.test.mjs test/e2e/universality.test.mjs`. Log: `%LOCALAPPDATA%/Temp/opencode/issue72-e2e-fallback-focused-final.log`.
- Final **`bun run test:e2e`: 15/15 passed, zero failures/skips**, duration 74,848 ms, log closed **17:17:45 UTC**. Includes the pre-existing owner worker test, run but not edited. Log: `%LOCALAPPDATA%/Temp/opencode/issue72-e2e-fallback-full-after-wait.log`. The earlier 14/15 result remains retained separately, below.
- Relevant unit command: `bun run -- node --test test/unit/network-bounds.test.mjs test/unit/local-owner-capture.test.mjs test/unit/local-first-mode.test.mjs test/unit/stream-guard.test.mjs test/unit/late-ws-and-family-ties.test.mjs test/unit/acceptance.test.mjs`: **49/49 passed**. Log: `Temp/opencode/issue72-e2e-fallback-unit.log`.
- Browser commands use explicit `CHROME_PATH` from existing `findChrome()`, `TEMP`/`TMP` set to `%LOCALAPPDATA%/Temp/opencode`, and no ambient `CAPTURE_STUDIO_CAPTURE_MODE` override; each privacy test selects its intended profile policy.

**Separate observed early-stop/replay limitation, not fixed or erased:** the first full rerun passed 14/15, exposing a long-response timing race. Page DOM already contained `word399`, but the recorder's separate CDP backlog had not reached done. The test stopped it; raw `run.end` at seq 337 split an SSE message before later raw chunks arrived. All 400 words, including `word313`, exist in the saved raw bytes, but derived assembly contained only 399. Direct `SseDecoder` replay of the actual chunk bytes recovers `word313`; `StreamReducer` replay across early `run.end` does not. This is **a derived replay fidelity limitation for early-stop ordering**, not reproduced raw-byte loss. The complete-response test now waits for Recorder's actual terminal event before asserting full retained output; it does not reduce the 400-word requirement. Production early-stop replay recovery remains a separate parent decision.

Local reproducer: `%LOCALAPPDATA%/Temp/opencode/cs-e2e-PjpYxD/sessions/20261023-171205-long-624810/`, stream `p:10912.24`; `run.end` seq 337, `word313` chunk seq 338, later done seq 428. First full-run failure log retained as `Temp/opencode/issue72-e2e-fallback-full.log`. Final owner preservation at **17:19:07.597 UTC**: 107 sessions / 2,990 original files unchanged; `Temp/opencode/issue72-owner-preservation-after-e2e-fix.json`. No remaining Chrome command lines using the test `Temp/opencode/cs-chrome-*` profiles at the 17:18:29 UTC process check. Owner server remains PID 20532 on port 7878. QA72F1 remains open.

## Follow-up — five family failures repaired, 17:05 UTC

This section supersedes the earlier unresolved family findings below. Parent independently reproduced five failures in the original 57-case focus set before requesting this bounded fix.

- Four fixtures supplied synthetic raw SSE and DOM, but never derived the actual assembled reply before evaluation. They now run real `derive()` using the existing generic profile, preserve the resulting real knowledge counts/dataset status, then call unchanged Core acceptance. No hardcoded acceptance documents, gate overrides, decoder/provider overrides or fabricated assembled text. The explicit SHAPES-only/unassessed case still opts out of derivation and remains withheld.
- Real production mismatch: `templateUrl()` strips schemes from shape endpoint labels; family admission previously tried to recover exact origins from those scheme-less labels. `src/shapes/infer.mjs` now emits each group's observed origins from its contributing stream IDs and actual recorded URLs. `src/families/build.mjs` permits a scheme-less group only with exactly one valid observed origin and a matching endpoint authority. Missing/unknown origins, mixed HTTP/HTTPS origins, wrong scheme and foreign hosts remain withheld. Legacy absolute labels retain existing behavior; old scheme-less reports require rederivation, not guessed origins.
- Two added regressions: missing ASSEMBLED evidence still produces incomplete G3/G7 despite matching DOM; scheme-less groups admit only the one proven exact origin and reject four missing/mixed/foreign alternatives.
- `bun run -- node --test test/unit/family-eligibility.test.mjs test/unit/profile-evidence.test.mjs test/unit/studio-handoff-ui.test.mjs test/unit/studio-integration-ui.test.mjs test/unit/studio-recovery-ui.test.mjs test/unit/studio-search-ui.test.mjs`: **59/59 passed**. Log: `%LOCALAPPDATA%/Temp/opencode/issue72-family-fix-focused.log`.
- `bun run test`: **1,016 passed, zero failed, one TODO; 1,017 total**. Log: `%LOCALAPPDATA%/Temp/opencode/issue72-family-fix-full-unit.log`.
- Fresh native `node scripts/core-local-handoff.mjs l1`: **15/15 pipeline checks plus two Git checks passed**. Evidence: `%LOCALAPPDATA%/AION/capture-studio/integration-runs/core-20261023T170328-0c389e0d/round-L1/`. Session `20261023-170353-127-0-0-1-136ef5`; 49 raw records, zero gaps, four original DOM refs verified; packet under `%LOCALAPPDATA%/Temp/opencode/cs-live-e2e-1792775013520/outcome-packet/`. Raw unchanged; G4–G7 passed; G1–G3 abstain; `capture_incomplete` preserved.
- Owner-data server refreshed after verifying and stopping only executor-owned PID 19832. **Current PID 20532**, same no-open command/home/port below. New launch receipt/logs: `issue72-owner-server/family-fix-launch.json`, `family-fix.stdout.txt`, `family-fix.stderr.txt`. HTTP session list confirms 107 sessions.
- At **17:05:05.387 UTC**, all **2,990 original files in all 107 sessions remained SHA-256-identical**. Local receipt: `Temp/opencode/issue72-owner-preservation-after-family-fix.json`.
- Additional changed app paths: `src/families/build.mjs`, `src/shapes/infer.mjs`, `test/unit/family-eligibility.test.mjs`. No acceptance internals changed. **QA72F1 remains open**, independent parent review remains required, and the two broader browser E2E failures below were not repaired by this follow-up.

## Executed result

- **Native L0 PASS:** `node scripts/core-local-handoff.mjs l0`, 2026-10-23 16:34:59.043–16:35:10.250 UTC. Eight checks including help, version, paths, doctor, isolated sessions, loopback HTML/API and Git checks.
- **Native extended L1 PASS:** `node scripts/core-local-handoff.mjs l1`, 16:36:51.739–16:37:39.687 UTC. Fifteen synthetic pipeline checks plus two Git checks; zero failures/skips. Synthetic session `20261023-163701-127-0-0-1-f7b05e`; 49 raw records, one segment, zero gaps; session verification and integrity manifest verification passed.
- Real fixture capture → full derive → exact/fuzzy knowledge search → raw-bound Core acceptance read → **real canonical Core saved-session Outcome Packet adapter** → transcript/dataset export → replay JSON/SSE → HTTP saved-session/knowledge/acceptance/source checks.
- Acceptance correctly remained **`capture_incomplete`**, G1/G2/G3 `not-checked` without drive context; G4/G5/G6/G7 passed. This receipt does not promote the session to accepted or fix/disprove the separately reported G1/G2 freshness problem.
- Outcome Packet extracted one summary, one decision, one proposed action, and one unknown. Four references verified against original saved `DOM_TURNS.json`, then compared to exact `/api/sessions/{id}/turns` source lines. Raw digest unchanged before/after packet generation. No injected Core doubles. Action remains proposed; delivery not attempted; owner use and independent acceptance unmeasured.
- Exact session entry links returned HTTP 200; API identity, acceptance, complete knowledge and original source lines matched. **HTTP/source checks are not visual UI, click-navigation or usability proof.**

## Small runner changes

App root: `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`.

- `scripts/fixture-site.mjs`: add a synthetic user role so the existing generic DOM extractor sees a conversation; preserve line breaks with a `pre` reply; optional explicit labelled outcome text streamed through the existing SSE handler.
- `scripts/live-e2e.mjs`: invoke actual `Session`, `readAcceptance`, `rawDigest` and Value Oracle saved-session adapter; verify honest abstention, packet/source binding and saved API links; record session/packet paths. Validate launched Chrome PID, executable, disposable profile and CDP port before termination; confirm PID absence afterward. No general Chrome termination.
- Runner file SHA-256 at successful native run: fixture `f4b4eaf8a1943388f11e0e609e9ae1245776d387447666ca6bf28d463d542ae0`; live runner `2ff75f97159d343cc4818bcdb1e207ae905e99bef4abff802f8d592bf24187e5`.

## Broader regression results — not all green

- `bun run test`: native package test command ran 1,015 cases: **1,009 pass, five fail, one TODO**. All failures are `test/unit/family-eligibility.test.mjs`; focused native rerun reproduced five failures in eight cases.
  - Four handcrafted positive fixtures lack a derived assembled reply: G3/G7 remain unknown rather than the asserted accepted verdict. Do not weaken acceptance to make these fixtures pass.
  - The actual-derive positive case creates shape groups, but published shapes are empty. Source diagnosis: `templateUrl()` emits scheme-less `host/path`, while `build.mjs` exact-origin admission parses the group endpoint as an absolute URL. The faithful producer/consumer integration case fails. Do not guess a scheme or relax exact-origin boundaries; a follow-up should preserve trustworthy original origin provenance.
- Initial `bun run test:e2e`: **14 skipped** because the runner requires `CHROME_PATH` (auto-discovered Chrome is insufficient for that suite).
- After setting `CHROME_PATH` with existing `findChrome()`, `TEMP`/`TMP` to the approved local temporary directory, `bun run test:e2e`: **12 pass, two fail, zero skips**. Failures: `capture.test.mjs:54` expects `armed='stream'` but got undefined; `universality.test.mjs:185` expects typed form data absent under the now-default `local-raw` policy.
  - Saved synthetic raw evidence explains the arm failure: `stream.arm_failed` reports `Network.streamResourceContent: Request with the provided ID has already finished loading`; the subsequent done record reports zero incremental chunks/bytes and seven unarmed data events. This is an observed short-stream arm race, not proof Chrome lacks the API. Local source: `Temp/opencode/cs-e2e-oL3Wu4/sessions/20261023-163550-127-0-0-1-c9bea4/raw/`; no synthetic request-header payload is reproduced here.
- With `CAPTURE_STUDIO_CAPTURE_MODE=filtered`, native `node --test --test-name-pattern='multi-step form' test/e2e/universality.test.mjs`: **one pass, zero failures**. This isolates the privacy assertion's policy mismatch; it is not evidence of a raw-mode privacy guarantee.
- Native `node --test test/unit/profile-evidence.test.mjs test/unit/profile-adaptation.test.mjs test/unit/acceptance.test.mjs`: **22 pass, zero failures**.
- Native `node --test` on Value Oracle `prototypes/saved-session-outcome.test.mjs` and `prototypes/outcome-packet.test.mjs`: **20 pass, zero failures**.
- `git diff --check`: exit zero (Git emitted CRLF conversion warnings).

Earlier failed integration attempts are retained, not erased: the first fixture lacked two DOM roles; labelled reply text then rendered as one normal-whitespace paragraph and produced an empty packet. The final fixture preserves real rendered newlines and the final packet check passes. An initial Bun-runtime handoff was superseded by native Node: `bun run <file>` selects Bun's runtime, and these scripts spawn `process.execPath`. Package test scripts still use their existing `node --test` semantics.

## Local evidence pointers (private; do not publish raw files)

Resolve `%LOCALAPPDATA%` on the execution machine:

- L0: `AION/capture-studio/integration-runs/core-20261023T163459-f1daad67/round-L0/`.
- L1: `AION/capture-studio/integration-runs/core-20261023T163651-5197b8d1/round-L1/`.
- Each round contains `run.json`, `steps.jsonl`, `metrics.json`, `failures.jsonl`, `summary.md`, local stdout/stderr and a shareable projection. Review projections before any distribution.
- Saved synthetic data and packet: `Temp/opencode/cs-live-e2e-1792773413150/`; packet files under `outcome-packet/`; result under `live-e2e-result.json`; HTTP entry pointers under `saved-links.json` (ephemeral test-server port has been closed).
- Test logs: `Temp/opencode/issue72-unit-runtime.log`, `issue72-e2e-runtime.log`, `issue72-e2e-chrome-runtime.log`, `issue72-e2e-filtered-focused.log`, `issue72-focused-runtime.log`, `issue72-oracle-runtime.log`.
- Original-owner baseline/preservation: `Temp/opencode/issue72-owner-baseline.json` and `issue72-owner-preservation.json`. At **16:56:52.288 UTC**, all **107 original sessions / 2,990 original files** remained byte-identical by SHA-256; no missing or added owner sessions. Baseline was recorded after isolated captures, before starting the owner-data server; isolated runners did not target owner sessions.

## Server intentionally left running

**Current PID 20532** (original PID 19832 safely refreshed in the follow-up above), `http://127.0.0.1:7878/`, owner's existing data directory, local access mode, no auto-open. Command from app root:

```powershell
$env:CAPTURE_STUDIO_ACCESS_MODE = 'local'
$env:CAPTURE_STUDIO_HOME = "$env:LOCALAPPDATA/AION/capture-studio"
node bin/studio.mjs serve --studio-port 7878 --no-open --json
```

Launch receipt/stdout/stderr: `%LOCALAPPDATA%/AION/capture-studio/integration-runs/issue72-owner-server/`. Initial HTTP verification at 16:37:51 UTC found status 200 and all 107 saved sessions. Original owner Chrome tabs/profiles were not used; final disposable runner Chrome PID 20812 was ownership-checked and confirmed absent after cleanup. No remaining `cs-live-e2e-*` Chrome command lines at the post-run process check.

**Remaining:** independent parent review/replay of the family fixture/producer-origin fix and E2E contract repairs; the separately reproduced early-stop derived replay limitation; visual UI proof; real-provider and multi-turn acceptance. Completed-body fallback fidelity is now browser-tested, not an unresolved missing-fallback claim. **QA72F1 remains open:** G1/G2 freshness is not established by historical matching prompt/reply text; the successful L1 intentionally abstains rather than proving a new send. G1/G2 internals deliberately unchanged. The five pre-existing owner files were never edited or staged by this executor. No publication performed. Identity is the owner-assigned local integration executor, not an asserted role-11 bootstrap; no tracker or role memory was modified.
