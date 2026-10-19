# AION Windows — master tracker and owner checkpoints

> **LATEST OWNER DIRECTION: FULL LIVE EXECUTION IS ACTIVE.** `live_execution_authorized=true`.
> ChatGPT sends and reply readback are included in ongoing authority, not a consumed one-test grant.
> Earlier no-send-only and per-test grant examples below are historical where they conflict with this
> direction. Keep this implementation canonical and log its issues; reconcile uncertain operations
> rather than automatically resending. M1 verification is separate from execution permission.

**What this file is.** One master checklist and six **USER CHECKPOINTS (CP0–CP5)** the owner can
work through and watch real progress happen, plus the prior tracker preserved underneath for history.

**Status at write time — 2026-10-19T17:05:00Z (live session complete; implementation FROZEN).**
**Canonical frozen source: `fd347f22dba24e9282e8a39b01ed5f0c760bee14`** (parents `9b07eab` +
`7ffb434`, 13 code/test paths). Tested offline on that exact source: extension **736 passed**
(16:24:21Z); bridge **126 passed / 1 opt-in skip** (16:24:41Z, targeted re-run 16:24:19Z); bus runner
**8 passed / 2 opt-in skips**; MCP **10 passed**; adapter **35 passed** (16:24:04–16:24:07Z); bus
offline demo **3/3** (16:24:18Z, output `OFFLINE_PASS D1/D2/D3`). The bridge change was **test-only**
(`w.relay.host.ensureSession()` awaited before `HOLD`; 400 ms prompt timeout kept; production code
unchanged). Branch HEAD was `fc30efd` at the live session and later advanced to
`389a928bd7bca1054fd8b2189ef29308a16bde5` (merge of main, carrying the original checkout's two
research-doc files) — the tested source is unchanged, re-verified byte-identical by
`git diff --quiet fd347f2 HEAD -- chrome-relay aion-mcp adapter` (exit `0`).

**A real AION-originated live send happened through native UIA and the service reply was machine-read.**
`live_execution_authorized` is **true** — the owner explicitly confirmed **full live execution mode**.
The completed trial does not consume or revoke this ongoing authority. `m1_verified` is **false**:
this is **not** an
extension submit-path success, **not** an accepted relay envelope, and there is **no independent
negative case and no independent review**. Minimized evidence:
[`LIVE-INTEGRATION-2026-10-19.md`](LIVE-INTEGRATION-2026-10-19.md).

**Implementation is FROZEN — no more code fixes.** Remaining work is publish + issue logging only
(parent owns Git). See §1b for the live outcome and the bounded issue list.

**Original checkout research is preserved:** its two research documents were committed as `63d4a11`
and merged into the integration as `389a928`. The role09 research work from remote `8448242` is also
included. The final publication aligns primary `main` to this integrated history without resets or
discarding edits. Tested implementation remains byte-identical to source `fd347f22`.

**Source identity — independently verified, read-only.** `git diff --quiet fd347f2 HEAD -- workspace/aion/ops/chrome-relay workspace/aion/ops/aion-mcp workspace/aion/sessions/01-escape-hatch/adapter` exits `0` with **no differing paths**: the tested source is **byte-identical** between `fd347f2` and integration HEAD `78dad55`. The 18 paths that do differ between them are all under `workspace/aion/sessions/roles/09-global-research/` plus `workspace/aion/sessions/README.md` — research docs, no source. The final receipt therefore points at **source commit `fd347f2`** with **integration HEAD `78dad55`**. **Nothing is pushed yet**: `origin/main` is `8448242`; the branch is 3 ahead, 0 behind.

**Owner update, 2026-10-19 (received after this file was written).**
- **CP0 / offline work is APPROVED**, interpreted narrowly: offline only — source, tests, suites, the
  bus demo, receipts. **No live grant of any kind accompanies it.** CP1–CP5 are unchanged and each
  still needs its own explicit grant.
- A **separate OpenCode session** was started for **OpenCode 2.0 adapter research/design**. It is
  tracked below as **coordination lane X1** (§1) — a parallel lane, **not** implemented, **not**
  accepted, **not** part of any checkpoint, and it gates nothing. The parent will ask that session to
  stay read-only relative to the integration tree until the checkpoint — a **requested** boundary,
  pending that session's ACK, not an enforced fact. This tracker does **not**
  assume that session is paused, running or finished — its state is not observable from here.

> **Authority in force — read before doing anything.**
> **An offline approval is in force for CP0 / offline work only** (source, tests, suites, the bus demo,
> receipts). Everything else in this file is still **planning only**.
> This is **not** a browser, send or installation authority. Nothing may be executed against ChatGPT, a
> signed-in browser or the OpenCode service until the owner gives a fresh, explicit grant for that
> specific checkpoint (templates in §3).
> No Playwright, no Puppeteer, no credential/cookie/token export, no bulk history reads.
> `m1_verified` becomes `true` only after independent acceptance, per the M1 contract and
> `STATE-PROTOCOL.md`. `live_execution_authorized` is a state field the parent updates per protocol when
> the owner actually grants live scope — it is not permanently pinned to `false` by this document, and
> this document does not change it.

**Authority sources read for this plan:** `workspace/aion/STATE.json`,
`workspace/aion/canon/AION-MILESTONE-1-INTROSPECTION.md` (M1 contract), `workspace/aion/STATE-PROTOCOL.md`,
`workspace/aion/canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md`,
`workspace/aion/canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md`,
`workspace/aion/ops/chrome-relay/BUS-V1-V2-DESIGN.md`, `workspace/aion/ops/chrome-relay/bus/README.md`,
`workspace/aion/ops/chrome-relay/bus/windows/Install-AionBus.ps1`,
`workspace/aion/ops/chrome-relay/bus/bin/aion-bus.mjs`, `workspace/aion/ops/chrome-relay/extension/src/panel/bus.html`,
`workspace/aion/agents/windows-master/M1-LIVE-ATTEMPT-2026-10-18.md`, `workspace/aion/agents/windows-master/RUNBOOK.md`.

---

## 0. How to use this file

- §1 is the **authoritative master checklist**. When it and the archived tracker below disagree, §1 wins.
- §2 is the **checkpoint runbook**. Each checkpoint is small, safe and separately reviewable, with
  prerequisites, exact steps, a visible pass/fail, a minimal receipt, a stop rule and a rollback pointer.
- §3 holds **approval templates that are not activated**. Copy, fill, sign — do not treat as permission.
- §4 is the **honest limits list** — read it before promising anyone a result.
- §5 lists **decisions only the owner or parent can make**.
- §6 is the **prior tracker, preserved**. Historical, but not deleted.

---

## 1. Master checklist (authoritative)

Ordered. `→` means the next row may not start until the previous one has a receipt.

| # | Action | Owner | Status | Depends on |
|---|---|---|---|---|
| 1 | Freeze canonical source `fd347f22` — **no more code fixes** | owner | **DONE** | — |
| 2 | Commit and push everything on main, keeping `fd347f22` canonical | **parent (Git)** | **IN PROGRESS** | 1 |
| 3 | Integrate the original checkout's 2 research-doc files | **parent (Git)** | IN PROGRESS | 2 |
| 4 | Log the bounded issues from §1b in the issue tracker | **parent** | TODO | 2 |
| 5 | Live native-UIA round trip — one real send, reply machine-read | main agent (native UIA) | **DONE** — reply verified; extension submit path failed (§1b) | 1 |
| 6 | Independent negative case + independent review (M1 acceptance) | independent reviewer | TODO — needs a fresh live grant | 5 |
| 7 | Everything else (CP2–CP5, OpenCode 2.0 research) | — | NOT STARTED; not blocking the freeze | — |

**§1b supersedes the recorded statuses in §2.** The checkpoint runbook in §2 stays as the *procedure*
reference; its statuses predate the live run and are not the current truth.

**Note on the scope of the CP0 approval.** CP0 is offline work: source, tests, suites, the bus demo and
receipts. It does **not** extend to CP1. CP1 is *no-send* but **not read-only**: it reloads an extension
inside a signed-in Chrome and may register the HKCU native host — persistent mutations of the machine,
not offline work. CP1 therefore still needs its own confirmation, and CP2–CP5 still need their own
grants (§3).

### Coordination lanes (parallel, not on the checkpoint path)

| Lane | Subject | Owner | Boundary | Status |
|---|---|---|---|---|
| X1 | OpenCode 2.0 adapter — research and design only | separate OpenCode session | **Requested** boundary: the parent will ask that session to stay read-only relative to the integration tree until the checkpoint. **Requested, pending ACK — not an enforced fact, and not confirmed by this tracker.** | **ACTIVE — separate session.** Not implemented, not accepted, not a blocker, gates nothing. State not observed from this tracker; no assumption that it is paused, running or finished. |

**X1 in one line.** The Bus V2 design has two executor paths: the ACP executor over the native relay
(`extension/src/bus/adapters/acp-executor.js`) and the optional OpenCode 2.0 shared-service adapter
over loopback HTTP (`extension/src/bus/adapters/opencode-v2.js`). X1 researches and designs the latter.
Its output is a **proposal for the parent**, not code, not a claim, and not an acceptance.

**X1 scope (requested boundary, pending ACK).**
- **In scope:** read the tree, read the OpenCode 2.0 docs already in the repo
  (`workspace/aion/ops/opencode-2/ACP-AND-SERVICE-PROTOCOL.md`), and write a design note.
- **Requested to be out of scope:** editing the integration worktree, changing the merge, touching the
  bus core/adapters, starting the OpenCode service, dispatching anything to an executor, or making a
  live claim. This is a **request the parent will make**, pending that session's ACK — it is not an
  enforced fact, and this tracker does not assume the session is paused, running or finished.
- **Must not claim:** V2 ACP / shared-HTTP parity by feature name. `ACP-AND-SERVICE-PROTOCOL.md` is
  explicit that their capabilities and lifecycles differ. Any comparison X1 produces is about **these
  two executor paths**; it is unrelated to the excluded WIP redaction/scrubber parity item, which stays
  a separate optional backlog entry.
- **Known limit X1 must design around:** the Windows location of the OpenCode 2.0 service state file
  is **unverified**; `bus/opencode-service.js` guesses four candidate paths in order. `--opencode-url
  auto` can fail with `opencode_service_not_found`; `--opencode-url http://127.0.0.1:<port>` and
  `--opencode-state <file>` are the explicit alternatives. Starting the service stays an owner action.

**Not on the critical path** (do these in parallel, none of them blocks a checkpoint):

- [ ] Combined merge commit + push of the integration worktree — **parent**, after M0 is green.
- [x] Reconcile `STATE.json` `bus_direction` with `bus/README.md` — **DONE in this edit**:
      `implemented` → OFFLINE_CODE, live acceptance false, `live_execution_authorized` and
      `m1_verified` unchanged.
- [ ] Refresh the OpenCode model registry (`workspace/aion/ops/opencode-models/ROUTING.json`), which
      still advertises the previous subagent defaults while live sessions actually run MiniMax M3.1
      Flash Free. **Parent** — see §4.
