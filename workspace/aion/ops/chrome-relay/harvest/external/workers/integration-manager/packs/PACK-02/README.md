# PACK-02 — read-only ChatGPT page profile, observer and response boundary

**Status:** source staged on AION `main` for Development review, not wired, run, or accepted. **No donor tests or AION tests were executed.** PACK-01 must exist first because this module imports its pure terminal-evidence classifier.

## Actual source and provenance

- `chatgpt-profile.js`: read-only message/copy/stop/logged-out selectors, strict `/c/<conversationId>` route parsing and bounded page sampling, adapted from `multi-ai-chat/src/content/chatgptDom.ts`.
- `response-boundary.js`: read-only assistant baseline and confirmed-user anchor filtering, adapted from `multi-ai-chat/src/content/responseTracking.ts`. Refuses old/remounted, empty, positional, ambiguous and unmatched assistants as correlation proof.
- `chatgpt-observer.js`: epoch/account/binding-gated passive snapshot and per-message revision changes. Bridge `PassiveObservationRouter` contributed keyed passive snapshot/dedupe technique, but its eventBus, artifact registry and request actions were **not imported**.
- `LICENSE-MULTI-AI-CHAT.txt` (Theodore Huang, 2026 MIT) and `LICENSE-CHATGPT-BRIDGE.txt` (Serhii Tkachenko, 2026 MIT).

**Pins:** `multi-ai-chat` upstream `cdcf6a7fb05609b219fd85395a116f26476a7f92`; `chatgpt-bridge` upstream `0ffdae90239988f253058c05253226152acd55d2`. All references are within `harvest/external/landing/donors/`.

**Dependencies:** ES modules + DOM read APIs + PACK-01 `terminal-evidence.js` only. No third-party packages, network, cookies, native host, chrome.debugger, effects or persistent storage. Page selectors are provider-specific heuristics, not a versioned public ChatGPT DOM API.

## Exact Development integration points

1. P2 owner chooses/adapts `extension/src/providers/chatgpt/profile.js` from `chatgpt-profile.js` and `extension/src/providers/chatgpt/observer.js` from `chatgpt-observer.js`; `response-boundary.js` remains a pure companion. These destination files are **not present on main** at packaging.
2. Feed `bindingKey`, `accountKey`, `conversationId` and `pageEpoch` from P1's **authenticated existing** binding/session source. Do not derive account identity from URL. In `sample`, `authenticatedBindingKey` and `authenticatedAccountKey` must be independently supplied by the owner of the browser binding; otherwise no observations are emitted. On page epoch change, discard the old observer and its journal.
3. First sample is a **silent baseline**. Subsequent changes are `first_seen`/`revised` with `currentTurnConfirmed:false`; `first_seen` is intentionally *not* proof of a newly created ChatGPT message after remount. `assistantFollowingConfirmedUser` needs an independently confirmed **provider ID** for the new user turn; even its result is only `candidate`, not verified completion.
4. The DOM observer marks `complete_history:false` **always**: it cannot prove offscreen history, shadow roots, or iframe completeness. Completion remains `unknown` unless separate positive generation/final/blocker evidence is supplied. Copy-action presence and absent Stop alone never certify terminal. P1 and its authoritative snapshot/1 control final field names, text cap and consumer trust.
5. P3 native IPC uses **data-only** events and snapshot; do not add any method here that clicks, uses keyboard, sends messages, retries, calls private backends or writes to the Bus. P6 receives no implementation from this pack.

## Development-owned tests / unknowns (not run)

- Exact URL, account, binding and page epoch mismatch; revoked binding; logged-out screen; same URL but different account; new chat without `/c/` route.
- Initial existing history and React remount must not be reported as a newly confirmed answer; repeated text, empty assistant shell, duplicate IDs and positional identity fail closed.
- Revised in-place assistant gets monotonically increasing revision; no false new turn; confirmed user ID + exact following single assistant required; old/orphan answer and multiple assistants remain unknown.
- Copy action on an old turn, missing Stop, 150+ DOM messages / 100 page limit, virtualized/offscreen nodes, shadow/iframe unknown, content truncation and malicious command-like text.
- No effects, private endpoints, content persistence or unscoped subscribe. Tests for real authorized watch-only I1 are Development/local-owner work.

Read donor tests only as fixture inspiration: `multi-ai-chat/test/responseTracking.test.mts`, `chatgptDom.test.mts`, `chatgpt-bridge/test/turnObservationEvidence.test.js`; none were run.
