// Frontend-only, deterministic Chat UI checks. No browser, no Chrome/CDP, no live data.
// One test starts the Studio server on loopback with an injected fake runtime to prove /chat is really served.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const read = (name) => readFileSync(new URL('../../src/studio/ui/' + name, import.meta.url), 'utf8');
const html = read('chat.html');
const source = read('chat.mjs');
const ui = await import('../../src/studio/ui/chat.mjs'); // importing must not touch document or fetch

const READY = { ready: true, draft: { present: false, chars: 0 }, reason: null };
const ready = (extra = {}) => ({
  id: 'c1', revision: 3, state: 'ready', site: 'chatgpt', binding: { targetId: 't1', origin: 'https://chatgpt.com', ownedByStudio: false },
  sessionId: 's1', turn: null, readiness: READY, diagnostic: { finishPhase: 'idle', finishError: null, uncertainty: null },
  reply: { state: 'unknown', source: 'page', text: '', chars: 0, completion: 'unknown' },
  capture: { state: 'recording', integrity: null }, limitations: [], ...extra,
});
const blockedTurn = (reason = 'DRAFT_PRESENT') => ({ id: 'a1', phase: 'blocked', reason, send: { state: 'not-attempted', observationSource: null } });
const draftBlocked = (extra = {}) => ready({
  state: 'blocked', readiness: { ready: false, draft: { present: true, chars: 9 }, reason: 'DRAFT_PRESENT' }, turn: blockedTurn(), ...extra,
});

test('chat.mjs imports cleanly outside a browser and exposes pure helpers', () => {
  for (const name of ['canSend', 'pickSnapshot', 'captureChip', 'sourceLabel', 'replyBlocks', 'isAmbiguous', 'pollDelay', 'readinessPanel', 'pendingRegistered', 'explainError'])
    assert.equal(typeof ui[name], 'function', name);
});

