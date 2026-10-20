# VO-GH-0005 — Single derivation of routed capability names

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/contracts/src/surface.ts
- **Immutable revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`
- **Source Git blob:** `9a9e3cdfd126ed04832bc5f7bed19eeb4d6292fd`
- **Source lines:** 1–44; copied entire module/document verbatim
- **Copy:** `items/VO-GH-0005/source/surface.ts`
- **SHA-256, source/copy:** `fc690a7284540ac04b0c9efbad25b27874f419388673e8c5ba5c6bee533e9fe0`
- **Kind / priority:** implementation / CORE
- **Original terminology:** surfaceOpMeta; capabilityNamesFromRouted
- **Harvest state:** COPIED_MODULE, source inspected; not OFFLINE_TESTED or LIVE_VERIFIED

## Source-owned value
Capability names are derived from booted routed ops, shared across MCP and chat.

## AION application candidate (not accepted)
Use one canonical command catalog projection, separate availability and authorization.

## Critical caveat
Routed op exists does not mean observed browser action available.

## Proposed acceptance falsifier
A command can be listed but denied at execution.

## Distinctions and provenance
This is a pinned GitHub snapshot, **not** the unsynchronized Windows checkout, and not current ChatGPT browser evidence. The prior `OMEGA-01..08` entries in `../../../../FINDINGS.md` describe a separate local source tree and must not be treated as independent confirmation or synonyms. No donor files or live browser state were changed.
