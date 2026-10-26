# R4 — Capture-to-World Truth & Native Fidelity

**2026-10-26 · AION Role 15 Product Agent · HIGH investigation.** GitHub source-only audit. Canonical Harness baseline [32b7021e](https://github.com/owenservera/vivim-harness/commit/32b7021e99aedb3bedb21daae9e7983676ef4771). No Harness edits, local Windows inspection, Chrome action or test execution.

## Decisive result

**DOM_TURNS is a bounded final rendered-DOM observation, not the complete native provider conversation.** The [page agent](https://github.com/owenservera/vivim-harness/blob/main/src/capture/page-agent.js#L150-L277) observes role-like DOM nodes (up to 500 chosen turns), creates text/inlines/blocks and may truncate text. [DomObserver](https://github.com/owenservera/vivim-harness/blob/main/src/capture/dom.mjs#L106-L109) optionally redacts text according to capture policy. [Recorder.stop](https://github.com/owenservera/vivim-harness/blob/main/src/capture/recorder.mjs#L787-L815) attempts the final observation and saves it to session KV as DOM_TURNS; its DOM read failure can leave that KV absent even when raw-record verification succeeds. [WorldService.conversation](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs#L97-L127) reads that KV only for local observed messages; it does not merge all available raw network/derived artifacts into the personal-world message.

**Primary opportunity:** information already present as structured inline links/citations and numeric truncation lengths becomes less informative during the saved-world projection/display. Recover this using existing modules before changing capture.

## 1. Exact evidence and custody lineage

| Stage | Authority / source function | Surviving material | Truth limit |
|---|---|---|---|
| Browser observation | [page-agent.js turns/blocks/inlines](https://github.com/owenservera/vivim-harness/blob/main/src/capture/page-agent.js#L151-L277), [DomObserver.turns](https://github.com/owenservera/vivim-harness/blob/main/src/capture/dom.mjs#L106-L109) | Visible role candidates, structured DOM blocks, inline links, text, source node IDs, caps/redactions | DOM heuristic, final page state, not pre-attach history or file bytes |
| Recorded capture | [Recorder](https://github.com/owenservera/vivim-harness/blob/main/src/capture/recorder.mjs#L787-L815), [Session](https://github.com/owenservera/vivim-harness/blob/main/src/store/session.mjs), [RawLog](https://github.com/owenservera/vivim-harness/blob/main/src/store/raw-log.mjs) | Final KV DOM_TURNS; separate raw/manifest/datasets | Raw gaps explicitly logged, but no automatic full coverage assertion; stop-time DOM read can fail |
| Operational conversation | [conversation-thread.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-thread.mjs), [conversation-browser-adapter.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-browser-adapter.mjs) | Bounded text transcript and send/reply/readiness evidence, exact target/thread journal | A text-only read differs from structured final DOM; read does not authorize SEND; supported bound ChatGPT /c/UUID thread only |
| Evidence checkpoint | [conversation-evidence.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-evidence.mjs#L122-L172) | Hashes/pointers to journals, raw segments, KV, derived datasets | Engineering audit, not a new rich-content archive; UI/outcome deliberately unknown |
| Derived observation/intel | [shapes/observation.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/shapes/observation.mjs), [intel/corpus.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/intel/corpus.mjs), [intel/continuity.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/intel/continuity.mjs) | Stream components, 240-char part previews, loss markers, DOM/network reconciliation, scoped entity inferences | Derived: does not establish native account or complete message archive |
| Personal world read | [world-service.mjs conversation](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs#L97-L127) | role, text, clone of blocks, source session/index/IDs, role attribute, Boolean truncated, redactions | Uses DOM_TURNS only; numeric original truncation length lost; no provider-wide completeness |
| Display | [world-view.mjs blockToMarkdown/turnPlan](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs#L188-L340), [chat.mjs createRichRenderer](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs#L612-L752) | Markdown-supported text, code, tables, labels for unsupported blocks | Paragraph inline citation/link shape is not rendered as source link; unknown payload withheld |
| Local ownership | [world-relations.mjs createObject/createSelection](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-relations.mjs#L90-L120), [world-service.mjs projects/notes](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs#L129-L160) | Revision-pinned source references; user-authored projects, selections, notes | Selection is an address and fingerprint, not a copy of source or asset bytes |
| Find | [world-search.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-search.mjs#L170-L207) | Text plus recursively flattened block content, local imported IDs, unique partPath when justified | Can surface fields the viewer hides; bounded, no provider search or full-history guarantee |
| Transfer | [world-transfer.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-transfer.mjs) | Exact selected world records/dependencies, modes, manifest, integrity hash, missing-source qualifications and imported custody | References mode omits body; transcript filters block types; full-saved still excludes external asset bytes/raw capture; no global secret redaction |

**Read-only vs effects:** page-agent.js is an isolated-world observer and DomObserver is a read seam. Explicit typing/submission is separately governed by [conversation-service.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-service.mjs) and [conversation-browser-adapter.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/capture/conversation-browser-adapter.mjs) with leases, journals and binding checks. No proposed R4 fix is a browser send or a new CDP actor.

## 2. Mandatory native-content proof matrix

Codes **L01–L13** each identify a reproducible source-to-user-content lineage; they are **not** a new implementation backlog. OBS = DOM observed when actually present; KV = final saved DOM_TURNS; SEL = local source address; XFER = export/import. Status is source-classification, not real user-data success.

| ID / family | OBS → KV saved shape | World read → UI / SEL | Find → XFER/restore | Fidelity and loss point | Fix location, test |
|---|---|---|---|---|---|
| **L01 Ordered turns** | page-agent turns role/index/id/domId/text/blocks; max 500 chosen nodes | world-service maps in recorded array order to local conversation:turn:index; selection pins messageIndex | Message search, transcript/full-saved restore as imported local IDs | **Partial:** chosen rendered window ≠ full native history; page-based order not authenticated full archive | page-agent and world-service; world-service, world-journeys tests |
| **L02 Paragraph/Markdown/inlines** | paragraph/heading text plus inline typed entries (link, citation, code, emphasis) | cloned blocks; blockToMarkdown uses text, not inline array | richText flattens fields; selected stored blocks survive full-saved, often transcript | **Display-lossy:** citation/link semantics present in KV but not used by saved-world formatter | world-view + chat rich renderer; world-ui and world-search tests |
| **L03 Code** | PRE type=code, language, text; inline code separately recorded | fenced Markdown code via existing rich renderer | searchable; transcript/full-saved text survives, references mode body absent | **Good text, partial semantics:** no executable artifact or original editor behavior | world-view, chat; world-ui, world-transfer |
| **L04 Tables** | TABLE headers + rows as strings | tableMarkdown accepts headers/head and rows; tabular renderer | indexed; transcript/full-saved preserved | **Partial structure:** no colspan/rowspan/inline cell links or native interactivity | page-agent/world-view; world-ui |
| **L05 Citations/links** | inline A becomes t=citation or t=link with text/href; provider labeling heuristic | world-service keeps block.inline; world-view paragraph uses only block.text; user selection can pin top-level block | link text/URL can enter generic search; full-saved retains inline; imported viewer still loses semantics | **Confirmed UI projection gap**, link origin not automatically site-verified | world-view; reuse chat replySources/safeHref with adaptation; world-ui |
| **L06 Artifacts/version** | generic page agent emits code/file/figure/details, **not** authoritative artifact-version object | saved code/text renderable; world-view cannot invent artifact revisions; other native UI projection has artifact type only if separately fed | text searchable; code transfers, external bytes excluded | **Artifact identity/version unverified:** live replyArtifacts and universal-chat artifact differ from saved DOM shapes | world-view/chat; world-ui and export-modes |
| **L07 Image/file/media bytes** | IMG source URL/alt/dimensions; file anchor name/href; VIDEO/AUDIO source; graphic kind/label; **no bytes** | world-view link/label and explicit non-download/non-play note; selection stores address, not payload | refs searchable, XFER omits external-asset-bytes; restored URL may expire | **Metadata/link-only**, not offline asset preservation | HOLD new binary capture; existing world-view/world-transfer honest states/tests |
| **L08 Reasoning/tool/status** | generic DOM parser does not guarantee special types; a page may be flattened to paragraph; separate stream components have progress/tool taxonomy | world-view labels these types **if actually stored**; display must not imply tool execution | recorded fields searchable; transcript/full-saved part flags affect export | **Conditional evidence**; cannot assert source-native tool event from generic text label | world-view and observation; world-ui, world-export-modes |
| **L09 Stream partial/truncation** | mutation/raw log may contain temporal events; final KV turn.truncated is **numeric original length** when capped | world-service converts to Boolean; coverage partial if flagged; raw gap counts not propagated to world message | search only saved text; transfer can signal PARTIAL_SOURCE_OBSERVATION; imports retain projected partial state | **Confirmed precision loss:** original-length numeric detail discarded; final rendered state not full stream/history | world-service, world-view; world-service, world-journeys |
| **L10 Edits/deletions/history** | raw DOM mutation evidence possible; final KV only current chosen nodes | local world contains last observed projection; local user revision is NOT native provider edit | saved snapshot search/export, not provider edit timeline | **Not represented as native revision history**; no automatic reconstruction | HOLD native historical replay join; raw/replay subsystem |
| **L11 Unknown content** | unknown DOM containers often recursively broken into known children; derived stream components may mark unknown-native | cloned stored block retained; world-view displays safe type label without payload | generic richText indexes arbitrary fields; transcript prunes non-transcript kinds, full-saved may retain | **Conditional preservation and cross-surface disclosure mismatch**: search may show text hidden in viewer | world-search/world-view; world-search and world-ui |
| **L12 Provider/thread/account** | session metadata site/target; only ChatGPT /c/UUID parser supports nativeRef, account unknown | world-service session-scoped hash local ID; provider and thread qualified; imported foreign IDs distinct | search local custody; import marks account unknown, not remote verified | **Conservative identity, not account auth**; URL/title not trusted as verified origin equality | observation/world-service/world-transfer; observation, world-relations |
| **L13 Projects/notes/source refs** | **Not native provider content**; local user-owned VersionedStore rows | createObject/createSelection source pointer+fingerprint, project associations, notes separate | index user overlay; selected dependency closure export, imported local IDs | **Solid fixture-level local custody**; missing/stale external source remains unresolved, not auto repaired | world-relations, world-service, world-transfer; world-relations, world-journeys |

**Important:** "OBS → KV" only describes what code can store **if present** on a page. No owner sessions/provider webpages were inspected. No item is thereby declared observed in the user's actual data.

## 3. Highest-confidence loss mechanisms

### A. Structured inline citations/links lose meaning in saved-world display

The page agent [inlines()](https://github.com/owenservera/vivim-harness/blob/main/src/capture/page-agent.js#L151-L169) records typed A elements with text/href, including citation-ish links. Paragraph and heading blocks retain inline. [WorldService](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs#L121-L125) uses structuredClone on blocks. [world-view blockToMarkdown](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs#L210-L226) emits only block.text. Thus a link label may remain but its URL and citation-vs-generic type are not carried into its rendered Markdown.

Existing [chat.mjs replySources](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs#L557-L589) distinguishes site-reported sources, linkdefs and plain text links, and [createRichRenderer](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs#L612-L752) renders numbered/source links. **These functions expect live-style reply/source structures, not raw DOM block.inline.** Adapt their safe-link and qualification semantics; never call them on a DOM message expecting shape compatibility. Don't promote a heuristic citation label to a provider-verified claim.

**Tests to add:** saved paragraph with mixed text, ordinary external link, citation-type link, missing href and javascript href; same source text/order; safe URL display; no HTML injection; imported provenance still foreign.

### B. Numeric truncation evidence is demoted to Boolean

[page-agent turns()](https://github.com/owenservera/vivim-harness/blob/main/src/capture/page-agent.js#L272-L275) sets truncated to original text length when it exceeds the capture cap. [world-service.conversation](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs#L121-L127) emits truncated: !!turn.truncated; the specific observed length is lost downstream. Existing [turnPlan](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs#L314-L327) can only show partial flag.

Also recorder [stop](https://github.com/owenservera/vivim-harness/blob/main/src/capture/recorder.mjs#L787-L790) can swallow a DOM snapshot failure while raw capture verification later marks the session complete. WorldService correctly returns coverage.state=missing for absent DOM_TURNS and fullNativeThread=unknown, but the known numeric loss information is absent when partial content exists. Raw log queue overflow gap records are not automatically world-message status.

**Tests to add:** numeric original length, normal untruncated, missing DOM_TURNS, complete-with-integrity-warnings, and import roundtrip. Keep Boolean field backward compatible; a new qualifier can carry original length/known cap without editing original source.

### C. Artifact/asset loss often occurs before WorldService

The page agent recognizes PRE/code, file anchors, IMG, media and graphics, but doesn't collect binary bytes or a generalized native artifact version model. The [world-view](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs#L269-L288) labels image/file/media limitations; world transfer excludes external-asset-bytes. The existing [chat.mjs replyArtifacts](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs#L591-L600) handles text or safe URL **from live reply objects**; [universal-chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs#L180-L209) handles an alternate native block input. Neither proves native artifact version/bytes were persisted in DOM_TURNS.

**Proper boundary:** show useful saved text/code using existing copy/download, mark file/image as URL-only or missing, and maintain source pointer. New binary custody, network downloads and artifact-version collection require separate user value/effects decisions, not a view-layer fix.

### D. Unknown block visibility differs between viewer and search

The viewer deliberately labels unsupported block types without exposing arbitrary payload. [world-search richText](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-search.mjs#L61-L68) recursively includes object keys and values; [world-search.message](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-search.mjs#L170-L207) indexes those flattened fields, and result snippets may therefore include data that the reader hides. This is **an observed code-path mismatch, not proof of real credential leakage**. A targeted regression should establish intended visibility/disclosure scope; R6 owns formal privacy policy.

## 4. Capture-to-intelligence: what exists but is NOT in World messages

[Recorder](https://github.com/owenservera/vivim-harness/blob/main/src/capture/recorder.mjs) separately records raw stream events and derived shape observations. [shapes/observation.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/shapes/observation.mjs#L103-L173) builds aion.web-observation/1 from STREAM_COMPONENTS, DOM_TURNS, STREAM_DOM_JOIN, shapes and acceptance; its stream components have partType, nativeType, preview text, unknown-native loss marker, DOM/network reconciliation and separate completion facts. [intel/corpus.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/intel/corpus.mjs#L18-L43) adds provenance back to raw seq/sid and DOM node, but **drops full blocks** from the DOM sample in favor of blockTypes. [intel/continuity.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/intel/continuity.mjs) derives conservative continuity from saved entity data.

The personal-world reader [world-service.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs) imports buildObservation only to qualify session metadata/thread hint. It **does not** merge these derived network/knowledge part previews into its saved conversation messages or create a verified unified native thread. This is an *integration possibility*, not a permission to automatically fuse ambiguous DOM and network identities.

## 5. Exactly three independent, small coding increments

| Increment | Outcome and acceptance | Code to edit, existing tests | Effort / inventory |
|---|---|---|---|
| **R4-I1 — Recorded inline links/citations** | Saved-world paragraph displays verified observed label/href, distinguishes citation label from generic link, rejects unsafe href, preserves text and source basis | [world-view.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs) blockToMarkdown/turnPlan/planFrames; adapt safe affordance from [chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs); extend world-ui.test.mjs | **HIGH** W03/W04; C03/C04; F02 |
| **R4-I2 — Precise loss qualifiers** | Keep numeric observed original length alongside Boolean truncation, distinguish DOM-final window from full thread, propagate known raw integrity warnings without guessing counts, preserve missing/unreadable behavior | [world-service.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs) conversation + optional world-view coverage; extend world-service.test.mjs/world-journeys.test.mjs | **HIGH** W02/W04; C02/C04/C16; F01 |
| **R4-I3 — Saved text artifact vs URL-only file** | Known saved code/text artifact can be viewed/copied using existing rich renderer; unavailable file/image/media bytes labeled unavailable; round-trip preserves qualifiers; no new fetch/execution | [world-view.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs) blockToMarkdown/turnPlan and existing [chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs) createRichRenderer/artifactInfo; extend world-ui.test.mjs/world-export-modes.test.mjs/world-restore.test.mjs | **HIGH** W03/W05/W09; C03/C05/C09; F03/F04 |

Independence is at the **user outcome / test level**. I1 and I3 share world-view.mjs, so don't dispatch them simultaneously to separate file owners. A coding agent should inspect current HEAD and worktree ownership before edits. All three are proposed, not authorized implementation.

## 6. BUILD / ADAPT / HARVEST / HOLD recommendations

- **ADAPT** the existing Harness saved-world reader and chat rich renderer for already-recorded inline links/citations and text artifacts. No second renderer, no wholesale React component migration.
- **BUILD narrowly** within WorldService a backward-compatible observed truncation/original-length qualifier and consistent missing-source state. Do not mutate source KV.
- **REUSE** VersionedStore for user overlays, raw-log for captured evidence, search as a transient derived projection and world-transfer for selected import/export.
- **HOLD** generalized artifact version history, binary asset acquisition, provider-native edit replay, automatic stream-to-DOM identity merges, new Chrome effect owner, second knowledge database and custom provider network fetches.
- **DONOR scope:** The directly inspected vivim-final typed ContentPart/schema/renderer material in [02-native-fidelity map](02-NATIVE-FIDELITY-RECOVERY-MAP.md) is a semantic reference, not proof that old-format content or binary payloads already exist in Harness. Claude Export Hub evidence remains README-only for its deep extraction implementation.

## 7. Explicit unknowns / adversarial criteria

- No real ChatGPT/Claude/Gemini page or owner capture was examined; no claim of actual saved citations, artifacts or matching block taxonomy on any provider.
- No reliable account identity: [buildObservation](https://github.com/owenservera/vivim-harness/blob/main/src/shapes/observation.mjs#L118-L146) always returns account unknown; thread ref is parser-qualified ChatGPT URL when observed. Titles/text/URLs are not authenticated account equality.
- The local-raw capture privacy policy is the default; filtered mode only scrubs selected text/header/URL surfaces. Inline href/src handling and world source.providerUrl sanitizer are distinct scopes. This is not universal credential sanitization (R6).
- A completed raw capture session does not prove final DOM_TURNS exists or contains full native thread/history.
- Page agent's 500-turn choice and message text cap, final-snapshot timing, generic role heuristic and page scroll mean older rendered/unrendered history may be absent; do not label absent history deleted.
- Imported records use distinct local IDs, imported custody and unknown account; they are not locally observed source.
- Full-saved preserves selected stored-world record fields under flags/limits, **not** captured raw traffic or external attachment bytes.
- Unknown block payload may be indexed although UI displays label only; targeted security review needed.
- Test sources inspected include: world-service.test.mjs, world-ui.test.mjs, world-relations.test.mjs, world-search.test.mjs, world-transfer.test.mjs, world-journeys.test.mjs, observation.test.mjs; also world-restore.test.mjs and world-export-modes.test.mjs referenced in existing repo formal prep. **No tests executed for R4; prior fixture receipts are not live browser proof.**

## 8. Fetched file version receipts

| Source | Blob SHA | Relevant location |
|---|---|---|
| src/capture/page-agent.js | 4805bee32ba2b1c4442e31a44a1982ce20509330 | inlines/blocks/turns ~151–277 |
| src/capture/dom.mjs | 162e5f8a81e4b4cef04cdbf267fdb5d7a1d28f5f | turns ~106–109, scrubBlocks ~147–154 |
| src/capture/recorder.mjs | 06ffc7b9faaaca76fafddb0166bbaaa5618f3a6b | stop DOM_TURNS ~787–815 |
| src/capture/privacy.mjs | c77f9ad85ae9b3a8cb036dbf14d8d4998468664d | captureMode ~8–26 |
| src/capture/conversation-thread.mjs | b1d502ad24ed3852febd58e4ce2e5f8c6c047f2c | parseThread/boundTranscript |
| src/capture/conversation-browser-adapter.mjs | 2d815198b537ff49fc91a3410599eff3b2ae95ad | send vs read seam |
| src/capture/conversation-service.mjs | 3f78251056100efc7eb214caabf7a046ddab2aba | operation journal |
| src/capture/conversation-evidence.mjs | 78a9b387f75106d716e971ba12625229615738f9 | KV/raw/dataset pointers |
| src/store/session.mjs | cbbd469ed345720b63a8d71ec5ffdbe13cc11de4 | KV + dataset |
| src/store/raw-log.mjs | 58e2c5d56953e60265361948c133646d7134d9c2 | gap records |
| src/store/versioned.mjs | e2df7184188d92577f465162a483b4d93b118bdd | CAS/overlay |
| src/shapes/observation.mjs | c925e656bd944dbabcec554fb4a32aa195b106bb | preview + loss markers |
| src/intel/corpus.mjs | 9285156306906f39d38392cbc6df44a469bcd338 | provenance samples, blockTypes |
| src/intel/continuity.mjs | 788bbdad73b6b1aede1f4d40d77d624b03cb914a | derived continuity |
| src/studio/world-service.mjs | 51401682c474c9218db1a20481f0e5b3a0b7a6b6 | conversation projection |
| src/studio/world-relations.mjs | 65b58a09f2d1484510bcc3bb5df5b4a31d157398 | source selections |
| src/studio/world-search.mjs | 7c6dee282fdbe4b4acc708464ede00207d9da9a1 | per-block path attribution |
| src/studio/world-transfer.mjs | b4ea4866812f9cb831d3ff758ac03eef00d921af | export/validate/restore |
| src/studio/ui/world-view.mjs | 06e194261611c1cebe31385173ae6ef7a95ac71f | blockToMarkdown/turnPlan |
| src/profiles/sites/index.mjs | acc1a7878696206082d002cdccbba1dac2b895a2 | seeds vs learned read-only |
| src/profiles/sites/chatgpt.mjs | f1f42c145d0fdf5117dc43d11e68ff8f7702de33 | site adapter |
| src/profiles/sites/claude.mjs | 9d1f33a54a3a9e4ca145a4b402ea45d28a7d4044 | site adapter |
| src/profiles/sites/gemini.mjs | b89518ef3cdbf941ed803a16f37d4bbcd239d88b | site adapter |

## 9. P2/P3/P5/R3 reconciliation and handoff

[P2](../specialists/data-knowledge/P2-DATA-KNOWLEDGE-CONTRACT-2026-10-25.md) distinguishes external identity, immutable evidence, rebuildable derived intelligence and durable user overlay. Existing code generally respects these authorities. [P3](../specialists/experience-acceptance/P3-EXPERIENCE-AND-INTEGRATION-MAP-2026-10-25.md) requires readable mixed rich content and honest source gaps, not just a full-saved raw JSON record. [P5](../P5-V1-INTEGRATION-MASTER-WORKLOG-2026-10-25.md) W03/W04 therefore remain partly unresolved. [R3](../R3-DEEP-INVENTORY-RECONCILIATION-2026-10-26.md) accurately warned old trackers lagged new partPath and Workspace commits; R4 confirms the partPath producer and viewer exist.

**Done:** A remote source-qualified integration agent can follow each native content family from observed DOM to actual loss and named owner/test. **Not done:** no code modified, no R4 increment executed or dispatched, no private saved data/browser acceptance claimed. See accompanying machine-readable R4 loss register.