- [ ] **Verify** the merged implementation of the submit/observe split, the reconcile endpoint and the
      durable `expected_reply_token` (P2-6) — the merge already carries them. This is a
      confirm-they-work-and-hold-the-regression job, **not** a job to add the endpoint again.
      **fixer** — required before CP3.
- [ ] Optional backlog, kept **separate**: the excluded WIP work item (a redaction/scrubber parity
      test). It is **not** ACP/HTTP protocol capability parity and it is **not** sourced from lane X1.
      **Not a blocker** for any checkpoint.
- [ ] Not a blocker, already covered: general security tests exist (bridge host-safety: origin pin,
      hostile-cwd refusal, frame clamp; bus injection/hostile-input and crash-matrix suites).

---

## 1b. Live outcome and bounded issues (authoritative — supersedes §2 statuses)

### What happened — one real send, machine-read
| Time (UTC) | Actor | Action | Observed |
|---|---|---|---|
| pre-16:44 | main agent (native UIA) | extension panel native ping | **CONNECTED**, status **VERIFIED** |
| 16:44:31Z | extension submit path | submit marker `AION-INTEGRATION-20261019-01` | **refused before dispatch**: `conversation_locked: unmapped legacy reservation` |
| after 16:44:31Z | owner | authorized archiving the old orphan; the DevTools archive attempt **failed** in `storage.get` keys **before any write** (suspected missing `ARCHIVE_KEY` in the loaded module; source paths **not proven**) | no state written |
| after that | owner | requested start over: **AION extension removed and reinstalled** (extension only), ChatGPT tab refreshed | — |
| 16:59:35.797Z | extension split Submit | fresh marker `AION-INTEGRATION-20261019-02`; prompt exactly `Reply with exactly these two lines:` / `AION-INTEGRATION-20261019-02` / `53+29=82`; approval ref `owner:20261019:fresh-live-test` | output **UNCERTAIN** `turn_refused: generation_incomplete` by 17:00:09; read-only **Observe** returned the same |
| ~17:03 (owner-confirmed; no exact clock claimed) | owner | confirmed the prompt was filled correctly but **not sent** | — |
| 17:04:16.8683372Z | **main agent (native UIA)** | after an exact composer readback, invoked the **real ChatGPT Send button** via `InvokePattern` — **once** | composer held marker length **73**; Send button enabled |
| 17:05:00.7053692Z | **main agent (native UIA)** | read the UIA transcript nodes in order | **"You said"** + the exact prompt, then **"ChatGPT said"** + `AION-INTEGRATION-20261019-02` + `53+29=82`, with Copy / Read-aloud controls |

**What this is.** A real AION-originated prompt reached the real ChatGPT service, and the actual
service reply was read back **directly by the machine, with no owner copy/paste relay**. The send was
performed by the main agent through native Windows UI Automation on the ChatGPT Send control — **not**
an owner manual send.

**What this is not.** It is **not** the extension submit path succeeding, **not** an accepted relay
envelope, and there is **no independent negative case and no independent review**. Therefore
**`m1_verified` stays false** and M1 is not accepted. Only **one** actual send occurred: nothing was
retried and no second prompt was sent.

### Bounded issues (practical priorities — not new security tasks)
| Pri | Issue | Note |
|---|---|---|
| **P1** | Extension fills the composer but does not activate Send | the submit path stops short of the real control |
| **P1** | `generation_incomplete` emitted while the prompt was still unsent | the `submitted` field means *dispatch*, not *proven UI send* |
| **P2** | A fresh extension install requires a ChatGPT tab refresh, else `port_closed` | install-time step |
| **P2** | Loaded-build mismatch suspected (missing `ARCHIVE_KEY` vs integrated source) | **not proven** — the actual loaded path was never confirmed |
| **P2** | Old legacy unmapped reservation locks all sends | blocks every send until cleared through a reviewed path |
| **UX** | Workflow too cumbersome | explicit owner feedback on the current procedure |
| V2 | OpenCode 2.0 research proposal | unimplemented; **next**, not blocking the current freeze |

No new security tasks are opened by this run.

---

## 2. USER CHECKPOINTS

Each checkpoint is a gate. If its pass/fail is not visible, the next one does not start.

> **Status note (2026-10-19T17:05Z):** the statuses recorded below predate the live run and are
> **superseded by §1b**. Keep this section as the *procedure* reference; treat §1b as the current truth.

---

### CP0 — Offline integration acceptance (no owner action, no browser)

**Status: APPROVED (offline only) — 2026-10-19.** Approved narrowly: source, tests, suites, the bus
demo and receipts. The approval carries **no live authority** and does not extend to CP1–CP5.

**What it proves:** the merged tree is internally consistent and its offline suites are green.
**What it does not prove:** anything about Chrome, ChatGPT, a phone or OpenCode.

**Prerequisites**
- Merge conflicts resolved and staged in `C:\0-BlackBoxProject-0\AION-integration-20261019`.
- The **chosen combined revision** identified explicitly: the commit SHA this run tests (or, before the
  merge is committed, the two parent SHAs plus the tree hash). A SHA is a **label, not a durable
  prerequisite** — once the merge is committed, the receipt must name the *committed* combined
  revision it tested, and a run against a different SHA invalidates the receipt.
- `main` still at `7ffb434`; worktree HEAD `9b07eab`; no combined commit, no push.

**Steps** — use the existing package scripts, **Bun first**. `extension`, `bridge`, `bus` and
`aion-mcp` each define a `test` script; the adapter directory has **no** `package.json`, so it needs an
explicit command.

```powershell
$repo = 'C:\0-BlackBoxProject-0\AION-integration-20261019'
Push-Location "$repo\workspace\aion\ops\chrome-relay\extension"; bun run test -- --test-timeout=60000; Pop-Location
Push-Location "$repo\workspace\aion\ops\chrome-relay\bridge";      bun run test; Pop-Location
Push-Location "$repo\workspace\aion\ops\chrome-relay\bus";         bun run test; Pop-Location
Push-Location "$repo\workspace\aion\ops\aion-mcp";                 bun run test; Pop-Location
Push-Location "$repo\workspace\aion\sessions\01-escape-hatch\adapter"; node --test send-m05.test.js; Pop-Location
Push-Location "$repo\workspace\aion\ops\chrome-relay\bus";         bun run demo; Pop-Location
```

About the commands, stated plainly rather than assumed:
- Each `test` script is `node --test`; `bun run test` runs that script. They are **not** interchangeable
  in general — use the script, and treat any difference in runner behaviour as a finding.
- `aion-mcp`'s script is `node --test tests/*.test.mjs` — **broader** than the three files the installer
  runs (`server`, `bus-tools`, `verify-local`). The wider set is a superset; record which ran.
- The adapter has no script: `node --test send-m05.test.js` is the explicit fallback.
- `bus`'s `demo` script is the same `node bin/aion-bus.mjs demo` the installer calls.

**Allowed skips — named, documented, opt-in only.** A skip is acceptable **only** if it is one of these:

| Suite | Test | Skipped unless |
|---|---|---|
| bridge | `real opencode acp: initialize through the real host; an unauthenticated prompt is never reported as success` | `AION_REAL_OPENCODE` is set |
| bus-runner | `native-ping: read-only PING against the real host entry point` | the platform is not `win32` (skipped on Windows by design) |
| bus-runner | `real OpenCode 2.0 service: discover, session at grant cwd, prompt admitted, outcome reconciled from server` | `AION_REAL_OPENCODE_V2_STATE` is set |

Any **other** skip, any cancelled test, any failure, or any non-zero exit is a FAIL. A green suite that
contains a test which cannot fail is not evidence.

**Current integration evidence — CP0 functional checks PASS (2026-10-19T16:24:41Z).**
- Extension suite: **736 passed**, failed 0, cancelled 0, unexpected skipped 0 (16:24:21Z).
- Bridge suite: **126 passed / 1 opt-in skip** (16:24:41Z); the targeted re-run also passed (16:24:19Z).
  The single change is **test-only** — the test now awaits `w.relay.host.ensureSession()` before `HOLD`;
  the 400 ms prompt timeout is kept and **production code is unchanged**.
- Bus runner: **8 passed / 2 opt-in skips**; MCP: **10 passed**; adapter: **35 passed** (16:24:04–16:24:07Z).
- Bus offline demo: **3/3**, 16:24:18Z, actual output **`OFFLINE_PASS D1/D2/D3`**.
- The new `expected_reply_token` regression negative is proven.
- Observed skips are exactly the named opt-in set above (bridge 1, bus 2) — **no unexpected skip**.
- Code under test: merged commit `fd347f22dba24e9282e8a39b01ed5f0c760bee14` (parents `9b07eab` +
  `7ffb434`, 13 code/test paths); source is identical to the runs above.

**PASS on the functional checks. Still open and outside CP0:** final independent review, the docs
commit, and publication. CP0 is an **offline** result — it proves nothing live.

**Pass / fail**
- PASS: every suite exits `0`; the only skips are the three named above; the demo exits `0` with
  `OFFLINE_PASS D1/D2/D3`; and the source under test is the named merged commit.
- FAIL: anything else — an unexpected skip, a cancelled test, a demo failure, or a run whose source
  differs from the named commit.

**Minimal receipt** — UTC timestamp, the merged commit SHA tested, per-suite `passed/total` + exit code,
the named skips observed, the demo output line, and counts of failed/cancelled/other-skipped. No file
contents, no transcripts. The parent may attach the captured log paths; they must be sanitized and
carry no private data.

**Stop rule** — on FAIL: stop. No reload, no browser, no commit, no push, and no re-run loop beyond one
diagnostic re-run of the failing suite. A green result obtained by re-running until it passes is not
acceptance; a flake must be diagnosed and fixed.

**Approval boundary** — none beyond the offline approval already in force. Offline, no browser, no
account, no network account action.

**Rollback / recovery** — nothing to roll back. If the merge itself is abandoned, that is the parent's
call (`git merge --abort` in the worktree).

---

### CP1 — No-send bring-up (first hands-on milestone)

**What it proves:** the machine is wired — suites green, native host registered and answering a
read-only PING, the *intended* extension build loaded, Bus panel visible. **No message is sent
anywhere.**

> This is the earliest checkpoint where the owner does something and sees something real. It is
> reversible and needs no ChatGPT-side permission.
>
> **It is not read-only.** Registering the native host and reloading the extension are **persistent
> mutations** of the machine. The no-write part is step 1; the mutating part is step 2 and is a
> separate, explicit action.

**Prerequisites**
- CP0 PASS on the functional checks (2026-10-19T16:24:41Z, merged commit `fd347f22`).
- **CP1 is not covered by the CP0/offline approval.** It mutates the machine and touches a signed-in
  Chrome, so it needs its own confirmation before it starts.
- Chrome Profile 3; extension id `kgjfielmhcdlggjppmliabpiljnonhki` (pinned in the manifest key; the
  installer re-checks it and refuses if it changed).
- Node ≥ 22 on the machine.

