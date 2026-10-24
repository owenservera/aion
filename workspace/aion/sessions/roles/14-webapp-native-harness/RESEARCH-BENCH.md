# AION Webapp-Native Harness — Full research bench

**Initialized 2026-10-24; living investigation plan, not a claim all experiments were run.** Research authority for global intake remains AION Research 09. This folder owns this specialist's *topic-specific* primary-source map, cross-provider questions and reproduction protocol.

## Research pillars, evidence questions, output

| ID | Pillar | Core unresolved question | Most useful artifact/acceptance |
| --- | --- | --- | --- |
| R01 | Native visual hierarchy | How do user, assistant, task, artifact, citation and tool nodes actually nest on each surface? | Dated ChatGPT and Claude native-shape atlas, variant samples and negative selectors |
| R02 | Streaming carriers | Which CDP network events, SSE/path-ops/Connect/proto frames, DOM updates and revisions build a response? | Source-linked per-provider stream-part sequence and coverage |
| R03 | Exact identity | How do account, project, thread, message, branch, generation and guest sessions differ? | No cross-thread effects; reconnection proof, uncertainty classification |
| R04 | Response parts | Which native blocks are visible and when are code, file, chart, citation, thinking-summary, tool and artifact parts separable? | Loss-aware semantic projection of a multi-part reply |
| R05 | Agentic surfaces | How do Work and Cowork projects/tasks/subtasks/progress/resources differ from chat? | First-class provider `AgentTask`/artifact graph, not flattened chat |
| R06 | Capability discoverability | Which live page operations can actually be selected now, not merely advertised globally? | Per-attachment capability capsule with observed affordance/effect |
| R07 | Effects and recovery | How to prevent duplicate sends across tab remount, lost ack and stream reconnect? | Positive, interrupted and wrong-thread tests using existing Studio actor |
| R08 | Evidence quality | What establishes fresh post-send reply instead of historic same-text DOM? | Fixed G1/G2 baseline-cursor negative/positive cases via Core |
| R09 | Semantic graph | How to relate native artifacts/tool activity/replies/citations with reversible revisions? | Native source pointers + common graph, complete loss markers |
| R10 | Learner feedback | When should accepted observation become profile/shape knowledge; how should corrections roll back? | Core-bound acceptance -> scoped review -> measurable adaptation |
| R11 | UI ergonomics | How to show one transcript while preserving provider-native interactive parts and unknowns? | Existing /chat shell integrates both providers and artifacts |
| R12 | End-to-end outcome | Can one live, accepted webapp multi-turn yield an inspectable/searchable/replayable usable Outcome Packet? | Full original-evidence-to-outcome receipt |
| R13 | Environment portability | Does agent-browser/CDP/Windows use same browser/session/data or separate sandboxes? | Version/port/profile provenance; no false connectivity claim |
| R14 | Operations/entitlement | What requires login, subscription, signed-in project, human action, quota, region? | Supported/unavailable/unverified by actual environment, no anti-bot bypass |
| R15 | Performance | Long outputs, virtualized history, 100ms stalls, stream gaps, memory/lease under concurrency | Benchmarks with bytes/latency/coverage and bounded failure modes |
| R16 | External protocol comparison | What can be borrowed from API concepts without assuming webapp equivalence? | Annotated non-equivalence matrix; no API runtime dependency |

