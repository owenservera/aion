# UI component recovery matrix — source level

> **VIVIM World source archaeology — 2026-10-27.** Remote GitHub source audit, not a local or browser acceptance. Canonical Harness HEAD inspected: `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51`; AION baseline: `53b8e7063d37787d9cb10ba6681bc2c45b6c4055`. Evidence tags: **CODE VERIFIED** = read code; **TEST SOURCE VERIFIED** = read test, not executed; **HISTORICAL RECEIPT** = prior run report; **NOT VERIFIED** = live/browser behavior, current OS acceptance, or missing evidence.

## Candidate index (32 entries)

| # | Feature | Origin | Class | Effort | Confidence |
|---|---|---|---|---|---|
| 1 | Harness chat shell | `vivim-harness` | **A** | S | High |
| 2 | Harness World views | `vivim-harness` | **A** | S | High |
| 3 | Harness World service | `vivim-harness` | **A** | S | High |
| 4 | Harness Find/index | `vivim-harness` | **A** | S | High |
| 5 | Harness transfer | `vivim-harness` | **A** | S | High |
| 6 | Harness rich DOM renderer | `vivim-harness` | **A** | S | High |
| 7 | Harness U1 integration | `vivim-harness` | **A** | S | Medium |
| 8 | Guided first-run experience | `vivim-final` | **C** | M | High |
| 9 | Legacy setup browser actor | `vivim-final` | **E** | S | High |
| 10 | Final CanvasApp home | `vivim-final` | **D** | L | High |
| 11 | Final command palette | `vivim-final` | **D** | S/M | High |
| 12 | Final menu/tabs | `vivim-final` | **D** | S | High |
| 13 | Final surface tabs | `vivim-final` | **D** | S | High |
| 14 | Final LivingCanvas | `vivim-final` | **D** | L | High |
| 15 | Final StorageSettings | `vivim-final` | **D** | L | High |
| 16 | Final content-part schema | `vivim-final` | **C** | M | High |
| 17 | Platform rich renderer | `vivim-platform` | **C** | M/L | High |
| 18 | Platform AST compiler | `vivim-platform` | **C** | M | High |
| 19 | Platform library | `vivim-platform` | **C** | S/M | High |
| 20 | Platform edge chat | `vivim-platform` | **D** | M | High |
| 21 | Platform HomeAssistant | `vivim-platform` | **D** | L | High |
| 22 | Platform ImportPage | `vivim-platform` | **D** | S/M | High |
| 23 | Platform demo graph | `vivim-platform` | **D** | M | High |
| 24 | Platform edge AppLayout | `vivim-platform` | **D** | M | High |
| 25 | Platform export panel | `vivim-platform` | **D** | S | Medium |
| 26 | Original Solid playspace | `vivim` | **D** | L | High |
| 27 | Original Solid control center | `vivim` | **D** | M | High |
| 28 | Old PWA app shell | `vivim-pwa` | **D** | M | High |
| 29 | Marketing home | `vivim-live` | **E** | S | High |
| 30 | OpenScroll PWA starter | `vivim-scroll` | **E** | S | High |
| 31 | Final enhanced/program frontends | `vivim-final-enhanced` | **E** | S | High |
| 32 | GitHub frontend empty branch | `vivim-app` | **F** | M | Low |

## Full compatibility records

### 1. Harness chat shell — A
- **Repository/revision/source/export:** `owenservera/vivim-harness`, `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51` (main); [vivim-harness/src/studio/ui/chat.html](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/chat.html); `static HTML+chat.mjs entry; shellModes`.
- **Entrypoint:** Mounted /chat. **Implementation:** One primary shell; no new frontend.
- **Dependencies:** ESM/CSS browser. **Data/API:** /chat same-origin; /ui/chat.mjs.
- **Harness equivalent / compatibility:** none: retain baseline.
- **Tests and evidence:** test/unit/world-ui.test.mjs and studio-ui-route-contract; test source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** A; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** existing first-user shell; reuse, do not copy.

### 2. Harness World views — A
- **Repository/revision/source/export:** `owenservera/vivim-harness`, `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51` (main); [vivim-harness/src/studio/ui/world-view.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/world-view.mjs); `mountWorldView`.
- **Entrypoint:** dynamic imported by chat.mjs. **Implementation:** Existing World peer views.
- **Dependencies:** plain DOM+ESM. **Data/API:** /api/v1/world/{conversations,projects,notes,search,map,transfer}.
- **Harness equivalent / compatibility:** none; authoritative current client.
- **Tests and evidence:** world-ui.test, world-ui-find, world-ui-relations, world-ui-workspace; not run; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** A; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** keep existing module; enhance only needed gaps.

