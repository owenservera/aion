# AION — Owner Windows Local Integration Receipt

**Filled from the actual owner machine on 2026-10-24. Z.ai sandbox results were not used to mark any gate.** Status: **Pre-publication verification snapshot as of UTC 2026-10-24T19:37:50Z; see the linked PR/issue for the eventual commit/push.** At snapshot time the integration was an uncommitted, unpushed staged merge; parent source/evidence reconciliation is done; independent full QA is still pending. Statements below such as 'no commit' and 'nothing pushed' describe that snapshot, not the published state. Raw logs stay on the Windows PC; this receipt is sanitized (no account IDs, prompts, transcripts, tokens or personal path segments).

## Source and execution
- Executor/device (generic): single-owner Windows 11 Pro Insider build 29695 local PC; agent-driven, isolated worktree
- Execution timestamp and timezone: 2026-10-24T18:57Z to 19:33Z (UTC); receipt finalized 2026-10-24T19:37:50Z (UTC); local TZ `Romance Standard Time` (UTC+2)
- Repository root path (redacted): `<workspace>\AION` (original, untouched); review worktree `<workspace>\aion-zai-fourlane-review`; stage `<workspace>\aion-zai-export-20261024`
- Base branch and SHA (progression): local `main` `521b9822da7f0e1bbfe73c9578b84c786e2dc50c` (clean, worktree creation base) **→** fast-forward inside the new isolated worktree only (parent-approved; `merge-base --is-ancestor` exit 0, 51 commits, 0 diverged) **→** `fa9cb7f5c20040377ebd8ff28678bb24c7cc7dc9` (= `origin/main`, merge base used). Original worktree/`main` never advanced (still `521b9822…`). Remote `main` was `fa9cb7f5…` at this review.
- Base dirty/unpushed edits: **no** (0 dirty paths, 0 unpushed commits); original worktree still clean at `521b9822`, not synced
- Archive SHA-256 (optional): `d8e6ec1de13beb1ea5cdecc121ce17041a501473485d7cb8060e6e68036b06df` — matches pinned value; 831 members, 0 absolute/traversal/link/special members; only 2 bundles + 3 manifests extracted (no wrapper workspace, no embedded `.git`, top-level `.env` member never extracted or read)
- Round8 bundle SHA-256 checked: **yes**; `5a94dd3ae13816117dd19789fe90255d16f7609f99e58664271f3839bcbad085` match; `git bundle verify` ok
- Four-lane bundle SHA-256 checked: **yes**; `afa93c24706b2a9733af40379ddf842d5053b9730642837fb139a2abfb61a74a` match; `git bundle verify` ok
- Imported Round8 ref SHA: `23185932abc7615a25207111f07328ebfb2a0074` (`import/zai-round8-20261024`, 23 commits) — equals expected
- Imported four-lane ref SHA: `5ef062581e9ef887b512f6e6ef65703bc72e3337` (`import/zai-fourlane-20261024`, 4 commits) — equals expected
- Owner integration branch and commit SHA: branch `integration/zai-fourlane-owner-20261024`; **no integration commit yet** (merge staged, `MERGE_HEAD` = `5ef06258…`, HEAD = `fa9cb7f5…`)
- Conflicts: **0** (`merge --no-ff --no-commit` exit 0; no unmerged paths, no conflict markers). Nothing resolved by ours/theirs.
- Node / npm / Bun / PowerShell / Windows: Node v24.22.1, npm 11.19.1, Bun 1.4.2, PowerShell 7.6.3, Windows 11 Pro Insider NT 10.0.29695

## Local fixes applied on top of the merge (the only edits; all staged, none committed)
| Path (under `capture-studio/`) | Change | Reason / evidence |
| --- | --- | --- |
| `src/studio/intent-bindings.mjs:50` | post-rename durability flush `openSync(file,'r')` → `openSync(file,'r+')`; fsync, rename, exclusive lock and fail-closed behaviour unchanged | Windows `fsync` on a read-only handle throws `EPERM` (reproduced in isolation); `complete()` threw after the atomic rename. The base repo already uses `'r+'` for the same flush in `conversation-service.mjs` and `thread-turn-journal.mjs`. |
| `src/studio/server.mjs` | CRLF → LF line endings **only** (527 CR bytes removed; 0 lone CR) | Cleared `git diff --cached --check` (97 CRLF complaints, this file only). Verified: CR-stripped bytes SHA-256 `da9fcedd400d52a71b4e41c3624ceaf141324d29c86e162f580d9573a830cf57` is identical before/after and equals the CR-stripped imported blob; `git diff --cached --ignore-cr-at-eol 5ef06258 -- server.mjs` is empty. |
| `test/unit/round9-guardrails.test.mjs` | +2 assertion lines in the existing completion test: a fresh store instance reads the durable completed record | Regression guard that the flush fix preserves persistence/reopen; existing red evidence for the EPERM was the unchanged original test. |

