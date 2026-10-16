# AION Role Launcher — one-keyword role bootstrap
**Status:** CANONICAL REGISTRY + BUILD CONTRACT PUBLISHED. Browser extension and native ChatGPT UI control NOT implemented or tested.
**Scope:** Add a launcher panel/omnibox handler to **existing** Chrome ACP Relay issue #18. Do not create another extension or messaging service.

## Intended UX
Type `aion 08` in Chrome address bar after installing extension's `aion` omnibox keyword, or enter `AION:08` in the relay side panel. Choose a suggestion/press Enter. Extension resolves role from local `ROLES.json` versioned bundle, opens **one fresh ChatGPT conversation**, and prepares a short bootstrap message with exact repo paths. Once the user explicitly confirms sending, the new role chat reads canonical GitHub BOOTSTRAP/SITREP/skills with its own authorized connector. Its intended native conversation title is `AION — 08 Z-FORGE`. After a real conversation URL is observed, optionally set title through **user-visible ChatGPT rename UI** when a version-tested adapter exists; otherwise show title and one-click copy for manual rename.

**Without extension:** open a new conversation *inside AION's intended ChatGPT Project*, paste the message from BOOTSTRAP-TEMPLATE.md with role substitution; or paste `AION:08` if the PROJECT-ROUTER-INSTRUCTIONS.md have been manually installed in project instructions and the chat has GitHub access. ChatGPT does not natively create another conversation simply because one existing conversation receives the keyword.

## Truth/ownership rules
- Keyword selecting a role != new tab opened != native chat created != context loaded != title renamed != role acknowledged. Track each independently.
- A fresh browser tab at chatgpt.com is not a created, persistent chat until first message is submitted and a real chat identifier/URL is observed.
- Never claim the agent read the repo until it actually reports specific fetched files / evidence.
- No supported native ChatGPT rename API is assumed. A browser tab's displayed `document.title` is not a native conversation rename.
- No automatic cross-chat sync or waking existing independent role chats by writing a GitHub file.
- No Playwright/Puppeteer; owner requires neither for any work.
- Local Windows machine master; browser extension is user-triggered and locally installed; authenticated GitHub read via existing approved connector, not extension-held PATs.
- Chrome extension must never capture entire chat transcripts or browser login secrets.
- Existing AION branch `main`, no new repo or platform.

## Core artifacts
- `ROLES.json`: authoritative eight-role ID/alias/title/bootstrap/SITREP registry.
- `LAUNCH-PROTOCOL.md`: state machine and browser boundary.
- `BOOTSTRAP-TEMPLATE.md`: generated first message to place in the new chat.
- `PROJECT-ROUTER-INSTRUCTIONS.md`: copy into existing ChatGPT AION Project instructions for zero-code manual trigger fallback.
- `TEST-MATRIX.md`: explicit end-to-end acceptance, negative cases, title fallback, Project placement and permission checks.
- `OPENCODE-WORK-ORDER.md`: actionable implementation contract for authorized OpenCode/ZCode coding executor.
- Existing role folders stay canonical: `workspace/aion/sessions/roles/NN-*/BOOTSTRAP.md`, SITREP and skills.

## Canonical commands
Address bar: type `aion`, press Space, then `08` or `zforge`. Chrome omnibox keyword must first be configured by the installed extension.
Side panel: `AION:08`, `AION:Z-FORGE`, `AION:07`, `AION:TOOLSMITH`; parser normalizes case/whitespace. No fuzzy activation from sentences or quoted text.
Title: the exact `display_title` from ROLES.json.

## Implementation layers
1. **M0 reliable now / manual:** new Project chat + keyword router instructions + GitHub workspace read + manual title rename. No new code.
2. **M1 Chrome launcher MVP:** omnibox/side panel lookup + create tab + copy prepared prompt + explicit user confirmation + record real chat URL/role ACK. Rename title is manual in this stage.
3. **M2 UI adapter:** after controlled live DOM validation and owner enablement, safely enter/send bootstrap and rename the **correct identified conversation** through the actual ChatGPT UI, verifying displayed native conversation title. If UI drifts, stop and display manual fallback.
4. **M3 ACP relay:** optionally connect role instance ledger and role context capsules through approved native messaging/UAH integration. This is separate from M1 and requires host authorization.

## References
Chrome omnibox: https://developer.chrome.com/docs/extensions/develop/ui/omnibox-triggers
Chrome tabs: https://developer.chrome.com/docs/extensions/reference/api/tabs
Chrome scripting: https://developer.chrome.com/docs/extensions/reference/api/scripting
OpenAI ChatGPT Projects: https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt
Existing extension spec: https://github.com/owenservera/aion/issues/18