## Existing implementation and forensic bench — must inspect, not rebuild
Root for paths: `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/`.
- Product authority: `ARCHITECTURE.md`; old and new integration semantics in `docs/DESIGN-live-drive-studio.md`; real proof gates `docs/LIVE-TEST.md` §6; `docs/AI-CHAT-SHAPES.md` generated from saved capture.
- Capture: `src/capture/{network,dom,page-agent,conversation-browser-adapter,conversation-runtime,conversation-service,thread-turn-journal}.mjs`; `src/capture/actions.mjs` UI interaction.
- Native site profiles: `src/profiles/sites/{chatgpt,claude}.mjs`, `src/profiles/sites/index.mjs`.
- Decode/reconstruction: `src/decode/{protobuf,proto-features,decoders,delta}.mjs`, `src/profiles/stream-map.mjs`, `src/replay/{stream-role,stream-components,derive}.mjs`.
- Trust and linkage: `src/intel/join.mjs`, `src/capture/acceptance.mjs`, `src/families/build.mjs`; later profile adaptation in L4/L5.
- Surfaces: `src/studio/{server,conversation-api,conversation-tools,integration-hub}.mjs`; `src/studio/ui/chat.mjs`.
- Saved surveys: `scripts/{fidelity-survey,proto-field-search,induce-vs-handmap}.mjs`; tests `test/unit/{conversation-thread,conversation-m2,stream-map,stream-dom-join,protobuf,connect-proto-decoder,stream-components}.test.mjs` (verify names on current main).
- Existing related specialist handoff/issues: #67 full vision; #68 Core; #69 UI; #70 Knowledge; #71 Oracle; #72 QA; #43 Development; #64 masking and #65 local-owner simplification.
- Prior Z.ai sandbox: 10 exported source commits reportedly ending `4e666232`; check actual Git status before treating any as integrated into main. Sandbox real-site error captures and 14/14 real-Chrome synthetic-site E2E are distinct, not real reply acceptance.

## Primary public documentation (product feature claims only; verify per account/site)
**OpenAI product**
- Projects and branch history: https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- Chat/Work/Codex and scheduled Work: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- Writing and code blocks: https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
- Web cloud browser and sandbox distinction: https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
- Desktop built-in browser: https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app
- Site tools: https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app

**Anthropic product**
- Artifacts, templates, output versions: https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
- Existing vs beta new Projects: https://support.claude.com/en/articles/9517075-what-are-projects
- Project knowledge: https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
- Cowork across surfaces: https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
- Research: https://support.claude.com/en/articles/11088861-use-research-on-claude
- Search/thinking/research distinction: https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research

**API vocabulary — explicitly not the webapp**
- Claude API typed content blocks and tool use: https://platform.claude.com/docs/en/api/messages/create and https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
- OpenAI API docs: https://platform.openai.com/docs
No paid model API calls required or authorized by this bench.

## Experimental method — one reproducible run
1. Capture repo SHA, tool/runtime versions, target browser provenance, site origin/surface, sign-in status **without credentials**, account scope if verifiable, explicit owner-controlled target.
2. Read-only preflight: detect real page and exact thread or classify unverified; record currently rendered message counts/hashes, draft presence (not content), visible controls, unknown/unloaded history.
3. Where authorized, perform exactly one keyed benign prompt through **Studio's existing effect owner**. Separate real provider interaction from independent browser UI check. Capture before send.
4. Observe fresh delivered user DOM turn, provider response blocks, stream frames and controls; record gaps. If ack uncertain, **do not resend**; use read-only reconciliation.
5. Attempt contextual second turn **only after verified readiness**. Capture evidence for both. Test editing/regenerate/branch/artifacts only on explicit disposable test threads.
6. Finalize recorder; decode/replay and join. Evaluate independent G1–G7 with a trustworthy pre-send boundary; if absent label incomplete. Attempt source-linked, user-useful Outcome Packet; record failure faithfully.
7. Rerun negative cases with identical prior reply, duplicate prompt, wrong thread, stale DOM, remount, content revision, CDP disconnect, unsupported control, network failure.
8. Return sanitized count/hash/shape-only receipt in Git; raw private messages, URLs, cookies, tokens and local profiles **stay outside Git**. Separate `SOURCE`, `SYNTHETIC`, `SANDBOX_REAL_BROWSER`, `REAL_PROVIDER_REPLY`, `WINDOWS_ACCEPTED`.

## Research quality gates
- Favor live saved AION source > official vendor feature documentation for **what webapp renders**; vendor documents are strongest for **advertised capability**, not for DOM/protocol.
- Vendor APIs are terminology only; no claim internal webapp traffic equals public API.
- Observe and explicitly record counterexamples, sample denominator and failure.
- Don't infer full history from a virtualized sidebar or page-limited DOM.
- Distinguish stable readback, network terminal, provider generation, UI idle, capture stop, acceptance and goal fulfillment.
- Preserve original event carrier, native/unmapped parts, and raw evidence for future re-derivation.
- Research input, evidence and source attribution should be coordinated with Global Research 09 rather than duplicating its global queue.
