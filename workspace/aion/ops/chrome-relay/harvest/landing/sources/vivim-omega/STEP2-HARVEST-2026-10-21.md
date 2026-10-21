# Vivim-omega — STEP2 harvest ("one additional step"), 2026-10-21

**Evidence cut:** 2026-10-21T09:30:19Z (tool-observed UTC). **Status:** SOURCE_INSPECTED, static read + hash + read-only Git identity only. Nothing in the donor was executed, installed, built, tested, written, fetched or committed. No browser/CDP. Two files authored: this memo and `STEP2-DISPOSITIONS-2026-10-21.json` (40 rows).

**Builds on, does not replace:** `index.jsonl` (38 rows), `REMOTE-BATCH-01/02.md`, `LOCAL-SOURCE-REVIEW.md` (ROUND1 + ROUND2, which already resolved the 12 flags at the pin), and `landing/synthesis/*`. This step independently re-checks those results, adds a container-wide variant census, machine-derived test/licence counts, bounded per-command absence searches, a custody (EOL) finding, and new fail-open defaults not recorded before.

**Roots used.**
- **P** = `Vivim-omega/Core/wave0-omega-forge_2/`, HEAD `79ee558d6c7ea77c20f220db2341adaa57b11d44` (= the GitHub `source_revision` in every index row), tracked-file status clean (0 changes). Re-verified this step.
- **B** = `Vivim-omega/BCP-dev/omega-baseline/omega-final/` inside BCP-dev, HEAD `4c14cf8a5020dc166e3c1bed409d1a76f57a88d8` (re-verified). Used only where already cited by ROUND1/2.
- The enclosing `Vivim-omega` directory is an unborn `master` container (`.git/HEAD` → `refs/heads/master`). It is not the donor revision.

## 1. The 12 FLAGGED entries: resolution tally 12/12 located

Byte-identity check (this step): 25 of 25 `COPIED_MODULE` source hashes match working bytes at P, and also at `Core/baseline-d423-d424` (HEAD `d466161`, a different commit with identical bytes for these paths) and at `lab/workspace-bc6f…/vivim-omega`. Every other snapshot fails 2 to 6 of them. `git hash-object` of P `provider-browser/src/index.ts` = `92a3724a…`, which equals VO-GH-0038's `source_git_blob_sha`.

Container census: 29,294 files under the container, excluding `node_modules`/`.git`, were path-matched. The "copies" column counts how many snapshot trees hold that relative path. "eq P" counts how many of those copies are byte-identical to P.

| ID | Path at P | Bytes | Lines | SHA-256 (P working bytes, LF) | copies / variants / eq P |
|---|---|---|---|---|---|
| VO-GH-0016 | plugins/provider-browser/src/index.ts | 17296 | 299 | 9a4d70fd51a33c8bbed1ee6bec4f697b2df9c093ae309933ee85599871a19701 | 12 / 3 / 10 |
| VO-GH-0017 | plugins/provider-browser/test/browser-falsifier.test.ts | 15334 | 247 | 68fe1dc72279c1ca0a72296c314a35795c5c1414050e0a79502664ddbc536b06 | 12 / 2 / 11 |
| VO-GH-0018 | plugins/discovery-verification/src/index.ts | 17861 | 348 | 72a3923bbd0616b70bc3f7b7bfa5beba5c416a843b9755cd2a0f2a5865c937c7 | 12 / 2 / 9 |
| VO-GH-0019 | plugins/discovery-observation/src/index.ts | 11533 | 220 | 7ce537dabfd4344cc69230e40491cba2303d44a848e928607d2e8a6b8ee9f650 | 12 / 1 / 12 |
| VO-GH-0020 | plugins/discovery-mapping/src/index.ts | 10025 | 209 | 0854a04bc5437ba88101f581be35f760c535ad6390b8e62885f00d52bdaf8254 | 12 / 1 / 12 |
| VO-GH-0021 | plugins/discovery-inference/src/index.ts | 5360 | 108 | e142484970fb9cbd470633d30868f50cb4792110668544862edfffeeb38f11c5 | 12 / 1 / 12 |
| VO-GH-0022 | plugins/vivim-chat/src/index.ts | 16904 | 317 | 6a6060959ac561aa54c1d65bc8cc53c6245746eaa1ec68f2404a517f560bdf34 | 12 / 3 / 10 |
| VO-GH-0023 | surfaces/mcp/src/mcp.ts | 11744 | 263 | 6987554e37d2b848cd157f1439310f894ac26046a1a69679b2532aee608b4e90 | 12 / 2 / 11 |
| VO-GH-0024 | contracts/src/intent.ts | 2527 | 72 | e9f7a66933725a58f6ac3c28faf71e276d9e1e6abb52a17c0eacc13ff8ab3464 | 8 / 2 / 4 |
| VO-GH-0025 | plugins/vivim-agent/src/agent.ts | 22758 | 548 | cfad59f1dd57fee9c8c2240ea92fd17fa3d6fe65048dc51aca689f80f7c57154 | 12 / 1 / 12 |
| VO-GH-0026 | docs/decisions/D-380-provider-bar.md | 3991 | 72 | 2c9710bdfd79f26c49078a73431df9a57e90e1b25f28b3400df393d30ddc203d | 10 / 2 / 7 |
| VO-GH-0027 | plugins/discovery-perception/src/index.ts | 8328 | 163 | 1a2c4a7d62dbfb0c30f7c85efef977b41acc5d1fa2b32532cc466076cb563208 | 12 / 1 / 12 |

