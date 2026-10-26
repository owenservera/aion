# R6 — Release Security, Adversarial Proof & Integration Dispatch (READY PROMPT)

**Thinking effort: HIGH.** **Executor:** ChatGPT PRODUCT AGENT release/security integrator. **Work mode:** current GitHub source/test deep audit and AION-only handoff. **Not launched when prompt is prepared.**

## Copy-ready launch directive

`#AION @PRODUCT-AGENT +/EXECUTE /R6-RELEASE-SECURITY-PROOF`

Think at **HIGH** effort. Build the lean final **evidence and release-closure contract** for VIVIM's source-grounded personal world, reconciling R4 (content truth), R5 (user flow), P5 W00–W14, Q01–Q12 and current Harness main. If R4/R5 have not run, do **not fake their conclusions**: work independently from existing P1–P5/R3/remote-prep sources and mark integration placeholders. **No Harness code changes, no local tools, no external Chrome execution, no CI-success inference from commit titles.** Commit findings only to AION Product Agent folder.

**Objective:** reduce the remaining risk to a **small, prioritized set of verified/explicitly unverified acceptance cases** that local agents can execute as part of implementation, not as a standalone expensive inventory audit.

Inspect current `src/studio/world-transfer.mjs`, `world-url.mjs`, `world-service.mjs`, `world-relations.mjs`, `world-search.mjs`, `ui/world-view.mjs`, `src/store/versioned.mjs`, tests `world-import-hardening`, `world-provider-url`, `world-import-content`, `world-restore`, `world-transfer`, `world-journeys`, `world-ui-export-modes`, `world-ui-transfer`, `world-ui-workspace`, `world-search` and `world-ui-find`. Cross-check `docs/FORMAL-TEST-PREP.md` and stale `docs/track/worklog.yaml`; inspect present commit history for changes after old tracker HEAD.

**Adversarial acceptance requirements:**
- **Trust separation:** captured source vs derived intelligence vs user note vs imported copy; unknown account never becomes verified; same title/message hash not identity.
- **Export:** references-only truly excludes stored message bodies; transcript/full-saved **do** retain raw text and must say so; URL userinfo/query/fragment sanitized but path and body may hold secrets; manifest/exclusion/asset-availability and scope accurately reported; no claims of universal redaction.
- **Import:** manifest/hash tamper, bounded nested parts and cycles, record-ID/version collisions, repeat import, dirty legacy provider URLs, incomplete dependencies, malicious path/URL, partial `HTTP 200` with `failed[]` and `partial` and no false success.
- **Search and view:** producer→HTTP→UI unique `partPath`, ambiguous and absent-part fallback, imported IDs, note revisions, stale source, no prompt or HTML injection.
- **Durability:** interrupted write, CAS conflict, crash-safe overlay, second **OS-process** restart, clean data root for restore; tests use disposable data only.
- **Accessibility/runtime:** actual browser keyboard focus/reader and small screen as proof levels not provided by fake DOM. No Playwright/Puppeteer; no second browser owner. Separate test scope for the owner's currently authorized PROVIDER lane.
- **Execution/reporting:** distinguish S0 source, T0 in-process, T1 synthetic DOM, T2 HTTP/stub, T3 Windows OS-process+real browser (separately scored), T4 authenticated provider-native. Make every gate cite actual command+SHA+receipt or label not verified.

**Deliverables:** `R6-ADVERSARIAL-ACCEPTANCE-MATRIX.md`, `R6-PROOF-AND-RELEASE-GATES.yaml` if useful, and one **one-page local dispatch plan** limited to top next nonconflicting fixes with exact source/test owners. Explicitly state what ChatGPT can validate remotely and what only OpenCode/Windows can establish. Do not create a new roadmapping authority or auto-assign active files.

**Decision handling:** distinguish "BLOCKED on owner decision" (content redaction, real asset bytes, C10/C11 mounting, changing active WORLD/PROVIDER lane) from "BLOCKED on code" and "BLOCKED on evidence". If a disagreement is architectural, propose a small diff-ready choice rather than build two alternatives. Treat `PROMPT.md` current live-provider task as separate explicitly scoped work until owner chooses otherwise.

**Done means:** the owner can issue one bounded local instruction with prioritized Q/W references, and the agent knows exactly how to substantiate completion without wasting cycles on documentation or claiming fixture results as live acceptance.

## Scope boundaries

- **R6 owns:** security truth, negative cases, proof standard, release-ready dispatch reconciliation.
- **R6 does not own:** provider Chrome runtime implementation, standalone remote test running, donor code transplants, premature release approval.
- **Inputs:** [Security closure queue](03-ACCEPTANCE-SECURITY-CLOSURE-QUEUE.md), [P2 data contract](../specialists/data-knowledge/P2-DATA-KNOWLEDGE-CONTRACT-2026-10-25.md), [Harness formal test prep](https://github.com/owenservera/vivim-harness/blob/main/docs/FORMAL-TEST-PREP.md).
