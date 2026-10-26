# VIVIM Remote Preparation — 02 Native Fidelity Recovery / BUILD–ADAPT–HARVEST Map

**Created:** 2026-10-26 · **Scope:** real native rich content, citations, file/artifact handling, provider qualifications, search, selective portability. **Evidence:** direct GitHub reads of Harness and four donor repositories + AION 116-signal atlas. **Not:** runnable donor integration, renderer transplant, approval to harvest, or owner/browser proof.

## Executive decision

**ADAPT in Harness first.** The shortest path to source-faithful V1 is to improve existing `world-view.mjs` + `chat.mjs` rich reader and custody semantics, without copying `vivim-final`'s React renderer or creating a second ContentPart schema. Treat donor code as specific examples of **WHAT semantics should survive**, not as a new frontend. Preserve unknown shapes as inert evidence; a displayed label is not full fidelity.

## Evidence and recommendation legend

- **VERIFIED CODE:** direct read of full file, functions present.
- **README ONLY:** project describes behavior, code path not independently inspected.
- **ATLAS CANDIDATE:** P1 discovery, not an implementation fact.
- **BUILD:** narrow new behavior in existing Harness module. **ADAPT:** reuse native Harness logic plus a behavior pattern from donor. **HARVEST:** incorporate a bounded implementation only after compatibility/license/security review. **HOLD:** defer until core personal world or provider lane authorizes.

## Verified source anchors

**Harness:**

- [src/studio/ui/chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs): `replySources` lines ~557–580 collects provider-reported citations separately from text-extracted/links and `sourcesNote` explicitly qualifies source certainty; `replyArtifacts` ~592–600 preserves safe URL or text for site-reported artifacts; `createRichRenderer` ~612–752 supports inline citation markers, code/artifact text-download and accessible tables. This is already a valuable reusable renderer; DO NOT REPLACE wholesale.
- [src/studio/ui/universal-chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs): `renderNativeBlock` ~180 covers `citation(s)`, `reference`, `artifact`, `tool-activity-observed`, unknown provider shapes and grounded/unverified evidence; a **different projection context**, not a separate source of truth.
- [src/studio/ui/world-view.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs): `blockToMarkdown` ~210–303 formats paragraph, heading, code, table, list, quote, figure, details, equation, image/file link and labels unsupported media/graphic; it **does not download image/file bytes** and may render citation/artifact payloads as labeled unknown. `turnPlan` ~314 retains loss qualifications; `planFrames` ~333 uses one frame per top-level saved block for `partPath`.
- [src/studio/world-service.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs): copied `DOM_TURNS` blocks and source session/index reference; an absent stored part cannot be recovered merely by adding a renderer.
- [src/studio/world-search.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-search.mjs): `attributedPartPath` ~85 uses unique matched token coverage across top-level blocks; returns `[blockIndex]` or null. Search result's `source.partPath` ~297–299 now exists; don't label dormant.
- [src/studio/world-transfer.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-transfer.mjs): modes `references/transcript/full-saved`, reasoning/tool part flags, integrity manifest, declared **external-asset-bytes excluded**. No binary-preserving personal-world export proof.
- [src/studio/world-relations.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-relations.mjs): qualified source references, selections and notes remain distinct from capture.
- [src/studio/world-url.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-url.mjs): sanitize provider URLs to origin+pathname; do not assume sanitized paths never contain identifiers.
- [test/unit/world-ui.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui.test.mjs), [world-service.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-service.test.mjs), [world-ui-find.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui-find.test.mjs): existing source-level fixture acceptance substrate.

**Donor verified source (not executable in Harness without adaptation):**

