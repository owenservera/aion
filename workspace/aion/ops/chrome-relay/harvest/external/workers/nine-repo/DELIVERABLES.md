# External Nine — Seed Deliverables & Autonomous Work Organization

**Purpose:** This is the worker's **primary operational entry point**, replacing a giant launch prompt as the unit of work. The worker reads the current repository, chooses its own investigation sequence and supporting artifacts, and delivers the outcomes below. **ChatGPT effort: High.**

**Governance:** one `main`, Development/Harvest/Research as cooperating subprojects; Track A deprecated; runtime/Agent Fabric work out of scope. See [SITREP](SITREP.md), [BOOTSTRAP](BOOTSTRAP.md), [full historical charter](LAUNCH-PROMPT.md), [shared exchange](../../../EXCHANGE.md).

## Seed outcomes (not prescribed methods)

| Seed | Deliverable / definition of done | Priority | Where it lands |
|---|---|---|---|
| D1 | **Nine-donor reality map:** all nine source snapshots checked; pinned revisions, actual capabilities, code entry points, unique value, licensing, overlaps and unknowns identified. | P0 | Worker-organized research under `external/landing/triage/`; short links in SITREP |
| D2 | **Capability-to-approach map:** compare genuinely distinct approaches for important AION capabilities, including competing/complementary methods, conditions, evidence, and best-fit options. One primary *research owner* need not imply one implementation. | P0 | Existing triage/crosswalk evidence; exchange OFFER/GAP links |
| D3 | **Development intelligence delivery:** concise evidence-backed OFFER/GAP records for current needs (first AX-0004 and AX-0006), plus actionable source paths, risks, acceptance and next action. | P0 | Shared `harvest/EXCHANGE.jsonl` |
| D4 | **Development demand expansion:** identify missing current requirements, prerequisites, and future opportunities from code/research; label inferred NEEDs as **proposed**, not approved. | P1 | Shared exchange; no parallel backlog |
| D5 | **Flexible exchange improvement:** when actual findings require, add optional multi-approach/dependency/partial-coverage representations, with compatibility for the existing six records. Avoid mandatory schema explosion. | P1 | `harvest/EXCHANGE.md` + `EXCHANGE.jsonl` |
| D6 | **Selective high-leverage deep evidence:** choose the highest-impact implementation seams; inspect call paths/tests/license, compare reuse/adapt/rebuild, identify validation needed. | P1 | Existing `external/landing/` evidence and shared OFFERs |
| D7 | **Continuous custody and handoff:** verified commits, a concise current SITREP, decisions needed, open gaps, and next highest-value actions. | Continuous | `SITREP.md` and normal Git commits on `main` |

**These are seed deliverables, not a fixed project plan.** The worker may split, combine, reprioritize, add, or retire deliverables as evidence evolves. Document material scope changes briefly in the SITREP. Do not request the owner's approval for ordinary reversible research organization. Do request approval before changing runtime authority, performing external effects, or making consequential architecture decisions.

## Worker-owned operating loop

1. **Observe:** fetch current `main`, read this file, SITREP, exchange and relevant existing source evidence. Confirm what's already complete.
2. **Choose:** decide the next highest-value bounded deliverable based on Development demand, gaps and expected leverage. Record current focus in SITREP; no separate task board.
3. **Investigate:** inspect donor source and documentation; independently choose depth, research order, comparison method and supporting file layout. Prefer existing triage/evidence folders; create a new subfolder only when genuinely needed.
4. **Deliver:** update the single shared exchange with useful, grounded OFFER/GAP/proposed NEED records **as soon as findings are useful**, not only at the end.
5. **Verify:** check provenance, compatibility, JSONL validity, changed paths, and Git commit/push result. Do not claim tests or local/live validation not performed.
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
