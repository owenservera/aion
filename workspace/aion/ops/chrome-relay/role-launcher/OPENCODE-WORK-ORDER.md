# OpenCode/ZCode Work Order — AION Role Launcher RL-001
**Status:** READY FOR AUTHORIZED CODING DISPATCH / no executor acknowledged; no extension code or installation claimed.
**Repo:** `owenservera/aion` branch `main`.
**Target:** Extend existing Chrome ACP Relay issue #18 within `workspace/aion/ops/chrome-relay/extension/`, not a separate extension, repo or communications bus.
**Coordinator:** Role 03 Chief of Staff. **Technical reviewer:** Role 06 TOOLSMITH. **Chief acceptance:** Role 05.
**Product:** One-keyword launch of named ChatGPT role workspace in a *new native conversation*, not a new account login or separate model API session.
**Specifications:** role-launcher ROLES.json, README, LAUNCH-PROTOCOL, BOOTSTRAP-TEMPLATE, PROJECT-ROUTER-INSTRUCTIONS, TEST-MATRIX. Existing Chrome Relay architecture remains in force.

## Stage 1 — Ship a truthful, useful launcher
1. Inspect current repo extension code (if any) and installed Chrome version before modifying, avoid duplicating CR-001. A design spec is not existing executable code.
2. Validate `ROLES.json`: every role ID and unique alias, path allowlist, title nonempty, no regex injection or duplicate triggers. Add unit tests using native Node `node --test`, not Playwright/Puppeteer.
3. Add MV3 omnibox keyword `aion` with suggestions for all 8 roles and user-confirmed `omnibox.onInputEntered`; implement side-panel/launcher command palette if existing relay UI supports it. Use Chrome `tabs.create` only upon actual user command.
4. Create **one new tab** to an observed and supported ChatGPT new-chat route. Project-specific new-chat flow is not assumed; capture actual owner Project UI route, otherwise show `PROJECT_CONTEXT_UNVERIFIED`.
5. Generate canonical initial prompt from ROLES.json and template. In MVP, display it and provide Copy/Insert action; user explicitly sends the message. No automatic ChatGPT UI submit, title edit, tab scraping or credentials in stage 1.
6. Show native title string `display_title` and one-click copy; offer manual rename instructions for the new conversation's visible title menu.
7. Non-secret local launch state: role_code, launch ID, creation time, stage, opened tab ID, eventual native chat URL only with permission. Recovery after service worker restart with no duplicate tabs.
8. Test 8 roles, invalid triggers, quoted commands, ambiguous or unavailable Project, denied GitHub connector and fallback behavior. Produce real Chrome unpacked-extension run receipt plus deterministic tests, commit SHA and reproducible steps.

## Stage 2 — OPTIONAL UI title adapter (separate owner gate)
After L1 tests are independently verified and owner opts in, implement **only** a versioned visible-UI adapter for correct target conversation. May pre-fill the generated bootstrap or optionally submit it if user explicitly enables. Wait until a real /c/... (or equivalent verified current) chat URL and role ACK before rename. Locate native rename menu conservatively and ensure only the tracked chat gets renamed; verify exact UI title and stop/fallback if controls changed. Do not invoke private service endpoints, scrape transcripts or export credentials. User may manually rename if UI control isn't stable.
This is an optional extension capability; it must NOT block reliable Stage 1 shipping.

## Stage 3 — OPTIONAL local/ACP relay (separate permission gate)
Connect launch instance registry and fresh-read GitHub source context through existing native host/UAH only after host install/bridge authorization. No GitHub issue comment automatically causes browser or host action.

## Completion receipts
- L1: exactly one new tab per invocation, registry selection and prompt generation correct, manual send works, workspace can be loaded in a fresh chat with authorized connector, fallback displayed truthfully, no unauthorized scripts.
- L2: real consented ChatGPT UI title renamed and independently observed, or TITLE_MANUAL_REQUIRED with honest fallback; never infer from a generated label.
- L3: only after separate authorized host and ACP tests.
Return actual implementation files, exact Chrome runtime/version, Node test stdout, negative tests, screenshot if used, model/session/commit, and independent reviewer verdict.

## Strict constraints
No Playwright or Puppeteer in any implementation/test; no auth bypass, cookie reading, broad browser permissions, hidden API use, mass transcript scrape or unfounded claims of always-running chats. No Grok-authored code. Repo/main local-master authority remains.