- [vivim-final/src/schema/streaming.ts](https://github.com/owenservera/vivim-final/blob/master/src/schema/streaming.ts): Zod/TypeScript `ContentPart` union with text, reasoning, code, file, tool-call, tool-result, source, custom, error, meta and step-start; carries source IDs, media types and extensible unknowns. **Schema semantics** useful; shape differs from stored `DOM_TURNS`.
- [vivim-final/src/schema/content.ts](https://github.com/owenservera/vivim-final/blob/master/src/schema/content.ts): `validateContentPart(raw)` boundary helper over ContentPartSchema; useful validation pattern, not evidence of compatibility with Harness records.
- [vivim-final/frontend/src/render/registry.ts](https://github.com/owenservera/vivim-final/blob/master/frontend/src/render/registry.ts): component-type and custom-kind renderer registration; imported React type `ComponentType`; **not** a standalone JS `/chat` plugin.
- [vivim-final/frontend/src/render/renderers.tsx](https://github.com/owenservera/vivim-final/blob/master/frontend/src/render/renderers.tsx): full typed part presentation including `SourceRenderer`, `FileRenderer`, tool-call/result/error/meta; source and image/file link examples. **Caution:** donor directly uses `part.url` and data-URI image content—do not copy trust handling into untrusted-world UI. Unknown custom kind displays raw JSON; Harness deliberately hides raw unknown payload, so **do not transplant that fallback**.
- [vivim-final/frontend/src/features/guided-landing.tsx](https://github.com/owenservera/vivim-final/blob/master/frontend/src/features/guided-landing.tsx): progressive disclosure and reduced-motion reveal behavior; integrated onboarding can launch Chrome profiles, so **extract only first-use presentation concepts**, not side effects.
- [vivim-final/frontend/src/app/page.tsx](https://github.com/owenservera/vivim-final/blob/master/frontend/src/app/page.tsx): unified entry over spatial canvas; current V1 wants low-chrome, simple user world, **no forced canvas adoption**.
- [claude-export-hub-vivim/README.md](https://github.com/owenservera/claude-export-hub-vivim/blob/main/README.md): claims selectable transcripts/artifacts/attachments/presented/generated files and thinking/status ZIP manifest; notes Claude UI changes, metadata-only placeholders and title-only collapsed panels. README inspected, **extraction implementation NOT examined**, so donor value is currently a **behavioral reference**, not code-ready HARVEST.
- [OpenScrollChromeExtension/README.md](https://github.com/owenservera/OpenScrollChromeExtension/blob/main/README.md): manual local structured JSON preservation concept, later browser-lane only.
- [assistant-ui-VIVIM/README.md](https://github.com/owenservera/assistant-ui-VIVIM/blob/main/README.md): React streaming/attachment accessibility library description; likely different UI stack, **HOLD**.

## Native fidelity opportunity register

| ID | Native user outcome (P5/C cluster/VD signal) | Current Harness reality | Donor insight | Proposal | Effort | Acceptance |
|---|---|---|---|---|---|---|
| F01 | Original mixed part order and types survive RETURN (W03/C03/VD-0013,16) | `DOM_TURNS` blocks copied; `world-view` converts supported kinds to Markdown and labels unknown | `streaming.ts` closed + custom type union, `registry.ts` dispatch | **ADAPT** bounded source-preserving view model; no second persisted schema | HIGH | fixture text/code/table/citation/artifact/tool/custom/partial preserve original order, source and opaque unknown semantics on restart |
| F02 | Citation user can open with qualification (W03–04/C03–04/VD-0023) | `replySources` distinguishes site-reported vs text-inferred; world block renderer lacks equivalent fully linked citation behavior | `SourceRenderer` explicit `sourceId/title/url` | **ADAPT** existing Harness `replySources` and safe links into saved-world view where data available | MED | provider-reported, textual-reference and source-missing display distinct; untrusted or absent href non-clickable; source ID preserved |
| F03 | Artifacts have useful content and versions, not labels (W03,W05/C05/VD-0008,21) | `replyArtifacts` can expose text or safe URL; world `blockToMarkdown` may label unknown artifact; export excludes external asset bytes | `FileRenderer` type/display; Claude Export Hub artifact inventory (README) | **ADAPT** existing text artifact card/download; **BUILD** only a bounded, provenance-preserving artifact reference model for already-saved content | HIGH | known text artifact opens/copies/exports without code execution; missing bytes say unavailable; versions not conflated |
| F04 | File/image/citation integrity and offline truth (W03,W09/C03,C09/VD-0013,81) | file/image Markdown URLs + non-download notices, bytes not captured; assets declared excluded from export | donor typed FilePart (mediaType, optional data/url), Claude Export Hub manifest (README) | **BUILD** an explicit `captured local bytes / external reference / missing` availability decision before binary storage; **HOLD** automatic download | HIGH/MAX | actual file bytes never implied where absent; sanitized links; export contains explicit exclusions; no external fetch without permission |
| F05 | Unknown provider part doesn't leak or disappear (W03/C03/VD-0016,27) | `world-view` labels unknown without payload; underlying block remains stored; `universal-chat` provenance | React registry custom fallback (shows JSON) | **REUSE** Harness safe unknown fallback. **REJECT** raw-JSON donor fallback | LOW | unsupported part remains traceable/inert; user sees type and missing renderer; no HTML/script execution or leaked secrets |
| F06 | Tool and reasoning blocks represented honestly (W03,C03/VD-0014,22) | saved `reasoning/thinking/tool/status` labels; export part flags; no actual provider tool authority | TS ToolCallState and `ToolCallRenderer` states | **ADAPT** status wording only, never invent approval/execution; preserve `observed` versus `performed` | MED | tool activity never shown as a command performed by VIVIM; partial and unknown remain qualified |
| F07 | Tables/code usable and accessible (W03,W11/C03,C01/VD-0008) | `createRichRenderer` already has copy buttons, table TSV, code accessibility; world uses this renderer | donor CodeRenderer present, but React-specific | **REUSE** Harness; fix only failing world adapter/UX | LOW/MED | table scroll/copy, code markdown, safe artifact text download and keyboard inspection |
| F08 | Save selected part → project → find exact part (W05,W07,C05–07/VD-0057) | world selection refs exist; `partPath` now produced for uniquely attributable hits and consumed by Find | none needed | **BUILD small UI glue** only where selection creation/association isn't directly usable; prove current code before changes | MED/HIGH | start saved part, save project/selection, find and focus same block; ambiguous hit stays message-level |
| F09 | Source provenance durable on import/export (W04,W09,W10/C04,C09) | foreign namespace + import custody, hash, omitted/partial qualifiers | donor source IDs, export manifest examples | **REUSE** Harness world transfer; extend specific omissions only | MED | imported text never claimed locally captured or verified provider account; broken refs declared |
| F10 | First-use clarity and accessibility without fake connected state (W11/C01/VD-0003,11) | Workspace/Saved/Find/Transfer inside `/chat`; no proven browser onboarding | `guided-landing` progressive reveal/reduced-motion only | **ADAPT** copy/state approach, not React component or Chrome-launch flow | MED | fresh profile shows empty/sample/import choices; no "provider connected" absent proof |
| F11 | Avoid a second content representation authority (cross-cutting) | `Session.DOM_TURNS` plus world view; original native projection separate | TS schema would require translation | **REUSE** source, **ADAPT** lossy presentation only, don't copy file hierarchy wholesale | MAX guardrail | no dual persisted truth, no provider source overwritten by user edits |
| F12 | Sharing scope and content warnings (W09/C09/VD-0021,81,82) | modes/flags and manifest exist; content not automatically redacted | Claude Export Hub selectable parts and manifest (README) | **REUSE** Harness selectors; **ADAPT** explicit preview warning for provider/PII text; no new ZIP format by default | MED | "full-saved" warns on raw message content even though URL query sanitization passed |

## Suggested acceptance fixture

One single local synthetic session with:
`turn 1:` paragraph + inline citation (reported and link-from-text variants) + table; `turn 2:` fenced code + saved text artifact (file name, ext, version) + unknown `custom.kind`; `turn 3:` tool-status + visible-thinking summary + image/file *reference only* + partial trailing segment. Each block includes stable local message/part address, source session/index, observed-versus-inferred basis, custody, and explicit saved-asset availability. A project pins one top-level part and a note; find query has unique and ambiguous block cases; export in each mode; restore as imported with missing binary qualification. Not a new schema prescription.

**Safety/quality adversaries:** malformed external URLs, encoded markup in unknowns, oversized nested block, missing citation URL, ID collisions, changed artifact version, synthetic content that looks like a credential, repeated import and text with conflicting provenance. No Playwright/Puppeteer; a browser acceptance may be manually performed on a Windows operator session.

## Harvest/no-harvest decisions (recommended; not owner approvals)

1. **HARNESS source first:** `chat.mjs` `replySources`, `replyArtifacts`, `createRichRenderer`; world services and selection/transfer already in same repo. **IMPLEMENT in-place** if measurable gap.
2. **ADAPT semantics from vivim-final:** stable ContentPart typing and source ID, custom renderer dispatch *idea*, tool state vocabulary, source/file display, import validation boundary. **No React, Next.js or Zod dependency just to display saved-world parts.** If an agent proves a dependency materially helps, submit comparison before adding it.
3. **CLAUDE EXPORT HUB:** selectivity, manifest and explicit artifact omissions are useful; **README-only insight** until implementation code is inspected. Do not re-use its browser actor or fragile site selectors.
4. **OPENSCROLL / assistant-ui:** postpone extension/browser and React chat framework; existing Harness already owns those functions.
5. **VIVIM-FINAL chrome-governor:** **DO NOT HARVEST.** It is an alternative browser owner (the repo already has one); useful only as an adversarial failure-mode reference.

## Follow-up engineering slices (no implementation made here)

- **F-1 / HIGH:** saved-world citation/source projection with source-kind qualifications and safe links (W03/04).
- **F-2 / HIGH:** source-preserving text artifact/file-reference model and user-side selection/save flow (W03/05/09).
- **F-3 / MED:** rich part find-to-focus connected fixture (W07); source and UI already implement halves; test integration first.
- **F-4 / MED:** offline first-use/unknown-assets/keyboard state polish (W11).
- **F-5 / MAX decision:** whether keeping actual binary assets belongs in V1 or is a later user opt-in; do not infer from typed donor FilePart.

**Closure:** six relevant donor/code families investigated, twelve source-qualified opportunities, five bounded engineering slices. **No donor code copied or imported.** No tests executed.
