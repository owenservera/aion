# VO-GH-0001 — ProviderClass and routed-op manifest vocabulary

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/contracts/src/manifest.ts
- **Immutable revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`
- **Source Git blob:** `16570d1c65f0c2fa6f6348519a1ed15733ceafe9`
- **Source lines:** 1–147; copied entire module/document verbatim
- **Copy:** `items/VO-GH-0001/source/manifest.ts`
- **SHA-256, source/copy:** `5edd767efaa400646228dde3d3ba306ac983330299eef5e3e6072fc7f4b08118`
- **Kind / priority:** schema / CORE
- **Original terminology:** ProviderClass; PluginManifest; routableOps
- **Harvest state:** COPIED_MODULE, source inspected; not OFFLINE_TESTED or LIVE_VERIFIED

## Source-owned value
SIMULATOR/API_NATIVE/BROWSER_MEDIATED classification and manifest-declared routed ops.

## AION application candidate (not accepted)
Use provider class and declared operation taxonomy, not manifest as live readiness.

## Critical caveat
Manifest declares possible ops; neither installed nor currently available nor authorized; Chrome state is absent.

## Proposed acceptance falsifier
A manifest capability cannot turn a disabled Send into available.

## Distinctions and provenance
This is a pinned GitHub snapshot, **not** the unsynchronized Windows checkout, and not current ChatGPT browser evidence. The prior `OMEGA-01..08` entries in `../../../../FINDINGS.md` describe a separate local source tree and must not be treated as independent confirmation or synonyms. No donor files or live browser state were changed.
