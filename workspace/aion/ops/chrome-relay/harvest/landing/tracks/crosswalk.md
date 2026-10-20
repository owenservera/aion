# Worker C — cross-repo taxonomy and capability map
## Scope
Read existing ../../FINDINGS.md and both workers' published landing records. Write only `synthesis/`. Do not edit either source inventory or Track B code/specs.

## Outputs
1. `synthesis/taxonomy.md`: original terminology and proposed high-level categories, preserve disagreements.
2. `synthesis/provider-matrix.md`: source-grounded provider family/type, surface, runtime, transport, adapter/implementation, semantic capability and contextual resolution layers. Each claim cites source item IDs and revisions; unknown stays unknown.
3. `synthesis/duplicates.md`: probable shared ancestry, module forks, real divergence vs duplicate evidence. No double-counted confirmation.
4. `synthesis/capability-map.md`: capability coverage and gaps across sources, without prematurely assigning implementation priority.
5. `synthesis/track-b-seams.md`: nonbinding potential integration seams grounded in existing AION architecture/ENVELOPE; defer acceptance until later.

## Method
Start from known 16 findings and current Track B contracts, create skeletal crosswalk with explicitly pending evidence, then consume Worker A/B batches. Highlight semantics vs concrete provider implementation vs observed live capability, unknown-effect and authority distinctions. No design transplant or source-is-truth premise. No code changes.

## Batch handoff
Report source IDs consumed, conflicts, gaps, top reuse candidates and dependency chains. Mark provisional mappings clearly. A/B own capture; C owns synthesis.
