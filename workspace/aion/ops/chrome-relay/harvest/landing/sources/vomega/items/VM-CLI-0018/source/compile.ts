// Interpretation → registration / draft / edit, and draft → canonical
// UseCommand (Phases C and D semantics).
//
// IMPLEMENTED here: D1-024 — the declared-capability command path (utterance →
// DraftCommand) and the fold of a draft plus its semantic edits into the
// candidate canonical UseCommand; D1-026 — the session-path READY law, which
// delegates to the one law in validate.ts (D1-005, PROVEN in bc226dc) instead
// of restating it. The `NotImplemented[D1-005]` label that used to sit on this
// file's `validation` was stale: D1-005 is DONE and its law lives in
// validate.ts; the compile-path surface is D1-026's; D1-027 — the typed
// correction, grounded by the SAME grounder as the command path and carried as
// the SAME SemanticEdit value a click produces, so typed and clicked corrections
// converge on one semantic edit path. D1-029 — the deterministic command
// identity, canonicalized over everything the command asserts except the consent
// decision. Still stubs, each still naming its owning task so a red gate says who
// owns it: registration (D1-021), interpreter trace (D1-025).
//
// Harvest disposition (OPERATING.md, "Harvest before inventing"): ADAPT, not
// reimplement. plugins/vivim-nlcl-pure supplies the lexer (so words inside a
// quoted payload can never retarget) and `ground` (explicit-target ranking,
// thresholds and ambiguity preservation, unchanged). `interpret()` itself was
// assayed and REJECTED at this level: it takes its frames from
// `framesForWorld(world)`, which mints a one-slot generic frame for any op
// outside its own default set — against a D1-projected WorldModel it returns
// `surface.assist` for the canonical journey phrase and `unknown` for "add my
// Claude work account", so it cannot carry D1's phrase surface. The frame layer
// below is therefore D1's own, and it never invents structure: required fields,
// consequence class and evidence class are read from declarations/*.capability.json;
// authority is NOT — it is read from the World (`world.authority[capability]`), as are
// the identity/route records. `consequence.to` is likewise not the declared
// `decl.consequence.to` (which names a semantic route and is never read): it is the
// chosen provider, resolved here.
// Nothing in this file is authority.
import { NCLL_VERSION, ground, lex } from "../../../plugins/vivim-nlcl-pure/src/index.ts";
import type { EntityView, Interpretation, IR, IRSlot, RiskClass, Token, WorldModel } from "../../../plugins/vivim-nlcl-pure/src/index.ts";
import type { CapabilityDecl, RealizationDecl } from "./declarations.ts";
import { capabilityDecl, loadDeclarations } from "./declarations.ts";
import type { D1State, DraftCommand, InterpretationResult, SemanticEdit, Unresolved, UseCommand, Validation, World } from "./contract.ts";
import { digest } from "./digest.ts";
import { notImplemented } from "./not-implemented.ts";
// D1-005's law is imported, never copied: one rule set decides READY.
import { validateInterpretation } from "./validate.ts";
import { compatibleAccounts } from "./world.ts";

/** The engine behind a D1 trace: nlcl's lexer/grounder plus D1's frame layer. */
const INTERPRETER_VERSION = `d1-frame/${NCLL_VERSION}`;

/** Candidate version of the D1 record set (World fixture + declarations) a command is computed from. */
const REGISTRY_VERSION = "d1-records/0.1";

/**
 * The candidate phrase surface: the verb that opens a command, per DECLARED
 * capability. This is the only hand-authored lexicon in D1 and it carries no
 * structural truth — a capability absent from the World cannot be spoken here,
 * and every field rule is read from declarations/ below.
 */
const COMMAND_VERBS: Record<string, readonly string[]> = {
  "prompt.send@1": ["ask", "send", "tell", "prompt", "put", "write"],
};

/** Verbs that open a registration — recognized only to hand the task to its owner (D1-021). */
const REGISTER_VERBS = new Set(["add", "register"]);

/** Verbs that open a typed correction. The verb opens it and nothing more: it names no field. */
const CHOOSE_VERBS = new Set(["use", "switch", "choose", "select"]);

/** Words that separate a routed target from the payload. They only split mentions and open a payload. */
const ROUTE_PREPS = new Set(["to", "on", "at", "with", "via", "through", "using", "from", "about", "for", "into"]);

/** Declaration `semantic` tag → the UseCommand field it fills. Wiring, not a second field list. */
const ROUTE_FIELD = {
  "route.provider": "provider",
  "route.account": "account",
  "route.model": "model",
} as const satisfies Record<string, keyof UseCommand>;

/** Grounding observation kept for inspection and replay. Read only to LABEL a reason, never to resolve one. */
interface D1Trace {
  engine: string;
  /** The explicit target mention, when the utterance named one. */
  mention: string | null;
  /** Per-field candidate ids at the top grounding score (the tie set). */
  candidates: Record<string, string[]>;
  tokens: number;
}

