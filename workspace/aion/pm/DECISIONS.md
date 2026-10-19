# Decisions
Source: canon/EXECUTIVE-DECISIONS-2026-10-16-COS.md unless noted.
- D1 Recover (not rebuild) missing IAM/UAH artifacts; status UNRECOVERED_FROM_CHECKED_SOURCES.
- D2 One canonical DB: SOFTWARE_HQ/integrations/iam/ (verified file exists). UAH/IANG are perspectives, not separate DBs.
- D3 UAH = Universal Agent Hub (older text says "Universal ACP Hub"; keep as alias).
- D4 No new bridge:dispatch issues until a receipt consumer exists.
- D5 PC storage P0 safeguard. D6 VOMEGA tracked, hermes-company-os reference only. D7 PWA north star is gated behind a real P1 turn.
- Thread decisions (claimed): IANG name kept; IA > IANG > Mapper/Engine hierarchy; graph = SQLite rows, no Neo4j; spatial manifold is a projection, not primary data; ZCode is sole execution owner, OpenCode subordinate, CCR routes inference only; DELIVERED→SEEN→ADMITTED lifecycle.
- PM: ZCode executes, AION PM plans and tracks (OWNERS.md).

> **Reconciliation note, 2026-10-19 (docs-only; owner text above unchanged):** Rules naming ZCode as sole execution owner with OpenCode subordinate predate [DECISION-2026-10-17-WINDOWS-DRIVEN-DEV](../canon/DECISION-2026-10-17-WINDOWS-DRIVEN-DEV.md) (D1: OpenCode is the Windows execution agent; ZCode deferred). Bus V2 follows D1; see [Bus V1/V2 direction](../canon/DECISION-2026-10-19-BUS-V1-V2-DIRECTION.md). The owner should confirm which wording stands.
