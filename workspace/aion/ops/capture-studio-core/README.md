# Capture Studio — Core Agent

**Role:** Primary product engineer. **Status:** ownership scaffold for next bootstrap, 2026-10-21.
**Source:** `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`
**Sprint checkpoint:** `workspace/aion/ops/capture-studio-build-sprints/STATE.json`
**Architecture/leverage map (canonical Core JSON):** [LAYERED-CAKE.json](LAYERED-CAKE.json) — seven core layers, four cross-cutting threads, ten leverage points, separate operational foundation, source-grounded status at pinned GitHub SHA. Treat design as diagnostic rather than prescriptive; refresh assessment against latest source before treating it as current.

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
