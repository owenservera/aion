export type StreamEventKind =
  | 'thinking' // agent is processing
  | 'text' // text token
  | 'code' // code block
  | 'tool_use' // tool invocation
  | 'tool_result' // tool output
  | 'image' // image block
  | 'citation' // citation block
  | 'error' // error block
  | 'meta' // metadata block
  | 'progress' // progress update
  | 'status' // status change
  | 'complete' // stream finished
  | 'cost' // token cost update
  | 'heartbeat' // keepalive

export interface StreamEvent {
  kind: StreamEventKind
  /** Incremental index (0-based). */
  index: number
  /** Text content (for 'text'/'code'/'thinking'/'error'). */
  content?: string
  /** Language hint (for 'code'). */
  language?: string
  /** Tool name (for 'tool_use'/'tool_result'). */
  toolName?: string
  /** Tool input/output (for 'tool_use'/'tool_result'). */
  input?: Record<string, unknown>
  output?: unknown
  /** Image URL (for 'image'). */
  url?: string
  alt?: string
  /** Citation source (for 'citation'). */
  source?: string
  /** Progress (for 'progress'). */
  step?: number
  total?: number
  description?: string
  /** Status (for 'status'). */
  status?: string
  /** Cost (for 'cost'). */
  tokensIn?: number
  tokensOut?: number
  costUsd?: number
  /** Error (for 'error'). */
  message?: string
  code?: string
  /** Trace id for correlation. */
  traceId?: string
  timestamp: number
}

export type StreamState =
  | 'idle'
  | 'connecting'
  | 'streaming'
  | 'thinking'
  | 'paused'
  | 'complete'
  | 'error'

export interface StreamSession {
  id: string
  nodeId: string
  capabilityId: string
  state: StreamState
  /** All events received so far. */
  events: StreamEvent[]
  /** Accumulated text (from 'text' events). */
  accumulatedText: string
  /** Total tokens in/out. */
  tokensIn: number
  tokensOut: number
  /** Total cost in USD. */
  costUsd: number
  /** Started at (ms). */
  startedAt: number
  /** Last event at (ms). */
  lastEventAt: number
  /** Completed at (ms). */
  completedAt?: number
  /** Error message (if state='error'). */
  error?: string
  /** Trace id. */
  traceId: string
}

/** Visual indicator for stream state. */
export const STREAM_STATE_INDICATOR: Record<
  StreamState,
  { icon: string; color: string; label: string }
> = {
  idle: { icon: '', color: '#9ca3af', label: 'Idle' },
  connecting: { icon: '◐', color: '#f59e0b', label: 'Connecting…' },
  streaming: { icon: '', color: '#0ea5e9', label: 'Streaming' },
  thinking: { icon: '', color: '#8b5cf6', label: 'Thinking' },
  paused: { icon: '', color: '#6b7280', label: 'Paused' },
  complete: { icon: '', color: '#10b981', label: 'Complete' },
  error: { icon: '', color: '#ef4444', label: 'Error' },
}