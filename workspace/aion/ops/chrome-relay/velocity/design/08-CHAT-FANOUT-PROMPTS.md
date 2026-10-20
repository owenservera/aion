# AION Track B — parallel chat launch prompts (2026-10-20)

These are **three parallel lanes inside the existing Track B project**, not new versions of AION. Each starts from the same **integrated source baseline**: owenservera/aion branch track-b/platform-local-candidate-20261020. Each operates in its own branch/worktree and opens a PR back **to that candidate branch**, not directly to main. The owner's Windows master stays authoritative; no GitHub issue/comment automatically wakes an agent. Never claim live tests without exact receipts.

## CHAT A — Current Chrome CENV repair | GitHub #43

~~~text
YOU ARE TRACK B / CHROME CENV IMPLEMENTATION. This is the CURRENT Chrome Extension Track B workstream, not a greenfield architecture. Base your isolated worktree on owenservera/aion branch track-b/platform-local-candidate-20261020 and record exact HEAD/dirty status. Read root AGENTS.md, velocity/AGENTS.md, chrome-relay/ARCHITECTURE.md current CENV-01..14, ENVELOPE-CONTRACT.md, FALLBACK-AND-ACCEPTANCE.md, OPENCODE-BUILD-ORDER.md Tasks 1–5, the existing browser/page/worker code and relevant tests. GitHub issue #43.

Mission: finish diagnostics and evidence-based repair of the CURRENT ChatGPT one-command Send/reply path while preserving all existing grants, durable Bus/journal identity, no-resend and exactly-one-target safeguards. Start with original pre-activation failure reasons and deterministic failing tests. Then implement bounded readiness, independent Send/Stop read-only availability, one guarded activation, correctly separated response deadlines and lossless stage/reason propagation. Keep one implementation hot-path task active at a time. Test negative cases (ambiguous controls, draft, stale target, page rerender, uncertain transport, no-op activation, Stop flicker) before proposing real browser tests.

Exclusive write ownership: chrome-relay/extension/src/chatgpt/content.js, extension/src/background/chatgpt-port.js, extension/src/lib/chatgpt-tasks.js, extension/src/chatgpt/correlate.js, extension/src/bus/adapters/chatgpt.js and their focused tests/fixtures when necessary. Coordinate with any active maintainer before editing collisions. DO NOT EDIT velocity/src/platform, the platform CLI, the three Harvest source directories, Bus identity/grant schema, or Track A.

No Playwright, Puppeteer, Orca, CDP, UIA alternate send or automatic retry; no owner browser setup, live Send/Stop, reload or dispose without separate local operation admission. The old unresolved operation is not a test target. Do not weaken security just to make one Send pass. Commit code plus focused test output and UTC. PR target: track-b/platform-local-candidate-20261020. Deliver exact source SHA, test counts, changes, original reason, remaining Chrome/Windows gates, and handoff for integration. No more strategy documents unless essential.
~~~

## CHAT B — Provider families, bespoke applications and semantic capability conformance | GitHub #44

~~~text
YOU ARE TRACK B / PROVIDER SEMANTICS EXPERIMENT. This is a parallel development experiment inside current AION Platform / Chrome Extension Track B. Base your own branch/worktree on owenservera/aion track-b/platform-local-candidate-20261020; record exact HEAD. Read velocity/design/platform-semantic-seed.json, 05-AION-PLATFORM-SEMANTIC-GOVERNANCE.md, 06-AION-PLATFORM-IMPLEMENTATION-PACKETS.md AP-001/AP-003, the existing aion.bus/1 adapter manifests, and Harvest C-004 provider-matrix, taxonomy, capability-map, 65-row ledger and pinned donor records. GitHub issue #44.

Mission: implement one small OFFLINE conformance fixture set demonstrating orthogonal provider application family (AI chat webapp, bespoke coding IDE/webapp, native agent runtime) versus realization mode (browser mediated, API native, simulator, unknown), with shared semantic capabilities and explicit bespoke extensions. Separate catalog existence, provider support, observed readiness, grant authority and operation evidence. Work from actual donor source IDs; do not treat manifests as live feature claims.

Exclusive write ownership: NEW files only beneath velocity/src/platform/provider-cases/, velocity/test/platform-provider-cases*.test.mjs and velocity/design/provider-family-cases.md. DO NOT MODIFY existing platform semantics/inspect/harvest source, Bus/CLI, Chrome CENV hot path, source Harvest files or Track A. If production interface change seems necessary, document a small proposed diff and wait for AION Platform integration owner to accept it. No new runtime plugin registry, broad browser framework, fall-open rule evaluator, selector guessing, Playwright/Puppeteer/Orca/CDP. Code/tests and one PR targeting track-b/platform-local-candidate-20261020; report exact pass/fail/skip and which provider-specific semantics remain unverified.
~~~

## CHAT C — Independent compatibility, safety and Windows QA preparation | GitHub #45

~~~text
YOU ARE TRACK B / INDEPENDENT QA AND MIGRATION-COMPATIBILITY REVIEW. Work in a separate branch/worktree based on owenservera/aion track-b/platform-local-candidate-20261020. Record head, environment and dirty state. Read root/velocity AGENTS.md, velocity/design/07-PLATFORM-LOCAL-DEV-HANDOFF.md, current Bus/grants/registry adapters/result and CENV acceptance, new velocity/src/platform code, Harvest C-004 ledger/source corpus. GitHub issue #45.

Mission: build independent offline regression/compatibility tests and Windows handoff acceptance, validating that additive semantic metadata leaves existing command IDs, grants, operation tombstones, authority, CLI send, broker dispatch, browser journal and native OpenCode behavior intact. Explicit negatives: unknown/malformed risk cannot become READ; rule evaluation cannot fail open; ambiguous control can't be picked by score; possible Send cannot retry on reconnect; historical provider promotion cannot grant fresh readiness. Verify current complete 65-row ledger and SHA256 of 53 copies in a local checkout if accessible, otherwise mark UNRUN. No dependency on GitHub Actions or live provider accounts.

Exclusive writes: NEW velocity/test/platform-compatibility*.test.mjs, velocity/design/platform-compatibility-matrix.md and a sanitized source/test receipt. DO NOT EDIT runtime code, platform semantic module, CLI, Chrome CENV source, Bus schema or Harvest. If a production fault is found, publish a minimized failing test and issue first. No Playwright, Puppeteer, Orca, privileged actions or speculative Windows-installed claims. Commit and open PR targeting track-b/platform-local-candidate-20261020 with exact test commands, UTC, pass/fail counts and unresolved gates.
~~~

## Integration rules

- Three agents may work simultaneously **only in their assigned paths**, with independent branches and PRs. A fourth role—the existing Track B/platform integration owner—reconciles their diffs, accepts/rejects changes and runs a full current-head selftest before merge.
- The owner's Windows agent is the **actual machine-test runner**, not automatically another implementation writer. Run the handoff gates in 07-PLATFORM-LOCAL-DEV-HANDOFF.md; never claim machine/browser tests executed remotely.
- Keep Chrome CENV as the execution critical path; B/C produce supporting evidence and capability evolution without blocking it.
- Once first real Chrome Send-to-checked-reply acceptance exists, expand provider-specific runtime realization only with independently verified second-provider evidence.
