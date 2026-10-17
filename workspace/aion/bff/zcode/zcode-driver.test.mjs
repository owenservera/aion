import test from "node:test"; import assert from "node:assert/strict";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { startMockHub } from "./mock-hub.mjs"; import { main, readToken } from "./zcode-driver.mjs";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zd-"));
function tokFile(t, mode = 0o600) { const f = path.join(tmp, "tok" + Math.random()); fs.writeFileSync(f, t); fs.chmodSync(f, mode); return f; }
const sink = () => { let s = ""; return { write: x => { s += x; }, get s() { return s; } }; };

test("full turn: create instance, stream reply, end_turn", async () => {
  const hub = await startMockHub(); const out = sink();
  try {
    const r = await main(["--hub", hub.url, "--workspace", "C:\\repo", "--prompt", "hi", "--token-file", tokFile(hub.token)], out);
    assert.equal(r.text, "Hello from mock ZCode"); assert.equal(r.stopReason, "end_turn"); assert.equal(r.instanceId, "inst_1");
    assert.match(out.s, /Hello from mock ZCode/); assert.ok(!out.s.includes(hub.token));
    assert.deepEqual(hub.log.find(l => l.create).create, { workspacePath: "C:\\repo" });
    assert.equal(hub.log.find(l => l.rpc === "session/prompt").m.params.prompt[0].text, "hi");
  } finally { await hub.close(); }
});
test("wrong token fails at auth stage", async () => {
  const hub = await startMockHub();
  try { await assert.rejects(main(["--hub", hub.url, "--workspace", "x", "--prompt", "hi", "--token-file", tokFile("bad")], sink()), /auth/); }
  finally { await hub.close(); }
});
test("permissions denied by default, allowed only with flag", async () => {
  const hub = await startMockHub({ askPermission: true });
  try {
    await main(["--hub", hub.url, "--workspace", "x", "--prompt", "hi", "--token-file", tokFile(hub.token)], sink());
    assert.equal(hub.log.find(l => l.permissionAnswer).permissionAnswer.outcome.optionId, "deny");
    hub.log.length = 0;
    await main(["--hub", hub.url, "--workspace", "x", "--prompt", "hi", "--allow-permissions", "--token-file", tokFile(hub.token)], sink());
    assert.equal(hub.log.find(l => l.permissionAnswer).permissionAnswer.outcome.optionId, "allow");
  } finally { await hub.close(); }
});
test("token file permissions enforced per platform", () => {
  if (process.platform === "win32") {
    // NTFS has no POSIX mode bits, so 0644-vs-0600 is unrepresentable here.
    // Assert the check does not false-positive on a real temp token file.
    assert.doesNotThrow(() => readToken(tokFile("x")));
  } else {
    assert.throws(() => readToken(tokFile("x", 0o644)), /0600/);
  }
});
test("token file must live outside the tracked tree", () => {
  const tracked = path.join(os.tmpdir(), "workspace", "aion", "tok");
  fs.mkdirSync(path.dirname(tracked), { recursive: true });
  fs.writeFileSync(tracked, "x"); fs.chmodSync(tracked, 0o600);
  if (process.platform === "win32") fs.chmodSync(tracked, 0o666);
  try { assert.throws(() => readToken(tracked), /outside the tracked/); }
  finally { fs.rmSync(tracked, { force: true }); }
});
test("unreachable hub fails at health stage", async () => {
  await assert.rejects(main(["--hub", "http://127.0.0.1:1", "--workspace", "x", "--prompt", "hi", "--token-file", tokFile("x")], sink()), /health/);
});
