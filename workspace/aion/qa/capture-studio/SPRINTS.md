# QA / Steering — Five-Sprint Program (2026-10-22)

**Owner:** ChatGPT QA + team steering. **Source baseline for plan:** `5eefb2e34345aa5d01d888f0a8d3e034e0ea0fc7`; refresh live HEAD before new work. **Worklog:** `capture-studio/ASSESSMENT-AND-WORKLOG.md` W1–W18, plus `qa/capture-studio/FINDINGS.md`, `INTEGRATION-ROADMAP.md`, `ROADMAP.md`, agent queues and Development/Harvest exchange.

**Authority:** independent QA and cross-lane steering only. **Do not edit implementation, impersonate a runtime, activate other agents, override their sprints, resume paused Core, or gate routine builds.** Owner's separate pure-vibe-coding direction applies to Opus building, not QA's independent evidence. Do not use Playwright/Puppeteer. Do not perform unrequested live sends or leak private browser contents. Every test receipt pins exact source and execution environment. Every project-wide metrics report separates seven layers, shared/foundation, tests, evaluation, and current-vs-baseline deltas. No invented LOC.

## Worklog reconciliation

W1–W18 are **historical engineering objectives and QA acceptance questions**, NOT eighteen freshly unimplemented tasks. Core recently began a five-sprint development plan; UI/System lanes also have active sprint material. Before each QA sprint, reconcile latest commits, ownership, completed features and new source; never recycle a source-shipped item just because its old worklog checkbox is still open.

## Sprints (sequential for QA; builders keep working independently)

| Sprint | Outcome / worklog mapping | Independent QA deliverable | Acceptance / stop line | Status |
|---|---|---|---|---|
| **1 — Truth, ownership and eligibility** | Rebaseline W1–W18 against current code; newest conversation/drive/campaign/knowledge interfaces; owner consolidation decision and AX exchange | Source-traced contract map, reproducible static probes, ranked findings, owner/consumer handoff, updated steering state | Evidence distinguishes reply-match, derived, accepted; no unapproved Dispatch; exact SHA and limited scope declared | **SOURCE AUDIT COMPLETE 2026-10-22; runtime acceptance pending** |
| **2 — Browser effects and capture safety** | W4, W6, W17 plus newly shipped driving lease/send/cancel, field/masking and streaming | Independent adversarial tests/diagnosis: no double-send, unknown outcomes, exact tab binding, cancellation, split credential masking, truncated/gap accounting | No mistaken observed/accepted claims, no automatic duplicate side effects; unresolved Windows/browser conditions explicitly blocked | QUEUED |
| **3 — Identity, time and reconstruction** | W1–W3, W7–W10, W14–W15 | Deterministic identity/tenant/typed-key, rare-shape, graph stateAt, edge retractions, origin isolation, replay and correlation cases | No false cross-scope merges; source-linked historical values; source fidelity verified where executed | QUEUED |
| **4 — Knowledge and learning** | W5, W9, W11–W13, W18 optional | Reversible correction/promotion review, replay pinning, scope contamination, held-out before/after and false-match cases, evidence eligibility | Distinguish builder delivery from 7 L4 + 7 L5 independently accepted criteria; don't auto promote unaccepted families | QUEUED |
| **5 — Integrated Studio + AION adoption** | W16–W18, live conversation design/G1–G7 and owner's Studio→Track B consolidation decision | Full CLI/API/UI contract investigation and local-runner receipt assessment; one complete authorized conversation accepted or explicitly incomplete; Development ACK and canonical exchange adoption status | End-to-end captured, verified, derived, attributable and accessible evidence; no claim of real Windows/browser success without actual evidence | QUEUED |

### Work ownership and dependencies

- 🟦 **Core/build integrator:** capture, drive runtime/server/CLI, raw store, family acceptance, derivation wiring. Core's new five-sprint plan states the owner explicitly resumed that lane for its named Sprint 1 scope; earlier paused notes are historical. This QA plan neither dispatches nor pauses Core.
- 🟪 **UI:** Chat/Drive/Knowledge client interactions and navigation; never build duplicate server logic inside UI.
- 🟩 **Knowledge & Learning:** versioned learner, scoped correction and eligible-evidence ingestion. Independent L4/L5 acceptance remains QA-only.
- 🟧 **Systems:** algorithm, safety and UX architecture recommendations, read-only unless separately authorized.
- 🟥 **QA:** inspection, independent tests/fixtures/evidence, risk order, user-facing alignment and handoff documentation only.
- 🔷 **Development/Harvest:** reconcile AION's canonical `EXCHANGE.jsonl` and Track B consumption of Studio; uninserted AX drafts are not acknowledged work.

### Active queue (keep no more than three)

1. **DONE (source only):** Sprint 1 source-truth and eligibility finding recorded at pinned SHA, ten V8 source probes; independent product tests pending.
2. **NEXT:** Sprint 2 no-double-send, capture coverage and secret-handling adversarial verification, using offline fixtures before owner-directed live.
3. **PARKED DEPENDENCY:** Get Development's exchange owner to register/ACK Studio consolidation; fix outdated Planning AION-X08. This plan is not such an ACK.

**Sprint 1 evidence:** [SPRINT-01.md](SPRINT-01.md). **Latest product source file/LOC inventory:** [SITREP-2026-10-22-FF.md](SITREP-2026-10-22-FF.md), pinned to `34e1a913`; do not silently reuse those totals as measured for `5eefb2e`.
