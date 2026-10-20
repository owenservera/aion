# VO-GH-0009 — Deterministic-first command interpretation

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/vivim-chat/src/resolve.ts
- **Immutable revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`
- **Source Git blob:** `9d10f3ecf08ad449215452ebed24a39433197de7`
- **Source lines:** 1–108; copied entire module/document verbatim
- **Copy:** `items/VO-GH-0009/source/resolve.ts`
- **SHA-256, source/copy:** `f95f4ffaac358282e3af6940194a6191f129e66e4ad2dd34725fd48f04a9abae`
- **Kind / priority:** implementation / ADJACENT
- **Original terminology:** parseResolveInput; deterministicMatch; deterministicVerdict
- **Harvest state:** COPIED_MODULE, source inspected; not OFFLINE_TESTED or LIVE_VERIFIED

## Source-owned value
Exact known-op match resolves without fuzzy inference; ambiguous routes to shared classifier.

## AION application candidate (not accepted)
Use one deterministic normalization before fallbacks, with separate execute approval.

## Critical caveat
Interpretation never executes action or grants permission.

## Proposed acceptance falsifier
Exact command resolution has zero send side effects.

## Distinctions and provenance
This is a pinned GitHub snapshot, **not** the unsynchronized Windows checkout, and not current ChatGPT browser evidence. The prior `OMEGA-01..08` entries in `../../../../FINDINGS.md` describe a separate local source tree and must not be treated as independent confirmation or synonyms. No donor files or live browser state were changed.
