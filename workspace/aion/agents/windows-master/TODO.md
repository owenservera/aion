# AION Windows — work tracker

Source of truth for this run: **issue #27** (owner instruction, 2026-10-18). Updated as work lands.
Status vocabulary is fixed: **DONE** (verified by a receipt), **PARTIAL**, **TODO**, **BLOCKED**.

Last updated: 2026-10-18 · HEAD at time of writing: `9af1598`

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

### 3. Service-worker native adapter (FLOW step 2) — **TODO**
`extension/src/lib/transport.js` has only `disabled-native` / `disabled-loopback` / `fixture`; the
worker never calls `chrome.runtime.connectNative`. Needs a real MV3-safe adapter (rehydrate, reconnect,
envelope per ENVELOPE-CONTRACT), unit-tested with a fake `chrome`, then **load unpacked in Profile 3 and
prove `initialize` end to end**: panel → worker → host → `opencode acp` v2.0.32 → response.

### 4. Port driver for the content script — **TODO**
`content.js` listens on port `aion-chatgpt` (`ping`, `state`, `run-turn`, `read-final`, `stop`).
Nothing connects to it. Needs worker/panel code using
`chrome.tabs.query({url:'https://chatgpt.com/*'})` → `chrome.tabs.connect`. Prove `ping` first (read-only).

### 5. Check node D offline — **DONE — a finding that contradicts the issue's premise**

Checked against `sessions/01-escape-hatch/adapter/fixture-live-2026-10-16.html`.

**Finding: the fixture cannot validate the live DOM path, and cannot validate the composer at all.**

| Selector the live code uses | Occurrences in the fixture |
|---|---|
| `#prompt-textarea` | **0** |
| `[data-message-author-role]` | **0** |
| `markdown` class | 2 |

The fixture is a **sanitized mock** using class-based selectors (`group/user-message`, `text-size-chat`),
while `content.js` queries `#prompt-textarea` and `data-message-author-role`/`markdown`. Therefore:

- **`readFinalReplyAfterLastUserTurn` cannot be exercised against it faithfully** — the markup shapes do
  not match what the function reads.
- **The "exactly one visible composer" check cannot be done offline at all**, because the fixture has no
  composer. The issue's warning that "the Linux adapter once hit two candidates with broader selectors"
  is **not** testable from this fixture. It needs the real page (item 7) or a purpose-built fixture that
  actually contains a composer.

There is also **no HTML parser available**: the project is zero-dependency and its DOM stubs are
hand-rolled and purpose-specific. Parsing arbitrary HTML offline would mean adding a dependency. Not
done, and deliberately not faked with a stub that proves nothing.

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

This is the M1 contract's "negative case" requirement satisfied offline.

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
| Comment issue #27 with Windows suite counts + items passed/failed | TODO |
| Unclassified evidence: `receipt-…04-10-52-581Z-read-last.json` (`matched: true`, reply `ACK-M05-COC-001`, real `chatgpt.com/c/…` tab, Linux box) — does it count toward anything? | TODO — owner's call |
| Decide whether ChatGPT-side AION reads the result, or only the local runtime | TODO — owner's call |
| `ops/opencode-2` dossier evidence ladder is stale: V2 was upgraded **in place** without the controlled pilot it recommends | TODO |
| Sibling repos (`VOMEGA` 23, `zcode-bots` 17, `SOFTWARE_HQ` 10, `hq` 6 uncommitted files) are **not** covered by the 5-min sync, deliberately | TODO — per-repo decision |
| Stale `.gpm-sync` mirror / `GPM-Sync-Detect` task, unrelated to AION | TODO — separate decision |

---

## Hard constraints in force

- **No Playwright or Puppeteer.** Verified by an automated test over the ChatGPT leg.
- **No credentials** in code, logs, envelopes or evidence: no cookies, tokens, access tokens, `__NEXT_DATA__`.
- **No force-push, no destructive Git.** The 5-minute `AION-Sync` task never force-pushes.
- **No invented proof.** A test that did not run is not a passing test; a green suite that includes a
  test which cannot fail is not evidence.
- ChatGPT contact happens only at **item 7**, which is the one irreversible action in this plan.