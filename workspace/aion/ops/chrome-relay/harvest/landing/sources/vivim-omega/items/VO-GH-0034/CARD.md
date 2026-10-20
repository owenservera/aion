# VO-GH-0034 — Pinned deterministic fixture parser

- **Source:** https://github.com/owenservera/vivim-omega/blob/79ee558d6c7ea77c20f220db2341adaa57b11d44/plugins/provider-browser/src/parsers.ts#L1-L148
- **Revision:** `79ee558d6c7ea77c20f220db2341adaa57b11d44`; full original Git blob `9479b2ec31932103f7d24323e2dc782f8035b618`
- **Source line coverage:** 1-148; entire file copied verbatim
- **Copied relative path:** `items/VO-GH-0034/source/parsers.ts`
- **Exact copied bytes SHA-256:** `fd177fd2222b12ba0b58ed94cd3b7e60eb47c42e5ecd18e4e0edcdb17e2f505c`
- **Harvest:** COPIED_MODULE; SOURCE_OBSERVED only; no tests executed
- **Terms:** PARSER_VERSION; parseCapture; resolveParser

## Source value
Parses fixture capture and transforms into ordered replay events with version constraints.

## Candidate transfer, not approved design
Use parser version and bounded deterministic transforms as evidence concepts.

## Explicit hazard
Only fixture text; not a production ChatGPT DOM/CDP parser.

## Acceptance falsifier
Parser pin drift yields refusal.

GitHub source is a pinned snapshot, **not** the unverified local Core/BCP-dev/FullTest tree. This capture does not alter any donor code or validate a live browser provider.
