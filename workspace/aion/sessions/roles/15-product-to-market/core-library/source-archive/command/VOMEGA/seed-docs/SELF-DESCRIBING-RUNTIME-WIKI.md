# Self-Describing Runtime & Source-Native Contextual Wiki

Status: **OWNER-DIRECTED ARCHITECTURE DESIGN / ACTIVE HYPOTHESIS**  
Started: 2026-10-05  
Scope: merge VOMEGA self-knowledge, plugin architecture, semantic runtime laboratory and contextual Wiki into one source-native self-description system.

## 1. Owner requirement

VOMEGA should be able to explain itself in real time without maintaining a second documentation system that drifts away from the implementation.

The person should be able to ask for more detail at any point:

- What does this command mean?
- What is this icon?
- Why did Ω choose this Account?
- What can this plugin do?
- What does this parameter change?
- Why is this capability unavailable?
- What will happen if I confirm?
- Which component performs this?
- Where did this fact come from?
- What other capabilities are related?
- What is the source implementation?
- Why does Ω believe this is true?

While the person types or explores, the system should continuously maintain the most relevant **Wiki topics and links** for the current semantic context.

These topics should not come from a manually authored Wiki corpus.

Core design proposition:

> **Ω's executable structure is its Wiki source.**

The Wiki is a projection of actual source-level semantic declarations, loaded plugin contributions, schemas, configuration, relationships, runtime state, evidence and source-linked explanatory annotations.

No separate documentation files are required for a plugin to become understandable.

## 2. Important boundary decision

> **Authority note (2026-10-06).** This document's status is ACTIVE HYPOTHESIS. Two things in it are settled by owner requirement: the Wiki is a projection, not a separately authored store, and self-description never grants authority. The stronger statements that follow ("a plugin may not opt out", "the reflective obligation is constitutional" in §22, the core primitives in §24) are a *proposed* constitutional change. `INVARIANTS.md` currently records it as a direction ("the product should move toward the invariant"), and adopting it as law is an owner decision that should follow evidence from a read-only Reflection extraction. Until then, no core or manifest contract changes on this document's authority alone.

The **Wiki renderer/relevance engine does not belong in the constitutional core**.

The constitutional core should enforce only the minimum property required for trustworthy self-description:

> **Every loadable Ω contribution must expose a complete machine-readable self-description through one universal Reflection ABI.**

This obligation is analogous to requiring every plugin to have identity, dependencies or requested capabilities.

A plugin may not opt out.

The core/loader is responsible for:

- validating the self-description contract;
- binding description to the exact loaded artifact/version/content hash;
- exposing the installed contribution graph through a read-only reflection surface;
- proving that routable/configurable/public behaviors are represented in that graph;
- preventing descriptive metadata from granting authority.

Everything after that remains replaceable:

- self-knowledge assembly;
- page projection;
- contextual ranking;
- search;
- natural-language phrasing;
- visual Wiki presentation;
- navigation style;
- source viewer;
- recommendation UI.

This preserves the existing principle:

> **Self-knowledge is a derived lens, never authority.**

But it strengthens the substrate so self-knowledge can no longer be incomplete merely because a plugin author forgot to write Wiki documentation.

## 3. No parallel Wiki database

Do not introduce a canonical store of authored Wiki pages.

Avoid:

```
source code
   +
plugin manifest
   +
runtime registry
   +
README
   +
Wiki database
   +
help JSON
   +
tooltips
```

where six representations eventually contradict one another.

Prefer:

```
SOURCE-NATIVE SEMANTIC DECLARATIONS
              ↓
        loaded contribution
              ↓
         Reflection Graph
          ↙          ↘
  runtime behavior   self-knowledge
                         ↓
                  Wiki projection
```

The Wiki does not own facts.

It renders facts owned by the same executable declarations and runtime evidence that the system itself uses.

## 4. “Code is the Wiki” does not mean comments are authority

There are three useful classes of self-description.

### 4.1 Executable structural truth

This is the highest-value source and should be derived from actual declarations whenever possible:

- plugin identity/version;
- contribution IDs;
- command IDs;
- parameter names and types;
- schemas;
- configuration keys and constraints;
- requested capabilities;
- dependencies;
- risk/effect classes;
- routable operations;
- evidence expectations;
- realization bindings;
- compatible entities/providers;
- runtime tier;
- availability state;
- current implementation version.

