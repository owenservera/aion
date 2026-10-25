# VIVIM Discovery Atlas — PRODUCT AGENT

**Canonical machine-readable catalog:** [VIVIM-CAPABILITY-ATLAS.yaml](VIVIM-CAPABILITY-ATLAS.yaml)

**First indexed pass:** 2026-10-25. 116 source-linked signals, nine categories, 103 repositories listed; broader GitHub owner search exposed 196 repositories, of which 112 private. Public AION intentionally does **not** publish all private repository names. This is a research **candidate map**, not proof of 116 working components or a declaration of 37 shipped essentials.

## How to use the tags

- **essential** — candidate core user value or vital invariant. Not necessarily existing in VIVIM.
- **looks_useful** — tempting immediate user benefit, validate by a real task.
- **interesting_how** — implementation pattern worth studying even if we build it differently.
- **interesting_idea** — worthwhile longer-term direction, not a V1 commitment.
- **risky** — credible scope/authority/duplication problem needing caution.
- **unknown** — repository discovered but no justified functionality conclusion.

The parallel facets are `category`, `source_evidence` (source-read / located / README claim / previous survey / repo only), `product_window` (core / candidate / later / guardrail / inspect), `effort` (LOW/MED/HIGH/MAX), `workshop` (currently all undecided), and `implementation` (not evaluated). **Signals are observations/reactions, not action permissions or quality ratings.**

## Discovery → V1 shape → BUILD OR HARVEST workshop

1. **DISCOVER NOW:** collect WHAT / WHY / WHERE, note an exciting pattern without assuming the HOW is good. Preserve original sources and evidence grade. Avoid duplicate items by feature/outcome rather than repo.
2. **SHAPE V1:** product owner decides a short list of first-user journeys, what must persist locally, how personal objects link to external provider evidence, and which surfaces are inside V1. This is separate from Z.ai's ongoing engineering choices.
3. **GAP MAP:** assess where an outcome is already met in current Harness, exists as a donor candidate, or is entirely absent; require a user-visible test and avoid inventing a gap based on folder names alone.
4. **WORKSHOP (NOT STARTED):** only after V1 shape is grounded, decide candidate by candidate:
   - **KEEP** existing Harness behavior;
   - **BUILD** new behavior when implementation is cleaner;
   - **HARVEST** a proven donor implementation or tests when cheaper;
   - **ADAPT** patterns/algorithms/interfaces but independently implement the product HOW;
   - **REFERENCE** concept/UX/doctrine with no source adoption;
   - **DEFER** beyond V1;
   - **REJECT** if it duplicates authority, adds unjustified cost, or fails value tests.
5. **DELIVER:** Product Agent owns discovery and MAX decisions, Z.ai owns engineering HOW and LOW/MED/HIGH packages. Engineering source belongs in `vivim-harness`. Evaluate 'better / faster / less garbage' across dependencies and custom builds. A no-import decision is as valid as a code harvest.

## Source and security discipline

- The atlas lists file paths and GitHub links, but `source_read` means a text source was inspected, **not** that its API/runtime is tested.
- Different source revisions may drift; recheck commit/SHA when making a transplant decision.
- Preserve license and original author/third-party provenance; repos ending in `-VIVIM` may be upstream forks, not novel authored VIVIM implementations.
- No auth cookies, private transcripts, complete local-machine paths or contents of undisclosed private repositories in the public product map.
- Existing Research 09 and AION Harvest records remain source authorities; this YAML is the **product curiosity/need index**, not another implementation inventory or research queue.

**Next map expansion:** concrete first-user journeys and their candidate entries, then deeper file-level inspections of high-interest unreviewed repositories (especially local memory, canvas, prior Scroll, agentic files, export/import) before workshop disposition. Don't interrupt Z.ai's current integration round.
