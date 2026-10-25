# Invariants — Seed-Level Product and Architecture Guardrails

## Status

These are inherited working invariants distilled from the Ω baseline, destination corpus, prior VIVIM evidence, and recent development-learning work.

They are not a frozen implementation specification.

They exist to prevent the fresh build from repeatedly rediscovering high-cost lessons or silently collapsing distinctions that matter to the product.

When evidence proves an invariant wrong, the project may change it through explicit reasoning and preserved lineage.

## Sovereignty

VIVIM is a user-owned local environment.

The user's machine, durable local state, accounts, data, applications, interaction, and rules are part of the product's sovereignty proposition.

External providers remain external.

VIVIM should own the local relationship and authorized interaction around an external provider without pretending to own the provider itself.

## Canonicality

There should be a clear answer to “what is the source of truth?”

Do not allow a projection, cache, summary, session, model context, browser observation, or UI arrangement to become canonical merely because it is convenient.

The intended conceptual distinction is:

- **Vault:** durable canonical local truth.
- **World:** canonical product-level reality/semantic organization derived from durable truth and relationships.
- **Work:** durable process reality.
- **Evidence:** record supporting claims about what happened.
- **Surface:** representation and interaction.
- **Context:** task-scoped derived assembly.
- **Process/session:** transient execution mechanism.

A surface may disappear.
A worker may disappear.
A process may restart.
The user's canonical meaning should not disappear with them.

## Semantic separations

Do not casually collapse:

| Keep distinct | Principle |
|---|---|
| Reality / Representation | a representation is not the thing |
| Evidence / Authority | proof does not grant permission |
| Intent / Execution | what was meant is not what was done |
| Capability / Realization | semantic ability is not an implementation |
| Provider / Account | external service is not the user's relationship to it |
| Provider / Model | service identity is not a model/routing option it exposes |
| Account / Model | authenticated relationship is not the model selected within that relationship |
| Account / Session | durable relationship is not transient execution state |
| Discovery / Routing | knowing what exists is not choosing among it |
| Routing / Authority | selecting a realization is not permission to act |
| Memory / Context | durable retention is not temporary task assembly |
| Work / Worker | durable work is not the actor performing it |
| World / Surface | UI projection is not canonical product reality |
| Space / World | organization is not a second database |
| Confidence / Proof | plausibility is not evidence |
| Construction / Authority | creating something does not authorize it |
| Activity / Progress | more activity is not more value |
| Successful execution / Correct outcome | a completed mechanism can still produce the wrong result |
| Product importance / Kernel necessity | important does not mean it belongs in the constitutional core |
| Semantic identity / Policy classification | a stable capability or entity must not need a new identity merely because risk, consent, routing or policy changes |
| Fidelity / Evidence maturity | what a realization claims to accomplish is distinct from how strongly that claim has been verified |

These distinctions may be implemented differently over time. The relationships they protect are the important part.

## Human semantic control

Natural language is an interaction medium, not authority.

The long-term target is:

**human expression → semantic interpretation → explicit meaning → governed execution**

AI may be used where uncertainty, inference, synthesis, discovery, or other probabilistic work adds value.

The resulting consequential meaning must become explicit enough for the deterministic parts of the system to govern.

Raw model output never becomes constitutional authority by itself.

When meaningful ambiguity remains, the environment should clarify, narrow, or refuse rather than silently invent certainty.

## One semantic operation, many surfaces

Language, canvas, CLI, MCP, automation, agents, and future surfaces should converge on the same underlying semantic operations.

Different surfaces may differ radically in presentation.

They should not silently create separate execution or authority systems.

## Work and agency

Work is the durable unit of consequential activity.

A worker, agent, model, browser session, or process is a replaceable actor or mechanism over that work.

Consequential work should remain understandable and reconstructable across interruption, process death, worker replacement, and external delay where the runtime can reasonably preserve the necessary evidence.

Completion should be positively evidenced where knowable.

Disappearance of a process is not proof of completion.

An uncertain external effect should be treated as uncertain until reconciled; blind retry is not a substitute for knowledge.

## Authority and refusal

Authority should be explicit, attributable, and scoped.

The system should be able to answer, for consequential activity:

- what was requested;
- what was understood;
- what capability was selected;
- which provider/account/realization was involved;
- what authority applied;
- what was attempted;
- what actually happened;
- what remains uncertain.

Refusal is a legitimate system outcome, not an implementation failure to hide.

No component should gain authority simply because it is first-party, generated by Forge, trusted historically, or successful previously.

## Evidence and learning

Evidence should survive long enough to support the claims that depend on it.

Observation, hypothesis, caveat, rule, and proof are different epistemic categories.

A useful engineering rule should be actionable, testable, falsifiable, and connected to behavior the system can actually change.

Rules should be retired or superseded when they become inert, unreachable, contradicted, or no longer useful.

More executions, more rules, more agents, or more code are not evidence of improvement.

A system change should, where measurable, be evaluated for whether it actually changed the behavior it was intended to change.

## Extensibility

Replaceable or extensible capabilities and product contributions should enter through explicit boundaries.

“Everything is a plugin” does not mean every byte or every world object is a plugin.

It means meaningful replaceable capability and product behavior should not require secret privileged paths.

First-party and third-party extensions should be governed by the same essential boundary principles.

Forge is an extension mechanism, not a second authority system.

Construction does not confer trust or authority; admission, governance, evidence, and lifecycle still apply.

