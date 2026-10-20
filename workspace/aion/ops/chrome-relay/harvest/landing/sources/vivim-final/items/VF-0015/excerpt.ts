// src/engines/message-identity.ts
// Message identity deduplication using SHA256-based hashing

import { createHash } from 'node:crypto'

export interface MessageIdentityInput {
  provider: string
  account: string
  convId: string
  role: string
  content: string
  providerMsgId?: string
}

export class MessageIdentity {
  /**
   * Generate SHA256-based message identity
   * identity = SHA256(provider + "\0" + account + "\0" + conv_id + "\0" + [provider_msg_id OR (role + "\0" + content)])
   */
  static generate(input: MessageIdentityInput): string {
    const hash = createHash('sha256')

    hash.update(input.provider)
    hash.update('\0')
    hash.update(input.account)
    hash.update('\0')
    hash.update(input.convId)
    hash.update('\0')

    if (input.providerMsgId && input.providerMsgId.length > 0) {
      // Provider ID mode
      hash.update('id\0')
      hash.update(input.providerMsgId)
    } else {
      // Role+Content mode
      hash.update('rc\0')
      hash.update(input.role)
      hash.update('\0')
      hash.update(input.content)
    }

    return hash.digest('hex')
  }

  /**
   * Extract identity input from conversation message input
   */
  static fromMessageInput(
    input: ConversationMessageInput,
    provider: string,
    account: string,
  ): MessageIdentityInput {
    return {
      provider,
      account,
      convId: input.conversationId,
      role: input.role,
      content: input.content || '',
      providerMsgId: input.providerMessageId,
    }
  }
}

// Type for conversation message input (matches existing contract)
export interface ConversationMessageInput {
  conversationId: string
  role: string
  content?: string
  providerMessageId?: string
  // ... other fields as needed
}