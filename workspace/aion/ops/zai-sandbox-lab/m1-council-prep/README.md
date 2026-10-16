# M1 Z-FORGE COUNCIL PREPARATION — Integration Contract v0.1
**Authority:** owner directive 2026-10-16; **coordinator:** 03 Chief of Staff; **integrator:** 08 Z-FORGE; **review/acceptance:** 05 Chief.
**State on publication:** WORK ORDERS COMMITTED / ROLE RECEIPTS PENDING. No proof that independent chats have seen the assignments.
**Current canonical acceptance:** [AION M1 Introspection](../../../canon/AION-MILESTONE-1-INTROSPECTION.md). Genuine AION-originated message -> authenticated ChatGPT web app -> real reply -> returned to AION + checkable readback and negative test. Z.ai cannot perform that final authenticated target-session test.

## How eight components converge
```
01 observability ─────────┐
02 critical path ─────────┤
03 packaging/handoffs ────┤
04 turn economics ────────┤
05 acceptance ────────────┼─► 08 Z-FORGE MERGE ─► existing AION repo cloneable bundle
06 adapter compatibility ┤                         ├─► optimized Z.ai Agent Mode run prompts
07 provenance/index ─────┘                         ├─► mocks and tests to build inside sandbox
                                                └─► final authorized-live-test checklist
```
Z-FORGE is accountable for compatibility and merging of actual received contributions, not transcribing their whole SITREPs. Neither a GitHub comment nor a modified SITREP wakes another ChatGPT conversation. Chief of Staff confirms real role acknowledgment and escalates gaps; Z-FORGE may proceed with documented fallback based on existing canonical source when a role is unavailable rather than inventing its output.

## Contribution contract: one author = one owned slice
Each role reads canonical M1, existing Z-FORGE assignment `workspace/aion/ops/zai-sandbox-lab/M1-PRELIVE-RUN-DESIGN.md`, and its own current SITREP. Return exactly a scoped Markdown report to the assigned role issue comment (or dedicated file only if substantial).
Use this mandatory metadata:
```
AION_ZFORGE_M1_COMPONENT_V1
component_id: M1C-01..M1C-08
role_id: 01..08
state: RECEIVED|BLOCKED|DELIVERED|VERIFIED
source_refs: [canonical paths/commit links]
deliverable_url: <actual issue comment/file URL>
claims: OBSERVED|SOURCE_DOCUMENTED|INFERRED|UNVERIFIED (per claim)
dependencies: <other M1C IDs>
hard_blockers: <specific missing data/authorization>
next_action: <one concrete action>
END_AION_ZFORGE_M1_COMPONENT_V1
```
Commit/fetch actual artifacts before reporting DELIVERED. No fake GitHub issue receipt, live role ACK, Chrome install, Z.ai account connectivity, source SHA, M1 success or simulation labeled LIVE.

## Individual assignment matrix
| ID | Owner | One output object | Acceptance and interface |
|---|---|---|---|
| M1C-01 | 01 Dashboard | `OBSERVABILITY.md`: minimal event and role/presence status contract | Distinguish dispatch, transport ACK, real reply, origin consumption, VERIFIED, and UNKNOWN; correlation+UTC+evidence URI; no UI build needed |
| M1C-02 | 02 Planning | `CRITICAL-PATH.md`: canonical M1 vs M0.5, decision gates, scope exclusions | Trace each gate to existing M1/M0.5, Task-to-Proof and relay canon; prioritize smallest integrated proof; no unrelated roadmap |
| M1C-03 | 03 CoS | `HANDOFF-AND-EXPORT.md`: source freeze/clone/run/artifact receipt ownership | Git clone pinned SHA, disposable sandbox, export artifact/patch/ZIP, hash, negative tests, reviewer ACK, master integration authorization; no fake operator/session |
| M1C-04 | 04 Efficiency | `TURN-ECONOMICS.md`: choose 1–3 experiments with turn costs as UNKNOWN until measured | Model selected per web run as user reported, subagents conditional, budget/elapsed/evidence fields, rework threshold, stop rules |
| M1C-05 | 05 Chief | `ACCEPTANCE-GATES.md`: executive scope guard and independent acceptance thresholds | Distinct PREPARED/SANDBOX_TESTED/EXPORTED/INDEPENDENTLY_VERIFIED/LIVE_READY/M1_PASS and precise withheld authority |
| M1C-06 | 06 TOOLSMITH | `BROWSER-AND-ACP.md`: transport API + Chrome MV3 + local adapter integration | OS-neutral envelope, Linux sandbox mock adapter, host installation boundary, auth/session separation, browser DOM ambiguity/negative tests; no Playwright/Puppeteer |
| M1C-07 | 07 INTAKE | `SOURCE-MAP.md`: original council/technical idea references and reconciliation | Preserve RAW in existing commons only if actual full source supplied/accessible; otherwise source locators+unknowns; source-to-requirements/alternatives, no invented scores |
| M1C-08 | 08 Z-FORGE | `PACKAGE-MANIFEST.md`, run matrix, mission prompts and ready-to-clone artifact layout | Real merge of returned components and canonical references, coherent pinned commit inputs, no assertion of receipt if pending; tested fixture contract and live boundary |

## No extra repositories or branches
Canonical destination in existing `owenservera/aion` `main`:
```
workspace/aion/ops/zai-sandbox-lab/m1-council-prep/
  README.md                 # this contract
  PACKAGE-MANIFEST.json     # handoff inventory and verified states
  components/               # only REAL received component artifacts, not fake placeholders
  prompts/                  # Z-FORGE authored copy-ready Z.ai web Agent prompts
  fixtures/                 # future Z.ai-built/testable mock endpoint + adapter
  receipts/                 # real artifact hashes, logs/test output only
```
Do NOT create empty fake test receipts or promise production-ready code. A sandbox clone of AION main can find this path and follow its linked source files. Private repo clone from Z.ai is NOT assumed; fall back to explicit approved minimal ZIP/source capsule if private access unavailable.

## Merge and acceptance sequence
G0: 05 approves minimal M1 scope and explicit no-live-test rule.
G1: 01+02+06 agree on envelope/ack/proof boundaries; contradictions go to 05, not silently reconciled.
G2: 03 supplies exact reproducible clone/export/provenance protocol. 04 chooses economic turn bundling.
G3: 07 maps original sources/options and any genuine council responses; unreceived sources stay UNKNOWN.
G4: 08 assembles repo-ready package, reports which components are ACTUALLY received, produces minimal ready-to-paste Z.ai turn(s).
G5: owner may submit first Z.ai sandbox turn, which creates actual code/tests/artifacts and returns receipts; 06 reviews technical compatibility, 05 independently accepts.
G6: local authorized operator later performs genuine ChatGPT authenticated roundtrip on owner-controlled machine, outside Z.ai sandbox. Only that can mark M1 PASS.

## Packaging quality gate
Z-FORGE must not send Z.ai a mere bundle of speculative Markdown if one concise fixture implementation contract and tests would suffice. It must provide explicit files-to-create, command/test cases, positive/negative scenarios, acceptance proof, export and failure/recovery. Sandbox outputs must use mock destination **clearly labeled as such**.
NO Playwright or Puppeteer; no credentials, cookie/profile transfer or unapproved GitHub pushes/host access. Grok Bot remains on separate M0.5 and is not allocated new work by this council handoff.
