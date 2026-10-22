# Systems / Algorithms / Usability — Five-Sprint Workplan
**Authorized by owner:** 2026-10-22, “assess worklog queue for you and break into 5 sprints and begin sprint 1.”
**Lane:** Systems independent architecture, algorithms, usability. **Base source:** AION main `34e1a913248c717c7f3d7c54f4be30bc9b23a098` (2026-10-22 14:51:41Z). **Evidence mode:** source/contract/document analysis. **Product edits and independent QA:** forbidden by this plan; no live browser work/sends, no agents activated.

## Queue reconciliation
Previous SYS1–SYS6 in [TASK-QUEUE.md](TASK-QUEUE.md) are **complete source investigations**, delivered in [ASSESSMENT-01.md](ASSESSMENT-01.md); do not replay them. Remaining prior NEXT items are incorporated below. Canonical build ownership is elsewhere:
- Core owns backend/CLI/API, capture, evidence, knowledge integration and lifecycle.
- UI owns frontend, navigation, client state and visualization.
- Knowledge & Learning owns L4/L5 specialist algorithms/evaluation, with Core integration dependencies.
- QA owns testing, acceptance and team steering.
- Development/Track B is to consume **one Studio engine**, by owner's recorded 2026-10-22 decision, not build a parallel browser actuator.

**Changes since assessment 01:** Studio now has a conversation runtime, service/adapter, Chat and Drive UI, host-local lease, measured synthetic capture-path optimization, and accepted *direction* to consolidate the legacy Track B path. Old “all capture is read-only”, missing-key collision and successful-empty derivation claims are stale; use current evidence. A five-sprint investigation is complementary to, never a substitute for, code implementation or independent QA.

## Sprint sequence (distinct boundaries and receipts)

### Sprint 1 — Exact-target conversation safety and ownership
- **Question:** Can Connect → Read/Preflight → Send → Check → Finish preserve target, sole driver, no unobserved automatic re-send, durable provenance and fail-closed uncertainty across crashes?
- **Inspect:** `conversation-service.mjs`, `conversation-runtime.mjs`, `conversation-browser-adapter.mjs`, `drive-lease.mjs`, `actions.mjs`, `drive-api.mjs`, Chat client/HTTP, appropriate existing tests.
- **Deliverable:** [SPRINT-01.md](SPRINT-01.md): factual seam map, minimal invariants, ranked source-grounded gaps, exact owner and verification suggestions.
- **Exit:** Review source paths and counterevidence (tests and recent fixes); label *implemented / unverified / proposal*. Commit only Systems report. **Status: COMPLETE — first source assessment, execution untested.**

### Sprint 2 — Capture completeness, provenance and resource behavior
- **Question:** Does the raw/decoded/DOM evidence pipeline account for late-joined WebSockets, incomplete streams, payload masking, backpressure, failure flush and partial sampling without claiming full coverage?
- **Inspect:** `src/capture/{recorder,network,dom,actions}`, `src/store/{raw-log,session}`, `src/replay/reducer.mjs`, performance report/fixtures, `scripts/loadlab.mjs`, acceptance design G1–G7.
- **Deliverable:** evidence-coverage matrix by event source and failure; latency/backpressure hypotheses and non-destructive minimal recommendations.
- **Exit:** Separate lab-reported p99/throughput from real Windows acceptance, and completeness from derivation; **no duplicate benchmark campaign**. **Status: QUEUED.**

### Sprint 3 — Accepted evidence into knowledge and adaptation
- **Question:** When can captured data enter family building, L4 graph and L5 learning without poisoning priors or crossing tenant, identity or temporal boundaries?
- **Inspect:** `campaign.mjs`, `families/build.mjs`, acceptance sidecar design, `derive.mjs`, `continuity.mjs`, `graph.mjs`, `learn.mjs`, `learner-journal.mjs`, specialist acceptance/receipts.
- **Deliverable:** source-to-acceptance-to-learning lineage, version/rollback/rederive semantics and safe/unsafe promotion matrix.
- **Exit:** Explain where 14 criteria remain pending independently accepted evidence; no specialist code edits, no product gate declarations. **Status: QUEUED.**

### Sprint 4 — Unified user and agent-consumer integration
- **Question:** How do Chat, Drive, existing Knowledge UI, CLI/API and Development/Track B consume one authoritative lifecycle without another capture/drive stack or wrong UX assertions?
- **Inspect:** UI source, integration hub, CLI command modules, `INTEGRATION-ROADMAP.md`, Development/Harvest existing exchange, actual API contracts.
- **Deliverable:** UI journey + wire/interface ownership matrix, contract discrepancies, safe migration ordering for thin clients.
- **Exit:** Distinguish owner DECIDED Studio consolidation from draft AX-0022/AX-0023 and actual Development acknowledgment; never dispatch other agents. **Status: QUEUED.**

### Sprint 5 — Seven-layer cross-system convergence
- **Question:** Which actual architecture gaps remain after the newest delivery/receipts? Which smallest corrections buy the most user trust and developer leverage?
- **Inspect:** Fresh Core/UI/K&L/QA and Development receipts, revised canonical seven-layer cake, prior four Systems reports, repository metrics if a pinned checkout is available.
- **Deliverable:** ranked final review, risk retirements, nonduplicative roadmap suggestions by owner, implementation/proof ladder, clearly marked source vs QA maturity.
- **Exit:** Owners retain authority; physical LOC/changes only from canonical checkout counter, otherwise unavailable. **Status: QUEUED.**

## Operating cadence, non-overlap and completion standard
- Start every sprint by refreshing main and source/QA receipts; record pinned SHA and latest same-turn head.
- No Playwright/Puppeteer, no live website sends, no independent QA campaign; this Systems lane uses source analysis unless owner expressly changes scope.
- Keep findings actionable: **claim → source anchor → counterevidence → expected risk/benefit → smallest correction → owner → suggested test**.
- Every sprint produces one Systems-only artifact and one honest queue/worklog update. Small verified commits to main; never modify another lane, never claim a Git commit starts an agent.
- After a sprint, update [WORKLOG.md](WORKLOG.md) and the standing queue. Continue only on owner's further prompt or new explicit execution direction; no background work is implied.
- Prioritization follows actual source evolution; a later Core fix supersedes an older Systems finding.

**Suggested ChatGPT thinking:** High for full new sprint analysis and source reconciliation; Medium for later narrow receipt/queue readback.
