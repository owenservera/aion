# Design: Live drive in the Studio, and what "clean data" means

Status: design session 2026-10-22 (manager, after pausing the four build lanes). Nothing here is an
acceptance claim. "Observed" = read in source or run on this machine today; "reported" = a lane said
so and I did not re-verify; "hypothesis" = not checked.

## 1. Goal

One prompt, sent to a logged-in AI chat site from the Studio, ends in a **saved, verified, derived
session** whose data is trustworthy enough to build the shape library from, repeatable with no manual
cleanup. The owner's words: "a clean smooth data back and forth".

Non-goals: concurrency across sites, solving captchas/logins/age gates, looping a site for volume,
spoofing the browser, replacing the CLI (the CLI stays the reference path; the UI is a front end to it).

## 2. Evidence base

Observed today:

- Chrome 155 on 127.0.0.1:9222 is up with logged-in tabs for claude, arena, qwen, z.ai, deepseek,
  gemini, chatgpt. Node 24.11. 101 sessions saved. Studio UI was not running until I started `serve`.
- `campaign-state.json` stored `failed` for chatgpt/claude/gemini/deepseek/zai with a reason saying all
  12 words matched. Root cause: `campaign.mjs` set `status:'ok'` on a copy, persistence read the
  original. Fixed and pushed as `7b69bd2` with two tests. The old state entries remain until re-run.
- Unit suite: 85/86. The one failure, `trusted-knowledge.test.mjs` "corrupt derived JSONL is excluded",
  does not import campaign code. Pre-existing is likely, not proven.
- 4 sessions sit in status `recording`. Three are 10 h old (chatgpt, claude, 1337x): dead recorders.
  One (arena, 31 min) is the always-on recorder and is probably legitimate. Not verified.
- Partial lane output on disk, uncommitted, syntax-checked only (`node --check` passes):
  `src/studio/drive-api.mjs`, `ui/drive.html`, `ui/drive.mjs`, wiring in `server.mjs`, nav links in
  `ui/index.html` and `ui/live.html`. No tests exist for any of it.
- The transcript audit and the minimax/qwen/arena/kimi diagnosis lanes were cancelled before writing
  anything. Their questions are still open.

Reported (GPT-6.1 Sol review, file:symbol cited by the reviewer, not re-read by me):

1. `waitForCompletion` accepts DOM text after ~2.5 s quiet with no protocol terminal event.
2. Recording starts after navigation and composer discovery, so connections opened earlier are
   invisible; the drive records with `follow:false`.
3. Stop failures do not clear `result.ok`; a session can be saved as `stopping`.
4. `families/build.mjs:collectSessions` treats any session with a SHAPES artifact as derived; no
   completion, integrity or acceptance check; substring host matching.
5. `runCampaign` derives and builds families before checking reply words; overall `ok` ignores
   `totals.unverified`; resume skips `ok` sites without revalidation.
6. `sendMessage` fallback can double-send (its "before" state is not threaded into later checks).

## 3. Findings from reading the partial Studio work

Good, keep:

- `drive-api.mjs` implements the contract: one job at a time (409 + `activeJobId`), dry-run default,
  `confirm:true` for live, per-site progress, jobs persisted atomically to `drive-jobs.json` (50),
  interrupted jobs marked cancelled on restart and never retried, prompts and URLs scrubbed from stored
  reasons, 405/404 handling, campaign run one site per call so cancel works between sites.
- `drive.mjs` renders site text with `textContent`/DOM nodes only, drops live confirmation whenever the
  selection changes, handles 401/403/409/network errors, polls every 1.5 s.
- `server.mjs` serves the page under a strict CSP and cancels the job on close.

Defects found (observed in source):

- **D1 cancel is cosmetic.** `drive-api` passes `signal` to `driveSite`, but `driveSite`'s signature
  (`actions.mjs:923`) has no `signal`. Cancel only stops *between* sites; an in-flight drive runs to its
  timeout (default 120 s) while the job lock is held. Must be fixed in `driveSite`, not papered over.
- **D2 contract gap.** The UI reads `defaultPrompt` from `GET /drive/sites`; the API never returns it.
- **D3 verdict logic is duplicated.** `driveVerdict()` in drive-api re-derives verdicts, including a
  regex on the reason text to rescue the legacy `failed` entries. After `7b69bd2` new state is correct;
  the regex is only a bridge for old entries and must not become a second source of truth.
- **D4 no tests**, and no test can exist for cancel until D1 is fixed.
- **D5 gate missing.** A job that "completes" (words matched) says nothing about whether the saved
  session is intact. See section 5.

## 4. Architecture

```
Studio UI (/drive)  ->  /api/v1/drive/*  ->  drive-api (job queue, 1 active)
                                                |-- drive mode:    driveSite()  ---+
                                                '-- campaign mode: runCampaign() --+--> Recorder (own tab)
                                                                                    |
                                       post-drive gate  <---------------------------'
                                       stop -> verify -> derive -> accept|reject
                                                |
                                  verdict + sessionId  -> campaign-state.json (single writer)
                                                |
                                  family build (accepted sessions only)
```

Decisions:

- **A1. One verdict, one writer.** Verdict is computed once, in `campaign.mjs`/`actions.mjs`, and
  persisted. drive-api reads and displays it. The legacy-reason regex stays only as a read-time shim,
  marked deprecated, deleted once stale entries are re-run.
