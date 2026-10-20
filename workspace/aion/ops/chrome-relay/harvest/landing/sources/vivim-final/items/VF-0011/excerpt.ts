export interface CommandContext {
  activeProvider: string | null
  activeConvId: string | null
  activeAccountId: string | null
  lastAssistantText: string | null
  lastAssistantAt: number | null
  lastUserPrompt: string | null
  gmailAccounts: Array<{ hash: string; email: string }>
  dueMemoryCount: number
  panelStatus: 'connecting' | 'connected' | 'disconnected'
  activeTags: string[]
  recentCommands: string[]
  sessionState: Record<string, unknown>
}

// ─── Suggestion ──────────────────────────────────────────────────────
export interface Suggestion {
  id: string
  label: string
  description: string
  category: CommandCategory
  prefix: Prefix
  icon?: string
  score: number
}

// ─── Arg Spec ────────────────────────────────────────────────────────
export interface ArgSpec {
  name: string
  kind: ArgKind
  placeholder: string
  required: boolean
  default?: string | ((ctx: CommandContext) => string | null)
  multiline?: boolean
  suggestions?: (q: string, ctx: CommandContext) => Promise<Suggestion[]>
  options?: Array<{ value: string; label: string }>
  acceptContextRef?: 'lastAssistant' | 'activeConv' | 'lastFile' | 'lastUrl'
  validation?: (value: string) => string | null
}

// ─── Command Result ──────────────────────────────────────────────────
export type CommandResult =
  | { ok: true; toast: string; detail?: string; openUrl?: string; followup?: string }
  | { ok: false; toast: string; detail?: string }

// ─── Unified Command Spec ────────────────────────────────────────────
export interface UnifiedCommandSpec {
  id: string
  prefix: Prefix
  namespace: string
  title: string
  subtitle?: string
  keywords?: string[]
  icon?: string
  category: CommandCategory
  surfaces: Array<'cli' | 'ui' | 'api' | 'mcp' | 'palette'>

  when?: (ctx: CommandContext) => boolean
  boost?: (ctx: CommandContext) => number
  destructive?: boolean

  args?: ArgSpec[]

  run: (args: Record<string, unknown>, ctx: CommandContext) => Promise<CommandResult>

  aliases?: string[]
  examples?: string[]

  capabilityId?: string
  patternId?: string
