# AION integration proposal — use the registry, don't build another bus

## Current baseline

Bus V1/V2 already owns command grammar `AION_CMD_V1`, the registry/ledger, state machine, grants, the ChatGPT browser adapter, ACP executor and optional OpenCode HTTP adapter. These are **offline-implemented according to TOOLSMITH's 2026-10-19 SITREP**, not Windows/live verified.

The command-space registry augments **routing knowledge**; it must not duplicate or replace command execution, ACLs, identity bindings or operation state. ChatGPT.com is the first pilot, not the architecture's only provider.

## Minimum viable integration (small PR)

1. **Read-only loader:** add `command-space` CSV/SQLite import in the existing Bus route planning boundary (or generate JSON from SQLite at build time). Do not make browser execution depend on a writable SQLite database.
2. **Lookup:** `routesFor(provider, command, targetSurface)` returns entries ordered by fidelity match and evidence status. Treat `UNKNOWN`, `CANDIDATE`, `PENDING` as advisory, **not executable**. A route becomes executable only when an existing Bus adapter manifest reports the operation, an actual binding exists, runtime health passes, and grants authorize it.
3. **Planning:** prefer a native official integration *only when* it can address the user's intended exact account/session and preserve necessary features. Otherwise select existing browser adapter; then manual assistance if automation isn't available. Never silently swap web history for an API chat.
4. **Result:** router emits chosen `route_id`, `transport`, `adapter_version`, `target_ref`, `decision_reasons` in the existing receipt. Reuse existing `OUTCOME_UNKNOWN` and no-resend invariants.
5. **Verification:** add fixtures for same-session native route, native-new-session mismatch, browser fallback, unsupported operation, stale entitlement, expired probe, duplicate delivery, and interrupted submission. Re-run Bus tests, then authorized Windows pilot.

## Suggested data flow

```
AION command + exact target binding
  -> Bus parser/validator + grants
  -> Command-space lookup (advisory, no execution)
  -> live adapter manifest + runtime health + account permission
  -> selected adapter (native MCP/API/ACP OR browser MV3/CDP)
  -> existing Bus ledger, correlated observation and receipt
```

## Native path vs AION native path

- **Provider native path:** officially supported API, MCP/App tools, ACP, CLI, SDK, or browser feature with documented scope.
- **AION native path:** first-class implementation *inside AION* translating one canonical command into that provider path.
- **AION browser path:** reusable AION browser engine plus minimal provider profile for webapp-only sessions.
- **Pending:** no source-verified AION path or missing account authorization, even if a provider native route exists.

Avoid conflating `aion-mcp` **ingress** (ChatGPT calls AION) with the **egress** requirement (AION controls ChatGPT.com conversations). Neither replaces the other.

## Concrete next implementation priority

- Wire `send`, `observe`, `reply.read`, `recover` for the existing ChatGPT adapter first.
- Verify native ChatGPT MCP and Apps entitlements independently; don't gate universal browser functionality on them.
- Reuse the same command schema for one additional real AI webapp using a profile-driven adapter.
- Only expand operations once a shared command→result proof works on both providers.

**Definition of done:** identical command/receipt semantics for two providers, reliable exact-conversation binding, one confirmed no-send negative case and one ambiguous-result recovery, with a recorded proof and no duplicated bus.