Review note: `server.mjs` shows as a whole-file rewrite in a plain diff (the base stores it as CRLF); use `--ignore-cr-at-eol`. CR-insensitive staged total: 89 files, +9404 / −86. Plain total: +9834 / −516.

## Executed checks (real local evidence only)
| Check | PASS / FAIL / NOT RUN / BLOCKED | Evidence |
| --- | --- | --- |
| Bundle verification/import | **PASS** | both `bundle verify` exit 0; heads asserted equal; 23 + 4 commits |
| Merge from owner committed base | **PASS** (0 conflicts; uncommitted) | `MERGE_HEAD` 5ef06258, 89 staged paths |
| `git diff --cached --check` | **FAIL before fix, PASS after** (exit 0, 0 lines) | CRLF-only in `server.mjs`; fixed by LF normalisation |
| Privacy/security scan of staged set | **PASS** | 0 secret patterns, 0 emails, 0 personal paths, 0 binaries >200 KB; one Z.ai sandbox path string in `docs/shape-atlas/atlas.json` metadata; fixtures declare `SYNTHETIC_TEST_ONLY` |
| Capture Studio unit suite (`bun run test` → `node --test "test/unit/**/*.test.mjs"`) | **PASS after fix** | see counts below |
| L0 host/CLI/loopback | **PASS (bounded)** | disposable data dir, CDP port pointed at an unused port, Studio on ephemeral loopback port; see L0 |
| L1 raw/DOM/derive/knowledge/outcomes | **PARTIAL - unit checks PASS (synthetic evidence only; not whole-round acceptance)** | 10 existing test files, 104 tests: 103 pass, 1 todo (KH-04, pre-existing) |
| L2 read-only saved session replay | **NOT RUN** | private saved data deliberately not opened |
| L3 lease, replay fence, unknown effect, old intent binding | **PARTIAL - unit checks PASS (synthetic evidence only; not whole-round acceptance)** | 13 existing test files, 261 tests: 261 pass |
| L4 independent evidence, adapter learning/rollback | **PARTIAL - unit checks PASS (synthetic evidence only; not whole-round acceptance)** | 16 existing test files, 182 tests: 182 pass |
| L5 real Chrome/provider | **NOT AUTHORIZED / NOT RUN** | no Chrome, no provider, no sends |

- Exact unit suite totals (after fix, `bun run test`, exit 0, 67 s, 2026-10-24T19:29Z): **total 1490 passed 1489 failed 0 todo 1 skipped 0 cancelled 0** (the one todo is the pre-existing `KH-04` marker in `knowledge-handoff.test.mjs`)
- Before fix, same machine: run 1 → 1490 / 1487 pass / 1 fail / 1 cancelled / 1 todo (331.7 s); run 2 → 1490 / 1488 pass / 1 fail / 0 cancelled / 1 todo (171.9 s). Z.ai sandbox reference (Linux, Node v24.21.0, not Windows evidence): 1490 / 1489 / 0 / 1 todo.
- Targeted `round9-guardrails.test.mjs` after fix: 12 / 12 pass.
- Intermittent timeout: `conversation-tools.test.mjs` "actual bin/studio.mjs tools command…" (15 s limit) timed out once under cold full-suite load (run 1), passed isolated (1.55 s) and in runs 2 and 3. The timeout was **not** weakened or modified; cause attributed to host contention, unproven.
- Real authenticated-provider sends: **0**
- Accepted G1–G7 sessions: verified **0** / unassessed **n/a** / not-run **all** (no real captures were evaluated)
- Fresh two-turn attribution: **not-proven** (no live run)
- Native U1 content source: **placeholder** (conservative `[]` feeds, as documented by Z.ai receipt; not independently inspected beyond unit tests)
- Learned read-only selection: **diagnostic-only** (diagnostic routes; not wired into `getReadAdapter` precedence)
- Caller-supplied account proof: **pending / issue** (account scope is caller-asserted at the server route per Z.ai receipt; sessions do not yet record account provenance)
- Runtime rollback path tried: **no**
- Local journal and source evidence remained intact: **confirmed for this run** (no owner data or journal was opened; all runtime checks used a disposable root)

