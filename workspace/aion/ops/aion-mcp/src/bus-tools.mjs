// AION MCP — Bus ingress tools (CONDITIONAL; Bus V1/V2 Option B path).
//
// Listed only when AION_BUS_STATE names the Node runner's ledger file:
//   aion_bus_status   read-only: registry, grants, command states. No text.
// Listed only when ALSO AION_MCP_BUS_WRITE=1 (an explicit owner switch, and
// only meaningful once ChatGPT custom-MCP write entitlement is confirmed):
//   aion_bus_command  RESERVES one command through the same grammar, grant,
//                     rate and nonce checks as a chat turn. It never executes:
//                     the runner (`aion-bus dispatch-pending --live`) attempts
//                     fresh reservations once and halts stale ones.
// The server itself still spawns nothing, opens no port and reads no transcript.

const STATE = process.env.AION_BUS_STATE || '';
const WRITE = process.env.AION_MCP_BUS_WRITE === '1';

export function busToolsEnabled() { return { status: STATE !== '', write: STATE !== '' && WRITE }; }

export function busToolDefinitions() {
  const { status, write } = busToolsEnabled();
  const out = [];
  if (status) out.push({
    name: 'aion_bus_status',
    description: 'Read the local AION bus ledger: agents and bindings, grants, command states and delivery states. A bound agent is a registry entry, not a running process. No command text or replies are returned.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { title: 'Read AION bus status', readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  });
  if (write) out.push({
    name: 'aion_bus_command',
    description: 'Reserve ONE owner-granted command for a registered AION agent (e.g. the OpenCode executor). Validated against the owner grant, rate limit and single-use nonce; the local runner executes it at most once. Returns RESERVED or a refusal reason. Does not wait for a result.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['op', 'to', 'nonce'],
      properties: {
        op: { type: 'string', enum: ['send', 'cancel'] },
        to: { type: 'string', pattern: '^[a-z0-9][a-z0-9._-]{0,63}$' },
        text: { type: 'string', maxLength: 2000 },
        nonce: { type: 'string', pattern: '^[A-Za-z0-9_-]{6,64}$' },
      } },
    annotations: { title: 'Reserve AION bus command', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  });
  return out;
}

async function openBus() {
  const [{ createFileStorage }, { createBus }, { createAcpExecutorAdapter }, { createOpenCodeV2Adapter }] = await Promise.all([
    import('../../chrome-relay/bus/node-storage.js'),
    import('../../chrome-relay/extension/src/bus/bus.js'),
    import('../../chrome-relay/extension/src/bus/adapters/acp-executor.js'),
    import('../../chrome-relay/extension/src/bus/adapters/opencode-v2.js'),
  ]);
  // Manifest-only adapters: validation needs their capabilities; this process
  // never delivers (relay/client are absent, so a delivery would be a no-send).
  const adapters = [createAcpExecutorAdapter({ relay: null }), createOpenCodeV2Adapter({ client: {} })];
  return createBus({ storage: createFileStorage(STATE), adapters, initialConfig: { report_back: false, ops_enabled: ['send', 'status', 'cancel'] } });
}

export async function callBusTool(name, args) {
  const { status, write } = busToolsEnabled();
  if (name === 'aion_bus_status' && status) {
    if (Object.keys(args).length) throw new Error('unexpected_argument');
    const s = await (await openBus()).status();
    return { ok: true, snapshot: true, kill: s.kill.engaged, commander: s.commander,
      agents: s.agents.map((a) => ({ agent_id: a.agent_id, parent: a.parent_agent_id, kind: a.kind, status: a.status, adapter: a.adapter })),
      grants: s.grants.map((g) => ({ grant_id: g.grant_id, agents: g.agents, ops: g.ops, used: g.used_count, max: g.max_count, expires_utc: g.expires_utc, revoked: g.revoked })),
      commands: s.commands.slice(-20).map((c) => ({ command_id: c.command_id, op: c.op, to: c.to, state: c.state, delivery: c.delivery, reason: c.reason, origin: c.origin_kind })),
      note: 'A bound agent is not a running process. Delivery states are the runner\'s records, not independent proof.' };
  }
  if (name === 'aion_bus_command' && write) {
    for (const k of Object.keys(args)) if (!['op', 'to', 'text', 'nonce'].includes(k)) throw new Error('unexpected_argument');
    if (!['send', 'cancel'].includes(args.op)) throw new Error('invalid_bus_command');
    const bus = await openBus();
    const r = await bus.ingestStructured({ op: args.op, to: args.to, text: args.op === 'send' ? String(args.text ?? '') : null, nonce: args.nonce, origin_ref: 'mcp:aion_bus_command' });
    return r.accepted ? { ok: true, command_id: r.command_id, state: 'RESERVED', note: 'Reserved only. The local runner dispatches fresh reservations once; nothing has executed yet.' }
      : { ok: false, refused: r.reason, detail: r.detail ?? null };
  }
  return undefined;
}
