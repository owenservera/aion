---
name: first-pass-decompose
description: Extract atomic ideas, variants, dependencies and acceptance gates from a proposal, without feasibility verdicts, ranking, advocacy or implementation.
---
# Neutral First-Pass Decomposition

## Steps
1. Open immutable RAW.md before the summary. Never replace it or use other agents' summaries as the primary source.
2. Extract one-paragraph descriptive abstract, then enumerate atomic technical ideas. Keep source-specific terminology; distinguish exact assertions from inference.
3. Preserve *all* options and alternatives, including minority, incompatible and low-confidence ones.
4. Extract components/interfaces, required environments, prerequisites, proposed acceptance conditions, tests and stated costs/benefits if present.
5. Add open questions, unverifiable claims, missing detail and points of direct contradiction. Don't fill with generic technical lore or silently correct source.
6. Map existing AION seeds when actually supported: ACP/UAH, IANG, VOMEGA, ZCode/OpenCode, M1, Chrome relay. Mark these as `AION inference`, not as source-derived claims.
7. Publish to DECOMPOSITION.md, explicitly labeled derived and citing RAW source sections or unambiguous excerpts. No weighted scores, 'best design', assigned execution tasks or final decision.
8. Ensure all extracted claims are supported; otherwise explicitly tag `NOT IN SOURCE` and remove from source-derived section.

## Acceptance
A consumer can navigate from each proposed technical component or uncertainty back to original text and see what has and hasn't been checked.
