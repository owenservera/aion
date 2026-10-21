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
- `limit` affects returned entities **after** scanning the chosen site's stored sessions, not corpus coverage. Valid positive integral limits are capped at **1,000**; invalid limits fall back to 50 inside the shared builder. Use `eid` to select an entity. A requested `eid` causes history to be included in the returned entries.

### HTTP response

```json
{
  "site": "example.com",
  "asOf": null,
  "entities": [],
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
    "truncated": 0
  },
  "limitations": []
}
```

Illustrative shape only, **not** a recorded runtime response. For each returned entity, the source emits `id`, `eid`, `type`, `typeName`, `scope`, `key`, `identityBasis`, `confidence`, `confidenceBasis`, `sessions`, `sessionCount`, `observations`, `revisions`, `timedRevisions`, `untimedRevisions`, `firstT`, `lastT` and `attrs`. `history` is optional and contains `session`, `sid`, `seq`, `domId`, `t`, `changed`, `values` and `provenanceBasis` per revision.

### Identity, time and completeness rules

- Cross-session joins require the **same inferred site, type, actual usable key and EID**. Keyless, missing-key, empty-key and ambiguous inferred-key placeholder entities remain session-local. The 2026-10-21 Core fix rejects literal `undefined`, `null`, and `NaN` values conservatively as ambiguous; a legitimate literal matching those strings will be deliberately under-joined.
- Session-local entities are identified by `<session-id>::<eid>`; cross-session exact keyed identities use the EID. The `eid` filter can return multiple session-local entries when their underlying EIDs collide; clients should use the full `id` to distinguish them.
- An `at` query includes **only** recorded revisions with timestamps at or before `at`. Missing timestamps do not establish earlier state; absent fields and missing sessions do not imply deletion. Folded `attrs` contains the observed revision values, not inferred retractions.
- A current-view entity may carry an untimed/empty state; count fields and limitations must remain visible. Multi-session identity confidence is **null** (uncalibrated), never a fake probability.
- `sessionsWithoutKnowledge` includes sessions without successful MODEL **or** without an entities dataset. `sessionsWithDerivationError` records known errors. A successful empty dataset is different from missing derivation. `stats.entitiesTotal` counts entities after the as-of filter, before `eid` and `limit`.
- The view recomputes from extant sessions; deletion or rederivation changes subsequent results. It has O(total derived entities and revisions) scan cost. No persistent cross-session index, cross-session keyless matching, type rename alignment, tenant-isolation proof, or explicit retractions are supplied.

**Change/risk boundary:** The new missing-key guard prevents one kind of false cross-session merge **without** rewriting legacy derived source or EIDs. It does not repair possible within-session collisions already produced by the resolver. A future identity resolver correction needs explicit derived-data compatibility analysis and CORE/UI contract review before migration. Independent QA at the new commit is pending.