### 3. Harness World service — A
- **Repository/revision/source/export:** `owenservera/vivim-harness`, `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51` (main); [vivim-harness/src/studio/world-service.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-service.mjs); `createWorldService/registerWorldRoutes`.
- **Entrypoint:** mounted via integration hub. **Implementation:** Projects/notes and saved evidence.
- **Dependencies:** Node VersionedStore. **Data/API:** session DOM_TURNS projections; project/note CAS; read-only custody.
- **Harness equivalent / compatibility:** none; authoritative current backend.
- **Tests and evidence:** world-service, world-journeys; test sources only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** A; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** never transplant donor database.

### 4. Harness Find/index — A
- **Repository/revision/source/export:** `owenservera/vivim-harness`, `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51` (main); [vivim-harness/src/studio/world-search.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-search.mjs); `createWorldSearch/registerWorldSearchRoutes`.
- **Entrypoint:** route registered from World service. **Implementation:** Search with exact source link.
- **Dependencies:** Node CorpusSearchIndex. **Data/API:** GET /api/v1/world/search, local bounded transient index.
- **Harness equivalent / compatibility:** none; retain availability qualifiers.
- **Tests and evidence:** world-search, world-ui-find, world-r456-search-http-ui; not run; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** A; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** reuse index, no remote search.

### 5. Harness transfer — A
- **Repository/revision/source/export:** `owenservera/vivim-harness`, `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51` (main); [vivim-harness/src/studio/world-transfer.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-transfer.mjs); `createWorldTransfer/registerWorldTransferRoutes`.
- **Entrypoint:** route registered from World service. **Implementation:** Safe scoped import/export.
- **Dependencies:** Node hash/validation, VersionedStore. **Data/API:** POST world/transfer/{export,validate,restore} JSON bundle.
- **Harness equivalent / compatibility:** none; retain scoped mode and explicit confirmation.
- **Tests and evidence:** world-transfer, world-import-content, world-restore, world-ui-export-modes; not run; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** A; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** keep importer.

### 6. Harness rich DOM renderer — A
- **Repository/revision/source/export:** `owenservera/vivim-harness`, `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51` (main); [vivim-harness/src/studio/ui/chat.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/chat.mjs); `parseRich/createRichRenderer`.
- **Entrypoint:** mounted chat/live and passed into World. **Implementation:** Tables/code/artifacts already work in source.
- **Dependencies:** DOM nodes, no framework. **Data/API:** string Markdown; link/citation extraction; source labels.
- **Harness equivalent / compatibility:** optional math/diagram extension only.
- **Tests and evidence:** studio-ui + world-ui tests; not run; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** A; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** avoid another renderer.

### 7. Harness U1 integration — A
- **Repository/revision/source/export:** `owenservera/vivim-harness`, `1a9de9967f5e0b622f75f7d726ba6a356b8a9c51` (main); [vivim-harness/src/studio/ui/universal-chat.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/universal-chat.mjs); `mountUniversalChat`.
- **Entrypoint:** dynamic import under chat details. **Implementation:** existing advanced intelligence surface.
- **Dependencies:** plain ESM/DOM. **Data/API:** read-only snapshot/tab/read callbacks.
- **Harness equivalent / compatibility:** no authority conflict, separate diagnostic panel.
- **Tests and evidence:** studio-integration-ui/studio-components-ui; not run; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** A; **Effort:** S; **Confidence:** Medium.
- **Concrete reuse/rejection:** do not create second panel.

### 8. Guided first-run experience — C
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/frontend/src/features/guided-landing.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/features/guided-landing.tsx); `GuidedLanding/checkNeedsSetup`.
- **Entrypoint:** called from Final page.tsx; not Harness. **Implementation:** clear provider choice and user-login status.
- **Dependencies:** React/Next, UnifiedIO. **Data/API:** /api/setup/profiles, launch-visible, verify, complete, kill; /api/conversations.
- **Harness equivalent / compatibility:** replace entire contract with Harness connection/status, no default account slug.
- **Tests and evidence:** tests/e2e/setup-wizard.test.ts is HTTP smoke only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** C; **Effort:** M; **Confidence:** High.
- **Concrete reuse/rejection:** adapt states, reject browser actor.

