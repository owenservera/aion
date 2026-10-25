# VOMEGA Semantic Runtime Laboratory — Modular Knowledge, Interpretation, Execution and UI Testbed

Status: **OWNER-DIRECTED DESIGN / ACTIVE DEVELOPMENT HYPOTHESIS**  
Started: 2026-10-05  
Scope: standalone development laboratory and structured knowledge engine for rapidly designing, testing, comparing and evolving the VOMEGA language-to-action system without requiring the VIVIM product runtime.

## 1. Purpose

VOMEGA needs a place where the team can cheaply answer questions such as:

- What can ordinary language mean in the current World?
- Which taxonomy, grammar, frame, resolver, default or grounding rule produced that interpretation?
- What exact deterministic machine command results?
- What happens if that command executes against a known runtime state?
- What should the person see while the interpretation changes in real time?
- Which icon, annotation, menu, enclosure, badge or disclosure treatment best communicates the same semantic fact?
- Which competing interpretation or UI design performs better against the same corpus?
- What did a historical implementation, harvested repository, provider trace, human demonstration or failed experiment teach us?
- Which knowledge has earned promotion, and which remains hypothesis, historical evidence, negative knowledge or open uncertainty?

The laboratory should make those questions testable **without first building or booting the VIVIM product**.

It is therefore not merely a database and not merely an NLP playground.

It is a local, modular **knowledge + compiler + virtual runtime + execution + visualization + experiment engine** whose database makes every important moving part inspectable, versioned, composable and replayable.

Core aspiration:

> **words → candidate meaning → grounded command → deterministic executable plan → virtual/real bounded execution → observed evidence → real-time human feedback**

The Lab must also support the companion counterfactual loop defined in [Negative Intent Signal Engine](NEGATIVE-INTENT-SIGNAL-ENGINE.md): preserve the candidate intent manifold, compare the leading interpretation with plausible divergent branches, and test whether the highest-value early negative signal reduces later semantic correction burden. This is an evaluator over the same candidate semantics, not a second interpreter.

Every arrow should be replaceable and experimentally comparable except the smallest Lab kernel needed to preserve identity, evidence, isolation, replay and governance.

## 2. Relationship to existing VOMEGA work

This laboratory should reuse and exercise, not fork, the distinctions already present in the seed:

- [Command Visual Language Design](COMMAND-VISUAL-LANGUAGE-DESIGN.md): meaning is separate from visual realization; interpretation, grounding, availability, authority, consequence, execution and evidence remain distinct.
- [First Product Release Design](FIRST-PRODUCT-RELEASE-DESIGN.md): ordinary language is the primary surface and must converge on deterministic semantic commands.
- [Harvest-First Engineering](HARVEST-FIRST-ENGINEERING.md): working code, tests, traces, failures, patterns and external evidence should be assayed before invention.
- [Provider Lab Strategy](PROVIDER-LAB-STRATEGY.md): live provider experimentation can produce end-state-relevant provider knowledge without becoming product authority.
- [Conceptual Model](CONCEPTUAL-MODEL.md): intent ≠ execution, capability ≠ realization, provider ≠ account, evidence ≠ authority, World ≠ surface, confidence ≠ proof.
- [Known Reality and Open Frontier](KNOWN-REALITY-AND-OPEN-FRONTIER.md): unknown, historical evidence, hypothesis, contradicted and experiment-required are valid states.
- current command workstream: frames should become contributed/versioned language data; deterministic corpora, validation, replay and VisualSpec-style projection are already desired.

The Lab is a development substrate. It does not become canonical Ω product architecture merely because it is useful.

## 3. Design thesis

The most important design choice is:

> **Store the system's changeable intelligence as versioned data and modules, then compose a runtime from selected versions.**

Do not build one monolithic interpreter.

Do not hard-code the visual language into React components.

Do not hide command semantics inside prompt templates.

Do not make harvested knowledge a pile of prose notes.

Do not make an executable's behavior inseparable from the NLP rule that selected it.

Instead, the Lab contains a library of independently versioned artifacts that can be assembled into named **Lab Profiles**.

A Lab Profile may select:

```
Taxonomy Pack
+ Language Pack
+ Interpretation Pipeline
+ Grounding Pack
+ Defaulting / Validation Policy
+ Capability + Command Pack
+ Virtual World
+ Executable / Realization Pack
+ Authority / Effect Policy
+ Visual Language Pack
+ Interaction Pack
+ Evaluator Pack
= one reproducible experimental Ω runtime
```

The same prompt corpus can then run against Profile A, B, C, ... and the Lab can show exactly where their outputs diverge.

## 4. Lab kernel constraints — candidate

