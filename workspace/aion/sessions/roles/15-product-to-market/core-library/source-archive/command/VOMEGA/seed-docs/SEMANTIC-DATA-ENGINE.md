# Semantic Data Engine — Canonical Meaning, Runtime State, Reflection and Projection

Status: **OWNER-DIRECTED CORE DESIGN / ACTIVE HYPOTHESIS**  
Started: 2026-10-05

## 1. Purpose

VOMEGA needs one semantic substrate capable of supporting:

- natural-language interpretation;
- deterministic command compilation;
- Provider / Account / Model routing;
- capability discovery;
- realization selection;
- authority and consequence projection;
- self-knowledge and the contextual Wiki;
- visual feedback;
- replay;
- experiments;
- plugin installation and extension;
- historical explanation.

This document describes the **data/semantic engine shape** that should connect those systems without creating a universal monolithic database or parallel sources of truth.

The important principle is:

> **One semantic reality, many replaceable projections.**

The floating command box, contextual Wiki, CLI, tests, Semantic Runtime Lab and future surfaces should query the same semantic identities and relationships even when they render them differently.

## 2. What recent harvest changed

The 2026-10-05 OS-taxonomy external drop is useful evidence because it demonstrates a large concrete capability library:

- 291 platform-neutral capabilities in 25 domains;
- 305 Windows realizations;
- typed parameters;
- verbs/examples;
- effect/risk/consent metadata;
- exact / approximate / handoff fidelity;
- authored / verified-local / regressed evidence maturity;
- a 164-task coverage corpus;
- deterministic planning;
- generated manifest/catalog/database projections.

The strongest lessons should be generalized.

### Preserve

- **Capability ≠ realization.**
- Stable semantic capability IDs should be platform-neutral.
- Parameter schemas should be first-class data.
- Human examples and language data should be connected to capability semantics.
- Realizations should declare fidelity honestly.
- Evidence maturity should be explicit.
- One source can generate many projections.
- Coverage corpora are valuable development assets.
- Planning should be inspectable before execution.

### Do not canonize

The candidate pack encodes current risk into routed operation identity:

`os.r.*`, `os.m.*`, `os.x.*`.

VOMEGA should challenge this pattern.

Risk, consent policy and consequence classification may evolve without changing the semantic identity of a capability.

Preferred principle:

> **Semantic identity is stable; policy classification is derived/versioned metadata.**

A capability such as `web.url.open` should not need a new identity because authority policy changes.

## 3. Semantic planes

The engine should keep several planes related but distinct.

### 3.1 Durable product truth

User-owned records and revisions:

- Provider relationships;
- Accounts;
- defaults;
- durable configuration;
- Work;
- evidence;
- user language rules;
- history.

The exact physical store is replaceable. Current Vault concepts remain useful evidence.

### 3.2 Source-native structural truth

Facts derived from the exact loaded code/configuration:

- plugins;
- contributions;
- capabilities;
- schemas;
- parameters;
- realizations;
- configuration surfaces;
- language frames;
- visual roles;
- source anchors;
- dependencies.

This is the substrate of the Reflection Graph.

### 3.3 Derived runtime World

A bounded, versioned projection for grounding and interaction.

Examples:

- active Providers;
- known Accounts;
- available Models;
- capability state;
- valid realizations;
- defaults;
- current focus;
- stale/unknown evidence;
- language contributions.

The World is derived from source-native structure + durable state + current observations.

### 3.4 Interpretation artifacts

Per-input-revision deterministic artifacts:

- tokens;
- recognitions;
- candidates;
- grounded references;
- unresolved choices;
- candidate command;
- validation result;
- stage trace;
- candidate-manifold / alternative references sufficient for counterfactual evaluation;
- optional revision-bound negative-intent frontier derived from those same candidates.

The [Negative Intent Signal Engine](NEGATIVE-INTENT-SIGNAL-ENGINE.md) depends on this layer **not collapsing irreversibly to top-1 too early**. It evaluates the compiler's existing candidate semantics; it is not a second parser or authority source.

### 3.5 Projections

Replaceable representations:

- VisualSpec;
- contextual Wiki pages;
- concise natural-language rereading;
- CLI rendering;
- accessibility rendering.

A projection is not authority.

### 3.6 Experimental knowledge

The Semantic Runtime Lab additionally stores:

- scenarios;
- Profile versions;
- experiment hypotheses;
- metrics;
- results;
- falsifiers;
- rejected candidates;
- promotion records.

This must not become product truth merely because an experiment exists.

## 4. Stable semantic identity

Important semantic IDs should not encode replaceable implementation or policy.

Candidate families:

