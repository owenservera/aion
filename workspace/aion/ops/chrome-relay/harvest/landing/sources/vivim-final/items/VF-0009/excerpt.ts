  }

  async execute(
    id: string,
    input: Record<string, unknown>,
    ctx: CapabilityContext,
  ): Promise<unknown> {
    const cap = this.capabilities.get(id)
    if (!cap) throw new EngineError(`Capability ${id} not found`)

    // Basic input validation against inputSchema
    const required = (cap.inputSchema.required as string[]) ?? []
    for (const key of required) {
      if (!(key in input)) {
        throw new EngineError(`Missing required input: ${key}`)
      }
    }

    return cap.handler(input, ctx)
  }

  exportForCli(): Array<{
    name: string
    aliases: string[]
    description: string
    schema: Record<string, unknown>
  }> {
    return this.list({ surface: 'cli' }).map((cap) => ({
      name: cap.cliCommand?.name ?? cap.slug,
      aliases: cap.cliCommand?.aliases ?? [],
      description: cap.description,
      schema: cap.inputSchema,
    }))
  }

  exportForMcp(): Array<{
    name: string
    description: string
    inputSchema: Record<string, unknown>
  }> {
    return this.list({ surface: 'mcp' }).map((cap) => ({
      name: cap.mcpToolName ?? cap.slug,
      description: cap.description,
      inputSchema: cap.inputSchema,
    }))
  }

  exportForUi(): Array<{
    id: string
    slug: string
    name: string
    ui: NonNullable<UnifiedCapability['ui']>
    inputSchema: Record<string, unknown>
    apiEndpoint?: { method: string; path: string }
    requiresConfirmation: boolean
  }> {
    return this.list({ surface: 'ui' }).map((cap) => ({
      id: cap.id,
      slug: cap.slug,
      name: cap.name,
      ui: cap.ui as NonNullable<UnifiedCapability['ui']>,
      inputSchema: cap.inputSchema,
      apiEndpoint: cap.apiEndpoint,
      requiresConfirmation: cap.requiresConfirmation,
    }))
