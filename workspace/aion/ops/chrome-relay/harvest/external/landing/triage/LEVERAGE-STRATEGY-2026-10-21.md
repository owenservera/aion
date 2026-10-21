# LEVERAGE STRATEGY - 2026-10-21

Planning memo. Evidence tier: SOURCE_INSPECTED / TEST_READ only. No code run, no hash recomputed, no git write. Hashes and line refs are carried from the cited sources. Inputs: three STEP2 sets (commit 5a26eb6, per the task brief; not re-verified here), FIRST-PASS-DEV-HANDOFF, REPO-ROLES.csv, integration-manager DELIVERABLES + PACK-04..07 READMEs, capability-universe.csv (lines 1-93 of ~106 read), EXCHANGE.md and EXCHANGE.jsonl (21 AX records; AX-0004, 0016-0018 line-truncated in the read). Scores in section 3 are editorial judgments, not machine output. No new AX ID, store, registry, enum or schema is proposed. PACK-03 stays reserved for send correlation.

## 1. Machine-derived counts

Method: the three JSONs were tallied by reading all 40 rows each, then reconciled to each source's own summary (all three match). Key = the `command` column of `aion_command_matrix.csv` (40 distinct values; there is no `command_id` column).

### 1.1 Per-repo totals

| Repo | Pin to local HEAD | Vocabulary | Counts | Located | Proven provider-webapp path |
|---|---|---|---|---|---|
| VOMEGA (V) | 12c8532 to dded272 (+3 commits; `omega-baseline` diff empty; 23 dirty, none in baseline) | method_reuse / reference_only / reject / not_located | MR 9, RO 15, RJ 0, NL 16 | 24 | 0 (send = email fixture + throwing executor) |
| Vivim-omega (O) | P 79ee558 tracked-clean (B = BCP-dev 4c14cf8 for CDP only) | MATCH / PARTIAL / UNKNOWN | PARTIAL 17, UNKNOWN 23, MATCH 0 | 17 partial | 0 (B CDP path defective, no same-conversation effect proof) |
| vivim-final (F) | 8a798f9 (ancestor) to 9a988ed; 434 dirty entries | method_reuse / reference_only / reject / not_located | MR 10, RO 22, RJ 1, NL 7 | 33 | 0 (5 provider-adapter paths, none proven live, endpoints may be stale) |

Legend: MR method_reuse, RO reference_only, RJ reject, NL not_located; P PARTIAL, U UNKNOWN. `†` = the row's own note downgrades it to a cross-check or weak method (my reading of the note; not a JSON field). The O column is a different scale; PARTIAL there mostly means "technique-only".

### 1.2 Cross-tab, 40 commands x 3 repos

| command | V | O | F | any MR |
|---|---|---|---|---|
| send | MR (pre-dispatch law only) | P | RJ | V |
| observe | MR | P | MR† | V+F |
| reply.read | RO | P | RO | - |
| stream | MR | P | MR | V+F |
| history.read | MR | P | MR† | V+F |
| session.bind | RO | P | NL | - |
| recover | RO | P | MR | F |
| sessions.list | NL | U | RO | - |
| model.list | RO | U | RO | - |
| model.select | MR (synthetic D1) | U | RO | V |
| file.attach | RO | U | RO | - |
| chat.create | RO | P | RO | - |
| chat.open | RO | U | RO | - |
| chat.rename | NL | U | RO | - |
| generation.stop | NL | U | RO | - |
| thinking.level.set | NL | U | RO | - |
| steer | NL | U | NL | - |
| message.edit | NL | U | RO | - |
| response.regenerate | NL | U | RO | - |
| chat.search | RO | U | MR† (stale endpoints) | F |
| chat.archive | NL | U | RO | - |
| chat.delete | NL | U | RO | - |
| chat.share | NL | U | NL | - |
| branch.create | NL | U | NL | - |
| message.copy | NL | U | RO | - |
| tool.toggle | NL | U | RO | - |
| project.select | NL | U | RO | - |
| chat.export | MR (vault roundtrip) | U | RO | V |
| mode.select | NL | U | RO | - |
| agent.delegate | RO | P | NL | - |
| agent.status | RO | P | RO | - |
| cancel | RO | P | MR† (fetch timeouts only) | F |
| context.inject | NL | U | NL | - |
| discover | MR | P | MR | V+F |
| grant.manage | RO | P | MR† | F |
| health | MR | P | MR | V+F |
| receipt.read | MR (shape, nothing produces it) | P | NL | V |
| result.export | RO | P | MR | F |
| tool.call | RO | P | RO | - |
| ui.panel | RO | U | RO | - |

