# Product-to-Market — scoped ownership and recent-work audit

**Snapshot:** 2026-10-25. Window: since 2025-10-25. Query: `user:owenservera pushed:>=2025-10-25 fork:false` (115 matches over two pages). The GitHub connector returned names and basic repo metadata; it did **not** return commit authors, activity dates, or fork ancestry in this response. Thus the date window is GitHub's search filter, not independently verified personal development activity.

## Scope rules
- Include owner-account repositories with GitHub pushed activity in the past year; then verify whether they contain **the owner's original or materially authored development**, not merely upstream changes, mirrored templates or forks.
- Exclude all case-insensitive names ending `-vivim` from core evaluation, irrespective of recency, per owner's explicit classification. Treat these as third-party source references only. Other mirrors, forks or vendor-derived copies must also be excluded from core scoring after ancestry inspection.
- Preserve AION, VIVIM Harness, Capture Studio, Product_Hub, VOMEGA, ZCode Pocket and other owner-origin projects where supported; group versioned/successor repos into **one product family**, not multiple products.
- Keep uncertain originals in **PROVISIONAL** until commit authorship and README/code evidence confirms own work. Do not claim any retained repo is verified owner-authored yet.
- Classification based on name is only a triage domain, not functional capability proof.

## Inventory results
- 115 recent non-fork-search matches; 20 excluded names ending `-vivim`; **95 provisional core repo candidates**.
- Grouping by name heuristic: PRODUCT_PLATFORM 31; AGENT_AUTOMATION 10; REVIEW 27; VERTICAL 6; CAPTURE_KNOWLEDGE 13; OPS_PRODUCTIZATION 8.
- [Full filtered inventory](RECENT-ORIGINAL-CANDIDATES.tsv) includes every candidate and explicit authorship verification flag.
- Excluded suffix examples: single-file-cli-VIVIM, camoufox-vivim, dify-vivim, CodeWebChat-VIVIM, claude-code-transcripts-VIVIM, textarea-VIVIM, open-interpreter-VIVIM, local-ai-recipes-VIVIM, itshover-VIVIM, mempalace-VIVIM, xleak-VIVIM, vibetunnel-VIVIM.

## Next investigation tiers
1. **P0:** AION → Capture Studio → vivim-harness; confirm canonical running app, safe onboarding for friends, actual end-to-end usage proof, and existing adapter/capture intelligence.
2. **P0:** VIVIM ecosystem, OpenScroll/knowledge/canvas; inspect recent branches, duplicate lineage, product packaging, self-contained beta entrypoint.
3. **P1:** Product_Hub, VOMEGA, zcode-pocket, ACP and ZCode, for reusable components and independent user value.
4. **P1:** Any business/vertical products with a credible faster beta than Capture Studio.
5. **P2:** Unclear names, tools, historical variants; only deep dive when evidence indicates value.

## Deeper investigation contract
For each product family: canonical original repo and SHA; author's commits since cutoff; last meaningful commit; real user purpose; shipped entrypoint; live/test proof; dependencies; duplicated capabilities; license and external origin; privacy/reliability issues; MVP slice; evidence confidence; fit for single VIVIM platform; launch recommendation. Promote only with verified evidence, and choose deeper investigations according to potential user value and uncertainty.
