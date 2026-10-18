# AION Windows — work tracker

Source of truth for this run: **issue #27** (owner instruction, 2026-10-18). Updated as work lands.
Status vocabulary is fixed: **DONE** (verified by a receipt), **PARTIAL**, **TODO**, **BLOCKED**.

Last updated: 2026-10-18 · Resume baseline: `21fa583`

## Active owners — resumed 2026-10-18

- **Execution and final validation:** OpenCode coordinator.
- **Worker/native integration and ChatGPT port driver (items 3–4):** fixer, session `ses_eb180b3d8ffeLm7dKbsiur6KwB`.
- **Transport/host safety corrections:** fixer, session `ses_eb5474ccfffed9NlaG7EdDh2RF`. Scope excludes worker and port driver.
- **Safety review:** oracle, session `ses_eb142ccacffeBC4cQfP3Y8UIrF`; found unbounded port/disconnect retry, stale-port callbacks and validation gaps. Corrections required before live use.
- **Independent M1 acceptance:** a separate reviewer, after a real receipt exists; not yet assigned.
- **Local infrastructure and disk:** PC HQ. AION does not clean storage or change that ownership.
- `AION-Sync` was observed **Disabled** on resume. Left unchanged; coordinator uses explicit commits.
- **Panel controls:** designer delivered timeout/replay safeguards and durable regression tests; coordinator independently ran `bun run test -- tests/panel-controls.test.js`, **27/27 PASS** on 2026-10-18. Integration validation still pending.
- **Progress receipt:** posted and independently read back at https://github.com/owenservera/aion/issues/27#issuecomment-6249455037 (2026-10-18T11:37:52Z). This is progress evidence, not a live-turn acceptance receipt.

Latest historical green baseline: extension **142/142**, bridge **96/96**, adapter **35/35** (273 total). These counts are not proof that the pending integration works.

---

## Suite counts — Windows

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

- `src/host.js` — `applyOrigin()` runs the NM-02 check once, from argv or the retained first-frame path
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

The native adapter exists at `21fa583`; the worker still constructs `disabled-native` at resume.
Fixer is wiring the real adapter and storage lifecycle. Separate safety fixes address unbounded
retry on Chrome's port-then-disconnect path, stale-port callbacks, mandatory envelope validation and
truthful connection state. No live Chrome handshake has been proven.

### 4. Port driver for the content script — **IN PROGRESS (fixer)**
`content.js` listens on port `aion-chatgpt` (`ping`, `state`, `run-turn`, `read-final`, `stop`).
Nothing connects to it. Needs worker/panel code using
`chrome.tabs.query({url:'https://chatgpt.com/*'})` → `chrome.tabs.connect`. Prove `ping` first (read-only).

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
