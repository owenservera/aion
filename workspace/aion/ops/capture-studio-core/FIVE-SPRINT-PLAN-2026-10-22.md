# CORE — Five-sprint worklog rebaseline

**Owner:** AION Capture Studio CORE. **Authorized:** user, 2026-10-22, "assess worklog queue for you and break into 5 sprints and begin sprint 1".
**Source baseline:** `34e1a913248c717c7f3d7c54f4be30bc9b23a098` (2026-10-22 14:51 UTC). CORE worklog is `capture-studio/ASSESSMENT-AND-WORKLOG.md`, W1–W18; newer direction is `capture-studio/docs/DESIGN-live-drive-studio.md` §12–16 and QA `INTEGRATION-ROADMAP.md` §10: one canonical Studio capture/drive engine.
**Interpretation:** User's explicit new Sprint 1 implementation instruction resumes CORE for the named work only, superseding earlier role notes saying CORE paused. It does not resume other lanes, authorize live sends or Chrome operation, or imply accepted functionality. Keep UI files with UI, L4/L5 specialist algorithms with their lane, independent QA with QA. No Playwright/Puppeteer.

## Why the old queue needed a rebaseline

- W1 is NOT an unstarted rewrite. The committed `eval/results/w1-2026-10-21.json` reports 1.00 key accuracy on dev and held-out, versus 0.50 in the earlier baseline. W1 remains pending current-source rerun, adversarial and real-site confirmation, not redesign from scratch.
- W2 order-independent type-merge and rare-shape sampling exist in `src/intel/discover.mjs` / `schema.mjs`; their adversarial acceptance still needs current-head execution.
- W3 keyless linkage v2 and missing-key provisional identities exist. Cross-session typed-key grouping was still conflating string and numeric keys at baseline. L4 specialist owns deeper algorithmic false-join evaluation.
- W5 scoped learner journal and review/revert lifecycle exist (specialist builder tests), but current live derive/CLI/API integration and acceptance are distinct.
- W7 source derivation and CLI/API are present; W8 event-sourced history is partially present. Do not count functionality by vintage worklog checkboxes alone.
- New highest-risk seams are the real send/drive lease lifecycle and eligibility of captured data for shape-learning. Current `src/families/build.mjs` uses SHAPES presence; `src/capture/campaign.mjs` can consolidate before reply calibration verdict. The proposed G1–G7 `acceptance.json` sidecar has not been implemented; until then, NEVER call a derived or calibration-matched session accepted/learning-eligible.
- Track B is to become a client of Studio under the owner consolidation decision. This plan does not edit the cross-team `EXCHANGE.jsonl`, Development's native host, or their task queues.

## Sprint 1 — Trust Foundation — ACTIVE

**Coverage:** W1–W4 (verify existing W1–W3 rather than rebuild), plus production no-resend and typed key join fixes. **North star:** no fabricated send, unsafe identity merge, or hidden raw-leak claim.

1. **[SOURCE DELIVERED] Strict one-dispatch boundary:** once typing/send has started or a delivery result is uncertain, a new idempotency key cannot trigger a second dispatch. Existing blocked-before-typing retry with new key remains allowed. A duplicate original key replays the existing attempt read-only, including after a finish. Code `src/capture/conversation-service.mjs`, commit `435d6038`; comment aligned `2b97f219`; regression `test/unit/conversation-service.test.mjs`, commit `9b339507`.
2. **[SOURCE DELIVERED] Typed-key continuity:** numeric `42`, string `"42"`, and legacy unknown key type are separate continuity and drift groups. Preserve old EIDs and communicate legacy uncertainty; no implicit same-origin account proof. Code `src/intel/continuity.mjs`, commit `377438fd`; regression `test/unit/trusted-knowledge.test.mjs`, commit `d4811f09`.
3. **[SOURCE VERIFICATION]** V8 source-loaded in-memory service confirmed uncertain send, rejection of fresh key before/after read-only reconcile, and same-key read-only replay: 1 external submit. V8 source-loaded continuity with simulated JSONL sessions confirmed three typed cohorts and exactly two same-type joins. **NOT** native Node `node --test`, GitHub CI, local Chrome, real send, Windows or independent QA.
4. **[OPEN]** Execute pinned full Node suite and `eval/run.mjs` dev/heldout/heldout2 scorecards in an actual checkout; W2 shuffle and rare 1/2,000 replay; W3 chain-merge and negative site/account fixtures. Save measured counters and failures, without moving held-out examples into training.
5. **[OPEN]** W4: audit cross-chunk credential masking at the raw-write boundary and prove split secrets never survive in raw/events/exports. Prefer fail-closed capture if scanner cannot guarantee this, rather than retrospective masking claims.
6. **[OPEN]** Same-origin account/tenant may not be safely joined without a trustworthy namespace; do not infer from URL alone. Legacy rows without `keyType` are deliberately retained in their own cohort and require an explicit rederive/migration plan.

**Exit:** Node/Eval receipts at pinned SHA, confirmed no automatic uncertain resend, typed identity regression, negative privacy fixtures, and independent QA backlog. Source changes alone are partial Sprint 1, never "Sprint 1 accepted".

## Sprint 2 — Reliable Evidence Pipeline

**Coverage:** W6–W8 plus captured→verified→accepted G1–G7 contract.
- Preserve one shared browser lease and exact-bound session/turn journal, cancellation/finalization recovery; verify no active legacy CLI/drive can bypass the lease.
- Represent `acceptance.json` as versioned and bound to raw digest, evaluator version and sequence range. Unknown versions/mismatches mean **unassessed**, never accepted or rejected by guess.
- Require accepted eligibility explicitly for family-learning exports; retain raw evidence for unassessed/rejected sessions and display exclusion counts.
- Mechanism-backed causal assertions and temporal graph corrections/edge history; complete stop/flush/verdict/source integrity E2E negatives.
- **Exit:** reversible derived view, no partial capture represented as accepted, deterministic fixture suite, one authorized live proof ONLY if separately approved.

