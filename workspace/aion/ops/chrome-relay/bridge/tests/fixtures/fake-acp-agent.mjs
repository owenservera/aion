#!/usr/bin/env node
// AION Relay Bridge test fixture — a FAKE ACP agent child.
//
// Speaks newline-delimited JSON-RPC on stdin/stdout exactly like `opencode acp`,
// so the whole test suite can exercise the real client code path without the
// real binary, a network port, a browser or an extension. It is a script, not
// an agent: it has no model, no filesystem access and no capability beyond
// echoing the protocol.
//
// It also writes two audit files, because two acceptance tests are assertions
// about what did and did NOT appear on a stream:
//
//   --transcript <file>  every byte it wrote to its own stdout (ACP-10)
//   --stderr-log <file>  everything it wrote to its own stderr
//
// Usage: node fake-acp-agent.mjs [--scenario <name>] [--transcript <f>] [--stderr-log <f>]

import { writeFileSync, appendFileSync } from 'node:fs';
import { argv, stdin, stdout, stderr } from 'node:process';

function argOf(name, fallback = null) {
  const index = argv.indexOf(name);
  return index >= 0 && index + 1 < argv.length ? argv[index + 1] : fallback;
}

const scenario = argOf('--scenario', 'basic');
const transcriptPath = argOf('--transcript');
const stderrLogPath = argOf('--stderr-log');

/** Lines this fake wrote to its own stdout, verbatim. */
function recordOut(text) {
  if (transcriptPath) appendFileSync(transcriptPath, text);
}

/** Log to stderr ONLY. stdout is the protocol channel (ACP-10). */
function log(line) {
  if (stderrLogPath) appendFileSync(stderrLogPath, `${line}\n`);
  stderr.write(`[fake-acp] ${line}\n`);
}

let nextSession = 1;

// Session ids are PROCESS-scoped in ACP (the dossier: the ACP process closes
// when its parent stdin closes), so the pid is part of the id. That makes a
// restarted agent's ids genuinely different rather than accidentally equal.
const sessionPrefix = `fake-session-${process.pid}`;

const sessions = new Map(); // sessionId -> { cwd }
const prompts = new Map(); // requestId -> { sessionId, cancelled }

const INITIALIZE_RESULT = {
  protocolVersion: 1,
  agentCapabilities: { loadSession: true },
  mcpCapabilities: { http: true, sse: false },
  promptCapabilities: { embeddedContext: true, image: true },
  sessionCapabilities: ['additionalDirectories', 'close', 'delete', 'fork', 'list', 'resume'],
  authMethods: [{ id: 'opencode-login' }],
  agentInfo: { name: 'OpenCode', version: '2.0.32' },
};

function send(message) {
  const line = `${JSON.stringify(message)}\n`;
  recordOut(line);
  stdout.write(line);
}

function respond(id, result) {
  send({ jsonrpc: '2.0', id, result: result ?? {} });
}

function respondError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function notify(method, params) {
  send({ jsonrpc: '2.0', method, params });
}

// Agent-initiated REQUEST (carries an id, so the client must answer it).
// In real ACP - and as AION's own working zcode acp-core.mjs guards with
// `m.id != null` - session/request_permission is a request, not a notification.
// Sending it as a notification here would silently skip the client's
// agent->client request path and make the test assert nothing.
let nextAgentRequestId = 900;
function agentRequest(method, params) {
  send({ jsonrpc: '2.0', id: nextAgentRequestId++, method, params });
}

log(`fake acp agent starting (scenario=${scenario})`);
log(`a token that must never appear in a relay envelope: sk-live-FAKEFAKEFAKEFAKEFAKE`);

if (transcriptPath) writeFileSync(transcriptPath, '');
if (stderrLogPath) writeFileSync(stderrLogPath, '');

