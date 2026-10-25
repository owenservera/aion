# P4 — Harness Reality Audit and Local Verification Handoff

**Date:** 2026-10-25 · **Owner:** PRODUCT AGENT, P4 only · **Verification scope:** connected GitHub `owenservera/vivim-harness` default-branch source, not the user's Windows PC. **Status:** remote source inspection complete; local execution **NOT RUN**; no production change. **Effort:** HIGH remote audit / MAX local architecture check reserved to owner and local models.

## Executive truth

This P4 is **not** a genuine local-machine audit, because the current ChatGPT session has no direct user-PC shell, local working tree, browser profile, stored captures or installed runtime. It establishes a **read-only remote baseline and executable local inspection instructions**, marks missing proof honestly, and identifies current integration seams for agents. No claim of a passing current full suite, a successful import/export, or an installed beta is made.

Related product contracts: [P1 shape](../../P1-V1-PRODUCT-SHAPE-2026-10-25.md), [P2 data authority](../data-knowledge/P2-DATA-KNOWLEDGE-CONTRACT-2026-10-25.md), [P3 journeys](../experience-acceptance/P3-EXPERIENCE-AND-INTEGRATION-MAP-2026-10-25.md).

## Source-real inventory

| Area | Directly inspected source | Confirmed source-level behavior | What is NOT proven |
|---|---|---|---|
| App runtime | `src/studio/server.mjs` blob `e3e839c1557b193319cfaf879c84605ed2aec720` | Loopback-only local HTTP Studio, static UI, JSON API and integration hub dispatch; token mode optional; basic Host/Origin checks | Installed Windows startup, cross-device access, personal-world app acceptance |
| Integration API | `src/studio/integration-hub.mjs` blob `35c2194a7245cb99aa3f58e4c8baf7c6086097a7` | `GET /api/v1/sessions`, session metadata/datasets/receipt/observation/replay/knowledge/continuity and `/api/v1/search`; source contains additional derived artifacts/graph/timeline endpoints | Durable **workspace/project/user-note** endpoints not found in inspected route definitions; exhaustive repo-wide absence not established |
| Live conversation | `src/studio/conversation-api.mjs` blob `5bc123a5ef2008071cd3d4597d042f3a066acde2`; `src/capture/conversation-runtime.mjs` blob `8aa8d1ff8592e309e3da46f1da027669ad489616` | Validated connect/submit/reconcile/read lifecycle against active bound provider target | Independent saved **offline** conversation reading object |
| Chat surface | `src/studio/ui/chat.mjs` blob `7797d1237d0ff5f846f39c9a8228cee92ec79c3f` | Same-origin `/api/v1` calls, source/reply/send labels, selected-state client key | Local-first four-journey VIVIM library/project/search/export journey |
| Native content | `src/studio/ui/universal-chat.mjs` blob `0237ee33c4c3ff1683f71195bf8b1675437a8dea` | `projectWorkspace`, source-qualified and opaque native block rendering, client projection and conversation store | Cross-restart source-preserving archived rich content and missing asset coverage |
| Evidence custody | `src/store/session.mjs` blob `cbbd469ed345720b63a8d71ec5ffdbe13cc11de4`; `src/store/raw-log.mjs` inspected in P2 | Raw segments, datasets, KV, session metadata, manifest and explicit dropped-record gaps | Human-authored project storage, source→personal object linkage on actual captures |
| Search and identity | `src/intel/search.mjs`, `identity.mjs`, `continuity.mjs` | Lexical index; identity resolution and conservative scoped continuity | Saved personal notes indexed; user-facing coverage/deep links verified |
| Export | `src/export/export.mjs` blob `153236fe122ee62ed949b7fdc1e891d9ce463f15` | Read-only session transcript/dataset/knowledge/graph and manifest bundle export helpers | Selection-aware personal workspace **import/restore**, safe asset inclusion, collision outcomes |
| QA/agent contract | `package.json` blob `dfc613ec2c0961de3bb4850ff9a298a96f712bbd`, `AGENTS.md` blob `c946a6271cdca1408471f14812d20fe8fd5a789d` | Node test scripts, selftest, Windows PowerShell Chrome helper, architecture inventory requirement; Windows local master declared | Current installed versions, present test pass count, actual local path/readiness |

**Important distinctions:** a search endpoint is not a complete user search product; a raw capture session is not a saved editable personal conversation; an export bundle is not a verified import; a `projectWorkspace` UI function is not durable workspace functionality. **Those are gaps in acceptance evidence and observed route coverage**, not proof they cannot be implemented cheaply.

## P1–P3 integration gaps — source-based classification

