# Build Sprint 02 — Continuity Across Sessions (directional mission)

**Status:** directional mission for the next DECIDE, not a spec. Written after Sprint 01 at `8218e6c` (checkpoint `1671f20`). Sprint 01 is PENDING INDEPENDENT QA. If QA finds defects in C1-C4, fix those first.

## Where Sprint 01 left the system
- `derive` now builds model → entities → hypotheses → temporal graph from complete evidence (`MODEL`, `GRAPH`, `HYPOTHESES`, `entities`).
- Keyless ids are anchored on the earliest observation. Keyed ids are `type:k:sha(site|key)`, so keyed entities already have stable ids across sessions of the same site.
- Confidence calibration learns from accept/reject decisions.

## The gap this sprint targets
Knowledge still stops at the session boundary:
- **Identity:** each session's graph is an island. The same keyed entity seen on Monday and Friday is never joined, and keyless linkage refuses cross-session links by design (`identity.mjs:linkage` cannotLink on session).
- **Time:** `TemporalGraph.stateAt` cannot answer "what did this entity look like last week" across captures. There are no validity intervals and no retractions (W8).
- **Semantics:** discovered types are not aligned between sessions of the same site, so a renamed field creates a new type instead of drift on the old one (`schema.mjs:schemaDiff` exists and is unused here).
- **Control:** the user cannot see or correct the model and graph yet. They are API/CLI only, and the field-role corrections in `ScopedLearner.learn` have no caller.

## Candidate intervention points (DECIDE chooses; none is mandated)
1. **Per-site knowledge store** in the data dir (append-only, versioned like `VersionedStore`). It would merge entities by keyed eid across sessions and record per-session provenance on every revision.
2. **Type alignment across sessions** with `schemaSimilarity` and `schemaDiff`. It would emit drift and rename hypotheses instead of new types.
3. **Temporal graph v2.** Each attribute value would carry an interval, so the graph can answer "as of" queries across sessions and record retractions when a stream later corrects a value.
4. **Minimal model and graph view in the studio**, with confirm/reject on hypotheses feeding `ScopedLearner.learn` at an explicit scope.
5. **Remaining truncation:** `gatherEvidence`, `driftSuggestions` and infer correlations still read the 400-event window.

## Questions DECIDE must answer with evidence
- Which candidate is the prerequisite for the others? Likely 1, because 2-4 need a cross-session substrate, but verify.
- How are keyless entities (per-session by design) represented across sessions without false merges?
- What is the storage growth bound, and how does a user delete or rewind learned knowledge?

## Invariants carried forward
- Raw is immutable.
- Derived output is recomputable from raw plus the versioned learner and store.
- Sampling is always disclosed.
- No "caused" edge without mechanism evidence.
- No physical tests by build phases; QA stays independent.

## Launch
Next sprint: start at **DECIDE (Opus, High)** using RECON.md plus this file. Re-run RECON first only if `main` moved materially in capture-studio beyond Sprint 01 commits.
