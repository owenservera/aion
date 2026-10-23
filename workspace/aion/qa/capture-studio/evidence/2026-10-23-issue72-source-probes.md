# Issue #72 — Independent bounded L1 source probes (2026-10-23)

**QA owner:** ChatGPT QA Steering. **Canonical task:** https://github.com/owenservera/aion/issues/72; **Core handoff:** https://github.com/owenservera/aion/issues/68. **Latest inspected main:** `7bbd20538a9dfe412048dd0d8b336a20b7ec51d6`. **Evidence mode:** exact committed first-party function bodies fetched via connected GitHub and executed in an isolated V8 JavaScript harness with synthetic input. This is **NOT native Node product execution, full checkout tests, Windows, CDP, UI, signed-in browser, real capture, local acceptance or all of L1**. The executor had no Node filesystem/browser and no access to the user's local PC.

## Test A — G1/G2 context acceptance insufficiency (source-executed)

**Source:** `src/capture/acceptance.mjs`, GitHub blob `6d0058f21c65d003ec1f6533b07631a18f37d9af`. The exact `norm/tokens/turnsOf/gateG1/gateG2` implementation text was extracted into V8 with only local gate constructors supplied; no reimplementation of their logic. A synthetic prompt `Say hello` and reply `Hello there` were used. Six probes, six observed results matched inspection predictions.

| Probe | G1 | G2 | Distinction not independently verified |
|---|---|---|---|
| One matching user and assistant turn | passed | passed | Control, no send baseline |
| Repeated matching user prompts in saved DOM | **passed** | **passed** | G1 inspects only latest matching user turn; cannot establish *exactly one new submitted turn* |
| Unchanged historical assistant response (same final DOM, no pre-send snapshot) | **passed** | **passed** | G2 checks word order in latest assistant turn, not whether a new reply appeared after send |
| Latest user prompt differs | failed | passed | Mismatch control |
| Assistant reply words differ | passed | failed | Reply mismatch control |
| No conversation context | not-checked | not-checked | Missing-context control |

**Code-level evidence:** G2's returned diagnostic explicitly says `baselineCountCheck: 'not performed (no baseline supplied)'` even when G2 is `passed`. `deriveVerdict` publishes `capture_accepted` when all seven gates are `passed`; it does not separately require proof of post-send transcript growth. Existing Core offline positive fixtures provide the other gates using saved synthetic evidence, but **this harness did not run a full acceptance decision or a real send**.

**Finding QA-72-F1 — P1, source-confirmed contract gap, no observed user impact claimed.** A complete recorded transcript that contains a matching earlier prompt/reply can satisfy G1/G2 without evidence that a new submission happened or reply count grew. This is weaker than the documented G1/G2 acceptance contract. It matters particularly when `capture_accepted` becomes a family publication/learning eligibility signal. It does **not** demonstrate any actual duplicate send, false accepted real session, or defect in the new G5/raw-digest checks.

**Small Core fix request:** carry trustworthy before/after per-conversation turn identity/count evidence (or equivalent send/correlation evidence) through drive→acceptance. Treat no baseline / ambiguous growth as `not-checked` or `unknown`, yielding `capture_incomplete` rather than claiming a fully accepted capture. Distinguish sequential historical turns from new user submissions, and avoid reinstating an artificial one-turn product limit. Tests: unchanged pre/post DOM; prior matching reply; one proven new user+assistant pair; two unexpected new user turns; restart with missing pre-send cursor. Leave partial/raw captures browseable. **Route to existing Core issue #68; no new overlapping ticket.**

## Test B — Knowledge profile admission negative controls (source-executed)

**Source:** `src/intel/profile-evidence.mjs`, blob `2519d5c0ff56f4273cde04ed67a8af78fdc7cec2`. Exact first-party `profileAdmission` body and its supporting constants were evaluated in V8. Ten probes, ten expected results:

- Accepted document with all G1–G7, digest, seq range, recipe and Core validation assertion: `eligible=true` (positive).
- No Core validation assertion: `false / CORE_BINDING_NOT_VALIDATED`.
- Wrong acceptance schema: `false / INVALID_ACCEPTANCE_DOCUMENT`.
- Explicit rejected or incomplete verdict: `false / CAPTURE_NOT_ACCEPTED`.
- Missing G2 or failed G5: `false / GATES_NOT_PASSED`.
- Invalid raw digest, reverse seq range or absent recipe: `false / INCOMPLETE_ACCEPTANCE_BINDING`.

**Disposition:** **Source-level negative cases pass**, not independent K1–K7/A1–A7 acceptance. The `validatedByCore` flag is an external caller's assertion; actual production must invoke Core's raw-bound `readAcceptance(session)` rather than trust a forged flag or an unbound document. A false-positive upstream G1/G2 can still pass a downstream consumer that correctly trusts the Core verdict.

## Current round statuses and next action

| QA round | Honest status at this receipt |
|---|---|
| L0 Windows boot/doctor/UI/port | **NOT RUN** — no access to owner's Windows checkout |
| L1 full synthetic raw→accept→derive→family→packet→UI | **NOT RUN** — source functions exercised only, no whole checkout |
| L2 saved 107-session real-data replay | **NOT RUN** — user's saved data unavailable here; prior 0/60 remains historical |
| L3 lease/recovery | **NOT RUN** |
| L4 independent K1–K7 / A1–A7 | **NOT RUN** |
| L5 real controlled browser | **DEFERRED BY OWNER** since 2026-10-23 |

**Next QA priority:** when an actual checkout is available, execute current `test/unit/family-eligibility.test.mjs`, `test/unit/profile-evidence.test.mjs`, `test/unit/profile-adaptation.test.mjs`, `prototypes/saved-session-outcome.test.mjs`, plus one **new independent negative acceptance fixture** for missing before/after evidence. Use local run evidence `run.json`, `steps.jsonl`, `metrics.json`, `failures.jsonl`, `summary.md`, preserving raw files on the PC only. Compare source SHA before calling the tests current; source commits do not imply local installation.

**No production files edited, no physical local tests, no external provider sends, no secrets or transcripts accessed.**