test('Studio really serves /chat and /ui/chat.mjs (loopback, injected fake runtime, no browser)', async (t) => {
  const { startStudio } = await import('../../src/studio/server.mjs');
  const { dataPaths, ensureDataDirs } = await import('../../src/config.mjs');
  const { ProfileStore } = await import('../../src/profiles/profiles.mjs');
  const root = mkdtempSync(path.join(os.tmpdir(), 'chat-ui-'));
  const paths = dataPaths(root); ensureDataDirs(paths);
  const runtime = { isSessionActive: () => false, close: async () => {}, targets: async () => ({ sites: [], targets: [] }), list: async () => [] };
  const studio = await startStudio({ paths, profileStore: new ProfileStore(paths.profiles), port: 0, token: 'fixture-token', conversationRuntime: runtime });
  t.after(async () => { await studio.close(); rmSync(root, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${studio.port}`, auth = { 'x-studio-token': 'fixture-token' };

  assert.equal((await fetch(base + '/chat')).status, 401, 'needs the studio token');
  const page = await fetch(base + '/chat', { headers: auth });
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(await page.text(), html);
  const script = await fetch(base + '/ui/chat.mjs', { headers: auth });
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);
  assert.equal(await script.text(), source);
  assert.equal((await fetch(base + '/chat', { method: 'POST', headers: auth })).status, 405);
  assert.equal((await fetch(base + '/drive', { headers: auth })).status, 200, '/drive is retained');
  assert.equal((await (await fetch(base + '/api/v1/conversation-targets', { headers: auth })).json()).sites.length, 0);
});

test('page is a module-only, CSP-safe document with every referenced element present', () => {
  assert.match(html, /<script type="module" src="\/ui\/chat\.mjs"><\/script>/);
  assert.equal((html.match(/<script(?![^>]*\bsrc=)[^>]*>/g) ?? []).length, 0, 'no inline script');
  assert.doesNotMatch(html, /\son[a-z]+=/i, 'no inline event handlers');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const used = [...source.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g)].map((m) => m[1]);
  assert.ok(used.length > 30);
  for (const id of new Set(used)) assert.ok(ids.has(id), 'missing #' + id);
  assert.doesNotMatch(source, /\.innerHTML\s*=/, 'site text is never injected as HTML');
  for (const gone of ['btnSame', 'draftPanel', 'btnDraft']) assert.ok(!html.includes(gone), gone + ' was replaced');
});

test('controls are labelled, placeholder is the plain composer text, and hit areas are 44px', () => {
  assert.match(html, /<label for="prompt"[^>]*>Message<\/label>/);
  assert.match(html, /placeholder="Write a message to this website"/);
  assert.match(html, /maxlength="2000"/);
  assert.match(html, /<label for="site"[^>]*>Site<\/label>/);
  assert.match(html, /role="radiogroup" aria-labelledby="tabsLabel"/);
  assert.match(html, /button, select, input\[type=text\], textarea, summary, a\.hit \{ min-height: 44px; \}/);
  assert.match(html, /\.pick \{[^}]*min-height: 44px/);
  assert.match(html, /:focus-visible/);
  for (const label of ['Open a new tab', 'Use a tab I already have open', 'Connect and start recording', 'Send message…', 'Send now', 'Finish capture', 'Also close the tab Studio opened', 'Check again (read-only)', 'Switch to Chrome', 'Resolve draft in Chrome', 'Calibrate sites', 'Recover request status', 'Check status'])
    assert.ok(html.includes(label), label);
  assert.match(html, /We can’t confirm your message was sent\. Studio will not send it again\./);
  assert.match(html, /@media \(min-width: 1100px\)[\s\S]*340px/);
  // Progressive disclosure: Details is collapsed on narrow screens and only forced open on wide ones by script.
  assert.match(html, /<details class="panel" id="detailsBox">/);
  assert.match(source, /wide\?\.matches\) \$\('#detailsBox'\)\.open = true/);
  // No fixed minimum width that could push a 390px screen sideways; the pinned composer releases on short screens.
  assert.doesNotMatch(html.slice(html.indexOf('<style>'), html.indexOf('</style>')), /(?<![-(])min-width:\s*(?!0\b)\d{3,}px/);
  assert.match(html, /@media \(max-height: 640px\) \{ \.composer \{ position: static;/);
  assert.ok(!html.includes('Send the same request again'), 'ambiguous resend label removed');
  assert.match(html, /uses the same request ID and does not repeat an already registered send/);
});

test('keyboard contract: Enter is a newline, Ctrl/Cmd+Enter opens confirmation, Esc closes only confirmation', () => {
  assert.match(source, /e\.key === 'Enter' && \(e\.ctrlKey \|\| e\.metaKey\)\) \{ e\.preventDefault\(\); openConfirm\(\); \}/);
  assert.match(source, /e\.key === 'Escape' && S\.confirmOpen/);
  const keydown = source.slice(source.indexOf("$('#prompt').addEventListener('keydown'"), source.indexOf("document.addEventListener('keydown'"));
  assert.doesNotMatch(keydown, /sendNow/, 'Ctrl+Enter never sends');
  assert.equal((source.match(/sendNow\(/g) ?? []).length, 3, 'definition plus exactly two click handlers');
});

test('existing pages stay: default view is Capture, /drive remains, Chat is linked additively', () => {
  const index = read('index.html'), live = read('live.html'), drive = read('drive.html');
  assert.match(index, /<button data-view="capture" aria-current="page">Capture<\/button>/);
  assert.match(index, /<section class="view on" id="v-capture">/);
  assert.match(index, /href="\/chat">Chat<\/a>/);
  assert.match(index, /href="\/drive">Live drive<\/a>/);
  assert.match(live, /href="\/chat">Chat<\/a>/);
  assert.match(live, /href="\/drive">Live drive<\/a>/);
  assert.match(drive, /href="\/chat">Chat<\/a>/);
  assert.match(html, /href="\/drive">Calibrate sites<\/a>/);
});

test('capture is never shown as accepted unless the evaluator says accepted', () => {
  assert.equal(ui.captureChip('accepted')[0], 'Capture accepted');
  for (const state of ['recording', 'finalizing', 'incomplete', 'rejected', 'verified', 'ok', 'complete', '', undefined, null]) {
    assert.notEqual(ui.captureChip(state)[0], 'Capture accepted', String(state));
    assert.notEqual(ui.captureChip(state)[1], 't-ok', String(state));
  }
  assert.equal(ui.gateChip('passed')[0], 'Passed');
  assert.equal(ui.gateChip(undefined)[0], 'Unknown');
  assert.equal(ui.gateChip('bogus')[0], 'Unknown');
  assert.equal(ui.gateValue({ id: 'G3' }), 'unknown');
  assert.equal(ui.gateValue({ ok: true }), 'passed');
  assert.equal(ui.integrityText({ integrity: null }), 'Not checked');
});

test('reply source and completion are truthful; unknown stays visible', () => {
  assert.match(ui.sourceLabel('network'), /network stream$/);
  assert.match(ui.sourceLabel('page'), /page text.*network stream not matched/);
  assert.match(ui.sourceLabel('differ'), /differ/);
  assert.match(ui.sourceLabel('candidate'), /unverified candidate/);
  assert.equal(ui.sourceLabel(undefined), 'Source: unknown');
  for (const c of [undefined, null, '', 'unknown']) assert.match(ui.completionLabel(c), /^Completion unknown/);
  assert.equal(ui.completionLabel('end-marker-seen'), 'Completion: end marker seen');
});

test('streaming revisions replace text instead of appending snapshots', () => {
  const a = ui.replyBlocks({ state: 'streaming', text: 'Hel', source: 'network' });
  const b = ui.replyBlocks({ state: 'streaming', text: 'Hello', source: 'network' });
  assert.equal(a[0].text, 'Hel'); assert.equal(b[0].text, 'Hello');
  const blocks = ui.replyBlocks({ blocks: [{ kind: 'reasoning', text: 'think' }, { kind: 'answer', text: 'A' }, { kind: 'citations', text: 'c' }], text: 'ignored' });
  assert.deepEqual(blocks.map((x) => x.kind), ['answer', 'reasoning', 'citations']);
  assert.equal(blocks[1].label, 'Reasoning shown by the site');
  assert.equal(ui.replyBlocks(null).length, 0);
  assert.equal(ui.replyBlocks({ state: 'waiting', text: '' }).length, 0);
  assert.equal(ui.shownChars(ui.replyBlocks({ text: 'abcd' })), 4);
});

test('stale snapshots never replace newer ones; other conversations switch', () => {
  const cur = ready({ revision: 5 });
  assert.equal(ui.pickSnapshot(cur, ready({ revision: 4 })), cur);
  const same = ready({ revision: 5 });
  assert.equal(ui.pickSnapshot(cur, same), same);
  const next = ready({ revision: 6 });
  assert.equal(ui.pickSnapshot(cur, next), next);
  const other = ready({ id: 'c2', revision: 1 });
  assert.equal(ui.pickSnapshot(cur, other), other);
  assert.equal(ui.pickSnapshot(cur, { revision: 9 }), cur);
  assert.equal(ui.unwrapConversation({ conversation: cur }), cur);
  assert.equal(ui.unwrapConversation({ error: 'x' }), null);
});

test('send gating: one turn, drafts and uncertain sends block, readiness must be reported ready', () => {
  assert.equal(ui.canSend(ready(), { prompt: 'hi' }).ok, true);
  assert.equal(ui.canSend(ready(), { prompt: '   ' }).ok, false);
  assert.equal(ui.canSend(null, { prompt: 'hi' }).ok, false);
  assert.equal(ui.canSend(ready(), { prompt: 'hi', busy: true }).ok, false);
  const sent = ready({ turn: { id: 't', phase: 'observed', send: { state: 'observed' } } });
  assert.equal(ui.canSend(sent, { prompt: 'hi' }).ok, false);
  assert.match(ui.canSend(sent, { prompt: 'hi' }).reason, /one message per conversation/);
  assert.equal(ui.canSend(ready({ state: 'needs-reconciliation' }), { prompt: 'hi' }).ok, false);
  assert.equal(ui.canSend(ready({ state: 'closed' }), { prompt: 'hi' }).ok, false);
  assert.equal(ui.canSend(ready({ state: 'martian' }), { prompt: 'hi' }).ok, false);
  assert.equal(ui.canSend(ready({ capture: { state: 'finalizing' } }), { prompt: 'hi' }).ok, false);
  assert.equal(ui.canSend(ready({ capture: null }), { prompt: 'hi' }).ok, false);
  // Readiness is never assumed: missing, unchecked or not-ready all block.
  assert.equal(ui.canSend(ready({ readiness: undefined }), { prompt: 'hi' }).ok, false);
  assert.equal(ui.canSend(ready({ readiness: { ready: false, draft: { present: null, chars: null }, reason: 'NOT_CHECKED' } }), { prompt: 'hi' }).ok, false);
  assert.equal(ui.canSend(ready({ readiness: { ready: false, draft: { present: true, chars: 4 }, reason: 'DRAFT_PRESENT' } }), { prompt: 'hi' }).ok, false);
  assert.deepEqual(ui.draftInfo(draftBlocked()), { present: true, unknown: false, chars: 9 });
  assert.equal(ui.draftInfo(ready()).present, false);
  assert.equal(ui.draftInfo({ readiness: { draft: { present: null, chars: null } } }).unknown, true);
});

test('a turn blocked before typing allows a NEW confirmed key only after readiness is proven ready', () => {
  // Still blocked: cannot send, even though no message was ever sent.
  assert.equal(ui.isBlockedTurn(draftBlocked()), true);
  assert.equal(ui.messageStarted(draftBlocked()), false);
  assert.equal(ui.canSend(draftBlocked(), { prompt: 'hi' }).ok, false);
  // Core refreshed readiness after the draft was resolved: state ready, readiness ready, old blocked turn still there.
  const resolved = ready({ turn: blockedTurn(), readiness: READY });
  assert.equal(ui.canSend(resolved, { prompt: 'hi' }).ok, true);
  // Same shape but state still blocked, or readiness not ready: not allowed.
  assert.equal(ui.canSend({ ...resolved, state: 'blocked' }, { prompt: 'hi' }).ok, false);
  assert.equal(ui.canSend({ ...resolved, readiness: { ...READY, ready: false } }, { prompt: 'hi' }).ok, false);
  // Any turn that typed, sent or is uncertain stays one-shot.
  for (const turn of [
    { id: 'x', phase: 'needs-reconciliation', send: { state: 'not-attempted' } },
    { id: 'x', phase: 'preparing', send: { state: 'not-attempted' } },
    { id: 'x', phase: 'dispatching', send: { state: 'submitting' } },
    { id: 'x', phase: 'uncertain', send: { state: 'uncertain' } },
    { id: 'x', phase: 'observed', send: { state: 'observed' } },
  ]) assert.equal(ui.canSend(ready({ turn }), { prompt: 'hi' }).ok, false, turn.phase);
  assert.equal(ui.isBlockedTurn(ready({ turn: { id: 'x', phase: 'blocked', send: { state: 'uncertain' } } })), false);
  // The new submission never reuses the blocked attempt's key: keys come from newKey() per explicit confirm.
  assert.match(source, /key: newKey\(\), prompt, expectedRevision: Number\(snap\.revision\), priorTurnId/);
  assert.equal((source.match(/key: newKey\(\)/g) ?? []).length, 1, 'the only key generator call is the explicit new submission');
  // The new turn is "registered" only when it differs from the blocked one we already knew.
  const pending = { convId: 'c1', key: 'k2', prompt: 'hi', priorTurnId: 'a1' };
  assert.equal(ui.pendingRegistered(pending, resolved), false);
  assert.equal(ui.pendingRegistered(pending, ready({ turn: { id: 'a2', phase: 'preparing', send: { state: 'not-attempted' } } })), true);
  assert.equal(ui.pendingRegistered({ ...pending, priorTurnId: null }, ready({ turn: blockedTurn() })), true);
  assert.equal(ui.pendingRegistered({ ...pending, convId: 'other' }, resolved), false);
});

test('Check again (read-only) is offered for blocked readiness with or without a turn, and explains why', () => {
  const none = ready({ state: 'blocked', readiness: { ready: false, draft: { present: false, chars: 0 }, reason: 'BINDING_CHANGED' } });
  const panelNone = ui.readinessPanel(none);
  assert.equal(panelNone.show, true);
  assert.equal(panelNone.heading, 'Studio can’t send yet');
  assert.match(panelNone.lines.join(' '), /no longer the tab you connected/);
  const panelDraft = ui.readinessPanel(draftBlocked({ diagnostic: { finishPhase: 'idle', finishError: null, uncertainty: null } }));
  assert.equal(panelDraft.show, true); assert.equal(panelDraft.draft, true); assert.equal(panelDraft.chars, 9);
  assert.equal(panelDraft.heading, 'Resolve draft in Chrome');
  assert.equal(ui.readinessPanel(draftBlocked({ turn: blockedTurn('PREFLIGHT_FAILED'), readiness: { ready: false, draft: { present: null, chars: null }, reason: 'PREFLIGHT_FAILED' } })).lines.length >= 1, true);
  assert.equal(ui.readinessPanel(ready()).show, false, 'nothing to explain when ready');
  assert.equal(ui.readinessPanel(ready({ readiness: undefined })).show, true, 'missing readiness is shown as unknown, not as ready');
  for (const state of ['busy', 'attaching', 'finalizing', 'closed', 'needs-reconciliation'])
    assert.equal(ui.readinessPanel(ready({ state, readiness: { ready: false, draft: { present: true, chars: 1 }, reason: 'DRAFT_PRESENT' } })).show, false, state);
  assert.equal(ui.readinessPanel(ready({ state: 'blocked', turn: { id: 's', phase: 'observed', send: { state: 'observed' } }, readiness: { ready: false, draft: { present: true, chars: 1 }, reason: 'DRAFT_PRESENT' } })).show, false);
  // The button reconciles with the current revision; it never posts a turn.
  assert.match(source, /\$\('#btnCheck'\)\.addEventListener\('click', \(\) => reconcile\('#readyError'\)\)/);
  assert.match(source, /\/reconcile', \{ method: 'POST', body: \{ expectedRevision: Number\(S\.snap\.revision\) \} \}/);
  // Honest wording for each state.
  assert.equal(ui.readinessChip(ready())[0], 'Chat box empty');
  assert.equal(ui.readinessChip(draftBlocked())[0], 'Draft in chat box');
  assert.equal(ui.readinessChip(ready({ readiness: undefined }))[0], 'Chat box not checked');
  assert.equal(ui.readinessChip(ready({ readiness: { ready: false, draft: { present: null, chars: null }, reason: 'NOT_CHECKED' } }))[0], 'Chat box not checked');
  assert.equal(ui.readinessChip(ready({ turn: { id: 's', phase: 'observed', send: { state: 'observed' } } })), null);
  assert.equal(ui.readinessText(ready({ readiness: undefined })), 'Not reported');
  assert.equal(ui.readinessText(draftBlocked()), 'Not ready: draft in chat box (9 characters)');
});

test('service reason codes become plain sentences and unknown codes stay visible', () => {
  assert.match(ui.reasonText('DRAFT_PRESENT'), /text in the chat box/);
  assert.match(ui.reasonText('SUBMISSION_STOPPED'), /stopped/);
  assert.match(ui.reasonText('SOMETHING_NEW'), /something new/);
  assert.equal(ui.reasonText(null), '');
  assert.match(ui.uncertaintyText('partial-draft-possible'), /Nothing is known to have been sent/);
  assert.match(ui.finishErrorText('CAPTURE_STOP_FAILED'), /recording stopped/);
  assert.match(ui.explainError({ status: 409, code: 'STALE_REVISION', message: 'STALE_REVISION' }), /nothing was sent/);
  assert.match(ui.explainError({ status: 409, message: 'DRIVE_LEASE_BUSY' }), /Live drive/);
  assert.match(ui.explainError({ status: 409, message: 'ONE_TURN_LIMIT' }), /one message per conversation/);
  assert.match(ui.explainError({ status: 500, message: 'WEIRD_THING' }), /weird thing/);
  assert.equal(ui.explainError({ status: 400, message: 'Message was too long' }), 'Message was too long');
  assert.match(ui.explainError({ status: 401, message: 'unauthorized' }), /Not authorised/);
  assert.match(ui.explainError({ status: 404, message: 'not found' }), /Not found/);
});

test('uncertain send is distinct from a slow reply; other needs-checking states use their own headline', () => {
  const slow = ready({ state: 'busy', turn: { id: 't', phase: 'observed', send: { state: 'observed' } }, reply: { state: 'waiting' } });
  assert.equal(ui.isUncertain(slow), false);
  assert.equal(ui.isUncertain(ready({ turn: { id: 't', phase: 'uncertain', send: { state: 'uncertain' } } })), true);
  assert.equal(ui.isUncertain(ready({ state: 'needs-reconciliation' })), true);
  assert.equal(ui.sendChip('uncertain')[0], 'Send not confirmed');
  const lost = ready({ state: 'needs-reconciliation', turn: { id: 't', phase: 'uncertain', send: { state: 'uncertain' } }, diagnostic: { uncertainty: 'send-acknowledgement-lost' } });
  assert.match(ui.uncertainView(lost).headline, /^We can’t confirm your message was sent\. Studio will not send it again\.$/);
  const typing = ready({ state: 'needs-reconciliation', turn: { id: 't', phase: 'needs-reconciliation', send: { state: 'not-attempted' } }, diagnostic: { uncertainty: 'partial-draft-possible' } });
  assert.doesNotMatch(ui.uncertainView(typing).headline, /was sent/);
  assert.match(ui.uncertainView(typing).lines.join(' '), /partial text/);
  assert.equal(ui.canCloseTab(ready({ binding: { targetId: 't', origin: 'https://x', ownedByStudio: true } })), true);
  assert.equal(ui.canCloseTab(ready({ binding: { ownedByStudio: true }, turn: { id: 't', phase: 'uncertain', send: { state: 'uncertain' } } })), false);
  assert.equal(ui.canCloseTab(ready({ binding: { ownedByStudio: true }, state: 'needs-reconciliation' })), false);
  assert.equal(ui.canCloseTab(ready({ binding: { ownedByStudio: true }, diagnostic: { uncertainty: 'runtime-restarted' } })), false);
  assert.equal(ui.canCloseTab(ready({ binding: { ownedByStudio: false } })), false);
  assert.equal(ui.canCloseTab(ready({ binding: {} })), false, 'owner tabs and unknown ownership are never offered a close');
});

test('blocked and preparing turns are not shown as sent; the composer keeps the user’s text', () => {
  assert.equal(ui.messageStarted(ready({ turn: { id: 'a', phase: 'preparing', send: { state: 'not-attempted' } } })), false);
  assert.equal(ui.messageStarted(ready({ turn: { id: 'a', phase: 'dispatching', send: { state: 'submitting' } } })), true);
  assert.equal(ui.isActive(ready({ turn: { id: 'a', phase: 'preparing', send: { state: 'not-attempted' } } })), true);
  assert.equal(ui.isActive(draftBlocked()), false);
  // The composer is only emptied when a send was actually started (guarded), never for a blocked turn.
  assert.match(source, /if \(messageStarted\(snap\)\) prompt\.value = '';/);
  assert.doesNotMatch(source, /if \(snap\?\.turn\) prompt\.value = ''/);
  assert.match(source, /chat\.draft\./, 'unsent text survives a reload in this tab');
  assert.match(source, /prompt\.disabled = !!snap && \(snap\.state === 'closed' \|\| \(!!snap\.turn && !isBlockedTurn\(snap\)\)\)/);
});

test('HTTP ambiguity: network loss, 5xx and unreadable replies keep the key; 4xx does not', () => {
  assert.equal(ui.isAmbiguous({ status: 0 }), true);
  assert.equal(ui.isAmbiguous({ status: 502 }), true);
  assert.equal(ui.isAmbiguous({ status: 200, malformed: true }), true);
  for (const status of [400, 401, 403, 404, 409, 422]) assert.equal(ui.isAmbiguous({ status }), false, String(status));
  assert.notEqual(ui.newKey(), ui.newKey());
  // No automatic retry: one POST site for turns, and the same-key recovery is a button handler only.
  assert.match(source, /\$\('#btnRecover'\)\.addEventListener\('click', \(\) => sendNow\(true\)\)/);
  assert.equal((source.match(/'\/turns'/g) ?? []).length, 1);
  assert.doesNotMatch(source, /setTimeout\([^)]*sendNow/);
});

test('polling: about 1s while active, slower when idle, stops when closed', () => {
  assert.equal(ui.pollDelay(ready({ state: 'busy' })), 1000);
  assert.equal(ui.pollDelay(ready({ turn: { id: 't', phase: 'dispatching', send: { state: 'submitting' } } })), 1000);
  assert.equal(ui.pollDelay(ready({ turn: { id: 't', phase: 'observed', send: { state: 'observed' } }, reply: { state: 'streaming' } })), 1000);
  assert.equal(ui.pollDelay(ready()), 5000);
  assert.equal(ui.pollDelay(ready({ state: 'busy' }), { hidden: true }), 3000);
  assert.equal(ui.pollDelay(ready({ state: 'busy' }), { failures: 6 }), 5000);
  assert.equal(ui.pollDelay(ready({ state: 'closed' })), null);
  assert.equal(ui.pollDelay(ready({ state: 'closed', capture: { state: 'finalizing' } })), 1000);
  assert.equal(ui.pollDelay(null), null);
});

test('recording limits warn at 80% and when time is nearly gone', () => {
  const now = 1_000_000;
  assert.equal(ui.limitStatus({ maxBytes: 100, bytesWritten: 50 }, now).warn, false);
  assert.equal(ui.limitStatus({ maxBytes: 100, bytesWritten: 80 }, now).warn, true);
  assert.equal(ui.limitStatus({ endsAt: now + 2 * 60000 }, now).warn, true);
  assert.equal(ui.limitStatus({ endsAt: now + 10 * 60000 }, now).warn, false);
  assert.equal(ui.limitStatus({ limitReason: 'max-bytes' }, now).stopped, 'max bytes');
  assert.equal(ui.limitStatus(null).stopped, null);
});

test('conversation labels, target hints and phase words are plain and honest', () => {
  assert.equal(ui.conversationChip('needs-reconciliation')[0], 'Needs checking');
  assert.equal(ui.replyChip('ready')[0], 'Reply ready');
  assert.equal(ui.replyChip('ready')[1], 't-info', 'reply ready is never styled as success');
  assert.match(ui.conversationChip('weird-state')[0], /weird state/);
  assert.equal(ui.siteName({ id: 'claude' }), 'claude');
  assert.equal(ui.shortUrl('https://x.test/a/b?token=secret'), 'x.test/a/b?…');
  assert.match(ui.targetHint({ site: 'claude', recorderOwner: { sessionId: 's', kind: 'conversation' } }), /Studio conversation/);
  assert.match(ui.targetHint({ site: 'claude', recorderOwner: { sessionId: 's', kind: 'unknown' } }), /already being recorded/i);
  assert.match(ui.targetHint({ site: null }), /doesn’t support/);
  assert.equal(ui.targetHint({ site: 'claude', visibility: 'unknown', recorderOwner: null, ownedByStudio: false }), '');
});