> ### ⛔ PATH-CONFIRMATION GATE — CP1 is BLOCKED until this is cleared
> Read-only inspection of the registry and the machine-local files on 2026-10-19 (no browser, no
> browser profile files) gives a **half-confirmed** answer:
>
> **CONFIRMED — the native host points at the ORIGINAL checkout, not the merged worktree.**
> - `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.aion.relay` → default value
>   `C:\Users\VIVIM.inc\AppData\Local\AION\relay\manifest.json` (key present).
> - That manifest: `name` `com.aion.relay`, `type` `stdio`, `allowed_origins`
>   `chrome-extension://kgjfielmhcdlggjppmliabpiljnonhki/`, and `path` =
>   `C:\0-BlackBoxProject-0\AION\workspace\aion\ops\chrome-relay\bridge\native-host\aion-relay-host.cmd`.
> - That launcher resolves `BRIDGE_DIR=%~dp0..` and runs `%BRIDGE_DIR%\bin\aion-relay-host.mjs`, so
>   **the bridge code Chrome would execute is the original checkout's**, at `7ffb434` — not the merged
>   `fd347f22` revision. The worktree has its own equivalent launcher.
>
> **UNKNOWN — the unpacked extension's installed path.** It cannot be confirmed from safe sources: no
> bus install receipt exists (`%LOCALAPPDATA%\AION` holds only `relay\manifest.json`), and Chrome
> profile files are out of scope for this read. **This needs the owner** — one look at the extension's
> `chrome://extensions` card, or an owner-permitted read.
>
> **Consequence.** Until both sides are aligned to the tested merged revision, reloading the extension
> would load the **original checkout's** code, and the native host would run the original checkout's
> bridge — a different revision from the one CP0 tested, so a CP1 result would not be evidence for
> `fd347f22`. Do not reload, do not install, and do not guess which checkout is live.

**Steps**

1. **No-write diagnostics** (changes no machine state; writes one sanitized receipt):
   ```powershell
   pwsh -NoProfile -File 'C:\0-BlackBoxProject-0\AION-integration-20261019\workspace\aion\ops\chrome-relay\bus\windows\Install-AionBus.ps1' -SkipTests
   ```
   Expect PASS for preflight (including `extension identity preserved`) and the native-host checks,
   and read the two paths from the gate above. (Without `-SkipTests` the script also re-runs all five
   suites — that is CP0's job, not this step's.)
2. **Explicit install — NOT covered by this approval.** Registering or re-pointing the native host is a
   **registration change and needs its own ask**. The native host is already registered, so this step
   should be unnecessary; if the verify script reports it missing, **stop and ask** rather than
   installing:
   ```powershell
   # NOT RUN under this approval:
   # pwsh -NoProfile -File 'C:\0-BlackBoxProject-0\AION-integration-20261019\workspace\aion\ops\chrome-relay\bus\windows\Install-AionBus.ps1' -Mode Install
   ```
   It registers the HKCU key **only if missing**, through the existing
   `aion-mcp/windows/Complete-AionBus.ps1` — one registration path, not two.
3. **Reload the extension** — only after the path gate is cleared: `chrome://extensions` → the
   **AION Chrome Relay Station** card → its reload control. (The agent can do this through the existing
   scoped UIA driver if the owner prefers to hand it over — the driver is a script, not a button name.)
4. **Open the side panel → the Bus view.** Expect the Status card to show the adapters
   `chatgpt.com, acp`, the kill switch off and the watcher off — the installer's own stated
   expectation. Visible controls: `Stop the bus`, `Resume`, `Refresh`, `Scan commander now`,
   `Check unresolved`, `Bind`, `Make this agent the commander`, `Create grant`, the
   `Scan the commander every 30 seconds` checkbox, `Resolve`, `Archive resolved operations`,
   `Reset an unreadable bus ledger`, and the SYNC-0 card. (`Reset an unreadable bus ledger`
   **quarantines** — it is not a delete; see §4.)

**Pass / fail**
- PASS: the diagnostics exit `0`; the receipt shows `native_host: REGISTERED_AND_VALIDATED` and
  `native_ping: PASS`; **both** gate paths are recorded and aligned to the tested revision; the Bus
  panel Status renders with adapters `chatgpt.com, acp`, kill off.
- FAIL: diagnostics exit non-zero, native PING fails, the panel shows no adapters, **or either path
  cannot be confirmed and aligned.** That last one is a hard stop.

**Minimal receipt** — the receipt file name and path printed by the script
(`%LOCALAPPDATA%\AION\bus\install\bus-verify-<timestamp>.json`), UTC, the tested combined revision, the
**confirmed loaded extension path**, the **confirmed native-host launcher path**, and the one-line panel
Status text. No transcripts, no account content.

**Stop rule** — if the native PING fails, do not hand-edit the registry. If the panel shows the kill
switch engaged, press `Resume` before any later step.

**Status: APPROVED (scoped, no-send) — 2026-10-19.** The owner granted a bounded no-send bring-up.
**Update (17:05Z):** the extension side of this bring-up was later found to stop short of activating
Send (§1b) — the extension submit path did **not** carry the live send. The live send ran under the
separate fresh approval ref `owner:20261019:fresh-live-test`.
**Granted:** finish the path and version checks; align the **extension** to the tested build if
needed; reload the pinned extension; open the panel and confirm the native-host connection.
**Excluded:** ChatGPT prompts of any kind, commander scanning, grants, executor tasks, ledger resets.
**Native-host registration changes require a separate ask** — so the HKCU native-host manifest is
**not** to be re-pointed under this approval; the native host therefore keeps running the **original
checkout's** bridge at `7ffb434`, and a CP1 receipt must say so rather than implying it validated
`fd347f22`. **No send authorization and no M1 promotion** — `live_execution_authorized` stays `false`
and `m1_verified` stays `false`.

**Approval boundary** — extension path and version checks, alignment of the extension to the tested
build, one extension reload, opening the side panel, reading the panel Status, and confirming the
native-host connection. **No ChatGPT message, no account change, no other tab, no commander scan, no
grant, no executor task, no ledger reset, no native-host registration change.**

