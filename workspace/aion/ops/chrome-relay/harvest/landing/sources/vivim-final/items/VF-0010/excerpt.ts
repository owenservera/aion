export interface ProviderPlugin {
  id: string
  name: string

  urls: {
    login: string
    app: string
    loggedInPattern: RegExp
  }

  selectors: {
    composer: string[]
    sendButton: string[]
    fallback: 'heuristic'
  }

  composerType: 'textarea' | 'contenteditable' | 'quill' | 'codemirror'

  typing: TypingStrategy

  antiDetection: AntiDetectionScript[]

  login: {
    detect: (url: string) => boolean
    recover: (session: unknown) => Promise<void>
  }

  recovery: RecoveryProfile

  capabilities: ProviderCapability[]
}

export interface TypingStrategy {
  type: 'textarea' | 'contenteditable' | 'quill' | 'codemirror'
  options?: {
    delayMs?: number
    humanLike?: boolean
    clearFirst?: boolean
  }
}

export interface AntiDetectionScript {
  name: string
  script: string
  runAt: 'document_start' | 'document_end' | 'document_idle'
}

export interface RecoveryProfile {
  failureClasses: FailureClass[]
  strategies: Record<FailureClass, RecoveryStrategy>
  maxRetries: Record<FailureClass, number>
}

export interface ProviderCapability {