> **Authority note (2026-10-06).** This is a **Lab-internal candidate constraint set**, not Ω constitutional law. The eight responsibilities below are a candidate list. This section does not define Ω's product kernel and does not amend `INVARIANTS.md`; what the product core must contain is still open ("the exact current K0/K1 boundary must be re-validated against the live system"). A team may build the first Lab with a smaller or different kernel if the Lab's truth boundaries (identity, append-only evidence, isolation, replay) are still met.

The owner explicitly wants the system reprogrammable **except the core**.

The core should therefore be extremely small and domain-neutral. It should know how to preserve the laboratory's integrity, not what English, Claude, Windows, prompt.send, circles, icons or Accounts mean.

Candidate non-reprogrammable responsibilities:

1. **Artifact identity**
   - stable IDs;
   - immutable version identity;
   - parent/child lineage;
   - content digest.

2. **Artifact envelope**
   - type;
   - schema/version;
   - status;
   - provenance;
   - dependencies;
   - compatibility constraints.

3. **Append-only evidence**
   - observations and experiment results are not silently rewritten;
   - later interpretation may supersede a claim without erasing the original evidence.

4. **Module loading**
   - dependency resolution;
   - compatibility checks;
   - composition manifest loading;
   - deterministic version pinning.

5. **Isolation**
   - virtual execution is isolated by default;
   - side-effecting adapters are explicitly marked and capability-scoped.

6. **Deterministic replay plumbing**
   - pinned inputs, module versions, World snapshot, clock/randomness seeds and executable versions;
   - same pinned experiment can be reproduced.

7. **Promotion / rollback mechanics**
   - candidates cannot overwrite adopted artifacts in place;
   - promotions create attributable state transitions;
   - previous profiles remain replayable.

8. **Lab kernel boundary**
   - ordinary modules cannot rewrite the kernel or grant themselves new kernel powers;
   - kernel change is an external product-development event with explicit migration and review.

The kernel should **not** contain:

- provider-specific knowledge;
- natural-language frames;
- command families;
- taxonomies beyond the minimum metadata vocabulary needed to load artifacts;
- icon names;
- UI layouts;
- account-selection logic;
- model prompts;
- Windows command knowledge;
- provider selectors;
- current release policy.

If a concern can be represented as a module or versioned rule without weakening isolation, evidence or replay, keep it outside the kernel.

## 5. First-class artifact families

The database should treat the following as first-class, linkable artifacts rather than unstructured files.

### 5.1 Semantic taxonomy library

Stores the concepts the system can reason about.

Candidate families:

- Thing / entity;
- person / group;
- device / computer;
- application;
- file / folder;
- provider;
- Account;
- Session;
- capability;
- command/action;
- parameter;
- state;
- event;
- relation;
- scope;
- payload;
- constraint;
- negation;
- sequence/dependency;
- risk/effect;
- authority requirement;
- evidence kind;
- visual semantic role.

Taxonomy is a versioned graph, not one rigid tree.

A concept can participate in several taxonomies and inherit or relate to other concepts without forcing one universal hierarchy.

Examples:

```
provider.claude  IS_A provider.ai
account.work     INSTANCE_OF account
prompt.send      INSTANCE_OF capability
device.this_pc  INSTANCE_OF device.computer
relation.target
relation.executor
relation.location
state.needs_choice
evidence.submission_observed
```

Names above are illustrative. The Lab should allow better naming to emerge through use.

### 5.2 Language library

Stores the mapping between human expression and candidate semantics.

Possible artifact types:

- lexemes;
- synonyms;
- aliases;
- morphological rules;
- phrase patterns;
- frames;
- addressee grammar;
- relation/scope rules;
- quoted-payload rules;
- negation rules;
- sequence/dependency rules;
- pronoun/reference rules;
- disambiguation rules;
- normalization rules;
- language/locale packs;
- examples and counterexamples.

A language rule should cite the semantic concepts it can produce.

A language rule should not directly execute anything.

### 5.3 Interpretation pipeline library

Stores composable stages and stage ordering.

Candidate stage roles:

```
input revision
→ segmentation
→ lexical candidates
→ phrase/frame candidates
→ relation + scope construction
→ intent/capability candidates
→ entity grounding
→ defaulting
→ canonical command construction
→ validation
→ consequence/effect projection
→ authority requirement projection
→ executable-plan compilation
```

Different pipelines can be compared against the same corpus.

A pipeline stage may be deterministic code, table-driven logic, a bounded model-assisted proposer, or another module type. Its epistemic and execution powers must be explicit.

A probabilistic component may propose candidates. It cannot gain execution authority merely by being confident.

### 5.4 Command and capability library

Stores the machine-semantic action vocabulary.

A candidate command artifact may define:

- command/capability ID;
- human description;
- parameters and types;
- required/optional fields;
- target roles;
- preconditions;
- consequence/effect class;
- authority requirement;
- expected evidence;
- compatible realizations;
- canonical rendering;
- validator;
- test vectors.

