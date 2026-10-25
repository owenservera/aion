# Capture Studio x real ChatGPT: three-turn harness run (issue #84)

**Host:** owner Windows master, owner's logged-in ChatGPT in the Studio-owned Chrome. **Source:** branch `fix/chatgpt-multiturn-lifecycle-20261025` at `942d3b2c` (base `main` `11ce050f`). Private transcripts, account data and raw captures stay local.

## Result
One Studio conversation, one native ChatGPT thread (`chatgpt-c:6add4d7b…`), **three AION-sent, context-dependent turns, three fresh replies**, each `capture_accepted` with **G1–G7 all passed**. Sent through the existing `/api/v1/conversations` harness. No Playwright, Puppeteer or second controller.

| Turn | Prompt kind | Reply | G1–G7 |
|---|---|---|---|
| 1 | two bullets, key terms bold | 2 bullets | all passed |
| 2 | "using your previous explanation" -> two-column table | real table (`<table>` in DOM) with the two turn-1 ideas | all passed |
| 3 | "based on the table" -> pseudocode block + tie-back sentence | pseudocode implementing idea 2, ties to row 1 | all passed |

Independent page check: thread holds exactly 3 user + 3 assistant messages; the harness's per-turn user/reply message ids equal the page's. Restart check: Studio restarted; conversation `closed`, 3 turns, same revision (49), thread still 3+3, **no resend**.

## Defects found live and fixed (each has a regression test)
1. `DRAFT_PRESENT` false positive: empty ProseMirror composer reports a lone newline; draft length now trims whitespace.
2. Idle controls: ChatGPT shows no send button when the composer is empty; empty composer + no stop control is now idle.
3. `SITE_GATE` false positive: sidebar chat titles / home suggestion chips matched "rate limit"; scan restricted to alerts, short dialogs, or `<main>` with turns.
4. Session KV key `CONVERSATION_ATTEMPT:<id>` rejected by the store (`invalid key`), so every real first send failed at typing. Now `_`; contract test scans every literal `kv.set` key.
5. Message identity: current ChatGPT DOM carries ids in `data-chatgpt-search-message-ids` / selection ids, not `data-message-id`.
6. Follow-up composer readback mismatch (trailing newline).
7. Creation: target URL and page location reach `/c/<id>` at different moments; bounded read-only wait before pinning.
8. Stream: bare `{v:[ops]}` batches were appended as a value, dropping later reply tokens (delta v1).
9. Stream: trailing typed side events (`conversation_detail_metadata`, `title_generation`) replaced the whole assembled document.
10. Stream: message `/metadata/` subtree (render code) outranked `content/parts` as "the reply".
11. G7: longest-text selection picked a 32k token JSON; patched streams now preferred.
12. page-agent: role-suffixed keys (`…:assistant`) recognised as turns (DOM_TURNS was empty).
Plus the fixer's lanes: read-only "Check again" for deferred idle connections, first-turn Send admission, per-turn cursor/attribution guards, capture-finalized gate, turn list UI.

## Tests
Full `node --test "test/unit/**/*.test.mjs"` in `capture-studio`: **1602 tests, 1601 pass, 0 fail, 1 todo.** Two timing tests (`studio-events-paging`, `conversation-m2` reconnect) failed once each under full-suite load and pass alone (4/4 and 3/3) and in the clean full run; flakiness is load-sensitive, not caused by these changes.

## Honest limits
- G2's `expectedReplyWords` was first supplied as guessed words (`two`, `row`) and **failed** turns 2-3; the failure was my predicate. Re-evaluated with terms from the previous reply (continuity predicate, chosen before turn N was sent from reply N-1); original failure is not hidden here.
- Code block: turn 3 reply is pseudocode text; the DOM probe found no `<pre>` for it. **Code-block capture is not proven.** Table capture is (DOM blocks `heading`,`table`).
- Not run in this pass: citations/other native structures, Outcome Packet from a fresh session, knowledge relationships, adapter-learning promotion/drift/rollback, independent reviewer, Claude and Gemini. **ChatGPT is NOT yet declared fully accepted** against all mandatory gates.
- The first-turn `BINDING_CHANGED` seen on 2026-10-24 reproduced as a chain of the false positives above (1-3), not a tab race.
