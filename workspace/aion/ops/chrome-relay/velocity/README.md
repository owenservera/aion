# AION Track B — self-contained local command plane

**NO GITHUB ACTIONS.** GitHub holds source and receipts only; it does not execute or coordinate commands. The software runs locally using Node 22, the existing AION Bus, existing durable file storage and existing engine adapters. No hosted CI, Cloud Browser, Slack, Docker, Playwright, Puppeteer or Orca.

**Status (2026-10-19, round 8):** COMMITTED; fresh local regression still required. Last VERIFIED full offline selftest was Opus's round 7 at `1347253`: 965 tests, 963 pass, 2 pre-existing skips, 0 fail on Node 22 / Linux (velocity 92, bus 10, extension 736, bridge 127, plus bus demo). **Those numbers do not claim a test run at the newer round 8 head.** The Chrome leg of `aion send <role>` is wired end to end in source and proven offline with a spawned host process, a real file ledger and a fake worker. **Not yet:** WINDOWS VERIFIED, REAL CHROME VERIFIED, real ChatGPT Send.

## Agents + context (Round 9)

One AION CLI, existing eight-role catalogue and existing Bus. No new agent database, separate memory system, or GitHub Actions.

- `aion agents` — list all configured AION roles with current Bus binding status, agent ID and adapter. This is informational and never launches or sends.
- `aion context chief` — read exactly Chief's bootstrap and latest committed SITREP, with paths, content and SHA-256 provenance. `--scope bootstrap|sitrep|both|brief` selects the material.
- `aion send chief "Give me a status report" --context brief` — explicitly attach labelled **excerpts** from both source docs, with hashes and disclosed omission counts, to one owner-authorized send through the same existing Bus.
- `aion send chief "..." --context bootstrap`, `sitrep` or `both` — explicit full source content, accepted **only if** the complete resulting prompt fits the existing Bus 2,000-character send limit. Otherwise `CONTEXT_EXCEEDS_SEND_LIMIT` is returned with no send. No silent truncation or multi-message automatic context fan-out.

Because the existing Chief bootstrap is over 4,500 characters and SITREP almost 20,000, full-context sends will currently refuse; **`--context brief` is the immediately usable compact mode**. It does *not* pretend excerpts are the entire briefing. Relative file paths are restricted to the repo root and realpaths are checked against symlink traversal. Agent context never creates grants or overrides target authorization. The default `aion send chief "..." ` remains unchanged and sends **no automatically attached context**.

The local context command reads the checked-out repo, so agents use the source that is actually on the Windows machine—not fresh GitHub calls at runtime. Provenance is reported for every selected source document.

**Verification:** six new offline Node tests committed, and four changed JS files syntax-checked; a fresh complete Node suite on the Round 9 head remains pending.

## Self-contained commands

