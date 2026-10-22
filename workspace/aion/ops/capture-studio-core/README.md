# Capture Studio — Core Agent

**Role:** Primary product engineer. **Status:** ownership scaffold for next bootstrap, 2026-10-21.
**Source:** `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`
**Sprint checkpoint:** `workspace/aion/ops/capture-studio-build-sprints/STATE.json`
**Architecture/leverage map (canonical Core JSON):** [LAYERED-CAKE.json](LAYERED-CAKE.json) — seven core layers, four cross-cutting threads, ten leverage points, separate operational foundation, source-grounded status at pinned GitHub SHA. Treat design as diagnostic rather than prescriptive; refresh assessment against latest source before treating it as current.

## Negative Space Programming — Pass 1

[NSP Pass 1 contract, evidence and next handoff](NSP-PASS-01-2026-10-22.md). CORE's shared `src/core/invariants.mjs` defines eight correctness rules; NSP-003 and NSP-004 are newly enforced in temporal revision folding, graph entity ID handling, and derivation receipts. No new auth/permission, redaction, worker or database layer. A violating **derived projection** can be marked partial while the owner's raw observations stay intact. The remaining epistemic/provenance work is scoped to CORE integration with the L4/L5 specialist; UI owns any visualization. Native Node and Windows execution remain separately unverified.

## Own
- Capture/replay, evidence, entities, identity, semantics, temporal graph, continuity, persistence and correctness.
- CLI commands and machine-readable contracts.
- Local server, authentication, API contracts and backend implementation.
- Core integration, high-leverage product components, and backend-facing fixes.

## Do not own
- New UI screens, visual design, client-side state or frontend refactoring: **UI / Client Integration agent** owns those.
- Independent systems/algorithms/usability research: **Systems lane** owns analysis, not implementation.
- Do not hand off or gate ordinary development on QA unless the owner explicitly directs it.

## Coordination
- Keep existing Studio UI functioning, but avoid extending/refactoring it except a minimal critical compatibility/security fix; make such exceptions explicit.
- Own the server-side API meaning and data integrity. UI agent may own frontend adapters and use mocks; API changes require a concise contract proposal, not silent competing server edits.
- GitHub is the record; use small, scoped commits and preserve concurrent agents' work. No forced cross-lane workflow or model switching.
- User's latest directive overrides older phased workflows and QA ownership text.

**Standing pull queue:** [CONTINUOUS-QUEUE.md](CONTINUOUS-QUEUE.md). After each completed delivery, update verified evidence and pull the first unblocked NOW item; refresh against current main and avoid duplicate work.

## Fresh bootstrap
Read current repository governance and actual Core source, Sprint 02 mission/checkpoint and relevant recent commits. Reconcile stale historical plans with current code; continue primary Core work independently. Report implemented vs unverified honestly. Do not infer that a GitHub commit wakes another agent.

**Sibling lane:** [Systems / Algorithms / Usability](../capture-studio-systems/README.md).


## Sprint 02 — continuity CLI/API contract (source-level, not independent QA acceptance)

**Canonical implementation:** `src/intel/continuity.mjs:buildSiteContinuity`. CLI: `bin/studio.mjs`; authenticated loopback API: `src/studio/server.mjs`. This contract documents current behavior and exact limitations. Keep clients backward compatible unless Core and UI explicitly coordinate an API revision.

### Inputs

- CLI: `studio continuity <id|latest> [--eid ID] [--at ISO] [--limit N]`. The CLI defaults to **20** displayed entities, prints a human-readable summary/list, and emits the selected entity **array** as JSON when `--eid` is supplied. It does **not** promise whole-view JSON output.
- HTTP: `GET /api/sessions/:id/continuity?eid=ID&at=ISO&limit=N`. Requires the existing local server authentication and Host/Origin protections. The API defaults to **50** entities. This route is read-only; non-GET is rejected with HTTP 405.
- A real target URL in the selected session metadata is required to derive site scope; a label alone is not enough. The site is currently the registrable-domain approximation returned by `siteOf(host)`, **not** verified account or tenant identity. An unavailable target site gives CLI exit code 2 / API HTTP 409.
- `at` is optional. It accepts a parseable timestamp string (normally an ISO 8601 datetime), a ten-digit Unix-seconds string, or 11–13 digit epoch-millisecond string; internally reported timestamps are Unix **milliseconds**. An invalid provided `at` gives API HTTP 400; the CLI reports an error. No `at` means latest known derived revisions, **not** a complete historical truth claim.
- `limit` affects returned entities **after** scanning the chosen site's stored sessions, not corpus coverage. Valid positive integral limits are capped at **1,000**; invalid limits fall back to 50 inside the shared builder. Use `eid` to select an entity by its stable origin-qualified `id` or its underlying bare EID. A requested `eid` causes history to be included in the returned entries.
- The CLI list view also prints up to **10** review-only possible type-drift hints (when present). It never merges them or changes identity; the API returns up to **25** candidates in `typeDriftHints`. The API may report more candidates in its statistics.

### HTTP response

