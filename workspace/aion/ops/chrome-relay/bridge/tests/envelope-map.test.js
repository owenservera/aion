// Envelope <-> ACP mapping tests.
//
// Three formats meet here and must stay separate:
//   Chrome length-prefixed framing | ACP newline JSON-RPC | AION relay envelope
// These tests pin the boundary: a relay envelope becomes an ACP request and
// nothing else; an ACP message becomes a relay envelope or a clear error,
// never a guess.

import assert from 'node:assert/strict';
import test from 'node:test';

import { createEnvelope, validateEnvelope } from '../../extension/src/lib/index.js';
import {
  ACP_KNOWN_METHODS,
  DISPATCHABLE_EVENT_TYPES,
  MAP_ERROR,
  EnvelopeMapError,
  MAX_TEXT_CHARS,
  STOP_REASON_EVENTS,
  acpUpdateFromEnvelope,
  dropSecretFields,
  envelopeToRequest,
  extractRequestedCwd,
  messageToEnvelopes,
  projectAcpUpdate,
  scrubString,
} from '../src/envelope-map.js';

const NODE = 'native-host:com.aion.relay';

function approved(overrides = {}) {
  return createEnvelope({
    event_type: 'task.approved',
    producer_node: 'extension-relay',
    target_role: 'operator',
    correlation_id: 'task-42',
    payload: { text: 'do the thing' },
    ...overrides,
  });
}

function ctx(extra = {}) {
  return { nodeId: NODE, nextSequence: makeCounter(), correlationId: 'task-42', ...extra };
}

function makeCounter(start = 1) {
  let n = start - 1;
  return () => {
    n += 1;
    return n;
  };
}

/* ------------------------------------------------- direction 1: relay -> ACP */

test('envelope-map: task.approved translates to exactly one session/prompt request', () => {
  const env = approved();
  const request = envelopeToRequest(env, { resolveSessionId: () => 'acp-session-1' });

  assert.equal(request.method, 'session/prompt');
  assert.equal(request.correlation_id, 'task-42');
  assert.deepEqual(request.params, {
    sessionId: 'acp-session-1',
    prompt: [{ type: 'text', text: 'do the thing' }],
  });
  // Nothing from the envelope leaks into the ACP params beyond what ACP has.
  assert.deepEqual(Object.keys(request.params).sort(), ['prompt', 'sessionId']);
  assert.deepEqual(Object.keys(request.params.prompt[0]).sort(), ['text', 'type']);
});

test('envelope-map: task.cancelled translates to session/cancel', () => {
  const env = createEnvelope({
    event_type: 'task.cancelled',
    producer_node: 'extension-relay',
    correlation_id: 'task-42',
    payload: { session_id: 'acp-session-7' },
  });
  const request = envelopeToRequest(env, {});
  assert.equal(request.method, 'session/cancel');
  assert.deepEqual(request.params, { sessionId: 'acp-session-7' });
});

test('envelope-map: an unmapped relay event is a clear error, never a guessed request', () => {
  for (const eventType of ['task.proposed', 'relay.hello', 'proof.verified', 'role.tab_presence', 'delivery.ack']) {
    const env = createEnvelope({ event_type: eventType, producer_node: 'extension-relay', payload: {} });
    assert.throws(() => envelopeToRequest(env, {}), (err) => {
      assert.ok(err instanceof EnvelopeMapError);
      assert.equal(err.code, MAP_ERROR.UNMAPPED_ENVELOPE_EVENT);
      assert.match(err.message, new RegExp(eventType.replace('.', '\\.')));
      assert.match(err.message, /task\.approved, task\.cancelled/);
      return true;
    });
  }
  // task.proposed must NOT be dispatchable: approval precedes dispatch.
  assert.deepEqual(DISPATCHABLE_EVENT_TYPES, ['task.approved', 'task.cancelled']);
});

test('envelope-map: an invalid envelope is refused before it can become a request', () => {
  const broken = approved();
  delete broken.producer_node;
  assert.throws(() => envelopeToRequest(broken, {}), (err) => err.code === MAP_ERROR.INVALID_ENVELOPE);
});