### L0 detail (disposable root; owner data, active port 7878, Chrome, providers untouched)
- `--version` (`0.1.0 9aed4d8a9bc4f3d7`), `help`, `paths`: exit 0.
- `doctor --json`: exit 0, `ok: true` — node ok, chrome install found (path lookup only), devtools **warn** (unused port, not running, as intended), data-dir ok, 0 sessions, profiles warn (3 profiles, 0 errors, 2 lint warnings — `studio profile lint --all` not run), learner ok (revision 0), config defaults.
- `selftest --json`: exit 0, all `required` checks ok — 156 modules import cleanly, platform functions, Studio started on an ephemeral loopback port and stopped, `/api/x/stats`, registry (5 kinds), OpenAPI 3.1 (81 paths). `cdp-endpoint` (info) not reachable on the deliberately unused port. Startup created `intent-bindings/` and `harness-runs/` in the disposable root, i.e. the new stores are wired at server start.
- Port 7878: no listener before or after. No Chrome launched or contacted; no Playwright/Puppeteer; no downloads or new runtime.

### L1 / L3 / L4 mapping (conservative — unit fixtures are not full round acceptance)
- **L1 (104 tests: 103 pass, 1 todo)** — `acceptance-baseline`, `acceptance`, `derive-acceptance`, `family-eligibility`, `profile-evidence`, `profile-adaptation`, `trusted-knowledge`, `knowledge-handoff`, `stream-dom-join`, `core-runtime-bridge`. Shows synthetic gate/derive/eligibility logic behaves as specified, including withheld/unknown claims. Does **not** show the saved→raw/DOM→derive→G1–G7→knowledge→Outcome chain on real captures.
- **L3 (261 / 261)** — `round9-guardrails`, `thread-turn-journal`, `drive-lease`, `conversation-service`, `send-once`, `uncertain-step-reconciler`, `uncertain-step-reconcile-integration`, `harness-runs`, `harness-api`, `harness-executor-preflight`, `reconcile-lifecycle`, `conversation-runtime`, `conversation-thread`. Covers journal fences, restart/uncertain delivery without resend, same-key/different-intent conflict, corrupt-record refusal, and pre-Round-9 records classified `still_unknown` (incomplete binding stays unknown; not deleted). Synthetic only; no NTFS crash/lock acceptance of the real owner journal.
- **L4 (182 / 182)** — `adapter-capture-to-signals`, `adapter-factory-service`, `adapter-improvement-pipeline`, `adapter-learning-pipeline`, `adapter-probes`, `adaptive-adapter-factory`, `four-lane-gates`, `systems-probes`, `learning-heldout`, `learning-lifecycle`, `learner-journal`, `send-learned-readonly`, `sites-registry-learned`, `universal-chat`, `thread-identity`, `observation`. Covers held-out independence/overlap refusal, learned read view vs writable driver separation, server-minted promotion digest, drift/qualification, U1 read-only mount. Synthetic only; no real adapter learning against a live site.
- `ops/capture-studio-value-oracle/prototypes/saved-session-outcome` prototype: **NOT RUN** (outside the Studio suite; may read saved sessions).

## Independent review observations (recorded, not independently re-verified by the executor; parent reconciles against source)
- GLM read-only review reported no additional immediate blocker beyond the Windows flush: learned-read vs write fences, conservative unknown/retry, server-minted receipts verified.
- Noted limitations (no code changed for these): the lock-release `finally` in `intent-bindings.complete()` can mask an error raised in the body; the underlying `VersionedStore` is pre-existing and non-atomic, and factory promotion bypasses the CAS wrapper across processes — so cross-process / NTFS crash acceptance is **NOT VERIFIED**; account provenance, trusted pre-send baseline and U1 native feeds remain documented placeholders.
- The executed unit/L0 checks did not exercise the blockers below; a green unit run must **not** be read as safety or QA acceptance.

