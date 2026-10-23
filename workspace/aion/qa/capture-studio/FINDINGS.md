> **Post-fix update 2026-10-22:** Core commits [5993f882](https://github.com/owenservera/aion/commit/5993f882) and [57f38386](https://github.com/owenservera/aion/commit/57f38386) implemented delayed cross-chunk HTTP credential quarantine and WS-frame exclusion. QA [Sprint 02](SPRINT-02.md#5-post-source-reconciliation-during-active-team-builds) source-executed updated guard in V8: 6/6 synthetic split/whole credentials excluded, 1 benign stream preserved, 1 split WS excluded. **QA-S2-F1 downgraded from unmitigated source defect to source-mitigated / native & live acceptance pending.** [Issue #64](https://github.com/owenservera/aion/issues/64) remains open solely for higher-fidelity retest and any uncovered edge cases. Original pinned failing reproduction is preserved below; do not mistake it for latest code. UI Sprint 2 source closeout 62/62 V8; L5 TT1 specialist source/Node delivered, independent QA pending.

> **2026-10-22 SPRINT 2 — executed bounded source/V8 evidence:** [Sprint 02](SPRINT-02.md) at `02310fe` independently source-exercised the actual redactor and one-turn service with V8 shims. **QA-S2-F1 P0:** whole-buffer fake credentials masked (3/3), but equivalent synthetic JSON/Bearer/JWT sequences split across chunks remained unmasked (3/3). `network.mjs:_chunk` persists those per-chunk results immediately: pre-disk cross-chunk redaction guarantee is absent. [Core issue #64](https://github.com/owenservera/aion/issues/64) sent, not ACKed. **QA-S2-P1 positive:** uncertain simulated send allowed only one adapter submit; fresh keys refused after lost ACK and read-only reconciliation; same key returns original. **Native Node/browser not run**, [QA offline suite](tests/sprint02-capture-safety.test.mjs) committed for execution. Other source-only risks: failed-connect lease release on uncertain stop, owner-file damage reclaim. Independent acceptance remains pending; L4/L5 criterion counts unchanged.

> **2026-10-22 SPRINT 1 — current source inspection:** [Sprint 01 evidence](SPRINT-01.md) at product pin `5eefb2e` reports **QA-S1-F1**, a high-priority **source-confirmed family eligibility defect**: `campaign.mjs:335–355` derives/consolidates and persists a family before checking the calibration reply, while `families/build.mjs:54–80,180–205` accepts SHAPES-only derived sessions with no persisted capture-acceptance predicate. Ten source-contract checks executed against fetched source; **no Node/browser product tests and no independent acceptance** were completed. AX Studio-adoption exchange records still absent at same pin. Old findings below are historical and do not establish current regressions.

# Capture Studio — Independent QA Findings Index

## 2026-10-23 development closeout (lead-executed, not independent acceptance)

- Integrated: bounded gRPC/Connect protobuf feature snapshots flow through decoded events, reducer role coverage, derived events/STREAM_ROLES, and the read-only scoreboard. Binary structure is not a proven chat role.
- Integrated: inspection-cap accounting and conservative withholding of roles when unexamined content could hide contradictory evidence; persisted role schema/classifier version is 3.
- Verified locally on synthetic data: `bun run test` — 999 tests, 998 pass, 0 fail, 1 TODO. Fidelity suites — 10/10 complete replay fixtures, 6/6 native-shape variants; 58 pass, 0 fail, 1 known TODO.
- Origin partition helper is tested but primary-origin family derivation is NOT wired. The unfinished library-consumer patch regressed a fidelity control and was excluded; patch/test preserved under `%TEMP%/opencode/capture-studio-closeout-wip/`.
- Automatic map induction remains unpublished: correctness/privacy defects; reviewed saved-stream text agreement was 1/44, not evidence of native fidelity.
- Saved-session baseline stopped during session 62/99; final derive/library/site/type run is unfinished. Earlier 8.2% role coverage predates conservative withholding and is not a current metric.
- Raw-content and recording-session content hashes were unchanged at the last explicit comparison (414 raw files; 180 files across eight recording sessions). No fresh captures or real-site sends were performed.
- This closeout grants no M1/live acceptance; existing QA-S1-F1 and issue #64 remain unresolved under their existing policies.

**Current status (2026-10-21 recon):** Sprint 02 longitudinal continuity, temporal graph code changes and UI explorer are **IMPLEMENTED IN SOURCE, PENDING CURRENT-SHA INDEPENDENT QA**. QA recon observed main `4909534` without executing tests. See [ROADMAP.md](ROADMAP.md) and [STATE.json](STATE.json). Historical initial W3 target `73d6590` remains relevant to regression history, not the current implementation checkpoint.

## Earlier code-executed W3 findings (pre-fix source `86ca565`)

- 20 ms versus 100 ms rerender observations resolved inconsistently because of time-bucket snapshot grouping.
- Blocks above 400 observations could produce zero candidate comparisons.
- The same keyed identifier across different websites could merge unrelated entities.
- Identical generic messages from unrelated sessions could merge.
- Streaming text expansion could evade candidate blocking.
- Keyless entity identifiers could change with input order.
- Link-confidence evidence was absent from resolved entities.
- Partial updates could erase earlier attributes.

Additional source-exercised risks: numeric/string identifier collision and nested rare fields missed by shape sampling.

**These findings concern earlier source; they must be rerun against the newer implementation, not presumed unfixed.**

## Previously executed temporal graph QA — pinned historical evidence

At implementation `8218e6c` (Node 22.16.0 Linux, module-level): **6 actual tests, 3 pass, 3 fail**. Failures: undated future rendered edge present in past; undated action edge present in past; later edge rejection rewriting prior historical state. See [reproduction receipt](evidence/2026-10-21-sprint01-graph-node22.md) and [executable cases](tests/sprint01-temporal-graph.test.mjs). **Later graph implementation was changed; these are not confirmed live defects at main and require a fresh pinned rerun.**

## Current implementation's self-reported areas to challenge

Read the exact-commit `QA-NEXT-TESTS.md`. It identifies cross-session keyless continuity, missing site/group scope, changed EID compatibility, older fixtures without explicit snapshots, term-frequency asymmetry, inability to distinguish field removal, confidence semantics, and broad role-prior changes.

## Evidence standard

For every confirmed defect: pinned source SHA, actual runtime, reproduction inputs, expected versus observed output, downstream effect, and retest status. Preserve executed tests and sanitized results under this QA folder; use a dated sprint closeout and update this index. Distinguish runtime proof from source inspection and hypotheses.

## Current QA queue (unexecuted)

1. Re-run six graph tests at the latest pinned implementation; explicitly compare changed semantics with the original assertions.
2. Execute same-site keyed continuity join; different-site and keyless non-join; type drift; tenant collision; earlier as-of and partial attribute retention.
3. Check missing entities dataset, rederive/delete, CLI/API output and UI error/completeness states.
4. Characterize large-history cost and remaining Windows/CDP acceptance gap.

No new test failures or passes are asserted by this roadmap/records-only update. **Next:** targeted cross-session plus graph verification from [LAUNCH.md](LAUNCH.md); retain owner-led grouped defect handoff and non-blocking development.

## 2026-10-23 — real-data survey, fidelity defects and fixes (offline)

Scope: offline only; owner decision 2026-10-23 defers fresh controlled captures. Code observed at `4106b785`. Vocabulary: Build / Integrated / Locally demonstrated on synthetic data / Observed on saved real sessions (read-only). Nothing below is live-site, real-Chrome or Windows evidence, and none of it is independently accepted.

### A. Real-data findings (read-only survey, 107 saved sessions, counts only)

Scripts `scripts/fidelity-survey.mjs` and `scripts/proto-field-search.mjs` (commits `3ec67e46`, `7cd1fb50`): 107 ok, 0 errors, no writes detected, 29 with finished status. Evidence for every item: **Observed on saved real sessions (read-only)**.

- **RD-10a — ChatGPT dialect.** 28 sessions match `chatgpt-path-ops`. After the map update (`56eed0dc`), about 590 previously unmapped real protocol events are recognised; the events labelled redacted-shape were later identified (value types only) as routine message-open frames, and after the message-open rules (`75e7b882`) a replay of 27 sessions leaves 3 of 329 previously unmapped events unmapped. Map semantics are inferred from event names and structure. Status: Build.
- **RD-10b — join links nothing on real ChatGPT data.** 0 verified / partial / near_match of 60 ChatGPT assistant turns across 11 sessions (68 assistant turns in 19 sessions were diagnosed in total; the other 8 are Claude). Every saved ChatGPT turn is exactly 13 characters (the hidden heading label), so the saved DOM came from the old turn extractor. The generic text-aware ranking fix (`7b7e3306`, `src/capture/page-agent.js`) is verified only on synthetic DOM structures; its effect on the real page is UNVERIFIED until a fresh capture. Status: finding observed; fix Locally demonstrated on synthetic data only.
- **RD-10c — claude.ai transport and reply lead.** Conversation traffic is application/connect+proto, partly gzip-compressed (decoder `ac87148d`). No server-sent-events reply stream was found in the 8 Claude sessions with DOM turns. Reply text is carried partly in protobuf string field path `1.1.5.9` (top-5 in 8 of 8 sessions; best aggregation unionAll; median token Dice 0.66; presence coverage 0.71–0.73). Only about 2 distinct conversations exist in the sample (7 of 8 sessions repeat one prompt). LEAD, not an established parse. The claude typed-events map cannot match claude.ai.
- **RD-10d — stream-arm fallback.** 29 of 47 stream-arm attempts in one Claude session failed and fell back to whole-body capture (small JSON responses).

### B. Defects found by the native-shape fidelity suite (`2062f9f4`) and fixed

Evidence: Locally demonstrated on synthetic data (suite: 6 of 6 variants faithful at stream, components and page layers; 3 cut variants correctly non-final).

- **NS-1 — ChatGPT snapshot message id.** Fixed in `82a83ffa`: ChatGPT-style snapshot frames supply the message id (`source 'snapshot'`, not written to `doc.meta`).
- **NS-2 — block pairing.** Fixed in `99242658`: blocks pair by rank order.
- **NS-3 — block finality.** Fixed in `99242658`: blocks inherit message finality.

### C. Reply-ranking bug (found by the acceptance lane)

- **AL-1 — `texts()` ranked identifiers above short replies.** Fixed in `3796e1b2` (rank reply content before identifiers). Evidence: Locally demonstrated on synthetic data. Not independently accepted.

### D. RF-1 — CRLF split across chunks

- **RF-1 — exact byte spans when CRLF is split across chunks.** Fixed in `ba251fab`; resolved in the replay-fidelity suite (`034d0e21`: 10 of 10 finished synthetic sessions byte- and event-faithful). Evidence: Locally demonstrated on synthetic data.

### E. Open

Open items mirror the ROADMAP 2026-10-23 block and `STATE.json` `session_2026_10_23.open`. These records are not acceptance receipts.

- **RD-10e - an inference from key names was wrong; caught by a value-type check before commit.** After the map update, 326 of 329 unmapped real ChatGPT events had the keys rror and rror_code. They were first read as error envelopes from the key names alone, and a lane built an error-signal rule on key presence. A value-TYPE check (types only, no values, 27 real sessions) showed every one has rror = null, rror_code = null and message = an object: routine message-open frames. The rule would have flagged 25 of 27 healthy sessions as errored. Nothing wrong was committed. Outcome (75e7b882): signals fire only on a non-null error value (
onNull); message-open frames build a message component; user-authored frames are ignored; a real error wins over a message object. Evidence level: Observed on saved real sessions (read-only, types only); fix Locally demonstrated on synthetic data. Lesson recorded: key names are not semantics; check value types before building on an inference about real data.