test('envelope-map: a dispatch without text or a session is refused', () => {
  assert.throws(
    () => envelopeToRequest(approved({ payload: {} }), { resolveSessionId: () => 's1' }),
    (err) => err.code === MAP_ERROR.MISSING_PAYLOAD_FIELD && err.field === 'text',
  );
  assert.throws(
    () => envelopeToRequest(approved(), {}),
    (err) => err.code === MAP_ERROR.MISSING_PAYLOAD_FIELD && err.field === 'session_id',
  );
  assert.throws(
    () => envelopeToRequest(approved({ payload: { text: 'x'.repeat(40000) } }), { resolveSessionId: () => 's1' }),
    (err) => err.code === MAP_ERROR.MISSING_PAYLOAD_FIELD,
  );
});

test('envelope-map: an extension-supplied cwd is surfaced for the host allowlist check', () => {
  assert.equal(extractRequestedCwd(approved({ payload: { text: 'x' } })), null);
  assert.equal(extractRequestedCwd(approved({ payload: { text: 'x', cwd: 'C:/elsewhere' } })), 'C:/elsewhere');
  assert.equal(extractRequestedCwd(approved({ payload: { text: 'x', cwd: '' } })), null);
  assert.equal(extractRequestedCwd(approved({ payload: 'not an object' })), null);
  // And it never reaches the ACP params on its own.
  const request = envelopeToRequest(approved({ payload: { text: 'x', cwd: 'C:/elsewhere' } }), { resolveSessionId: () => 's1' });
  assert.equal(JSON.stringify(request.params).includes('elsewhere'), false, 'cwd is not an ACP prompt parameter');
});

/* ------------------------------------------------- direction 2: ACP -> relay */

test('envelope-map: initialize becomes a relay.capabilities envelope', () => {
  const [env] = messageToEnvelopes({
    result: {
      protocolVersion: 1,
      agentCapabilities: { loadSession: true },
      mcpCapabilities: { http: true, sse: false },
      promptCapabilities: { embeddedContext: true, image: true },
      sessionCapabilities: ['close', 'resume'],
      authMethods: [{ id: 'opencode-login' }],
      agentInfo: { name: 'OpenCode', version: '2.0.32' },
    },
  }, ctx({ acpMethod: 'initialize' }));

  assert.equal(validateEnvelope(env).valid, true);
  assert.equal(env.event_type, 'relay.capabilities');
  assert.equal(env.producer_node, NODE);
  assert.equal(env.payload.protocol_version, 1);
  assert.equal(env.payload.agent_name, 'OpenCode');
  assert.equal(env.payload.agent_version, '2.0.32');
  assert.deepEqual(env.payload.agent_capabilities, { loadSession: true });
  assert.deepEqual(env.payload.mcp_capabilities, { http: true, sse: false });
  assert.deepEqual(env.payload.auth_methods, ['opencode-login'], 'auth method ids, never credentials');
});

test('envelope-map: session/new becomes a relay.health envelope carrying the session id', () => {
  const [env] = messageToEnvelopes({ result: { sessionId: 'acp-1' } }, ctx({
    acpMethod: 'session/new', sessionCwd: 'C:/repo',
  }));
  assert.equal(validateEnvelope(env).valid, true);
  assert.equal(env.event_type, 'relay.health');
  assert.equal(env.payload.stage, 'session.created');
  assert.equal(env.payload.acp_session_id, 'acp-1');
  assert.equal(env.payload.session_cwd, 'C:/repo');
  assert.equal(env.payload.taxonomy, 'non-task');
});

test('envelope-map: a prompt result maps its stop reason to the documented event', () => {
  for (const [stopReason, expected] of Object.entries(STOP_REASON_EVENTS)) {
    const [env] = messageToEnvelopes({ result: { stopReason } }, ctx({ acpMethod: 'session/prompt' }));
    assert.equal(validateEnvelope(env).valid, true, `${stopReason} produced an invalid envelope`);
    assert.equal(env.event_type, expected.event_type, `stop reason ${stopReason}`);
    assert.equal(env.task_state, expected.task_state, `stop reason ${stopReason}`);
    assert.equal(env.payload.stop_reason, stopReason);
  }
});

