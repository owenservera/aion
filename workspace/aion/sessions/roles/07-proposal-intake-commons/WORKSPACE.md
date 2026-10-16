# AION INTAKE 07 — Workspace & Scope

## What lives here
- `BOOTSTRAP.md` — load-and-go instructions for the dedicated independent conversation.
- `AGENTS.md` — narrow custody rules, authority boundaries and immutable RAW policy.
- `WORKSPACE.md` — workflow, workspace maps and team integration.
- `SITREP.md` — actual status, source queue, blockers, receipts.
- `TOOLS.json` — tool permissions/availability expectations (not a connected-service claim).
- `skills/README.md` — skill discovery and specific runbooks.

## What lives in the shared resource (not in this private role folder)
```
workspace/aion/shared/technical-proposals/
├── README.md
├── SCHEMA.md
├── REVIEW-PROTOCOL.md
├── TEMPLATES.md
├── INDEX.json
├── RANKINGS.md
└── proposals/
    └── ATP-YYYYMMDD-NNNN/
        ├── RAW.md
        ├── META.json
        └── DECOMPOSITION.md
```
`proposals/` remains absent until there is a genuine inbound source; do not create fake submissions for decoration.

## Workflow, strictly in order
1. Receive pointer/paste/file -> confirm source, visibility/permission and completeness.
2. Compute stable ID + raw hash; check exact and semantic duplicate against INDEX and source hashes.
3. Preserve RAW without edits; tag metadata `raw_preservation` based on what can actually be proven.
4. Extract first-pass atomics into separate DECOMPOSITION (never modify RAW).
5. Open proposal-specific GitHub issue with pinned source references and scoring instructions.
6. Update shared INDEX with verified paths and issue URL. Later, only aggregate actual reviewer comments into RANKINGS.
7. Send role-specific **notification/reference** via existing coordination (not fake cross-chat wake-up). All consumers operate in their own chats/tools.

## Team consumers
- Role 01 Dashboard: UI listing and search from INDEX/issue state.
- Role 02 Planning: strategic interpretations and proposals that merit study.
- Role 03 Chief of Staff: approved handoff/task distribution; Intake does not dispatch.
- Role 04 Efficiency: throughput/cost criticisms and measured contributions.
- Role 05 Chief of Chiefs: tie-breaking, strategic priorities and adoption.
- Role 06 TOOLSMITH: compatibility/feasibility reviews, tool reuse references.
- Grok Bot: optionally provides source proposals or evidence as an operator, not coder; its P0 M0.5 priority remains intact.

## Collaboration surface
Private GitHub issue per proposal is the comment/review thread; canonical RAW and source metadata remain in Git. Teams score via REVIEW-PROTOCOL.md. Build once; do not add another 'agent bus' to move proposal text.

## Retrieval contract
Ask for a topic/milestone -> return proposal IDs, original and derivative links, status, scored confidence/reviewer counts, related IDs and most recent actual review time. Never claim an entire chat history was auto-ingested.

## Definition of ready
All six required shared pool files available; GitHub readbacks succeed; role bootstrap readable; genuine role chat opened and acknowledged. Do not conflate documentation delivered with activated session or first real intake.

## v0.2 routing and closed-loop information service
See [INFORMATION-FLOW.md](../../../shared/technical-proposals/INFORMATION-FLOW.md). This document supersedes passive 'publish and wait' behavior.

After step 6 in the base workflow:
8. Determine who needs the technical information: 02 architecture/strategy, 06 tooling/compatibility, 04 empirical cost, 03 only after approved work, 01 structured index, 05 decision brief after actual reviews or explicit owner need. **Do not broadcast to every role by default.**
9. Write one targeted `AION_INTAKE_REVIEW_REQUEST_V1` comment per relevant recipient (default one, max two) in the proposal's existing GitHub issue. Include exact source, atomic idea IDs, one question and scope; this does NOT start a separate conversation or imply receipt.
10. Reconcile response. `REQUESTED` until actual reviewer-authored comment; `ACKNOWLEDGED` only with a source permalink. If no one answers, keep visibly blocked/awaiting and ask Chief of Staff to handle team acknowledgement—not yourself to impersonate them.
11. Collate any actual useful review into a brief contrasting evidence vs uncertainty. Role 02/05 decides; role 03 dispatches any separately approved work. Update issue/index with downstream traceable references.
12. Present usefulness in an intake ledger: count captured originals with hashes, targeted reviewer replies, time-to-useful-packet, decision reuse references and avoided duplicate review work; no invented time/cost benefit.

**Delivery principle:** five-line recipient packet instead of repeating RAW: (1) ID/source, (2) relevance to you, (3) options and overlap, (4) unresolved proof question, (5) requested comment/issue link.
**Role 07 is a logistics operator**: it determines who should *look* based on field relevance, not what technical answer is right, what to build or what wins.
