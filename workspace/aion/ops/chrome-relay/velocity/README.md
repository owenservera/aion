# AION Track B — self-contained local command plane

**NO GITHUB ACTIONS.** GitHub holds source and receipts only; it does not execute or coordinate commands. The software runs locally using Node 22, the existing AION Bus, existing durable file storage and existing engine adapters. No hosted CI, Cloud Browser, Slack, Docker, Playwright, Puppeteer or Orca.

**Status:** isolated development source committed. The owner's Windows machine remains paused; no installation, native host registration, ChatGPT Send or local OpenCode connection is claimed. Fourteen isolated local Node tests of the portable new modules passed in this chat; the complete repository suites and Windows activation have not yet run.

## Self-contained commands

- **aion selftest** — runs bundled offline Node test suites for Velocity, Bus, Chrome extension and bridge, plus the existing Bus offline demo. All suites must return zero; no hosted runners.
- **aion connections** — discovers the local OpenCode 2.x V2 service and checks its loopback /api/info endpoint. Chrome is NOT_CONNECTED unless separately activated.
- **aion doctor / capabilities / status** — local read-only engine and Bus state, including binding and grant conditions.
- **aion connect opencode --cwd PATH --max 10 --hours 24** — explicit owner command: bind the existing OpenCode V2 adapter and grant only the specified directory, number of sends and expiration.
- **aion send opencode "your task"** — one direct process with the existing Bus: validate → durable reservation → one dispatch → read-only observe → correlated result. A background broker is NOT required.
- **aion observe OP_ID --follow** — observe the existing operation only. No automatic resend.
- **aion stop / resume** — locally persisted stop and resume through the same Bus.
- **aion send chief "..."** — intentionally refused in direct mode until the isolated Track B Chrome host and browser connector are genuinely connected.

The optional dev broker (bin/aiond-dev.mjs) is for Chrome/native messaging. It is not required by direct OpenCode commands and is not yet verified for Windows secure IPC.

## Windows launch (once the local master resumes)

From the AION repository root, using PowerShell 7:

    $Aion = ".\workspace\aion\ops\chrome-relay\velocity\bin\aion.ps1"
    pwsh -NoProfile -File $Aion selftest
    pwsh -NoProfile -File $Aion connections
    pwsh -NoProfile -File $Aion doctor

When a compatible OpenCode 2.x shared service is genuinely running and discoverable:

    pwsh -NoProfile -File $Aion connect opencode --cwd "C:\path\to\authorized\repo" --max 10 --hours 24
    pwsh -NoProfile -File $Aion send opencode "Run the focused test suite and report" --wait-ms 120000
    pwsh -NoProfile -File $Aion status
    pwsh -NoProfile -File $Aion stop
    pwsh -NoProfile -File $Aion resume

Another launcher is bin/aion.cmd. No npm install or scheduled tasks are required for direct commands. An already installed Node 22 and compatible OpenCode service are prerequisites. The existing ACP adapter is retained in source; it is not silently substituted for the V2 adapter.

## Engine / connection status

| Connection | Reuse | Verified now |
|---|---|---|
| Node local test runner | Node 22 builtin test runner | 14 portable new-module tests passed; full repo suite unrun |
| Durable Bus and scoped grants | Existing Bus V1/V2 and file storage | Earlier isolated Bus source tests passed; Windows unrun |
| OpenCode V2 | Existing client and adapter, loopback-only discovery | Direct CLI wired; actual owner service status unknown |
| ACP | Existing bridge and ACP adapter | Source exists, not connected to direct CLI |
| ChatGPT Chrome | Existing MV3 extension and observer | Dev browser/host NOT_CONNECTED |
| Windows UIA/CDP | Optional existing tools | Not activated; no alternate send route |

## Security / invariants

Each operation has a durable Bus identity and grant; the same Bus deletes reserved text before the one external attempt. Read-only observation never resends. A changed target binding refuses or halts the operation. The dedicated Track B ledger must be owner-private (POSIX 0700 or verified Windows ACL). OpenCode service credentials are read only for transient loopback calls and never printed or saved to the Bus.

No silent Chrome-to-OpenCode fallback, permission escalation, new Bus, new database or GitHub execution dependency. Track A stable Chrome identity, profile, native host and state remain unchanged.

Primary work: https://github.com/owenservera/aion/issues/32
Implementation: https://github.com/owenservera/aion/pull/34
Agent optimization rules: AGENTS.md in this directory.