test('envelope-map: an unknown stop reason fails closed to task.blocked', () => {
  const [env] = messageToEnvelopes({ result: { stopReason: 'weird_new_reason' } }, ctx({ acpMethod: 'session/prompt' }));
  assert.equal(env.event_type, 'task.blocked');
  assert.equal(env.task_state, 'BLOCKED');
  assert.equal(env.payload.recognised_stop_reason, false);
});

test('envelope-map: end_turn is NOT proof (contract: completion never implies verified proof)', () => {
  const [env] = messageToEnvelopes({ result: { stopReason: 'end_turn' } }, ctx({ acpMethod: 'session/prompt' }));
  assert.equal(env.event_type, 'task.progress');
  assert.equal(env.task_state, 'RUNNING');
  assert.notEqual(env.event_type, 'proof.submitted');
  assert.notEqual(env.task_state, 'VERIFIED');
  assert.notEqual(env.task_state, 'PROOF_SUBMITTED');
});

test('envelope-map: a cancelled stop reason produces task.cancelled', () => {
  const [env] = messageToEnvelopes({ result: { stopReason: 'cancelled' } }, ctx({ acpMethod: 'session/prompt' }));
  assert.equal(env.event_type, 'task.cancelled');
  assert.equal(env.task_state, 'CANCELLED');
});

test('envelope-map: a JSON-RPC error response becomes task.blocked with the detail retained', () => {
  const [env] = messageToEnvelopes({
    error: { code: -32002, message: 'cwd does not match the session working directory' },
  }, ctx({ acpMethod: 'session/load' }));
  assert.equal(env.event_type, 'task.blocked');
  assert.equal(env.task_state, 'BLOCKED');
  assert.equal(env.payload.acp_error_code, -32002);
  assert.match(env.payload.acp_error_message, /cwd does not match/);
});

test('envelope-map: session/update becomes a task.progress envelope caused by the dispatch', () => {
  const [env] = messageToEnvelopes({
    method: 'session/update',
    params: {
      sessionId: 'acp-1',
      update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'working on it' } },
    },
  }, ctx({ acpMethod: 'session/update', causationId: 'dispatch-uuid', sessionId: 'acp-1' }));

  assert.equal(validateEnvelope(env).valid, true);
  assert.equal(env.event_type, 'task.progress');
  assert.equal(env.task_state, 'RUNNING');
  assert.equal(env.causation_id, 'dispatch-uuid');
  assert.equal(env.correlation_id, 'task-42');
  assert.equal(env.payload.kind, 'agent_message_chunk');
  assert.equal(env.payload.text, 'working on it');
  assert.equal(env.payload.reasoning_only, false);
});

test('envelope-map: an agent->client request becomes an operator alert, not a silent hang', () => {
  const [env] = messageToEnvelopes({
    id: 'srv-1',
    method: 'session/request_permission',
    params: { sessionId: 'acp-1' },
  }, ctx({ acpMethod: 'session/prompt' }));

  assert.equal(validateEnvelope(env).valid, true);
  assert.equal(env.event_type, 'operator.alert');
  assert.equal(env.payload.alert, 'acp_message_not_implemented');
  assert.equal(env.payload.method, 'session/request_permission');
  assert.equal(env.payload.taxonomy, 'non-task');
});

test('envelope-map: an unmapped ACP method produces a clear error rather than a guessed envelope', () => {
  for (const method of ['fs/write_text_file', 'terminal/create', 'session/nonsense', 'authenticate']) {
    assert.throws(() => messageToEnvelopes({ result: {} }, ctx({ acpMethod: method })), (err) => {
      assert.ok(err instanceof EnvelopeMapError);
      assert.equal(err.code, MAP_ERROR.UNMAPPED_ACP_METHOD);
      assert.match(err.message, new RegExp(method.replace(/[/_]/g, '.')));
      assert.deepEqual(err.known, ACP_KNOWN_METHODS);
      return true;
    });
  }
});

