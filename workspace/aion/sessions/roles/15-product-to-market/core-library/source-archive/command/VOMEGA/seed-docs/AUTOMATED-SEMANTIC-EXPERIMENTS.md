# Automated Semantic Experiments — NLP/NCL, Visual Projection and Wiki Refinement

Status: **OWNER-DIRECTED DESIGN / ROADMAP SEED**  
Started: 2026-10-05

## 1. Purpose

VOMEGA's language and visual system should improve through repeatable experiments rather than ad hoc parser/UI edits.

This program defines an automated experimental loop for:

- natural-language command interpretation;
- NCL/NLCL grammar and frame design;
- grounding;
- defaulting;
- ambiguity handling;
- semantic command compilation;
- VisualSpec projection;
- contextual Wiki relevance;
- icon/annotation/layout treatments;
- correction interactions;
- negative-intent frontier ranking: which plausible counterfactual should be exposed earliest to minimize later semantic correction burden.

The experiment engine should run primarily in the [Semantic Runtime Laboratory](SEMANTIC-RUNTIME-LAB.md) and the [MVP Visualization Sandbox](MVP-VISUALIZATION-SANDBOX.md).

## 2. Core principle

> **Every proposed improvement competes against a pinned baseline over the same scenarios.**

Do not improve one example by silently breaking five others.

The unit of comparison should be a pinned Lab Profile:

```
semantic registry
+ World fixture
+ language pack
+ interpretation pipeline
+ grounding policy
+ command compiler
+ validator
+ visual projector
+ Wiki projector
+ visual treatment
+ evaluator
```

## 3. Experiment artifact

Conceptually:

```ts
type SemanticExperiment = {
  id: string
  hypothesis: string

  baselineProfile: string
  candidateProfiles: string[]

  scenarioSet: string
  metrics: MetricSpec[]
  falsifiers: FalsifierSpec[]

  generatedMutations?: MutationBatchRef[]
  humanLabels?: LabelSetRef[]

  runs: ExperimentRunRef[]
  conclusion?: PromotionDecision
}
```

The exact schema is not frozen.

## 4. Scenario artifact

A scenario should be richer than an input/output sentence pair.

Candidate:

```ts
type Scenario = {
  id: string
  tags: string[]

  initialWorld: WorldRef

  revisions: Array<{
    text: string
    semanticEdits?: SemanticEdit[]
  }>

  expected: {
    candidateCapabilities?: string[]
    provider?: string | null
    account?: string | null
    model?: string | null
    validation?: string
    ambiguity?: SemanticId[]
    forbiddenSelections?: SemanticId[]
    consequenceFacets?: string[]
    wikiPrimary?: SemanticId[]
  }

  invariants: string[]
  forbiddenOutcomes: string[]

  provenance: SourceRef[]
}
```

Scenarios may deliberately leave some fields unlabeled when the correct answer is genuinely open.

## 5. Mutation sources

Automated mutations should stress semantics, not simply create random strings.

### Paraphrase

Examples:

```
ask Claude ...
send this to Claude ...
use Claude for ...
have Claude answer ...
Claude: ...
```

### Word order

Move addressee before/after payload.

### Alias

Use Provider/Account/Model aliases.

### Typo

Controlled edit-distance mutation.

### Noise

Politeness, filler, punctuation.

### Scope

`only`, `except`, `not`, `instead`, `then`.

### Quotation

Provider/model names inside quoted payload.

### Referential language

`this`, `that`, `it`, `the other Claude`.

### Ambiguity

Remove Account or Model qualifiers.

### Correction

Append:

```
personal, not work
use the other one
not that model
```

### Registration

Variations of:

```
add my Claude account
connect another Claude
call this one Work
make this the default
```

### Invalid combinations

Known Provider + incompatible Account/Model.

### Unknowns

Unknown Provider, Account, Model, capability or parameter.

## 6. Metamorphic testing

