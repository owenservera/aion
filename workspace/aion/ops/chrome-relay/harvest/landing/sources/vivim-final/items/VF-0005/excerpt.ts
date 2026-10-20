export interface CapabilityTaxonomyEntry {
  id: string
  slug: string
  name: string
  category: 'conversation' | 'model' | 'tools' | 'context' | 'export' | 'media' | 'navigation'
  intentPatterns: string[]
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  uiContract: Record<string, unknown>
  surfaces: CapabilitySurface[]
  baseShape?: string
}

// ── Taxonomy Catalog (~60 entries) ─────────────────────────────────────────────

export const CAPABILITY_TAXONOMY_V2: CapabilityTaxonomyEntry[] = [
  // Conversation
  {
    id: 'cap:conversation:send_message',
    slug: 'send_message',
    name: 'Send Message',
    category: 'conversation',
    intentPatterns: ['send a message', 'reply', 'ask the model', 'chat with', 'tell the assistant'],
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
    outputSchema: { type: 'object' },
    uiContract: { control: 'composer', placeholder: 'Type a message...', hotkey: 'Enter' },
    surfaces: ['cli', 'ui', 'workflow', 'mcp', 'api'],
  },
  {
    id: 'cap:conversation:read_response',
    slug: 'read_response',
    name: 'Read Response',
    category: 'conversation',
    intentPatterns: ['read response', 'show reply', 'display answer'],
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'object' },
    uiContract: { control: 'message-display' },
    surfaces: ['cli', 'ui', 'workflow', 'mcp', 'api'],
  },
  {
    id: 'cap:conversation:edit_message',
    slug: 'edit_message',
    name: 'Edit Message',
    category: 'conversation',
    intentPatterns: ['edit message', 'modify message', 'change my message'],
    inputSchema: {
      type: 'object',
      properties: { messageId: { type: 'string' }, newContent: { type: 'string' } },
      required: ['messageId', 'newContent'],
    },
    outputSchema: { type: 'object' },
    uiContract: { control: 'message-editor' },
    surfaces: ['cli', 'ui', 'workflow', 'mcp', 'api'],
  },
  {
    id: 'cap:conversation:regenerate_response',
    slug: 'regenerate_response',
    name: 'Regenerate Response',
    category: 'conversation',
    intentPatterns: ['regenerate', 'try again', 'new answer'],
    inputSchema: { type: 'object', properties: {} },
    outputSchema: { type: 'object' },
    uiContract: { control: 'action-button' },
    surfaces: ['cli', 'ui', 'workflow', 'mcp', 'api'],
  },
  {
    id: 'cap:conversation:new_chat',
    slug: 'new_chat',
    name: 'New Chat',
    category: 'conversation',
    intentPatterns: ['new chat', 'start conversation', 'create chat'],
    inputSchema: { type: 'object', properties: { title: { type: 'string' } } },
    outputSchema: { type: 'object' },
    uiContract: { control: 'fab-button' },
    surfaces: ['cli', 'ui', 'workflow', 'mcp', 'api'],
  },

  // Model
  {
    id: 'cap:model:select_model',
    slug: 'select_model',
    name: 'Select Model',
    category: 'model',