### 1.3 Derived sets

| Set | n | Members |
|---|---|---|
| Any own repo gives MR (V or F) | **14** | send, observe, stream, history.read, recover, model.select, chat.search, chat.export, cancel, discover, grant.manage, health, receipt.read, result.export |
| MR in both V and F (all three repos have something) | 5 | observe, stream, history.read, discover, health |
| MR from V only | 4 | send, model.select, chat.export, receipt.read |
| MR from F only | 5 | recover, chat.search, cancel, grant.manage, result.export |
| O PARTIAL but no V/F MR | 6 | reply.read, session.bind, chat.create, agent.delegate, agent.status, tool.call |
| Of the 14, F label carries a `†` downgrade | 4 | observe, history.read, grant.manage, cancel (+ chat.search stale) |
| No own-repo source in any of the 3 | 4 | steer, chat.share, branch.create, context.inject |
| V NL, O U, F RO only (vocabulary / declaration at most) | 12 | sessions.list, chat.rename, generation.stop, thinking.level.set, message.edit, response.regenerate, chat.archive, chat.delete, message.copy, tool.toggle, project.select, mode.select |

Reading: MR means a method or test recipe inside existing AION contracts. It is never a provider capability. The 11 REGISTRY commands (not in the 29 CORE ops) hold 6 of the 14 MR rows (cancel, discover, grant.manage, health, receipt.read, result.export), so the own repos feed the commands that PACK-05 does not cover (see 2.1 row 4).

## 2. Own-repo findings that change the plan

### 2.1 Corrections (C-items) with effect on PACK-04..07 / handoff

