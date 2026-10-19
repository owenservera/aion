// SCRIPTED chatgpt.com browser for offline bus demos: tabs + one fake page per
// tab answering content.js receipt shapes (ping, submit-turn, observe-turn,
// commander-scan via the REAL scanTurns). Drives the REAL chatgpt-port driver
// and REAL task store. This is a fixture, not live ChatGPT evidence.
import { createHash } from 'node:crypto';
import { createChatGPTPortDriver, CHATGPT_ACTION } from '../../src/background/chatgpt-port.js';
import { scanTurns } from '../../src/chatgpt/commander.js';
import { acceptedAdapterReply } from './chatgpt-accepted.js';

export function scriptedChatGPT({ tabs, answer = (url, text) => `answer from ${url} (${text.length} chars in)` } = {}) {
  const transcripts = Object.fromEntries(tabs.map(([, url]) => [url, []]));
  const posted = [];
  const bag = {};
  const api = {
    storage: { local: { async get(k) { return Object.hasOwn(bag, k) ? { [k]: structuredClone(bag[k]) } : {}; }, async set(v) { Object.assign(bag, structuredClone(v)); } } },
    tabs: {
      async query() { return tabs.map(([id, url]) => ({ id, url, windowId: 1, active: false, status: 'complete' })); },
      connect(tabId) {
        const url = tabs.find(([id]) => id === tabId)[1];
        const ls = new Set();
        return {
          onMessage: { addListener: (f) => ls.add(f), removeListener: (f) => ls.delete(f) },
          onDisconnect: { addListener() {}, removeListener() {} }, disconnect() {},
          postMessage(m) {
            posted.push({ url, ...structuredClone(m) });
            const identity = { task_id: m.task_id, operation_key: m.operation_key, correlation_id: m.correlation_id, observer_id: `o${tabId}`, page_instance_id: `p${tabId}` };
            let reply;
            if (m.action === CHATGPT_ACTION.PING) reply = { action: m.action, ok: true, href: url, state: { generating: false, sendPresent: true, sendDisabled: false, composer_visible_count: 1, sendControlCount: 1 } };
            else if (m.action === CHATGPT_ACTION.COMMANDER_SCAN) reply = { action: m.action, href: url, read_only: true, ...scanTurns(transcripts[url], { baseline_sig: m.baseline_sig, arm_token: m.arm_token }) };
            else if (m.action === CHATGPT_ACTION.SUBMIT_TURN) {
              const body = `${m.correlation_id}\n${answer(url, m.text)}\n${m.expected_reply_token}`;
              transcripts[url].push({ role: 'user', text: m.text }, { role: 'assistant', text: body });
              const base = acceptedAdapterReply({ correlationId: m.correlation_id, token: m.expected_reply_token, replyText: body });
              reply = { action: m.action, ok: true, ...identity, observation: { phase: 'REPLY_CHECKED', click_attempted: true, submission_observed: true, generation_started: true, generation_complete: true, continuity: true, method: 'scripted', remaining_ms: 0, reason: 'accepted' },
                click_attempted: true, submission_observed: true, submitted: true, uncertain: false, pending: false, verdict: base.verdict, envelope: base.envelope };
            }
            if (reply) queueMicrotask(() => { for (const f of [...ls]) f(reply); });
          },
        };
      },
    },
  };
  const driver = createChatGPTPortDriver({ chrome: api, digest: async (b) => createHash('sha256').update(b).digest() });
  return { api, driver, transcripts, posted, bag,
    submits: (url) => posted.filter((x) => x.action === CHATGPT_ACTION.SUBMIT_TURN && (!url || x.url === url)) };
}
