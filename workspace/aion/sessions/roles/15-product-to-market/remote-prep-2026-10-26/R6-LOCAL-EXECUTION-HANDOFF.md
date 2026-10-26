# R6 — One-page OpenCode WORLD implementation & acceptance handoff

**Prepared 2026-10-26 · Thinking effort for local OpenCode: HIGH for Q07, MED/HIGH for Q04, HIGH for Q01 end-to-end acceptance.** This is **a proposed local dispatch for an explicitly owner-selected WORLD task**, not an agent launched by R6. Windows local checkout is master. **No AION local clone assumed.** R6 added no Harness source/tests.

## Canonical inputs (fetch directly from GitHub, not an absent AION clone)

- Full R6 proof contract: [R6 adversarial matrix](R6-ADVERSARIAL-ACCEPTANCE-MATRIX.md) and [machine proof gates](R6-PROOF-AND-RELEASE-GATES.yaml).
- Source-loss R4: [R4 matrix](R4-CAPTURE-TO-WORLD-TRUTH-MATRIX.md). One-app human flow R5: [R5 map](R5-HUMAN-JOURNEY-COMPOSITION-MAP.md) and [R5 action/API contracts](R5-UI-CONTRACTS.yaml).
- Source authority: [Harness main](https://github.com/owenservera/vivim-harness), observed remote HEAD `32b7021e99aedb3bedb21daae9e7983676ef4771`; **inspect actual local HEAD/dirty worktree** before work.
- Local path: `C:\0-BlackBoxProject-0\vivim-harness`. Current `PROMPT.md` may assign a **PROVIDER** three-turn mission. Do not silently cancel/preempt it or use a second Chrome actor.

## Copy-ready directive (submit to authorized local OpenCode session only)

```text
#VIVIM-HARNESS @LOCAL +/EXECUTE /R6-WORLD-CLOSURE

THINKING EFFORT HIGH. Work in C:\0-BlackBoxProject-0\vivim-harness.
This is the existing Harness product, not a second frontend or new store.
Do not assume AION is cloned locally. Fetch from GitHub AION PRODUCT AGENT:
https://github.com/owenservera/aion/tree/main/workspace/aion/sessions/roles/15-product-to-market/remote-prep-2026-10-26/
Read R6-LOCAL-EXECUTION-HANDOFF.md, R6-PROOF-AND-RELEASE-GATES.yaml,
R5-UI-CONTRACTS.yaml; read R4/R5 matrices only for files you will change.

FIRST check git status, actual HEAD, AGENTS.md, active task owner and the
PROMPT.md PROVIDER lane. Preserve dirty changes and active work. Do NOT
reset/clean/rebase, switch owner lane, use Playwright/Puppeteer, start any
second browser actor, edit AION for implementation, or touch real profiles.

IF THIS SESSION IS EXPLICITLY OWNER-AUTHORIZED FOR WORLD AND FILES ARE FREE:
1. Q07/A12: Implement the smallest 'Save this part to project' action
   from the existing Saved conversation reader using the already-present
   POST /api/v1/world/objects, POST /selections, PUT /projects/{id}.
   Reuse existing data records, source path and CAS. Handle a failure
   after the first write honestly; do not claim transaction/atomicity.
   Also support message-level selections when no block is present.
   Add focused UI/service tests. No parallel UI, knowledge DB or actor.
2. Q04/A13: With nonoverlapping file ownership, add the minimal
   producer→HTTP→UI partPath contract test using existing world-search
   and world-ui-find fixtures. Unique block focuses; ambiguous,
   disappeared and imported hits stay source-truthful.
3. Q01/Q08/Q10/A16: As normal product acceptance, run ONE disposable-root
   J1 RETURN → J2 ORGANIZE → J3 FIND → J4 TAKE scenario including
   REAL OS process termination/restart and actual browser JSON download,
   clean data-root restore, provenance, user-visible partial restore,
   keyboard/narrow-screen check. Never write into owner capture/profile.
   T3p process and T3u browser receipts must be distinguished.

For changed files, run relevant targeted node --test suites; when safe,
run bun run test (Node runner, not bun test) and architecture inventory.
Do not run unrelated full live provider E2E or take over Chrome.
No PC-wide preliminary audit. Fix one actual user-visible result at a time.

For every case report: Q/W/A ID, local commit SHA before/after,
changed files, exact commands, true pass/fail/skip counts, T0/T1/T2/T3p/T3u
tier, observed UI/state, data root, remaining risks. Commit and push
only after review/tests; do not claim a push until GitHub readback.
If this OpenCode session belongs to PROVIDER, do not change lane:
report this WORLD handoff as queued and continue owner-authorized work.
```

## Exact code ownership and acceptance boundaries

| Phase | Minimal code/test surfaces | Proof required |
|---|---|---|
| **1 Q07 / A12 — HIGH** | `src/studio/ui/world-view.mjs`: `renderMessages`, `openItem`, existing `call`/`addMember`/`save`; **no backend rewrite**. `world-relations.mjs:96–120` and `world-service.mjs:166–187` are contracts. Tests: `world-ui.test.mjs`, `world-ui-workspace.test.mjs`, `world-journeys.test.mjs` | User-originated `o-id` + `s-id` from a visible `[i]` frame, linked `p-id`, optional `n-id` commentsOn, original immutable; partial POST failure labelled |
| **2 Q04 / A13 — MED/HIGH** | Mainly `test/unit/world-search.test.mjs`, `world-ui-find.test.mjs`; keep producer `world-search.mjs:85–95` and UI `world-view.mjs:1480–1534` unchanged unless a reproduced mismatch requires it | One real HTTP-returned hit passed unchanged into existing UI, unique/ambiguous/absent/imported expectations |
| **3 Q01/Q08/Q10 / A16 — HIGH** | Existing `test/unit/world-journeys.test.mjs` as fixture setup reference; disposable Windows Studio process + one actual local browser. No local owner-private content | True second OS-process persistence **T3p**, actual browser reading/focus/JSON file/restore **T3u**, clean import ownership, explicit incompleteness. These are NOT `T4` provider tests. |

**Local product gate:** G5 remains `NOT ACCEPTED` until step 3 is demonstrated. **Security boundary:** References export lacks message bodies but metadata may still contain secrets; Transcript/Full-saved contain user text verbatim; providerURL sanitizer strips userinfo/query/fragment but not path/content/nested links. Never call hash a signature. R4-I1/R4-I2 UX fidelity changes share `world-view.mjs`; serialize them with Q07 rather than parallel conflicting edits.

**If only one local slot is available:** complete **Q07 first**, not generic repo inventory or new planning. R6 is source/audit complete; implementation and local acceptance remain outstanding.