### 9. Legacy setup browser actor — E
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/frontend/src/features/guided-landing.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/features/guided-landing.tsx); `runOnboardingFlow`.
- **Entrypoint:** mounted in Final only. **Implementation:** none; safety rejection.
- **Dependencies:** Next/Chrome process coordination. **Data/API:** accountSlug default, debugPort, 3s polling, /api/setup/kill.
- **Harness equivalent / compatibility:** incompatible singular CDP effect owner and multiaccount.
- **Tests and evidence:** no live browser result; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** E; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** do not import.

### 10. Final CanvasApp home — D
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/frontend/src/app/page.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/app/page.tsx); `Home/CanvasApp`.
- **Entrypoint:** Next route /. **Implementation:** VIVIM-branded compositional cues.
- **Dependencies:** React LiveConfig/SessionState, useIO. **Data/API:** /api/interpret, /api/conversations, hardcoded demo/global context.
- **Harness equivalent / compatibility:** current /chat is actual shell; do not transplant page.
- **Tests and evidence:** page source only; no live test; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** L; **Confidence:** High.
- **Concrete reuse/rejection:** reuse patterns only.

### 11. Final command palette — D
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/frontend/src/components/canvas/CommandPalette.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/canvas/CommandPalette.tsx); `CommandPalette`.
- **Entrypoint:** imported by Final page.tsx. **Implementation:** Ctrl+K Find and focus.
- **Dependencies:** React/useFocusTrap/UnifiedIO. **Data/API:** /api/search and dispatchBehavior; history storage.
- **Harness equivalent / compatibility:** current /world/search is read-only bounded and differently typed.
- **Tests and evidence:** component source; no compatible Harness tests; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** S/M; **Confidence:** High.
- **Concrete reuse/rejection:** adapt no effect dispatch.

### 12. Final menu/tabs — D
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/frontend/src/components/canvas/MainMenu.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/canvas/MainMenu.tsx); `MainMenu`.
- **Entrypoint:** Final page imports. **Implementation:** streamlined advanced nav.
- **Dependencies:** React, icons. **Data/API:** UI callback navigation.
- **Harness equivalent / compatibility:** existing shellModes nav, no need parallel routes.
- **Tests and evidence:** component source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** use native buttons.

### 13. Final surface tabs — D
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/frontend/src/components/chat/SurfaceTabs.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/chat/SurfaceTabs.tsx); `SurfaceTabs`.
- **Entrypoint:** used in Final surface composition. **Implementation:** Ctrl+Tab keyboard pattern.
- **Dependencies:** React. **Data/API:** surface slug props and callbacks.
- **Harness equivalent / compatibility:** current shellModes covers navigation.
- **Tests and evidence:** component source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** do not port React tab controller.

### 14. Final LivingCanvas — D
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/frontend/src/components/canvas/LivingCanvas.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/canvas/LivingCanvas.tsx); `LivingCanvas`.
- **Entrypoint:** used by Final CanvasApp. **Implementation:** zoom/focus/selection patterns.
- **Dependencies:** React, quadtree, bus, slot hooks. **Data/API:** route context/layout plan and agent commands.
- **Harness equivalent / compatibility:** no analogous typed Canvas persistence in Harness.
- **Tests and evidence:** component source; no end-to-end; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** L; **Confidence:** High.
- **Concrete reuse/rejection:** defer Canvas runtime.

### 15. Final StorageSettings — D
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/frontend/src/components/canvas/StorageSettings.tsx](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/canvas/StorageSettings.tsx); `StorageSettings`.
- **Entrypoint:** Final panel, not Harness. **Implementation:** location/progress/rollback affordances.
- **Dependencies:** React/API fetch. **Data/API:** /api/storage/status, progress, move, rollback, cleanup.
- **Harness equivalent / compatibility:** Workspace root migration owner-parked; endpoints not established.
- **Tests and evidence:** component source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** L; **Confidence:** High.
- **Concrete reuse/rejection:** UI pattern after Core contract.

### 16. Final content-part schema — C
- **Repository/revision/source/export:** `owenservera/vivim-final`, `8a798f91d52574cb3d7db579da516bc1c4aee7b7` (master); [vivim-final/src/schema/streaming.ts](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/schema/streaming.ts); `ContentPartSchema/migrateLegacyBlock`.
- **Entrypoint:** backend schema export; not rendered by Harness. **Implementation:** typed part vocabulary.
- **Dependencies:** Zod TypeScript. **Data/API:** text/reasoning/code/file/tool-call/tool-result/source/custom/error/meta/step-start parts.
- **Harness equivalent / compatibility:** Harness native DOM_TURNS shapes differ; map only observed types.
- **Tests and evidence:** schema source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** C; **Effort:** M; **Confidence:** High.
- **Concrete reuse/rejection:** do not rewrite original evidence.