These facts should not be separately retyped into documentation.

### 4.2 Source-native semantic declarations

Some facts are necessary for human understanding but are not implied by a TypeScript type alone.

Examples:

- human title;
- concise purpose;
- semantic concept membership;
- consequence explanation;
- distinction from a related operation;
- example utterances;
- recovery explanation;
- reason a configuration exists;
- expected evidence;
- common misconception.

These should live **beside the executable declaration in source**, preferably inside the same typed object used to register the capability/contract/configuration.

### 4.3 Linked inline commentary

Longer rationale or implementation explanation may live in structured source comments.

Comments are useful enrichment, not canonical runtime truth.

A comment may explain *why* a mechanism exists.

It may not override:

- a runtime schema;
- actual permissions;
- risk class;
- current availability;
- evidence;
- authority;
- loaded dependency state.

Where comments are included in the Wiki, the build should bind them to an exact source symbol and content hash so the user can see what version produced the explanation.

## 5. Source-native declaration pattern

The long-term developer experience should move toward one declaration carrying runtime semantics and self-description together.

Illustrative only:

```ts
export const promptSend = defineCapability({
  id: "prompt.send",
  version: "1",

  title: "Send a prompt",
  summary: "Send content to a selected AI Provider Account.",

  concepts: [
    "capability",
    "provider",
    "account",
    "external-transfer"
  ],

  input: schema.object({
    account: ref("account").describe(
      "The exact authenticated Provider Account that receives the prompt."
    ),
    prompt: schema.string().describe(
      "Content sent to the selected external Provider."
    )
  }),

  effect: externalMutation({
    summary: "Transfers the prompt content to an external Provider Account."
  }),

  authority: authority.externalMutation(),

  evidence: [
    "submission.attempted",
    "submission.observed",
    "response.observed"
  ],

  examples: [
    "Ask Claude to explain this error",
    "Send this to my Work Claude account"
  ]
});
```

The exact API above is not selected.

The important principle is:

> The object that makes the capability real should contain or directly reference the information required to explain it.

A build step may compile that declaration into the existing manifest/contract wire format.

The Wiki should not require another author to restate it.

## 6. The Reflection ABI

The Reflection ABI is the candidate core primitive.

It describes how any installed Ω artifact exposes what it is.

A reflected node should be capable of expressing at least:

- stable semantic ID;
- kind;
- version;
- loaded artifact/content digest;
- title;
- concise description;
- semantic concepts;
- inputs/outputs;
- relationships;
- dependencies;
- capabilities requested/provided;
- risk/effects;
- authority requirement;
- evidence expectation;
- configuration surface;
- lifecycle/deprecation state;
- examples where relevant;
- source anchor(s);
- owning plugin/package;
- provenance/generality evidence where applicable.

The ABI should be **descriptive only**.

A reflection record must never:

- grant a capability;
- authorize an operation;
- mark evidence as verified merely by claiming so;
- make an unavailable capability available;
- change routing;
- override law;
- mutate product state.

## 7. Reflection Graph

At load/compile time the core assembles a **Reflection Graph** from the contributions that actually exist.

Candidate node families:

- CorePrimitive;
- Plugin;
- Pack;
- Capability;
- Command;
- Contract;
- Engine;
- Provider;
- Realization;
- Surface;
- Schema;
- Parameter;
- Configuration;
- SemanticConcept;
- State;
- EvidenceKind;
- AuthorityRequirement;
- LanguageFrame;
- Parser;
- VisualRole;
- Interaction;
- Test/Falsifier;
- SourceSymbol.

Candidate edge families:

- `contributes`;
- `implements`;
- `realizes`;
- `dependsOn`;
- `accepts`;
- `returns`;
- `targets`;
- `requires`;
- `mutates`;
- `reads`;
- `writes`;
- `emitsEvidence`;
- `configuredBy`;
- `governedBy`;
- `availableThrough`;
- `representedBy`;
- `interpretedBy`;
- `testedBy`;
- `derivedFrom`;
- `sourceAt`;
- `supersedes`;
- `relatedTo`.

