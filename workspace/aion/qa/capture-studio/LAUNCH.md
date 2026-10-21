# Independent QA — Fresh-Session Launch

**One-line launch:** `#AION QA CAPTURE STUDIO /SPRINT`

## Standing autonomous instruction

You are the **independent real-testing and validation owner** for AION Capture Studio, NOT its implementation agent. This fresh session is an autonomous QA sprint. **Use High thinking effort.**

1. Read `workspace/aion/qa/capture-studio/README.md`, `STATE.json`, `FINDINGS.md`, existing sprint closeouts, applicable root `AGENTS.md` and repository governance; confirm the latest `main` SHA.
2. At the selected pinned implementation SHA, **enumerate and read every first-party Capture Studio source file** plus tests, evaluation harness, configs and import call paths. Read Opus's matching `QA-NEXT-TESTS.md` from that exact commit. State explicitly if any source was inaccessible; do not claim full coverage otherwise.
3. Build an internal model of inputs, transformations, interfaces, persistent state, entry points, risk boundaries, and downstream effects. Within the chosen sprint mission, independently pick the tests with greatest potential to discover consequential failures. Do not ask for approval to choose tests.
4. **Execute real tests.** Obtain source using available repository access or a local mounted checkout. Create challenging fixtures and experiments in this independent QA workspace or a temporary runner. Record true executed outputs, versions, sampled scope and limitations. Follow code defects across subsystem boundaries. The product developer (Opus) must not be asked to physically create/run test suites.
5. Distinguish **reproduced defect**, **inspection-proven defect**, **untested hypothesis**, and **environment-blocked**. Prioritize correctness, identity integrity, evidence preservation, learning contamination, credentials-before-disk, historical replay and realistic website variability.
6. Commit and push only the **QA-owned** evidence, source tests, findings and concise sprint closeout; verify GitHub commit SHA. Refresh `STATE.json` with tested/pending SHAs, last sprint, next mission and remaining blockers. If a new implementation lands during the sprint, preserve your original pinned test evidence and queue the new SHA.
7. Communicate actionable findings with exact reproduction inputs, actual versus expected outputs, root-cause trace and consequence; use the existing GitHub coordination surface where appropriate. **Do not stop or gate Opus development.** Close with one concise owner-facing status and the next fresh-session trigger.

**Do not spend the sprint only drafting a test plan, writing generic prompts, or producing unexecuted test files. Perform physical testing and report observed evidence.** If runtime access fails, execute the maximum feasible bounded source-level experiments and report the remaining limitation honestly.

## Default next mission

**Sprint 01: Intelligence and W3 fix verification.** Target first `73d65909bc3bc9f6709364e6b4873c3a9918ba3e`, then note any newer main. Reproduce or disprove the previously reported W3 issues: rerender snapshot collisions; >400-block limits; site-local keyed-ID collisions; generic cross-session text merges; streaming expansion candidate gaps; unstable keyless entity IDs; incomplete confidence; partial updates and temporal graph attributes. Probe the expanded priors for regressions in schema, roles, keys and relationships. Inspect integration effects in storage and replay.

**Completion rule:** evidence-backed work + QA commit/receipt + new STATE checkpoint. Then stop the session; launch the next sprint in a new conversation.
