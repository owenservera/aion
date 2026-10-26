# VIVIM Remote Preparation — 03 Acceptance & Security Closure Queue

**Date:** 2026-10-26 · **Purpose:** high-signal executable engineering backlog, grounded in current Harness main source, tests and P5 W00–W14. **Status:** authored/reviewed remotely; **no tests run and no Harness changes**. Every item below is a **proposed dispatch**—not an assignment to an already-running Windows agent.

## Dispatch discipline

Prioritize **one real J1→J4 flow, then bounded fixes**. Avoid a separate PC-wide verification project. Every task requires exact write ownership, current `HEAD`, fixture/HTTP/browser tier and a short receipt. No Playwright/Puppeteer. Keep code changes in `vivim-harness` only after the local agent confirms its current worktree and non-overlap. Existing active PROVIDER three-turn task in `PROMPT.md` is a **separate lane**, not silently preempted by this WORLD queue.

**Queue statuses:** `READY_SOURCE_REVIEW` = fully specified from GitHub but owner/local lane must check file ownership before execution; `DECISION` = product/safety choice before implementation; `LOCAL_ACCEPTANCE` = needs running Windows app, not a remote-only review; `DEFER` = explicitly not V1 core.

## Queue — minimum independent deliveries

| ID | Priority | W/C scope | WHAT / measurable closure | Source and tests to reuse | Effort | State |
|---|---|---|---|---|---|---|
| Q01 | **P0** | W12/C01–09 | J1–J4 actual browser UI + selected export→file→clean-profile restore, independent OS restart; **actual** user-visible workflow not just service test | `test/unit/world-journeys.test.mjs`, `test/unit/world-ui*.test.mjs`, `src/studio/ui/world-view.mjs` | HIGH | LOCAL_ACCEPTANCE |
| Q02 | **P0** | W09/W10/C09 | Resolve partial import failure semantics: `HTTP 200 + failed[]/partial` must visibly be incomplete and never "Restored" as full success | `src/studio/world-transfer.mjs`, `world-view.mjs`, `test/unit/world-import-hardening.test.mjs`, `world-ui-transfer.test.mjs` | MED | READY_SOURCE_REVIEW |
| Q03 | **P0** | W09/C09 | Privacy scope: truthful content warning, preview count and *no claim of message redaction*; make user choose/reference-only or explicit full content | `world-transfer.mjs`, `world-url.mjs`, `world-import-hardening.test.mjs`, `world-ui-export-modes.test.mjs` | HIGH | READY_SOURCE_REVIEW |
| Q04 | **P1** | W07/C07 | Prove current producer→HTTP→UI `partPath` pipeline on unique versus ambiguous message-block hit, including imported record; **do not rebuild search** | `world-search.mjs`, `world-view.mjs`, `world-search.test.mjs`, `world-ui-find.test.mjs` | MED | READY_SOURCE_REVIEW |
| Q05 | **P1** | W03/W04/C03/C04 | Saved citation/source blocks become usable, qualified source references with safe/absent URL behavior, not anonymous label | `src/studio/ui/chat.mjs` `replySources`; `universal-chat.mjs` `renderNativeBlock`; `world-view.mjs`; `world-ui.test.mjs` | HIGH | READY_SOURCE_REVIEW |
| Q06 | **P1** | W03/W05/C03/C05 | Known text artifact appears with provenance/copy/download and project selection, while external asset bytes remain explicitly unavailable | `chat.mjs` `replyArtifacts/createRichRenderer`, `world-view.mjs`, `world-service.mjs`, `world-relations.mjs`, `world-ui*.test.mjs` | HIGH | READY_SOURCE_REVIEW |
| Q07 | **P1** | W05/W11/C01/C06 | From visible saved part create selection/association + project/note entirely via existing /chat UI, then navigate Workspace, no fixture preseed | `world-view.mjs`, `world-service.mjs`, `world-ui-workspace.test.mjs`, `world-ui.test.mjs` | HIGH | READY_SOURCE_REVIEW |
| Q08 | **P1** | W02/W05/W06/W12/C16 | Real independent Studio process restart while keeping source/notes/membership and CAS safe; include corrupt/partial stored record and no source overwrite | `world-service.mjs`, `src/store/versioned.mjs`, `test/unit/world-service.test.mjs`, `world-journeys.test.mjs` | HIGH | LOCAL_ACCEPTANCE |
| Q09 | **P1** | W09/W10/C09 | Real sanitized URL path/userinfo/query/fragment and sensitive body threat review; prevent sensitive credentials being claimed clean merely because URL was cleaned | `world-url.mjs`, `world-transfer.mjs`, `world-provider-url.test.mjs`, `world-import-hardening.test.mjs` | HIGH | DECISION |
| Q10 | **P2** | W11/C01/C06 | Browser-level accessibility/first-run: empty offline world, keyboard focus, narrow widths, real reader pane, no duplicate provenance chip | `world-view.mjs`, `world-ui-workspace.test.mjs`; current `01c290a` fixes | MED | LOCAL_ACCEPTANCE |
| Q11 | **P2** | W00–W14/C17 | Refresh Harness `docs/track/worklog.yaml` and crosswalk only after latest source reviewed; supersede stale partPath/Workspace/security gap text with accurate evidence | `docs/track/worklog.yaml`, `docs/track/crosswalk.yaml`, `world-search.mjs`, new commits | MED | READY_SOURCE_REVIEW |
| Q12 | **P2** | W14/C10–C11 | Explicit owner choice whether to mount C11 read-only and C10 preview-only; no external effects, no unbounded filesystem roots or command execution | `src/studio/agentic-files.mjs`, `commands.mjs`, `integration-hub.mjs`, matching tests | MED/MAX | DECISION |

