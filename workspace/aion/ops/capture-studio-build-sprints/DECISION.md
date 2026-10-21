# DECISION — Sprint 01 "Trustworthy Continuity"

Decided at main f1bab393 (product source identical to RECON SHA 9d2fe0cd). DECIDE phase, Opus High, 2026-10-21. Security and secrets were out of scope by owner direction.

## Dominant leverage point (overrules the four-lens framing)

The four lenses (identity, semantics, time, provenance) are coupled. Today, though, the intelligence that carries them never reaches the product. `discoverModel`, `linkage`, `TemporalGraph`, `ScopedLearner` and `correlate*` are imported only by eval/ and test/ (RECON weakness 2). The data that would feed them is also truncated: derive keeps 400 events per stream in memory, and `buildCorpus` and `extractFamilyRecords` read only that in-memory window (weakness 3).

Improving identity or time inside unreachable code changes nothing a user sees. The prerequisite is a **complete, provenance-preserving path from raw evidence to persisted entities**. Then the identity and semantic fixes that matter once that path exists must land with it.

## Chosen interventions (4 chunks, ordered)

1. **Full-evidence corpus (provenance and time).** derive feeds the corpus and family event extraction from every decoded event as it streams, not from the capped in-memory window. Any sampling is deterministic and disclosed. Assembled-document samples carry the seq range they were built from.
2. **Stable, scoped identity (identity and time).** Keyless entity ids are anchored on the entity's earliest observation instead of its smallest content signature, so appending evidence never renames an entity. Graph key lookups are scoped by site, and composition edges are scoped by session. Action-to-request edges are always `preceded` (scored relation kept as evidence), because no mechanism evidence supports `caused` (W6).
3. **Wire the intelligence into derive (all four).** derive builds model → entities → hypotheses → temporal graph and persists `MODEL`, `GRAPH`, `HYPOTHESES` and an `entities` dataset. A persistent `ScopedLearner` lives in the data dir. Failures are isolated, so existing outputs never break. CLI and API expose the results.
4. **Close the confidence loop (semantics and control).** Accepting or rejecting a suggestion feeds `Calibrator.observe`, and reports add `calibratedConfidence` next to the untouched raw `confidence`. The UI shows calibrated confidence with the raw value on hover.

## How the mechanisms reinforce each other

Complete evidence (1) makes identity resolution see every revision. Earliest-observation anchors (2) then turn that complete history into ids that stay put over time. Stable ids let the graph (3) hold time-indexed state whose every revision points back to raw seq. That is provenance, identity and time joined in one structure. Honest edge kinds (2) and calibrated confidence (4) keep the semantics from overstating certainty. User decisions (4) become learning signals tied to suggestion ids.

## Rejected alternatives

- **Raise derive's event cap to Infinity:** couples correctness to RAM and still leaves corpus building implicit.
- **Temporal graph v2 (W8: intervals, retractions):** needs a wired graph first. It is the next sprint candidate.
- **Cross-session entity continuity:** needs stable per-session ids (this sprint) and a multi-session corpus. Next sprint.
- **Compound keys (W1) and Hungarian alignment (W9):** better accuracy in a layer with no consumer yet.
- **Consume `shapes.retention`:** there is no downstream artifact defined for "final vs all revisions". Raw and events already keep everything, so it is deferred and recorded.
- **Performance (`stateAt` checkpoints, per-second summary):** not a continuity defect. Deferred.
- **Mechanism evidence for causality (W6):** downgrading the claim now is cheaper and truthful. Mechanism evidence is a later sprint.

## Risks

- derive runtime and memory grow on large sessions (discovery and linkage). This is mitigated by deterministic per-group decimation with disclosed counts, plus caps on correlation inputs.
- Keyless eid values change against older outputs. None were persisted before this sprint, so no migration is needed. The id format `type:e:<sha12>` is unchanged.
- `GRAPH` in kv may be large on long sessions. It is accepted for now, with size recorded in stats.
- Concurrent CLI and studio writes to `learner.json` are last-write-wins. That is acceptable on a single-owner machine.

## Reversibility

All changes are additive. Raw logs are never touched. Existing datasets and kv keys (events, streams, timeline, records-*, family-*, SHAPES, ASSEMBLED, DOM_BLOCKS, RECEIPT) keep their shape. Removing the derive wiring restores prior outputs. `learner/` in the data dir can be deleted to reset learning.
