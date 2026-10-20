function parseConversation(raw: RawConversationItem): ConversationFull {
  const mapping = raw.mapping
  if (!mapping || typeof mapping !== 'object') {
    return {
      id: raw.id,
      title: raw.title || 'New chat',
      messages: [],
    }
  }

  const allIds = new Set(Object.keys(mapping))
  const messages: ConversationMessage[] = []

  for (const [id, node] of Object.entries(mapping)) {
    const msg = parseMessageNode(id, node)
    if (!msg) continue

    // Fix orphaned parent references
    let parent = msg.parentId
    while (parent && !allIds.has(parent)) {
      parent = mapping[parent]?.parent ?? null
    }
    msg.parentId = parent

    messages.push(msg)
  }

  // Sort by timestamp for display order (oldest first)
  messages.sort((a, b) => a.timestamp - b.timestamp)

  return {
    id: raw.id,
    title: raw.title || 'New chat',
    messages,
  }
}

/**
 * Parse a single ChatGPT mapping node into a ConversationMessage.
 */
function parseMessageNode(id: string, node: RawMappingNode): ConversationMessage | null {
  const msg = node.message
  if (!msg?.content) return null

  const contentType: string = msg.content.content_type || 'text'
  let content = ''
  const artifacts: ConversationArtifact[] = []

  switch (contentType) {
    case 'text':
    case 'code': {
      const c = msg.content
      content = c.parts
        ? (c.parts as unknown[]).filter((p): p is string => typeof p === 'string').join('')
        : c.text || ''
      break
    }

    case 'multimodal_text': {
      const c = msg.content
      if (c.parts) {
        const textParts: string[] = []
        const _imgSeq = 0

        for (const p of c.parts as unknown[]) {
          if (typeof p === 'string') {
            textParts.push(p)
          } else if (p && typeof p === 'object') {
            const part = p as Record<string, unknown>
