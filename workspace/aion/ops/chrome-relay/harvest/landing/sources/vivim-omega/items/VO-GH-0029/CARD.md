# VO-GH-0029 — Versioned promotion policy and parser registry

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/discovery-verification/src/policy.ts#L1-L121
- **Revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`; full original Git blob `42713b26e48818685a23897073835b3fdd3e4e4a`
- **Source line coverage:** 1-121; entire file copied verbatim
- **Copied relative path:** `items/VO-GH-0029/source/policy.ts`
- **Exact copied bytes SHA-256:** `52312014edb63de89cdc53b29c3a0a1de58dbb6a7afa928a103d0fcab895b3a8`
- **Harvest:** COPIED_MODULE; SOURCE_OBSERVED only; no tests executed
- **Terms:** loadPromotionPolicy; loadGovernedParserRegistry

## Source value
Promotion thresholds and allowed parser pins are versioned manifest contributions.

## Candidate transfer, not approved design
Use versioned policy inputs and explicit missing-policy refusal.

## Explicit hazard
Policy can age; historical parser proofs do not guarantee today's page state.

## Acceptance falsifier
No policy or unmapped parser produces blocked readiness.

GitHub source is a pinned snapshot, **not** the unverified local Core/BCP-dev/FullTest tree. This capture does not alter any donor code or validate a live browser provider.