test('envelope-map: a response with no method context is refused, never guessed', () => {
  assert.throws(() => messageToEnvelopes({ result: { sessionId: 'x' } }, ctx()), (err) => {
    assert.equal(err.code, MAP_ERROR.UNMAPPED_ACP_METHOD);
    assert.match(err.message, /without knowing which method/);
    return true;
  });
  assert.throws(() => messageToEnvelopes(null, ctx({ acpMethod: 'initialize' })), (err) => {
    assert.equal(err.code, MAP_ERROR.INVALID_ACP_MESSAGE);
    return true;
  });
  assert.throws(() => messageToEnvelopes([{ result: {} }], ctx({ acpMethod: 'initialize' })), (err) => {
    assert.equal(err.code, MAP_ERROR.INVALID_ACP_MESSAGE);
    return true;
  });
});

/* ------------------------------------------------------------ round-trip */

test('envelope-map: relay -> ACP -> relay round-trips without losing correlation or identity', () => {
  const env = approved({ message_id: 'msg-1', correlation_id: 'task-42' });
  const request = envelopeToRequest(env, { sessionId: 'acp-session-1' });

  // The ACP reply a real agent sends for that prompt.
  const [result] = messageToEnvelopes({ result: { stopReason: 'end_turn' } }, ctx({
    acpMethod: request.method,
    correlationId: request.correlation_id,
    causationId: env.message_id,
    sessionId: request.params.sessionId,
  }));

  assert.equal(result.correlation_id, env.correlation_id, 'correlation survives the round trip');
  assert.equal(result.causation_id, env.message_id, 'causation points back at the dispatch envelope');
  assert.equal(result.payload.acp_session_id, request.params.sessionId, 'session id survives the round trip');
  assert.equal(result.payload.stop_reason, 'end_turn');
  assert.equal(validateEnvelope(result).valid, true);
});

test('envelope-map: a session id from an ACP reply flows back into the next request', () => {
  const [health] = messageToEnvelopes({ result: { sessionId: 'acp-session-9' } }, ctx({ acpMethod: 'session/new' }));

  // The extension learns the session id, then approves a task that targets it.
  const followUp = approved({ payload: { text: 'continue', session_id: health.payload.acp_session_id } });
  const request = envelopeToRequest(followUp, {});
  assert.equal(request.params.sessionId, 'acp-session-9');
});

test('envelope-map: an ACP update round-trips back to its ACP shape', () => {
  const updates = [
    { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'hello' } },
    { sessionUpdate: 'agent_thought_chunk', content: { type: 'text', text: 'thinking' } },
    { sessionUpdate: 'tool_call', toolCallId: 'call-1', title: 'read', status: 'completed', rawInput: { secret: 'x' } },
    { sessionUpdate: 'plan', entries: [{ content: 'step one', status: 'pending', priority: 'high' }] },
    { sessionUpdate: 'current_mode_update', currentModeId: 'build' },
  ];

  for (const update of updates) {
    const [env] = messageToEnvelopes({ method: 'session/update', params: { sessionId: 'acp-1', update } }, ctx({
      acpMethod: 'session/update',
    }));
    const rebuilt = acpUpdateFromEnvelope(env);
    assert.equal(rebuilt.sessionUpdate, update.sessionUpdate, `round trip failed for ${update.sessionUpdate}`);
    if (update.sessionUpdate.endsWith('_chunk')) {
      assert.equal(rebuilt.content.text, update.content.text);
    }
    if (update.sessionUpdate === 'tool_call') {
      assert.equal(rebuilt.toolCallId, 'call-1');
      assert.equal(rebuilt.title, 'read');
      assert.equal(rebuilt.status, 'completed');
      assert.equal('rawInput' in rebuilt, false, 'rawInput must not survive the round trip');
    }
  }
});

test('envelope-map: acpUpdateFromEnvelope refuses anything that is not task.progress', () => {
  assert.throws(() => acpUpdateFromEnvelope(approved()), (err) => err.code === MAP_ERROR.INVALID_ENVELOPE);
  assert.throws(() => acpUpdateFromEnvelope({ event_type: 'task.progress' }), (err) => err.code === MAP_ERROR.INVALID_ENVELOPE);
});

/* ------------------------------------------------------ projection + secrets */

test('envelope-map: unknown update kinds are reported, never copied verbatim', () => {
  const projection = projectAcpUpdate({ sessionUpdate: 'agent_cheats', secretPayload: { token: 'x' } });
  assert.equal(projection.kind, 'unrecognised');
  assert.equal(projection.unrecognised, true);
  assert.equal(JSON.stringify(projection).includes('token'), false);
});

