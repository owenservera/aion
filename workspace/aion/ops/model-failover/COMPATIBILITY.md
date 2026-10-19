# Model failover — staging only

Observed 2026-10-19T10:42:49Z on Windows. **NOT ACTIVE. No plugin entrypoint, autoload directory, configuration edits, model requests, auth reads, installs, or restarts.** This directory contains a supervisor core and a deliberately mocked host port, not a working installed OpenCode integration. Coordinator review and independent verification are required before activation.

## Artifacts and local verification

- `supervisor.js`: serialized durable task-root state machine and fail-closed policy. Primary `openai/gpt-6.1-sol`, variant `medium`; sticky fallback `opencode/minimax-m3.1-flash-free` (owner-selected free fallback, 2026-10-19; previously `opencode/space-bunny-free`). IDs supplied as catalog-verified by coordinator; no catalog/model invocation made in this lane.
- `supervisor.test.js`: Bun-native mock suite, no dependencies or network. Run `bun run test` from this directory.
- `package.json`: private staging package; nothing auto-loads it.

Final test receipt: **2026-10-19T10:44:34Z**, `bun run test`, Bun 1.4.2, **33 pass / 0 fail, 85 assertions**, 79 ms. Tests demonstrate the core's behavior against its **mock contract**, not installed-host interoperability.

## Installed evidence versus public V2 contract