```json
{
  "site": "example.com",
  "asOf": null,
  "entities": [],
  "typeDriftHints": [],
  "stats": {
    "site": "example.com",
    "sessionsDiscovered": 0,
    "sessionsWithDerivedKnowledge": 0,
    "sessionsWithoutKnowledge": [],
    "sessionsWithDerivationError": [],
    "sourceEntities": 0,
    "keylessOrUnsafeIsolated": 0,
    "untimedRevisions": 0,
    "missingRevisionValues": 0,
    "joinedEntities": 0,
    "entitiesTotal": 0,
    "returned": 0,
    "truncated": 0,
    "typeDriftHintsTotal": 0,
    "typeDriftHintsReturned": 0,
    "typeDriftHintsTruncated": 0,
    "typeDriftVariantsOmitted": 0
  },
  "limitations": []
}
```

Illustrative shape only, **not** a recorded runtime response. For each returned entity, the source emits `id`, `eid`, `type`, `typeName`, `scope`, `origin`, `key`, `keyField`, `identityBasis`, `confidence`, `confidenceBasis`, `sessions`, `sessionCount`, `observations`, `revisions`, `timedRevisions`, `untimedRevisions`, `firstT`, `lastT` and `attrs`. `history` is optional and contains `session`, `sid`, `seq`, `domId`, `t`, `changed`, `values` and `provenanceBasis` per revision.

### Identity, time and completeness rules

- Cross-session joins require the **same exact browser origin** (scheme + host + port), inferred site, inferred model key field, type, actual usable key and EID. A shared registrable site alone **does not justify joining different origins**. Unknown origins, keyless, missing-key, empty-key and ambiguous inferred-key placeholder entities remain session-local. The previous 2026-10-21 Core fix rejects literal `undefined`, `null`, and `NaN` values conservatively as ambiguous; a legitimate literal matching those strings will be deliberately under-joined.
- Session-local entities are identified by `<session-id>::<eid>`; exact joined keyed identities now use the stable, origin-qualified `<origin>::<eid>` `id`. Bare `eid` remains unchanged and accepted as a filter for compatibility. The `eid` filter can return multiple entries when underlying EIDs collide; clients should use the full `id` to distinguish them. This intentionally tightens the previous site-only public ID assumption and may change `id` fields for previously joined entries, without migrating persisted EIDs.
- An `at` query includes **only** recorded revisions with timestamps at or before `at`. Missing timestamps do not establish earlier state; absent fields and missing sessions do not imply deletion. Folded `attrs` contains the observed revision values, not inferred retractions.
- A current-view entity may carry an untimed/empty state; count fields and limitations must remain visible. Multi-session identity confidence is **null** (uncalibrated), never a fake probability.
- `sessionsWithoutKnowledge` includes sessions without successful MODEL **or** without an entities dataset. `sessionsWithDerivationError` records known errors. A successful empty dataset is different from missing derivation. `stats.entitiesTotal` counts entities after the as-of filter, before `eid` and `limit`.
- The view recomputes from extant sessions; deletion or rederivation changes subsequent results. It has O(total derived entities and revisions) scan cost. No persistent cross-session index, cross-session keyless matching, **automatic** type rename alignment, proof of same-origin tenant isolation, or explicit retractions are supplied.
- `typeDriftHints` is a review-only projection: same origin and key-field/value, different inferred type IDs in disjoint session sets, matching type names with a shared field or at least 60% field-name Jaccard overlap with two shared fields. Each hint returns two candidate references with source session/seq/sid/DOM/time and the `structuralFieldOverlap` score (a **descriptive overlap, not identity confidence**). No merge or learning happens. Hints are bounded to 25 results and 32 type variants per repeated key; `typeDriftHintsTruncated` and `typeDriftVariantsOmitted` disclose analysis limits. When an `at` filter is supplied, only visible timed revisions contribute.
- Same-origin multi-tenant sites can still reuse identifiers: origin scoping is a conservative improvement, **not** reliable tenant recognition. Full tenant identity requires explicit capture context or confirmed application semantics rather than speculative URL-path matching.

**Change/risk boundary:** Core commits `97463264` and `ca0512e2` tighten joins and add read-only drift hypotheses without rewriting raw/derived data or EIDs. The new origin-qualified response `id` is deliberately stricter than the previous site-only `id` (the underlying `eid` filter still works). UI client rendering remains the UI lane's responsibility; no UI source was edited. Existing within-session identity collisions are not repaired. Further key/tenant semantics or migrations require evidence and review. Independent QA at the new commits is pending.


## Sprint 03 — additive trust contracts (2026-10-21)

Source details and receipts: [SPRINT-03.md](SPRINT-03.md). These contracts are committed but not independently accepted on Windows.

