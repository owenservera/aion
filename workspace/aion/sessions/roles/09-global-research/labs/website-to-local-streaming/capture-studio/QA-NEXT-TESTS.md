# QA-NEXT-TESTS (developer thought dump, not verified; PENDING INDEPENDENT QA)

Last change: Sprint 01 chunk C2, stable scoped identity + honest edge kinds. (C1 notes still apply: full-evidence corpus, family event extraction, CORPUS_STATS.)

C2 ideas to check:
- Keyless linkage cluster: append a LATER observation of the same entity -> eid unchanged. Add an EARLIER one -> eid may change (expected, new history).
- Shuffle input order of instances: same eids (sort is total: t, seq, instanceSig). Equal t/seq ties fall to instanceSig.
- Two observations with identical obj and identical prov except index/mapKey/snapshot: anchorOf includes those, so ids differ; check singletons in dynamic-key maps do not collide.
- Keyed entities unchanged: eid still type:k:sha(scope|key); idBasis 'key'; entity now has idBasis and anchor fields (additive).
- Eval fixtures that assert exact eid strings (if any) will fail by design; entity COUNTS and pair F1 should be unchanged.
- Graph: two sites with the same key value must not cross-reference (keyIndex now type|scope|key). Check 'references' edges only link same-scope entities.
- Graph 'contains': same sid+seq in two different sessions must not link (key now includes session).
- Action edges: all kind 'preceded'; evidence.scoredRelation keeps 'causal'/'temporal', evidence.score the score. Anything that filtered on kind 'caused' (UI/eval?) will find none.
- upsertEntity evidence now has t; graph nodes carry idBasis/anchor; check toJSON size not exploding.
