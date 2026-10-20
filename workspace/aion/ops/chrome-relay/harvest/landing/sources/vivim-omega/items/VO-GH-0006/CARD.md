# VO-GH-0006 — Typed ambiguity and refusal outcomes

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/contracts/src/outcome.ts
- **Immutable revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`
- **Source Git blob:** `e1f5ce240786202aa114b97c006a166469995d13`
- **Source lines:** 1–38; copied entire module/document verbatim
- **Copy:** `items/VO-GH-0006/source/outcome.ts`
- **SHA-256, source/copy:** `53ab344c12ecd47f2f907fcb0e4bac0e059a11de38ddf916207347793216339c`
- **Kind / priority:** schema / CORE
- **Original terminology:** OutcomeStatus; Outcome; fail
- **Harvest state:** COPIED_MODULE, source inspected; not OFFLINE_TESTED or LIVE_VERIFIED

## Source-owned value
Distinguishes UNKNOWN, UNSUPPORTED, AMBIGUOUS, CONTRADICTORY, REFUSED from OK.

## AION application candidate (not accepted)
Keep contradictory/ambiguous evidence explicit and fail closed.

## Critical caveat
Outcome status is local response classification, not proof of remote effect.

## Proposed acceptance falsifier
Two plausible Send targets yield AMBIGUOUS, not guessed selection.

## Distinctions and provenance
This is a pinned GitHub snapshot, **not** the unsynchronized Windows checkout, and not current ChatGPT browser evidence. The prior `OMEGA-01..08` entries in `../../../../FINDINGS.md` describe a separate local source tree and must not be treated as independent confirmation or synonyms. No donor files or live browser state were changed.
