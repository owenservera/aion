import type { McpClientAdapter } from './mcp-client-adapter.js'
import { type SandboxPermissions, SandboxRunner } from './sandbox-runner.js'
import type { TelemetryAudit } from './telemetry-audit.js'
import { type UnifiedCapability, UnifiedCapabilityRegistry } from './unified-registry.js'

// ── Types ──────────────────────────────────────────────────────────────────

export type LiveHandlerKind = 'mcp' | 'http' | 'inline'

export interface LiveHandlerSpec {
  kind: LiveHandlerKind
  serverId?: string // mcp
  toolName?: string // mcp
  url?: string // http + mcp (connect URL for the MCP server)
  method?: string // http
  headers?: Record<string, string> // http
  bodyTemplate?: string // http ({{key}} mustache over input)
  code?: string // inline (runs in SandboxRunner)
}

export interface LiveCapabilitySpec {
  slug: string
  name: string
  description: string
  handlerSpec: LiveHandlerSpec
  inputSchema: Record<string, unknown>
  surfaces: Array<'cli' | 'ui' | 'workflow' | 'mcp' | 'api'>
  registeredBy: string
}

export interface LiveCapabilityRecord extends LiveCapabilitySpec {
  id: string
  version: number
  isActive: boolean
  registeredAt: number
}

export interface LiveCapabilityStore {
  create(record: LiveCapabilityRecord): Promise<void>
  listActive(): Promise<LiveCapabilityRecord[]>
  get(id: string): Promise<LiveCapabilityRecord | null>
  revoke(id: string): Promise<void>
}

// Minimal in-memory audit store for inline handler execution (no DB dependency
// inside the registry). A real deployment injects a durable SandboxAuditStore.
const memoryAuditStore: SandboxAuditStore = {
  async create(_row: SandboxAuditRow): Promise<void> {},
  async list(): Promise<SandboxAuditRow[]> {
    return []
  },
}

// ── Registry ────────────────────────────────────────────────────────────────

export class LiveCapabilityRegistry extends UnifiedCapabilityRegistry {
  private readonly sandbox: typeof SandboxRunner.prototype
  private readonly mcp?: McpClientAdapter
  private readonly audit?: TelemetryAudit

  constructor(
    private readonly liveStore: LiveCapabilityStore,
    private readonly bus: CapabilityEventBus,
    sandbox?: InstanceType<typeof SandboxRunner>,
    mcp?: McpClientAdapter,
    audit?: TelemetryAudit,
  ) {
    super()
    this.sandbox = sandbox ?? new SandboxRunner(memoryAuditStore)
    this.mcp = mcp
    this.audit = audit
  }

  /** Register a runtime capability: persist + hot-reload into the registry. */
  async registerLive(spec: LiveCapabilitySpec): Promise<string> {
    const id = newId()
    const cap = this.specToUnifiedCapability(spec, id)
    this.register(cap)
    const record: LiveCapabilityRecord = {
      ...spec,
      id,
      version: 1,
      isActive: true,
      registeredAt: Date.now(),
    }
    await this.liveStore.create(record)
    this.bus.emit({
