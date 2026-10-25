# VIVIM V1 — Original integration milestone map (preserved)

**Owner:** Product Agent / AION Role 15. **Date:** 2026-10-25. **Source:** user-facing roadmap after receiving Z.ai Round 1. **Status:** original roadmap snapshot; refinements and current execution ownership in [deep assessment](V1-INTEGRATION-DEEP-ASSESSMENT-2026-10-25.md) and [Z.ai policy](ZAI-EXECUTION-POLICY.md). This file is not engineering authority.

## What R1 supplied
Branch `zai/v1-pass1-shell`, commit `034ced9e368e62e7a15b318a2656ce267c8a10b0` based on `030895e79480f23e8929e4a5de5e80d74aa8c490`. Six changed files: `ARCHITECTURE.md`, `QA-NEXT-TESTS.md`, `src/capture/conversation-runtime.mjs`, `src/studio/ui/chat.html`, `src/studio/ui/chat.mjs`, `test/unit/chat-shell-ui.test.mjs`. Provided: provider rail, searchable local conversation list, live/native-thread/saved-session/local-record labels, first-run guidance, missing-selection restart warning, response-capability fields derived from configured adapters. Z.ai created a patch, Git bundle, source tarball and manifest. **Not proven merged/pushed to origin**. 16 focused UI tests independently rerun against attached source snapshot and passed; architecture inventory check returned zero uncovered source files and zero missing ownership paths. Source notes full suite 1719 passes, one Linux NTFS-sensitive failure and one todo; independently verify before promotion. No user-authenticated provider acceptance.

## Product destination
One local-first persistent VIVIM app: one navigation shell, provider/conversation view, rich native messages/artifacts, project and workspace organization, knowledge and search, explicit intent/capability/authorization/Work trail, durable observed evidence, private portable export. Chrome/browser capability is a **later adapter** after application stabilization, not the center of this integration phase.

### M1 — R1 integration
Reconcile and merge the supplied shell commit with current Harness main; preserve one `/chat` and one browser authority. Exit: accepted source and passing relevant UI + inventory checks.

### M2 — Conversation/content/persistence convergence
Shared identity mapping across VIVIM Conversation / Message / ContentPart / Artifact / EvidenceRef and provider Account / Thread / captured Session / observation. Wire actual captured/projection content to one persisted local user view and retain source fidelity. Exit: durable heterogeneous conversation reopens after process restart with correct identity and evidence.

### M3 — Personal world, memory and organization
Add workspace/project associations, source-qualified knowledge, search and artifact organization on the SAME underlying objects; no second knowledge DB. Exit: create workspace, save selected content, find it, re-open with provenance.

### M4 — Offline application stability
Export/import, restart recovery, errors, migrations, integrity checks, combined app journeys, package startup. Exit: one reproducible self-contained application with local state and no disconnected scaffolds, stable internal contract. **Only this gate permits new interactive Chrome integration.**

### M5 — Interactive external capability
Z.ai Linux Chrome/CDP controlled webapp tests and later owner-authenticated ChatGPT/Claude tests; use existing Harness effect actor, no Playwright/Puppeteer or second CDP governor. Exit: identity-bound, source-grounded real external flows with authorized effects and explicit non-replay on uncertainty.

## Original component map (evidence-qualified candidates)
| Feature | Source | Prior intention |
|---|---|---|
| App shell | Harness `src/studio/ui/chat.*` | KEEP/extend |
| Conversation lifecycle | Harness `src/capture/conversation-runtime.mjs`, `conversation-service.mjs` | KEEP |
| Raw evidence | Harness `src/store/`, `src/replay/` | KEEP |
| Native rich content shapes | Public `vivim-final/src/schema/{streaming,content}.ts` | ADAPT concepts, not framework |
| Workspaces/canvas | `vivim-final/frontend/src/app/page.tsx` | REFERENCE |
| Knowledge | Harness `src/intel/`, optional `vivim-platform/acu/src/` | Existing first; donor for gaps |
| Memory | `vivim-final/src/engines/memory-engine.ts` | Consider only documented gap |
| Exports | Harness `src/export/` | KEEP, wire user flow |
| MCP/CLI | Harness `src/mcp/`, `bin/` | KEEP, later user feature |
| Desktop packaging | `vivim-final/src-tauri/` | REFERENCE later |
| Chrome actor | Harness `src/cdp/`, `src/capture/` | KEEP, defer new functionality |
| Poppy | Research 09 archive | WATCH; not V1 dependency |

## Known sinkholes and avoidance
1. Different meanings of conversation across provider-native thread, local service snapshot, capture session and knowledge entity. **MAX** architecture: resolve canonical IDs/links before migrations.
2. Copying an entire React/Next/PWA backend into the zero-dependency Harness. **HIGH** integration: extract WHAT and selective behavior, not the entire HOW.
3. A second knowledge/memory source of truth. **MAX** ownership: raw evidence immutable; rebuildable view; user-edited facts distinguish from observations.
4. Confusing browser tab identity with account/thread or implying a missing thread restored successfully. **HIGH** tests and **MAX** boundary design.
5. Parallel Z.ai subagents building independent incompatible modules. **HIGH** coordination: one lead, disjoint files, shared contract and integrated tests.
6. Premature Tauri, cloud/P2P sync, Poppy, new registry or Chrome governor. **HIGH/MAX** avoidance: not on internal V1 stabilization critical path.

## Original recommended sequence
R2: one source-qualified content/identity/persistence path; R3: workspace/search/memory; R4: stability/portable export; R5+: interactive Chrome. Product Agent makes **MAX** decisions; Z.ai executes scoped **LOW / MED / HIGH** rounds. Source-derived functionality and actual tests outrank file count and future-roadmap claims.

**Source roots:** [V1 blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md) and [R1 Z.ai brief](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-ZAI-INTEGRATION-PASS-1.md).
