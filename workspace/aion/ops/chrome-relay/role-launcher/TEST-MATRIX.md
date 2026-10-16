# AION Role Launcher — Test / Acceptance Matrix
**Status:** design/test cases only, not real browser results. No Playwright or Puppeteer. Implementation and testing through approved OpenCode/ZCode route.

## Unit tests (no browser)
R01 Resolve all canonical `01..08` exactly to correct role and display_title.
R02 Resolve unique aliases case/whitespace insensitive; compare `AION:Z-FORGE` and `aion zforge` using correct surface grammar.
R03 Reject unknown `AION:09`, bare AION, duplicate/ambiguous aliases, prefixed/suffixed sentences, quote blocks, path traversal, URL injection and empty command. No tab opens.
R04 Registry uniqueness and file path sanitization, title not user-controlled.
R05 Generated bootstrap includes exact repo, branch, BOOTSTRAP, SITREP and optional paths, title, explicit permission/fallback. No transcripts or tokens.
R06 Chrome worker restarts while launch pending: dedupe, no extra tabs, user can resume/cancel.
R07 Unknown/expired registry: load last locally pinned safe registry or show BLOCKED; never execute arbitrary fetched script.
R08 No ChatGPT/Project/GitHub access: expose manual route without declaring context loaded or title renamed.

## Browser acceptance tests (native/manual Chrome devtools and documented extension APIs)
B01 Enable Chrome MV3 extension at explicitly user-authorized scope, select `aion 08` from omnibox, verify exactly one new tab and launcher state TAB_OPENED. The omnibox only acts on explicit acceptance.
B02 Select `AION:07` in side panel; correct registry title and files; no content access outside intended ChatGPT origin.
B03 Without any GitHub connector access in fresh chat, role responds context blocker rather than invented BOOTSTRAP ACK; manual paste route works.
B04 New chat inside designated AION Project inherits verified Project instructions; generic `https://chatgpt.com/` new chat is not falsely marked in that Project.
B05 First bootstrap message manually sent: recognize real native conversation URL, log timestamp and actual new-chat acknowledgment. Before send, TAB_OPENED is NOT CHAT_CREATED.
B06 Bootstrap reads role's actual paths through GitHub connector, reports contents from independently fetched files. Merely pasting a path is not LOADED.
B07 Optional auto-submit after explicit user enablement: correct composer known, send exact generated bootstrap once. Ambiguous composer => STOP/COMPOSER_AMBIGUOUS, no wrong-chat message and no automatic retry.
B08 Title flow: after actual conversation URL, use visible UI rename control only on that identified chat; verify exact native conversation title. If unavailable, show user copyable title and TITLE_MANUAL_REQUIRED; NEVER claim rename occurred.
B09 Account logged out, UI version change, stale tab or tab closed: show LOGIN_REQUIRED/TITLE_UI_UNAVAILABLE; no privilege escalation, no session/cookie harvesting.
B10 Two rapid repeated identical role shortcuts: resumption vs new separate session is shown clearly; no duplicate bootstrap submit without explicit user request.
B11 Different roles (07 vs 08) launched in succession: no cross-context leakage, correct title/role files.
B12 Manual first-message router `AION:06` in an actual fresh Project chat initializes THIS CHAT only; identical string in a quote or later message does not change active role.
B13 Role 05 launch explicitly confirms duplicate-executive context; does not claim authority of previous live conversation.
B14 No broad host permissions; no ability to read other sites or full chat history; consent is clear at every step.
B15 Result remains consistent after Chrome reload and local source cache reconciliation (no API tokens in extension).
B16 Independent checker confirms native title and actual chat URL, rather than fake browser tab title/DOM text only.

## Milestones and proof
**L0 (zero-code)**: Project instructions manually installed/tested, new chat `AION:08` reads correct GitHub role files, native chat renamed manually. User reports exact observed title/URL. Do not claim we have run this yet.
**L1 (launcher MVP)**: Chrome accepts keyword and opens new tab; generator provides verified prompt and records user action; no automatic send/rename. No title automation required for L1 PASS.
**L2 (careful UI control)**: optional explicit opt-in bootstrap submit + verified native conversation title via actual UI, with human fallback; no undocumented endpoints.
**L3 (ACP integration)**: role instance links/status/events through native messaging/UAH only after separate approved read-only integration and real acknowledgment. Not part of role launcher MVP.

## Evidence in GitHub
Each passed gate: test name, date/time UTC, Chrome version, extension SHA, operating system, human/agent executor, source commit, actual chat/Project verification, screenshot/log where permitted, failure cases. Independent verifier must inspect real ChatGPT conversation and its native UI title, not assume from application state.

## Optional in-chat trigger tests (only if user opts in)
C01 Composer contains exactly `AION:08`: visible new-chat action offered, **no automatic submission** in old conversation, and launch opens a distinct new tab.
C02 Ordinary sentence, code snippet, quotation, unrelated page or already-sent chat text containing `AION:08` causes no launch.
C03 Unsupported/multiple composer elements: disable content adapter and show manual/panel fallback; never send to wrong field.
C04 Browser permissions denied / site change: no content read or launch without explicit user action.
C05 Confirm old chat draft is not lost without approval; new role chat is unique and title/URL verified separately.