interface Grounding {
  mention: string | null;
  /** Tokens the mention consumed, so the payload is what is left. */
  mentionTokens: Set<number>;
  provider: string | null;
  account: string | null;
  model: string | null;
  candidates: Record<string, string[]>;
}

/** D1-025: project a D1 World into the interpreter's grounding target. */
export function toInterpreterWorld(world: World): WorldModel {
  const decls = loadDeclarations();
  const ops = world.capabilities.map((cap) => {
    const decl = capabilityDecl(cap, decls);
    const provider = world.realizations
      .filter((r) => r.capability === cap && r.status === "available")
      .map((r) => r.provider)
      .sort()[0] ?? "";
    const risk: RiskClass = decl?.consequence.crossesLocalBoundary === true ? "EXTERNAL_MUTATION" : "MUTATION";
    return { op: cap, provider, title: decl?.title ?? cap, risk };
  });
  return {
    v: world.revision,
    t: 0, // N1: the clock is supplied by the producer. D1 is a fixture World and has none.
    kernel: { composition: "d1.world/0", nlclVersion: NCLL_VERSION, plugins: [] },
    ops,
    entities: [
      ...world.providers.map((p) => ({ id: p.id, type: "provider", label: p.label, names: p.names })),
      ...world.accounts.map((a) => ({ id: a.id, type: "account", label: a.label, names: a.names })),
      ...world.models.map((m) => ({ id: m.id, type: "model", label: m.label, names: m.names })),
    ],
    lexicon: [],
    rules: [],
    context: { latestMessageId: null, latestEntityId: null },
  };
}

/** D1-020..028: interpret revision `n` of the session against the current World. Pure. */
export function interpretRevision(state: D1State, n: number): InterpretationResult {
  const text = state.revisions[n - 1]?.text ?? "";
  const world = state.world;
  const { tokens, syntaxNotes } = lex(text);
  const head = tokens[0];
  const verb = head?.kind === "cmd" || head?.kind === "word" ? head.norm : null;
  const base = { revision: n, worldDigest: world.digest, interpreterVersion: INTERPRETER_VERSION };

  // Recognized-but-unimplemented surfaces keep naming their owning task.
  if (verb && REGISTER_VERBS.has(verb)) return notImplemented("D1-021", `interpretRevision(revision ${n}: registration "${text}")`);
  if (verb && CHOOSE_VERBS.has(verb)) return correctionFor(text, tokens, syntaxNotes, world, base);

  // A capability the World does not offer is not a command, however well it reads.
  const capability = verb
    ? Object.keys(COMMAND_VERBS).find((c) => world.capabilities.includes(c) && COMMAND_VERBS[c]!.includes(verb))
    : undefined;
  if (!capability) {
    return {
      ...base,
      kind: "unknown",
      detail: { engine: INTERPRETER_VERSION, mention: null, candidates: {}, tokens: tokens.length, syntaxNotes, reason: verb ? `no declared capability opens on "${verb}"` : "no command verb" },
    };
  }

  // capabilityDecl throws for an undeclared capability rather than inventing field rules.
  const decl = capabilityDecl(capability)!;
  const wm = toInterpreterWorld(world);
  const body = tokens.slice(1);
  const grounded = groundTarget(text, body, wm);
  const unheld = grounded.mention === null ? unheldRoute(body) : null;
  // A held recipient named beside an unheld one ("to Gemini via work claude") may not
  // absorb the command: the unheld target wins and the route stays unresolved.
  const conflict = grounded.mention !== null ? unheldLink(routeChain(body, wm), wm) : null;
  const chainTokens = conflict ? new Set([...grounded.mentionTokens, ...routeChain(body, wm).flat().map((t) => t.i)]) : null;
  const held = !unheld && !conflict && grounded.mention !== null ? heldRouteRule(text, verb, body, grounded, wm, world) : null;
  const grounding = unheld
    ? { ...grounded, mention: unheld.mention, mentionTokens: unheld.tokens }
    : conflict
      ? { mention: conflict.slice(1).map((t) => t.norm).join(" "), mentionTokens: chainTokens!, provider: null, account: null, model: null, candidates: {} }
      : held?.refuse
        ? { mention: held.refuse, mentionTokens: grounded.mentionTokens, provider: null, account: null, model: null, candidates: {} }
        : grounded;
  const payload = held?.payload ?? payloadOf(text, body, grounding.mentionTokens);
  const draft = draftFor(capability, decl, world, grounding, payload);
  return {
    ...base,
    kind: "command",
    draft,
    detail: { engine: INTERPRETER_VERSION, mention: grounding.mention, candidates: grounding.candidates, tokens: tokens.length, syntaxNotes } satisfies D1Trace,
  };
}

