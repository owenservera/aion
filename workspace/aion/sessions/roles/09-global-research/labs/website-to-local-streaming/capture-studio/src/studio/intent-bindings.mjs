// Durable pre-effect intent bindings for harness submit steps (Agent 14 Round 7 seam).
//
// The Round 6 harness-run store persists step identity (key/tool/argsDigest) but not the join
// between a run step and the conversation journal turn. The Round 7 reconciler requires an
// EXACT intent binding that the effect owner durably recorded BEFORE dispatch; absence must
// produce still_unknown, never a guess. This store is that smallest durable binding:
//
//   record()  — called by the harness API (the effect owner's own path) BEFORE runs.step()
//               dispatches submit_conversation_turn. Atomic tmp+rename write.
//   complete()— called after the executor returns with the OBSERVED journal turn identity
//               (key + payloadDigest). If the process dies between dispatch and completion,
//               the binding stays incomplete and reconciliation honestly stays still_unknown.
//   find()    — read-only lookup for the reconcile query.
//
// No prompt bodies, no cookies, no reply text: digests and identifiers only.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const INTENT_BINDING_SCHEMA = 'aion.harness-intent-binding/1';

const keyFileName = (runId, stepKey) => createHash('sha256').update(`${runId}\u0000${stepKey}`).digest('hex') + '.json';
const isHex64 = (s) => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);
const nonempty = (s, n = 256) => typeof s === 'string' && s.length > 0 && s.length <= n;

export function createIntentBindingStore({ dir } = {}) {
  if (!dir) throw new TypeError('dir is required');
  mkdirSync(dir, { recursive: true });

  const fileFor = (runId, stepKey) => path.join(dir, keyFileName(runId, stepKey));

  const write = (file, record) => {
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    writeFileSync(tmp, JSON.stringify(record, null, 2));
    renameSync(tmp, file);
  };

  return {
    /** Durable pre-effect intent. Returns the stored binding. Throws on re-bind of the same run+step. */
    record({ runId, stepKey, stepTool, argsDigest, conversationId, threadKey }) {
      if (!nonempty(runId, 128) || !nonempty(stepKey, 200) || stepTool !== 'submit_conversation_turn'
        || !isHex64(argsDigest) || !nonempty(conversationId, 128) || !nonempty(threadKey, 200)) {
        throw new TypeError('INVALID_INTENT_BINDING_FIELDS');
      }
      const file = fileFor(runId, stepKey);
      if (existsSync(file)) throw Object.assign(new Error(`intent binding already recorded for step "${stepKey}"`), { code: 'INTENT_BINDING_EXISTS' });
      const record = {
        schema: INTENT_BINDING_SCHEMA,
        source: 'trusted-pre-effect',
        runId, stepKey, stepTool, argsDigest, conversationId, threadKey,
        recordedAt: new Date().toISOString(),
        journalTurnKey: null, journalPayloadDigest: null, completedAt: null,
      };
      write(file, record);
      return structuredClone(record);
    },

    /** Complete the binding with the journal turn identity observed from the executor's own result. */
    complete({ runId, stepKey, journalTurnKey, journalPayloadDigest }) {
      if (!nonempty(runId, 128) || !nonempty(stepKey, 200) || !nonempty(journalTurnKey, 200) || !isHex64(journalPayloadDigest)) {
        throw new TypeError('INVALID_COMPLETION_FIELDS');
      }
      const file = fileFor(runId, stepKey);
      if (!existsSync(file)) throw Object.assign(new Error(`no intent binding for step "${stepKey}"`), { code: 'INTENT_BINDING_MISSING' });
      const prior = JSON.parse(readFileSync(file, 'utf8'));
      if (prior.journalTurnKey && (prior.journalTurnKey !== journalTurnKey || prior.journalPayloadDigest !== journalPayloadDigest)) {
        throw Object.assign(new Error('intent binding completion conflicts with the recorded observation'), { code: 'INTENT_BINDING_CONFLICT' });
      }
      if (!prior.journalTurnKey) {
        prior.journalTurnKey = journalTurnKey;
        prior.journalPayloadDigest = journalPayloadDigest;
        prior.completedAt = new Date().toISOString();
        write(file, prior);
      }
      return structuredClone(prior);
    },

    /** Read-only lookup; returns the stored binding or null. */
    find({ runId, stepKey }) {
      const file = fileFor(runId, stepKey);
      if (!existsSync(file)) return null;
      try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
    },

    /** Read-only verification that the durable record's identity fields still match the step. */
    verify(binding, { runId, stepKey, stepTool, argsDigest, conversationId }) {
      return !!binding && binding.schema === INTENT_BINDING_SCHEMA && binding.source === 'trusted-pre-effect'
        && binding.runId === runId && binding.stepKey === stepKey && binding.stepTool === stepTool
        && binding.argsDigest === argsDigest && binding.conversationId === conversationId;
    },
  };
}
