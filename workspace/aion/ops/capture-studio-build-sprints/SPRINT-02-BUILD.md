# Sprint 02 — Engineering decision and implementation record

**Mission:** [SPRINT-02.md](SPRINT-02.md) — continuity of captured knowledge across sessions. **Operator:** ChatGPT temporarily replacing Claude build phases. **Baseline:** 09dd9845. **Status:** implemented first vertical slice, **PENDING INDEPENDENT QA**.

## Source-grounded diagnosis

- The existing `src/replay/derive.mjs` produces a `MODEL`, `GRAPH` and `entities` dataset within **one** session.
- `src/intel/identity.mjs` produces site-scoped keyed EIDs, but its keyless matcher explicitly prohibits joining observations from different sessions.
- `src/intel/graph.mjs:TemporalGraph.stateAt` only sees one graph. Cross-session state/history has no consumer.
- `src/store/session.mjs` already persists per-session source, derived entity revisions, seq and timestamp provenance. Session deletion/rederive are existing lifecycle operations.
- `discover.mjs:buildType` derives type IDs from group+path, and type merging selects a representative based on support. Thus type ID can change when schema or grouping changes. An unsafe "same field name" or "same key value" merge can conflate unrelated records.

## Selected intervention

Build a **read-through, exact-identity longitudinal view** over existing per-session `entities`, rather than immediately adding an append-only per-site database. The view groups entities only if site, semantic type ID, keyed value and EID are exactly compatible. It folds recorded revision values in chronological order with provenance, supports as-of timestamp queries, and is exposed through the existing authenticated loopback API and CLI.

**Why:** makes cross-day keyed identity useful now; needs no second mutable source of truth, copy, migration, hard-to-reverse merge, or unbounded version snapshots. Deleting a session or rederiving it naturally updates the view. It is additive and preserves raw logs.

**Why not the other options first:** cross-session type alignment lacks reliable evidence of equivalence when a renamed field changes type/key identity; temporal validity intervals/retractions need explicit observation semantics; a new Studio editing flow would act on still-uncertain identity. These remain live options, not canceled work. The 400-event interpretation window remains an independently disclosed shortcoming.

## Safety and semantics

- No keyless cross-session joins; no fuzzy merges; no joins if the target site cannot be established from a target URL.
- No timestamp means no historically asserted state; absent fields and sessions never imply deletion.
- An as-of result reports only revisions and sessions visible at that timestamp.
- Cross-session identity confidence is **not** presented as an accepted/calibrated probability.
- Source data is not rewritten. The view is recomputed from saved derived entities, O(total revisions) time/memory; no additional persistent index.
- Type renaming/drift, tenant separation within one registrable site, contradictory evidence and retractions are explicit limitations.
- External independent QA is required before claiming functionality proven. No runtime, unit, benchmark or browser tests were executed in this build phase.

## Scope delivered

- `src/intel/continuity.mjs`: longitudinal keyed identity joins, as-of folded state, per-revision provenance, truthful completeness counts and limitations.
- `bin/studio.mjs`: `studio continuity <id|latest> [--eid ID] [--at ISO] [--limit N]`.
- `src/studio/server.mjs`: `GET /api/sessions/:id/continuity?eid=...&at=...&limit=...` under existing local authentication.

## Next independent questions

Verify day-separated sessions with the same keyed entity produce one joined group; different sites and keyless records remain distinct; as-of excludes future state; a field update retains historical earlier values; rederive/delete source sessions changes the on-demand view; stage failure and incomplete derivation are surfaced; high-volume scans remain bounded enough for real workload. Probe same registrable-site tenant collisions and drift-related false negatives. Run full Sprint 01 QA as well.

**Build-state distinction:** source files were statically inspected, not physically executed. Commits contain ordinary implementation changes and must not be treated as a QA receipt.
