  /**
   * Evaluate a capability's existential rule against the conversation context.
   * Supported forms (whitespace-tolerant):
   *   "key"            → context.key is truthy
   *   "!key"           → context.key is falsy
   *   "key == value"   → String(context.key) === value
   *   "key != value"   → String(context.key) !== value
   * A null/empty rule is always satisfied. An unparseable rule defaults to satisfied.
   */
  private satisfiesExistentialRule(
    rule: string | null,
    context?: Record<string, unknown>,
  ): boolean {
    if (!rule || rule.trim() === '') return true
    // Fail closed: a rule that references the conversation context must NOT be
    // vacuously satisfied when no context is supplied. Omitting context means
    // "cannot prove the condition holds" -> exclude the capability (H6).
    if (!context) return false

    const expr = rule.trim()

    const eqMatch = expr.match(/^([\w.]+)\s*(==|!=)\s*(.+)$/)
    if (eqMatch) {
      const [, key, op, rawValue] = eqMatch
      const expected = (rawValue ?? '').trim().replace(/^['"]|['"]$/g, '')
      const actual = context[key as string]
      const equal = String(actual) === expected
      return op === '==' ? equal : !equal
    }

    if (expr.startsWith('!')) {
      const key = expr.slice(1).trim()
      return !context[key]
    }

    if (/^[\w.]+$/.test(expr)) {
      return Boolean(context[expr])
    }

    // Unparseable — do not hide the capability.
    return true
  }