function handle(message) {
  const { id, method, params = {} } = message;

  switch (method) {
    case 'initialize':
      log('initialize');
      respond(id, INITIALIZE_RESULT);
      return;

    case 'session/new': {
      const cwd = params.cwd;
      if (typeof cwd !== 'string' || cwd === '') {
        respondError(id, -32602, 'cwd is required');
        return;
      }
      const sessionId = `${sessionPrefix}-${nextSession++}`;
      sessions.set(sessionId, { cwd });
      log(`session/new -> ${sessionId} @ ${cwd}`);
      respond(id, { sessionId });
      return;
    }

    case 'session/load':
    case 'session/resume':
    case 'session/fork': {
      const known = sessions.get(params.sessionId);
      // The real agent enforces this too; proving BOTH sides refuse a mismatched
      // cwd is the point of ACP-02.
      if (!known || known.cwd !== params.cwd) {
        log(`refusing ${method}: cwd mismatch (session=${params.sessionId} want=${params.cwd} have=${known?.cwd})`);
        respondError(id, -32002, 'cwd does not match the session working directory');
        return;
      }
      log(`${method} -> ${params.sessionId}`);
      const newId = method === 'session/fork' ? `${sessionPrefix}-${nextSession++}` : params.sessionId;
      if (method === 'session/fork') sessions.set(newId, { cwd: known.cwd });
      respond(id, { sessionId: newId });
      return;
    }

    case 'session/list':
      respond(id, {
        sessions: [...sessions.entries()].map(([sessionId, entry]) => ({ sessionId, cwd: entry.cwd })),
        hasMore: false,
      });
      return;

    case 'session/prompt': {
      const sessionId = params.sessionId;
      const known = sessions.get(sessionId);
      if (!known) {
        respondError(id, -32003, `unknown session ${sessionId}`);
        return;
      }
      // ACP-05 at the agent side: one active prompt per session.
      for (const [requestId, entry] of prompts) {
        if (entry.sessionId === sessionId) {
          log(`refusing concurrent prompt on ${sessionId} (held by ${requestId})`);
          respondError(id, -32001, 'a prompt is already in progress for this session');
          return;
        }
      }

      const text = Array.isArray(params.prompt)
        ? params.prompt.filter((block) => block?.type === 'text').map((block) => block.text).join('\n')
        : '';
      prompts.set(id, { sessionId, cancelled: false, text });
      log(`session/prompt on ${sessionId}: ${text}`);

      // Injected instructions, selected by prompt text, so tests control the
      // agent's behaviour without restarting it.
      if (text.includes('HOLD')) {
        log(`holding prompt ${id} open`);
        return;
      }
      if (text.includes('CRASH')) {
        log(`exiting without answering prompt ${id}`);
        process.exit(7);
      }
      if (text.includes('ASK_PERMISSION')) {
        agentRequest('session/request_permission', { sessionId, toolCall: { toolCallId: 't1' } });
      }
      if (text.includes('LEAK_SECRET')) {
        notify('session/update', {
          sessionId,
          update: {
            sessionUpdate: 'agent_message_chunk',
            content: { type: 'text', text: 'here is sk-live-FAKEFAKEFAKEFAKEFAKE and Bearer abcdef1234567890' },
          },
        });
        notify('session/update', {
          sessionId,
          update: {
            sessionUpdate: 'tool_call',
            toolCallId: 'call-1',
            title: 'read file',
            status: 'pending',
            rawInput: { apiKey: 'sk-live-FAKEFAKEFAKEFAKEFAKE', path: 'C:/secret' },
          },
        });
      }

      notify('session/update', {
        sessionId,
        update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: `echo: ${text}` } },
      });

      const stopReason = text.includes('REFUSE') ? 'refusal' : 'end_turn';
      finishPrompt(id, stopReason);
      return;
    }

    case 'session/cancel': {
      const sessionId = params.sessionId;
      for (const [requestId, entry] of prompts) {
        if (entry.sessionId === sessionId) {
          entry.cancelled = true;
          log(`cancel -> prompt ${requestId} marked cancelled`);
          finishPrompt(requestId, 'cancelled');
          return;
        }
      }
      log(`cancel for ${sessionId}: no active prompt`);
      return;
    }

    default:
      log(`method not found: ${method}`);
      if (id !== undefined) respondError(id, -32601, `method not found: ${method}`);
      return;
  }
}

/** Answer a held prompt, unless a cancel already answered it. */
function finishPrompt(requestId, stopReason) {
  const entry = prompts.get(requestId);
  if (!entry) return;
  prompts.delete(requestId);
  respond(requestId, { stopReason });
}

let buffer = '';
stdin.setEncoding('utf8');
stdin.on('data', (chunk) => {
  buffer += chunk;
  let index = buffer.indexOf('\n');
  while (index >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (line !== '') {
      let message;
      try {
        message = JSON.parse(line);
      } catch (err) {
        log(`ignoring non-JSON stdin line: ${line.slice(0, 60)}`);
        continue;
      }
      handle(message);
    }
    index = buffer.indexOf('\n');
  }
});
stdin.on('end', () => {
  log('stdin closed; exiting like a real ACP agent (private per-process server)');
  process.exit(0);
});

if (scenario === 'immediate_exit') {
  log('scenario immediate_exit: dying before any request');
  process.exit(3);
}