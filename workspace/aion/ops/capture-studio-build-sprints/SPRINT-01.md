# Build Sprint 01 — Trustworthy Continuity

**Status:** directional mission, not an implementation specification. **Owner:** Opus. **Actual sprint start SHA:** capture at launch, not hardcoded here.

## Why this opportunity

Capture Studio's value depends on whether observed data can be understood, followed through change, and traced back to evidence. **Identity, semantics, temporal continuity and provenance** look like interacting leverage points: a mistake in one can compound in entity resolution, learning, history, correlations, reconstruction and the user experience.

This is a **working hypothesis**, not a proven diagnosis of the current implementation. The live source may reveal a more valuable prerequisite, a solved concern, or another dominant bottleneck.

## Seven-layer orientation — not seven task queues

| Layer | Question to carry across the sprint |
| --- | --- |
| Capture & Observation | What was actually observed, from where and at what point? |
| Evidence & Memory | What survives faithfully, and with what provenance? |
| Interpretation & Derivation | What structure/meaning can be inferred without overstating certainty? |
| Knowledge & Relationships | What persists as the same entity, and how are relations justified? |
| Learning & Adaptation | How can corrections help without spreading mistakes? |
| Behavior & Reconstruction | Can state/change be explained and reconstructed from evidence? |
| Experience & Control | Can a user see, question and correct the resulting understanding? |

**Operational foundation:** security, local runtime, packaging, session lifecycles, resilience and performance are mission-critical enablers but **outside these seven core intelligence layers**. Treat real safety risks immediately, irrespective of the chosen feature direction.

## Discovery before choice

Inspect all current source and contracts, follow representative observations through several layers, look for high-blast-radius weaknesses and unexploited shared primitives. Consider competing intervention points and their likely benefits, coupling, reversibility and uncertainty. Where prior docs disagree with code, **record the disagreement, don't inherit the direction**.

Opus decides which subsystem to change first, which architectural approach to use, and when to move beyond the initial cluster. Avoid prescriptive algorithms and arbitrary progress percentages. Favor improvements whose effects propagate across layers without destroying source evidence, history, or provenance.

## Success and natural stopping point

The sprint is a meaningful **implementation advance**, not a physical QA campaign. A good boundary has:
- A coherent implemented change or set of changes that improves one or more cross-layer contracts;
- A clear explanation of which dependencies and behaviors it affects;
- A quick developer intuition dump in `QA-NEXT-TESTS.md` with each implementation commit;
- A concise Git checkpoint for next-session continuity and explicit **PENDING INDEPENDENT QA** where applicable.

No mandatory feature counts, time limits, percentage thresholds, or test-pass requirements for Opus. Do not stop merely because a tentative milestone is reached; use session context efficiency to decide handoff timing.

## Why this sprint design

- **Shared failure modes beat silo roadmaps:** identity/meaning/time/evidence interact.
- **Source-first avoids stale steering:** W1–W18 and historical scorecards originated from earlier code snapshots.
- **Directional autonomy preserves discovery:** the four lenses organize attention but do not demand four implementations.
- **Vertical impact matters:** improve connections, not isolated completion bars.
- **Short Git-backed state preserves depth:** next session reads current code and just the decision-worthy continuation; no historic chat dump.
- **Independent QA preserves truth:** Opus can move quickly through reasoning and implementation without reporting imaginary measurements.
