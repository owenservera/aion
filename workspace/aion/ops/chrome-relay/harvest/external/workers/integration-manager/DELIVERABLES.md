# AION Integration Manager — adapter packaging desk

**Role:** the middle supplier between [External Nine discovery](../nine-repo/DELIVERABLES.md) and [AION Development](../../../../workers/development/DELIVERABLES.md). **ChatGPT effort:** High for source adaptation; Medium for straightforward mapping. Not another governance board.

**Dispatch status (2026-10-20): WORKER_DISPATCH_RECEIVED → PACK-01/02 DELIVERED.** The owner sent the explicit PACK-01 then PACK-02 instruction in this dedicated session. Both code packs are committed to `main`. Staged delivery does **not** mean Development integrated or tested the code; a GitHub TODO alone still never dispatches another worker.

## Active TODO — Integration Manager

- [x] **PACK-01:** stage actual AION-adapted Bridge receive cursor/journal and terminal-evidence source files under `packs/PACK-01/`; preserve license and original SHA/path.
- [x] In PACK-01 correct silent tail-window replay omission and matching-epoch ahead cursor; map to existing AION P1 event/snapshot contract, not a new wire schema.
- [x] **PACK-02:** stage actual read-only Multi-AI Chat DOM/response helpers under `packs/PACK-02/`, matching AION P2 observer/profile seams; exclude Send/Enter/click/retry and private backend paths.
- [x] For each pack include exact destination files, dependency footprint and short integration/test notes; commit the **actual staged code** to main and update existing AX links.
- [ ] When Development selects a higher-value CDP/parser/transport leapfrog, prioritize its small staged code package over low-value completeness work.

**Next guidance (SAVED_NOT_DISPATCHED; historical PACK-01/02 delivery above is separate; no current worker ACK is implied):** Development integrated PACK-01/02 source on main `e006692`; live I1 is pending. **Wait for a Development-selected concrete extraction** (source-only; no new PACK requested yet, e.g. registration-email leverage is unproven and already implemented in the candidate). PACK-03 stays deferred until I1. No supplier tests, Send, or resend.

**Done = reusable staged code + exact insertion notes; no independent donor testing, AION test claims or runtime changes. Thinking effort: High.**

## Primary objective: convert leapfrogs into product accelerators

Take the **highest-return** discovery Development selects, including unexpected CDP/MV3 control components, DOM/accessibility observers, parser/compiler kernels, transport/session engines and provider adapters. Preserve as much of the working primitive as makes sense; do **not** reduce a reusable engine to a prose-only pattern or unnecessarily rebuild from scratch. Optimize for **AION development work eliminated**, broad reuse and low friction.

Keep adaptation practical: identify source modules and dependencies; trim what AION doesn't need; map its inputs/outputs onto AION's existing command, identity, event/snapshot or provider contracts; stage real code or a concrete patch. State the implementation leap and remaining integration work in a few sentences. **No independent donor verification or testing**; Development tests after integrating.

## Job: raw discoveries → ready-to-integrate AION packages

Read the existing [exchange](../../../EXCHANGE.jsonl), [Development request/selection](../../../../workers/development/DELIVERABLES.md), [Development Master](../../../../DEVELOPMENT-MASTER.md), and pinned donor files in `../../landing/donors/` (from this file the actual donor directory is `../../landing/donors/`; resolve in GitHub before writing). Start **only with capabilities Development has prioritized**. Do not ask Discovery to verify functionality.

For each selected source: locate exact donor commit/file/function and any required helper/dependency; identify the existing AION code entry point (main or explicitly marked candidate); adapt into a minimal AION-owned patch or staged source package that honors AION's typed contract and single Bus effect authority. Include source/license attribution, files to insert/change, dependency surface, behavior retained versus changed, and a short integration/test note for Development. **Deliver the actual adapted code or concrete patch when practical, not only a prose recommendation.**

**Packaging is not testing.** Assume donor functionality is plausibly wired in its original repository unless obvious counterevidence arises. Do not run donor suites, prove live browser behavior, claim AION acceptance, modify production runtime, or push an automatic integration. Development handles AION tests and final merging. If the current AION code seam is unclear, mark the specific missing input and offer a narrow self-contained adapter instead of inventing an architecture.

