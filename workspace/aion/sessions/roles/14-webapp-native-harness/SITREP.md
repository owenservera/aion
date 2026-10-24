# Webapp-Native Harness — Initial SITREP

**Reference:** 2026-10-24. **This document is a creation-time baseline, not live integration acceptance.**

## State
- AION Capture Studio main most recently inspected at `521b9822da7f0e1bbfe73c9578b84c786e2dc50c` (2026-10-23). Recheck main on every launch; other workers may push during this agent's lifetime.
- Latest user-reviewed Z.ai Round 3 sandbox export reportedly ends at `4e666232`, 10 exported commits; 1,216 passing unit tests and 14/14 real-Chrome **synthetic-site** integration checks. Package SHA verification was performed in earlier session, but those commits were not observed on GitHub main. This specialist has **not** itself fetched/executed the local sandbox bundle.
- Z.ai did exercise Chrome/CDP against real provider websites including Z.ai and Duck.ai and captured error/failure sessions. **No successfully attributable real AI-generated multi-turn reply** or live production webapp harness receipt has been demonstrated.
- Governing Capture Studio architecture has source for exact-thread ChatGPT Read, durable turn journal, guarded follow-up, candidate chat-index and tool registration; live acceptance absent. ChatGPT-specific canonical `/c/<uuid>` identity; other providers' durable thread binding unproven.
- Saved-source AI chat atlas (generated 2026-10-22) includes 26 ChatGPT sessions and 11 Claude sessions. Its counts are **derived historical family reports**, not new authenticated live tests. Stream-to-DOM join on historic ChatGPT data was 0/60 with old DOM extractor; Claude Connect/protobuf field attribution remains a lead, not reconstruction proof.
- Core QA #68/#72 notes the G1/G2 freshness acceptance gap: old matching user/reply content may satisfy a gate without a proven pre-send/post-send boundary. The bug is **source-grounded negative test**, not a witnessed real false acceptance incident.
- Related Canon: [full-vision #67](https://github.com/owenservera/aion/issues/67), [Core #68](https://github.com/owenservera/aion/issues/68), [UI #69](https://github.com/owenservera/aion/issues/69), [Knowledge #70](https://github.com/owenservera/aion/issues/70), [Value #71](https://github.com/owenservera/aion/issues/71), [QA #72](https://github.com/owenservera/aion/issues/72), [Track B #43](https://github.com/owenservera/aion/issues/43).

## Role gap
There was no separate owned specialist desk for comparing ChatGPT/Claude **actual webapp response shapes** and correlating those into a persistent multi-surface agent run. This role fills that research/design gap, not the existing codeowner's engineering slot.

## Initial focus
Preserve native evidence; identify response-part/artifact/task graphs for both webapps; define a small common agent projection and precise unknowns; produce reproducible browser tests for stream, identity, content, artifact and lifecycle; supply Z.ai/Core/QA implementation-ready, source-qualified findings.

## Pending proof
No direct run by this role, no native Node/Windows test, no authenticated ChatGPT/Claude webapp capture, no installed new agent runtime, no teammate acknowledgment, and no Z.ai job launched by the creation of this folder.
