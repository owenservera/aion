export type ActionClassification =
  | 'read'
  | 'write'
  | 'navigate'
  | 'destructive'
  | 'communication'
  | 'financial'
  | 'system'

export type ExecutorId =
  | 'file'
  | 'browser'
  | 'email'
  | 'provider-llm'
  | 'capability'
  | 'system'
  | 'conversation'
  | 'workflow'
  | 'app'
  | 'canvas'
  | 'memory'
  | 'llm'
  | 'web'
  | 'generic-browser'
  | 'opencode'

export interface NLCContext {
  workspacePath?: string
  providerId?: string
  accountId?: string
  conversationId?: string
  slaveId?: string
  userId?: string
  surface: NLCLSurface
  metadata: Record<string, unknown>
  canvasState?: Record<string, unknown>
  activeSessionId?: string

  // ── Response Interpreter Telemetry (populated by LayeredResolver) ─────
  /** Which layer resolved the intent (deterministic/fuzzy/semantic/llm/none). */
  resolutionLayer?: 'deterministic' | 'fuzzy' | 'semantic' | 'classifier' | 'llm' | 'none'
  /** Confidence score from the resolver (0-1). */
  confidence?: number

  // ── Dialogue Continuity (populated by DialogueSessionStore) ──────────
  /** Number of turns in this dialogue session. */
  dialogueTurnCount?: number
  /** Entity names from recent turns (for continuity hints). */
  recentEntities?: string[]
}

/** Raw request context from HTTP/CLI transport for bindContext. */
export interface RawRequestContext {
  conversationId?: string
  providerId?: string
  slaveId?: string
  userId?: string
  surface?: NLCLSurface
  metadata?: Record<string, unknown>
  canvasState?: Record<string, unknown>
  activeSessionId?: string
}

export interface CommandResult {
  ok: boolean
  intent: string
  output?: unknown
  text?: string
  error?: string
  latencyMs: number
  traceId: string
  followUp?: string
  requiresConfirmation?: boolean
  classification: ActionClassification
  /** Unit 25.1 — resolved UnifiedCapability id (or slug) so downstream transports can act directly. */
  capabilityId?: string
  /** Phase 2 — canonical ActionPlan produced for this command (if applicable). */
  actionPlan?: import('../action-plan.js').ActionPlan
  /** Phase 2 — grounded references resolved from the user's natural language. */
  groundedRefs?: import('../action-plan.js').GroundedReference[]
  confirmation?: {
    token: string
    prompt: string
  }
  clarification?: {
    prompt: string
    missing?: string[]
    ambiguous?: string[]
    options?: string[]
  }
}

export interface ParsedIntent {
  patternId: string
  intent: string
  input: Record<string, unknown>
  confidence: number
  rawInput: string
  matchedPattern: string
  alternatives: ParsedIntent[]
  resolvedAt: number
  /** Unit 25.1 — resolved UnifiedCapability id for registry execution. */
  capabilityId?: string
  /** Action classification of the matched capability (drives HITL approval gating). */
  classification?: ActionClassification
  /** Set by the engine when the NLCL confirmation gate has already minted/verified a token
   * (i.e. this is a resumed, already-confirmed intent). The ExecutionKernel treats such plans as
