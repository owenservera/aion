# Personal Agent, Self-Knowledge, and Command Language

> Status: PROPOSED — destination-level design capture, 2026-09-25

## Thesis

VIVIM should be a self-describing computing environment. The user should be able to ask the system about itself—its identity, state, capabilities, configuration, dependencies, history, authority, evidence, current Work, and behavior—and receive an answer grounded in the same canonical reality that the system uses to operate.

The Personal Agent is the principal-facing intelligence that makes this capability usable. It is not a second authority system or a second database.

## The one semantic loop

User language or symbols → NCLL → grounding against World/Self-Knowledge → Intent → Capability → Authority → Work → Execution → Evidence → World/Memory update

Pure questions may stop after evidence-backed derivation. Changes continue through governance and durable Work where needed.

## Self-knowledge as a native product capability

Treat the internal-wiki metaphor as UX, not storage architecture.

- canonical objects are the facts/pages;
- canonical relationships are the links;
- revisions are history;
- evidence is citation;
- derived projections are views;
- capabilities are executable affordances;
- Work is durable process state;
- language traces explain interpretation.

Self-knowledge therefore becomes a set of queryable projections over canonical reality rather than a manually curated encyclopedia.

## Plugin-native extension

A normal plugin should extend self-knowledge naturally by contributing generic declarative information through existing manifests/contracts: identity, contributions, capabilities, contracts, configuration, lifecycle, dependencies, language, objects, and evidence expectations.

Plugin installation should expand the self-knowledge universe without requiring a bespoke Personal-Agent adapter.

## Symbolic command system

Ω already has the 17 symbolic families in nlcl-pure: / @ # ! ? + - & $ * % ∆ ✓ = ^ ~ →.

These should be treated as stable semantic primitives for the entire Personal Agent surface.

Natural language ↔ symbolic notation ↔ structured Intent

A user can type natural language and see its canonical symbolic reading; symbols can be read back as natural language; Intent remains the structured bridge.

## Self-knowledge and language reinforce each other

Self-Knowledge is both a source for command grounding and a product of command execution.

Self-Knowledge → better grounding → better Intent → better Work → more evidence → richer Self-Knowledge

This is the deeper reason the two areas should be designed together.

## Answer trust model

A self-answer should be able to expose:

claim + basis + freshness + authority + evidence + optional action

Confidence must not be confused with proof, and a representation must not become authority merely because the Personal Agent speaks it fluently.

## Personal Agent identity

The Personal Agent is a product role associated with one user's instance. Its durable identity/lifecycle must still be reconciled with Product Instance, principal identity, vivim.agent, AgentDefinition, and Work.

## Open design work

The next design pass should define the Self-Knowledge ontology, query/answer contracts, plugin self-description, Personal Agent identity/lifecycle, dependency/impact graph, symbolic introspection grammar, evidence/freshness model, falsifiers, and the first minimal end-to-end journey.

The owner's newer symbolic-language design outside the repository must be imported before implementing that next language wave.
