# P3 — VIVIM Experience, Acceptance and Real Integration Map

**Date:** 2026-10-25 · **Agent:** PRODUCT AGENT performing P3 only · **Status:** proposed integration map, not code or approved implementation. **Scope:** current Harness `main`; Z.ai round-one code excluded. **Effort:** HIGH. Complements [P1 product shape](../../P1-V1-PRODUCT-SHAPE-2026-10-25.md) and [P2 data/knowledge contract](../data-knowledge/P2-DATA-KNOWLEDGE-CONTRACT-2026-10-25.md). No P4/P5/P6 launched.

## ERA 1 — The useful product and its real source seams

**Product premise:** First make VIVIM useful without logging into a provider: a person opens saved rich AI work, saves part into a named project with an editable note, finds it by text with authentic source context, and safely exports/restores the chosen project. External interactive Chrome follows **after** an integrated stable local experience.

**Minimal interface:** four discoverable functions in one coherent app: **Library → Projects → Find → Transfer**. They can be panes/routes; no demand for a new frontend, design system, graph DB or framework. These represent journeys, not four separate subsystems. Existing Studio functionality should remain discoverable as needed without a second product runtime.

**Honest top-level signals:** `Local data ready`, `No saved work`, `Sample data`, `Original source unavailable`, `Partial evidence`, `Imported`, `User-authored`, `Derived`, `Unknown native part`, `Index coverage limited`. No “Connected” unless actual provider account/target is verified. No “Synced” or “Backed up” unless independently true.

### Exact current-Harness source inventory for implementers

