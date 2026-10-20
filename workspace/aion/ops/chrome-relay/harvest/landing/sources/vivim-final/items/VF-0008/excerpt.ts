export type CapabilitySurface = 'cli' | 'ui' | 'workflow' | 'mcp' | 'api'

export interface CapabilityContext {
  conversationId?: string
  providerId?: string
  slaveId?: string
  userId?: string
  metadata: Record<string, unknown>
}

export interface UnifiedCapability {
  id: string
  slug: string
  name: string
  description: string
  category: string
  surfaces: CapabilitySurface[]
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  handler: (input: Record<string, unknown>, ctx: CapabilityContext) => Promise<unknown>
  cliCommand?: { name: string; aliases: string[]; examples: string[] }
  ui?: {
    component: string
    position: string
    group?: string
    order: number
    icon?: string
    shortcut?: string
    requiresConfirmation?: boolean
  }
  uiAction?: { component: string; position: string; order: number }
  workflowNodeType?: string
  mcpToolName?: string
  apiEndpoint?: { method: string; path: string }
  isAsync: boolean
  requiresConfirmation: boolean
  tags: string[]
  isComposite?: boolean
  compositeId?: string
}

// ── Validation helpers ────────────────────────────────────────────────────

function validateCapability(cap: UnifiedCapability): void {
  if (!cap.id || !cap.slug || !cap.name) {
    throw new EngineError('Capability must have id, slug, and name')
  }
  if (typeof cap.handler !== 'function') {
    throw new EngineError(`Capability ${cap.id} must have a handler function`)
  }
  if (cap.surfaces.includes('cli') && !cap.cliCommand) {
    throw new EngineError(`Capability ${cap.id} exposed to CLI must have cliCommand`)
  }
  if (cap.surfaces.includes('mcp') && !cap.mcpToolName) {
    throw new EngineError(`Capability ${cap.id} exposed to MCP must have mcpToolName`)
  }
  if (cap.surfaces.includes('api') && !cap.apiEndpoint) {
    throw new EngineError(`Capability ${cap.id} exposed to API must have apiEndpoint`)
  }
  if (cap.surfaces.includes('ui') && !cap.ui && !cap.uiAction) {
    throw new EngineError(`Capability ${cap.id} exposed to UI must have ui or uiAction block`)
  }
}

// ── UnifiedCapabilityRegistry ─────────────────────────────────────────────

export class UnifiedCapabilityRegistry {
  private capabilities = new Map<string, UnifiedCapability>()
  private slugIndex = new Map<string, UnifiedCapability>()
  private progResolver?: (slug: string) => Promise<UnifiedCapability | null>

  /** Set a resolver for harness-program capabilities (prog-* slugs). */
  setProgramResolver(fn: (slug: string) => Promise<UnifiedCapability | null>): void {
    this.progResolver = fn
  }

  register(capability: UnifiedCapability): void {
    validateCapability(capability)
    if (this.capabilities.has(capability.id)) {
      throw new EngineError(`Capability ${capability.id} already registered`)
    }
    if (this.slugIndex.has(capability.slug)) {
      throw new EngineError(`Slug ${capability.slug} already registered`)
    }
    this.capabilities.set(capability.id, capability)
    this.slugIndex.set(capability.slug, capability)
  }

