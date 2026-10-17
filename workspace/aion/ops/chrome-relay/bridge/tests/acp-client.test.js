// ACP client tests — the ACP-01/02/03/05/06/09/10/11 acceptance list.
//
// NOTHING HERE SPAWNS THE REAL AGENT. Every test injects `tests/fixtures/
// fake-acp-agent.mjs`, a small local script that speaks newline JSON-RPC. No
// browser, no extension, no registry, no network.
//
// Evidence sources, so no assertion rests on trust:
//   `sent`      every line the CLIENT wrote to the agent's stdin (stdin is
//               wrapped in the injected spawn), which is how "nothing was sent"
//               is proved rather than asserted.
//   transcript  every line the FAKE wrote to its own stdout, which is how
//               "the log stream stayed clean" is proved.

import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn as nodeSpawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ACP_ERROR, CLIENT_STATUS, AcpClientError, createAcpClient } from '../src/acp-client.js';
import { classifyJsonRpcMessage } from '../src/framing.js';
import { createConfig } from '../src/config.js';
import { createRedactingLogger } from '../src/host.js';

const FAKE_AGENT = toForwardSlash(fileURLToPath(new URL('./fixtures/fake-acp-agent.mjs', import.meta.url)));
const NODE_EXE = toForwardSlash(process.execPath);
const SCRATCH = join(tmpdir(), 'opencode', 'aion-bridge-tests');
const TEST_CWD = 'C:/0-BlackBoxProject-0/AION';
const FAKE_SECRET = 'sk-live-FAKEFAKEFAKEFAKEFAKE';
let labelCounter = 0;

/** Forward slashes everywhere: a backslash path in a string literal is an escape. */
function toForwardSlash(value) {
  return String(value).split(String.fromCharCode(92)).join('/');
}

/** Build a config pointed at the fake agent, plus a spawn that launches it. */
function harness(options = {}) {
  labelCounter += 1;
  mkdirSync(SCRATCH, { recursive: true });
  const transcript = join(SCRATCH, `${options.label ?? 'client'}-${process.pid}-${labelCounter}.stdout.txt`);

  const logLines = [];
  const logger = createRedactingLogger({ sink: (line) => logLines.push(line), level: 'debug' });
  logger.registerSecret(FAKE_SECRET);

  const config = createConfig({
    expectedExtensionId: 'testextensionidtestextensionid',
    agentPath: NODE_EXE,
    agentArgs: [FAKE_AGENT, '--transcript', toForwardSlash(transcript), ...(options.agentArgs ?? [])],
    sessionCwd: TEST_CWD,
    timeouts: { spawnMs: 10_000, requestMs: 10_000, initializeMs: 10_000, promptMs: 0 },
    ...(options.config ?? {}),
  });

  /** @type {string[]} every line the client wrote to the agent's stdin */
  const sent = [];

  const spawnFn = (command, args, spawnOptions) => {
    assert.equal(command, NODE_EXE, 'the host must spawn the configured absolute path, never a PATH lookup');
    const child = nodeSpawn(command, args, spawnOptions);
    const originalWrite = child.stdin.write.bind(child.stdin);
    child.stdin.write = (chunk, ...rest) => {
      sent.push(String(chunk));
      return originalWrite(chunk, ...rest);
    };
    return child;
  };

  const client = createAcpClient({
    config,
    spawn: spawnFn,
    logger,
    onExit: options.onExit,
    onUnsupportedRequest: options.onUnsupportedRequest,
    onOrphanUpdate: options.onOrphanUpdate,
  });

  const h = {
    client,
    config,
    logger,
    transcript,
    logLines,
    /** Messages the client sent to the agent, parsed. */
    requestsSent: () => parseLines(sent),
    /** Messages the agent sent to the client, read from its stdout transcript. */
    agentSaid: () => parseLines(transcriptLines(transcript)),
    /** Lines the agent wrote to stdout that are NOT valid JSON-RPC (ACP-10). */
    nonProtocolStdoutLines: () => transcriptLines(transcript).filter((line) => {
      try {
        return classifyJsonRpcMessage(JSON.parse(line)) === 'invalid';
      } catch {
        return true;
      }
    }),
  };
  return h;
}

/** Run `fn` with a client that is always closed afterwards. */
async function withClient(options, fn) {
  const h = harness(options);
  try {
    return await fn(h);
  } finally {
    h.client.close();
  }
}