/** D1-024/027: fold draft + semantic edits into the candidate canonical command (null if no draft). */
export function currentCommand(state: D1State): UseCommand | null {
  const held = state.draft;
  if (!held || held.result.kind !== "command" || !held.result.draft) return null;
  const world = state.world;
  const draft = held.result.draft;
  // An undeclared capability has no knowable field rules (same law as requiredFields()).
  const decl = capabilityDecl(draft.capability)!;
  const trace = held.result.detail as D1Trace | undefined;

  let { provider, account, model } = draft;
  const params = structuredClone(draft.params);
  const contextRefs = [...draft.contextRefs];
  // Edits are presentation-agnostic: `via` never reaches the command (D1-029 excludes it too).
  for (const { edit } of state.edits) {
    if (edit.kind !== "select") continue;
    switch (edit.field) {
      case "provider":
        provider = edit.value;
        break;
      case "account": {
        account = edit.value;
        // prompt.send declares provider as derivedFrom account: the pair may never disagree.
        const rec = world.accounts.find((a) => a.id === edit.value);
        if (rec) provider = rec.provider;
        break;
      }
      case "model":
        model = edit.value;
        break;
    }
  }

  const realization = pickRealization(world, draft.capability, provider);
  const cmd: UseCommand = {
    capability: draft.capability,
    provider,
    account,
    model,
    params,
    contextRefs,
    basis: {
      // The World this command was COMPUTED against — a later World delta makes it stale,
      // and staleness is what the READY law (D1-005) has to notice, not something to hide here.
      worldDigest: held.worldDigest,
      sourceRevision: held.revision,
      registryVersion: REGISTRY_VERSION,
      interpreterVersion: held.result.interpreterVersion,
    },
    unresolved: [],
    consequence: consequenceOf(decl, provider),
    // Consent is its own action. Prose never sets it, and it is not part of command identity.
    authority: { requirement: world.authority[draft.capability] ?? "denied", decision: consentDecision(state) },
    realization,
    expectedEvidence: expectedEvidenceOf(draft.capability, realization),
  };
  cmd.unresolved = unresolvedFor(decl, cmd, world, trace);
  return cmd;
}

/**
 * D1-029: deterministic command identity. Must exclude presentation provenance
 * (edit `via`, the revision number of a correction) so typed and clicked
 * corrections converge, and must include World basis, capability, route and
 * params so semantically different commands never collide.
 * It must also exclude `authority.decision`: consent is given FOR a digest, so
 * granting consent cannot change the identity it was granted for.
 */
export function commandDigest(cmd: UseCommand): string {
  // Exactly one field is read OUT: the consent decision. Every other field the
  // command asserts about itself travels, and `digest` canonicalizes key order,
  // so two semantically identical commands serialize identically whatever order
  // they were assembled in.
  const { authority, ...identity } = cmd;
  // `authority.requirement` is a declaration-level fact about WHAT authority the
  // capability needs — not consent, and it moves only with the World, which
  // `basis.worldDigest` already binds. Namespaced under `command` so a command
  // identity can never collide with a World or evidence digest of equal content.
  return digest({ command: identity, requirement: authority.requirement });
}

/**
 * D1-026: the READY law over the session's current command.
 *
 * There is ONE READY law — D1-005's `validateInterpretation` (validate.ts,
 * PROVEN in bc226dc). This does not restate it: the compiled UseCommand is
 * PROJECTED into the reading shape that law already consumes, and the law
 * decides. Every session fact the reading shape has no room for may only ever
 * withhold READY, never grant it — the law is one-directional and so is this.
 *
 * The projection is what carries ambiguity into validation. The tie set the
 * compile path preserved in `unresolved` travels as equal-score grounding
 * matches, and the session reports it as a materially ambiguous reading, so the
 * law returns needs-choice. Nothing here ever picks an Account: an ambiguous
 * required Account cannot resolve because no code path in this function chooses
 * between the alternatives — both stay readable on the command.
 */
export function validation(state: D1State): Validation {
  const cmd = currentCommand(state);
  if (!cmd) return sessionVerdict("unknown", [], [`no command is compiled for revision ${state.active}`]);
  const law = validateInterpretation(readingOf(state, cmd), state.world);
  if (law.state !== "ready") return law;
  // The compile path's own record outranks the reading, and only ever downward:
  // a route `unresolvedFor` already recorded as unresolved cannot be READY.
  const blocker = cmd.unresolved[0];
  if (!blocker) return law;
  const alternatives = blocker.options.length > 0 ? ` (${blocker.options.join(", ")})` : "";
  return sessionVerdict(
    blocker.reason === "ambiguous" ? "needs-choice" : "needs-info",
    [blocker.field],
    [`${blocker.field}: ${blocker.reason}${alternatives}`],
  );
}

/** No ranking between alternatives: the session holds a tie, not an order. */
const UNRANKED = 1;

/**
 * Project a compiled UseCommand into the reading shape `validateInterpretation`
 * consumes. Every value is copied from the command, the World, or the compile
 * path's own record; nothing is invented and no alternative is dropped. Empty
 * collections mean "not projected", never "nothing exists" — the law reads
 * none of them, and a fabricated reading would be a second claim of fact.
 */
