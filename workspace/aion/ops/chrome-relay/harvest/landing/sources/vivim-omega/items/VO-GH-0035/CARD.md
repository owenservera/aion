# VO-GH-0035 — Shared computation resolution and escalation

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/vivim-director/src/resolve.ts#L1-L217
- **Revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`; full original Git blob `12650a942502c2a4dbcbb9245d94475dbd84da35`
- **Source line coverage:** 1-217; entire file copied verbatim
- **Copied relative path:** `items/VO-GH-0035/source/resolve.ts`
- **Exact copied bytes SHA-256:** `6ed9ccef7509c6bb0c48fea6a9a7cac70c802a13b8983a7ecdc446b68cd25576`
- **Harvest:** COPIED_MODULE; SOURCE_OBSERVED only; no tests executed
- **Terms:** parseClassifyInput; classify; ClassifyVerdict

## Source value
Rules first, promoted realization second, HUMAN fallback for unknown command.

## Candidate transfer, not approved design
Separate routing decision, availability, execution and result.

## Explicit hazard
Classification can propose an action but must never authorize a browser effect.

## Acceptance falsifier
Unresolvable or ambiguous command routes nowhere.

GitHub source is a pinned snapshot, **not** the unverified local Core/BCP-dev/FullTest tree. This capture does not alter any donor code or validate a live browser provider.