- **Missing/invalid keys:** New derivations emit a separate `:p:` provisional EID for each observation whose inferred key cannot be used; `method: "provisional"`, `idBasis: "missing-key-observation"`, `key: null`, `confidence: null`. These entities never join across sessions. Legacy duplicate EIDs are isolated in the continuity response and counted as `stats.legacyEidCollisions`; old serialized graphs require an explicit rederive to repair older collisions.
- **Knowledge outcome:** `KNOWLEDGE_STATUS` is a separate persisted KV record, schema `capture-studio.knowledge-status/1`. `status` is `deriving`, `complete`, or `failed`. A completed status includes `entityCount`, `typeCount`, `completedAt` and `entitiesDatasetPresent`; failed includes `stage` and `error`. The record is written as `deriving` **before** a rebuild, then finalized after successful knowledge writes. A valid empty result has `status: "complete"` and `entityCount: 0` even without an entities JSONL file.
- **Read-only API:** Existing GET session details include optional `knowledgeOutcome`. `GET /api/sessions/:id/knowledge-status` returns the persisted record or `{ "status": "legacy-unverified", "note": "No versioned derivation outcome marker" }`; non-GET returns 405. Both use existing local authentication and Host/Origin controls.
- **Continuity completeness:** Adds `stats.sessionsSuccessfulEmpty` (ID array), `stats.sessionsIncompleteKnowledge` (objects containing `session` and `reason`), `stats.sessionsLegacyUnverified` (ID array), and `stats.legacyEidCollisions`. Count-mismatched and unparsable entity JSONL is excluded as incomplete. For existing client compatibility, `sessionsWithoutKnowledge` also contains incomplete IDs; **do not sum the two fields** as independent counts.
- **Historical removal:** A revision may explicitly contain `removed: ["field"]`. Graph and longitudinal historical folds delete only these named fields at the revision timestamp; ordinary absence leaves the last observed value. This is a representation primitive, **not** an API that creates removals or infers source deletions.
- **Identity migration boundary:** Existing valid string-key EIDs are intentionally unchanged. Numeric `42` vs textual `"42"` keyed EID collision remains an identified risk; a forced global rehash would change derived links, so it is a separately versioned migration decision, **not** a silent part of this sprint.
- **Hosted-subdomain isolation:** Public CLI and API continuity requests now pass the selected recording's exact `origin`; unrelated sibling hosted subdomains are not even listed. `buildSiteContinuity({site, origin})` supports the safe scoped view, while omission of `origin` remains an explicit broader internal audit capability. `origin` is also returned at the top level and under `stats`. This is not a same-origin tenant proof; previous per-origin join guards still apply.
- **Cost:** A selected-EID query still scans saved entities and retains honest global completeness counts; it now avoids folding unrelated histories. V8 mocked-storage measurements are recorded in the sprint; Node filesystem, CI and Windows/Chrome acceptance are not proven.


## 2026-10-22 — Internal rebaseline starting prompt (read-only)

**Paste in this agent's dedicated conversation (recommended ChatGPT thinking effort: High):**

```text
#AION @CORE ∆/SITREP — CAPTURE STUDIO REBASELINE
Read the 2026-10-22 rebaseline section of your current role file and carry it out internally. Produce a source-grounded delta SITREP. Do not launch a build or perform live actions.
```

**Shared rebaseline rules (read-only):** Re-read applicable root `AGENTS.md` and current governance; fetch newest `main` SHA and branch list at start and finish; compare against your own last checkpoint. Check source code, entry points, APIs, tests/receipts and relevant AION agent-to-agent task/communication notes. Read `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/docs/DESIGN-live-drive-studio.md` in full, especially its **later unified-conversation revision and reconciled decisions**, which supersede earlier one-shot-only assumptions. Treat designs as proposals, not shipped features; source and local execution receipts separately. Distinguish **implemented / source-observed / locally demonstrated / independently accepted / proposed / obsolete / blocked**. Inventory source files and physical LOC by layer using `workspace/aion/qa/capture-studio/REPORTING-METRICS.md` and its counter when a checkout is available; otherwise explicitly mark LOC unavailable and avoid estimating it from bytes. Never expose credentials, cookies, private prompts or raw captured transcripts in shared records. **No product edits, test execution, browser actions, live sends, agent wakeups or execution of queues during this rebaseline.** Final answer: short human-readable status table with 🟦/🟪/🟩/🟧/🟥 owner distinctions, delivered vs proposed, top three nonduplicate next actions, dependencies, source SHA and measured/unmeasured metrics.

**Lane-specific assignment:** **Core is paused. Preserve that pause.** Trace the *actual* source contract from Chrome targeting and `src/capture/actions.mjs` / campaign / recorder through raw evidence, stop/flush, verify/derive, accepted/rejected gate, knowledge API and existing CLI. Compare the newer conversation service proposal (target leases, turn journal, no duplicate send, reply correlation, cancellation, finalization) to what is implemented. Identify already fixed defects and remaining cross-module seams without restarting Core. Particularly track cancellation propagation, single verdict authority, clean-data gate G1–G7, family-library eligibility, abandoned recordings, current API routes, credentials/privacy boundaries, unknown versus failed sending and source-version compatibility. Mark proposed design contracts as **not implemented** until source proves them. Reconcile the standing Core queue and L4/L5 specialist ownership; return **parked Core work** ranked for the owner's later resume, including exact interface needs from UI. The rebaseline may update *Core-owned planning notes only* if needed but **must not change source or launch Core development**.
