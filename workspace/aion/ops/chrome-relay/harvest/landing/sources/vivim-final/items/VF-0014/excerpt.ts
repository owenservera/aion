// src/engines/observation-tap.ts
// ObservationTap — CDP observation session for DOM mutations, network events, console logs

export interface ObservationOptions {
  domMutations?: boolean
  networkEvents?: boolean
  consoleLogs?: boolean
  pageLifecycle?: boolean
  throttleMs?: number
}

export interface ObservationEvent {
  type: 'dom_mutation' | 'network_event' | 'console_log' | 'page_lifecycle'
  timestamp: number
  data: Record<string, unknown>
}

export class ObservationTap {
  private active = new Map<string, ObservationOptions>()
  private listeners = new Map<string, Array<(event: ObservationEvent) => void>>()

  async start(slaveId: string, opts?: ObservationOptions): Promise<void> {
    this.active.set(slaveId, opts ?? {})
    this.listeners.set(slaveId, [])
  }

  async stop(slaveId: string): Promise<void> {
    this.active.delete(slaveId)
    this.listeners.delete(slaveId)
  }

  isActive(slaveId: string): boolean {
    return this.active.has(slaveId)
  }

  onEvent(slaveId: string, handler: (event: ObservationEvent) => void): () => void {
    const handlers = this.listeners.get(slaveId) ?? []
    handlers.push(handler)
    this.listeners.set(slaveId, handlers)
    return () => {
      const idx = handlers.indexOf(handler)
      if (idx >= 0) handlers.splice(idx, 1)
    }
  }
}