This vocabulary should evolve from actual needs. It is not frozen by this document.

The graph is a **derived view of loaded reality**.

It is not a second canonical ontology.

## 8. Source anchors

Every reflected item should be traceable to the exact artifact that caused it to exist.

Candidate source anchor:

```ts
type SourceAnchor = {
  pluginId: string
  pluginVersion: string
  contentHash: string
  module?: string
  symbol?: string
  sourcePath?: string
  sourceRange?: {
    startLine: number
    endLine: number
  }
}
```

Line numbers are convenient but not sufficient identity because files move.

Prefer symbol identity + content digest, with line/range as a human navigation hint.

For source unavailable at runtime, the compiled descriptor can still preserve:

- package/plugin;
- symbol;
- source digest;
- optional repository/commit provenance.

## 9. Self-description of the core itself

Plugins must not be the only understandable parts of Ω.

The constitutional core should expose its own built-in Reflection nodes through the same read-only vocabulary where practical.

Examples:

- plugin loading;
- manifest validation;
- authority boundary;
- evidence rules;
- recipe/grant semantics;
- reflection ABI itself;
- isolation/runtime tiers;
- constitutional-change boundary.

Core reflection is descriptive.

It does not make core mutable through ordinary Forge/plugin operations.

This makes the system capable of answering:

> Why can't this plugin grant itself permission?

by linking:

```
plugin capability request
→ manifest request semantics
→ Recipe grant boundary
→ law check
→ constitutional invariant
→ relevant source anchors
```

instead of returning a manually maintained paragraph.

## 10. Plugin installation automatically wires self-knowledge

Desired installation invariant:

> **If Ω can load it, Ω can explain it.**

When a plugin is installed/activated:

1. manifest/source declarations are validated;
2. its reflected nodes/edges are bound to the exact plugin digest;
3. contribution relationships are merged into the current Reflection Graph;
4. capability/runtime state derives normally;
5. Wiki/search/help views immediately become capable of projecting the new concepts;
6. no Wiki registration call or documentation file is required.

When the plugin is disabled/uninstalled:

- it disappears from current active capability claims;
- historical executions continue to resolve against the versioned descriptor/digest that actually participated;
- documentation history is not rewritten.

## 11. Completeness gate

The strongest part of this design should be mechanically enforced.

A plugin should fail build/acceptance — or remain quarantined as incomplete during early migration — if it exposes public product behavior that cannot be reflected.

Candidate completeness tests:

### Routable completeness

Every routable operation has a Reflection node.

### Parameter completeness

Every required public input/output field is represented through the same schema used at runtime.

### Configuration completeness

Every user-addressable configuration key is self-described.

### Capability completeness

Every capability the plugin exposes or requests is linked.

### Effect completeness

Every product-state-changing operation declares its risk/effect semantics.

### Evidence completeness

Every consequential operation states what evidence can establish attempted/completed/verified outcome.

### Source completeness

Every reflected behavior resolves to a loaded artifact and preferably a source symbol.

### UI completeness

Any plugin-provided public interaction resolves to a semantic command/capability, rather than an undocumented private handler.

This should become part of plugin/Forge conformance.

## 12. Development protocol

New Ω plugin development should follow:

```
declare semantic contribution in source
        ↓
derive/compile manifest + reflection descriptor
        ↓
static completeness checks
        ↓
plugin tests
        ↓
load in disposable composition
        ↓
Reflection Graph inspection
        ↓
Wiki projection test
        ↓
normal product proof
```

No separate “write the Wiki page” stage exists.

### Protocol rules

1. Public behavior must be declared through a self-describing contribution primitive.
2. Schemas are reused for runtime validation and explanation; do not duplicate parameter definitions in help.
3. Inline prose may enrich semantics but cannot contradict structural runtime facts.
4. New semantic concepts should be referenced through stable IDs, not inferred from arbitrary prose.
5. A plugin's user-facing configuration surface must be discoverable through reflection.
6. Every consequential operation must expose consequence + evidence semantics.
7. Every external/public capability must expose its implementation/realization relation.
8. Plugin tests should include reflection completeness.
9. Forge-generated plugins must generate valid self-description automatically.
10. README/Markdown documentation may exist for repository contributors but is neither required nor runtime authority.

