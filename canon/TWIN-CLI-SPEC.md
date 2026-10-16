# TWIN CLI — Chrome-mediated, evidence-backed application twin
**Specification:** \`twin.cli/v0.1\`  
**Date:** 2026-10-16  
**Owner:** AION architecture; **implementation lead:** AION BFF, Chief of Staff  
**Repository:** \`owenservera/aion\`, \`main\` only (no new workspaces/branches)  
**First provider:** ChatGPT web; subsequently other Owen-authorized Chrome web apps  
**Status:** **SPECIFICATION / NOT IMPLEMENTED**. VOMEGA includes a fixture-backed \`provider.browser\` and a CDP lane planned but not demonstrably live.

## 0. Product promise and the truth boundary

Owen wants a **practical twin of the web applications he uses**: a CLI that can discover Chrome sessions, attach with authorization, observe real visible state and streaming, interact with UI controls and edit permitted owner-accessible data—with ChatGPT as the first and most valuable entry point. The long-term target is an operator who can read project context, open chats, update user-editable project instructions/files and perform supported UI actions without Owen doing the clicking.

**This is a UI twin, not a model twin.** It **cannot** edit ChatGPT's system/developer instructions, model weights, private reasoning, hidden backend records, account entitlements, or unavailable/unsupported controls. UI capability is measured for each site, version, account and state, not assumed. Browser access through an authenticated owner's session conveys that session's privileges, not global authority. Interactions remain governed by user authorization, app policies and independent local broker rules. Never use stealth/bypass logic to defeat anti-abuse controls, access a different user's session, or evade consent/security checks.

Definition of success: "All features that the target app exposes through the authorized session and that have passed a named adapter's acceptance tests are mirrored, with durable action/receipt lineage." **Not** an unconditional "perfect" claim.

## 1. Why this is a separate CLI, not a new browser-agent empire

The existing assets are real and should be reused at the right seam:

### Verified VOMEGA source facts (fetched 2026-10-16)
- \`owenservera/vivim-omega/plugins/provider-browser/plugin.json\` explicitly says its browser leg is **fixture-recorded only** and the live CDP substrate is future work. It exposes \`browser.attach@1\`, \`browser.release@1\` and a fixture \`message.send@1\`. It is **not** a functioning ChatGPT Chrome controller.
- \`plugins/provider-browser/src/index.ts\` enforces four fail-closed send bars: initial policy fence, attached session, verified/promoted realization, and parser version pin. It redacts before vault writes.
- \`plugins/provider-browser/src/parsers.ts\` has deterministic, pinned parsing of recorded captures; \`src/session.ts\` stores session records **by reference** to redacted capture, not by duplicating raw sensitive bytes.
- \`compositions/browser.json\` wires law, vault, discovery/verification, credentials and provider/browser components.
- \`docs/decisions/D-338-browser-realization.md\`: browser control requires law-reviewed authority and hard-denied operations.
- \`D-357-browser-realization.md\`: fixture falsifier, gate-before-handler ordering, redaction-before-vault, parser-pinning and ordered stream chunks.
- \`D-418-v1-substrate-chrome-first.md\`: VOMEGA's shippable-v1 substrate is Chrome master/slave, no AI API realization as prerequisite.
- \`D-419-cdp-substrate-lane.md\`: CDP is a **planned parallel lane**; prior fixture/live substitution falsifier is mandatory and unproven for actual live capture.

### Reuse decision
1. **Reuse immediately as design/contracts/tests:** VOMEGA's \`BROWSER_MEDIATED\` boundary, explicit authority law, source-referenced captures, parser pins, ordering, session lifecycle, and fixture/live substitution falsifier. Mirror or import pure transformation utilities only after signature/dependency tests.
2. **Do not claim reuse as implemented live Chrome:** \`provider.browser\` is not itself a CDP transport. Implement a small \`twin\` CLI with a host-owned Chrome CDP adapter behind the same policy/capture contract; when VOMEGA's CDP lane matures, integrate using a tested versioned interface rather than fork/replace VOMEGA.
3. **Do not import arbitrary legacy stealth modules.** VOMEGA's historical ChromeGovernor concept may inform single-owner lifecycle; privilege and policy enforcement are reimplemented through explicit allowlists, review gates and a connection scoped to the owner's browser.
4. Separate app adapters for ChatGPT, Vercel, GitHub, Gmail, Drive, OpenCode/ZCode dashboards and other authorized sites. Do not put their evolving selector assumptions in the universal transport.

## 2. Command surface — minimal to complete

\`\`\`text
twin doctor                             local platform/CDP/auth/policy/storage health
twin browser discover [--json]          enumerate allowed Chrome debug endpoints and targets
twin browser launch --profile <name>    opt-in isolated browser profile with loopback CDP
twin browser attach --target <id>       owner-authorized target selected from discovered tabs
twin browser detach --session <id>      release target/CDP and flush recorder
twin apps list                          installed app adapters and explicit support levels
twin app probe chatgpt                  feature-detect current account/UI non-mutatingly
twin tabs                               approved targets with origin and title
twin inspect --target <id>              semantic DOM/AX/URL structure, redacted
twin snapshot --target <id>             policy-filtered DOMSnapshot + AX + optional image
twin find --intent "project settings"   ranked semantic element candidates + confidence
twin watch --target <id> --jsonl        ordered, deduped visible UI/event stream
twin chatgpt projects                   list observed projects, stable URL/ID when exposed
twin chatgpt project show <id>          inspect navigable project and capabilities
twin chatgpt project instructions get <id>
twin chatgpt project instructions set <id> --from file.md --expect-revision <digest> --confirm
twin chatgpt project files list <id>
twin chatgpt project files upload <id> --file /local/path --confirm
twin chatgpt project files replace <id> --file /local/path --expect-revision <digest> --confirm
twin chatgpt chats list [--project <id>]
twin chatgpt chat open <id>
twin chatgpt chat read <id> --since <cursor> --jsonl
twin chatgpt chat send <id> --text-file prompt.txt --confirm
twin chatgpt chat watch <id> --cursor <cursor> --jsonl
twin chatgpt chat export <id> --redacted --format jsonl
twin chatgpt chat edit <id> --message <visible-id> --from edit.txt --confirm
twin chatgpt chat delete <id> --confirm  # only if UI supports and separate high-risk approval
twin actions plan --file actions.yaml   show side effects, selectors, expected result
twin actions apply --plan-id <id> --confirm
twin actions verify --action-id <id>
twin actions rollback --action-id <id>  # where platform offers a real reversal
twin adapters doctor --all              compatibility and drift check, no writes
twin adapters test chatgpt --fixture path
twin adapters propose-repair chatgpt    disabled in write path until reviewed
twin ledger tail --follow               redacted evidence and coverage gaps
twin ledger verify                      integrity/provenance, external anchor
twin replay --fixture snapshot.json     deterministic offline reproduction
\`\`\`

Commands representing unsupported ChatGPT UI actions **fail with \`CAPABILITY_NOT_AVAILABLE\`** and include the exact probe/evidence. For example, "replace project file" must not be synthesized by delete+reupload without a user-visible preview, revision match and clear semantics; if the web UI only supports attachments, \`replace\` remains blocked. The ability to see another conversation title does not prove access to its full messages or history.

Exit codes:
\`0 VERIFIED\`, \`2 INVALID_INPUT\`, \`3 AUTH_OR_PERMISSION\`, \`4 UNSUPPORTED\`, \`5 SELECTOR_DRIFT\`, \`6 TIMEOUT_OR_DISCONNECT\`, \`7 POLICY_DENIED\`, \`8 RESULT_UNVERIFIED\`, \`9 CONFLICT\`, \`10 SECRET_RISK\`.
No CLI operation silently returns 0 because a click was attempted.

## 3. Subsystems and boundaries

\`\`\`text
ChatGPT/AION │ AION PM ledger │ BFF runtime │ authorized human
                 │ request envelopes (source actor, scope, ID)
                 ▼
              twin CLI  ──────► action planner / capability gate
                 │                         │
                 │                         ▼
                 │                local policy broker (approval)
                 │                         │
                 ▼                         ▼
        Chrome discovery/attach ───► CDP transport
                 │                         │
                 ▼                         ▼
       app capability adapters ───► semantic locators + DOM/AX actions
                 │                         │
                 ▼                         ▼
           stream observer ────────► result/correlation verification
                 │                         │
                 └──────────┬──────────────┘
                            ▼
             redaction BEFORE storage
                            ▼
     append-only AION recorder + evidence refs
                 │
                 ▼
     GitHub sanitized receipts, source hashes, replay
\`\`\`

**Project ownership:** AION maintains this contract and acceptance; BFF builds/test-runs on its own always-on Linux box with owner-authorized Chrome; ZCode Windows integration is optional and gated by explicit local policy. Use existing \`workspace/aion/\` for BFF runtime, \`canon/\` for immutable executive specs, \`pm/\` for PM messages/ledger. BFF's root-Git auto-push must explicitly track only approved nonsecret paths and handle remote concurrent commits. No public CDP port, no raw cookies in repo.

### Types (logical)
\`\`\`ts
type CapabilityStatus = "OBSERVED" | "SUPPORTED" | "UNSUPPORTED" | "DEGRADED" | "UNVERIFIED";
type ActionRisk = "READ" | "REVERSIBLE_WRITE" | "EXTERNAL_MUTATION" | "DESTRUCTIVE" | "SECURITY";
interface TargetRef {
  machineIdAlias: string; browserEndpointId: string; targetId: string;
  origin: string; url: string; title: string; accountAlias?: string;
  observedAt: string; chromeProtocolVersion?: string;
}
interface ElementCandidate {
  semanticRole?: string; accessibleName?: string; textDigest?: string;
  stableAttributes?: Record<string,string>; containerFingerprint?: string;
  framePath: string[]; selectorHints: string[]; score: number;
  evidenceRef: string; adapterVersion: string;
}
interface TwinAction {
  actionId: string; requestId: string; target: TargetRef; app: string;
  op: string; argsDigest: string; risk: ActionRisk; expectedRevision?: string;
  preconditionSnapshotDigest: string; method: string; candidates: ElementCandidate[];
  requiredApproval?: string; rollbackRef?: string; idempotencyKey: string;
}
interface ActionReceipt {
  actionId: string; stage: "PLANNED" | "ADMITTED" | "ATTEMPTED" |
    "OBSERVED" | "VERIFIED" | "FAILED" | "UNKNOWN" | "ROLLED_BACK";
  startedAt: string; finishedAt?: string; sourceEventIds: string[];
  beforeDigest?: string; afterDigest?: string; evidenceRefs: string[];
  redactions: number; validation?: string; errorCode?: string;
}
\`\`\`

Distinct concepts: **input actor** (who requested) vs **browser account** (whose session) vs **executor** (what process clicked). Do not make the signed-in browser account a surrogate approval for arbitrary requests.

## 4. CDP attach/discovery and lifecycle

### 4.1 Connection
- Prefer a distinct, explicitly owner-authorized Chrome instance launched with a dedicated *non-default* profile directory and \`--remote-debugging-address=127.0.0.1\` / \`--remote-debugging-port=<local>\` (or an implementation-supported pipe). Modern Chrome may refuse remote debugging on the default profile; do not attempt unsafe bypass, profile cloning, or cookie extraction.
- An existing authenticated Chrome instance is attachable **only if** it already exposes a permitted CDP endpoint; do not infer the debug port or secretly restart the owner's browser.
- Discover loopback-approved endpoints using \`/json/version\` and \`/json/list\` / \`/json\`; optionally CDP \`Target.getTargets\` / \`Target.setDiscoverTargets\` with target attach. OS process discovery must be read-only, bounded, redact command-line secrets, and respect available machine capabilities. Do not scan LAN/tailnet for open debugging ports.
- Validate protocol version, browser family, WebSocket endpoint loopback origin, certificate/security policy, target type \`page\`, exact site origin allowlist, and per-process control lease. Reject remote \`0.0.0.0\` debugging ports and cross-user profiles.
- Session state \`DISCOVERED → APPROVED → ATTACHED → OBSERVING → RELEASED\`. On navigation, handle frame/target ID changes. Crash/reconnect must not duplicate last write; reconcile uncertain side effects through an independent after-read.

### 4.2 CDP method families (capability-gated, not assumed universal)
- \`Browser.getVersion\`, \`Target.getTargets\`, \`Target.attachToTarget\`, \`Target.detachedFromTarget\`.
- \`Page.enable\`, \`Page.frameNavigated\`, \`Page.captureScreenshot\`, \`Page.lifecycleEvent\` for evidence and navigation state.
- \`DOM.getDocument\`, \`DOM.describeNode\`, \`DOM.querySelector\`, \`DOMSnapshot.captureSnapshot\`, \`Accessibility.getFullAXTree\` for structural/semantic observations.
- \`Runtime.evaluate\`/\`Runtime.callFunctionOn\` **only for read-only DOM extraction or a reviewed, narrowly declared UI operation**, never arbitrary remote-JS execution passed through from a chat prompt. Prefer protocol-native \`Input.dispatchMouseEvent\`, \`Input.dispatchKeyEvent\`, \`DOM.focus\` and a tested action adapter where feasible.
- \`Network.enable\`, \`Network.responseReceived\`, \`Network.loadingFinished\`, \`Network.webSocketFrameReceived\`, \`Network.getResponseBody\` when accessible to a compatible UI version. Network interception/\`Fetch.enable\` is **not** in v0 read-only mode; passive capture is for metadata/events only and redacts headers/bodies before persistence.
- \`Storage\` and cookie APIs are **out of bounds** unless a specifically reviewed auth capability exists. Never print, export, version-control, or pass raw session cookies/bearer tokens through ChatGPT/PM.

Choose one CDP client library or minimal WebSocket protocol layer after benchmarking and verifying Chrome version; Playwright's \`connectOverCDP\` is optional, not mandatory. Bun/Node preferred on BFF Linux, with small portable modules.

## 5. Automatic semantic discovery and self-healing selectors

### 5.1 Initial discovery
For every screen/dialog:
1. Acquire current URL, origin, title, target/frame IDs and stable app fingerprint.
2. Capture **redacted** accessible names, roles, DOMSnapshot elements/rects and optionally a screenshot kept in protected local storage. Extract only task-relevant regions; never dump full Gmail inboxes or private conversations to remote Git.
3. Build an intent map, e.g. \`chatgpt.project.instructions.editor\` → semantic role textbox + associated dialog label + parent region, not one brittle CSS class.
4. Rank locator candidates by semantics, not click proximity alone: accessibility role/name (0–0.35), stable labeled relationships (0–0.25), DOM ancestry/frame/context (0–0.15), content & route fingerprints (0–0.15), prior verified adapter evidence (0–0.10). Scores are tuning defaults, not statistical confidence until calibrated.
5. **Ambiguity rule:** if top candidate <0.85, or runner-up within 0.10, or target no longer matches the expected dialog/capability, stop with \`SELECTOR_DRIFT\`. High-impact writes additionally demand a before-state revision read and exact target confirmation.
6. Persist a *proposed* selector repair with screenshot/AX digest and fixture diff. A repair cannot acquire new authority, access additional origins, bypass authentication, or silently apply to destructive commands.

### 5.2 Healing protocol
- Observe drift → re-snapshot → semantic candidate generation → replay against **recorded fixture** and fresh page in **read-only mode** → compare before/after selector target and expected role → record selector version and reasoning summary → allow read-only promotion after negative tests.
- Mutating selectors require explicit review or stronger stable invariants before activation; do not use a model's “seems right” text as executable authority.
- Pin adapter version + DOM fingerprint in every action receipt; on failed postcondition mark \`UNKNOWN\`, preserve evidence and use idempotent readback before any retry.
- Every app adapter has an **anti-mutation test** verifying that \`inspect\`, \`snapshot\`, \`list\` and \`watch\` never send clicks, keystrokes, requests or navigation side effects.
- Fallback order: semantic AX candidate → stable attribute/screen relationship → verified DOM locator → guarded coordinate action only in human-approved diagnostic mode. A raw coordinate click must never be the default repair.

### 5.3 Adapter capability registry
Store named operations with status, expected UI route/fingerprint, region locator, side effects, auth policy, test fixtures, and last true end-to-end verification time. A ChatGPT app update or accessibility regression demotes \`SUPPORTED\` to \`DEGRADED\` until new evidence exists. Do not generalize one account's controls to every ChatGPT plan.

## 6. ChatGPT adapter: first executable vertical

### Phase C0 — Discovery and bounded read
- Identify the existing authenticated ChatGPT page target with explicit origin \`https://chatgpt.com\` or other approved first-party host. Verify that it is the intended account/session without copying credentials.
- Discover available projects, sidebar controls, conversation URLs, messages visible in the loaded conversation, and current project controls. For unloaded/virtualized messages, scroll with a read-only bounded pagination loop and detect missing gaps; a single DOM read is never called a complete chat export.
- Provide \`chatgpt projects\`, \`chatgpt chats list\`, \`chatgpt chat open\`, \`chatgpt chat read\`, \`chatgpt project show\`, and source-granular replay JSONL. Not every UI lists all chats; return explicit coverage and partial flags.
- Discover file/instruction edit affordances without executing changes. \`project files list\` only claims actual visible file metadata; do not infer filesystem access by a document title alone.

### Phase C1 — Real streaming receive
- Attach to an authorized conversation, establish a \`conversationRef\` (URL or UI ID), last known message anchor, and an immutable \`watchId\`.
- Send **only after** \`chatgpt chat send ... --confirm\` passes action admission. Capture user-message ACK from the actual UI and correlate it with response generation.
- Prefer a passive DOM MutationObserver within a reviewed app adapter for incremental assistant text and state. Optionally correlate with CDP passive network events for SSE/Fetch/WebSocket if the platform uses them. These transport details are version-dependent and may be unavailable. **Never** rely only on a changing DOM class or assume all network response bodies remain readable.
- Stream JSONL deltas with monotonic \`seq\`, \`streamId\`, \`conversationRef\`, \`messageRef\`, \`observedAt\`, \`contentHash\`, \`isFinal\`, \`source\`, \`coverage\`. Handle text replacement/edit, coalescing, splits and repeated DOM snapshots. Preserve exact visible text when policy permits; **do not invent hidden tokens or chain of thought**.
- Completion requires unambiguous UI state (stop control gone/returned to ready, explicit completion marker) plus no outstanding errors and stable message anchor. If evidence is insufficient, mark \`UNKNOWN_OR_PARTIAL\`, not \`COMPLETE\` after a timer.
- Reconnect: query current visible message anchor and dedupe deltas; record \`GAP\` events if part of stream was missed. No silent concatenation that invents uninterrupted output.

### Phase C2 — Supported ChatGPT writes
**Capability probes and reversible action-first rules:**
1. **Send chat prompt** to selected existing thread or new thread, read back user message and assistant response correlation.
2. **Update project custom instructions** only if UI exposes editable project instructions in current account and the exact project is verified. Preflight: read current content, digest/version, show diff, request confirmation, write via UI, reopen and independently read the saved content; on mismatch mark unverified and try supported undo/restore with approval.
3. **Upload project file** only through UI-supported file attachment/upload, with explicit target project, filename, content digest and measured UI readback. Upload is not evidence the file is indexed, searchable or usable until a separate capability probe confirms it.
4. **Edit/replace/delete a project file** only when supported and after a separate delete/replace policy gate; no invented APIs. If platform exposes only re-upload, report \`REPLACE_UNSUPPORTED\` rather than silently overwriting.
5. **Edit/delete chats or messages, move chats into projects, change custom instructions/memory/preferences:** each is independently probed. Never promise an action the UI does not support. High-impact destructive changes require explicit user authorization, backup/rollback where possible, and exact postcondition.
6. Never write ChatGPT hidden instructions or memory store through unrelated UI elements; these are not accessible mutation targets of the CLI. Modifying accessible **user custom instructions** is not modifying the assistant's system prompt.

### C2 acceptance
- One exact existing chat read with stable message ID anchors and no invented gap fill.
- One send with an actual user-message receipt + real incremental assistant updates + independently read response.
- One low-risk reversible project instruction change in a dedicated test project after consent, pre/post diff, readback and rollback.
- File upload only if a test account/project exposes that exact UI; SHA-linked local input and UI-side filename check.
- Negative tests: wrong tab/account, stale revision, duplicate send, missing confirmation, revoked session, ambiguous selector, network loss and UI update—all **refuse without unintended writes**.
- Privileged account settings, security changes, deletion and batch project mutation are **not** part of first shipping gate.

## 7. Expand to all web apps without duplicating logic

App adapters implement:
\`\`\`ts
interface AppAdapter {
  id: string; origins: string[]; version: string;
  probe(ctx: ReadonlyContext): Promise<CapabilityReport>;
  discover(ctx: ReadonlyContext): Promise<ScreenMap>;
  inspect(ctx: ReadonlyContext, target: string): Promise<Observation>;
  plan(op: string, args: unknown, ctx: ReadonlyContext): Promise<TwinAction>;
  execute(action: AuthorizedAction, ctx: ActionContext): Promise<ActionAttempt>;
  verify(action: TwinAction, result: ActionAttempt, ctx: ReadonlyContext): Promise<ActionReceipt>;
  rollback?(receipt: ActionReceipt, ctx: ActionContext): Promise<ActionReceipt>;
}
\`\`\`
First ChatGPT adapter; second pilot should be **one app whose value is measurable from current work**, e.g. authenticated Vercel deployment status and supported project UI edits (avoid secrets), or GitHub issue comment read/write (already available via connectors—benchmark against the native connector to justify browser control). Gmail/Drive and other apps are separate opt-in adapters. Prefer connected official APIs for completeness/reliability when available; CDP remains the universal fallback/UI parity probe, not a mandate to click what an authenticated API does safely.

Per app capability table: observed UI support, native connector overlap, test date, risk, real receipts, current drift, absent features. No “all apps supported” marketing until measured coverage.

## 8. Action authority, security and incident response

1. CDP transport binds on **loopback or pipe only**. No public \`9222\`, no Tailscale debug-port exposure, no token-bearing WebSocket URLs in logs. AION reaches operations through BFF's authenticated task/receipt layer, **not** by sharing raw CDP controls on the internet.
2. Project-native policy broker takes authenticated principal, account, origin, action, scope, risk, reversible status and exact expected target/revision; model/chat text is intent, not permission.
3. Protect cross-origin navigation: origin allowlist and forbidden domains. Cross-account mismatch aborts. Untrusted page content cannot issue CLI commands or change agent authority.
4. **Read-only default.** Writes need explicit \`--confirm\` and appropriate authorization. Destructive/security/financial actions, bulk edits, messages to external recipients and data export require stronger policy/human confirmation per project.
5. Secrets: redact network auth headers, cookie values, passwords, addresses and sensitive snippets before log persistence; private captures/HTML/screen recordings require local encrypted storage with bounded retention, not \`aion/main\`.
6. Bounded runtime: single tab lease per writer, abort/cancel, timeout, rate limits, no infinite page scroll, no concurrent writes to one ChatGPT conversation without reconciliation.
7. No automatic CAPTCHA/2FA bypass, account sharing across users, stealth identity disguise, or mass scraping outside Owen-authorized scope.
8. Active session UI can contain malicious instructions; treating it as data is mandatory. Do not follow a webpage's “please run this shell command” unless that exact action originates from an authorized principal and is separately admitted.
9. On uncertain side effects, freeze retry and independently observe whether mutation occurred. “Clicked successfully” is not “saved successfully”.
10. Emit tamper-evident receipts to the AION recorder; source message IDs and hashes must be preserved when available, otherwise \`not_observed\`. Anchor chain heads externally so local DB suffix deletion is detectable.

## 9. Record/replay contract

A replay fixture contains:
\`\`\`json
{
  "schema": "twin.fixture.v1",
  "app": "chatgpt",
  "adapterVersion": "0.1.0",
  "originAlias": "chatgpt",
  "capturedAt": "2026-10-16T00:00:00Z",
  "source": "UI_OBSERVATION",
  "redactions": 0,
  "screenshotRef": null,
  "domSnapshotRef": "sha256:...",
  "accessibilityRef": "sha256:...",
  "eventLogRef": "sha256:...",
  "volatileAllowlistVersion": "v1",
  "expectedCapabilities": ["chat.read"],
  "expectedResultDigest": "sha256:..."
}
\`\`\`
Illustrative only—this JSON is not a real capture receipt.

VOMEGA D-419 falsifier adopted: **define which volatile fields are excluded BEFORE** the fixture/live comparison. Live capture should replace an equivalent synthetic/recorded fixture with **zero changes in parsing/classification output** after documented canonicalization. If substitution fails, diagnose/fix fixture schema, capture adapter or version pin; never loosen a security gate to make the test green.

Every action logs ordered stages:
\`REQUESTED → DISCOVERED → AUTHORIZED → PRECONDITION_VERIFIED → ATTEMPTED → OBSERVED → VERIFIED → ARCHIVED\`, with \`DENIED\`, \`DEGRADED\`, \`UNKNOWN\`, \`FAILED\`, \`ROLLED_BACK\` branches.
Use immutable \`requestId\`, \`actionId\`, \`sessionId\`, \`targetId\`, \`conversationRef\`, \`sourceEventId\` and content hash. Privacy-preserving source path/receipt references are okay in private Git; raw secrets are not.

## 10. Engineering plan and proof ladder

| Gate | First meaningful milestone | Acceptance / negative falsifier | Owner |
|---|---|---|---|
| T0 | Environment + repo grounding | exact VOMEGA code/decision hashes; Chrome/CDP version & BFF OS; no default-profile attach, no exposed debug port | BFF |
| T1 | Live Chrome discovery/attach | at least one owner-authorized tab discovered, attached and detached safely; wrong origin and different user refused | BFF |
| T2 | Redacted live UI capture | DOMSnapshot+AX+URL event source, sanitized before storage; fixture/live equivalence passes under predeclared volatile allowlist | BFF |
| T3 | ChatGPT read twin | actual project and chat enumeration with explicit pagination coverage; stable observed message refs; no mutation | BFF, AION readback |
| T4 | Real ChatGPT streaming | one real send + monotonic incremental response + correlated completion and disconnect test; no simulated chunks | BFF, AION accept |
| T5 | Reversible ChatGPT project edit | guarded instruction change/rollback in test project, pre/post SHA, stale revision refused | BFF, AION accept |
| T6 | PM/recorder handoff | PM inbox request → BFF action → GitHub readback + AION ledger anchored; repeated run demonstrates no duplicates | BFF + AION PM |
| T7 | Multi-app expansion | second app adapter has real action proof; no copied ChatGPT selectors; native API comparison | BFF |
| T8 | Resilience | Chrome restart, changed DOM, mid-stream interruption, stale URL, app update and safety denial; no accidental duplicate write | BFF, AION |

**Milestone priority:** T0–T3 can proceed while the PWA P1/Tailscale work completes; T4 after authorization and connected Chrome, T5 only after read/stream safety. Do not delay the PWA merely to make the browser twin beautiful.

### Implementer starter package expected from BFF
- \`workspace/aion/twin/package.json\`, \`src/cli.mjs\` (or \`.ts\` with pinned Bun), \`src/cdp/\`, \`src/adapters/chatgpt/\`, \`src/policy/\`, \`src/recorder/\`, \`tests/\`, \`fixtures/\`, \`README.md\`.
- \`twin doctor\` before any browser side effect. No hidden subprocess restarts.
- Security review before Chrome remote debug is enabled on the owner's regular browser; prefer BFF-controlled isolated profile.
- Tests run under BFF Linux, with sanitized output and source commit; Windows extension only through separately approved local route.
- Real UI proof consists of source SHA, CDP Target identity (safe alias), redacted captured DOM/AX evidence digest, exact action request and actual postcondition. A fixture test report alone is insufficient.

## 11. Known hazards and explicit non-goals

- Chrome/ChatGPT DOM changes are expected; selector healing cannot guarantee zero maintenance.
- A web UI may paginate history, virtualize message rows, and omit backend IDs; missing is not the same as empty.
- A browser DevTools connection does not magically make ChatGPT projects/files editable as underlying filesystem resources. Only supported UI features are in scope.
- Text generation visibility is not equivalent to access to model-internal thoughts or provider API tokens. Never claim to edit *AION's weights* or higher-priority instructions.
- A signed-in browser cannot be treated as a credentials-export route; consent/auth boundaries remain.
- No universal no-click stealth automation, mass account control, uncontrolled scraping, arbitrary JavaScript requested by LLM, or bypass of app security.
- Avoid replacing working GitHub/Vercel connectors with brittle clicking for vanity parity.
- Do not ship a spec-only or simulated controller as \`TWIN OPERATIONAL\`.

## 12. First work order to AION PM and BFF

**BFF:** start T0 with exact Chrome environment and VOMEGA source hashes; implement T1–T3 safely while PWA P1 and AION recorder run in parallel. Commit implementation and a factual test ledger to \`aion/main\`; use current allowed work area, not a new branch/worktree. Return Chrome profile safety proof, target discovery, one actual redacted ChatGPT read, and negative denial evidence.

**AION PM:** create a track \`TWIN-CLI\` with gate IDs T0–T8, owner BFF, verifier AION, dependencies, evidence URLs and statuses. Maintain \`pm/ledger.md\`; do not infer process health from this document alone.

**AION:** check source and execution evidence, resolve architecture disagreements, and accept only a real ChatGPT project/chat read plus independent receipt before advancing the status beyond proposal.

## Source registry — inspected in GitHub

- https://github.com/owenservera/vivim-omega/blob/main/plugins/provider-browser/plugin.json
- https://github.com/owenservera/vivim-omega/blob/main/plugins/provider-browser/src/index.ts
- https://github.com/owenservera/vivim-omega/blob/main/plugins/provider-browser/src/parsers.ts
- https://github.com/owenservera/vivim-omega/blob/main/plugins/provider-browser/src/session.ts
- https://github.com/owenservera/vivim-omega/blob/main/compositions/browser.json
- https://github.com/owenservera/vivim-omega/blob/main/docs/decisions/D-338-browser-realization.md
- https://github.com/owenservera/vivim-omega/blob/main/docs/decisions/D-357-browser-realization.md
- https://github.com/owenservera/vivim-omega/blob/main/docs/decisions/D-418-v1-substrate-chrome-first.md
- https://github.com/owenservera/vivim-omega/blob/main/docs/decisions/D-419-cdp-substrate-lane.md
- https://github.com/owenservera/vivim-omega/blob/main/plugins/provider-browser/test/browser-falsifier.test.ts

**Final status:** technically specified and version-gated. No live Chrome CDP connection, ChatGPT UI edit, or browser twin executable is claimed by this artifact.