### Q01 — Complete real J1–J4 product acceptance (highest value)

**Why:** the repository has a substantial `test/unit/world-journeys.test.mjs` but the test's own header says not a second-OS-process, real browser or owner-data proof. [Formal test prep](https://github.com/owenservera/vivim-harness/blob/main/docs/FORMAL-TEST-PREP.md) separates T0 module, T1 synthetic DOM, T2 HTTP/stub and T3 real app.

**Minimal executable sequence:** (a) choose a safe synthetic persisted session in a disposable profile; (b) open saved conversation; (c) create project and note; (d) save a specific selected part and find it; (e) export selected bundle through actual browser file picker/download; (f) close whole Studio OS process; (g) reopen and confirm same refs; (h) restore bundle into a separate clean Studio data root through browser UI; (i) repeat import and show honest skip/partial. **Do not upload private source captures into GitHub.** Capture a redacted acceptance receipt: command, HEAD, files/objects count, expected/actual, screenshots only if safe, failing steps.

**Pass:** every J1–J4 step visibly works; missing asset/source indicated; imported custody correct; no unexpected remote effect; no lingering false save/restore state. **Failure:** any individual successful HTTP 200 is not a journey pass.

### Q02 — Import partial-success semantics (P0, backend already exposes info)

**Observed:** `world-transfer.mjs` builds `plan.failed[]` and `plan.partial`, with real per-record failures; [world-import-hardening.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-import-hardening.test.mjs) includes a regression asserting collision is a per-record failure in a partial plan, not an HTTP 409. `world-ui-transfer.test.mjs` already covers partial not success in a fake DOM.

**Deliverable:** one integration test exercising real HTTP restore response → product UI interpretation; a fixture with one success, one collision and one skipped source; exact shown outcome must be **Partial: 1 applied, 1 failed, 1 skipped** (counts adjust to fixture), with no "complete" banner. Keep idempotent retries non-destructive. **Do not blindly change HTTP status to 409**; that would redefine existing partial success semantics.

### Q03 — Explicit export privacy and contents

**Observed:** [world-transfer.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-transfer.mjs) manifest explicitly states selected content is **not automatically redacted**, and excludes `external-asset-bytes`. Current test file [world-import-hardening.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-import-hardening.test.mjs) has direct tests proving transcript/full-saved modes retain "secret-looking" message text verbatim. URL sanitizer drops userinfo/query/fragment but keeps path. There is no general content secret scan.

**Pass:** References mode never includes message text; Transcript/Full-saved state that private content can be included before download; preview names mode/part flags, missing binary and planned omissions; sanitization no stronger claim than source reality. No automatic redaction or falsely "safe to publish." An optional DLP/redaction feature is a **separate product decision**; copying raw message content into GitHub tests is prohibited.

### Q04 — Exact part deep links: integration test, not new search

**Observed newer than tracker:** [world-search.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-search.mjs) `attributedPartPath` ~85 and hit emission ~297; [world-view.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs) `partFrameOf` and `openHit` focus path. [world-search.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-search.test.mjs) checks unique versus ambiguous source; [world-ui-find.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui-find.test.mjs) checks UI consumer. These two suites do not themselves prove **same result travels through real endpoint into view**.

**Deliverable:** a cross-surface test using the existing stub runtime / real HTTP, asserts the server result includes `[blockIndex]` only when uniquely attributable; passes the real emitted hit into the normal Find UI; target specific frame; fallback to message with explicit explanation when unmatched. Re-imported messages must refer to their local imported conversation/message IDs.

### Q05 — Source-linked citations (native fidelity)