```
provider:chatgpt
provider:claude
provider:gemini

account:<stable-local-id>
model:<provider>/<provider-native-or-local-id>

capability:prompt.send
capability:audio.volume.set

realization:<provider-or-platform>/<capability>/<version>

concept:provider
concept:account
concept:model
concept:capability
concept:external-transfer

visual-role:entity.provider
visual-role:entity.account
visual-role:entity.model
visual-role:action.send
```

IDs shown above are illustrative, not frozen wire syntax.

### Identity rules

- Provider identity does not include Account.
- Account identity does not include Session.
- Model identity does not imply Account availability.
- Capability identity does not include Provider/platform.
- Realization identity does not replace capability identity.
- Risk class does not belong in capability identity.
- Visual icon/library name does not belong in semantic identity.
- Current availability does not belong in identity.
- Evidence state does not belong in identity.

## 5. Core semantic records

The following are conceptual shapes, not frozen TypeScript.

### Provider

```ts
type Provider = {
  id: SemanticId
  title: string
  aliases: string[]
  providerClass: string
  provenance: SourceRef[]
}
```

### Account

```ts
type Account = {
  id: SemanticId
  provider: SemanticId
  userLabel: string
  aliases: string[]
  identityEvidence: EvidenceRef[]
  state: "known" | "stale" | "needs-login" | "unknown"
  defaultFor?: SemanticId[]
}
```

### Model

Model is a first-class routing choice when a Provider exposes it.

```ts
type Model = {
  id: SemanticId
  provider: SemanticId
  providerNativeId?: string
  title: string
  aliases: string[]
  capabilityRefs: SemanticId[]
  evidence: EvidenceRef[]
}
```

A Model is not a Provider, Account or Session.

### Capability

```ts
type Capability = {
  id: SemanticId
  title: string
  summary: string
  concepts: SemanticId[]
  parameters: ParameterSpec[]
  language: LanguageRef[]
  consequence: ConsequenceSpec
  expectedEvidence: EvidenceKindRef[]
  related: SemanticId[]
  inverse?: SemanticId
  source: SourceAnchor[]
}
```

### Realization

```ts
type Realization = {
  id: SemanticId
  capability: SemanticId
  targetDomain: SemanticId[]
  implementation: SourceAnchor[]
  fidelity: "exact" | "approximate" | "handoff"
  evidenceMaturity: "authored" | "verified-local" | "regressed" | "unknown"
  preconditions: Condition[]
  compatibility: Constraint[]
}
```

### Command

```ts
type UseCommand = {
  schemaVersion: string
  capability: SemanticId
  provider?: SemanticId
  account?: SemanticId
  model?: SemanticId
  parameters: Record<string, unknown>
  realization?: SemanticId
  contextRefs: SemanticId[]
  consequence: ConsequenceSpec
  authorityRequirement: AuthorityRef
  expectedEvidence: EvidenceKindRef[]
  worldVersion: string
  interpretationRevision: string
  digest: string
}
```

This is a candidate shape. The important point is explicit identity and replay, not the field spelling.

## 6. Consequence is multidimensional

The current `READ / MUTATION / EXTERNAL_MUTATION` vocabulary is useful for current routing/law behavior but is too coarse to be the universal semantic description of consequences.

The OS taxonomy exposes why.

Showing a Wi-Fi password is sensitive but is not a mutation.

Opening a website crosses a network boundary but may not mutate local state.

Deleting a file is destructive but local.

Printing creates a physical effect.

Therefore semantic description should preserve orthogonal dimensions.

Candidate consequence facets:

```ts
type ConsequenceSpec = {
  mutability:
    | "none"
    | "reversible"
    | "destructive"
    | "session-ending"
    | "system-changing"

  externality:
    | "local"
    | "provider"
    | "network"
    | "physical"

  sensitivity:
    | "ordinary"
    | "personal"
    | "sensitive"
    | "secret"

  dataTransfer:
    | "none"
    | "metadata"
    | "user-content"
    | "secret"

  reversibility:
    | "not-applicable"
    | "reversible"
    | "partially-reversible"
    | "irreversible"
    | "unknown"

  visibility:
    | "silent"
    | "opens-ui"
    | "changes-visible-state"
    | "external-observable"
}
```

Authority policy may derive a gate from these facets plus current policy.

This keeps:

**consequence description ≠ authority decision**

## 7. Fidelity and evidence maturity

A realization needs at least two separate truth dimensions.

### Fidelity

What kind of result does the realization claim?

- **exact** — performs the capability as stated;
- **approximate** — performs a bounded close equivalent;
- **handoff** — opens or prepares the correct external/manual surface but does not claim the final effect.

### Evidence maturity

How strongly has that realization been proven?