Many language behaviors can be tested without manually labeling every utterance.

Examples:

### Benign paraphrase invariant

If only non-semantic politeness changes, command digest should remain equivalent.

### Explicit-target invariant

Adding an explicit Account should never resolve to another Account.

### Quoted-payload invariant

Provider/model/account words inside a quoted payload must not change routing.

### Ambiguity monotonicity

Removing a disambiguating Account qualifier may increase uncertainty; it may not silently produce a more specific different target.

### Correction invariant

A semantic correction should change only the addressed field unless dependency invalidation requires more.

### Visual invariance

Changing icon pack must not change command digest.

### Wiki invariance

Changing prose renderer must not change reflected source facts.

## 7. Language experiment classes

### Frame tournament

Compare multiple candidate frame sets over the same corpus.

### Recognizer ordering

Test collisions such as orientation `what accounts do I have` versus addressee-first `have Claude answer`.

### Addressee grammar

Compare deterministic strategies for Provider/Account-first phrasing.

### Model grammar

Determine which expressions reliably signal Model versus prompt payload.

### Defaulting policy

Test explicit > standing default > single valid > ask.

### Alias strategy

Measure how much user-defined aliasing can be supported without false grounding.

### Correction memory

Test whether learned corrections rank future candidates without silently deciding ambiguous cases.

### Symbolic grammar

Test `/`, `@`, `?`, `→` and other families as optional compact notation without creating a second semantic path.

## 8. Visual experiment classes

The semantic input must remain fixed while presentation varies.

### Annotation density

- phrase underline only;
- phrase + handles;
- phrase + handles + route strip.

### Ambiguity affordance

- dashed chip;
- dropdown;
- inline socket;
- compact chooser.

### Route representation

- Provider/Account/Model chips;
- compact sentence;
- small circuit.

### Consequence representation

- textual badge;
- icon + text;
- expandable effect strip.

### Wiki placement

- below command;
- side/expanded panel;
- semantic popover.

### Progressive disclosure

Measure what must remain visible in compact mode.

### Icon pack

At least two unrelated icon systems over the same semantic roles.

## 9. Visual metrics

Useful automated or semi-automated metrics:

- number of visible semantic objects;
- semantic coverage: expected handles rendered / expected handles;
- unresolved ambiguity visibility;
- visual state changes per keystroke;
- avoidable flicker;
- layout overflow;
- duplicate labels;
- inaccessible color-only distinctions;
- route completeness;
- consequence completeness;
- Wiki topic presence.

Human evaluation is still needed for comprehension and preference.

## 10. Semantic stability metric

One valuable metric is **semantic churn**.

For consecutive revisions, measure which semantic IDs changed.

Example:

```
Ask Claude
Ask Claude W
Ask Claude Wo
Ask Claude Work
```

Provider identity should stabilize early.

Account identity may remain unresolved until enough evidence exists.

A projector that continually flips unrelated handles creates distrust even if the final parse is correct.

Track:

```
stable handles
new handles
resolved handles
invalidated handles
unexpected flips
```

## 11. Time-to-honesty

Instead of only measuring “time to correct interpretation,” measure:

> At what revision did the system first represent uncertainty honestly?

For ambiguous Claude Accounts, a system that immediately guesses Work and later corrects to Personal may look fast but is semantically worse than one that shows `Account ?` early.

## 12. False-ready rate

Critical metric:

> How often does the system display READY while a required semantic field is unresolved or unsupported?

The existing release corpus defect U1 is an example.

Target should be effectively zero for consequential commands.

## 13. Wrong-target rate

Measure any command where:

- explicit Provider ignored;
- explicit Account ignored;
- explicit Model ignored;
- payload text misread as route;
- prior/default overrides an explicit choice.

Wrong target is more serious than low confidence.

## 14. Wiki experiment classes

### Context relevance

Does active ambiguity rank the correct help topic first?

### Structural grounding