| # | Source | Finding | Plan effect |
|---|---|---|---|
| 1 | V C1 | port.ts (8a7b7980...) and surface.ts (fc690a72...) equal VO-GH-0004/0005 byte for byte | Count `stream` / exactly-one-final lineage once; not corroboration |
| 2 | V C6/C7, O C6 | blueprint.ts (dbff57f5) and registry.ts (80f2ba99) bytes exist in VOMEGA and in Omega P | Duplicate pointers only; reject stands; no new ID |
| 3 | V s3 | D1 gate blockers located: `_gate.ts`, `_helpers.ts`, `d1/src/index.ts`; gates also need ratchet `gate.ts` + `ratchet.lock.json` | Handoff rank 11 "10 transfer tests adoptable now" is not supported (see 5.2) |
| 4 | O s2, CORE vs REGISTRY | PACK-05 covers 29 core ops; 11 REGISTRY commands (effect_class TO_CLASSIFY) have no facet row | Optional: AION-owned default per op, or explicit "no facet"; TO_CLASSIFY must never be read as READ (R3) |
| 5 | O C4 | redact -> hash redacted bytes -> reference is VO-GH-0016 + 0008 jointly, not 0008 alone | Re-attribute K1; method goes into PACK-08 scenarios, not a code pack |
| 6 | O C1/C2 | VO-GH-0016 is located whole (299 lines); 0038 is an excerpt of the same blob (92a3724a); 0038 labels 195-300 are off (bars start 217, fence 222-227) | Metadata fix in index; no new capture |
| 7 | O C7 | `law-stub` allow-all is live in 5 compositions (demo, kernel, notes, run, vault) | Any "gate" claim in harvest docs must name its composition |
| 8 | O new | send bar 4 falls back to `PARSER_VERSION` while attach refuses a missing manifest parser (index.ts:255 vs :150-153) | New negative: attach and act paths must demand identical metadata (R2) |
| 9 | O s4 K12 | Donor falsifiers run only as root (`callAsRoot`, browser-falsifier.test.ts:56; mcp.ts:154; cli.ts) | PACK-08 and Dev tests must also run as non-root / ungranted principal |
| 10 | V C3 | Two separate defects: carrier mismatch `frames.ts:154-165` (characterized `compile.ts:20-26`) and false-ok `interpret.ts:127-139,200` | Cite separately; both are R6-gated reference only |
| 11 | V C2/C4/C5 | D1 executor is a throwing stub with SIMULATED-typed contract; compile.ts is prompt.send-specific; CLI is root-call protocol | Confirms DEFER (R6); keep CLI ergonomics only |
| 12 | V C10 | `test.failing(` is one static call site run per corpus case; expected-failure count is data-driven and uncomputed | Do not quote an expected-failure number |
| 13 | F C1 | VF-0018 is now a 6-line shim; canonical `src/intel/nlcl/types.ts` (d5aa8d0c..., 232 lines) | Re-anchor VF-0018; content not diffed |
| 14 | F C3 | Second slug list `seeds/taxonomy/shared/raw.json` diverges from `capability-taxonomy.ts` (`delete_chat` vs `delete_message`) | Do not merge by name; vocabulary reference only |
| 15 | F C4/C5 | `recovery-orchestrator.ts` (class-based auto retry on SlaveCrashed) and `allow_always` (default-caps.ts:892) were not captured before | Negative references only; effect on in-flight sends unverified |
| 16 | O s1 | 7 of 12 flagged paths have drifting variants across 12 snapshots; only P, baseline-d423-d424 and lab match all 25 captures | Folder names do not prove revision identity; pin by hash |
| 17 | all three | Name collisions (chat.open@1 creates a vault row; intent.cancel is compensation only; bootWithRecovery is host boot; setMode is a tool approval mode; delegate is a supervisor; toggle_extended_thinking is boolean; read-receipt is seen-state; RATCHET_MODE is a test mode) | Keep out of the crosswalk |

### 2.2 Uncaptured files (not in any first-pass index; hashes are working-tree, see 2.3)

| Repo | Path | Lines | sha256 (first 12) | Why it matters |
|---|---|---|---|---|
| V | omega-baseline/experimental/d1/test/gates/_gate.ts | 6 | 2974b09d26a9 | gate dependency |
| V | .../d1/test/gates/_helpers.ts | 42 | 31d86c61abcd | gate dependency |
| V | .../d1/src/index.ts | 17 | 8603989cfe1b | barrel for helpers |
| V | .../experimental/ratchet/src/gate.ts | - | 9d2502429551 | `test.failing` default (:9,28,39) |
| V | .../ratchet/specs/d1/ratchet.lock.json | - | d08c3afb07058 | 151 `D1-0nn` lines |
| F | seeds/taxonomy/shared/raw.json | 1379 | 7d137c79dd22 | second slug list |
| F | src/engines/capability-bootstrap/default-caps.ts | 1348 | 374c194fb299 | send handlers :79-108, :722-787 unread for at-most-one |
| F | src/engines/reliability/recovery-orchestrator.ts | 163 | 7342ce109491 | failure-class retry |
| F | src/engines/streaming-response-analyzer.ts | 450 | 8fe6fe63d51c | StreamTransport `unknown` |
| F | src/resilience/health-monitor.ts | 278 | 9b0b29ef5cd9 | Target/Result/Event split |
| F | src/engines/consent-engine.ts | 136 | 2cb9f897c5ba | grant ceiling cross-check |
| F | src/engines/audit-trail.ts | - | eed3cfa2289a | shallow redaction (contrast) |
| F | src/intel/nlcl/types.ts | 232 | d5aa8d0cf3fb | VF-0018 re-anchor |
| F | 14 more (provider-discovery, memory-export, tool-orchestrator-impl, ComposerShell.tsx, ...) | - | see vivim-final STEP2 s2 | declaration / UI / donor-internal |
| O | Zai/V15 tree-omega variants (browser f1f2218d, chat dac4ba55, mcp d9c7833d, verification 1001e969), intent 1792 B, D-380 3653 B | - | unread | variant drift, no ordering claimed |

