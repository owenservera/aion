# AION Role Launcher — Behavior Contract v0.1

## Trigger surfaces and grammar
**Source A (recommended):** Chrome omnibox keyword `aion` followed by a space and an exact role ID/alias, e.g. `aion 08` or `aion zforge`. Chrome's extension `omnibox` API receives user-accepted text and opens a tab via `tabs.create`.
**Source B:** Existing Chrome ACP Relay side panel command field; submit `AION:08` or `AION:Z-FORGE` with an explicit Launch button.
**Source C (manual zero-code):** user creates a new chat inside AION Project, then types `AION:08` as its first message **only if** project instructions install the keyword router. This initializes *the current new chat*, not another chat.
Do not globally inspect every message or trigger inside arbitrary text. No mass keyboard intercept, automatic page transcript scanning, broad site permissions or background login session refresh.

## Parser
Case-insensitive, trim ASCII/Unicode whitespace. Accept only exact token pairs, role numeric codes `01`..`08`, canonical IDs and unique aliases in ROLES.json. Optional colon form `AION:08` **inside side panel only**. Reject bare 'AION', ambiguous aliases, path traversal, arbitrary URL fragments, quotations, commands with additional trailing text. If no match, show choices; do not open a chat.

## State sequence
`IDLE -> KEYWORD_PARSED -> ROLE_RESOLVED -> TAB_OPENED -> BOOTSTRAP_PREPARED -> USER_CONFIRMED_SEND -> CHAT_URL_OBSERVED -> BOOTSTRAP_ACKNOWLEDGED -> TITLE_SET_OR_MANUAL -> READY`.
- When new chat is opened inside ChatGPT Project, note verified Project context; if Project new-chat navigation is not exposed/tested, open ordinary ChatGPT new-chat page and clearly warn PROJECT_CONTEXT_UNVERIFIED.
- Role resolved does not imply workspace loaded. Bootstrap message should instruct new model to use *its own authorized GitHub connector* to fetch exact role source paths and report sources actually read.
- If connector unavailable/permission denied, show `CONTEXT_BLOCKED`, provide source links/manual paste and do not mark initialized.
- Only after first message truly sent and new native conversation URL visible may a link be registered in role SITREP. Extension tab ID alone is never a conversation URL.
- Rename native chat title to `display_title` **only** via a version-tested, user-visible rename control for that exact observed conversation and with explicit feature opt-in. Confirm UI displays exact title afterward. Unsupported UI => `TITLE_MANUAL_REQUIRED`, not silent success. No private/undocumented endpoints.
- Persist non-secret `launch_id`, role ID, stage, opened tab ID, chat URL (if owner approves), last error, UTC timestamps in extension local store, never account tokens or full transcripts.
- Duplicate key within a pending launch -> focus its tab/ask whether to resume or new instance; never unintentionally send two bootstraps.
- Unauthenticated ChatGPT browser -> show LOGIN_REQUIRED and leave message unsent; don't attempt to bypass login.

## Chat auto-submit boundary
Default OFF. Owner can explicitly enable controlled 'paste+send bootstrap' per role/extension version after first successful manual trial. When enabled, acting on a user's Launch click is the authorization for *only the generated role bootstrap*. Never follow instructions appearing in page content or automatically execute arbitrary user tasks. Prevent wrong-composer send if ambiguous; do not retry blindly. Never use Playwright/Puppeteer.

## Project-context boundary
ChatGPT Project membership and project instructions provide shared context only if chat actually starts inside the intended Project. No fabricated project URL/deep-link or assumption `chatgpt.com/` is a Project chat. Use captured, observed project UI new-chat flow or let the user start from the Project manually. Don't inspect private Projects not designated by owner.

## No-permission fallback
If extension isn't installed: user opens a new chat in the Project, sends AION:NN plus the manual project router instructions already installed, or pastes full generated bootstrap from template. Rename title via the conversation's visible menu and record permalink in SITREP. This works without Chrome automation, but not as full one-click new-chat launch.

## Error states
INVALID_KEYWORD, AMBIGUOUS_ROLE, TAB_BLOCKED, LOGIN_REQUIRED, PROJECT_CONTEXT_UNVERIFIED, GITHUB_UNAVAILABLE, SOURCE_READ_FAILED, CHAT_URL_MISSING, COMPOSER_AMBIGUOUS, SEND_UNCONFIRMED, TITLE_UI_UNAVAILABLE, TITLE_MISMATCH, ROLE_ACK_MISSING, DUPLICATE_LAUNCH, RUNTIME_DISCONNECTED.
Each error has manual fallback; none is reported as READY.