function readingOf(state: D1State, cmd: UseCommand): Interpretation {
  const world = state.world;
  const decl = capabilityDecl(cmd.capability)!;
  const trace = state.draft?.result.detail as D1Trace | undefined;
  const said = trace?.mention ?? null;
  const slots: Record<string, IRSlot> = {};
  const payload: Record<string, unknown> = {};
  let ambiguous = false;

  for (const p of decl.params) {
    if (p.semantic in ROUTE_FIELD) {
      const field = ROUTE_FIELD[p.semantic as keyof typeof ROUTE_FIELD];
      const value = cmd[field];
      // Alternatives come from the command's own unresolved record, so a resolved
      // field carries no phantom tie: after "use Work" the choice is made and the
      // ambiguity is genuinely gone.
      const options = cmd.unresolved.find((u) => u.field === field && u.reason === "ambiguous")?.options ?? [];
      if (options.length > 1) ambiguous = true;
      // A slot carries only what is true: a grounded id, or the words that failed
      // to resolve to one. With neither it is omitted, and the law's own "no
      // account was named" stands — a null placeholder would be read back as a
      // value the user typed.
      if (value || said) {
        slots[p.name] = {
          value: value ?? said,
          display: value ?? options.join(" | "),
          canonical: value ? `@${value}` : `?${field}`,
          // Absent while unresolved: D1 never picks, so there is no entity to name.
          entityId: value ?? undefined,
          confidence: 0, // asserted nowhere: this projection has no graded reading
          matches: options.map((id) => ({ entity: recordOf(world, p.type, id), score: UNRANKED, reason: `tied ${field} alternatives` })),
        };
      }
      continue;
    }
    payload[p.name] = cmd.params[p.name] ?? null;
  }

  return {
    input: state.revisions.find((r) => r.n === state.active)?.text ?? "",
    // "ambiguous" is the interpreter's own channel for a materially ambiguous
    // reading, and it is how the law is told not to expect a decision here.
    status: ambiguous ? "ambiguous" : "ok",
    nlclVersion: NCLL_VERSION,
    worldV: world.revision,
    ir: {
      intent: cmd.capability,
      family: "→",
      slots,
      payload,
      modifiers: {},
      // Natural language ≠ canonical command: this projection carries neither a
      // reading nor a canonical command string. Inventing one here would be a
      // second claim about the command, and the law reads neither.
      canonical: "",
      reading: "",
      // Confidence ≠ proof: this projection has no graded reading of its own.
      confidence: 0,
      provenance: { verbs: [] },
    } satisfies IR,
    alternatives: [],
    tokens: [],
    canonical: null,
    reading: null,
    confidence: 0,
    effects: [],
    suggestions: [],
    gaps: [],
    stages: [],
  };
}

/** The World record an alternative names, as the grounder would see it. Copied, never invented. */
function recordOf(world: World, type: string, id: string): EntityView {
  const rec =
    type === "account" ? world.accounts.find((r) => r.id === id)
    : type === "provider" ? world.providers.find((r) => r.id === id)
    : type === "model" ? world.models.find((r) => r.id === id)
    : undefined;
  return { id, type, label: rec?.label ?? id, names: rec?.names ?? [] };
}

/** Builds a Validation value. A constructor, not a second law: the state above is already decided. */
function sessionVerdict(state: Validation["state"], missing: string[], reasons: string[]): Validation {
  return { state, missing, reasons };
}

/** Optional helper for tests and tools: the raw interpreter output for one revision. */
export function rawInterpretation(state: D1State, n: number): Interpretation {
  return notImplemented("D1-025", `rawInterpretation(${n})`);
}

// ------------------------------------------------------------------ interpretation internals

/** Maximal word runs between hard boundaries (punctuation, a quote, a route preposition). */
function splitRuns(body: Token[]): { text: string; tokens: Token[] }[] {
  const runs: { text: string; tokens: Token[] }[] = [];
  let current: Token[] = [];
  const flush = (): void => {
    if (current.length > 0) runs.push({ text: current.map((t) => t.norm).join(" "), tokens: current });
    current = [];
  };
  for (const t of body) {
    if (t.kind === "word" && !ROUTE_PREPS.has(t.norm)) current.push(t);
    else flush();
  }
  flush();
  return runs;
}

/**
 * Ground an explicit target against the World. The best-scoring run wins; inside it
 * each kind resolves independently, and a tie is PRESERVED as alternatives rather
 * than collapsed — "Claude" names one Provider and both of its Accounts.
 */
function groundTarget(text: string, body: Token[], wm: WorldModel): Grounding {
  const none: Grounding = { mention: null, mentionTokens: new Set(), provider: null, account: null, model: null, candidates: {} };
  let best: { run: { text: string; tokens: Token[] }; score: number } | null = null;
  for (const run of splitRuns(body)) {
    const score = Math.max(
      ground(run.text, wm.entities, ["provider"]).primary?.score ?? 0,
      ground(run.text, wm.entities, ["account"]).primary?.score ?? 0,
      ground(run.text, wm.entities, ["model"]).primary?.score ?? 0,
    );
    if (score > 0 && (!best || score > best.score)) best = { run, score };
  }
  if (!best) return none;

  const mention = text.slice(best.run.tokens[0]!.start, best.run.tokens[best.run.tokens.length - 1]!.end);
  const candidates: Record<string, string[]> = {};
  const resolve = (kind: string): string | null => {
    const g = ground(best!.run.text, wm.entities, [kind]);
    if (!g.primary) return null;
    const tied = g.matches.filter((m) => Math.abs(m.score - g.primary!.score) < 0.01).map((m) => m.entity.id).sort();
    if (tied.length > 0) candidates[kind] = tied;
    return g.ambiguous ? null : g.primary.entity.id; // ambiguous stays null: D1 never picks for you
  };
  return {
    mention,
    mentionTokens: new Set(best.run.tokens.map((t) => t.i)),
    provider: resolve("provider"),
    account: resolve("account"),
    model: resolve("model"),
    candidates,
  };
}