Also unread: F `src/engines/context-assembly.ts` (the only candidate for `context.inject`).

### 2.3 Hash / CRLF custody caveat

- AION working copies are CRLF (`core.autocrlf=true`; `git ls-files --eol` shows `i/lf w/crlf`). O C3: none of the 26 captured items matches its recorded `copy_sha256` in the working tree; all match after CRLF to LF normalisation. V C8: 4 Markdown captures (VM-CLI-0015/0029/0030/0031) differ raw but `git hash-object` equals `source_git_blob_sha`.
- Verifier rule: hash `git show :<path>` or LF-normalised bytes. A raw working-tree hash reports false drift. `crosswalk_copy_sha256_verified: null` in the synthesis ledger is consistent with this.
- Donor-side hashes: V and O are tied to a clean tree or pinned commit. F hashes are working-tree bytes of a tree with 434 dirty entries and cannot be tied to a commit.
- Nits: V C1 line ranges say 1-95 / 1-44, local files have 94 / 43 lines; VM-CLI-0023 card says 14 lines, local has 13.

### 2.4 Rejected fail-open defaults (single list)

| ID | Rejected default | Anchor | Origin | AION counter-rule for a negative fixture | In PACK-04..07? |
|---|---|---|---|---|---|
| R1 | allow-all `law.check@1`, `granted:true` consent | law-stub/src/index.ts:11,13 | O | no standing allow; grant is explicit and scoped | no |
| R2 | send bar falls back to compiled `PARSER_VERSION` | provider-browser index.ts:255 | O | same metadata required at attach and act | no |
| R3 | undeclared risk bound or shown as READ | mcp.ts:65; blueprint.ts:9,52,61,68 | O, V | undeclared / TO_CLASSIFY refuses | no (PACK-05 forbids blanks; add TO_CLASSIFY check) |
| R4 | unknown providerClass coerced to SIMULATOR | registry.ts:47-49 (unknown status to null is the fail-closed half) | O, V | unknown class refuses | no |
| R5 | confidence-ranked effect target (`pickBest`) | solve.ts:61-62 | O | two valid Send targets block | no |
| R6-8 | baseline-lookup failure swallowed; shim wraps all as ok:true and frees concurrency on timeout; optional principal fence on chat history | LOCAL-SOURCE-REVIEW :98, R2.3, :107 (carried, not re-verified) | O | each failure surfaces; principal fence mandatory | no |
| R9 | heuristic `ok` from confidence >= 0.7, default status ok | nlcl-pure interpret.ts:127-139,200 | V | confidence never grants | no |
| R10 | op with no frame gets generic one-slot frame | frames.ts:154-165 | V | missing frame refuses | no |
| R11 | failed/skipped step counts as "done" | vivim-intent contracts/src/intent.ts:70-72 | O | terminal is not success | no |
| R12-13 | staged child survives failed delegation write; intent.cancel / run quarantine relabelled as Stop | vivim-agent; vivim-intent index.ts:263-272; vivim-run (LOCAL 9.5) | V | cancel evidence is not provider Stop | no |
| R14 | default `test.failing` hides red gate bodies | ratchet/src/gate.ts:9,28,39 | V | green run is not a passing body | no |
| R15-16 | `allow_always` standing allow; VF-0026 fail-open consent | default-caps.ts:892; VF-0026 | F | no import of standing allow | no |
| R17 | class-based auto-retry; resend after reconnect | recovery-orchestrator.ts:13-20; send-resilience (VF-0016/0024) | F | unknown effect is never replayed | PACK-06 says refusal is not retry |
| R18 | tests run only as root principal | browser-falsifier.test.ts:56 | O | repeat as non-root | n/a |
| X1-8 | external (already stated in handoff): model/effort warn-and-continue (Bridge requestPreparation.js:131-169); attach `done` after chip warning; Web2API `retry_on_rate_limit` around whole send; cdpilot batch resend; Cereon `sendWithInjectFallback`; ChatHub 403 retry; ChatALL queue shift before bulkUpdate; Cereon ring buffer silent eviction | handoff round-2 | ext | see handoff | PACK-05 and PACK-07 explicit; PACK-01 fixed tail window |