`Get-Command opencode` resolved the npm shim, which executes `@opencode/cli/bin/opencode.exe`. `opencode --version` returned **v2.0.32**. Its installed `package.json` is version 2.0.32 and ships native CLI packages, not the V2 plugin/client declarations. The inspected configuration dependency directory contains **`@opencode-ai/plugin` 1.14.24 and `@opencode-ai/sdk` 1.14.24**. Their legacy declarations are not used as proof of V2 support (even the latter's `./v2` export is not proof of the new `@opencode/client` contract). No `@opencode/plugin` was found in the narrowly inspected package locations. A supplementary Bun-cache search timed out; absence across the whole machine is NOT claimed. No credentials/config contents or transcript were read.

Official V2 sources fetched on 2026-10-19:

- <https://opencode.ai/v2/docs/build/plugins>, retry policy/session reference/storage/prompt admission sections.
- <https://opencode.ai/v2/docs/build/client>, stream events and client operation contracts.
- <https://opencode.ai/v2/openapi.json>, operation IDs `session.switchModel`, `session.prompt`, `session.interrupt`, and `Session.Info` schema. Public spec is not the installed server's spec.

Verified **public-document** contracts:

1. `ctx.session.hook('retry', event)` may set `event.decision = { retry: false }`. Model/session/error/attempt fields are readonly. No cross-model retry routing is promised. Later plugins can overwrite the decision. Therefore the core records intent and vetoes retry, but `recover()` must run independently **after the hook returns**.
2. `ctx.session.switchModel({ sessionID, model: { providerID, id } })` affects subsequent turns. HTTP `POST /api/session/{sessionID}/model` body is `{ model }`. This does not itself continue failed work.
3. `POST /api/session/{sessionID}/prompt` durably admits input and schedules execution unless `resume:false`; accepts optional `id`, `text`, `delivery`, `resume`, metadata, attachments. The guide documents dedupe for an existing message ID. No ID-based recovery is implemented here because installed semantics and ID generation remain unverified; the safer outbox ambiguity stop is used instead.
4. **Interrupt discrepancy unresolved for the installed binary:** public HTTP spec says query `resume=false`; plugin overview says `continue:false`. Neither is guessed or called by this implementation.
5. `ctx.storage.get/set` is durable JSON per documentation, but no transaction/CAS/exclusive-owner semantics are promised. This core requires a single exclusive host owner and atomic durable replacement. A storage failure disables the instance and emits only a fixed sanitized notice.
6. Public events are live-only, with no replay or automatic reconnection. Do not implement reliable recovery using only volatile events. An installed-version-tested durable cursor/reconciliation source is still required.

## Core invariants

State progresses through `intent -> waiting -> reconcile -> switching -> switched -> admitting -> confirmed`. Each boundary is persisted before the next external action. `confirmed` means **recovery input admission acknowledged**, not model execution/completion. A root mode remains fallback for the task's lifetime; there is no return-to-paid or provider ping-pong.

All previously enrolled sessions are included when one encounters a verified paid-quota error; a future enrolled child inherits fallback intent. Enrollment validates direct parent membership, project and session identity. Persistent records validate root ancestry and cycles. Unknown sessions are ignored. The host must discover/enroll all descendants before dispatch: the core does not infer that the set is complete.

No generic 429, prose containing “quota,” auth, invalid input, context overflow or DNS failure triggers failover. `verifiedCodes` defaults to **empty**. Tests inject a fixture-only rule for structured OpenAI `insufficient_quota`; **that fixture is not production provider verification**. A real adapter must establish the provider-specific code's upstream provenance and its actual mapping into retry `error.message`. It must not copy arbitrary provider text into the ledger. Error classifications other than quota are separate; host-native retry policy is left unchanged for primary errors that do not qualify.

Recovery requires terminal execution, all tools settled, empty inbox, known side effects and a held dispatch fence. Unknown/in-flight tools, pending user input, missing/foreign evidence or unconfirmed model selection stop the task. It never replays an original prompt or tool call. The one fixed continuation asks the same session to use its existing context/partial work and stop on uncertain side effects. Safe context handling across providers still needs installed-host proof.

An interrupted switch can be retried as an idempotent selection setter only under that fence. Once `admitting` is persisted, a crash/timeout/missing ACK **never submits recovery again**; restart stops for owner reconciliation. If admission ACK is lost, the model may already have run: “stopped” is the supervisor's no-further-admission status, **not proof of cancellation**. Fallback errors (including quota, DNS and auth) veto retries and stop. A primary-model override after confirmed fallback stops. Repeated paid errors during the transition are coalesced. Delayed stale retry events after confirmation cannot be safely distinguished from overrides without host run correlation, so stop conservatively rather than silently reroute.

## Blocked seams — do not activate

The `host` argument is a **new staging port**, not an asserted OpenCode API. Its custom methods `identity`, `inspectSafe`, `admitRecovery`, `notice` and flags are mocked. `switchModel` uses the public V2 shape, but is also mocked here. No production host adapter is supplied.

Required evidence before a wrapper can honestly be built:

- Installed V2 plugin types/runtime contract, exact storage behavior and safe host lifecycle hook; retry-hook failure must reliably veto requests even if storage/notice throws.
- Independent, last-effective **pre-dispatch task-root fence**, covering coordinator, currently executing children, future children, tool continuations, auxiliary requests, and explicit subagent-model overrides. The docs' readonly `model` hook field is not a routing mechanism. `oh-my-opencode-slim` override behavior/order is **not verified or solved**. Capability booleans here are review gates, not detection.
- Complete descendant discovery and root/project/session identity attestation, cancellation/terminal semantics, sanitized durable inbox/tool reconciliation under that fence. An idle status alone cannot prove an external tool did not execute. Host notice delivery must be owner-visible without the paid coordinator producing another turn.
- Exclusive single-writer ownership across plugin instances/reloads/processes; serialized JS calls alone do not supply a distributed lease. Crash reconciliation must reacquire and hold the same fence before another switch/admission. No CAS/lease API is guessed.
- Provider error fixtures from verified upstream quota/billing markers; no account probes or paid quota consumption needed. Empty classifier rules intentionally prevent activation by accident.
- Recovery admission proof plus unknown-side-effect handling; if using message-ID idempotency later, independently test duplicate/concurrent/crash semantics against the installed version. Keep outbox ambiguity stop until proven.

These gaps block the stated fully automatic coordinator+children goal today. This staging implementation deliberately fails closed rather than representing mock flags as installed support.
