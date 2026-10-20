# AION Development — working desk

**Owner:** ChatGPT Development (this session and successors). **Authority:** [Development Master](../../DEVELOPMENT-MASTER.md), existing AION Bus/grants, [shared exchange](../../harvest/EXCHANGE.jsonl), and [repo governance](../../../../../../REPOSITORY-GOVERNANCE.md). **Effort for difficult integration:** High. This is a small working desk, not a new project board.

## Build the product — three-role supply line

1. **Development (here)** writes current AION needs in the existing exchange, chooses valuable sources, defines exact AION seam, integrates/adapts the selected packages, runs tests and accepts or rejects behavior.
2. **[External Nine discovery](../../harvest/external/workers/nine-repo/DELIVERABLES.md)** finds raw functionality in pinned donor repos, categorizes what each does and where, and reports code paths, constraints and alternatives. **No donor testing, wiring verification, AION implementation or packaging.** Assume found donor functionality is likely to operate in its original repo unless clear contrary evidence; do not mistake that for AION compatibility.
3. **[Integration Manager](../../harvest/external/workers/integration-manager/DELIVERABLES.md)** consumes raw discoveries **selected by Development**, maps source symbols and behavior onto existing AION contracts, and prepares integration-ready adaptations/patches with preserved licensing and clear seams. **No live integration or acceptance testing.**

**Single request/delivery index:** `harvest/EXCHANGE.jsonl`, keyed by topic and existing AX/DEV IDs. No per-role tickets, process framework, or duplicate status database. Role folders hold the actual work and a short resumption note.

## Primary objective: leapfrog AION, not fill a feature checklist

We are buying back engineering time with discovered, plausibly working building blocks. A **leapfrog** removes an entire development problem or becomes useful across several AION subsystems: CDP/browser control and observation, DOM/accessibility snapshots, parsers and command compilers, native messaging/IPC and streaming transport, session/identity recovery, provider adaptation, effect-safe correlation. The nine-repo worker should **proactively surface** unexpected high-value primitives beyond predefined DEV/Command Space rows.

**Ranking:** effort eliminated × breadth of reuse ÷ adaptation difficulty. Prefer a module that saves weeks over ten minor features. A source path, what it replaces, AION seam, dependencies/license and major constraints suffice to nominate it; no pre-integration donor verification. Development decides which leapfrogs earn packaging and tests **only the selected integrated code**.

## Immediate Development requests / ownership

| Order | Existing requests | Development action | Integration Manager supply requested |
| --- | --- | --- | --- |
| **Now: I0** | AX-0007, AX-0016, AX-0017; DEV-03/04/09 | Own `event/1` and `snapshot/1` identity/cursor contract; reconcile main vs PR #46; test AION behavior **here** | **PACK-01**: adapt bridge stream/journal and completion **techniques** into a bounded AION receive candidate; correct known replay tail omission and epoch-matching ahead-of-stream cursor edge before handoff |
| **Next: I1** | AX-0008, AX-0016, AX-0017; DEV-05/06/07 | Wire/test exact-thread watch-only observer → native messaging → CLI snapshot. Incoming content can never trigger Bus effects | **PACK-02**: map and stage small read-only DOM/response-observation helpers from bridge and multi-ai-chat to AION observer + transport seams, with no second runtime |
| **After I1: I2** | AX-0009, AX-0018; DEV-08 | Test single authorized Send and independent user/assistant confirmation; unknown effects are never resent | **PACK-03 (later)**: stage pure prompt/user-turn matching and negative-case fixtures; **never** import donor auto-click or retry behavior |

**Decision economy:** select a small useful module or method quickly, favor adapting working donor code over rebuilding generically when it fits, and test once at the AION seam. An external source is not required to be independently reverified before packaging; repo presence is a strong starting assumption, not a production receipt. Security/licensing and exact conversation fidelity must survive adaptation. Only Development changes authoritative runtime and claims test results.

**Current state, 2026-10-20:** 9 pinned donors available; 18 exchange records; AX-0016/17/18 are raw research offers, **not** integration packages; Development tests and I0–I3 runtime acceptance remain open. PR #46 is still an unmerged source candidate. No source/host changes are claimed by creation of this desk.

**Next:** request high-leverage CDP/DOM/parsing/transport candidates from Discovery; choose the highest-return leapfrog for packaging alongside current I0/I1, with no exhaustive 19×9 prerequisite. Integration Manager prepares PACK-01 or supersedes it when Development selects a clearly better multiplier. Development owns integration/testing, not donor re-verification. Update this file with a short done/next line only when something actually changes.
