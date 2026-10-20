  constructor(private store: CapabilityResolutionStore) {}

  async resolve(
    providerId: string,
    planTier: PlanTier,
    opts?: CapabilityResolutionOptions,
  ): Promise<ResolvedCapabilities> {
    const rows = await this.store.resolveCapabilities(providerId, planTier)
    const activeBindings = opts?.activeBindings ?? (await this.store.getActiveBindings(providerId))
    return this.buildResult(rows, planTier, activeBindings, opts?.conversationContext)
  }

  async search(
    providerId: string,
    planTier: PlanTier,
    query: string,
    opts?: CapabilityResolutionOptions,
  ): Promise<ResolvedCapabilities> {
    const rows = await this.store.searchCapabilities(providerId, planTier, query)
    const activeBindings = opts?.activeBindings ?? (await this.store.getActiveBindings(providerId))
    const result = this.buildResult(rows, planTier, activeBindings, opts?.conversationContext)
    return this.applySearchFilter(result, query)
  }

  // ── internal ──────────────────────────────────────────────────────────────

  private buildResult(
    rows: RawResolutionRow[],
    planTier: PlanTier,
    activeBindings: string[],
    context?: Record<string, unknown>,
  ): ResolvedCapabilities {
    const bindingSet = new Set(activeBindings)
    const groups: Record<UiPosition, ResolvedCapability[]> = {
      composer: [],
      header: [],
      message: [],
      sidebar: [],
      inline: [],
    }

    for (const row of rows) {
      // [1] Plan tier gating
      if (tierRank(row.min_plan_tier) > tierRank(planTier)) continue

      const cap = this.mapRow(row)

      // [2] Existential rule evaluation
      if (!this.satisfiesExistentialRule(cap.existentialRule, context)) continue

      // [3] Dependency satisfaction
      if (!this.dependenciesSatisfied(cap.dependsOn, bindingSet)) continue

      groups[normalizePosition(cap.uiPosition)].push(cap)
    }

    // sort within groups: ui_group then ui_order
    for (const pos of UI_POSITIONS) {
      groups[pos].sort((a, b) =>
        a.uiGroup === b.uiGroup ? a.uiOrder - b.uiOrder : a.uiGroup.localeCompare(b.uiGroup),
      )
    }

    const total =
      groups.composer.length +
      groups.header.length +
      groups.message.length +
