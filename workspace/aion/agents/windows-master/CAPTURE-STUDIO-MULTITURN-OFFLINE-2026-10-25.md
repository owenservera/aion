# Capture Studio first-turn fix + successive turns — OFFLINE receipt

**Branch** `fix/chatgpt-multiturn-lifecycle-20261025` (from `main` 11ce050f). Issue #84. **Evidence class: offline fixtures only.** No Chrome, Studio, provider, account or network was touched; **zero provider sends; no live proof of anything is claimed.** Package root `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio` (CS).

## Commits
1. `d866bb13` — Task 1 blocker: read-only Check again + first-turn Send with deferred idle capture.
2. `ddaed813` — Task 2 Core: safe successive turns (same conversation, same native thread, same journal).
3. `178d3fe3` — Task 2 UI: composer re-opens after a complete turn; per-turn list.

## Source changes (CS/src)
- `capture/conversation-service.mjs`
  - reconcile: no longer returns before inspection when `sessionId` is null. A *deferred idle* connection (`ready|blocked`, no uncertainty, capture `idle`) and an unscoped Check again after a *settled* turn run `adapter.preflight(binding, {readOnly:true})` — no type, no send, no capture arm. A failed/interrupted attachment (uncertainty set) is never cleared by it. Adapter-coded refusals (`ready:false` + `reason`) are surfaced as the readiness reason. An explicit `turnId` still uses the observation path.
  - submit: per-turn pre-send **cursor** (`messageCount/userCount/assistantCount/idsDigest/contentDigest/streamSequence`, metadata only) persisted on each attempt (also on the creation turn); turn N+1 is blocked pre-effect (`THREAD_CHANGED_BETWEEN_TURNS`, durable pre-effect proof) if history shrank below what delivered turns must have left; `PRIOR_TURN_CAPTURE_NOT_FINALIZED` if the previous turn's capture is `incomplete`; early journal-fence look so a send that will be `THREAD_FENCED` does not arm a new capture first. Journal fence / CAS / writer window / idempotency / uncertain lock unchanged.
- `capture/conversation-browser-adapter.mjs`: `preflight(_, {readOnly})` with no armed recorder inspects the idle page via the existing `readiness()` (no recorder, no focus, no typing); `turnCursor()` returned by preflight; prior page-delivered user messages must still be on the page (`THREAD_CHANGED_BETWEEN_TURNS`, observation `prior-turn-missing`); `readReply` now requires the baseline prefix unchanged and the turn's own user message directly after it (`TURN_BOUNDARY_CHANGED` on regenerate/edit/rewrite mid-wait).
- `capture/conversation-runtime.mjs`: per-turn capture stop is recorded `idle` **only if the stop was confirmed**, else `incomplete` (blocks the next turn); the next submit waits for a *completed* previous turn's cleanup work (never for an unresolved one); turn view adds `sessionId` and `cursor`.
- `studio/ui/chat.mjs` + `chat.html`: `canSend` admits a ready deferred-idle first turn (`capture` `idle`), and a next turn only when every started turn is settled (send observed + reply ready + readiness ready), no turn/diagnostic uncertainty, state `ready`, readiness ready, identity not unverified, and the previous capture is `idle`; composer hidden only while a turn is in flight; draft for the next turn is not wiped; `turnRows` + `#turnList` render Turn 1,2,3 with own chips/session/prompt/reply; Check-again release logic works for turn N+1; copy changed from "one message per conversation".

## Tests (all `node --test`, offline)
New files: `conversation-deferred-readiness.test.mjs` (6), `conversation-multiturn-adapter.test.mjs` (13), `conversation-multiturn-service.test.mjs` (10), `conversation-multiturn-runtime.test.mjs` (6); `chat-ui.test.mjs` +6 (and 4 existing assertions updated from one-message wording/shape).
- Task 1 expected-red written first: 3 of the 6 failed before the fix (Check again made 0 adapter calls; canSend rejected idle-deferred; reason/coded refusal); green after.
- Adversarial: identical text repeated across turns; duplicate user message; stale last-assistant; reply finished before baseline (identical text, different id); regenerate/edit mid-wait; earlier user message edited/branched; earlier reply changed between turns; native thread changed between turns (adapter + service); history shrink; capture not finalized; uncertain send lock + never auto-resent; lock lifts only after delivery observed AND reply finalized; restart fence; idempotent replay of turn 1 key after turn 2; failed per-turn capture stop.
- **Full `node --test "test/unit/**/*.test.mjs"` in CS: tests 1596, pass 1595, fail 0, skipped 0, todo 1** (baseline reported 1554 pass / 0 fail / 1 todo → +41 pass). Run once on the final tree.

## Offline/fixture-only evidence (NOT live)
Everything above. Fake Recorder, fake CDP helpers, scripted page transcripts, fake adapter in service/runtime, DOM-fake for the page. Nothing proves ChatGPT DOM ids/roles behave as the fixtures, that `/c/<uuid>` adoption after turn 1 works live, or the real cause of the live `BINDING_CHANGED` (still unknown; unconfirmed).

## Remaining gaps / seams not closed
- **No live run.** The first-turn journey, three context-dependent turns, `/c/<uuid>` adoption, stream/derive per turn were not executed.
- **Real `BINDING_CHANGED` cause not confirmed.** The new read-only Check again can now re-inspect and will report the actual coded reason live; the root cause (redirect race vs. fresh-tab URL) is unproven.
- **Per-turn capture acceptance:** each turn arms its own recorder session (`turn.sessionId`), but `capture` on the conversation is still one aggregate; per-turn G1–G7 / integrity / derive of turns 2..N is not wired into the UI or `finishEntry`, and `sessionId`/"Open saved session" links show the latest session only.
- **Text-drift risk:** `readReply` and delivery observation compare the whole baseline prefix text; a late cosmetic DOM change in an earlier message makes the turn fail closed (reply `unknown`, reconcile retries same check). Needs a live look.
- Stale `snapshot.sessionId`/`capture.state:'recording'` can remain after an unresolved turn whose reply never reached `ready` (runtime view downgrades to `incomplete`); acceptable because that turn is fenced, but not a clean state model.
- Provider scope: ChatGPT thread identity only (`chatgpt-c`); Claude/Gemini untouched.
- Markup/CSS for `#turnList` is minimal (reuses `.plain`/`.note`/`.blk`); no visual design review — use @designer if layout needs work.
- `bun run test` was not separately re-run (same script as the node command above).
