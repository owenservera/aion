# AION Track B — self-contained local command plane

**NO GITHUB ACTIONS.** GitHub holds source and receipts only; it does not execute or coordinate commands. The software runs locally using Node 22, the existing AION Bus, existing durable file storage and existing engine adapters. No hosted CI, Cloud Browser, Slack, Docker, Playwright, Puppeteer or Orca.

**Status (2026-10-19, round 7):** COMMITTED + LOCALLY TESTED on Node 22 / Linux. Full offline selftest: 965 tests, 963 pass, 2 pre-existing skips, 0 fail (velocity 92, bus 10, extension 736, bridge 127, plus bus demo). The Chrome leg of `aion send <role>` is wired end to end in source and proven offline with a spawned host process, a real file ledger and a fake worker. **Not yet:** WINDOWS VERIFIED, REAL CHROME VERIFIED, real ChatGPT Send.

## Self-contained commands

- **aion selftest** — runs bundled offline Node test suites for Velocity, Bus, Chrome extension and bridge, plus the existing Bus offline demo. All suites must return zero; no hosted runners.
- **aion connections** — discovers the local OpenCode 2.x V2 service and checks its loopback /api/info endpoint. Chrome is NOT_CONNECTED unless separately activated.
- **aion doctor / capabilities / status** — local read-only engine and Bus state, including binding and grant conditions.
- **aion connect opencode --cwd PATH --max 10 --hours 24** — explicit owner action binding the OpenCode V2 HTTP adapter and a scoped finite grant.
- **aion connect acp --cwd PATH --max 10 --hours 24** — explicit owner action choosing the existing ACP in-process relay and a scoped finite grant. Executable presence alone is not a confirmed ACP session. The cwd must also be in the existing bridge host's allowlist; otherwise the command refuses before changing grants.
- **aion send opencode "your task"** — one direct process with the existing Bus: validate → durable reservation → one dispatch → read-only observe → correlated result. A background broker is NOT required.
- **aion observe OP_ID --follow** — observe the existing operation only. No automatic resend.
- **aion stop / resume** — locally persisted stop and resume through the same Bus.
- **aion setup browser [--apply | --uninstall]** — dry run by default (zero writes). `--apply` generates a persistent dev key (stable dev extension ID, never Track A's), builds the B dev extension copy, writes the `com.aion.relay.dev` host manifest + launcher, and registers it per user (Windows: `HKCU\...\NativeMessagingHosts\com.aion.relay.dev`). Writes a setup receipt with source SHA. `--uninstall` removes only those B files and the B key registration.
- **aion connect chief --conversation https://chatgpt.com/c/ID [--max 10] [--hours 24]** — explicit owner binding of the role to ONE open conversation plus a finite grant. Requires a live host+worker ping and exactly one open tab on that conversation; otherwise refuses.
- **aion send chief "..."** — validate → durable Bus reservation → one guarded submit through the dev host into the worker's existing `runChatGPTCommand` → read-only observe → correlated reply → `aion.result/1` with the reply excerpt. Chrome unavailable → `BROWSER_CONNECTOR_NOT_CONNECTED`, never routed to OpenCode. Any role alias from `role-launcher/ROLES.json` works the same way.

### Chrome leg (round 7)

    aion CLI ── Bus ledger (single writer, file lock) ── ChatGPT adapter (existing)
        │ call(type,payload)
        └─ token IPC (POSIX socket / Windows pipe) ── com.aion.relay.dev host (spawned by Chrome)
              └─ native messaging ── B dev worker: dev-link → existing runChatGPTCommand → page

- Host↔CLI auth: 256-bit per-session token in the owner-private state dir. The Windows pipe keeps Node's default DACL and is reported `pipe_dacl: DEFAULT_UNVERIFIED`; the token is the access control, not the pipe ACL.
- Host forwards only `tabs`, `submit`, `observe`, `dispose`, `ping`. No ledger, grant or retry logic in the host or worker link.
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

## Security / invariants

Each operation has a durable Bus identity and grant; the same Bus deletes reserved text before the one external attempt. Read-only observation never resends. A changed target binding refuses or halts the operation. The dedicated Track B ledger must be owner-private (POSIX 0700 or verified Windows ACL). OpenCode service credentials are read only for transient loopback calls and never printed or saved to the Bus.

No silent Chrome-to-OpenCode fallback, permission escalation, new Bus, new database or GitHub execution dependency. Track A stable Chrome identity, profile, native host and state remain unchanged.

Primary work: https://github.com/owenservera/aion/issues/32
Implementation: https://github.com/owenservera/aion/pull/34
Agent optimization rules: AGENTS.md in this directory.