**Integration handoff:** put source/patch/dependency evidence in this worker folder under a small `packs/PACK-xx/` folder **only when material exists**; append a concise OFFER or reference the existing AX record in the **one** `harvest/EXCHANGE.jsonl` index. No second request queue, schema, PM system, or compulsory templates.

## Active build assignment — deliver code now (2026-10-20)

**First, PACK-01 / I0: executable staged source, not a recommendation.** Read the accepted contract in `velocity/design/12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md` on PR #46 and source `chatgpt-bridge/src/bridge/observedTurns/observedTurnJournal.js`, `src/bridge/observation/turnEvidence.js`, and their minimal dependencies from the pinned donor snapshot. Stage a **pure, bounded** AION-shaped cursor/journal/observation-classifier module under `packs/PACK-01/`, preserving module licensing. Use AION's declared event/snapshot identity fields; where P1's implementation is missing, expose a small pure adapter boundary **without inventing a second canonical schema**. Correct cursor-ahead-of-latest *even when epoch matches*, retain contiguous ascending replay or emit explicit gap, cap text and mark unknown history honestly. Include short notes with exact AION insertion point `extension/src/lib/conversation-contract.js` and the source tests Development should adapt. **Do not test**, touch authoritative runtime or claim completion without actual code committed.

**Second, PACK-02 / I1: stage usable read-only ChatGPT page helpers.** Adapt `multi-ai-chat/src/content/responseTracking.ts`, the read-side selectors/incomplete-assistant methods from `chatgptDom.ts`, and only the independently useful passive-turn classification from Bridge, into `packs/PACK-02/`. Target AION's eventual `extension/src/providers/chatgpt/{observer,profile}.js`, with exact-bound conversation/page epoch, message key/revision, no false old/empty/remounted assistant, explicit incomplete/unknown and bounded DOM coverage. **Do not import Send controls, click/Enter logic, entire donor routers, private API access, native host runtime or effect Bus**. Native IPC P3/P4 integration belongs to Development.

**Done means:** substantive code files in PACK-01 and PACK-02 with pinned source/attribution, dependencies, AION insertion paths and a brief test/unknown handoff. Commit on current `main` with conflict checks. Do not hold a package for an independent donor verification phase; source-inspected donor functionality is our starting assumption. Report code delivered versus not delivered accurately. Work may proceed in parallel only where edit paths do not collide. **No new queue or general-purpose framework.**

## Initial packaging order

| Pack | Sources already discovered | AION adaptation to prepare | Guardrail |
| --- | --- | --- | --- |
| **PACK-01 · I0** | AX-0016/0017; `chatgpt-bridge` journal, cursor classification, passive terminal evidence | Bounded event/1 + snapshot/1-aligned receive utilities; concrete patch/fixture suggestions for contiguous replay, explicit gap/reset, exact epoch/message identity | Do not copy tail-window replay omission; reject matching-epoch ahead cursor; never authorize effects from incoming text |
| **PACK-02 · I1** | AX-0016/0017; `multi-ai-chat` responseTracking/chatgptDom + Bridge passive observer | Narrow read-only DOM observer helpers and mapping to AION's existing native host/IPC receive boundary | No alternate runner, private backend, broad transcript broadcast or implicit Send |
| **PACK-03 · I2 later** | AX-0018; `multi-ai-chat` sendConfirmation + Web2API anchoring research | Pure confirmation/correlation helpers and edge-case examples mapped to AION operation IDs | Do not stage automatic click/Enter retries; no alternate actuator or unknown-effect resend |

**First tangible output:** a staged code package for Development's highest-value selected leapfrog, initially PACK-01 unless a higher-payoff CDP, observer, parser, or transport accelerator supersedes it. Include exact insertion point and remaining Development decisions. Read any newer Development selection before creating further packages. Preserve license notices, no secrets/cookies/private transcripts, no Playwright/Puppeteer. Commit only scoped staging/documentation changes to `main` safely; no runtime status claims.

**Status, 2026-10-20:** PACK-01 **staged** at `b06b0e54cb0c57f3dcdc1d6df7c2ef06973c2599`; PACK-02 **staged** at `5f72abda13010cdc3d5211895e232cf6f87f4906` (rebased after a concurrent Discovery main commit). Both contain real AION-adapted source and MIT notices; **no donor tests, AION tests, Windows run or live I1 receipt**. PACK-03 remains deferred. Development owns P1/P2 insertion and testing; see [SITREP](SITREP.md).