## Sprint 3 — Stronger Intelligence

**Coverage:** W9–W12.
- Schema alignment and drift detection, correlation across ambiguous/near-duplicate streams, relevance dimensions without discarding evidence.
- Benchmark clear baseline alternatives (GenSON, quicktype, Splink, Ajv) only when they provide measured signal; runtime remains dependency-light by default.
- **Exit:** dev/heldout2 scorecards (precision/recall/F1/calibration and truncation), evidence of graceful abstention and explicit retain/replace decisions.

## Sprint 4 — Adaptive Knowledge

**Coverage:** W5, W13–W15; specialist owns L4/L5 inference and journal internals.
- CORE integrates pinned learner revisions in derive, authenticated review/propose/revert contracts, safe actor and evidence references, conflict reporting and rollback lineage.
- Specialist evaluates real separate-site calibration, out-of-order contradictions, account/tenant contamination and promotion safeguards.
- Behavioral transition graph, relevance-based selective questions, reconstruction fidelity and observed/inferred/unavailable labeling.
- **Exit:** reviewed correction → new scoped inference → revert restores baseline; no raw mutation; independent L4/L5 A/K criteria tracked individually.

## Sprint 5 — One Complete Product

**Coverage:** W16–W18 and master integration P0–P6 (other-team ownership respected).
- Unified CLI/API/Chat/Drive/knowledge browse and state consistency; do not rebuild UI screens already shipped.
- Studio is sole driving/capture engine; Track B consumes one documented lease/receive/Send contract, with Development owning its client integration and retirement decisions.
- First-run Windows/Chrome manual execution, bounded authorized real-site checks, privacy and recovery acceptance, measured perf and release docs.
- Optional level-3 semantic assist only if held-out gain is demonstrated, with full functionality when off.
- **Exit:** independent QA acceptance receipts, host-proven operations and clear unsupported states. No source-code commit alone closes this sprint.

## Reporting contract

Every sprint: (1) ship and commit small CORE-owned changes, (2) read back remote commits, (3) distinguish code/source checks, actual Node tests, Windows/browser and independent QA, (4) refresh main and cross-agent dependencies, (5) update this plan and standing queue; (6) count physical LOC only with canonical QA checkout counter. No invented timelines, artificial LOC or percentage completion; no automatic live sends.

## Sprint 1 — additional source check and next pull (2026-10-22)

- Dedicated typed-drift negative test added at `5eefb2e3`: a numeric key and text key with the same display value must not create a schema/type-drift hint. Source/test syntax of both changed modules and both touched test files parsed in V8; **the new Node test itself has not run in a native checkout**.
- **W4 source-observed defect still open:** `src/capture/network.mjs:_chunk` calls `scrubSecrets(buf)` on each incoming chunk and writes the result directly to raw JSONL. `src/capture/redact.mjs` currently matches JWT/Bearer/credential syntax inside a **single** supplied buffer; split 2–3-part tokens may bypass this pre-disk scan. Retrospective full-body masking does not repair streamed raw chunks. Do not claim full credential containment until pre-append cross-chunk negative tests pass and a bounded fix ships.
- Do not assume historical worklog W1 scorecard proves the current production distribution. Current-head `eval/run.mjs`, held-out v2, and same-origin account negative fixtures remain required.

## Sprint 1 — W4 streamed pre-persistence security delivery (2026-10-22)

**Source delivered, acceptance pending.** See [W4 security receipt](W4-PREWRITE-SECURITY-2026-10-22.md) for pinned code/test commits, byte withholding, explicit suppression semantics, evidence and limitations.

- `stream-guard.mjs` adds 128-byte rolling HTTP quarantine and whole-frame WebSocket/EventSource quarantine, recognizing the previously supported JWT/Bearer/credential-field families and selected API-token markers **before** raw append. A suspicious marker or overlarge frame/chunk causes explicit `body.excluded`, not a speculative partial scrub. HTTP holdback only flushes on a successful end; incomplete tails are dropped with a coverage reason.
- Raw append, tap/reducer and downstream exports consume only guarded records. This does not prove that arbitrary unknown/encoded credential formats are detected; the current rules are conservative marker-based and may reject benign content.
- Commit receipts: `a2b70565` (guard), `5993f882` (HTTP), `57f38386` (WebSocket), `58f8052c` (EventSource), `ea3f3570` (bounded frame count), `4b22dc1d` (withheld-byte metadata), `d38295cd`/`1dc5e6da` (nine Node test cases).
- **Executed here:** current remote code parsed in V8; loaded actual module bodies with a test-only ASCII Buffer shim and simulated CDP. Clean body round-trip, 30 split-marker/size combinations, HTTP raw exclusion, WebSocket exclusion, EventSource exclusion and bounded frame memory passed. **No actual installed Node module suite, real raw JSONL/export round trip, browser/Windows or independent QA was run here.**
- **Next sprint-1 gate:** execute the checked-out Node 22 unit/e2e suite and `eval/run.mjs` held-out scorecards; add real raw→events→export leak regressions and latency/memory measurements for SSE, WS, high-volume and truncation. Record current SHA and failure counts. Do not call W4 fully solved; avoid blanket credential-safety claims for opaque formats.
- **Sprint-2 consequence:** every `body.excluded` / `securityWithheldBytes` affects the clean-data gate and must prevent automated accepted-data promotion until evaluated. Distinguish loss of content from falsified or empty content.
