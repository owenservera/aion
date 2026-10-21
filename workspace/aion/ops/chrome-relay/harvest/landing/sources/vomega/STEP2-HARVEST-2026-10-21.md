# VOMEGA - Step 2 harvest (2026-10-21)

Scope: one additional step against the full local checkout `C:\0-BlackBoxProject-0\VOMEGA`. All access was read-only: file reads, `rg`, `Get-FileHash`, and read-only `git rev-parse`, `rev-list`, `diff --stat`, `ls-files`, `hash-object` and `status`. No donor code or tests were run, nothing was installed, no browser or CDP was used, and there were no git writes. This pass builds on the first pass (`index.jsonl` VM-CLI-0001..0037, `items/`, `RETENTION-ASSESSMENT.md`) and on the lane memo `LOCAL-SOURCE-REVIEW.md`. It does not repeat that memo; it adds line-level evidence, verifies the known facts, and answers the gate-file question.

Companion: `STEP2-DISPOSITIONS-2026-10-21.json` has exactly 40 rows. The script check found rows=40, unique=40, and 0 differences against the distinct `command` values in `aion_command_matrix.csv`. All 29 `CORE-OPERATIONS.csv` IDs are present.

## 0. Baseline

| Fact | Value | How derived |
|---|---|---|
| Local HEAD | `dded272cf93673d1d057e895ea2947920859ce67` | `git rev-parse HEAD` |
| First-pass pin | `12c853259f60cf3a883c7fb1c9f329d696606d64`, 3 commits behind HEAD | `git rev-list --count 12c8532..HEAD` = 3 |
| omega-baseline drift between pin and HEAD | none | `git diff --stat 12c8532 HEAD -- omega-baseline` was empty |
| Dirty entries | 23 (16 modified, 7 untracked). None is under `omega-baseline/` | `git status --porcelain` |
| Tracked files under omega-baseline | 513 | `git ls-files omega-baseline` |
| Command matrix | 1000 rows, 40 distinct `command` values. There is no `command_id` column, so `command` is the key | `Import-Csv` + `Sort -Unique` |

## 1. Exact-40 dispositions (summary)

Counts from the JSON: method_reuse 9, reference_only 15, reject 0, not_located 16. Every row has a scope qualifier and either a `path:line` in VOMEGA or a bounded "not located in this pass" with the `rg` pattern used.

- **method_reuse (9):** chat.export, discover, health, history.read, model.select, observe, receipt.read, send (pre-dispatch only), stream. Each is a method or test recipe. None is a provider capability.
- **reference_only (15):** agent.delegate, agent.status, cancel, chat.create, chat.open, chat.search, file.attach, grant.manage, model.list, recover, reply.read, result.export, session.bind, tool.call, ui.panel. These are donor-internal vault/host ops, fixtures, D1 stubs or declarations.
- **not_located (16, bounded):** branch.create, chat.archive, chat.delete, chat.rename, chat.share, context.inject, generation.stop, message.copy, message.edit, mode.select, project.select, response.regenerate, sessions.list, steer, thinking.level.set, tool.toggle. These are bounded to the stated patterns over `omega-baseline/**/*.ts`. That is not repo-wide proof of absence.
- **send** is `method_reuse` for the READY-withholding law only (`experimental/d1/src/validate.ts:35,65`). Its executor is rejected (`execute.ts:11-12` throws). No row is promoted to a live or provider-native capability.
- The row set differs from the LOCAL-SOURCE-REVIEW section 3 table in vocabulary only (for example its UNASSESSED corresponds to not_located here, and its NOTE_ONLY to reference_only). The substance is the same, except: `context.inject` is now not_located (no injection path was found), `sessions.list` is now not_located (no sessions-list op handler exists), and `recover` is now reference_only (the only `recover*` code is host boot recovery, `host/src/recovery.ts:22`).

**Name collisions to keep out of the crosswalk:** `chat.open@1` creates a vault conversation, so it is not "open a provider chat". `intent.cancel@1` only writes compensation evidence. `bootWithRecovery` is host boot. `RATCHET_MODE` is a test mode. D1 "semantic edit" edits a draft, not a sent message.

## 2. Corrections and verifications against the first pass