### 17. Platform rich renderer — C
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/edge-pwa/frontend/src/components/ContentRenderer.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/ContentRenderer.tsx); `ContentRenderer/ASTNodeRenderer`.
- **Entrypoint:** imported by Platform ChatView/LibraryView. **Implementation:** math/diagram/highlight candidates.
- **Dependencies:** React, DOMPurify, Shiki, KaTeX, Mermaid. **Data/API:** text string or AST[]; NOT raw saved provider part contract.
- **Harness equivalent / compatibility:** existing Harness DOM renderer and source indices; HTML-injection risk.
- **Tests and evidence:** ContentRenderer.test.tsx has shallow Vitest cases; not run; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** C; **Effort:** M/L; **Confidence:** High.
- **Concrete reuse/rejection:** never port direct HTML sinks.

### 18. Platform AST compiler — C
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/edge-pwa/frontend/src/observatory/ast-compiler.ts](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/observatory/ast-compiler.ts); `compileMessageToAST`.
- **Entrypoint:** called by ContentRenderer. **Implementation:** structured handling of advanced syntax.
- **Dependencies:** TS Markdown parsing. **Data/API:** string→AST typed blocks.
- **Harness equivalent / compatibility:** needs lossless saved-block adapter; native provider type not inferred.
- **Tests and evidence:** parser-fidelity-chatgpt-test/claude-test exist; not run; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** C; **Effort:** M; **Confidence:** High.
- **Concrete reuse/rejection:** adapt narrow algorithms only.

### 19. Platform library — C
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/edge-pwa/frontend/src/components/LibraryView.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/LibraryView.tsx); `LibraryView`.
- **Entrypoint:** routed in Platform edge App. **Implementation:** sorting/filter/preview.
- **Dependencies:** React appStore/libraryStore. **Data/API:** API conversation list and local preference keys.
- **Harness equivalent / compatibility:** World custody/availability/source must remain authoritative.
- **Tests and evidence:** component source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** C; **Effort:** S/M; **Confidence:** High.
- **Concrete reuse/rejection:** native list improvements only.

### 20. Platform edge chat — D
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/edge-pwa/frontend/src/components/ChatView.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/ChatView.tsx); `ChatView`.
- **Entrypoint:** Platform edge app composition. **Implementation:** provider chips and contextual composer.
- **Dependencies:** React Zustand api/composer/model switch. **Data/API:** Platform api sends/provider contract.
- **Harness equivalent / compatibility:** duplicates Harness composer and effects; can only reuse visual detail.
- **Tests and evidence:** ChatView.test.tsx present; not executed; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** M; **Confidence:** High.
- **Concrete reuse/rejection:** do not port sender.

### 21. Platform HomeAssistant — D
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/pwa/src/pages/HomeAssistant.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/pages/HomeAssistant.tsx); `HomeAssistant`.
- **Entrypoint:** PWA page. **Implementation:** navigation/preview patterns.
- **Dependencies:** React assistant-ui tool-ui virtualizer unifiedRepository dataSync. **Data/API:** /api/v1 plus API override and independent repository.
- **Harness equivalent / compatibility:** duplicates provider interface and authority.
- **Tests and evidence:** source only; no Harness contract tests; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** L; **Confidence:** High.
- **Concrete reuse/rejection:** no independent datastore.

### 22. Platform ImportPage — D
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/pwa/src/pages/Import.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/pages/Import.tsx); `ImportPage`.
- **Entrypoint:** PWA route. **Implementation:** progress/preview/error language.
- **Dependencies:** React, framer-motion, csrfAwareFetch. **Data/API:** /api/v1/import/{scan,start} job API.
- **Harness equivalent / compatibility:** incompatible with Harness world transfer validate/restore.
- **Tests and evidence:** source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** S/M; **Confidence:** High.
- **Concrete reuse/rejection:** reject API module.

### 23. Platform demo graph — D
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/pwa/src/components/demo/knowledge-graph.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/components/demo/knowledge-graph.tsx); `KnowledgeGraph/generateMockGraphData`.
- **Entrypoint:** demo component; not verified in real production route. **Implementation:** pan/zoom graph look.
- **Dependencies:** React Framer + Canvas. **Data/API:** mock graph generator / GraphData.
- **Harness equivalent / compatibility:** no real World map adapter; cannot claim data integration.
- **Tests and evidence:** source explicitly has generateMockGraphData; no live tests; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** M; **Confidence:** High.
- **Concrete reuse/rejection:** never load fake graph.