/**
 * Which field a correction edits when one mention grounds to several kinds. An
 * Account derives its Provider and a Model derives its Provider (the declarations'
 * `derivedFrom`), so the narrower record wins and the dependent Provider is
 * re-derived downstream in `currentCommand`. A Provider on its own is the last resort.
 */
const CORRECTION_FIELDS = ["account", "model", "provider"] as const;

/**
 * D1-027: a typed correction, read as a SEMANTIC EDIT — not as a new command.
 *
 * The verb only opens it; what it names is grounded by the SAME `groundTarget` the
 * command path uses, so a typed correction and a click produce the identical
 * `SemanticEdit` value and reach the command through one semantic edit path. Only the
 * named field travels: capability, payload and params are not re-read here, so
 * "use Work" changes the Account and what is derived from it, and nothing else.
 *
 * It resolves fields; it grants nothing. A field a mention TIES on ("use Claude" over
 * two Accounts) gets no edit, so that field's tie stays visible while only that field
 * is left alone; a mention that names nothing the World holds produces no edit at all
 * and invents no id. The result is still bound to its revision: an obsolete revision's
 * correction is rejected before any edit is appended, so it can never overwrite
 * current state (D1-032).
 */
function correctionFor(
  text: string,
  tokens: Token[],
  syntaxNotes: string[],
  world: World,
  base: Omit<InterpretationResult, "kind">,
): InterpretationResult {
  const g = groundTarget(text, tokens.slice(1), toInterpreterWorld(world));
  const trace = { engine: INTERPRETER_VERSION, mention: g.mention, candidates: g.candidates, tokens: tokens.length, syntaxNotes } satisfies D1Trace;
  const field = CORRECTION_FIELDS.find((f) => g[f] !== null);
  const value = field ? g[field] : null;
  if (!field || value === null) {
    const ties = Object.entries(g.candidates)
      .filter(([, ids]) => ids.length > 1)
      .map(([f, ids]) => `${f} (${ids.join(", ")})`);
    const reason =
      g.mention === null ? `correction "${text}" names no target`
      : ties.length > 0 ? `correction "${text}" leaves a tie: ${ties.join("; ")}`
      : `correction "${text}" names no record the World holds`;
    return { ...base, kind: "unknown", detail: { ...trace, reason } };
  }
  // `via` is presentation provenance only (contract.ts), so typed and clicked corrections
  // keep one canonical command identity (D1-029).
  return { ...base, kind: "edit", edits: [{ kind: "select", field, value, via: "typed" }], detail: trace };
}

/** Prepositions that introduce a recipient, as opposed to a topic or purpose ("about", "for"). */
const TARGET_PREPS = new Set(["to", "via", "using", "through", "on"]);

/**
 * An explicit route that names nothing the World holds: "send 'x' to Gemini" and
 * "send hello to Gemini!" alike. The route is the contiguous word run right after the
 * LAST recipient preposition anywhere in the body; it ends at the first non-word token
 * (a terminator, a dash, a quote), so trailing text can neither disarm it nor join it.
 * A quoted span is one token, so prepositions inside a payload are never read here.
 * Read only when grounding found nothing; a named-but-unheld target is preserved,
 * never replaced. Errs toward refusing: "send hello on Monday" reads as a target.
 */
function unheldRoute(body: Token[]): { mention: string; tokens: Set<number> } | null {
  for (let i = body.length - 1; i >= 0; i--) {
    if (body[i]!.kind !== "word" || !TARGET_PREPS.has(body[i]!.norm)) continue;
    const words: Token[] = [];
    for (let j = i + 1; j < body.length && body[j]!.kind === "word"; j++) words.push(body[j]!);
    if (words.length === 0) continue;
    return { mention: words.map((t) => t.norm).join(" "), tokens: new Set([body[i]!.i, ...words.map((t) => t.i)]) };
  }
  return null;
}

/** Recipient prepositions that chain routes; "on" is left out so "on Monday" is not a second recipient. */
const CHAIN_PREPS = new Set(["to", "via", "using", "through"]);
/** Words and marks that join one recipient clause to the next: "to A and to B", "to A, then to B". */
const CONNECTORS = new Set(["and", "then", "or"]);