**Tally:** 12 located at P with full hashes. All 12 hashes equal `LOCAL-SOURCE-REVIEW.md:40-53`, so that table is independently confirmed. 0 were "not located in this pass". Bytes were not copied. Index capture statuses are deliberately left unchanged, because this lane's write scope is these two files only.

**Variant notes (new):**
- The `provider-browser/src/index.ts` variants are P (10 copies), B `94a2b4c0…` (the CDP fork from ROUND1 §B) and `Zai/V15/.../tree-omega` `f1f2218d…` (unread).
- The `contracts/src/intent.ts` variants are 2527 B (P, with D-411 `interpretation` and `IntentResolution`, P:`contracts/src/intent.ts:34-59`) and 1792 B (in FullTest D391/pre-D391, Zai V0/V15-clone). The 1792 B variant is unread and predates the D-411 fields by size only; no ordering is claimed.
- The D-380 variants are 3991 B (P) and 3653 B (Zai V15-clone, latest (1), latest (6)). The 3653 B variant is unread.

Single-variant paths need no cross-snapshot reconciliation.

### Newly reachable families, assessed against P (re-read this step)

- **Browser preflight (0016).** P:`plugins/provider-browser/src/index.ts:217-294` runs bars in a fixed order: fence holds → payload/recipient → session ATTACHED/`message.send` → realization PROMOTED and BROWSER_MEDIATED → parser version and pin. Then it replays a fixture and appends an `email` row. **New defect:** bar 4 reads `ctx.manifest.contributions.parser?.[0]?.version ?? PARSER_VERSION` (`:255`). `browser.attach@1` refuses a missing manifest parser (`:150-153`), but `message.send@1` substitutes the compiled constant. The send path is fail-open relative to the attach path. Bar 4 still needs a covering pin (`:259-263`), so this is a consistency defect, not a bypass of all four bars.
- **Falsifier tests (0017).** 10 `test(` call sites (machine count, §5). Names cover a consent gate before the handler bars (`:110`), unpinned-realization refusal (`:161`), released/unknown session refusal (`:226`), and redaction absent from stored bytes (`:79`). Read, not run. They use `host.router.callAsRoot` (`:56`), so they never exercise a non-root principal.
- **Verification (0018).** P:`plugins/discovery-verification/src/index.ts:14-26,236-259`: the genealogy fence runs before any write, every probe ref is resolved through `vault.get`, and confidence is never read. Realization status at `:288-296` is PROMOTED / REQUIRES_REDISCOVERY / TESTING, and never-probed bindings get no row. This confirms ROUND2 R2.4.
- **Observation/perception/inference/mapping (0019/0027/0021/0020).** Fixture-directory readers (`discovery-perception/src/index.ts:51-55`, `discovery-observation/src/index.ts:71-75`). Inference tolerates malformed nodes "as data" (`discovery-inference/src/index.ts:6-10`). Mapping ranks with `pickBest` (`discovery-mapping/src/solve.ts:61-62`). No live-DOM path exists at P.
- **Chat (0022).** `chat.resolve@1` (`vivim-chat/src/index.ts:259-302`) takes the deterministic exact match, else `resolve.classify@1`, where no PROMOTED realization means HUMAN with an empty capability. It records a decision and never executes.
- **MCP (0023).** Tools come only from `router.status().routedOps` (`surfaces/mcp/src/mcp.ts:242`), and every call is `callAsRoot` (`:154`). The tool description shows `meta?.risk ?? "READ"` (`:65`), so an undeclared risk is advertised as READ.
- **Intent (0024).** A vocabulary of 10 IntentStates and a 4-value IntentResolution (`:7-9,59`). `isStepDone` treats failed/skipped as "done" (`:70-72`), meaning terminal, not success.
- **Agent (0025).** Scope attenuation and subset checks (`agent.ts:93-134`). Delegate input is validated as data (`:425-451`). Nothing launches a worker.
- **D-380 (0026).** Ratified design bar. `:60-61` says "Nothing here changes code today".