## 3. Ranked reuse bundles

Leverage = Problem eliminated (P, 1-5) x Breadth (B, 1-5) / Adaptation cost (C, 1-5). Scores are editorial. Classes: NOW, NEXT, DEFER, REF-ONLY (REFERENCE-ONLY). "Staged" = in `integration-manager/packs/`.

| Rank | Bundle (external donor + own-repo merge) | P | B | C | L | Class | Staged |
|---|---|---|---|---|---|---|---|
| 1 | MAC serializer + `longerResponseText` (PACK-04) | 4 | 5 | 1 | 20.0 | NOW (Dev integrates) | yes, 13/13 offline |
| 2 | Bridge facet table, 29 defs, 15 of 29 core ops mapped, 14 NOT_LOCATED (PACK-05) | 4 | 4 | 1 | 16.0 | NOW (Dev integrates) | yes, generator validated |
| 3 | **PACK-08 negative-fixture corpus**: handoff test obligations + Web2API/MAC/Bridge recipes + R1-R18 + Omega K2/K5/K6/K7/K8/K9/K11/K12 + V live-only-key and exactly-one-final negatives + Bridge fault-matrix method | 5 | 5 | 2 | 12.5 | NOW (proposed raise from handoff NEXT; owner decision D1) | no |
| 4 | MAC readiness tri-state + documentId binding (PACK-06) | 3 | 4 | 1 | 12.0 | NEXT (pending D2) | yes, 26/26 offline |
| 5 | Custody rule (LF-normalised / `git show :path` verify, re-anchors, duplicate pointers) | 2 | 5 | 1 | 10.0 | NOW (doc-only, batch 3) | no |
| 6 | Outcome / reconcile vocabulary: Bridge `matched_complete`... + Omega K11 (UNKNOWN / AMBIGUOUS / REFUSED) + F StreamTransport `unknown` | 3 | 3 | 1 | 9.0 | NEXT, advisory data only, no `event/1` enum change | no |
| 7 | MAC `autonomousRecovery` 3-state + sendConfirmation helpers | 5 | 3 | 2 | 7.5 | DEFER, gated on I1 receipt; belongs to reserved PACK-03 | no |
| 8 | Bridge transfer integrity + verify-before-apply (PACK-07) | 3 | 2 | 1 | 6.0 | NEXT (pending D5); upload stays AION_CUSTOM_BUILD | yes, 12/12 offline |
| 9 | Omega K1 redact -> hash redacted -> reference (+ cdpilot receipt redaction spec) | 3 | 3 | 2 | 4.5 | NEXT as PACK-08 scenarios; UTF-16 cap caveat (LOCAL 9.3); F audit-trail is a contrast, not a method | no |
| 10 | Bridge per-op DOM effect semantics (retry / reconcile / typed failure per op) | 4 | 3 | 3 | 4.0 | NEXT, pattern only, no click/Enter orchestration | partly in PACK-05 proposals |
| 11 | VOMEGA D1 gate tests re-expressed as AION negatives | 3 | 3 | 4 | 2.25 | DEFER until 5.2 blockers closed; licence UNKNOWN blocks verbatim copy | no |
| 12 | Typed result protocol (producer correlation, reasons[]) | 3 | 2 | 3 | 2.0 | DEFER (verify-half already in PACK-07) | no |
| 13 | Health tier: Web2API downgrade-only breakers + F Target/Result/Event split | 2 | 2 | 2 | 2.0 | DEFER | no |
| 14 | Omega K10 scope attenuation, K4 parser pin triple, F failure-class bucketing | 2 | 2 | 2 | 2.0 | DEFER / REF-ONLY (agent.delegate, parser versioning not in plan) | no |
| 15 | VOMEGA READY-withholding law + compile split; model.select target-route consistency | 3 | 2 | 4 | 1.5 | DEFER (R6, AX-0005 P2) | no |
| 16 | Cereon inspector / CDP manager, cdpilot frames, WebMCP | - | - | - | - | REF-ONLY (conflict C-K) | no |
| 17 | ChatHub, ChatALL, Council, Parallel-AI wrappers; F taxonomy slugs, UI-only rows, D1 projection, vault ops | - | - | - | - | REF-ONLY | no |