- **A2. Serial, one prompt per site per job, no auto-retry of a send.** Unchanged. Uncertain send =
  report, never repeat.
- **A3. Cancellation is a first-class `driveSite` option.** `signal` is checked at each await boundary
  (type loop, send, wait loop). On abort: stop typing, do not press Enter if not yet sent, then run the
  normal cleanup (recorder stop awaited, then tab close). Job lock is released only after cleanup.
- **A4. UI stays an additive page.** No change to existing Studio views beyond nav links and the
  `#session=<id>` deep link.
- **A5. Loopback + token + Host/Origin unchanged.** No new auth surface; POST needs the cookie.

## 5. The clean-data gate (what "verified" must mean)

Words matching is necessary, not sufficient. A drive is **accepted** only if all hold:

| # | Check | Source of truth |
|---|-------|-----------------|
| G1 | Exactly one user turn submitted; prompt text equals the sent prompt | L3 transcript |
| G2 | New content appeared after send (count grew), reply words match in order | `waitForCompletion` + `replyMatchesExpectation` |
| G3 | Reply stable for N s **and** no streaming indicator; where a protocol terminal event exists (SSE `[DONE]`, `message_stop`, WS close frame) it was seen | L1/L2 |
| G4 | Recorder stopped successfully **before** the tab was closed; session status is `complete` (not `recording`/`stopping`) | session meta |
| G5 | `studio verify <id>` passes: hashes valid, no exchange gaps, no exclusions | verify |
| G6 | Derive succeeded, entity dataset present or explicit `complete` with 0 | `KNOWLEDGE_STATUS` |
| G7 | L2 answer text and L3 DOM text reconcile for the reply | derive |

A drive that fails G1-G3 is `unverified` or `failed`; one that passes G1-G3 but fails G4-G7 is
`unverified` with the failing gate named in the reason (never silently `ok`). Only `accepted` sessions
feed `library build`. Gate G3's terminal-event requirement is per-site and may start as "recorded, not
required" for sites where no terminal marker is known, with that stated in the reason.

Known limit, stated not hidden: connections opened before attach are invisible to CDP (ARCHITECTURE.md).
For drives this is mitigated by arming the recorder on the fresh tab before navigating to the site
(hypothesis: needs `Target.setAutoAttach` + `waitForDebuggerOnStart`; to be checked in `recorder.mjs`).

## 6. API contract (final)

Unchanged from the lane brief, plus:

- `GET /api/v1/drive/sites` also returns `defaultPrompt`.
- `job.progress[].gates`: `[{id:'G1'..'G7', ok:true|false|null, note}]` so the UI can show *why* a site is
  unverified.
- `POST .../cancel` returns 200 with the job still `running` until cleanup finishes; clients poll.

## 7. UI

Keep `drive.html`/`drive.mjs` as built. Add: gate list per site row in the job panel; "stuck sessions"
notice with a "Verify & repair" button that calls the existing verify/derive endpoints for sessions in
`recording` older than 10 min whose recorder is not alive (never touches a live recorder); a persistent
line "One prompt per site. Chrome window must be in front." Status vocabulary stays honest: the word
"success" is shown only for `accepted`.

## 8. Risks

- Accounts: every live run spends quota and leaves a chat. Mitigation: dry-run default, explicit
  confirmation, one prompt per site, stop on rate limit/captcha/login/age/consent.
- Foreground: a window behind another window reports hidden tabs and drops key input. Mitigation:
  `scripts/focus-chrome.ps1` before live runs; UI warning.
- Repair button could hit the always-on arena recorder. Mitigation: only sessions with a dead owner.
- Stale `campaign-state.json` misleading the UI. Mitigation: A1 shim + re-run.

## 9. Test plan

Unit (no browser, injected fakes): job lifecycle; 409 on concurrent job; confirm required; dry-run opens
nothing; auth required; cancel mid-drive aborts and releases the lock (needs D1); verdict mapping incl.
legacy shim; gate failure yields `unverified` with named gate; restart marks running jobs cancelled.
Live (owner's Chrome, serial, one prompt per site, foreground window): chatgpt, claude, gemini,
deepseek, zai first (already known to match), then qwen, lmarena, kimi, minimax (known problem sites).
Evidence per site: session id, verdict, gates G1-G7, `verify` output.

## 10. Phases

1. **Core (single owner, sequential):** D1 `signal` in `driveSite`; D2; gates G4-G7 in the post-drive
   path; `collectSessions` accepts only accepted sessions. Tests.
2. **Studio:** commit drive-api + UI after phase 1; add gate display and repair notice; restart `serve`.
3. **Live pass** over the nine sites with the gate; fix adapter gaps site by site (minimax/qwen/arena/
   kimi diagnosis is the first task here, read-only).
4. **Stale cleanup:** verify+derive the three dead `recording` sessions; re-run the five stale campaign
   entries.

Parallelism: phase 1 is one writer (it all touches `actions.mjs`/`campaign.mjs`). Read-only diagnosis
(minimax/qwen/arena/kimi, transcript audit) can run alongside. Live runs never run in parallel.

## 11. Open questions for the owner

1. Is requiring a protocol terminal event (G3) acceptable to start as "recorded, not required" per site?
2. May the repair button auto-run `derive` on dead `recording` sessions, or only offer it?
3. Should accepted/rejected be stored in session meta (touches the session format) or in a sidecar
   `acceptance.json` (no format change)? Recommendation: sidecar.