| Product need / API seam | Current source | Observed from source / confidence | Real gap to evaluate |
|---|---|---|---|
| Existing UI shell and states | [`src/studio/ui/chat.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/chat.mjs) | Same-origin `/api/v1`, safe DOM text, operational source/send/reply states; **source read** | Not proven a durable personal Library |
| Native rich content, source labels, unknowns | [`src/studio/ui/universal-chat.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/universal-chat.mjs) | `projectWorkspace`, `evidenceRef`, `createConversationStore`, `renderNativeBlock`; **source read** | Projection/store are client display mechanics; cross-restart user archive unproven |
| Studio existing sessions/knowledge/search surfaces | [`src/studio/ui/index.html`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/ui/index.html) | Prior direct source survey, path known; **partly inspected** | Reuse UI/service; confirm selected links and location in current app |
| Local API dispatch | [`src/studio/server.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/server.mjs) | Local-only Studio JSON API, Session/Replay/Export imports; **source read** | Determine actual local read/search/export endpoints and gaps, not assume routes |
| Existing capability/integration hub | [`src/studio/integration-hub.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/integration-hub.mjs) | Registers existing storage, replay and intelligence APIs without second truth store; **source read** | Which app-facing semantics are missing vs suitable for reuse |
| Conversation effect/lifecycle API | [`src/studio/conversation-api.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/studio/conversation-api.mjs) | Thin current-lifecycle surface with connect/submit/reconcile/read; **source read** | Don't confuse live read with user-owned offline record |
| Source evidence session records | [`src/store/session.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/store/session.mjs) | Raw / datasets / KV / session metadata; P2 source verified | Not a human project overlay by itself |
| Safe revision patterns | [`src/store/versioned.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/store/versioned.mjs) | CAS, immutable versions and locks; P2 source verified | Relevance to user edits requires measurement; no forced schema |
| Search and continuity | [`src/intel/search.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/intel/search.mjs), [`continuity.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/intel/continuity.mjs) | BM25-style indexed retrieval and conservative keyed links; P2 source verified | Saved user notes/links and coverage aren't proven indexed |
| Existing exports | [`src/export/export.mjs`](https://github.com/owenservera/vivim-harness/blob/main/src/export/export.mjs) | Dataset, transcript, knowledge and bundle exports, read-only over captured sessions; **source read** | True owner-world restore/import, sanitized selection and conflict handling unverified |

**Source-linked candidates (WHAT/WHY/WHERE, not HOW):** [Final typed rich content](https://github.com/owenservera/vivim-final/blob/master/src/schema/streaming.ts), [Final approachable UX](https://github.com/owenservera/vivim-final/blob/master/frontend/src/app/page.tsx), [user-selected export UX](https://github.com/owenservera/claude-export-hub-vivim/blob/main/README.md). Donor behavior not independently live-tested. [Discovery atlas](../../discovery/VIVIM-CAPABILITY-ATLAS.yaml) retains additional candidates. No donor-framework transplant mandated.

## ERA 2 — Four complete, observable journeys

### J1 RETURN — Local rich reading (must work disconnected)

**Start:** Fresh installation with a clearly labelled synthetic sample dataset or a deliberate user-supplied local input. The UI never implies the sample came from the user's provider account.

**Actions:** Open Library; choose a saved local conversation; inspect ordered messages including text, code/table, citation, file/artifact reference and one unknown rich part; inspect one incomplete or missing source; close/restart the local app; select the same conversation.

**Must see:** same local identity and order; rich parts readable; "unknown" displayed, not silently dropped; a local source link only where supported; unavailable origin clearly identified. No provider login or interactive Chrome required.

**Negative checks:** source gap, provider identity unverified, duplicate textual content, unsupported part, absent local file, partial content, tampered link. No fake remote/thread confidence.

**Acceptance evidence:** local integration test with before/after restart state snapshots plus UI observable result; distinguish fixture-pass from authenticated source-pass.

### J2 ORGANIZE — Create a durable project and save a useful artifact

**Start:** Saved J1 conversation.

**Actions:** Create project `North Star`; save a chosen message part and file/artifact reference to it; add note `Check the assumptions before sending`; edit note once; unlink one item; close/restart.

**Must see:** project has stable identity, selected linked items remain, edited note persists, unlinked item removed only from project, original conversation/evidence remains. Source-captured vs user-authored is visually obvious.

**Negative checks:** duplicate bookmark, simultaneous note revisions, missing original source, invalid target link, interrupted write. Failed writes must not show "Saved."

**Acceptance evidence:** after-restart project membership and user note compare against pre-restart; original source checksum unchanged.

### J3 FIND — Retrieve and inspect exact provenance

**Start:** J1 + J2 populated and independently persisted.

**Actions:** Search unique phrase in a saved message; search note `assumptions`; select result; navigate to conversation's exact part or project note and inspect source/identity/coverage status.

**Must see:** correct local record and source; no same-title conflation; clear index scope and stale-index behavior; "derived suggestion" is not "verified fact."

**Negative checks:** identical phrase in two provider/source records; partial index; a deleted note still in stale index; empty query; unsupported binary content; source missing.

**Acceptance evidence:** local query/result fixtures with exact object ID assertions, index rebuild/restart recovery and visible coverage limitations.

### J4 TAKE — Portable selected project and safe restore

**Start:** Project North Star with rich content, artifact pointer, user note and mixed available/missing source references.

**Actions:** Select project export; inspect inclusion/exclusion preview; export a versioned bundle; import into an isolated empty local profile; inspect restored project; try importing same bundle twice.

**Must see:** recognizable project, note history/last valid revision, item ordering, opaque rich parts and original provenance/unknowns; explicit unavailable binaries if excluded. No implicit provider account connection. Duplicate import is non-destructive.

**Negative checks:** malicious relative asset path, forged manifest hash, corrupted archive, duplicate different-content IDs, absent binary, secrets accidentally included, incompatible future version.

**Acceptance evidence:** machine-comparable manifest/object coverage summary, no-sensitive-material checks, restored UI proof with provider disconnected.

### Integrated vertical demonstration (the actual product gate)

A single person executes **J1 → J2 → J3 → J4** on *one* durable object set without switching to a developer console or unrelated app. The sequence still works after app restarts and user-controlled restoration. UI and underlying service must agree on what was saved, what is missing, and what was only inferred. **Four disconnected passing modules do not pass this gate.**

## Deterministic fixture proposal — content, not tech implementation

```yaml
fixture_id: vivim-v1-north-star
origin_kind: synthetic_sample
provider_identity: unverified
conversation:
  local_title: "Research on a project question"
  turns: "at least 3, ordered"
  required_parts:
    - text
    - code
    - table
    - citation_with_source
    - artifact_reference_with_optional_missing_file
    - unknown_opaque_part
    - partial_stream_marker
project:
  name: North Star
  selected_part: "explicit stable local part ref"
  note: "Check the assumptions before sending"
  edit: "mark note reviewed"
search:
  queries: ["assumptions", "distinctive phrase in source"]
  results: "exact local object and part IDs"
transfer:
  scope: "selected project and linked included objects only"
  exclude: ["cookies", "tokens", "raw_auth_headers", "browser_profiles"]
```

This is a **product test fixture description**, not a finalized schema or a file to execute. P2 decides identity constraints; the implementer chooses fixture encoding.

## Cross-cutting experience obligations

- **Reader accessibility:** keyboard reachable actions, discernible focus, source labels not color alone, source/role/status text, long-message wrapping, reduced-motion support where relevant. Specific accessibility framework is an implementation choice.
- **Honest error handling:** loading, empty, no index, stale index, partial capture, failed save, unavailable import, unsafe archive, no provider and unknown identity must result in informative safe states.
- **Personal trust:** user edits are distinctly identified; source observations are not editable in place. Deleting an association is not deletion of source or remote account content.
- **Content privacy:** private provider text is not sent to third-party product analytics, unauthorized external calls or an export bundle without selection and consent.
- **Source completeness:** show coverage for the selected local scope; no claim of complete account history merely because some content was captured.
- **Reversibility:** same project/notes survive derivation/reindex and importer remapping; incomplete source remains known.

## ERA 3 — Integration-agent crosswalk and handoff

The following separates **existing implementation evidence** from **proposed V1 contract**. It is deliberately independent of worktrees, frameworks and database choices.

| Capability ID | User-visible WHAT | WHY | Current WHERE | Source status | Gap / acceptance | Effort |
|---|---|---|---|---|---|---|
| X01 | Saved local conversation library | return to AI work without provider login | `capture/conversation-service.mjs`, `store/session.mjs`, `studio/ui/chat.mjs` | confirmed primitives; integrated library unverified | stable saved reading object and restart | MAX boundary / HIGH build |
| X02 | Rich native message display | preserve provider meaning and unknown shapes | `studio/ui/universal-chat.mjs`, Final streaming types | existing renderer verified in source, donor pattern | full mixed-part fixture, unknown fallback | MED |
| X03 | Source proof and coverage status | credible personal information | `store/raw-log.mjs`, `intel/corpus.mjs`, `intel/continuity.mjs` | provenance supported in source | evidence pointer display with gaps | MED/HIGH |
| X04 | User-created project/note associations | turn AI output into owned work | `studio/ui/index.html`, existing session API; P2 contract | not proven integrated | project links and edits survive restart | HIGH |
| X05 | Search saved records and deep links | find and reuse exact work | `intel/search.mjs`, `intel/corpus.mjs` | search algorithm source verified | user notes included, stale coverage exposed | MED/HIGH |
| X06 | Scoped safe portable transfer | user-owned recoverability | `export/export.mjs` | read-only export confirmed; V1 import unverified | clean-profile round trip + negative cases | HIGH |
| X07 | Real provider/native-thread interaction | later connected value | `capture/conversation-runtime.mjs`, `studio/conversation-api.mjs` | existing runtime, not new V1 internal gate | after stable app, controlled Chrome and owner auth | HIGH / after gate |
| X08 | Existing capability honesty | no phantom connected accounts or unsupported actions | `studio/capabilities.mjs`, `studio/ui/universal-chat.mjs` | source primitives | explicit offline and unverified states throughout app | MED |
| X09 | User correction versus observed evidence | preserve both trust and user agency | `intel/continuity.mjs`, P2 user overlay semantics | source conservatism confirmed; overlay proposed | note changes never overwrite captured origin | MAX boundary / MED build |
| X10 | Repeated export/import identity collisions | no lost user work | `store/versioned.mjs`, `export/export.mjs`, P2 contract | versioned store pattern; import unverified | conflict report and non-destructive restore | MAX boundary / HIGH build |

**Agent-oriented priority:** X01–X06 and X08–X10 are internal-world capability candidates. X07 is held until stable internal product acceptance. No complete BUILD/HARVEST implementation decisions have been made. Product Agent and local models own MAX identity/authority reconciliation; coding agents independently choose HOW for MED/HIGH work and may use appropriate dependencies when they reduce total complexity.

### Source-truth gaps for P4, without launching it

1. Which current Studio read/search/export routes actually serve stable saved conversation entities rather than current live sessions?
2. Are project, human note, and bookmark semantics implemented anywhere in current Harness beyond client-projection naming?
3. Which captured sources allow exact message-part ID and source range reconstruction after restart?
4. Is current export bundle sufficiently sanitized for sharing one user-selected project? **Do not assume yes.**
5. Is any import path already present for personal-world content? Source inspection here did not demonstrate one.
6. How much local saved source content is present on the owner machine? GitHub cannot answer.
7. Which precise renderer formats and file asset paths work on a real sample, not a synthetic unit fixture?
8. Which legacy donor components meet the user journeys more cheaply than adding narrow Harness features? Test comparative implementation cost later.

**P3 output status:** A user-facing experience, precise four-journey acceptance, synthetic fixture contract, source-to-capability matrix and source-qualified unresolved gaps have been defined. **No backend/front-end code, tests, Chrome activity, migration, other agent launches, or local file operations executed.**
