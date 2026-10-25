# Self-Knowledge Reflection Migrator — Existing Codebase to Source-Native Wiki Compliance

Status: **OWNER-DIRECTED DESIGN / ROADMAP SEED**  
Started: 2026-10-05

## 1. Purpose

VOMEGA already contains a substantial implementation baseline.

The self-describing runtime design should not require the team to manually rewrite the whole codebase into a new metadata format before the Reflection/Wiki architecture becomes useful.

We therefore need a migration/conformance utility that can:

> **inspect existing Ω code, extract what the code already proves about itself, identify missing self-description, propose safe source-native upgrades, and verify that the resulting codebase is Reflection/Wiki compliant.**

Working name:

**Reflection Migrator**

The name is not architectural law.

## 2. What the utility is not

It is not:

- a documentation generator;
- a README scraper presented as truth;
- an LLM that invents plugin semantics;
- a second registry;
- a source-code authority;
- a code-rewriting agent with permission to silently alter behavior;
- a universal ontology inference engine.

Its primary role is:

**audit → extract → map → propose → verify**

## 3. Design objective

The utility should let the team point at the current Ω source tree and answer:

- What plugins exist?
- What contributions do they declare?
- What routed operations exist?
- What schemas exist?
- What parameters are structurally knowable?
- What configuration keys exist?
- What risk/effect metadata exists?
- What capabilities and realizations can be inferred safely?
- Which language frames exist?
- Which visual roles exist?
- What source symbols own each fact?
- Which tests/falsifiers cover them?
- Which public behaviors have no self-description?
- Which descriptions are prose-only and therefore not structurally grounded?
- Where are the duplicate sources of semantic truth?
- What source-native declaration changes would make each gap compliant?

The output should be actionable enough for local coding agents to migrate the system incrementally.

## 4. Core rule

> **Extract facts; propose meaning; never fabricate proof.**

The utility may automatically extract:

- exact IDs;
- versions;
- schemas;
- dependency edges;
- manifest declarations;
- operation registration;
- source paths;
- exported symbols;
- configuration keys;
- enum/range constraints;
- test references.

It may suggest:

- human titles;
- semantic concepts;
- relationships;
- capability groupings;
- consequence descriptions;
- Wiki summaries.

Suggested meaning must remain marked candidate until accepted.

## 5. Input surfaces

The utility should inspect at least:

### Manifests

`plugin.json`

Extract:

- plugin identity;
- version;
- description;
- contributions;
- risk;
- dependencies;
- requested capabilities;
- justification;
- runtime tier;
- granularity;
- generality/provenance;
- contribution `doc` strings where present.

### Contracts

TypeScript contract declarations and contribution types.

Extract:

- IDs;
- parameter/output shapes where structurally available;
- enums;
- lifecycle states;
- relation types;
- risk/effect vocabularies.

### Plugin operation registration

Examples:

```ts
ops: {
  "mind.snapshot@1": ...
}
```

or dynamically assembled op maps.

The utility should compare actual registered ops against manifest-declared ops.

### Schemas

Zod-like schemas, declarative schema contributions, JSON schemas or equivalent.

Extract parameter structure rather than retyping it.

### Config parsing

Inspect config readers and validation.

Candidate facts:

- key;
- type;
- default;
- constraints;
- whether required;
- source symbol.

### Language contributions

- frames;
- verbs;
- aliases;
- slot types;
- examples;
- symbolic family;
- lexicon.

### Semantic registries

- Provider registry;
- command registry;
- capability registry;
- realization records.

### Visual contracts

- VisualSpec;
- semantic role maps;
- interaction actions.

### Tests

Tests are not product truth, but they can link Reflection nodes to falsifiers/proof artifacts.

### Source comments

Only structured/linked explanatory comments should be harvested as SOURCE_COMMENTARY.

Arbitrary comments are not canonical facts.

## 6. Reflection extraction pipeline

Preferred conceptual pipeline:

```
source tree
   ↓
file classification
   ↓
AST / structured parser
   ↓
symbol table
   ↓
manifest + schema + op reconciliation
   ↓
candidate Reflection nodes/edges
   ↓
source-anchor binding
   ↓
completeness analysis
   ↓
migration proposals
   ↓
optional source patch generation
   ↓
compile/test
   ↓
Reflection conformance report
```

Text grep alone is insufficient for the final tool.

## 7. SourceAnchor generation

Every extracted Reflection fact should retain an exact source relationship.

Candidate:

```ts
type SourceAnchor = {
  repository: string
  commit: string
  contentHash: string

  path: string
  symbol?: string

  range?: {
    startLine: number
    endLine: number
  }

  extractionKind:
    | "manifest"
    | "schema"
    | "op-registration"
    | "config"
    | "language"
    | "comment"
    | "test"
}
```

Line range is a navigation hint.

Symbol + content hash are stronger identity.

## 8. Candidate Reflection record

The migrator may emit a build artifact like:

```ts
type ExtractedReflection = {
  id: string
  kind: string
  title?: string
  summary?: string

  structuralFacts: Claim[]
  candidateSemanticFacts: Claim[]

  edges: ReflectionEdge[]
  sourceAnchors: SourceAnchor[]

  completeness: {
    structural: "complete" | "partial" | "unknown"
    semantic: "complete" | "partial" | "unknown"
  }

  gaps: ReflectionGap[]
}
```

This generated index is a derived build artifact.

It is not an authored Wiki database.

## 9. Claim classes

The utility should tag extracted claims.

### PROVEN_STRUCTURAL

Directly encoded in executable/source declarations.

Example:

> Plugin `vivim.providers` registers `providers.registry@1`.

### DECLARED

Declared in manifest/metadata but not independently proven by source.

Example:

> Manifest says an operation is READ.

### INFERRED_SAFE

Mechanically derivable with a deterministic rule.

Example:

> This parameter is optional because schema marks it optional.

### CANDIDATE_SEMANTIC

Requires human/agent interpretation.

Example:

> These three operations appear to implement one higher-level capability.

### COMMENTARY

Source-linked explanatory prose.

### CONFLICT

Two sources disagree.

Conflict is an output, not something the tool should silently resolve.

## 10. Existing codebase opportunity

The current Ω baseline is unusually suitable for automatic migration because it already contains rich structure:

- one manifest format;
- contribution kinds;
- risk declarations;
- source-side operation registration;
- declarative language contributions;
- explicit schemas;
- Provider realization records;
- deterministic NLCL types;
- Forge specs;
- plugin descriptions;
- source comments;
- conformance tests.

The migrator should exploit that before asking developers to add new annotations.

## 11. First migration target: PluginManifest

The current `PluginManifest` can seed Reflection nodes for:

```
Plugin
Contribution
Dependency
RequestedCapability
RuntimeTier
Generality/Provenance
```

Current contract-level `doc` strings can seed explanatory metadata.

The migration tool should measure which contribution types currently carry richer fields that are not reflected by the TypeScript base `Contribution` interface.

This is likely an important design seam.

## 12. Manifest ↔ actual runtime parity

A major conformance check:

> Every operation registered by source must have an appropriate declared contribution, and every declared routable contribution must resolve to implementation or an explicitly external realization.

Candidate report:

```
DECLARED + IMPLEMENTED
DECLARED, IMPLEMENTATION NOT FOUND
IMPLEMENTED, NOT DECLARED
DYNAMIC — NEEDS EXPLICIT REFLECTION PROVIDER
```

Dynamic registration is allowed.

Opacity is not.

## 13. Schema reuse

The migrator should find cases where:

- a runtime schema exists;
- a help description independently redefines the same parameter;
- a language frame independently redefines the same type.

Those are drift risks.

Preferred migration:

```
one parameter schema
→ runtime validation
→ language slot constraints
→ VisualSpec parameter explanation
→ Wiki projection
```

Not every transformation can be fully automatic, but duplication should be detected.

## 14. Config self-description

Config is a likely blind spot.

The utility should inspect patterns such as:

```ts
const timeoutMs =
  c["timeoutMs"] === undefined ? 60000 : Number(c["timeoutMs"])
```

and produce a candidate configuration Reflection record:

```
key: timeoutMs
type: integer
default: 60000
constraints: ...
source: parseConfig
```

If extraction is uncertain, mark it unknown and request an explicit declaration.

## 15. Capability discovery

Do not infer “capability” merely because an operation exists.

The utility can propose capability candidates from:

- contribution metadata;
- command registry;
- language frames;
- capability registry;
- grouped operation naming;
- Provider realizations;
- semantic docs.

Candidate grouping requires review.

The eventual architecture should prefer explicit source-native capability declarations.

## 16. Realization discovery

The migrator should distinguish:

```
capability meaning
≠
provider/platform realization
```

The OS taxonomy harvest is a good reference.

If existing code mixes semantic capability and implementation detail, the tool should flag this as a migration candidate rather than invent a clean split.

## 17. Consequence migration

Current code often has only:

