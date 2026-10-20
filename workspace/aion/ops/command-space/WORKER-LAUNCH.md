# AION command space — parallel provider research launch

**2026-10-20 | Target branch:** `feature/command-space-p0-provider-research-20261020` | **Owner:** AION Command Space integrator. This document provides **two separate copy-and-run worker instructions**, one for native paths and one for UI/CDP research. Start one native chat per provider (13) and one CDP chat per webapp (9). This is 22 independent assignments, not a single overburdened chat.

**Source of truth:** `CORE-OPERATIONS.csv` (19 P0 commands + 10 P1), `aion_command_matrix.csv` (1,000 provider-route-command mappings), `ROUTE-ORIGINS.csv` (native/AION-custom/ingress distinctions). **Only the central integrator edits the shared registry.** Each worker gets separate provider-specific output paths and branches, PR target is the command-space P0 branch, not main. Do not auto-merge or invent LIVE_VERIFIED.

## Provider assignments — launch independently

| Provider ID (use exact string for WORKER_PROVIDER) | Native worker | CDP worker | Critical surface distinction |
|---|---|---|---|
| ChatGPT | N-ChatGPT | C-ChatGPT | chatgpt.com/c/id vs Responses API vs Apps/MCP ingress |
| Claude | N-Claude | C-Claude | claude.ai vs Anthropic Messages API vs Claude Code; steer/queue distinction |
| Gemini | N-Gemini | C-Gemini | Gemini consumer website vs Gemini API/AI Studio |
| Grok | N-Grok | C-Grok | Grok consumer webapp vs xAI API |
| Perplexity | N-Perplexity | C-Perplexity | consumer chat vs Sonar API and citations |
| Copilot | N-Copilot | C-Copilot | Microsoft Copilot consumer vs GitHub Copilot/M365 |
| DeepSeek Chat | N-DeepSeek | C-DeepSeek | web chatbot vs DeepSeek API |
| Le Chat | N-Le-Chat | C-Le-Chat | Le Chat webapp vs Mistral API |
| Qwen Chat | N-Qwen | C-Qwen | Qwen chat webapp vs Alibaba Model Studio API |
| Codex | N-Codex | n/a | App-server JSON-RPC, exact local agent session |
| OpenCode | N-OpenCode | n/a | Native serve/ACP/CLI, existing AION OpenCode V2 adapter |
| OpenRouter API | N-OpenRouter | n/a | Native API model routing; no consumer web conversation fidelity |
| ZCode | N-ZCode | n/a | ZCode local CLI and UAH/ACP; verify own repo contracts |

**Naming and write ownership:** normalize provider name to lowercase kebab-case for paths; e.g. `deepseek-chat`, `le-chat`, `openrouter-api`. Native writes `workspace/aion/ops/command-space/research/providers/<provider>/native.md`; CDP writes `.../research/providers/<provider>/cdp.md` plus sanitized fixtures under that folder only. Other workers' files, core CSVs, Bus, and Chrome runtime are read-only.

## Copy-and-run prompt N — one chat per provider (13 workers)

