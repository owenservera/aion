# AION Windows — work tracker

Source of truth for this run: **issue #27** (owner instruction, 2026-10-18). Updated as work lands.
Status vocabulary is fixed: **DONE** (verified by a receipt), **PARTIAL**, **TODO**, **BLOCKED**.

Last updated: 2026-10-18 · Resume baseline: `21fa583`

## Owner's top-level goals — 2026-10-18

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
extension origin; Chrome passes it as **argv[1]**, so the host would have refused every real
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

### 7. Live round trip (FLOW step 3) — **TODO — IRREVERSIBLE**
One correlated benign message, capture the reply, verify the correlation. The message **cannot be
unsent**; the chat can be deleted afterwards. Prefer a **per-run id and a computed answer** (hash prefix
of a nonce) over the fixed `ACK-M05-COC-001` echo, which discriminates better.

### 8. Record receipt — **TODO**
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
- ChatGPT contact happens only at **item 7**, which is the one irreversible action in this plan.