Complementary: 1 + 4 + 10 + 3 form the read-side layer; 6 and 9 feed the receipt / refusal vocabulary. Competing, both visible: DOM-observed completion (primary) vs backend-anchored (Web2API; optional evidence only). Own-repo method-reuse items with no ranked home beyond reference: model.select, chat.export, result.export (formatter split), receipt.read (receipt vs result shape with explicit evidenceClass).

## 4. Proposed next adaptation batches (max 5)

Existing exchange topics only; PACK-03 untouched; none changes `event/1` or `snapshot/1`.

| # | Batch | Scope | Files (existing locations) | Offline verification | Owner lane | Non-goals |
|---|---|---|---|---|---|---|
| 1 | PACK-08 negative-fixture recipes (topics `receive.identity`, `receive.recover`, `file.tools`) | AION-test-shaped scenarios from rank 3 and 9; table-driven; each refusal also asserted for a non-root / ungranted principal; R2 attach-vs-act parity; TO_CLASSIFY is not READ; 150 retained / limit 100; matching-epoch ahead cursor; attach `done` never after a failed probe; unconfirmed model/effort aborts | `packs/PACK-08/README.md` + `*.test.mjs` in the PACK-04/06/07 style, pinned provenance, MIT notices kept | `node --test` in the pack folder (Node 24.11.1), fake objects only, no DOM/browser/network; no donor test run | Integration Manager stages; Development integrates | no runtime wiring; no VOMEGA verbatim copy; no new reason enum; no compiler; no send-correlation helpers |
| 2 | Integrate staged PACK-04 + PACK-05 at Dev seams (`receive.identity` AX-0007; `chat.lifecycle` AX-0013) | serializer at the turn-text read boundary with `longerResponseText` at finalization; facet table as input to table-driven tests and a completeness check | Dev-owned: `extension/src/providers/chatgpt/response-serializer.js`; `extension/src/lib/command-facets.js` or existing op metadata (neither exists on main per the READMEs) | pack fixtures re-run in the AION extension suite; facet completeness test (no blank retry / reconcile / reload) | Development | no new field; no Bus / ledger / grant code; no second command registry; no live Send |
| 3 | Custody and metadata hygiene (`external-nine.capability-ownership` AX-0004) | apply 2.1 rows 2, 5, 6, 13, 14, 16 and 2.3: index status/metadata fixes (VO-GH-0016..0027, C1-C3), VF-0018 re-anchor, duplicate-pointer notes for VOMEGA copies, refresh `own_capture_status` of the 40 existing universe rows (still `not_assessed_this_pass`), record the LF-normalised verify rule | existing files only: the three `landing/sources/*/index.jsonl`, `capability-universe.csv`, source READMEs | read-only compare: `git show :<path>` or LF-normalised hash vs recorded `copy_sha256` for the 26 O items + 27 F rows; row count unchanged | Harvest (own-repo lane) | no recapture of bytes; no new IDs; no column or schema change; no status promotion |
| 4 | VOMEGA gate dependency map (`semantic.command.compile` AX-0003 / AX-0005) | map the 151 `D1-0nn` lock lines to the 9 gate files without running them; count `baseline:"fail"` cases in `release-use-corpus.json`; decide which negatives can be re-expressed | read-only; output is a table inside the existing VOMEGA STEP2 memo or RETENTION-ASSESSMENT | none needed; count is by file read | Harvest | no gate run; no copy of `_gate.ts` / ratchet into AION; no NLCL compiler work |
| 5 | Close bounded unreads (`external-nine.capability-ownership`; `send.correlation` AX-0018 read-only) | F: read `context-assembly.ts` (context.inject), send handlers `default-caps.ts:79-108,722-787` for at-most-one, diff `nlcl/types.ts` vs VF-0018; O: read the unread Zai/V15 variants; confirms or removes the NL rows | read-only; findings added to the existing STEP2 memos | none | Harvest | no promotion of any NL row to a capability; PACK-03 not started |