**Observed:** [chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs) already implements qualified reported-versus-inferred `replySources` and inline numbered citations; `world-view.mjs` fallback does not project all saved citation artifact shapes equivalently. Use actual saved `DOM_TURNS` shape first: if source evidence has no link, don't invent a URL.

**Pass:** known citation displays source number, title, href and basis when available; absent URL is a nonclickable "source not saved"; prohibited schemes inert; imported provenance never portrayed as site-verified; unknown blocks remain safe.

### Q06 — Artifact/project fidelity (avoid invisible bytes)

**Observed:** [chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs) supports site-reported text artifacts and browser-triggered text download; `world-view.mjs` explicitly labels unknown/file/image content and does not fetch file bytes. **Do not add a second artifact store by default.**

**Pass:** a saved local text artifact can be inspected/copied/saved as a project selection with source link; a missing-file byte source remains "not stored" after import. Asset-binary preservation requires separate owner decision if genuinely needed in first release.

### Q07 — One actual Workspace workflow

**Observed:** current `world-view.mjs` Workspace is a peer with read pane and relationships. [world-ui-workspace.test.mjs](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-ui-workspace.test.mjs) covers reading, stale requests, chips, focus and dead ends via fake DOM, **not** user-initiated end-to-end selection and project attachment. [world-service.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs) already provides selection and project edit APIs.

**Pass:** from a saved conversation block, create a selection; save to project; attach a note; navigate Workspace from either selected object; find it again; follow exact source pointer. No pre-constructed test-only selection.

### Q08–Q10 — Proven physical durability, confidentiality and accessibility

**Q08:** tests reopening a service in-process do not prove OS restart. Bound a new test helper that starts/shuts full Studio, reopens same persistent temporary root in a **separate Node process**, and checks no source modification. Be careful: the user's real Windows data root is never a test destination.

**Q09:** security's correct posture is **informed selection, declared omissions and nonleaking defaults**, not claiming arbitrary provider text can be reliably scrubbed. Threat model includes secrets in URL path, body strings, imported fields, manifest metadata and snippets. Test fixture uses known fake secrets only; no external network. Owner decision required before creating automatic body redaction.

**Q10:** no Playwright/Puppeteer. Browser proof can be manual/screen recorded or use existing sanctioned native Chrome/CDP control for observation, **never a second live browser governor**, and only with explicit owner scope for effects.

## Recommended executable test commands (engineer checks active local test ownership first)

```powershell
# In C:\0-BlackBoxProject-0\vivim-harness only; do not assume AION cloned.
git status --short --branch
git rev-parse HEAD
node scripts/architecture-inventory.mjs --check
node --test test/unit/world-search.test.mjs test/unit/world-ui-find.test.mjs
node --test test/unit/world-import-hardening.test.mjs test/unit/world-provider-url.test.mjs
node --test test/unit/world-transfer.test.mjs test/unit/world-restore.test.mjs test/unit/world-ui-transfer.test.mjs
node --test test/unit/world-service.test.mjs test/unit/world-ui.test.mjs test/unit/world-ui-workspace.test.mjs
node --test test/unit/world-journeys.test.mjs
# Only once effects/side-effects are understood:
npm test
# npm run test:e2e requires separate review of what it touches.
```

The above are **planned commands**; not executed by the Product Agent. They are useful because they reuse existing code paths and avoid inventing redundant QA frameworks.

## Owner decisions that should not be disguised as local tasks

1. **Which task lane is OpenCode currently authorized to run?** WORLD versus explicit current PROVIDER `PROMPT.md`. No unilateral context switch.
2. **Are locally saved artifact bytes a hard V1 requirement?** Current owner P1 journey explicitly values original artifact references, but actual binary storage was never fixed as a technology contract.
3. **Should exports default to a more conservative content mode or require stronger confirmation?** Modes currently exist. Choice needs user value/privacy balance, not automatic ungrounded "DLP solves it" claim.
4. **Should C10/C11 be mounted now?** C10 preview-only; C11 read-only under explicit allowed root. This is not mandated to complete four journeys.

## Model thinking / execution allocation

- **Instant:** status receipt formatting, fetching known paths, comparing SHA/missing files.
- **Medium:** one bounded UI/test correction (Q02, Q04, Q10) once exact code owner agrees.
- **High:** rich-content source/identity integration, Q01 actual acceptance, Q03/Q09 privacy tradeoffs and conflicts.
- **MAX architecture decision:** W01 ID authority, large asset-store choice, consent/effect boundary, source-truth changes. Do not delegate irreversible choice to an unscoped cheap supplier.

**Closure:** 12 dispatchable/decision entries with actual source/tests, pass/fail criteria and local/nonlocal boundaries. No local model work consumed, no other agent launched, no source modified.
