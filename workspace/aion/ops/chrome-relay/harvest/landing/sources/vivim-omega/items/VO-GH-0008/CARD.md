# VO-GH-0008 — Reference-based browser capture/session records

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/provider-browser/src/session.ts
- **Immutable revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`
- **Source Git blob:** `26bfe45866193ddf8c67e3b55dbbf4c9cde64647`
- **Source lines:** 1–148; copied entire module/document verbatim
- **Copy:** `items/VO-GH-0008/source/session.ts`
- **SHA-256, source/copy:** `e6813a812ff7d5d1bb9278bf2d3603e95b7dca5f20f00e5b4ac19aa22084a4e8`
- **Kind / priority:** implementation / CORE
- **Original terminology:** SessionRecord; CaptureRecord; asSessionRecord
- **Harvest state:** COPIED_MODULE, source inspected; not OFFLINE_TESTED or LIVE_VERIFIED

## Source-owned value
Session references separately persisted redacted capture, uses ATTACHED/RELEASED and sim flag.

## AION application candidate (not accepted)
Map session/capture refs to audit evidence and keep transport/browser/turn axes separate.

## Critical caveat
All observed browser sessions are fixture-based, not a live ChatGPT session.

## Proposed acceptance falsifier
Released or malformed sessions cannot authorize actuation.

## Distinctions and provenance
This is a pinned GitHub snapshot, **not** the unsynchronized Windows checkout, and not current ChatGPT browser evidence. The prior `OMEGA-01..08` entries in `../../../../FINDINGS.md` describe a separate local source tree and must not be treated as independent confirmation or synonyms. No donor files or live browser state were changed.