- **aion selftest** — runs bundled offline Node test suites for Velocity, Bus, Chrome extension and bridge, plus the existing Bus offline demo. All suites must return zero; no hosted runners.
- **aion connections** — discovers the local OpenCode 2.x V2 service and checks its loopback /api/info endpoint. Chrome is NOT_CONNECTED unless separately activated.
- **aion doctor / capabilities / status** — local read-only engine and Bus state, including binding and grant conditions.
- **aion connect opencode --cwd PATH --max 10 --hours 24** — explicit owner action binding the OpenCode V2 HTTP adapter and a scoped finite grant.
- **aion connect acp --cwd PATH --max 10 --hours 24** — explicit owner action choosing the existing ACP in-process relay and a scoped finite grant. Executable presence alone is not a confirmed ACP session. The cwd must also be in the existing bridge host's allowlist; otherwise the command refuses before changing grants.
- **aion send opencode "your task"** — one direct process with the existing Bus: validate → durable reservation → one dispatch → read-only observe → correlated result. A background broker is NOT required.
- **aion observe OP_ID --follow** — observe the existing operation only. No automatic resend.
- **aion stop / resume** — locally persisted stop and resume through the same Bus.
- **aion setup browser [--apply | --uninstall]** — dry run by default (zero writes). `--apply` generates a persistent dev key (stable dev extension ID, never Track A's), builds the B dev extension copy, writes the `com.aion.relay.dev` host manifest + launcher, and registers it per user (Windows: `HKCU\...\NativeMessagingHosts\com.aion.relay.dev`). Writes a setup receipt with source SHA. `--uninstall` removes B-owned files and the HKCU dev registration **only when the original receipt, extension key, manifest, and registered path all match**. If another registration or tampered install is present, BOTH apply and uninstall refuse without overwriting/deleting that registration.
- **aion connect chief --conversation https://chatgpt.com/c/ID [--max 10] [--hours 24]** — explicit owner binding of the role to ONE open conversation plus a finite grant. Requires a live host+worker ping and exactly one open tab on that conversation; otherwise refuses.
- **aion preflight browser** — read-only one-command checklist: B dev registration ownership, source extension ID, host/worker ping, role binding, finite grant, exact tab, active operation and STOP state. Prints one next action; NEVER sends or declares M1 proven.
- **aion send chief "..."** — validate → durable Bus reservation → one guarded submit through the dev host into the worker's existing `runChatGPTCommand` → read-only observe → correlated reply → `aion.result/1` with the reply excerpt. Chrome unavailable → `BROWSER_CONNECTOR_NOT_CONNECTED`, never routed to OpenCode. Any role alias from `role-launcher/ROLES.json` works the same way.

### Chrome leg (round 7)

    aion CLI ── Bus ledger (single writer, file lock) ── ChatGPT adapter (existing)
        │ call(type,payload)
        └─ token IPC (POSIX socket / Windows pipe) ── com.aion.relay.dev host (spawned by Chrome)
              └─ native messaging ── B dev worker: dev-link → existing runChatGPTCommand → page

- Host↔CLI auth: 256-bit per-session token in the owner-private state dir. The handshake now validates the exact session ID, extension ID and expected endpoint; forged session replies refuse. The Windows pipe keeps Node's default DACL and is reported `pipe_dacl: DEFAULT_UNVERIFIED`; the token is the access control, not the pipe ACL.
- Host forwards only `tabs`, `submit`, `observe`, `dispose`, `ping`. Forwarded worker calls are bounded (default 130 seconds, max 32 simultaneous requests); a lost reply becomes UNKNOWN and is never retried. No ledger, grant or retry logic in the host or worker link.
- A request that never left the CLI is a positive no-send; once written, a lost reply is UNKNOWN and blocks the target. Chrome closing the port fails pending calls as UNKNOWN.
- The dev build loads the UNCHANGED worker and adds `src/dev/dev-link.js`; Track A source, ID, host and profile are untouched.

The optional dev broker (bin/aiond-dev.mjs) is not required by any direct command.

## Windows launch (once the local master resumes)

From the AION repository root, using PowerShell 7:

    $Aion = ".\workspace\aion\ops\chrome-relay\velocity\bin\aion.ps1"
    pwsh -NoProfile -File $Aion selftest
    pwsh -NoProfile -File $Aion connections
    pwsh -NoProfile -File $Aion doctor

Chrome leg bring-up (Track B dev profile only):

    pwsh -NoProfile -File $Aion setup browser            # review the plan
    pwsh -NoProfile -File $Aion setup browser --apply    # B-only files + HKCU dev host key
    # Owner, once: chrome://extensions -> Developer mode -> Load unpacked -> <extension_dir from the receipt>
    # Open exactly one tab on the chief conversation in that profile, then:
    pwsh -NoProfile -File $Aion connections              # chrome.state must be CONNECTED
    pwsh -NoProfile -File $Aion connect chief --conversation "https://chatgpt.com/c/<id>" --max 5 --hours 8
    pwsh -NoProfile -File $Aion preflight browser         # READ-ONLY; should say READY_FOR_OWNER_LIVE_TEST
    pwsh -NoProfile -File $Aion send chief "Reply with OK" --wait-ms 180000

When a compatible OpenCode 2.x shared service is running and discoverable, OR the local ACP executable is present, explicitly select one engine:

    pwsh -NoProfile -File $Aion connect opencode --cwd "C:\path\to\authorized\repo" --max 10 --hours 24
    # Alternative for ACP instead of V2: connect acp with the same scope options.
    pwsh -NoProfile -File $Aion send opencode "Run the focused test suite and report" --wait-ms 120000
    pwsh -NoProfile -File $Aion status
    pwsh -NoProfile -File $Aion stop
    pwsh -NoProfile -File $Aion resume

Another launcher is bin/aion.cmd. No npm install or scheduled tasks are required for direct commands. Node 22 and a compatible configured engine are prerequisites; ACP and OpenCode V2 are alternate explicitly selected local engines. The existing ACP adapter is retained in source; it is not silently substituted for the V2 adapter.

## Engine / connection status

| Connection | Reuse | Verified now |
|---|---|---|
| Node local test runner | Node 22 builtin test runner | Full offline selftest 963/965 pass, 2 skipped (Linux); Windows unrun |
| Durable Bus and scoped grants | Existing Bus V1/V2 and file storage | Earlier isolated Bus source tests passed; Windows unrun |
| OpenCode V2 | Existing client and adapter, loopback-only discovery | Direct CLI wired; actual owner service status unknown |
| ACP | Existing bridge, config and ACP adapter, chosen by explicit connect acp | Binary presence can be checked; handshake and local live result unverified |
| ChatGPT Chrome | Existing MV3 extension, worker runner and observer via dev host | Offline e2e with spawned host + fake worker passes; real Chrome/ChatGPT UNRUN |
| Dev host setup | `aion setup browser` | Linux apply/uninstall + launcher-as-Chrome test pass; Windows `reg add` path tested with a fake runner only |
| Windows UIA/CDP | Optional existing tools | Not activated; no alternate send route |


### Round 8 testing boundary

New regression files: `round8-registration.test.mjs`, `round8-ipc-auth.test.mjs`, `round8-browser-preflight.test.mjs`, and `round8-host-lifetime.test.mjs`. They cover foreign HKCU native-host ownership, a tampered receipt/manifest, forged host hello/endpoint, prelive readiness refusals, silent Chrome worker and bounded host concurrency. Source-level evaluations in the authoring chat passed 6 registry cases and 5 preflight cases, and all 9 edited JS modules/tests passed syntax checks. **The full Node suite at the new head was not run.** Run `aion selftest` before applying browser setup or trying a real Send.

## Security / invariants

Each operation has a durable Bus identity and grant; the same Bus deletes reserved text before the one external attempt. Read-only observation never resends. A changed target binding refuses or halts the operation. The dedicated Track B ledger must be owner-private (POSIX 0700 or verified Windows ACL). OpenCode service credentials are read only for transient loopback calls and never printed or saved to the Bus.

No silent Chrome-to-OpenCode fallback, permission escalation, new Bus, new database or GitHub execution dependency. Track A stable Chrome identity, profile, native host and state remain unchanged.

Primary work: https://github.com/owenservera/aion/issues/32
Implementation: https://github.com/owenservera/aion/pull/34
Agent optimization rules: AGENTS.md in this directory.
