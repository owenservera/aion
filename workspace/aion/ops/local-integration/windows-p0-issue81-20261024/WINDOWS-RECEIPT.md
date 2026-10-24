# AION - Windows P0 stabilization receipt (issue #81)

**Sanitized. Snapshot of the working tree, not a published state.** At this snapshot the changes are uncommitted, unstaged and unpushed. Raw logs, `P0_METRICS` JSON and per-trial outputs stay on the owner's Windows PC (approved local Temp evidence folder); nothing in them is posted. No secrets, cookies, account identifiers, prompts, transcripts or personal path segments appear here.

**This receipt is not an activation acceptance and not a QA L2-L5 acceptance.** The owner has since authorized a next phase, "Merge + backed-up local activation", to follow the final suite (section 11); that phase has not been performed by the lane that wrote this receipt.

## 1. Identity
| Field | Value |
| --- | --- |
| Stacked base branch | `integration/zai-fourlane-owner-20261024` (PR #80 head; this work must not change PR #80 or `main`) |
| Exact base commit | `2e29754799143d540769ead6837a5ace272b4f8e` |
| Work branch | `stabilization/windows-p0-issue81-20261024` |
| Final commit SHA | `<FINAL_COMMIT_SHA - assigned when the parent commits; NOT known at this snapshot>` |
| Environment | Windows 11 Pro Insider build 29695, Node v24.22.1, Bun 1.4.2, PowerShell 7.6.3; single-owner local PC; disposable temp roots only |
| Scope | Issue #81 P0: B1 strict expected-version CAS, B2 lock handle lifecycle and error integrity, B3 store path traversal, B4 one persistence owner for factory and I1 |

## 2. Roles (reviewers are distinct from the builder)
- **Builder (all production code, tests and probe files):** Sonnet lane.
- **Independent source review:** Opus lane (read-only).
- **Independent probe execution:** GLM lane (tests-only, read-only; ran the builder's probe files and its own repeated trials).
- **Validation owner and final full-suite run:** parent session.

## 3. Frozen code blobs (git blob SHA-1)
Code last modified 2026-10-24T20:39:07Z. Paths are relative to `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`.

| File | git blob |
| --- | --- |
| `src/store/versioned.mjs` (shared persistence owner) | `e2df7184188d92577f465162a483b4d93b118bdd` |
| `src/studio/integration-hub.mjs` | `ad14f7a2d001983556ef56c6b2a10f1b4d68ea27` |
| `src/studio/http.mjs` | `182cc2f7515f2405c34e1006ff4db55ba11522c7` |
| `src/studio/server.mjs` | `e3e839c1557b193319cfaf879c84605ed2aec720` |
| `src/studio/adapter-factory-service.mjs` | `298068a6bedc7580c6130767398ba2c3394e36dd` |
| `src/studio/adapter-learning-pipeline.mjs` | `5797e0d0fe4620fa3a0a3fc4616b3c1579ebe4dc` |
| `scripts/adapter-factory-demo.mjs` (payloads updated, not executed) | `3509ac82a43f92f5e8ee4f334b29ab5c25415f95` |
| `ARCHITECTURE.md` | `856dc5947e78a049c922a1b94f532134c71c4c34` |
| `test/unit/p0-persistence.test.mjs` | `889cdc5cc00b55199d2948ed1d4f6dfbc1493677` |
| `test/unit/p0-windows-probes.test.mjs` | `0dc9a514e2f625c3d7842c9710f8e18e44b5d14a` |
| `test/unit/fixtures/p0-windows-worker.mjs` | `df601a007439b7f772b70ab2b9c4d3dafc1d599a` |
| `test/unit/adapter-learning-pipeline.test.mjs` | `acf189dc9e4ffe5556465d63d5ad0e3849efc23c` |
| `test/unit/adapter-factory-service.test.mjs` | `d33265c789d18123dd6d696b6d25ba84c5ba480c` |

`HANDOFF.md` and this file are documents and are not listed (a file cannot carry its own hash).

## 4. Review outcome
| Item | Result |
| --- | --- |
| B1-B4 source candidate | **Approved by the independent source review** on owner `e2df7184...` / hub `ad14f7a2...` |
| X1 (descriptor closed after a write/fsync failure), X2 (close exactly once, no retry), X3 (no inferred current version in the factory), X4 (hub forwards and requires `expectedVersion`) | Verified by the reviewer with throwaway fault and live-HTTP probes |
| S1 (a record must carry the name/version of the file it is stored in) | Fixed |
| S3 (committed/CAS facts reach HTTP clients through the hub response writer) | Fixed; an earlier handoff claim that they already did was false and was corrected |
| S2 (shared read-only payload-shape guard inside the generic store) | **Deferred, not claimed** (read-only is enforced by the I1 payload check and the factory authority checks) |
| S4 (per-file symlink checks for `vNNNN.json`/`CURRENT`; check-to-use TOCTOU) | **Deferred, not claimed** (the name directory and `.locks` are guarded) |

## 5. Executed checks (actual results; raw logs local)
| Check | Result | Notes |
| --- | --- | --- |
| Baseline B1-B4 reproduced on the base BEFORE any code change | **Red as expected** | `promote(null)` twice gave v1 then v2; ABA stale base valid after rollback; 300 ops leaked 300 descriptors and +300 OS handles (194 to 494); traversal over real HTTP returned 200 and moved another store's pointer; 2 processes x 40 plain saves lost 31 of 80 |
| Builder-side targeted tests (final blobs) | **Pass** | `p0-persistence` 55/55; 25 existing test files that import a changed module 266/266 (including the untouched 15 s CLI test) |
| **Independent probe run #1 (GLM)** | **8 pass / 1 FAIL - retained** | 2026-10-24T20:33:40Z: the cross-entry contention probe failed with 2 raw `EPERM`; reproduced by the reviewer in 4 of 6 trials; every case was in lock acquisition (`openSync(lock,'wx')` raising transient `EPERM`/`EBUSY`/`EACCES` while `existsSync` flickered). Probe assertions were not relaxed |
| Fix for that failure | Done | Acquisition now retries `EEXIST` and the transient codes until `lockWaitMs` (judged by the error code, not by `existsSync`); at the deadline a busy lock gives `CAS_LOCKED` with cause, a transient code with no lock gives the original annotated error; other open errors are never retried; an existing lock is never deleted or rewritten. 6 adversarial regressions (5 of 6 fail against the pre-fix acquisition, all pass with the fix) |
| **Independent run #2 - 10 contention trials** (20:43:57Z-20:44:35Z) | **10/10 pass** | 900 attempts: **738 commits, 162 `CAS_VERSION_CONFLICT`, 0 `CAS_LOCKED`, 0 other errors, 0 lost updates**; version files on disk equal commits in every trial; stderr empty |
| **Independent run #2 - full 9-probe run** (20:45:07Z-20:46:47Z, 99.9 s) | **9/9 pass** | see section 6 |
| `git diff --check` | Clean | CRLF warnings only |
| **Final full suite (`bun run test`) on these blobs (parent)** | **GREEN** | 2026-10-24T20:47:56.889Z-20:50:27.139Z, 149.56 s, exit 0: **1555 tests, 1554 pass, 0 fail, 0 cancelled, 0 skipped, 1 todo** (pre-existing `KH-04`). Run metadata: owner blob `e2df7184...`, hub blob `ad14f7a2...`, base `2e297547...`, Node v24.22.1, Bun 1.4.2. 1555 = 1490 base tests + 65 new (55 `p0-persistence`, 9 probes, 1 pipeline). The untouched 15 s CLI test passed (2.19 s). The earlier 1530-test figure is stale and must not be quoted |

**Raw-data correction:** the reviewer's written summary stated 728 commits / 172 conflicts and called the conflicts `CAS_LOCKED`. The raw per-trial metrics sum to 738 commits / 162 conflicts, and every trial reports `locked: 0`; the conflicts are `CAS_VERSION_CONFLICT`. The raw numbers are used throughout.

## 6. Independent full 9-probe run (raw metrics)
- **1000 committed operations** (500 direct owner + 500 I1 wrapper; conflicts not counted): OS HandleCount of the worker process sampled from outside after warmup was **175 at all five checkpoints** (n = 50, 300, 550, 800, 1000), max delta 0. Descriptor accounting through the owner's `io` seam: opens = closes = 3000, 0 open, 0 lock files left. The same sampling on the pristine base showed +300 handles over 300 operations (probe sensitivity, builder-side).
- **Killed real lock holder:** a child takes a real lock, pauses after the lock was written, fsynced and closed, and is killed (SIGKILL; death confirmed with ESRCH before liveness was read). The stale lock is refused (`CAS_LOCKED`), 4 wrong or malformed tokens are refused (`CAS_LOCK_TOKEN_MISMATCH`), recovery by the correct token works, the crash orphan v1 is preserved and the next first-create becomes v2.
- **Barrier races** (4 processes each; raw owner, factory, I1): exactly 1 winner, 3 `CAS_VERSION_CONFLICT`, 0 busy, final version 1, no lock residue.
- **Busy vs stale vs conflict counted separately:** live holder 3x `CAS_LOCKED`; dead holder 3x `CAS_LOCKED`; after token recovery 1 winner (v2) + 3 `CAS_VERSION_CONFLICT`.
- **Cross-entry contention** (3 `save` + 3 `compareAndSave` processes x 15) in that run: 77 commits, 13 conflicts, 0 locked, 0 other, 77 version files, `CURRENT` 77, 0 lost updates.
- **Shared owner paths:** factory promote, raw save, `compareAndRollback` and I1 promote are all refused by a lock another process holds in the one shared `.locks`; an unrelated scope is not blocked; `RESERVED_NAMESPACE` for factory promote/rollback on an `i1-*` name.
- **Fault matrix** (write/fsync/close on lock, version file and `CURRENT` temp, plus lock unlink): the injected error is the one thrown, opens = closes in all 9 rows, no lock residue, no pointer published; a conflict with an unlink fault keeps `CAS_VERSION_CONFLICT`; a commit with an unlink fault gives `CAS_LOCK_RELEASE_UNVERIFIED` with `committed: true, committedVersion: 1` and the change is durable.
- **Same probes inside the parent's final full suite:** all 9 pass; OS HandleCount 175 at all five checkpoints (max delta 0), opens = closes = 3000; killed-holder recovery with orphan v1 preserved and recovery v2; 1 winner + 3 conflicts per entry; cross-entry 76 commits, 14 conflicts, 0 locked, 0 other, 76 version files, 0 lost.

## 7. Gate map (conservative)
| Gate | State |
| --- | --- |
| L0 host/CLI/loopback | Bounded PASS earlier (disposable root, ephemeral loopback port; no Chrome, owner data or port 7878) |
| L1 / L3 / L4 | Unit and probe evidence only (synthetic; independent execution of the probes done). **Not** whole-round acceptance |
| L2 saved-session replay of owner data | **NOT RUN** |
| L5 real Chrome / provider | **NOT AUTHORIZED / NOT RUN** (0 provider sends) |
| Real-data crash/recovery, holdout/drift (QA L3-L4) | **Pending** |

## 8. Limits and residual risk (exact)
- Independent *execution* of builder-authored probes is not an independent QA acceptance.
- One machine; HandleCount readings were identical (175) in every sample of both the builder and the independent full runs, so the stated tolerance (<= 12) is a margin, not a measured noise level.
- The unlocked read paths (`current()`, `load()`, `versions()`) could in principle meet the same transient sharing errors while another process replaces `CURRENT`; not observed in 10 + 10 trials, not fixed here.
- Not measured: NTFS power-loss, antivirus interference, OneDrive/network folders, behaviour above 9999 versions (only a coded refusal is tested). A live HTTP durable-commit with an unverified lock release was not triggered end to end (proven at the hub-writer level with an injected error and at the owner level in-process).
- The 1000-operation probe is fsync-bound (about 88-111 s per run; 109 s inside the final suite) and dominates the suite wall time; the intermittent 15 s CLI test did not recur in the final run.

## 9. Safety statement
The existing read-only learned-adapter registry/view and the writable send path (`getAdapter`) are unchanged; learned adapters remain data-only with `sendPermission: false`. No owner data, saved session, provider, browser, Chrome, Playwright or live send was used by any test or probe; no activation or local production update was performed; PR #78 was not grafted.

## 10. Operator instructions
Migration, rollback and operator-guided stale-lock recovery (inspect, verify, release by token, never delete blindly) are in `HANDOFF.md` sections 6-8 and are unchanged.

## 11. Verdict
- Source candidate B1-B4: **approved by independent review**, with S2/S4 explicitly deferred (not closed). Independent probe evidence: **yes** (8/9 first run retained, then 10/10 trials and 9/9 after the fix). **Final full suite on the frozen blobs: green (1555 / 1554 pass / 0 fail / 1 todo).** Full QA L2-L4: **pending**. L5: **not authorized**.
- **Owner decision (recorded by the parent; supersedes the earlier "no merge / no activation" instruction for the next phase only):** the owner explicitly chose **"Merge + backed-up local activation"** after the final suite: back up the owner data and configuration, activate on the existing loopback Studio, run a smoke check, keep a rollback path, and perform **no real provider send**. Activation is therefore an owner-authorized next phase, not a perpetual NO-GO.
- This receipt does **not** show that a merge or an activation has happened; commit/push/PR/merge and the activation are dispatched and coordinated by the parent (a separate host-reconciliation lane is underway). The decision does not close the remaining QA, S2/S4 or the residual read-path risk, and an activation smoke check will be a separate receipt (it is not L5). The P0 code is frozen; any further code change needs its own review and a new full-suite run.