/**
 * The trailing chain of recipient clauses, read right to left: "to Gemini via work
 * claude" → [gemini, work claude]. Each link is a word run opened by a recipient
 * preposition; links may be joined by connectors. The chain stops at the first run
 * no preposition opens, so payload text ("explain this error: build failed") is never
 * read as a route.
 */
function routeChain(body: Token[], wm: WorldModel): Token[][] {
  const withBare = chainFrom(body, true);
  // Bare names join only after a link that names a held recipient; otherwise the text
  // before the punctuation is payload ("to explain this error: build failed").
  const last = withBare.links[withBare.links.length - 1];
  if (withBare.bare.length > 0 && !(last && isHeld(last.slice(1).filter((t) => !CONNECTORS.has(t.norm)), wm))) {
    return chainFrom(body, false).links;
  }
  if (withBare.links.length === 0) return [];
  const prep = last![0]!;
  return [...withBare.links, ...withBare.bare.map((words) => [prep, ...words])];
}

function chainFrom(body: Token[], takeBare: boolean): { links: Token[][]; bare: Token[][] } {
  const links: Token[][] = [];
  let i = body.length - 1;
  while (i >= 0 && body[i]!.kind !== "word") i--;
  // Bare names after the last link, joined by a comma or semicolon ("to work claude, Gemini").
  const bare: Token[][] = [];
  while (takeBare) {
    let j = i;
    const words: Token[] = [];
    while (j >= 0 && body[j]!.kind === "word" && !CHAIN_PREPS.has(body[j]!.norm)) words.unshift(body[j--]!);
    if (words.length === 0 || j < 0 || body[j]!.kind !== "punct" || ![",", ";"].includes(body[j]!.norm)) break;
    bare.unshift(words);
    i = j;
    while (i >= 0 && (body[i]!.kind === "punct" || (body[i]!.kind === "word" && CONNECTORS.has(body[i]!.norm)))) i--;
  }
  while (i >= 0) {
    const words: Token[] = [];
    while (i >= 0 && body[i]!.kind === "word" && !CHAIN_PREPS.has(body[i]!.norm)) words.unshift(body[i--]!);
    if (words.length === 0 || i < 0 || body[i]!.kind !== "word" || !CHAIN_PREPS.has(body[i]!.norm)) break;
    links.unshift([body[i]!, ...words]);
    i--;
    while (i >= 0 && (body[i]!.kind === "punct" || (body[i]!.kind === "word" && CONNECTORS.has(body[i]!.norm)))) i--;
  }
  return { links, bare };
}

/** Words that open a clause rather than name a recipient: "and say thanks", ", please". */
const CLAUSE_OPENERS = new Set([...REGISTER_VERBS, ...CHOOSE_VERBS, "say", "thank", "thanks", "please", "cheers", "regards"]);

/** A send verb opens a second send: the words it governs name a recipient ("and tell Gemini"). */
const SEND_VERBS = new Set(Object.values(COMMAND_VERBS).flat());

/** A grounding at least this strong names a record; "personal claude" → Provider at 0.55 does not. */
const HELD = 0.9;

function isHeld(name: Token[], wm: WorldModel): boolean {
  const text = name.map((t) => t.norm).join(" ");
  return (["provider", "account", "model"] as const).some((k) => (ground(text, wm.entities, [k]).primary?.score ?? 0) >= HELD);
}

/**
 * A recipient naming no Provider, Account or Model the World holds ("to Gemini").
 * One preposition may introduce several recipients ("to Gemini and work claude"), so
 * each link is split on connectors and every name is grounded on its own.
 */
function unheldLink(links: Token[][], wm: WorldModel): Token[] | null {
  for (const link of links) {
    const names: Token[][] = [[]];
    for (const t of link.slice(1)) {
      if (CONNECTORS.has(t.norm)) names.push([]);
      else names[names.length - 1]!.push(t);
    }
    for (const raw of names) {
      const name = raw.length > 1 && SEND_VERBS.has(raw[0]!.norm) ? raw.slice(1) : raw;
      if (name.length === 0 || CLAUSE_OPENERS.has(name[0]!.norm) || SEND_VERBS.has(name[0]!.norm)) continue;
      if (!isHeld(name, wm)) return [link[0]!, ...name];
    }
  }
  return null;
}

/**
 * The only remainders a held route may carry after it (COUNCIL R-20261008-014-1, rule
 * now): nothing, or exactly one of these courtesy tails. Anything else is refused — never
 * read as payload and never as a second route. Widening this set is an owner decision.
 */
const ALLOWED_TAILS = new Set(["", "and say thanks", ", thanks", ", please"]);

/** Verbs whose object is an addressee: "tell Gemini …" names who, not what. */
const ADDRESSEE_VERBS = new Set(["tell", "ask", "message"]);

/**
 * The exact-remainder rule for a route that grounded to a held recipient. It reads the
 * utterance by position, not by word lists: the payload is exactly the text before the
 * route (or the quote), the remainder after the route must be an allowed tail, a
 * tell/ask addressee before the route conflicts with it, and no unquoted word outside
 * the route span may ground to any record. A refusal names the offending text; it is
 * never silently dropped and never routed.
 */