## Core minimality

Fundamental to VIVIM does not mean fundamental to the kernel.

A responsibility should move toward the constitutional kernel only when the build can show that it is necessary for arbitrary extensions to exist safely, non-bypassably enforceable there, domain-neutral, broadly applicable, constitutionally stable, minimal, and free of product semantics.

Otherwise it remains a candidate for contracts, plugins, compositions, or tooling.

The exact current K0/K1 boundary must be re-validated against the live system.

## Strategic solution shape

The autonomous build should optimize for the **shape and leverage of solutions**, not only whether the immediate feature works.

Prefer capability multipliers and upgradeable boundaries when a concern is likely to recur across otherwise independent parts of the product. An engine is a strategic role: it is a replaceable, improvable capability boundary that makes future work cheaper or more reliable. It is not automatically part of the constitutional kernel.

The first successful implementation is evidence of a working mechanism, not proof of the final abstraction.

Prefer:

**concrete case → repeated need → observed commonality → reusable capability → engine candidate**

Avoid both extremes: hard-coding the first concrete case until every later case becomes a special exception, and building a generalized framework before repeated evidence establishes that the abstraction is useful.

For important mechanisms, apply a **second-use / second-realization test** where practical. The second materially different use case or realization should challenge whether the boundary is genuinely semantic and reusable. A failure of generalization is useful evidence and should trigger redesign rather than more exception handling.

Stable semantic contracts should be kept separate from replaceable realizations. Provider, protocol, browser, model, worker, session, and automation mechanism should not become constitutional simply because they were used first.

Provider/protocol management and self-healing are explicit examples. A provider protocol manager should become progressively better at accommodating different providers, protocols, versions, accounts, and realizations rather than encode one provider's quirks as the architecture. A self-healing system should generalize from repairing one provider's changing surface toward a bounded recovery capability with observation, diagnosis, governed change, verification, and evidence. Provider-specific strategies may exist inside that boundary; the boundary itself should not be provider-specific.

Separate mechanism, capability, policy, authority, evidence, and learning. Convenience in the first implementation is not sufficient reason to collapse them.

Measure architectural leverage where feasible. A claimed improvement should be visible in outcomes such as lower cost of adding another capability or provider, easier replacement of a realization, reduced duplicated logic, better recovery, stronger evidence, or lower dependence on a particular model/tool/provider. More code, abstractions, agents, rules, or activity are not leverage by themselves.

No engine is sacred. Engine boundaries remain engineering hypotheses and should be replaceable or dissolvable when evidence shows they are wrong.

## Continuity and replacement

User-owned identity, canonical state, useful relationships, Work history, evidence genealogy, and compatible configuration should survive replacement of transient mechanisms and replaceable implementations.

A replacement may invalidate compatibility.

That is a reason to expose the incompatibility and preserve recoverability, not to silently rewrite history.

A rollback is not equivalent to deletion.

Retiring a mechanism should not erase the evidence that the mechanism once produced.

## Evolution

The environment should become easier to change without becoming less trustworthy.

Important change should remain attributable, impact-aware, appropriately authorized, verifiable, and recoverable.

The exact change pipeline may evolve.

The invariant is that self-improvement cannot silently turn into self-granted authority.

Constitutional change is a different category from ordinary product evolution and must not be self-authorized by the ordinary machinery it governs.

## No mysterious agency

Consequential behavior should make actor, capability, authority, scope, and outcome discoverable enough for the person and for the system to reason about them.

The complexity of achieving this may be substantial.

That complexity should remain underneath the human mental model.

## Exit

The person should be able to leave, export, restore, reconstruct, replace, and reconfigure the environment without surrendering the meaning of their world to an opaque external owner.

The exact export format is not the invariant.

Recoverable ownership is.

## Small falsifiers over large ceremonies

When an important claim is uncertain, prefer the smallest experiment that could prove it wrong.

Do not equate documentation volume, process complexity, test count, or organizational structure with rigor.

The fresh project should continually seek compact evidence that invalidates bad assumptions early.

## Epistemic status is part of truth

The project must be able to represent “unknown,” “historical evidence,” “hypothesis,” “contradicted,” and “experiment required” without coercing them into true/false certainty.

A repeated assertion does not become a fact through repetition. A current mechanism does not become an invariant through existence. A useful historical decision does not become current law without current authority/evidence.

Use `KNOWN-REALITY-AND-OPEN-FRONTIER.md` as the seed-level discipline for this distinction.


## Self-description and semantic identity

Loaded product behavior should be inspectable enough that the system can explain what it is, what it accepts, what it may affect, where it comes from, and how it relates to other semantic objects.

The product should move toward the invariant:

> **If Ω can load a public product capability, Ω can reflect and explain it.**

This does not make self-description authority.

Reflection remains descriptive and source-bound.

Stable semantic identity should avoid embedding replaceable policy or implementation choices. In particular, capability identity should not encode current risk class, Provider/platform realization, icon library, availability state, or current evidence maturity.

## Consequence dimensions

Do not assume that one risk label completely describes an action.

The system may need to preserve independently:

- mutability/destructiveness;
- local versus external/network/physical effect;
- privacy/sensitivity;
- data transfer;
- reversibility;
- visibility;
- authority/consent requirement.

Policy may derive current gates from these dimensions.

The dimensions themselves should not be collapsed merely because the current law implementation uses a smaller risk vocabulary.
