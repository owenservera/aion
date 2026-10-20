// READY law. D1-004 and D1-005 IMPLEMENTED. The session-path READY law
// (compile.ts `validation`) is still stubbed and still names D1-005 there.
//
// A command is READY only if every field required by the selected capability /
// realization is resolved and compatible, no material ambiguity remains, the
// World version is valid for the decision, and authority permits commitment.
// Required fields are DERIVED from declarations/*.capability.json — never a
// second hand-written list (the Reflection gates will catch duplication).
//
// The interpreter's own `status` is NOT this law. nlcl reports what it read;
// satisfiability is recomputed here from the declaration. That recomputation is
// the whole fix for corpus U1 ("send 'x' to Gemini"), which nlcl reports as
// status "ok" while the required account slot grounded to nothing.
import type { Interpretation, IRSlot } from "../../../plugins/vivim-nlcl-pure/src/index.ts";
import type { Validation, ValidationState, World } from "./contract.ts";
import { capabilityDecl } from "./declarations.ts";

export interface FieldRules { capability: string; required: string[]; optional: string[] }

/** A capability id with no declaration has no knowable field rules; say so loudly. */
export class DeclarationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "DeclarationError";
  }
}

/**
 * D1-004: required/optional fields for a capability, derived from its
 * declaration. The declaration is the single source: this function reads
 * `required` off each declared param and never names a field itself. A
 * Capability that is not declared is an error rather than an empty rule set —
 * "nothing required" would silently make an unknown command look satisfiable.
 */
export function requiredFields(capability: string): FieldRules {
  const decl = capabilityDecl(capability);
  if (!decl) throw new DeclarationError("CAPABILITY_UNDECLARED", `no capability declaration for "${capability}"`);
  return {
    capability: decl.id,
    required: decl.params.filter((p) => p.required).map((p) => p.name),
    optional: decl.params.filter((p) => !p.required).map((p) => p.name),
  };
}

/**
 * Declared param types that name a World record rather than content. Read from
 * the declaration's own `type`, so a new capability needs no change here.
 */
const RECORD_TYPES = new Set(["account", "provider", "model", "session"]);

/** Two grounding scores this close are a tie, not a ranking (same reading as compile.ts). */
const TIE = 0.01;

/**
 * D1-005: validate a raw interpreter result against the declared required
 * fields. This is the fix for corpus case U1 (nlcl reports status "ok" while
 * the required account slot is unresolved). `world` is optional so the
 * existing corpus WorldModel cases can be validated too.
 *
 * The law is one-directional: this function may withhold READY, never grant it
 * on an interpretation's word. Without a World it cannot read a realization or
 * an authority, so it cannot say READY at all — an Interpretation is evidence
 * of a reading, not authority to commit.
 */
export function validateInterpretation(interp: Interpretation, world?: World): Validation {
  if (!interp.ir) {
    return verdict("unknown", [], [`no canonical reading of "${interp.input}" (interpreter status "${interp.status}")`]);
  }
  const capability = interp.ir.intent;
  const decl = capabilityDecl(capability);
  // Natural language ≠ canonical command: a pseudo-intent ("surface.assist") names no capability.
  if (!decl) return verdict("unknown", [], [`"${capability}" is not a declared capability`]);

  const missing: string[] = [];
  const reasons: string[] = [];
  let choice = false;

  for (const name of requiredFields(capability).required) {
    const param = decl.params.find((p) => p.name === name)!;
    const slot = interp.ir.slots[name];
    if (!RECORD_TYPES.has(param.type)) {
      // Content is resolved by a value; a slot the frame never filled is not a value.
      const value = slot ? slot.value : interp.ir.payload[name];
      if (typeof value !== "string" || value.trim().length === 0) {
        missing.push(name);
        reasons.push(`${name}: no ${param.type} was read`);
      }
      continue;
    }
    // A record field is resolved only by a grounded entity id. A bare value that
    // matched nothing (U1: "gemini") is an unresolved required field, not a value.
    const id = slot?.entityId;
    if (!id) {
      missing.push(name);
      reasons.push(`${name}: ${slot ? `"${String(slot.value)}" grounded to no ${param.type}` : `no ${param.type} was named`}`);
      continue;
    }
    if (tiedIds(slot!).length > 1) {
      // Both alternatives stay inspectable; D1 never picks for you.
      choice = true;
      missing.push(name);
      reasons.push(`${name}: ambiguous between ${tiedIds(slot!).join(", ")}`);
      continue;
    }
    // A stale grounding can name a record this World no longer holds.
    if (world && !heldBy(world, param.type, id)) {
      missing.push(name);
      reasons.push(`${name}: "${id}" is not a record in World ${world.id}`);
    }
  }

  if (choice) return verdict("needs-choice", missing, reasons);
  // Material ambiguity the required-field scan did not name still blocks commitment.
  if (interp.status === "ambiguous") return verdict("needs-choice", missing, [...reasons, `"${interp.input}" reads as ambiguous`]);
  if (missing.length > 0) return verdict("needs-info", missing, reasons);

  if (!world) return verdict("unavailable", [], ["no World: realization and authority are unread"]);
  if (!world.realizations.some((r) => r.capability === capability && r.status === "available")) {
    return verdict("unavailable", [], [`no available realization for ${capability}`]);
  }
  // Capability ≠ Realization: a realization serves one Provider's Accounts, so a
  // grounded Account target is compatible only if a realization serves its Provider.
// Freshness is read here, beside the realization check and BEFORE authority: it is
// part of the one READY law, not a compile-path blocker, so no non-say path can
  // bypass it. `unresolvedFor` may still offer a stale Account as a choice.
  for (const name of requiredFields(capability).required) {
    if (decl.params.find((p) => p.name === name)!.type !== "account") continue;
    const account = world.accounts.find((a) => a.id === interp.ir.slots[name]?.entityId);
    if (!account) continue;
    if (account.freshness !== "fresh") return verdict("needs-info", [name], [`${name}: "${account.id}" is ${account.freshness}, not fresh`]);
    const served = world.realizations.some((r) => r.capability === capability && r.status === "available" && r.provider === account.provider);
    if (!served) return verdict("unavailable", [], [`${name}: no available realization of ${capability} serves ${account.provider} (${account.id})`]);
  }
  const requirement = world.authority[capability] ?? "denied";
  if (requirement === "denied") return verdict("refused", [], [`${capability} is not permitted by World ${world.id}`]);
  // Consent is its own action. An interpretation carries no consent record.
  if (requirement === "consent-required") return verdict("needs-consent", [], [`${capability} needs consent before it may commit`]);
  return verdict("ready", [], []);
}

function verdict(state: ValidationState, missing: string[], reasons: string[]): Validation {
  return { state, missing, reasons };
}

/** Ids sharing the top grounding score: a tie the World cannot break for us. */
function tiedIds(slot: IRSlot): string[] {
  const matches = slot.matches ?? [];
  if (matches.length === 0) return [];
  const top = matches[0]!.score;
  return matches.filter((m) => Math.abs(m.score - top) < TIE).map((m) => m.entity.id).sort();
}

/** Does this World hold the record of that kind? A kind World cannot hold is never confirmed. */
function heldBy(world: World, type: string, id: string): boolean {
  switch (type) {
    case "account": return world.accounts.some((a) => a.id === id);
    case "provider": return world.providers.some((p) => p.id === id);
    case "model": return world.models.some((m) => m.id === id);
    default: return false;
  }
}
