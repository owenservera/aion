# Role report intake and explicitly labeled fallback sources
Role 08 checked Issue #24, its single council-dispatch comment, canonical PACKAGE-MANIFEST.json and all eight role SITREPs. The six missing employee-specific components are NOT treated as delivered.
| ID | Actual role report | Source-based fallback (NOT employee output) |
| --- | --- | --- |
| 01 Dashboard | MISSING | ops/chrome-relay/ENVELOPE-CONTRACT.md and FALLBACK-AND-ACCEPTANCE.md: status/evidence UTC; ACK != execution/reply |
| 02 Planning | MISSING | canon/AION-MILESTONE-1-INTROSPECTION.md and AION-MILESTONE-0.5-BFF-LINUX-INTROSPECTION.md: actual authenticated response and AION readback required |
| 03 Chief of Staff | MISSING | ops/zai-sandbox-lab/m1-council-prep/CLONE-AND-ASSEMBLY.md and ops/zai-sandbox-lab/RESULT-RECEIPT.md: pinned read-only clone, export, hashes, real ACK |
| 04 Efficiency | MISSING | ops/zai-sandbox-lab/M1-PRELIVE-RUN-DESIGN.md and role 04 SITREP: one-turn-first, real cost/model only if observed |
| 05 Chief of Chiefs | DELIVERED | components/ACCEPTANCE-GATES.md actual executive-authored, not an independent sandbox acceptance |
| 06 TOOLSMITH | MISSING | ops/chrome-relay/ARCHITECTURE.md, ENVELOPE-CONTRACT.md, FALLBACK-AND-ACCEPTANCE.md: ACP JSON-RPC separate; no Playwright/Puppeteer |
| 07 INTAKE | MISSING | canon M1 and existing proposal commons/SITREP 07: source pointers, no invented raw sources |
| 08 Z-FORGE | AUTHORED IN THIS TURN | components/PACKAGE-MANIFEST.md + clone/test prompts + this release |

Interface decisions: the local fixture schema aion.m1.mock.v1 is sandbox-specific and is NOT the proposed AION relay schema, UAH envelope, ACP wire, nor a ChatGPT-supported API. Synthetic origin_actor=AION is an untrusted label, never identity verification. A fixture-only grant is not authentication. Every mock result must state mode MOCK_ONLY and m1_verified=false. Transport ACK, synthetic reply, origin readback and externally verified genuine web-app M1 are DIFFERENT states. Resume/replay and negative proof should be tested with a private local journal; no new authoritative IAM SQLite or routing bus. Existing BFF M0.5 adapter includes prohibited Playwright; never reuse it in this package. Chrome MV3/full browser features are optional separately verified sandbox capabilities, not accepted dependencies. Existing owner/browser stop orders and sandbox account boundary remain in force.

Six true reports are a missing upstream acceptance input for Chief 05 G1; they do not prevent the explicitly source-based PRE-LIVE mock experiment. CoS 03 owns role follow-up and Chief 05 owns any waiver and independent final acceptance.
