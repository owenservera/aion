# QA-NEXT-TESTS (developer thought dump, not verified; PENDING INDEPENDENT QA)

Last change: Sprint 01 chunk C1, full-evidence corpus + family event extraction.

Ideas to check:
- Session with one stream of >400 SSE/NDJSON events mapped by an 'event' family mapping: family-<fam>-<entity> row count should equal the number of matching items across ALL events (previously capped near 400 per stream).
- derive() with no third arg still works; family dataset rows keep the same fields (_family, _entity, _provenance with sid/seq/t).
- Profile with no family: familyRecordsFromEvent returns [] and eventRecords = {}; extractFamilyRecords unchanged output.
- Studio preview route still calls extractFamilyRecords WITHOUT eventRecords, so the old reducer-window path must still produce records.
- CorpusCollector: group with > maxPerGroup (20000) observations thins deterministically; stats.dropped lists the count; first occurrence of every shape survives; same input twice gives identical samples.
- patchGroups: groups whose stream detected json-patch/path-ops/typed-events are in patchGroups; assembled sample carries seqFrom/seqTo.
- CORPUS_STATS kv written on every derive; check it is JSON-serializable (Set not leaked).
- Compare CorpusCollector.result vs buildCorpus on a short fixture session (should match samples when nothing is thinned, ignoring ordering).
- Possible gotcha: events with array json and no discriminator -> group '[array]'; same as buildCorpus.