| # | Ref | Finding | Evidence |
|---|---|---|---|
| C1 | VM-CLI-0036/0037 vs VO-GH-0004/0005 | **Verified.** Local raw sha256 for `contracts/src/port.ts` is `8a7b7980d35f0bc2643026cd58573e6273b81bbdccd941821593e176e9639244` and for `surface.ts` is `fc690a7284540ac04b0c9efbad25b27874f419388673e8c5ba5c6bee533e9fe0`. These equal the VO-GH-0004/0005 reported hashes byte for byte, and the Git blobs `dee68ad.`/`9a9e3cd.` equal the pointer records. This is one lineage. Count it once and do not treat it as corroboration. Nit: the crosswalk `line_ranges` say 1-95 and 1-44, while the local files have 94 and 43 lines. | `Get-FileHash`; `git hash-object` |
| C2 | VM-CLI-0023 | **Qualified.** The phrase "SIMULATED stub" is imprecise. `execute.ts:11-12` throws `notImplemented("D1-063")` and emits nothing. `SIMULATED` appears only in the comment at `execute.ts:4` and as the declared types at `contract.ts:149` (`expectedEvidence`) and `:170` (`evidenceClass`). It is a throwing stub with a SIMULATED-typed contract. Nit: the card says 14 lines, the local file has 13. The hash matches. | file read |
| C3 | VM-CLI-0010 / RETENTION finding 3 | **Verified, but re-anchored.** The framesForWorld carrier mismatch is implemented in `frames.ts:154-165`: any op without a default frame gets a `genericFrame` with one rest slot. It is characterized in `experimental/d1/src/compile.ts:20-26`: against a D1 world this yields `surface.assist`/`unknown`. `interpret.ts` only consumes `framesForWorld` (`:91`, `:224`). The separate false-`ok` issue is `interpret.ts:127-139`: the status is based on confidence ≥0.7 plus frame bookkeeping, and `assemble` defaults to `status:"ok"` at `:200`. Cite these two issues separately. | file read |
| C4 | VM-CLI-0018 | **Verified.** compile.ts is prompt.send-specific: there is a verb table at `compile.ts:58` (`"prompt.send@1": ["ask","send",...]`), the header at `:18-26` rejects generic `interpret()`, and registration remains a task-labelled stub (header `:15-16`). | file read |
| C5 | VM-CLI-0027 | **Verified REJECT-AS-PROTOCOL.** `surfaces/cli/src/cli.ts:181-182` defines the Command union as call/consent/msg/daemon/plugins/status, and every effect path goes through `boot.host.router.callAsRoot` (`:322,331,339,378,387`; stated at `:12`). Keep the CLI ergonomics only. | rg |
| C6 | VO-GH-0031 | **Reject stands, and the same bytes are present in VOMEGA.** `omega-baseline/plugins/discovery-mapping/src/blueprint.ts` has sha256 `dbff57f5.`, identical to the VO-GH-0031 reported hash. A missing risk binds as READ at `:9` (comment), `:52`, `:61` and `:68`. The first-pass VOMEGA index does not record this duplicate. No new ID is added; this is a duplicates note only. | Get-FileHash, rg |
| C7 | VO-GH-0007 | **Reject stands, and the same bytes are present in VOMEGA.** `plugins/vivim-providers/src/registry.ts` has sha256 `80f2ba99.`, identical to VO-GH-0007. An unknown providerClass falls back to `"SIMULATOR"` at `:47-49`. Same duplicates note as C6. | Get-FileHash, rg |
| C8 | VM-CLI-0015/0029/0030/0031 | **Confirms LOCAL-SOURCE-REVIEW section 1.** The local raw sha256 differs from `index.jsonl`, but the working-tree `git hash-object` equals the recorded `source_git_blob_sha` for all four, so this is CRLF checkout (`core.autocrlf=true`). VM-CLI-0032..0035 have blobs equal to the pure NLCL files (for example grammar `1b8c05e.`). The other 27 rows match raw. | scripted compare |
| C9 | RETENTION "extension/src/bus" | **Path qualifier.** AION paths are `workspace/aion/ops/chrome-relay/extension/src/bus/` and `.../extension/src/lib/conversation-contract.js`. There is no repo-root `extension/`. The overlap claim itself stands. | Get-ChildItem |
| C10 | VM-CLI-0014 | **Precision.** `release-use-corpus.test.ts:85` has one static `test.failing(` call site, which is executed once per corpus case with baseline "fail" (`:5`). The number of expected-failure cases is data-driven and was not computed here. | rg |

## 3. Gate-blocker files: all three located (unblocks D1 gate reading)

