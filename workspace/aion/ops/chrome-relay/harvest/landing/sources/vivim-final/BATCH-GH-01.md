# GH-01 — vivim-final source intelligence (3 batches)

Source `owenservera/vivim-final@8a798f91d52574cb3d7db579da516bc1c4aee7b7` (pinned GitHub revision; local Windows checkout and dirty state UNKNOWN).

- **27 records** copied under separate cards with narrow source excerpts, full-file SHA256, excerpt SHA256, immutable revision and Git blob SHA1.
- **Flags:** {"CORE":20,"ADJACENT":6,"EXPERIMENTAL":1}.
- **Coverage:** static code excerpts + one read-only test source; no tests executed, live browser actions, CDP, account access, send or migrations.
- **Statuses:** SOURCE_OBSERVED remote source, CANDIDATE only — not accepted AION authority.
- **Important negative findings:** Original local-research `src/intel/nlcl/types.ts` path does not exist on pinned GitHub revision; remote corresponding path is `src/engines/nlcl/types.ts`. Distinct provider plugin contracts are present: `providers/plugin.ts` and additive `providers/provider-plugin-interface.ts`.
- **Explicitly rejected transfer:** `sendResilience()` second `sendFn` on reconnect and `recover()` resend lastMessage; mocked test expects this behavior. Unparseable existential rule evaluated as satisfied is unsafe for authority-sensitive contexts.

## Indexed captures
- [VF-0001](./items/VF-0001/CARD.md) — ChatGPT provider manifestation (CORE)
- [VF-0002](./items/VF-0002/CARD.md) — Claude provider manifestation (CORE)
- [VF-0003](./items/VF-0003/CARD.md) — Global chat application shape (CORE)
- [VF-0004](./items/VF-0004/CARD.md) — Bespoke coding IDE shape (ADJACENT)
- [VF-0005](./items/VF-0005/CARD.md) — Shared semantic capability taxonomy (CORE)
- [VF-0006](./items/VF-0006/CARD.md) — Resolved capability and gating contract (CORE)
- [VF-0007](./items/VF-0007/CARD.md) — Concrete resolution filter (CORE)
- [VF-0008](./items/VF-0008/CARD.md) — Unified multi-surface capability contract (CORE)
- [VF-0009](./items/VF-0009/CARD.md) — Unified registry execution and surface exports (ADJACENT)
- [VF-0010](./items/VF-0010/CARD.md) — Per-provider plugin contract (CORE)
- [VF-0011](./items/VF-0011/CARD.md) — Command context, preconditions and results (CORE)
- [VF-0012](./items/VF-0012/CARD.md) — Conversation and artifact normalization (CORE)
- [VF-0013](./items/VF-0013/CARD.md) — Legal session lifecycle transitions (CORE)
- [VF-0014](./items/VF-0014/CARD.md) — Observation event vocabulary (CORE)
- [VF-0015](./items/VF-0015/CARD.md) — Message identity and deduplication (CORE)
- [VF-0016](./items/VF-0016/CARD.md) — Post-failure resend anti-pattern (CORE)
- [VF-0017](./items/VF-0017/CARD.md) — Streaming status and observation identity (CORE)
- [VF-0018](./items/VF-0018/CARD.md) — Natural-language command and confirmation contract (CORE)
- [VF-0019](./items/VF-0019/CARD.md) — Messaging service provider families (ADJACENT)
- [VF-0020](./items/VF-0020/CARD.md) — Live capability extension model (EXPERIMENTAL)
- [VF-0021](./items/VF-0021/CARD.md) — Claude specialized feature declaration (ADJACENT)
- [VF-0022](./items/VF-0022/CARD.md) — Presentation-only Send affordance (ADJACENT)
- [VF-0023](./items/VF-0023/CARD.md) — ChatGPT message DAG normalization (CORE)
- [VF-0024](./items/VF-0024/CARD.md) — Regression test explicitly expects second Send (CORE)
- [VF-0025](./items/VF-0025/CARD.md) — Newer lifecycle-aware provider plugin interface (CORE)
- [VF-0026](./items/VF-0026/CARD.md) — Existential rule evaluator fail-open branch (CORE)
- [VF-0027](./items/VF-0027/CARD.md) — Audited state-transition records (ADJACENT)

## What remains
Identify canonical donor ownership and duplicate variants; inspect actual ChatGPT/Claude browser action boundaries and original tests; crosswalk against Vivim-omega; validate any adaptation using Track B-owned tests before promotion. All browser selector examples are historical only. This landing folder is not a runtime dependency.
