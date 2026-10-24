# AION / U1 universal webapp Chat UI supplier — 24 October 2026

**Scope:** client-side component candidate for the EXISTING Capture Studio `/chat` shell. Do **not** create another app, backend, sender, registry, browser controller, browser actor or authority to grant effects. Source **base** `fa9cb7f5c20040377ebd8ff28678bb24c7cc7dc9` (`main` when brief read); source **result**: use HEAD SHA of this supplier branch/commit linked in the delivery receipt. Folder ownership: `workspace/aion/ops/capture-studio-ui/handoffs/parallel-2026-10-24/`.

## Files and extraction

`U1-SOURCE.tar.gz` is a reproducible source package containing these three readable files; it is not runtime-transpiled/minified code and contains no third-party dependencies:
- `universal-chat.mjs` — `projectWorkspace`, `projectRail`, `projectCapability`, `projectAdapter`, `evidenceRef`, `projectOutcome`, `recoveryView`, `createConversationStore`, `renderNativeBlock`, `mountUniversalChat`.
- `fixtures.mjs` — explicitly fictional synthetic provider/native blocks, seeded and learned adapter versions, rejected shadow drift, streaming revisions, account index and tab fixtures.
- `universal-chat.test.mjs` — native Node tests with injected minimal DOM, no network/CDP/sends.

From this folder (Node >=22, built-in `tar`):

```sh
tar -xzf U1-SOURCE.tar.gz
node --check universal-chat.mjs
node --test universal-chat.test.mjs
```

**Verified locally in ChatGPT isolated container, Node 22.16.0:** `43 passed / 0 failed / 0 skipped` (24 Oct 2026); `node --check` passed. Source SHA256 before packing: `universal-chat.mjs=f72f5bb2c831ed5ac864461980af9229dc66f214251d1258256d95da72a7f512`, `fixtures.mjs=6823215abb030c12c881e8a6fc13e2b6f4ba2e685735bdca45529660f2ce705a`, `universal-chat.test.mjs=444fce966f91e199cfbab220633d1ec6478af992f6f3dcc577d67d2fce1568b3`. Local/synthetic test pass is **not** Windows/browser/live/provider acceptance.

## Integration in canonical existing `/chat`

Destination *only after Z.ai reviews its own 23-patch unmerged export and current main*: `workspace/aion/sessions/roles/09-global-research/labs/website-to-local-streaming/capture-studio/src/studio/ui/universal-chat.mjs`. Keep existing `chat.html` + `chat.mjs` and current Core `api('/api/v1/...')` implementation; do not replace their sender, event polling, read/reconcile or `#transcript`.

1. Extract archive, copy `universal-chat.mjs` to the destination above; port `universal-chat.test.mjs` to product `test/unit/` with import path adapted, and fixture beside tests. This candidate does not touch canonical files itself.
2. Add near top of existing `src/studio/ui/chat.mjs`: `import { mountUniversalChat } from './universal-chat.mjs';`. Within existing `boot()`, mount **once** into an element under existing `#detailsBody` or into a dedicated `<div id="universalIntelligence"></div>` within the same `/chat` page: `const universal = mountUniversalChat({document, root: document.querySelector('#universalIntelligence'), onInspect: ({conversationId}) => { /* verify id === S.snap?.id, then call existing read-only reconcile() */ }, onEvidence: ({sid,sequence}) => { /* existing verified evidence explorer navigation using actual SID+seq */ }, onReviewAdapter: ({site,version,rollbackVersion}) => { /* existing read-only adapter details, NEVER effect/promote */ } });`.
3. Extend the **existing** Chat `render()` *after* snapshot refresh to call `universal.show({snapshot:S.snap, openTabs:S.targets, accountChats:SERVER_READ_ACCOUNT_INDEX_ONLY, providers:SERVER_PROVIDER_RAIL, tasks:SERVER_TASK_INDEX, adapters:SERVER_ADAPTER_INTELLIGENCE_READ_ONLY, capabilities:SERVER_LIVE_CAPABILITY_SNAPSHOT, events:SERVER_ATTRIBUTED_NATIVE_BLOCK_EVENTS, turnIds:SERVER_TRUSTED_TURN_IDS, outcome:SERVER_SEPARATE_OUTCOMES});`. These uppercase names are **integration placeholders**, not purported current Core variables or existing routes. Pass `[]` until their actual Core/Intelligence producers are verified. Do not turn the existing tab list into account history.
4. Event contract: `{turnId,blockId,eventId,sequence,op:'open'|'append'|'replace'|'patch'|'close'|'invalidate',kind,text?,payload?,nativeType?,revision?,evidence?:{grounded:true,sid:string,seq:number,...}}`. Require identifiers and sequence from source; **do not synthesize a native turn key from matching text/timestamp/tab title**. A patch requires a full replacement text or payload; otherwise UI preserves current content and abstains. `accept(event)` buffers chunks; call `show(...)` in coalesced batches, not for every network byte. Never declare G1–G7 success from a UI projection.
5. Use `projectAdapter` only as a **read model**. Core/Intelligence must supply source-scoped candidate version, independent held-out identifiers and qualified provenance. `heldoutIndependent` is a *visible client indication*, not trusted server validation. Round 9 `assertIndependentAdapterHoldout` must stay server side. Learned candidate is not live action capability; never elevate from seed or change a provider site's writable behavior in this UI.
6. Safe uncertainty flow: preserve canonical journal state and existing read-only `reconcile`. `recoveryView` exposes **inspect only**, never retry/resend. `projectOutcome` separates network ended, page stable, fresh reply, capture finalized, accepted and goal fulfilled. `evidenceRef` creates a display SID/seq only when source producer explicitly marks grounded and both are present; UI callback still must revalidate the original source before navigation/claim.

## Compatibility, collisions and proof still needed

- Source inspected: `src/studio/ui/chat.html`, `chat.mjs`, Agent 14 Round 6–9, root governance, #67/#69. Existing `/chat` already owns connection, tab list, identity, chat composer, read-only reconcile, transcript and capture acceptance; U1 is **additive**.
- Conflict risk: Z.ai's 23 proposed patches (reported head `23185932abc7615a25207111f07328ebfb2a0074`) were **not in inspected main**. Integrator must compare the *actual* Z.ai export before adapting selectors/functions; do not blindly apply this recipe and do not merge the 23 patches without review.
- Core needs to expose a read-only native block/event mapping, signed-in state and account index (distinct from open tabs), task statuses, per-capability observed/gate/effect evidence, exact conversation+turn binding, and read-only effect journal inspection. UI does not implement missing endpoints.
- Intelligence needs to expose read-only adapter candidate/seed/learned precedence, capture evidence, independent training/held-out status, drift, shadow result and rollback version. No UI implementation may promote/rollback an adapter directly.
- Current fallback rendering for unknown native blocks is intentionally text+opaque payload preservation in the client state, *not* full native semantics. Markdown is shown as literal source unless the existing Studio integrates a vetted renderer. Image/file metadata is shown as textual source representation rather than loading remote media.
- Node fake-DOM unit tests prove pure client logic only. Windows DOM/browser acceptance, authentic ChatGPT/Claude semantics, real 2+ turn attributed replies, network DOM correlation, exact SID/seq original evidence and on-disk journal reconciliation **not proven**.
- Rollback: remove one `import`, one `mountUniversalChat` call, and one `universal.show` call; delete the added module. No migrations, cookies or server state.

**Data classification:** invented synthetic fixtures; no credentials, provider cookies, private transcripts, site dumps or API substitutes. Every browser action remains Studio Core-owned.