function heldRouteRule(
  text: string,
  verb: string | null,
  body: Token[],
  g: Grounding,
  wm: WorldModel,
  world: World,
): { refuse?: string; payload?: string } | null {
  const pos = body.map((t, k) => (g.mentionTokens.has(t.i) ? k : -1)).filter((k) => k >= 0);
  if (pos.length === 0) return null;
  const first = pos[0]!;
  const route = new Set([g.provider, g.account, g.model, ...Object.values(g.candidates).flat()].filter((x): x is string => !!x));
  // The grounded run can swallow following words ("work claude and please tell Gemini").
  // The route span ends at the last word that belongs to a route record's own names in
  // the World; everything after it is remainder.
  const own = new Set(
    [...world.providers, ...world.accounts, ...world.models]
      .filter((r) => route.has(r.id))
      .flatMap((r) => [...r.names, r.label])
      .flatMap((n) => n.toLowerCase().split(/[^a-z0-9]+/))
      .filter(Boolean),
  );
  let last = first;
  while (last + 1 <= pos[pos.length - 1]! && own.has(body[last + 1]!.norm)) last++;
  // Outside the route span no unquoted word may name a record at all — another one, or
  // this one again (a repeated route would make the earlier route text payload).
  const otherRecord = (ts: Token[]): Token | undefined =>
    ts.find((t) => t.kind === "word" && (["provider", "account", "model"] as const).some((k) => {
      const m = ground(t.norm, wm.entities, [k]).primary;
      return !!m && m.score >= HELD;
    }));

  // Addressee form ("Ask Claude to explain …"): the route opens the body and what follows is the payload.
  if (!body.slice(0, first).some((t) => t.kind === "word" || t.kind === "quote")) {
    const stray = otherRecord(body.slice(last + 1));
    return stray ? { refuse: stray.norm } : null;
  }

  const prepPos = first > 0 && body[first - 1]!.kind === "word" && ROUTE_PREPS.has(body[first - 1]!.norm) ? first - 1 : first;
  const pre = body.slice(0, prepPos);
  const preWords = pre.filter((t) => t.kind === "word");
  const remainder = text.slice(body[last]!.end).trim().toLowerCase().replace(/[.!]$/, "").trim();

  if (verb && ADDRESSEE_VERBS.has(verb) && preWords.length > 0) return { refuse: preWords.map((t) => t.norm).join(" ") };
  if (!ALLOWED_TAILS.has(remainder)) return { refuse: remainder };
  const stray = otherRecord(pre);
  if (stray) return { refuse: stray.norm };

  const quoted = pre.find((t) => t.kind === "quote");
  if (quoted) return preWords.length > 0 ? { refuse: preWords.map((t) => t.norm).join(" ") } : { payload: quoted.quote ?? "" };
  const spanned = pre.filter((t) => t.kind === "word" || t.kind === "punct");
  while (spanned.length > 0 && spanned[spanned.length - 1]!.kind === "punct") spanned.pop();
  while (spanned.length > 0 && spanned[0]!.kind === "punct") spanned.shift();
  return { payload: spanned.length > 0 ? text.slice(spanned[0]!.start, spanned[spanned.length - 1]!.end) : "" };
}

/** The payload: a quoted span verbatim (its words can never retarget), else the unconsumed text. */
function payloadOf(text: string, body: Token[], consumed: Set<number>): string {
  const quoted = body.find((t) => t.kind === "quote");
  if (quoted) return quoted.quote ?? "";
  // A preposition that introduces the route belongs to the route, not to the payload.
  for (const t of body) {
    if (!consumed.has(t.i)) continue;
    const prev = body[body.indexOf(t) - 1];
    if (prev?.kind === "word" && ROUTE_PREPS.has(prev.norm)) consumed.add(prev.i);
  }
  const rest = body.filter((t) => !consumed.has(t.i));
  let first = 0;
  while (first < rest.length && (rest[first]!.kind === "punct" || (rest[first]!.kind === "word" && ROUTE_PREPS.has(rest[first]!.norm)))) first++;
  if (first >= rest.length) return "";
  return text.slice(rest[first]!.start, rest[rest.length - 1]!.end);
}

/** Assemble the draft: explicit target first, then the World's visible default, then compatibility. */
function draftFor(capability: string, decl: CapabilityDecl, world: World, g: Grounding, payload: string): DraftCommand {
  const compatible = compatibleAccounts(world, capability).map((a) => a.id).sort();
  const alternatives: Record<string, string[]> = { ...g.candidates };

  let account = g.account;
  // An explicit route the World does not hold ("to Gemini": mention present, no grounded
  // Account) is an unknown target, never an invitation to substitute the one compatible
  // Account. Default and single-compatible fill only a route nobody named.
  if (account === null && g.mention === null) {
    const standing = world.defaults[capability];
    const fromDefault = standing && world.accounts.some((a) => a.id === standing) ? standing : null;
    account = fromDefault ?? (compatible.length === 1 ? compatible[0]! : null);
    if (account === null && compatible.length > 1) alternatives.account = compatible;
  }
  // Provider is a separate record: named explicitly, else derived from the Account, else absent.
  const provider = g.provider ?? (account ? world.accounts.find((a) => a.id === account)?.provider ?? null : null);

  const params: Record<string, unknown> = {};
  for (const p of decl.params) if (p.semantic.startsWith("params.") && payload.length > 0) params[p.name] = payload;

  const kept: Record<string, string[]> = {};
  for (const [field, ids] of Object.entries(alternatives)) if (ids.length > 0) kept[field] = [...ids].sort();
  return { capability, provider, account, model: g.model, params, alternatives: kept, contextRefs: [] };
}

