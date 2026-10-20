# VO-GH-0031 — Domain contract blueprint normalization

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/discovery-mapping/src/blueprint.ts#L1-L79
- **Revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`; full original Git blob `f7ed5a16806f03f20cb7123f43e1a689c70cd549`
- **Source line coverage:** 1-79; entire file copied verbatim
- **Copied relative path:** `items/VO-GH-0031/source/blueprint.ts`
- **Exact copied bytes SHA-256:** `dbff57f53f9cbcbec9e9dc66f8066b04d9fb659d6f0025b6fdfd741ca3b67f8a`
- **Harvest:** COPIED_MODULE; SOURCE_OBSERVED only; no tests executed
- **Terms:** normalizeBlueprint; baseOp; RiskClass

## Source value
Normalizes pack contract declarations independently of plugin execution code.

## Candidate transfer, not approved design
Translate declared contract vocabulary only, default unknown external action to blocked.

## Explicit hazard
Missing declared risk defaults to READ in source; not appropriate for inferred destructive browser controls.

## Acceptance falsifier
Unknown-risk send never becomes read-only.

GitHub source is a pinned snapshot, **not** the unverified local Core/BCP-dev/FullTest tree. This capture does not alter any donor code or validate a live browser provider.