function transcriptLines(path) {
  return readFileSync(path, 'utf8').split('\n').filter((line) => line.trim() !== '');
}

function parseLines(lines) {
  return lines
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line.replace(/\n$/, '')));
}

/* --------------------------------------------------------------- ACP-01 */

test('ACP-01: initialize returns the protocol version and negotiated capabilities', async () => {
  await withClient({ label: 'init' }, async ({ client, agentSaid }) => {
    const info = await client.initialize();

    assert.equal(info.protocolVersion, 1);
    assert.equal(info.agentInfo.name, 'OpenCode');
    assert.equal(info.agentCapabilities.loadSession, true);
    assert.deepEqual(info.mcpCapabilities, { http: true, sse: false });
    assert.deepEqual(info.promptCapabilities, { embeddedContext: true, image: true });
    assert.deepEqual(info.authMethods, [{ id: 'opencode-login' }]);
    assert.equal(client.status(), CLIENT_STATUS.READY);

    const response = agentSaid().find((m) => m.id !== undefined && m.result?.agentInfo);
    assert.ok(response, 'the agent must have answered initialize');
    assert.equal(response.result.agentInfo.version, '2.0.32');
  });
});

test('ACP-01: the client advertises protocolVersion 1 and no fs or terminal capability', async () => {
  await withClient({ label: 'caps' }, async ({ client, requestsSent }) => {
    await client.initialize();
    const initialize = requestsSent().find((m) => m.method === 'initialize');

    assert.equal(initialize.params.protocolVersion, 1);
    assert.deepEqual(initialize.params.clientCapabilities.fs, { readTextFile: false, writeTextFile: false });
    assert.equal(initialize.params.clientCapabilities.terminal, false,
      'declaring terminal or fs support would invite the agent to ask for file writes this bridge does not grant');
  });
});

test('ACP-01: a protocol version mismatch fails closed instead of being negotiated blindly', async () => {
  await withClient({ label: 'mismatch', config: { protocolVersion: 2 } }, async ({ client }) => {
    await assert.rejects(() => client.initialize(), (err) => {
      assert.ok(err instanceof AcpClientError);
      assert.equal(err.code, ACP_ERROR.PROTOCOL_MISMATCH);
      assert.match(err.message, /this bridge speaks 2/);
      return true;
    });
  });
});

/* --------------------------------------------------------------- ACP-02 */

test('ACP-02: session/new scopes the session to the configured absolute cwd', async () => {
  await withClient({ label: 'new' }, async ({ client, requestsSent }) => {
    const session = await client.newSession({ cwd: TEST_CWD });
    assert.match(session.sessionId, /^fake-session-/);
    assert.equal(session.cwd, TEST_CWD);

    const newSession = requestsSent().find((m) => m.method === 'session/new');
    assert.ok(newSession, 'session/new must have been sent');
    assert.equal(newSession.params.cwd, TEST_CWD, 'the session cwd must be an absolute path, pinned by the host');
    assert.deepEqual(newSession.params.mcpServers, [], 'no extension-supplied MCP servers may be forwarded');
  });
});

test('ACP-02: load, resume and fork with a mismatched cwd are refused and never sent', async () => {
  await withClient({ label: 'cwd' }, async ({ client, requestsSent }) => {
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });
    const before = requestsSent().length;

    for (const [name, call] of [
      ['loadSession', client.loadSession],
      ['resumeSession', client.resumeSession],
      ['forkSession', client.forkSession],
    ]) {
      await assert.rejects(
        () => call.call(client, { sessionId, cwd: 'C:/somewhere/else' }),
        (err) => {
          assert.ok(err instanceof AcpClientError, `${name} must fail with an AcpClientError`);
          assert.equal(err.code, ACP_ERROR.CWD_MISMATCH, name);
          assert.match(err.message, /does not match session/);
          return true;
        },
        `${name} must refuse a mismatched cwd`,
      );
    }

    const after = requestsSent();
    assert.equal(after.length, before, 'no request may reach the agent for a refused cwd');
    assert.equal(after.filter((m) => /^session\/(load|resume|fork)$/.test(m.method)).length, 0);

    // The matching cwd still works, so the check is not "always refuse".
    await client.loadSession({ sessionId, cwd: TEST_CWD });
    assert.ok(requestsSent().some((m) => m.method === 'session/load'));
  });
});

