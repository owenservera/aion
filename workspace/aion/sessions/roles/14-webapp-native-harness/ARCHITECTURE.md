# AION Webapp-Native Harness — Architecture v0.1 (design)

**24 October 2026 • Proposed specialist architecture, not runtime code.** The governing product source of truth remains [Capture Studio ARCHITECTURE.md](https://github.com/owenservera/aion/blob/main/workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/ARCHITECTURE.md).

## Thesis
**One harness, one Capture Studio browser/capture/send authority, multiple independent provider-native shape systems, and one small evidence-linked semantic projection.** Do not force ChatGPT/Claude webapps into their model API schemas; do not discard native structures in order to obtain a plain `response.text`.

## Architecture correction — automated adapter intelligence (owner direction, 2026-10-24)

**AION must have one generic harness and one adaptive adapter *factory*, not merely a set of manually programmed ChatGPT/Claude-specific adapters.** Capture Studio intelligence is responsible for discovering, generating, validating, versioning, selecting and repairing webapp-specific adapters from observed DOM/a11y/network/stream/task evidence. Handwritten `src/profiles/sites/*.mjs` modules are seeds and fallback evidence, not the onboarding requirement for a new webapp.

```text
Generic Harness -> Existing Studio effect/capture owner -> Selected Versioned Data Adapter
                                                           ^             |
                                                           |             v
Current Profile/Version Store <- Shadow Fidelity Gate <- Adapter Candidate Synthesizer
                                                              ^
                                                              |
                        Existing Capture Studio evidence + discovery + learning + correlation
```

**Continuous closed loop:** unknown webapp observation -> page capabilities and native response structures inferred -> data-only candidate compiled -> replay/shadow against different saved sessions -> activate proven read-only behavior via the existing adapter registry -> observe real use and drift -> improve/rollback version. User corrections train scoped models. Effectful actions remain routed solely through Studio's existing lease/journal/effect authority with fresh page preflight; an automatically learned selector is never itself send authority.

**Generic, native-preserving modules:** detection/origin scope; semantic DOM/a11y controls; conversation/project/task identity (including explicit unknown); native content, citations/artifacts/revisions; protocol/stream decode plug-ins; candidate capability and confidence; evidence references; target-specific site-version drift. A provider may require specialized decoding (e.g., Claude Connect/protobuf), but the harness does not require a special product implementation per provider.

**Existing reusable intelligence:** `src/intel/{schema,discover,learn,correlate,join}.mjs`, `src/shapes/infer.mjs`, `src/families/build.mjs`, `src/store/versioned.mjs`. **Current missing connection:** `src/profiles/sites/index.mjs` statically enumerates/loads JS adapters and `src/capture/conversation-thread.mjs` parses only ChatGPT durable conversation IDs. The factory must drive **the same** registry and actor with versioned data adapters, not introduce a competing registry or browser.

**Executable starting point:** [Agent 14 Round 8 automated adapter candidate synthesizer + shadow evaluator](implementations/round8/README.md). Node 22, 17/17 focused synthetic tests; GitHub remote readback verified. It does not yet read actual Studio raw sessions, train/evaluate a selector extractor, activate through the registry or prove native browser acceptance. These integration seams belong to Core/Z.ai.

## Four layers
1. **Immutable source evidence:** Capture Studio CDP network/HTTP/SSE/WS/Connect/protobuf raw stream, DOM and accessibility observations, action timeline, gaps, session and sequence references. Local private data stays out of Git.
2. **Native provider shape:** Versioned ChatGPT and Claude web *surface*, thread, message, revision, generation, model/mode, blocks, references, artifact, task/progress and visible tool-activity representations. Unknown structures stay opaque + source-linked, not deleted.
3. **Common projection:** Minimal graph of harness run, provider/account session, workspace/project, conversation or agent task, turn, generation, message, content part, citation, artifact, visible tool-activity observation, subtask, outcome; edges and certainty.
4. **Orchestration:** AION goal/run, context actually supplied, capability/entitlement checks, requested effects, safe continuation, delegation, checkpoints, recovery and outcome verification. Provider task runs are not equivalent to messages.

```text
HarnessRun
  ProviderSession
    Workspace / Project? (optional/unknown)
      Conversation OR AgentTask
        BrowserAttachment (separate from conversation identity)
        TurnAttempt -> AssistantGeneration (may branch/regenerate)
          Message -> ContentPart[*]
          VisibleToolActivity[*] (observation, NOT AION invocation)
          Artifact[*] -> ArtifactVersion[*]
          Subtask[*] / Progress[*] / NeedsUser[*]
          EvidenceRef[*]
```

## Independent identities
Distinguish `harnessRun`, provider session/account, workspace/project, conversation, branch, generation, provider message, AION turn/key, DOM node, CDP tab, capture session, artifact and optional AION role binding. A tab is NOT a conversation. A rendered sidebar is NOT a complete account index. ChatGPT `/c/<uuid>` is the one demonstrated source-supported durable thread parser; Claude and guest session IDs need provider-specific evidence. Never fabricate durable identity from text, ordinal, title or URL query alone.

## Separate streams
**Control**: bound/unknown, waiting, typing, dispatching, delivered/uncertain, readiness, capture state, reconciliation/restart.
**Content**: component opened/appended/updated/replaced/closed; citations; visible summaries; tool activity; artifact produced/revised; agent task progress.
**Reconciliation**: link outbound page user turn to observed fresh assistant generation, raw stream and DOM blocks, capture and derived knowledge. Network completion, page idle/readiness, content finality, capture acceptance and user goal completion are **five distinct concepts**. Page text without a fresh post-send boundary does not prove a new reply.

## Provider-native modules
Surface detector; identity/binding resolver; native response/stream decoder; DOM/layout/a11y reader; common projector; page-local capability capsule; Studio-authorized interaction driver; evidence correlator; recovery interpreter. Capability capsule reports for the *exact observed page*: `supported/unavailable/unverified`, evidence and time, effect class and scope. Static product marketing and API features do not imply live browser availability.

## Content and tasks
Preserve native blocks for prose, markdown, code, table, charts, images, files, citation/source references, expandable thinking **summaries**, displayed tool activity, artifact, progress, task and unknown interactive elements. A visible thinking summary cannot be equated to private hidden reasoning. A provider UI tool activity is not an AION-controlled tool invocation. Editing/regenerating may replace content: revisions are not just growing text.

## First-class artifacts
Own identity, provider-native type, version, availability, render/download actions, evidence and provenance. Claude Artifacts and ChatGPT writing/code blocks are **different shapes** even when both appear as editable output. Cowork/Work tasks can produce artifacts and progress over many activities beyond one answer.

## Browser effects and recovery
Only the existing Studio browser actor may send/type/stop through supported UI. Track B acts as thin consumer. Preserve idempotency, exact target/revision, one-effect rules, no blind resend on unknown delivery. Provider-native internal backend endpoints may be OBSERVED, never replayed for authenticated effects. Simplify local-owner UX rather than inventing corporate approval gates.

## Acceptance and integration
Target one real first and second contextual turn, exact attribution, original evidence -> decode -> DOM join -> derivation -> G1-G7 acceptance -> source-linked knowledge -> usable Outcome Packet. Old matching prompt/reply must not satisfy freshness gates. Incomplete or blocked provider interactions remain valuable raw evidence but do not become verified semantic outputs.

Reuse **existing** Studio `src/capture/{conversation-runtime,conversation-service,conversation-browser-adapter,thread-turn-journal,dom,network}.mjs`, `src/profiles/stream-map.mjs`, `src/decode/{protobuf,proto-features}.mjs`, `src/replay/{derive,stream-role,stream-components}.mjs`, `src/intel/join.mjs`, `src/studio/{conversation-api,conversation-tools,server}.mjs` and `src/studio/ui/chat.mjs`. No new competing product. See `CONTRACTS.md`, `NATIVE-ATLAS.md`, `EXPERIMENTS.md`.
