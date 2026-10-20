/** Provider health status */
export type ProviderHealthStatus =
  | 'unknown' // Not yet checked
  | 'healthy' // Responding normally
  | 'degraded' // Partially functional (e.g., rate limited)
  | 'unhealthy' // Not responding
  | 'offline' // Intentionally disabled

/** Provider capability descriptor */
export interface ProviderCapabilityDescriptor {
  /** Unique capability slug (e.g., 'chat', 'vision', 'code') */
  capabilityId: string
  /** Human-readable name */
  name: string
  /** Whether this capability is currently available */
  available: boolean
  /** Optional constraints (e.g., max tokens, rate limits) */
  constraints?: Record<string, unknown>
}

/** Health check result */
export interface HealthCheckResult {
  status: ProviderHealthStatus
  /** Timestamp of the check */
  checkedAt: number
  /** Latency in ms (0 if not reachable) */
  latencyMs: number
  /** Optional details about the health status */
  details?: string
  /** Next suggested check time */
  nextCheckAt?: number
}

/** Provider metadata */
export interface ProviderMetadata {
  /** Unique slug (e.g., 'claude', 'chatgpt', 'gemini') */
  slug: string
  /** Human-readable name */
  name: string
  /** Provider type (LLM, search, etc.) */
  type: string
  /** Version of this plugin */
  version: string
  /** Supported surface types */
  surfaces: Array<'cli' | 'ui' | 'api' | 'mcp' | 'workflow'>
  /** Tags for categorization */
  tags: string[]
}

/** Context provided to plugin during initialization */
export interface ProviderPluginContext {
  eventBus: CapabilityEventBus
  config: Record<string, unknown>
  /** Register a capability for this provider */
  registerCapability: (descriptor: ProviderCapabilityDescriptor) => void
  /** Unregister a capability */
  unregisterCapability: (capabilityId: string) => void
}

/** The core provider plugin interface */
export interface ProviderPlugin {
  /** Provider metadata — must be available before init */
  readonly metadata: ProviderMetadata

  /**
   * Initialize the provider. Called during server bootstrap.
   * Register capabilities, start health monitoring, etc.
   */
  init(context: ProviderPluginContext): Promise<void>

  /**
   * Start accepting traffic. Called after all providers are initialized.
   */
  start?(): Promise<void>

  /**
   * Perform a health check on this provider.
   */
  healthCheck(): Promise<HealthCheckResult>

  /**
   * List all capabilities this provider offers.
   */
  getCapabilities(): ProviderCapabilityDescriptor[]

  /**
   * Graceful shutdown. Clean up resources, stop timers, etc.
   */
  stop(): Promise<void>

  /**
   * Reset provider state (e.g., clear caches, re-authenticate).
   * Used for error recovery.
   */
  reset?(): Promise<void>
}

/** Plugin factory — modules export this to register a provider */
export type ProviderPluginFactory = () => ProviderPlugin
