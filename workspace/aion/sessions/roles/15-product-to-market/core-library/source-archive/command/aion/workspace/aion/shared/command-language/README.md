# AION Symbolic Command Protocol

[protocol.json](protocol.json) is the versioned, machine-readable **AION interpretation profile** for VOMEGA's existing 17 symbol families. It does not modify VOMEGA's parser or install commands in ChatGPT. Original source: [VOMEGA symbols.ts](https://github.com/owenservera/VOMEGA/blob/main/omega-baseline/plugins/vivim-nlcl-pure/src/symbols.ts).

## Key command distinction

- `#AION @dashboard /sitrep` — perform the Dashboard agent's scoped SITREP.
- `#AION @dashboard +/sitrep` — AION-defined **add missing/bootstrap** composition; follow [Master Bootstrap](../agent-bootstrap-kit/MASTER-BOOTSTRAP.md), including [stage tracker](../agent-bootstrap-kit/BOOTSTRAP-TRACKER.md). The `+` glyph retains its VOMEGA **add/create** semantics.
- `#AION @dashboard /bootstrap` — explicit equivalent full bootstrap command.
- `#AION @dashboard ∆/sitrep` — reconcile existing context and process drift.
- `#AION @dashboard ?/sitrep` — report SITREP status without modifying resources.
- `#AION @dashboard !/sitrep` — run SITREP immediately within available permissions. **Not a bootstrap synonym.**

A plain `SITREP` remains the established role-scoped refresh, and `#AION @role BOOTSTRAP` remains a supported legacy launch alias.

These command forms are an **instruction-level convention**, not a deterministic parser installed in ChatGPT or the local harnesses. Resolve registered project and agent names against actual current repository data, execute with available authorized tools, and report evidence or blockers. `!` cannot bypass safety, and `✓` is not independent proof of success.

All other VOMEGA operators retain their source-defined meanings. They are not automatically mapped to new AION workflows simply because their glyphs appear in the protocol. Compose new mappings explicitly and version them after review.