- **authored** — designed/encoded but not live verified;
- **verified-local** — exercised in its intended local substrate with evidence;
- **automated-live** — repeatedly exercised against the real external substrate where relevant;
- **regressed** — previously verified and now failing;
- **unknown** — insufficient current evidence.

Do not collapse fidelity into maturity.

An exact design can still be unverified.

A handoff can be highly verified.

## 8. Language data belongs beside semantics

The OS taxonomy also demonstrates the usefulness of keeping verbs/examples close to capability records.

But language derivation must not be simplistic.

A capability can contribute:

- aliases;
- verbs;
- examples;
- parameter language;
- entity type hints;
- addressee patterns;
- canonical symbolic rendering;
- counterexamples.

These contributions feed the NCL/NLCL pipeline.

They do not execute.

A generated frame is a candidate language artifact and should be testable independently from the capability itself.

## 9. Reflection Graph

The Reflection Graph is a read-only derived graph over source-native structure.

It can answer:

- what capabilities exist?
- which plugin contributes them?
- what parameters exist?
- what source symbol defines them?
- which realizations implement them?
- which Provider/Account/Model types can ground them?
- what consequences are declared?
- what evidence is expected?
- what language frames refer to them?
- what visual roles represent them?
- what tests/falsifiers cover them?

It should not answer current availability without joining live World/evidence state.

## 10. World snapshots

A World snapshot should be an immutable, version-addressable grounding input.

For the first product it should be able to represent at minimum:

```
Providers
  ChatGPT
  Claude
  Gemini

Accounts
  ChatGPT Personal
  Claude Work
  Claude Personal
  Gemini Personal

Models
  provider-scoped fixture/observed models

Capabilities
  prompt.send

Availability
  capability × Provider × Account × Model

Defaults
  optional user-owned Provider/Account/Model defaults

Current focus
  input revision
  selected target
```

For the Visualization Sandbox these records are synthetic fixtures.

For the product they must come from evidence-backed runtime state.

The same interpreter should not care which source produced the World.

## 11. InterpretationSession

Realtime interaction needs a durable conceptual session even if the sandbox keeps it in memory.

```ts
type InterpretationSession = {
  sessionId: string
  activeRevision: number
  revisions: InputRevision[]
  selectedAlternatives: SemanticEdit[]
  worldVersion: string
  lastStableCommand?: CommandDigest
  // Derived, revision-bound counterfactual state may reference candidates from
  // this same interpretation session; it must never become hidden UI truth.
  negativeIntentFrontier?: NegativeIntentSignalRef[]
}
```

Each keystroke/edit creates a new revision.

Late results from revision N may never replace revision N+1.

This rule should be tested.

## 12. VisualSpec vNext

The UI should never re-interpret raw text itself.

It receives a deterministic semantic projection.

Candidate structure:

```ts
type VisualSpecVNext = {
  sessionId: string
  revision: number
  worldVersion: string

  interpretation: {
    status: string
    reading: string | null
    canonical: string | null
    confidence: number
  }

  annotations: VisualAnnotation[]
  semanticHandles: VisualHandle[]

  route: {
    capability?: SemanticHandle
    provider?: SemanticHandle
    account?: SemanticHandle
    model?: SemanticHandle
    realization?: SemanticHandle
  }

  validation: {
    state: "empty" | "interpreting" | "needs-choice" | "needs-info" |
           "ready" | "unavailable" | "refused"
    unresolved: UnresolvedHandle[]
  }

  // Derived from the same revision-bound candidate manifold. Usually the
  // compact surface exposes at most one highest-value counterfactual.
  negativeIntentFrontier?: NegativeIntentProjection[]

  consequences: VisualConsequence[]
  expectedEvidence: VisualEvidenceExpectation[]
  wiki: WikiTopicRef[]
  actions: VisualInteraction[]
}
```

The final contract should be earned through the sandbox.

## 13. Visual and Wiki use the same semantic handles

Every meaningful visible element should carry a semantic handle.

Example:

```
Claude icon
→ provider:claude

Work badge
→ account:<id>

Model chip
→ model:<id>

Send action
→ capability:prompt.send

external transfer marker
→ consequence:data-transfer/user-content
```

Clicking “Why?” or expanding an element passes that semantic ID to the Wiki projection.

The Wiki does not infer meaning from pixels.

## 14. Interaction write-back

A visual click must become an explicit semantic edit.

Examples:

```
choose Claude Work
→ set route.account = account:claude-work

choose a model
→ set route.model = model:<id>

remove model
→ clear route.model

select a different Provider
→ set route.provider = provider:<id>
   invalidate incompatible Account/Model selections
   revalidate command
```

The shell never silently mutates command meaning in private UI state.

Equivalent typed and clicked changes should converge on the same command digest.