| Product capability | Current evidence | Classification | Next proof required | Effort |
|---|---|---|---|---|
| J1 rich local reading | Renderer + raw capture + conversation lifecycle | **Partial primitives** | Offline fixture reading full message order and opaque parts, restart | HIGH |
| J1 stable identity | Conversation state and thread parser | **Partial/uncertain** | Explicit local ID vs capture session vs provider key across two accounts | MAX / HIGH |
| J2 project, bookmark, note | Existing Studio surfaces; no inspected first-class project endpoint | **Not demonstrated** | Durable create/link/edit/unlink against same source, restart | HIGH |
| J2 source immutability | Append-only evidence and versioned store | **Good substrate** | User edit never mutates original raw segment; checksum proof | MAX / MED |
| J3 source search | `/api/v1/search`, lexical index, corpus provenance | **Partial** | Index local user notes and source content with exact deep links and explicit coverage | MED/HIGH |
| J4 export | Captured session/bundle helpers | **Existing for sessions** | Choose a project and preview only selected personal-world objects | HIGH |
| J4 import | No source observed in focused export API | **Unverified/missing from inspected interface** | Clean-profile restore + repeat-import conflict handling | HIGH/MAX |
| G5 stable integrated local world | No single-journey proof supplied | **Not verified** | Full J1→J4 service/UI test on real local persisted state, restart, corruption & privacy | HIGH |
| G6 browser connectivity | Existing CDP and live conversation actor | **Pre-existing subsystem** | No new Chrome work until G5. Separate owner-authenticated Windows acceptance | HIGH later |

## The local-only inspection handoff (not executed here)

Run in **PowerShell on the owner's actual Windows repository**, with a local model if useful. **Read-only first**. No install, task creation, service launch or Git mutation required for inventory. Do not run tests known to initiate browser effects without reviewing them first.

```powershell
# Substitute the actual path; do not assume a particular drive or WSL.
Set-Location 'C:\PATH\TO\vivim-harness'
git status --short --branch
git rev-parse HEAD
git remote -v
node --version
npm --version
Get-Content .\package.json
Get-ChildItem .\src\studio, .\src\store, .\src\capture, .\src\intel | Select-Object DirectoryName,Name
Get-ChildItem .\test\unit -Filter '*.test.mjs' | Measure-Object
Get-ChildItem .\test\e2e -Filter '*.test.mjs' | Measure-Object
```

Additional **read-only evidence inventory** (do not dump private content to GitHub):
```powershell
# Inspect configuration locally to determine actual data directories; do not print secrets.
Get-ChildItem .\src -Recurse -Filter '*.mjs' |
  Select-String -Pattern 'sessionsDir|dataDir|captureDir|paths.sessions' |
  Select-Object -First 70 Path,LineNumber,Line
# Report counts/sizes and schema names only for actual on-disk sessions.
# Keep private transcripts, browser profiles, cookies and tokens on the local machine.
```

Then *only with local operator approval and a reviewed, non-effectful test list*, run:
```powershell
node scripts/architecture-inventory.mjs --check
npm test
# Assess whether npm run test:e2e has any browser or side effects before running it.
```

**Local report required back (no sensitive data):** exact checkout path, `HEAD` SHA, dirty/clean status, Node/npm version, available data-dir paths **as relative or redacted** identifiers, session counts and approximate sizes, unit/inventory test results with failed test names, existing API routes that demonstrably operate, browser-related tests explicitly not run, and a list of environment-specific blockers. Never commit local user captures, credentials or full machine identifiers.

## Critical reality questions for local model

1. Which exact data directories and data formats are actually present? Do local captures include a rich multi-turn session with evidence receipts or gaps?
2. Can the current app open a completed saved conversation **without a live exact provider binding**?
3. Are projects/notes/bookmarks persisted somewhere not exposed in the inspected Studio routes? Name exact source and test, or say none found.
4. What is the current local-source fidelity for messages, code, citations, files, unknown parts and order?
5. Are `/api/v1/search` results complete for saved sessions only or do they already cover personal annotations?
6. Does any module or CLI support secure **import** into a clean personal world? Verify actual code, no inference from export helper.
7. Are existing capture and operational journal storage isolation guarantees valid across process interruption and concurrent access?
8. Do packaging/Windows file semantics change expected integrity tests or lock behavior?
9. How does local Windows master compare with current GitHub `main`? Are there unpushed branches or code that materially changes this map?
10. What is the quickest **working vertical slice** of J1→J2→J3→J4 given exact local realities? Submit observable proof, not a redesign.

## Integration-agent packaging and decision boundaries

The actual integration agents need a machine-readable join:

`capability_id → product_journey → source_files/functions/routes → evidence_grade → local_proof → known_gap → dependency_on_other_capabilities → complexity_tier → owner → acceptance_test → workshop_choice`.

The existing [116-signal atlas](../../discovery/VIVIM-CAPABILITY-ATLAS.yaml), [18-cluster crosswalk](../../discovery/V1-VALUE-CHAIN-CROSSWALK.yaml), [P2 semantic contract](../data-knowledge/P2-DATA-KNOWLEDGE-CONTRACT-2026-10-25.md) and [P3 acceptance map](../experience-acceptance/P3-EXPERIENCE-AND-INTEGRATION-MAP-2026-10-25.md) supply those facets; **P5** can consolidate once local truth arrives. No silent promotion from **not demonstrated** to **missing from entire codebase**.

## Closure

**P4 remote portion complete:** GitHub-source verified code paths/routes/capabilities; checked against P1–P3; explicit local execution checklist and pending evidence. **P4 local-machine portion BLOCKED/NOT EXECUTED:** no access in this session. P5 synthesis remains unstarted, as does Z.ai implementation. No source edit, tests, branch changes, background agent or local operation was performed.
