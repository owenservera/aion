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
