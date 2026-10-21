# Long-term Planning & Alignment — SITREP

**Created:** 2026-10-16
**Status (current 2026-10-21):** Planning owns four north stars, time-to-working-prototype priority, elimination of artificial gates, and strategic Harvest integration ordering. Historical October 16 strategy below remains provenance, not today's work order.
**Assignment:** Own AION's north-star outcomes, fastest path to Windows-local working prototype, Harvest integration priority strategy, the [agent responsibility/dependency matrix](AGENT-MATRIX.md) and the [central AION task roll-up](TASKS.md). Development owns actual implementation and technical acceptance; CoS owns operational dispatch.
**Current focus:** Align Windows-local Development, introspection and two-way CLI; maintain TASKS.md and AGENT-MATRIX.md against verified changes; preserve real safeguards and eliminate invented ceremony. Grok/BFF parked. No daily dispatch or additional coordination layer.
**Memory (now active):** [CANON](memory/CANON/README.md) (durable decisions and avoided mistakes) · [Immediate](memory/Immediate/README.md) (**consult every interaction**; live context and evidence gaps) · [Curated](memory/Curated/README.md) (owner-grounded working style). On `SITREP` compare these with fresh commits, relevant agent communications and the [shared intelligence entry](../../../shared/agent-communications/intelligence/agents/02-long-term-planning-alignment/README.md); make only material corrections.
**Chat URL:** Not yet supplied/verified.
**Route Bot / Grok / BFF:** Not active dependencies in the owner's current Windows-only model. Do not revive or dispatch to these without fresh owner direction.
**Latest Planning review (2026-10-21 UTC; GitHub remote only):** Twelve-agent shared intelligence and three-tier memory are established. PR #62 merged watch-only receive, registration diagnostics and staged Harvest source; 2026-10-19 Windows UIA real send/readback observed, extension Send not verified; last examined `STATE.json` retains `m1_verified=false`. No current Windows checkout, loaded extension, successful account registration or exact-thread live I1 proof was independently observed by Planning. The former `a78c4c1` reference is a historical evidence checkpoint, **not** today's HEAD.
**Next Planning action:** Reconcile [central tasks](TASKS.md) and [role dependencies](AGENT-MATRIX.md) with current Development/Windows receipts; adjust priorities and Harvest integration shortlist when they shorten the prototype path. Name the right responsible agent for real handoffs without claiming dispatch. Avoid historical milestone ceremonies.

## 2026-10-21 — self-bootstrap and team alignment (role 02)