**Order of execution — the parent executes this; this tracker does not.**
1. **Path check.** Read the extension's loaded source path from the `chrome://extensions` card
   (`chrome://extensions` → AION Chrome Relay Station → the card's source/directory) and record it.
   The native-host side is already confirmed: `%LOCALAPPDATA%\AION\relay\manifest.json` → `path` =
   `C:\0-BlackBoxProject-0\AION\workspace\aion\ops\chrome-relay\bridge\native-host\aion-relay-host.cmd`,
   and that launcher runs the **original checkout's** `bridge\bin\aion-relay-host.mjs`.
2. **Align the extension** if its loaded path is not the tested build: point it at
   `C:\0-BlackBoxProject-0\AION-integration-20261019\workspace\aion\ops\chrome-relay\extension`
   (owner action in Chrome). Re-pointing it back at the previously recorded path is the reversal.
3. **Reload** the pinned extension card. The scoped UIA driver invokes that card's `dev-reload-button`
   (exact AutomationId, exactly-one-match, no SendKeys, bound by pid+hwnd and card geometry) — the
   driver script `aion-uia-scoped.ps1` is **not in the repo**, so its location must be confirmed before
   use; do not improvise a different automation. A reload is not a rollback.
4. **Open the side panel** and switch to the **Bus** view. Historical note: toolbar activation through
   UIA has not produced an observed side panel, so prefer one manual AION-toolbar click from the owner
   over weakening sender checks or claiming a handshake.
5. **Finish the version check and read Status.** Record the panel's protocol/version line, the Bus
   Status line (adapters `chatgpt.com, acp`, kill off, watching off) and the native-host connection
   result — and state explicitly which revision each side ran: extension = tested build `fd347f2`,
   native host = original checkout `7ffb434`.

**Receipt for this scoped run** — UTC, the extension's loaded path before and after alignment, the
native-host launcher path, the panel version line, the Bus Status line, the native-host connection
result, and one sentence naming the revision each side ran. No transcripts, no account content.

**Rollback** — `-Mode Rollback` removes the HKCU key and the AION host manifest this tooling wrote
(never Chrome profiles, the extension, ChatGPT or git); note that it is a **registration** change and
therefore needs its own ask under this approval. Extension-side reversal is to re-point the unpacked
extension at its previously recorded path and reload. **Reload-twice is not a rollback.** Never delete
the bus storage key or the runner state file (§4).

**Rollback / recovery — true rollback, not "reload it again".** Reloading twice is *not* a rollback; it
just loads the same path again.
```powershell
pwsh -NoProfile -File 'C:\0-BlackBoxProject-0\AION-integration-20261019\workspace\aion\ops\chrome-relay\bus\windows\Install-AionBus.ps1' -Mode Rollback
```
removes the HKCU `com.aion.relay` key and the AION host manifest **only if they are the ones this
tooling wrote**; it never touches Chrome profiles, the extension, ChatGPT or git.
True rollback of the extension side means restoring an **approved known-good version, path or
configuration** — with the bus state **preserved**, not wiped (see §4). If no approved known-good state
is established, the correct rollback is to **stop and escalate**, not to improvise.

---

### CP2 — Chrome no-send handshake (SYNC-0)

**What it proves:** whether Option A works at all — i.e. does a message you send from your phone
appear in the commander conversation already open on the PC? This is the open question that decides the
whole V1 channel. **The PC sends nothing in this checkpoint.**

**Prerequisites**
- CP1 PASS.
- The commander conversation open in **exactly one** Chrome tab, and the Bus panel open.
- A **fresh explicit owner grant** for this checkpoint (template in §3). This checkpoint involves a real
  message from your phone to ChatGPT — that is a real send, and it is what the grant must cover.
- Note the honest unknown: "does a PC tab pick up a phone-sent message without a reload" is **unknown**.

**Steps** (exact, from `bus/README.md` §10 and the installer's live checklist step 0)

1. Bus panel → **Bind an agent**: Agent = the commander, Adapter = `chatgpt.com conversation`,
   Ref = the conversation URL, Your confirmation reference = your own reference → **Bind**.
2. Press **Make this agent the commander**.
3. SYNC-0 card → **Start**.
4. From the **phone**, send one ordinary message to that conversation. **Touch nothing on the PC.**
5. Wait about 2 minutes → **Sample now** → **Finish**.
6. If nothing appeared: reload that tab by hand, press **I reloaded the tab**, then **Finish** again.

**Pass / fail**
- `PHONE_TURN_VISIBLE_WITHOUT_RELOAD` ⇒ Option A is viable.
- Visible only after a manual reload ⇒ Option A needs a reload handshake; note it as such.
- Not visible at all ⇒ Option A is not viable as-is; Option B (connector bridge) becomes the candidate,
  and it is blocked on ChatGPT custom-MCP entitlement (Plus is **not** an established entitlement).
- Either way the verdict is a real result and gets recorded.

**Minimal receipt** — the SYNC-0 verdict string, UTC of Start / Sample / Finish, and whether the manual
reload path was needed. **No message bodies, no transcripts.**

**Stop rule** — a running SYNC-0 probe suspends command processing and never sends. If the probe looks
stuck: `Stop the bus` first. Only then, and only under separate owner authority, use
`Reset an unreadable bus ledger` — which **quarantines** the ledger for inspection and must be followed
by a minimized receipt of what was quarantined. **Never delete the bus storage key or the runner state
file** (see §4). Do not re-run SYNC-0 more than once to "try again".

**Approval boundary** — read-only observation of a conversation you own, plus one ordinary message you
type yourself from the phone. The PC sends nothing.

**Rollback / recovery** — nothing to undo. `Stop the bus` is the off switch and `Resume` turns it back on.

---

### CP3 — ONE benign ChatGPT roundtrip + consumer readback + safe negative + independent M1 acceptance

**What it proves:** the M1 contract — AION originates a real message to ChatGPT, gets the real reply,
reads it back, and a mismatched case is rejected. This is the milestone that can set `m1_verified`.

> ### ⛔ PROCEDURE VERIFICATION GATE — CP3 is BLOCKED until this is cleared
> The **exact runnable procedure for one benign send on the merged build is not yet established.**
> The merge now **carries** the submit/observe split, the reconcile endpoint and the durable
> `expected_reply_token` — they are implemented, and CP0's job is to verify they hold on the merged
> tree (not to add them again). What is still missing is the **panel control that reaches
> submit/observe**, and any live exercise of the corrected timeouts. The last real attempt
> (2026-10-18 attempt 2) ended `turn_refused: generation_incomplete` because the worker clamp (120 s)
> was shorter than the observed turn; the timeout constants were corrected offline afterwards and
> never exercised live.
> **Do not attempt CP3 until the coordinator demonstrates the exact control/command on the merged build
> and the parent records that procedure in this section.** Do not improvise a send procedure from the
> 2026-10-18 notes — the send path changed underneath it.

**Prerequisites**
- CP0 PASS and CP1 PASS.
- CP2's verdict recorded (SYNC-0 is not strictly required for CP3 — CP3 does not use the phone channel —
  but it must not be left in an unrecorded state).
- The procedure verification gate above, cleared and written into this section.
- A **fresh explicit owner grant** naming the outbound text, the deadline and the no-resend rule (§3).
  The previous single-send budget was consumed on 2026-10-18 and was never replenished.

**Steps** (the *shape* is fixed by the M1 contract; the *controls* come from the cleared gate)
1. Agree the outbound payload with the coordinator — correlation id, computed answer, expected token.
2. Owner approves the grant (§3) and watches the single run.
3. The agent performs exactly one send under the grant, then reads the reply, correlates it, consumes it,
   and records the negative case.
4. Negative case: a mismatched correlation / non-ChatGPT reply must be **rejected**, not reported as a
   successful turn.
5. An **independent reviewer** (not the agent that ran it) checks the positive *and* the negative proof.

**Pass / fail** — PASS requires all five M1 acceptance steps: outbound, real service, inbound,
AION introspection, negative case — with UTC event times, source refs, observed response, AION readback
and verifier acknowledgment. The adapter's verdict must be **accepted**, not `UNCERTAIN`; a refusal is a
FAIL and still consumes the send budget. Not sufficient: a GitHub comment, an agent echo, a fixture, a
screenshot, or your own copy/paste.

**Minimal receipt** — UTC send and reply times, the conversation URL, the reply text sha256, the outbound
payload sha256 and length, the correlation id, the computed answer, the verdict, the negative-case
result, and the independent reviewer's name and UTC. Store only minimized receipts. No cookies, no
tokens, no transcript dumps.

**Stop rule — reconcile never resends.** If the outcome is uncertain, treat it as `OUTCOME_UNKNOWN`:
read the target conversation yourself, then use the panel's **Resolve a stuck command** with
`It was delivered` / `It was not delivered`. Resolution **never sends anything again**. It may release
the operation lock **only** on a positive no-send or on a checked/validated reply. `Abandon it` is for
an operation the owner has decided to drop — it must not be used to clear the way around an
unresolved send. If the operation cannot be resolved it **stays unresolved** and is escalated. One
send per fresh grant.

**Approval boundary** — one real message to ChatGPT from a signed-in session, under the fresh grant in
§3. The parent updates `live_execution_authorized` in `STATE.json` per `STATE-PROTOCOL.md` once that
grant is issued; `m1_verified` becomes `true` only after independent acceptance.

**Rollback / recovery** — the conversation can be deleted afterwards. If a run leaves text in the
composer, a **human** clears it (select-all + delete). Note from the last attempt: ChatGPT syncs the
composer draft across tabs, so "open a clean tab" does **not** clear a draft.

---

### CP4 — V1 commander: one target, one command, one report-back

**What it proves:** the full V1 loop — phone → commander conversation → extension → one bound agent
conversation → reply → one report back into the commander — with caps, a loop guard and a kill switch,
plus negative cases that must send nothing.

**Prerequisites**
- CP1 PASS; CP2 verdict `PHONE_TURN_VISIBLE_WITHOUT_RELOAD` (Option A viable).
- The arm token in use (the default placeholder is `AION>`; the owner should pick a final token the
  model cannot produce by itself).
- One target conversation open in **exactly one** tab.
- A **narrow fresh grant** naming agents, count, rate and expiry (§3). This is separate from CP3's
  single-send budget — it spends units on two conversations (target + commander report).

**Steps** (exact, from the installer's live checklist steps 1–5)

1. **Bind an agent**: Agent = the target role, Adapter = `chatgpt.com conversation`,
   Ref = `https://chatgpt.com/c/<id>`, confirmation reference = yours → **Bind**. Open that conversation
   in exactly one tab.
2. **Grant**: Grant id = fresh, Agents = `<commander>,<target>`, Maximum sends = `2` (one send + one
   report), Expires in hours = `1`, Your grant reference = your instruction → **Create grant**.
3. From the **phone**, in the commander conversation: first line `AION> …` (arm token), then ask for
   exactly one `AION_CMD_V1` block: `op: send` / `to: <target>` / `text: <benign text>` / `nonce: <fresh>`.
4. Bus panel → **Scan commander now** (or tick **Scan the commander every 30 seconds**). Expect: one
   submit into the target, its reply, one `AION_REPORT_V1` in the commander; status reaches `CONSUMED`.
5. Negative tests — each must produce **no send**: (a) the same block again in an **unarmed** turn;
   (b) a block naming an **unbound** agent; (c) a re-scan; (d) **Stop the bus**, then an armed command →
   `kill_switch_engaged`.

**Pass / fail**
- PASS: exactly one send and one report, status `CONSUMED`, and all four negatives produce zero sends
  with a machine-readable refusal reason.
- Loop guard: a chain halts at the hop maximum (default 3) and shows `HALTED`.
- FAIL: any extra send, a report that re-enters as a new command, or a negative case that sends.

**Minimal receipt** — grant id, command id(s), state/delivery per command, refusal reason per negative,
hop count, UTC. No transcripts.

**Stop rule** — grant counts are decremented and **persisted before dispatch**, so a crash cannot
replenish authority. `Stop the bus` is the kill switch. Never hand-edit the ledger to re-arm.
`OUTCOME_UNKNOWN` is never resent.

**Approval boundary** — real messages to two of your own conversations, capped by the grant. Needs its
own grant; separate from CP3 and CP5.

**Rollback / recovery**
```powershell
node 'C:\0-BlackBoxProject-0\AION-integration-20261019\workspace\aion\ops\chrome-relay\bus\bin\aion-bus.mjs' revoke <grant_id>
```
plus `Stop the bus` / `Resume` in the panel. The ledger lives in the extension key `aion.relay.bus.v1`
and `%USERPROFILE%\.aion\bus\state.json` — **do not delete either to "reset" it** (see §4).

---

### CP5 — V2 local executor: one benign OpenCode sandbox task

**What it proves:** the commander loop can drive a **local** executor (OpenCode) — a scoped prompt
goes to one allowlisted directory, comes back with a real result, and the boundary holds.

**Prerequisites**
- CP0 PASS.
- A machine-local `host.config.json` in the bridge directory (`workspace\aion\ops\chrome-relay\bridge`).
  It is **not** in the repo and is **not** created by the install script — it must be created
  deliberately on the machine. Its keys are read directly by `bridge/src/config.js`
  (`expectedExtensionId` — which the entry point pins and **refuses to let a file change**,
  `agentPath` — absolute with forward slashes, `sessionCwd` — absolute, `allowedCwds` — array of
  absolute paths, `protocolVersion` — must be `1`).
- The grant cwd must appear **exactly** in `sessionCwd` or `allowedCwds` (exact match, never a prefix
  test). The built-in default `sessionCwd` is `C:/0-BlackBoxProject-0/AION` — the **main** repo, not the
  integration worktree. For a sandbox task, allowlist a dedicated directory deliberately.
- A **narrow grant** naming the executor, one send and a short expiry (§3).

**Steps** (exact, from the installer's live checklist step 7)

```powershell
$bus = 'C:\0-BlackBoxProject-0\AION-integration-20261019\workspace\aion\ops\chrome-relay\bus\bin\aion-bus.mjs'
node $bus bind  opencode --adapter acp --ref opencode --confirmed-by "<owner ref>"
node $bus grant --id g-oc --agents opencode --ops send --max 1 --hours 1 --cwd <allowlisted absolute path> --ref "<owner ref>"
node $bus send  --to opencode --text "<benign prompt>" --live
```

`send`, `dispatch-pending`, `observe` and `reconcile` refuse to reach an executor without `--live`
(ACP) or `--opencode-url` (OpenCode V2 HTTP). `--live` uses the bridge's `host.config.json`.

**Pass / fail**
- PASS: the reply contains the task's own answer and a `stop_reason`; the work stayed inside the
  allowlisted cwd; **OpenCode's own permission prompts were not auto-approved** (the bus never
  approves tool permissions).
- FAIL: the executor ran outside the allowlisted cwd, the bus auto-approved a tool permission, or a
  second command was accepted while one was in flight.

**Minimal receipt** — command id, persisted `executor_ref` (session id), the `stop_reason`, the cwd
used, UTC. No file contents.

**Stop rule** — one in-flight prompt per executor session; a second command is refused `executor_busy`.
Never auto-approve tool permissions. The ACP executor's observe path is in-memory and is **lost on
restart** — the command then stays `unknown` and is never resent.

**Approval boundary** — starts a local `opencode acp` process and runs one prompt on the PC inside one
allowlisted directory. No ChatGPT contact. Needs its own grant.

**Rollback / recovery** — `node $bus kill` stops dispatch; `node $bus revoke <grant_id>` removes the
grant. `--live` spawns the agent only for the duration of the command.

---

## 3. Approval templates — TEMPLATES ONLY, NOT ACTIVATED

Nothing below is permission. Each checkpoint needs its own grant, filled in, signed by the owner and
referenced by the grant record. A grant is spent, not reusable.

**Owner authority — one per checkpoint (CP2 / CP3 / CP4 / CP5)**

```text
AION_AUTHORIZATION_V1
granted_by: Owen
granted_utc: <UTC>
expires_utc: <UTC — CP2/CP3: +30 minutes; CP4/CP5: +1 hour>
host: OWNER_WINDOWS_MASTER
agents_allowed: <CP2: the commander | CP3: the one bound conversation | CP4: <commander>,<one target role> | CP5: opencode>
actions_allowed: <CP2: owner sends one ordinary message from the phone; the PC sends nothing
                 | CP3: ONE outbound message to chatgpt.com, then read the reply
                 | CP4: one send to the target plus one report back into the commander
                 | CP5: one prompt to one local executor session>
outbound_text: |
  <CP3: the three-line payload below | CP2/CP4/CP5: the bounded benign text or task prompt, <= 2000 chars>
cwd: <CP5 only: the absolute allowlisted path, exactly as it appears in host.config.json; "n/a" otherwise>
max_count: <CP2/CP3: 1 | CP4: 2 (one send + one report) | CP5: 1>
rate_per_hour: <CP2/CP3: 2 | CP4: 4 | CP5: 2>
deadline: if the run has not produced a verdict by <UTC>, stop and treat it as OUTCOME_UNKNOWN
no_resend: one send per grant unit. Never retry, never re-arm, never reuse a nonce or correlation id.
  If the outcome is uncertain, read the conversation yourself and use
  "Resolve a stuck command" to resolve it. It never sends again; it may release the lock
  only on a positive no-send or a checked reply. Do not send again.
ref: <owner instruction, where and when>
forbidden: cookies/tokens export, new logins, other tabs, credential export,
  Playwright/Puppeteer, bulk history reads, any second send
rollback: delete the conversation; clear any composer draft by hand;
  "Stop the bus" if the bus is involved; never delete bus storage keys or the runner state file
END_AION_AUTHORIZATION_V1
```

**CP3 outbound text — the only one with a fixed shape** (fresh correlation id, computed answer, matching
token; all new for that run):

```text
AION-M1-<YYYYMMDD>-WIN-<nonce6>
<computed answer, e.g. 53 + 29 = 82>
ACK-M1-WIN-<nonce6>
```

**Bus grant record — CP4 / CP5** (the machine-facing record the bus actually reads:
`grant_id, ref, agents, ops, max_count, rate_per_hour, expires_utc, cwd`)

```text
grant_id: g-<YYYYMMDD>-<letter>
ref: <owner instruction, where and when>
agents: <CP4: <commander>,<one target role> | CP5: opencode>
ops: send
max_count: <CP4: 2 | CP5: 1>
rate_per_hour: <CP4: 4 | CP5: 2>
expires_utc: <UTC, +1 hour>
cwd: <CP4: n/a | CP5: the absolute allowlisted path, exactly as in host.config.json>
outbound_text: <benign bounded text or sandbox task prompt>
no_resend: one send per grant unit; the grant count is persisted before dispatch, so a crash cannot
  replenish authority. Never hand-edit the ledger to re-arm.
stop: "Stop the bus" in the Bus panel halts all dispatch; a second command to the same executor
  session is refused executor_busy
rollback: node <bus>/bin/aion-bus.mjs revoke <grant_id>  (and, for CP5, node <bus>/bin/aion-bus.mjs kill)
```

---

## 4. Known remaining limits (read before promising a result)

- **ACP late results are not durable.** The ACP executor's observe path uses an in-memory buffer; a
  restart loses it and the command stays `unknown` — never resent, but also never resolved
  automatically.
- **The Windows location of the OpenCode 2.0 service state file is UNVERIFIED.**
  `bus/opencode-service.js` guesses `XDG_STATE_HOME`, `~/.local/state`, `%LOCALAPPDATA%\opencode`,
  `%LOCALAPPDATA%\opencode\state` — in that order — and the comment in the file says so. `--opencode-url auto`
  can fail with `opencode_service_not_found`; pass `--opencode-url http://127.0.0.1:<port>` or
  `--opencode-state <file>`. Starting the service is an owner action (`opencode service start`).
- **Event names are unverified against a live run.** `commander.gap`, and the ACP `session/update` →
  `task.progress` mapping, are defined and unit-tested, but never observed in a live ChatGPT or ACP
  exchange. Treat the first live run as the naming reference.
- **The model registry caches old defaults.** The OpenCode agent registry and
  `workspace/aion/ops/opencode-models/ROUTING.json` still advertise the previous subagent defaults
  (deepseek), while the actual live sessions run **MiniMax M3.1 Flash Free**. Trust the live session,
  not the cached registry; the registry refresh is the parent's call (§1, §5). `ROUTING.json` also still
  claims `opencode/minimax-m3.1-flash-free` is absent from the catalog — it is active again
  (variants low/medium/high/xhigh/max), so that snapshot is stale.
- **`STATE.json` `bus_direction` is stale** relative to `bus/README.md` (see §1, §5).
- **The merged tree is not committed or pushed.** Conflict files are resolved and staged; final suite
  evidence is pending (CP0). `main` stays at `7ffb434`; no combined commit exists yet.
- **The bridge flake is resolved.** The test now awaits `w.relay.host.ensureSession()` before `HOLD`
  (400 ms prompt timeout kept, production code unchanged). Full bridge **126 passed / 1 opt-in skip**
  at 16:24:41Z, targeted re-run passed at 16:24:19Z, on merged commit `fd347f22`. CP0 functional
  checks **PASS**; final review, the docs commit and publication are separate and still open.
- **Never delete the bus storage key or the runner state file.** `aion.relay.bus.v1` (extension) and
  `%USERPROFILE%\.aion\bus\state.json` (runner) hold the durable no-resend records and tombstones.
  Deleting them to "reset" would destroy the evidence that an operation was attempted and could permit
  a resend. The reviewed path is the explicit `Reset an unreadable bus ledger` control (which
  **quarantines** for inspection) or the runner's `reset` command — use it only under separate owner
  authority, snapshot it first, record a minimized receipt of what was quarantined, and never use it to
  bypass an unresolved operation. If an operation cannot be resolved, it stays unresolved.
- **General security tests exist** (bridge host-safety: origin pin, hostile-cwd refusal, frame clamp;
  bus injection/hostile-input and crash-matrix suites) and are **not** a blocker. The excluded WIP work
  item (a redaction/scrubber parity test) is **optional backlog**, kept **separate** — it is not
  ACP/HTTP protocol capability parity, and it does not come from lane X1.
- **Two executor paths exist and are not interchangeable.** The Bus V2 ACP executor (over the native
  relay) and the OpenCode 2.0 shared-service adapter (over loopback HTTP) have different capabilities
  and lifecycles. `workspace/aion/ops/opencode-2/ACP-AND-SERVICE-PROTOCOL.md` is explicit: do not claim
  V2 ACP / shared-HTTP parity by feature name alone. Coordination lane X1 is research/design on the
  latter and is **not** an implementation or an acceptance.
- **M1 is not close to accepted.** The last real attempt produced a correct ChatGPT reply
  (correlation `AION-M1-20261018-WIN-4f7b21`, answer `82` from `53 + 29`, reply sha256
  `48fcf8af3c03816961de150e53d0073f38c12d5bb82e346e9c334f4bb7ead1db`, 48 normalized chars) but the
  adapter's own verdict was `turn_refused: generation_incomplete`. The reply was right; the *proof* was
  not. Do not present the 2026-10-18 evidence as an accepted turn.
- **The live outcome is a real send, but not an accepted turn.** A real AION-originated prompt reached
  ChatGPT at 17:04:16.8683372Z (native UIA `InvokePattern` on the real Send control) and the reply was
  machine-read at 17:05:00.7053692Z. It is **not** the extension submit path, **not** an accepted
  relay envelope, and it has no independent negative case and no independent review, so
  **`m1_verified` stays false**.
- **Full live execution remains active.** `live_execution_authorized=true`; the completed trial does
  not consume ongoing owner authority. Reconcile uncertainty instead of automatically resending.
- **The loaded extension path was never confirmed.** The P2 build-mismatch suspicion (missing
  `ARCHIVE_KEY` vs integrated source) is **unproven** — the actual loaded path is still unknown, and
  the DevTools archive attempt failed before any write.
- **Durability is proven only against storage fakes** — not a real MV3 worker restart or page reload.
- Standing rules: no Playwright, no Puppeteer, no Orca, no credential/cookie/token export, no bulk
  history reads, no force-push, no destructive git.

---

## 5. Decisions needed (owner or parent — not for an agent to assume)

1. **Option A or Option B** for the V1 channel — or "decide after the SYNC-0 verdict" (CP2).
2. **Final arm token.** `AION>` is a placeholder; the owner should choose a token the model cannot
   produce by itself.
3. **Hop limit and per-agent rate defaults** (implementation default is `max_hops` 3).
4. **Which agents are commandable first** (suggested: one chat agent, then OpenCode) and whether the
   genealogy tree in the Bus decision record §6 is the registry the owner accepts.
5. **Report-back form**: verbatim bounded text, or a hash plus a summary.
6. **`STATE.json` `bus_direction`** — reconcile `implemented:false` / `docs_only:true` with the
   offline-complete bus code. Out of scope for this doc-only edit; the parent owns it.
7. **Model registry refresh** (`ROUTING.json`) so the cached defaults match the live MiniMax sessions.
8. **CP5 sandbox root** — the default `sessionCwd` is the main AION repo; decide whether CP5 targets a
   dedicated sandbox directory instead.
9. **Whether the dormant `oh-my-openagent.json` primary (`sisyphus`, claude-opus-4-7) stays as is** —
   it is not active server-side, so it has no runtime effect today.
10. **Coordination lane X1 (OpenCode 2.0 adapter research/design).** When may that research become
    implementation, and where does its output land — a design note in the repo, or a proposal held in
    the session? Nothing it produces counts as implemented, accepted, or a parity claim. The
    read-only-relative-to-integration boundary is a **request the parent will make**, pending that
    session's ACK; it is recorded here as a requested boundary, not as an enforced fact, and this
    tracker does not assume the session is paused, running or finished.
11. ~~Bridge-flake disposition~~ — **RESOLVED**: test-only fix; bridge 126 passed / 1 opt-in skip at
    16:24:41Z, targeted re-run passed 16:24:19Z. No waiver needed.
12. **Which checkout CP1 exercises.** The **native host is confirmed** to run the original checkout's
    bridge (`7ffb434`); the **unpacked extension path is unknown** pending an owner look. Re-point both
    at the merged revision `fd347f22`, or test the original checkout's own state? The decision decides
    what a CP1 receipt means, so it is the parent's call before CP1 starts. The original checkout is
    now dirty with research-session docs (which do not touch the bridge) and must not be updated,
    switched or cleaned.
13. **Which path is canonical going forward** — the extension submit path (fills the composer but does
    not activate Send) or the native-UIA path (works end to end, but bypasses the extension). The owner
    asked for a freeze, so this is a decision for the next working session, not for now.
14. **Where the seven bounded issues are logged.** Parent owns Git; §1b is the source list.

---

## 6. Prior tracker — preserved

Everything below is the previous tracker, kept for history and for context. Where it conflicts with §1
or §2, **§1 and §2 win**. The corrections applied are limited to status wording for the Bus lane
(it no longer reads "all TODO, none started": the bus code exists and passes offline, and what is
missing is Windows and live verification) and to a mapping of the old `T*` rows onto the new
checkpoints. No prior item was deleted.

**Mapping of the prior active todo list onto the checkpoints**

| Old | Now | Note |
|---|---|---|
| T1 reload the pinned extension | **CP1** step 3 | first on the merged build |
| T2 open a fresh empty chatgpt.com tab | CP1/CP3 prep | ChatGPT syncs composer drafts across tabs — a new tab does not clear a draft |
| T3 side panel: tab listing + read-only PING | **CP1** steps 1 & 4 | read-only native PING is inside the verify script |
| T4 one owner-authorized benign correlated run | **CP3** | blocked behind the procedure verification gate |
| T5 capture send/reply/consume + wrong-correlation rejection | **CP3** | negative case is part of the same checkpoint |
| T6 update STATE.json / `m1_verified` after independent review | **CP3** close-out | parent owns the state change |
| T7 ChatGPT workspace entitlement for custom MCP | backlog (Option B) | Plus is **not** an established entitlement |
| T8 tunnel + restricted runtime key | backlog (Option B) | no credentials in git |
| T9 `Connect-AionTunnel.ps1` → doctor + tunnel | backlog (Option B) | — |
| T10 add connection in Plugins, call `aion_state` | backlog (Option B) | — |
| T11 update TODO/STATE for the #28 lane | backlog (Option B) | — |
| T12 `Complete-AionBus.ps1` one-command offline bootstrap | **CP0** / **CP1** | superseded by `Install-AionBus.ps1` (Verify / Install / LiveChecklist / Rollback) |
| T13 item-5 fixture validation | CP0 area | still needs a DOM-parser route; not a checkpoint blocker |
| T14 review/merge `origin/review/narrow-web-accessible-resources` | **DONE** — merged `f32b8bf` | — |

### Resume 2026-10-18T18:33Z — post-merge state and active todo list

**Sync:** tree clean, fast-forwarded `82ce564 → 076ddc2` (12 commits), `HEAD...origin/main` = `0 0`,
nothing to push. `AION-Sync` scheduled task and `aion-sync.ps1` were **not** invoked; this sync was
manual. New remote branch observed (unmerged): `origin/review/narrow-web-accessible-resources`.

**New lane landed in that range (not yet tracked below):** the read-only private MCP ingress pilot
(`workspace/aion/ops/aion-mcp/`) plus its completion pack (`FINISH-LINE.md`) and hosted Windows/Linux
CI (`.github/workflows/aion-bus-ci.yml`). Ownership: issue **#27** = Chrome/ACP website lane,
issue **#28** = ChatGPT custom MCP plugin lane. These are two entry points into the same bus, not
competing ACP buses.

**Fresh receipts from this resume (2026-10-18T18:33Z, local Windows):**
- `workspace/aion/ops/aion-mcp` — `node --test tests/*.test.mjs`: **7 tests / 7 pass / 0 fail /
  0 cancelled**, exit 0. This closes the FINISH-LINE "MCP stdio tests — Windows pending" cell.
- `node bin/verify-local.mjs`: **PASS**, 6/6 checks (initialize, tools, state, challenge, receipts,
  refusal), `chatgpt_connected: false`, `source: local-process`, exit 0. Offline read-only probe
  only — it proves the server, **not** a ChatGPT connection.

### Active todo list (as written 2026-10-18; statuses preserved, see mapping above)

| # | Item | Lane | Status | Blocked by |
|---|---|---|---|---|
| T1 | Reload the pinned extension in Chrome Profile 3 so the merged build is live | #27 | TODO | local executor; no owner click required |
| T2 | Open a fresh empty `chatgpt.com` tab (never touch the preserved draft) | #27 | TODO | local executor; T1 |
| T3 | Side panel: tab listing + read-only PING must pass | #27 | TODO | T1, T2 |
| T4 | One owner-authorized benign correlated `run-turn` on the empty composer | #27 | TODO — **irreversible** | T3 |
| T5 | Capture send/reply/consume + wrong-correlation rejection; minimized receipt into issue #27 | #27 | TODO | T4 |
| T6 | Update `STATE.json` / `m1_verified` only after an **independent** reviewer checks positive *and* negative proof | #27 | TODO | T5 |
| T7 | Confirm ChatGPT workspace entitlement for custom MCP (`+ Add custom MCP server → Tunnel`); Plus is **not** an established entitlement | #28 | TODO | owner, real web workspace |
| T8 | Create/reuse a tunnel in platform.openai.com + restricted runtime key; no credentials in Git | #28 | TODO | T7 |
| T9 | `windows/Connect-AionTunnel.ps1 -TunnelId <id>` → `doctor` + foreground tunnel to `node src/server.mjs` | #28 | TODO | T8 |
| T10 | Add the private connection in Plugins, call `aion_state` from a fresh web chat, keep the read-back receipt | #28 | TODO | T9, entitlement |
| T11 | Update `TODO.md` + `STATE.json` for the #28 lane; no false promotion if entitlement is absent | #28 | TODO | T7–T10 |
| T12 | Run `windows/Complete-AionBus.ps1` as the single one-command offline readiness bootstrap (re-verifies HKCU `com.aion.relay`, runs all four suites, writes the sanitized receipt) | both | TODO — not yet run on this resume | — |
| T13 | Item 5 fixture validation: run `readFinalReplyAfterLastUserTurn` against the parsed fixture DOM; selector counts are not a behavioural test | #27 | TODO | needs a DOM parser route |
| T14 | Review or merge `origin/review/narrow-web-accessible-resources` | — | DONE — merged `f32b8bf` | — |

**Not to be claimed:** any ChatGPT website turn, any custom-plugin tool call, `m1_verified`, or
end-to-end ChatGPT→ChatGPT execution. T4 is the only irreversible action; after a send, treat
disconnection as `OUTCOME_UNKNOWN` and **never** auto-retry.

### Merge 2026-10-18T19:14Z — `review/narrow-web-accessible-resources`

**Merged:** `origin/review/narrow-web-accessible-resources` (`ff54d6e`) into `main` with
`git merge --no-ff --no-edit`, producing merge commit **`f32b8bf`** (parents `3ea1b1e` local,
`ff54d6e` review). Clean `ort` auto-merge; no stash, reset or force. Three commits absorbed:

- `0a8cf75` — `web_accessible_resources` narrowed to the exact content.js import closure
  (`lib/envelope.js`), with a manifest closure test; live Chrome re-verification still pending.
- `673795b` — side-panel redesign (task-ordered layout, 3-step connection test, folded detail).
- `ff54d6e` — guided human view + read-only machine view.

**Pre-merge local commits (owner-approved):** `4e2caa0` — answer `ping`/`state`/`stop` over the
port (synchronous-return forwarding through the exactly-once `respond` guard, +5 listener tests);
`3ea1b1e` — tracker refresh. Both in-flight fixes survived the merge: the listener return
forwarding and the `lib/envelope.js` import narrowing.

**Deliberately excluded:** `WIP-native-transport-first-attempt` (`57baf51`) — explicitly superseded and
**not** merged; its only unique content is an obsolete add/add test importing exports that do not
exist.

**Evidence scope — offline only.** The merge and all suites are local/offline. No extension reload,
no `chatgpt.com` tab, no correlated turn, no custom-plugin tool call. T1–T5 and T7–T11 stay open;
`m1_verified` is unchanged.

## Owner's top-level goals — 2026-10-18

### Autonomous local loop — owner instruction, 2026-10-18

- Coordinator owns build/test/deploy/reload, diagnostics, bounded fixes, evidence reconciliation and final reporting; the owner is not the routine click/relay operator.
- Baseline `fa5773e`: coordinator independently ran extension 335/335, bridge 119/119, MCP 7/7 and adapter 35/35, all exit 0, no failures/cancellations/skips. These are offline receipts, not browser acceptance.
- One live operator only: task `ses_eaf8b63a9ffe391WMvPcmrJ6ro`. Initial dispatch failed with `getaddrinfo ENOTFOUND opencode.ai`; revival was requested. Host task status is unconfirmed; neither launch acknowledgement nor a running label proves browser progress.
- Require a concrete action/UTC/receipt checkpoint before claiming progress or assigning a replacement operator. No live-send outcome is currently established by this entry.
- Loop: reproduce -> regression test -> minimal fix -> full relevant tests -> reload exact installed extension -> read-only ping -> one authorized correlated send -> capture/readback -> wrong-ID rejection -> independent acceptance review.
- Never overwrite drafts, weaken sender/approval boundaries, retry an uncertain send, automate login, collect credentials, or use Orca/Playwright/Puppeteer. An inaccessible account/permission is a blocker, not permission to bypass it.
- Update the tracker and minimized receipts at real phase boundaries. Keep `m1_verified=false` until independent review of real positive and negative evidence; machine-readable status alone does not establish an ACP execution path or hidden-model introspection.

1. **Pure ChatGPT introspection:** named agents on `chatgpt.com` interact with agents on `chatgpt.com`, using the AION repo as HQ. A local-runtime-originated browser probe is supporting transport evidence, not proof of this full goal.
2. **ChatGPT → Windows execution → ChatGPT:** a ChatGPT-hosted agent sends a scoped prompt to OpenCode or ZCode on the owner's Windows PC and reads its actual response without owner copy/paste. OpenCode remains the first execution target; ZCode is deferred, not silently enabled.
3. **Execute through the AGENTS mental model:** owner direction recorded; **the definition is owed by Chief 05 and is still pending** — see the request appended to `workspace/aion/sessions/roles/05-chief-of-chiefs/SITREP.md` (2026-10-18, authored by the local OpenCode coordinator, **not** Chief-authored or ACKed). Until Chief 05 answers, the reading below is a coordinator **proposal only**, not the model.

**Coordinator's proposed interpretation, pending that definition:** stable named agent roles, explicit task ownership and correlated handoffs, bounded authority, evidence-backed completion, and repository-based continuity.

Proposed gates — **coordinator PROPOSALS for Chief 05's model, not Chief-approved; planning only, none asserted passed:**
- **G1:** two named ChatGPT sessions exchange one fresh correlated task/reply; initiating agent reports a checkable answer detail; a mismatched reply is rejected. No owner relay.
- **G2:** one bounded multi-turn ChatGPT↔ChatGPT task produces a checked result and stops at its turn/budget limit; repository references preserve continuity across a fresh invocation.
- **G3:** ChatGPT requests a benign Windows diagnostic from OpenCode and consumes the correlated response; unavailable executor is reported honestly.
- **G4:** ChatGPT delegates a bounded sandbox code/test task, consumes exit status and artifact/commit evidence, and reports the result; duplicate dispatch and out-of-scope requests are refused.
- **G5:** AGENTS-role ownership, handoff, restart/uncertain-outcome behavior and stop boundaries demonstrated on one real task, once the mental model is confirmed.
- **Acceptance owner:** independent reviewer for actual M1; OpenCode coordinates execution evidence. GitHub persistence does not wake agents; browser DOM access is not access to hidden model internals. These goals do not widen the existing single-probe authorization.

## Situational awareness planning — owner scope confirmed 2026-10-18

- **Scope confirmed:** account-wide most recent **50 conversations in the currently selected ChatGPT workspace**, plus **all observed older pinned conversations**. Deduplicate the union; older pins do not consume the recent-50 allowance. Open tabs are a separate inventory, including chats outside that union.
- **Requested metadata/capabilities:** projects, conversation titles and observed IDs/links, existing AION-agent bindings, ChatGPT conversation pins, open/selected tabs, switch conversation, open a new tab/new conversation, and bounded orchestration. Chrome tab pinning is a different field from ChatGPT conversation pinning.
- **Planning only:** this confirmation scopes the plan; it does not itself start bulk account collection, read message bodies, send prompts, modify pins/projects, or launch a continuous monitor. Raw titles/IDs stay local by default; GitHub receives minimized receipts and approved role bindings.
- **Truth contract:** open tab != generating agent != task running; named AION agent != necessarily custom GPT; missing/unobserved fields remain UNKNOWN. UI order or Chrome last-access time must not be mislabeled as verified conversation-update time. A partial sidebar cannot prove the latest 50 account-wide.
- **Ownership:** Chief 05 owns agent semantics and acceptance; 06 TOOLSMITH capability contracts; 03 operations coordinates; local OpenCode drafts implementation plan/tests on existing extension and role registry. Repo recon: `ses_eb10359e7ffe4UOcblvHhBMjQJ`; public-source research: `ses_eb1032b1affexb7yCItN6WIoDx`; parent validates both. Existing single-probe work stays separate.

## Active owners — resumed 2026-10-18

- **Execution and final validation:** OpenCode coordinator.
- **Worker/native integration and ChatGPT port driver (items 3–4):** fixer, session `ses_eb180b3d8ffeLm7dKbsiur6KwB`.
- **Transport/host safety corrections:** fixer, session `ses_eb5474ccfffed9NlaG7EdDh2RF`. Scope excludes worker and port driver.
- **Safety review:** oracle, session `ses_eb142ccacffeBC4cQfP3Y8UIrF`; reviewed the delivered transport/host corrections and returned PASS. Final content preflight remains separately gated before sending.
- **Independent M1 acceptance:** a separate reviewer, after a real receipt exists; not yet assigned.
- **Local infrastructure and disk:** PC HQ. AION does not clean storage or change that ownership.
- `AION-Sync` was observed **Disabled** on resume. Left unchanged; coordinator uses explicit commits.
- **Panel controls:** designer delivered timeout/replay safeguards and durable regression tests; coordinator independently ran `bun run test -- tests/panel-controls.test.js`, **27/27 PASS** on 2026-10-18. Integration validation still pending.
- **Progress receipt:** posted and independently read back at https://github.com/owenservera/aion/issues/27#issuecomment-6249455037 (2026-10-18T11:37:52Z). This is progress evidence, not a live-turn acceptance receipt.
- **Safety corrections:** coordinator independently ran transport suites **58/58** and full bridge suite **119/119** after oracle review. The initial real framed `relay.hello` failed because it eagerly called `session/new`, then lost the request ID on error. Corrected: hello initializes capabilities only; sessions are created lazily for dispatch; errors preserve the request ID.
- **Real host/ACP probe, 2026-10-18T11:47:29.920Z:** framed host ping and hello returned `ok:true`, `agentInfo:{name:OpenCode,version:2.0.32}`, protocol 1 and `session.created:false`. This used process pipes, **not Chrome**, so the Chrome boundary remains unverified. No prompt was sent.

Latest historical green baseline: extension **142/142**, bridge **96/96**, adapter **35/35** (273 total). These counts are not proof that the pending integration works.

**Integration reconciliation, 2026-10-18:** coordinator ran the full extension suite after all three initial writers finished: **248/248 PASS**, normal exit (~4.9s). Worker/port integration is implemented. Two concrete seams are being corrected before reload/send: panel must forward the existing authorization reference; content must expose/enforce exactly one visible composer and preserve existing drafts. Fixer `ses_eb11f0811ffeBDYzeJ5FzlVbcu` owns mechanical panel wiring/tests; fixer `ses_eb180b3d8ffeLm7dKbsiur6KwB` owns content/driver preflight/tests; OpenCode owns validation and live execution. No new ChatGPT send has happened.

**Existing Chrome warning observed during read-only diagnostics:** the AION error page contains a prior dynamic-import fetch failure for `src/chatgpt/content.js`. This is not yet classified as a current-source defect: reload the finished extension and refresh the target ChatGPT page, then reproduce/read-only ping before changing the loader or manifest. No account contents were extracted.

**Correction to the extension suite count — 2026-10-18.** An independent full extension run reported **269 tests: 267 passed, 2 cancelled, process exit code 1.** The specialist's earlier **267/267** summary is **not accepted as full-suite evidence**; it omitted the 2 cancelled tests and the non-zero exit. Cause under investigation: test timeouts. **Worker/port fixer `ses_eb180b3d8ffeLm7dKbsiur6KwB` owns resolving them.** The 248/248 reconciliation line above predates this run and is not the current status. Until a run finishes with exit 0 and nothing cancelled, the extension suite is **PARTIAL**, not green, and neither 267/267 nor 248/248 may be cited as current proof.

---

## Suite counts — Windows

**Current verified build, 2026-10-18T12:16Z:** coordinator independently ran `bun run test -- --test-timeout=60000` in extension: **273 tests / 273 passed / 0 failed / 0 cancelled / 0 skipped, exit 0**. Full bridge `bun run test`: **119/119**, failed/cancelled/skipped 0, exit 0. These supersede the cancelled run above. Final independent oracle send-boundary review returned PASS (artifact review, not live proof).

**Reload receipt, 2026-10-18T12:16:55.7623412Z:** native Windows UI Automation invoked the Reload control belonging specifically to the AION extension card, in existing Chrome window 1835904. No Orca/Playwright/Puppeteer used. The console rendered in an ordinary extension tab but correctly rejected requests with `sender_not_trusted: sender_is_a_tab`; preserve that boundary. Actual side panel must be opened before host testing. Toolbar activation through available UIA patterns has not produced an observed side panel; request one manual AION-toolbar click rather than weaken sender checks or claim a handshake.

The table below is the **historical initial Windows baseline**, not current suite counts.

**Real Chrome boundary receipt, 2026-10-18:** owner opened the actual side panel; coordinator independently observed `Close side panel` and nested AION document through UIA. At **12:25:04.371Z** invoked its CHECK HOST control. Observed reply: `Transport: CONNECTED`, `Status: VERIFIED`, detail `Host answered relay.ping. Transport liveness only: not executor acceptance, not proof.` At **12:25:26.792Z** invoked INITIALIZE ACP and observed `ACP_INITIALIZED` plus acknowledged `relay.hello`; panel protocol/version/capabilities remained UNKNOWN due a response-normalization defect, not a reported initialization failure. No ChatGPT send.

**Live contract defects under correction:** driver emits `{tab_id,url}` while panel accepts only `{id,url}` (0 tabs listed / 1 rejected); worker normalizer drops numeric protocol and real nested agentInfo/agentCapabilities. Same fixer owns bounded corrections and cross-component regressions; preserve strict sender checks. Actual ChatGPT home tab selected at **12:26:44Z**; read-only UIA detected nonempty composer value (12 chars; contents not logged). Preserve it—do not refresh, clear or submit that draft. Use a separate bounded probe tab if needed.

**Live contract defects RESOLVED and re-verified in Chrome, 2026-10-18T12:45:16Z:** after owner reloaded the extension and opened a fresh second chatgpt.com tab, the side panel showed `Protocol: 1`, `Version: 2.0.32` (OpenCode), detail `Host acknowledged relay.hello (ACP initialize). No ACP session is claimed by this step.` Tab list correctly reported **1 tab listed** with driver-shaped ids. ACP capabilities report 0 names by deliberate allowlist. No send occurred.

**CONTENT SCRIPT ROOT CAUSE (open, assigned 2026-10-18T12:46:58Z):** `aion/chatgpt-ping` reports `FAILED - port_closed` against a signed-in tab with a visible composer. Chrome's extension error console shows `[aion-relay] content module failed to load: TypeError: Failed to fetch dynamically imported module: chrome-extension://<uuid>/src/chatgpt/content.js` raised from `src/chatgpt/loader.js:13`. Manifest `web_accessible_resources` sets **`use_dynamic_url: true`**, so Chrome serves those files under a rotating per-session dynamic URL; `loader.js` dynamic-imports the fixed `chrome.runtime.getURL('src/chatgpt/content.js')` path and therefore 404s. Site access itself is granted. Fixer (session `ses_eb0f2d300ffeTXEahsXpMOuCCA`) owns the minimal manifest + regression-test correction; OpenCode reloads and re-verifies before any send. This is a code defect, not an account, network or ChatGPT-side failure.

**Review follow-up, 2026-10-18 (Linux review of 82ce564):** extension suite re-run independently **281/281 (exit 0, 0 cancelled)**, bridge **119/119**, on Node 22.22. The `use_dynamic_url:false` fix is **committed but NOT yet re-verified in live Chrome**: reload the extension, refresh the chatgpt.com tab, re-run `aion/chatgpt-ping`; the content-script root cause above stays open until that receipt exists. Exposure narrowed: `content.js` now imports `lib/envelope.js` directly and `web_accessible_resources` lists exactly its 3-file closure (no `src/lib/*.js` glob), enforced by a new manifest test (extension now 282 tests). Bridge `engines.node` raised to >=22 (the version actually exercised).

| Suite | Expected (Linux, per issue) | Windows actual | Status |
|---|---|---|---|
| Extension | 120 | **120/120** | DONE |
| Bridge | 84 (+ item 1 tests) | **96/96** | DONE |
| Adapter | 35 | **35/35** | DONE |
| **Total** | | **251/251** | DONE |

All three were run on Windows for the first time. All match the issue's expected counts.

---

## Items

### 0. Preflight — **DONE**
- Chrome installed **155.0.8059.82** vs `minimum_chrome_version: 155` → **no lowering needed**
- Disk **5.9 GB free** (was 1.10 GB earlier today; PC HQ owns and is managing this)
- Extension id pinned: `kgjfielmhcdlggjppmliabpiljnonhki`
- Working tree clean, in sync with `origin/main`

### 1. Bridge entry point + launcher — **DONE**
Origin-sourcing defect fixed. `handleFrame` had expected the **first framed stdin message** to be the
extension origin; Chrome passes it as `argv[1]`, so the host would have refused every real
connection with `origin_missing`.

- `src/host.js` — `applyOrigin()` runs the NM-02 check once from argv; the self-asserted first-frame fallback was removed by the safety correction
- `bin/aion-relay-host.mjs` — entry point; `extractExtensionId()` normalises to the bare id; exits 2 with no origin
- `native-host/aion-relay-host.cmd` — launcher (CreateProcess cannot run `.js`/`.mjs`)
- Outbound frames clamped to Chrome's **1 MB** host→extension limit
- `tests/host.test.js` — 12 new tests

**Receipt:** bridge 96/96. Launcher accepts the origin from the command line and writes **0 bytes to
stdout** (ACP-10). No-origin invocation exits 2.

**Not yet proven:** connection persistence under a real Chrome session — comes with item 2.

### 2. Register the native host (FLOW step 1) — **DONE**
**Installed, read back independently.** No UAC was required or shown — HKCU is the current user's hive.

| Step | Result |
|---|---|
| Registry key | `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.aion.relay` |
| Key value (default) | `C:\Users\VIVIM.inc\AppData\Local\AION\relay\manifest.json` |
| Independent read | `reg.exe query` confirms the `REG_SZ` value (different code path than the PowerShell provider) |
| Manifest `name` / `type` | `com.aion.relay` / `stdio` |
| Manifest `path` | `…\bridge\native-host\aion-relay-host.cmd` — exists |
| `allowed_origins` | `chrome-extension://kgjfielmhcdlggjppmliabpiljnonhki/` — matches the pinned id |

The real manifest lives in `%LOCALAPPDATA%\AION\relay\`, **outside the repo**, because it carries a
machine-specific absolute path. The repo keeps only `manifest.template.json`.

**Live verification from the registered path:**
- correct origin → `origin accepted` + `ready for extension kgjfielm…`, **0 bytes on stdout** (ACP-10)
- wrong origin → `refused extension aaaa…; this host will execute nothing`

**Two bugs found and fixed during this step:**
1. The entry point logged `ready for extension <id>` *even when it had just refused that origin*. The
   refusal worked, but the log claimed readiness. Now reports refusal honestly.
2. `host.close()` — the host API has no `close()`. It has `stop()`. That would have thrown on every
   shutdown. Caught by reading the API surface, not by a test.

Bridge suite re-run after the fix: **96/96**.

**Rollback:** `Remove-Item 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.aion.relay'`
(optionally also delete `%LOCALAPPDATA%\AION\relay\`). No repository data is affected.

**Known risk, untested:** Chrome launches the host via `CreateProcess`. Whether it accepts a `.cmd`
shim is **not yet proven** — only *we* launching it is proven. If Chrome refuses, the fallback is a Node
SEA single-executable build or a compiled shim. This surfaces in item 3.

### 3. Service-worker native adapter (FLOW step 2) — **PARTIAL**
**Extension load observed, 2026-10-18T11:32:23Z:** owner loaded unpacked extension. Coordinator independently read `Profile 3/Secure Preferences`: pinned ID `kgjfielmhcdlggjppmliabpiljnonhki`, location 4 (unpacked), exact repository extension path. Native Windows UI Automation also found the `AION Chrome Relay Station` card in the existing Chrome Extensions window. No Orca used. This proves installation/registration, not worker health or the ACP handshake. Reload after pending source fixes before live use.

The worker now wires the real native adapter and storage lifecycle, covered by the integrated extension suite. Reviewed safety fixes bound port/disconnect retry, guard stale callbacks, require envelope validation and report connection state only after a correlated host reply. No live Chrome handshake has been proven.

### 4. Port driver for the content script — **PARTIAL (implemented; live verification pending)**
`content.js` listens on port `aion-chatgpt` (`ping`, `state`, `run-turn`, `read-final`, `stop`).
Worker/panel now use `chrome.tabs.query({url:'https://chatgpt.com/*'})` → `chrome.tabs.connect`, with durable per-correlation dispatch reservations and no automatic send retry. Final composer preflight correction is pending. Prove `ping` first (read-only).

### 5. Check node D offline — **PARTIAL — fixture validation still required**
Checked against `sessions/01-escape-hatch/adapter/fixture-live-2026-10-16.html`.

**Correction on resume:** selector counting alone was insufficient. `content.js` includes class-based user/assistant fallback selectors (lines 203–245), so absence of role attributes does **not** prove incompatibility with this fixture. The actual extraction function still needs to be exercised on parsed fixture DOM. No composer is present in the fixture, so that part remains a live preflight check.

| Selector the live code uses | Occurrences in the fixture |
|---|---|
| `#prompt-textarea` | **0** |
| `[data-message-author-role]` | **0** |
| `markdown` class | 2 |

The fixture is a **sanitized mock** using class-based selectors (`group/user-message`, `text-size-chat`). The adapter also contains fallbacks for class-based markup. The earlier conclusion below was not established by an executed extraction test and is superseded:

- **Extraction against the fixture remains unverified**, rather than proven impossible. Run `readFinalReplyAfterLastUserTurn` on a parsed DOM and assert the output; do not substitute selector counts for a behavioral test.
- **The "exactly one visible composer" check cannot be done offline at all**, because the fixture has no
  composer. The issue's warning that "the Linux adapter once hit two candidates with broader selectors"
  is **not** testable from this fixture. It needs the real page (item 7) or a purpose-built fixture that
  actually contains a composer.

The Node tests do not currently provide a full DOM parser. Browser `DOMParser` remains a zero-new-dependency route for a real fixture regression once the extension's diagnostic page is available. Lack of a Node parser is not an owner-approval gate.

**Consequence:** node D stays `BLOCKED` until the live run. Its extraction logic is covered by unit tests
against constructed DOM stubs — weaker evidence than the fixture was assumed to give.

### 6. Negative case, offline first (FLOW step 4) — **DONE**
No send required, exactly as the issue predicted. `tests/chatgpt-correlate.test.js` re-run on Windows.

**12 negative cases, all passing:**

- reply carrying a **different** correlation id → rejected
- **near-miss** id that merely extends ours → rejected
- reply carrying **our id AND a foreign id** → rejected as ambiguous
- empty / missing reply → rejected
- non-string candidate → rejected as bad input, not coerced
- expectation with no correlation id → refused outright
- reply that **never** carries the correlation id → rejected
- reply carrying the **token but no correlation id** → rejected
- **echoed outbound text** with no answer → rejected
- echo repeating **only part** of the instructions → rejected
- **the user turn read as the reply** → rejected on provenance
- a short protocol marker is never flagged as an echo by text alone

This proves offline rejection behavior only. It does not establish M1 acceptance or a real ChatGPT round trip.

### 7. Live round trip (FLOW step 3) — **TODO — IRREVERSIBLE** → see **CP3**
One correlated benign message, capture the reply, verify the correlation. The message **cannot be
unsent**; the chat can be deleted afterwards. Prefer a **per-run id and a computed answer** (hash prefix
of a nonce) over the fixed `ACK-M05-COC-001` echo, which discriminates better.

### 8. Record receipt — **TODO** → closed out at the end of **CP3**
Comment on issue #27 with: correlation, UTC send/reply times, tab URL without query, reply text, suite
counts. Update `workspace/aion/STATE.json` only if durable status changes.
Per `STATE-PROTOCOL.md`, `m1_verified` becomes true **only after an independent look** at the receipt.

---

## Also outstanding

| Item | Status |
|---|---|
| Comment issue #27 with Windows suite counts + items passed/failed | DONE for progress; final live receipt still pending. Comment 6249455037 independently read back. |
| Historical `receipt-…04-10-52-581Z-read-last.json` | Classified as historical readback evidence only: `mode: read-last`, matching token, URL and UTC times. It does not prove a Windows-originated send, transport causality, a fresh nonce or independent end-to-end acceptance, so it does not establish current M1. |
| Decide whether ChatGPT-side AION reads the result, or only the local runtime | TODO — owner's call |
| `ops/opencode-2` dossier evidence ladder is stale: V2 was upgraded **in place** without the controlled pilot it recommends | TODO |
| Sibling repos (`VOMEGA` 23, `zcode-bots` 17, `SOFTWARE_HQ` 10, `hq` 6 uncommitted files) are **not** covered by the 5-min sync, deliberately | TODO — per-repo decision |
| Stale `.gpm-sync` mirror / `GPM-Sync-Detect` task, unrelated to AION | TODO — separate decision |

---

## Hard constraints in force

- **No Orca.** Owner instruction, 2026-10-18: stop using Orca. No Orca command was executed; capability discovery only. Use other approved tools for local execution and browser interaction.
- **No Playwright or Puppeteer.** Verified by an automated test over the ChatGPT leg.
- **No credentials** in code, logs, envelopes or evidence: no cookies, tokens, access tokens, `__NEXT_DATA__`.
- **No force-push, no destructive Git.** The 5-minute `AION-Sync` task never force-pushes.
- **No invented proof.** A test that did not run is not a passing test; a green suite that includes a
  test which cannot fail is not evidence.
- ChatGPT contact happens only at **item 7 / CP3**, which is the one irreversible action in this plan.

## Bus V1/V2 lane (direction recorded 2026-10-19 — code exists and passes OFFLINE; Windows and live use still unverified)

Source: [decision record](../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md). Owner decisions open
(channel A/B, grant model, hop/rate, commandable agents) — see §5.
Status wording corrected 2026-10-19: the previous wording read "all TODO, none started". The accurate
position is: the V1 and V2 code exists and passes **offline** against fakes; what is missing is
**integration validation on Windows and any live verification** (`bus/README.md`: "V1 CODE-COMPLETE,
V2 CODE-COMPLETE — OFFLINE_PASS only. WINDOWS_PENDING, CHATGPT_LIVE_PENDING,
PLUGIN_ENTITLEMENT_UNKNOWN, ACCEPTANCE_PENDING"). Nothing below is claimed as live-verified.

| Row | Item | Status |
|---|---|---|
| BV1-0 | SYNC-0 no-send experiment (does PC commander tab show phone message) | **TODO — live, owner-scoped** → CP2 |
| BV1-0a | Prerequisites: reconcile endpoint; task-store pruning/archival plan | TODO — the merge already carries the reconcile endpoint, so it needs **verification on the merged tree** (not a second implementation); the pruning/archival plan is still open. Not verified. |
| BV1-1 | Agent registry + genealogy (data + panel view), offline | **OFFLINE CODE EXISTS / OFFLINE PASS — Windows integration validation pending (not verified live)** |
| BV1-2 | AION_CMD_V1 grammar, validator, router with fakes | **OFFLINE CODE EXISTS / OFFLINE PASS — integration validation pending (not verified live)** |
| BV1-3 | Commander watcher (read-only parser) | **OFFLINE CODE EXISTS (fixture DOM only) — live behaviour unproven** |
| BV1-4 | Report-back, loop guard, kill switch | **OFFLINE CODE EXISTS / OFFLINE PASS — integration validation pending (not verified live)** |
| BV1-5 | Live bring-up, one agent, fresh explicit grant | **TODO — live, owner-scoped** → CP4 |
| BV2-0 | Read-only OpenCode session inventory | **OFFLINE CODE EXISTS — Windows/live validation pending (not verified)** |
| BV2-1 | One scoped prompt to one OpenCode ACP session | **TODO — live, owner-scoped** → CP5 |
| BV2-2 | Grammar extension for executor ids | **OFFLINE CODE EXISTS / OFFLINE PASS — integration validation pending (not verified live)** |
| BV2-3 | Executor report-back | **OFFLINE CODE EXISTS / OFFLINE PASS — integration validation pending (not verified live)** |