`READ / MUTATION / EXTERNAL_MUTATION`.

The utility may translate that into partial consequence metadata, but must not invent dimensions it cannot prove.

Example:

```
EXTERNAL_MUTATION
→ authority-class known
→ mutability/externality/sensitivity UNKNOWN unless source declares more
```

This prevents current policy vocabulary from becoming fake semantic precision.

## 18. Language migration

The old VIVIM harvest confirms that `lang.ts`, `grammar.ts`, `recognize.ts`, `interpret.ts`, and related implementation are already in the current baseline.

The migrator should therefore link:

```
Capability / Command
→ LangContribution
→ Frame
→ Slot
→ Symbol family
→ examples
```

rather than duplicating the language definition.

## 19. Visual migration

The current baseline declares VisualSpec types but has only partial projection implementation.

The migrator should inventory:

- visual types;
- projector functions;
- semantic roles;
- UI actions;
- source anchors.

A visual component that triggers a semantic action with no command/interaction registration should be flagged.

## 20. Wiki compliance definition

A component is not Wiki-compliant because it has prose documentation.

Candidate compliance means:

1. stable reflected identity;
2. exact source anchor;
3. structural facts available;
4. relevant relationships available;
5. public parameters/config exposed;
6. consequence/authority metadata present where applicable;
7. implementation/realization relation present;
8. active runtime state can join to the reflected identity;
9. historical version can be resolved;
10. no required separate Wiki file.

## 21. Utility modes

Candidate CLI:

```
omega-reflect audit
omega-reflect extract
omega-reflect graph
omega-reflect gaps
omega-reflect propose
omega-reflect patch --proposal-only
omega-reflect verify
```

Names are illustrative.

### audit

Fast summary.

### extract

Emit derived machine-readable Reflection graph.

### graph

Inspect/query relationships.

### gaps

List missing self-description by severity.

### propose

Generate candidate source-native metadata/declaration changes.

### patch --proposal-only

Create patch artifacts without modifying main source.

### verify

Fail CI/conformance when required Reflection completeness is not met.

## 22. No-write default

The utility should default to read-only.

Any source transformation should be:

- explicit;
- previewable;
- diffable;
- test-gated;
- reversible.

The utility itself should not gain authority to accept its proposals.

## 23. Safe automatic transformations

Good candidates for automatic patch generation:

- add exact source anchor metadata;
- derive manifest docs from existing typed declaration;
- replace duplicated parameter help with schema references;
- add missing static Reflection IDs when mechanically obvious;
- convert repeated declarative object patterns into a shared helper without semantic change;
- add conformance tests.

Poor candidates for automatic acceptance:

- choosing a new capability ontology;
- changing risk/authority;
- inferring user intent;
- merging/splitting semantic concepts;
- inventing human-facing explanations;
- claiming evidence maturity.

## 24. LLM assistance

An LLM may help propose:

- titles;
- summaries;
- concept tags;
- relationship candidates;
- rationale extraction from comments/tests;
- duplicate-semantic detection.

Every suggestion should be labeled candidate and connected to source evidence.

LLM output must not turn into a structural Reflection claim without deterministic confirmation or review.

## 25. Migration strategy

### Wave 1 — audit only

Run against current `omega-baseline`.

Produce:

- plugin inventory;
- op inventory;
- schema inventory;
- language inventory;
- source anchors;
- missing Reflection categories.

### Wave 2 — generated Reflection

Build useful Wiki/inspection views directly from what already exists.

Do not modify product code yet.

### Wave 3 — source-native enrichment

Add minimal semantic declarations where current sources are insufficient.

### Wave 4 — declaration consolidation

Where evidence supports it, introduce helpers such as:

```
defineCapability(...)
defineConfig(...)
defineRealization(...)
defineVisualRole(...)
```

that generate existing wire forms rather than replacing them all at once.

### Wave 5 — completeness gate

New/modified public product behavior must pass Reflection completeness.

### Wave 6 — Forge compliance

Forge-generated plugins emit valid self-description automatically.

## 26. Legacy compatibility

Existing plugins may initially be marked:

```
reflection-status: legacy-derived
```

New plugins:

```
reflection-status: source-native
```

This supports incremental migration.

The distinction must not imply that legacy code is less authorized or source-native code more trusted.

It is only self-description maturity.

## 27. Output reports

The migrator should produce a compact top-level report:

```
plugins scanned
routable ops
declared ops
schemas
config surfaces
language contributions
Reflection nodes
source anchors

missing operation declaration
missing source anchor
missing parameter description
duplicate schema
unresolved capability/realization split
unreflected UI action
unknown consequence
prose-only claim
source conflict
```

