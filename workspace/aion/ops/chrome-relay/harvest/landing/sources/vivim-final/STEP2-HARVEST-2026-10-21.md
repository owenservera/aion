# vivim-final — Step 2 harvest (2026-10-21)

Scope: one additional step against the local full checkout `C:\0-BlackBoxProject-0\vivim-final`. All access was read-only: file reads, `rg`, `Get-FileHash`, and read-only `git rev-parse` / `git status` / `git merge-base`. No code was run, nothing was installed, no browser or CDP was used, and there were no git writes. This pass builds on the first-pass rows VF-0001 to VF-0027 (`index.jsonl`, `items/`).

Companion: `STEP2-DISPOSITIONS-2026-10-21.json` has exactly 40 rows. The script check found rows=40, unique=40, and no command missing from `aion_command_matrix.csv`.

## 0. Baseline

| Fact | Value | How derived |
|---|---|---|
| Local HEAD | `9a988edf7d5179b28d6bf5b5dddc2b44e16f906d` (2026-09-11T00:40:06+02:00) | `git rev-parse HEAD`, `git log -1 --format=%cI` |
| First-pass pin `8a798f9…` is an ancestor of the local HEAD | yes (exit 0) | `git merge-base --is-ancestor` |
| Dirty entries | 434 | `git status --porcelain` line count |
| Tracked files | 3608 | `git ls-files` |
| Command matrix | 1000 rows = 25 surfaces × 40 commands | grouped on the `command` column. There is no `command_id` column; `command` is the key used here |

## 1. Exact-40 dispositions (summary)

Counts from the JSON: method_reuse 10, reference_only 22, reject 1, not_located 7.

- **not_located (bounded):** `agent.delegate`, `branch.create`, `chat.share`, `context.inject`, `receipt.read`, `session.bind`, `steer`. "Not located" means not found by the listed `rg` patterns over `src`, `seeds`, `frontend/src` and `shared` (test files excluded). It is not proof that the code is absent.
- **reject:** `send`. Resend-after-reconnect (VF-0016/0024) is still rejected. The send handlers at `default-caps.ts:79` and `:722` were located but not read for at-most-one behaviour.
- **method_reuse:** `cancel`, `chat.search`, `discover`, `grant.manage`, `health`, `history.read`, `observe`, `recover`, `result.export`, `stream`.
- Most other rows are **declaration-only** taxonomy slugs or **donor-internal** operations on vivim's own store. They are not provider-webapp drivers, and the scope qualifier in every JSON row says which.

## 2. Corrections to the first pass

| # | VF ref | Correction | Evidence |
|---|---|---|---|
| C1 | VF-0018 | `src/engines/nlcl/types.ts` is now a 6-line **legacy shim** that re-exports `src/intel/nlcl/types.ts`. Its local sha256 does **not** match `index.jsonl`. The canonical file is `src/intel/nlcl/types.ts`: sha256 `d5aa8d0cf3fb108038edc6eafdb881451ceaf9eba42ccbc2696f66c7bbc08c98`, 232 lines. Re-anchor VF-0018 there; its content was not diffed against the excerpt in this pass. | file read; `Get-FileHash` |
| C2 | VF-0001…0027 (except 0018) | The other 26 rows match: local working-tree sha256 equals `source_sha256`. The README statement "local checkout revision UNKNOWN" is now resolved (see §0). | scripted hash compare |
| C3 | VF-0005 | The first pass treats `capability-taxonomy.ts` as the shared taxonomy. A second, larger slug list exists at `seeds/taxonomy/shared/raw.json` (covering `send_message`, `read_response`, `stop_generation`, `copy_message`, `archive_conversation`, `export_conversation`, `rename_conversation` and more). The two lists differ, for example `delete_chat` versus `delete_message`, and they should not be merged by name. | `rg '"slug"'` |
| C4 | VF-0016/0024 | The rejection stands. The first pass did not record `src/engines/reliability/recovery-orchestrator.ts`, which retries by failure class (`maxRetries: Record<FailureClass, number>`) on `SlaveCrashed`. Its effect on in-flight sends is unverified. | file read lines 13–50 |
| C5 | VF-0026 | No change. Fail-open stays rejected. Separately, `default-caps.ts:892` lists `allow_always` as a permission decision; that standing allow should not be imported. | rg |

### Uncaptured files relevant to the 40 commands