test('ACP-02: the agent refuses a mismatched cwd too, so both sides enforce ACP-02', async () => {
  // The local check is a convenience; this proves the guarantee does not depend
  // on it. Bypassing it needs a session the fake trusts with a different cwd,
  // which only the fake's own check can catch.
  await withClient({ label: 'cwd-agent-side' }, async ({ client, agentSaid }) => {
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });
    // Ask the agent directly, bypassing the client guard, using raw request().
    const answer = await client.request('session/resume', { sessionId, cwd: 'C:/not/the/session', mcpServers: [] })
      .then(() => null, (err) => err);

    assert.ok(answer, 'the agent must reject the mismatched cwd');
    assert.equal(answer.data.code, -32002);
    assert.match(answer.message, /failed/);
    assert.ok(agentSaid().some((m) => m.error?.code === -32002));
  });
});

test('ACP-02: a cwd outside the allowlist is refused before a session can be created', async () => {
  await withClient({ label: 'allowlist' }, async ({ client }) => {
    await assert.rejects(() => client.newSession({ cwd: 'C:/Windows/System32' }), (err) => {
      assert.equal(err.code, ACP_ERROR.CWD_NOT_ALLOWED);
      assert.match(err.message, /not in the host's allowlist/);
      return true;
    });
    assert.equal(client.sessionCount(), 0);
  });
});

test('ACP-02: an unknown session id is refused rather than forwarded', async () => {
  await withClient({ label: 'unknown-session' }, async ({ client, requestsSent }) => {
    await client.initialize();
    const before = requestsSent().length;
    await assert.rejects(
      () => client.loadSession({ sessionId: 'never-created', cwd: TEST_CWD }),
      (err) => err.code === ACP_ERROR.UNKNOWN_SESSION,
    );
    await assert.rejects(
      () => client.prompt({ sessionId: 'never-created', text: 'hi' }),
      (err) => err.code === ACP_ERROR.UNKNOWN_SESSION,
    );
    assert.equal(requestsSent().length, before, 'neither refusal may reach the agent');
  });
});

/* --------------------------------------------------------------- ACP-03 */

test('ACP-03: a prompt completes and surfaces the final stop reason', async () => {
  await withClient({ label: 'prompt' }, async ({ client }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });

    const updates = [];
    const outcome = await client.prompt({
      sessionId,
      text: 'summarise the repo',
      correlationId: 'task-1',
      onUpdate: (update, info) => updates.push({ update, sessionId: info.sessionId }),
    });

    assert.equal(outcome.stopReason, 'end_turn');
    assert.equal(outcome.sessionId, sessionId);
    assert.equal(client.hasActivePrompt(sessionId), false, 'the session is released after the turn');
    assert.equal(updates.length, 1);
    assert.equal(updates[0].update.sessionUpdate, 'agent_message_chunk');
    assert.equal(updates[0].update.content.text, 'echo: summarise the repo');
    assert.equal(updates[0].sessionId, sessionId);
  });
});

test('ACP-03: a refusal stop reason is surfaced verbatim, not normalised away', async () => {
  await withClient({ label: 'refusal' }, async ({ client }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });
    const outcome = await client.prompt({ sessionId, text: 'REFUSE this', onUpdate: () => {} });
    assert.equal(outcome.stopReason, 'refusal');
  });
});

/* --------------------------------------------------------------- ACP-05 */

test('ACP-05: a second concurrent prompt on one session is rejected, not interleaved', async () => {
  await withClient({ label: 'concurrent' }, async ({ client, requestsSent }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });

    const first = client.prompt({ sessionId, text: 'HOLD the first turn open', onUpdate: () => {} });
    await waitFor(() => client.hasActivePrompt(sessionId));
    const promptsSent = () => requestsSent().filter((m) => m.method === 'session/prompt').length;
    assert.equal(promptsSent(), 1);

    await assert.rejects(
      () => client.prompt({ sessionId, text: 'second turn', onUpdate: () => {} }),
      (err) => {
        assert.ok(err instanceof AcpClientError);
        assert.equal(err.code, ACP_ERROR.CONCURRENT_PROMPT);
        assert.match(err.message, /already has an active prompt/);
        return true;
      },
    );
    assert.equal(promptsSent(), 1, 'the rejected prompt must not have been sent at all');

    // The first turn is still ours, and the session frees up afterwards.
    assert.equal(client.cancel(sessionId).accepted, true);
    assert.equal((await first).stopReason, 'cancelled');
    assert.equal(client.hasActivePrompt(sessionId), false);
  });
});

