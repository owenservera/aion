# VO-GH-0007 — Realization-driven provider registry

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/vivim-providers/src/registry.ts
- **Immutable revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`
- **Source Git blob:** `75475b84459a0f97fa53cb7bc9f8e562abebe8c6`
- **Source lines:** 1–92; copied entire module/document verbatim
- **Copy:** `items/VO-GH-0007/source/registry.ts`
- **SHA-256, source/copy:** `80f2ba997dddc0b62cb223328e1d8dbaea8a94fc15969ef950370d4cd79dd27e`
- **Kind / priority:** implementation / CORE
- **Original terminology:** deriveRegistry; asRealization; ProviderRegistryEntry
- **Harvest state:** COPIED_MODULE, source inspected; not OFFLINE_TESTED or LIVE_VERIFIED

## Source-owned value
Registry entries are built from realization records plus liveness and optional manifests.

## AION application candidate (not accepted)
Preserve independent realization and active-op signals; do not import permissive fallback.

## Critical caveat
Unknown provider class coerced to SIMULATOR in asRealization; liveness does not prove UI state.

## Proposed acceptance falsifier
Unregistered provider or stale liveness cannot act.

## Distinctions and provenance
This is a pinned GitHub snapshot, **not** the unsynchronized Windows checkout, and not current ChatGPT browser evidence. The prior `OMEGA-01..08` entries in `../../../../FINDINGS.md` describe a separate local source tree and must not be treated as independent confirmation or synonyms. No donor files or live browser state were changed.
