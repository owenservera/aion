# AION — Development master map (former Track B)
**Living integration index | 2026-10-20 | owner: Development | status: baseline, not an acceptance receipt**

**Use this page to answer:** What are we building, what is implemented and *where*, what remains unproven, which other integrations already exist, what Harvest can supply, what is next, and where can a different implementation approach be considered?

**Authority order:** [repository governance](../../../../REPOSITORY-GOVERNANCE.md) for Git/workstreams; existing Bus source + scoped grants for actual effects; [accepted two-way architecture (candidate PR #46)](https://github.com/owenservera/aion/blob/track-b/platform-local-candidate-20261020/workspace/aion/ops/chrome-relay/velocity/design/12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md) for P1–P8/I0–I3 architecture; [shared Harvest exchange](harvest/EXCHANGE.md) and [records](harvest/EXCHANGE.jsonl) for needs/offers/decisions; [Command Space](../command-space/README.md) for provider × command × route research; [STATE.json](../../STATE.json) for evidence-backed runtime facts. This master is a **navigation/status projection**, not a second Bus, runtime registry, grant store or alternative architecture authority. Its [machine-readable companion](DEVELOPMENT-INDEX.json) stores stable joins and statuses, **not** a duplicate command matrix or source ledger.

## Current owner direction — three-role leapfrog supply chain

**Purpose: ship AION faster by reusing strong existing source, including unexpected leapfrogs.** [Development working desk](workers/development/DELIVERABLES.md) chooses incoming source, integrates and tests AION. [Nine-Repo Discovery](harvest/external/workers/nine-repo/DELIVERABLES.md) proactively extracts high-value source intel (e.g. CDP, DOM, parsers, transport) and maps it to AION needs/contracts **without verifying functionality**. [Integration Manager](harvest/external/workers/integration-manager/DELIVERABLES.md) stages Dev-selected code as AION-compatible packages **without functional verification**. A donor repo's implemented functionality is presumed a strong starting point; acceptance happens at the final AION integration seam, not in Harvest. The earlier classification map below remains background, **not a freeze on Development or a requirement to fill every matrix row**.

**Two independent columns for every need:**
1. **In-house capability reality:** source owner, main/candidate/design status, tested/proven status, integration gate and unresolved gap (AION will own all implementation).
2. **External intelligence:** relevant methodology, failure/test pattern, and optionally a **specific documented protocol/contract** for compatibility. Record `NONE` or `UNASSESSED` explicitly. External sources do not become implementation dependencies; competing methods remain separately visible.

### Immediate source-grounded classification (nine-repo first pass)
| Development need / gate | In-house discovery finding | Harvest evidence classification | Disposition for this discovery phase |
|---|---|---|---|
| **DEV-04 — typed receive identity / I0** | Accepted AION `event/1`+`snapshot/1`; implementation receipt missing | **AX-0016:** epoch/sequence, passive observation, terminal-evidence methodology and negative-test scenarios. **AX-0017:** gap/reset/replay failure cases | **METHOD + NEGATIVE TEST**, not adopted protocol or donor journal |
| **DEV-05 — browser observation / P2** | AION-owned observer defined in design; no live proof | **AX-0016**, **AX-0018:** user-turn anchoring, orphan/remounted assistant detection, DOM observation | **METHOD + NEGATIVE TEST**, source observed only |
| **DEV-06 — transport / P3 and I1** | AION data-only MV3→host→IPC push + authoritative snapshot still to implement/verify | **AX-0017:** SSE epoch/cursor *approach*, not AION wire interoperability contract; potential tail-slice silent replay loss | **METHOD + FAILURE MODE**; no external protocol chosen |
| **DEV-08 — safe Send / P6, I2** | Existing extension Send not positively proven; one-effect Bus authority preserved | **AX-0018:** prompt/user-message confirmation and false-positive tests; backend turn ID is differentiated but private-route dependent | **METHOD + NEGATIVE TEST**, no donor actuation |
| **DEV-09 — recovery / P7, I3** | Existing Bus unknown-effect protection; interactive recovery pending | **AX-0016/0017:** epoch mismatch, lost retained cursor, ahead-of-stream same-epoch cursor, truncation | **FAILURE MODE + TEST METHODOLOGY** |
| **DEV-10/15 — OpenCode + native paths / P5, R5** | AION native adapter candidate source; Command Space registry is research only | ACP/MCP/native API/SSE **specific contracts may be considered**, but no new protocol adoption evidenced by nine-repo offers | **PROTOCOL-CANDIDATE RESEARCH**, entitlement/fidelity unverified |
| **DEV-12–14/16 — provider variation, lifecycle, attachments, semantic command / later** | Future AION-owned features, different maturity by source | Nine-repo preliminary categories, Omega/VIVIM crosswalk, VOMEGA parser method; some P0 operation coverage remains incomplete | **CATEGORIZED / FURTHER RESEARCH**, nonblocking |

**One concrete I0 counterexample worth classifying, not implementing here:** the inspected `chatgpt-bridge` journal selects the **last** N unconsumed retained events during replay. A caller may silently miss earlier retained events even without falling outside the journal retention window. Classify this as **potential replay-coverage defect, source inspected, not executed**; AION's future independent tests should require ascending pagination or an explicit coverage gap. See [nine-repo handoff](harvest/external/landing/triage/FIRST-PASS-DEV-HANDOFF.md), [AX-0017](harvest/EXCHANGE.jsonl).

**Discovery completion criterion:** for each relevant `DEV-...` area, identify AION's actual source/evidence status, aligned `AX-...` research items (if any), exact method/test/contract classification, fidelity/limitations, and what remains unknown. Preserve design decisions as separate and **do not move any I0–I3 implementation or live acceptance gate merely because research was delivered**. The machine-readable [index](DEVELOPMENT-INDEX.json) holds one classification per area, not another runtime/capability store.

## Development versus external leverage — explicit ownership boundary

**DEVELOPMENT (SELECT / OWN / INTEGRATE / TEST / MAINTAIN).** AION owns the integrated CLI, Bus/grants, receive/identity, provider adapters, recovery and tests, whether implemented freshly or adapted from selected external source. Development selects useful source and tests AION compatibility after integration. Existing Bus effect authority and unknown-effect locks remain authoritative.

**DISCOVERY (FIND / CATEGORIZE / MAP).** Harvest searches pinned repos for high-value reusable code, including unsolicited CDP, DOM, parsers, transport, identity and other development multipliers. It records exact locations and AION fit, **not donor tests or functional verification**. Do not require exhaustive source or 19×9 coverage when a leapfrog is ready to package.

**PROTOCOL / CONTRACT (SELECTIVE ADOPTION).** Harvest may recommend a **specific external/native protocol or data contract**—e.g. documented provider API/ACP/MCP/SSE semantics, frame format or identifier contract—only with a pinned source, exact purpose, fidelity/entitlement distinctions, compatibility assessment and meaningful benefit. Development chooses whether AION implements a compatible surface. Contract adoption is not wholesale donor-library, router or architecture import.

**INTEGRATION MANAGER (ADAPT / PACKAGE).** Actual source reuse is a **normal path for Development-selected opportunities**. The manager trims and adapts selected source to existing AION interfaces, stages concrete code/patches, and preserves source/license/dependency information. Development owns final integration and tests, including security/fidelity and license compatibility review. No alternative Bus authority, retry-on-unknown or silent privilege expansion.

**Separation in the [machine index](DEVELOPMENT-INDEX.json):** each area has `delivery_owner: AION_DEVELOPMENT` and `implementation_policy: IN_HOUSE`, meaning AION owns the adapted production behavior—not that every line must be written from scratch. Source intel and staged packages do not count as integrated/tested behavior. A methodology insight never becomes an implementation claim. The [single Harvest exchange](harvest/EXCHANGE.md) provides evidence summaries, not engineering assignments.

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

## 3. In-house development register — build and evidence only
**Everything in this table is AION's responsibility.** Source status may be on main, candidate-only, design-only or historical; none implies live acceptance. External lessons appear *separately* in section 6, never as a co-owner or delivery dependency.

| AION-owned area | Current state / source | Next AION engineering deliverable | Gate |
|---|---|---|---|
| CLI, commands, roles, context | Candidate `velocity/bin/aion-local.mjs`, `src/commands.mjs`, roster/context; test claims snapshot-specific | Reconcile useful candidate source into main with no implicit context egress | R0 |
| Bus admission, durable grants and no-resend | Existing `bus/`, `extension/src/bus/`; candidate Velocity direct implementation | Keep single Node effect writer; prove exact identity/no unsafe replay | R0/I0 |
| Identity, exact conversation binding and read scope | Candidate binding/preflight; new receive semantics not accepted as code | Define scoped, revision-aware binding separate from operations | I0 |
| Typed event and snapshot contracts | Accepted design P1 only | **Implement** `event/1`, `snapshot/1`, validators and negatives | I0 |
| Chrome DOM read-only observer | Accepted design P2 only | Own small source-specific observer with bounded message identity and page epoch | P2/I1 |
| Push hints and authoritative snapshot IPC | Existing bridge; proposed P3 receive seam only | Own data-only worker/host/IPC receive path | P3/I1 |
| Interactive terminal REPL/inbox | Accepted design P4 only | Own memory-only inbox, watch, cursor gap handling | P4/I1 |
| Chrome web Send and reply correlation | Legacy Chrome path failed real Send; UIA historical isolated actuation | Own exact-thread actuator after I1, one-effect proof, no fallback resend | P6/I2 |
| Restart/unknown-effect recovery | Existing Bus guardrails, conversation recovery unbuilt | Own non-text cursor checkpoint if useful and no-replay matrix | P7/I3 |
| Native OpenCode/ACP interface | Candidate engines/native option tests reported, not final-head green | Own typed OpenCode SSE/snapshot `ConversationSource` preserving native session | P5 |
| Local machine activation | Candidate dev native host setup / isolated Chrome profile; extension not confirmed loaded | Own truthful setup/probes, tests, rollback and dev isolation | R0/I1 |
| Cross-provider browser adaptors | Candidate read-only taxonomy tools, no second live provider | Own provider-specific adapters under common narrow contracts after I3 | R5 |
| Conversation lifecycle and advanced UI commands | Research catalog describes possibilities; browser implementation not proven | Own features only after target/action fidelity tests | R5 |
| Files/tools/artifacts | Candidate OpenCode file option tests reported; cross-provider UI unknown | Own attachment controls, scoped validation and browser-specific evidence | R5 |
| Provider native/API/Apps/MCP routes | Catalog exists, not executable router | Own verified adapter where distinct session/entitlement makes sense | R5 |
| Deterministic semantic compiler | Optional and **not MVP**, candidate read-only metadata | If admitted, AION writes pure parser/validator ahead of existing Bus | R6 |
| Acceptance suite / evidence | Historical Node/local reports, no current I1–I3 acceptance | Run current SHA tests and independent browser receipts | R0→I3 |
| Agent runtime expansion | Existing draft historical PR #35, on hold | No new execution program without owner scope | PARKED |

**AION as-built vs proposed is tracked independently** in [DEVELOPMENT-INDEX.json](DEVELOPMENT-INDEX.json); source paths above are pointers, not executable proof. External protocol references are not routes until AION implements and verifies them.

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
| Harvest → Development | **methodology advice** or specifically scoped **protocol/contract candidate** ↔ AION NEED | never a donor-code build assignment or feature ownership | **NON-BLOCKING ADVISORY** |

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

P2, P3, P4 and P5 can proceed in parallel **after** I0 with disjoint AION-owned files. **No Harvest delivery is a critical-path gate:** research may improve engineering choices without delaying a correct self-contained implementation. No repo-wide migration or generic framework is on the critical path. Scope of roadmap is the existing product, not a new program.

## 6. Harvest leverage — separate, optional knowledge plane
**Only shared intake/delivery:** [EXCHANGE.jsonl](harvest/EXCHANGE.jsonl) under [EXCHANGE.md](harvest/EXCHANGE.md); join by existing `topic` and `DEV-...` IDs. Discovery supplies raw intelligence; Integration Manager **does supply staged AION-adapted modules/patches**; Development integrates and tests them. Use two explicit questions: (1) *Which engineering methodology should we understand and possibly adapt?* (2) *Is there an external protocol/contract we should be compatible with?* Both can be answered **NONE** and AION proceeds.

| Evidence lane | Methodology insight (default) | Candidate external protocol/contract (only if useful) | AION ownership |
|---|---|---|---|
| Omega + VIVIM Final | identity layering, evidence/confidence separation, capability family definitions, negative verification | any independently useful typed identity/stream vocabulary, evaluated against P1 | AION owns all receive, Bus and provider code |
| VOMEGA | deterministic parse → resolve → validate → clarify; ambiguity/failure policies | possible formal semantic IR/validation rules, *not* VOMEGA CLI/router | AION designs optional compiler |
| Nine external repos | cursor/gap algorithms, browser observation technique, safe-send methodology, adapter separation, fixture/test patterns, failure cases | source-grounded wire/event/message contract only where interoperability or a proved simplification requires it | AION writes Chrome, host, REPL and provider implementations |
| Native provider/standards research | how provider sessions and lifecycles differ, fidelity hazards | ACP, MCP, SSE, native API endpoint/frame schemas under documented terms | AION chooses and implements adapters; never equates API session with existing web thread |
| Internal candidate PR #46 | **not Harvest**; source reconciliation of AION's own staged implementation | internal contract reuse is direct in-house engineering | AION integrates validated pieces into `main` |

**Nine external examples, not implementation owners:** `DrA1ex/chatgpt-bridge`, `TED-H-com/multi-ai-chat`, `ParkerCai/parallel-ai-extension`, `RaheesAhmed/Council`, `chathub-dev/chathub`, `ai-shifu/ChatALL`, `Octo-Lex/ChatGPT-Web2API`, `mehmetnadir/cdpilot`, `cereon-labs/cereon-browser-operator`. The existing snapshots support a **methodology/protocol comparison**, not source transplant ranking.

**Requested Harvest delivery (small and decision-useful):** `topic` + method/contract class + one specific practice or contract + evidence refs/version + conditions/limits + concrete benefit to AION + what (if anything) changes in *AION-owned code/tests* + recommended ADOPT_METHOD / REVIEW_PROTOCOL / NOTE_ONLY / REJECT. No mandatory winners, module code dump, research database rewrite or re-cloning. Disagreeing methods may both be documented; no auto-selection.

## 7. Flexible change/decision protocol
For each integration/capability in the index, track separately: **(a)** source-on-main **(b)** candidate branch source **(c)** research-only evidence **(d)** local test receipt **(e)** live verification **(f)** accepted target **(g)** decision **(h)** dependency/next gate. Never compress these into one misleading `implemented: true`.

**Each decision has two independent axes:** AION-owned implementation alternatives (actual source approaches) versus Harvest reference alternatives (methodology/protocol observations). A Harvest reference cannot be SELECTED as an implementation. It can inform an AION implementation design, or be accepted as a narrowly scoped external protocol compatibility requirement after evidence review.

Possible approaches are **open-ended entries**, not a fixed stack prescription. Record `approach_id`, `scope`, `origin`, `candidate_seam`, `evidence_ref`, `license_risk`, `tradeoffs`, `effect_and_fidelity_risk`, `status` = PROPOSED | EXPERIMENTING | SELECTED | REJECTED | DEFERRED, and `decision_ref`. Multiple alternatives are welcome; **one selected effect actuator per admitted operation**, and no unresolved-op resend.

**Decision locations:** technical architecture changes → [accepted design 12](https://github.com/owenservera/aion/blob/track-b/platform-local-candidate-20261020/workspace/aion/ops/chrome-relay/velocity/design/12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md), plus contracts/tests upon acceptance; harvest methodology/protocol review disposition → exchange DECISION with linked NEED/OFFER (not source-code adoption); source evidence → lane-owned cards and refs; branch/repo policy → REPOSITORY-GOVERNANCE.md; proven machine/runtime state only → STATE.json. Keep proposals PROPOSED, not retrospectively ACCEPTED.

**Open decisions for Development, not automatic defaults:** source migration slices from #46; exact event/snapshot version acceptance once P1 tests run; Chrome DOM actuator outcome at I1→P6; CDP/UIA suitability under current instruction; need for private non-text cursor checkpoint after I2; first second provider and actual same-thread-native paths after I3.

## 8. Routine maintenance — low overhead
- Change this overview and its companion only when a **meaningful** source/gate/status/integration decision changes; link the real file, SHA, evidence and date. Never auto-promote a harvested OFFER or `P0` research row.
- Record actionable gap/offer once in EXCHANGE.jsonl with matching `topic`. An approach can have multiple evidence sources, including conflicting implementations; source detail stays in Harvest.
- On a feature: write minimal tests → run them → commit on current main (or short-lived review branch) → record proof or precise limitations. Do not update `STATE.json` based on prose or mock tests.
- After accepted P1–P8 work, update the actual owning source and design 12 contracts; this is a **map**, not an implementation checklist that silently changes product behavior.
