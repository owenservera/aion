export interface ConversationHeader {
  /** Provider-native conversation ID (e.g. ChatGPT's `uuid`, Claude's `chatId`). */
  id: string
  /** Conversation title as shown in the provider UI. */
  title: string
  /** Last updated timestamp (Unix ms). Used for incremental sync ordering. */
  updatedAt: number
  /** Creation timestamp (Unix ms). */
  createdAt?: number
  /** Number of messages in the conversation (if reported by the API). */
  messageCount?: number
  /** Model used for the last assistant response (if available). */
  model?: string
  /** Provider-specific metadata not captured by other fields. */
  metadata?: Record<string, unknown>
}

/**
 * A single message within a conversation.
 */
export interface ConversationMessage {
  /** Provider-native message ID. */
  id: string
  /** Parent message ID for threaded/DAG conversations (e.g. ChatGPT). Null for root messages. */
  parentId: string | null
  role: 'user' | 'assistant' | 'system'
  /** Message text content. May be null for messages that only contain artifacts. */
  content: string | null
  /** Timestamp (Unix ms). */
  timestamp: number
  /** Model used for this message (assistant messages only). */
  model?: string
  /** Extracted artifacts (code blocks, images, files). */
  artifacts?: ConversationArtifact[]
  /** Provider-specific metadata (e.g. ChatGPT's `author.name`, `recipient`). */
  metadata?: Record<string, unknown>
}

/**
 * An artifact extracted from a message (code block, image, file attachment).
 */
export interface ConversationArtifact {
  kind: 'code' | 'image' | 'file' | 'audio' | 'video'
  /** For code: the language. For images: MIME type. For files: filename. */
  label: string
  /** The raw content or URL. */
  content?: string
  /** URL for remote resources (images, files). */
  url?: string
  /** Byte size for files (if known). */
  sizeBytes?: number
}

/**
 * A full conversation with all messages — returned by getConversation().
 */
export interface ConversationFull {
  id: string
  title: string
  /** Messages in display order (newest-last for linear, DAG-flattened for ChatGPT). */
  messages: ConversationMessage[]
  /** Conversation-level metadata (model, sharing status, etc.). */
  metadata?: Record<string, unknown>
}

/**
 * Generic paginated result from provider APIs.
 */
export interface PaginatedResult<T> {
  items: T[]
  /** Cursor for the next page. Undefined means no more pages. */
  nextCursor?: string
  /** Total count (if reported by the API). */
  total?: number
}

// ── Adapter interface ───────────────────────────────────────────────────────

/**
 * Provider-specific conversation adapter. Each provider implements this
 * interface to normalize their conversation API into the common format.
 *
 * Adapters do NOT handle auth — they receive a pre-extracted auth context
 * (bearer token, cookies, etc.) from the auth extraction layer.
 */
export interface ProviderConversationAdapter {
  /** Provider slug (e.g. 'chatgpt', 'gemini', 'claude', 'deepseek'). */