The Lab should be able to experiment with command schemas without treating the first schema as permanent Ω law.

### 5.5 Grounding and World library

Stores synthetic and observed Worlds against which language can be resolved.

World fixtures may contain:

- known Providers;
- zero/one/many Accounts;
- Account labels;
- session freshness;
- installed applications;
- files/folders;
- devices;
- capabilities available per entity;
- standing defaults;
- known selections;
- current focus/context;
- authorization fixtures;
- stale/unknown evidence;
- disconnected/unavailable states.

Examples:

- `world/no-claude-account`;
- `world/one-claude-personal`;
- `world/two-claude-accounts`;
- `world/work-account-stale-session`;
- `world/windows-this-pc-volume-unknown`.

Worlds are test data, not claims about the real user's environment unless backed by actual observation.

### 5.6 Deterministic executable library

Stores executable behaviors that can operate against the virtual runtime.

An executable is not the command itself.

It is a realization of a command in a particular runtime.

Examples:

- simulated `prompt.send`;
- simulated `account.register`;
- simulated `volume.set`;
- deterministic file copy in a sandbox;
- provider fixture adapter;
- later, a bounded live browser adapter.

Each executable declares:

- input command schema/version;
- compatible World/runtime types;
- side-effect class;
- deterministic inputs;
- output events;
- evidence emitted;
- failure modes;
- idempotency/retry semantics where relevant;
- required capability/authorization;
- implementation version.

The default Lab executor should be **virtual and side-effect free**.

Live/system adapters are opt-in and visibly different.

### 5.7 Visual language library

Stores semantic-to-visual realization independently from interpretation.

Candidate artifact types:

- semantic visual roles;
- icon-role mappings;
- icon packs;
- annotation mappings;
- colors/styles;
- enclosure rules;
- status treatments;
- disclosure rules;
- menus;
- layout profiles;
- animation/motion mappings;
- accessible labels;
- help affordances.

Example:

```
semantic role: entity.device.local
presentation A: monitor icon
presentation B: laptop icon
presentation C: user-supplied SVG
```

or:

```
semantic state: interpretation.unresolved
presentation A: dashed enclosure
presentation B: dotted underline + "choose"
```

Changing visual realization must not alter the semantic object unless an explicit interaction invokes a semantic edit.

### 5.8 Interaction library

Stores mappings from human UI actions to semantic edits or commands.

Examples:

- click Account handle → open alternatives;
- choose Work Account → apply grounding edit;
- keyboard shortcut → expose interpretation details;
- drag scope handle → modify scope;
- select icon pack → configuration command;
- confirm action → request governed execution.

A cosmetic pack must not smuggle in behavior.

Interaction mappings that do change behavior should be explicit, inspectable modules.

### 5.9 Scenario and corpus library

The corpus is the laboratory's primary truth-testing instrument.

A scenario can contain:

- raw user expression;
- input revisions if testing realtime typing;
- World fixture;
- expected candidate interpretation;
- expected unresolved fields;
- expected grounding;
- expected canonical command;
- expected validation outcome;
- expected effect preview;
- expected visual semantic roles;
- expected execution events;
- forbidden outcomes;
- notes;
- source/provenance;
- regression or experiment tags.

Scenario classes should include:

- clean canonical phrasing;
- colloquial phrasing;
- typos;
- incomplete input;
- ambiguity;
- multiple Accounts;
- stale Account state;
- unsupported capability;
- quoted payload;
- negation;
- scope;
- fan-out;
- sequencing;
- reference words such as "this";
- conflicting defaults;
- local-vs-external effects;
- partial execution/failure;
- stale interpretation result arriving after a newer input revision.

Every real phrasing failure should be convertible into a scenario before the fix is promoted.

### 5.10 Harvest knowledge library

Harvested knowledge should land in structured form.

Do not collapse source, observation, interpretation and adopted rule into one record.

A Harvest Record may contain:

- source identity and URL/repository/commit/version;
- source class: VIVIM history / OSS / package / provider UI / trace / paper / human demo / failure / benchmark;
- provenance and license;
- date observed;
- raw artifact reference or digest;
- observed behavior;
- extracted claim;
- extracted taxonomy candidates;
- extracted language patterns;
- extracted command/capability candidates;
- extracted realization techniques;
- extracted test vectors;
- extracted failure modes;
- security/privacy constraints;
- compatibility notes;
- assay disposition: REUSE / ADAPT / WRAP / PORT / BEHAVIORAL REIMPLEMENTATION / EVIDENCE ONLY / REJECT;
- epistemic status;
- linked experiments;
- linked promoted descendants.

The chain should remain visible:

```
source
→ observation
→ interpreted knowledge
→ candidate artifact
→ experiment
→ evidence
→ promotion / rejection
```

A harvested source never becomes authority merely because it exists.

