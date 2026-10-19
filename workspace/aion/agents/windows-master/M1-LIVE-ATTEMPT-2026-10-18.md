# M1 live attempt — 2026-10-18 (FAILED, stopped on first new failure)

**Outcome:** no message was sent. M1 is **not** verified. This file records one
authorized local run and the exact point where it stopped.

Scope of the authorization: local Windows UIA only, one pinned extension card
reload, one refresh of a known-empty target tab, at most one dispatch. No source
edits, no STATE promotion, no commit.

## Runtime anchors

| Item | Value |
|---|---|
| Chrome | pid `4120`, hwnd `918802` (bound by pid+hwnd, never by window title) |
| Target tab | `1584031330` — `https://chatgpt.com/`, verified empty before the run |
| Extension card | `AION Chrome Relay Station` (unpacked, on `chrome://extensions`) |
| Driver | `aion-uia-scoped.ps1` (exact AutomationId, exactly-one-match, no SendKeys) |

## Sequence (all times UTC)

| Time | Action | Observed |
|---|---|---|
| `20:54:04.910` | Invoked `dev-reload-button` on the pinned card, bound by card geometry | panel text vanished; side panel closed — extension restarted |
| `20:54:39.064` | Reloaded the target tab to `https://chatgpt.com/` | content script re-injected |
| `20:55:09.594` | Composer read | `composer count: 1`, `EFFECTIVE_CHARS=0`, `Send enabled=False` |
| `20:57:34.265` | Re-opened side panel via Chrome's own `Open side panel` item | `btn-chatgpt-tabs` present |
| `20:58:25.056` | `btn-chatgpt-ping` | `composer_visible_count=1, generating=false, send_disabled=true, send_present=false` |
| `20:59:45.818` | Pre-dispatch composer re-read + foreground proof | `EFFECTIVE_CHARS=0`, `Send enabled=False` |
| `21:00:39.812` | Guards | tab `1584031330`, text len `242`, confirm On, run enabled |
| `21:00:45.470` | **One** `btn-chatgpt-run` invoke | exit 0 |
| `21:00:47` | Panel result | `UNCERTAIN - turn_refused: no_reason` |
| `21:03:57.287` | Final page read | composer holds the 242 payload chars; `Send enabled=True`; URL still `chatgpt.com` |

## Root cause (exact)

Two defects, one causal and one cosmetic.

**1. Causal — the send control selector no longer matches.**
`content.js` uses `SEND_BUTTON_SELECTOR = '[data-testid="send-button"]'`.
In the live document that selector matches **zero** nodes (the ping above reports
`send_present=false`, computed in-page with that exact selector). The control does
exist and is enabled — UIA sees a `Button` named `Send` whose class is
`cursor-interaction size-token-button-composer … bg-composer-primary …`, with no
`data-testid` exposed. So:

- preflight passed (composer selector was already patched to `.ProseMirror`);
- `composerFill()` typed all 242 characters;
- `sendState()` then returned `sendDisabled: true`, because its own rule is
  `sendDisabled: send ? !!send.disabled : true` — a missing send node reports as
  *disabled*;
- `runTurn` therefore refused at the post-fill gate with reason
  `send_button_disabled`, **before** `fireClick()` was ever reached.

This is the same class of drift as `#prompt-textarea` → `.ProseMirror`, on the
adjacent control.

**2. Cosmetic — the refusal reason is discarded.**
The two early-exit replies (`send_button_disabled`, `send_button_missing`) respond
without a `verdict` object. `chatgpt-port.js` renders the reason as
`String(reply.verdict && reply.verdict.reason || 'no_reason')`, so a named refusal
reaches the panel as `no_reason`. The worker did receive `send_button_disabled`; it
just could not read it. `send_button_missing` is unreachable while the node is
absent, because the disabled branch is tested first.

Source vs runtime: the `COMPOSER_SELECTORS` fix is in the working tree and was
loaded by the reload at `20:54:04.910`. The `SEND_BUTTON_SELECTOR` is **not** fixed
in source or runtime — it is unchanged.

## Proof nothing was sent

