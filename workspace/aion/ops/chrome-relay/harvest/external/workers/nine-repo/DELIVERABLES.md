# External Nine — Seed Deliverables & Autonomous Work Organization

**Purpose:** This is the worker's **primary operational entry point**, replacing a giant launch prompt as the unit of work. The worker reads the current repository, chooses its own investigation sequence and supporting artifacts, and delivers the outcomes below. **ChatGPT effort: High.**

**Governance:** one `main`, Development/Harvest/Research as cooperating subprojects; Track A deprecated; runtime/Agent Fabric work out of scope. See [SITREP](SITREP.md), [BOOTSTRAP](BOOTSTRAP.md), [full historical charter](LAUNCH-PROMPT.md), [shared exchange](../../../EXCHANGE.md).

## Active discovery assignment — scout the biggest shortcut (2026-10-20)

**No more deep investigation of Bridge/Multi-AI for PACK-01/02 unless Integration Manager requests a missing symbol.** They already have a pinned handoff. Run one bounded, source-only leapfrog sweep:

1. **CDP and browser interaction:** compare `cereon-browser-operator` (modular MV3 `CdpSessionManager`, bounded accessibility tree) versus `cdpilot` (large Python CDP command engine) and other strong source paths. Find the **smallest reusable set of modules** that could eliminate browser inspection/diagnostics development. Distinguish read-only observation, direct CDP attach/debugger permission, session scope, iframe/shadow traversal and effectful actions. CDP is **not** a prerequisite for I1.
2. **Parser/command kernel:** use the existing VOMEGA NLCL retention assessment (already captured) as the baseline, not a new harvest. Identify only truly differentiated parser/grounder/typed-command shortcuts in the nine repos, if present, with payoff for AION's future deterministic command front end.
3. **Unexpected engines:** surface any other source-backed subsystem that would replace significant AION code (transport, recovery, provider abstraction, element registry), instead of filling 19×9 coverage for its own sake.

**Return at most three strong, distinct leads** in the existing triage/AX handoff, each with pinned repo/path/function, what AION development it could eliminate, AION seam, dependencies/license and one critical limitation. Mark `BREAKTHROUGH / HIGH / NORMAL` by likely implementation leverage. **No donor test, no wiring verification, no adapted code, no implementation acceptance.** Stop once high-value actionable leads are published; continue with a different topic only if new Dev demand appears.

## Priority override: leapfrog intelligence first

**Mission: find working primitives that let AION skip building whole subsystems.** Search proactively, not just against the 18 DEV areas or 19 P0 commands. Particularly inspect **CDP/MV3/browser automation primitives, DOM/accessibility observation, semantic parsers/compilers, session identity/cursor/recovery, streaming/native IPC, cross-provider adapters, safe operation correlation and other reusable foundations**. An unexpected reusable engine with high payoff is a better discovery than completing a low-value coverage grid.

For a promising discovery, send the shortest useful lead to the existing triage/exchange: **what it does; exact repo SHA + source function/path; which AION work it could eliminate; AION seam/contract to adapt toward; key dependencies/license/caveats; approximate payoff (BREAKTHROUGH/HIGH/NORMAL)**. Compare duplicates only enough to point at the most efficient source for packaging. No exhaustive ranking bureaucracy, independent donor tests, wiring verification, acceptance work or code adaptation. If useful, forward straight to [Integration Manager](../integration-manager/DELIVERABLES.md), who packages Dev-selected leads.

**Success:** Development gets a credible shortcut into a reusable subsystem with fewer custom lines and fewer integration steps. Do not equate more harvest cards with better outcomes.

## Current owner instruction — discovery only (2026-10-20)

**Discover, categorize and source-map; do not verify.** Identify actual functions, modules, tests already present, dependencies, alternative approaches, license and donor commit/path; align to existing AION DEV topics and integration contracts. Do **not** run donor tests, prove their original wiring, validate AION behavior, adapt code, construct integration packages, or choose production implementation. Treat mature repository functionality as **likely working at source** unless there is contrary evidence; record uncertainty rather than investigating functionality by test. Deliver useful raw source intelligence directly to the [Integration Manager](../integration-manager/DELIVERABLES.md) by existing source refs/AX topics. The manager adapts code; [Development](../../../../../workers/development/DELIVERABLES.md) alone integrates and tests.

**No ceremony:** continue using this file, the existing triage evidence, and the single exchange. No new rubric is required merely for completeness; discover high-value source paths proactively, including leapfrogs outside existing Development requests. Keep existing D1–D7 history below as seed guidance, not a testing mandate.

## Prior assignment — discovery and categorization for Development