### 5.11 Governance and promotion library

Stores how laboratory knowledge evolves.

Artifact lifecycle can be represented as:

```
DRAFT
→ CANDIDATE
→ TRIAL
→ PROVEN-FOR-SCOPE
→ ADOPTED
→ DEPRECATED
→ RETIRED
```

Additional states such as REJECTED, CONTRADICTED or SUPERSEDED remain useful.

Promotion policy itself should largely be configurable data. The kernel only guarantees that adopted artifacts cannot be silently replaced without a recorded transition and required evidence.

## 6. Canonical artifact envelope

Every changeable object should share a small metadata envelope.

Illustrative shape:

```ts
type LabArtifact = {
  id: string
  type: string
  version: string
  digest: string
  status: string
  parents: string[]
  dependencies: ArtifactRef[]
  compatibility?: Constraint[]
  provenance: ProvenanceRef[]
  epistemicStatus: string
  createdAt: string
  createdBy: ActorRef
  body: unknown
}
```

This is a conceptual envelope, not a frozen TypeScript contract.

The important properties are stable identity, versioning, lineage, dependency visibility, provenance and epistemic status.

## 7. Lab Profiles: composition as the unit of experimentation

A **Lab Profile** pins one complete experimental runtime.

Example:

```yaml
profile: command-lab/account-disambiguation-v7
taxonomy: taxonomy/core@12
language: language/en-command@31
pipeline: pipeline/deterministic-command@18
grounding: grounding/accounts@9
defaults: policy/defaulting@4
commands: commands/release@6
world: world/two-claude-accounts@3
executables: exec/virtual-provider@7
visual: visual/compact-annotations@11
icons: icons/lucide-map@2
interactions: interaction/command-box@8
evaluator: evaluator/release-command@5
```

Profiles enable:

- reproducible experiments;
- profile inheritance;
- one-variable-at-a-time testing;
- branch/fork of designs;
- comparison across modules;
- rollback;
- named baselines.

A child profile should be able to say "same as baseline except visual pack B" or "same as baseline except parser rule 42".

## 8. Virtual Ω runtime

The Lab needs a small runtime emulator so semantic commands can actually do something without launching VIVIM.

The virtual runtime should provide:

### World state

A structured in-memory or persisted state graph representing the current experimental world.

### Deterministic clock and identity

Tests should be able to pin:

- time;
- random seed;
- generated IDs;
- event order;
- network responses when simulated.

### Capability registry

The virtual World exposes which capabilities and realizations exist.

### Authority fixture

The runtime can simulate:

- allowed;
- denied;
- consent required;
- standing authorization;
- unknown.

Authority simulation tests behavior. It does not establish real product authorization.

### Effect boundary

Every executable declares whether it is:

- pure;
- virtual-state mutating;
- sandbox-file mutating;
- local-system mutating;
- external-network mutating.

The Lab defaults to the first two.

### Event ledger

Execution emits explicit events such as:

```
command.compiled
validation.ready
authority.required
execution.started
provider.submission.simulated
evidence.submission_observed
execution.completed
```

The exact event vocabulary should evolve.

### Snapshot + replay

Before and after state should be snapshot-addressable so the Lab can replay an execution and diff state transitions.

## 9. Realtime interpretation session

The Lab should emulate the future command box as a revisioned interpretation session.

For every text revision:

1. preserve original user text;
2. assign an input revision;
3. run the selected interpretation pipeline;
4. emit stage-by-stage candidates;
5. ground against the pinned World;
6. build/validate a candidate command;
7. project semantic feedback;
8. render one or more visual profiles;
9. derive the negative intent frontier from the same revision-bound candidate semantics;
10. project the highest-value counterfactual only when its expected early-correction value exceeds its interruption cost;
11. suppress late interpretation **and negative-frontier** results from obsolete revisions;
12. never execute merely because an interpretation or negative signal exists.

This allows tests such as:

```
"A"
"As"
"Ask"
"Ask C"
"Ask Claude"
"Ask Claude to..."
```

The Lab can inspect:

- when a capability became recognizable;
- when Claude became a grounded candidate;
- when ambiguity appeared;
- which annotations changed;
- whether UI flickered;
- whether an old interpretation overwrote the new one;
- whether an assumption became visible;
- when the command became executable.

## 10. Stage trace as a first-class object

Every interpretation should expose a trace, not only a final answer.

Example:

```
INPUT
"Ask Claude to explain this error"

LEXICAL
ask -> candidate relation/addressee operation
Claude -> provider candidate
this error -> contextual payload candidate

FRAME
addressee-first prompt.send candidate

GROUNDING
provider = Claude
account = unresolved [Personal, Work]
payload = unresolved-context-ref

COMMAND
prompt.send(provider=Claude, account=?, payload=?)

VALIDATION
NEEDS_CHOICE + NEEDS_INFO

VISUAL SEMANTICS
provider handle
unresolved Account
unresolved referent
external content transfer warning
```