- `fireClick()` was not reached: the `sendDisabled` branch precedes it and returns.
- The composer still holds exactly the 242 payload characters
  (`EFFECTIVE_CHARS=242`, first 20 `Authorized AION tran`), and ChatGPT clears the
  composer on send.
- The tab is still at `chatgpt.com` with no conversation URL, and no assistant
  reply exists.
- The panel settled the reservation as refused with `captured: false`.

## Page state left behind — needs a human decision

The target tab's composer now contains the unsent probe text
(`AION-M1-20261018-WIN-9c41f7`, 242 chars) with `Send` enabled. It was **not**
removed, deliberately: after a refused turn the page was left exactly as the run
left it rather than mutating a live composer to tidy up. Clearing it is a human
action (select-all + delete in the page). Until it is cleared, the adapter's own
`composer_draft_present` guard will refuse the next run on this tab — which is the
safe direction.

No user draft was touched: the composer was read as empty immediately before the
dispatch and no other tab was written to.

## Not claimed

- No send, no reply, no correlation, no ACP-over-ChatGPT, no M1.
- No commit, no STATE change, no TODO change.

## Smallest next fix (not applied here)

1. Replace the single send selector with a `SEND_BUTTON_SELECTORS` candidate list
   and the same exactly-one-match + disabled/aria-disabled rejection already used
   for the composer; reject rather than guess on multiple matches.
2. Make `send_button_disabled` / `send_button_missing` replies carry a `verdict`
   (or have the worker read `reply.reason`), so the panel stops collapsing named
   refusals into `no_reason`.
3. Gate the preflight on `send_present === true` as well as
   `composer_visible_count === 1`, so an unmatchable send control is refused
   **before** any typing — that would have kept the composer clean.

---

# M1 live attempt 2 — 2026-10-18 (a real send happened; adapter verdict still a refusal)

**Outcome:** the message was sent and ChatGPT answered with the exact requested
three lines. The adapter's own verdict is **`turn_refused: generation_incomplete`**
(UNCERTAIN), so this is **not** an accepted turn and **M1 is not verified**. The
single permitted live send was consumed here; nothing was retried.

The section above is kept unchanged as the historical failure.

## Source loaded by this attempt

Working tree, no edits by this agent. `SEND_BUTTON_SELECTORS` (legacy
`data-testid` **or** exact `Send` accessible name from aria-label/title/text),
`sendScopeRoot()` preferring the composer's own `form`, visible candidate dedupe,
exactly-one-match, and preflight refusing `SEND_MISSING` / `SEND_AMBIGUOUS`
**before** any fill. The worker now falls back to `reply.reason` when a reply
carries no `verdict`, so named refusals survive to the panel.

## Runtime sequence (all times UTC)

| Time | Action | Observed |
|---|---|---|
| `21:24:57.589` | Reloaded the pinned `AION Chrome Relay Station` card (geometry-bound button) | panel text vanished — real restart |
| `21:25:22.771` | Opened one new tab via the tab-strip `New Tab` button (no keys) | new tab, then navigated to `https://chatgpt.com/` |
| before `21:28:33` | Composer read on the new tab, then cleared the automation-owned draft | read: **242 chars of the previous attempt's draft**; after clear: `raw_len=12`, `placeholder_only=True`, `EFFECTIVE_CHARS=0`, `Send enabled=False` |
| `21:29:34.838` | `btn-chatgpt-ping` on tab `1584031358` | `composer_visible_count=1, generating=false, send_control_count=1, send_disabled=true, **send_present=true**` |
| `21:30:39.694` | Guards | tab `1584031358`, text `242`, confirm On, run enabled |
| `21:30:45.116` | **One** `btn-chatgpt-run` invoke | exit 0 |
| `21:32:45` | Panel result | `UNCERTAIN - turn_refused: generation_incomplete` |
| `21:33:17.703` | Page read | conversation `6ad53a88-d268-83ed-9542-82ed72d2e089`, title `Transport Check Reply` |
| `21:35:48.122` | Post-turn ping | `generating=false, send_disabled=true, send_present=true`, URL `/c/6ad53a88…` |

## The draft was not avoided by a new tab — it followed

