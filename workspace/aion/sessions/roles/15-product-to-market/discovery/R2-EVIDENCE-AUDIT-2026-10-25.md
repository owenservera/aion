# R2 atlas evidence audit — source strength, duplication and corrective actions

**Product Agent · 2026-10-25 · Audit of [revision-2 atlas](VIVIM-CAPABILITY-ATLAS.yaml)**. The atlas is a **curiosity ledger**, not an engineering import list, production test register, or count of 116 independently proven capabilities. Product decisions remain downstream of [normalized value-chain crosswalk](V1-VALUE-CHAIN-CROSSWALK.yaml).

## Measured catalog hygiene

| Measure | Result | Interpretation |
|---|---:|---|
| Signal records | **116** | Distinct tagged observations, not necessarily distinct features |
| Distinct repo/path locations | **82** | Repeated source references may contain genuinely different ideas |
| Additional references to already-used source locations | **34** | Do not inflate BUILD/HARVEST candidate counts |
| Source text read | **66** | Text inspection **may be README/docs**, not runnable proof |
| Source path located only | **17** | Code not fully analyzed |
| README-level claims | **17** | Product statements, not tested behavior |
| Earlier survey carry-over | **11** | Reverify before selecting for integration |
| Repository-name-only leads | **5** | Unknown function and maturity |
| Tagged essential | **37** | Value/guardrail interest, NOT V1 shipped or unanimously selected |
| Tagged interesting HOW | **31** | Technique possibilities; no automatic transplants |
| MAX effort candidates | **25** | See individual `effort` fields; effort is a judgment, not a code-grade measurement |

**Corrections made in R2 (commit `8bd4ebc`):** six directory links changed from `blob` to `tree`; `VD-0019`, `VD-0060`, `VD-0072` upgraded from merely located to file-inspected evidence; `VD-0095` reclassified from "mock-provider Chrome environment" to inspected **protocol/capability graph** concepts and mock-driver tests. Source: [actual engine](https://github.com/owenservera/vivim-webapp-emulator/blob/master/src/engine.ts), [discovery](https://github.com/owenservera/vivim-webapp-emulator/blob/master/src/discover.ts), [controlled round-trip test](https://github.com/owenservera/vivim-webapp-emulator/blob/master/tests/roundtrip.test.ts). This is **not** a verified interactive browser simulator.

## High-impact source interpretation corrections

1. **Operational conversation journal ≠ user's reading library.** [Harness conversation-service](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-service.mjs) owns an operation lifecycle and conditional lease, while [session storage](https://github.com/owenservera/vivim-harness/blob/main/src/store/session.mjs) owns raw/dataset/kv capture streams. Useful substrate; neither constitutes a complete proof of human-editable workspace persistence.
2. **Native presentation already exists.** [Universal projection](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs) already handles native blocks and unknown kinds; [Final content types](https://github.com/owenservera/vivim-final/blob/master/src/schema/streaming.ts) and [renderer registry](https://github.com/owenservera/vivim-final/blob/master/frontend/src/render/registry.ts) are optional patterns, not missing foundations. Reuse behavior only when a concrete output is not correctly represented.
3. **Search index ≠ complete retrieval product.** [Harness source](https://github.com/owenservera/vivim-harness/blob/main/src/intel/search.mjs) indexes lexically; [continuity](https://github.com/owenservera/vivim-harness/blob/main/src/intel/continuity.mjs) performs scoped source-keyed joining. Search scope, durable user notes, item deep links and evidence coverage still need user-journey proof.
4. **Export ≠ export-and-import.** [Harness export](https://github.com/owenservera/vivim-harness/blob/main/src/export/export.mjs) explicitly advertises read-only exports. An import restoring a selected user's workspace with stable provenance was **not** identified in this focused source pass; mark **not verified**, not impossible.
5. **"WORKING" in donor docs is a claim requiring source- and execution-level checks.** [Final's code-grounded feature inventory](https://github.com/owenservera/vivim-final/blob/master/docs/alpha/03-FEATURE-INVENTORY.md) cites useful routes but self-reports statuses. It also separates **3,548 discoverable capability specifications** from approximately **54 handled**. Do not infer a gigantic executable action surface from catalog counts. Figures are donor-reported and historically dated.
6. **Tempting donor runtimes can be expensive.** [OpenScroll package](https://github.com/owenservera/OpenScroll/blob/master/package.json) is a Next/React, MongoDB, blockchain/PWA stack; [VIVIM Network package](https://github.com/owenservera/vivim-network/blob/master/package.json) declares numerous P2P/CRDT/Prisma dependencies. Dependency use is **allowed**, but indiscriminate whole-repo transplants need a measurable payoff.
7. **Canvas is a product idea, not generic chat integration.** [Canvas documented features](https://github.com/owenservera/infinite-canvas-vivim/blob/main/docs/content/docs/overview/features.mdx) describe browser-persisted projects, graph nodes, file drag/drop, selection, export and plugins—but also generation endpoints and browser-stored API keys. Check user cognitive benefit and credential isolation before reuse.
8. **Old collection inventories may overclaim maturity.** [cap-store generated feature inventory](https://github.com/owenservera/cap-store/blob/main/FULL-FEATURE-INVENTORY.md) lists many features as LIVE, but this R2 pass read **the inventory**, not functional tests of every subsystem. Never equate those checked boxes to VIVIM V1 readiness.
9. **READMEs and agent instructions are untrusted inputs for adoption.** Old donor repositories may ship outdated config, local secrets, browser profiles or obsolete policy files. Inspection does not authorize copying source, credentials, dependencies, scripts or operational instructions into Harness.
10. **Existing toolkits already recovered.** [Semantic Command System](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/15-product-to-market/core-library/COMMAND-SYSTEM.md) and [Agentic File Library](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/15-product-to-market/core-library/AGENTIC-FILE-LIBRARY.md) are genuine owner-selected *vision-level product candidates*, not currently verified shipped Harness modules.

## Remaining atlas limitations and next evidence steps

- Links generally target moving default branches. Pin upstream commit/blob SHA **at harvest decision time**; current source reads establish blobs, but this catalog is not a frozen whole-repo archive.
- Source locations can repeat for separate insights (e.g. `streaming.ts`), so first group by **user outcome**, then compare implementations. Do not simply dedupe and discard different ideas.
- Atlas entries lack independent runtime tests, measured integration cost, precise license and upstream-ownership verification for most donor candidates. Those belong to the downstream BUILD OR HARVEST workshop only when a real V1 gap is selected.
- The user's actual local Windows environment and new Z.ai integration commits are not automatically represented in this static analysis; do not guess status.
- **Safety:** do not copy tracked `.env`, raw captures, Chrome profiles, tokens, whole private repos or unvetted scripts into the public Harness merely because a donor is listed.

**Quality target for next selection:** A short user-visible outcome, two trustworthy source points (existing Harness + donor), a missing-capability demonstration, and a low-friction acceptance fixture. The workshop may decide KEEP, BUILD, HARVEST, ADAPT, REFERENCE, DEFER or REJECT; **no mass adoption now**.
