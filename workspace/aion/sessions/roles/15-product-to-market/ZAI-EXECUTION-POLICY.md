# Z.ai integration execution policy — VIVIM V1
**Owner direction:** 2026-10-25. **Product authority:** AION Role 15 PRODUCT AGENT. **Engineering destination:** owenservera/vivim-harness.

## Correct boundary
Z.ai is a substantial Linux engineering environment with capacity to **spawn subagents, run full interactive Chrome sessions, implement code and tests, and execute autonomous integration rounds**. Z.ai cannot authenticate to the owner's ChatGPT/Claude/etc. accounts; this is the specific boundary, **not** a generic ban on live browser testing.

## Z.ai responsibilities — do as much as possible
1. Study selected existing implementations across public donors and any specifically authorized private repos.
2. Use subagents for **nonoverlapping write surfaces**, integrating UX, data contracts, storage/projections, knowledge, package/deployment and test infrastructure in parallel where safe. One integration lead retains ownership of shared interfaces and merge.
3. Implement reusable V1 capabilities in vivim-harness; inspect existing modules first and avoid unnecessary new engines.
4. Run full static checks, Node tests, synthetic network streaming fixtures, offline reconstruction/provenance tests, and adversarial role/account/thread/restart/uncertain-effect tests.
5. Run actual **interactive Chromium/Chrome on Linux** against local Harness app, disposable test pages, controlled mock providers, and fixture applications, including page layout, accessibility, interaction, responsive behavior and reconnect flows. Use existing CDP/Chrome APIs; **no Playwright/Puppeteer**.
6. Drive simulated/sandbox provider flows via local test websites using the *real Harness browser control path*, with no unauthorized real-world mutations. Validate actual UI events and browser binding, not only unit mocks.
7. Exercise CLI, local HTTP APIs, MCP facades and integration contracts through automated requests and real local processes. Measure resource usage / crashes where feasible.
8. Commit tested changes with Git SHA, changed paths, test commands, observed outcomes, artifacts and concise blockers.
9. Keep all product-only planning/selection/decisions **under this Role 15 self-governed folder**, and source/tests/implementation contracts in vivim-harness.

## What remains for authenticated owner-controlled environment
- Connecting/signing into personal ChatGPT/Claude/etc. accounts and any real authenticated account-level operation requiring credentials or explicit approval.
- Provider-specific exact-thread live acceptance in those accounts, data fidelity against real personal streams, actual send/followup and policy/availability under the owner's subscription.
- Windows-only installer/OS-specific smoke if Linux tests cannot prove it.
These are narrow final environment gates, not reasons to stop upstream implementation or integration.

## Suggested Z.ai round pattern
- **Round 1 (received):** unified V1 shell foundation, current reported source commit 034ced9; independent integration inspection remains necessary.
- **Round 2:** integrate high-value UX + rich native content + local conversation/project/knowledge continuity into one end-to-end app path; subagents allowed with split ownership.
- **Round 3:** portability/export, deterministic intent/Work, capability surfaces (CLI/MCP), packaging and deeper controlled-browser/system validation.
Round boundaries are adjustable by highest acceleration, not artificial quotas.

## Guardrails
- Harness is the sole browser-effects authority; no import of competing ChromeGovernor/fleet.
- No Playwright/Puppeteer; full interactive Chrome testing is still allowed via CDP and existing native Harness mechanisms.
- No unknown-action blind retry, no source/evidence laundering, no exposure of auth secrets or personal captures in public source.
- Linux Chrome interactive test != authenticated owner-account test. Record both separately.
- Do not hold all Z.ai work pending ChatGPT sign-in; perform every feasible mock/local/browser/contract test.
