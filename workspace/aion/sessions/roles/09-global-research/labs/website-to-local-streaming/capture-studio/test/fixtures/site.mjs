// Synthetic test site reproducing the transport patterns the studio must handle.
// No real website data; deterministic content.
import http from 'node:http';
import { createHash } from 'node:crypto';

const PAGE = `<!doctype html><html><head><title>Fixture Chat</title></head><body>
<main>
  <h1>Fixture conversation</h1>
  <div id="thread"></div>
  <ul id="items"></ul>
  <textarea id="prompt" aria-label="Message"></textarea>
  <button id="ask">Send</button>
  <button id="ask-long">Send long</button>
</main>
<script>
const thread = document.getElementById('thread');
async function ask(long) {
  const msg = document.createElement('div'); msg.className = 'msg assistant'; msg.setAttribute('data-role', 'assistant');
  const p = document.createElement('p'); msg.appendChild(p); thread.appendChild(msg);
  const r = await fetch('/api/conversation' + (long ? '?long=1' : ''), { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer SECRET-REQUEST-TOKEN-1234567890' }, body: JSON.stringify({ prompt: 'hi' }) });
  const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '', text = '';
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\\n\\n')) >= 0) {
      const ev = buf.slice(0, i); buf = buf.slice(i + 2);
      const data = ev.split('\\n').filter(l => l.startsWith('data: ')).map(l => l.slice(6)).join('\\n');
      if (data === '[DONE]') continue;
      try { const j = JSON.parse(data); if (typeof j.v === 'string') { text += j.v; p.textContent = text; } } catch {}
    }
  }
}
document.getElementById('ask').onclick = () => ask(false);
document.getElementById('ask-long').onclick = () => ask(true);
fetch('/api/auth/session').then(r => r.json());
fetch('/api/items').then(r => r.json()).then(j => { const ul = document.getElementById('items'); for (const it of j.items) { const li = document.createElement('li'); li.className = 'item'; li.innerHTML = '<a href="https://example.org/' + it.id + '">' + it.title + '</a> <time datetime="' + it.created_at + '">' + it.created_at + '</time>'; ul.appendChild(li); } });
for (let i = 0; i < 3; i++) fetch('/api/beacon', { method: 'POST', body: 'x' });
window.es = new EventSource('/api/events');
window.ws = new WebSocket('ws://' + location.host + '/ws');
window.ws.onopen = () => window.ws.send(JSON.stringify({ type: 'subscribe', token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ3cyJ9.c2lnbmF0dXJlc2lnbmF0dXJl' }));
fetch('/api/feed').then(r => r.text());
</script></body></html>`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const LONG_WORDS = 400;

function wsAccept(key) { return createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64'); }
function wsFrame(text) {
  const payload = Buffer.from(text);
  const header = payload.length < 126 ? Buffer.from([0x81, payload.length]) : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 255]);
  return Buffer.concat([header, payload]);
}

export function startSite(port = 0) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
    if (url.pathname === '/api/auth/session') {
      res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': 'sid=SECRET-COOKIE; HttpOnly' });
      return res.end(JSON.stringify({ user: { name: 'Fixture' }, accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.c2lnbmF0dXJlLXNpZ25hdHVyZQ', expires: '2099-01-01' }));
    }
    if (url.pathname === '/api/items') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ items: Array.from({ length: 6 }, (_, i) => ({ id: `0000000${i}-aaaa-bbbb-cccc-1234567890ab`, title: `Item ${i}`, created_at: `2026-10-2${i}T10:00:00Z`, score: i * 1.5 })) }));
    }
    if (url.pathname === '/api/beacon') { req.resume(); res.writeHead(204); return res.end(); }
    if (url.pathname === '/api/conversation') {
      req.resume();
      res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' });
      const id = '11111111-2222-3333-4444-555555555555';
      res.write(`event: delta_encoding\ndata: "v1"\n\n`);
      res.write(`data: ${JSON.stringify({ v: { message: { id, author: { role: 'assistant' }, create_time: 1792500000, content: { content_type: 'text', parts: [''] }, status: 'in_progress' }, conversation_id: '99999999-8888-7777-6666-555555555555' } })}\n\n`);
      const words = url.searchParams.get('long') ? Array.from({ length: LONG_WORDS }, (_, i) => `word${i} `) : ['Hello', ' from', ' the', ' fixture', ' stream', '. This sentence is long enough to correlate with the DOM.'];
      let first = true;
      for (const w of words) {
        await sleep(url.searchParams.get('long') ? 2 : 30);
        res.write(`data: ${JSON.stringify(first ? { p: '/message/content/parts/0', o: 'append', v: w } : { v: w })}\n\n`);
        first = false;
      }
      res.write(`data: ${JSON.stringify({ p: '', o: 'patch', v: [{ p: '/message/status', o: 'replace', v: 'finished_successfully' }] })}\n\n`);
      res.write(': keep-alive comment\n\n');
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    if (url.pathname === '/api/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      for (let i = 0; i < 3; i++) { await sleep(50); res.write(`event: notice\nid: ${i}\ndata: ${JSON.stringify({ type: 'notice', n: i })}\n\n`); }
      await sleep(50);
      return res.end();
    }
    if (url.pathname === '/api/feed') {
      res.writeHead(200, { 'content-type': 'application/x-ndjson' });
      for (let i = 0; i < 4; i++) { await sleep(20); res.write(JSON.stringify({ type: 'row', row: i, label: `row ${i}` }) + '\n'); }
      return res.end();
    }
    res.writeHead(404); res.end();
  });
  server.on('upgrade', (req, socket) => {
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${wsAccept(req.headers['sec-websocket-key'])}\r\n\r\n`);
    let n = 0;
    const t = setInterval(() => { if (n >= 3) { clearInterval(t); return; } socket.write(wsFrame(JSON.stringify({ type: 'update', seq: n++, conversation_id: '99999999-8888-7777-6666-555555555555' }))); }, 60);
    socket.on('data', () => {});
    socket.on('error', () => {});
    socket.on('close', () => clearInterval(t));
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, url: `http://127.0.0.1:${server.address().port}/` })));
}

if (process.argv[1] && process.argv[1].endsWith('site.mjs')) startSite(Number(process.argv[2] ?? 8787)).then((s) => console.log(`fixture site on ${s.url}`));
