# Capture Studio — Independent QA Findings Index

**Initial status:** Implementation commit `73d65909bc3bc9f6709364e6b4873c3a9918ba3e` is **PENDING INDEPENDENT QA**. This index is not evidence of verified fixes.

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

## Current implementation's self-reported areas to challenge

Read the exact-commit `QA-NEXT-TESTS.md`. It identifies cross-session keyless continuity, missing site/group scope, changed EID compatibility, older fixtures without explicit snapshots, term-frequency asymmetry, inability to distinguish field removal, confidence semantics, and broad role-prior changes.

## Evidence standard

For every confirmed defect: pinned source SHA, actual runtime, reproduction inputs, expected versus observed output, downstream effect, and retest status. Preserve executed tests and sanitized results under this QA folder; use a dated sprint closeout and update this index. Distinguish runtime proof from source inspection and hypotheses.

**Next:** autonomous Sprint 01 from [LAUNCH.md](LAUNCH.md).
