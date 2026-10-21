# Capture Studio — Independent QA Findings Index

**Current status (2026-10-21 recon):** Sprint 02 longitudinal continuity, temporal graph code changes and UI explorer are **IMPLEMENTED IN SOURCE, PENDING CURRENT-SHA INDEPENDENT QA**. QA recon observed main `4909534` without executing tests. See [ROADMAP.md](ROADMAP.md) and [STATE.json](STATE.json). Historical initial W3 target `73d6590` remains relevant to regression history, not the current implementation checkpoint.

## Earlier code-executed W3 findings (pre-fix source `86ca565`)

- 20 ms versus 100 ms rerender observations resolved inconsistently because of time-bucket snapshot grouping.
- Blocks above 400 observations could produce zero candidate comparisons.
- The same keyed identifier across different websites could merge unrelated entities.
- Identical generic messages from unrelated sessions could merge.
- Streaming text expansion could evade candidate blocking.
- Keyless entity identifiers could change with input order.
- Link-confidence evidence was absent from resolved entities.
- Partial updates could erase earlier attributes.

Additional source-exercised risks: numeric/string identifier collision and nested rare fields missed by shape sampling.

**These findings concern earlier source; they must be rerun against the newer implementation, not presumed unfixed.**

## Previously executed temporal graph QA — pinned historical evidence

At implementation `8218e6c` (Node 22.16.0 Linux, module-level): **6 actual tests, 3 pass, 3 fail**. Failures: undated future rendered edge present in past; undated action edge present in past; later edge rejection rewriting prior historical state. See [reproduction receipt](evidence/2026-10-21-sprint01-graph-node22.md) and [executable cases](tests/sprint01-temporal-graph.test.mjs). **Later graph implementation was changed; these are not confirmed live defects at main and require a fresh pinned rerun.**

## Current implementation's self-reported areas to challenge

Read the exact-commit `QA-NEXT-TESTS.md`. It identifies cross-session keyless continuity, missing site/group scope, changed EID compatibility, older fixtures without explicit snapshots, term-frequency asymmetry, inability to distinguish field removal, confidence semantics, and broad role-prior changes.

## Evidence standard

For every confirmed defect: pinned source SHA, actual runtime, reproduction inputs, expected versus observed output, downstream effect, and retest status. Preserve executed tests and sanitized results under this QA folder; use a dated sprint closeout and update this index. Distinguish runtime proof from source inspection and hypotheses.

## Current QA queue (unexecuted)

1. Re-run six graph tests at the latest pinned implementation; explicitly compare changed semantics with the original assertions.
2. Execute same-site keyed continuity join; different-site and keyless non-join; type drift; tenant collision; earlier as-of and partial attribute retention.
3. Check missing entities dataset, rederive/delete, CLI/API output and UI error/completeness states.
4. Characterize large-history cost and remaining Windows/CDP acceptance gap.

No new test failures or passes are asserted by this roadmap/records-only update. **Next:** targeted cross-session plus graph verification from [LAUNCH.md](LAUNCH.md); retain owner-led grouped defect handoff and non-blocking development.