**First role: discover → classify → align.** Read the [Development Master](../../../DEVELOPMENT-MASTER.md), [machine index](../../../DEVELOPMENT-INDEX.json), and [single exchange](../../../EXCHANGE.jsonl) to understand current and foreseeable AION needs. Map existing internal source state separately from external observations. Group nine-repo findings by developer problem, not by which donor to import. This assignment does **not** ask Harvest to design or implement AION.

**Delivery classes:** `METHOD_PATTERN`, `NEGATIVE_TEST_OR_FAILURE_MODE`, `SPECIFIC_PROTOCOL_CONTRACT_CANDIDATE` (only documented actual interoperability contracts), `NO_APPLICABLE_FINDING`, `UNASSESSED`. Preserve multiple distinct ideas with pin/path/confidence and explicit limits; **no forced primary donor, no external implementation owner, no automatic code reuse**.

**Success now:** a concise categorized crosswalk for developer priorities I0 receive contract/identity, I1 observer/transport, and I2 Send correlation, then gaps across the remaining capability universe (19 P0/40 command/future candidates) in proportion to actual Development needs. The already-delivered AX-0016–0018 are source-inspected *methods and test counterexamples*, not imported code or adopted protocols. Their value is evidence; in-house Development owns design, source, tests and live proof.

**Existing progress retained:** all nine repo source snapshots received breadth-first inspection; delivery handoff and 18-row exchange contain three specific evidence-backed offers. Do not discard or rerun this. The remaining rubric expands classification, not the scope of runtime implementation. Continue the WORKLOG and SITREP; no separate project board.

## Seed outcomes (not prescribed methods)

| Seed | Deliverable / definition of done | Priority | Where it lands |
|---|---|---|---|
| D1 | **Nine-donor reality map:** all nine source snapshots checked; pinned revisions, actual capabilities, code entry points, unique value, licensing, overlaps and unknowns identified. | P0 | Worker-organized research under `external/landing/triage/`; short links in SITREP |
| D2 | **Needs-to-methodology classification:** align every useful method, failure mode, and selective protocol/contract candidate to exact AION DEV topics; compare alternatives without source-owner selection. | P0 | Existing triage/crosswalk evidence; exchange OFFER/GAP links |
| D3 | **Development intelligence delivery:** concise evidence-backed OFFER/GAP records for current needs (first AX-0004 and AX-0006), plus actionable source paths, risks, acceptance and next action. | P0 | Shared `harvest/EXCHANGE.jsonl` |
| D4 | **Development demand expansion:** identify missing current requirements, prerequisites, and future opportunities from code/research; label inferred NEEDs as **proposed**, not approved. | P1 | Shared exchange; no parallel backlog |
| D5 | **Flexible exchange improvement:** when actual findings require, add optional multi-approach/dependency/partial-coverage representations, with compatibility for the existing six records. Avoid mandatory schema explosion. | P1 | `harvest/EXCHANGE.md` + `EXCHANGE.jsonl` |
| D6 | **Selective high-leverage deep evidence:** inspect source/test/contract semantics to explain AION-relevant method choices and failure cases, not to recommend default donor code reuse. | P1 | Existing `external/landing/` evidence and shared OFFERs |
| D7 | **Continuous custody and handoff:** verified commits, a concise current SITREP, decisions needed, open gaps, and next highest-value actions. | Continuous | `SITREP.md` and normal Git commits on `main` |

**These are seed deliverables, not a fixed project plan.** The worker may split, combine, reprioritize, add, or retire deliverables as evidence evolves. Document material scope changes briefly in the SITREP. Do not request the owner's approval for ordinary reversible research organization. Do request approval before changing runtime authority, performing external effects, or making consequential architecture decisions.

## Worker-owned operating loop

1. **Observe:** fetch current `main`, read this file, SITREP, exchange and relevant existing source evidence. Confirm what's already complete.
2. **Choose:** decide the next highest-value bounded deliverable based on Development demand, gaps and expected leverage. Record current focus in SITREP; no separate task board.
3. **Investigate:** inspect donor source and documentation; independently choose depth, research order, comparison method and supporting file layout. Prefer existing triage/evidence folders; create a new subfolder only when genuinely needed.
4. **Deliver:** update the single shared exchange with useful, grounded OFFER/GAP/proposed NEED records **as soon as findings are useful**, not only at the end.
5. **Check publication only:** keep accurate source refs, manifests, JSONL validity and Git commit result. **No donor function/runtime verification.**
6. **Adapt:** use new findings to update requirements, priorities, approach comparisons, evidence depth and—only when warranted—the shared schema.
7. **Resume:** update SITREP with progress and next actions so another session can continue without another giant prompt.

## Freedom and boundaries