## 2. Exact-40 dispositions

`STEP2-DISPOSITIONS-2026-10-21.json` was machine-generated and checked:
- **Row count:** 40 rows, 40 unique `command_id`, set difference vs `aion_command_matrix.csv` distinct `command` = 0. The matrix has 1000 rows = 40 commands × 25 provider/surface rows.
- **Rubric split:** 29 CORE (P0 19, P1 10) + 11 REGISTRY.
- **Dispositions:** PARTIAL 17, UNKNOWN 23, MATCH 0.

Each row carries:
- a scope qualifier ("same bound provider web conversation");
- donor `path:line` (P/B);
- rubric `path:line` (CORE-OPERATIONS.csv and capability-universe.csv);
- a bounded search receipt (pattern, root P@79ee558, excludes `*.md`, `**/fixtures/**`, `*.test.ts`, files hit);
- the existing AION owner `path:line`.

Every donor and AION path was checked to exist, with the cited start line in range. All 40 rows agree with `LOCAL-SOURCE-REVIEW.md:133-174`; this step changes no disposition.

What the bounded searches add:
- 20 of the 23 UNKNOWN rows now carry a zero-hit or irrelevant-hit search receipt (18 zero-hit + 2 irrelevant-hit). The remaining 3 UNKNOWN rows (chat.open, chat.search, chat.archive) have hits that are local or email semantics, as noted per row. Zero hits: sessions.list, model.list, model.select, file.attach, chat.rename, generation.stop, steer, message.edit, chat.delete, chat.share, branch.create, message.copy, tool.toggle, project.select, chat.export, mode.select, context.inject, ui.panel. Irrelevant hits: thinking (1 gate-log string), regenerat (12 build/fixture notes).
- These are **bounded** absence statements: P only, the listed regex only, those exclusions. They do not cover B, other snapshots or repo-wide semantics.

## 3. Corrections to the first pass (item IDs)

- **C1. VO-GH-0016 was not byte-less.** VO-GH-0038 already holds an excerpt of the same blob (`92a3724a`). This step verified that the copy, LF-normalised, equals P lines 195-299 exactly. 0016 should be read as "whole-owner located, excerpt in 0038".
- **C2. VO-GH-0038 line labels.** `line_ranges: 195-300`: the file has 299 lines (line 300 is the empty split after the final newline). `one_sentence_value` says those lines "show forbidden fence…". In fact 195-216 is the attach tail and `browser.release@1`; the bars start at 217 and the fence check is at 222-227.
- **C3. Copy-hash custody (all 26 items with bytes: 0001-0015, 0028-0038).** No working-tree copy in this AION checkout matches its recorded `copy_sha256`. Every one matches after CRLF→LF normalisation.
  - Cause: `core.autocrlf=true`; `git ls-files --eol` reports `i/lf w/crlf` (sampled 0001, 0038).
  - Effect: recorded hashes describe the index/LF bytes. A verifier must hash `git show :<path>` or LF-normalised content, or it will report false drift.
  - The `crosswalk_copy_sha256_verified: null` in the synthesis ledger is consistent with this gap.
- **C4. Redact-then-hash was attributed to VO-GH-0008 alone.**
  - The ordering lives in **VO-GH-0016**: P:`provider-browser/src/index.ts:160-164` redacts first, then sha256s the redacted bytes; `:166-186` appends capture, then session by `{ns,id,rev}`.
  - VO-GH-0008 (`session.ts:105-147`) supplies only the reference/shape validators, and `asCaptureRecord` does not recompute the digest (as `LOCAL-SOURCE-REVIEW.md:61` notes).
  - The best candidate is therefore 0016+0008 jointly, as a method.
