  // ── Wrapped send (FR-002..FR-005) ─────────────────────────────────────────────

  async sendResilient(input: SendInput): Promise<SendOutput> {
    const pre = await this.preflight(input.providerId, input.slaveId)
    if (!pre.ok && pre.recoveryKind) {
      throw new SendResilienceError(DEFAULT_MESSAGES[pre.recoveryKind], {
        recoveryKind: pre.recoveryKind,
        providerId: input.providerId,
        slaveId: input.slaveId,
        retryAfterMs: pre.retryAfterMs,
        autoReconnectAttempted: false,
        defaultMessage: DEFAULT_MESSAGES[pre.recoveryKind],
      })
    }

    try {
      return await this.sendFn(input)
    } catch (err) {
      const kind = classifyEngineError(err)
      if (kind === 'chrome_crash' || kind === 'cdp_down') {
        // FR-005: exactly one silent reconnect attempt within budget.
        const reconnected = await this.attemptReconnect(input.providerId)
        if (reconnected) {
          try {
            return await this.sendFn(input)
          } catch (err2) {
            throw this.toResilienceError(err2, input, true)
          }
        }
      }
      throw this.toResilienceError(err, input, false)
    }
  }

  // ── Recovery actions (One Entry Point — invoked via capability) ───────────────

  async recover(kind: RecoveryKind, input: SendInput): Promise<SendOutput> {
    if (kind === 'relogin') {
      return this.relogin(input)
    }
    // retry: reconnect + resend lastMessage through the same resilient path so a
    // transient failure on the retry itself is still classified and surfaced.
    await this.attemptReconnect(input.providerId)
    return this.sendResilient({ ...input, text: input.lastMessage ?? input.text })