A stage trace lets us locate the actual failure instead of patching the final renderer or parser blindly.

## 11. Determinism rules

Determinism should be a property of a **pinned experiment**, not a claim that all intelligence in the system must forever be deterministic.

For a deterministic experiment:

```
same input revision
+ same World snapshot
+ same module versions
+ same configuration
+ same deterministic dependencies
= same semantic result and execution trace
```

If a probabilistic model is used, its proposal should be captured as an input artifact. The downstream validation/execution experiment can then replay deterministically against that proposal.

The Lab should distinguish:

- deterministic parser;
- deterministic validator;
- probabilistic candidate proposer;
- recorded probabilistic output;
- live probabilistic call.

Do not mix these categories in benchmark claims.

## 12. Experiment engine

An Experiment binds:

- question/hypothesis;
- baseline Profile;
- candidate Profile(s);
- scenario set;
- metrics;
- falsifiers;
- execution mode;
- result/evidence.

Common experiment shapes:

### One-variable comparison

Only icon pack changes.

### Pipeline tournament

Several parser/grounding pipelines run against the same corpus.

### Taxonomy challenge

A new taxonomy model is tested for whether it reduces special cases without losing distinctions.

### Mutation testing

Intentionally remove or alter a rule and see which corpus cases detect it.

### UI treatment comparison

Same semantic VisualSpec rendered through underline vs chip vs enclosure variants.

### World matrix

Same phrase runs in zero/one/two Account Worlds.

### Executable conformance

Several realizations of the same command must satisfy the same semantic contract.

### Historical replay

Old failures are rerun against current Profiles.

## 13. Evaluation

Avoid one global "accuracy" number that hides important failure classes.

Candidate dimensions:

- interpretation exactness;
- unresolved-choice honesty;
- false execution readiness;
- wrong target rate;
- grounding correctness;
- forbidden assumption rate;
- scope preservation;
- payload/instruction boundary correctness;
- deterministic replay success;
- executable conformance;
- effect/evidence honesty;
- visual semantic coverage;
- correction success;
- UI stability across input revisions;
- accessibility checks;
- latency;
- number of provider/domain special cases;
- second-use generalization;
- regression count.

Different experiments may choose different dimensions.

A Profile should not win by being more decisive if it achieves that by hiding uncertainty.

## 14. Self-governance and self-evolution

The Lab should be able to improve itself, but only outside the Lab kernel.

### Sources of proposed evolution

A proposal may originate from:

- corpus failure;
- human correction;
- harvested knowledge;
- provider trace;
- executable failure;
- visual usability result;
- duplicate/special-case detection;
- model/agent synthesis;
- contradiction detection;
- a second-realization challenge.

### Candidate mutations

The system may propose:

- new synonym;
- new language frame;
- taxonomy edge;
- new concept;
- command parameter;
- validator;
- defaulting rule;
- grounding rule;
- executable;
- visual mapping;
- interaction;
- scenario;
- metric;
- harvest extraction;
- module type.

### Evolution protocol

Prefer:

```
observe
→ create proposal
→ fork artifact/profile
→ generate or select falsifiers
→ replay affected corpus
→ run broader regression
→ compare
→ independent review where material
→ promote / reject / keep experimental
```

Never:

```
observe failure
→ edit adopted rule in place
→ forget previous behavior
```

### Self-government constraints

The Lab may:

- create candidates;
- schedule/rank experiments;
- detect contradictions;
- recommend promotion;
- auto-promote low-risk changes only if an explicit configured policy allows that class and all required proof is machine-verifiable.

The Lab may not:

- rewrite kernel guarantees;
- erase evidence;
- redefine historical experiment results;
- silently expand side-effect privileges;
- convert model confidence into authority;
- treat harvested material as adopted truth without promotion;
- hide regressions by deleting scenarios.

## 15. Negative knowledge is first-class

Rejected and failed approaches are valuable.

Store:

- why a rule failed;
- why a taxonomy collapsed important distinctions;
- why a UI treatment confused target/executor;
- why a provider selector drifted;
- why a model interpretation was unsafe;
- why a harvested project was rejected;
- which scenario falsified an abstraction.

This prevents repeated rediscovery.

## 16. Knowledge promotion

A useful knowledge path is:

```
RAW SOURCE / OBSERVATION
      ↓
HARVEST RECORD
      ↓
CANDIDATE KNOWLEDGE
      ↓
CANDIDATE MODULE / RULE / SCENARIO
      ↓
EXPERIMENT
      ↓
EVIDENCE
      ↓
PROVEN-FOR-SCOPE
      ↓
ADOPTED LAB ARTIFACT
      ↓
candidate for VOMEGA product incorporation
```

