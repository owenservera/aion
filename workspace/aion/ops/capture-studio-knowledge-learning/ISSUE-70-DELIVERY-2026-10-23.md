# #70 — Knowledge & Learning October 23 Rebaseline and First Delivery

**Work order:** [GitHub issue #70](https://github.com/owenservera/aion/issues/70); **parent #67**; **baseline:** `3b2ea42f8da3c34f845569dc5a5b96402d8d7dea`. **Owner:** L4/L5 Knowledge & Learning. **Classification:** narrow code-delivered specialist increment; native Node 22 isolated test verified; cross-layer full repo/Windows QA unverified.

## 1. Existing October 23 Core work — reuse, do not duplicate

| Core surface | Current state / L4–L5 integration meaning |
| --- | --- |
| `src/profiles/stream-map.mjs`, `src/decode/delta.mjs` | ChatGPT path-op message reconstruction and event parsing are already implemented in source. Do not create another path-op decoder or mutate raw replay. |
| `src/decode/{protobuf,proto-features}.mjs` | Bounded structural protobuf feature extraction; path/adjacency signals are structural, **not** proof of reply role or delta semantics. Our profile projections do not reinterpret wire payloads. |
| `src/replay/stream-role.mjs`, `src/families/evidence-partitions.mjs` | Role classification and exact `URL.origin` stream separation already exist. Site profile review consumes `partition.site.origin` but does not claim that origin identifies the signed-in account. |
| `src/shapes/infer.mjs` | Existing ordered group fields, nested collection paths, proposals and drift heuristics are the input to a reviewable profile view. New code does **not** reimplement its inference machinery. |
| `src/capture/acceptance.mjs` | G1–G7 persisted acceptance producer exists, schema `capture-studio.acceptance/1`, `verdict: capture_accepted` when all pass. `readAcceptance(session)` checks stored digest/recipe. New L5 projection requires caller to explicitly attest it used this validated Core reader. Direct unverified supplied documents remain ineligible. |
| `src/families/build.mjs` | Still checks `hasDerived = !!shapes`, rather than validated accepted-capture eligibility. **Missing Core consumption gate is a blocking integration dependency**, not a reason to label stored derived data accepted. |
| `src/intel/{continuity,graph,learn,learner-journal,temporal-truth}.mjs` | Exact-origin typed-key continuity; event-time edges and removal; scoped versioned corrections and rollback exist. Account identity remains separate and unproven by origin alone. |

## 2. New L4/L5 deliverable

Added `src/intel/profile-evidence.mjs`, **90 physical LOC**:
- `profileAdmission(doc, {validatedByCore})`: requires Core-validated explicit `capture_accepted`, seven `passed` G1–G7 results, provenance digest, sequence range and recipe. No derived-only or inferred acceptance. Caller trust assertion is not an independent cryptographic proof; production must call `readAcceptance(session)` on the exact bound session.
- `profileEvidenceView({pageUrl, sessionId, account, shapes, partition, acceptance, validatedByCore})`: bounded *read-only* profile view using existing `SHAPES.groups[].fields` and `SHAPES.suggestions`, exact origin partition, source session/path locators, stable field order, parent/nested paths, heuristic score explicitly **not calibrated probability**. No private source string, suggestion detail, payload, raw URL query or proposed action is copied. An unaccepted or unknown-account profile stays viewable, not promotable. Model promotion is always `allowed:false`; human review is a separate step.
- `profileStructuralDrift(before, after)`: ordered, deterministic path additions/removals in same confirmed account+exact origin; refuses different/unknown scopes; drift is a **review-only structural hypothesis**, not semantic certainty.

**Committed unit tests:** `test/unit/profile-evidence.test.mjs` (6 actual native Node 22 tests), plus `test/unit/profile-adaptation.test.mjs` (2 full-repo integration-regression cases, **committed but not executable in isolated runner**). Test negative cases: unverified acceptance, incomplete G7, wrong origin/CDN, unknown account, unaccepted data, private source in suggestions, bounded collections, changed scope, nested paths. The full-repo test exercises a real `ScopedLearner`/`LearnerJournal`: synthetic two-session shape views → baseline rev1 → proposed correction does not train → reviewed accepted correction rev2 → 10-example heldout confusion improves from TP0/FP0/TN5/FN5 to TP5/FP0/TN5/FN0 → other-account unaffected → rollback rev3 returns original state with archived rev2 preserved. These matrix numbers are **expected assertions in source, not an executed full-repo result**.

### Execution receipts

- Isolated native Node **v22.16.0**, command `node --test test/unit/profile-evidence.test.mjs`: **6 passed, 0 failed** on exact source and test file content.
- Verified exact Git blob SHAs against local `git hash-object`:
  - `src/intel/profile-evidence.mjs`: `2519d5c0ff56f4273cde04ed67a8af78fdc7cec2`.
  - `test/unit/profile-evidence.test.mjs`: `b48ca15d6c8bb99647be7aeb46938d2cd647e1fb`.
  - `test/unit/profile-adaptation.test.mjs`: `01ce88628ac36c7ea258e917543cc33590b91d60` (source readback only; not natively executed).
- **NOT RUN:** full repo `npm test` / integrated adaptation test / actual Core `readAcceptance(session)` caller / GitHub Actions CI native suite / Windows UI/Chrome/local capture. The available GitHub Actions entries showed past `startup_failure`, not meaningful test receipts.
- **Acceptance:** Independent QA **K1–K7 0/7** and **A1–A7 0/7** remain unchanged.

## 3. Precise next steps, without new workstream

1. **Core interface, #68:** supply a narrow bound `{session, readAcceptance(session), SHAPES, partitionEvidenceStreams(..)}` read adapter; enforce **actual** accepted capture in family build/intake, not merely this projection's proposed gate. Produce a real `readAcceptance` recheck after raw mutation negative test.
2. **L4/L5 specialist:** run the new `profile-adaptation.test.mjs` in complete checkout and adjust any actual failure. Evaluate held-out quality on representative *saved eligible sessions*, separating synthetic uplift from real improvement. Add provenance for entity/edge locators and reviewed profile mapping only where observed outputs show gaps.
3. **L4/L5 proposal→model:** attach reviewed profile field choice to existing `ScopedLearner.proposeCorrection/reviewCorrection/save/rollbackTo`; explicitly pin consumed learner revision in Core derive metadata. Do not write a second learner engine or mutate immutable raw capture.
4. **QA #72:** independently execute the narrow group of `profile-evidence.test.mjs`, `profile-adaptation.test.mjs`, `knowledge-handoff.test.mjs`, `acceptance.test.mjs`, and `evidence-partitions.test.mjs` in the Windows L4 round; record source SHAs, failures, actual coverage and criterion receipts. No Playwright/Puppeteer.
5. **UI #69:** after Core data binding is proven, show existing shape proposals as explicit review candidates; no auto-approval or new parallel profile storage.

This is intentionally **partial** relative to issue #70's ultimate exit: reproducible production future derive using selected learned revision + accepted real evidence has not been wired or independently verified. Treat #70 as **in progress**, not closed.