test('ACP-05: the agent independently refuses a concurrent prompt as well', async () => {
  await withClient({ label: 'concurrent-agent' }, async ({ client, requestsSent }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });

    const held = client.prompt({ sessionId, text: 'HOLD', onUpdate: () => {} });
    await waitFor(() => client.hasActivePrompt(sessionId));

    // Go around the local guard to prove the agent enforces the same rule.
    const bypass = await client.request('session/prompt', {
      sessionId,
      prompt: [{ type: 'text', text: 'bypass the local guard' }],
    }).then(() => null, (err) => err);

    assert.ok(bypass, 'the agent must refuse the concurrent prompt');
    assert.equal(bypass.data.code, -32001);

    client.cancel(sessionId);
    await held;
  });
});

test('ACP-05: a prompt on a session with no active turn is allowed again afterwards', async () => {
  await withClient({ label: 'sequential' }, async ({ client }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });
    const first = await client.prompt({ sessionId, text: 'one', onUpdate: () => {} });
    const second = await client.prompt({ sessionId, text: 'two', onUpdate: () => {} });
    assert.equal(first.stopReason, 'end_turn');
    assert.equal(second.stopReason, 'end_turn');
  });
});

/* --------------------------------------------------------------- ACP-06 */

test('ACP-06: cancel yields the cancelled stop reason on the in-flight prompt', async () => {
  await withClient({ label: 'cancel' }, async ({ client, requestsSent }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });

    const pending = client.prompt({ sessionId, text: 'HOLD until cancelled', onUpdate: () => {} });
    await waitFor(() => client.hasActivePrompt(sessionId));

    const accepted = client.cancel(sessionId);
    assert.equal(accepted.accepted, true);
    assert.equal(accepted.sessionId, sessionId);

    const outcome = await pending;
    assert.equal(outcome.stopReason, 'cancelled');
    assert.equal(client.hasActivePrompt(sessionId), false);

    // cancel is a NOTIFICATION: no id, no response expected.
    const cancelMessage = requestsSent().find((m) => m.method === 'session/cancel');
    assert.ok(cancelMessage, 'session/cancel must be sent');
    assert.equal('id' in cancelMessage, false, 'session/cancel is a notification, not a request');
    assert.deepEqual(cancelMessage.params, { sessionId });
  });
});

test('ACP-06: cancelling with no active prompt is refused rather than silently ignored', async () => {
  await withClient({ label: 'cancel-idle' }, async ({ client }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });
    assert.throws(() => client.cancel(sessionId), (err) => err.code === ACP_ERROR.NOT_PROMPTED);
    assert.throws(() => client.cancel('never-created'), (err) => err.code === ACP_ERROR.UNKNOWN_SESSION);
  });
});

/* --------------------------------------------------------------- ACP-09 */

test('ACP-09: child death is detected, fails in-flight work and orphans nothing', async () => {
  const exits = [];
  await withClient({ label: 'crash', onExit: (info) => exits.push(info) }, async ({ client }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });
    assert.equal(client.sessionCount(), 1);

    const pending = client.prompt({ sessionId, text: 'CRASH the agent', onUpdate: () => {} });
    await assert.rejects(() => pending, (err) => {
      assert.ok(err instanceof AcpClientError);
      assert.equal(err.code, ACP_ERROR.AGENT_GONE);
      return true;
    });

    await waitFor(() => client.status() === CLIENT_STATUS.DEAD);
    assert.equal(client.status(), CLIENT_STATUS.DEAD);
    assert.equal(client.sessionCount(), 0, 'no orphaned session may survive the child');
    assert.deepEqual(client.sessionIds(), []);
    assert.equal(client.pendingRequestCount(), 0, 'no request may stay pending forever');
    assert.equal(client.lastExit().code, 7);
    assert.equal(exits.length, 1);
    assert.equal(exits[0].sessions, 1);

    // A stale session id is now a lie and must be refused.
    await assert.rejects(
      () => client.prompt({ sessionId, text: 'hello', onUpdate: () => {} }),
      (err) => err.code === ACP_ERROR.UNKNOWN_SESSION,
    );
  });
});