// ------------------------------------------------------------------ command internals

/** The realization this capability+provider can actually be executed by, or null. Capability ≠ Realization. */
function pickRealization(world: World, capability: string, provider: string | null): string | null {
  const usable = world.realizations
    .filter((r) => r.capability === capability && r.status === "available" && (provider === null || r.provider === provider))
    .map((r) => r.id)
    .sort();
  return usable[0] ?? null;
}

/** Consequence, not authority: what would leave, and to whom. It grants nothing. */
function consequenceOf(decl: CapabilityDecl, provider: string | null): UseCommand["consequence"] {
  if (!decl.consequence) return null;
  return {
    class: decl.consequence.class,
    crossesLocalBoundary: decl.consequence.crossesLocalBoundary,
    carries: [...decl.consequence.carries],
    to: provider, // the declared "route.provider", resolved; null while the route is unresolved
  };
}

function consentDecision(state: D1State): UseCommand["authority"]["decision"] {
  if (!state.consent) return "none";
  return state.consent.decision === "grant" ? "granted" : "denied";
}

/** D1 can only ever expect SIMULATED evidence; a declaration promising otherwise fails loudly. */
function expectedEvidenceOf(capability: string, realization: string | null): "SIMULATED" {
  const decls = loadDeclarations();
  const rz = realization
    ? decls.find((d): d is RealizationDecl => d.kind === "realization" && d.id === realization)
    : undefined;
  const classes = rz ? [rz.evidenceClass] : capabilityDecl(capability, decls)?.evidence.classes ?? [];
  if (classes.length === 0 || classes.some((c) => c !== "SIMULATED")) {
    throw new Error(`EVIDENCE_NOT_SIMULATED ${capability}: this port can only expect SIMULATED, declaration says [${classes.join(", ")}]`);
  }
  return "SIMULATED";
}

/** Unresolved requirements, one per declared-required field that is not resolved. Never silently collapsed. */
function unresolvedFor(decl: CapabilityDecl, cmd: UseCommand, world: World, trace: D1Trace | undefined): Unresolved[] {
  const out: Unresolved[] = [];
  for (const p of decl.params) {
    if (!p.required) continue;
    if (p.semantic in ROUTE_FIELD) {
      const field = ROUTE_FIELD[p.semantic as keyof typeof ROUTE_FIELD];
      const value = cmd[field];
      if (typeof value === "string" && value.length > 0) {
        if (field === "account" && !world.accounts.some((a) => a.id === value)) {
          out.push({ field, reason: "unknown", options: [] }); // named an Account the World does not hold
        } else if (field === "provider" && !world.providers.some((pr) => pr.id === value)) {
          out.push({ field, reason: "unknown", options: [] });
        }
        continue;
      }
      const tied = trace?.candidates[field] ?? [];
      // The only declared-required route field is `account`, so the compatible set is the choice on offer.
      const compatible = compatibleAccounts(world, cmd.capability).map((a) => a.id).sort();
      const stale = world.accounts.filter((a) => a.freshness === "stale").map((a) => a.id).sort();
      // A named route that grounded to nothing ("to Gemini") is an unknown target; offering
      // the compatible set here would invite the retarget draftFor refuses.
      if (tied.length <= 1 && trace?.mention != null) { out.push({ field, reason: "unknown", options: [] }); continue; }
      if (tied.length > 1) out.push({ field, reason: "ambiguous", options: [...tied].sort() });
      else if (compatible.length > 0) out.push({ field, reason: "missing", options: compatible });
      else if (stale.length > 0) out.push({ field, reason: "stale", options: stale });
      else if (world.accounts.length > 0) out.push({ field, reason: "incompatible", options: [] });
      else out.push({ field, reason: "missing", options: [] });
      continue;
    }
    if (p.semantic.startsWith("params.") && !String(cmd.params[p.name] ?? "").trim()) {
      out.push({ field: p.name, reason: "missing", options: [] });
    }
  }
  // A chosen route may never disagree with itself.
  if (cmd.account && cmd.provider) {
    const rec = world.accounts.find((a) => a.id === cmd.account);
    if (rec && rec.provider !== cmd.provider) {
      out.push({ field: "account", reason: "incompatible", options: world.accounts.filter((a) => a.provider === cmd.provider).map((a) => a.id).sort() });
    }
  }
  return out;
}