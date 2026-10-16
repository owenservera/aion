---
name: chrome-extension-fixture
description: Leverage Z.ai web sandbox for Chrome MV3 prototype generation, package checks, UI previews and explicit extension-install feasibility tests.
---
# Chrome Extension Lab
**Trigger:** AION CR-001 Chrome ACP relay code-only fixture or source-generated UI component.

1. Read scoped AION Chrome relay docs if repo access approved, otherwise use a self-contained public fixture. No production authentication or browser state copied into sandbox.
2. Ask Z.ai sandbox to create minimal MV3 manifest, service worker, side panel/popup, fixture store and input validation. Names, scopes and permissions constrained by task.
3. Test extension files and message contracts with built-in Node test runner and static manifest validation.
4. Inspect app UI via native preview, DevTools or sandbox-provided browser tool if actually available. Test unpacked-extension installation only if sandbox genuinely permits it; screenshot exact result. An HTML preview is **not equivalent** to an installed extension.
5. Simulate disconnect, restart, duplicate ACK, unauthorized event, stale status and fake verified proof. Show positive and negative outputs.
6. Export ZIP+SHA or patch and exact tests; no Playwright or Puppeteer, no credential harvesting, no hidden page injection.
7. Role 06 TOOLSMITH independently reviews browser/ACP compatibility; Role 05 accepts only after repeatable tests and real evidence.

**Pass:** source+tests+export; optional actual extension UI runtime proof is a separate gate.