test('ACP-09: the bridge recovers by restarting into a brand new agent and session', async () => {
  await withClient({ label: 'restart' }, async ({ client }) => {
    await client.initialize();
    const first = await client.newSession({ cwd: TEST_CWD });

    const pending = client.prompt({ sessionId: first.sessionId, text: 'CRASH now', onUpdate: () => {} });
    await assert.rejects(() => pending, (err) => err.code === ACP_ERROR.AGENT_GONE);
    await waitFor(() => client.status() === CLIENT_STATUS.DEAD);

    await client.restart();
    assert.equal(client.status(), CLIENT_STATUS.READY);
    assert.equal(client.sessionCount(), 0, 'recovery must not resurrect the old session table');

    await client.initialize();
    const second = await client.newSession({ cwd: TEST_CWD });
    assert.notEqual(second.sessionId, first.sessionId, 'a restarted agent is a new process with new sessions');
    assert.equal(second.cwd, TEST_CWD);
    assert.equal((await client.prompt({ sessionId: second.sessionId, text: 'still works', onUpdate: () => {} })).stopReason, 'end_turn');
  });
});

test('ACP-09: an agent that dies before answering leaves nothing hanging', async () => {
  const client = createAcpClient({
    config: createConfig({
      expectedExtensionId: 'testextensionidtestextensionid',
      agentPath: NODE_EXE,
      agentArgs: [FAKE_AGENT, '--scenario', 'immediate_exit'],
      sessionCwd: TEST_CWD,
      timeouts: { spawnMs: 10_000, requestMs: 2_000, initializeMs: 2_000, promptMs: 0 },
    }),
    spawn: nodeSpawn,
    logger: createRedactingLogger({ sink: () => {} }),
  });

  await assert.rejects(() => client.initialize(), (err) => {
    assert.ok(err instanceof AcpClientError);
    assert.ok(
      [ACP_ERROR.AGENT_GONE, ACP_ERROR.REQUEST_FAILED, ACP_ERROR.SPAWN_FAILED].includes(err.code),
      `unexpected code ${err.code}`,
    );
    return true;
  });
  await waitFor(() => client.sessionCount() === 0);
  client.close();
});

test('ACP-09: a clean close is not reported as a crash', async () => {
  const exits = [];
  const { client } = harness({ label: 'clean-close', onExit: (info) => exits.push(info) });
  await client.initialize();
  await client.newSession({ cwd: TEST_CWD });
  client.close();
  await waitFor(() => client.lastExit() !== null);
  assert.equal(exits.length, 0, 'an intentional shutdown must not raise an agent-loss alert');
  assert.equal(client.lastExit().reason, 'closed');
});

/* --------------------------------------------------------------- ACP-10 */

test('ACP-10: no log output can reach the ACP stdout stream', async () => {
  await withClient({ label: 'stdout' }, async ({ client, logger, transcript, logLines, nonProtocolStdoutLines, agentSaid }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });

    // A deliberate log storm while the protocol is live: this is the exact shape
    // of the ACP-10 risk (a log call interleaved with protocol traffic).
    for (let i = 0; i < 200; i += 1) {
      logger.debug(`log line ${i}`, { sessionId, api_key: 'sk-live-SHOULD-NOT-APPEAR', nested: { password: 'hunter2' } });
      logger.info('starting a turn', { text: 'hello agent' });
      logger.warn('careful');
      logger.error('boom');
    }
    const outcome = await client.prompt({ sessionId, text: 'protocol still intact', onUpdate: () => {} });

    // 1. The agent still worked, so nothing contaminated its input.
    assert.equal(outcome.stopReason, 'end_turn');

    // 2. Everything the agent wrote to its stdout is JSON-RPC and nothing else.
    assert.deepEqual(nonProtocolStdoutLines(), [], 'a non-protocol line reached the ACP stdout stream');
    assert.ok(agentSaid().length >= 4);
    assert.ok(readFileSync(transcript, 'utf8').length > 0);

    // 3. The log lines went to the log sink, not the protocol stream.
    assert.ok(logLines.length >= 800, `expected the captured log lines, got ${logLines.length}`);
    assert.ok(logLines.some((line) => line.includes('log line 199')));
    assert.equal(transcriptLines(transcript).some((line) => line.includes('log line')), false);

    // 4. And the logs themselves are scrubbed (see ACP-11).
    const all = logLines.join('\n');
    assert.equal(all.includes('sk-live-SHOULD-NOT-APPEAR'), false);
    assert.equal(all.includes('hunter2'), false);
    assert.ok(all.includes('[redacted]'));
  });
});

test('ACP-10: the child stderr is drained to the log sink, never to ACP stdout', async () => {
  await withClient({ label: 'stderr' }, async ({ client, logLines }) => {
    await client.initialize();
    await waitFor(() => logLines.some((line) => line.includes('[fake-acp] fake acp agent starting')));
    assert.ok(
      logLines.some((line) => line.includes('acp-stderr:')),
      'the fake agent logs to stderr and that must arrive on the log channel',
    );
  });
});

