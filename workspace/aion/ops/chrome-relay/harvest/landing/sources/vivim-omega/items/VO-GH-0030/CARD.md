# VO-GH-0030 — Deterministic capability candidate solver

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/discovery-mapping/src/solve.ts#L1-L145
- **Revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`; full original Git blob `b7011f9bebaf4344009c48b569e126fed598058a`
- **Source line coverage:** 1-145; entire file copied verbatim
- **Copied relative path:** `items/VO-GH-0030/source/solve.ts`
- **Exact copied bytes SHA-256:** `6c21624bc01605aaf5b7cf45592b5e57a535a8bff68bb697d38be1a4109a7200`
- **Harvest:** COPIED_MODULE; SOURCE_OBSERVED only; no tests executed
- **Terms:** solveMapping; CandidateLike; MappingGap

## Source value
Matches candidate operations to declared blueprint contracts with risk compatibility and gap reporting.

## Candidate transfer, not approved design
Keep UNSAT/gap and risk mismatch semantics; reject automatic 'best candidate' effectful action.

## Explicit hazard
REJECT Omega's confidence-ranked tie break when multiple browser Send candidates exist; AION needs exactly-one-target proof.

## Acceptance falsifier
Two matching Send targets must block, not silently rank.

GitHub source is a pinned snapshot, **not** the unverified local Core/BCP-dev/FullTest tree. This capture does not alter any donor code or validate a live browser provider.
