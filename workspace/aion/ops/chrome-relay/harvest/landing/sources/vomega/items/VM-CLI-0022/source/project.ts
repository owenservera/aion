// Pure semantic projector (Phase E, D1-040).
//
// IMPLEMENTED here: D1-040 — the minimal deterministic projection contract.
// `project()` is the ONLY thing a surface may read. It is a pure function of
// state: it never parses language, never re-decides readiness and never grants
// anything. Every value it exposes is copied from a record that already exists
// — the compiled UseCommand (compile.ts), the ONE READY law (validate.ts, read
// through compile.ts `validation`), the capability declaration, or the World.
//
// Deliberately NOT here, each because a named task owns it:
//   renderHtml (D1-042, ui.ts) — the projection is a surface's only input.
//   commandDigest (D1-029)      — see `actionsOf` below.
//   help answers (D1-050..054)  — this file exposes topic REFS only.
//
// The Distinctions this projection is shaped to keep visible:
//   Provider ≠ Account ≠ Model ≠ Realization — five separate RouteSlots, each
//     read off its own record. A Provider is never implied here; it is whatever
//     the compiled command named (compile.ts derives it from the Account).
//   Capability ≠ Realization — separate slots, separate ids, never one field.
//   consequence ≠ authority — consequence is copied from the declaration. It
//     grants nothing, and it decides nothing here.
//   evidence ≠ authority; simulation ≠ live — evidenceClass is a literal typed
//     as "SIMULATED", so a non-simulated receipt would be a type error rather
//     than a silent claim.
//   confidence ≠ proof — no score appears anywhere in this file.
//   World ≠ Surface — the projection exposes Actions and read-only slots. The
//     surface dispatches those actions verbatim and may hold no state of its own.
import type { Action, D1State, HelpQuestion, Lifecycle, Projection, Receipt, RouteSlot, SemanticEdit, UseCommand, World } from "./contract.ts";
import { currentCommand, validation } from "./compile.ts";
import type { CapabilityDecl, ParamDecl } from "./declarations.ts";
import { capabilityDecl } from "./declarations.ts";

export interface ProjectOptions { treatment?: "compact" | "detailed" | string }

const DEFAULT_TREATMENT = "default";

/** The route fields the Action grammar can edit. This mirrors the contract's own union; it is not a second field list. */
type RouteField = SemanticEdit["field"];

function isRouteField(value: string): value is RouteField {
  return value === "provider" || value === "account" || value === "model";
}

/** A receipt is the session's outcome, and every outcome this port can record is simulated. */
const RECEIPT_LIFECYCLE = {
  succeeded: "completed-simulated",
  failed: "failed-simulated",
  uncertain: "uncertain-simulated",
} as const satisfies Record<Receipt["outcome"], Lifecycle>;

/**
 * D1-040: the deterministic projection of the compiled session. Same state in,
 * same projection out — `treatment` may change `presentation` and nothing else.
 */
export function project(state: D1State, opts: ProjectOptions = {}): Projection {
  const cmd = currentCommand(state);
  const decl = cmd ? capabilityDecl(cmd.capability) : undefined;
  const treatment = opts.treatment ?? DEFAULT_TREATMENT;
  const lifecycle = lifecycleOf(state, cmd);
  return {
    revision: state.active,
    worldDigest: state.world.digest,
    input: activeText(state),
    lifecycle,
    reading: readingOf(state),
    route: routeOf(state, cmd, decl),
    unresolved: unresolvedOf(state, cmd),
    consequence: cmd?.consequence ? { ...cmd.consequence, carries: [...cmd.consequence.carries] } : null,
    help: helpRefsOf(cmd, lifecycle),
    actions: actionsOf(state, lifecycle),
    // The identity the session has actually minted. Pre-commit there is none,
    // and this port will not place a placeholder in the slot — D1-029 owns
    // command identity.
    commandDigest: state.committed?.digest ?? null,
    // Both sources are typed as the literal "SIMULATED", so this can never widen.
    evidenceClass: state.receipt?.evidenceClass ?? cmd?.expectedEvidence ?? "SIMULATED",
    treatment,
    // Presentation hints and nothing else. The minimal contract supplies the
    // variant name and asserts no display truth; renderHtml (D1-042) owns the
    // rest. This is the only field `treatment` may reach.
    presentation: { variant: treatment },
  };
}

/** The text of the active revision, or "" before any input exists. */
function activeText(state: D1State): string {
  return state.revisions.find((r) => r.n === state.active)?.text ?? "";
}

/**
 * The session's lifecycle, READ from the one law rather than restated.
 *
 * "ready" is reachable only through a command the reducer already accepted
 * against `validateInterpretation`'s verdict, so this function can never
 * manufacture a false READY. "executing" is unreachable: `executeVirtual` is
 * synchronous and the state records no in-flight marker, so inventing one here
 * would be a second claim about a phase that has no representation.
 */
function lifecycleOf(state: D1State, cmd: UseCommand | null): Lifecycle {
  if (state.receipt) return RECEIPT_LIFECYCLE[state.receipt.outcome];
  if (state.committed) return "ready";
  if (cmd) return validation(state).state;
  if (state.active === 0) return "empty";
  // No canonical reading is in hand: either the active revision is still
  // awaiting interpretation, or what is held belongs to another revision.
  const held = state.interpretation?.revision === state.active ? state.interpretation : null;
  if (state.pending.includes(state.active) || !held || held.kind === "unknown") return "unknown";
  return "interpreted";
}

/**
 * The one reading D1 actually holds: the words the frame layer grounded as the
 * explicit target. compile.ts deliberately leaves `reading` and `canonical`
 * empty in its own projection — inventing a canonical sentence here would be a
 * second claim about the command, so the projection reports the mention or null.
 */
