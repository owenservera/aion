# Capture Studio — Global Progress and Codebase Metrics Standard

**Effective:** 2026-10-21. **Owner:** QA / Steering. **Applies to:** all recurring SITREPs, top-level progress reports, layer tables, current-vs-sprint overlays, milestone estimates and end-of-sprint receipts. **Scope:** Capture Studio repository subtree, not all of AION unless explicitly labelled portfolio-wide.

## Required fields
Every global status must show:
1. Overall **source files / physical LOC** and **test files / physical LOC** (separately).
2. All **seven layer rows** with source files, physical LOC, maturity estimate, sprint contribution (percentage points) and projected maturity.
3. **Operational foundation** and **evaluation/tests** as separate rows, not invented L8 and not included in seven-layer-only maturity mean.
4. **Current sprint overlay**: source files + LOC at baseline; net added/deleted/changed file counts and net LOC delta since baseline; projected files/LOC only when scope is explicitly estimated. Never equate LOC increase with product completion.
5. **Total** across mutually exclusive rows. Include commit SHA, measuring time, scope, classification version and whether values are measured, estimated, unavailable or verified acceptance.
6. **Acceptance** separately from source maturity. Percentage projections are planning scenarios, not executed results.

## Canonical counting rule — v1
- Compute from the **git checkout at a pinned commit** via `node workspace/aion/qa/capture-studio/tools/count-metrics.mjs [--ref-label SHA]`. Emit both physical LOC (all lines, including blanks/comments) and nonempty LOC. Do **not** call bytes LOC.
- Count source extensions `.mjs`, `.js`, `.html`; `*.json` family/profile configurations are separately inventoried as config, not LOC; Markdown docs are separately inventoried as docs.
- Source classification is exclusive: each file has **one primary layer** (L1–L7) or **Foundation** / **Evaluation** / **Tests**. Cross-layer dependencies are reported in prose, not counted multiple times.
- Scope includes the product subtree `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/` only; separate QA and Ops documentation counts are recorded as *coordination artifacts*, not product LOC.
- Defaults: `src/capture` + `src/cdp` → L1; `src/store` → L2; schema/discover/corpus and decode/shapes → L3; identity/graph/continuity/correlate → L4; learn/priors → L5; replay plus intel/history → L6; `src/studio/ui` → L7; remaining `src` and `bin` → Foundation; `eval` → Evaluation; `test` → Tests. The physical `src/studio/server.mjs` is Foundation because it crosses multiple layers.
- For changes between baseline and current, run the script at BOTH pinned revisions, compute deltas, and state changes in layer attribution if any. Do not silently treat current LOC as an estimate of delivered sprint work.
- If a true checkout is inaccessible, show verified file inventory only, LOC **not measured**, rather than approximate LOC from byte lengths.

## Required report overlay

| Layer | Files now | LOC now | Current maturity (estimate) | Current sprint gain (estimate) | End-sprint estimate | Sprint file Δ | Sprint LOC Δ |
|---|---:|---:|---:|---:|---:|---:|---:|
| L1 Capture | measured | measured | planning | planning | planning | measured/pending | measured/pending |
| L2 Evidence | measured | measured | planning | planning | planning | measured/pending | measured/pending |
| L3 Interpretation | measured | measured | planning | planning | planning | measured/pending | measured/pending |
| L4 Knowledge | measured | measured | planning | planning | planning | measured/pending | measured/pending |
| L5 Learning | measured | measured | planning | planning | planning | measured/pending | measured/pending |
| L6 Reconstruction | measured | measured | planning | planning | planning | measured/pending | measured/pending |
| L7 Experience | measured | measured | planning | planning | planning | measured/pending | measured/pending |
| Foundation | measured | measured | outside seven-layer mean | — | — | measured/pending | measured/pending |
| Tests | measured | measured | acceptance coverage separate | — | — | measured/pending | measured/pending |
| Evaluation | measured | measured | acceptance coverage separate | — | — | measured/pending | measured/pending |
| **TOTAL product executable footprint** | **sum of all above** | **sum** | **not summed maturity** | — | — | **sum** | **sum** |

**Interpretation:** displayed source-maturity percentages remain noncalibrated forecasts until replaced with criterion-based scoring. The new L4/L5 specialist uses its 14 acceptance criteria separately. Do not present those as equivalent to LOC growth.

## Initial inventory checkpoint
A GitHub recursive-tree inspection at `fd3ac226767046aeed51b2380342f8987340394b` observed **63 tracked files** in the product subtree (including code, configs, evaluation results and documents), **60** with `.mjs/.js/.html/.json` extensions, and **35** tracked files across Capture Studio Ops and QA coordination folders. These are repository inventory counts, **not the above physical source-file/LOC totals**. Exact LOC and exclusive-layer aggregation must be generated by the script against a checkout. The first LOC baseline remains **unmeasured** here because GitHub bulk source retrieval hit a tool limit.