Does every Wiki claim resolve to Reflection/live-state evidence?

### Removal test

Remove a capability from the active graph. Wiki must stop presenting it as current.

### Source-anchor integrity

Change/move source declaration and rebuild Reflection. Link must resolve to the new exact version.

### Depth rendering

Compare glance/explain/inspect modes without changing claim set.

### Query family

Test explicit `?` / natural-language introspection against the same semantic query path.

## 15. Automated Wiki falsifier

Given a synthetic World and Reflection Graph:

1. mutate the graph;
2. project Wiki;
3. assert no absent semantic node is claimed as active;
4. mutate live availability;
5. assert current-state explanation changes;
6. preserve historical source/evidence references;
7. ensure model-generated phrasing cannot introduce an unsupported claim ID.

## 16. Generated utterance proposals

An LLM may generate candidate utterance mutations.

Those outputs are **test proposals**, not expected truth.

Useful pipeline:

```
seed scenario
→ model proposes 100 phrasings
→ deterministic dedupe/classification
→ current pipeline run
→ cluster disagreements/failures
→ human label only high-information cases
→ add accepted cases to corpus
```

This makes model usage a coverage accelerator rather than execution authority.

## 17. Counterexample mining

Automatically rank scenarios where candidate Profile differs from baseline.

High-value cases include:

- different target;
- different readiness;
- ambiguity removed/introduced;
- different consequence;
- different Wiki explanation;
- different semantic handle despite equivalent wording.

These become review queues.

## 18. Corpus growth protocol

When a real phrase fails:

```
capture exact phrase
→ redact sensitive payload
→ capture relevant World fixture
→ record expected semantic distinction
→ add regression case
→ only then fix
```

Do not fix parser code first and invent the test afterward.

## 19. Visual regression capture

For each scenario/revision/variant:

- render deterministic state;
- capture structured VisualSpec;
- optionally capture screenshot;
- compare semantic structure first;
- compare pixels only for intended visual regressions.

A pixel difference is not automatically a semantic failure.

A semantic handle difference is more important.

## 20. Experiment matrix for the MVP

Initial matrix axes:

```
World:
  blank
  one-account-each
  ambiguous-claude
  models
  unavailable-combination
  stale-account

Language:
  direct
  addressee-first
  provider-first
  correction
  quoted-payload
  typo

Visual:
  annotated-sentence
  semantic-strip
  hybrid

Wiki:
  glance
  explain
  inspect
```

Do not attempt full Cartesian explosion on every run.

Use coverage-guided selection.

## 21. Experiment promotion

A candidate language/visual/Wiki artifact should move through:

```
DRAFT
→ CANDIDATE
→ TRIAL
→ PROVEN-FOR-SCOPE
→ ADOPTED
```

Promotion requires evidence against named scenarios and falsifiers.

An aesthetically preferred variant can remain experimental if it has weaker semantic comprehension.

## 22. Automatic experiment scheduler

A local agent can maintain a queue prioritized by:

- recent regression;
- high wrong-target severity;
- high scenario frequency;
- untested new grammar;
- ambiguous visual result;
- low Wiki relevance;
- second-provider/model generalization;
- high semantic churn;
- owner-selected research question.

The scheduler may choose what to test.

It may not auto-promote material semantic changes solely from a heuristic score.

## 23. Human study hooks

The sandbox should support lightweight human comparison:

- which target did you think Ω selected?
- was anything unresolved?
- what data leaves the machine?
- what would happen on Enter?
- how would you change Account/Model?
- which of two variants is easier to understand?

Measure answer correctness before preference.

## 24. Experiment report

Each experiment should produce a compact report:

```
hypothesis
baseline
candidate
scenario coverage
semantic regressions
semantic improvements
visual metrics
Wiki metrics
human observations
open counterexamples
promotion recommendation
```

Reports belong in Lab evidence, not as product authority.

## 25. Initial experiment backlog

### EXP-01 — Addressee-first language

