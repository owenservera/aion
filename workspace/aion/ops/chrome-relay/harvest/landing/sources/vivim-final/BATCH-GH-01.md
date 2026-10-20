# GH-01 — vivim-final source intelligence

- Donor snapshot: `owenservera/vivim-final@8a798f91d52574cb3d7db579da516bc1c4aee7b7`
- Source checkout: GitHub only; Windows checkout, revision and dirty state UNKNOWN
- Captured: **16** indexed candidates with source excerpts and SHA-256 evidence
- Priorities: {"CORE":14,"ADJACENT":2}
- Evidence classification: SOURCE_OBSERVED (pinned static remote code), **not OFFLINE_TESTED nor LIVE_VERIFIED nor ACCEPTED_FOR_SPEC**

- [VF-0001](./items/VF-0001/CARD.md) ChatGPT provider manifestation (CORE)
- [VF-0002](./items/VF-0002/CARD.md) Claude provider manifestation (CORE)
- [VF-0003](./items/VF-0003/CARD.md) Global chat application shape (CORE)
- [VF-0004](./items/VF-0004/CARD.md) Bespoke coding IDE shape (ADJACENT)
- [VF-0005](./items/VF-0005/CARD.md) Shared semantic capability taxonomy (CORE)
- [VF-0006](./items/VF-0006/CARD.md) Resolved capability and gating contract (CORE)
- [VF-0007](./items/VF-0007/CARD.md) Concrete resolution filter (CORE)
- [VF-0008](./items/VF-0008/CARD.md) Unified multi-surface capability contract (CORE)
- [VF-0009](./items/VF-0009/CARD.md) Unified registry execution and surface exports (ADJACENT)
- [VF-0010](./items/VF-0010/CARD.md) Per-provider plugin contract (CORE)
- [VF-0011](./items/VF-0011/CARD.md) Command context, preconditions and results (CORE)
- [VF-0012](./items/VF-0012/CARD.md) Conversation and artifact normalization (CORE)
- [VF-0013](./items/VF-0013/CARD.md) Legal session lifecycle transitions (CORE)
- [VF-0014](./items/VF-0014/CARD.md) Observation event vocabulary (CORE)
- [VF-0015](./items/VF-0015/CARD.md) Message identity and deduplication (CORE)
- [VF-0016](./items/VF-0016/CARD.md) Post-failure resend anti-pattern (CORE)

## Boundaries and next pass
No donor execution, browser, account or auth access, CDP, tests, migrations or production send. Selector and model metadata are stale until live verified. Recover/resend behavior from VF-0016 is specifically rejected. Next pass: enrich provider type/schema discovery, real ChatGPT adapter, provenance tests and duplicate comparison with omega.