## 13. Virtual Wiki pages

A Wiki **page is not stored**.

A page is a projection of one node + related graph + current live state.

Conceptual identifiers:

```
omega://wiki/plugin/vivim.nlcl@0.1.0
omega://wiki/capability/prompt.send@1
omega://wiki/concept/account
omega://wiki/config/provider.default
omega://wiki/state/needs-login
omega://wiki/command/<intent-or-command-digest>
omega://wiki/evidence/<evidence-ref>
omega://wiki/source/<content-hash>/<symbol>
```

A capability page might project:

- what it does;
- exact parameters;
- current availability;
- current compatible Accounts/Providers;
- effects;
- authority requirement;
- expected evidence;
- realization(s);
- related commands;
- examples;
- current limitations;
- tests/falsifiers;
- source implementation.

No one manually maintains that page.

## 14. Realtime contextual Wiki

The user should not need to open a Wiki and browse from the root.

The current semantic session already tells Ω what is relevant.

For:

> Ask Claude to explain this error.

the interpretation may expose references to:

- `prompt.send`;
- Claude Provider;
- unresolved Account;
- referenced payload;
- external transfer;
- context resolution;
- perhaps `needs-choice`.

The Wiki relevance layer can therefore maintain a ranked set such as:

1. **Which Claude Account?**
2. **prompt.send**
3. **Provider vs Account**
4. **What will be sent externally?**
5. **Why Ω needs a choice**
6. **How Account defaults work**

As the expression becomes more specific, the ranking changes.

The system is not searching arbitrary documentation text.

It is traversing semantic IDs already produced by the active interpretation.

## 15. Relevance should be derived, not mystical

Candidate ranking inputs:

- current interpreted capability;
- target/addressee;
- unresolved fields;
- validation state;
- current selection/focus;
- availability problem;
- authority/consent boundary;
- execution state;
- recent correction;
- user-expanded concept;
- graph distance from active semantic nodes.

A deterministic baseline is preferable.

A model may improve phrasing or rank a large candidate set later, but it must not invent Wiki nodes or capabilities.

## 16. Wiki and visual command language are one system

The visual feedback layer should attach help to the semantic object already being shown.

Examples:

- selecting the computer icon opens `device.this_pc` / local execution context;
- selecting the Claude handle opens Provider/Account identity and capability links;
- selecting a dashed unresolved enclosure opens the unresolved semantic field and valid alternatives;
- selecting an external-transfer marker opens the exact data/effect boundary;
- selecting a consequence badge opens risk, authority and evidence expectations;
- selecting “Why?” on a target opens replay/grounding explanation.

The Wiki should not infer meaning from the icon.

The icon and Wiki are both projections of the same semantic object.

## 17. Wiki and Semantic Runtime Lab

The [Semantic Runtime Laboratory](SEMANTIC-RUNTIME-LAB.md) should use the same Reflection ABI.

This allows the Lab to introspect every experimental module automatically.

When a Lab Profile swaps:

- parser;
- taxonomy;
- command pack;
- executable;
- visual pack;

the Lab Wiki immediately reflects the selected Profile.

The Lab can therefore test not only behavior but **explainability completeness**.

Candidate experiment:

> Install a new synthetic plugin with a never-before-seen capability and zero documentation files.

Success requires that the Lab can immediately generate:

- plugin page;
- capability page;
- parameter explanations;
- effects;
- requested permissions;
- related concepts;
- source links;
- current availability;
- executable realization;
- contextual help when a matching prompt is typed.

If a human-authored Wiki file is required, the architecture failed this test.

## 18. Runtime facts versus explanatory claims

Every Wiki fragment should retain claim provenance.

Useful classes:

### STRUCTURAL

Directly derived from loaded executable declarations.

Example:

> `prompt.send` requires an Account parameter.

### LIVE_STATE

Derived from current registry/evidence.

Example:

> Claude Work currently needs login.

### HISTORICAL_EVIDENCE

Derived from a prior trace/version.

Example:

> This realization successfully submitted on version X at time Y.

### SOURCE_COMMENTARY

Human/agent explanation tied to source.

Example:

> This resolver exists to avoid ambiguous default selection.

### GENERATED_SUMMARY

Model-generated phrasing over grounded claims.