| Path | sha256 | Lines | Commands |
|---|---|---|---|
| seeds/taxonomy/shared/raw.json | 7d137c79dd221a2585667de41832926219445c8e70b3e13c2cab31cbd620ede0 | 1379 | many (slugs) |
| src/engines/capability-bootstrap/default-caps.ts | 374c194fb2999dd757f7e1445e647b7265512459ab2034420a35d5a70cdaec53 | 1348 | send, chat.create/delete, sessions.list, health, model.list, grant.manage |
| src/engines/command-parity-capabilities.ts | 6989d8a1209d3b3678e565e4d0988d12cf91f9469fdff5d413ec334c3e628437 | 315 | chat.open, discover |
| src/engines/provider-discovery.ts | cf57c1b70d76266c8171dc38e356bc75f66897353cfe0c34ab2e1744f4ec88ff | 812 | discover |
| src/engines/streaming-response-analyzer.ts | 8fe6fe63d51c7a3ab5e8fd9685b3655d97686eed4b1415c2c29d44021df680c7 | 450 | stream |
| src/engines/reliability/recovery-orchestrator.ts | 7342ce1094913dae20e80952d6aa525b9b7b8ba0c7fba8a8102ed8ef04983706 | 163 | recover |
| src/resilience/health-monitor.ts | 9b0b29ef5cd969eaf215b00b6d4d7dc4793c19fdef46eef1f895f883adbf423b | 278 | health |
| src/engines/consent-engine.ts | 2cb9f897c5ba3af28018b4a4d6a1ea69c7036143b5f88e0e64502a97e01bb83e | 136 | grant.manage |
| src/engines/audit-trail.ts | eed3cfa2289a8e8bbaab6375a20fe72d2b00bd9e6644dc5c392376c3db70fc96 | — | receipt.read (K6 contrast) |
| src/engines/memory-export.ts | 8baf2f1cd9b79834c0339385045e5282a32359d13744649311104c66c8da09fd | 142 | result.export |
| src/ai/tools/tool-orchestrator-impl.ts | f4001dd70eac3c4361bf97903f894d6d8d947b2a23ecd3f9313856132a4332ee | 228 | tool.call, mode.select (name collision) |
| src/ai/gateway/vivim-ai-gateway.ts | 5e60133f544c9239ea85b555805553c3f040514e5fa244798c3e39fb83f63c85 | 320 | model.list |
| src/storage/impl/conversation-store-impl.ts | 9deead6e94810ebe4d820867eb5cf0a95515237adaf140bfdfa31b09b6f50cc5 | 550 | chat.delete/archive, sessions.list |
| src/storage/contracts/conversation-store.ts | 956571681d442119a0b87679bba150295f0ccc5c4c7b0cda7cfb159de26fe365 | 316 | same |
| src/server/conversation-router.ts | 684ba06bab310976fd06a066fa4ebaaf022734b928cc1598a57639f97858bf11 | 486 | chat.* (donor-internal) |
| src/engines/conversation-organizer.ts | 97114d953d701b378ab3e9bcd64c2497113922e8a809ee2808a161bd9b85c299 | 115 | project.select |
| src/engines/events/event-bus.ts | 5c054ac0a59e7fbad3af7b51a5d58b0c661a8b7c1f8a52e309c4fbbb27785052 | 140 | history.read (event history, donor-internal) |
| src/engines/agentic-loop.ts | 592a7de3849481327dd2597e6499afeee82d22b59f29ff907280b98c1003b26d | 223 | observe |
| frontend/src/components/chat/ComposerShell.tsx | 09a16aa188516499b4eab191cc611ca3c9dd12a8fdd85c7079fe069417f82a30 | 345 | generation.stop, model.select |
| frontend/src/components/chat/addons/StreamingStatusBar.tsx | e794eb83afa0c2f3c044e124a9b89c8d6efbc1abc65bedf36593d3d9a5f3096e | 53 | generation.stop |
| frontend/src/components/chat/addons/ModelSelectorPill.tsx | 49960fdc12b8a03aa541abb245cc43381511e9d97066d822c4760505ec86abdb | 76 | model.select |
| frontend/src/components/canvas/SessionStateProvider.tsx | 84ea713e40ac8e8d5c4f17367ce13d22bb90ebf0b0ecda6b15c55c7adc8aaeda | 324 | ui.panel |
| src/intel/runtime/ts-supervisor.ts | 7ea272d08959be2b8cdbd52fb486b183c897acf7f15f4368477aa511d621052d | 157 | agent.delegate (negative: not agent delegation) |
| src/intel/nlcl/types.ts | d5aa8d0cf3fb108038edc6eafdb881451ceaf9eba42ccbc2696f66c7bbc08c98 | 232 | VF-0018 re-anchor |

