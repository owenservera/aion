# OpenCode 2.0 — AION integration assessment

## Existing authority (do not supersede)
1. Owner Windows local master is the human/master machine; code and tasks remain in the one `owenservera/aion` `main` repository.
2. **Owner decision 2026-10-17:** OpenCode is *current Windows execution agent*; ZCode execution deferred on Windows until working, but its ACP transport role remains distinct. Historical `pm/OWNERS.md` general description and newer host-specific D1 must be reconciled by scope, not silently overwritten.
3. Chief of Staff / 03 coordinates real dispatch and acknowledgment; 04 owns OpenCode telemetry; 05 independently verifies; 06 tooling contracts. An issue is not an employee-chat ACK.
4. AION GitHub ledger is durable tasks + evidence. Browser transport/ChatGPT live M1 remains separate and authorization gated. No Slack, new GitHub repo/branch, Playwright, Puppeteer or automatic host installation.

## Proposed adapter, not built
Implement one small `OpenCodeV2Adapter` behind the currently authorized dispatcher rather than a second controller. Use versioned DTOs, explicit `run_id`, `task_id`, `session_id`, `attempt_id`, `worktree_path` and `model_id`, with immutable evidence and owner identity. For Windows evaluate `@opencode/client` to talk to a local V2 service. ZCode is *not assumed to be installed/operational as an execution agent on Windows*; where it handles transport, preserve the explicit handoff.

**Read-only initial scope:** `server.info`, session listing, session state/readback, event observation, capability inspection. **Write scope requires separate approval:** creating sessions, invoking prompts/tools/shell, service restart, editing outside worktree, GitHub push. In V2 `Service.discover()` is preferable to `Service.ensure()` for pure observation because `ensure()` may start the service.

```text
AION owner instruction -> GitHub issue/handoff [published]
    -> real executor ACK [observed, independent of publication]
    -> approved adapter creates OpenCode session with worktree scope
    -> per-attempt correlation + streamed state/events [non-durable]
    -> final server readback and real test receipt
    -> independently checked GitHub commit/tests [accepted]
```

## High leverage candidates (ranked)
| Rank | Candidate | Implementation boundary | Evidence to demand |
|---|---|---|---|
| 1 | Session inventory & live activity | Read-only client, `session.list`, state snapshots, reconnect | Actual per-host session IDs & timestamps; no false RUNNING |
| 2 | Role04 WPM adapter | Replace fragile CLI export parsing only after V2 schema inspection; count assistant visible text only | Side-by-side WPM trace and sanitization |
| 3 | Task-to-proof bridge | Scoped OpenCode session + task ID mapping + repo proof | Dispatch/ACK/started/completed/accepted stages distinct |
| 4 | Worktree-per-task | Use explicit location, constrain outside-directory permissions | Cross-worktree denial and no accidental commits |
| 5 | Background worker pool | One limited subagent pilot; explicit kill/restart failure tests | Completes despite UI being closed; verified state after restart |
| 6 | MCP Code Mode | Benchmark one mock tool-chain vs repeated calls | Tool calls, tokens, cost, latency and output quality |
| 7 | Native typed plugin | Stable `Plugin.define` with audit hooks; lifecycle/hot reload | Small fixture test, ownership and revert |
| 8 | Remote client/pairing | Only after network boundary and secret handling review | Authn/authz, no public exposure, pairing revocation |
| 9 | Embed/fork `@opencode/sdk` | Last resort when a required native adapter API is insufficient | Measured need, maintenance cost and regression suite |

## Suggested data contract for telemetry (proposal)
```json
{
  "schema": "aion.opencode.v2.telemetry.v1",
  "host": "OWNER_WINDOWS_MASTER",
  "observed_at_utc": null,
  "runtime_version": null,
  "service_state": "UNKNOWN",
  "session": {
    "id": null,
    "location_directory": null,
    "status": "UNKNOWN",
    "agent": null,
    "model_id": null
  },
  "receipt": {
    "last_event_at_utc": null,
    "reconciled_at_utc": null,
    "event_gap": "UNKNOWN",
    "sanitized": false
  }
}
```
**All values are placeholders**, not live telemetry. Distinguish event stream connected, agent working, user-visible output increasing, test passed and task accepted. Missing data = UNKNOWN, never IDLE/COMPLETE by assumption.

## Security design points specific to V2
- Restore V1-style ask-for-external-directory rule explicitly; V2 default is permissive.
- Pairing and remote host exposure require approval; avoid embedding service tokens in GitHub.
- Protect SQLite database and logs; rely on typed server API rather than writing DB tables directly.
- Client SSE events offer no replay/auto reconnect. Persist durable task metadata separately, resubscribe and reconcile against session state after gaps.
- Budget-aware routing based on verified model/provider availability, not inferred subscription credits.
- Follow host stop orders; background engine capability does not authorize unattended work.
- Respect 1.10 GB historical disk free on Windows: PC HQ must clear host readiness before deployment.

## Success criteria
PILOT_ACCEPTED only when: exact V2 runtime is observed on a named authorized host; baseline V1 workflows still pass; permission and plugin negatives pass; ZCode/ACP/AION protocol boundaries preserved; session telemetry matches server state; restart, loss, timeout and duplication cases have receipts; no secret entered repo; review independently reproduced. Until then: RESEARCH ONLY.
