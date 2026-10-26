# VIVIM Remote Preparation — 01 Integration Control Pack

**Created:** 2026-10-26 · **Authority:** AION Product Agent, Role 15 · **Target implementation:** [`owenservera/vivim-harness`](https://github.com/owenservera/vivim-harness) · **Local master:** `C:\0-BlackBoxProject-0\vivim-harness` · **Status:** GitHub-source verified control/dispatch document, **not** an implementation or tests-run receipt.

## 1. Mission and two distinct task lanes

**Lane WORLD (this pack):** deliver the P1–P5 **RETURN → ORGANIZE → FIND → TAKE** personal-world outcome as one coherent app. Work W00–W12, with browser-independent local runtime acceptance G5; C10/C11 are explicit independent decisions; new browser enhancements W13 deferred by this lane.

**Lane PROVIDER (separate active-scope candidate):** [Harness `PROMPT.md`](https://github.com/owenservera/vivim-harness/blob/main/PROMPT.md) explicitly requests three real provider-native turns (ChatGPT, Claude, Gemini), fixes to deferred first-turn capture and successive sends, and real Windows/provider proof. That document is **real and source-verified**, not imaginary or redundant. It may reflect an active later owner assignment. **This pack does not revoke or deprioritize that owner task.** A local agent already executing PROVIDER should continue within the authorization it was given. An agent assigned WORLD must not silently switch lanes simply because PROMPT.md exists.

**When a work request conflicts:** current explicit owner instructions for that agent/session outrank historical planning documents; `AGENTS.md` is the repo engineering/safety baseline; `PROMPT.md` governs an explicitly selected provider-test lane; P1–P5 govern an explicitly selected personal-world lane. If current owner intent is not known, report the conflict, avoid irreversible actions, keep active work intact, and perform source-only non-destructive work. **Never amend AGENTS.md or PROMPT.md unilaterally from this pack.**

## 2. Repository inventory and authoritative files

| Surface | Role and ownership | Implementation locations | Source evidence |
|---|---|---|---|
| Engineering contract | Windows local master; one browser effects owner; no Playwright/Puppeteer; no second parallel store or UI | [AGENTS.md](https://github.com/owenservera/vivim-harness/blob/main/AGENTS.md) | Direct GitHub read, 2026-10-26 |
| Provider lane prompt | Live 3-provider multi-turn and deferred capture fixes | [PROMPT.md](https://github.com/owenservera/vivim-harness/blob/main/PROMPT.md) | Direct GitHub read |
| World backend | World records, source-limited conversations, project/note/selection routes | [src/studio/world-service.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-service.mjs) | `createWorldService`, `registerWorldRoutes` inspected |
| World relationships | Qualified source/identity, selections and graph | [src/studio/world-relations.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-relations.mjs) | Direct GitHub read |
| Search | Read-only bounded transient index, part attribution, source qualification | [src/studio/world-search.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-search.mjs) | `attributedPartPath` and `registerWorldSearchRoutes` inspected |
| Transfer | Selected export, scopes/modes, validate/dry-run/confirm/restore, collision receipts | [src/studio/world-transfer.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-transfer.mjs) | Direct GitHub read |
| Provider URL | World read/export/import projected URL sanitizer | [src/studio/world-url.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/world-url.mjs) | Source directly inspected |
| World UI | Existing `/chat` integrated Saved, Projects, Notes, Find, Transfer, Relations, Workspace peers | [src/studio/ui/world-view.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/world-view.mjs), [chat.html](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.html) | Source + committed synthetic-DOM tests |
| Existing rich renderer | Text, code, table, links, citations, source rows, artifact text download | [src/studio/ui/chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs) | `createRichRenderer`, `replySources`, `replyArtifacts` directly inspected |
| Native content projector | Typed provider block inspection and grounded/unknown provenance | [src/studio/ui/universal-chat.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs) | Direct GitHub read |
| HTTP integration hub | Single app API ownership and world-route registration | [src/studio/integration-hub.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/integration-hub.mjs) | Registers `registerWorldRoutes`; C10/C11 **not** mounted |
| Persistence/evidence | Raw `Session`, versioned user overlay, provenance and replay | `src/store/session.mjs`, `versioned.mjs`, `raw-log.mjs`; `src/replay/` | P2/P4 source-backed |
| Commands C10 | Safe preview-only local intent catalog, no execution | [src/studio/commands.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/commands.mjs) | Code committed, unmounted |
| Agentic files C11 | Bounded read-only instruction-file inventory, no execution | [src/studio/agentic-files.mjs](https://github.com/owenservera/vivim-harness/blob/main/src/studio/agentic-files.mjs) | Code committed, unmounted |
| Engineering tests | World journeys, search/import/URL security and UI | `test/unit/world-*.test.mjs` | Source and recent repo-specific per-suite receipts, **no full acceptance** |

## 3. Single canonical dependency path: do not build parallel systems

- **World reads:** `Session + DOM_TURNS → world-service → world-search/world-relations/world-transfer → integration-hub routes → world-view inside /chat`. Maintain source/foreign identity qualifiers and availability markers.
- **User edits:** `world-service / world-relations → VersionedStore` with optimistic version/CAS. Do not overwrite raw capture, don't conflate native provider account, observed session and imported record IDs.
- **Search:** `world-search` already reuses `src/intel/search.mjs` and deliberately builds an ephemeral index per query. Don't introduce a new index database just because C07 was historically partial.
- **Rich rendering:** use `world-view.mjs` adaptation and `createRichRenderer` rather than importing an entire separate React app.
- **Transfer:** extend `world-transfer.mjs`, keep validation, manifest, import custody and partial-result contracts. Don't replace it with an unrelated exporter.
- **Chrome:** `src/cdp/` + conversation runtime remain sole browser I/O owner. Never introduce competing automation or Playwright/Puppeteer.
- **C10/C11:** an agent may inspect their integration seams, but mounting is a **permission/scope decision**, not an automatic next step. C10 preview grants no side effect; C11 read-only inventory must restrict roots.

## 4. Master-map reconciliation

**Source of scope:** [P1](../P1-V1-PRODUCT-SHAPE-2026-10-25.md), [P2](../specialists/data-knowledge/P2-DATA-KNOWLEDGE-CONTRACT-2026-10-25.md), [P3](../specialists/experience-acceptance/P3-EXPERIENCE-AND-INTEGRATION-MAP-2026-10-25.md), [P4](../specialists/local-reality/P4-HARNESS-REALITY-AUDIT-2026-10-25.md), [P5](../P5-V1-INTEGRATION-MASTER-WORKLOG-2026-10-25.md); machine register `../P5-V1-INTEGRATION-WORKLOG.yaml`.

**Latest observed source:** recent Harness indexed `32b7021` (PROMPT docs), `01c290a` (Workspace UI fixes), `fb783cb` (provider URL sanitization), `1b59837` (peer Workspace), `bb9b025` (message-hit `partPath`). **Harness's `docs/track/worklog.yaml` and `docs/track/crosswalk.yaml` lag these commits** and should remain historical until updated by their tracker owners. P5 machine register was created as `OPEN` and is a task identity map, *not* an accurate live state feed.

| W IDs | Current code reality | Priority and scope |
|---|---|---|
| W00–W02 | baseline, local scoped identity and fixture-level saved conversation reading exist | source-qualified; process restart and real saved owner data remain unproved |
| W03–W04 | typed/mixed rich block adaptation, unknown fallback, source coverage labels | native fidelity and derived provenance need focused closure |
| W05–W06 | projects/notes/relations and CAS exist; newer Workspace reader improves navigation | one-click selection/association and genuine edit usability need acceptance |
| W07 | `attributedPartPath` **now produces** exact top-level `partPath` for unique matches; UI consumes it | stale "dormant" tracking is false for latest source; end-to-end test still pending |
| W08 | graph map/Relations partially integrated | optional for first delivery; no new graph engine |
| W09–W10 | selected export modes and clean restore/receipts exist; URL security hardened | actual browser file-flow and content sensitivity remain open |
| W11 | Workspace peer reader and review fixes committed | real layout/keyboard/readability not browser accepted |
| W12 | J1–J4 fixture and HTTP tests; not full process/browser acceptance | **highest release risk**; do not declare done |
| W13 | browser subsystem exists; new WORLD lane browser work deferred | **PROVIDER lane explicitly different** |
| W14 | preview C10 and read-only C11 in code, **both unmounted** | intentional decision held for owner |

## 5. Evidence grades — critical

- **S0** source-read: an exported function, route, or commit was verified; no execution.
- **T0** test module/fixture in-process.
- **T1** synthetic DOM (hand-built fake, not Chrome).
- **T2** real local loopback HTTP endpoints, but stubbed capture runtime and fake data.
- **T3** independent host OS process, real browser UI or real saved-owner-data (qualify subdimensions).
- **T4** controlled authenticated provider-native roundtrip and captured external evidence.

The GitHub tracking file claims focused test passes at an earlier SHA; **this remote pack did not run tests.** No S0/T0/T1/T2 result proves T3/T4. Never infer tests from commit titles.

## 6. Safe dispatch protocol

The local Windows checkout is the only master. GitHub is task and receipts transport. Do **not** turn these documents into a competing orchestrator or auto-start subagents.

For each work item, send: `W-ID, owner/session, exclusive write paths, base SHA, WHAT, WHY, WHERE, one objective done criterion, proof-tier, exact tests, blocked/conflict status`. Source freshness check is **inside the work item**, not an hour-long PC audit. Assign only after verifying no other local agent owns those files. Remote prep in AION should not update active Harness source/docs unless separately assigned.

**Minimal return-to-local prompt (HIGH):**

> `#VIVIM-HARNESS @LOCAL +/EXECUTE` — Continue the authorized lane currently active in your Windows OpenCode session; **do not switch from PROVIDER to WORLD silently**. Read the AION Role 15 remote prep documents at `workspace/aion/sessions/roles/15-product-to-market/remote-prep-2026-10-26/` directly on GitHub (AION need not be cloned). Reconcile any relevant W item against today's Harness code before making changes. Implement only the next high-value, nonconflicting increment using existing modules. Preserve current Git tree and browser state, run appropriate focused tests, and report SHA/proof tier; don't claim a live/browser pass from synthetic tests.

## 7. Explicit protections

- Keep personal captures/secrets off GitHub; do not expose entire local machine paths in receipts.
- Do not rewrite `AGENTS.md`, `PROMPT.md`, `docs/track/worklog.yaml` as part of remote prep.
- Never stage `clone-tmp/`, uncontrolled `PROMPT.md` or unreviewed local captures.
- No wholesale React frontend transplant, second authority store, browser governor, CDP client, export engine or command executor.
- Treat BUILD/ADAPT/HARVEST assessments in the donor map as **recommendations, not owner-approved migrations**.
- Preserve the existing explicit provider lane task; if owner wants WORLD first, that change must be made explicitly in the local session.

**Closure:** integration authority and boundaries articulated, canonical modules and known conflicts identified, no code changes or tests. See companion fidelity and closure queue docs in this same folder.
