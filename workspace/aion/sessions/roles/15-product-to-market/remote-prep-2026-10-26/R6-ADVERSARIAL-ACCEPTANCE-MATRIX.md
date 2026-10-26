# R6 — Adversarial Acceptance Matrix and Release-Closure Contract

**2026-10-26 · AION PRODUCT AGENT Role 15 · Thinking: HIGH · Scope: remote GitHub source/test audit ONLY.** **Harness indexed main:** [`32b7021e99aedb3bedb21daae9e7983676ef4771`](https://github.com/owenservera/vivim-harness/commit/32b7021e99aedb3bedb21daae9e7983676ef4771). **Workspace:** `owenservera/aion/workspace/aion/sessions/roles/15-product-to-market/remote-prep-2026-10-26/`. No live or local test, source code edit, agent dispatch or release approval performed in R6.

## 0. Verdict and proof semantics

**V1 WORLD G5 is NOT RELEASE-ACCEPTED.** There is extensive existing implementation and fixture/loopback verification recorded in Harness, but no confirmed complete **human J1 RETURN → J2 ORGANIZE → J3 FIND → J4 TAKE** run in a real browser with a genuine **second OS-process** restart and fresh-profile file transfer. `world-journeys.test.mjs` explicitly disclaims a browser or second process and creates source refs/selections by direct HTTP, not by user click. The primary confirmed code gap is R5's missing UI "Save this displayed part": `world-relations.mjs` exposes POST objects and selections, while `world-view.mjs` never calls those routes. R4 independently identifies inline citation/link and exact truncation-length projection losses.

**Security posture:** export is scoped, bounded and hashed; import checks content and digest, rewrites local identities and reports failed/partial records; VersionedStore uses CAS, exclusive-create file writes, fsync and CURRENT-pointer updates. These are *code properties*, not complete deployment guarantees. `sha256` is an **integrity digest only**, not an origin signature. `world-url.mjs` removes provider URL userinfo/query/fragment but preserves path; message content/other nested URLs may include secrets. All mode warnings must state this rather than promising universal redaction. No owner authorization was granted for invasive auto-redaction, binary preservation or C10/C11 mounting.

**Evidence labels used below:** `S0` current GitHub source inspection; `T0` in-process fixture; `T1` fake/synthetic DOM; `T2` real loopback HTTP with stubbed runtime; `T3p` **second OS process with persisted disposable profile**; `T3u` **actual local browser interactive UI**; `T4` authenticated real provider-native + controlled effect authority, separately authorized PROVIDER lane. Previous test sources and old reports can support "existing fixture coverage" but **R6 did not execute any tests**. Source existence/test naming never counts as pass. W12/G5 requires `T3p + T3u`, not T4 unless product owner changes release scope.

## 1. Reconciliation of active work and source freshness

- [R4 source-truth matrix](R4-CAPTURE-TO-WORLD-TRUTH-MATRIX.md) confirms `DOM_TURNS` is a bounded final DOM observation, not a full provider archive; saved paragraph `inline` citation/link metadata is present in recorded blocks but ignored by `world-view.mjs:blockToMarkdown`; numeric original `truncated` length becomes Boolean in `world-service.mjs`. External binary bytes/native history not presumed captured.
- [R5 human-journey map](R5-HUMAN-JOURNEY-COMPOSITION-MAP.md) confirms 8 peer tabs in one `/chat` shell, working source-level Find, Transfer and Workspace reader, CAS project/note editor; the missing human creation of source objects/part selections and direct `s→o→c:messageIndex:partPath` navigation are top UI gaps.
- [P5 W00–W14](../P5-V1-INTEGRATION-MASTER-WORKLOG-2026-10-25.md) is the master requirement trace, [Q01–Q12](03-ACCEPTANCE-SECURITY-CLOSURE-QUEUE.md) is existing closure backlog; this R6 adds **case IDs A01–A18 as test identifiers only**, *not a new project/task authority*. R4-I1–I3, R5 and Q/W entries stay canonical.
- [Harness formal-test prep](https://github.com/owenservera/vivim-harness/blob/main/docs/FORMAL-TEST-PREP.md) is **source-oriented at earlier HEAD `20574af`**, not up-to-the-minute run proof. [docs/track/worklog.yaml](https://github.com/owenservera/vivim-harness/blob/main/docs/track/worklog.yaml) references HEAD **`007e357`**, older than `32b7021e`, and reports its own first-hand focused 7/7 world journeys, 31/31 UI, 31/31 search/transfer, 12/12 commands, and 21 pass/2 skip agentic-files tests **at that earlier HEAD**. It expressly says **no full-suite or T3 proof**. Old tracker sentences saying Workspace absent are superseded by `src/studio/ui/world-view.mjs:1976–2210` and `test/unit/world-ui-workspace.test.mjs`. Old partPath absence is superseded by `world-search.mjs:85–95` + `world-view.mjs:1480–1534`. Do not re-open them as absent feature work.
- Existing provider-native three-turn objective in [Harness PROMPT.md](https://github.com/owenservera/vivim-harness/blob/main/PROMPT.md) is a **separate possibly active owner-selected PROVIDER lane**. Do not preempt local OpenCode or change browser authority when advancing WORLD.

## 2. Adversarial acceptance matrix

**Status = current grounded assessment, not a test result from R6**. `implemented_fixture` means source supports behavior and specific test case exists or an earlier version receipt is referenced. `code_gap` means current source lacks necessary human action. `proof_gap` means code may work but cannot be declared live passed. `decision` requires owner choice.

| Test | Priority and refs | Attack/failure boundary & exact acceptance | Source and existing targeted test(s) | Current assessment → required proof |
|---|---|---|---|---|
| **A01 Identity/authority** | P0 W01/W04 C02/C04 Q01 | Same text/title/provider URL never grants account equality; observed session, derived hit, user-authored note and imported copy stay visually/structurally separate; imported account `unknown` | `world-service.mjs:26–65,97–127`, `world-relations.mjs:90–120`; `world-relations.test.mjs`, `world-search-imported.test.mjs` | `implemented_fixture`; source + T0/T2 fixtures; T3u imported provenance not verified |
| **A02 Incomplete native observation** | P1 W02–W04 C02–C04 R4-I2 | Missing/active/unreadable/partially truncated DOM_TURNS not "empty full thread"; numeric loss extent preserved if available; full native thread unknown | `world-service.mjs:97–127`, `page-agent.js:220–277`, `world-view.mjs:67–110`; `world-service.test.mjs`, `world-journeys.test.mjs` | `code_gap` for numeric original length; source qualification already implemented |
| **A03 Inline/native content disclosure** | P1 W03/W04 C03/C04 R4-I1 | Existing saved citations and links, code/tables, unknown parts present qualified; malicious href inert; no invented provider-cited sources | `world-view.mjs:210–340`, `chat.mjs:createRichRenderer`; `world-ui.test.mjs`, `world-ui-relations.test.mjs` | `code_gap` for typed inline source rendering; T1 unknown-block inertness, T3u missing |
| **A04 Export reference exclusion** | P0 W09 C09 Q03 | Export `references` omits saved message bodies, never claims that metadata cannot contain secrets, and names omitted dependencies | `world-transfer.mjs:72–108,126–167,216–232`; `world-import-hardening.test.mjs`, `world-export-modes.test.mjs`, `world-transfer.test.mjs` | `implemented_fixture` (construction-based omission); real file JSON scan needed; not guaranteed redaction |
| **A05 Export modes raw content** | P0 W09 C09 Q03/Q09 | `transcript` and `full-saved` do retain selected original text verbatim; parts reasoning/tool flags affect **block filtering only**; never market as body-secret scrub | `world-transfer.mjs:72–108,126–133`, `world-view.mjs:1597–1670`; `world-import-hardening.test.mjs`, `world-ui-export-modes.test.mjs` | `implemented_fixture` and **known privacy limitation**, optional DLP policy `decision` |
| **A06 URL & nested confidentiality** | P0 W09/W10 C09 Q09 | Source `providerUrl` strips userinfo, query, hash but **path may contain secret**. Inspect nested `href/src`, block text, note bodies, manifest IDs and snippets before asserting protection. Export preview must not claim broad scrub | `world-url.mjs:1–33`; `world-transfer.mjs:180–188,278–290,317–322`; `world-provider-url.test.mjs`, `world-import-hardening.test.mjs` | `implemented_fixture` for providerUrl, **unverified** for arbitrary nested fields; no generalized secret scan |
| **A07 Bundle tamper/hash limits** | P0 W10 C09 Q09 | Hash mismatch/missing manifest, inconsistent record digest/kind/ID, duplicate IDs and over-sized bundle refused **before write**; digest ≠ authentication | `world-transfer.mjs:8–19,235–277`; `world-restore.test.mjs`, `world-transfer.test.mjs`, `world-import-content.test.mjs` | `implemented_fixture`, current source verified; T3u file path not verified |
| **A08 Malicious imported structure** | P0 W10 C09 Q09 | Deep/cyclic block objects, enormous arrays/text, forbidden keys, bad block type, bad role rejected, bounded error accounting; no DOM/eval execution | `world-transfer.mjs:20–53,235–275`, `world-view.mjs:730–742`; `world-import-content.test.mjs`, `world-ui.test.mjs` | `implemented_fixture`; high-limit/memory and real file behavior `proof_gap` |
| **A09 Import identity/collision** | P0 W10 C09 Q02 | Local digest-scoped IDs, second changed-content bundle does not overwrite prior import, same bundle skips, existing local-ID collision becomes `failed[] + partial` not a fake successful 409 | `world-transfer.mjs:18–19,300–350`; `world-import-hardening.test.mjs`, `world-restore.test.mjs` | `implemented_fixture`; do **not** change HTTP status blindly |
| **A10 Dependencies/references** | P0 W05/W10 C05/C09 Q02 | Outgoing dependency closure declared; reference-only source does not become message content, missing dependencies remain dangling/unresolved; later unrelated import does not silently rebind | `world-transfer.mjs:138–145,193–218,255–272,303–334`; `world-import-hardening.test.mjs`, `world-restore.test.mjs` | `implemented_fixture`; actual project/note UI continuity incomplete |
| **A11 Partial HTTP 200** | P0 W10/W11 C09 Q02 | Restore with some `applied` plus `failed`/`partial` always explicitly says incomplete, shows IDs and retries without overwriting good records; zero applied ≠ full success | `world-transfer.mjs:300–350`, `world-view.mjs:446–458,1765–1777,1880–1930`; `world-ui-transfer.test.mjs`, `world-import-hardening.test.mjs` | **Already implemented** as summary behavior; **T2→T1→T3u integrated receipt proof missing**, don't rewrite store |
| **A12 Source-ref creation UI** | **P0** W05/W11 C05/C06 Q07 | From a displayed saved block, user creates source-ref and part selection, attaches to project, comments via note; exact `messageIndex/partPath` and revision, no false atomic-success on partial POSTs | `world-relations.mjs:96–120`, `world-service.mjs:166–187`, `world-view.mjs:981–1023,1101–1132`; `world-journeys.test.mjs:85–103` seeds via HTTP | **Confirmed `code_gap`**: UI never POSTs `/objects` or `/selections`, fixture does |
| **A13 Find exact part & imported ID** | P1 W07 C07 Q04 | HTTP-produced unique `partPath=[i]` focuses only matching rendered block; ambiguous/not-rendered → message fallback and warning; imported hit uses local ID; no unsafe HTML from snippet | `world-search.mjs:61–95,170–207`, `world-view.mjs:1354–1548`; `world-search.test.mjs`, `world-search-imported.test.mjs`, `world-ui-find.test.mjs` | Producer+consumer **implemented separately**; integrated real response to UI and T3u focus `proof_gap` |
| **A14 Unknown block visibility** | P1 W03/W07 C03/C07 Q05 | Unsupported native payload shouldn't silently become rendered/executed HTML; if generic search indexes hidden block keys/values, define safe visibility/snippet policy, test synthetic secret marker without a real credential | `world-view.mjs:205–303`, `world-search.mjs:61–68,172–207`; `world-ui.test.mjs`, `world-search.test.mjs` | **Cross-surface code-path mismatch**; targeted policy/test `proof_gap`, not known exploit |
| **A15 CAS/conflict/interrupted disk** | P0 W06/W12 C06/C16 Q08 | Two writers never overwrite a newer project/note; interrupted write never yields false committed UI, source remains byte-unchanged, recover safe after process death | `versioned.mjs:23–72,104–147,210–270,273–347`, `world-view.mjs:598–640,1306–1342`; `world-service.test.mjs`, `world-ui.test.mjs`; other store tests to locate at execution | `implemented_fixture` CAS/lock/fsync, **real Windows kill/restart `proof_gap`**; avoid tests in real owner root |
| **A16 Process + file + browser journey** | **P0 G5** W12 C01/C09 Q01/Q08/Q10 | J1–J4 in **real /chat**, true OS process terminate/restart on same disposable root, export via actual browser file, restore into independent clean root, selection without preseed, provenance and no source mutation | `world-journeys.test.mjs:1–20,85–103`, `world-ui*.test.mjs`, `docs/FORMAL-TEST-PREP.md` | `proof_gap`: fixtures expressly not T3p or T3u; blocked until A12 UI action exists |
| **A17 Empty/offline + focus/narrow** | P1 W11 C01/C06 Q10 | Without Chrome provider, open Saved/Create/Import; 800px or narrow screen keyboard/tab-focus, scroll to selected part, live regions and error states usable; no phantom loading/no consent side-effects | `chat.html:215–258`, `world-view.mjs:655–770,2139–2188`; `world-ui-workspace.test.mjs` | T1 synthetic UI covers structure; real CSS/DOM/accessibility `proof_gap` |
| **A18 Scope/effects & optional libraries** | P2 W13/W14 C10/C11 Q12 | World reads/JSON transfer do not send to provider or create second browser governor; command preview cannot execute; agentic file roots read-only and explicitly allowed. Mount C10/C11 **only if owner authorizes** | `integration-hub.mjs:112` existing world routes; `src/studio/commands.mjs`, `agentic-files.mjs` dormant; `docs/track/worklog.yaml:129–136` | `decision`: not V1 WORLD G5 blocker while intentionally unmounted; Windows junction/chmod acceptance separate if mounted |

### Three particularly important risk corrections

1. **Do not mark Q02 "restore partial-success implementation missing".** `restoreSummary` explicitly tests `failed[]`, `partial`, `dryRun`, `receipt`, zero-applied; `world-ui-transfer.test.mjs` covers fake-DOM messaging. Remaining need is an **actual response→visible UI** acceptance, clean recovery and post-import browsing (R5 rank 4).
2. **Do not mark part-level Find or Workspace as absent.** The unique part producer, marked frame consumer and recent Workspace reader/focus/abort/provenance suite are source-present. Missing work is one producer→route→UI contract proof and direct reference-to-original action, not a second search or frontend.
3. **Do not conflate "secret not in references export" with "bundle fully scrubbed".** `world-import-hardening.test.mjs` intentionally asserts secret-looking text appears verbatim in transcript/full-saved. In all modes, nested metadata and paths can contain private material. Even full-saved mode is not a native full account archive.

## 3. Release gate contract with actual required receipts

| Gate | Requirement | Minimum evidence / decision | Current state |
|---|---|---|---|
| **G0 — Source inventory** | Current Harness main, actual route/module owners, R4/R5 source-data/UI contract | S0 file SHA + source refs | **S0 completed** at indexed commit, not shipping acceptance |
| **G1 — RETURN** | A saved mixed message opens, unknown/partial labelled, no provider/account identity invention | T0/T1/T2 focused cases plus T3u browser reading | **Fixture covered; T3u missing** |
| **G2 — ORGANIZE** | User creates project, source object, exact part selection, note from UI; CAS preserves source bytes | **A12 implementation + focused T1/T2 + T3u** | **BLOCKED ON CODE** |
| **G3 — FIND** | Search new selection/note; exact unique block focus and imported local ID; ambiguities say so | T2 producer + actual UI handler integration, T3u real focus | **BLOCKED ON EVIDENCE/CONTINUITY** |
| **G4 — TAKE** | Exact scoped export, user file download, validate→dry-run→confirm→foreign-id restore, honest partial and omissions | T0/T1/T2 regression plus T3u actual file and fresh data root | **Fixture covered; T3u and browsing continuity missing** |
| **G5 — ONE WORLD** | One human J1–J4 in one app; project and note survive second OS process, clean-profile import; negative controls pass | **T3p + T3u** distinct dated receipts at same commit/test root, no owner data uploads | **NOT ACCEPTED** |
| **G6 — Optional provider attachment** | Only if owner reauthorizes: existing CDP effect authority, provider-native provenance and consent, no second actor | T4 recorded provider-native local receipt, never substituted by fixture tests | **Separate/deferred WORLD lane** |

**Owner decisions (not code blockers for safe V1 scope):** require content default/consent for unredacted transcript/full-saved; whether extra redaction/DLP is required for share-ready exports; whether asset bytes/version history are core; whether to mount C10/C11; whether local OpenCode is currently WORLD or PROVIDER owner. **Code blockers:** A12 UI part selection, direct source-return where needed. **Evidence blockers:** A13 producer→UI integration, A16 T3p/T3u, A17 actual focus, A06 nested privacy edge cases. Mark each separately in receipts.

### Local evidence receipt template

```text
CASE: Axx / Qxx / Wxx / Gx
WORKTREE: C:\0-BlackBoxProject-0\vivim-harness
GIT: git rev-parse HEAD = <actual SHA>; git status --short = <actual output>
OWNER/LANE: WORLD or PROVIDER; active files reserved = <actual paths>
EVIDENCE TIER: S0 | T0 | T1 | T2 | T3p | T3u | T4
COMMAND/INTERACTION: <exact executed test command or manual step>
DATA ROOT: <disposable absolute path; no real profiles>
EXPECTED: <visible behavior, IDs, omissions and invariants>
OBSERVED: <actual data, result, failure/skip>
OUTPUTS: <test counts, safe logs, optional redacted screenshot>
SOURCE INTEGRITY: <hash unchanged or failure>
CHANGED FILES / COMMIT: <if implementation done; otherwise none>
PROOF LIMIT: <what this receipt does NOT establish>
STATE: passed | failed | blocked | not_run
```

Never write `passed` on an unexecuted command, prior different SHA or browser simulator. Fixture/HTTP tests cannot claim Windows actual use. GitHub AION docs are **task/evidence exchange**, not permission to activate another live agent.

## 4. Next engineering work — only three nonconflicting phases, no PC-wide audit

1. **Q07/W05,W11: complete "Save this part" in current world UI.** Owner `src/studio/ui/world-view.mjs` only where possible. Compose existing `POST /objects` → `POST /selections` → `PUT /projects/{id}` with truthful recovery after a partial sequence; optional note `commentsOn` path; no new store, no new actor. Test `world-ui.test.mjs`, `world-ui-workspace.test.mjs`, `world-journeys.test.mjs`. Restore final human path from R5.
2. **Q04/W07,W12: prove combined search hit and stable part focus.** Focus a **single test lane** on `world-search.test.mjs`, `world-ui-find.test.mjs` and existing `world-view.mjs` UI; preserve unique/ambiguous/imported behaviors. Do not rewrite the search engine. May run in parallel with step 1 **only if no overlapping world-view edits**.
3. **Q01/Q08/Q10/W12: execute the bounded full journey + negative controls on disposable roots.** After step 1 UI support, perform real process-restart, real browser saved reading, download-and-clean-import, visibility/keyboard checks and one synthetic partial-failure branch. Preserve captured source bytes. This is **product acceptance while delivering actual progress**, not a prerequisite PC-wide verification program.

R4-I1/R4-I2 fidelity improvements are valuable and independent user outcomes but share `world-view.mjs` with phase 1; coordinate/serialize as a single owner. Q09 threat review follows with synthetic data during normal implementation; arbitrary automatic content scrubbing is **not** an unapproved prerequisite. Phase 3 cannot be proclaimed passed remotely.

## 5. Runtime / test semantics and test-command caveats

[Formal prep](https://github.com/owenservera/vivim-harness/blob/main/docs/FORMAL-TEST-PREP.md#L194-L242) explicitly separates T0/T1/T2 from T3. [world-journeys](https://github.com/owenservera/vivim-harness/blob/main/test/unit/world-journeys.test.mjs#L1-L20) uses same-Node-process `startStudio` reopening, not independent Windows process. [worklog](https://github.com/owenservera/vivim-harness/blob/main/docs/track/worklog.yaml#L1-L16) reports historical focused passes at older HEAD only. A prior [docs/LIVE-TEST.md](https://github.com/owenservera/vivim-harness/blob/main/docs/LIVE-TEST.md) may mention a different old full-run count, **not** fresh current-head acceptance.

At local owner-scoped worktree, after confirming `HEAD` and pending edits, use existing `node --test` focused tests, `node scripts/architecture-inventory.mjs --check`, and `bun run test` or equivalent Node runner when feasible. **Do not use `bun test` as if the package Node test command ran**, do not launch unrelated E2E/Chrome, do not run on real user profiles. No need to first audit an entire PC.

## 6. Security/technical source receipt index

| Fetched current source | GitHub blob SHA | Source pointers |
|---|---|---|
| `src/studio/world-transfer.mjs` | `b4ea4866812f9cb831d3ff758ac03eef00d921af` | limits 8–19; export 115–232; validate 235–292; restore 294–351 |
| `src/studio/world-url.mjs` | `e749caeb6b6fc0318db790aed25ced4770fcd82e` | 1–33 |
| `src/studio/world-service.mjs` | `51401682c474c9218db1a20481f0e5b3a0b7a6b6` | 26–79; 97–127; 166–191 |
| `src/studio/world-relations.mjs` | `65b58a09f2d1484510bcc3bb5df5b4a31d157398` | 18–120 |
| `src/studio/world-search.mjs` | `7c6dee282fdbe4b4acc708464ede00207d9da9a1` | 61–95; 170–207 |
| `src/studio/ui/world-view.mjs` | `06e194261611c1cebe31385173ae6ef7a95ac71f` | render/part 210–340; restoreSummary 446–458; create/select gap 981–1132; search 1480–1548; restore 1880–1930 |
| `src/store/versioned.mjs` | `e2df7184188d92577f465162a483b4d93b118bdd` | name/path 23–108; locks 210–270; fsync/CURRENT/CAS 273–347 |
| `docs/FORMAL-TEST-PREP.md` | `252b226dfe8bc3c6b7e9fece5a9e8c53b4dff7cc` | 1–17; 194–242 |
| `docs/track/worklog.yaml` | `c9888e08d1a5a4b7ff924caeefb2249b8a091ee8` | 1–16, 108–136; historical HEAD 007e357 |
| `test/unit/world-provider-url.test.mjs` | `9dbd2a18d31de37f349563be849e000d615cb206` | 6 URL read/export/import tests |
| `test/unit/world-import-content.test.mjs` | `aa9eff01e89b5ef98d9eb0a7755d99c792ab4209` | 3 bounded-content tests |
| `test/unit/world-restore.test.mjs` | `3c58bbd4e30221e1388b2b577a5ed25b67b98106` | 6 import and HTTP tests |
| `test/unit/world-transfer.test.mjs` | `21691efdbc290da80ff079f2321df14c75c14018` | 7 export and limits tests |
| `test/unit/world-journeys.test.mjs` | `a9edeaecb01554ef0ca4b71b6a7deffd47c8da87` | 7 T2 HTTP synthetic journeys |
| `test/unit/world-import-hardening.test.mjs` | `e058ab9746da3b31e754d867773d6a63410debc2` | 8 collision/content privacy cases |
| `test/unit/world-ui-transfer.test.mjs` | `a5fb2343bcb85ce86ed75e20f611b42bdde681ee` | 3 T1 transfer cases |
| `test/unit/world-ui-find.test.mjs` | `9a7c8d1d8e3ee920758b6947e8e24d60db66f274` | 7 T1 focus/fallback cases |
| `test/unit/world-ui-workspace.test.mjs` | `f7c74d8a0c4002510c126f36185441d7a301e972` | 13 T1 Workspace focus/race cases |
| `test/unit/world-search.test.mjs` | `8f1b9bb4f324253f15921f1832c31cbe770e0101` | 14 T0/T2 search cases |

These blob SHAs came from direct connected GitHub fetches; they distinguish known files from stale or invented module paths. `test/unit/versioned-store.test.mjs` was **not found** by that exact name and is deliberately **not** claimed. Current safe UI rendering is inferred from source DOM creation and existing synthetic tests; no general security penetration-test pass is claimed.

**R6 research conclusion:** protect existing code and test investment; close one essential missing human interaction, one producer-to-UI integration seam, then gather honest browser/process receipts. Release remains **not accepted** until those receipts exist.
