# AION Chrome Relay Station — extension (MVP / CR-001)

Implementation of the design in [`../ARCHITECTURE.md`](../ARCHITECTURE.md),
[`../ENVELOPE-CONTRACT.md`](../ENVELOPE-CONTRACT.md) and
[`../OPENCODE-BUILD-ORDER.md`](../OPENCODE-BUILD-ORDER.md) (issue #18).

**Status: code complete, fixture-only, NOT INSTALLED and NOT RUNNING.**
This MVP has never been loaded into a browser and has never touched a signed-in session.

## What this is

A read-only operator console. It reports four things that the AION contract requires be kept
**separate** and never conflated:

1. **Transport** — is a relay connection alive?
2. **Proof** — has a proof event been observed, and by whom?
3. **Approval** — is a task held at `APPROVAL_PENDING`?
4. **Evidence** — how old is the last evidence, and where is it?

It reads **no web page content whatsoever** in the MVP. There are no content scripts, no host
permissions, and no `nativeMessaging`. That is deliberate, not unfinished.

## Loading it (unpacked, for review only)

Do **not** load this into a profile that holds a signed-in ChatGPT session without an explicit,
scoped owner authorization (see `workspace/aion/agents/windows-master/BLOCKERS.md`, B3).

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this directory (the one containing `manifest.json`)
4. Click the extension icon to open the side panel

Requires Chrome **155+**.

## Test commands

```bash
cd workspace/aion/ops/chrome-relay/extension
npm test              # or: node --test
```

Last observed: **81 tests, 81 pass, 0 fail**, on Node 24.11.1 / Windows. Zero dependencies — the
runner is Node's built-in `node:test`.

`src/lib/` is DOM-free by contract so it runs unchanged under Node. A separate
`chrome.*`-stubbed integration check exercises the service worker; that is not part of `npm test`
because it requires stubbing rather than a real browser, and this project must not automate one.

## Layout

| Path | Role |
|---|---|
| `manifest.json` | MV3, least privilege: `sidePanel`, `storage`, `alarms` only |
| `src/lib/envelope.js` | Envelope schema, validation, encode/decode, expiry |
| `src/lib/state.js` | Task + delivery state machines, presence staleness |
| `src/lib/store.js` | Event store: dedupe, ACK tracking, restart survival |
| `src/lib/transport.js` | Transport abstraction; native/loopback **disabled** in MVP |
| `src/roles.js` | Loads the 8 roles from `../role-launcher/ROLES.json` |
| `src/panel/` | Side panel UI |
| `src/background/service-worker.js` | MV3 worker; rehydrates from `chrome.storage.local` |
| `tests/` | 81 tests, all fixture-based |

## Permission rationale

| Permission | Why it is needed | Why nothing more |
|---|---|---|
| `sidePanel` | Render the operator console | — |
| `storage` | Survive MV3 worker suspension without losing events | Stores relay state only, never credentials |
| `alarms` | Periodic presence refresh | — |

**Deliberately absent:** `host_permissions` (no site access at all), `nativeMessaging` (the relay
host is not installed in this MVP), `tabs` (tab presence is therefore *structurally* unobservable and
renders `UNKNOWN` rather than being guessed), `content_scripts`, `cookies`, `debugger`,
`webRequest`. No credential, endpoint or `allowed_origins` value appears anywhere in this tree.

## Known limitations — read before trusting any number

- **Every status is `UNKNOWN` until a real event arrives.** The MVP ships no event source, so an empty
  outbox and a quiet relay are indistinguishable. This is reported honestly rather than smoothed over.
- **No tab presence.** The `tabs` permission is not held, so the panel *cannot* observe tabs and does
  not pretend to. Tab presence is UI metadata and never implies an agent is running.
- **Transport is `DISABLED`.** `disabled-native` refuses to send and contacts no host. The fixture
  transport is for tests only.
- **Fallback mode renders `MODE UNKNOWN`,** not `E`/SAFE_MANUAL, because asserting a mode before
  observing one is the exact quiet-normalcy failure this console exists to prevent.
- **Chrome 155 only** (`minimum_chrome_version: 155`); untested on earlier versions.
- **No Chrome Web Store packaging.** Unpacked load only.

## Denial cases (what this MVP refuses to do)

- Will not connect to any real native messaging host, endpoint or network.
- Will not read, inject into, or observe any web page.
- Will not treat a role tab being open as an agent running.
- Will not treat an ACK as execution, or a delivery record as verification.
- Will not render an unknown value as `0`, blank, or healthy.
- Will not auto-dispatch a task; anything requiring approval is held visibly at `APPROVAL_PENDING`.
- Will not persist or display credentials — there are none to persist.

## Relationship to the rest of AION

The eight role tiles mirror `../role-launcher/ROLES.json` (roles 01–08). Role presence is not agent
liveness. Per `../ARCHITECTURE.md`, ChatGPT role contexts are human-facing and never assumed to be
thinking while idle; a verifier is a **distinct identity** from a builder, and this console labels
verification `UNKNOWN — no independent verifier has reported` until one does.