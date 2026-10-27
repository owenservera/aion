# 2026-10-27 — ChatGPT real-user CLI probes: course correction

## Governing user decision
The 100 scenarios are **not an automated test suite**. They are 100 different end-user objectives for ChatGPT.com that each demand a distinct browser/CLI capability. Testers are independent agents each given one objective at a time, using only VIVIM's native CLI help and two helper files. Don't reuse the same basic message-submission operation 100 times; no independent runner, browser driver, Playwright/Puppeteer or scripted campaign.

## Canonical shipped files in vivim-harness main
- `docs/agents/CHATGPT-100-OBJECTIVES.md`: exactly 100 objectives in 10 different functional groups; not executable.
- `docs/agents/CHATGPT-PROBE-ENVIRONMENT.md`: mandatory per-launch environment map, observed Windows checkout and data root, server HTTP and CDP ports, derived dedicated Chrome profile, CLI discovery; last-known vs verified is explicit.
- `.opencode/agents/chatgpt-probe.md`: tester role confined to these two files and native `node bin/studio.mjs`, reporting wall time, command count, real result, genuine CLI gaps.
- `AGENTS.md` and `.opencode/agents/local-opencode.md`: explicit route for scenario intent and removal of earlier compulsory batch-runner instructions.
- `bin/commands/recipes.mjs`, `src/studio/tool-client.mjs`: existing `studio agent status --studio-port PORT --json` now uses read-only `/api/status` from the *running server* and reports its dataDir, derived Chrome profile and CDP port, while not claiming Chrome/account verification.
- `test/unit/agent-environment-status.test.mjs`: source-authored regression for native status, fail-closed GET route and no browser effect.
- `test/unit/browser-owner-isolation.test.mjs`: preserved two important Chrome profile isolation tests from the retired test file.
- Deleted `bin/commands/live-100.mjs`, `src/capture/live-scenarios.mjs`, `test/unit/live-100.test.mjs`; unregistered the CLI entry and removed `live:100` npm alias. Earlier runner had 20 prompts × 5 providers, contrary to the requested single-provider webapp-interaction exploration.

## Environment truth
2026-10-27 exported local transcript reported source checkout `C:\0-BlackBoxProject-0\vivim-harness`, data root `C:\VIVIM`, Studio HTTP `38703`, CDP `38702`; Chrome profile is `C:\VIVIM\chrome-profile` under the source-declared `dataPaths` convention. These **must be re-verified on each session**, not asserted as active now. The native CLI status improves path discovery but does not attest the Chrome profile binding itself.

## Debug-helper responsibility
Read each completed probe's brief and transcript, classify failure as CLI discoverability, missing effect capability, site feature unavailable, wrong data root/server/profile, identity/binding, permission, concurrency, timeout or true source defect. Open code only in the debugger/developer lane, not inside the tester. Recommend the smallest CLI/product correction. Never create another test harness or script to hide a usability gap.

## Evidence and current limits
Changes were committed through remote GitHub API and checked by source readback. Verified 100 numerically ordered objective IDs / 10 groups, JSON package validity, legacy file absences and browser-security-test retention via GitHub readback. Offline clone was unavailable because the execution container could not resolve github.com; therefore **full Node suite, Windows test, live ChatGPT run and Chrome effect-owner concurrency are NOT VERIFIED**. Preserve current local profile and working tree.
