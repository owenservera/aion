---
name: test-and-proof
description: Require actual test logs, denial cases, artifact hashes and independent AION verification for each expensive Z.ai Agent Mode turn.
---
# Sandbox Test and Independent Proof
**Trigger:** A sandbox turn claims completed engineering work.

1. Extract actual command/log output, code diff, test results, failed-case evidence, selected model, run reference and artifact export.
2. Run at least one expected positive and one denial/negative test; for source changes record SHA-256 and exact file list.
3. Flag unsupported claims: 'compiled' when only generated code, 'preview tested' without screenshot, 'GitHub pushed' without commit/remote readback, 'independent QA' when same agent self-certified.
4. Promote staged lifecycle separately: CREATED -> TESTED_IN_SANDBOX -> EXPORTED -> INDEPENDENTLY_VERIFIED -> APPROVED_FOR_INTEGRATION -> PROMOTED_TO_MASTER.
5. On re-verification failure, file smallest reproducible corrective mission; no endless retries without changed conditions.
6. Route receipt to Chief and/or TOOLSMITH and measured values to Efficiency; don't substitute product marketing for real tests.

**No Playwright/Puppeteer** in testing or alternatives.
