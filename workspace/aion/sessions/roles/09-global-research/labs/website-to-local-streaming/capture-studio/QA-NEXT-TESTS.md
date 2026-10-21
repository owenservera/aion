# QA-NEXT-TESTS (developer thought dump, not verified; PENDING INDEPENDENT QA)

Sprint 01 complete in code (C1-C4). Last change: C4, suggestion confidence calibration loop.

C4 ideas to check:
- Fresh data dir, no feedback: every suggestion has calibratedConfidence === confidence; UI shows the same % as before; hover title shows raw %.
- Accept/reject >= 3 suggestions of one kind in the same confidence bin (studio apply route or `studio profile apply`): <data>/learner/learner.json gets calibrator.bins["suggestion:<kind>"]; next derive/live report shifts calibratedConfidence toward the observed acceptance rate (shrunk while n < 20).
- Ranking unchanged: suggestions still sorted by raw confidence; ids unchanged.
- Rejecting records accepted=false; the bin input is RAW confidence, never the calibrated one (check body.suggestion.confidence used).
- Live recording: Recorder gets the studio's learner; liveReport carries calibratedConfidence.
- Studio + CLI writing learner.json concurrently: last write wins (accepted risk on single-owner machine); file stays valid JSON (atomic rename).
- ECE: Calibrator.ece('suggestion:<kind>') after a batch of decisions should be computable.

Whole sprint regression ideas (C1-C3):
- derive(session, profile) without options still works (e2e tests call it so).
- Family event-mapping coverage beyond 400 events per stream; CORPUS_STATS present.
- Keyless eid stable when appending later observations; keyed eids unchanged.
- MODEL/GRAPH/HYPOTHESES/entities persisted; failure isolation keeps all prior outputs.
- No 'caused' edges anywhere; evidence.scoredRelation kept.