## NO-GO activation blockers (reported by independent Opus review; no product edit made for them)
Source status below = what the executor confirmed by reading the cited lines in the staged tree; "not re-tested" means the executor did not reproduce the behaviour. None of these are fixed by the three local edits above. Remediation is a separate, owner-scheduled change; **local runtime activation stays blocked until each is remediated and re-reviewed.** Publication of an isolated review branch is permitted; activation, merge to `main` and production use are not.

| # | Component / lines | Issue | Source read by executor | Reproduction status | Effect if activated |
| --- | --- | --- | --- | --- | --- |
| B1 | `src/studio/adapter-learning-pipeline.mjs` `promote`/`rollback` (≈75, 85) | CAS bypass: the version check runs only when `expectedVersion` is a safe integer, so `null`/`undefined` skips it. Two `promote(null)` calls write v1 then v2 instead of the second conflicting. | confirmed (`Number.isSafeInteger(expectedVersion) && v !== expectedVersion`) | reported by Opus; not re-tested here | the "expected-version CAS" claim does not hold for callers that omit the version; lost-update / unintended promotion of a read-only adapter record possible |
| B2 | `adapter-learning-pipeline.mjs` `withLock` (≈43–59) | the lock file descriptor is opened (`openSync … 'wx'`) and never closed; only the lock file is unlinked | confirmed (no `closeSync` on any path) | Opus NTFS repro: handle leaks but `unlink` still succeeds; not re-tested here | handle leak per promote/rollback; fails closed rather than unsafe, but unbounded in a long-running Studio |
| B3 | `src/store/versioned.mjs` `rollback`/`load` (≈60–64) | path traversal: `name` is joined into a filesystem path without validation, so `../profiles/chatgpt` can move another store's `CURRENT` pointer. Pre-existing gap in the base (file exists at `fa9cb7f5`); reachability, if any, is via the learned-adapter factory rollback route (per parent source reconciliation) - HTTP reachability is reasoned, not executed | `name` joined unvalidated confirmed; the new CAS wrapper hashes names (`i1-<sha256>`), the i1 CAS wrapper is therefore not the exposed path; the learned-adapter factory rollback route is the one that can pass a caller-chosen name into the raw store (per parent source reconciliation) | Opus: reproduced in a disposable repo; HTTP reachability **reasoned, not tested** (executor also did not test) | an authenticated local caller could repoint another store's current version (profiles/adapters) |
| B4 | factory (`adaptive-adapter-factory`/learned-adapter routes) vs i1 CAS wrapper over the same `VersionedStore` | namespace overlap and no cross-process CAS for factory promotion; the exclusive-lock wrapper covers only the i1 path | known limitation (documented in the Z.ai receipt and by GLM); not re-tested | acknowledged cross-process limit | concurrent factory/i1 writers can race; NTFS crash/lock acceptance NOT VERIFIED |

Additional documented limitations carried forward (not new): lock-release `finally` in `intent-bindings.complete()` can mask a body error; `VersionedStore.save` is non-atomic for the version file; account provenance, pre-send baseline and U1 native feeds are placeholders.

## Failure records / next owner
Record format per template: `{component, failing path, expected, observed, reproduction, base SHA, integration SHA, severity, assigned agent, evidence classification}`. Base = `fa9cb7f5…` (isolated worktree after fast-forward from local `521b9822…`); integration = merge of `5ef06258…` (uncommitted, no integration commit SHA yet). "Parent" = parent validation owner.

