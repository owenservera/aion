export type SessionState =
  | 'creating' // Session is being initialized
  | 'active' // Session is active and healthy
  | 'idle' // Session has been idle beyond threshold
  | 'suspended' // Session is suspended (resource conservation)
  | 'recovering' // Session is being recovered after failure
  | 'terminated' // Session has been terminated

/** Session type discriminator */
export type SessionType = 'provider' | 'conversation' | 'autonomous' | 'workflow'

/** Session configuration */
export interface SessionConfig {
  /** Type of session */
  type: SessionType
  /** Provider/account/conversation this session belongs to */
  entityId: string
  /** Provider slug (for provider sessions) */
  providerSlug?: string
  /** Maximum idle time before suspension (ms) */
  idleTimeoutMs?: number
  /** Heartbeat interval (ms) */
  heartbeatIntervalMs?: number
  /** Maximum number of recovery attempts */
  maxRecoveryAttempts?: number
  /** Custom metadata */
  metadata?: Record<string, unknown>
}

/** Session state record (persisted) */
export interface SessionRecord {
  /** Unique session ID */
  sessionId: string
  /** Session type */
  type: SessionType
  /** Associated entity ID */
  entityId: string
  /** Current state */
  state: SessionState
  /** Creation timestamp */
  createdAt: number
  /** Last activity timestamp */
  lastActiveAt: number
  /** Last heartbeat timestamp */
  lastHeartbeatAt: number
  /** Number of recovery attempts */
  recoveryAttempts: number
  /** Custom metadata */
  metadata: Record<string, unknown>
  /** State data (serialized) */
  stateData?: Record<string, unknown>
}

/** Session events emitted to the event bus */
export interface SessionEvents {
  'session:created': { sessionId: string; type: SessionType; entityId: string }
  'session:state_changed': { sessionId: string; from: SessionState; to: SessionState }
  'session:heartbeat': { sessionId: string; latencyMs: number }
  'session:idle': { sessionId: string; idleDurationMs: number }
  'session:recovered': { sessionId: string; attempts: number }
  'session:terminated': { sessionId: string; reason: string }
  'session:failed': { sessionId: string; error: string }
}

/** Options for the session lifecycle manager */
export interface SessionLifecycleOptions {
  /** Default idle timeout (ms) — default 30 minutes */
  defaultIdleTimeoutMs?: number
  /** Default heartbeat interval (ms) — default 30 seconds */
  defaultHeartbeatIntervalMs?: number
  /** Maximum concurrent sessions */
  maxConcurrentSessions?: number
  /** How often to scan for idle sessions (ms) — default 60 seconds */
  idleScanIntervalMs?: number
}

/** Recovery strategy */
export type RecoveryStrategy = 'reconnect' | 'recreate' | 'fail'

/** Hook for session lifecycle events */
export interface SessionLifecycleHooks {
  onCreate?: (session: SessionRecord) => Promise<void>
  onStateChange?: (session: SessionRecord, from: SessionState, to: SessionState) => Promise<void>
  onHeartbeat?: (session: SessionRecord) => Promise<void>
  onTerminate?: (session: SessionRecord) => Promise<void>
  onRecover?: (session: SessionRecord, strategy: RecoveryStrategy) => Promise<boolean>
}

// ── Valid state transitions ───────────────────────────────────────────────

const VALID_TRANSITIONS: Record<SessionState, readonly SessionState[]> = {
  creating: ['active', 'terminated'],
  active: ['idle', 'suspended', 'recovering', 'terminated'],
  idle: ['active', 'suspended', 'recovering', 'terminated'],
  suspended: ['active', 'recovering', 'terminated'],
  recovering: ['active', 'idle', 'suspended', 'terminated'],
  terminated: [],
}
