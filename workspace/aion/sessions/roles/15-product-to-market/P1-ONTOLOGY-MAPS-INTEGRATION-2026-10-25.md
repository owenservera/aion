# P1 — Ontologies, Maps & Integration (owner correction)
Date: 2026-10-25
Status: working model; owner review pending. Supersedes D01 home-navigation interview in P1-V1-EXPERIENCE-HIGH-2026-10-25.md.
## Non-negotiable owner direction
There is NO first/home-first entity, view, project or conversation. All entities are equally first-class. Stop managing UX hierarchy. Design ontology, maps, integration of existing code/assets through WHAT, HOW, WHERE, WHEN, WHO. Any ranking is contextual query result, not intrinsic object priority.
## Five-axis semantic contract
- WHAT: typed entity (conversation, message, part, artifact, project, repo, file, agent, capability, command, provider, evidence, person, task, concept, world, map). Distinguish class, instance, representation and assertion.
- HOW: typed action/process/capability/command, implementation, prerequisites, inputs/outputs, constraints, permission, execution receipts and failure.
- WHERE: location in filesystem, repository/branch/commit, app/provider/account/native container, local project, graph scope, device and spatial map; physical, logical and semantic locations are distinct.
- WHEN: valid time, observed/captured time, recorded time, source revision, event ordering and temporal uncertainty.
- WHO: agent, human, service, provider/account and ownership, authorship, execution actor, approver and permission scope; unknown actor is explicit.
Cross-cutting relationship attributes: evidence provenance, confidence/coverage, identity, authorization, version, scope, reversibility, source vs user annotation. Optional WHY (intent/objective) must not replace the five core dimensions.
## Ontology and maps
An entity can participate in multiple maps simultaneously; no canonical single view or fixed home. Maps are projections of a shared, source-qualified semantic graph: dependency, ownership, execution, source lineage, temporal evolution, capability, project, conversation, knowledge, repository and physical/software topology. A map's coordinates/layout are view state, not identity. All maps must round-trip to same object IDs and preserve evidence and uncertainty. Equivalence is not asserted by same title/path/word. Native provider projects are distinct from VIVIM local projects.
## Integration inventory to reconcile, not duplicate
Existing Harness main source inspected:
- src/studio/ui/universal-chat.mjs: source-qualified rich UI projection; tab != native conversation identity.
- src/studio/ui/chat.mjs and chat.html: chat state and source distinctions.
- src/capture/conversation-runtime.mjs: operational persisted conversation capture with browser lease and exact binding.
- src/intel/continuity.mjs: conservative evidence-derived identity joins.
- src/intel/search.mjs: local search index.
- src/export/export.mjs: exports, not yet proven world restore.
- src/studio/server.mjs: existing local API.
Other AION Role 15 inputs: discovery/VIVIM-CAPABILITY-ATLAS.yaml, discovery/V1-VALUE-CHAIN-CROSSWALK.yaml, core-library/COMMAND-SYSTEM.md, core-library/AGENTIC-FILE-LIBRARY.md, source-archive/SOURCE-MANIFEST.json.
Do not invent a new engine before mapping existing implementation and identifying actual gaps. Canonical runtime remains vivim-harness; Product Agent docs stay in AION.
## Integration contract / work sequence
1. Inventory all existing ontologies, identifiers, graph stores, map visualizers, schemas, commands and provenance mechanisms across relevant repos with paths, SHAs and evidence.
2. Build entity-type/relationship/axis crosswalk: existing source object -> WHAT/HOW/WHERE/WHEN/WHO -> stable identity -> evidence -> authority -> existing owner module -> missing adapter/gap.
3. Produce multi-map projection contract and typed graph queries; map outputs are views, not new competing stores.
4. Resolve conflicts by source-qualified identity and temporal history; never collapse different accounts or providers.
5. Propose minimal reuse-first integration slices, executable acceptance and source-owner assignments.
6. Interview owner only on genuine unresolved ontology semantics or irreversible architecture forks; do not ask about default home/navigation.
## Next owner fork (deferred until inventory)
Is the five-axis model a universal *annotation/query lens* over existing canonical entities, or a mandatory schema requirement for every entity/relationship? Avoid choosing until assessing existing stores and null/unknown handling.
No production code changed. No claims of test execution.
