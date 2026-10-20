export interface CapabilityShape {
  id: string
  name: string
  expectedCapabilities: Record<string, 'required' | 'optional' | 'extended'>
  discoveryHints: {
    urlPatterns: string[]
    domIndicators: DomIndicator[]
    interactiveElementPatterns: InteractiveElementPattern[]
  }
  projectionRules: {
    composer: ProjectionRule
    modelSelector?: ProjectionRule
    messageList: ProjectionRule
  }
  parserExpectations: {
    responseFormat: 'sse' | 'json' | 'html' | 'websocket' | 'custom'
    parserArchetype: string
    fallbackStrategy: 'plain_text' | 'html_extract' | 'raw'
  }
  extendsShape?: string
  overrides?: Partial<Omit<CapabilityShape, 'id' | 'extendsShape' | 'overrides'>>
}

export interface CapabilityAdapter {
  shapeId: string
  toUniversal(
    shapeSpecific: Record<string, unknown>,
    shapeContext: CapabilityShape,
  ): Record<string, unknown>
  fromUniversal(
    action: Record<string, unknown>,
    shapeContext: CapabilityShape,
  ): Record<string, unknown>
  projectState(
    rawState: Record<string, unknown>,
    shapeContext: CapabilityShape,
  ): Record<string, unknown>
}

// ── Built-in shapes ─────────────────────────────────────────────────────

const BUILT_IN_SHAPES: CapabilityShape[] = [
  {
    id: 'chat_app',
    name: 'Chat Application',
    expectedCapabilities: {
      send_message: 'required',
      receive_message: 'required',
      typing_indicator: 'optional',
      file_upload: 'optional',
      model_selector: 'optional',
    },
    discoveryHints: {
      urlPatterns: ['chat', 'conversation', 'messenger'],
      domIndicators: [
        { selector: '[data-testid="composer"]', text: 'Send' },
        { selector: 'textarea', text: 'Message' },
        { selector: '[role="textbox"]' },
      ],
      interactiveElementPatterns: [
        { selector: 'textarea', action: 'type', priority: 1 },
        { selector: 'button[type="submit"]', action: 'click', priority: 2 },
        { selector: '[data-testid="send-button"]', action: 'click', priority: 2 },
      ],
    },
    projectionRules: {
      composer: { selector: 'textarea, [role="textbox"]', mapping: { value: 'textContent' } },
      messageList: {
        selector: '[data-testid="message"], [role="list"] > *',
        mapping: { role: 'data-author', content: 'textContent' },
      },
    },
    parserExpectations: {
      responseFormat: 'sse',
      parserArchetype: 'claude',
      fallbackStrategy: 'plain_text',
    },