/* --------------------------------------------------------------- ACP-11 */

test('ACP-11: no credential from agent output reaches an update, envelope or log', async () => {
  await withClient({ label: 'secret' }, async ({ client, logger, transcript, logLines }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });

    const updates = [];
    await client.prompt({
      sessionId,
      text: 'LEAK_SECRET into everything',
      onUpdate: (update) => updates.push(update),
    });

    // The fake really did emit the secret: the test would be vacuous otherwise.
    const emitted = transcriptLines(transcript).join('\n');
    assert.ok(emitted.includes(FAKE_SECRET), 'the fixture must actually leak a secret for this test to mean anything');
    assert.ok(emitted.includes('Bearer abcdef1234567890'));

    // The ACP wire payload still carries it (the client's job is transport)...
    assert.ok(JSON.stringify(updates).includes(FAKE_SECRET), 'the fixture leak must be visible at the client boundary');

    // ...but the host maps it through the allowlist, so nothing credential-shaped
    // can reach an envelope. Asserted against the real mapper.
    const { messageToEnvelopes } = await import('../src/envelope-map.js');
    const mapped = updates.map((update) => messageToEnvelopes(
      { method: 'session/update', params: { sessionId, update } },
      { nodeId: 'native-host:test' },
    )[0]);
    const mappedText = JSON.stringify(mapped);
    assert.equal(mappedText.includes(FAKE_SECRET), false, 'a credential reached a relay envelope');
    assert.equal(mappedText.includes('abcdef1234567890'), false, 'an authorization header reached a relay envelope');
    assert.equal(mappedText.includes('apiKey'), false, 'a credential key reached a relay envelope');
    assert.equal(mappedText.includes('C:/secret'), false, 'raw tool input leaked a filesystem path');

    // And nothing the logger emitted contains it.
    logger.info('turn finished', { updates });
    assert.equal(logLines.join('\n').includes(FAKE_SECRET), false, 'a credential reached a log line');
  });
});

/* ---------------------------------------------------- agent-initiated requests */

test('ACP: an agent->client request is answered method_not_found instead of hanging', async () => {
  const unsupported = [];
  await withClient({
    label: 'server-request',
    onUnsupportedRequest: (info) => unsupported.push(info),
  }, async ({ client, requestsSent }) => {
    await client.initialize();
    const { sessionId } = await client.newSession({ cwd: TEST_CWD });

    const outcome = await client.prompt({ sessionId, text: 'ASK_PERMISSION then finish', onUpdate: () => {} });

    assert.equal(outcome.stopReason, 'end_turn', 'the turn must complete rather than waiting on a request we refuse');
    assert.equal(unsupported.length, 1);
    assert.equal(unsupported[0].method, 'session/request_permission');

    // The client answers the agent's request, so that error travels client -> agent
    // and must be observed on requestsSent(), not agentSaid(). agentSaid() is the
    // agent's own stdout; watching that channel here would report 0 errors and
    // look like a hang, when the client in fact answered correctly.
    const errors = requestsSent().filter((m) => m.error);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].error.code, -32601);
    assert.match(errors[0].error.message, /does not implement/);
  });
});

test('ACP: an unsupported method surfaces the agent error instead of pretending it worked', async () => {
  await withClient({ label: 'unknown-method' }, async ({ client }) => {
    await client.initialize();
    await assert.rejects(() => client.request('fs/write_text_file', { path: 'C:/x', content: 'y' }), (err) => {
      assert.ok(err instanceof AcpClientError);
      assert.equal(err.code, ACP_ERROR.REQUEST_FAILED);
      assert.equal(err.data.code, -32601);
      return true;
    });
  });
});

test('ACP: using the client before it is started is refused with a clear code', async () => {
  const { client } = harness({ label: 'not-started' });
  assert.equal(client.status(), CLIENT_STATUS.IDLE);
  assert.throws(() => client.cancel('any'), (err) => err.code === ACP_ERROR.UNKNOWN_SESSION);
  await assert.rejects(() => client.request('session/list', {}), (err) => err.code === ACP_ERROR.NOT_STARTED);
  client.close();
});

/* ------------------------------------------------------------------ helpers */

async function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await delay(5);
  }
  throw new Error('timed out waiting for condition');
}

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}