# Z.ai — R2 WHAT / WHY / WHERE intelligence delta
**AION PRODUCT Agent · 2026-10-25 · Supplemental to [original one-pager](../ZAI-V1-WHAT-WHY-WHERE-ONE-PAGER.md)**

**For use whenever useful; do not interrupt the current Z.ai round.** This is product intelligence, **not a rewrite of your code plan, package choice, subagent structure or implementation HOW**. Continue using the existing canonical `owenservera/vivim-harness` source and your own engineering judgment. Dependencies are allowed when they demonstrably make work **better/faster/less garbage**.

## Highest-value additional source intelligence

| WHAT to look for | WHY it may add product value | WHERE verified or worth inspecting | Watch-out / evidence maturity |
|---|---|---|---|
| **Durable saved AI work distinct from capture evidence** | The user can reopen *their* conversation library and annotate it without rewriting source observations | [Harness conversation-service](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-service.mjs), [capture session store](https://github.com/owenservera/vivim-harness/blob/main/src/store/session.mjs), [Final conversation API precedent](https://github.com/owenservera/vivim-final/blob/master/src/server/conversation-router.ts) | Existing service journals/exports do **not** independently prove a persistent user-editable read model |
| **Rich provider-native content with unknown-format preservation** | Saving only plain text breaks artifacts, citations, tool events and future providers | [Harness universal projection](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs); [Final content taxonomy](https://github.com/owenservera/vivim-final/blob/master/src/schema/streaming.ts), [renderer pattern](https://github.com/owenservera/vivim-final/blob/master/frontend/src/render/registry.ts) | Harness already has rendering. Import donor behavior only where it closes observed gaps; do not assume a second renderer is needed |
| **One project/workspace the user can keep** | Chats become reusable project knowledge rather than disconnected logs | [Existing Studio home](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/index.html), [Final initial workspace UX](https://github.com/owenservera/vivim-final/blob/master/frontend/src/app/page.tsx) | This is a product outcome; not a mandate to port Next or its services |
| **Find an answer and show *where it came from*** | Trust and reuse require item-level source navigation and coverage truth | [Harness lexical search](https://github.com/owenservera/vivim-harness/blob/main/src/intel/search.mjs), [scoped continuity](https://github.com/owenservera/vivim-harness/blob/main/src/intel/continuity.mjs) | R1 list filter is not a comprehensive personal library search |
| **Actually portable chosen workspace** | User ownership means selective export **and** verified restore | [Harness export layer](https://github.com/owenservera/vivim-harness/blob/main/src/export/export.mjs), [Claude Export Hub selectable export UX](https://github.com/owenservera/claude-export-hub-vivim/blob/main/README.md) | Existing export file explicitly says read-only; complete VIVIM import round-trip not yet verified |
| **Readable account/capability honesty** | A visible control must not imply provider support, a connected account or authorized action that does not exist | [Harness studio capability](https://github.com/owenservera/vivim-harness/blob/main/src/studio/capabilities.mjs), [Edge capability evidence taxonomy](https://github.com/owenservera/edge-pwa/blob/main/backend/src/registry/capability_vault.rs) | Keep declared/discovered/inferred distinction; don't transplant a parallel vault automatically |
| **Source-aligned VIVIM command and agentic-file systems** | Human instructions and AI context should be reusable without fabricating permissions or copying boilerplate | [Recovered command toolkit](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/15-product-to-market/core-library/COMMAND-SYSTEM.md), [agentic file library](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/15-product-to-market/core-library/AGENTIC-FILE-LIBRARY.md) | Owner-selected strategic capabilities; integration scope/timing still needs an explicit product choice. Do not create a second executor |
| **Potential future provider adaptation logic** | Source observations can propose capabilities, but only tests may confirm them | [Protocol graph discovery](https://github.com/owenservera/vivim-webapp-emulator/blob/master/src/discover.ts), [mock-driver roundtrip](https://github.com/owenservera/vivim-webapp-emulator/blob/master/tests/roundtrip.test.ts) | This repository is **not a proven Chrome mock-provider site**. Its phase-0 test is an interesting technique, after app stability |
| **Personal canvas** | Spatial groups and node links could make collected AI work easier to comprehend | [Canvas features](https://github.com/owenservera/infinite-canvas-vivim/blob/main/docs/content/docs/overview/features.mdx) | Feature docs mention AI generation, plugins and browser-stored API keys; useful WHAT does not justify importing a second app |
| **High-confidence capability documentation** | Catalog presence must not be confused with executable capabilities | [Final feature inventory](https://github.com/owenservera/vivim-final/blob/master/docs/alpha/03-FEATURE-INVENTORY.md) | Donor reports 3,548 listed specs vs only ~54 handlers; no independent live acceptance in this review |

## What improves the roadmap most

**Four candidate local-first user outcomes, not a mandatory engineering sequence:**
1. Return to a saved heterogeneous conversation after restart with source identity intact.
2. Attach the useful part of a conversation to a named workspace and retain a human note.
3. Search the local collection and open the exact evidence-backed item, showing observation versus interpretation.
4. Export a chosen workspace and reimport to a clean app without exposing credentials.

Those are the product-value lenses that help us decide whether any donor is actually useful. [Full 18-cluster/7-journey crosswalk](V1-VALUE-CHAIN-CROSSWALK.yaml).

## Explicit non-requests

**Do not** port a complete old React/Next/Rust app, a new memory backend, separate browser actor, giant capability registry, graph database, P2P sync or canvas merely because we located it. That is **not a blanket dependency ban**: choose the simplest justified tools. Do not switch to new interactive Chrome integration before the app is internally stable; the Linux interactive Chrome capability will be valuable later. No Playwright/Puppeteer.

**Z.ai remains owner of LOW/MED/HIGH HOW.** Product Agent/local models handle MAX architecture disputes, product intent and atlas curation. No response, ACK, code merge, tests or local Windows actions are claimed by this intelligence note.
