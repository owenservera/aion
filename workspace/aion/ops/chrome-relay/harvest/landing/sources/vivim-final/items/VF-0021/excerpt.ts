export function registerProviderCapabilities(registry: UnifiedCapabilityRegistry): void {
  const caps: UnifiedCapability[] = [
    // ── Claude Capabilities ──────────────────────────────────────────────────
    makeCapability(
      {
        id: 'cap:claude:extended_thinking',
        slug: 'claude_toggle_thinking',
        name: 'Set Claude Thinking Token Budget',
        description: 'Configure thinking token budget (1k-64k tokens) for Claude 3.7+ Sonnet.',
        category: 'llm',
        inputSchema: {
          type: 'object',
          properties: {
            budgetTokens: { type: 'number', minimum: 1024, maximum: 64000 },
            enabled: { type: 'boolean' },
          },
          required: ['budgetTokens'],
        },
        outputSchema: { type: 'object' },
        cliCommand: {
          name: 'claude thinking',
          aliases: ['cthink'],
          examples: ['claude thinking --budgetTokens 8192'],
        },
        ui: { component: 'toggle_switch', position: 'header', order: 10 },
        mcpToolName: 'claude_toggle_thinking',
        apiEndpoint: { method: 'POST', path: '/api/providers/claude/thinking' },
      },
      async (input) => {
        const budgetTokens = Number(input.budgetTokens ?? 4096)
        const enabled = Boolean(input.enabled ?? true)
        return { ok: true, providerId: 'claude', budgetTokens, enabled }
      },
    ),

    makeCapability(
