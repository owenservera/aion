# IANG + UAH thread summaries (read by AION BFF, 2026-10-16 02:21 CEST)

## IANG Integration Automation Planning
https://chatgpt.com/g/g-p-6ad11a203c5c8191830e60d8dd471200-001-projects-pm/c/6ad134b2-ba34-83ed-87fc-3b41b474f26c
- IANG = Integration Automation Network (discovery, recipes, automation, execution, evidence). UAH = Universal Agent Hub (architecture, convergence). Neither replaces the other.
- One shared SQLite DB; one repo at a time (start SOFTWARE_HQ); IANG publishes, UAH consumes.
- Architecture kept: ChatGPT -> tunnel -> ACP Bridge -> ZCode -> OpenCode, CCR routes providers, ZCode owns execution.
- Owen: third thread "IAM" integrates both; the data model is the central node, in SQLite; graph only when needed; add project management to the SQL.
- IAM Core Data Model v0.1 built (33 tables incl. FTS, 27 seed nodes); graph as plain SQLite rows. SOFTWARE_HQ commit 85476c3. DB/schema/builder NOT yet in GitHub.
- Open: reconcile 100-variable catalog, 192-repo census, 1,000 provisional records with 23-table IANG schema and v0.4 artifacts; commit DB/schema/builder.

## UAH Project Mapping Design
https://chatgpt.com/g/g-p-6ad11a203c5c8191830e60d8dd471200-001-projects-pm/c/6ad12f88-a024-83eb-b652-637c81a34671
- UAH CLI is more design than implementation: no working entry point; only safety.mjs, gate.mjs, fsx.mjs (unwired). ACP bridge "missing".
- Data-model maturity: conceptual ~65%, operational ~25%. W01 (CCR for ZCode) and W02 (ZCode<->OpenCode) unverified; W03 (ChatGPT -> local) partial.
- SQLite v0.2 (8 tables, 48 records) + project.yaml with waves W00-W06; W00 in progress. Commit/push to SOFTWARE_HQ pending.
- Open: W01 UAH CLI census; verify CLI implementation; push DB + project.yaml; confirm ZCode version, CCR/OpenCode live status.

## Drift to reconcile
- UAH named "Universal ACP Hub" vs "Universal Agent Hub".
- Multiple SQLite schemas (8, 23, 33 tables) claimed as "one database".
- Several artifacts exist only in ChatGPT sandboxes, not GitHub.
