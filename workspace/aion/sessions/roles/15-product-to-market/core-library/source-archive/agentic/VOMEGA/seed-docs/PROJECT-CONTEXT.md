# Project Context — Why VIVIM-Ω Exists

## The product

VIVIM is intended to be the place where a person's digital world lives: a local environment that can hold and operate information, accounts, conversations, tools, agents, automations and other digital objects as governed, composable things.

The important word is **environment**.

It is not primarily another chat application, agent manager or browser shell. The ambition is a personal operating environment in which meaning, capability, authority, work, evidence, memory, continuity and interaction form one coherent system.

## Long-horizon proposition

Models, providers, browsers, agent frameworks, protocols, execution substrates and interfaces will change.

The durable proposition is:

> A person can express what they want in human terms, have that meaning resolved into explicit governed operations, act across their digital world, retain what happened and what was learned, and allow the environment to evolve without surrendering ownership or continuity.

Durable candidate capabilities include a human-readable semantic execution language, a persistent personal semantic World, governed action between intent and effect, durable Work/evidence/continuity, and governed self-extension.

These are conceptual assets, not claims that today's implementation is complete.

## Product anchor

The first concrete wedge is a persistent local VIVIM environment in which real provider webapps can become first-class external capabilities.

The complete falsifiable path is:

```text
person
→ expression
→ explicit semantic meaning
→ capability
→ Provider / Account / Session / realization
→ authority
→ Work / attempt
→ external effect
→ observation
→ evidence
→ local continuity
```

The provider remains external. VIVIM owns the local semantic relationship, authorized interaction, configuration, Work, evidence and continuity around it.

A browser is a realization mechanism, not constitutional authority.

## Sovereignty

Core stance:

> **my machine, my internet, my accounts, my data, my apps, my intelligence, my rules, my interaction**

This is not merely deployment preference. The system should minimize unnecessary dependence on centralized application backends or proprietary APIs when a real user-controlled interface can safely provide the capability.

Sovereignty also means local evidence, exportability, reconstructability and the ability to change models/providers/surfaces without losing identity or continuity.

## From VIVIM to Ω

Older VIVIM/BCP implementations are the mine: useful algorithms, domain knowledge, fixtures, provider experiments, interaction patterns, failures and constraints mixed with architectural debt and accidental structure.

The intended relationship is:

```text
old VIVIM/BCP → evidence / ore / fixtures / proven mechanisms
Ω baseline     → current implementation substrate to inspect and challenge
current build  → architecture earned from present evidence
```

Do not port old organization or architecture by default. Harvest mechanisms when they genuinely outperform reinvention.

## Canonical conceptual path

The durable semantic coordinates are:

> **World → Context → Intent → Capability → Authority → Work → Execution → Evidence → World/Memory update**

For an external interaction:

> **human expression → semantic meaning → governed action → external realization → observed result → durable local evidence**

These are semantic coordinates, not a required class hierarchy.

## Distinctions more durable than components

Preserve the separations in `INVARIANTS.md`, especially:

- reality ≠ representation;
- evidence ≠ authority;
- intent ≠ execution;
- capability ≠ realization;
- Provider ≠ Account ≠ Model ≠ Session;
- discovery ≠ routing;
- routing ≠ authority;
- memory ≠ context;
- Work ≠ worker;
- World ≠ surface;
- confidence ≠ proof.

## Canonicality, memory and surfaces

The intended conceptual model is:

- **Vault** — durable local source of truth;
- **World** — product-level semantic reality derived from durable truth, relationships and current evidence;
- **Work** — durable process reality;
- **Evidence** — support for claims about what happened;
- **Context** — task-scoped derived assembly;
- **Surface** — replaceable representation/interaction boundary;
- **Process/Session** — transient execution state.

A chat, command box, browser page, CLI or future spatial surface may represent the same underlying World without becoming canonical truth.

## Human semantic control

The central control inversion is:

> **probabilistic perception → explicit deterministic meaning where possible → governed execution**

Natural language is an interface, not authority.

Models can propose ambiguity resolutions, synthesis, discovery, planning and adaptation. Raw model output never becomes constitutional authority merely because it is confident.

The objective is not "more AI everywhere"; it is to make powerful intelligence usable through human language while moving stable semantics, validation, authority and proof into explicit machinery.

The Negative Intent Signal Engine is one D5 hypothesis for this control loop: challenge the leading interpretation with the most useful plausible counterfactual early enough to avoid expensive semantic correction, without creating a second parser or authority path.

## Work, observation and proof

Consequential work should be observable and reconstructable rather than inferred from process behavior.

Where knowable, distinguish completed, active, interrupted, stopped, never-started and genuinely uncertain external effects.

Completion should be positively evidenced where practical. A disappeared process, elapsed timer or absence of error is not completion proof.

Evidence must outlive transient workers/sessions long enough for consequential claims to remain reconstructable.

## Forge and evolution

Ω is intended to make extension a first-class governed capability.

Forge is not a privileged second authority system. New plugins/compositions/mechanisms should enter through the same inspectable evidence/authority/compatibility boundaries as the rest of the system.

Self-evolution is trustworthy only when the system can explain what changed, why, what was affected, what was authorized, and what evidence supports the result.

## Beta discipline

The practical objective is a coherent beta that real people can use.

Prefer a small complete vertical slice over a large inventory of partial subsystems.

Do not optimize for documentation volume, architecture ceremony, agent count, provider count, rule count or feature count.

Optimize for demonstrated user value plus a trustworthy system underneath it.

## How to interpret the repository

The repository contains current implementation, tests, fixtures, evidence, current product/design documents and a dated archive of historical planning/tooling material.

Classify material before trusting it:

```text
invariant / owner intent
≠ evidence
≠ design hypothesis
≠ implementation
≠ plan
≠ historical archaeology
```

The archive exists to reduce rediscovery, not to control current work.

Fresh workers should start from root `AGENTS.md` and `.project/SITREP.md`, then read only the product/design context their task actually needs.
