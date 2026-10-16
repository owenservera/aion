# AION Proposal Commons — Information Flow and Consumer Routing v0.2
Status: OPERATIONAL DESIGN / not yet validated by a complete real intake-review-decision cycle.
Owner: Role 07 INTAKE (source custody and logistics). Authority: roles 02/05 decisions, role 03 approved task handoffs. Uses the existing AION private GitHub repo/main, index, per-proposal issues and role SITREPs only.

## The problem this resolves
v0.1 reliably specifies RAW capture, decomposition and review scoring, but publication alone is passive. A role otherwise must search a growing pool, read full source, infer its relevance, choose reviewers, request review and reconstruct downstream status. Role 07 must reduce *others' work* through source-backed, recipient-specific briefs and follow-through **without** becoming the technical judge, scheduler or project manager.

## One canonical source, multiple useful views
- Original `RAW.md`: authoritative author's words; immutable in Git and hash-qualified.
- `META.json`: source/chain of custody, related submissions, source integrity, actual review/decision links.
- `DECOMPOSITION.md`: neutral abstract, atomic ideas with source anchors, technical interface/dependency clues and a compact routing section. Derived content, not endorsed facts.
- Proposal-specific **GitHub issue**: discussion, explicit review requests, reviewer answers, scoring and separate executive decision comments. A comment is *not* automatic execution or live independent-chat delivery.
- `INDEX.json`: machine-readable search and current source-backed issue links; `RANKINGS.md` derived only from genuine structured reviews.
- Role specialists consume **tiny routed packets** linking to these canonical artifacts; don't replicate the whole RAW in each SITREP.

## Smallest viable event path
1. **Receive** full proposal by owner paste, authorized file/link or issue #20. Confirm source access and publishability.
2. **Preserve** original text before analysis; record stable proposal ID, stored SHA-256, fidelity and provenance; if blocked, make source limitation visible.
3. **Decompose** source to atomic idea references (`ATP-ID:A01`, `A02`...) with exact section/quote anchors. Mark author assertion vs Intake inference vs unknown; retain all variants/dissent.
4. **Cluster/link** exact duplicates by hash and near matches by stated relationships, retaining independent RAW per distinct source; crosslink existing ACP/UAH, IANG, M1, TOOLSMITH, Chrome relay, TTP work without inventing technical conclusions.
5. **Publish** canonical Git issue + index + independently fetched links. Publicize a concise 5-line neutral abstract/option overview *inside the issue*, not in multiple new files.
6. **Route by relevance** (not score): set a primary reviewer (02 strategy OR 06 tooling OR 04 measured efficiency), optional second reviewer ONLY if a contrasting perspective is useful. Record a review-request comment/mention through already approved GitHub channel and its real permalink. No flooding six roles. If owner explicitly seeks whole-council scoring, enable all requested reviewers without changing default.
7. **Track acknowledgment** separately: `REQUESTED` is NOT `ACKNOWLEDGED`. Mark the latter only upon a real reviewer response/comment. If no review arrives, leave WAITING with a concrete owner and do not invent activity; Chief of Staff owns chasing cross-role acknowledgments.
8. **Surface to decision owners** after actual reviews, urgent user request, or material conflict: role 07 delivers a source-linked decision brief with alternatives and disagreement, **not** its own winner. Roles 02/05 issue judgment/priority. No auto-dispatch.
9. **Close the loop**: Role 03 links independently authorized execution task; implementer/tester returns verified evidence; Role 07 adds only downstream crosslinks and proposal reuse status, preserving original RAW and history. Dashboard consumes index/issue truth.
10. **Reconcile** missing issue/metadata/index links, conflict-safe SHA updates and genuine scoring changes at active session start/chunk boundary. Unattended monitoring is NOT inferred from this workflow.

## Consumer contracts: send only what is needed
| Consumer | When to route | Maximum useful packet (not full RAW dump) | What recipient owns | Intake's concrete value |
|---|---|---|---|---|
| Role 02 Planning | Alternative architecture, dependency or roadmap premise | 1-sentence thesis, competing options, seed/dependencies, source and issue links | Strategic review, acceptance and eventual synthesis | Saves repeated context reconstruction and preserves dissent |
| Role 06 TOOLSMITH | New protocol/tool/adapter, API/platform compatibility, implementation premise | Interfaces, target version/host if *actually stated*, verification gaps, issue links | Compatibility evidence and feasibility scoring | Avoids repeatedly hunting tool claims across council proposals |
| Role 04 Efficiency | Performance/latency/model/effort/cost claims | Claimed metrics + exact evidence quality, proposed test, source link | Empirical cost/rework/throughput review | Keeps speculation separate from measurements |
| Role 03 Chief of Staff | Actual executive adoption or explicit requested next implementation step | Accepted decision link, scope/owner/dependencies, proposal ID and task refs | Executor assignment, receipts, blockers, authorized execution | Removes proposal-to-task transcription once decided |
| Role 01 Dashboard | Any published proposal or material review/decision | INDEX entry and issue state/review freshness only | Visualization/query/drilldown | No manual collection of council statuses |
| Role 05 Chief of Chiefs | Real reviews complete, major conflict, decision requested, or high-risk blockage | Two-paragraph max: options, reviewer spread, key uncertainty, source, decision asked | Approve/decline/defer and allocation | Presents decision-ready evidence, not another research report |
| Grok Bot/BFF | Only when an already-authorized operating task actually requires source/evidence | One link and exact requested evidence, no broad proposal backlog | Linux operation; never codes | No interference with M0.5 primary work |

