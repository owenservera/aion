# Capture Studio RECON

RECON SHA: 9d2fe0cd347a73e9324d1c824c7c762917e0c3e6 (owenservera/aion main, shallow clone, 2026-10-21)
Source root: workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/
Scope: src/ (all), bin/studio.mjs, profiles/families (names only). Not read in full: test/, eval/, JSON data, src/studio/ui/index.html (sampled sinks only). Security and secrets handling deprioritized by owner direction, not assessed.
Static reading only. Nothing executed, no tests run.

## Layer map (status: solid | partial | absent; unwired = library code with no import from src/bin/studio)

| Layer | Mechanism | file:symbol | Status | Note |
|---|---|---|---|---|
| Capture & Observation | CDP Network.* observation, streamResourceContent arming | capture/network.mjs:NetworkRecorder._onResponse | solid | Read-only, arm/retrospective fallback recorded |
| Capture & Observation | DOM observer via isolated world | capture/page-agent.js:idOf, nodes Map | partial | Node ids per page instance; nodes Map never pruned |
| Evidence & Memory | Append-only segmented log, seq, sha256 manifest, gap records | store/raw-log.mjs:RawLog.append/flush | solid | Drops are declared as gaps, never silent |
| Evidence & Memory | Integrity verify | store/session.mjs:Session.verify | solid | Seq holes must be explained by gap records |
| Evidence & Memory | Per-stream event cap | replay/reducer.mjs:_emitEvents | partial | Keeps last N events in memory; derive uses 400 |
| Interpretation & Derivation | Decoders (SSE, NDJSON, envelope sniff) | decode/decoders.mjs:pickDecoder, sniffEnvelope | partial | Each event has byte span; WholeBodyDecoder buffers entire body |
| Interpretation & Derivation | Delta assembly (json-patch, path-ops, typed) | decode/delta.mjs:DeltaAssembler.apply | partial | Heuristic dialect detection; move/copy/test not applied (counted only) |
| Interpretation & Derivation | Schema induction, groups, suggestions | intel/schema.mjs:SchemaNode; shapes/infer.mjs:ShapeInferencer.report | partial | Suggestion confidence is ad hoc (e.g. 0.5+count/50), not calibrated |
| Knowledge & Relationships | Identity, keyed | intel/identity.mjs:buildEntities (method key) | solid | eid = sha(scope|key), stable across sessions |
| Knowledge & Relationships | Identity, keyless linkage | intel/identity.mjs:linkage | partial, unwired | eid = sha(min member signature): churns when a smaller observation arrives |
| Knowledge & Relationships | Key inference, FK demotion, composition/references | intel/discover.mjs:inferKey, resolveForeignKeys, references | partial, unwired | Single-field keys only |
| Knowledge & Relationships | Temporal entity graph | intel/graph.mjs:TemporalGraph.stateAt | partial, unwired | keyIndex ignores site scope; no validity intervals |
| Knowledge & Relationships | Family mapping to canonical records | families/families.mjs:proposeMapping, extractFamilyRecords | partial | Wired; event-source path sees only capped events |
| Learning & Adaptation | Scoped naive Bayes roles, promotion, revert | intel/learn.mjs:ScopedLearner | partial, unwired | Promotion is suggestion only; revert replays log |
| Learning & Adaptation | Calibration | intel/learn.mjs:Calibrator.observe | absent in runtime | observe() has no call site; calibrate() returns raw p |
| Learning & Adaptation | User edits as versioned profiles | profiles/apply.mjs:applySuggestion; store/versioned.mjs | solid | Accept/reject and rollback wired |
| Learning & Adaptation | Shape retention choice | profiles/apply.mjs (retain_revisions) | absent | Written to p.shapes.retention; never read |
| Behavior & Reconstruction | Action to request correlation | intel/correlate.mjs:correlateActions; shapes/infer.mjs step 7 | partial | Wired version is a 3 s window; scored version unwired |
| Behavior & Reconstruction | Rendered-text correlation | intel/correlate.mjs:correlateRendered; shapes/infer.mjs step 6 | partial | Wired version is substring probe of 60 chars |
| Behavior & Reconstruction | Time travel | replay/derive.mjs:stateAt | partial | Full replay from start on every call |
| Behavior & Reconstruction | Behavioural / state-transition layer | none | absent | W14 not started |
| Experience & Control | Pause/resume with declared uncaptured counts | capture/recorder.mjs:pause, resume | solid | Coverage is declared in records |
| Experience & Control | Studio UI + API, loopback | studio/server.mjs:startStudio | solid | Escaping helper used on sampled sinks |
| Experience & Control | Hypothesis confirm/reject feeding learner | none | absent | W16 not started |

