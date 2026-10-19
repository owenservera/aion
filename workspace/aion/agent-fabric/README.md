# Agent Fabric — Local Implementation Contract Index

**Status:** Design branch fixtures + contracts + semantic guards only. NOT installed, merged, connected, authorized or live on Windows.
**Owner:** Windows local master and AION's existing project rules. **No GitHub Actions** or alternative hosted task runner.
**Root:** [Agent Fabric Architecture](../canon/AGENT-FABRIC-ARCHITECTURE-2026-10-20.md).

## One place to start

Local OpenCode/Claude/Oracle implementation agent: read [LOCAL-MASTER-START](../handoffs/AGENT-FABRIC-LOCAL-MASTER-START.md) first. It contains the exact base branch, test/run order, cross-repo source map, acceptance gates and final receipt. Do **not** make the owner copy multiple prompts.

The existing [M1/M2 handoff](../handoffs/AGENT-FABRIC-OPENCODE-M1-M2.md) is the detailed identity + portable-agent/compiler implementation. [M3/M5 handoff](../handoffs/AGENT-FABRIC-M3-M5-IMPLEMENTATION.md) completes source-aware context, child task/delegation and verified multi-runtime execution. Work is one sequential program, not competing architectures.

## Contracts and authority

| Contract | Intended producers | Consumers | Source of truth retained |
|---|---|---|---|
| agent-definition.v1.schema.json | zcode-setup canonical playbook | OpenCode V2 and ZCode compiler | Playbook only |
| runtime-capabilities.v1.schema.json | local native engine probes | AION CLI resolver | Native engine + host |
| context-pack.v1.schema.json | AION source/context adapter | permitted agent session | Native project/source docs |
| task-handoff.v1.schema.json | authorized AION/ACP controller | native agent runtime | project-native issue/task |
| execution-receipt.v1.schema.json | Bus/native attempted action + verifier | owner, PM read-only projection | Bus operation/native artifacts |

These JSON Schema 2020-12 files establish payload shapes. The pure [semantic guards](src/semantic-guards.mjs) supplement (but **do not replace**) full JSON Schema validation; the local agent must use a conforming Draft 2020-12 validator in the actual runtime before admitting any envelope. Unknown fields/versions refuse; do not use lenient compatibility for permissions.

All [fixtures](fixtures/) are **synthetic, offline-only** examples. Their sample hashes, IDs, timestamps and references do not prove local files, installed engines or executed tasks; do not promote them to real statuses.

## Current source-of-truth mismatches to reconcile

1. AION sessions README lists **nine designed roles**, including Research 09. Chrome launcher ROLES.json defines **eight**. Neither proves a live conversation. The M1 inventory must report drift, NOT auto-create/bind Research.
2. Global PM is **read-only** in its current charter; AION/ACP may own execution after an actual approval, and PM observes project-native receipts. The executive-agent aspiration is not PM write authority.
3. ZCode Setup owns a versioned native playbook. AION should not introduce a second canonical agent definition store. Portable descriptors/compiled projections belong in playbook under its conformance contract.
4. OpenCode V1 and **V2 have incompatible agent/permission surfaces**. Probe installed version, use correct native compiler and refuse migration without explicit action. The old opencode-VIVIM Go repo is not current OpenCode V2.
5. Track B is a development branch. Design PR #35 is based on AION main; implementation starts from **origin/track-b/implementation-rounds-20261019**. Do not merge this design branch into Track B blindly or touch stable Chrome Track A.
6. The previous round's source-level fixtures or Opus's earlier full test count are **not** a passing current-head Windows or live Chrome receipt.

## Offline verification

From an AION checkout containing this design directory:

    node --test workspace/aion/agent-fabric/test/contracts.test.mjs

This uses Node 22 built-in test facilities only. It checks fixture semantics and basic structural contract invariants. It does NOT fully implement JSON Schema validation, compile OpenCode agents, run native models, or prove Windows behavior. A production runtime must add a real Draft 2020-12 validator and integration tests.

From Track B's **implementation** worktree (not the design worktree):

    cd workspace/aion/ops/chrome-relay/velocity
    node --test
    node bin/aion-local.mjs selftest

Inspect failures honestly. No Actions fallback. Re-run the full suite after every relevant port, not relying on an old HEAD's receipt.

## Reference research

- OpenCode V2 agents: https://opencode.ai/v2/docs/agents
- V2 permissions/least privilege: https://opencode.ai/v2/docs/permissions
- V2 migrate: https://opencode.ai/v2/docs/migrate-v1
- V2 SDK: https://opencode.ai/v2/docs/build/sdk
- Internal native contract capture: https://github.com/owenservera/SOFTWARE_HQ/blob/main/apps/zcode/harvest/2026-10-15/ZCODE-CCR-OPENCODE-CONTRACTS.md
- ZCode playbook contract: https://github.com/owenservera/zcode-setup/blob/main/playbook/SPEC.md
- PM evidence charter: https://github.com/owenservera/001.PROJECTS.PM/blob/main/docs/CHARTER.md
- ZBot task model: https://github.com/owenservera/zcode-bots/blob/main/docs/zbot-upgrade/03-TASKS-AUTOMATIONS.md

## Local artifact rule

Every created file should be committed and pushed to the **correct repo and isolated branch** when authorized and Git operations verify success. Actual checkout modifications, installs, grants, host registrations and local tests must be proven locally before claiming completion. Github issue comments do not start an agent.