| Path (VOMEGA-relative) | sha256 (raw local bytes) | Lines | Git blob (at 12c8532 = HEAD content) |
|---|---|---|---|
| `omega-baseline/experimental/d1/test/gates/_gate.ts` | `2974b09d26a9ec9c3fcdc9a10fcf1f25d36761d69a1da13896da533eec628c09` | 6 | `21fe2dc8096743d5281568e911172bca725554e4` |
| `omega-baseline/experimental/d1/test/gates/_helpers.ts` | `31d86c61abcd754b46549ff29974650220554599d1731fb1d82d51a88447782a` | 42 | `b354f55adda4bb803088df6bfbaf6d81cd4c2442` |
| `omega-baseline/experimental/d1/src/index.ts` | `8603989cfe1b65366ad9984c2a893ce9803a036b138c8b6606e9c300a4a93e79` | 17 | `ca24b020a15d5986910baf28506bfbf20c20e806` |

All three are tracked and clean. They complete the dependency set, but D1 gates also need these files:

- `_gate.ts` imports `experimental/ratchet/src/gate.ts` (sha256 `9d250242955a70a0fb0d97ea6623f428e950135ec4a3cf28968f064218034db2`) and reads `experimental/ratchet/specs/d1/ratchet.lock.json` (sha256 `d08c3afb07058392e578752ee3e6a729ea9e3790992502da89bc995dc90074e6`). Under `ratchet/src/gate.ts:9,28,39`, open gates run as `test.failing` unless `RATCHET_MODE=probe`. A green run is therefore not a passing-body result.
- `_helpers.ts` imports `loadNamedWorld/readWorldFile/initialState/say/dispatch` from `src/index.ts`, and so needs `worlds/W0-W5.json`, `declarations/*.json` and the whole `src/` barrel (17 export lines covering contract, digest, world, declarations, session, validate, compile, project, ui, reflection, help, execute, evidence, replay, metrics).
- Gate inventory: 9 `*.gate.test.ts` files (a-truth through i-release) plus `_release.ts`. The first pass captured only `a-truth` (VM-CLI-0026) and `c-command` (VM-CLI-0025).

These files were not run. Copying them into AION is not proposed. For reading, the gate test bodies are now fully resolvable.

## 4. Reusable kernels (method reuse only; no store, registry, enum or schema is proposed)

| Kernel (K1-K12 vocabulary by name) | Donor method | Path:line (B = omega-baseline/) | AION note |
|---|---|---|---|
| compiler | Shared lexer + grounder, plus a capability-specific phrase layer that reads required fields from declarations and authority from World | B/experimental/d1/src/compile.ts:18-33 | Reuse the split, not the prompt.send branches (`:58`). There must be one canonical pipeline, not two parsers. |
| READY law | One-directional law: it can withhold READY and never grant it. Required fields come from declarations | B/experimental/d1/src/validate.ts:35, :60-65 | Contrast with heuristic `ok`, B/plugins/vivim-nlcl-pure/src/interpret.ts:127-139. |
| stale-result | Revision identity, result binding to revision + World digest, stale suppression | B/experimental/d1/src/session.ts:3-4 (D1-030..032), :45-48 | Draft-level only. AION's operation key and no-resend rules are unaffected. |
| provenance | Live-only evidence keys and an explicit detector | B/experimental/d1/src/evidence.ts:9-11 | Use as a negative test: simulated objects must never carry live keys. |
| outcome | Ordered preflight bars that fail closed with an attributable reason | B/plugins/provider-browser/src/index.ts:221-240 | Pattern only. The surrounding code is an email fixture. |
| redact-then-hash | A versioned redaction policy as data, plus a canonical sha256 digest | B/plugins/vivim-credentials/src/index.ts:85, redact.ts:1-4; B/experimental/d1/src/digest.ts:5,27,30 | The size cap counts UTF-16 units, not bytes (LOCAL-SOURCE-REVIEW 9.3). A semantic digest is not an operation key. |
| discovery projection | Observe and map ops kept apart from authority | B/plugins/discovery-observation/src/index.ts:114; discovery-mapping/src/index.ts:147 | Exclude the blueprint READ default (C6). |
| artifact shape | Receipt kept distinct from result, with an explicit evidenceClass | B/experimental/d1/src/contract.ts:149,168-170 | Shape vocabulary only. Nothing produces it. |
| stream ordering | Sequence predicate kept separate from the terminal PortResult | B/contracts/src/port.ts:58,74 | Already covered by AION event/1+snapshot/1. Port the negative cases into the existing tests. |

