# AION Platform — semantic master seed and governing command protocol (design v0.1)

> **RESEARCH/DESIGN BACKGROUND — NOT ACTIVE TRACK B ENGINEERING POLICY:** See [12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md](12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md). The design-directive/governance machinery is frozen for this delivery. Existing design-only CLI tools remain available until an explicit compatibility-safe migration; do not expand them or infer authorization from the seed.

**State:** PROPOSED DESIGN ONLY, not an implemented command protocol, approved taxonomy migration, imported VIVIM runtime, or additional source of grants. **Date:** 2026-10-20. **Scope:** the **existing Chrome Extension Track B workstream**, expanded conceptionally to the AION Platform (CLI, Bus, browser interfaces, agents, adapters, native executors, future MCP/pane surfaces). **Primary:** [Track B #32](https://github.com/owenservera/aion/issues/32); [strategy #38](https://github.com/owenservera/aion/issues/38); [strategy PR #39](https://github.com/owenservera/aion/pull/39).

**Machine-readable companion:** [platform-semantic-seed.json](platform-semantic-seed.json) (`aion.platform.semantic-seed/0.1`). **Evidence:** [Crosswalk C-003, PR #41](https://github.com/owenservera/aion/pull/41), immutable head `7fcd334a07086282cfcb0097d198ce2017ccafad); [integration queue](https://github.com/owenservera/aion/blob/7fcd334a07086282cfcb0097d198ce2017ccafad/workspace/aion/ops/chrome-relay/harvest/landing/synthesis/integration-queue.md). Remote donor capture PRs [Final #40](https://github.com/owenservera/aion/pull/40) `4454f9b` and [Omega #37](https://github.com/owenservera/aion/pull/37) `556aaaa`. Source bases: `vivim-final@8a798f91` and `vivim-omega@79ee558d`. These captures are research evidence: 27 Final copied, 26 Omega copied and 12 Omega flagged, NOT verified provider capabilities.

## 1. Mission: design upstream, build in parallel

AION Platform is the shorthand for the current Chrome relay/extension, CLI, command interface, Bus, provider adapters, agent/runtime connections, observation and future surfaces. The design initiative must establish **a shared semantic destination, command-governance rules and pre-specified build packets**, so AION development is not forced to invent taxonomy, command meaning and provider architecture sequentially as features arrive.

There are **three independent tempos**:
- **Harvest** captures, flags, quotes and crosswalks donor intelligence; never promotes it to truth.
- **Platform Design** owns the **master seed**, explicit decisions, provider/capability architecture, protocol specifications, acceptance templates and pre-designed implementation packets.
- **Track B Development** continues its current proven critical path, adopts *only* accepted and testable packets through existing owners, and returns evidence. No automatic source/code changes from Harvest or design directives.

Design can prepare years of *conceptual* capability space before the present Chrome Send/readback proof. Runtime must implement only what is grounded and admitted.

## 2. Authority and precedence — do not create a second kernel

The immutable **authority boundary** remains in `extension/src/bus/`: `aion.bus/1` ledger/grants/registry/validator, one writer, exact bindings, durable operation identities and no-resend. `velocity/src/commands.mjs` is the actual CLI parser; `velocity/src/readiness.mjs` currently projects `aion.capability/1`; `velocity/src/result.mjs` derives `aion.result/1` from Bus state. Chrome has its own actuation/observer journal; OpenCode V2 and ACP own their native adapter semantics. `aion.rpc/1` is currently a pure validator; `aion.control/1` and `aion.rpc/2` are **proposed** and not assumed implemented.

**Precedence for any effect:** owner/runtime authority and active AION contracts > verified actual provider/adapter facts > accepted implementation specification > design seed > donor evidence. A design seed cannot grant a permission, mark a site READY, bind a conversation, select a click target, modify a Bus record or invoke a model. GitHub commits do not wake runtime agents.

**Three kinds of commands — never conflate:**
1. **Design directives** (`aion.platform.directive/0.1` below) assign architectural research/decisions/specification/build packet creation. They are **documents**, not executable commands or permission.
2. **Operator intents** (current actual `aion send...`, `observe...`, `capabilities`; future optional `aion.control/1`) are parsed and admitted only by the **existing** runtime.
3. **Adapter effects** (ChatGPT page one-send, OpenCode native prompt, local disposition/Stop if separately supported) require existing Bus grants, target binding and adapter-specific confirmation. Design grammar cannot add effect verbs to the current Bus grammar.

## 3. The semantic master — five orthogonal layers

**Layer A — Entity and identity ontology.** Provider *family*, concrete provider, application archetype/shape, interface surface, realization mechanism, adapter, runtime/executor and transport are **different axes**; model/vendor/account, role/agent, session, conversation, stream, message, operation and event are different identities. Never overload `provider_type` to mean both UI family and API_NATIVE/BROWSER_MEDIATED. Relevant donor leads: VF-0001..0005, VF-0010, VF-0019/0021/0025; VO-GH-0001/0003/0007.

**Layer B — Semantic capability.** A stable ID denotes a meaningful operation with typed input/output, side-effect class and required evidence; provider instances supply a realization *if* supported. Example `conversation.send` is an abstract obligation, not evidence that Claude and ChatGPT have the same DOM/Send behavior; `executor.prompt` is a separate native-runtime semantic. An adapter may support only a subset. Donor: VF-0005/0008/0011, VO-GH-0005/0009/0015/0035.

**Layer C — Contextual resolution.** Distinguish static declared capability, configured implementation, current bound surface, `present/visible/enabled/unique`, observation age/freshness, prerequisites, user/owner authority and current effect status. Historical donor `PROMOTED` cannot become `READY`. Fail closed on unknown/malformed rules, unknown risk, contradictory controls, absent or stale observations. Donor: VF-0006/0007/0020/0022/0026; VO-GH-0028/0029/0030/0031/0033. AION governing CENV-01/02/03 and DATA-01..06 remain the runtime contract.

**Layer D — Operation and evidence.** Immutable command/operation ID, separate dispatch attempt, positive submission, paired reply check, causal observation/method/reason and reader delivery. `stream complete` and `session idle` are NOT `reply checked`. Existing Bus ledger and current result view govern truth; semantic seed produces no alternate state machine. Donor: VF-0012..0017/0023/0027; VO-GH-0010/0032/0036/0037.

**Layer E — Evolution/provenance.** Every semantic record records source item/revision, evidence type, original donor term, precise AION mapping, adoption status, compatibility implications and validation. Aliases are non-authoritative mappings until accepted; a stale donor description must never override actual page evidence.

Use **composition**, not automatic class inheritance. The prototype entity relationships in the JSON seed are design vocabulary only; not a database mandate or live provider registry.

## 4. Governed design-directive protocol (proposal, not wire API)

A future planning/design worker or human can write a versioned *design directive* as JSON, Markdown or GitHub issue. This is **not currently parsed or executed by AION**. Fields are intentionally compact and portable across human/agent workstreams.

```json
{
  "schema": "aion.platform.directive/0.1",
  "id": "APD-001",
  "mode": "DESIGN_ONLY",
  "verb": "SPECIFY_CAPABILITY",
  "subject": "conversation.send",
  "target": "track-b/semantic-contracts",
  "inputs": [
    "aion.platform.semantic-seed/0.1",
    "harvest:VF-0005@4454f9b",
    "harvest:VO-GH-0005@556aaaa"
  ],
  "required_outputs": [
    "existing-owner map",
    "provider-specific realization obligations",
    "negative tests",
    "backward-compatibility and rollback"
  ],
  "constraints": ["NO_BUS_REPLACEMENT", "NO_LIVE_EFFECT", "UNKNOWN_FAIL_CLOSED"],
  "decision_state": "PROPOSED",
  "execution_authority": null
}
```

The illustrative `target` is a logical design target, **not a Git branch, runtime endpoint, binding or permission**. This example does not create an agent task or grant a shell/browser operation.

**Design verbs and their expected artifact:**

| Verb | Owner / output | Side effects permitted by the verb itself |
| --- | --- | --- |
| `INDEX_EVIDENCE` | Harvest: capture index/immutable source anchors | None outside research artifact files |
| `MAP_SEMANTICS` | Platform Design: semantic aliases, collisions, ancestry, missing meanings | No runtime edits |
| `EVALUATE_ARCHITECTURE` | Platform Design: options, measured costs, decision packet | No runtime edits |
| `DECIDE_CONTRACT` | Authorized design owner: decision, version and explicit disposition | No runtime edits or grants |
| `SPECIFY_CAPABILITY` | Design: typed semantic + provider obligations + evidence and negative tests | No runtime edits |
| `EMIT_BUILD_PACKET` | Design: atomic implementation-ready plan and owners | No automatic dispatch |
| `VERIFY_IMPLEMENTATION` | Actual authorized runner/reviewer: tests and receipts, or UNRUN/BLOCKED | Only separately permitted tests/inspection |
| `PROMOTE_SPEC` | Design authority: accepted semantic version/compatibility notice | Does not install, grant, or activate provider |

These design verbs **do not belong in** current Bus `OPS=['send','status','cancel']`. A future automation may consume directives **only** after a separately versioned, reviewed compiler/dispatcher maps allowed work to the existing Bus and owner policy. A GitHub comment, text instruction or donor command never executes just because its JSON matches this shape.

**Design task states:** `PROPOSED → SOURCE_GROUNDED → DECISION_READY → DECIDED → SPECIFIED → BUILD_PACKET_READY`; implementation has its **own** `IMPLEMENTED / OFFLINE_TESTED / WINDOWS_VERIFIED / REAL_PROVIDER_VERIFIED` receipts. Do not mark design completeness as runtime success. Return explicit `BLOCKED_EVIDENCE`, `DEFERRED`, or `REJECTED` without fabricated milestones.

## 5. Governed runtime-command mapping (future shape only)

One supported user command should flow through **existing code ownership**, never through the seed as an executor:

```text
Human/CLI/MCP/pane intent
    │ parse & validate actual supported syntax
    ▼
Existing Bus binding + grant + capability snapshot + durable admission
    │ resolve exact target, freeze operation identity, reject unsupported/unknown
    ▼
Provider-specific adapter / authorized runtime
    │ attempt ≤ 1 if external effect may be possible
    ▼
Read-only observation & reconciliation
    │ causal, stage-specific positive evidence or UNKNOWN
    ▼
Existing Bus-derived aion.result/1 + consumer receipt
```

Semantic descriptor → adapter capability projection → **current** parser/Bus permission check → one effect → evidence. The design packet may *propose* a new operator verb, but adding it requires a separate compatibility review of the CLI, Bus `OPS`, adapter manifest, command grammar, grant semantics and result mapping, plus negative tests. Nothing in this seed creates a hidden fallback route.

**Truth invariants:** a provider manifest cannot prove live readiness; a loaded adapter cannot establish authority; transport ACK cannot prove Send; page status alone cannot advance a historical operation; unknown effect cannot be resent; disposing an operation is not a message cancellation. The command output should explicitly report `UNSUPPORTED`, `UNKNOWN`, `BLOCKED` or other existing bounded reasons rather than fabricate a capability.

## 6. Pre-designed implementation packet contract (the development accelerator)

Every build packet prepared by Platform Design must be independently executable by an implementation agent **after explicit acceptance**:

```text
PACKET ID / seed revision / approved decision ID
Intent and concrete user-facing result
Existing source owner(s) + exact baseline commit and exported contract
Donor evidence references + copied-scope limitations
What to keep / what to adapt / what is explicitly rejected
Semantic IDs and aliases; exact current CLI/Bus/adapter mapping
Inputs, outputs, evidence, threat model, and permitted side effects
Minimal code/test changes with *no* implicit schema migration
Negative acceptance cases, including no-resend/unknown/ambiguous/expired-grant
Test commands and expected receipts; Windows/live gating separately identified
Backward compatibility, rollout flag/guard, rollback and verification owner
Current status: DESIGN_ONLY / READY_FOR_OWNER_DECISION / ACCEPTED_FOR_BUILD / BUILT / VERIFIED
```

Agents should not need to rediscover semantic meaning to implement an accepted packet. They **must** still inspect current head/source, confirm permission, and adapt the packet if code/requirements drift; design never overrides actual code and permissions. Multiple design packets may be prepared concurrently, while hot-path implementation keeps the existing WIP limit.

## 7. Taxonomy migration decision: initial disposition

From C-003 evidence queue [04 P1], prefer **retain current runtime schemas and extend with versioned metadata and a read-only alias/crosswalk**. Do not run a one-time taxonomy migration now; migration remains an explicit revisitable decision **D1** in [roadmap §9](02-BUILD-ROADMAP.md). The remote donor evidence does not establish active Final plugin-interface ownership (VF-0010 vs VF-0025) or independently tested second live webapp. Migrating before that could turn false equivalences into persisted facts.

**Migration trigger (future):** verified cross-provider collision the current abstractions cannot represent; accepted canonical semantic definitions; full list of serialized consumers and historical records; additive/alias approach shown materially insufficient; synthetic legacy fixtures; dry-run/rollback including unresolved Bus/browser journal records; actual owner approval. Never rewrite operation/grant/binding IDs merely to rename taxonomy.

## 8. 12-item Harvest queue → pre-design schedule

Source queue categories are **recommendations**, not accepted runtime changes:

| C-003 IDs | Design packet group | Earliest safe integration |
| --- | --- | --- |
| 01–03 | Rules/risk fail-closed, no-resend, exactly-one target — explicit **rejection laws** | Encode as nonregression tests in current CENV work; do not import donor code |
| 04 | Provider family/type/shape/realization/surface classification | First: design-only read-only mapping |
| 05 + 07 | Evidence/provenance, operation/session/message identity separations | Add only actual missing reason/evidence fields to existing views |
| 06 | One canonical read-only command/capability introspection | Existing Bus registry + CLI readiness, no second registry |
| 08–09 | Bespoke application shapes and historical proof vs live readiness | After one real second-provider conformance experiment |
| 10–11 | Competing interface ancestry and flagged discovery owners | Source research; do not block Chrome MVP |
| 12 | Unsafe literal donor transfer | REJECT except separately approved future research |

## 9. Conformance examples to bake into future packet tests

1. A malformed/unknown capability rule or default-risk classification yields NO privileged capability activation.
2. A visible but duplicated Send control or stale bound page yields no Send, even if selector score is high.
3. An API/Chrome acknowledgement lost after possible dispatch never produces a second send, new operation ID or alternate transport fallback.
4. A static Claude donor manifest exposes taxonomy metadata but no AION authorization, adapter availability or live capability claim.
5. Omega `PROMOTED` and Final `stream complete` never become AION `READY` or `REPLY_CHECKED` without task-bound evidence.
6. `aion capabilities` and `aion observe` are observational operations and cannot mint grants.
7. Identical text can refer to two explicitly authorized different operations; content hash alone is not operation identity.
8. A source finding with unknown revision, partial module read or simulation provenance stays flagged; it cannot be called live-verified.
9. A future provider-specific capability missing from another provider is UNSUPPORTED, not silently executed through a different adapter.
10. A design directive whose `execution_authority` is null cannot call shell, browser, ACP or OpenCode simply because a GitHub issue exists.

## 10. Adoption gates and workstream coordination

**Gate G-S0 — Seed review:** confirm every semantic axis is a meaningful distinction and every current mapping points to a real source owner; correct names without touching runtime state. **G-S1 — Design authority:** explicitly accept D1 taxonomy posture and this master seed as design convention (not executable policy). **G-S2 — Packet factory:** create at least three grounded build packets in parallel (provider metadata, evidence projection, command surface), each with owned files, tests, no-regression and rollback. **G-S3 — Implementation acceptance:** only existing Track B dev picks an admitted packet once the active Chrome critical path permits it. **G-S4 — Real provider expansion:** independently verify a second genuinely different webapp before generalizing UI behavior.

**Convergence point:** Harvest A/B/C PRs remain unmerged evidence sources until separately reviewed; strategic PR #39 contains this proposal; implementation Track B #34 continues separately. Do not merge these branches or claim live behavior merely because this file is committed.

**Working definition of success:** the next developer receives a command/capability build packet with stable semantic meaning, existing owner path, explicit adapter obligations, safety proof, tests, compatible rollout and provenance—**without having to hold another architecture-design discussion before coding**.