function readingOf(state: D1State): string | null {
  const trace = state.draft?.result.detail as { mention?: string | null } | undefined;
  return trace?.mention ?? null;
}

/** Five separately labelled route parts. Provider is not derived here and a Model is not implied by an Account. */
function routeOf(state: D1State, cmd: UseCommand | null, decl: CapabilityDecl | undefined): Projection["route"] {
  if (!cmd) {
    // Capability ≠ Route: with nothing compiled there is no route, and the
    // slots say so rather than presenting empty parts as resolved.
    const absent: RouteSlot = { id: null, label: null, state: "absent" };
    return { capability: absent, provider: absent, account: absent, model: absent, realization: absent };
  }
  return {
    capability: { id: cmd.capability, label: decl?.title ?? null, state: "resolved" },
    provider: routeSlot(state.world, "provider", cmd.provider, decl),
    account: routeSlot(state.world, "account", cmd.account, decl),
    model: routeSlot(state.world, "model", cmd.model, decl),
    // Capability ≠ Realization. Its own slot with its own id; the realization
    // declaration carries no title, so the id is the label rather than a
    // synthesized one.
    realization: { id: cmd.realization, label: cmd.realization, state: cmd.realization ? "resolved" : "unresolved" },
  };
}

/**
 * One route slot. Its state is read off the declaration's own `semantic`, so a
 * capability that routes on no such field reports "absent" without this file
 * naming a field list: `unresolved` is a declared-REQUIRED route with no value,
 * `optional` is a declared-optional one, and a value the World does not hold
 * keeps its id but reports no label — nothing is invented to fill the gap.
 */
function routeSlot(world: World, field: RouteField, id: string | null, decl: CapabilityDecl | undefined): RouteSlot {
  if (id) return { id, label: labelOf(world, field, id), state: "resolved" };
  const param = declaredRoute(decl, field);
  if (!param) return { id: null, label: null, state: "absent" };
  return { id: null, label: null, state: param.required ? "unresolved" : "optional" };
}

/** The declared route param for a field, read off the declaration rather than restated here. */
function declaredRoute(decl: CapabilityDecl | undefined, field: RouteField): ParamDecl | undefined {
  return decl?.params.find((p) => p.semantic === `route.${field}` && p.type === field);
}

/** The World's own label for a record, or null when this World does not hold it. */
function labelOf(world: World, field: RouteField, id: string): string | null {
  const rec =
    field === "provider" ? world.providers.find((r) => r.id === id)
    : field === "account" ? world.accounts.find((r) => r.id === id)
    : world.models.find((r) => r.id === id);
  return rec?.label ?? null;
}

/**
 * What is still unresolved, copied from the compile path's own record so no
 * alternative is collapsed and no reason is re-invented. Each option carries
 * the semantic edit that resolves it — the surface dispatches that action
 * verbatim and has no other path to a choice. `via: "clicked"` is presentation
 * provenance and never reaches the canonical command.
 */
function unresolvedOf(state: D1State, cmd: UseCommand | null): Projection["unresolved"] {
  if (!cmd) return [];
  return cmd.unresolved.map((u) => {
    // Bound once: a narrowing on `u.field` does not survive into the callback.
    const field = u.field;
    return {
      field,
      reason: u.reason,
      options: isRouteField(field)
        ? u.options.map((id) => {
            const action: Action = {
              type: "edit",
              revision: state.active, // the reducer rejects a stale revision; the chooser always speaks for the active one
              edit: { kind: "select", field, value: id, via: "clicked" },
            };
            // An option the World does not hold is shown under its own id: the
            // id is the compile path's record of it, not a label invented here.
            return { id, label: labelOf(state.world, field, id) ?? id, action };
          })
        : [], // a content field is filled by text, so it offers no chooser action
    };
  });
}

/**
 * Ranked help topic ids for the active semantic state — REFS, not answers. Every
 * inclusion is a fact about this state (a blocked field, a boundary crossing, the
 * evidence class); help.ts (D1-050..054) owns the grounded claims themselves.
 * Most specific to the current blockage first.
 */
function helpRefsOf(cmd: UseCommand | null, lifecycle: Lifecycle): HelpQuestion[] {
  const fields = new Set((cmd?.unresolved ?? []).map((u) => u.field));
  const refs: HelpQuestion[] = [];
  if (lifecycle === "needs-choice") refs.push("why-choose");
  if (fields.has("account")) refs.push("which-accounts");
  if (cmd?.provider === null && fields.has("provider")) refs.push("what-is-provider");
  if (cmd?.consequence?.crossesLocalBoundary === true) refs.push("what-leaves-boundary");
  if (cmd) refs.push("what-is-capability");
  if (lifecycle === "ready") refs.push("why-ready");
  // This port can only emit SIMULATED evidence, so the question is always live.
  refs.push("what-is-simulated");
  return refs;
}

/**
 * The semantic actions available right now — whatever is absent here cannot
 * happen through a surface. These mirror the reducer's own accept conditions
 * rather than a second opinion about them.
 *
 * Consent is deliberately missing while D1-029 (`commandDigest`) is open. A
 * consent action carries the identity it is granted FOR; this port will not put
 * a placeholder digest in that slot, because an action naming an identity that
 * was never minted is not an available action. It is the one line to add back
 * when D1-029 lands, and nothing else here changes.
 */
function actionsOf(state: D1State, lifecycle: Lifecycle): Action[] {
  if (state.committed) return state.receipt ? [] : [{ type: "execute" }];
  return lifecycle === "ready" ? [{ type: "commit" }] : [];
}