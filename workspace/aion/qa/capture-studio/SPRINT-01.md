# QA / Steering — Sprint 01: Trust, Ownership and Evidence Eligibility

**Status:** SOURCE CONTRACT AUDIT EXECUTED; independent runtime acceptance remains **OPEN**. **Execution date:** 2026-10-22. **Pinned inspected product SHA:** `5eefb2e34345aa5d01d888f0a8d3e034e0ea0fc7`. **Agent:** QA / Steering. **Ownership:** this QA folder only. **No browser actions, server writes, product edits, live sends, test claims outside recorded source probes or QA acceptance upgrades.**

## 1. Scope and execution

Read and reconciled `capture-studio/ASSESSMENT-AND-WORKLOG.md` (historical W1–W18), `QA-NEXT-TESTS.md`, the QA workplan, current Core/UI/Systems sprint work, the Studio unified-conversation design, QA Integration Roadmap, and Development/Harvest canonical exchange. Inspected the **complete contents of eight pinned files**: `src/capture/{actions,campaign,drive-lease,conversation-runtime,conversation-service}.mjs`, `src/families/build.mjs`, `src/studio/drive-api.mjs`, `ops/chrome-relay/harvest/EXCHANGE.jsonl`. Also inspected targeted ranges of `src/studio/ui/chat.mjs`. **Did not inspect every product source file for this sprint.**

**Executed:** ten deterministic **static source-contract assertions in the connected JavaScript V8 execution context**, against text fetched directly at the SHA above: **10 matched source expectations, 0 mismatched**. These are *source-shape checks*, not compiled Node tests, behavioral tests, site runs, or independent product acceptance. GitHub source was not mounted in the Linux Node runner (git remote DNS unavailable); no authenticated Windows access. Results are classified by finding, not summed into a misleading product test score.

### Ten executed source probes

| ID | Pinning assertion | Observed |
|---|---|---|
| S1 | `collectSessions` marks `hasDerived` from `!!shapes` | MATCH |
| S2 | Complete `src/families/build.mjs` contains no accepted-capture eligibility predicate | MATCH |
| S3 | `buildFamily` selects `sessions.filter(s => s.hasDerived)` | MATCH |
| S4 | Drive API explicitly says calibration reply matching is not capture acceptance | MATCH |
| S5 | Drive API exposes cancellation mode `after-current-site` | MATCH |
| S6 | Conversation service guards fresh sends with `ONE_TURN_LIMIT` and no-retry semantics | MATCH |
| S7 | Conversation runtime acquires shared driving lease | MATCH |
| S8 | Conversation-service code has no `accepted` lifecycle state | MATCH |
| S9 | Campaign `deriveAndConsolidate` call precedes `replyMatchesExpectation` | MATCH |
| S10 | Canonical `EXCHANGE.jsonl` has no AX-0022/23 or Capture Studio adoption record | MATCH |

Static assertions establish source patterns and call sequence, not whether a live session became corrupt. Re-read at newer SHA before recommending a patch.

## 2. Highest-consequence finding — family promotion before verified eligibility

**QA-S1-F1 — inspection-confirmed policy gap, high priority.**

- `src/capture/campaign.mjs:335–355`: the `driven.ok` branch invokes `deriveAndConsolidate` before applying reply calibration `replyMatchesExpectation`.
- `src/capture/campaign.mjs:169–209`: `deriveAndConsolidate` can call `buildFamily` and `writeFamily`, versioning the shape library.
- `src/families/build.mjs:54–80`: `hasDerived: !!shapes` is the only per-session derived marker in the collected record; there is no read of `acceptance.json` or G1–G7 verdict.
- `src/families/build.mjs:180–205`: the library normalizes SHAPES from derived sessions and uses them in the family signature/record, with no capture-acceptance filter.
- `src/studio/drive-api.mjs:50–59`: Drive clearly labels its `verified` result as **calibration reply matched, capture acceptance not checked**.

**Consequence:** at the audited revision, a session whose reply later fails calibration can still have its session SHAPES incorporated into the versioned family. The general library-build entry point can also consume derived-but-unaccepted sessions. This establishes an **inspection-grounded family eligibility defect**, not a proven cross-scope learner update or a reproduced live incident. Do not assert that L5 `ScopedLearner` was trained by these particular sessions without a separate ingestion trace.

