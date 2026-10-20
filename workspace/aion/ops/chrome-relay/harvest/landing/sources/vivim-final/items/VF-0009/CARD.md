# VF-0009 — Unified registry execution and surface exports

**Flag:** ADJACENT | **Capture:** COPIED_EXCERPT | **Disposition:** CANDIDATE

**Source:** [src/engines/unified-registry.ts:150-214](https://github.com/owenservera/vivim-final/blob/8a798f91d52574cb3d7db579da516bc1c4aee7b7/src/engines/unified-registry.ts#L150-L214)

**Remote revision:** `8a798f91d52574cb3d7db579da516bc1c4aee7b7` | local dirty state: UNKNOWN

**Source blob SHA1:** `2cfef91f6694577215bcb4880be29ac1feb8f8eb`

**Whole-source SHA256:** `3f2086fe87409eea073365f7b039f56a142ff53835106b67609270faac63f2e6`

**Excerpt SHA256:** `77676f2d958fde3ceffd739f705dbdb75011c951104b79be6a9d3c16e21a100f`

**Domains:** command-execution, multisurface, interfaces | **Prior lead:** FINAL-05

## Source intelligence
Registry exposes CLI/MCP/UI metadata and dispatches a handler.

## Hazards
Only basic required-field validation visible: no grants, effects or send idempotency.

## Coverage and acceptance
Selected lines only; other callers, alternative implementations and tests not checked here. No code execution, live browser check, local checkout inspection or acceptance of a Track B spec. AION owner must map to existing operation/authority/evidence axes and separately test the transfer.
