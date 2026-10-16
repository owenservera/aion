#!/usr/bin/env node
// BFF → ZCode driver. Usage:
//   ZCODE_SOCKS=localhost:1055 node zcode-driver.mjs --hub https://<pc>.ts.net/hub --workspace C:\path\repo --prompt "..." [--instance id] [--token-file ~/.zcode-token] [--json]
// Token: 0600 file outside tracked folders (default $ZCODE_TOKEN_FILE or ~/.zcode-token). Never printed.
// Permissions are DENIED unless --allow-permissions is given (no yolo by default).
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import WebSocket from "ws"; import { makeHub, runTurn } from "./acp-core.mjs";
import http from "node:http"; import https from "node:https"; import { SocksProxyAgent } from "socks-proxy-agent";

// fetch-compatible shim over node http(s) so a SOCKS agent can be used (undici fetch ignores agents).
export function agentFetch(agent) {
  return (url, opts = {}) => new Promise((resolve, reject) => {
    const u = new URL(url); const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(u, { method: opts.method || "GET", headers: opts.headers || {}, agent, timeout: 20000 }, res => {
      let b = ""; res.setEncoding("utf8"); res.on("data", c => b += c);
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: async () => b }));
    });
    req.on("timeout", () => req.destroy(new Error("timeout"))); req.on("error", reject);
    if (opts.body) req.write(opts.body); req.end();
  });
}
// SOCKS: --socks host:port, or $ZCODE_SOCKS; "--socks off" disables. socks5h = remote DNS (MagicDNS).
function transport(socks) {
  if (!socks || socks === "off") return { fetchImpl: globalThis.fetch, WS: WebSocket };
  const agent = new SocksProxyAgent(`socks5h://${socks}`);
  class WS extends WebSocket { constructor(u) { super(u, { agent }); } }
  return { fetchImpl: agentFetch(agent), WS };
}

export function readToken(file) {
  const st = fs.statSync(file);
  if ((st.mode & 0o077) !== 0) throw new Error(`token file ${file} must be mode 0600 (is ${(st.mode & 0o777).toString(8)})`);
  if (path.resolve(file).startsWith("/workspace/aion")) throw new Error("token file must live outside the tracked /workspace/aion tree");
  const t = fs.readFileSync(file, "utf8").trim(); if (!t) throw new Error("empty token file"); return t;
}
function args(argv) { const o = {}; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (!a.startsWith("--")) continue; const k = a.slice(2); const v = argv[i + 1]; if (v === undefined || v.startsWith("--")) o[k] = true; else { o[k] = v; i++; } } return o; }

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const a = args(argv);
  const tokenFile = a["token-file"] || process.env.ZCODE_TOKEN_FILE || path.join(os.homedir(), ".zcode-token");
  if (!a.hub || !a.prompt || (!a.workspace && !a.instance)) throw new Error("need --hub, --prompt and --workspace (or --instance)");
  const tr = transport(a.socks ?? process.env.ZCODE_SOCKS);
  const hub = makeHub({ base: a.hub, token: readToken(tokenFile), fetchImpl: tr.fetchImpl });
  const chk = await hub.check(); if (!chk.ok) throw new Error(`hub check failed at ${chk.stage}: ${chk.error}`);
  const decide = a["allow-permissions"] ? async p => (p.options || []).find(o => /allow_once/.test(o.kind || ""))?.optionId : undefined;
  const r = await runTurn({ hub, workspacePath: a.workspace, instanceId: a.instance, prompt: a.prompt, WebSocketImpl: tr.WS, decidePermission: decide,
    onEvent: e => { if (a.json) return; if (e.type === "chunk") out.write(e.text); else if (e.type === "tool") out.write(`\n[tool ${e.status || ""}] ${e.title || e.id}\n`); else if (e.type === "permission") out.write(`\n[permission "${e.title}" → ${e.decided}]\n`); } });
  out.write(a.json ? JSON.stringify(r) + "\n" : `\n--- instance=${r.instanceId} session=${r.sessionId} stop=${r.stopReason}\n`);
  return r;
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error("zcode-driver:", e.message); process.exit(1); });
