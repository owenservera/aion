# Windows Master — Path to Real ChatGPT Introspection (M1)

Goal, unchanged from the acceptance contract
([`canon/AION-MILESTONE-1-INTROSPECTION.md`](../../canon/AION-MILESTONE-1-INTROSPECTION.md)):

```
AION → Windows Chrome → real authenticated ChatGPT → Windows → AION
```

`m1_verified = false`. This file records what already exists, what is genuinely missing, and where the
work is blocked. **The blocker is authorization, not code.**

## Chain walk — what is already built

| Leg | Component | State |
|---|---|---|
| AION originates a correlated prompt | `sessions/01-escape-hatch/adapter/lib.js` `loadOutbound()` — refuses to fabricate the message | **EXISTS.** Reads the verbatim block from `AION-OUTBOUND-M05-001.md`. 35/35 unit tests pass. |
| AION → Chrome (submit) | `extensions/chatgpt/content.js` `composerFill` / `doSendPrompt` — types into the real `#prompt-textarea` and dispatches Enter | **CODE EXISTS ON DISK, NOT INSTALLED.** See the correction below. |
| Chrome → ChatGPT (auth) | the signed-in ChatGPT web session on Chrome 155 | **EXISTS.** Gated by the stop order. |
| ChatGPT → Windows (capture) | `extensions/chatgpt` exporter core — `GET /backend-api/conversations/<id>` with the page access token; saves a ZIP via `chrome.downloads` | **CODE EXISTS ON DISK, NOT INSTALLED.** |
| **Windows → AION (consume)** | **nothing** | **MISSING.** |

## CORRECTION — the gap is larger than first recorded (verified 2026-10-17)

An earlier version of this file described `extensions/chatgpt` as the primary reuse candidate. Checking
the **actual Chrome profile state** rather than only the filesystem shows that was misleading:

- `C:\0-BlackBoxProject-0\extensions\chatgpt` **is not loaded in any Chrome profile** (Default,
  Profile 2, Profile 3 or Profile 4). It is dormant source code, not a working component.
- The MAGIC API Graph extension — the one with `nativeMessaging` and a working Bun↔TCP↔Go bridge — is
  likewise **not installed**. It exists as a *reference implementation to copy from*, not as running transport.

**Consequence.** There is **no AION-owned Chrome extension at all**. `ops/chrome-relay/` contains
design documents only and `com.aion.relay` is not registered. So the smallest missing unit is
**not** a single bridge file — it is an **extension plus a bridge**, and the adapter alone gets AION no
further than the point where it already stands.

Reassessed smallest missing component:

| # | Missing piece | Notes |
|---|---|---|
| 1 | An installed AION extension with `nativeMessaging`, able to read the ChatGPT reply and post it to Windows | Must be installed into a profile that has the authenticated ChatGPT session (Profile 3 is the ChatGPT-heavy candidate — see [`ENVIRONMENT.md`](ENVIRONMENT.md)). |
| 2 | A Bun loopback bridge on `127.0.0.1` that receives the reply and links it to the outbound correlation ID | Can be written and unit-tested against fixtures now, with no browser. |
| 3 | Negative-case verification per the acceptance contract | A mismatched correlation or non-ChatGPT reply must be **rejected**, not reported as a turn. |

Building on the dormant `extensions/chatgpt` code is reasonable — it already does the hard part of
driving the real composer — but treat it as **code to be installed and reviewed**, not as a working
component. Its Chrome 155 compatibility is unverified.

## The smallest missing component

**One AION-owned Bun loopback consumer for the return leg.**

Concretely: a single-file Bun HTTP/WebSocket server bound to `127.0.0.1` that accepts the ChatGPT reply
and links it to the outbound correlation ID, plus a minimal outbound hook in the ChatGPT extension so a
captured reply is posted to it rather than only written to `Downloads`.

Proposed location (the directory exists but holds design documents only):
`ops/chrome-relay/aion-bridge.ts`

Why this is the smallest honest unit:

- Every other leg is implemented and either tested or directly observable.
- The transport pattern already exists and is proven: `magic-api-graph` runs
  Bun → TCP `127.0.0.1:9100` → Go native-messaging host → Chrome extension. AION can reuse that topology
  instead of inventing a second one (per the "no competing extension/daemon" rule).
- The ChatGPT extension already reaches `content.js`, so the outbound hook is a small addition, not a rewrite.
- **No Playwright or Puppeteer is required** at any point in this design.

Why it is still not zero-risk: the extension currently has no `nativeMessaging` permission and writes
only to `Downloads`, so adding an outbound call is a real change to a component that touches the
authenticated session.

## Why "reuse ACPX" cannot proceed

ACPX was the stated first reuse candidate. It is **not obtainable**:

- no `owenservera/ACPX` repository — GitHub returns 404;
- `acpx-kit.zip` is not present anywhere on this machine;
- `STATE.json` records `ACPX_SOURCE = NOT_SHARED_IN_REPO` with sha256
  `273c882f63413daf4c6c9e5a7315e27d831aa97bd0357e0aacb565244dca3b75`, but those bytes are not in the repo.

Treat ACPX as **unavailable until the owner supplies the artifact**. The plan above deliberately does not
depend on it.

## Sequencing that respects the stop order

1. **Now, without authorization:** implement `aion-bridge.ts` against the local mock transport. Unit-test
   it with fixture replies. No signed-in browser is touched.
2. **Owner authorizes** one bounded live test — one benign message, a named ChatGPT tab, a short window.
   A plain owner instruction in chat or in an issue is sufficient; no separate grant-file ritual is
   required (decision record §5).
3. **Then:** run the correlated round trip, capture the receipt, and check the negative case required by
   the acceptance contract (mismatched correlation / non-ChatGPT reply must be **rejected**, not reported
   as a successful turn).

Steps 2 and 3 are the only ones that touch the authenticated session, and they remain blocked.

## Prior experiments — read before building

Per the experiments registry, do not repeat these:

| ID | Kind | Status | Note |
|---|---|---|---|
| M1-001 | mock only | 16/16 | issue #24 |
| M1-002 | mock only | 18/18, **with screenshot caveat** | issue #26 — `consumer-consumed.png` is byte-identical to `consumer-replied.png`; CONSUMED is supported by saved event/status data, **not** by a separate screenshot |
| ACPX | existing source | not integrated, not code-reviewed | issue #25 — unavailable, see above |

The M1-002 caveat matters: a future receipt must not repeat the mistake of presenting one artifact as
proof of two distinct observations.

## Related design already in the repo

- `ops/chrome-relay/ARCHITECTURE.md` — proposes native-messaging host `com.aion.relay`; **not installed**
- `ops/chrome-relay/ENVELOPE-CONTRACT.md` — envelope shape
- `ops/proposals/AION-BFF-002-M1-chatgpt-roundtrip-design.md` — notes nothing pushes into an existing
  ChatGPT conversation, which is why the contract requires a user turn