The new tab opened at `21:25:22.771` showed the previous attempt's exact
242-character probe in its composer: ChatGPT syncs the composer draft, so "open a
clean tab" is not an escape from an unsent draft. The draft was therefore handled,
under the owner's rule, only after proof:

- length `242` and sha256 `5b3140952700172a31eae16a757a6e63b6e3225aa7816b6e74b642495cbb225a`
  matched the saved `probe-message-2.txt` **character for character**
  (`composer sha256=5b3140…` printed before any key was sent);
- cleared with select-all + Delete, after proving foreground **and** proving
  `FocusedElement` was that exact composer (`ProseMirror*`, name `Ask ChatGPT`)
  immediately before each key;
- re-read as empty: `raw_len=12`, `placeholder_only=True`, `EFFECTIVE_CHARS=0`,
  `Send enabled=False`.

One honesty note: my own post-clear assertion compared the composer's value to
`''`, but an empty composer reports its placeholder (`Ask ChatGPT`), so the script
exited `6` after the clear had already succeeded. The clear is confirmed by the
driver read above and by the ping (`send_disabled=true`). No other draft was
touched; no user-authored text was read or modified.

## What the send actually produced

Requested: three lines — the correlation id, the sum of 53 and 29, the token.
Observed in the assistant turn, in order:

```
AION-M1-20261018-WIN-4f7b21
82
ACK-M1-WIN-4f7b21
```

`53 + 29 = 82` — the computed checkable answer is correct, and both the
correlation id and the expected token came back verbatim. The user turn on the
page is the exact 242-character payload. A conversation was created, which is
itself proof that a send occurred; the composer is empty (`send_disabled=true`).

## Why the adapter still refused — exact cause

`content.js` waited for generation end with the bound the worker handed it. The
panel asks for `LIVE_RUN_TIMEOUT_MS = 180000`, but the worker clamps any request
with `boundedTimeout()` to `MAX_RUN_TIMEOUT_MS = 120_000`
(`chatgpt-port.js:112`, `:841–844`) and opens a `MAX_PORT_GUARD_MS = 150_000`
port guard. The turn outlived 120 s, so the page read its candidate while
generation was still in progress and refused to pass off a possibly-partial reply:
`correlate.js:50 / :721` → `GENERATION_INCOMPLETE`, “the candidate was read while
generation was still in progress; it may be partial”.

This is a bound-versus-latency failure, not a selector failure: the send control
resolved (`send_present=true`, `send_control_count=1`), the click submitted, and
generation start was observed (a stale stop selector would have produced
`generation_never_started`, not `generation_incomplete`). The reply landed a few
seconds after the bound expired.

## Not claimed

- No accepted verdict, no relay envelope, no ACP-over-ChatGPT, no M1. The page
  evidence is strong; the adapter's verdict is a refusal, and upgrading it here
  would be inventing proof. Adjudication belongs to the parent reviewer.
- No retry, no second send, no re-use of the prior correlation or reservation.
  New correlation and token throughout (`4f7b21`).
- Panel reconciled afterwards: `Probe state reconciled. Nothing was resent and
  nothing is armed.`
- No source edit, no STATE change, no commit.

## Smallest next fix (not applied here)