Lab adoption is not automatically product adoption.

The product can harvest from the Lab using the same discipline the Lab uses for external sources.

## 17. Storage architecture

The conceptual model should not depend on one storage engine.

A pragmatic first implementation could use:

- **SQLite** for artifact metadata, graph edges, profiles, experiments, indexes and queryable relationships;
- **JSON/JSONL or canonical serialized documents** for artifact bodies where schemas are still evolving;
- **content-addressed local blob storage** for large traces, snapshots, imported source artifacts and UI captures;
- **full-text/search index** for language examples and harvested notes;
- optional derived graph/search projections that can be rebuilt.

Why this is attractive for the first Lab:

- local;
- inspectable;
- transactional;
- easy to back up;
- easy for agents/scripts to query;
- no service dependency;
- sufficient for a large experimental corpus;
- allows schema evolution without immediately introducing distributed infrastructure.

This is an implementation candidate, not a constitutional choice.

The enduring requirement is that identity, lineage, provenance, composition and replay survive storage replacement.

## 18. Pack format and extension model

A Pack is a distributable set of artifacts plus a manifest.

Candidate pack categories:

- taxonomy pack;
- language pack;
- command pack;
- grounding pack;
- World fixture pack;
- executable pack;
- visual pack;
- interaction pack;
- scenario pack;
- evaluator pack;
- harvest pack.

Packs may depend on other packs.

A new pack should be installable without editing kernel source.

A pack should declare:

- ID/version;
- artifact types contributed;
- dependencies;
- compatibility;
- code entrypoints if any;
- permissions/side-effect class;
- tests;
- provenance.

Pack installation does not imply adoption into any Profile.

## 19. Laboratory surfaces

The Lab does not need VIVIM's product UI.

A local development UI can be purpose-built for experimentation.

### Prompt / expression bench

- enter or replay user language;
- simulate per-keystroke revisions;
- choose World;
- choose Profile;
- inspect live interpretation.

### Semantic trace inspector

Shows every pipeline stage and diffs competing Profiles.

### World editor

Construct Accounts, Sessions, files, Providers, apps, defaults, capabilities and stale/unknown state.

### Command inspector

Displays canonical command, missing fields, assumptions, target/executor/location, authority requirement and expected evidence.

### Execution console

Runs deterministic executables against virtual/sandbox Worlds and shows state/event diffs.

### Visual language playground

Renders the same semantic feedback through multiple visual/icon/interaction packs.

### Variant matrix

Rows = scenarios.  
Columns = Profiles or module variants.  
Cells = pass/fail/diff/evidence.

### Harvest inbox

Land external knowledge, assay it, extract candidate artifacts/tests and link lineage.

### Governance queue

Shows proposed mutations, falsifiers, evidence, regressions and promotion state.

These are Lab tools, not first-release VIVIM product requirements.

## 20. Example: account disambiguation

Input:

> Ask Claude to explain this error.

World A:

- Claude Work Account;
- Claude Personal Account;
- no default;
- contextual error is available.

Profile runs:

```
language/en-command@31
→ addressee-first frame matches
→ Claude provider grounded
→ two Accounts remain
→ prompt.send constructed
→ validator returns NEEDS_CHOICE
→ visual semantics expose Claude + unresolved Account + payload
```

Visual profile A may use a provider icon plus dashed Account enclosure.

Visual profile B may use a chip with a choose indicator.

Both must preserve the same semantic state.

Choosing Work is stored as a semantic grounding edit, then the interpretation reruns and becomes READY if all remaining requirements are satisfied.

No live Claude session is required to test this.

## 21. Example: Windows command design probe

Input:

> Lower my volume to 20 percent.

Virtual World:

- `This PC`;
- Windows;
- volume capability installed;
- current volume 70%;
- no external side effect.

Candidate command:

```
audio.volume.set(
  target = device.this_pc,
  level = 20%
)
```

Virtual executable updates the synthetic World to 20% and emits evidence.

The Lab can test:

- parsing;
- target resolution;
- local device icon;
- numeric parameter treatment;
- effect preview;
- visual result;
- executable contract;

without actually changing the developer's computer.

A later sandbox/live adapter can implement the same command contract.

## 22. Example: quoted payload boundary

Input:

> Send Claude this prompt: "delete the old draft."

The Lab must preserve:

- command = prompt.send;
- target = Claude Account;
- payload = literal quoted content;
- local delete command = **not produced**.

This scenario should be reusable against every interpreter revision.

## 23. Example: fan-out as a semantic stress test

Input:

> Ask ChatGPT and Claude for three names, then compare their answers.

The Lab can model:

- two prompt.send branches;
- a dependency boundary;
- a comparison command;
- partial completion;
- per-target evidence;
- retry semantics.