No new kernel IDs or AX IDs are introduced. PACK-03 is untouched.

## 5. Licence, tests, AION overlap

- **Licence:** `git ls-files` has no LICENSE/LICENCE/COPYING path anywhere in the repo, and no `package.json` under omega-baseline has a `"license"` field (rg found none). Record **LICENCE UNKNOWN**, consistent with LOCAL-SOURCE-REVIEW section 5. Method reuse needs no copying. Any verbatim copy needs a provenance decision first.
- **Test inventory (machine-derived, nothing run):** 122 tracked `*.test|spec.(ts|tsx|js|mjs)` files repo-wide: omega-baseline 104, elephant-greenfield-omega 10, External-temp 7, zcode-setup 1. Omega-baseline breakdown by first 3 path segments: experimental/d1 9, experimental/pm 2, experimental/ratchet 1, experimental/reflection-migrator 3, host/test 10, platform/test 2, sdk/test 8, testkit/test 3, packs (builder 1, domain-email 1, domain-import 1), surfaces (cli 2, daemon 3, mcp 1, web 2), plugins (discovery-healing 3, discovery-inference 2, discovery-mapping 2, discovery-observation 1, discovery-perception 1, discovery-verification 1, forge-author 2, provider-browser 3, provider-email-file 2, provider-llm 1, vivim-agent 4, vivim-chat 4, vivim-credentials 1, vivim-director 4, vivim-intent 3, vivim-kernel-lens 1, vivim-law 8, vivim-mind 2, vivim-nlcl 2, vivim-providers 1, vivim-run 3, vivim-vault 4). In those 104 files, 1082 lines match `^\s*(test|it)(\.\w+)?\(`. That is a line count, not a case count, and pass/fail is unknown. The full list came from `git ls-files omega-baseline` filtered by the test regex. It was not persisted, so re-derive it with the same command.
- **AION overlap (AION already has these; nothing here replaces them):** Bus grants, ledger and no-resend at `workspace/aion/ops/chrome-relay/extension/src/bus/` (`grants.js`, `ledger.js`, `validate.js`, `registry.js`, `grammar.js`, `contracts.js`, `bus.js`); event/1 + snapshot/1 with cursor and coverage in `workspace/aion/ops/chrome-relay/extension/src/lib/conversation-contract.js` (23 lines match `cursor|coverage`); PACK-01/02. VOMEGA's law/consent/tokens (`vivim-law`), port streaming and vault journal overlap those areas, so use them only as cross-checks and negative-case sources.

## 6. Top findings

1. **The gate blocker is resolved for reading.** `_gate.ts`, `_helpers.ts` and D1 `src/index.ts` exist, are tracked, and have hashes in section 3. Running the gates also needs ratchet `gate.ts` + `ratchet.lock.json`, and their default mode masks red bodies as `test.failing`.
2. **The local checkout is 3 commits ahead of the pin, with no omega-baseline change.** All 31 captures are content-valid. The 4 Markdown hash mismatches are CRLF only (C8).
3. **Two rejected VO-GH hazards also live in VOMEGA byte for byte.** These are the blueprint missing-risk→READ default and the registry unknown-class→SIMULATOR default (C6/C7). They are the same lineage as port.ts/surface.ts (C1), and must not be counted as independent evidence.
4. **24 of the 40 commands have something locatable (9 methods + 15 references), but zero have a provider-webapp path.** Send is an email capture replay plus a throwing executor. 16 commands are not located under bounded patterns.
5. **Two parser issues need precise citations.** The carrier mismatch is in `frames.ts:154-165`, characterized at `compile.ts:20-26`. The false-`ok` heuristic is at `interpret.ts:127-139,200` (C3). The reusable law is `validate.ts:35,60-65`.

## 7. Follow-ups (bounded and unread)

- Count the `baseline: "fail"` cases in `plugins/vivim-nlcl/test/fixtures/release-use-corpus.json` (machine count) to size the expected-failure set.
- Map `ratchet.lock.json` (151 lines matching `D1-0nn`) against the 9 gate files without running them.
- Decide in the crosswalk whether VOMEGA copies of VO-GH-0007/0031 get duplicate-pointer notes. This pass adds no IDs.
