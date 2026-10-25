# Architecture Change Protocol

## Every canonical change records

- changeId;
- date/ref;
- affected entities;
- previous representation;
- new representation;
- reason;
- source/evidence refs;
- authority ref;
- affected dependencies;
- stale views;
- unresolved questions;
- required revalidation;
- disposition.

## Change classes

1. RECLASSIFICATION — same underlying meaning, different placement/status.
2. REFINEMENT — adds resolution without changing core meaning.
3. EXPANSION — adds a new responsibility/entity.
4. CONTRACTION — combines representations after proving they are semantically identical.
5. BOUNDARY CHANGE — changes ownership or interface.
6. DEPENDENCY CHANGE — adds/removes dependency.
7. MATURITY CHANGE — evidence changes implementation/proof status.
8. SUPERSESSION — a current view is replaced by a newer current view.
9. ARCHIVAL — current material becomes historical.
10. CONTRADICTION — evidence or authoritative source conflicts with current model.

## Impact discipline

A change to:
- responsibility → recheck owner/dependencies/views;
- boundary → recheck dependent contracts and plugins;
- dependency → recheck keystones/critical paths;
- authority → recheck derived views;
- evidence → recheck maturity/status;
- canonical identity → recheck all references and projections.

## No silent reclassification

If a material conclusion changes, record it as a change.

The old state may remain visible in history where useful.


## Subagent launch handoff requirement

Whenever the Steward asks the owner to launch a subagent, the handoff MUST always include all three of these items explicitly:

1. **Prompt location** — the exact repository path to the launch prompt.
2. **Full repository URL** — `https://github.com/owenservera/BCP-dev`.
3. **Access context** — state that the subagent has full GitHub access to the owner's account and should use that access directly.

The handoff should also briefly state what the subagent is being asked to investigate and what output it is expected to produce.

Do not rely on the owner remembering these details from a previous handoff. Repeat them every time a subagent is launched or requested.