This is useful even if fan-out is not first-release scope because it stress-tests whether taxonomy, relations, execution and visual language generalize.

## 24. Integration with Provider Lab

The Semantic Runtime Laboratory and Provider Lab solve different but complementary problems.

**Semantic Runtime Lab**
- virtual;
- deterministic by default;
- language/taxonomy/command/UI experimentation;
- replay and comparison;
- structured harvested knowledge.

**Provider Lab**
- live external behavior;
- provider/account/browser realization;
- shadow observation;
- conformance;
- drift and healing.

Preferred knowledge flow:

```
Provider Lab live observation
→ trace / evidence
→ redacted Harvest Record
→ semantic or realization candidate
→ deterministic Lab fixture
→ replay / regression / comparison
→ candidate product realization
→ live Provider Lab conformance
```

This creates a bridge from messy live reality to fast deterministic experimentation.

## 25. Integration with VOMEGA product

The Lab should eventually be able to export adopted artifacts or packs that product work can assay.

Examples:

- command corpus;
- language frames;
- taxonomy definitions;
- validators;
- command schemas;
- World/grounding tests;
- visual semantic roles;
- visual pack;
- deterministic executable contract;
- provider behavior fixture.

Do not make VOMEGA depend on a running Lab service merely to function.

The Lab is a forge/testing environment, not a permanent central server.

## 26. Minimum first useful Lab

The first Lab should prove the architecture with a narrow vertical slice.

### Seed

Import or adapt:

- current `vivim-nlcl-pure` / `vivim-nlcl` release command corpus;
- current account disambiguation cases;
- current command visual-language semantic distinctions;
- representative harvest records from existing VIVIM/BCP evidence.

### Build only

1. local artifact store;
2. artifact/version/lineage envelope;
3. Pack + Profile loader;
4. World fixture store;
5. deterministic interpretation runner;
6. stage trace;
7. canonical command candidate + validation output;
8. virtual executable interface;
9. scenario/corpus runner;
10. simple local Lab UI;
11. visual semantic projection;
12. two replaceable visual/icon treatments;
13. variant diff;
14. experiment evidence record;
15. manual promotion/rejection.

### Initial deterministic commands

Use a very small set such as:

- `prompt.send` against a simulated Provider/Account;
- `account.select` or equivalent semantic grounding edit;
- one synthetic local command such as `audio.volume.set`.

The purpose is not feature breadth. It is to prove that unrelated command families can use the same Lab architecture.

## 27. First proof suite

The Lab architecture is promising if it can demonstrate all of the following:

1. Same pinned experiment replays identically.
2. A language rule can be replaced without editing the executor.
3. An executor can be replaced without editing the language rule.
4. An icon pack can be replaced without changing semantics.
5. A visual annotation treatment can be changed without changing command meaning.
6. A World can move from one Account to two Accounts and produce NEEDS_CHOICE without parser code changing.
7. A new phrase failure can become a corpus case before the fix.
8. A harvested observation can be traced to a candidate rule and the experiment that promoted/rejected it.
9. A model-assisted candidate cannot execute unless deterministic validation and authority gates allow it.
10. A late realtime interpretation result cannot overwrite a newer revision.
11. A rejected rule remains inspectable after replacement.
12. A Profile from an older experiment remains replayable after current modules evolve.
13. The Lab can run with no VIVIM process.
14. A product-oriented artifact can be exported without exporting the entire Lab.

## 28. Important falsifiers

Reconsider the architecture if:

- adding a command requires editing kernel source;
- changing an icon library changes canonical commands;
- harvested prose cannot be connected to tests;
- experiment history becomes unreplayable after schema evolution;
- the system cannot explain which rule produced a field;
- two Accounts are silently collapsed by "confidence";
- side-effecting code can hide inside a supposedly cosmetic pack;
- the same Profile produces different results without recorded nondeterministic input;
- self-evolution can delete a regression that blocks promotion;
- the Lab becomes so coupled to current VOMEGA code that it cannot run standalone;
- every new domain forces a new artifact type into the kernel;
- the storage schema becomes the ontology.

## 29. Strategic leverage

If this works, the Lab becomes more than a command parser bench.

It becomes the place where VOMEGA can accumulate reusable design intelligence:

- language understanding;
- command semantics;
- taxonomies;
- provider knowledge;
- runtime behaviors;
- executable contracts;
- UI semantics;
- icon/interaction systems;
- negative knowledge;
- test vectors;
- evidence;
- evolution history.

The long-term value is not the database itself.

The value is the ability to **change one part of Ω, replay the consequences across everything we know, and promote only what survives evidence**.

## 30. Open questions