> YOU ARE AION-NATIVE-PROVIDER-RESEARCH, assigned **WORKER_PROVIDER = [paste exact provider name from assignment table]**. You have GitHub access. Base on `owenservera/aion` `feature/command-space-p0-provider-research-20261020` in your own branch `research/native-<provider>-20261020`, record exact current source SHA and inspect `workspace/aion/ops/command-space/CORE-OPERATIONS.csv`, the matrix, route origins, extension guide, and relevant AION implementations. Your task is to document **native/official integration mechanisms** and precisely what they can do, not build new runtime code.
>
> For **each of the 19 P0 semantics**, document: exact product/surface; native operation supported or UNKNOWN/UNSUPPORTED/CONDITIONAL; official API/SDK/ACP/MCP/CLI endpoint/operation with current primary-source link and publication/version; required request/response fields and side effects; auth scopes/account/plan entitlement; session and message fidelity; transport/event completion and streaming; risk/idempotency; quota; which AION custom implementation exists, with exact source reference and verification status. If undocumented, mark UNKNOWN—not CANDIDATE inferred from another surface. Add P1 discoveries and newly found operations separately with effect/risk and source. Specifically investigate `steer`: mid-turn redirection, queued next input, interrupt/stop and reasoning-effort steering are DIFFERENT; research your exact provider surface and avoid assuming Claude Code's behavior applies to claude.ai.
>
> Deliver a compact but evidence-complete report in `workspace/aion/ops/command-space/research/providers/<provider>/native.md` with the P0 matrix, exact how-to for documented capabilities, unsupported/unknown ledger, source freshness, testable future integration paths, and top 5 AION adapter implications. Suggest registry changes in report, **do not edit shared registry files or commit secrets**. Never claim LIVE_VERIFIED on documentation or fixtures. No Playwright, Puppeteer, Orca, private backend interception or user account mutations. Commit on own branch, PR to P0 branch; return PR/commit SHA, any 2026-current source caveats, and next live proof prerequisites. If provider name is ambiguous (e.g. Copilot), resolve correct product first, do not silently merge product families.

## Copy-and-run prompt C — one chat per webapp (9 workers)

> YOU ARE AION-CDP-WEBAPP-RESEARCH, assigned **WORKER_PROVIDER = [paste exact web provider from assignment table]**. Use a separate branch `research/cdp-<provider>-20261020` based on `owenservera/aion` `feature/command-space-p0-provider-research-20261020`. Research our **AION custom browser path**, not official provider API claims. Use direct Chrome DevTools Protocol (CDP) against a **separately authorized isolated test profile** only, never against production-user chats, and NOT Playwright, Puppeteer or Orca. Research/test CDP is expressly in scope; this does NOT approve CDP as the eventual production command transport. If no authorized logged-in test UI, perform source/static reconnaissance only and label CDP execution UNRUN.
>
> For all **19 P0 operations** in CORE-OPERATIONS.csv, record UI presence, current observable accessibility tree/DOM roles and control states, unique exact provider/conversation/page identity, visible text and generation events, model/thinking pickers, composer Send and Stop separation, file attach, rename, create/open, editing/regeneration and genuine `steer` vs queued behavior. Map 0/1/multiple eligible controls, stale/rerender transitions, read-only receive snapshots, message IDs/ordering, change detection, cursor/gap recovery and completion evidence. Use only the observable test UI; do not capture cookies, auth headers, private APIs, unrelated conversations, raw secrets, or publish test chat text. Request explicit separate authorization before a state-changing probe; no ambiguous selector ranking or automatic retry after possible Send.
>
> Produce `workspace/aion/ops/command-space/research/providers/<provider>/cdp.md` with semantic ID | UI support | exact observed how and CDP method | stable vs brittle anchors | text/generation/identity evidence | effect preconditions | negative cases | account/browser version/time | confidence | sanitized fixture reference. Include a testable proposed minimal AION profile mapping, NOT code changes to the production extension. The official/native partner worker owns source-native docs. If CDP cannot be run, provide an executable step-by-step test plan clearly marked UNRUN. Commit only provider-specific research files, PR to P0 branch with evidence and exact environment. No false LIVE_VERIFIED.

## Central integrator acceptance gates

1. Native and CDP reports cover all P0 rows, including explicit UNKNOWN. Don't promote web-visible controls into 'provider native API' claims.
2. Native API **NEW_API_SESSION** never substitutes for an existing bound **SAME_WEB_CONVERSATION** without proven fidelity.
3. Evidence categories remain SOURCE_DOCUMENTED / OBSERVED_TEST_UI / AION_OFFLINE_TESTED / LIVE_VERIFIED (last requires real owner-authorized end-to-end receipts).
4. Compare custom browser realization first; only then preferentially route through native paths when they preserve the requested identity, semantics, authorization and observed effects.
5. No shared registry edit until review of worker PR and stable route/provider ID assignment; no second Bus, no unsafe resend, no credentials, no accidental copying of page transcripts into GitHub.
