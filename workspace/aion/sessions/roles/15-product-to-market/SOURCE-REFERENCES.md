# Source references and evidence provenance

> **VIVIM World source archaeology — 2026-10-27.** Remote GitHub source audit, not a local or browser acceptance. Canonical Harness HEAD inspected: `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51`; AION baseline: `53b8e7063d37787d9cb10ba6681bc2c45b6c4055`. Evidence tags: **CODE VERIFIED** = read code; **TEST SOURCE VERIFIED** = read test, not executed; **HISTORICAL RECEIPT** = prior run report; **NOT VERIFIED** = live/browser behavior, current OS acceptance, or missing evidence.

## 1. Pinned source baselines

- [vivim-harness](https://github.com/owenservera/vivim-harness/tree/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51) — default branch `main`, commit `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51`.
- [aion](https://github.com/owenservera/aion/tree/53b8e7063d37787d9cb10ba6681bc2c45b6c4055) — default branch `main`, commit `53b8e7063d37787d9cb10ba6681bc2c45b6c4055`.
- [vivim-final](https://github.com/owenservera/vivim-final/tree/8a798f91d52574cb3d7db579da516bc1c4aee7b7) — default branch `master`, commit `8a798f91d52574cb3d7db579da516bc1c4aee7b7`.
- [vivim-platform](https://github.com/owenservera/vivim-platform/tree/18bf523edb887374770a49db61b08204fdd4f141) — default branch `main`, commit `18bf523edb887374770a49db61b08204fdd4f141`.
- [vivim](https://github.com/owenservera/vivim/tree/57227f3fbee4aafd3eed339900442b47ebf07bc3) — default branch `main`, commit `57227f3fbee4aafd3eed339900442b47ebf07bc3`.
- [vivim-final-enhanced](https://github.com/owenservera/vivim-final-enhanced/tree/afebe00c9ab4bf521e0132a9f44bacd230e6fab8) — default branch `master`, commit `afebe00c9ab4bf521e0132a9f44bacd230e6fab8`.
- [vivim-final-program](https://github.com/owenservera/vivim-final-program/tree/4a5eb8488d4d2fe21a2ca6c2a467cbdb153f18a8) — default branch `master`, commit `4a5eb8488d4d2fe21a2ca6c2a467cbdb153f18a8`.
- [vivim-app](https://github.com/owenservera/vivim-app/tree/3e59dfbba1ea96fd09be3a12362bd9b279dab305) — default branch `main`, commit `3e59dfbba1ea96fd09be3a12362bd9b279dab305`.
- [vivim-pwa](https://github.com/owenservera/vivim-pwa/tree/5bd7d9faaab631d0f520c010226dd13b8391dd71) — default branch `master`, commit `5bd7d9faaab631d0f520c010226dd13b8391dd71`.
- [vivim-live](https://github.com/owenservera/vivim-live/tree/7d95a64caa576e4c4f4096f8a2ed9cb244e6b4b6) — default branch `master`, commit `7d95a64caa576e4c4f4096f8a2ed9cb244e6b4b6`.
- [vivim-omega-os](https://github.com/owenservera/vivim-omega-os/tree/67e3eaf8e0f0a013694d24903480905ffce21976) — default branch `main`, commit `67e3eaf8e0f0a013694d24903480905ffce21976`.
- [VOMEGA](https://github.com/owenservera/VOMEGA/tree/12c853259f60cf3a883c7fb1c9f329d696606d64) — default branch `main`, commit `12c853259f60cf3a883c7fb1c9f329d696606d64`.
- [vivim-sdk](https://github.com/owenservera/vivim-sdk/tree/6450c6caf1f0b5413477f2d87d4cfd5dac462a63) — default branch `master`, commit `6450c6caf1f0b5413477f2d87d4cfd5dac462a63`.
- [vivim-scroll](https://github.com/owenservera/vivim-scroll/tree/10e3c27c5bd4adf5c1df85549e95d3b4901a55e9) — default branch `main`, commit `10e3c27c5bd4adf5c1df85549e95d3b4901a55e9`.

## 2. Entry points and authoritative contract evidence

- **Harness Studio server:** [vivim-harness/src/studio/server.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/server.mjs#L175-L199)
- **Harness chat DOM shell and mode IDs:** [vivim-harness/src/studio/ui/chat.html](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/chat.html#L249-L263)
- **Harness dynamic World mount:** [vivim-harness/src/studio/ui/chat.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/chat.mjs#L1856-L1905)
- **Harness safe rich DOM renderer:** [vivim-harness/src/studio/ui/chat.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/chat.mjs#L537-L751)
- **Harness saved part projection:** [vivim-harness/src/studio/world-service.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-service.mjs#L27-L154)
- **Harness World routes:** [vivim-harness/src/studio/world-service.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-service.mjs#L169-L195)
- **Harness World UI and part paths:** [vivim-harness/src/studio/ui/world-view.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/world-view.mjs)
- **Harness bounded search:** [vivim-harness/src/studio/world-search.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-search.mjs)
- **Harness relations:** [vivim-harness/src/studio/world-relations.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-relations.mjs)
- **Harness JSON transfer:** [vivim-harness/src/studio/world-transfer.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-transfer.mjs)
- **Harness conversation API:** [vivim-harness/src/studio/conversation-api.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/conversation-api.mjs)
- **AION existing UI handoff:** [aion/workspace/aion/ops/capture-studio-ui/handoffs/parallel-2026-10-24/HANDOFF.md](https://github.com/owenservera/aion/blob/53b8e7063d37787d9cb10ba6681bc2c45b6c4055/workspace/aion/ops/capture-studio-ui/handoffs/parallel-2026-10-24/HANDOFF.md)
- **First-user owner decision:** [vivim-harness/docs/product/FIRST-USER-ONBOARDING-DECISIONS-2026-10-27.md](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/docs/product/FIRST-USER-ONBOARDING-DECISIONS-2026-10-27.md)
- **Portability receipt:** [vivim-harness/docs/PORTABILITY.md](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/docs/PORTABILITY.md)

## 3. Donor implementation references

- Final app page: [vivim-final/frontend/src/app/page.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/app/page.tsx)
- Final onboarding: [vivim-final/frontend/src/features/guided-landing.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/features/guided-landing.tsx)
- Final palette: [vivim-final/frontend/src/components/canvas/CommandPalette.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/canvas/CommandPalette.tsx)
- Final MainMenu: [vivim-final/frontend/src/components/canvas/MainMenu.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/canvas/MainMenu.tsx)
- Final SurfaceTabs: [vivim-final/frontend/src/components/chat/SurfaceTabs.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/chat/SurfaceTabs.tsx)
- Final LivingCanvas: [vivim-final/frontend/src/components/canvas/LivingCanvas.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/canvas/LivingCanvas.tsx)
- Final StorageSettings: [vivim-final/frontend/src/components/canvas/StorageSettings.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/canvas/StorageSettings.tsx)
- Final streaming parts: [vivim-final/src/schema/streaming.ts](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/schema/streaming.ts)
- Platform AST: [vivim-platform/edge-pwa/frontend/src/observatory/ast-compiler.ts](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/observatory/ast-compiler.ts)
- Platform content renderer: [vivim-platform/edge-pwa/frontend/src/components/ContentRenderer.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/ContentRenderer.tsx)
- Platform edge library: [vivim-platform/edge-pwa/frontend/src/components/LibraryView.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/LibraryView.tsx)
- Platform edge chat: [vivim-platform/edge-pwa/frontend/src/components/ChatView.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/ChatView.tsx)
- Platform edge layout: [vivim-platform/edge-pwa/frontend/src/components/AppLayout.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/AppLayout.tsx)
- Platform PWA home: [vivim-platform/pwa/src/pages/HomeAssistant.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/pages/HomeAssistant.tsx)
- Platform PWA import: [vivim-platform/pwa/src/pages/Import.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/pages/Import.tsx)
- Platform demo graph: [vivim-platform/pwa/src/components/demo/knowledge-graph.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/components/demo/knowledge-graph.tsx)
- Platform export panel: [vivim-platform/edge-pwa/frontend/src/components/ExportPanel.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/ExportPanel.tsx)
- Original Solid app: [vivim/vivim/src/index.tsx](https://github.com/owenservera/vivim/blob/57227f3fbee4aafd3eed339900442b47ebf07bc3/vivim/src/index.tsx)
- Original Solid canvas: [vivim/vivim/src/ui/canvas/Playspace.tsx](https://github.com/owenservera/vivim/blob/57227f3fbee4aafd3eed339900442b47ebf07bc3/vivim/src/ui/canvas/Playspace.tsx)
- Original Solid control center: [vivim/vivim/src/ui/shell/ControlCenter.tsx](https://github.com/owenservera/vivim/blob/57227f3fbee4aafd3eed339900442b47ebf07bc3/vivim/src/ui/shell/ControlCenter.tsx)
- PWA app: [vivim-pwa/src/App.tsx](https://github.com/owenservera/vivim-pwa/blob/5bd7d9faaab631d0f520c010226dd13b8391dd71/src/App.tsx)
- App nested PWA: [vivim-app/pwa/src/App.tsx](https://github.com/owenservera/vivim-app/blob/3e59dfbba1ea96fd09be3a12362bd9b279dab305/pwa/src/App.tsx)
- Marketing demo: [vivim-live/src/app/page.tsx](https://github.com/owenservera/vivim-live/blob/7d95a64caa576e4c4f4096f8a2ed9cb244e6b4b6/src/app/page.tsx)
- OpenScroll template: [vivim-scroll/openscroll-pwa/src/App.tsx](https://github.com/owenservera/vivim-scroll/blob/10e3c27c5bd4adf5c1df85549e95d3b4901a55e9/openscroll-pwa/src/App.tsx)

## 4. Tests inspected, *not executed* in this session

- [vivim-harness/test/unit/world-ui.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-ui.test.mjs)
- [vivim-harness/test/unit/world-ui-find.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-ui-find.test.mjs)
- [vivim-harness/test/unit/world-ui-export-modes.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-ui-export-modes.test.mjs)
- [vivim-harness/test/unit/world-r456-integration.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-r456-integration.test.mjs)
- [vivim-harness/test/unit/world-journeys.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-journeys.test.mjs)
- [vivim-harness/test/unit/world-import-content.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-import-content.test.mjs)
- [vivim-harness/test/unit/world-restore.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-restore.test.mjs)
- [vivim-harness/test/unit/world-transfer.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-transfer.test.mjs)
- [vivim-harness/test/unit/world-ui-workspace.test.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/test/unit/world-ui-workspace.test.mjs)
- [vivim-platform/edge-pwa/frontend/src/components/ContentRenderer.test.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/ContentRenderer.test.tsx) — Vitest basic renderer assertions with DOMPurify mock, not a native fidelity/security certification.
- [vivim-platform/edge-pwa/frontend/src/observatory/parser-fidelity-chatgpt-test.ts](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/observatory/parser-fidelity-chatgpt-test.ts), [vivim-platform/edge-pwa/frontend/src/observatory/parser-fidelity-claude-test.ts](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/observatory/parser-fidelity-claude-test.ts) — standalone parser scenario sources, not executed.
- [vivim-final/tests/e2e/setup-wizard.test.ts](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/tests/e2e/setup-wizard.test.ts) — Bun HTTP API surface only.
- [Harness GitHub Actions run 40352494253](https://github.com/owenservera/vivim-harness/actions/runs/40352494253) — conclusion failure, Oct 26; all four Windows/Ubuntu Node 22/24 jobs fail near-immediately, retrieved metadata includes no steps. **Root cause unknown.**
- [Harness GitHub Actions run 40352417064](https://github.com/owenservera/vivim-harness/actions/runs/40352417064) — same type of failure; not current HEAD proof.

## 5. Structural deduplication verified by Git tree/blob SHA

- Entire `frontend/` subtree is Git tree `f5f8a2de1048112c77ade2f35ea6931800441c30` in `vivim-final`, `vivim-final-enhanced`, and `vivim-final-program` at the pinned commits. Compare [vivim-final](https://github.com/owenservera/vivim-final/tree/8a798f91d52574cb3d7db579da516bc1c4aee7b7), [vivim-final-enhanced](https://github.com/owenservera/vivim-final-enhanced/tree/afebe00c9ab4bf521e0132a9f44bacd230e6fab8), [vivim-final-program](https://github.com/owenservera/vivim-final-program/tree/4a5eb8488d4d2fe21a2ca6c2a467cbdb153f18a8); root trees are not identical.
- `vivim-pwa/src/App.tsx` and `vivim-app/pwa/src/App.tsx` share Git blob `0d9eb75f3f8e6fa61b1c63703fbd4cdad3d9a021`; the entire `src/` directory trees were **not** equal, so do not conclude the apps are full copies.
- Separate `vivim-github-frontend` repository default `main` branch returned 404. Metadata accessibility ≠ source revision accessibility.

## 6. Security and visibility

`vivim-platform` is a private repository readable via authenticated GitHub connection. These pinned links may not open anonymously. Do not publish private code or captured native conversations to public AION. Only paths, non-sensitive contract descriptions, source checks and hashes are included here. Repo MIT license file inspected for Final and Platform; dependency/artwork licenses unverified. Never reuse historical Playwright/Puppeteer tests in this project.

## 6a. Post-audit source refresh and actual Git comparisons

**Newer Harness checkpoint:** [`c2ca3d70d3e25b4adf4b904bf93773742ae475fd`](https://github.com/owenservera/vivim-harness/tree/c2ca3d70d3e25b4adf4b904bf93773742ae475fd), **28 commits ahead** of archaeology base `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51`, with no changed `src/studio/ui/*` or World service/search/transfer/relations files in the compare response. [Git compare](https://github.com/owenservera/vivim-harness/compare/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51...c2ca3d70d3e25b4adf4b904bf93773742ae475fd). New backend/runtime sources directly inspected:

- [`src/chrome/browser-ownership.mjs`](https://github.com/owenservera/vivim-harness/blob/c2ca3d70d3e25b4adf4b904bf93773742ae475fd/src/chrome/browser-ownership.mjs): `browserIdentity`, `checkBrowserOwner`, `verifyBrowserOwner`, `recordBrowserOwner`; validates expected dedicated profile + DevTools browser identity, fails closed, no OS-level security claim.
- [`src/recipes/catalog.mjs`](https://github.com/owenservera/vivim-harness/blob/c2ca3d70d3e25b4adf4b904bf93773742ae475fd/src/recipes/catalog.mjs): declares bounded recipe families, effects, native-tool mappings and prerequisites, not live capability proof.
- [`src/recipes/service.mjs`](https://github.com/owenservera/vivim-harness/blob/c2ca3d70d3e25b4adf4b904bf93773742ae475fd/src/recipes/service.mjs): delegates to existing conversation runtime and harness run store, checks explicit effect authorization and original-operation duplicate fence; no second controller.
- [`src/recipes/choose.mjs`](https://github.com/owenservera/vivim-harness/blob/c2ca3d70d3e25b4adf4b904bf93773742ae475fd/src/recipes/choose.mjs): deterministic vocabulary suggestion; `authorized:false`, `executed:false`.
- [`src/studio/recipe-routes.mjs`](https://github.com/owenservera/vivim-harness/blob/c2ca3d70d3e25b4adf4b904bf93773742ae475fd/src/studio/recipe-routes.mjs): GET capability/list/choose/schema/status; POST plan/run/reconcile/finish on existing hub. Read-only listing is not a new user-facing World UI.
- [`test/unit/recipe-service.test.mjs`](https://github.com/owenservera/vivim-harness/blob/c2ca3d70d3e25b4adf4b904bf93773742ae475fd/test/unit/recipe-service.test.mjs): synthetic Node test source for duplicate-operation/authorization/reconciliation; **source inspected, not executed**.
- [`docs/architecture/AGENT-RECIPE-RUNTIME-V1.md`](https://github.com/owenservera/vivim-harness/blob/c2ca3d70d3e25b4adf4b904bf93773742ae475fd/docs/architecture/AGENT-RECIPE-RUNTIME-V1.md): declared CLI and HTTP recipe contract; document claims implementation, this archaeology did not run it.
- [`docs/product/FIRST-USER-ONBOARDING-DECISIONS-2026-10-27.md`](https://github.com/owenservera/vivim-harness/blob/c2ca3d70d3e25b4adf4b904bf93773742ae475fd/docs/product/FIRST-USER-ONBOARDING-DECISIONS-2026-10-27.md): additional open TODOs in section 3 on visibility, active browsers, provider memory and workbench logs. The 15 decision rows D1–D15 remain binding per owner, TODOs not automatically authorized as implementations.

**Git tree recheck:** `vivim-final` [root tree](https://api.github.com/repos/owenservera/vivim-final/git/trees/8a798f91d52574cb3d7db579da516bc1c4aee7b7), `vivim-final-enhanced` [root tree](https://api.github.com/repos/owenservera/vivim-final-enhanced/git/trees/afebe00c9ab4bf521e0132a9f44bacd230e6fab8), `vivim-final-program` [root tree](https://api.github.com/repos/owenservera/vivim-final-program/git/trees/4a5eb8488d4d2fe21a2ca6c2a467cbdb153f18a8) all return identical `frontend` tree SHA `f5f8a2de1048112c77ade2f35ea6931800441c30`. This is exact frontend content equality at the pinned snapshots, not whole-repo equality. All execution and live/browser claims remain **NOT VERIFIED**.

## 7. Session limits

GitHub default branch metadata refreshed on 2026-10-27. No git clone/worktree, platform process, browser, test-run proof, deployment screenshot, local project folder edits, or live provider operations were performed. AION research documents do not imply the user's Windows local-master checkout automatically advanced.
