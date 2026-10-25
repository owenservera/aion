# VOMEGA agent entry

Start at [.project/SITREP.md](.project/SITREP.md). It contains current mission, proof state, active execution surfaces and unresolved owner boundaries.

**Product-loop entry:** [.project/staff/PRODUCT-LOOP.md](.project/staff/PRODUCT-LOOP.md) and [ZCode launch instructions](zcode-setup/PRODUCT-LOOP-LAUNCH.md) define the ten bounded product missions, including existing DEV and DevOps. These are operating and onboarding rules, not claims of live ZCode sessions; Ratchet, DESK, PM scope, and owner authority remain unchanged.

**External ChatGPT collaboration visibility:** [External streams and project activity index](.project/staff/external/README.md) describe the planned CEO / Oracle / research interfaces and their *observational* event ledger. This is not an additional task board, authority source, or proof of live local delivery. Consult only if the current task needs external context.

## Default worker rule

For bounded implementation, **do not reread the full documentation corpus**.

- self-check `HEAD` / `origin/main` / worktree state;
- create one session claim under `.project/agentic-launch/claims/`;
- if Ratchet-tracked, claim one Ratchet task and start from its packet + red gate;
- implement one bounded falsifier/red→green cycle;
- run the named proof; promote/review through Ratchet where applicable;
- close the claim and leave a Commons handoff only for a material result/blocker.

D1 mechanics: [.project/ratchet/OPERATING.md](.project/ratchet/OPERATING.md). D1 mission: [.project/deliverables/D1-START-HERE.md](.project/deliverables/D1-START-HERE.md).

## Daily build-guidance visibility

Daily build guidance is defined in [.project/build-guidance/README.md](.project/build-guidance/README.md). Ordinary workers do not maintain a second tracker: keep the normal session claim accurate and close it honestly. A local controller/orchestrator that can see multiple worktrees should publish the aggregate snapshot defined in [.project/build-guidance/LOCAL-STATE-PROTOCOL.md](.project/build-guidance/LOCAL-STATE-PROTOCOL.md) to the fixed `ops/local-state` telemetry branch. That snapshot is observation, never authority or proof.

## When broader reading is required

If the task changes product/semantic/authority/proof architecture, read the relevant core documents from [seed-docs/README.md](seed-docs/README.md). The minimum protected set is VISION, PRODUCT-ANCHOR, INVARIANTS, PROOF-AND-MATURITY and the current first-release mission.

D4/D5 design work earns a real design cycle; ordinary implementation does not earn another prose layer merely because it is difficult.

## Hard operating boundaries

- Provider ≠ Account ≠ Model ≠ Session.
- Capability ≠ Realization; intent ≠ execution; evidence ≠ authority; confidence ≠ proof.
- Natural language cannot grant authority.
- Fixture/simulation cannot satisfy live proof.
- Auth/provider/model configuration is read-only unless Owen explicitly directs otherwise.
- Do not weaken a gate to pass it.
- Generated PM/Ratchet projections are not hand-edited.
- Historical material under `.project/archive/` is evidence only, never current instruction.

No model, harness, lane, worktree or habitat is permanent project authority.
