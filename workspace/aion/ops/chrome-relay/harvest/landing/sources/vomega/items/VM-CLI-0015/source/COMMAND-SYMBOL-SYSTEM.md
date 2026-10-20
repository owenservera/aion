# Command Symbol System

## Existing Ω foundation
The repository already implements 17 symbolic families in nlcl-pure:
/ command; @ reference; # tag; ! force; ? query; + add; - remove; & combine; $ value/binding; * wildcard; % configuration; ∆ delta/change; ✓ confirm; = assert/teach; ^ priority; ~ approximate; → direction/routing.

These are lexer-level primitives. Natural-language meanings, frames and lexicon can evolve as data.

## Product role
The symbolic system should be the compact semantic notation of the entire Personal Agent interface, not merely developer shorthand.

Conceptual examples:
/send @this → @peter
? capabilities @vivim.run
? dependencies @provider
∆ @rule:forwarding → @sarah
+ @work "prepare quarterly report"
✓ @work:work_…

These examples describe the intended semantic role; exact spelling is not claimed as currently complete.

## Bidirectional model
Natural language ↔ symbolic notation ↔ structured Intent

Natural language can be canonicalized to symbols; symbols can be read back as natural language; Intent remains the structured bridge.

## Introspection
The query family should become the doorway into system self-knowledge: describe, inspect, explain, dependency, impact, history, diff, configuration, authority and evidence.

The exact introspection grammar is still open and must extend the existing symbolic system rather than introduce another DSL.

## Personalization
Principal-owned language can deterministically modify interpretation without granting authority. Example concept: blitz = /send.

## Ambiguous tail
AI/ML may suggest candidates or explanations, but raw model output cannot directly become executable intent.
