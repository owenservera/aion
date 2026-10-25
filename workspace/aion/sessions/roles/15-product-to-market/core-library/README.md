# VIVIM Core Toolkits — Product-owned Recovery Registry

**Recovered:** 2026-10-25 · **Owner:** AION Role 15 PRODUCT-TO-MARKET · **Status:** product library / source-linked recovery, **not** installed VIVIM runtime.

The owner requested two long-running investments be resurrected as **first-class shared capabilities for the VIVIM system**, rather than lost in chat history or scattered across AI-provider instruction files.

| Toolkit | Product capability | Recovery document | Engineering/source authority | Product disposition |
| --- | --- | --- | --- | --- |
| **01 — Semantic Command System** | Consistent symbols + natural language → grounded intent → authorization → observable action | [COMMAND-SYSTEM.md](COMMAND-SYSTEM.md) | VOMEGA pure NLCL, AION Role 13 semantic contract and command profile; implementation integration belongs in `vivim-harness` | **ADOPT as VIVIM core capability; implementation not yet proven** |
| **02 — Agentic File & Naming Library** | Discover, classify, normalize, cross-reference and generate agent-specific instruction/context/skill/lifecycle artifacts | [AGENTIC-FILE-LIBRARY.md](AGENTIC-FILE-LIBRARY.md) | Provider standards + existing repository files; code belongs in `vivim-harness` when integrated | **ADOPT as VIVIM core library; catalog is not an instruction to create every file** |

## Why these form one product library

The command system supplies **what the human intends** and a typed, bounded operation. The agentic-file library supplies **what each agent/tool can load, where its scoped instructions live, how material is versioned and which files are authority vs context vs evidence**. Neither is a replacement for VIVIM's existing capability permissions, execution owners, provider adapters or provenance journal.

**Shared product-facing interface (design target, not shipped):**
```
user intent (natural text or symbolic)
  → candidate semantic IR + uncertainty + evidence
  → project/role/capability/authorization grounding
  → existing single authorized execution path
  → observed result and receipt
  ↕
file-type catalog + provider adapter map + scoped context resolver
  → discover relevant AGENTS/CLAUDE/GEMINI/SKILL/etc.
  → versioned source/purpose/precedence/conflicts
```

## Hard design decisions

1. **Do not copy the VOMEGA parser into this Product folder.** Link its source; any eventual engineering changes go to the canonical `owenservera/vivim-harness` source or the existing upstream semantics owner according to migration decisions.
2. **No independent command executor, browser-effect controller, permissions store or shadow bus.** A parsed `!` or `✓` cannot grant authority. Observed execution and permission proof remain separate.
3. **Do not invent a universal file standard.** Distinguish vendor-recognized conventions, historically observed project-local names and proposed VIVIM aliases. Keep one logical meaning where possible, without duplicating conflicting instructions across providers.
4. **Prefer detection and linking over mass file generation.** An agent needs the smallest useful context, not 100 ceremonial Markdown files.
5. **Windows machine remains local runtime master.** These GitHub documents do not imply installed tools, tested local paths, or end-to-end VIVIM integration.
6. **No Playwright/Puppeteer, Slack, private transcripts, session tokens or secrets.**

## Product acceptance (future engineering gates)

- **Commands:** identical user intent through text and supported symbols produces a typed equivalent; ambiguous project/agent/account does not dispatch; authorized action produces an observable, non-duplicated receipt; correction/rollback are source-traceable.
- **Files:** discover repo file types with paths, vendor visibility and content role; distinguish actual from proposed names; report duplicate/conflicting instructions; generate an *optional* minimum scoped kit for a chosen tool; never load untrusted donor instructions as governing policy.
- **Integration:** both capabilities appear as reusable internal VIVIM interfaces, not parallel application stacks. Validate with real `vivim-harness` tests and authorized local runtime before marking operational.

## Provenance and uncertainty

- **Recovered code:** [VOMEGA pure symbol/semantic package](https://github.com/owenservera/VOMEGA/tree/main/omega-baseline/plugins/vivim-nlcl-pure/src)
- **Existing AION command composition profile:** [command-language/protocol.json](https://github.com/owenservera/aion/blob/main/workspace/aion/shared/command-language/protocol.json) (v0.1.0, 2026-10-21; instruction mapping, not installed ChatGPT parser)
- **AION semantic engineering acceptance:** [Role 13 SEMANTIC-CONTRACT.md](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/13-semantic-engine/SEMANTIC-CONTRACT.md)
- **Prior agentic-file discussion:** 2026-09-05 user request to list the dozens/hundreds of files and wiring; 2026-10-15 follow-up/reconstruction identified **21 functional families**. The full verbatim filename list from that early conversation is **not located as an independently verified repository artifact**; this folder explicitly separates recovered evidence from the newly synthesized, practical expansion.
- **Legacy agent-system retirement notes:** [BCP-dev Steward harvest](https://github.com/owenservera/BCP-dev/blob/main/AGENTS_CONTEXT/ARCHITECTURE_STEWARD/AGENT-SYSTEM-HARVEST.md) (provenance/authority lessons, not itself the missing filename master-list).
- **Owning product index:** [V1-PRODUCT-INDEX.md](../V1-PRODUCT-INDEX.md).

**Next product action:** bring these two interfaces into VIVIM's integrated product backlog only when ready for code/test acceptance. This product registry preserves the work now; it does not claim implementation or local deployment.