Cross-cutting provenance is the strongest layer: seq, segment hash, gap declarations, per-event spans, provenance fields on family records.

## (a) Top 5 high-blast-radius weaknesses (non-security)

1. Keyless entity ids are unstable over time. intel/identity.mjs:buildEntities sets eid from the smallest member signature, so a new observation with a smaller signature renames the entity. Anything keyed on eid (graph nodes, learner links, family provenance) churns.
2. The intelligence layer is largely unreachable from the product. intel/discover.mjs:discoverModel, identity.mjs:linkage, graph.mjs:TemporalGraph, learn.mjs:ScopedLearner and correlate.mjs have no import in src/, bin/ or studio. Only eval/ and test/ import them. The shipped derive path uses shapes/infer.mjs and families/families.mjs.
3. Silent truncation in derive. replay/derive.mjs:derive builds StreamReducer with maxEventsPerStream 400, while studio/server.mjs:reducerFor uses 3000. families.mjs:extractFamilyRecords and gatherEvidence read s._events, so family records from event sources cover only the last 400 events per stream, and derive and preview disagree.
4. The learning loop does not close. learn.mjs:Calibrator.observe has no call site, so confidence is never calibrated. apply.mjs writes shapes.retention but derive.mjs never reads it, so the user's "keep all vs final" choice has no effect on output.
5. Reconstruction cost grows with session length. derive.mjs:stateAt replays from the first record on each call. derive.mjs:search scans every event dataset linearly. recorder.mjs:status calls reducer.summary() every second over all streams ever seen, and StreamReducer.streams is never evicted.

## (b) Contradictions: current code vs SPRINT-01.md and worklog W1-W18

Worklog line 7 already marks its directives as superseded. The classes below apply to its claims about the code.

- W1 key inference (compound keys, coherence): current-source-supported as partial. Partition, stability and shape scoring exist (discover.mjs:inferKey); no compound keys.
- W2 order-independent merge, rare-shape sampling: current-source-supported. discover.mjs:mergeTypes sorts inputs and uses average linkage; schema.mjs:sampleIndices keeps shape representatives. The shuffled-input test is external QA, not verified here.
- W3 identity v2 (blocking, EM, cannot-link): current-source-supported as implemented but unwired (identity.mjs:linkage). Temporal constraints and duplicate-vs-revision classification are partial.
- W4 chunk-boundary credential scanning: current-source-supported as open (network.mjs:_chunk scans each chunk alone). Deprioritized per owner.
- W5 learner fixes and eval: partial. Revert and promotion exist; no contamination check; calibrator never fed.
- W6 causal attribution with mechanism evidence: current-source-supported as absent. correlate.mjs labels "causal" from score and intervening count only.
- W7 wire v2 into derive: current-source-supported as absent. derive.mjs persists no MODEL, GRAPH, HYPOTHESES or QUESTIONS.
- W8 temporal graph v2 (attribute event sourcing, intervals, retractions): current-source-supported as absent. graph.mjs has no validity intervals or retractions.
- W9-W15 (Hungarian alignment, evidence fusion, relevance layer, benchmarks, behavioural layer, reconstruction validation): hypothesis, absent from source.
- W16 UI explorer and feedback loop: absent.
- W17 Windows launcher: partial. launch.mjs has win32 Chrome candidates; no PowerShell launcher or README in this folder.
- W18 optional LLM assist: absent.
- SPRINT-01 claim that identity, semantics, time and provenance are coupled: unknown. The code shows provenance well wired; the coupling claim needs DECIDE-phase evidence.

## (c) First-party code not read in full

- test/ and eval/ (existence noted only; not read; no test or eval run).
- src/studio/ui/index.html: sampled innerHTML sinks only.
- profiles/*.json and families/*.json: not read beyond names.
- eval/results/*.json: not read.

## Stale-SHA note

STATE.json recorded last_observed_product_sha 73d65909bc3bc9f6709364e6b4873c3a9918ba3e. Current main is 9d2fe0cd347a73e9324d1c824c7c762917e0c3e6. The delta between them was not examined. This digest is valid only for 9d2fe0c.
