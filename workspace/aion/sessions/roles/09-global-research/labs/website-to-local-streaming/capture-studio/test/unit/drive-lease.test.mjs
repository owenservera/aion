import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { acquireDriveLease, inspectDriveLease, recoverDriveLease } from '../../src/capture/drive-lease.mjs';
import { driveSite } from '../../src/capture/actions.mjs';

function temp(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'drive-lease-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
test('exclusive lease includes holder, releases idempotently, and other ports remain independent', (t) => {
  const root = temp(t), a = acquireDriveLease({ root, port: 19222, holder: { kind: 'conversation', id: 'a' } });
  assert.throws(() => acquireDriveLease({ root, port: 19222 }), (e) => e.status === 409 && e.holder.id === 'a');
  const b = acquireDriveLease({ root, port: 19223 }); b.release(); a.release(); a.release();
  acquireDriveLease({ root, port: 19222 }).release();
});
test('unreadable/dead/changed ownership is never silently stolen or released', (t) => {
  const root = temp(t), a = acquireDriveLease({ root, port: 19222 });
  const file = path.join(root, '19222', 'owner.json');
  fs.writeFileSync(file, '{broken');
  assert.throws(() => acquireDriveLease({ root, port: 19222 }), /lease is held/);
  assert.throws(() => a.release(), /unreadable/);
  fs.writeFileSync(file, JSON.stringify({ token: 'not-ours', pid: 99999999 }));
  assert.throws(() => a.release(), /ownership changed/);
  assert.throws(() => acquireDriveLease({ root, port: 19222 }), /lease is held/);
});
test('two independent processes contend deterministically: exactly one owns until release', async (t) => {
  const root = temp(t), moduleUrl = new URL('../../src/capture/drive-lease.mjs', import.meta.url).href;
  const code = `import {acquireDriveLease} from ${JSON.stringify(moduleUrl)};
    try { const lease=acquireDriveLease(${JSON.stringify({ root, port: 19222 })});
      console.log(JSON.stringify({owned:true})); process.stdin.once('data',()=>{lease.release();process.exit(0)});
    } catch(e) {console.log(JSON.stringify({owned:false,code:e.code}));}`;
  const children = [0, 1].map(() => spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: ['pipe', 'pipe', 'pipe'] }));
  t.after(() => { for (const child of children) child.kill(); });
  const outputs = await Promise.all(children.map((child) => new Promise((resolve, reject) => {
    let out = ''; child.on('error', reject); child.stdout.on('data', (s) => { out += s; if (out.includes('\n')) resolve(JSON.parse(out.trim())); });
    child.stderr.on('data', (s) => reject(new Error(String(s))));
  })));
  assert.equal(outputs.filter((o) => o.owned).length, 1);
  assert.equal(outputs.find((o) => !o.owned).code, 'DRIVE_LEASE_BUSY');
  const winner = children[outputs.findIndex((o) => o.owned)];
  const exited = new Promise((resolve) => winner.once('exit', resolve)); winner.stdin.write('release\n'); await exited;
  acquireDriveLease({ root, port: 19222 }).release();
});
test('lowest legacy driveSite entry respects conversation lease before any browser call', async (t) => {
  const root = temp(t), old = process.env.LOCALAPPDATA;
  process.env.LOCALAPPDATA = root;
  t.after(() => { if (old === undefined) delete process.env.LOCALAPPDATA; else process.env.LOCALAPPDATA = old; });
  const lease = acquireDriveLease({ port: 19222, holder: { kind: 'conversation', id: 'chat' } });
  try { await assert.rejects(driveSite({ port: 19222 }), (e) => e.code === 'DRIVE_LEASE_BUSY' && e.holder.id === 'chat'); }
  finally { lease.release(); }
});

test('explicit lease inspection/recovery requires matching token and proven-dead owner', async (t) => {
  const root = temp(t), port = 19222;
  const live = acquireDriveLease({ root, port });
  const info = inspectDriveLease({ root, port }); assert.equal(info.ownerState, 'alive');
  assert.throws(() => recoverDriveLease({ root, port, token: info.token, pid: info.pid }), /NOT_PROVEN_DEAD/);
  assert.throws(() => recoverDriveLease({ root, port, token: 'wrong', pid: info.pid }), /OWNER_MISMATCH/);
  live.release(); assert.equal(inspectDriveLease({ root, port }).exists, false);
  const moduleUrl = new URL('../../src/capture/drive-lease.mjs', import.meta.url).href;
  const code = `import {acquireDriveLease} from ${JSON.stringify(moduleUrl)}; acquireDriveLease(${JSON.stringify({ root, port })});`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: 'ignore' });
  await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', (exit) => exit === 0 ? resolve() : reject(new Error('child failed'))); });
  const stale = inspectDriveLease({ root, port }); assert.equal(stale.ownerState, 'dead');
  assert.throws(() => acquireDriveLease({ root, port }), /lease is held/); // Still never automatic.
  assert.equal(recoverDriveLease({ root, port, token: stale.token, pid: stale.pid }).recovered, true);
  acquireDriveLease({ root, port }).release();
});

test('unknown or corrupt lease metadata cannot be recovered', (t) => {
  const root = temp(t), port = 19222, lease = acquireDriveLease({ root, port });
  fs.writeFileSync(path.join(root, String(port), 'owner.json'), '{broken');
  assert.equal(inspectDriveLease({ root, port }).ownerState, 'unknown');
  assert.throws(() => recoverDriveLease({ root, port, token: lease.token, pid: lease.pid }), /OWNER_MISMATCH/);
});
