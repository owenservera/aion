# VIVIM V1 — Small-team work distribution (starting from Harness main)

**Product Agent · 2026-10-25 · Decision proposal, not autonomous agent installation.** Owner: single-person product authority. One canonical implementation repo: owenservera/vivim-harness. This Product Agent folder holds product outputs. GitHub is the narrow task/evidence handoff, not a new communications bus.

## Recommendation
Use three ChatGPT high-effort workstreams (this Product Agent plus two proposed specialist chat agents), owner's local MAX/HIGH engineer, and Z.ai only for bounded LOW/MED/HIGH technical integration. Do not create 10–15 agents or competing repositories. Existing AION agents should be reused or assigned specialist hats before creating new identities; the labels below represent functions, not claims new agents already exist.

## Work owners and deliverables
| Owner | Effort | Writes | Must not own | Acceptance |
|---|---|---|---|---|
| User | Final authority | Product choice, approved gates and scope | Implementation minutiae | Explicit approved V1 target |
| PRODUCT AGENT Role 15 (this chat) | HIGH/MAX | V1 shape, WHAT/WHY/WHERE atlas, source-candidate map, roadmap, priorities, synthesis and decisions in this folder | Harness production code unless explicitly tasked; Z.ai HOW | One crisp scoped product contract / ordered user journeys |
| DATA & KNOWLEDGE specialist ChatGPT workstream | HIGH/MAX analysis | Object/identity/evidence/overlay/source constraints, negative cases, import/export contract; publish under delegated Product-owned path | New physical database, source migrations or ownership by assumption | Five-plus stable product objects distinguished from provider/capture identity; storage-agnostic invariants |
| EXPERIENCE & ACCEPTANCE specialist ChatGPT workstream | HIGH | First-user storyboards, UX interaction contracts, sample realistic fixtures, completed-journey/negative-test checklist | Mandating UI framework, untested live browser claims | Plain UI journey that proves keep/organize/find/recover with source honesty |
| Owner's local model(s) engineering lead | MAX/HIGH | Read actual local environment, arbitrate engineering feasibility, integrate and test Harness, Windows acceptance, merge decisions | Blindly inherit ChatGPT proposals | Verified code/test receipts and reality gap reports |
| Z.ai supplier | LOW/MED/HIGH | Implement bounded value-backed code; own HOW, dependencies, fixtures, tests and submitted patch | MAX identity/authorization/business arbitration or rewiring browser authority | Working internal app journey, integration trace, test command results |

## Parallel jobs — no dependencies on Z.ai's earlier contributions
**P1 PRODUCT (this agent), HIGH:** craft an intentionally small V1 Product Shape decision brief with 4 core journeys: re-open rich saved conversation, save content into project with note, search and source check, selective export+restore. Include what's excluded until internal stability; tag discovery atlas items to each. Output single brief in Role 15 folder.

**P2 DATA & KNOWLEDGE, MAX:** ground exact records and authority boundaries in current Harness: evidence log versus derived projection versus user annotation versus external provider identity. Deliver storage-agnostic 1–2-page contract and 10 adversarial cases. Do not specify SQLite/schema or transplant donor engines without testing.

**P3 EXPERIENCE & ACCEPTANCE, HIGH:** one-person desktop product prototype UX *specification*, not mock interactive Chrome. Specify minimal navigation, unconnected/unknown-source states, rich-content fidelity and steps that prove persistent local experience. Deliver concrete deterministic acceptance checklist, sample fixture shape.

**P4 LOCAL, MAX/HIGH:** read-only actual Harness main and Windows local reality: running APIs, storage paths/formats, test suites, data-permission risks, owned modules, existing UI compatibility. Challenge P2 and P3; return factual integration seams and red flags. Keep local PC master.

**P5 PRODUCT SYNTHESIS, MAX:** reconcile P1–P4 into one owner-reviewed V1 shape, minimal data/UX/acceptance contracts and high-to-low integration opportunities. Escalate truly competing decisions to owner. No BUILD/HARVEST adoption until this shape exists.

**P6 Z.ai, HIGH (later):** once P5 product decisions are accepted, give Z.ai one concise WHAT/WHY/WHERE/acceptance brief for a complete thin internal flow. Let supplier decide HOW and subagents. Do not prescribe code layout or dependency bans. New Chrome interactivity only after stable internal app gate.

## Timing / collaboration
- PRODUCT agent starts P1 immediately; DATA and EXPERIENCE run in parallel after explicit owner invocation. Local scans also parallel.
- GitHub handoffs only; one accountable owner per artifact. Specialist output in dedicated PRODUCT Agent subfolders / references rather than spawning independent registries. Product Agent consolidates findings without discarding disagreements.
- No background ChatGPT work claimed by writing a GitHub note. Active dedicated chat/work sessions and local tool execution are separately triggered by user.
- Share source locations and observed evidence; do not copy credentials, private captures or tokens into public AION.
- Every substantive output in this product chat saved back to Role 15 folder with verified commit.

## Gates
G0 current-Harness reality and open design choices; G1 rich local read; G2 save/project/note; G3 search with source; G4 export/import/restart; G5 cohesive stable internal app; G6 controlled interactive Chrome and authorized owner-account validation. All gates require independent proof, not statements of completion.

## Effort allocation
LOW: contained edits and UX refinements → Z.ai. MED: local feature wiring and focused tests → Z.ai. HIGH: Z.ai implementation plus ChatGPT deep analysis separately. MAX: owner-local models and PRODUCT Agent for architecture, identity/security/irreversible trade-offs. ChatGPT work prompts should use **High thinking effort** for P1–P3 and P5; **High** for local review briefs.
