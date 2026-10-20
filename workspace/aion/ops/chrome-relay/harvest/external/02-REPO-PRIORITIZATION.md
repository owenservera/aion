# Worker 2 — first-pass repo-by-repo prioritization and deduplication

## Copy-paste as a new Claude/ChatGPT agent task

You are **AION EXTERNAL HARVEST — PORTFOLIO TRIAGE / DEDUP OWNER**. Your task is to determine **which external repository is best for which AION capability**, preventing duplicated deep-harvest work.

**Start at:** `owenservera/aion` branch `harvest/external-browser-donors-20261020`. Read `00-START-HERE.md`, `sources.json`, `reference/core-operations.csv`, `reference/command-matrix-1000.csv`, `reference/route-origins.csv`, and `reference/capability-universe.csv`. Require custody receipts from Worker 1 if available; if not, pause source-fidelity conclusions and mark provenance `UNPINNED`, not verified. Work from pinned GitHub mirrors/upstreams. **Your exclusive output folder is `landing/triage/**`** on your own `harvest/external-triage-<date>` branch, PR to the scaffold branch.

### PASS 1 — one swift sweep of all nine repositories (no deep harvest)

For each repo, inspect README, root tree, manifest/lockfiles, provider adapter directories and a small representative code sample, test tree and licensing. Report (a) what it really implements, (b) which surfaces/providers it targets, (c) which modules are best candidates, (d) whether core behavior is code-verified vs docs-only, (e) uniqueness relative to other repos, and (f) likely transplant safety. No harvesting 50 duplicate copies of a Send button.

Cover all 40 current command IDs plus 65 future **unapproved** candidates as a matching rubric, not a demand that each repo implement all 105. For all 19 P0 commands, include explicit MATCH / PARTIAL / UNKNOWN / NOT_APPLICABLE disposition per repo. The three extra protocol axes `receive.cursor`, `receive.identity`, `send.correlation` must be compared separately from user-visible commands. Don't count app-local history as the provider's web conversation history; or generic script typing as exact-conversation Send. Distinguish DOM, MV3, CDP and official API routes.

### PASS 2 — identify primary owner **per capability cluster**, not donor enthusiasm

Clusters in order:
1. **Receive / identity / resumable stream**: cursor/gap, message identity, idle inbound events, full reply, source corroboration.
2. **Safe Send / operation correlation**: exact target, composer, one-shot effect, no-resend, binding and proof.
3. **Multi-provider browser adapters**: ChatGPT/Claude/Gemini/Grok and other provider differences, state detection.
4. **Conversation lifecycle and advanced UI**: create/open/rename/edit/regenerate/steer, model/thinking controls.
5. **Attachments/tools/artifacts/multimodal**: likely P1 and futures.
6. **CDP/transport/fixtures**: lightweight primitives and test methodology only.
7. **Provider-native/API/ACP/CLI**: native paths only when preserving target fidelity; avoid API ≠ existing web chat confusion.

For each cluster: nominate **ONE primary donor**, at most ONE backup for genuinely different functionality, supporting source locations, evidence tier, licensing/safety caveats, reuse disposition `ADAPT_PATTERN|COPY_AFTER_LICENSE_AND_TEST|REBUILD|REJECT|RESEARCH_GAP`. If no donor meets the criterion, say **AION CUSTOM BUILD** with tests; don't force-fit a repo.

### PASS 3 — publish an unambiguous deep-harvest schedule

Produce:
- `landing/triage/REPO-ROLES.csv`: one row per repository with languages, architecture, actual provider footprint, unique strengths, weaknesses, license, inspected examples, and maturity evidence.
- `landing/triage/CAPABILITY-DONOR-OWNERS.csv`: command/cluster → **primary donor**, backup only when justified, safe disposition, source path, confidence, priority.
- `landing/triage/DEEP-HARVEST-LANES.md`: ordered, non-overlapping deep worker lane instructions with repository/module/path ownership, target cards, stop criteria, estimated yield/value, no duplicative harvesting.
- `landing/triage/GAPS-AND-DUPLICATES.md`: unresolved P0s (especially rename/edit/regenerate/steer/thinking), overlaps intentionally dropped, unique discoveries outside 40 commands and future 65 candidates.

**Do not** copy donor code modules, rewrite registry CSVs, perform CDP/live tests, create AION production interfaces, or launch deep workers. Check that all P0 commands are covered by an identified donor investigation or explicit AION custom gap.

### Strong starting hypotheses — verify, do not inherit as truth

- `DrA1ex/chatgpt-bridge`: receive cursors/gaps and no-resend operation ledger.
- `TED-H-com/multi-ai-chat`: broad browser adapters, but heuristic resend/Enter fallback for ChatGPT/Claude **unsafe for direct transplant**.
- `ParkerCai/parallel-ai-extension`: broad provider coverage and attachments; check iframe-related limitations.
- `RaheesAhmed/Council`: simpler receive pattern but earlier evidence mostly README.
- `chathub-dev/chathub`, `ai-shifu/ChatALL`: provider breadth; distinguish app-local features.
- `Octo-Lex/ChatGPT-Web2API`: CDP ideas may involve undocumented/private endpoints; segregate.
- `mehmetnadir/cdpilot`, `cereon-labs/cereon-browser-operator`: CDP primitives, not provider semantics.

### Required answer

Give the user a **one-page first-pass donor ownership table** and ranked deep-lane launches. Explain what **not** to harvest because another repo already has the better implementation. Provide exact source revisions, total mapped P0 count, repo count inspected, and the GitHub PR. No runtime changes; no claim that code is safe merely because it is maintained.
