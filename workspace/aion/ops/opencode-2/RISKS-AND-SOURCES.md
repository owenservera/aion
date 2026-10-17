# OpenCode V2 — risk register, evidence quality and sources

**Research cutoff:** 2026-10-17; no host-level verification performed here.

## Risk register
| Severity | Risk | Evidence quality | AION handling |
|---|---|---|---|
| CRITICAL | V1 plugins fail in V2 without porting | Official V2 migration docs | Inventory/port; explicit missing-plugin negative |
| CRITICAL | V1 server API consumers break | Official V2 migration docs | Typed V2 adapter + contract tests |
| HIGH | V2 external-directory default permits access without V1 ask | Official V2 migration docs | Explicit deny/ask policy, test on fake out-of-tree path |
| HIGH | Shared server failure impacts all local clients | Official design; lifecycle bug reports are anecdotal | Supervision/reconnect and rollback |
| HIGH | Windows C: reported 1.10 GB free | AION Windows host evidence, not fresh probe | PC HQ approval; never migrate in pressure state |
| HIGH | Session background completion may be lost on restart | Upstream issue reports, not universal proof | Restart fault-injection, reconcile persisted state |
| HIGH | Session/event API subscriptions have no replay | Official client documentation | Refresh state after gap, independently persist receipts |
| HIGH | CPU/memory growth in some V2 versions/workloads | Upstream unresolved/triaged reports, not quantified population rate | Bounded duration soak, memory watermark |
| MEDIUM | Native LSP not active in V2 | Official V2 migration guide | Compiler/lint/typecheck replacements |
| MEDIUM | V1 `CLAUDE.md` fallback not discovered | Official V2 migration guide | Explicit `AGENTS.md` |
| MEDIUM | V2 sharing assumptions wrong | V2 sharing page not available (404); AION Role04 records V1 share removal | Rely on sanitized export / GitHub proof; inspect installed V2 |
| MEDIUM | Per-patch changelog sparse / multiple channels | Upstream issue #52184 plus V2 tags | Record exact package/channel/tag/commit, no unexplained "latest" |
| MEDIUM | Packaging difference on Windows | Official V2 install docs say Windows package managers unsupported | Select supported approved binary strategy, version probe |
| MEDIUM | Built-in plugins/hot reload differ from external plugin availability | Official announcement, separate community issues | Build one minimal POC, inventory each plugin |

## Evidence levels
- **OFFICIAL FEATURE**: official OpenCode announcement/documentation explicitly states capability.
- **OFFICIAL LIMITATION**: official migration/client docs explicitly state caveat.
- **UPSTREAM ISSUE**: filed/triaged bug or feature request; not automatically representative of every version/host.
- **AION HOST RECORD**: previously committed state, timestamped but *not* a current live probe.
- **PROPOSED**: our design or priority, not shipped nor accepted.

## Primary references
1. Official announcement: https://anoma.ly/notes/opencode-2-0/ — shared service, Code Mode, background agents and shell, new plugins, SDK, upgrade command.
2. V2 docs index: https://opencode.ai/v2/docs/ — supported installation modes and packages.
3. V1 migration: https://opencode.ai/v2/docs/migrate-v1/ — authoritative breakages, config mapping, LSP and permissions.
4. JavaScript client / service / streaming: https://opencode.ai/v2/docs/build/client/ — typed API, `Service.discover/ensure`, no event replay.
5. Plugin V2 API: https://opencode.ai/v2/docs/build/plugins/ — `Plugin.define`, hooks and lifecycle.
6. Plugin V1 migration: https://opencode.ai/v2/docs/build/plugins/migrate-v1/ — migration table.
7. CLI and shared-service docs: https://opencode.ai/v2/docs/cli/ — service, standalone, scripted run, paths.
8. Official API: https://opencode.ai/v2/docs/api — resource operations and schemas.
9. Official troubleshooting: https://opencode.ai/v2/docs/troubleshooting/ — logs, DB, service diagnostics.

## Upstream issue signals (not feature promises or reproduced AION failures)
- Missing V2 per-release notes: https://github.com/anomalyco/opencode/issues/52184
- V1 plugin initialization differences on Windows: https://github.com/anomalyco/opencode/issues/55162
- High RAM report: https://github.com/anomalyco/opencode/issues/54286
- Server lifecycle restart loop: https://github.com/anomalyco/opencode/issues/37239
- Background subagent completion across restart: https://github.com/anomalyco/opencode/issues/36349
- Other idle CPU/creep signal: https://github.com/anomalyco/opencode/issues/42299

## AION internal reference files
- https://github.com/owenservera/aion/blob/main/workspace/aion/agents/windows-master/BLOCKERS.md — Windows D1 agent decision, version and disk blocker.
- https://github.com/owenservera/aion/blob/main/workspace/aion/ops/BOX-READINESS.md — Linux version as of 2026-10-16.
- https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/04-opencode-output-efficiency/WPM-TRACKER-v0.1.md — existing telemetry path/contract.
- https://github.com/owenservera/aion/issues/26 — separate browser adapter/mock acceptance; **not** OpenCode 2 migration authorization.

**Unverified here:** exact current official highest V2 patch, every patch feature, live Windows and Linux versions, local plugin inventory, service configuration, available disk now, working V2 ACP behavior, runtime performance, plugin compatibility, V2 native sharing. These need direct version-scoped probes, not guesses.