## Routing request format (issue comment)
```
AION_INTAKE_REVIEW_REQUEST_V1
proposal_id: ATP-...
requested_role: 06-toolsmith
purpose: Check <one specified interoperability question>
source: <RAW commit permalink>
decomposition: <derived file permalink>
issue: <same proposal issue>
source_claims: <atomic IDs; no reinterpretation>
expected_output: evidence-backed comment or scored review with concerns
state: REQUESTED_NOT_ACKNOWLEDGED
END_AION_INTAKE_REVIEW_REQUEST_V1
```
A comment containing this text is only a *published request*. Independent ChatGPT sessions are not guaranteed to consume it. CoS should verify a real response before claiming the handoff complete. Don't create new communication platforms to bridge it.

## Five-line consumer brief (derived, no extra file required)
1. **Proposal:** ID + thesis + exact source link.
2. **Useful to you because:** source-derived interface/problem/dependency, tagged as inference when applicable.
3. **Variants and overlap:** list option IDs + related proposals, not a ranked winner.
4. **Missing proof:** one verifiable unknown + suggested kind of evidence (not an implementation order).
5. **Request:** one specific review question + linked issue; status REQUESTED until answered.

## Decision handoff boundary
- `RAW_CAPTURED` and `PUBLISHED`: intake logistics.
- `REVIEW_REQUESTED`: routing; **not** reviewer acceptance.
- `REVIEW_ACKNOWLEDGED`, `REVIEWED`: actual review comments.
- `DECISION_RECORDED`: only a real role 02/05 decision/authority comment (quote/ref required).
- `TASK_APPROVED`: only a separate owner-authorized role 03 issue/work order.
- `EXECUTION_VERIFIED`: only independent evidence of execution, never a score.
Keep original proposal lifecycle distinct from review/decision/execution dimensions.

## Operational policies to prevent bureaucracy
- Default: **one primary reviewer and at most one optional counter-reviewer**, rather than waiting for all seven roles.
- Intake may route by **domain** and urgency already declared by the submitter, but not by its own feasibility/value/priority verdict.
- No review request for true duplicates already reviewed unless changed claims/owner request.
- No task generation for mere ideas. If work must move urgently, role 05/03 can bypass slow scoring while preserving evidence and recording why.
- A review can be one concise issue comment; detailed scores optional unless an explicit comparison/ranking is requested. Do not block a quick M1 decision while all five dimensions are debated.
- Do not create another markdown file per routing event. One proposal issue is the event journal; source docs stay stable.
- Publish readable decision briefs only when needed, not on fixed noisy polling cadence.

## Proof-of-value metrics (proposed targets, not measured results)
- **Capture integrity:** 100% of counted accepted proposals have genuine source + fidelity flag + hash, or explicit PARTIAL state.
- **Time-to-useful-packet:** target under 10 minutes of active handling for a short supplied text; report median over observed events, not made-up latency.
- **Targeted delivery:** at least 90% of published review requests have a named relevant consumer and a source-supported question; no mass broadcast by default.
- **Friction:** estimate/review actual specialist preparation time saved versus reading RAW and rebuilding context; record a small qualitative usefulness check from the consumer, not fictional labor savings.
- **Review-throughput:** count actual requester-to-ack time, review completion by category, unresolved oldest request; no assumption of background timers.
- **Reuse/adoption:** count proposals referenced in real decisions, approved tasks, tools/skills, and tests, with direct permalinks. Never count a published proposal as adopted.
- **Decision provenance:** 100% of claimed decisions include authorized actor and issue/commit evidence.
- **Signal/noise:** track number of cross-role alerts per useful specialist response; reduce duplicate requests.

## Pilot before expansion
Use the **first actual council M1 technical proposal** supplied by the owner/authorized agent. Preserve full source, extract atomic variants, route one question to TOOLSMITH (06) and optionally one to Planning (02), obtain genuine comment(s), and deliver a linked decision brief to Chief (05). Role 03 only receives a build request if approved. In parallel role 01 displays the index status; do not make dashboard a gating dependency.
PASS means a real source -> real correct consumer -> real review -> decision candidate with traceable evidence and lower re-reading burden. A scaffold/index with no source remains NOT VALIDATED.