1. Raise `MAX_RUN_TIMEOUT_MS` (and the panel's `LIVE_RUN_TIMEOUT_MS`) above the
   observed turn latency, keeping `MAX_PORT_GUARD_MS` above it, so a slow turn is
   awaited rather than read mid-flight.
2. Alternatively make completion detection resilient to a candidate that is
   already final when the bound expires - but that must still be asserted by the
   page, not assumed by the worker.

---

# Read-only recovery after host restart — 2026-10-19

**No send, no prompt, no deployment, no reload, no browser action of any kind.**
The single-send budget was consumed by attempt 2; this section only re-reads
evidence that already existed and runs the real correlation modules offline.

## Why the live page could not be re-read

At `2026-10-19T08:5x` the host has **zero** Chrome processes, and pid `4120`
(attempt 2's anchored window) no longer exists. The conversation page, the side
panel, and any extension DevTools context all died with it. Starting Chrome again
is outside this recovery's scope and forbidden by it, so:

- **no fresh UIA read** of the reply was possible;
- **no `aion/chatgpt-read` call** was possible: the endpoint lives behind the
  extension's DevTools/service-worker context, and with the browser absent there
  is no such context. No sender check was bypassed, no code was added, and no
  ordinary tab was used to reach extension APIs.

The captured evidence below therefore predates the restart and is reused, not
re-created.

## Provenance of the captured reply

| Item | Value |
|---|---|
| Conversation | `https://chatgpt.com/c/6ad53a88-d268-83ed-9542-82ed72d2e089` |
| Page title | `Transport Check Reply` |
| Capture method | scoped UIA `Text` reads on the selected target window (pid `4120`, hwnd `918802`); assistant turn marked by the page's own `ChatGPT said:` text node |
| Captured at | `2026-10-18T21:33:17.703Z` (turn text present) and `2026-10-18T21:33:46.747Z` (all three lines) |
| No-generation observation | `2026-10-18T21:35:48.122Z` post-turn ping: `generating=false, send_disabled=true, send_present=true` |
| Raw reply | `"AION-M1-20261018-WIN-4f7b21\n82\nACK-M1-WIN-4f7b21\n"` (48 normalized chars) |
| Reply sha256 | `48fcf8af3c03816961de150e53d0073f38c12d5bb82e346e9c334f4bb7ead1db` |
| Outbound prompt sha256 | `7c7108013e8009dfe9eb019f419b9f8400a486191e2e07af6335c11fbca2588e` (242 chars) |

`generation=false` at `21:35:48.122Z` is a later **state** observation, not a
transition: the stop control was never observed appearing and then disappearing
across the bound. It is therefore **not** treated as `generation_complete`.

## Offline adjudication with the real modules

Command (read-only, no browser, no network):

```
node C:\Users\VIVIM.inc\AppData\Local\Temp\opencode\recovery-4f7b21\offline-correlate.mjs
```

`node v24.11.1`, importing the extension's own
`src/chatgpt/correlate.js` (`extractFinalReply`, `correlateReply`). Executed
`2026-10-19T08:59:18.145Z`, exit `0`, **11/11 expectations held**.

| Run | Input | Verdict |
|---|---|---|
| extractor, mixed turn | user block + assistant `final` block | `ok:true`, text identical to capture |
| extractor, user only | user block | `ok:false`, `no_final_block` |
| **honest** | exact id + token, `generation_complete:false` | `accepted:false`, `generation_incomplete` |
| **asserted (counterfactual)** | same, `generation_complete:true` | `accepted:true`, `correlation_found:true`, `reply_token_found:true`, `echo_trigger:null` |
| wrong unique id | expect `AION-M1-20261018-WIN-000000` | `accepted:false`, `correlation_mismatch` (reply carries `…4f7b21`) |
| user provenance | `role:'user'` | `accepted:false`, `echo_only` |
| outbound echo | candidate = the 242-char prompt | `accepted:false`, `echo_only`, `echo_trigger:'verbatim_whole'` |

The honest run reproduces the live adapter verdict exactly
(`generation_incomplete`); the asserted run is explicitly a **counterfactual**
and is not evidence that completion happened.

## Recovery classification — stated plainly

- Source: **UIA capture (pre-restart) + offline real correlator.**
- **Not** an extension-endpoint acceptance, **not** a live re-read after the
  restart, and **not** an accepted relay envelope.
- The reply text, the correlation id, the token, and the computed answer (`82`
  from `53 + 29`) all match; the only missing element is a live observation that
  generation finished inside the adapter's bound.

## Not claimed

No M1, no accepted envelope, no `generation_complete:true` as independent
evidence, no new send. No source edit, no STATE promotion, no commit. No draft,
page, or browser state was touched during this recovery.

What would settle the remaining question: one live run whose stop control is
observed appearing **and** disappearing, with the reply read afterwards — i.e.
a completion observation, not a claimed one.

## Offline timeout correction — 2026-10-19

- Coordinator reproduced the regression with `bun run test -- tests/chatgpt-port.test.js tests/panel-controls.test.js`: 88 tests, 87 passed, 1 failed; run ceiling was still 120,000 ms.
- Changed only the numeric timeout constants for this correction: worker run ceiling 300,000 ms, port guard ceiling 330,000 ms, panel wait 360,000 ms. Existing page ceiling remains 300,000 ms. Existing regression tests and earlier draft/selector fixes were preserved.
- Coordinator then ran `bun run test -- --test-timeout=60000` in `ops/chrome-relay/extension`: **371 tests, 371 passed, 0 failed/cancelled/skipped**, exit 0, on 2026-10-19 (following the 09:52:40Z preflight). This uses the existing Node test runner through Bun's package script.
- Offline only: no extension reload, browser action, new send, accepted live envelope, consumption or M1 acceptance. Chrome lifecycle/long-turn behavior still requires actual authorized verification.
- Changes remain in the working tree; no commit or push is claimed.

## Command-derived lifecycle guard — 2026-10-19T10:16:08Z

- Supersedes the fixed-guard correction above: shared `resolveCommandDeadline` computes per-command work/stage/absolute/panel budgets; `createBoundedLifecycle` enforces guarded continuations and cleanup. Hydration, tab lookup, preflight, reservation I/O, exchange and settlement are bounded. Current one-reply protocol has no inactivity renewal.
- Default maximum run: 300s generation, 305.4s exchange, 340.4s whole worker command, 350.4s panel deadline. Shorter selected valid work budgets derive shorter waits; finite safety limits remain.
- Late preparation cannot dispatch. Issued storage writes retain an in-process mutation barrier until they actually settle; blocked callers terminate without releasing no-resend records. A timeout is not cancellation of the page action or underlying storage write.
- Coordinator independently ran `bun run test -- --test-timeout=60000`: **402/402 passed**, failed/cancelled/skipped 0, exit 0. Independent oracle source review found no blocking P0/P1/P2 issue in this slice; reviewer did not rerun tests. `git diff --check` passed.
- Still offline/uncommitted: no browser reload, new send, accepted live envelope or M1. Durable submit/observe, cross-restart operation guards and replacing caller-asserted read completion remain subsequent work.

## Submit/observe split and durable no-resend recovery — 2026-10-19T11:55:06Z

- Page engine (`src/chatgpt/content.js` `createTurnEngine`): observation is armed **before** the only `fireClick`; `submit-turn` returns at submission observation; `observe-turn` is read-only and never fills, clicks, stops or moves the page deadline; legacy `run-turn` is a wrapper over the same engine. Submission is proven only by a NEW matching user turn after a recorded baseline — never by click success, a cleared composer, a new URL or a transport ACK. Caller `generation_complete` is never evidence.
- Worker hookup (`src/background/chatgpt-port.js`, `src/lib/command-deadlines.js`, `src/lib/chatgpt-tasks.js`, `src/background/service-worker.js`): `submit-turn` durably reserves, then persists observer identity before judging or settling; `observe-turn` takes identity only from the durable record, never from the caller; `read-final` sends the full identity set and surfaces page refusals verbatim. Locks release only on a positive no-send or a fully validated accepted reply; nothing is ever marked CONSUMED.
- Two independent review rounds found and closed defects the green suite initially missed: (a) a positive no-send page refusal was misreported as `observer_identity_mismatch` and wedged the conversation lock forever; (b) a terminal non-accepted receipt lost the page's real reason behind `adapter_acceptance_mismatch`; (c) read-only polls claimed `submitted:false` about an operation they never touched. All now fail closed with machine-readable reasons and keep the lock when evidence is missing.
- Coordinator independently ran `bun run test -- --test-timeout=60000`: **528/528 passed**, failed/cancelled/skipped 0, exit 0, at 11:54:16Z and again after the final worker read-only correction at **11:55:06Z**. Earlier receipts this run: 402/402 (10:16Z), 432/432 (10:33Z), 457/457 (10:52Z), 483/483 (11:17Z), 518/518 (11:38Z).
- **Still unproven and unclaimed:** no extension reload, no live send, no accepted live envelope, no consumer readback, no M1. Durability is proven only against storage fakes, not a real MV3 worker restart or page reload. Deferred: the reconcile endpoint for a terminal-not-accepted lock, durable persistence of `expected_reply_token` (P2-6), and any panel control that reaches submit/observe.
