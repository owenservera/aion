# VO-GH-0003 — ProviderRealization evidence ownership

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/contracts/src/provider.ts
- **Immutable revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`
- **Source Git blob:** `092b11e03d0722d95039e49a7092f39e6bca0fa9`
- **Source lines:** 1–167; copied entire module/document verbatim
- **Copy:** `items/VO-GH-0003/source/provider.ts`
- **SHA-256, source/copy:** `cd8e39c1d7cae5c9c2ab7dbd4ea13c7fb9e5a722d615790534cdd4bbebf171ae`
- **Kind / priority:** schema / CORE
- **Original terminology:** ProviderRealization; EvidenceRef; providerRealizationId
- **Harvest state:** COPIED_MODULE, source inspected; not OFFLINE_TESTED or LIVE_VERIFIED

## Source-owned value
Associates archetype slug, provider class, lineage, references and capability streams.

## AION application candidate (not accepted)
Map provider/realization/evidence to existing Track B contracts without parallel registry.

## Critical caveat
Module facade re-exports other contracts; no guarantee of fresh binding to any specific webapp.

## Proposed acceptance falsifier
One semantic operation can have distinct provider realizations.

## Distinctions and provenance
This is a pinned GitHub snapshot, **not** the unsynchronized Windows checkout, and not current ChatGPT browser evidence. The prior `OMEGA-01..08` entries in `../../../../FINDINGS.md` describe a separate local source tree and must not be treated as independent confirmation or synonyms. No donor files or live browser state were changed.