## 15. Storage hypothesis

The long-term storage architecture remains replaceable.

A practical Lab/development configuration may use:

- SQLite for identities, edges, indexes, experiments and fast queries;
- canonical JSON/JSONL for versioned semantic artifacts and fixtures;
- content-addressed blobs for traces, screenshots and captured external evidence;
- source code + manifests as the structural source for Reflection;
- Vault/product storage for durable user-owned runtime state.

The architecture must survive replacing SQLite.

Therefore storage row identity is not semantic identity.

## 16. Derived indexes

Useful derived indexes may include:

- capability by verb;
- entity alias → semantic ID;
- Provider → Accounts;
- Provider → Models;
- capability → realizations;
- capability → language frames;
- semantic node → source anchors;
- semantic node → Wiki neighbors;
- scenario → expected semantic nodes;
- source symbol → Reflection nodes.

Indexes are rebuildable projections.

## 17. MVP semantic slice

The first visualization sandbox should deliberately expose only the slice needed to understand the real product.

### Providers

- ChatGPT
- Claude
- Gemini

### User relationships

Synthetic Accounts registered through the sandbox itself.

### Models

Fixture-driven Provider-scoped Model choices.

Do not claim current real provider model availability from fixtures.

### Capability

- `prompt.send`

### Product commands

- register Provider/Account relationship;
- label Account;
- list/show Accounts;
- set/change default Account;
- select Provider;
- select Account;
- select Model;
- describe current route;
- send prompt (simulated boundary only);
- explain interpretation;
- contextual help.

### Explicitly absent

- provider response reading;
- conversation import;
- attachments;
- project/workspace features;
- browser automation;
- actual external submission;
- fan-out;
- agent Work;
- Canvas.

## 18. OS taxonomy as benchmark corpus, not product scope

The external OS taxonomy should be retained as a **large independent semantic benchmark** for the Lab.

It is useful for testing whether:

- capability identity generalizes beyond AI;
- typed parameters generalize;
- consequence dimensions are adequate;
- language contribution mechanisms scale;
- the Reflection Graph scales;
- Wiki autogeneration remains useful with hundreds of capabilities;
- manifest/composition projection remains manageable;
- visual semantics can represent local OS commands without special-casing AI.

It does not expand the first MVP.

## 19. Determinism

For a pinned experiment:

```
same input revision
+ same World snapshot
+ same language artifacts
+ same semantic registry
+ same validator
+ same projector
= same command + same VisualSpec + same Wiki topic IDs
```

Presentation animation timing is not part of semantic determinism.

## 20. Query contract

The semantic engine should eventually support conceptual queries such as:

```
get semantic node <id>
neighbors of <id>
current World entity <id>
valid Accounts for capability/provider
valid Models for provider/account/capability
explain grounding decision
explain validation failure
resolve source anchors
rank Wiki topics for semantic context
replay command digest
```

Exact APIs remain open.

## 21. Falsifiers

This design is wrong if:

1. a visual component needs its own hidden copy of Provider/Account/Model truth;
2. a Wiki page must restate a parameter schema manually;
3. changing risk policy changes capability identity;
4. selecting a model in UI cannot be represented as a semantic edit;
5. a Provider-specific realization becomes the meaning of `prompt.send`;
6. a synthetic World is mistaken for observed product truth;
7. a handoff realization reports an exact effect;
8. an authored realization is displayed as verified;
9. a model can invent semantic nodes that execution trusts;
10. SQLite row structure becomes the ontology;
11. installing a plugin adds executable behavior that Reflection cannot see;
12. identical pinned inputs produce different command/VisualSpec/Wiki identities without recorded nondeterminism.

## 22. Immediate design use

This semantic data engine is the shared substrate for:

- [MVP Visualization Sandbox](MVP-VISUALIZATION-SANDBOX.md)
- [Automated Semantic Experiments](AUTOMATED-SEMANTIC-EXPERIMENTS.md)
- [Self-Knowledge Reflection Migrator](SELF-KNOWLEDGE-REFLECTION-MIGRATOR.md)
- [Semantic Runtime Laboratory](SEMANTIC-RUNTIME-LAB.md)
- [Self-Describing Runtime & Source-Native Contextual Wiki](SELF-DESCRIBING-RUNTIME-WIKI.md)
- [Command Visual Language](COMMAND-VISUAL-LANGUAGE-DESIGN.md)

## 23. Change record

- **2026-10-05:** Initial design. Incorporated lessons from the external OS-taxonomy candidate and old VIVIM symbolic/self-knowledge harvest. Added stable semantic identity, Model as a routing entity, multidimensional consequence semantics, fidelity/evidence maturity, source-native Reflection linkage and the MVP semantic slice.