All hashes are of working-tree bytes. The tree is dirty, so these hashes cannot be tied to a commit.

## 3. Reusable kernels (method reuse only; no store, registry, enum or schema is proposed)

| Kernel | Donor method | Path:line | AION note |
|---|---|---|---|
| K-compiler | Two-layer slug → `cap:<domain>:<verb>` id | src/engines/capability-taxonomy.ts:26-27 | Naming method only. PACK-03 is unchanged. |
| K-READY law | Shape flags `'optional'` per surface; the existing record is VF-0026, which is fail-open and stays rejected | src/engines/capability-shape-registry.ts:77 | A declared capability is not readiness (VF-0001 hazard). |
| K-stale-result | Static manifest models/selectors are marked stale | seeds/providers/manifests.ts | Matches the existing hazard. Nothing new. |
| K-provenance | Retry attempts recorded `{failureClass, strategy, result, ts}` | recovery-orchestrator.ts:13-18 | Record shape only, not the retry policy. |
| K-outcome | Explicit `'unknown'` member in StreamTransport | streaming-response-analyzer.ts:10 | Supports the existing AION unknown-effect posture. |
| K-redact-then-hash | **Contrast only.** audit-trail redacts by top-level key name to `[REDACTED]` and does not hash | audit-trail.ts:59-64 | Shallow redaction. Do not adopt. AION redact-then-hash is stronger. |
| K-discovery projection | Session-based discovery producing a projection | provider-discovery.ts:19-25 | Projection only. Do not import DiscoveryStore. |
| K-artifact shape | One data object, two formatters (json/md) | memory-export.ts:35-45,101 | Formatter split. |
| K-health split | Target / Result / Event types kept separate | health-monitor.ts:36,50,66 | Types for vocabulary cross-check. |

K-numbering follows the K1–K12 vocabulary by name. No new kernel IDs or AX IDs are introduced.

## 4. Licence, tests, AION overlap

- **Licence:** `LICENSE` is MIT, "Copyright (c) 2026 Vivim". `package.json` has no `license` field. Method reuse is compatible; any verbatim copy would need the MIT notice.
- **Test inventory (machine-derived, no tests run):** 520 tracked `*.test|spec.(ts|tsx|js|mjs)` files: tests/ 472, frontend/ 36, src/ 8, docs/ 4. There are 4285 lines matching `^\s*(test|it)(\.only|\.skip|\.todo|\.each(...))?\(`. That is a line count, not a case count. Pass/fail is unknown.
- **AION overlap (AION already has these):** Bus grants, ledger and no-resend at `workspace/aion/ops/chrome-relay/extension/src/bus/`; event/1 + snapshot/1 with cursor and coverage at `workspace/aion/ops/chrome-relay/extension/src/lib/conversation-contract.js`; PACK-01/02. Path note: the brief's `extension/src/...` is relative to `workspace/aion/ops/chrome-relay/`, and there is no repo-root `extension/`. vivim adds no capability over these. Its consent-engine, opencode permission.respond and recovery-orchestrator overlap them and are weaker on at-most-one, so use them as cross-checks only.

## 5. Top findings

1. Local HEAD `9a988ed` descends from the first-pass pin `8a798f9`. 26 of 27 rows hash-match; VF-0018 drifted to a shim (C1).
2. Most of the 40 commands appear in vivim only as taxonomy slugs (`raw.json`, `capability-taxonomy.ts`) or as donor-internal store operations. There are provider-adapter paths for only 5 of the 40 (chat.search, history.read, sessions.list, discover, stream). None is proven live.
3. There is a second slug list, `seeds/taxonomy/shared/raw.json`, that the first pass did not record. Its names diverge from `capability-taxonomy.ts` (C3).
4. Name collisions to avoid in the crosswalk: `setMode` is a tool approval mode, not `mode.select`; `delegate` is a supervisor, not `agent.delegate`; `toggle_extended_thinking` is a boolean, not `thinking.level.set`; `read-receipt` means seen-state, not `receipt.read`.
5. New hazards: `allow_always` as a permission decision (default-caps.ts:892) and class-based auto-retry in recovery-orchestrator. Both are rejected for import, consistent with VF-0016/0024/0026.

## 6. Follow-ups (bounded and unread)

- Read `src/engines/context-assembly.ts` for `context.inject`.
- Read the send handlers at `default-caps.ts:79-108` and `:722-787` for at-most-one behaviour.
- Diff `src/intel/nlcl/types.ts` against the VF-0018 excerpt.
