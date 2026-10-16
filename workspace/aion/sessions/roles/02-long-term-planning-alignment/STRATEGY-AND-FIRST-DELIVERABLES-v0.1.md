# AION — Long-term Planning & Alignment: Strategy and First Deliverables v0.1

**Date:** 2026-10-16  
**Role:** 02 — Long-term Planning & Alignment  
**State:** STRATEGIC BASELINE PUBLISHED; roadmap M2–M5 PROPOSED, not approved milestones; operational status explicitly evidence-gated.  
**Authority:** Owen's most recent AION corrections, AION canon and observed GitHub sources.  
**Working surface:** `owenservera/aion` `main`, this existing role folder. No new repo, branch, worktree, bot, queue or tracking system.  
**Purpose:** Maximize verified useful outcomes per owner intervention. This role designs coherent strategy, alignment, dependencies and acceptance; Chief of Staff owns daily dispatch and follow-through.

## 1. Evidence-based situation

| Fact | Status as inspected 2026-10-16 | Evidence |
|---|---|---|
| AION M0.5 = AION-originated real message via BFF Linux to **real ChatGPT web app**, reply read back by AION | **Defined, NOT VERIFIED**; browser/host stop order still documented | [M0.5 canon](../../../canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md), [M1 canon](../../../canon/AION-MILESTONE-1-INTROSPECTION.md) |
| AION **top-level M1 = INTROSPECTION** (AION sends message to ChatGPT and reads real reply) | **Defined, NOT VERIFIED**; distinct from UAH BUS gate M1 | [M1 canon](../../../canon/AION-MILESTONE-1-INTROSPECTION.md), [issue #4 owner correction](https://github.com/owenservera/aion/issues/4#issuecomment-6206784046) |
| GitHub AION ↔ BFF coordination and OpenCode-authored text receipt | **One independently read-back GitHub loop passed**; does **not** imply AION ChatGPT wakeup, Route Bot proof, or live host execution | [#14 verified AION-BFF-001](https://github.com/owenservera/aion/issues/14#issuecomment-6206619114), [commit d8f17a1](https://github.com/owenservera/aion/commit/d8f17a171f7741cc6eefa7a58e4366f76956e328) |
| Linux issue #14 observation poller | **BFF-reported ready/read-only**, published receipts; not execution admission, not independent AION re-run | [AION-BFF-002 receipt](https://github.com/owenservera/aion/issues/14#issuecomment-6206813304) |
| Dashboard same-origin inbox UI/API | **Code + mocked tests reported; live production deployment blocked** by Vercel access/env/deploy conditions. GitHub comment status is `PENDING_AION_READ` | [AION-BFF-003 receipt](https://github.com/owenservera/aion/issues/14#issuecomment-6206943126), [inbox contract](../../../pm/dashboard/INBOX-CONTRACT.md) |
| AION's text reaches **actual Windows ZCode** with a verified authenticated response | **NOT VERIFIED**; D4 dispatch freeze, native ACP safeguards, exact scoped Windows approval still apply | [issue #3](https://github.com/owenservera/aion/issues/3), [bottleneck tracker](https://github.com/owenservera/001.PROJECTS.PM/blob/main/reports/AION-TO-WINDOWS-ZCODE-BOTTLENECK-TRACKER.md) |
| BFF Linux 18/18 machine readiness + OpenCode free model smoke | **Recorded host preflight**, not a proof of live ChatGPT web-app or Windows session | [readiness](../../../ops/BOX-READINESS.md) |
| AION/BFF autopush safety | **B1 secret-leak exposure, B2 failed rebase, B3 lock risk**; patch proposed, BFF reports not deployed | [proposal](../../../ops/autopush-harden-proposal.md), [receipt](https://github.com/owenservera/aion/issues/14#issuecomment-6206813304) |
| IAM authority and the integration graph | Newest architectural target **one IAM physical SQLite** at `SOFTWARE_HQ/integrations/iam/`. Prior 8/23/33-table artifacts are *unrecovered candidates*, not operational DB | [DEC-IAM-001](https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/iam/CANONICAL-MODEL-DECISION-2026-10-16.md) |
| BFF 13-repo census | 13 observed at scan time; all main/clean; two separate reference checkouts behind upstream. **Snapshot only** | [inventory](../../../ops/repos-inventory.md) |
| Four standing independent AION ChatGPT roles | Four bootstraps and SITREPs exist; their launch/live status is not proven by folder existence | [role 01](../01-dashboard-tracking/BOOTSTRAP.md), [role 03](../03-chief-of-staff-operations/BOOTSTRAP.md), [role 04](../04-opencode-output-efficiency/BOOTSTRAP.md) |

Evidence classes: original owner prompt > owner correction > source-native artifact/readback > agent receipt > summary/reconstruction. Treat each assertion independently as **defined / published / observed / received / admitted / executed / independently verified / continuously verified**. Never infer a later stage from an earlier one.

## 2. Executive alignment decisions — recommended now

**A1 — Protect two different top-level objectives.** Short-term **M0.5/M1 introspection** (AION ↔ real ChatGPT web app) is distinct from AION's **Windows executive reach** (AION → scoped ZCode action → independently verified Windows receipt). Run bounded evidence/architecture work on both in parallel, but Grok Bot stays on M0.5; never reassign it to dashboard/telemetry. GitHub is the existing coordination/receipt channel, *not* a substitute for either real service roundtrip.

**A2 — Separate product milestones from subordinate gates.** Top-level `AION M1` is fixed by Owen. `UAH BUS M0–M4`, `AION M0.5`, PWA `P0/P1`, and GPM UAH/IANG `M1–M6` remain distinct namespaces; do not roll their numbers together.

**A3 — One physical IAM authority, not competing copies.** The 2026-10-16 `SOFTWARE_HQ/integrations/iam/` decision supersedes the 2026-10-15 GPM plan's proposed `001.PROJECTS.PM/programs/uah-iang/data/canonical.sqlite3` destination for future canonical *physical* DB delivery. Preserve historical GPM plan and notify its operational owner for a source-backed cross-reference amendment; do not silently edit historical decisions. GPM board is a read-only projection, not a second authoritative writer. Recovery precedes migration.

**A4 — No dashboard-first substitution.** The existing Vercel dashboard, instant ping issue and OpenCode telemetry are useful parallel accelerators but cannot turn red operational gates green. No bespoke alert/message infrastructure, no extra PM system, no premature 3D graph.

**A5 — Stop-the-line safety.** The live minute-sync secret-leak risk is an immediate production-exposure issue; ask Chief of Staff to pursue existing patch review and safe approval path, not to silently deploy. AION-BFF-001 has passed as a GitHub source/receipt test; M0.5/M1, Windows reach and Route Bot have not. Existing privileged host/browser execution stop order and D4 dispatch freeze remain, except for independently documented, narrowly authorized GitHub-only actions.

## 3. Proposed top-level milestone architecture — M2–M5 are NOT Owen-approved

| Gate | Outcome in owner's terms | Actual proof | Preconditions and existing home |
|---|---|---|---|
| **M0.5** (already canon) | AION can send a real prompt through BFF Linux to the real ChatGPT web app and read its real reply | Correlated AION-authored prompt → genuine browser submission → real web reply → AION readback + negative-case test | [M0.5 canon](../../../canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md); host/browser scoped authorization |
| **M1 — INTROSPECTION** (Owen-defined) | AION independently sends a message to ChatGPT and reads the real answer | M0.5 proof or another *genuine* allowed path accepted against top-level [M1](../../../canon/AION-MILESTONE-1-INTROSPECTION.md); no human copy, no API stand-in | BFF Linux browser candidate, OpenCode/ZCode code only; independent verifier |
| **M2 — REACH** (**proposal**) | AION reaches and receives an attributable, scoped answer from *actual Windows ZCode* | Sender identity, principal admission, real Windows instance/session and harmless reply, denial case, source hashes, AION readback | [issue #3](https://github.com/owenservera/aion/issues/3); [BUS-01..07](https://github.com/owenservera/aion/issues/6); D4 / host authorization / PC health |
| **M3 — RELIABLE DELIVERY** (**proposal**) | Authorized tasks survive restart, are assigned, executed and verified without Owen acting as courier | Persisted inbox/outbox, idempotent receipt progression, restart/replay and denial tests, one complete useful delegated workflow, observed ledger | [issue #2](https://github.com/owenservera/aion/issues/2); [BUS-04](https://github.com/owenservera/aion/issues/9), [#14](https://github.com/owenservera/aion/issues/14), recorder; M2 proof for Windows workflows |
| **M4 — INSTITUTIONAL CONTEXT** (**proposal**) | Agents can recover original intent and project decisions from one verifiable model | Recovered source-native prompts with coverage, proven schema migrations, IAM integrity/FK/lineage, one generated YAML, actual query/use-case | [IAM decision](https://github.com/owenservera/SOFTWARE_HQ/blob/main/integrations/iam/CANONICAL-MODEL-DECISION-2026-10-16.md), [GPM plan](https://github.com/owenservera/001.PROJECTS.PM/blob/main/programs/uah-iang/CEO-RECONCILIATION-PLAN.md); may research in parallel |
| **M5 — COMPOUND AUTONOMY** (**proposal**) | AION repeatedly delivers useful owner-approved outcomes across projects with declining owner coordination | Two or more independent task types completed with reliable provenance/rollback; tracked owner touches vs verified value; recurring checks actually observed | Depends on M1–M4 capability gates; PWA, dashboard, session telemetry are accelerators, not pass substitutes |

**Scheduling policy:** no invented dates. Execution work can overlap where it neither conflicts with authorization nor monopolizes M0.5. Advancement requires a real proof gate, not GitHub publication.

## 4. Dependency and priority map

```text
C0  SOURCE / AUTHORITY / SECURITY
 |-- autopush B1/B2/B3 risk mitigated (existing proposal; scoped approval)
 |-- live machine readiness + PC disk constraints
 |-- authorization boundaries / D4 freeze retained
 |
 +--> C1  AION M0.5 browser route (Grok Bot operator; OpenCode/ZCode build)
 |        --> top-level M1 actual introspection proof
 |
 +--> C2  real AION-origin task + BFF observability (#14, receiver)
          --> authenticated admission + actual Windows ZCode answer (#3)
          --> M2 reach --> M3 reliable delegated completion
 |
 +--> C3  source-native transcript coverage + historical DB recovery
          --> IAM migration/integrity and YAML --> M4 context
 |
 +--> C4  telemetry #15 + ping #17 + dashboard #16 + phone PWA #1
          (parallel accelerators, never a substitute for C1/C2)
 
 M1 + M2 + M3 + M4 + validated accelerators --> M5
```

**Critical path**: genuine ChatGPT conversation transport (M0.5), then actual Windows ZCode authoritative response for reach. **Near-term risk**: autopush secret staging and rebase safety (B1–B3) can undermine the evidence/coordination layer; do not assume that 60-second automatic publishing is safe.

## 5. Role boundaries and allocation

| Owner | Sole primary ownership | Deliverable / boundary |
|---|---|---|
| **AION / owner authority** | Goal interpretation, consequential decisions, final milestone acceptance | Accept/reject M2–M5; explicitly grant scoped execution permission where required; no automatic GitHub issue grants host authority |
| **02 Planning & Alignment (this role)** | Milestone architecture, dependency ordering, contradictions, resource-allocation proposals, gate definitions | This plan and future strategic exception/decision notes in **this folder**; *not* daily dispatch or coding |
| **03 Chief of Staff / Operations** | Issue #14 task handoffs, Route Bot endpoint verification, daily follow-through, receipts, blockers | Operational issues/SITREP, tests from actual execution; do not simply claim an agent is running |
| **01 Dashboarding & Tracking** | Vercel UX, #16/#17, visible status and push proof | Human/ACP/Overview views; live <5-sec ping needs measured real runtime, not simulated state |
| **04 OpenCode Output & Efficiency** | Real session enumeration, native shares, transcript archive, throughput and quality; #15 | Direct session IDs, active/idle proof, saved exports, model/cost/use metrics; do not double-own UI |
| **Grok Bot on BFF Linux** | M0.5 Linux operation/browser route; documented limited GitHub coordination | Operate, install/configure, run, observe and report; **never author/edit code** |
| **OpenCode / ZCode** | All executable code/implementation, with independent verification | Named session/correlation/task receipt; free models preferred when capable; Windows host authority remains scoped |

**Route Bot:** named but **actual identity/destination/RECEIVED proof is not yet verified**. Planning can package recommended actions in this file, but do not label anything `DISPATCHED` to Route Bot until the Chief of Staff observes and independently verifies that endpoint.

## 6. First deliverable set — five small, evidence-bearing outputs

| ID | This role produces / maintains | First-pass scope | DONE when |
|---|---|---|---|
| **LP-01 — Strategic baseline** | Source-backed status & distinction register in this document | AION M0.5/M1, #3 Windows, #14 handoffs, #15–17, IAM, BFF safety, 4 roles | Every major claim points to current source or is marked inference/unknown; no false green state |
| **LP-02 — Five-milestone proposal** | Top-level M1 fixed + M2–M5 proposals, no namespace collision | One owner outcome and one real pass test per milestone | AION executive accepts or records corrections; until then M2–M5 marked **proposal** |
| **LP-03 — Critical-path/dependency map** | Named gates and parallelism map above | Prioritize M0.5, authenticated ZCode reach, autopush safety; independent C3/C4 streams | Owner of each blocking link is assigned, next proof is unambiguous, no circular dependency |
| **LP-04 — Resource handoff contract** | RACI-style split above; exact existing issue homes, no new channel | Protect Grok Bot; assign implementation to OpenCode/ZCode; CoS dispatches, verifies receipt | Chief of Staff acknowledges within existing GitHub channel *if and when authorized*; not claimed yet |
| **LP-05 — Exception / decision queue** | Keep max **five** consequential strategic exceptions in SITREP | Resolve canonical location drift, M1 vs BUS M1, M0.5 authorization, autopush risk, M2–M5 acceptance | Each exception marked **decided**, **delegated/acknowledged**, **blocked**, or **pending owner** with link and evidence |

**Execution order in this role:** LP-01 → LP-02 and LP-03 → LP-04 → LP-05; only escalate genuine policy/authorization or owner-outcome changes. Review only changed evidence, not full audits every response.

## 7. Immediate executive exception queue (non-executing)

| Priority | Question / risk | Opinionated resolution | Executing counterpart | Proof required |
|---|---|---|---|---|
| P0 | Autopush may publish newly staged secrets every minute | Secure reviewed patch/hardening gate before increasing sync fan-out; do not apply privileged patch without approval | CoS → OpenCode/ZCode; authorized Linux operator | Scanned staged content, simulated leak blocked, safe rebase/lock test, live readback after approved change |
| P0 | M0.5 browser route is blocked by stop order, authenticated session still unverified | Hold host/browser action; prepare minimally scoped safe test; ask for only necessary owner authorization at the execution gate | AION/CoS with Grok Bot | Actual correlated AION-origin ChatGPT web-app roundtrip + negative case |
| P0 | Windows ZCode path not proven, GitHub #14 is only coordination | Reuse existing #3/ACP/ZBot issue chain; avoid new dispatch channels; hard admission boundaries | CoS → OpenCode/ZCode | Real Windows identity/session/host reply and AION readback |
| P1 | Previous GPM plan still refers to old canonical DB path | Treat newer DEC-IAM-001 as current destination, annotate historical plan via its normal owner | GPM/IAM owner | Published cross-reference and no second live writer |
| P1 | Dashboard code exists but new production deployment not proven | Keep task in #16/#17; require Vercel permission/env and measured true push before green status | Dashboarding role → CoS/OpenCode | Real deployment SHA, authenticated live send/receipt, <5-sec measured ping |

## 8. Non-goals / uncertainties

- No new all-purpose communications bus, PM dashboard, ticket queue, repository or agent fleet.
- No uncontrolled GitHub `bridge:dispatch` requests, unattended Windows execution, browser automation against ChatGPT, privilege changes, or use of leaked credentials.
- No claim of Route Bot delivery, active coding sessions, original full ChatGPT export, canonical IAM DB, reliable alerts, Android P1, or independent M1 acceptance absent actual receipts.
- The operational status shown in previous AION PM/GPM trackers can lag newer issue #14 receipts; *refresh by source ID*, not by blanket import.
- This document is a **planning artifact** and is not authorization or proof of implementation.

## 9. Next review trigger

Re-evaluate on **new evidence**, especially: successful M0.5 real web-app receipt, scoped lift of host stop order, an actual Windows-ZCode receipt, live dashboard deployment/ping or accepted canonical IAM migration. Record only changed dependencies and decisions, with source URLs. GitHub issue #14 is the current observed direct BFF coordination location; no Route Bot endpoint has been independently confirmed.
