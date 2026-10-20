# AION Development — working desk

**Owner:** ChatGPT Development (this session and successors). **Authority:** [Development Master](../../DEVELOPMENT-MASTER.md), existing AION Bus/grants, [shared exchange](../../harvest/EXCHANGE.jsonl), and [repo governance](../../../../../../REPOSITORY-GOVERNANCE.md). **Effort for difficult integration:** High. This is a small working desk, not a new project board.

## Dispatch order — show this in EVERY work update

**The owner must manually send a task to each worker's dedicated chat. A GitHub TODO, commit, or link NEVER dispatches/wakes a worker.** Never describe a task as executing without an actual worker reply or artifact. Every Development SITREP/proposal must show **order, owner, assigned deliverable, dependency, actual status, and user's next dispatch action**. Always separate `SAVED_NOT_DISPATCHED` → `SENT_BY_OWNER` → `WORKER_ACKNOWLEDGED` → `WORK_IN_PROGRESS` → `DELIVERED` → `DEV_INTEGRATED_TESTED`; don't advance on assumption. Prefer short concrete tables, not new tracking systems.

**Current execution and manual dispatch (2026-10-20; factual receipts only):**

| Order | Owner | Work | Actual status | Owner's next dispatch |
| --- | --- | --- | --- | --- |
| 1 | Integration Manager | PACK-01 Bridge journal and terminal-evidence adaptation | **DELIVERED** `b06b0e5` | None, complete |
| 2 | Integration Manager | PACK-02 read-only ChatGPT observer/profile adaptation | **DELIVERED** `5f72abd`; SITREP `dd772a5` | None, complete |
| 3 (parallel) | Nine-Repo Discovery | CDP/parser/transport leapfrog research | **PROGRESS UNCONFIRMED HERE**; worker is a separate ChatGPT chat | Request its final SHA/SITREP only if not already received |
| 4 | Development (this chat) | P1 contract + PACK-01/02 pure source integration | **SOURCE COMMITTED** `e006692` (eight files) | Already executing here; no second prompt |
| 5 | Development (this chat) | Full Node extension/offline regression; browser/host/CLI watch-only path | **FOCUSED V8 TESTS 7/7**, Node/CI full run **NOT VERIFIED** (GitHub Actions `startup_failure`, no jobs); **P3/P4 NOT WIRED** | No external worker dispatch; continue implementation |
| 6 | Owner-authorized local Windows agent | Live watch-only I1 receive in exact ChatGPT web thread | **BLOCKED** until P3/P4 wired and tested | Do **not** dispatch yet; Development will supply specific live test request |