Resolve current P1/P3/P4/P5 failures without harming orientation.

### EXP-02 — Account ambiguity

Test 0/1/2 Account Worlds and visual treatments.

### EXP-03 — Model routing

Add Model as a first-class route field and test explicit/default/ambiguous cases.

### EXP-04 — Quoted provider names

Ensure payload does not mutate route.

### EXP-05 — Semantic churn

Measure per-keystroke stability.

### EXP-06 — Visual annotation density

Compare three projection variants.

### EXP-07 — Ambiguity affordance

Compare chooser treatments on the same semantic state.

### EXP-08 — Wiki relevance

Rank topics from active semantic handles.

### EXP-09 — Icon-pack invariance

Swap full icon mapping with no command/Wiki semantic change.

### EXP-10 — OS taxonomy generalization

Run selected OS capabilities through the same semantic/visual/Wiki substrate to falsify AI-specific assumptions.

### EXP-11 — Reflection migration completeness

Run the codebase Reflection Migrator and measure unreflected public behavior.

### EXP-12 — New synthetic plugin

Install a never-before-seen capability with no documentation files and verify automatic Wiki/self-knowledge wiring.

## 26. Local-agent task seed

### EXP-A — Build scenario runner

Reusable deterministic scenario execution and result serialization.

### EXP-B — Build mutation engine

Metamorphic transformations plus optional LLM proposal ingestion.

### EXP-C — Build diff engine

Semantic diff before textual/pixel diff.

### EXP-D — Build metric engine

Wrong-target, false-ready, ambiguity honesty, churn, Wiki grounding.

### EXP-E — Build visual batch renderer

Run the same scenarios through multiple presentation packs.

### EXP-F — Build review queue

Surface only high-information disagreements/counterexamples.

### EXP-G — Build promotion ledger

Record experiment evidence and candidate dispositions.

## 27. Falsifiers

The experiment system is failing if:

1. parser changes are accepted because one demonstration looks better;
2. visual variants contain different semantic logic;
3. LLM-generated utterances become truth without labeling/evidence;
4. a single accuracy score hides wrong-target errors;
5. ambiguity is scored as failure even when ambiguity is the correct state;
6. pixel diffs substitute for semantic diffs;
7. experiments cannot be replayed from pinned profiles;
8. candidate changes overwrite the baseline;
9. rejected approaches disappear from history;
10. automated promotion can expand authority.

## 28. Change record

- **2026-10-05:** Initial design. Defines automated experiments for NLP/NCL, grounding, Model/Account routing, visual feedback and self-generated Wiki using the MVP Visualization Sandbox and Semantic Runtime Lab.


## Negative intent frontier experiments

The experiment engine is the evidence home for the [Negative Intent Signal Engine](NEGATIVE-INTENT-SIGNAL-ENGINE.md).

Do not evaluate it as ordinary top-N accuracy. The key comparison is whether a counterfactual surfaced **now** prevents more expensive semantic correction **later**.

At minimum compare three arms over identical revisioned scenarios:

1. baseline compiler/projection behavior;
2. ordinary top-N / second-ranked candidate exposure;
3. a negative-frontier policy that ranks alternatives by early-correction leverage.

Capture, per revision:

- full candidate-manifold digest or stable candidate refs;
- selected/leading interpretation;
- negative frontier emitted;
- first revision at which the eventually-corrected branch was available;
- user semantic correction and its revision;
- semantic fields invalidated/recomputed;
- correction steps now versus counterfactual later;
- unnecessary signals and dismissals;
- final canonical command/evidence outcome.

Primary metrics should include time-to-useful-negative-signal, early-correction capture, correction-step reduction, avoided invalidation cost, unnecessary-signal rate, frontier stability and stale-signal safety.

A policy does not earn promotion because it finds more alternatives. It earns promotion only when it reduces late correction cost without creating unacceptable interruption, instability or hidden ambiguity collapse.