- What minimum artifact types genuinely need first-class schemas versus generic typed documents?
- Which graph relationships should be materialized versus derived?
- How should schema migrations preserve replay of historical Profiles?
- How much TypeScript executable code should packs be allowed to contribute?
- Which low-risk artifact classes, if any, may auto-promote?
- What is the best boundary between semantic visual roles and renderer-specific VisualSpec?
- How should real user corrections be privacy-reduced before becoming corpus cases?
- How should multilingual language packs share semantics without importing English grammar assumptions?
- When should a repeated pattern become a reusable engine rather than remain pack-local?
- How should live provider traces be minimized/redacted into deterministic fixtures?
- How should conflicting harvested claims coexist until experiments resolve them?
- How should the Lab expose uncertainty without turning every result into governance ceremony?

## 31. Change record

- **2026-10-05:** Initial owner-directed design. Reframed the requested modular database as a standalone semantic runtime laboratory: versioned taxonomy/language/command/executable/World/visual/interaction/test/harvest/governance libraries; composable Profiles; virtual Ω runtime; deterministic replay; realtime interpretation traces; structured knowledge harvesting; bounded self-evolution; tiny non-reprogrammable Lab kernel.


## 32. Self-description / Reflection integration

The Lab should consume the same core Reflection ABI defined in [Self-Describing Runtime & Source-Native Contextual Wiki](SELF-DESCRIBING-RUNTIME-WIKI.md).

Every Lab module/Pack/Profile should therefore be inspectable through source-native semantic declarations rather than a second Lab documentation schema.

Consequences:

- installing an experimental Pack automatically extends Lab self-knowledge;
- changing a Profile immediately changes the Wiki projection of what the experimental runtime contains;
- harvested artifacts can be linked to the exact source declarations they influence;
- explainability completeness becomes an experiment dimension;
- the Lab can falsify plugins that expose behavior not visible through reflection;
- visual help handles and Wiki pages resolve to the same semantic IDs used by interpretation/execution;
- no Markdown/README/Wiki file is required for an experimental capability to become explainable.

The Lab should include the synthetic-plugin proof described in the self-describing runtime design: install a never-before-seen capability with zero documentation files and verify that its capability, parameters, effects, authority requirement, evidence expectations, source links, related concepts and contextual help become available automatically.


## 33. External OS-taxonomy harvest as generalization benchmark

The 2026-10-05 `External-temp` OS-taxonomy candidate should be treated as a high-value **benchmark/harvest input**, not automatically merged as product architecture.

It contributes useful evidence:

- 291 platform-neutral capability definitions;
- 305 Windows realizations;
- typed parameters;
- 164-task coverage corpus;
- exact / approximate / handoff fidelity;
- authored / verified-local / regressed evidence vocabulary;
- deterministic planning;
- generated manifest/catalog/SQLite projections.

### Preferred dispositions

**Harvest into Lab concepts:**

- capability/realization separation;
- parameter schemas;
- fidelity;
- evidence maturity;
- coverage corpora;
- deterministic plans;
- source-data → generated projection pattern.

**Challenge before adoption:**

- embedding risk class in operation identity (`os.r.* / os.m.* / os.x.*`);
- treating one risk label as the complete consequence model;
- generated one-frame-per-capability language quality at scale;
- hundreds of static composition grants as a long-term scaling mechanism;
- any Windows realization whose evidence remains only `authored`.

### Lab use

The Lab should import or adapt this material into experimental artifacts and run selected subsets as an independent domain stress test.

Success means the same semantic engine can represent:

```
AI prompt routing
and
OS volume/brightness/file operations
```

without forcing AI-specific or Windows-specific concepts into the kernel.

## 34. MVP Visualization Sandbox

The first human-facing Lab application is [MVP Visualization Sandbox](MVP-VISUALIZATION-SANDBOX.md).

It should run a narrow, realistic simulated Ω:

```
Provider / Account / Model fixture World
→ NCL/NLCL
→ candidate command
→ deterministic validator
→ VisualSpec
→ contextual Wiki
→ simulated prompt.send boundary
```

The sandbox is intentionally product-shaped but development-only.

It allows the team to refine interaction design before provider/browser execution exists.

## 35. Automated semantic experimentation

[Automated Semantic Experiments](AUTOMATED-SEMANTIC-EXPERIMENTS.md) defines the experiment layer for:

- language/frame tournaments;
- ambiguity/defaulting tests;
- Model routing;
- semantic churn;
- visual projection variants;
- Wiki relevance;
- icon-pack invariance;
- Reflection migration completeness.

The Lab should make experiment artifacts, negative results and promotion history first-class.

## 36. Semantic Data Engine

[Semantic Data Engine](SEMANTIC-DATA-ENGINE.md) provides the shared conceptual substrate for:

- semantic identities;
- Reflection;
- World;
- commands;
- consequences;
- fidelity/evidence maturity;
- VisualSpec/Wiki handles.

The Lab may use SQLite/JSON/content-addressed blobs as a practical implementation, but those physical stores are not the ontology.