**Handoff proposal, not Core dispatch:** Core/manager product integration should define one authoritative persisted acceptance verdict bound to source evidence, evaluator/version and session identity; family-build must use eligible accepted sessions only, or explicitly label any legacy/unassessed output as untrusted. Knowledge & Learning owns review of any downstream model promotion; UI must not relabel calibration `verified` as capture `accepted`. Preserve rejected raw captures for inspection, never delete to paper over failure.

**Independent runtime reproduction needed:** create synthetic sessions in isolated temp storage with `SHAPES` present but failed/unverified acceptance; run `buildFamily` and `runCampaign` with injected drive reply failing expectation; inspect versioned FamilyStore record and ensure no accepted label; then retest after remedy. Must not drive real logged-in accounts.

## 3. Secondary boundaries

- **QA-S1-F2 (source-proven, cross-team):** Studio consolidation decision exists in QA integration roadmap, but canonical Development/Harvest `EXCHANGE.jsonl` lacks AX-0022 offer and AX-0023 decision; these remain *drafts only*. Planning AION-X08 status is stale. The exchange owner/Development must record and acknowledge; QA must not fake handoff.
- **QA-S1-F3 (source-delivered, not runtime-accepted):** conversation service rejects new keys after spent/uncertain attempts (guard `ONE_TURN_LIMIT`), and conversation runtime acquires a host-local lease; latest UI separately offers a deliberate `Send again` for a client-side unanswered HTTP request, which may conflict with server-side one-turn restrictions when a previous attempt reached it. **Do not infer duplicate-send permission from the UI wording**; inspect exact server state, user-action cases and fixtures in Sprint 2.
- **QA-S1-F4 (scope truth):** Drive API's `after-current-site` cancel mode is not an in-flight abort; the unified conversation service's accepted evidence gate is not yet shown by source. These are known product limitations/design gaps; test their impact in Sprint 2 rather than asserting a live event occurred.
- **QA-S1-F5 (coordination freshness):** Core and UI have published **their own five-sprint workplans and Sprint 1 commits**, and Systems finished its own first source analysis; do not duplicate those commitments. Earlier 'Core paused' notes are superseded for its owner-initiated Sprint 1 work by Core's latest plan, which states the owner explicitly resumed that lane for Sprint 1.

## 4. Worklog W1–W18 intake decision

| Worklog items | Current QA treatment |
|---|---|
| W1–W3 | Existing Core code/tests and current Core Sprint 1: independent negative checks in Sprint 3, not a new implementation request |
| W4, W6 | Secret masking and causality: QA Sprint 2 |
| W5 | Versioned learner delivered partially; QA Sprint 4 |
| W7–W8 | Derivation/historical graph exist; QA Sprint 3 current-source behavior |
| W9–W11, W13 | Adversarial schema/correlation/relevance/learning, QA Sprints 3–4 |
| W12 | Benchmark comparison conditional on measured need, QA Sprint 4/5 (not blocker) |
| W14–W15 | Temporal process/reconstruction, QA Sprint 3 |
| W16–W17 | Integrated UI and local Chrome acceptance, QA Sprint 5 |
| W18 | Optional semantic assist, don't distract from one accepted capture; QA Sprint 4/5 if shipped |

## 5. Exit and next

**Sprint 1 completed portion:** plan + current W1–W18 reconciliation, ten executed source-level assertions, concrete F1 eligibility risk, cross-team handoff gap, and source-accurate owner boundaries. **Not done:** executable Node integration test at exact pin, independent verification of G1–G7, acceptance of L4/L5, Windows/browser proof, Development acknowledgement. It is therefore a **source phase complete / runtime acceptance pending** closeout, not a product acceptance certificate.

**Next QA sprint:** target no-double-send, ownership lease, cancellation, credential-boundary redaction and raw-stream coverage with adversarial offline tests. Preserve clean raw evidence and never trigger live-site Send merely to reproduce an uncertain action. Core/UI continue independently.

**Metrics:** physical LOC per layer were previously measured at `34e1a913` in [FF SITREP](SITREP-2026-10-22-FF.md): 165 code/test/eval files, 40,510 physical LOC, 135/35,089 excluding tests/eval. **Current pinned SHA `5eefb2e`: fresh exact LOC unmeasured.** New Sprint 1 GitHub artifacts are QA-owned Markdown; zero product source files edited by QA. Do not carry the older measured numbers forward as current.