| ID | component | failing path | expected | observed | reproduction | severity | assigned | evidence classification | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | intent-binding completion (Windows) | `src/studio/intent-bindings.mjs` `writeReplacement` (line 50) | post-rename flush succeeds | `EPERM` on `fsync` of a read-only handle; `complete()` threw after the atomic rename | `node --test test/unit/round9-guardrails.test.mjs` on the unfixed merge (deterministic, runs 1 and 2); 5-line repro: `'r'`+fsync = EPERM, `'r+'`+fsync = OK | high on Windows; fail-closed for duplicate sends | fixer (applied), parent validation owner (review) | executed-local-Windows, deterministic | **fixed locally, staged, uncommitted; targeted 12/12 and full suite green after fix** |
| F2 | `server.mjs` line endings | `src/studio/server.mjs` | LF, `diff --cached --check` clean | 97 CRLF "trailing whitespace" complaints in this file only | `git diff --cached --check` on the unfixed merge | low | fixer (applied), parent (final `--ignore-cr-at-eol` check vs `5ef06258`) | executed-local, deterministic, formatting-only (base already stored CRLF) | **fixed locally, staged** |
| F3 | CLI-spawn unit test | `test/unit/conversation-tools.test.mjs` "actual bin/studio.mjs tools command…" (15 s limit) | pass | one timeout (15.3 s) in initial full run 1; passes isolated (1.55 s) and in runs 2 and 3 | full `bun run test` cold run | low, intermittent | parent / QA if it recurs | executed-local, **not reproduced**; cause (host contention) unproven | **open; test and timeout deliberately unmodified** |
| B1 | CAS wrapper | `src/studio/adapter-learning-pipeline.mjs` (≈75, 85) | conflict when versions differ regardless of caller input | check skipped when `expectedVersion` is not a safe integer; two `promote(null)` write v1 then v2 | Opus repro; executor confirmed by source read | high (activation blocker) | remediation owner TBD by parent/owner (separate scoped change) | independent-review finding + source read; not re-tested | **open, not fixed** |
| B2 | CAS lock | `adapter-learning-pipeline.mjs` `withLock` (≈43–59) | lock descriptor closed | `fd` never closed; `unlink` still succeeds on NTFS | Opus NTFS repro; source read | medium (handle leak) | remediation owner TBD | independent-review finding + source read | **open, not fixed** |
| B3 | versioned store | `src/store/versioned.mjs` `rollback`/`load` (≈60–64) | store `name` confined to its directory | unvalidated `name` joined into path (`../profiles/chatgpt` repoints another `CURRENT`); gap pre-exists in base; reachable, if at all, via the learned-adapter factory rollback route (HTTP path reasoned, not executed) | Opus disposable-repo repro; HTTP reachability reasoned, **not tested** | high (activation blocker) | remediation owner TBD | independent-review finding + source read; HTTP path untested | **open, not fixed** |
| B4 | factory vs i1 overlap | learned-adapter factory routes and the i1 CAS wrapper over one `VersionedStore` | single cross-process CAS owner | namespace overlap; no cross-process CAS for factory promotion; NTFS crash/lock acceptance unverified | documented limitation (Z.ai receipt, GLM, Opus) | high (activation blocker) | remediation owner TBD; PR #78 reconciliation deferred | documented, not re-tested | **open, not fixed** |
## Promotion decision
- Local worktree merge ready for review: **yes - for source/code review only** (at snapshot: uncommitted; the integration commit SHA is in the linked PR/issue)
- Push owner integration branch verified: **not at snapshot time** (nothing pushed then); the exact branch and remote SHA are recorded in the linked PR/issue after publication. Branch: `integration/zai-fourlane-owner-20261024` only; `main` is never pushed or merged.
- QA independent acceptance: **no** - parent source/evidence reconciliation is **done** (log counts, targeted rerun 12/12, diff checks, hashes recomputed); independent full QA is **still pending**. GLM and Opus reviews are advisory, not acceptance.
- Approved to merge into remote `main`: **no** (no decision made)
- Active local production update performed: **no** (original checkout and live Studio untouched; no activation)
- **Verdict: GO for source review of the staged integration and for publishing it as an isolated review branch only. NO-GO for local runtime activation / production update / merge to `main`** until blockers B1–B4 are remediated and independently re-reviewed, and the unverified gates below are closed. This receipt is **not** a full safety or QA acceptance: green unit counts are synthetic evidence only.
- Remaining unresolved uncertainties: blockers B1–B4 (CAS null-expectedVersion bypass, `withLock` descriptor leak, `VersionedStore` rollback path traversal, factory/i1 cross-process overlap); L2 saved-session replay and L5 real Chrome/provider acceptance not run; real G1–G7 on real captures unverified; cross-process/NTFS crash and lock-recovery acceptance of the owner journal and `VersionedStore` unverified; unresolved legacy journal data must stay `still_unknown`; Z.ai follow-on gaps 1–5 (pre-send baseline/capture ref, per-account provenance, learned-read precedence, U1 live feeds, NTFS/Chrome acceptance) remain open; PR #78 CAS prototype not reconciled or grafted.
