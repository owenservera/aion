// D1 Port v0 — the interface hypothesis the D1 gates are written against.
//
// STATUS: candidate interoperability agreement (a "Lock" in the project's own
// vocabulary), not Ω architecture. It exists so that many workers can build
// D1 in parallel against one executable definition of done. Change it when
// evidence says so — but change the gates in the same commit, and expect the
// ratchet to flag every promoted gate whose file changed (SPEC_CHANGED).
//
// Distinctions this contract keeps structurally separate:
//   Provider ≠ Account ≠ Model ≠ Session      (separate record kinds and fields)
//   Capability ≠ Realization                   (separate ids; realization is chosen, not implied)
//   Natural language ≠ canonical command       (InterpretationResult vs UseCommand)
//   Command ≠ authority; consequence ≠ authority (separate fields; consent is its own action)
//   Evidence ≠ authority; simulation ≠ live    (Receipt.evidenceClass is the literal "SIMULATED")
//   World ≠ Surface                            (Projection is derived; the UI dispatches Actions)

// ------------------------------------------------------------------ World

/** D1 accepts exactly one source class. Observed/live state is not representable here on purpose. */
export interface Provenance {
  class: "synthetic-fixture";
  label: string;   // shown to humans: must say it is synthetic
  author: string;
}

export interface ProviderRec { id: string; label: string; names: string[] }

export interface AccountRec {
  id: string;
  provider: string;            // ProviderRec.id
  label: string;
  names: string[];             // grounding aliases, lowercase
  freshness: "fresh" | "stale" | "unknown";
  origin: "fixture" | "registration";
}

export interface ModelRec { id: string; provider: string; label: string; names: string[] }

export interface RealizationRec {
  id: string;                  // "d1-virtual.prompt.send@1"
  capability: string;          // "prompt.send@1"
  provider: string;            // which Provider's Accounts it can serve
  status: "available" | "unavailable";
}

export type AuthorityState = "allowed" | "consent-required" | "denied";
export type SimulationMode = "succeed" | "fail";

export interface WorldFixture {
  schema: "d1.world/0";
  id: string;
  title: string;
  provenance: Provenance;
  providers: ProviderRec[];
  accounts: AccountRec[];
  models: ModelRec[];
  capabilities: string[];
  realizations: RealizationRec[];
  authority: Record<string, AuthorityState>;
  /** Visible standing defaults: capability → account id. Explicit target always wins. */
  defaults: Record<string, string>;
  /** How the virtual realization behaves for this World. */
  simulation: Record<string, SimulationMode>;
}

export interface World extends WorldFixture {
  /** Increments on every accepted World delta (registration). */
  revision: number;
  /** Content digest of everything above (excluding this field). */
  digest: string;
}

export interface WorldDelta {
  addProviders?: ProviderRec[];
  addAccounts?: AccountRec[];
}

// ------------------------------------------------------------------ interpretation

export type InterpretationKind = "command" | "registration" | "edit" | "query" | "unknown";

export interface DraftCommand {
  capability: string;
  provider: string | null;
  account: string | null;
  model: string | null;
  params: Record<string, unknown>;
  /** field → candidate ids preserved from grounding (never silently collapsed). */
  alternatives: Record<string, string[]>;
  contextRefs: string[];
}

export interface SemanticEdit {
  kind: "select";
  field: "provider" | "account" | "model";
  value: string;
  /** Presentation provenance only. MUST NOT affect the canonical command digest. */
  via: "typed" | "clicked";
}

export interface InterpretationResult {
  revision: number;
  /** World the interpretation was computed against. A result for another World is rejected. */
  worldDigest: string;
  kind: InterpretationKind;
  draft?: DraftCommand;          // kind = command
  worldDelta?: WorldDelta;       // kind = registration
  edits?: SemanticEdit[];        // kind = edit (typed correction, e.g. "use Work")
  /** Interpreter trace/output kept for inspection and replay. Never authority. */
  detail?: unknown;
  interpreterVersion: string;
}

// ------------------------------------------------------------------ command

export type Lifecycle =
  | "empty" | "interpreted"
  | "needs-choice" | "needs-info" | "unknown" | "unavailable" | "refused" | "needs-consent" | "ready"
  | "executing" | "completed-simulated" | "failed-simulated" | "uncertain-simulated";

export type ValidationState = Extract<Lifecycle, "needs-choice" | "needs-info" | "unknown" | "unavailable" | "refused" | "needs-consent" | "ready">;

export interface Unresolved {
  field: string;
  reason: "missing" | "ambiguous" | "unknown" | "incompatible" | "stale";
  options: string[];
}

export interface Consequence {
  class: "external-transfer" | "local-only";
  crossesLocalBoundary: boolean;
  /** Which semantic fields would leave the boundary, e.g. ["params.prompt"]. */
  carries: string[];
  to: string | null;             // provider id
}

export interface UseCommand {
  capability: string;
  provider: string | null;
  account: string | null;
  model: string | null;
  params: Record<string, unknown>;
  contextRefs: string[];
  basis: { worldDigest: string; sourceRevision: number; registryVersion: string; interpreterVersion: string };
  unresolved: Unresolved[];
  consequence: Consequence | null;
  authority: { requirement: AuthorityState; decision: "none" | "granted" | "denied" };
  realization: string | null;
  expectedEvidence: "SIMULATED";
}

export interface Validation { state: ValidationState; missing: string[]; reasons: string[] }

