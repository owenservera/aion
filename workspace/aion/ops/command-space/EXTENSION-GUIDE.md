# Extending the AION command space

## Scope

The registry is a capability/evidence **catalog**, not a permission grant or a command queue. Add rows when a provider publishes a route, AION designs one, or a route is verified. Keep provider product, account, surface, and conversation identity separate.

## Add a provider / route

1. Identify the product, official documentation, exact surface, and transport. Add a new provider only if the product is meaningfully distinct from an existing one; a model name alone isn't a new provider.
2. Give each new native path a distinct combination of `provider + surface + native_path + transport`. Do not confuse official APIs with web sessions or plugin ingress with remote conversation control.
3. For all 40 current semantic commands, add a row for the route (consult CORE-OPERATIONS.csv; count from matrix rather than hardcoding for future additions). Default unsupported/unknown coverage to `UNKNOWN` and AION implementation to `PENDING` (or `PLANNED` only where design work is recorded). Do not default to DOCUMENTED.
4. Enter primary-source `documentation_url`, `confidence`, and `notes` describing what is and is not supported. A date and source revision should be included in notes when rechecking.
5. Rebuild SQLite, run `--check`, review the Git CSV diff, and submit the changed file. Only publish claims corroborated by that evidence.

## Add a semantic command

A command describes a stable intention: `send`, `observe`, `reply.read`, `session.bind`, `model.select`, etc. It does **not** encode provider UI steps. Add a new command ID only when existing verbs cannot express the operation. Document arguments, side effects, idempotency, completion and failure semantics in Bus contracts before exposing it for execution. Populate one route mapping per provider-route, conservatively marked UNKNOWN/PENDING until investigated.

## Promotion states

| Change | Minimum evidence |
|---|---|
| UNKNOWN → DOCUMENTED | Current primary-source docs explicitly describe this surface's exact operation |
| UNKNOWN → CANDIDATE | Reasonable hypothesis with URL/notes, not a claim of provider support |
| PENDING → PLANNED | Named AION component/task/design with repository link |
| PLANNED → OFFLINE_IMPLEMENTED | Code path + repeatable offline tests + source ref |
| UNKNOWN/LIVE_PENDING → LIVE_VERIFIED | Authorized real account/provider run, target identity, timestamp, success + negative-case receipt |
| REQUIRES_ACCOUNT_TEST → entitlement outcome | Account-specific observation; *do not* treat feature availability as universal |

Existing CSV enumerations do not cover explicit `UNSUPPORTED` or `BLOCKED`; represent those with `UNKNOWN` plus specific notes for now and migrate schema intentionally when adding richer runtime data.

## Suggested next extensions (ordered)

1. Add stable `provider_id`, `route_id`, `account_profile`, `target_scope`, `last_checked_utc`, `evidence_ref`, `required_grants`, `adapter_version`, `probe_id` as separate versioned fields/tables (do not infer identity from display names in production).
2. Link the registry to existing Bus adapter manifests and user-authorized grants.
3. Add probe receipts as append-only evidence records, rather than overwriting prior observations.
4. Expand real-webapp coverage to Claude, Gemini, Grok, Perplexity and others **after** reusable browser-engine tests; never fabricate selectors.
5. Enrich support states per operation: capabilities may be CONDITIONAL, DEPRECATED or rate-limited. Time-bound claims expire and must re-probe.

## Review checklist

- Provider-route evidence is specific and recent enough for the claim.
- Existing web conversation fidelity is explicit.
- Entitlement is independent of technical support.
- Native route isn't silently assumed to support browser-only tools or subscriptions.
- No credentials, cookies, raw chats, personal data or private grants committed.
- No automatic fallback retry after uncertain send.
- All source links and status promotions have reproducible receipts.

Scope stays intentionally lean: one CSV, one derived SQLite file, one router lookup adapter later; no new bus, scheduler, or database service.

## P0 coverage discipline

Every P0 semantic ID from [CORE-OPERATIONS.csv](CORE-OPERATIONS.csv) must have a provider-route row for every cataloged route. The `priority=P0` column is an **investigation and implementation priority**, not a claim of official support or actual AION realization. A provider worker should document `UNKNOWN` explicitly instead of inventing a browser control or API. The [route origins](ROUTE-ORIGINS.csv) file distinguishes our own browser-mediated route from provider-published native endpoints and plugin ingress. See [worker launch board](WORKER-LAUNCH.md) for research and authorized CDP reconnaissance protocol.