Example:

> “You have two Claude Accounts, so Ω needs you to choose one.”

The UI may blend these naturally, but the system should be able to reveal their origin.

## 19. Model use

A model may:

- summarize several reflected facts;
- explain them at novice/expert depth;
- generate a conversational answer;
- rank relevant explanations;
- translate terminology.

A model may not become the source of truth for:

- existence of capability;
- current Account/session state;
- authority;
- permissions;
- parameter schema;
- actual implementation;
- evidence status.

Generated prose should resolve to claim IDs/source refs before being presented as grounded product knowledge.

## 20. Self-knowledge closed loop

The historical architecture already treated `vivim.mind` as a deterministic WorldModel projection.

This design strengthens that into a closed loop:

```
loaded code/contracts/config
          ↓
    Reflection Graph
          ↓
live registry + evidence
          ↓
 derived Self Model / WorldModel
       ↙            ↘
interpretation      Wiki
       ↓              ↓
execution         explanation
       ↓              ↓
evidence ─────────────┘
       ↓
self-model refresh
```

The system can now explain not only what it *was designed* to do but what is *currently true*.

## 21. Relationship to authority

Self-description must remain outside authority.

The Reflection Graph can state:

> This operation requests EXTERNAL_MUTATION authority.

It cannot state:

> Therefore it is allowed.

The current authority decision remains owned by the authority system.

Likewise:

- description ≠ permission;
- description ≠ availability;
- description ≠ proof;
- source comment ≠ evidence;
- Wiki page ≠ canonical state.

## 22. Reprogrammability

The reflection substrate should itself support Ω's reprogrammability model.

A plugin may contribute:

- new semantic concepts;
- new capabilities;
- new schemas;
- new language frames;
- new visual roles;
- new config surfaces;
- new relation types where admitted;
- new Wiki renderers or explanation strategies.

But it should not be able to make itself invisible to reflection.

The reflective obligation is a **proposed product invariant**, not current constitutional law. The Reflection Lab may enforce it internally as a falsifiable constraint while gathering evidence; product adoption requires explicit promotion.

How reflection is rendered is not.

## 23. Migration path from current manifests

Current manifests already contain useful seeds:

- plugin identity/version;
- description;
- contribution types;
- contract IDs/versions/risk;
- occasional contribution `doc` strings;
- dependencies;
- requested capabilities + justification;
- runtime tier/budget;
- provenance/generality metadata.

Therefore the first implementation does not require a clean-sheet metadata system.

Candidate migration:

### Phase A — derive from what exists

Build Reflection Graph from current `PluginManifest` + contribution objects + registry state.

### Phase B — add source anchors and typed semantics

Extend contribution definitions with source/semantic metadata without changing authority semantics.

### Phase C — code-first declaration

Introduce declaration helpers that generate/validate manifest contributions and reflection together.

### Phase D — completeness gate

Require self-description for all new/modified public plugin contributions.

### Phase E — Forge enforcement

Generated plugins are self-describing by construction.

This migration allows existing plugins to remain loadable while preventing new debt.

## 24. Core change hypothesis

The likely core change is **smaller than moving self-knowledge into core**.

Candidate core primitives:

1. reflection-capable manifest/contribution contract;
2. content-hash-bound SourceAnchor;
3. compile/load-time reflection completeness validation;
4. read-only reflection snapshot/query host capability;
5. stable identity rules for reflected nodes.

Potential host surface:

```
host.reflect.snapshot@1
host.reflect.get@1
```

or an equivalent existing graph snapshot extension.

Exact operation names are open.

The core should not contain:

- Wiki page templates;
- contextual relevance ranking;
- English explanations;
- search UX;
- model prompts;
- plugin-specific concepts;
- product help copy.

## 25. Falsifiers

The design fails if any of the following are true:

1. A plugin can expose a routable operation that the Reflection Graph cannot see.
2. Installing a plugin requires adding a Wiki/README/help file before the product can explain it.
3. A Wiki page survives after the underlying capability disappears but still presents it as currently available.
4. Source commentary can override risk, authority or actual runtime schema.
5. The Wiki claims a capability not present in the active graph.
6. The same parameter is defined separately in runtime code and Wiki metadata.
7. An icon/component has undocumented behavior outside a semantic contribution.
8. A plugin can request/exercise new authority through reflection metadata.
9. Replacing the Wiki renderer changes command semantics.
10. A historical execution cannot resolve the versioned description of the component that produced it.
11. Core self-description is omitted, making the host a black box.
12. Forge can produce a plugin that passes product gates while lacking reflection completeness.

