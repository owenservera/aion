# OpenCode V2 migration and validation plan — no host actions performed

**State:** PLAN ONLY. No installation, service restart, config rewrite, permission mutation, authenticated browser access or local storage cleanup performed.

## Host baseline from repository (historical; needs re-probe)
| Host | Recorded version | Source | Notes |
|---|---|---|---|
| OWNER_WINDOWS_MASTER | OpenCode 1.18.35 | `workspace/aion/agents/windows-master/BLOCKERS.md` (2026-10-17) | `C:\ProgramData\chocolatey\bin\opencode.exe`; config at `~/.config/opencode/opencode.json`; current execution owner |
| BFF Linux box | OpenCode 1.19.1 | `workspace/aion/ops/BOX-READINESS.md` (2026-10-16) | Reported curl install at `/home/box/.opencode/bin/opencode`; different host and version |

These are **not** statements about current live process state. Windows disk blocker B2 reports 1.10 GB free; **PC HQ owns capacity/recovery**. Do not install/update on a critically constrained C: drive, do not prune anything under AION authority.

## Stage 0 — non-mutating discovery on the chosen host
Run only when the host operator/execution lane is authorized; capture timestamp, hostname, working directory, process identity and version:
```powershell
# Windows; read-only, no package upgrade
Get-Command opencode -All | Select-Object Name,Source
opencode --version
opencode --help
Get-Process opencode -ErrorAction SilentlyContinue | Select-Object Id,Path,CPU,WorkingSet64
Get-PSDrive C | Select-Object Used,Free
```
```bash
# Linux; read-only
command -v opencode
opencode --version
df -h .
```
Inventory `opencode.json(c)`, `.opencode/{plugin,plugins,agent,agents,skills,command,commands}`, consumers of `@opencode-ai/sdk` / V1 HTTP API, ACP wrappers, local agents, shell automation and install methods. **Never commit config secrets, provider auth tokens, cookies, profiles or unsanitized transcript data.** Do not invoke V2 service commands in V1 blindly; first record CLI help.

## Stage 1 — preserve rollback before touching runtime
1. Get PC HQ green light for disk headroom and host reliability.
2. Identify package manager and V1 install; avoid two conflicting `opencode` executables on PATH.
3. Create a secure **out-of-repo** backup of nonsecret config, agent/skill/plugin source and session/state data using applicable tool-supported methods; verify restoration path and permissions.
4. Pin exact V1 binary and how to reinstall/restore it; record measured checksum. Never claim restoring old state is safe until tested in isolation.
5. Inventory all active tasks/sessions; stop or drain only with authorization. Consider the new V2 service can be auto-started by `opencode api` or a client.

## Stage 2 — isolated V2 smoke test
Prefer a disposable isolated machine, container or VM; where safe and supported, V2 `--standalone` uses private server. **Do not replace Windows production `opencode.exe` merely to start the pilot.** Official docs: V2 package is `@opencode/cli`; official command `opencode upgrade --major` from latest V1 is a production-changing operation and must *not* be run as part of discovery. Official V2 install documentation also warns that V1 and V2 both use `opencode` and are not side by side by default.

Capture actual binary version and CLI help before relying on any example below:
```text
opencode --version
opencode --help
opencode service status
opencode api get /api/info
opencode debug paths db
```
Run an empty-project, no-secrets fake provider/tool case first. Ensure service discovery, session creation, prompt outcome, event stream, timeout, stop/start behavior, restart continuity and permission enforcement are verified.

## Stage 3 — migration matrix
| Surface | Action | Acceptance |
|---|---|---|
| CLI/installer | Match binary version, source path, install channel and package manager | No PATH collision or silently replaced host runtime |
| Configuration | Let supported V1 fields load first; native V2 conversion optional | Same models/agents/rules except documented differences |
| Permissions | Explicitly add `{ "action": "external_directory", "resource": "*", "effect": "ask" }` if retaining V1 outside-project behavior | Outside-root edit requires approval; deny tests pass |
| Plugins | Port `Plugin.define({id,setup})` / context hooks | Every required plugin loads; incompatible V1 plugin isn't relied upon |
| API consumers | Rewrite V1 API calls using `@opencode/client`; feature-probe endpoint and schema | Exact session create/prompt/list/cancel results with correlation |
| ACP and AION relay | Maintain separate adapters; never confuse OpenCode REST with ACP JSON-RPC | Contract tests prove envelopes and replies do not cross-map incorrectly |
| Background | Subagent + async shell; cancel, timeout, restart and resumption | No lost outcomes claimed; recover by persisted IDs and reconciliation |
| MCP Code Mode | Minimal fake MCP/OpenAPI inputs; explicit permission boundaries | Correct outputs with negative security cases |
| Models/providers | Provider endpoint, variant, auth through secure local store | Selected model works without credential exposure |
| Telemetry | Read-only session/event data; sanitize before publication | Role04 WPM consumer adapted and checked against actual v2 schema |
| LSP alternatives | Use project lint/typecheck/compiler, not absent native V2 LSP | Diagnostics still meet build quality gate |
| Remote pairing | Leave disabled until security sign-off | No public listener, known auth, clear revocation and origin rules |

## Negative tests required
N01 denied external directory; N02 denied shell command; N03 unknown session; N04 wrong project/worktree context; N05 duplicate prompt/correlation; N06 dropped event stream/reconnect; N07 service restart during tool; N08 plugin incompatible V1; N09 blank/no-response and timeout; N10 partial streaming output; N11 model/provider failure; N12 credentials in logs/export; N13 project-scoped concurrency collision; N14 background subagent completion lost after service restart; N15 memory/CPU creep; N16 disk exhaustion. For event recovery, **re-query authoritative server state**: client event subscriptions are live-only and lack replay/automatic reconnection.

## Stage 4 — rollout / rollback gates
- **G0** current host inventory and PC HQ storage clearance. If not: BLOCKED, no host change.
- **G1** backup + verified restore procedure; no open critical sessions at risk.
- **G2** isolated V2 pilot with baseline prompt, plugin/permissions/API/telemetry and recovery checks PASS; version/hash captured.
- **G3** explicit owner-approved target host upgrade and maintenance window.
- **G4** same functionality on target and proof published; rollback if critical contracts fail.
- **G5** separate decision to exploit Code Mode/background/SDK features (do not bundle with basic upgrade).

A rollback involves the **recorded prior package/binary/config + protected persisted state** and cleanup only by authorized host owner. Because V1/V2 share config locations, do not let V1 read native V2-only config without a known translation. DB downgrades are not assumed safe.

## Receipt format (to publish after actual work only)
```json
{
  "contract": "AION_OPENCODE_V2_GATE_V1",
  "host": "UNKNOWN",
  "observed_at_utc": null,
  "version_before": "UNKNOWN",
  "version_after": "UNKNOWN",
  "worktree": null,
  "checks": [],
  "evidence_urls": [],
  "rollback_test": "NOT_RUN",
  "gate": "RESEARCH_ONLY",
  "owner_authorization": "NOT_RECORDED"
}
```
Do not treat this example JSON as a completed receipt.