test('envelope-map: tool_call rawInput and content are dropped, not sanitised', () => {
  const projection = projectAcpUpdate({
    sessionUpdate: 'tool_call',
    toolCallId: 'call-1',
    title: 'read file',
    status: 'pending',
    rawInput: { apiKey: 'sk-live-should-never-appear', path: 'C:/Users/someone/.env' },
    content: [{ type: 'content', text: 'file contents' }],
  });
  const serialised = JSON.stringify(projection);
  assert.equal(serialised.includes('sk-live'), false);
  assert.equal(serialised.includes('.env'), false);
  assert.equal(serialised.includes('file contents'), false);
  assert.deepEqual(projection.redacted_fields, ['rawInput', 'content']);
  assert.equal(projection.tool_call_id, 'call-1');
});

test('envelope-map: agent text is bounded and scrubbed', () => {
  const projection = projectAcpUpdate({
    sessionUpdate: 'agent_message_chunk',
    content: { type: 'text', text: `token sk-live-ABCDEFGHIJKLMNOPQRST ${'x'.repeat(MAX_TEXT_CHARS * 2)}` },
  });
  assert.ok(projection.text.length <= MAX_TEXT_CHARS);
  assert.equal(projection.truncated, true);
  assert.equal(projection.text.includes('sk-live'), false);
});

test('envelope-map: secret-shaped keys are dropped and only their NAMES are kept', () => {
  const scrubbed = dropSecretFields({
    keep: 'visible',
    api_key: 'sk-live-1',
    authorization: 'Bearer abc',
    cookie: 'session=1',
    nested: { password: 'hunter2', idempotency_key: 'safe-to-keep' },
  });
  assert.deepEqual(scrubbed, { keep: 'visible', nested: { idempotency_key: 'safe-to-keep' } });
  assert.equal(JSON.stringify(scrubbed).includes('hunter2'), false);
  assert.equal(JSON.stringify(scrubbed).includes('sk-live'), false);
  assert.equal(
    scrubbed.nested.idempotency_key,
    'safe-to-keep',
    'a redactor that eats idempotency_key breaks dedupe without protecting anything',
  );
});

test('envelope-map: credential-shaped values are scrubbed even under innocent keys', () => {
  assert.match(scrubString('Authorization: Bearer abcdef1234567890'), /\[redacted\]/);
  assert.match(scrubString('key is sk-ant-abcdefghijklmnopqrstuvwx'), /\[redacted\]/);
  assert.match(scrubString('ghp_abcdefghijklmnopqrstuvwxyz012345'), /\[redacted\]/);
  assert.match(scrubString('xoxb-1234567890-abcdefghij'), /\[redacted\]/);
  assert.equal(scrubString('nothing to see here'), 'nothing to see here');
});

test('envelope-map: emitted sequences are monotonic within one mapping context', () => {
  let n = 0;
  const counter = () => { n += 1; return n; };
  const a = messageToEnvelopes({ method: 'session/update', params: { sessionId: 's', update: { sessionUpdate: 'plan', entries: [] } } }, ctx({ nextSequence: counter }))[0];
  const b = messageToEnvelopes({ result: { stopReason: 'end_turn' } }, ctx({ acpMethod: 'session/prompt', nextSequence: counter }))[0];
  assert.equal(a.sequence, 1);
  assert.equal(b.sequence, 2);
  assert.ok(b.sequence > a.sequence, 'sequence must be monotonic so a consumer can order them');
});

test('envelope-map: a relay envelope is never handed to the ACP writer as JSON-RPC', async () => {
  // The structural guard: an envelope has no `jsonrpc` field, so the framing
  // layer's classifier rejects it. This is why "never forward an envelope as
  // ACP" is a property of the code, not a convention.
  const { classifyJsonRpcMessage } = await import('../src/framing.js');
  assert.equal(classifyJsonRpcMessage(approved()), 'invalid');
  assert.equal(classifyJsonRpcMessage({ result: { sessionId: 'x' } }), 'invalid', 'a bare result without jsonrpc is not JSON-RPC');
});