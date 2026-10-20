# VO-GH-0032 — Pure trace, causal edges and drift representation

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/discovery-observation/src/trace.ts#L1-L229
- **Revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`; full original Git blob `744c1b1ef87ca67a7ad6eb21b7fffa818f4c5f01`
- **Source line coverage:** 1-229; entire file copied verbatim
- **Copied relative path:** `items/VO-GH-0032/source/trace.ts`
- **Exact copied bytes SHA-256:** `712e29688f70d0270bdb1251c3505c7dcaca4c856787e2e81b4d97c78120551e`
- **Harvest:** COPIED_MODULE; SOURCE_OBSERVED only; no tests executed
- **Terms:** parseTrace; deriveEdges; DriftRecord

## Source value
Pure trace parsing with byte spans, deterministic causal-edge and drift reports.

## Candidate transfer, not approved design
Use typed evidence spans and drift signals; no blanket network collection.

## Explicit hazard
Recorded network/dom-update events are fixtures, not permission to capture current users' page data.

## Acceptance falsifier
No inferred edge alone proves remote message sent.

GitHub source is a pinned snapshot, **not** the unverified local Core/BCP-dev/FullTest tree. This capture does not alter any donor code or validate a live browser provider.