**Evidence limits:** The 7/7 receipt ran actual committed AION JS source and committed test cases in an isolated V8 harness with browser API polyfills. It is **not** a native Node suite, GitHub CI receipt, Chrome runtime acceptance, or Windows proof. GitHub workflow run [39467497887](https://github.com/owenservera/aion/actions/runs/39467497887) returned `startup_failure` with no jobs; this is not a failing test assertion. The existing `velocity/` runtime is still on PR #46 candidate, not `main`. No live observer-to-host-to-CLI path has been claimed.

## Active TODO — Development

- [x] Define/implement the canonical `aion.conversation.event/1` and `snapshot/1` contract at the accepted P1 path; separate binding, page epoch, message/revision, cursor and Bus operation ID.
- [ ] Reconcile relevant AION main source with unmerged PR #46 without a wholesale merge.
- [x] Place and compose PACK-01/02 as AION-owned pure P1/P2 source modules on main (`e006692`); **not yet wired into the content-script/host/CLI**.
- [ ] Complete full native Node/extension tests and regression after wiring; 7 focused AION tests already passed in a V8 harness against committed code; GitHub CI did not start jobs.
- [ ] Wire and test watch-only CLI receive from the exact bound ChatGPT thread; obtain an authorized real I1 receipt before moving to Send.
- [ ] Review Discovery's best CDP/parser/transport leapfrogs and request new packages **only if** they eliminate meaningful product build work without blocking I1.

**Done = integrated AION code and AION test receipts, not worker discovery or package arrival. Thinking effort: High.**

## Build the product — three-role supply line

1. **Development (here)** writes current AION needs in the existing exchange, chooses valuable sources, defines exact AION seam, integrates/adapts the selected packages, runs tests and accepts or rejects behavior.
2. **[External Nine discovery](../../harvest/external/workers/nine-repo/DELIVERABLES.md)** finds raw functionality in pinned donor repos, categorizes what each does and where, and reports code paths, constraints and alternatives. **No donor testing, wiring verification, AION implementation or packaging.** Assume found donor functionality is likely to operate in its original repo unless clear contrary evidence; do not mistake that for AION compatibility.
3. **[Integration Manager](../../harvest/external/workers/integration-manager/DELIVERABLES.md)** consumes raw discoveries **selected by Development**, maps source symbols and behavior onto existing AION contracts, and prepares integration-ready adaptations/patches with preserved licensing and clear seams. **No live integration or acceptance testing.**

**Single request/delivery index:** `harvest/EXCHANGE.jsonl`, keyed by topic and existing AX/DEV IDs. No per-role tickets, process framework, or duplicate status database. Role folders hold the actual work and a short resumption note.

## Primary objective: leapfrog AION, not fill a feature checklist

We are buying back engineering time with discovered, plausibly working building blocks. A **leapfrog** removes an entire development problem or becomes useful across several AION subsystems: CDP/browser control and observation, DOM/accessibility snapshots, parsers and command compilers, native messaging/IPC and streaming transport, session/identity recovery, provider adaptation, effect-safe correlation. The nine-repo worker should **proactively surface** unexpected high-value primitives beyond predefined DEV/Command Space rows.

**Ranking:** effort eliminated × breadth of reuse ÷ adaptation difficulty. Prefer a module that saves weeks over ten minor features. A source path, what it replaces, AION seam, dependencies/license and major constraints suffice to nominate it; no pre-integration donor verification. Development decides which leapfrogs earn packaging and tests **only the selected integrated code**.

## Development execution now — not another harvest round

**Own P1's canonical receive contract and the actual product integration** while Integration Manager stages PACK-01/02. Target the accepted contract from PR #46: `extension/src/lib/conversation-contract.js` pure `aion.conversation.event/1` + `aion.conversation.snapshot/1` validation with binding vs page epoch vs message/revision vs observation cursor vs Bus operation ID correctly separated. Retain bounded content, explicit gap/completeness and pure data-only receive; protect existing Bus/effect authority.

**Consume PACK-01** as receive cursor/terminal helpers and **PACK-02** as read-only observer helpers; these are staged supplier code, not accepted functionality. Integrate them at AION source seams, add and run AION-focused tests here (including 150 unseen retained / 100 page limit, epoch-matching ahead cursor, old response remount, empty assistant, untrusted command-looking received text). After contract and offline implementation, wire existing MV3→native host→IPC→in-memory CLI watch-only path and obtain owner-authorized Windows/live **I1** receipt. No Playwright/Puppeteer, automatic Send, duplicate Bus or private transcript persistence. PR #46 is candidate source to reconcile, **not** an automatic merge.

**Separate leapfrog lane:** read Discovery's maximum three new CDP/parser/transport leads and select packaging only when one removes substantial development work without blocking I1. VOMEGA command semantics belongs later, not in the receive critical path.

## Immediate Development requests / ownership

| Order | Existing requests | Development action | Integration Manager supply requested |
| --- | --- | --- | --- |
| **Now: I0** | AX-0007, AX-0016, AX-0017; DEV-03/04/09 | Own `event/1` and `snapshot/1` identity/cursor contract; reconcile main vs PR #46; test AION behavior **here** | **PACK-01**: adapt bridge stream/journal and completion **techniques** into a bounded AION receive candidate; correct known replay tail omission and epoch-matching ahead-of-stream cursor edge before handoff |
| **Next: I1** | AX-0008, AX-0016, AX-0017; DEV-05/06/07 | Wire/test exact-thread watch-only observer → native messaging → CLI snapshot. Incoming content can never trigger Bus effects | **PACK-02**: map and stage small read-only DOM/response-observation helpers from bridge and multi-ai-chat to AION observer + transport seams, with no second runtime |
| **After I1: I2** | AX-0009, AX-0018; DEV-08 | Test single authorized Send and independent user/assistant confirmation; unknown effects are never resent | **PACK-03 (later)**: stage pure prompt/user-turn matching and negative-case fixtures; **never** import donor auto-click or retry behavior |

**Decision economy:** select a small useful module or method quickly, favor adapting working donor code over rebuilding generically when it fits, and test once at the AION seam. An external source is not required to be independently reverified before packaging; repo presence is a strong starting assumption, not a production receipt. Security/licensing and exact conversation fidelity must survive adaptation. Only Development changes authoritative runtime and claims test results.

**Current state, 2026-10-20:** PACK-01/02 source delivered and composed into AION P1/P2 on main `e006692`; watch-only P3/P4 IPC/CLI integration and I1 acceptance are still pending. PR #46's Velocity runtime remains unmerged. No Windows host/browser effects have run.

**Next:** request high-leverage CDP/DOM/parsing/transport candidates from Discovery; choose the highest-return leapfrog for packaging alongside current I0/I1, with no exhaustive 19×9 prerequisite. Integration Manager prepares PACK-01 or supersedes it when Development selects a clearly better multiplier. Development owns integration/testing, not donor re-verification. Update this file with a short done/next line only when something actually changes.