Then provide drill-down per plugin.

## 28. Priority scoring

Migration gaps can be ranked by:

- product exposure;
- consequential behavior;
- MVP relevance;
- number of dependent components;
- ambiguity;
- drift risk;
- absence of source anchor;
- duplicate semantic definitions.

This lets local agents migrate important surfaces first.

## 29. MVP-first migration target

The first compliance target should be only the code needed for the Visualization Sandbox / first product slice:

- Provider;
- Account;
- Model;
- `prompt.send`;
- registration commands;
- language frames;
- command validator;
- VisualSpec;
- contextual Wiki;
- simulated realization.

Do not block the sandbox on full-repo migration.

## 30. OS taxonomy benchmark

Run the migrator against the external OS taxonomy candidate as a separate benchmark.

It should be able to detect:

- 291 capability candidates;
- parameter schemas;
- language examples;
- 305 realization records;
- fidelity;
- evidence maturity;
- relationship between generated manifest and source database;
- risk identity coupling as an architecture smell/candidate conflict.

This is a strong scale test.

## 31. CI/conformance integration

Eventually:

```
source change
→ normal tests
→ reflection extract
→ reflection completeness
→ manifest/runtime parity
→ Wiki claim-grounding tests
```

A build should not fail because prose is aesthetically incomplete.

It should fail when public consequential behavior becomes structurally opaque.

## 32. Relationship to the Contextual Wiki

The utility exists primarily for migration/development.

The product Wiki should consume the resulting Reflection surface.

It should not run a repository AST scan every time a user asks “Why?”

Compile/build/install produces the reflection descriptor/index.

Runtime consumes the descriptor plus live state.

## 33. Relationship to Forge

Long term:

```
Forge specification
→ source-native semantic declaration
→ plugin source
→ manifest
→ Reflection descriptor
→ tests
```

all emitted coherently.

The migrator is the bridge for code that predates that development model.

## 34. Local-agent roadmap seed

### REF-01 — Current-code extractor assay

Map all declarative patterns and choose AST/parser strategy.

### REF-02 — Manifest + op parity extractor

Generate Plugin/Contribution/Operation nodes with source anchors.

### REF-03 — Schema/config extractor

Map structural parameter/config metadata.

### REF-04 — Language extractor

Link LangContribution/frames/slots/examples to semantic operations.

### REF-05 — Reflection graph serializer

Produce deterministic graph output from pinned commit.

### REF-06 — Completeness analyzer

Detect missing/duplicate/conflicting self-description.

### REF-07 — Wiki projection proof

Generate contextual pages from extracted graph with no Wiki files.

### REF-08 — Proposal engine

Produce source-native migration suggestions without writing source.

### REF-09 — Patch generator

Generate safe, reviewable source changes for selected mechanical gaps.

### REF-10 — MVP compliance run

Bring the Provider/Account/Model/`prompt.send` slice to source-native compliance.

### REF-11 — OS taxonomy benchmark

Run scale/consequence/fidelity extraction against the external pack.

### REF-12 — Forge integration design

Ensure future generated plugins are compliant by construction.

## 35. Acceptance criteria

The utility is useful when, against a pinned current checkout, it can:

1. deterministically enumerate public plugin behavior;
2. bind facts to exact source symbols/content;
3. identify unreflected behavior;
4. generate a useful Reflection Graph without Wiki docs;
5. surface unknowns rather than inventing semantics;
6. propose migration patches separately from accepted truth;
7. rerun after changes and show measurable completeness improvement;
8. power at least one real contextual Wiki projection;
9. verify the MVP semantic slice;
10. operate without changing product authority.

## 36. Falsifiers

The design fails if:

1. it treats README prose as stronger than executable declarations;
2. it invents capability semantics to reach 100% coverage;
3. it rewrites source by default;
4. generated Reflection cannot be traced to source;
5. dynamic op registration becomes invisible;
6. config/help schemas remain duplicated;
7. it requires source comments for structural facts already present in code;
8. a successful migration silently changes runtime behavior;
9. LLM suggestions are indistinguishable from extracted facts;
10. runtime Wiki depends on reparsing the entire source tree live;
11. compliance becomes documentation bureaucracy rather than structural transparency.

## 37. Change record

- **2026-10-05:** Initial design. Defines a read-first migration/conformance utility to turn the current Ω codebase into source-native Reflection/Wiki-compliant structure without creating a parallel documentation database.
