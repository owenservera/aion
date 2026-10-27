# VIVIM World UI Archaeology — Recon Context and Recovery Mission
**Date:** 2026-10-27
**Owner:** AION UI / Client Integration agent (`workspace/aion/ops/capture-studio-ui/`)
**Product-decision counterpart:** Agent 15, `workspace/aion/sessions/roles/15-product-to-market/`
**Status:** SOURCE RECON ONLY; full audit, test execution, runtime acceptance, and migration NOT completed.
**Canonical implementation:** `owenservera/vivim-harness`. This file is an AION research/agent handoff, not a new implementation.

## 0. How to resume
Read AION root [AGENTS.md](https://github.com/owenservera/aion/blob/main/AGENTS.md), [REPOSITORY-GOVERNANCE.md](https://github.com/owenservera/aion/blob/main/REPOSITORY-GOVERNANCE.md), this lane's `README.md` / `LAUNCH.md` / `CONTINUOUS-QUEUE.md`, Agent 15's `BOOTSTRAP.md`, and current Harness `ARCHITECTURE.md`. Refresh each repository's current HEAD before further work; SHAs below are snapshots from recon on 2026-10-27, not immutable claims about future main. Read relevant agent-to-agent UI handoffs under `workspace/aion/ops/capture-studio-ui/handoffs/`, especially `parallel-2026-10-24/HANDOFF.md`, and Agent 14's `integration-campaigns/parallel-four-lane-2026-10-24/02-UI.md`. These can be historical, not necessarily migrated to Harness.

**Immediate objective:** source-level archaeology of existing VIVIM user-interface generations and a practical recovery matrix for the integrated VIVIM World application. Find code actually mounted, API assumptions, native rich content fidelity, tests and the smallest safe reuse candidates. Do **not** produce speculative redesigns, duplicate backends, duplicate storage, or alternate browser controllers. Do not delegate to the owner's local agent. Read-only until a separately directed implementation turn.

## 1. Owner's full mission / acceptance definition
Investigate `vivim-harness`, `vivim-final`, `vivim-platform`, `aion`, plus `vivim-app`, `vivim-live`, `edge-pwa`, `vivim-omega-os`, `VOMEGA`, `vivim-sdk`, OpenScroll/Vita/canvas and discovered original VIVIM repos. Inventory app shells, navigation, home, first launch, user-selected personal workspace, Chrome worlds, provider/account connection, rich conversation messages, identity and history, projects/notes/saved, knowledge/search, graph/canvas, artifacts, provenance, export/share/import, settings, mobile/desktop and design tokens.

Every final matrix entry must include exact repo/path, branch and inspected commit SHA, exported component/function, actual implementation behavior, dependencies/tooling, API/data contract, tests/evidence, entrypoint connectivity, runtime/working-vs-prototype assessment, existing Harness equivalent, reuse class A–F, effort S/M/L, confidence, and direct commit-pinned link. Distinguish CODE VERIFIED, TEST VERIFIED, HISTORICAL RECEIPT and NOT VERIFIED. Never equate source existence with browser acceptance.

Classification: A=already in Harness (no duplication); B=direct reuse; C=reuse with modification; D=pattern only; E=reject/obsolete; F=unverified. Crosswalk intended experience: first launch, Home, world selection, provider/account, native conversation, personal workspace, projects/notes, saved conversations, find, knowledge/relations, Canvas, artifacts, export/share, settings, advanced Capture Studio. Compare (A) evolve current Harness plain JS; (B) selective VIVIM Final React adoption; (C) slim unified frontend over existing Harness APIs. Choose one primary strategy *after* source comparison.

Requested final research package belongs in Product Agent 15 folder (while this document belongs in UI agent folder): `UI-ARCHAEOLOGY-2026-10-27.md`, `UI-COMPONENT-RECOVERY-MATRIX.md`, `VIVIM-WORLD-UX-CROSSWALK.md`, `UI-INTEGRATION-RECOMMENDATION.md`, `SOURCE-REFERENCES.md`. The full audit and these five documents are **not** yet completed. Never claim they were pushed.

## 2. Owner decisions that constrain all recovery
Authoritative decision record: [FIRST-USER-ONBOARDING-DECISIONS-2026-10-27.md](https://github.com/owenservera/vivim-harness/blob/main/docs/product/FIRST-USER-ONBOARDING-DECISIONS-2026-10-27.md), authored against a historical baseline `269791f6dd663403bcf3b19ceeceb5174097d6d7`; distinguish the record's baseline from current HEAD.
- D1 Windows-only verification for that onboarding session; permanent Windows+Linux portability still governed by `docs/PORTABILITY.md`.
- D2 user's personal data workspace is chosen at onboarding, distinct from source checkout; no user-selected directory UI established yet. `CAPTURE_STUDIO_HOME` / `defaultDataDir()` are mechanisms, not approval of a default user path.
- D3 workspace is a core object, but scaffold, ownership, migration, backups, lifecycle and world boundaries are PARKED.
- D4 dedicated VIVIM Chrome profile is a **world**, isolated by default; inter-world sharing explicit.
- D5 browser/profile separation is NOT an OS-level security boundary.
- D6 `.dev` is internal diagnostic workbench, not mandatory user onboarding or second authoritative store; do not log secrets.
- D7 no duplicate authoritative stores, passwords/cookies/tokens/OTPs in Git or logs. Saved-message exports may contain secrets; never promise automatic redaction.
- D8 reliably *observed* provider account email should be mapped automatically without confirmation; never infer/mark unknown as verified.
- D9 multiple accounts per provider required; same-world co-existence, switching and account/browser mapping remain MAJOR PARKED design.
- D10 user signs in personally; no credential collection.
- D11 provider conversation discovery is partial; explicit selection is mandatory and is NOT permission to import all history or send.
- D12 local/remote sync configuration PARKED. Only specifically tested pilot conversations need manual/explicit updating; do not invent background polling.
- D13 selected minimal onboarding through existing app, no second application/browser actor/storage.
- D14 first-user pilot: fresh ChatGPT conversation with 3 context-dependent turns: fictional Harbor project (local-first + JSON export), rename Cedar and add offline mode without restating prior requirements, then recall name + three requirements. Three genuinely fresh native-thread replies saved/reopened and verified.
- D15 selection is not effect authorization; explicit permission separately before send, no automatic resend on uncertainty.

Read [V1 integrated blueprint](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-INTEGRATED-APP-BLUEPRINT.md), [ARCHITECTURE.md](https://github.com/owenservera/vivim-harness/blob/main/ARCHITECTURE.md), [V1-ZAI-REPOSITORY-ACCESS-2026-10-25.md](https://github.com/owenservera/vivim-harness/blob/main/docs/product/V1-ZAI-REPOSITORY-ACCESS-2026-10-25.md) before implementing. Blueprint is a **proposed target**, not implemented or owner-approved in every detail. Keep user-selected personal workspace, dedicated Chrome **world/profile**, and in-app project/workspace **view** distinct.

## 3. GitHub repository recon snapshot
GitHub latest-commit search returned these **candidate default-branch HEADs** on 2026-10-27; rerun before source audit:
| Repo | Default branch from metadata | Snapshot SHA |
|---|---|---|
| owenservera/vivim-harness | main | `4ceeecd5b7f57074d8b9b7f29204fcad35c1f4d8` |
| owenservera/vivim-final | master | `8a798f91d52574cb3d7db579da516bc1c4aee7b7` |
| owenservera/vivim-final-enhanced | master | `afebe00c9ab4bf521e0132a9f44bacd230e6fab8` |
| owenservera/vivim-final-program | master | `4a5eb8488d4d2fe21a2ca6c2a467cbdb153f18a8` |
| owenservera/vivim-platform | main | `18bf523edb887374770a49db61b08204fdd4f141` |
| owenservera/vivim | main | `57227f3fbee4aafd3eed339900442b47ebf07bc3` |
| owenservera/vivim-app | main (archived) | `3e59dfbba1ea96fd09be3a12362bd9b279dab305` |
| owenservera/vivim-live | master | `7d95a64caa576e4c4f4096f8a2ed9cb244e6b4b6` |
| owenservera/vivim-omega-os | main | `67e3eaf8e0f0a013694d24903480905ffce21976` |
| owenservera/VOMEGA | main | `12c853259f60cf3a883c7fb1c9f329d696606d64` |
| owenservera/vivim-sdk | master | `6450c6caf1f0b5413477f2d87d4cfd5dac462a63` |
| owenservera/vivim-pwa | master | `5bd7d9faaab631d0f520c010226dd13b8391dd71` |

GitHub name search returned 80+ VIVIM-named repos, including `vivim-github-frontend`, `vivim-final-enhanced`, `vivim-final-program`, `vivim-scroll`, `infinite-canvas-vivim`, `assistant-ui-VIVIM`, `tool-ui-VIVIM`; names alone are not original code proof. Enhanced and Program have a README matching older Final, but `frontend/src/app/page.tsx` and `frontend/src/features/guided-landing.tsx` were NOT FOUND at those paths; don't call these proven forks/successors or assume no other UI exists. `vivim-platform` root README absent, but its nested PWA and edge-PWA code is accessible. `vivim-live` README identifies a Next.js/Tailwind/Framer landing/marketing app; actual screens not yet inspected. `vivim-app` is archived and README describes PWA/Bun server/SDK/network; inspect source before reuse.

## 4. Current Harness baseline — code inspected
- [`src/studio/ui/chat.html`](https://github.com/owenservera/vivim-harness/blob/4ceeecd5b7f57074d8b9b7f29204fcad35c1f4d8/src/studio/ui/chat.html): actual `<script type="module" src="/ui/chat.mjs">`, `shellModes` navigation and world/chat roots, Capture Studio title, Segoe/Cascadia style tokens, light/dark CSS, focus and ≥44px touch-control CSS.
- [`src/studio/ui/chat.mjs`](https://github.com/owenservera/vivim-harness/blob/4ceeecd5b7f57074d8b9b7f29204fcad35c1f4d8/src/studio/ui/chat.mjs#L1887-L1895): dynamic `import('./world-view.mjs')` when browser context, verifies `worldShell`, `shellModes`, `chatApp`, invokes `mod.mountWorldView(...)`. Source-level **mounted** in entrypoint. ~131 KB file. Uses same-origin `/api/v1`, cookie auth, DOM textContent safety; state labels for conversation/send/reply/capture, reconciliation, uncertain delivery and errors; offline pure helper exports. No browser acceptance observed.
- [`src/studio/ui/world-view.mjs`](https://github.com/owenservera/vivim-harness/blob/4ceeecd5b7f57074d8b9b7f29204fcad35c1f4d8/src/studio/ui/world-view.mjs): `WORLD_API='/api/v1/world'`, VIEWS conversations/projects/notes, FIND_KINDS message/project/note/source-reference/selection, SHELL_VIEWS capture/find/transfer/relations/workspace plus peer views. Handles saved identity, provenance, coverage, rich-part fallbacks, source rows; no Home object or second renderer. Actual route-/data-level acceptance not verified.
- [`src/studio/world-service.mjs`](https://github.com/owenservera/vivim-harness/blob/4ceeecd5b7f57074d8b9b7f29204fcad35c1f4d8/src/studio/world-service.mjs): `createWorldService`, `registerWorldRoutes`; `VersionedStore` rooted at `paths.root/world` for user-owned project/note overlays; messages remain projections from saved session evidence. Imports `world-relations.mjs`, `world-search.mjs`, `world-transfer.mjs`, `world-url.mjs`. Preserve single authority rather than copying historical databases.

Need still inspect `world-view` lower mount/navigation methods, exact routes and tests, `chat.html` mode contents, direct DOM wiring, and import/export contract; current discovery is partial. Class A for existing world/chat infrastructure (NOT proof every journey works).

## 5. Historical donor source verified
| Priority | Repo / commit-pinned file | Actual code observation | Dependency / conflict | Tentative class |
|---|---|---|---|---|
| P0 | [Final `frontend/src/app/page.tsx`](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/app/page.tsx) | `Home` → `LiveConfigProvider` / `SessionStateProvider` → `CanvasApp`; `GuidedLanding` called when `checkNeedsSetup`; `LivingCanvas` inside `DrawerSystem`; command palette, MainMenu, MobileNav, tours | React/Next, specialized providers, hardcoded `ws:global` and `user:demo`; pattern / targeted behavior, not wholesale runtime | D |
| P0 | [Final `frontend/src/features/guided-landing.tsx`](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/features/guided-landing.tsx) | ~39KB; actual onboarding states `booting`, `awaiting_provider_pick`, `launching_chrome`, `awaiting_login`, `completing`, `done`, `error`; typewriter messages, provider chips, self-sign-in pause; `checkNeedsSetup()` | calls `/api/setup/profiles`, `launch-visible`, `verify`, `complete`, `kill`; hardcoded `accountSlug:'default'`; legacy Chrome process ownership, React | C for UI/states; E for browser actor |
| P0 | [Platform `edge-pwa/frontend/src/components/ContentRenderer.tsx`](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/edge-pwa/frontend/src/components/ContentRenderer.tsx) | ~23KB; `ContentRenderer`, AST node renderer, reasoning, LaTex/KaTeX, Mermaid, Shiki code blocks, tables, inline formatting | React, DOMPurify, Shiki, `@/observatory/ast-compiler`; Harness saved-block shapes must be mapped without information loss | C |
| P1 | [Platform `pwa/src/pages/HomeAssistant.tsx`](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/pages/HomeAssistant.tsx) | ~55KB, dashboard conversation UI, virtualized rendering, `assistant-ui`, `tool-ui`, search/recommendation controls | imports independent `conversationService`, `unifiedRepository`, `dataSyncService`, API client; do not import whole page or datastore | D page, C candidate UI fragments |
| P1 | [Platform `pwa/src/pages/Import.tsx`](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/pages/Import.tsx) | ~31KB, `ImportPage`, scan/start/progress/retry UX | `/api/v1/import/scan`, `/api/v1/import/start`, `VIVIM_API_OVERRIDE`, own API/CSRF and import jobs; conflict with Harness transfer semantics | C/D |
| P1 | [Platform `pwa/src/components/demo/knowledge-graph.tsx`](https://github.com/owenservera/vivim-platform/blob/18bf523edb887374770a49db61b08204fdd4f141/pwa/src/components/demo/knowledge-graph.tsx) | `KnowledgeGraph`, force-directed Canvas, pan/zoom/selection, `generateMockGraphData` | Framer Motion, mock investor graph and separate data model; never claim real Harness graph integration | D |
| P2 | [Final `frontend/src/sdk/canvas/define-component.ts`](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/sdk/canvas/define-component.ts) | Zod-based CanvasDefinition validation, default layout, forbids inline script, sandbox settings | TypeScript/Zod and separate canvas schema; adapt rules only after security review | C/D |
| P2 | [Final `frontend/src/sdk/canvas/use-canvas-component.ts`](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/sdk/canvas/use-canvas-component.ts) | React `useSyncExternalStore` subscription to live slot resolver | Depends React and `register-slot`; framework mismatch | C/D |
| P2 | [Final `frontend/src/storage/impl/memory-ui-component-store.ts`](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/storage/impl/memory-ui-component-store.ts) | `MemoryUiComponentStore`, provider+variant → provider → family+variant → family → cross-type → system fallback, skip drafts/deprecated | Alternate storage contract / scope and identity; extract resolution *pattern*, not second authoritative store | D |
| P2 | [Final `frontend/src/components/chat/ChatHeader.tsx`](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/chat/ChatHeader.tsx) | Header button for command palette; presence, notifications, theme via components | `NotificationsCenter userId='user:demo'`, React widgets; identity stub | D |
| P2 | [Final `frontend/src/components/chat/SurfaceContent.tsx`](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/components/chat/SurfaceContent.tsx) | `SurfaceContent` switches between chat, cards, editor, memory and canvas surfaces | React and numerous Canvas/IO/providers dependencies; no Harness contract | C/D |

Additional screen locations **located by search, NOT yet fully inspected**: Final `frontend/src/components/chat/SurfaceTabs.tsx`, `frontend/src/components/canvas/TabBar.tsx`, `frontend/src/components/canvas/BuilderProvider.tsx`; Final `frontend/src/components/Providers.tsx`; historical `frontend/src/components/FullPageError.tsx`.

## 6. Important compatibility blockers and test nuance
- Current Harness `chat.mjs` is plain ESM / same-origin cookie + DOM-safe textContent; legacy Final UI is Next/React and Platform PWA is React/React Router; full dependency/framework transplant is costly.
- Final onboarding posts to legacy setup routes including process control. The [Next setup profiles proxy](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/frontend/src/app/api/setup/profiles/route.ts) uses `CAP_STORE_PORT` default 9420; do not assume current Harness exposes identical routes.
- Final [`tests/e2e/setup-wizard.test.ts`](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/tests/e2e/setup-wizard.test.ts) uses Bun HTTP requests to `/api/setup/profiles`, `/api/providers`, `/api/health/providers`, `/api/capabilities/system_version/execute`, `/api/nlcl/help` — **API smoke tests**, NOT visually exercised GuidedLanding browser acceptance. No tests run during recon.
- Native block completeness, citations, reasoning, tools, media, tables, artifacts, revisions, unknown blocks and original evidence must be compared against Harness saved part contracts before renderer porting. No flattening or synthetic provenance.
- Preserve canonical Harness browser/CDP/effect owner, existing authenticated API and VersionedStore. Never import ChromeGovernor, second browser controller, independent cloud sync/database or credentials.
- No Playwright/Puppeteer. No unauthorized provider sends, browser effects, credentials, private transcripts, or Windows local-host modifications.
- Reuse patterns even when source cannot safely port. Check each donor's licenses and imported third-party component licenses independently; source visibility is not a license grant.

## 7. Product UX crosswalk (recon state only)
| Journey | Existing Harness | Strongest currently discovered donor | Gaps / parked |
|---|---|---|---|
| First launch | Config mechanisms, no verified chooser | Final GuidedLanding | User-selected directory; real integrated setup; workspace scaffold PARKED |
| Home / shell | Chat + embedded peer World views | Final CanvasApp / Platform HomeAssistant | VIVIM branding; coherent primary entry; no replacement authorized |
| Chrome world selection | Dedicated profile conceptual contract | Final provider chips (UI pattern) | Multiworld and multiaccount mapping PARKED |
| Provider connection | Capture Studio attach/connect surface | GuidedLanding presentation | adapt via sole Harness effect owner, human login |
| Native conversation | Existing Chat state/send/capture and saved views | Platform ContentRenderer | rich-part contract and browser acceptance |
| Personal workspace | in-app `workspace` shell view; store roots | Final workspace switch patterns | user-chosen data root ≠ workspace view ≠ Chrome profile |
| Projects and notes | World project/note overlays | Platform cards | inspect existing editing before copying |
| Saved conversations | World `conversations` peer view | Platform HomeAssistant | verify current rendering and indexing |
| Find / knowledge / relations | `find`, `relations` shell views, world search/routes | Platform graph | don't substitute mock graph for real data |
| Canvas | no verified equivalent app Canvas | Final LivingCanvas; Platform demo graph | treat advanced Canvas as optional until data/API alignment |
| Artifacts | saved blocks/transfer semantics exist | Platform rich renderer / card surfaces | validate file/artifact fidelity |
| Export/share | World transfer routes | Platform ImportPage | sync/share policies PARKED; explicit sanitization |
| Settings | existing Capture Studio controls, audit incomplete | Final ThemeSettings | owner-approved workspace/account behavior incomplete |
| Advanced Capture Studio | existing Harness technical studio | historical AION UI work | keep advanced, not default new product shell |

## 8. Provisional integration strategy (NOT final decision)
Prefer **Option A: evolve current Harness plain JS shell**, with focused donor pattern/component adaptation. It has verified mounting and existing data/API authority. Option B (React/Next transplant) adds framework, state/data, API and lifecycle overhead. Option C (new slim frontend) risks duplication absent evidence that Option A cannot deliver. Do not start a redesign or implementation in this research phase.

Ranked opportunities from recon: (1) historical guided onboarding UX, (2) native rich-part rendering, (3) unified canvas/work surface interaction concepts, (4) conversation dashboard/navigation, (5) import progress / knowledge relations visualization. Integration effort is relative S/M/L, never fabricated hours.

## 9. Next narrow recon, then full audit
1. Diff snapshot tree and content hashes of Final / Enhanced / Program; identify precise duplicate branches and any truly different UI code; don't infer from README.
2. Trace `GuidedLanding` full API/state transitions, browser authority, failure/retry and sign-in; map each to Harness public API and October 27 decisions; flag `accountSlug:'default'` as incompatible.
3. Trace Platform `ContentRenderer` + `observatory/ast-compiler` → compare each AST node to Harness saved blocks, `world-view` formatting, unknown-part fallbacks and provenance, with loss/fidelity matrix.
4. Trace Harness `mountWorldView`, buttons, navigation, `chat.html`, world search/transfer/relations routes, tests/fixtures and API response schemas; identify actual gaps not already implemented.
5. Inspect untouched Platform and original VIVIM shells, OpenScroll/Vita/Canvas sources and provider display components, licensing, test coverage and entrypoint imports. Verify Git HEAD again at every new pass.
6. Produce one source-pinned A–F recovery matrix + V1 UX crosswalk in Agent 15's canonical product docs, not another speculative architecture slideshow.
7. Before any changes, compare with current remote and Windows cutover notes; commit only verified AION research docs, no Harness production edits during archaeology.

Potential independent read-only lanes: (I) Harness mounted baseline / tests, (II) Final lineage/onboarding, (III) Platform AST/conversations, (IV) historical Canvas/PWA/desktop. Product Agent 15 consolidates; no automatic agent dispatch or unnecessary parallel agents. Prefer Medium for further recon; High for final integration and evidence adjudication.

## 10. Status / evidence hygiene
**CODE VERIFIED (read directly):** Harness `chat.html`, `chat.mjs`, `world-view.mjs`, `world-service.mjs`; Final entrypoint, onboarding, React canvas SDK/store, chat header/content; Platform rich renderer, HomeAssistant, ImportPage, demo graph; Final HTTP smoke test and setup proxy.
**SEARCH-INDEX ONLY:** other candidate file paths and repo inventory.
**HISTORICAL RECEIPT / DOC ONLY:** former AION UI sprint claims, blueprint and October 27 decisions; never silently promote to current runtime.
**NOT VERIFIED:** visual quality, live onboarding, three real ChatGPT turns, provider-native rich fidelity, complete tests, original VIVIM/Enhanced/Program full source trees, Git lineage/duplication, full ownership of every route, mobile/desktop packaging, exact integration effort, and final archaeology deliverables.

No tests, browsers, local agents, pushes to Harness or code migrations occurred in the 2026-10-27 reconnaissance. Do not misrepresent this handoff as full task completion.