- **Worker decides:** how to organize internal investigation, which donor to inspect first, which questions to ask, when to split/merge internal artifacts, what optional schema additions help, and how to allocate effort between reconnaissance and deep dives.
- **Worker must deliver:** inspect all nine eventually, maintain traceable evidence, expose meaningful alternative approaches, link to AION seams, publish concise Development-facing intelligence, and preserve earlier Omega/VIVIM/VOMEGA work.
- **Worker must not:** clone/re-import already captured sources without reason, establish permanent branches, create a second registry or PM framework, treat an OFFER as accepted implementation, execute donor programs unsafely, run Playwright/Puppeteer, modify production runtime, or bypass Windows local-master controls.
- **Evidence and uncertainty:** hypothesis ≠ documentation ≠ inspected code ≠ offline tests ≠ live proof. Existing `STATE.json` is a dated snapshot, not proof of current Windows conditions.

## Startup instruction (one line)

**Read this file and the latest SITREP/BOOTSTRAP; inspect the current exchange and repository; independently organize and execute the highest-value seed deliverables, improving the shared interface when evidence justifies it, and commit verified results to `main`.**

No separate generated prompt or additional task-creation ritual is required.

## Worker-owned priorities and delivery state — 2026-10-20 batch 001

**Current work selection:** maximize present Development leverage at I0/I1, not a horizontal tour of every feature. This is a refinement **inside the existing deliverables file**, not a separate PM queue. See [WORKLOG](WORKLOG.md) and [first-pass Development handoff](../../landing/triage/FIRST-PASS-DEV-HANDOFF.md).

| Rank | Worker-chosen output | State | Completion evidence / precise next gate |
|---|---|---|---|
| **P0-A** | **Nine source reality sweep and role custody:** grounded nine pins, licenses, code seams, differentiated donor roles | **DELIVERED FIRST PASS** | [Role CSV](../../landing/triage/REPO-ROLES.csv) and [handoff](../../landing/triage/FIRST-PASS-DEV-HANDOFF.md). Remaining: full P0 operation-by-operation rubric and selected implementation-depth checks |
| **P0-B** | **I0 receive correctness packet:** cursor/identity/terminal negative evidence, no silent loss | **SOURCE-DELIVERED; DEV VALIDATION OPEN** | AX-0016 and AX-0017; Bridge replay tail-truncation hazard surfaced; Development must implement own contract/tests |
| **P0-C** | **I1 data-only receive transport offer:** SSE epoch/sequence and snapshot resume alternatives without importing second queue | **SOURCE-DELIVERED; DEV VALIDATION OPEN** | AX-0017; exact AION native IPC path unverified; preserve AX-0008 |
| **P0-D** | **I2 send-correlation safety packet:** identity and false-confirmation negatives, no effect retries | **SOURCE-DELIVERED; GATED BY I1** | AX-0018; only pure patterns recommended, not runnable Send donor code |
| **P1-A** | **Dev gap refinement and cross-approach comparison:** explicit existing P0 needs, original source, alternatives, tradeoffs | **FIRST PASS DELIVERED** | 3 OFFER records, AX-0004/0006 kept INVESTIGATING; schema v1.1 optional alternatives used without breaking changes |
| **P1-B** | **Complete 19-P0 operation disposition/dedup rubric** and identify actual uncovered capabilities | **NEXT HARVEST** | Use Command Space P0 IDs as rubric; do not imply all 19 were tested across all nine |
| **P2-A** | **Later provider/file/lifecycle seam follow-up** and licensing edge checks | **DEFERRED UNTIL I1–I3** | parallel-ai attachments; provider selectors; lifecycle and native route requirements AX-0011–0014; no premature runtime claims |
| **Continuous** | **Worklog, custody, honest SITREP and Git reconciliation** | **ACTIVE** | [WORKLOG](WORKLOG.md), [SITREP](SITREP.md), commit evidence |

**Progress against original seed D1–D7:** D1 first pass delivered/remaining exhaustive P0 coverage; D2 high-leverage choices delivered; D3 three Development-facing offers delivered; D4 existing Development needs consumed, novel risks surfaced (no duplicate NEED); D5 no schema rewrite necessary; D6 selected receive/dependency deep inspection and replay counterexample delivered; D7 verified remote Git files and resumption worklog, Windows synchronization explicitly unverified.

**New discovery with immediate implementation value:** Bridge's replay list selects the *last* N retained unconsumed items, potentially skipping earlier still-retained events without gap; an epoch-matching cursor ahead of latest also lacks explicit rejection. Both must be negative-tested by Development before borrowing its stream semantics.

**Next instruction to resumed worker:** check current main, Development requests and exchange; find and categorize source functionality for the Integration Manager, especially I0/I1/I2. No testing or proof obligations. Prioritize actual useful source seams over catalog completeness. Extend P1-B only when it changes useful discovery coverage. Do not select donor implementation winners, code-transplant targets, alternate command engines, or force all 19 P0s onto the current build critical path. Preserve evidence and progress already committed. Keep the seed D1–D7 flexible as circumstances change.
