# AION Track B — owner acceptance / alignment session receipt (2026-10-20)

**Scope:** accepted Claude independent architecture PR #50 → Track B candidate PR #46 → repo state and active operator/research entry points. **Not** a runtime change or a Windows/Chrome test receipt.

## Session result

- **ACCEPTED:** PR #50 at head `e80f2d59cbe6e8aeb190f51b9133bed62236a73f`, merged into the candidate with GitHub merge commit `663a5ee0cf849f591b58847b3cec138370f13b37`.
- **DECISION SOURCE:** [12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md](12-ACCEPTED-ARCHITECTURE-AND-ALIGNMENT.md) — single current architecture, decision M1–M6, I0–I3 gates and P1–P8 source ownership. Review 11 is accepted rationale; historical plans 02/05/06/07/08/10 explicitly defer to 12 where conflicting.
- **OPERATOR ENTRY:** [velocity/README.md](../README.md) points to 12. [GitHub issue #43](https://github.com/owenservera/aion/issues/43) begins with the same accepted contract. No second live runtime or taxonomy authority.
- **MACHINE STATE:** `workspace/aion/STATE.json` updated to point to 12, lift the **Track B source-only freeze**, set bidirectional CLI goal and GitHub-authoring/Windows-testing model. Historical 2026-10-19 live incident and earlier approvals preserved as historical evidence. Owner Windows machine remains master for actual live acceptance and authorized local effects.
- **RESEARCH AUTHORITY:** Crosswalk PR #49 was merged as research into candidate; PR #47 catalog and PR #51 draft P0 expansion still reside on **separate research branches**. No registry row is executable permission, route selector or session-fidelity proof. Source aliases remain an input to P1 source contracts, not an adopted runtime migration.
- **CODE GATE:** added `velocity/test/architecture-alignment.test.mjs` to detect drift among STATE, 7 legacy design entry points, README, canonical decision/gates. The new test source is committed but a Node full-checkout execution remains to be run and evidenced.
- **RUNTIME STATUS:** No newly implemented receive event bus, CLI REPL, live Chrome Send or cursor recovery demonstrated by this alignment. PR #46 remains DRAFT.

## Disagreements resolved

| Prior conflicting statement | Accepted decision |
|---|---|
| 'Send and observe one operation is enough' | Product requires continuous two-way CLI, external incoming turns, restart/recovery. |
| 'Pure long-poll is the primary receive path' | Data-only event push **plus** authoritative read-only snapshot; polling only optional fallback. |
| 'Require correlation tokens in every chat prompt' | Human chat sends original plain text; strict tokens remain only for agent-to-agent command mode. |
| 'Repair large old Chrome engine before exposing a useful outcome' | Read-only observer first; then live actuator bake-off; selectively rebuild provider driver and retire old after I2. |
| 'Build one generalized event/command engine' | Node Bus sole effect authority; typed observation plane never carries grant/action authority. |
| 'Continue building governance directives in runtime CLI' | Freeze expansion; preserve existing diagnostic tools pending separately tested removal/move. |
| 'All provider routes can be selected from CSV' | Research catalog only; never impersonate an already-bound web thread with a new API session. |
| 'Implementation frozen and Windows-driven' | Track B coding authorized from GitHub; Windows local owner master only for live testing; Track A unchanged. |

## Next implementation sequence (not optional multi-committee signoff)

**P1** shared conversation contract + negative tests + hermetic `~/.zcode/agents` test repair is the initial task. Freeze the event/snapshot schema once tested. Then **P2** Chrome read-only observer, **P3** host/IPC push+snapshot, **P4** CLI REPL/inbox, **P5** OpenCode native ConversationSource proceed in parallel without shared file edits. **I1** real watch-only readback gates **P6** authorized Send integration. **I2** two distinct successful turns in same web conversation gates P7 recovery and I3. P8 legacy retirement comes last. User specifically wants development here and Windows local agent only to test.

## Verifications and limits

Before any runtime promotion, re-fetch the candidate branch and record exact SHA; run `node --test` at `velocity`, `extension`, `bridge`, `bus` and local bundled selftest. Claude's earlier Linux result **757 extension pass; 126 bridge pass/1 skip; 9 Bus pass/1 skip; 237 Velocity pass/1 failed/1 skip** was on prior pinned commit `4647bd4`; the failing Velocity test used non-hermetic `~/.zcode/agents`. Those totals do not prove a new branch head works. The architecture consistency test and new code are not yet independently full-suite tested.

**Change control:** an accepted architectural change must update decision 12 + implementation contract tests + active workplan in one PR. Historical documents retain their evidence but may not silently override the current decision.