- **C5. VO-GH-0012 / VO-GH-0013 / VO-GH-0014 "browser" framing.** These are correct at P (fixture email). Only B adds the CDP path. Do not merge B behaviour into these P-pinned rows (unchanged from ROUND1, restated because 0016 is now located).
- **C6. VO-GH-0007 hazard ("unknown provider class coerced to SIMULATOR").** This step confirmed it at P:`plugins/vivim-providers/src/registry.ts:47-49`. The same file also returns null for an unknown status (`:44-45`), which is a fail-closed counterpart. Record both, not only the coercion.
- **C7. Omitted fail-open sources.** `plugins/law-stub/src/index.ts:11,13` is an allow-all `law.check@1` and a `granted:true` consent stub. It is referenced by 5 compositions at P (`demo`, `kernel`, `notes`, `run`, `vault` and `_matrix.json`), not `browser.json`. No first-pass row records it. Any "law gate" claim must name the composition.

## 4. Reusable kernels, method only (K1–K12)

No `K1–K12` vocabulary exists in the AION tree: a bounded `rg "\bK12\b"` over the AION repo returned 0 hits. The labels below are **local slot numbers for this memo only**, not a new taxonomy. Each kernel is a method to restate inside an existing AION owner. Nothing is copied, and no store, registry, enum or schema is proposed.

| K | Method | Donor anchor | Existing AION owner it would sit inside | Falsifier the method must survive |
|---|---|---|---|---|
| K1 | Redact → hash the redacted bytes → persist by immutable `{ns,id,rev}` reference | P index.ts:160-186 + session.ts:105-147 (0016+0008) | conversation-contract.js evidence/observation path | raw text never hashed or persisted; malformed/rev<1 ref rejects |
| K2 | Ordered fail-closed preflight with self-naming refusals | P index.ts:221-263 | bus.js dispatch + grants.js:47-59 | each bar refuses independently; no bar defaulted from a constant (see R2) |
| K3 | Exactly-one-final advisory chunks; terminating result authoritative | P contracts/src/parser.ts:84-103; port.ts:50-78 | bus.js outcome handling (:227-232) | final chunk followed by persistence failure ≠ success |
| K4 | Parser pin triple match | P parser.ts:75 | observer parser metadata | same version with changed implementation must refuse (ROUND2 U8) |
| K5 | Proof evaluation that records confidence and never reads it | P evaluate.ts:88-154; verification index.ts:14-26 | acceptance/evidence intake | confidence 0.99 + failed probe never promotes |
| K6 | Governed-input fence before any durable write | P verification index.ts:236-253 | grants.js:26-31 validation-before-store | ungoverned pin produces zero writes |
| K7 | Gap taxonomy (missing / risk-mismatch / empty), **minus ranking** | P solve.ts (gap report only) | read-only diagnostics | two valid Send targets → block, not `pickBest` |
| K8 | One catalog projection from booted ops; listing ≠ authority | P surface.ts:25-43; mcp.ts:242 | command-space matrix / Bus registry | listed-but-ungranted stays denied |
| K9 | Deterministic-first resolution; no match → HUMAN / routes nowhere | P vivim-chat/src/index.ts:259-302 | Bus ingest | ambiguous never auto-selects |
| K10 | Scope attenuation: child ⊆ parent | P agent.ts:93-134 | grants.js agent/op scoping | over-broad child refuses |
| K11 | Typed negative outcomes (UNKNOWN / AMBIGUOUS / REFUSED) | P contracts/src/outcome.ts (VO-GH-0006) | bus.js REASON / UNRESOLVED | outer ok=true with nested REFUSED is not success |
| K12 | Negative-bar test recipes | P browser-falsifier.test.ts:110,161,226 | AION offline test suites | tests must also run under a non-root principal (0017 uses root only) |

**Rejected fail-open defaults (do not carry):**
- **R1.** law-stub allow-all `law.check@1` and `granted:true` consent (law-stub/src/index.ts:11,13).
- **R2.** Bar-4 manifest-parser fallback `?? PARSER_VERSION` (provider-browser index.ts:255).
- **R3.** Undeclared risk shown or bound as READ (mcp.ts:65; discovery-mapping/src/blueprint.ts:9).
- **R4.** Unknown provider class → SIMULATOR (registry.ts:47-49).
- **R5.** Confidence-ranked effect target (solve.ts:61-62).
- **R6.** Baseline-lookup failure swallowed as "no baseline" (LOCAL :98, carried).
- **R7.** Shim wraps every return as `ok:true` and releases concurrency on timeout (LOCAL R2.3, carried).
- **R8.** Optional principal fence on chat history (LOCAL :107, carried).

**Resend after reconnect:** not re-verified this step. ROUND2 R2.3 found no command replay in the daemon client, CLI or B live send after click. The only second call is the MCP retry after a *definite* law refusal (mcp.test.ts:233-265). Any donor timeout/reconnect path must still be treated as possibly-submitted. AION's existing no-resend rule (`extension/src/bus/bus.js:14`, `ledger.js:6`) stays authoritative.

