# AION Keywords — Quickstart

## Easy scheme
**Native Chrome omnibox (after launcher installation):**
- `aion 01` or `aion dashboard` → AION — 01 DASHBOARD
- `aion 02` or `aion planning` → AION — 02 PLANNING
- `aion 03` or `aion cos` → AION — 03 CHIEF OF STAFF
- `aion 04` or `aion efficiency` → AION — 04 EFFICIENCY
- `aion 05` or `aion coc` → AION — 05 CHIEF OF CHIEFS
- `aion 06` or `aion toolsmith` → AION — 06 TOOLSMITH
- `aion 07` or `aion intake` → AION — 07 INTAKE
- `aion 08` or `aion zforge` → AION — 08 Z-FORGE

**Side panel:** `AION:01`... `AION:08`, or exact aliases.

**Today, without the extension:** manually open a **new chat inside the designated AION ChatGPT Project**, manually add PROJECT-ROUTER-INSTRUCTIONS.md into the Project's instructions (one-time), then send e.g. `AION:08` as *the first and only text* of that chat. It should load role files from connected GitHub if available; if not, use BOOTSTRAP-TEMPLATE.md. Rename the visible conversation from its ChatGPT UI if needed. These project instructions are NOT installed by virtue of their GitHub publication.

## Key distinctions
- Typing `AION:08` in an already existing chat does not automatically spawn a new conversation.
- Chrome omnibox can create a browser tab, but user bootstrap send is required to create a persistent native ChatGPT conversation.
- ChatGPT title rename is independent; only observed native UI rename counts. Asking an assistant to call itself a certain title does not prove the chat was renamed.
- GitHub private source reading requires a connected authorized connector within the new ChatGPT chat. The extension itself should not hold a GitHub personal-access token.
- Role 05 is supervisory; opening an additional new chat with its role title does not override the current Chief of Chiefs.

## In-chat keyword option (after separate extension test)
If you want `AION:08` typed **in an already-open ChatGPT composer** to open a new role chat, an optional narrowly scoped extension helper can detect only that exact draft and offer a visible **Launch new role** action. The new tab must actually be opened by the extension; sending the keyword as an ordinary chat message does not create a new session. This future adapter is not deployed or verified today.
