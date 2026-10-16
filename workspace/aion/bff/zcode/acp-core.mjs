// ZCode hub client core — shared by BFF driver (Node) and Pocket PWA (browser).
// Contract mirrors zcode-pocket Kotlin HubApi.kt / AcpClient.kt / AcpProtocol.kt.
// No secrets here: token is always passed in by the caller.
export const CORE_VERSION = "p1.0.0";

export function normBase(u) { return String(u || "").trim().replace(/\/+$/, ""); }

export function makeHub({ base, token, fetchImpl = globalThis.fetch }) {
  const b = normBase(base);
  if (!/^https?:\/\//.test(b)) throw new Error("hub URL must start with http(s)://");
  const auth = { Authorization: `Bearer ${token}` };
  async function req(path, opts = {}) {
    const r = await fetchImpl(b + path, { ...opts, headers: { ...auth, ...(opts.headers || {}) } });
    const text = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status} ${text.slice(0, 160).trim()}`);
    return text;
  }
  return {
    base: b,
    async health() { try { const r = await fetchImpl(b + "/api/health"); return r.ok && (await r.text()).trim().startsWith("ok"); } catch { return false; } },
    // Authenticated check: health is unauthenticated on the hub, so prove the token too.
    async check() {
      if (!(await this.health())) return { ok: false, stage: "health", error: "hub not reachable" };
      try { const inst = JSON.parse(await req("/api/instances")); return { ok: true, instances: inst.length ?? 0 }; }
      catch (e) { return { ok: false, stage: "auth", error: e.message }; }
    },
    async instances() { return JSON.parse(await req("/api/instances")); },
    async createInstance(workspacePath, sessionId) {
      const body = { workspacePath }; if (sessionId) body.sessionId = sessionId;
      const r = JSON.parse(await req("/api/instances", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
      if (!r.id) throw new Error("create returned no instance id");
      return r.id;
    },
    acpUrl(instanceId) {
      return b.replace(/^http/, "ws") + `/acp?instance=${encodeURIComponent(instanceId)}&token=${encodeURIComponent(token)}`;
    },
  };
}

// One ACP connection. onEvent receives {type, ...}: chunk|thought|tool|permission|other.
// Permissions default to DENY (reject option) unless decidePermission returns an optionId.
export function openAcp({ url, WebSocketImpl = globalThis.WebSocket, onEvent = () => {}, decidePermission }) {
  const ws = new WebSocketImpl(url);
  let next = 1; const pending = new Map();
  const send = o => ws.send(JSON.stringify(o));
  const opened = new Promise((res, rej) => {
    ws.addEventListener("open", () => res());
    ws.addEventListener("error", e => rej(new Error("websocket error" + (e?.message ? ": " + e.message : ""))));
  });
  ws.addEventListener("close", ev => { for (const p of pending.values()) p.reject(new Error(`closed (${ev?.code ?? "?"})`)); pending.clear(); onEvent({ type: "closed", code: ev?.code }); });
  ws.addEventListener("message", async ev => {
    let m; try { m = JSON.parse(typeof ev.data === "string" ? ev.data : String(ev.data)); } catch { return; }
    if (m.id != null && !m.method) {
      const p = pending.get(String(m.id)); if (!p) return; pending.delete(String(m.id));
      m.error ? p.reject(new Error(m.error.message || "rpc error")) : p.resolve(m.result ?? {});
      return;
    }
    if (m.method === "session/update") {
      const u = m.params?.update || {};
      const text = u.content?.text ?? (Array.isArray(u.content) ? u.content.map(c => c.text || "").join("") : "");
      if (u.sessionUpdate === "agent_message_chunk") onEvent({ type: "chunk", text });
      else if (u.sessionUpdate === "agent_thought_chunk") onEvent({ type: "thought", text });
      else if (u.sessionUpdate === "tool_call" || u.sessionUpdate === "tool_call_update") onEvent({ type: "tool", id: u.toolCallId, title: u.title, status: u.status });
      else onEvent({ type: "other", kind: u.sessionUpdate });
      return;
    }
    if (m.method === "session/request_permission" && m.id != null) {
      const opts = m.params?.options || [];
      let optionId = decidePermission ? await decidePermission(m.params) : null;
      if (!optionId) optionId = (opts.find(o => /reject/.test(o.kind || "")) || {}).optionId;
      onEvent({ type: "permission", title: m.params?.toolCall?.title, decided: optionId || "cancelled" });
      send({ jsonrpc: "2.0", id: m.id, result: { outcome: optionId ? { outcome: "selected", optionId } : { outcome: "cancelled" } } });
      return;
    }
    if (m.id != null && m.method) send({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: "not supported by client" } });
  });
  function call(method, params) {
    const id = next++;
    return new Promise((resolve, reject) => { pending.set(String(id), { resolve, reject }); send({ jsonrpc: "2.0", id, method, params }); });
  }
  return {
    opened, call, close: () => ws.close(1000, "bye"),
    initialize: () => call("initialize", { protocolVersion: 1, clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } }, clientInfo: { name: "zcode-pocket", version: CORE_VERSION } }),
    newSession: cwd => call("session/new", { ...(cwd ? { cwd } : {}), mcpServers: [] }),
    prompt: (sessionId, text) => call("session/prompt", { sessionId, prompt: [{ type: "text", text }] }),
    cancel: sessionId => send({ jsonrpc: "2.0", method: "session/cancel", params: { sessionId } }),
  };
}

// Full turn: (optionally create instance) → connect → initialize → session/new → prompt. Returns {instanceId, sessionId, stopReason, text}.
export async function runTurn({ hub, workspacePath, instanceId, prompt, onEvent = () => {}, WebSocketImpl, decidePermission }) {
  const id = instanceId || await hub.createInstance(workspacePath);
  let text = "";
  const acp = openAcp({ url: hub.acpUrl(id), WebSocketImpl, decidePermission, onEvent: e => { if (e.type === "chunk") text += e.text; onEvent(e); } });
  await acp.opened;
  try {
    await acp.initialize();
    const s = await acp.newSession(workspacePath);
    const r = await acp.prompt(s.sessionId, prompt);
    return { instanceId: id, sessionId: s.sessionId, stopReason: r.stopReason, text };
  } finally { acp.close(); }
}
