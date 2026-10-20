describe('SendResilienceEngine.sendResilient', () => {
  it('throws SendResilienceError on pre-flight chrome_crash', async () => {
    const deps = makeDeps({
      governor: {
        getAllHealth: mock(async () => new Map([['slave:chatgpt:acct1', { status: 'stopped' }]])),
        getAllSlaves: mock(() => []),
        launch: mock(async () => ({ status: 'running' }) as never),
      } as unknown as SendResilienceDeps['governor'],
    })
    const engine = new SendResilienceEngine(deps)
    await expect(engine.sendResilient(INPUT)).rejects.toBeInstanceOf(SendResilienceError)
  })

  it('auto-reconnects once on cdp_down then resends successfully', async () => {
    let calls = 0
    const deps = makeDeps({
      governor: {
        getAllHealth: mock(async () => new Map([['slave:chatgpt:acct1', { status: 'running' }]])),
        getAllSlaves: mock(() => []),
        launch: mock(async () => ({ status: 'running' }) as never),
      } as unknown as SendResilienceDeps['governor'],
      send: mock(async () => {
        calls++
        if (calls === 1) throw new Error('cdp transport not configured')
        return { ok: true, messageId: 'm2' }
      }),
    })
    const engine = new SendResilienceEngine(deps)
    const out = await engine.sendResilient(INPUT)
    expect(out.ok).toBe(true)
    expect(calls).toBe(2) // first failed, second after reconnect succeeded
  })

  it('throws with autoReconnectAttempted=true after second cdp_down failure', async () => {
    const deps = makeDeps({
      governor: {
        getAllHealth: mock(async () => new Map([['slave:chatgpt:acct1', { status: 'running' }]])),
        getAllSlaves: mock(() => []),
        launch: mock(async () => ({ status: 'running' }) as never),
      } as unknown as SendResilienceDeps['governor'],
      send: mock(async () => {
        throw new Error('cdp transport not configured')
      }),
    })
    const engine = new SendResilienceEngine(deps)
    try {
      await engine.sendResilient(INPUT)
      throw new Error('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(SendResilienceError)
      expect((err as SendResilienceError).recoveryKind).toBe('cdp_down')
      expect((err as SendResilienceError).autoReconnectAttempted).toBe(true)
    }
  })

  it('maps circuit-open EngineError to circuit_open with retryAfterMs', async () => {
