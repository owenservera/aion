// InterpretationSession as a pure reducer: state × Action → state.
//
// IMPLEMENTED in the seed (domain-neutral): revision identity (D1-030), binding
// of results to revision + World (D1-031), stale-result suppression (D1-032),
// explicit semantic edits (D1-033), and the action log replay depends on.
//
// Semantic decisions are delegated to pure port functions (compile/validate/
// execute) that are still stubs. The reducer never parses language and never
// grants authority: consent only changes through an explicit `consent` action.
//
// Why a reducer: typed and clicked corrections become the SAME kind of value
// (an `edit` action), the UI has no other path into state, and replay is a
// fold over the action log.
import type { Action, D1State, InterpretationResult, World } from "./contract.ts";
import { commandDigest, currentCommand, interpretRevision, validation } from "./compile.ts";
import { executeVirtual } from "./execute.ts";
import { applyWorldDelta } from "./world.ts";

export function initialState(world: World): D1State {
  return {
    initialWorld: world,
    world,
    revisions: [],
    active: 0,
    pending: [],
    interpretation: null,
    draft: null,
    edits: [],
    consent: null,
    committed: null,
    events: [],
    receipt: null,
    rejected: [],
    log: [],
  };
}

function reject(s: D1State, action: Action, reason: string): D1State {
  return { ...s, rejected: [...s.rejected, { action, reason }], log: [...s.log, action] };
}

export function dispatch(s: D1State, action: Action): D1State {
  switch (action.type) {
    case "input": {
      const n = s.revisions.length + 1;
      return {
        ...s,
        revisions: [...s.revisions, { n, text: action.text }],
        active: n,
        pending: [...s.pending, n],
        log: [...s.log, action],
      };
    }
    case "interpretation":
      return accept(s, action, action.result);
    case "edit": {
      if (action.revision !== s.active) return reject(s, action, `STALE_REVISION edit for ${action.revision}, active ${s.active}`);
      if (!s.draft) return reject(s, action, "NO_DRAFT");
      return { ...s, edits: [...s.edits, { revision: action.revision, edit: action.edit }], log: [...s.log, action] };
    }
    case "consent":
      return { ...s, consent: { decision: action.decision, commandDigest: action.commandDigest }, log: [...s.log, action] };
    case "commit": {
      if (s.committed) return reject(s, action, "ALREADY_COMMITTED");
      const cmd = currentCommand(s);
      if (!cmd) return reject(s, action, "NO_COMMAND");
      const v = validation(s);
      if (v.state !== "ready") return reject(s, action, `NOT_READY ${v.state}`);
      return {
        ...s,
        committed: { command: structuredClone(cmd), digest: commandDigest(cmd), revision: s.active, worldDigest: s.world.digest },
        log: [...s.log, action],
      };
    }
    case "execute": {
      if (!s.committed) return reject(s, action, "NOT_COMMITTED");
      if (s.receipt) return reject(s, action, "ALREADY_EXECUTED");
      const { events, receipt } = executeVirtual(s.committed, s.world);
      return { ...s, events, receipt, log: [...s.log, action] };
    }
  }
}

function accept(s: D1State, action: Action, r: InterpretationResult): D1State {
  if (r.revision !== s.active) return reject(s, action, `STALE_REVISION result for ${r.revision}, active ${s.active}`);
  if (r.worldDigest !== s.world.digest) return reject(s, action, "WORLD_CHANGED result computed against another World");
  const base: D1State = { ...s, interpretation: r, pending: s.pending.filter((p) => p !== r.revision), log: [...s.log, action] };
  switch (r.kind) {
    case "registration":
      if (!r.worldDelta) return reject(s, action, "REGISTRATION_WITHOUT_DELTA");
      return { ...base, world: applyWorldDelta(s.world, r.worldDelta) };
    case "command":
      if (!r.draft) return reject(s, action, "COMMAND_WITHOUT_DRAFT");
      return { ...base, draft: { revision: r.revision, worldDigest: r.worldDigest, result: r }, edits: [], consent: null };
    case "edit":
      if (!s.draft) return reject(s, action, "NO_DRAFT");
      return { ...base, edits: [...s.edits, ...(r.edits ?? []).map((edit) => ({ revision: r.revision, edit }))] };
    default:
      return base;
  }
}

/** Synchronous interpretation of the active revision (dev/test convenience; the UI may run it async). */
export function settle(s: D1State): D1State {
  if (!s.pending.includes(s.active)) return s;
  return dispatch(s, { type: "interpretation", result: interpretRevision(s, s.active) });
}

/** input + settle, the common synchronous step. */
export function say(s: D1State, text: string): D1State {
  return settle(dispatch(s, { type: "input", text }));
}

/** Fold an action log from a World (the replay primitive; interpretation results are recomputed by `settle`). */
export function run(world: World, actions: Action[]): D1State {
  let s = initialState(world);
  for (const a of actions) {
    if (a.type === "interpretation") continue; // recomputed, never trusted from a log
    s = dispatch(s, a);
    if (a.type === "input") s = settle(s);
  }
  return s;
}
