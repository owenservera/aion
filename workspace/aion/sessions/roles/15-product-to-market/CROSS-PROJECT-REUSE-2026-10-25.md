# Cross-project capability recovery — source inventory
Date 2026-10-25. **Canonical Capture Studio repo:** `owenservera/vivim-harness`. AION is historical provenance / original workload; do not route Capture Studio engineering to the old nested AION copy.

## Verified source homes outside Harness
| Capability | Repo / code path | Evidence | Integration intent | Validation |
|---|---|---|---|---|
| Canvas-first unified UI | vivim-final / frontend/src/app/page.tsx | GuidedLanding, LivingCanvas, UnifiedEntry, panels imported and wired | REUSE as shell/reference, no second webapp | CODE |
| Browser effect governor | vivim-final / src/engines/chrome-governor.ts | ChromeGovernor class, transport owner | CONFLICT with Harness CDP authority; choose single owner | CODE |
| MCP stdio | vivim-final / src/mcp/browser-mcp.ts | Browser tools over line-delimited JSON-RPC | ASSESS reuse; avoid duplicate MCP facade | CODE |
| MCP server/client adapters | vivim-final / src/engines/mcp-server-adapter.ts and mcp-client-adapter.ts | Existing adapter classes | REUSE OR retire after protocol-compliance audit | CODE |
| Memory query and storage | vivim-final / src/engines/memory-engine.ts, src/storage/impl/episodic-memory-store-impl.ts, src/engines/memory/memory-oracle.ts | Engine/store types and search code | REUSE behind private memory interface | CODE |
| Knowledge/ACU domain | vivim-platform / acu/src/types.ts, pwa/src/types/acu.ts, pwa/src/lib/acu-api.ts | Content-hash ACU, source conversation relation | ASSESS canonical normalized output envelope | CODE |
| Conversation model | vivim-platform / pwa/src/types/conversation.ts, pwa/src/lib/db/vivim-db.ts | Rich conversation schema + browser store | MAP TO harness evidence, don't silently flatten | CODE |
| Browser-PWA product | vivim-platform / pwa/src/App.tsx, pwa/package.json | Router, SupabaseAuthProvider, React stack | REUSE UX if friend onboarding simpler | CODE |
| Chrome extension | vivim-chrome / README.md | README claims multi-provider local storage, streaming and export | DEEP DIVE actual extension and permissions | DOC ONLY |
| DID identity/MCP | vivim-sdk / src/core/types.ts, src/mcp/tools/identity.ts | DID/Ed25519 structures and tools | DEFER until need multiuser identity | CODE |
| Windows desktop release | vivim-final / src-tauri/tauri.conf.json and src/desktop/sidecar-entry.ts | NSIS shell, local Bun server bootstrap | REUSE product delivery after failing-safe release gate | CODE |
| Mobile ZCode | zcode-pocket / README.md, app/src/main/java/app/zcode/pocket/ | Android hub/ACP client described | Separate optional agent-control endpoint | DOC/PATH |
| Semantic Windows command | VOMEGA / README.md | Existing semantic prompt.send focus | Later complementary input surface | DOC |
| Product catalog | Product_Hub / README.md | Read-only project observer, catalog-first | Consume catalog; don't reinvent PTM intelligence | DOC |
| Portfolio authority | ACP / README.md | Agent control plane governance + transport boundary | Internal support system, not public beta surface | DOC |

## Critical synthesis
- **No new CDP controller:** Harness and vivim-final already have competing browser-control stacks. First compare features, contracts, journals and ownership, then appoint one effect owner. A complete merger before shipping is counterproductive.
- **No new MCP server from scratch:** vivim-final already has `src/mcp/browser-mcp.ts`, `src/mcp/index.ts`, MCP server/client adapters; vivim-sdk contains identity MCP tools. Inspect interoperability and actual methods before packaging or publishing.
- **No new memory engine from scratch:** vivim-final has memory engines and Prisma storage; vivim-platform has ACU schemas. Confirm import/export and provenance compatibility before adopting.
- **No invented platform hierarchy:** vivim-platform, vivim-final and vivim-harness have overlapping abstractions. Use explicit evidence/identity/export contracts. `vivim-live` includes a scripted marketing memory demo, not proof of live extraction.
- **No massive swarm or remote profile vault now:** those aren't friend beta critical path. Don't redistribute third-party transcripts without authorization.

## Next deep dives (ordered)
1. **Browser ownership / integration seam (P0):** Harness `src/capture` & `src/cdp` vs Final ChromeGovernor, provider orchestrator; actual exclusive target lease, per-thread identity, journaling, supported effects, drift cases, test fixtures. Recommend one owner with precise adapter contract.
2. **Unified user-facing experience (P0):** Harness `/chat` vs Final Canvas + Platform PWA, onboarding, auth, streaming native output, artifacts, persistence, installation friction.
3. **MCP reuse (P1):** Final `src/mcp/` and SDK `src/mcp/tools/`; test protocol framing, tools/list, tools/call, authorization boundaries, transport and compatibility. No independent MCP service until proven.
4. **Memory/ACU interoperability (P1):** Harness source evidence to Final memory / Platform ACU; round-trip provenance, identity, revisions, privacy; aim lossless minimal schema and a real export/import journey.
5. **Distribution and identity (P1):** Final Windows installer issue #3; Platform PWA; Chrome extension; SDK identity, choose smallest friend-safe route.
6. **Optional agent surfaces (P2):** ZCode Pocket, VOMEGA, ACP, SDK network and remote fleet concepts.

## Acceptance definitions
Status CODE means source path inspected or search-index match; it is **not** runtime validated. DOC means docs claim only. No independent build, installer test, provider send, live MCP handshake, or multi-repo integration test was performed in this pass. Ownership/date/source originality beyond excluded `-VIVIM` suffix remains uncertain where not inspected.

## Product direction
One visible VIVIM shell, one Harness-powered browser-effect authority, one source-preserving conversation/evidence format, one user-owned memory layer, one distribution route. Architecture is PROPOSED, not a wired system. Keep `vivim-harness` canonical for Capture engineering. Prioritize independently useful first beta over consolidating all repositories.