export interface Committed { command: UseCommand; digest: string; revision: number; worldDigest: string }

// ------------------------------------------------------------------ execution / evidence

export interface ExecEvent {
  seq: number;
  type: "execution.start" | "execution.attempt" | "execution.result";
  commandDigest: string;
  worldDigest: string;
  revision: number;
  realization: string;
  outcome?: "succeeded" | "failed";
}

export interface Receipt {
  schema: "d1.receipt/0";
  evidenceClass: "SIMULATED";
  maturity: "simulation";
  source: { kind: "virtual-realization"; realization: string; version: string };
  commandDigest: string;
  worldDigest: string;
  revision: number;
  outcome: "succeeded" | "failed" | "uncertain";
  response?: { text: string; synthetic: true };
  eventsDigest: string;
  digest: string;
}

// ------------------------------------------------------------------ session

export type Action =
  | { type: "input"; text: string }
  | { type: "interpretation"; result: InterpretationResult }
  | { type: "edit"; revision: number; edit: SemanticEdit }
  | { type: "consent"; decision: "grant" | "deny"; commandDigest: string }
  | { type: "commit" }
  | { type: "execute" };

export interface D1State {
  initialWorld: World;
  world: World;
  revisions: Array<{ n: number; text: string }>;
  active: number;                  // 0 = no input yet
  pending: number[];               // revisions awaiting interpretation
  interpretation: InterpretationResult | null;
  /** The command interpretation edits apply to. */
  draft: { revision: number; worldDigest: string; result: InterpretationResult } | null;
  edits: Array<{ revision: number; edit: SemanticEdit }>;
  consent: { decision: "grant" | "deny"; commandDigest: string } | null;
  committed: Committed | null;
  events: ExecEvent[];
  receipt: Receipt | null;
  rejected: Array<{ action: Action; reason: string }>;
  log: Action[];
}

// ------------------------------------------------------------------ projection

export interface RouteSlot { id: string | null; label: string | null; state: "resolved" | "unresolved" | "optional" | "absent" }

export interface Projection {
  revision: number;
  worldDigest: string;
  input: string;
  lifecycle: Lifecycle;
  reading: string | null;
  route: { capability: RouteSlot; provider: RouteSlot; account: RouteSlot; model: RouteSlot; realization: RouteSlot };
  unresolved: Array<{ field: string; reason: Unresolved["reason"]; options: Array<{ id: string; label: string; action: Action }> }>;
  consequence: Consequence | null;
  /** Ranked help topic ids relevant to the active semantic state. */
  help: HelpQuestion[];
  /** Semantic actions currently available (consent, commit, execute). The UI has no other path. */
  actions: Action[];
  commandDigest: string | null;
  evidenceClass: "SIMULATED";
  treatment: string;
  /** Treatment-specific presentation hints. Free to vary; never semantic. */
  presentation: Record<string, unknown>;
}

// ------------------------------------------------------------------ reflection / help

export interface SourceFile { path: string; text: string }
export interface SourceAnchor { path: string; digest: string; pointer: string }

export type ReflectionKind = "capability" | "parameter" | "realization" | "action" | "consequence" | "evidence-class" | "semantic-type";

export interface ReflectionItem { id: string; kind: ReflectionKind; facts: Record<string, unknown>; anchor: SourceAnchor }
export interface ReflectionEdge { from: string; to: string; rel: "has-param" | "realized-by" | "has-consequence" | "emits-evidence" | "edits-field" | "of-type" }

export interface ReflectionGraph {
  schema: "d1.reflection/0";
  readOnly: true;
  items: ReflectionItem[];
  edges: ReflectionEdge[];
  gaps: Array<{ subject: string; missing: string }>;
  digest: string;
}

export type HelpQuestion = "what-is-provider" | "which-accounts" | "why-choose" | "what-is-capability" | "what-leaves-boundary" | "what-is-simulated" | "why-ready";

export type Ground =
  | { kind: "reflection"; item: string; anchor: SourceAnchor }
  | { kind: "world"; record: string; worldDigest: string }
  | { kind: "state"; field: string; revision: number };

export interface HelpClaim { text: string; grounds: Ground[] }
export interface HelpAnswer { question: HelpQuestion; claims: HelpClaim[]; unknowns: string[] }

// ------------------------------------------------------------------ replay / experiments

export interface ReplayBundle {
  schema: "d1.replay/0";
  world: WorldFixture;
  versions: { registry: string; interpreter: string; realization: string };
  /** Inputs, semantic edits, consent decisions, commit/execute — not interpreter outputs. */
  actions: Action[];
  expected: { commandDigest: string | null; evidenceDigest: string | null };
}

export interface ReplayResult { commandDigest: string | null; evidenceDigest: string | null; finalLifecycle: Lifecycle }

export interface SemanticDifference { path: string; before: unknown; after: unknown }

export interface Scenario {
  id: string;
  category: "false-ready" | "explicit-target" | "ambiguity" | "revision" | "registration" | "unknown-target" | "quoted-payload";
  world: string;
  inputs: string[];
  expect: { lifecycleNot?: Lifecycle[]; lifecycle?: Lifecycle; account?: string | null; ambiguousAccounts?: string[] };
}

export interface ScenarioReport {
  metrics: { falseReadyRate: number; wrongTargetRate: number; ambiguityHonesty: number; revisionStability: number };
  results: Array<{ id: string; ok: boolean; observed: unknown }>;
}