Order: 1 and 2 in parallel (different writers); 3 any time (doc-only); 4 and 5 are cheap closers. Batches 1-2 are where engineering is eliminated; 3-5 reduce false confidence.

## 5. Open owner decisions and VOMEGA gate blockers

### 5.1 Decisions

| ID | Decision | Default if unanswered | Source |
|---|---|---|---|
| D1 | Raise PACK-08 from NEXT (handoff rank 7) to NOW | keep NEXT; batch 1 waits | handoff vs section 3 |
| D2 | Chrome `documentId` as strengthening of `page_epoch`, or AION epoch + revision only | PACK-06 stays staged, unwired | handoff Q3; PACK-06 Q2 |
| D3 | `provisional_page_position` as `event/1` identity, or a coverage flag | no change | handoff Q2 |
| D4 | `chat.delete` precondition: `expectedSessionId` + `expectedUrl` + observed absence, AION typed confirmation, or both | `never` retry, no build | handoff Q4; PACK-05 Q2 |
| D5 | `file.attach` transfer envelope now, or defer under AION_CUSTOM_BUILD; refuse a URL attachment with no SHA-256 | defer; PACK-07 stays staged | handoff Q5; PACK-07 Q2 |
| D6 | Does the owner's ChatGPT surface expose an enabled steer control (decides if P0 `steer` is buildable) | treat as not buildable | handoff Q1 |
| D7 | Licence policy: VOMEGA and Vivim-omega are LICENCE UNKNOWN (O R2.1: owner's own code, provenance only); vivim-final is MIT | method reuse only, no verbatim copy of V/O code or tests | V s5; O s5; F s4 |
| D8 | PACK-05 policy questions: retry bound to Bus grant or descriptive; `recover` reconcile on request projection or effect evidence; `reply.read` retry `always` | descriptive; keep proposals | PACK-05 Q1, Q3, Q4 |
| D9 | Re-pin: VOMEGA HEAD +3 (baseline unchanged) and vivim-final dirty tree (434) | keep first-pass pins; no re-pin | V s0; F s0 |
| D10 | Whether Dev updates AX-0006 / 0007 / 0008 wording (they still say "source not yet implemented") | leave; Harvest cannot change Dev status | conflict C-G |

### 5.2 VOMEGA gate-test blockers (read-only facts; nothing was run)

| Blocker | Detail |
|---|---|
| Missing from first pass (now located) | `_gate.ts` (6 lines), `_helpers.ts` (42), `d1/src/index.ts` (17); all tracked, clean |
| Ratchet dependency | `_gate.ts` imports `experimental/ratchet/src/gate.ts` and reads `ratchet/specs/d1/ratchet.lock.json`; both are also needed |
| `test.failing` caveat | open gates run as `test.failing` unless `RATCHET_MODE=probe` (gate.ts:9,28,39); green is not a passing body; probe mode would show red bodies |
| Transitive set | `_helpers.ts` needs `worlds/W0-W5.json`, `declarations/*.json` and the whole `src/` barrel (17 export lines) |
| Coverage | 9 `*.gate.test.ts` + `_release.ts`; first pass captured only `a-truth` (VM-CLI-0026) and `c-command` (VM-CLI-0025) |
| Licence | none found anywhere in the repo: verbatim copy needs D7 first |
| Unsupported claim | handoff rank 11 says "10 transfer tests adoptable now"; no STEP2 set contains that count or those tests |

Verdict: DEFER (rank 11). Re-express as AION-owned negatives inside batch 1 instead of copying.

### 5.3 Conflicts between sources

| ID | Conflict | Resolution used here |
|---|---|---|
| C-A | O uses MATCH / PARTIAL / UNKNOWN; V and F use the 4-class scale | tables show raw values; no merged "score" |
| C-B | `send`: V MR (pre-dispatch law), F RJ, O PARTIAL | reuse only the READY-withholding law; every executor stays rejected |
| C-C | `recover`: V RO (host boot, "never read as resend"), F MR (failure-class bucketing) | bucketing shape only; never automatic resend |
| C-D | F labels MR for observe, history.read, grant.manage, cancel, but its notes say cross-check / timeouts only | marked `†`; counted in the 14 but ranked REF-ONLY |
| C-E | F `chat.search` MR over a ChatGPT adapter with unverified endpoints vs handoff "private backend NOT recommended" | normalisation idea only |
| C-F | K numbering: O K1-K12 are memo-local slots (rg found 0 hits in AION); V and F say "K1-K12 by name"; F `discover` cites "kernel K7" but O K7 is gap taxonomy | cite kernels by name, not number, across repos |
| C-G | Handoff Correction 1 (AION already has contract, journal, terminal evidence; PACK-01/02 integrated at e006692) vs REPO-ROLES `chatgpt-bridge` limitation "No validated AION event/1" and AX-0007 / 0008 (`seam ... not yet implemented`, OPEN / NEEDS_EVIDENCE) | Correction 1 wins; REPO-ROLES and the AX wording are stale |
| C-H | DELIVERABLES l.55 "PACK-05..08 remain proposals" vs l.57-61 PACK-05/06/07 staged | l.55 is stale; PACK-08 alone is unstaged. Also l.15 "No supplier tests" vs packs that ran their own fixtures: consistent only if it means donor tests |
| C-I | PACK-04 README says destinations are "not present on main"; handoff says the branch `integration/i1-watch-20261020` (HEAD 51eeac81) has the files | treat as branch-candidate vs main-integrated; not re-checked |
| C-J | capability-universe rows 2-41 say `not_assessed_this_pass`; the three STEP2 sets assess all 40 | refresh in batch 3 |
| C-K | Cereon: REPO-ROLES REFERENCE_ONLY (P2), handoff DEFER ("do not record 0 value"), EXCHANGE AX-0019 / 0020 "HIGH leapfrog" | rank as REF-ONLY; the owner may re-rank (no separate decision ID) |
| C-L | Test counts differ and are not comparable: V 122 files (omega-baseline 104; 1082 call-site lines), O 133 files / 1323 lines (P), F 520 files / 4285 lines | none executed; do not cite as pass counts |

## 6. Stopping criteria (harvest lane goes dormant)

Dormant means no new OFFER/GAP records, no polling, no approval ceremony. Reopen only on a trigger below.

1. Coverage is already met for the own repos: all 40 commands carry a disposition in each of the three sets, with bounded NL receipts. Remaining: batch 5 reads close the 3 F follow-ups and O unread variants, and batch 3 applies the C-items.
2. Every core op has a donor semantic row or an explicit `NOT_LOCATED` / `AION_CUSTOM_BUILD` (done in the handoff), and a facet row (done, PACK-05, 29 ops).
3. PACK-08 is staged (or D1 is answered "no") and PACK-04/05 have a Development integrate-or-defer disposition recorded on their existing AX links.
4. Two consecutive rounds yield no new AION-eliminating primitive (handoff rule). Round 1 (2026-10-20) and round 2 (2026-10-21) both produced primitives (PACK-01..07), so the external lane is not yet quiet; the own-repo lane is nearly so.
5. Reopen triggers: a live I1 receipt (starts PACK-03 correlation work and rank 7), a Development NEED on an existing topic, a changed upstream pin or local HEAD, or an owner answer to D2-D8.

Certification boundary: nothing here certifies any donor's completeness, the 40-command matrix, or AION acceptance.
