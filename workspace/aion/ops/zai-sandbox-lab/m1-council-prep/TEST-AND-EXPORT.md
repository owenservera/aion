# Z-FORGE — Reproducible sandbox test, export, recovery, and independent acceptance
**Status:** TEST PLAN / exact commands to run once Z.ai has built the fixture. No logs, hashes or ZIPs claimed. No Playwright or Puppeteer; local-only MOCK destination. See `fixtures/M1-MOCK-VECTORS.json`.

## One-turn output tree (Z.ai must CREATE and actually test these)
```text
m1-sandbox-output/
  README.md
  source/mock-server.mjs
  source/relay-core.mjs
  source/fixture-adapter.mjs
  source/mock-client.html
  tests/positive.test.mjs
  tests/negative.test.mjs
  tests/recovery.test.mjs
  scripts/export.sh
  manifest.json
  evidence/test-stdout.txt                 (ACTUAL only)
  evidence/SHA256SUMS                      (GENERATED after files finish)
  LIVE-TEST-HANDOFF.md
```
Build can use equivalent filenames ONLY if returned manifest accurately specifies replacements; no deployment, no authenticated browser access, no owner host changes.

## Deterministic acceptance conditions
The tests use a frozen virtual clock (provided in fixtures), isolated temporary data dir, and stable IDs. `node --test` must run without Z.ai-only services, with explicit exit codes and counts. The HTTP mock page MUST visibly display `MOCK DESTINATION — NOT CHATGPT` and support two independent conversation IDs to catch wrong-thread success. No test may call chatgpt.com, OpenAI API, or private GitHub. Node built-ins preferred.

Positive: an exact AION-labeled mock request is persisted; mock destination accepts once; mock reply is observed as complete from the correct mock conversation; response returns to the mock origin and is actually consumed; validator approves **MOCK_ONLY** proof. Receipt distinguishes accepted/delivered/observed/readback/validated.

Negative: mismatched correlation, wrong destination/conversation, forged producer principal, expired scope grant, duplicate message ID or key, empty reply, partial/streaming reply, spoofed reply not actually observed, tampered payload hash, fake `M1_VERIFIED` state, crash before ACK and replay, disconnected adapter timeout, login-required simulation, unauthorized host command. On deny there must be NO task execution/verification promotion, and any retry must be idempotent.

## Execute in sandbox after fixture build
```sh
set -eu
cd m1-sandbox-output
node --version
node --test tests/*.test.mjs > evidence/test-stdout.txt 2>&1
cat evidence/test-stdout.txt
```
**Important:** a shell redirected to `test-stdout.txt` alone is not proof the command passed; record the process exit code and original Z.ai execution reference. On failure keep files/logs and mark TEST_FAILED. Do not run the packaging command that labels output green.

## Integrity and export (run only on successfully tested files)
```sh
set -eu
cd m1-sandbox-output
find . -type f ! -path './evidence/SHA256SUMS' -print0 | sort -z | xargs -0 sha256sum > evidence/SHA256SUMS
sha256sum -c evidence/SHA256SUMS
cd ..
zip -q -r m1-sandbox-output.zip m1-sandbox-output
sha256sum m1-sandbox-output.zip
unzip -t m1-sandbox-output.zip
```
If `zip` is unavailable, use `tar -czf m1-sandbox-output.tar.gz m1-sandbox-output` and record actual SHA-256; label alternate format. ZIP SHA-256 is reported outside ZIP, in the actual Z.ai turn receipt. The included SHA256SUMS excludes itself to avoid a circular hash. If publishing test receipts in GitHub, sanitize output and disclose no tokens, cookies or private transcripts.

## Independent review in a clean folder
```sh
set -eu
mkdir -p independent-check
cd independent-check
unzip ../m1-sandbox-output.zip
cd m1-sandbox-output
sha256sum -c evidence/SHA256SUMS
node --test tests/*.test.mjs
```
Reviewer must also inspect the test assertions for true denial (not just printing PASS), inspect for network calls and credential collection, compare input commit/manifest, verify clone SHA vs requested pinned SHA and check for omitted files. Review separately from author. A reviewer cannot mark SANDBOX_TESTED merely by reading Z.ai's final summary; actual produced bytes, logs and clean rerun needed.

## Failure / recovery checklist
1. Source inaccessible: do not ask for credentials; switch to user-approved minimal source capsule or embedded source-based fallback in ZAI-TURN-1.md; report INPUT_NOT_CLONED.
2. Build/tool unsupported: return source + exact missing capability, no invented preview/run.
3. Test failure: retain current files/logs and source diff; use the conditional REPAIR-ONLY prompt. Never wipe evidence or restart from scratch by default.
4. Disconnect: ensure persisted local mock outbox and cursor; rerun fixture; verify exactly-once consumer effect despite at-least-once transport.
5. Export unavailable: return file tree and complete source/patch through supported UI, mark EXPORT_BLOCKED and request authorized retrieval.
6. SHA mismatch: refuse promotion, extract again and identify file drift; do not silently update hashes.
7. Browser fixture unavailable: exercise Node/DOM-independent contract tests; mark BROWSER_UI_UNVERIFIED, not PASS on visual coverage.
8. Owner master: never install or merge from Z.ai sandbox automatically. Separate approval, scope, provenance and rollback.
9. Live ChatGPT target: explicit STOP; owner-authorized operator performs real authenticated test outside Z.ai. Sandbox `MOCK_ONLY` must never be relabeled M1_PASS.

## Actual receipt fields
mission_id; selected model OBSERVED/UNKNOWN; initial Git commit SHA or INPUT_NOT_CLONED; environment/version; commands+exit codes+UTC; test case IDs outcomes; export mechanism/path/byte size; SHA-256; clean-room verification actor and result; blocked unknowns; host changes = NONE; live ChatGPT test = NOT_ATTEMPTED.

**Promotion gates:** DOCUMENTED → READY_FOR_ZAI (05 scope review + 03 verified submission route) → SANDBOX_TESTED (actual run) → EXPORTED (actual accessible bytes/hash) → INDEPENDENTLY_VERIFIED (separate reviewer) → LIVE_READY (separately approved host plan) → M1_VERIFIED (actual authenticated service, never sandbox).
