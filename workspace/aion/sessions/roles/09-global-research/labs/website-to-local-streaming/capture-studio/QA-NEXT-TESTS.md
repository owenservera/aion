# QA-NEXT-TESTS (developer thought dump, not verified; PENDING INDEPENDENT QA)

Last change: Sprint 01 chunk C3, intelligence wired into derive. (C1: full-evidence corpus, CORPUS_STATS. C2: earliest-observation keyless ids, scoped graph keys, 'preceded' action edges.)

C3 ideas to check:
- derive(session, profile) with NO third arg: works with an in-memory prior learner; returns `knowledge`; RECEIPT.knowledge present.
- After derive: kv MODEL (types, relationships, unmodelled, corpus stats), kv GRAPH (types/nodes/edges/stats), kv HYPOTHESES (rendered, actions, caps), dataset `entities`.
- Failure isolation: force discoverModel to throw (bad sample) -> MODEL = {error, stage}, GRAPH/HYPOTHESES null, entities empty, and every earlier output (events, streams, timeline, records-*, family-*, SHAPES, ASSEMBLED, DOM_BLOCKS, RECEIPT) still correct.
- Re-derive the same session twice: identical MODEL/entities/GRAPH (determinism); no stale entities left from a previous run.
- Universality e2e sessions: types and keys plausible vs fixture ground truth; references only within same site scope.
- Every entity revision carries session/sid/seq (or domId); anchor present; graph node history evidence has t.
- Large session: derive time and memory with discovery + linkage; correlateRendered capped at 500 subjects x 2000 blocks (caps recorded in HYPOTHESES.caps).
- `studio model <id|latest>` prints types, keys, entity counts, relationship kinds, thinning note; prints error+stage when MODEL failed (exit code 2).
- API: GET /api/sessions/:id/model | graph | hypotheses; entities via /api/sessions/:id/dataset/entities.
- learner dir <data>/learner is created on first studio/CLI derive; no learner.json written by derive itself.
- receipt is pasteable: knowledge holds counts only (and an error string on failure).
