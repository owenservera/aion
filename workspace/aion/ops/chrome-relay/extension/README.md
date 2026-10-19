# AION Chrome Relay Station — extension (CR-001)

Implementation of the design in [`../ARCHITECTURE.md`](../ARCHITECTURE.md),
[`../ENVELOPE-CONTRACT.md`](../ENVELOPE-CONTRACT.md) and
[`../OPENCODE-BUILD-ORDER.md`](../OPENCODE-BUILD-ORDER.md) (issue #18).

**Status (updated 2026-10-19): offline-tested code; live behavior unproven.** `npm test` passes 528/528 across 17 test files (coordinator-verified 2026-10-19). The extension has a worker native-messaging adapter (bridge in [`../bridge`](../bridge)), a real chatgpt.com content-script turn engine with submit/observe/run/read commands, a durable no-resend task store and command-derived deadlines. It has **not** been shown to work against a real MV3 restart, and **M1 is not verified**. No Bus V1/V2 code exists; direction is recorded in [the decision](../../../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md) (PROPOSED).

## What this is

A read-only operator console. It reports four things that the AION contract requires be kept
**separate** and never conflated:

1. **Transport** — is a relay connection alive?
2. **Proof** — has a proof event been observed, and by whom?
3. **Approval** — is a task held at `APPROVAL_PENDING`?
4. **Evidence** — how old is the last evidence, and where is it?

The console itself reads **no web page content**. As of 2026-10-18 the manifest also carries a passive chatgpt.com content script (`src/chatgpt/loader.js` imports `content.js`), `host_permissions` for `https://chatgpt.com/*`, and `nativeMessaging`, for the M1 live path. The content script never composes, sends or reads on load or on a timer; it only acts on commands sent over its port. The service worker's transport adapter is `native`; a locked-down build can use `disabled-native`. The extension id is pinned by the manifest `key` to `kgjfielmhcdlggjppmliabpiljnonhki`.

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

Last observed (2026-10-19): **528 tests, 528 pass, 0 fail**. Zero dependencies — the
runner is Node's built-in `node:test`.

`src/lib/` is DOM-free by contract so it runs unchanged under Node. A separate
`chrome.*`-stubbed integration check exercises the service worker; that is not part of `npm test`
because it requires stubbing rather than a real browser, and this project must not automate one.

## Layout

| Path | Role |
|---|---|
| `manifest.json` | MV3: `sidePanel`, `storage`, `alarms`, `nativeMessaging`; site access `https://chatgpt.com/*` only; id pinned by `key` |
| `src/lib/envelope.js` | Envelope schema, validation, encode/decode, expiry |
| `src/lib/state.js` | Task + delivery state machines, presence staleness |
| `src/lib/store.js` | Event store: dedupe, ACK tracking, restart survival |
| `src/lib/transport.js` | Transport abstraction; worker uses the `native` adapter |
| `src/lib/chatgpt-tasks.js`, `command-deadlines.js`, `bounded-lifecycle.js` | Durable no-resend task store; command-derived deadlines |
| `src/chatgpt/` | Content-script turn engine (`content.js`), correlator, loader |
| `src/background/chatgpt-port.js` | Worker port driver and dispatch reservations |
| `src/roles.js` | Loads the 8 roles from `../role-launcher/ROLES.json` |
| `src/panel/` | Side panel UI |
| `src/background/service-worker.js` | MV3 worker; rehydrates from `chrome.storage.local` |
| `tests/` | 528 tests, fixture-based |

## Permission rationale

| Permission | Why it is needed | Why nothing more |
|---|---|---|
| `sidePanel` | Render the operator console | — |
| `storage` | Survive MV3 worker suspension without losing events | Stores relay state only, never credentials |
| `alarms` | Periodic presence refresh | — |
| `nativeMessaging` | Talk to the bridge host `com.aion.relay` | Adapter enabled in code; live use needs owner authorization |
| `host_permissions` `https://chatgpt.com/*` | Let the worker find the ChatGPT tab and connect to the content script | Content script is passive |

**Still absent:** `tabs` (tab presence is therefore *structurally* unobservable and renders `UNKNOWN` rather than being guessed), `cookies`, `debugger`, `webRequest`, and any site other than `https://chatgpt.com/*`. No credential appears anywhere in this tree. The signing key was generated once and not kept; unpacked loading only needs the public `key`.

## Known limitations — read before trusting any number

- **Every status is `UNKNOWN` until a real event arrives.** The MVP ships no event source, so an empty
  outbox and a quiet relay are indistinguishable. This is reported honestly rather than smoothed over.
- **No tab presence.** The `tabs` permission is not held, so the panel *cannot* observe tabs and does
  not pretend to. Tab presence is UI metadata and never implies an agent is running.
- **Transport is `native` in code** but has not been proven live; `disabled-native` remains for locked-down builds.
- **Fallback mode renders `MODE UNKNOWN`,** not `E`/SAFE_MANUAL, because asserting a mode before
  observing one is the exact quiet-normalcy failure this console exists to prevent.
- **Chrome 155 only** (`minimum_chrome_version: 155`); untested on earlier versions.
- **No Chrome Web Store packaging.** Unpacked load only.

## Denial cases (what this MVP refuses to do)

- Will not start the native host or send without an explicit owner action and authorization.
- Will not read a web page except through the bounded content-script commands.
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
## Two views of the same state

The side panel has two pages, switched from the bar under the title. Both read the
same worker state through `src/panel/view-model.js`, so they cannot describe it
differently.

**For people** (`sidepanel.html`, `guide.js`). A three-step connection test with a
"next step" line that is derived only from results already on the page. It moves
keyboard focus when asked and never clicks, confirms, selects or sends. "Fill in ids
and a starter message" fills only empty fields, and only on a click. The starter
message asks for the correlation id and the token on separate lines because
`chatgpt/correlate.js` accepts a reply only if it carries both, and refuses a reply
that is a verbatim span of the message as an echo.

**For agents** (`agent.html`, `agent.js`). Read-only. It posts one message type,
`{ type: 'aion/status' }`, and shows:

- a single state line (`HOST_LINK=… MODE=… APPROVALS=… PROOF=… OUTBOX=…`) that reads
  from a screenshot;
- a fields table whose rows carry `data-field` dotted paths;
- the same snapshot as JSON in `<script type="application/json" id="aion-snapshot">`
  (schema `aion.relay-view.v1`);
- a changes log between reads, newest first;
- a catalog of every worker message with `data-action-type`, `data-kind` and
  `data-machine-callable`. Only `aion/status` is callable from this view; a test pins
  the catalog to the worker's real endpoint tables.

Every leaf is a concrete value or the string `UNKNOWN`. `UNKNOWN` means nobody
observed it: it is never 0, idle or healthy. Re-reading on a timer is off until a
person ticks the box.

Open the agent view in the side panel. In an ordinary tab the worker refuses the
sender (`sender_is_a_tab`) and the page shows `UNKNOWN` with that reason. That
refusal is deliberate and must not be weakened.