## 26. First proof

Build the smallest end-to-end proof around one existing and one synthetic capability.

### Existing

`prompt.send`

### Synthetic

`audio.volume.set` in the Semantic Runtime Lab.

Neither gets a Wiki file.

The proof should show:

1. both declarations enter reflection automatically;
2. typing a related command selects the relevant pages;
3. capability/parameter/effect/authority/evidence/source information is generated;
4. swapping visual language does not alter Wiki facts;
5. changing World availability immediately changes contextual explanation;
6. source links resolve to the exact declaration version;
7. installing a third synthetic plugin causes its Wiki surface to appear with no Wiki-specific code;
8. removing that plugin removes current capability claims but preserves historical version resolution.

## 27. Strategic consequence

This design turns self-knowledge from a feature into an architectural property.

The goal is no longer:

> “VIVIM has a help system.”

The goal is:

> **VIVIM is structurally incapable of loading a product capability that it cannot inspect and explain.**

That is the stronger interpretation of a self-describing, self-evolving Ω.

A new plugin expands:

- what Ω can do;
- what Ω knows about itself;
- what language can refer to;
- what the user can inspect;
- what the Wiki can explain;

through one installation event.

No second documentation universe is required.

## 28. Change record

- **2026-10-05:** Initial design merging the Semantic Runtime Lab with VOMEGA self-knowledge and Contextual Wiki. Established the core Reflection ABI obligation, source-native semantic declarations, derived Reflection Graph, ephemeral Wiki pages, realtime relevance, plugin self-wiring, completeness gates, source anchors, model-grounding boundaries and a migration path from current manifests.


## 29. Historical harvest confirmation

The old VIVIM symbolic/self-knowledge harvest independently reinforces this architecture.

In particular, `harvests/old-vivim/symbolic/PERSONAL-AGENT-SELF-KNOWLEDGE-AND-COMMAND-LANGUAGE.md` already framed the internal Wiki as **UX over canonical objects/relationships/evidence**, not a storage architecture.

That historical idea now becomes more precise:

```
source-native structure
+ durable product state
+ current evidence
+ Reflection relationships
= self-knowledge substrate

context + semantic focus
→ ephemeral Wiki projection
```

The historical `?` family should be explored as an explicit introspection route into the same self-knowledge query system.

Natural language and symbolic introspection must not create a second Wiki/query authority.

## 30. Reflection Migrator

Existing code needs an incremental bridge into the Reflection ABI.

The design is specified in [Self-Knowledge Reflection Migrator](SELF-KNOWLEDGE-REFLECTION-MIGRATOR.md).

The utility should:

- inspect current manifests/contracts/ops/schemas/config/language/tests;
- extract structurally proven Reflection facts;
- bind exact source anchors;
- detect public behavior that remains opaque;
- identify duplicate semantic definitions;
- propose source-native enrichment;
- generate safe migration patches only when explicitly requested;
- verify Reflection/Wiki completeness.

It defaults to read-only.

It may never fabricate semantic proof in order to report complete coverage.

## 31. Runtime compilation of Reflection

The product should not AST-scan its repository live whenever the user opens help.

Preferred lifecycle:

```
source / plugin package
→ build/install reflection extraction
→ version/content-hash-bound Reflection descriptor
→ runtime Reflection Graph
→ join live World/evidence
→ Wiki projection
```

This makes source inspection a development/install concern while keeping runtime queries fast and deterministic.

## 32. Semantic Data Engine relationship

The broader record/identity model is defined in [Semantic Data Engine](SEMANTIC-DATA-ENGINE.md).

Important additions include:

- Model as a routing entity distinct from Provider/Account/Session;
- stable semantic identity independent from policy classification;
- multidimensional consequence semantics;
- realization fidelity distinct from evidence maturity;
- semantic handles shared by visual projection and Wiki.

These concepts should become Reflection relationships where applicable.
