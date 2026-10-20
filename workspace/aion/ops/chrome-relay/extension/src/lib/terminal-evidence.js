/**
 * AION P1 — integrated passive terminal-evidence classifier.
 * Adapted from chatgpt-bridge src/bridge/observation/turnEvidence.js
 * upstream 0ffdae90239988f253058c05253226152acd55d2 (MIT).
 *
 * This returns an INFERRED settled candidate, never an authorized Send receipt,
 * Bus REPLY_CHECKED, or proof of assistant-to-user correspondence.
 */
const string = (value) => typeof value === 'string' ? value : '';
const runningPhase = (artifact) =>
  /GENERAT|PEND|LOAD|RUN|QUEU/i.test(string(artifact?.phase || artifact?.state));
const failedPhase = (artifact) =>
  /FAIL|ERROR/i.test(string(artifact?.phase || artifact?.state));

export function classifyPassiveTerminal(observation = {}, { minimumStableMs = 1500 } = {}) {
  const output = observation.output || {};
  const turn = observation.turn || {};
  const generation = observation.generation || {};
  const artifacts = Array.isArray(observation.artifacts)
    ? observation.artifacts.slice(0, 100) : [];
  const stableForMs = Math.max(0, Number(observation.stableForMs) || 0);
  const streamingVisible = generation.streamingVisible === true || generation.stopVisible === true;
  const generationStopped = generation.state === 'stopped'
    && !streamingVisible && !generation.activeTool;
  const outputFinal = output.state === 'final';
  const blockerAbsent = observation.blocker?.state === 'none';
  const pending = observation.artifact?.state === 'pending' || artifacts.some(runningPhase);
  const failed = observation.artifact?.state === 'failed' || artifacts.some(failedPhase);
  const answerPresent = Boolean(string(output.answer).trim() || artifacts.length);
  const stable = stableForMs >= Math.max(0, Number(minimumStableMs) || 1500);
  const assistantKeyPresent = Boolean(string(turn.key));
  const candidate = generationStopped && outputFinal && blockerAbsent && stable
    && assistantKeyPresent && answerPresent && !pending && !failed
    && observation.degraded !== true && observation.textTruncated !== true;
  return {
    state: candidate ? 'inferred_settled' : answerPresent ? 'incomplete_or_unknown' : 'unknown',
    terminalCandidate: Boolean(candidate),
    evidence: {
      generationStopped, outputFinal, blockerAbsent, stable,
      streamingVisible, pending, failed, answerPresent, assistantKeyPresent,
      stableForMs,
    },
    verified: false,
  };
}
