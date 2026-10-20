export type EntityType =
  | 'account'
  | 'slave'
  | 'conversation'
  | 'binding'
  | 'capability'
  | 'config'
  | 'automation'

export interface StateTransitionInput {
  entityType: EntityType
  entityId: string
  fromState: string | null
  toState: string
  trigger: string
  metadata?: Record<string, unknown>
}

export interface StateTransitionRow {
  id: string
  entityType: EntityType
  entityId: string
  fromState: string | null
  toState: string
  trigger: string
  metadataJson: string
  ts: number
}

export interface StateTransitionStore {
  create(input: StateTransitionRow): Promise<StateTransitionRow>
  listByEntity(
    entityType: string,
    entityId: string,
    opts?: { limit?: number; since?: number },
  ): Promise<StateTransitionRow[]>
  listByType(
    entityType: string,
    opts?: { limit?: number; since?: number },
  ): Promise<StateTransitionRow[]>
}

// ── Engine ─────────────────────────────────────────────────────────────────

export class StateTransitionEngine {
  constructor(private store: StateTransitionStore) {}

  async record(input: StateTransitionInput): Promise<StateTransitionRow> {
    const row: StateTransitionRow = {
      id: newId(),
      entityType: input.entityType,
      entityId: input.entityId,
      fromState: input.fromState,
      toState: input.toState,
      trigger: input.trigger,
      metadataJson: JSON.stringify(input.metadata ?? {}),
      ts: Date.now(),
    }
    return this.store.create(row)
  }

  async query(
