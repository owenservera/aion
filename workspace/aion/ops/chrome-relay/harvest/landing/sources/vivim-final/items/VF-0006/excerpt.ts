export type PlanTier = 'free' | 'pro' | 'max' | 'enterprise'

export type OverrideSource = 'global' | 'tier' | 'provider'

export interface AvailabilityGating {
  requiresLogin?: boolean
  requiresChrome?: boolean
  requiresProvider?: string
  requiresModel?: string
}

export interface CapabilityResolutionOptions {
  /** Active binding capability ids for the provider. Fetched from store if omitted. */
  activeBindings?: string[]
  /** Flat context used to evaluate existential rules. */
  conversationContext?: Record<string, unknown>
}

export interface ResolvedCapability {
  id: string
  slug: string
  name: string
  category: string
  // UI contract
  uiComponent: string
  uiLabel: string
  uiIcon: string
  uiPosition: string
  uiOrder: number
  uiGroup: string
  uiLayerDepth: number
  parentCapabilityId: string | null
  uiPriority: string
  interactionMode: string
  uiStates: string[]
  uiVisibilityRule: string | null
  existentialRule: string | null
  uiInputSchema: Record<string, unknown>
  mutationEffects: Record<string, unknown>
  recoveryBehavior: string
  statePersistence: string
  dataFlow: string
  minPlanTier: PlanTier
  dependsOn: string[]
  // vCode fields
  concurrencySafe: boolean
  opClassification: string | null
  requiresUserConfirmation: boolean
  maxResultSize: number
  resultComponent: string
  resultLayout: string
  // Hot-swap slot overrides (per-slot component key + sandbox whitelist),
  // sourced from provider_capability.ui_component_override (FRONTEND=BACKEND, H6).
  uiSlots: Record<string, { component?: string; sandbox?: string[] }>
  searchHints: string[]
  aliases: string[]
  availability: AvailabilityGating
  prefetch: boolean
  // Override sources (per resolved field)
  overrideSources: Record<string, OverrideSource>
  // Binding context
  bindingStatus: string
  bindingConfidence: number
  // Plan tier overrides
  tierOverrides: {
    maxModels?: number
    maxFileSize?: number
    maxOptions?: number
    customConfig?: Record<string, unknown>
  }
}

export interface ResolvedCapabilities {
  composer: ResolvedCapability[]
  header: ResolvedCapability[]
  message: ResolvedCapability[]
  sidebar: ResolvedCapability[]
  inline: ResolvedCapability[]
  total: number
  resolvedAt: number
}
