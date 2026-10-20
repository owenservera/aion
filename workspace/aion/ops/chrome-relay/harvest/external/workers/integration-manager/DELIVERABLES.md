# AION Integration Manager — adapter packaging desk

**Role:** the middle supplier between [External Nine discovery](../nine-repo/DELIVERABLES.md) and [AION Development](../../../../workers/development/DELIVERABLES.md). **ChatGPT effort:** High for source adaptation; Medium for straightforward mapping. Not another governance board.

## Primary objective: convert leapfrogs into product accelerators

Take the **highest-return** discovery Development selects, including unexpected CDP/MV3 control components, DOM/accessibility observers, parser/compiler kernels, transport/session engines and provider adapters. Preserve as much of the working primitive as makes sense; do **not** reduce a reusable engine to a prose-only pattern or unnecessarily rebuild from scratch. Optimize for **AION development work eliminated**, broad reuse and low friction.

Keep adaptation practical: identify source modules and dependencies; trim what AION doesn't need; map its inputs/outputs onto AION's existing command, identity, event/snapshot or provider contracts; stage real code or a concrete patch. State the implementation leap and remaining integration work in a few sentences. **No independent donor verification or testing**; Development tests after integrating.

## Job: raw discoveries → ready-to-integrate AION packages

Read the existing [exchange](../../../EXCHANGE.jsonl), [Development request/selection](../../../../workers/development/DELIVERABLES.md), [Development Master](../../../../DEVELOPMENT-MASTER.md), and pinned donor files in `../../landing/donors/` (from this file the actual donor directory is `../../landing/donors/`; resolve in GitHub before writing). Start **only with capabilities Development has prioritized**. Do not ask Discovery to verify functionality.

For each selected source: locate exact donor commit/file/function and any required helper/dependency; identify the existing AION code entry point (main or explicitly marked candidate); adapt into a minimal AION-owned patch or staged source package that honors AION's typed contract and single Bus effect authority. Include source/license attribution, files to insert/change, dependency surface, behavior retained versus changed, and a short integration/test note for Development. **Deliver the actual adapted code or concrete patch when practical, not only a prose recommendation.**

**Packaging is not testing.** Assume donor functionality is plausibly wired in its original repository unless obvious counterevidence arises. Do not run donor suites, prove live browser behavior, claim AION acceptance, modify production runtime, or push an automatic integration. Development handles AION tests and final merging. If the current AION code seam is unclear, mark the specific missing input and offer a narrow self-contained adapter instead of inventing an architecture.

**Integration handoff:** put source/patch/dependency evidence in this worker folder under a small `packs/PACK-xx/` folder **only when material exists**; append a concise OFFER or reference the existing AX record in the **one** `harvest/EXCHANGE.jsonl` index. No second request queue, schema, PM system, or compulsory templates.

## Initial packaging order

| Pack | Sources already discovered | AION adaptation to prepare | Guardrail |
| --- | --- | --- | --- |
| **PACK-01 · I0** | AX-0016/0017; `chatgpt-bridge` journal, cursor classification, passive terminal evidence | Bounded event/1 + snapshot/1-aligned receive utilities; concrete patch/fixture suggestions for contiguous replay, explicit gap/reset, exact epoch/message identity | Do not copy tail-window replay omission; reject matching-epoch ahead cursor; never authorize effects from incoming text |
| **PACK-02 · I1** | AX-0016/0017; `multi-ai-chat` responseTracking/chatgptDom + Bridge passive observer | Narrow read-only DOM observer helpers and mapping to AION's existing native host/IPC receive boundary | No alternate runner, private backend, broad transcript broadcast or implicit Send |
| **PACK-03 · I2 later** | AX-0018; `multi-ai-chat` sendConfirmation + Web2API anchoring research | Pure confirmation/correlation helpers and edge-case examples mapped to AION operation IDs | Do not stage automatic click/Enter retries; no alternate actuator or unknown-effect resend |

**First tangible output:** a staged code package for Development's highest-value selected leapfrog, initially PACK-01 unless a higher-payoff CDP, observer, parser, or transport accelerator supersedes it. Include exact insertion point and remaining Development decisions. Read any newer Development selection before creating further packages. Preserve license notices, no secrets/cookies/private transcripts, no Playwright/Puppeteer. Commit only scoped staging/documentation changes to `main` safely; no runtime status claims.

**Status, 2026-10-20:** desk created; PACK-01/02/03 are **requested, not built, tested or integrated**. Keep progress here to a few lines after each actual delivery.
