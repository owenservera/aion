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

## The AION extension design ALREADY EXISTS — do not design a new one

An earlier revision of this file said "there is no AION Chrome extension" and implied the extension had
to be invented. That was wrong about the design. **The design is complete and tracked.** Only the
*code* is absent.

| Artefact | Path | Status |
|---|---|---|
| Architecture v0.1 | `ops/chrome-relay/ARCHITECTURE.md` | **DESIGNED** — MV3 edge node, `com.aion.relay` native host, UAH/ACP transport, IANG SQLite, GitHub receipts |
| Envelope contract v0.1 | `ops/chrome-relay/ENVELOPE-CONTRACT.md` | **DESIGNED** — 19 required envelope fields, event families, dual state machines, dedupe by `message_id` + `idempotency_key` |
| Fallback / acceptance | `ops/chrome-relay/FALLBACK-AND-ACCEPTANCE.md` | **DESIGNED** — five modes A–E, trigger/recovery matrix, T0–T2 test plan |
| Build order CR-001 | `ops/chrome-relay/OPENCODE-BUILD-ORDER.md` | **DESIGNED** — 6 numbered MVP deliverables, code-only, fixture-first |
| Role launcher RL-001 | `ops/chrome-relay/role-launcher/` | **DESIGNED** — `ROLES.json` with 8 roles (01–08), keyword `aion`, exact-match only |
| Tracked work | issue **#18** (CR-001, OPEN), **#22** (RL-001, OPEN), **#25** (ACPX-001, OPEN) | **not started** |
| Implementation code | `ops/chrome-relay/extension/` | **ABSENT — and never existed in git history** |

So the correct statement is: **the extension is fully specified, never built, and deliberately not yet
started.**

## The design itself says "do not build it yet"

This is the part that changes what happens next. Both `ARCHITECTURE.md` and `OPENCODE-BUILD-ORDER.md`
carry a **2026-10-17 priority override** — dated today — which reads in substance:

> This fixture-first extension build order is **deferred** as a prerequisite to the current Windows M1
> live test. Inspect ACPX source and current Windows browser/adapter availability first; write **only
> demonstrated missing code**. Do not build a second extension without source-backed reuse/replace
> justification.

The design therefore **pre-authorises itself to be paused** pending ACPX review. And ACPX (issue #25,
"Eight-role leverage review: local ACP browser bus vs AION M1 relay") is exactly what is unobtainable —
`owenservera/ACPX` 404s and `acpx-kit.zip` is not on this machine.

**The decision this creates is yours, not an agent's:** the design says "reuse ACPX if it exists, and
otherwise write only demonstrated missing code", but ACPX cannot be inspected. Either supply ACPX, or
declare it unavailable and let the deferred CR-001 proceed.

## If the CR-001 MVP does proceed, it is already correctly scoped

The spec is deliberately conservative and needs **no** browser, no signed-in session, and no
authorization:

1. Minimal MV3 unpacked extension + side panel + service worker, selected role tabs only
2. Role tiles with honest pending-launch states; **distinguish "no data" from "idle"**
3. Envelope encoder/decoder + validation (allowlisted kinds, sequence, expiry, idempotency key) + fixture store; **no credentials in the extension**
4. Transport abstraction with all adapters **disabled** or fixture-only — no real host, no silent sends
5. Deterministic tests: restart/outbox retention, duplicate ACK, dropped connection, stale presence, proof-vs-transport
6. README with unpacked-load steps, exact test commands, permission rationale, limitations

Acceptance requires an unpacked extension showing role cards and changing simulated modes, with
restart and duplicate cases losing no work — and critically, **role tab open must NOT show an agent as
RUNNING**.

**It already names OpenCode as implementer** ("implementation: OpenCode/ZCode only"), which matches
your decision D1. This is code-only and touches no authenticated account.

### One spec inconsistency to resolve before building

Role count drifts across the design: `ARCHITECTURE.md` and `OPENCODE-BUILD-ORDER.md` item 2 say **eight**
role tiles, while `FALLBACK-AND-ACCEPTANCE.md` T0 and the CR-001 acceptance line both say **five** role
cards. `ROLES.json` defines **eight** (`role_count: 8`). Settle on eight before implementing, or the
acceptance criteria are untestable as written.

### Trust rules the design holds itself to, worth keeping

- A role tab being open is **UI metadata, never** evidence of model activity; liveness is verified separately.
- An ACK proves delivery, **not** executor acceptance; completion never implies independent verification.
- The webpage is untrusted and content scripts cannot grant privileges; the native host re-authorizes everything.
- No transport ever weakens a host stop order.
- No silent prompt submission — drafting into ChatGPT requires an explicit user gesture.

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