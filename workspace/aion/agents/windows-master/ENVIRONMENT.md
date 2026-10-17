# Windows Master — Verified Environment Inventory

Observed directly on `OWNER_WINDOWS_MASTER` on 2026-10-17 by version query and file inspection.
**Reuse what is here.** Do not install a second copy of any of these.

## Core toolchain

| Tool | Version | Path / note |
|---|---|---|
| Windows | Windows 11 Pro Insider Preview, build 29683 | authoritative dev host |
| PowerShell 7 | 7.6.3 | `pwsh` — used by the sync engine and installer |
| Git for Windows | 2.51.2.windows.1 | |
| Git LFS | 3.7.1 | installed; **AION does not use it** (no `.gitattributes`) |
| GitHub CLI | 2.83.2 | authenticated as `owenservera`, scopes `gist, read:org, repo, workflow` |
| Bun | 1.4.2 | `C:\Users\VIVIM.inc\.bun\bin\bun.exe` — preferred runtime per global policy |
| Node.js | v24.11.1 | `C:\Program Files\nodejs\node.exe` |
| npm | 11.6.2 | fallback only; Bun is first choice |

## Agents / harnesses present

| Tool | Present | Role per decision record |
|---|---|---|
| OpenCode | yes | execution + review |
| Claude Code | yes | architecture review, patches, independent receipt checks |
| Codex | yes | execution |
| ZCode | yes (`C:\0-BlackBoxProject-0\ZCode`, upstream `zai-org/ZCode`) | transport / secondary executor |
| Grok Bot | Linux-side, optional | coordination only — **never authors code** |

## Browser

| Item | Value |
|---|---|
| Chrome | 155.0.8059.82 (`C:\Program Files\Google\Chrome\Application\chrome.exe`) |
| Profiles on disk | `Default`, `Profile 2`, `Profile 3`, `Profile 4` |
| Running at observation | yes (19 processes) |
| Playwright / Puppeteer | **not installed, not permitted** for AION work |

## Chromium extensions found (first-party)

| Path | Name / version | Transport | Relevance |
|---|---|---|---|
| `extensions/chatgpt/` | ChatGPT Full Exporter 1.1.0 (MV3) | none — writes a ZIP via `chrome.downloads` | **Primary reuse candidate.** `content.js` already fills the real `#prompt-textarea` and sends (`sendPrompt`). |
| `magic-api-graph/src/harness/extension/` | MAGIC API Graph Extension Pipe 2.0.0 (MV3) | **nativeMessaging** + TCP `127.0.0.1:9100` → Go host | **Proven transport pattern** to copy for the AION return leg. |
| `extension/` | Claude Conversation Downloader 1.2.0 | none | claude.ai only, not ChatGPT |
| `seed/extension/` | Vivim Sidecar 1.0 | declarativeNetRequest | unrelated |

## Native-messaging hosts registered (HKCU)

| Host name | Target |
|---|---|
| `com.magicapi.bridge` | `magic-api-bridge.exe` — **working reference implementation** |
| `live.vivim.sovereign_bridge` | `vivim-native-host.exe` (different project) |
| `com.vivim.core` | manifest file **missing** — stale entry |
| `app.vivim.edge_capture` | registered |
| `com.openai.codexextension`, `com.anthropic.*` | vendor entries |

`com.aion.relay` — the AION native-messaging host proposed in
`ops/chrome-relay/ARCHITECTURE.md` — is **not registered**. That directory contains design documents
only, with no code.

## What does not exist (verified absent)

- **ACPX** — no `acpx-kit.zip` anywhere on the machine; no `owenservera/ACPX` repository (404).
  `STATE.json` block `ACPX_SOURCE` correctly remains `NOT_SHARED_IN_REPO`.
- `002.ACP` contains constitution and harvest documents only — `contracts/` is empty, no transport code.
- `ops/chrome-relay/` contains design documents only — no implementation.

## Existing scheduled tasks of interest

| Task | State | Note |
|---|---|---|
| `AION-Sync` | see [`RUNBOOK.md`](RUNBOOK.md) | created by this bootstrap |
| `GPM-Sync-Detect` | Ready | **pre-existing, unrelated.** Older system under `.gpm-sync`, mirrors only `001.PROJECTS.PM`. Left untouched. |

## Disk

`C:` — **1.10 GB free**, 469.7 GB used. The decision record last noted 6.3 GB free, so this has
degraded materially. Treat as a live risk: Git object stores, Bun caches and Chrome profiles all
compete for the same volume. See [`BLOCKERS.md`](BLOCKERS.md#b2).

## Credential mechanism

Git credentials resolve through `gh auth git-credential`
(`credential.https://github.com.helper`). Nothing is stored in repository scripts, configuration or
logs. The sync engine additionally redacts `gh[pousr]_*` tokens, credential-bearing URLs and
`token=`/`password=` parameters from anything it writes.