### 24. Platform edge AppLayout — D
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/edge-pwa/frontend/src/components/AppLayout.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/AppLayout.tsx); `AppLayout`.
- **Entrypoint:** edge application layout. **Implementation:** sidebar+account cues.
- **Dependencies:** React Zustand/Tauri IPC. **Data/API:** route, account/domain stores.
- **Harness equivalent / compatibility:** Harness owns page auth/navigation/world identity.
- **Tests and evidence:** source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** M; **Confidence:** High.
- **Concrete reuse/rejection:** pattern only.

### 25. Platform export panel — D
- **Repository/revision/source/export:** `owenservera/vivim-platform`, `18bf523edb887374770a49db61b08204fdd4f141` (main); [vivim-platform/edge-pwa/frontend/src/components/ExportPanel.tsx](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/ExportPanel.tsx); `ExportPanel`.
- **Entrypoint:** Platform view component. **Implementation:** mode/progress presentation.
- **Dependencies:** React. **Data/API:** onExport json/html/markdown callback.
- **Harness equivalent / compatibility:** Harness only verified JSON World bundle.
- **Tests and evidence:** no tests inspected; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** S; **Confidence:** Medium.
- **Concrete reuse/rejection:** do not promise HTML or Markdown.

### 26. Original Solid playspace — D
- **Repository/revision/source/export:** `owenservera/vivim`, `57227f3fbee4aafd3eed339900442b47ebf07bc3` (main); [vivim/vivim/src/ui/canvas/Playspace.tsx](https://github.com/owenservera/vivim/blob/57227f3fbee4aafd3eed339900442b47ebf07bc3/vivim/src/ui/canvas/Playspace.tsx); `Playspace`.
- **Entrypoint:** imported into original src/index.tsx. **Implementation:** Canvas selection/zoom ideas.
- **Dependencies:** Solid kernel/store, viewport, fileUploadService. **Data/API:** kernel.store.state.workspace.{viewport,nodes}.
- **Harness equivalent / compatibility:** foreign node/authority schema.
- **Tests and evidence:** source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** L; **Confidence:** High.
- **Concrete reuse/rejection:** no runtime transplant.

### 27. Original Solid control center — D
- **Repository/revision/source/export:** `owenservera/vivim`, `57227f3fbee4aafd3eed339900442b47ebf07bc3` (main); [vivim/vivim/src/ui/shell/ControlCenter.tsx](https://github.com/owenservera/vivim/blob/57227f3fbee4aafd3eed339900442b47ebf07bc3/vivim/src/ui/shell/ControlCenter.tsx); `ControlCenter`.
- **Entrypoint:** imported into original Solid app. **Implementation:** organizing settings visual patterns.
- **Dependencies:** Solid kernel, agent settings, WorkspaceManager. **Data/API:** kernel-defined settings, no Harness contract.
- **Harness equivalent / compatibility:** separate app/agent controls.
- **Tests and evidence:** source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** M; **Confidence:** High.
- **Concrete reuse/rejection:** do not port state.

### 28. Old PWA app shell — D
- **Repository/revision/source/export:** `owenservera/vivim-pwa`, `5bd7d9faaab631d0f520c010226dd13b8391dd71` (master); [vivim-pwa/src/App.tsx](https://github.com/owenservera/vivim-pwa/blob/5bd7d9faaab631d0f520c010226dd13b8391dd71/src/App.tsx); `App`.
- **Entrypoint:** mounted React root and AppRouter. **Implementation:** historical navigation only.
- **Dependencies:** React, p2pService, useBackgroundSync. **Data/API:** separate P2P/cloud sync.
- **Harness equivalent / compatibility:** incompatible no-unapproved-sync rule.
- **Tests and evidence:** matching blob with vivim-app/pwa/src/App.tsx; test not run; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** D; **Effort:** M; **Confidence:** High.
- **Concrete reuse/rejection:** do not import sync.

### 29. Marketing home — E
- **Repository/revision/source/export:** `owenservera/vivim-live`, `7d95a64caa576e4c4f4096f8a2ed9cb244e6b4b6` (master); [vivim-live/src/app/page.tsx](https://github.com/owenservera/vivim-live/blob/7d95a64caa576e4c4f4096f8a2ed9cb244e6b4b6/src/app/page.tsx); `Home`.
- **Entrypoint:** Next landing route. **Implementation:** branding reference, not reusable runtime.
- **Dependencies:** React Next/framer. **Data/API:** static marketing/DEMO content.
- **Harness equivalent / compatibility:** not personal local World app.
- **Tests and evidence:** source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** E; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** exclude from UI implementation.

### 30. OpenScroll PWA starter — E
- **Repository/revision/source/export:** `owenservera/vivim-scroll`, `10e3c27c5bd4adf5c1df85549e95d3b4901a55e9` (main); [vivim-scroll/openscroll-pwa/src/App.tsx](https://github.com/owenservera/vivim-scroll/blob/10e3c27c5bd4adf5c1df85549e95d3b4901a55e9/openscroll-pwa/src/App.tsx); `App`.
- **Entrypoint:** Vite root. **Implementation:** none.
- **Dependencies:** React/Vite example counter. **Data/API:** no VIVIM runtime API.
- **Harness equivalent / compatibility:** template not genuine product UX.
- **Tests and evidence:** source only; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** E; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** exclude.

### 31. Final enhanced/program frontends — E
- **Repository/revision/source/export:** `owenservera/vivim-final-enhanced`, `afebe00c9ab4bf521e0132a9f44bacd230e6fab8` (master); [vivim-final-enhanced/frontend](https://github.com/owenservera/vivim-final-enhanced/tree/afebe00c9ab4bf521e0132a9f44bacd230e6fab8/frontend); `tree f5f8a2de1048112c77ade2f35ea6931800441c30`.
- **Entrypoint:** identical frontend tree to Final/program. **Implementation:** deduplicate source archaeology.
- **Dependencies:** Next/React. **Data/API:** same entirety of frontend subtree.
- **Harness equivalent / compatibility:** not a unique UI donor; repo roots differ.
- **Tests and evidence:** Git tree hashes verified; no runtime test; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** E; **Effort:** S; **Confidence:** High.
- **Concrete reuse/rejection:** do not repeat audits.

### 32. GitHub frontend empty branch — F
- **Repository/revision/source/export:** `owenservera/vivim-app`, `3e59dfbba1ea96fd09be3a12362bd9b279dab305` (main); [vivim-app/github-frontend/src](https://github.com/owenservera/vivim-app/blob/3e59dfbba1ea96fd09be3a12362bd9b279dab305/github-frontend/src); `unverified candidate`.
- **Entrypoint:** nested app frontend exists; standalone vivim-github-frontend has branch 404. **Implementation:** possible future donor only.
- **Dependencies:** Next source unknown. **Data/API:** unverified actual UI.
- **Harness equivalent / compatibility:** not inspected to component depth.
- **Tests and evidence:** NOT VERIFIED; **CODE VERIFIED** for inspected source, **NOT VERIFIED** live experience. **Class:** F; **Effort:** M; **Confidence:** Low.
- **Concrete reuse/rejection:** no import without evidence.


## Matrix interpretation and quality rules

- Classification **A** implemented in Harness, **B** directly reusable, **C** adapted code/behavior, **D** pattern only, **E** reject/superseded/duplicate, **F** unverified. A candidate's class does not describe a whole repository.
- **Entrypoint** is source traced or explicitly marked unverified. No donor runtime/browser was executed. All listed tests are **TEST SOURCE VERIFIED**, not TEST EXECUTION VERIFIED, unless labeled otherwise.
- `S/M/L` is only relative complexity (no fabricated elapsed times). The Harness itself is pinned to main at audit; new code from concurrent development must be rechecked before implementation.
- Repositories `vivim-final`, `vivim-final-enhanced`, `vivim-final-program` have **identical Git frontend tree SHA** `f5f8a2de1048112c77ade2f35ea6931800441c30`; their *other* paths vary. `vivim-pwa/src/App.tsx` and `vivim-app/pwa/src/App.tsx` share blob `0d9eb75f3f8e6fa61b1c63703fbd4cdad3d9a021`; this proves only that file is identical, not the entire apps.
- **Harness API:** `/api/v1/world` prefix in `world-view.mjs`; `world-service` registers `/world/*` under the hub. The chat route/DOM mount is [vivim-harness/src/studio/ui/chat.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/ui/chat.mjs#L1878-L1906) and service route list is [vivim-harness/src/studio/world-service.mjs](https://github.com/owenservera/vivim-harness/blob/1a9de9967f5e0b622f75f7d726ba6a356b8a9c51/src/studio/world-service.mjs#L169-L195).
