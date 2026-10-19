// Timed waits are not cancellation. Every continuation must check this token
// before issuing another side effect; issued storage writes keep their barrier.
export function createBoundedLifecycle(plan, options = {}) {
  const now = options.now ?? (() => performance.now());
  const setTimer = options.setTimeout ?? globalThis.setTimeout;
  const clearTimer = options.clearTimeout ?? globalThis.clearTimeout;
  const started = now();
  let ended = false;
  let failure;
  const cleanups = new Set();
  const aborts = new Set();
  const stageDeadlines = new Map();
  function cleanup(fn) { try { fn(); } catch { /* cleanup cannot resurrect a command */ } }
  function finish(error) {
    if (ended) return false;
    ended = true;
    failure = error;
    for (const abort of [...aborts]) abort(error ?? new Error('command_finished'));
    aborts.clear();
    for (const fn of [...cleanups]) cleanup(fn);
    cleanups.clear();
    return true;
  }
  function timeout(stage) {
    const error = Object.assign(new Error(`content_timeout: ${stage}; nothing is retried automatically`), {
      code: 'content_timeout', stage, timeout_ms: plan.stages[stage] ?? plan.absoluteMs,
      absolute_ms: plan.absoluteMs, elapsed_ms: Math.max(0, now() - started),
    });
    finish(error);
    return error;
  }
  function remainingMs() { return Math.max(0, plan.absoluteMs - (now() - started)); }
  function assertActive() {
    if (ended) throw failure ?? new Error('command_finished');
    if (remainingMs() <= 0) throw timeout('absolute');
    for (const [token, deadline] of stageDeadlines) {
      if (now() >= deadline) throw timeout(token.stage);
    }
  }
  function addCleanup(fn) {
    if (ended) cleanup(fn); else cleanups.add(fn);
    return () => cleanups.delete(fn);
  }
  function wait(stage, startOperation) {
    return new Promise((resolve, reject) => {
      let done = false;
      let timer;
      let armed = false;
      const token = { stage };
      const settle = (error, value) => {
        if (done) return;
        done = true;
        aborts.delete(abort);
        stageDeadlines.delete(token);
        if (armed) cleanup(() => clearTimer(timer));
        if (error) reject(error); else resolve(value);
      };
      const abort = (error) => settle(error);
      try {
        assertActive();
        const budget = Math.min(plan.stages[stage], remainingMs());
        if (!Number.isFinite(budget) || budget <= 0) throw new Error(`invalid_command_stage: ${stage}`);
        aborts.add(abort);
        stageDeadlines.set(token, now() + budget);
        timer = setTimer(() => timeout(stage), budget);
        armed = true;
        if (done) { cleanup(() => clearTimer(timer)); return; }
        assertActive();
        // Attach both handlers even when the operation later outlives its wait.
        Promise.resolve(startOperation()).then((value) => {
          if (done) return;
          try { assertActive(); settle(null, value); } catch (error) { settle(error); }
        }, (error) => settle(error));
      } catch (error) { settle(error); finish(error); }
    });
  }
  return { plan, remainingMs, assertActive, wait, addCleanup, finish,
    cleanup: () => finish(),
    get active() { return !ended && remainingMs() > 0; } };
}
