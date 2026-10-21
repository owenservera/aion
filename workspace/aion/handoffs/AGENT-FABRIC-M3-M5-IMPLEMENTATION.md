# AION_HANDOFF_V1 — Agent Fabric M3–M5 Local Engineering Contract

**Status:** Implementation-ready specification, NOT installed or executed.
**Companion:** workspace/aion/handoffs/AGENT-FABRIC-OPENCODE-M1-M2.md
**Architecture:** workspace/aion/canon/AGENT-FABRIC-ARCHITECTURE-2026-10-20.md
**Schemas:** workspace/aion/agent-fabric/contracts/*.schema.json

## Execution contract

Execute M1/M2 first; when OpenCode V2 is missing, continue deterministic offline M3 interfaces and tests, mark live tests BLOCKED, and do not install or upgrade engine versions without actual local approval. Start AION implementation from origin/track-b/implementation-rounds-20261019, not the docs-only design branch. Import only reviewed relevant design files. ZCode authoring/compilation stays in the existing zcode-setup playbook. Do not change Global PM's read-only charter.

The owner's Windows machine is master. No GitHub Actions, Playwright, Puppeteer, Orca, Slack, second Bus, parallel global registry, cloud controller or hand-maintained duplicate agent manifests.

## M3 — ContextPack v1

**Modules, as additive Track B code:**
- velocity/src/context/sources.mjs: read-only providers for AION roles/project AGENTS, PM evidence, SOFTWARE_HQ docs and project SITREPs. Each source carries source URI, SHA/commit, classification, sensitivity, freshness, observation/collection UTC and limitations. Missing source = UNKNOWN.
- velocity/src/context/resolver.mjs: resolve one task/work ID + role + deployment + principal + project to minimum relevant source ranges. Read actual files and task refs; never copy every conversation. Refuse symlink escape and secret content.
- velocity/src/context/budget.mjs: deterministic ranked inclusion and output reserve; prefer runtime tokenizer if verified, otherwise label estimates. No hidden truncation and no speculative context-window values.
- velocity/src/context/verify.mjs: exact content hashes, audience ACL, stale/contradicted evidence labels, data-vs-instruction trust and change detection.
- velocity/src/context/render.mjs: read-only context plan/inspect commands; opt-in task context send after proven authorization. ContextPack manifest SHA is computed and stable for a pinned source selection.

**CLI proposal:** aion context plan chief --task WORK_REF ; aion context inspect CTX_ID ; aion send chief "task" --context task (only after explicit native authorization). Ordinary send remains unchanged. The Chrome Bus text maximum stays 2,000 characters; oversized browser context FAILS BEFORE admission. OpenCode/ACP may load native workspace file refs when actually supported/authorized; do not bypass tool policy. Source content is not authority.

**M3 acceptance tests:** repeatable content hash and canonical ordering; stale source, source hash mismatch, contradictory status, invalid audience, denied project, secret file, symlink traversal, unverified source, offline PM, oversized Chrome prompt; read-only planning makes zero Bus writes. A Research role file does not imply live Research deployment.

**M3 pass:** 2 real task-specific context plans with complete included/omitted source ledger, correct budget, no secret crossing, reproducible digest and focused Node tests. Actual dynamic retrieval marked separately.

## M4 — Agent delegation and task/evidence correlation

**Use existing authorities:** Project task/issue is authoritative for work outcome; existing AION Bus is authoritative for operation admission/no resend; native OpenCode/ZCode/ZBot session is authoritative for session state. New AION data contains only correlation links: work_ref -> handoff_id -> attempt_id -> native session -> operation_ref -> evidence refs. No new project task DB or Bus.

**Native adapter contract (implement only needed adapters):**
- probe(): runtime/version and separately installed/reachable/authenticated/ready/authorized, with evidence refs.
- createOrAttachSession({workspace,agent_ref,context_pack_ref}), native SDK/ACP or existing bridge.
- sendOnce({handoff,nonce,expectedBindingRevision}), using existing Bus grant/reservation.
- observe({attempt_id,session_ref}), read-only with native events; never resends.
- cancel({attempt_id}), record stopped versus side effect may already be attempted.
- collectEvidence({attempt_id}), linked artifact URL/hash, test output, verification class and timestamps.

**Delegation policy:** Child effective capabilities = intersection of owner approval, Bus grant, task scope, parent limits, child native permissions and host/OS controls. Crucial OpenCode V2 fact: child agents have their own permission rules, NOT automatically inherited parent rules; explicitly compile/test child deny. Start depth=1, one write executor per worktree and at most two read-only assistants when warranted. No agent may expand resource audience or escalate project scope.

**Initial real scenario:** Chief/controller is explicitly bound and authorized for one project work item. It delegates a read-only reviewer to OpenCode V2 in a scoped checkout. Reviewer cannot call edit/shell/external_directory/subagent/web/MCP; returns file-line findings or no findings with source commit. Chief verifies findings and links the verified receipt to native task. PM only observes from its normal read-only sources. A model message != verified completion.

**M4 negative gates:** conflict/race between two task attempts, unknown external send outcome, process crash, child refuses, policy escalation, source changed since context sealed, disconnected model, parent canceled after side effect. UNKNOWN sends reconcile read-only; never retry automatically. Implement a concrete parent-child trace when V2 exists, otherwise offline mocks are labelled OFFLINE_ONLY.

## M5 — Portfolio integrations and one-command acceptance

**Capability categories:** agent_list, child_session, event_stream, tool_permission, read_files, edit_files, browser_send, file_context, model_select, interrupt, checkpoint, scheduled_run, image_input. Each feature has live-probe yes/no/unknown/incompatible, checked_utc and evidence_ref. Binary present or configured model is not READY. Model provider authorization/quota/latency are observed separately. Do not switch model after an uncertain side effect.

**Owners / adapters:**
- AION: unified command, existing Bus, Chrome Track B, agent role mapping; NEVER edit stable Track A.
- zcode-setup: canonical playbook definitions/compiler and native conformance; no manual generated .zcode agents.
- zcode-bots: native Bot/task/attempt/memory refs where verified; no duplicate memory writer.
- 001.PROJECTS.PM: config/projects.json + config/sources.json + out/current.json, READ-ONLY. No assignment/status writes.
- SOFTWARE_HQ: curated app/OpenCode/ACP docs references and source freshness; never silently install software.
- hq: host health resource signals only; no claim of agent authority.
- Product_Hub: passive capability candidates only, never executable without review.
- VOMEGA: capability/audit patterns only, not another host inside AION.
- zcode-pocket: future client of existing ACP hub, not new controller.

**One-command final acceptance:** aion ask chief "Review project X, delegate code checks and return verified results" must (a) resolve exact project/task and verified target, (b) prepare inspectable ContextPack, (c) obtain exact permissions or pre-authorized narrow grant, (d) submit one operation, (e) delegate one bounded child, (f) correlate child session and evidence to work item, (g) return tested result and PM evidence reference without modifying PM. No always-on daemon for direct V2; browser requires its existing native host.

**Live/progression gates:**
A. Verify installed Node, OpenCode (must be V2 for V2 config), ZCode and native API; incompatible = explicit fail.
B. Role 09 is DESIGNED_UNREGISTERED unless truly linked; alias ambiguities refuse.
C. Unauthorized tool calls must fail, including child default rights, secret/external path and shell.
D. Actual one parent/child task and reviewed artifact; synthetic tests never count as live.
E. Chrome B one controlled real send/reply + no duplicate on timeout; unknown -> observe only.
F. Local head tests, rollback of B-only host, independent risk review and verified receipts.

**Local closeout format:** report each repo+branch+SHA, Node/Bun/OpenCode versions, exact test commands with passed/failed/skipped, M1–M5 states (PROVEN/OFFLINE_PASS/UNRUN/BLOCKED/FAILED), artifacts/evidence URLs, permissions and model lane proof, unresolved blockers and minimum owner-only steps. Do not reuse older head's test results, publish secrets, force push or merge to main automatically.

**Priority order:** prove one small end-to-end loop before generic orchestration, UI, semantic vector DB, remote A2A or a new task/event service. Natural-language convenience is not permission escalation.
