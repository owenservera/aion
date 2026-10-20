# AION — Development master map (former Track B)
**Living integration index | 2026-10-20 | owner: Development | status: baseline, not an acceptance receipt**

**Use this page to answer:** What are we building, what is implemented and *where*, what remains unproven, which other integrations already exist, what Harvest can supply, what is next, and where can a different implementation approach be considered?

**Authority order:** [repository governance](../../../../REPOSITORY-GOVERNANCE.md) for Git/workstreams; existing Bus source + scoped grants for actual effects; [accepted two-way architecture (candidate PR #46)](https://github.com/owenservera/aion/blob/track-b/platform-local-candidate-20261020/workspace/aion/ops/chrome-relay/velocity/design/12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md) for P1–P8/I0–I3 architecture; [shared Harvest exchange](harvest/EXCHANGE.md) and [records](harvest/EXCHANGE.jsonl) for needs/offers/decisions; [Command Space](../command-space/README.md) for provider × command × route research; [STATE.json](../../STATE.json) for evidence-backed runtime facts. This master is a **navigation/status projection**, not a second Bus, runtime registry, grant store or alternative architecture authority. Its [machine-readable companion](DEVELOPMENT-INDEX.json) stores stable joins and statuses, **not** a duplicate command matrix or source ledger.

## 1. SITREP — reconciliation and confidence
- **Permanent integration target is `main`.** Main-only governance supersedes the candidate's older instructions to aim every child PR at a standing Track B branch. The accepted *technical design* remains applicable; review/port candidate diffs to current main in bounded slices.
- **Candidate runtime is NOT integrated:** [draft PR #46](https://github.com/owenservera/aion/pull/46), head observed `75d71cd3dcabed720db68ef04dda065a3f0f0ed2`; comparison with main at inspection: **208 commits ahead / 22 behind**, including substantial unmerged Velocity, adapter and test changes. This is not permission to merge wholesale. Recheck before each integration.
- **Main already contains** repository governance, the shared exchange, nine donor source snapshots, Omega/VIVIM/VOMEGA captures and 65-record crosswalk, and **40-command / 25-route / 1,000-row** Command Space catalog. The latter is supporting research, not a live router.
- **Candidate source reports** 1,082 passing, 0 failing, 9 skipped in an earlier owner-Windows selftest at `5f505d8` and three real OpenCode native interactions. Independent Claude review of a *different* snapshot (`4647bd4`) reported extension 757/757, bridge 126 pass + 1 skip, Bus 9 pass + 1 skip, Velocity 237 pass + **1 non-hermetic fail** + 1 skip. Neither receipt certifies current PR #46 or main as completely green.
- **Browser acceptance remains OPEN.** 2026-10-19 UIA independently actuated one real Send/reply readback, but the extension merely filled the composer; there was no accepted end-to-end extension relay/correlated receipt, two-turn CLI, negative test or restart recovery. No I1/I2/I3 receipts.
- **Freshness caveat:** `main` STATE.json still presents historical `WINDOWS_DRIVEN_LOCAL_AGENTS` and a frozen implementation phase; PR #46 contains a newer Track B source-development update. **Reconcile deliberately after verified promotion**; do not blindly copy candidate machine state onto main.

## 2. Product system — top down
```text
USER: one CLI / control pane / later ACP or MCP ingress
  ├─ Semantic intent, roles, session binding, native context selection
  │   ├─ READ plane: typed per-binding observer → push hint → read-only snapshot → inbox/cursor
  │   └─ EFFECT plane: CLI → existing Node Bus + one grant/ledger → one adapter → receipt
  ├─ PROVIDERS
  │   ├─ Existing ChatGPT web thread → MV3 worker ↔ native host ↔ guarded browser driver
  │   ├─ OpenCode V2 HTTP/SSE or ACP native session → native session identity
  │   └─ Later Claude/Gemini/Grok/etc → provider-specific adapters, shared contracts
  ├─ OPTIONAL EDGE / MACHINE: Windows UIA and CDP are evaluation candidates, never retries
  ├─ EVIDENCE: local tests, actual source/operation IDs, correlation, outcome confidence
  └─ INTELLIGENCE: Command Space research + Harvest provenance + Development dispositions
```
**Critical boundary:** API conversation, MCP ingress, browser tab, web-account identity and native OpenCode session are **different kinds of target**. Route fidelity, entitlement, readiness and effect authority are independent. No catalog row may dispatch.

## 3. Capability and integration coverage — current *source* vs target
`main` = integrated source present on main; `candidate` = PR #46/source branch; `design` = accepted direction only. LIVE means independently verified *specific* result; a code/test count is not proof of chat-web operation.

| Capability area / stable topic | Current source evidence | Desired integrated surface / blocker | Harvest or research leverage | Roadmap |
|---|---|---|---|---|
| CLI command grammar and role/context | Candidate Velocity `bin/aion-local.mjs`, `src/commands.mjs`, `src/agents-context.mjs`, `src/project-context.mjs`; source/local tests reported | Carry forward minimal compatible CLI on main; no implicit context send | VOMEGA NLCL only for *future* semantic compiler; PM/native roster adapters | R0, R1 |
| Effect admission, Bus, grant, no-resend | Main `bus/`, `extension/src/bus/`; candidate adds Velocity direct use | **Single Node Bus** effect writer; explicit scope, durable identities, unknown-effect guard | Omega/VIVIM identity/evidence crosswalk, not second queue | R0→R3 |
| Native host, Chrome bridge, local IPC | Main `bridge/`, `extension/`; candidate `velocity/src/native-host/`, `transport/` | Preserve original IPC; separate dev profile/host; event/1 must be **data only** | External bridge donor potential, presently not code-level allocated | R1 |
| Binding/read authority | Candidate `connect chief` and dev preflight, no accepted fresh receive contract | Exact provider/account/conversation binding, one bounded observer, scoped read | `receive.identity` AX-0001/0002/0006 | I0/I1 |
| Read-only ChatGPT observer | Accepted design 12 P2, **not shipped** | NEW `extension/src/providers/chatgpt/{observer,profile}.js` | Omega/VIVIM receive semantics; external-nine ownership pending | P2/I1 |
| Push/snapshot and gap transport | Accepted design 12 P1/P3, **not shipped** | `aion.conversation.event/1` + `snapshot/1` and `conversation.read`; no text in sanitized effect event broker | Nine-donor bridge/cursor patterns, inspect before reuse | P1/P3/I1 |
| Live interactive REPL/inbox | Accepted design 12 P4, **not shipped** | `aion chat chief --watch`, external incoming turns, cursor, in-memory text | C-004 identity/stream distinction | P4/I1 |
| Browser Send and paired checked reply | Existing page Send path attempted; **extension live Send failed** | After I1, one selected actuator, clean human text, baseline→observed user turn→candidate assistant→checked reply | Nine-donor Send patterns ONLY after safety/licensing review | P6/I2 |
| Recovery, drift and no duplicates | Bus unknown effect rules exist; full two-way recover pending | Restart, gap, page epoch, edits/branch revisions, no blind replay | Omega/VIVIM crosswalk; bridge donor | P7/I3 |
| OpenCode V2, ACP and native selection | Candidate engines/OpenCode options, 3 native operations reported | One normalized ConversationSource/SSE/snapshot; preserve native session IDs, cwd/grants | Native SDK and ACP docs; no second executor | P5 |
| Windows control/activation | Candidate browser setup, dev host installed; actual Chrome dev extension not loaded as reported | Status/probe/installer rollback/isolated dev Chrome profile; owner Windows only for execution | Windows UIA and CDP **evaluated alternative** only | R2/R4 |
| Provider adapters / families | Candidate read-only `platform/semantics.mjs`, `inspect.mjs`; Omega family donor metadata | Incremental provider-specific adapters only after ChatGPT I1/I2; avoid global taxonomy migration | Final + Omega provider/family/realization; external nine | R5 |
| Model, thinking, edit, lifecycle and files | 40-operation catalog **research only**; OpenCode native model/variant/file pilot separately tested | Keep provider-specific fidelity and effect classification; no browser feature claim | Command Space 19 P0 ops, external triage clusters 4/5 | R5/R6 |
| Native provider APIs / ChatGPT Apps/MCP | Command Space ROUTE-ORIGINS research; existing AION MCP source | Distinguish ingress into AION from outbound control of exact web conversation; verified entitlement only | 13 native provider lanes; TOOLSMITH native integration research | R5 |
| Semantic natural-language CLI | Candidate `platform/semantics.mjs` read-only; VOMEGA six KEEP/five ADAPT | Optional pure parser/validator feeding typed Bus intent; no donor router or automatic send | VOMEGA AX-0003/0005 | R6 |
| Broader agency / tooling | Agent Fabric PR #35 historical, on hold | No new agent runtime, framework, scheduler, database or communications system in present Track B scope | Research only until owner resumes | PARKED |

All code paths above are *owner paths*, not assertions that modules have passed a new local validation. See [index](DEVELOPMENT-INDEX.json) for joinable IDs and source-ref distinctions.

## 4. Integration seams and non-negotiable contracts
| Edge | Input → output | Allowed status / proof | Decision |
|---|---|---|---|
| CLI → Bus | authenticated intent + bound target + grant → immutable op ID | source present in candidate; prove reconciled on main | **KEEP**, no second effect ledger |
| Bus → provider adapter | exactly one `deliver()` → UNKNOWN or positive evidence | no retries after uncertain effect | **KEEP** |
| Page → observer | untrusted exact-bound DOM → typed bounded observation | epoch, message ID, revision, coverage | **BUILD** P2 |
| Observer → worker → host → IPC | **data-only** `aion.b.event` hint → subscriber | never grant or action; cap text/rate | **BUILD** P3 |
| IPC → REPL | push hints + `conversation.read` snapshots → in-memory inbox | resnapshot on cursor gap | **BUILD** P4 |
| Chat Send → observed reply | pre-send snapshot + one effect → distinct user message + paired candidate assistant | never infer checked from stop/idle | **BUILD** P6 |
| OpenCode native → typed receive | SSE + native snapshot → ConversationSource | exact native session, not web-thread replacement | **BUILD** P5 |
| Windows UIA/CDP → page | alternative actuator only when separately admitted | one actuator/attempt; no fallback on unknown | **EVALUATE** at P6 |
| Command Space → Development | researched operation/route/source docs → design consideration | **never** direct permission or availability | **REFERENCE** |
| Harvest → Development | evidence-linked OFFER/GAP ↔ NEED + DECISION | no auto import/implementation | **EXCHANGE** |

## 5. Roadmap / decision gates (not a second issue board)
| Gate | Next measurable result | Main dependency | Status |
|---|---|---|---|
| **R0** inventory & candidate-to-main diff | provenance, conflict list, offline baseline; isolate unique P1–P8 changes | current main + PR #46 | OPEN |
| **I0 / P1** shared typed event and snapshot contract | event/1 + snapshot/1 validators, text limits, identities, no action verbs; fix non-hermetic test | R0; accepted design 12 | OPEN, CRITICAL |
| **P2** Chrome observer | bounded, *read-only* page observation/negative fixtures | I0 | OPEN |
| **P3** push/snapshot IPC | authenticated data-only subscriptions, no effect reachability | I0 | OPEN |
| **P4** watch-only CLI | incoming messages while idle, memory-only text, gap/leave/rejoin | I0 | OPEN |
| **P5** OpenCode conversation source | typed native stream + authoritative native snapshot | I0; parallel | OPEN |
| **I1** watch-only live Chrome receipt | exact bound thread, independently originated new message, no Send | P2+P3+P4, owner Windows test | NOT VERIFIED |
| **P6/I2** Send + two live turns | chosen actuator, one effect each, two checked replies in same web thread | I1, authorization, identity and original unknown op reconciliation | NOT VERIFIED |
| **P7/I3** robust recovery | restart, cursor gap, uncertain Send, **zero replay**, explicit evidence | I2 | NOT VERIFIED |
| **P8** retire old browser scanners | no duplicate observer/sender, regression/rollback, preserve A historical | I3 and tests | BLOCKED |
| **R5/R6** cross-provider/native/semantic expansion | independently proven two-provider parity; bounded capability additions | working I1–I3, source triage | LATER / research only |

P2, P3, P4 and P5 can proceed in parallel **after** I0 with disjoint file ownership. No repo-wide migration or generic framework is on the critical path. Scope of roadmap is the existing product, not a new program.

## 6. Harvest supply map and demand
**Only shared operational intake/delivery:** [EXCHANGE.jsonl](harvest/EXCHANGE.jsonl) under [EXCHANGE.md](harvest/EXCHANGE.md). Link by stable `topic`. Never maintain competing per-agent requests, clone the donor trees again or duplicate the command matrix.

| Source lane | Existing holdings | Highest-value request | Delivery condition |
|---|---|---|---|
| Omega + VIVIM Final | `harvest/landing/sources/vivim-omega/`, `vivim-final/`, `synthesis/` 65-ID crosswalk | observation identity, provider family, readiness vs authority, receipts | one topic OFFER/DECISION with C-004 ID and seam |
| VOMEGA | `landing/sources/vomega/RETENTION-ASSESSMENT.md` and pinned sources | pure deterministic parse → ground → validate/clarify | distinguish 6 KEEP/5 ADAPT from rejected second CLI/router |
| Nine external repos | `harvest/external/landing/donors/` and `external/sources.json`; **triage not done** | assign owner per receive, Send, adapters, lifecycle, files, CDP, native | repo/commit/module/license/test evidence; one primary, <=1 differentiated backup; then OFFER/GAP |
| Frontier / provider-native | `velocity/research/` and `ops/command-space/` (40/25/1000) | provider fidelity, documented path, entitlement and test criteria | verified docs *vs* account proof, route origin and same-thread caveat |
| Development | current Bus/CLI/adapters/tests and accepted design | expose now + future contract gaps; accept/defer/reject deliveries | DECISION links actual source path, test and gate |

**Nine source inputs, not yet code-level winners:** `DrA1ex/chatgpt-bridge`, `TED-H-com/multi-ai-chat`, `ParkerCai/parallel-ai-extension`, `RaheesAhmed/Council`, `chathub-dev/chathub`, `ai-shifu/ChatALL`, `Octo-Lex/ChatGPT-Web2API`, `mehmetnadir/cdpilot`, `cereon-labs/cereon-browser-operator`. The triage [brief](harvest/external/02-REPO-PRIORITIZATION.md) and [delivery contract](harvest/external/DELIVERY.md) specify proof and dedup. **No provider/repo owner has been verified simply by this list.**

## 7. Flexible change/decision protocol
For each integration/capability in the index, track separately: **(a)** source-on-main **(b)** candidate branch source **(c)** research-only evidence **(d)** local test receipt **(e)** live verification **(f)** accepted target **(g)** decision **(h)** dependency/next gate. Never compress these into one misleading `implemented: true`.

Possible approaches are **open-ended entries**, not a fixed stack prescription. Record `approach_id`, `scope`, `origin`, `candidate_seam`, `evidence_ref`, `license_risk`, `tradeoffs`, `effect_and_fidelity_risk`, `status` = PROPOSED | EXPERIMENTING | SELECTED | REJECTED | DEFERRED, and `decision_ref`. Multiple alternatives are welcome; **one selected effect actuator per admitted operation**, and no unresolved-op resend.

**Decision locations:** technical architecture changes → [accepted design 12](https://github.com/owenservera/aion/blob/track-b/platform-local-candidate-20261020/workspace/aion/ops/chrome-relay/velocity/design/12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md), plus contracts/tests upon acceptance; harvest reuse disposition → exchange DECISION with linked NEED/OFFER; source evidence → lane-owned cards and refs; branch/repo policy → REPOSITORY-GOVERNANCE.md; proven machine/runtime state only → STATE.json. Keep proposals PROPOSED, not retrospectively ACCEPTED.

**Open decisions for Development, not automatic defaults:** source migration slices from #46; exact event/snapshot version acceptance once P1 tests run; Chrome DOM actuator outcome at I1→P6; CDP/UIA suitability under current instruction; need for private non-text cursor checkpoint after I2; first second provider and actual same-thread-native paths after I3.

## 8. Routine maintenance — low overhead
- Change this overview and its companion only when a **meaningful** source/gate/status/integration decision changes; link the real file, SHA, evidence and date. Never auto-promote a harvested OFFER or `P0` research row.
- Record actionable gap/offer once in EXCHANGE.jsonl with matching `topic`. An approach can have multiple evidence sources, including conflicting implementations; source detail stays in Harvest.
- On a feature: write minimal tests → run them → commit on current main (or short-lived review branch) → record proof or precise limitations. Do not update `STATE.json` based on prose or mock tests.
- After accepted P1–P8 work, update the actual owning source and design 12 contracts; this is a **map**, not an implementation checklist that silently changes product behavior.
