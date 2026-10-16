// Mock ZCode hub for tests: REST + /acp websocket, token-checked, streams a reply.
import http from "node:http"; import { WebSocketServer } from "ws";
export function startMockHub({ token = "t".repeat(48), port = 0, reply = ["Hello", " from", " mock ZCode"], askPermission = false } = {}) {
  const log = [];
  const instances = [];
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
    if (u.pathname === "/api/health") { res.writeHead(200, cors); return res.end("ok"); }
    if (req.headers.authorization !== `Bearer ${token}`) { res.writeHead(401, cors); return res.end("unauthorized"); }
    if (u.pathname === "/api/instances" && req.method === "GET") { res.writeHead(200, { ...cors, "content-type": "application/json" }); return res.end(JSON.stringify(instances)); }
    if (u.pathname === "/api/instances" && req.method === "POST") {
      let b = ""; req.on("data", c => b += c); req.on("end", () => {
        const j = JSON.parse(b || "{}"); const id = "inst_" + (instances.length + 1);
        instances.push({ id, workspacePath: j.workspacePath }); log.push({ create: j });
        res.writeHead(200, { ...cors, "content-type": "application/json" }); res.end(JSON.stringify({ id }));
      }); return;
    }
    res.writeHead(404, cors); res.end("nope");
  });
  const wss = new WebSocketServer({ noServer: true });
  srv.on("upgrade", (req, sock, head) => {
    const u = new URL(req.url, "http://x");
    if (u.pathname !== "/acp" || u.searchParams.get("token") !== token || !instances.find(i => i.id === u.searchParams.get("instance"))) { sock.write("HTTP/1.1 401 Unauthorized\r\n\r\n"); return sock.destroy(); }
    wss.handleUpgrade(req, sock, head, ws => {
      const send = o => ws.send(JSON.stringify(o));
      ws.on("message", async raw => {
        const m = JSON.parse(String(raw)); log.push({ rpc: m.method ?? "response", m });
        if (m.method === "initialize") return send({ jsonrpc: "2.0", id: m.id, result: { protocolVersion: 1, agentCapabilities: {} } });
        if (m.method === "session/new") return send({ jsonrpc: "2.0", id: m.id, result: { sessionId: "sess_mock_1" } });
        if (m.method === "session/prompt") {
          const sid = m.params.sessionId;
          if (askPermission) {
            const answer = new Promise(r => ws.once("message", x => r(JSON.parse(String(x)))));
            send({ jsonrpc: "2.0", id: "perm1", method: "session/request_permission", params: { sessionId: sid, toolCall: { title: "write file" }, options: [{ optionId: "allow", kind: "allow_once" }, { optionId: "deny", kind: "reject_once" }] } });
            const a = await answer; log.push({ permissionAnswer: a.result });
          }
          for (const t of reply) { send({ jsonrpc: "2.0", method: "session/update", params: { sessionId: sid, update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: t } } } }); await new Promise(r => setTimeout(r, 5)); }
          return send({ jsonrpc: "2.0", id: m.id, result: { stopReason: "end_turn" } });
        }
      });
    });
  });
  return new Promise(r => srv.listen(port, "127.0.0.1", () => r({ url: `http://127.0.0.1:${srv.address().port}`, token, log, close: () => new Promise(c => { wss.clients.forEach(c => c.terminate()); srv.close(c); }) })));
}