## 5. Licence, test inventory, AION overlap

**Licence (P, tracked files, machine count):**
- 0 tracked `LICENSE`/`COPYING`/`NOTICE` files.
- 46 tracked `package.json`, 0 with a `"license"` field; root package `"private": true`.
- Per ROUND2 R2.1 this is provenance metadata for the owner's own code, not a reuse blocker. Third-party-derived units keep their attribution.

**Test inventory (P @79ee558, read not run; regex `^\s*(test|it)(\.(skip|only|todo))?\s*\(` over tracked `*.test.(ts|js)`):**
- 873 tracked files; 133 test files; 1323 `test`/`it` call-site lines; 0 `.skip`/`.todo`.
- By top-level directory: plugins 609, tooling 368, host 87, surfaces 70, sdk 68, testkit 51, packs 38, platform 27, examples 5.

Families tied to the 12 flags (call-site lines per file):

| Family | Test files (call-site lines) |
|---|---|
| provider-browser | browser-falsifier 10, parsers 11, m13-containment 3 |
| discovery-verification | verify 25 |
| discovery-observation | observe 16 |
| discovery-perception | perceive 21 |
| discovery-inference | infer 15, integration 11 |
| discovery-mapping | map 12, variations 7 |
| vivim-chat | chat 9, harvest 9, pilot 15, resolve 6 |
| vivim-agent | agent 14, control 8, decision-ref 3, exec 8 |
| vivim-intent | intent 10, intent-seam 7, intent-phase3-4 7 |
| surfaces/mcp | mcp 11 |
| vivim-providers | providers 6 |

These counts are source call sites, not executed or passing tests. (`Core/baseline-d423-d424` differs: 786 tracked, 111 test files. It is a different commit and is not used for counts.)

**AION overlap.** AION already owns the following; none is claimed missing, and none is to be replaced:
- Bus scoped grants: `workspace/aion/ops/chrome-relay/extension/src/bus/grants.js:12-67`.
- Durable ledger and no-resend task store: `ledger.js:1-6`.
- The no-resend invariant: `bus.js:14`.
- Unknown outcome → UNRESOLVED: `bus.js:227-232`.
- Reconcile: `bus.js:462-475`.
- `aion.conversation.event/1` and `snapshot/1` with cursor (epoch, sequence) and coverage: `extension/src/lib/conversation-contract.js:6-7,26-27,41-46`.
- PACK-01/02, delivered per `workers/development/DELIVERABLES.md:13-14,30`.

Donor value is limited to K1–K12 methods and the R1–R8 / B negative corpus. PACK-03 is not touched or renamed. No AX IDs are introduced.

## 6. Top 5 findings

1. **All 12 flags located with full hashes at the exact pin**, independently confirming ROUND1. The new container census shows 7 of 12 paths have drifting variants across 12 snapshots. Only P / baseline-d423-d424 / lab match all 25 prior captures, so folder names cannot stand in for revision identity.
2. **Custody: the AION working copies of all 26 captured items carry CRLF** (`core.autocrlf=true`). Recorded `copy_sha256` values verify only after LF normalisation. Without that note, a future verifier will report false drift.
3. **New fail-open in the browser preflight:** bar 4 falls back to the compiled `PARSER_VERSION` when the manifest declares no parser (index.ts:255), while attach refuses the same condition (index.ts:150-153). This asymmetry is not recorded in any prior pass.
4. **`law-stub` allow-all is live in 5 P compositions** (law-stub/src/index.ts:11,13). Any donor "consent/law gate" statement holds only for compositions that load `vivim.law`; it must be scoped per composition.
5. **The exact-40 ledger is unchanged: PARTIAL 17 / UNKNOWN 23 / MATCH 0.** It now carries per-row bounded-search receipts and AION-owner `path:line`; 18 commands have zero hits at P. The best reusable method is K1: redact → hash-redacted → reference. It belongs to VO-GH-0016 plus VO-GH-0008, not 0008 alone.

## 7. Residual (not done this step)

- Unread variants: `Zai/V15/.../tree-omega` browser index `f1f2218d…`, chat index `dac4ba55…`, mcp `d9c7833d…`, verification `1001e969…`; intent 1792 B; D-380 3653 B.
- Not re-verified, carried from ROUND1/2 with citations: R6–R8 and the resend matrix.
- Index status updates for 0016–0027 and the C1–C3 metadata fixes are left to the parent (out of write scope).