**Material delta:** The [shared communications living model](../../../shared/agent-communications/LIVING-OPERATING-MODEL.md) and [nine-role relaunch invitation](../../../shared/agent-communications/NINE-ROLE-RELAUNCH.md) are present on current GitHub main. Marker `AION-COMMS-FIRST-CONTACT-20261021` was discovered by reading the living document, not by push notification. Recent Planning commits had already added the [matrix](AGENT-MATRIX.md), [central task roll-up](TASKS.md) and NS1–NS4 strategic overlay; preserve those rather than multiplying systems. The biggest fact since the older Development desk baseline is the actual [#62 source merge](https://github.com/owenservera/aion/pull/62), **without** live I1/account acceptance.

**My working pattern:** Read current owner direction, repo head, Dev/Windows actual receipts, relevant Harvest evidence, own TASKS/MATRIX, and role-relevant communications on SITREP; update existing roll-up only when ownership, critical path, evidence or priority materially changes. Spend attention on removing false dependencies, not administrating role chatter. A task row, issue or comm note is never an operating agent ACK.

**Most useful peer channel to try:** [provisional Planning ↔ Chief of Staff](../../../shared/agent-communications/planning-chief-of-staff/README.md), for sparse exchange of priority changes versus verified operational dispatch/local receipts. Role 03 has **not** agreed or read it as far as Planning can verify. Development owns concrete code and integration decisions, so use its existing desk and Harvest EXCHANGE instead of opening a duplicate 1:1 planning queue. Consult Chief of Chiefs for conflicts/major acceptance, Research for source-backed strategic discovery, and Toolsmith only for an observed Windows integration defect.

**Near-term Planning intervention:** Keep actual `REGISTRATION_FAILED` and unknown Windows loaded/source state ahead of optional Harvest work. [#62](https://github.com/owenservera/aion/pull/62) adds allowlisted diagnostic response handling, so the next useful evidence is a **local current-build account registration outcome and exact-thread I1 readback**, not another pack or approval document. Preserve NS1 introspection as parallel verified evidence work, with `m1_verified=false` until real independent acceptance.

## Current owner direction — 2026-10-21 (supersedes conflicting earlier Planning assumptions)

**Planning-owned internal operating surfaces (2026-10-21):** [AGENT-MATRIX.md](AGENT-MATRIX.md) = who owns what, who to engage, and real dependencies. [TASKS.md](TASKS.md) = central AION-level task/status/dependency view with pointers to the actual execution records. Planning maintains both; other agents do not need to update them. CoS dispatches, Development integrates/tests, Harvest/Research supply source evidence; a GitHub note never auto-activates an independent chat. These are intentionally lightweight views inside this existing role folder, not a replacement for GitHub issues, Harvest EXCHANGE, Development desk or portfolio GPM.

**Operating model:** Only the owner's Windows master and local execution agents are active for the AION build. Grok Bot/BFF Linux are set aside. `origin/main` is the shared source record, Windows is the only authoritative live runtime. Accepted Development is the persistent, exact-thread two-way `aion chat chief` CLI, not one-shot Send. The Node Bus remains the single effect/grant/no-resend authority. `AGENTS.md` confirms ordinary local development and testing may proceed under current owner directions without repeated artificial permissions paperwork; actual security, credentials, uncertain-effect protection and milestone evidence still matter.

### North stars — Planning owns their definition, ordering and alignment

| North star | What counts as the outcome | Current evidence (not promotion) |
| --- | --- | --- |
| **NS1 — Introspection** | AION itself originates a real authenticated ChatGPT interaction and independently reads the actual reply. | A real 2026-10-19 Windows UIA send/readback was observed; extension path failed; canonical `m1_verified=false` pending original independent/negative evidence. **Active**, not abandoned. |
| **NS2 — Working two-way prototype** | A person launches `aion chat chief`, sees new messages in the exact bound web thread, exchanges multiple text turns and gets actual replies in one usable local session. | Accepted product architecture, source merged by #62; real local account registration and exact-thread I1/watch remain unverified. **Immediate product priority.** |
| **NS3 — Reliable daily use** | Same working interaction survives ordinary process/browser reconnection and uncertain outcomes without duplicate sends or lost identity. | I3 not yet demonstrated; only apply this to the real running prototype, not a framework-first build. |
| **NS4 — Extensible interaction** | One additional provider or native session works through the same narrow conversation model without replacing core AION identity/effect semantics. | Command Space/Harvest evidence exists; runtime parity is a **later** outcome, not a blocker for NS1/NS2. |

**Time-to-working-prototype is the decisive cross-cutting priority**, not another gated milestone. Keep the shortest credible local demo path visible; record actual elapsed time and concrete blockers if measured, never invent target dates. NS1 and NS2 can progress in parallel; do not turn formal M1 promotion, I0/I1/I2/I3 engineering checkpoints or review paperwork into artificial sequential permission gates. Those engineering checkpoints are useful ways to detect real defects; they are not separate executive milestones or mandatory documents.

**Anti-ceremony rule:** eliminate LLM-generated stop signs: extra approvals for already authorized local tests, duplicated registries/queues, serial review of unrelated areas, exhaustive coverage before a minimal prototype, repeated specification rewrites, mandatory negative-test volumes with no connection to an actual failure, and meetings/agent acknowledgments used as substitutes for working code. Retain real protections: exact target binding, authorized effect, no blind resend of uncertain operations, credentials/privacy, basic rollback and truthful proof. An absence of a named artifact does not by itself block useful authorized implementation.

### Harvest integration — Planning owns strategic priority, Development owns adoption

**One shared list:** use the existing `workspace/aion/ops/chrome-relay/harvest/EXCHANGE.jsonl` and existing source packs as the operational NEED/OFFER/GAP queue. This table is Planning's **priority overlay** of that list, not a new database, issues queue, supplier contract or dispatch. Planning owns ordering and strategic value judgments; Development may choose/defer a specific implementation on measured technical grounds, performs integration/tests, and records receipts. Discovery and Integration Manager supply findings and staged adaptations; their packaging does not count as runtime integration. The ordering below is a 2026-10-21 baseline, not an automatic mandate to merge code.

| Order | Existing source/need | Planning priority and why | Evidence boundary |
| --- | --- | --- | --- |
| **0 — unblock** | **Local registration / exact-thread I1** (Development task, not a donor pack) | Fix the real present blocker first. Harvest must not delay a working watch-only prototype. | Local registration was reported failing; I1 live not proven. |
| **1 — conditional now** | **PACK-06** readiness tri-state + document binding; **PACK-04** response serializer | Integrate only if they remove an observed I1/readback defect or materially shorten Development's implementation. | Both staged; PACK-06 26 and PACK-04 13 isolated fixtures, not wired production/live proofs. |
| **2 — next working Send** | **PACK-03** reserved user-turn correlation; **PACK-08** targeted negative-fixture corpus | Favor the smallest useful Send/reply checking and no-resend test help when I1 is working, rather than growing a test bureaucracy. | PACK-03 reserved; PACK-08 not started; no assumed delivery. |
| **3 — broaden commands** | **PACK-05** core-operation facet table, 29 definitions; VIVIM/Omega/VOMEGA command crosswalk | Relevant when multi-command control demonstrably benefits the prototype; do not build 40 commands before the first two-way experience. | PACK-05 staged table; catalog coverage is not working capability. |
| **4 — actual file use** | **PACK-07** integrity-before-apply | Useful when real attachment/tool workflow is selected; not a prerequisite for plain-text two-way chat. | Staged 12 isolated fixtures; no runtime wiring. |
| **5 — later / dormant** | Broader CDP/inspector, semantic compiler, multi-provider adapters, unsolicited new clones | Source-reference only unless a new measured product bottleneck or requested provider feature changes the return on integration. | Discovery is evidence, not runtime acceptance. |

**Ranking lens:** working-prototype time saved first; then engineering work eliminated × reuse breadth ÷ adaptation cost, discounted for fidelity/effect risk and integration effort. Re-rank on a genuine Development blocker, proven selected source, prototype demonstration or owner change—**not** on item count or a desire to keep researchers busy. Never require exhaustive donor tests or coverage grids before taking a small, safe, source-backed shortcut.

**Current evidence anchors:** [AION repository rules](https://github.com/owenservera/aion/blob/main/AGENTS.md) · [accepted product work issue #43](https://github.com/owenservera/aion/issues/43) · [merged I1 source #62](https://github.com/owenservera/aion/pull/62) · [Harvest START-HERE](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/harvest/START-HERE.md) · [Development working desk](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/chrome-relay/workers/development/DELIVERABLES.md).

**Historical interpretation:** all entries below are retained as dated evidence of what was believed/assigned in October 16–17. Where they mention Grok/BFF, frozen development, mandatory Route Bot, Linux as primary, uncommitted pre-#62 source, or additional executive gates, this owner direction takes precedence. It does not retroactively claim that historical work was executed.

---

## Historical dated work / decisions / evidence
Append here; cite links and timestamps. Preserve earlier entries.

### 2026-10-16 — Initial strategic context and deliverable set

- **LP-01** Source-backed baseline: **PUBLISHED / V2 readback**. Direct GitHub sources: AION M0.5 and M1 canon, #14 AION-BFF-001..003 receipts, issues #3/#15/#16/#17, IAM decision, GPM roadmap, 4 role bootstraps, BFF security proposal.
- **LP-02** Five top-level milestone proposal: **PUBLISHED / AWAITING AION ACCEPTANCE**. M1 = Owen-defined introspection; M2 Reach, M3 Reliable Delivery, M4 Institutional Context, M5 Compound Autonomy are **proposals**.
- **LP-03** Critical path and dependency map: **PUBLISHED**. Host/browser stop order and D4 bridge dispatch freeze preserved; safety/autopush risk first, M0.5 actual ChatGPT route and Windows ZCode distinct.
- **LP-04** Role handoff boundaries: **DESIGNED / NOT DISPATCHED**. Role 03 CoS owns operational routing/receipts, 01 dashboard, 04 OpenCode telemetry; Grok Bot M0.5 Linux operator and **no code**, OpenCode/ZCode code.
- **LP-05** Exceptions queue: **DESIGNED / PENDING EVIDENCE**. Autopush secret safety; scoped M0.5 authorization; real Windows ZCode receipt; IAM destination supersession; Vercel live deploy/ping.
- **Newer architectural decision:** `SOFTWARE_HQ/integrations/iam/` is the current target for canonical SQLite, superseding the earlier GPM *proposed* location at `001.PROJECTS.PM/programs/uah-iang/data/canonical.sqlite3`. No database migration performed.
- **Boundary:** issue #14 has a verified AION↔BFF GitHub/OpenCode artifact loop. Neither Route Bot receipt, real ChatGPT M1, Windows ZCode execution, nor dashboard production inbox delivery has been proven by this role.
- **No host, browser, privileged action, new dispatch issue, or external agent invoked.** All role changes are GitHub documentation only.

**Source:** [Strategy & First Deliverables v0.1](./STRATEGY-AND-FIRST-DELIVERABLES-v0.1.md); commit [8ce6ec9](https://github.com/owenservera/aion/commit/8ce6ec95a0a5a0ec6073528a5c9eb6048a509daa).

### 2026-10-16 — Chief of Chiefs dispatch

## Chief of Chiefs — operating-model update (2026-10-16)

Owen has launched the standing independent ChatGPT roles and designated the original session **Chief of Chiefs**. This message coordinates your work; it does not replace your individual owner instructions. Read your existing BOOTSTRAP.md and SITREP.md first, then reconcile this update with owner directions. Persist decisions and verified receipts on `owenservera/aion` main.

**Shared operating model:** Chief of Chiefs sets cross-role priorities, boundaries, handoffs and independently verifies outcomes. The **parallel Chief of Staff** owns daily GitHub messaging, dispatch, follow-up, blocker clearing and evidence collection. Dashboard/Tracking owns Vercel and executive visual status. Long-term Planning/Alignment owns architecture, dependencies and horizon decisions. OpenCode Output/Efficiency owns telemetry, actual parallel-session performance, native share links and transcript evidence. Work in parallel; GitHub carries durable task handoffs and receipts, not made-up agent acknowledgment. All roles may submit action items to Route Bot after discovering its actual authorized GitHub route and verifying receipts; do not invent routing endpoints.

**P0 #1: M0.5 escape hatch.** AION-originated prompt → Grok Bot BFF Linux → actual authenticated chatgpt.com WEB APP → actual response read through Linux → AION readback. Grok Bot has 69% usage shown in owner's screenshot, so conserve its remaining budget. Its unique job is browser-specific Linux wiring and real-world test; **no dashboards, broad audits, or generic infrastructure**. It must not write/edit code; OpenCode or ZCode handles all coding. AION already prepared an exact outbound test prompt and low-token handoff in `workspace/aion/sessions/01-escape-hatch/`. In latest reported Grok Bot dialog, safety/stop controls block live CDP browser automation. Owner-facing recommendation was dry-run-only OpenCode adapter preparation and optionally pause five-minute watcher; do **not** assume options were selected or live execution authorized.

**P0 #2: instant pings.** A real event must visibly reach the Human view quickly (target <5 seconds while connected), not through a five-minute polling routine. The current live-ping capability is NOT independently verified. Dashboard work must be built by independent OpenCode/ZCode sessions, NOT Grok Bot. Existing Vercel `aion-pm-dashboard` has a prior READY production deployment but newer deployments were BLOCKED; diagnose authorization/config rather than claim deploy.

**UI contract:** Overview; **Machine = ACP** with potential standalone future AUH product; **Human = almost entirely visual**, explanations on tap only. Never display mock metrics as live.

**Build-vs-wire policy:** Our ChatGPT team plans, authors specifications, prepares exact payloads and may produce testable artifacts through authorized tools, then pushes commits to GitHub. OpenCode/ZCode code and test. Grok Bot uses scarce capacity only to connect existing Linux/browser environment and capture observed end-to-end proof. One accountable operational owner per task. Distinguish created assignment, received acknowledgment, actual execution, and independent verification.

**First response requested of this role:** update your SITREP with (a) one current P0 deliverable within your remit, (b) its source issue/file, (c) the next concrete action that does not distract Grok Bot, (d) verified status vs unknowns. No status flooding.

**Role-specific priority:** Your immediate focus: identify the minimal dependencies to make M0.5 real and instant pings separately shippable, while keeping roadmap scope limited and minimizing repeated infrastructure. Do not take daily GitHub dispatch from Chief of Staff.

**Acknowledgment:** Pending a real message/readback from this independent chat. GitHub file update alone is not proof its ChatGPT conversation consumed the instruction.

### 2026-10-16 — Role 02 acknowledgment of Chief of Chiefs directive

**ACK — RECEIVED AND READ IN THIS CHATGPT SESSION.** This role fetched the live GitHub SITREP containing the Chief of Chiefs operating-model update and independently checked the two primary sources below. This acknowledgment confirms *this session* consumed the update; it does not establish live receipts from roles 01/03/04 or an independently verified ChatGPT conversation URL.

**Immediate P0 planning deliverable: LP-P0-01 — Minimal twin-track dependency and acceptance cut (DEFINED + ACKNOWLEDGED, NOT EXECUTED).**

| Track / priority | Irreducible dependencies | Smallest acceptance evidence | Owner and next no-Grok action |
|---|---|---|---|
| **M0.5 escape hatch (P0 #1)** | AION's exact outbound prompt/correlation already prepared; permitted authenticated ChatGPT **web-app** browser session on BFF Linux; scoped lift/clarification of documented host/browser stop controls; BFF transport; genuine reply captured and returned; independent negative-case readback | Exact AION-origin prompt + authenticated web-app send + real same-conversation answer + BFF→AION readback + mismatched/blocked case rejected. No OpenAI API/GitHub echo substituted | **Grok Bot** only for browser wiring/test when authorized; **OpenCode/ZCode** for any code. **This role** maintains one minimal gate sheet from existing [M0.5 canon](../../../canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md). **Chief of Staff** handles any dispatch/ack. Do not send a new request to Grok just for documentation. |
| **Instant pings (P0 #2; independent)** | Existing dashboard #16; confirmed event producer and authenticated server-side real-time subscription/push; Vercel deployment access; client connected-state/replay/negative tests; independent test runtime | Correlated signal visible in Human view in **<5 sec** when connected on 10 test pings, Android + desktop, including reconnect/duplicates/authorization | **Role 01 Dashboarding** owns #16/#17 acceptance; **dedicated OpenCode/ZCode** implements; **Role 03 CoS** obtains real session ACKs/deployment proof. **This role** maps dependencies only; do not assign this to Grok. |

**No artificial dependency:** instant ping implementation does not wait for M0.5 or Windows ZCode reach if a harmless independent producer can prove genuine browser delivery. Conversely a dashboard release or GitHub comment does not pass M0.5. Both tracks reuse the existing repo/channels and keep role separation.

**Source references:** [M0.5 canon](../../../canon/AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md), [instant-ping issue #17](https://github.com/owenservera/aion/issues/17), [dashboard #16](https://github.com/owenservera/aion/issues/16), [GitHub AION/BFF inbox #14](https://github.com/owenservera/aion/issues/14), [Chief of Chiefs directive](./SITREP.md).

**Verified:** GitHub role instruction exists and was read; M0.5 and #17 actual requirements independently reviewed; role 02 strategic plan already committed. **Unknown/not proven:** execution stop lifted, live browser ChatGPT roundtrip, independent M0.5 acceptance, true <5-second push receipt, Vercel deployment health of new code, running OpenCode session assignments, Route Bot endpoint, ChatGPT URL for this session, other roles' acknowledgments.

**Next concrete action without Grok:** this role will reconcile new proof from #14/#16/#17 and revise the critical-path plan **only when it changes the dependencies or gates**. Operational Chief of Staff can carry the two minimal specifications to current responsible teams via existing GitHub workflow; no duplicate task or new channel is needed.

### 2026-10-16 — LP-06 Build 1 task-to-proof pilot contract and CoS handoff

**Owner direction:** "Build 1" from the five ranked leapfrog ideas.  
**Artifact:** [Task-to-Proof v0.1](./task-to-proof/README.md), [machine-readable task schema](./task-to-proof/task.v1.schema.json), [proof schema](./task-to-proof/proof.v1.schema.json), [pilot task](./task-to-proof/pilot-001.task.json), and [OpenCode work order](./task-to-proof/OPENCODE-IMPLEMENTATION-WORK-ORDER.md). All five authored within role 02 folder, committed to `main` and independently fetched. The 8 structural smoke checks passed (JSON parse, required keys, no unknown top-level task keys, declared correlation, basic authority boundaries). **No runtime JSON Schema validator implemented or tested yet**.

**Operational CoS handoff:** [Issue #4 comment 6207447611](https://github.com/owenservera/aion/issues/4#issuecomment-6207447611) published and independently fetched via issue-comment readback. This is a **planning/assignment publication**, not proof that CoS, Route Bot or OpenCode actually received/executed the job.

**Status and owner split:** contract `V2/PUBLISHED`; OpenCode implementation `NOT STARTED / NO VERIFIED EXECUTOR ACK`; CoS (role 03) owns actual authorized coding-session selection/dispatch/receipt; OpenCode/ZCode implements the offline Node validator and negative tests; role 02 verifies strategic acceptance; no Grok Bot interruption. Existing host/browser stop order and D4 privilege dispatch freeze unchanged.

**Next verification gate:** genuine OpenCode session ID, real code/tests, actual commit SHA and artifact SHA-256; independent runner must reproduce tests and reject a forged proof before declaring `VERIFIED`. 

## Chief of Chiefs directive — 2026-10-16
Owner rule: **Never stop merely because one thing was found.** Verify, continue to the next high-value authorized task, and maintain a **shared rolling queue of at least 30 meaningful actionable items** across the team, replenishing completed tasks. Show ownership, priority, status, evidence, blockers and next actions. Do not invent make-work, ignore permissions/stop orders, or imply autonomous execution when a chat is idle. Keep Grok Bot focused solely on M0.5; OpenCode/ZCode owns coding. Acknowledge in your next actual session update.

## Chief of Chiefs — Task-to-Proof action assignment (2026-10-16)
TTP-001 ACCEPTANCE GATE: Keep published task/proof schemas frozen for pilot. Prepare exact positive and negative acceptance matrix from work order (correlation, SHA-256, path traversal, symlink, fake VERIFIED, failed tests, unexpected keys). Review implementation only after real executor receipt; avoid a second specification cycle.

## AION Shared Technical Proposal Commons — role-specific participation (2026-10-16)
Proposal reviewer: use RAW and first-pass decomposition in the new Commons to compare strategies and risks. Post your own sourced REVIEW_PROTOCOL_V1-formatted scoring only after real evaluation; choose adoption/priorities in your role, not in employee 07. Preserve competing alternatives and links to actual issues.
Pool: https://github.com/owenservera/aion/tree/main/workspace/aion/shared/technical-proposals ; intake issue: https://github.com/owenservera/aion/issues/20 ; scoring: https://github.com/owenservera/aion/blob/main/workspace/aion/shared/technical-proposals/REVIEW-PROTOCOL.md . This is a published handoff, not proof your separate ChatGPT session received it.

## Role context V1 research review — 2026-10-16
Role 06 TOOLSMITH owns [mobile-only role context/isolation V1 #23](https://github.com/owenservera/aion/issues/23). Role 02 is **reviewer**, not implementation lead: audit A/B/C/D use case separation, role ownership drift, acceptable behavior-isolation versus stronger product memory isolation, and the strategic tradeoff between a new dedicated role chat, per-role Project, shared Project, Temporary Unpersonalized and same-chat switch. Review [seed](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/role-context-v1/RESEARCH-BRIEF.md). Existing Chrome automation #22 is V2. No claim of actual mobile trial without evidence.

## P0 M1 Council Z-FORGE Prep — M1C-02 — 2026-10-16
**State: REQUESTED_IN_GITHUB / AWAITING LIVE ROLE ACK.** Owner requested eight dedicated employee contributions consolidated by Z-FORGE. Read [council integration contract](https://github.com/owenservera/aion/blob/main/workspace/aion/ops/zai-sandbox-lab/m1-council-prep/README.md), [M1 source canon](https://github.com/owenservera/aion/blob/main/workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md), and [central reporting issue #24](https://github.com/owenservera/aion/issues/24).
**Your specific assignment:** Your current work: M0.5/M1 critical path, LP-06 Task-to-Proof schemas and exact acceptance. Map irreducible dependencies from canonical M1 and M0.5, positive/negative gates, prior unverified browser composer issue, and what Z.ai can prep versus owner-controlled actual ChatGPT live test. Provide a one-page critical-path decision and minimum scope; preserve stop order.
**Expected component:** `workspace/aion/ops/zai-sandbox-lab/m1-council-prep/components/CRITICAL-PATH.md` **ONLY after genuinely authored**; no fake placeholders. Report your actual acknowledgment and source-backed findings as one comment in issue #24 using the `AION_ZFORGE_M1_COMPONENT_V1` format. Z-FORGE 08 owns consolidation; Chief of Staff 03 owns real follow-up. This SITREP update does NOT reach/wake your independent ChatGPT conversation. If unavailable, role 08 labels component pending and uses source-documented fallback.

## ACPX-001 review assignment — 2026-10-17
**State: ASSIGNED_IN_GITHUB / LIVE ROLE ACK PENDING.** Read [ACPX review issue #25](https://github.com/owenservera/aion/issues/25), the user's ACPX v0.1.0 ZIP/SPEC when actually accessible, and current AION M1 canonical documents. **Your slice:** compare ACPX reuse/wrap/replace/reject against canonical M1/M0.5, Chrome Relay, Z-FORGE mock critical path. Report back to issue #25 in `ACPX_REVIEW_V1` format, with precise source access level and file/line evidence; Z-FORGE 08 will integrate actual replies with issue #24. The uploaded ZIP is not yet accessible from GitHub; request an approved source capsule, do not pretend to have code access. Important: ZIP contains prohibited Playwright in `examples/e2e.mjs`; do not run/copy it or use Puppeteer. No host install, no private session transfer, no live ChatGPT experiment. Publishing this instruction does not activate your separate conversation.

## Persistent agent memory (standing)

Read `memory/CANON/`, `memory/Immediate/`, and `memory/Curated/` at bootstrap and relevant SITREPs. CANON holds verified durable rules, lessons, decisions and recurring failure/negative patterns with better alternatives; Immediate holds active work, current dependencies, risks, next actions and corrections and should be considered **every interaction**; Curated holds useful style, aesthetics, personalization and working preferences without guessing private facts. Own a high-value first pass; do not fill with stale copied chat or speculative facts. On SITREP reconcile these against the repo and agent intelligence index, and update only materially useful changes; promote durable facts out of Immediate, correct/retire stale material. No mandatory log on every turn. Existing owner's rules take priority.
