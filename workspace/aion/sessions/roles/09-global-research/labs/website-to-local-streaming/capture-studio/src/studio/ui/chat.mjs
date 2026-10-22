// Chat workspace. Same-origin fetches only; the studio cookie authenticates every request.
// Everything that comes from a site or the service (titles, replies, reasons) is rendered with
// textContent and DOM nodes, never as HTML. The pure helpers below are exported for offline tests.

const API = '/api/v1';
const SELECTED_KEY = 'capture-studio.chat.selected';

/* ---------------- pure helpers (no DOM, no network) ---------------- */
const CONVERSATION_STATES = {
  disconnected: ['Disconnected', 't-mute'], attaching: ['Connecting…', 't-live'], ready: ['Ready', 't-info'],
  busy: ['Busy', 't-live'], blocked: ['Blocked', 't-warn'], 'needs-reconciliation': ['Needs checking', 't-warn'],
  finalizing: ['Finishing…', 't-warn'], closed: ['Closed', 't-mute'],
};
const SEND_STATES = {
  'not-attempted': ['Not sent yet', 't-mute'], submitting: ['Submitting', 't-live'],
  observed: ['Send observed', 't-info'], uncertain: ['Send not confirmed', 't-warn'],
};
const REPLY_STATES = {
  waiting: ['Waiting for reply', 't-mute'], streaming: ['Reply streaming', 't-live'], ready: ['Reply ready', 't-info'],
  interrupted: ['Reply interrupted', 't-warn'], unknown: ['Reply state unknown', 't-warn'],
};
const CAPTURE_STATES = {
  recording: ['Recording', 't-rec'], finalizing: ['Finishing capture…', 't-warn'], accepted: ['Capture accepted', 't-ok'],
  rejected: ['Capture rejected', 't-bad'], incomplete: ['Capture incomplete', 't-warn'],
};
const SOURCE_LABELS = {
  network: 'Source: network stream',
  page: 'Source: page text (network stream not matched)',
  differ: 'Source: network stream and page text differ',
  candidate: 'Source: unverified candidate',
};
const BLOCK_LABELS = {
  answer: 'Answer', reasoning: 'Reasoning shown by the site', tool: 'Tool activity', 'tool-activity': 'Tool activity',
  tool_activity: 'Tool activity', citations: 'Citations', citation: 'Citations',
};
const GATE_LABELS = {
  G1: 'New message observed (page, network or both)', G2: 'A new reply appeared', G3: 'Reply finished',
  G4: 'Recording stopped cleanly', G5: 'Recording integrity check', G6: 'Data extracted', G7: 'Page text and network data agree',
};
const GATE_VALUES = { passed: ['Passed', 't-ok'], failed: ['Failed', 't-bad'], 'not-checked': ['Not checked', 't-mute'], unknown: ['Unknown', 't-warn'] };

// Service reason codes -> plain sentences. Unknown codes are shown as words, never hidden.
const REASONS = {
  DRAFT_PRESENT: 'There’s text in the chat box.',
  DRAFT_OR_BINDING_NOT_READY: 'Studio couldn’t confirm that the chat box is empty and that this is still the tab you connected.',
  BINDING_CHANGED: 'This is no longer the tab you connected (different tab or site).',
  PREFLIGHT_FAILED: 'Studio couldn’t inspect the chat box.',
  NOT_CHECKED: 'Studio hasn’t checked the chat box yet.',
  SUBMISSION_STOPPED: 'Sending was stopped before it finished.',
};
const UNCERTAINTY = {
  'runtime-restarted': 'Studio restarted. It never replays an earlier action.',
  'partial-draft-possible': 'Typing may have been interrupted, so partial text could be in the chat box. Nothing is known to have been sent.',
  'send-acknowledgement-lost': 'Studio lost the confirmation for the send.',
  'attachment-interrupted': 'Connecting to the tab didn’t finish cleanly.',
  'attachment-failed': 'Connecting to the tab didn’t finish cleanly.',
  'attachment-binding-mismatch': 'Connecting to the tab didn’t finish cleanly.',
};
const FINISH_ERRORS = {
  CAPTURE_STOP_FAILED: 'Studio couldn’t confirm that recording stopped.',
  TAB_CLOSE_UNCONFIRMED: 'Studio couldn’t confirm that the tab was closed.',
};
const ERROR_TEXT = {
  STALE_REVISION: 'This conversation changed since you last saw it, so nothing was sent. It has been refreshed.',
  ONE_TURN_LIMIT: 'This release sends one message per conversation.',
  NOT_READY: 'Studio isn’t ready to send. Use Check again (read-only) first.',
  CONFIRM_REQUIRED: 'Sending needs your explicit confirmation.',
  INVALID_SUBMISSION: 'The message is empty or longer than 2000 characters.',
  IDEMPOTENCY_CONFLICT: 'That request ID was already used for a different message.',
  CONVERSATION_FINISHED: 'This conversation has been finished.',
  CONVERSATION_NOT_WRITABLE: 'This conversation can’t send: it was recovered after a restart, or another Studio process owns it.',
  CONVERSATION_OWNED_BY_ANOTHER_RUNTIME: 'Another Studio process owns this conversation.',
  CONVERSATION_NOT_FOUND: 'That conversation no longer exists.',
  RECONCILIATION_UNAVAILABLE: 'Studio couldn’t read the page to check.',
  PERSISTENCE_FAILED_REOPEN_REQUIRED: 'Studio couldn’t save this conversation and stopped using it. Reopen it from Earlier conversations.',
  CORRUPT_OR_UNREADABLE_SNAPSHOT: 'The saved conversation couldn’t be read.',
  DRIVE_LEASE_BUSY: 'A Chat conversation or a drive job holds the browser. Finish it in Chat or in Live drive.',
  ATTACHMENT_FAILED: 'Studio couldn’t attach to that tab.',
  INVALID_ATTACHMENT: 'Studio couldn’t attach to that tab.',
  TARGET_NOT_FOUND: 'That tab is gone. Refresh tabs.',
  TARGET_SITE_MISMATCH: 'That tab isn’t on the site Studio expected.',
  SITE_ADAPTER_UNAVAILABLE: 'Studio has no adapter for that site.',
  INVALID_CONNECT: 'Studio didn’t accept that connection request.',
  INVALID_TARGET_SELECTION: 'Choose either a new tab or an existing tab, not both.',
  RUNTIME_CLOSED: 'Studio is shutting down.',
};

const word = (s) => String(s ?? '').replace(/[-_]+/g, ' ').trim();
const pair = (table, key, prefix) => table[key] ?? [(prefix ? prefix + ': ' : '') + (key ? word(key) : 'unknown'), 't-warn'];
const isCode = (s) => typeof s === 'string' && /^[A-Z][A-Z0-9_]{2,}$/.test(s);

export const siteName = (site) => (typeof site === 'string' ? site : site?.id ?? '');
export const conversationChip = (state) => pair(CONVERSATION_STATES, state, 'State');
export const sendChip = (state) => pair(SEND_STATES, state, 'Send');
export const replyChip = (state) => pair(REPLY_STATES, state, 'Reply');
// "Accepted" appears only when the evaluator literally returned it; anything unrecognised is shown as such.
export const captureChip = (state) => pair(CAPTURE_STATES, state, 'Capture');
export const sourceLabel = (source) => SOURCE_LABELS[source] ?? 'Source: unknown';
export function completionLabel(completion) {
  if (completion == null || completion === '' || completion === 'unknown') return 'Completion unknown: the end of the reply was not confirmed on the network.';
  return 'Completion: ' + word(completion);
}
export function gateChip(value) { return GATE_VALUES[value] ?? GATE_VALUES.unknown; }
// Missing evidence is unknown, never passed.
export function gateValue(g) { return g?.state ?? g?.value ?? (g?.ok === true ? 'passed' : g?.ok === false ? 'failed' : 'unknown'); }
export function gateLabel(gate) { return gate?.label ?? GATE_LABELS[gate?.id] ?? word(gate?.id ?? 'Check'); }
export function integrityText(capture) {
  const i = capture?.integrity;
  if (i == null) return 'Not checked';
  if (typeof i === 'string') return word(i);
  if (typeof i === 'boolean') return i ? 'Passed' : 'Failed';
  if (typeof i === 'object' && typeof i.ok === 'boolean') return i.ok ? 'Passed' : 'Failed';
  return 'Reported, see session';
}
export function reasonText(code) {
  if (!code) return '';
  return REASONS[code] ?? (isCode(code) ? 'Studio reported: ' + word(code).toLowerCase() + '.' : String(code));
}
export function uncertaintyText(code) { return code ? (UNCERTAINTY[code] ?? 'Studio reported: ' + word(code) + '.') : ''; }
export function finishErrorText(err) { return err ? (FINISH_ERRORS[err] ?? String(err)) : ''; }
export function explainError({ status, code, message } = {}) {
  if (status === 401 || status === 403) return 'Not authorised. Reopen the original tokenized Studio URL from the local terminal.';
  const c = code ?? (isCode(message) ? message : null);
  if (c && ERROR_TEXT[c]) return ERROR_TEXT[c];
  if (c) return 'Studio reported: ' + word(c).toLowerCase() + '.';
  if (status === 404) return 'Not found. This Studio build may not include Chat yet, or the item no longer exists.';
  return message || 'Request failed';
}
// Some errors come with a place to go next. Text stays plain; the page adds the link as a DOM node.
export function errorLink(code) { return code === 'DRIVE_LEASE_BUSY' ? { href: '/drive', text: 'Open Live drive' } : null; }
// "Not sent" is only printed when the service itself said the send was not attempted.
export const notSentReported = (err) => [err?.data?.send?.state, err?.data?.sendState, err?.data?.turn?.send?.state, err?.data?.conversation?.turn?.send?.state].includes('not-attempted');
// A definite (4xx) rejection of the one explicit send. Only a stale revision suggests pressing Send again.
export function sendRejection(err) {
  const code = err?.data?.code ?? (isCode(err?.message) ? err.message : null);
  let text = (notSentReported(err) ? 'Not sent. ' : 'Studio rejected this request. ') + explainError({ status: err?.status, code, message: err?.message });
  if (err?.status === 409 && code === 'STALE_REVISION') text += ' Your message is still in the box. Press Send if you still want to send it.';
  return { text, code, link: errorLink(code) };
}

export const hasTurn = (snap) => !!snap?.turn;
// A turn rejected before anything was typed. The service keeps it as a blocked, not-attempted attempt.
export const isBlockedTurn = (snap) => snap?.turn?.phase === 'blocked' && snap?.turn?.send?.state === 'not-attempted';
// "Started" means the send action was at least begun. Preparing/typing and blocked turns have not sent anything.
export const messageStarted = (snap) => !!snap?.turn && snap.turn.send?.state !== 'not-attempted';
export const isPreparing = (snap) => snap?.turn?.phase === 'preparing';

export function draftInfo(snap) {
  const d = snap?.readiness?.draft ?? snap?.draft ?? snap?.binding?.draft ?? null;
  if (d === true) return { present: true, unknown: false, chars: null };
  if (d && typeof d === 'object') return { present: d.present === true, unknown: d.present == null, chars: Number.isFinite(d.chars) ? d.chars : null };
  const reason = snap?.readiness?.reason ?? snap?.blocked?.reason ?? snap?.blockedReason ?? snap?.reason;
  return { present: typeof reason === 'string' && /draft/i.test(reason), unknown: true, chars: null };
}
export const isUncertain = (snap) => snap?.turn?.send?.state === 'uncertain' || snap?.state === 'needs-reconciliation';
// pending=true: the send request got no usable answer (network loss, 5xx, unreadable reply), so no turn is known yet.
export function uncertainView(snap, { pending = false, detail = '' } = {}) {
  const sendUnsure = snap?.turn?.send?.state === 'uncertain' || snap?.diagnostic?.uncertainty === 'send-acknowledgement-lost';
  const lines = [uncertaintyText(snap?.diagnostic?.uncertainty), finishErrorText(snap?.diagnostic?.finishError), reasonText(snap?.turn?.reason)].filter(Boolean);
  if (pending) {
    lines.unshift('No confirmation came back for the send request.' + (detail ? ' ' + detail : ''),
      'Send again submits your message as a new one, so it can appear twice if the first one went through.');
    return { headline: 'We can’t confirm your message was sent. Studio will not send it again.', lines: [...new Set(lines)] };
  }
  return {
    headline: sendUnsure
      ? 'We can’t confirm your message was sent. Studio will not send it again.'
      : 'Studio needs you to check this conversation. Studio will not send anything by itself.',
    lines: [...new Set(lines)],
  };
}
// Plain guidance beside the uncertain banner. It is text, not a control: Studio cannot switch tabs yet.
export function chromeGuidance(snap, sendUnsure) {
  const tab = snap?.binding?.title || (snap?.binding?.url ? shortUrl(snap.binding.url) : '');
  const where = tab ? ' It’s the tab “' + tab + '”. Studio can’t switch to it for you yet.' : '';
  return (sendUnsure ? 'Open the tab in Chrome to see whether it was sent.' : 'Switch to the Chrome tab for this conversation and look at the chat.') + where;
}
export function readinessChip(snap) {
  if (!snap || snap.state === 'closed' || messageStarted(snap) || (snap.turn && !isBlockedTurn(snap))) return null;
  const r = snap.readiness, d = draftInfo(snap);
  if (!r || r.reason === 'NOT_CHECKED' && r.ready !== true) return ['Chat box not checked', 't-mute'];
  if (d.present) return ['Draft in chat box', 't-warn'];
  if (r.ready === true) return [d.present === false && d.chars === 0 ? 'Chat box empty' : 'Chat box ready', 't-info'];
  return ['Not ready to send', 't-warn'];
}
export function readinessText(snap) {
  const r = snap?.readiness;
  if (!r) return 'Not reported';
  if (r.ready === true) return 'Ready' + (draftInfo(snap).chars === 0 ? ': chat box is empty' : '');
  if (r.reason === 'NOT_CHECKED') return 'Not checked';
  const d = draftInfo(snap);
  return 'Not ready' + (d.present ? ': draft in chat box' + (d.chars != null ? ' (' + d.chars + ' characters)' : '') : r.reason ? ': ' + reasonText(r.reason) : '');
}
// The panel that explains why sending is off and offers the read-only "Check again". It also covers a
// turn that was blocked before typing, with or without a turn at all.
export function readinessPanel(snap) {
  const off = { show: false, draft: false, chars: null, heading: '', lines: [] };
  if (!snap || ['closed', 'finalizing', 'attaching', 'disconnected', 'busy', 'needs-reconciliation'].includes(snap.state)) return off;
  if (messageStarted(snap) || (snap.turn && !isBlockedTurn(snap))) return off;
  if (snap.state === 'ready' && snap.readiness?.ready === true) return off;
  const d = draftInfo(snap), lines = [], add = (t) => { if (t && !lines.includes(t)) lines.push(t); };
  const r = snap.readiness;
  if (!r) add('Studio hasn’t reported whether the chat box is ready.');
  else if (!d.present) add(r.reason ? reasonText(r.reason) : 'Studio couldn’t confirm that the chat box is ready.');
  if (isBlockedTurn(snap)) add(reasonText(snap.turn.reason));
  add(uncertaintyText(snap.diagnostic?.uncertainty));
  return { show: true, draft: d.present, chars: d.chars, heading: d.present ? 'Resolve draft in Chrome' : 'Studio can’t send yet', lines };
}
export function isActive(snap) {
  if (!snap) return false;
  if (['attaching', 'busy', 'finalizing'].includes(snap.state)) return true;
  if (snap.turn && ['preparing', 'dispatching'].includes(snap.turn.phase)) return true;
  if (snap.turn?.send?.state === 'submitting') return true;
  if (messageStarted(snap) && ['waiting', 'streaming'].includes(snap.reply?.state)) return true;
  return snap.capture?.state === 'finalizing';
}
export function canSend(snap, { prompt = '', busy = false } = {}) {
  if (!snap) return { ok: false, reason: 'Connect to a website first.' };
  if (busy) return { ok: false, reason: 'Working…' };
  if (snap.state === 'closed') return { ok: false, reason: 'This conversation is closed. Start a new one to send another message.' };
  if (snap.state === 'finalizing') return { ok: false, reason: 'Finishing the capture…' };
  // One message per conversation. The only exception: a turn that was rejected before anything was typed.
  if (snap.turn && !isBlockedTurn(snap)) {
    return { ok: false, reason: isUncertain(snap) ? 'Sending is off until this conversation is checked.' : 'This release sends one message per conversation. Finish the capture, then start a new conversation.' };
  }
  if (isUncertain(snap)) return { ok: false, reason: 'Sending is off until this conversation is checked.' };
  if (draftInfo(snap).present) return { ok: false, reason: 'There’s a draft in the chat box. Resolve it in Chrome, then press Check again (read-only).' };
  if (snap.state === 'attaching') return { ok: false, reason: 'Connecting…' };
  if (snap.state === 'busy') return { ok: false, reason: 'Studio is working. Wait a moment.' };
  if (snap.state !== 'ready') return { ok: false, reason: snap.state === 'blocked' ? 'Studio can’t send yet. Use Check again (read-only).' : 'Not ready to send (' + word(snap.state) + ').' };
  if (snap.readiness?.ready !== true) return { ok: false, reason: 'Studio hasn’t confirmed the chat box is ready. Use Check again (read-only).' };
  if (snap.capture?.state !== 'recording') return { ok: false, reason: 'Studio isn’t recording this tab, so it won’t send.' };
  if (!String(prompt).trim()) return { ok: false, reason: 'Write a message to continue.' };
  return { ok: true, reason: '' };
}
// Stale responses never overwrite a newer snapshot of the same conversation.
export function pickSnapshot(current, incoming) {
  if (!incoming || typeof incoming.id !== 'string') return current ?? null;
  if (current && current.id === incoming.id && Number(incoming.revision) < Number(current.revision)) return current;
  return incoming;
}
export function unwrapConversation(data) {
  const c = data?.conversation ?? data?.resource ?? data;
  return c && typeof c.id === 'string' && c.revision !== undefined ? c : null;
}
// A failed request is "ambiguous" when the server may have acted on it: network loss, 5xx, or a malformed reply.
export function isAmbiguous(err) { return !err || err.status === 0 || err.status === 408 || err.status >= 500 || err.malformed === true; }
// The pending request counts as registered once the service shows a turn that is not the one we already knew.
export const pendingRegistered = (pending, snap) => !!pending && !!snap && pending.convId === snap.id && !!snap.turn && snap.turn.id !== (pending.priorTurnId ?? null);
// A send request whose outcome is unknown: it was posted, nothing came back, and no new turn is visible yet.
export const pendingUnknown = (pending, snap, submitting = false) => !!pending && !!snap && !submitting && pending.convId === snap.id && !pendingRegistered(pending, snap);
// After a read-only check: no turn registered for the unknown request and nothing else blocks sending.
export const checkFoundNoMessage = (pending, snap) => pendingUnknown(pending, snap) && !isUncertain(snap) && (!snap.turn || isBlockedTurn(snap));
export function ownedByStudio(snap) {
  const b = snap?.binding ?? {};
  return b.ownedByStudio === true || b.freshTab === true || b.owner === 'studio';
}
export const canCloseTab = (snap) => ownedByStudio(snap) && !isUncertain(snap) && !snap?.diagnostic?.uncertainty;
export function pollDelay(snap, { hidden = false, failures = 0 } = {}) {
  if (!snap) return null;
  if (snap.state === 'closed' && snap.capture?.state !== 'finalizing') return null;
  if (failures >= 5) return 5000;
  if (isActive(snap)) return hidden ? 3000 : 1000;
  return 5000;
}
export function replyBlocks(reply) {
  if (!reply) return [];
  const raw = Array.isArray(reply.blocks) && reply.blocks.length ? reply.blocks : null;
  const blocks = raw
    ? raw.map((b, i) => ({
      key: (b.kind ?? 'answer') + '-' + i, kind: b.kind ?? 'answer', label: BLOCK_LABELS[b.kind ?? 'answer'] ?? word(b.kind),
      text: typeof b.text === 'string' ? b.text : null, source: b.source ?? null,
    }))
    : typeof reply.text === 'string' && reply.text !== '' ? [{ key: 'answer-0', kind: 'answer', label: 'Answer', text: reply.text, source: reply.source ?? null }] : [];
  return blocks.sort((a, b) => (a.kind === 'answer' ? 0 : 1) - (b.kind === 'answer' ? 0 : 1));
}
export function shownChars(blocks) { return blocks.filter((b) => b.kind === 'answer').reduce((n, b) => n + (b.text?.length ?? 0), 0); }

// Reply chips. Unknown network completion is a visible warning chip, never a quiet footnote.
const SOURCE_TONES = { network: 't-info', page: 't-mute', differ: 't-warn', candidate: 't-warn' };
export const sourceChip = (source) => [sourceLabel(source), SOURCE_TONES[source] ?? 't-warn'];
export const completionKnown = (c) => !(c == null || c === '' || c === 'unknown');
export const completionChip = (c) => (completionKnown(c) ? ['Network completion: ' + word(c), 't-info'] : ['Network completion: unknown', 't-warn']);
export const PARTIAL_TEXT = 'Text may be partial. Finish capture to keep what was recorded.';
export const replyMayBePartial = (reply) => ['interrupted', 'unknown'].includes(reply?.state);
export function ago(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return s < 2 ? 'just now' : s < 60 ? s + 's ago' : Math.floor(s / 60) + ' min ago'; }
export function replyCountText(chars, ageMs = null) {
  const n = Number.isFinite(chars) ? chars : 0;
  return n + (n === 1 ? ' char' : ' chars') + (ageMs == null ? '' : ', updated ' + ago(ageMs));
}
// One sentence for the polite live region when the reply becomes ready. Never announces streaming text.
export function replyReadyText(snap) {
  const r = snap?.reply;
  return r?.state === 'ready' && messageStarted(snap) ? 'Reply ready. ' + sourceLabel(r.source) + '. ' + completionChip(r.completion)[0] : '';
}

// One-line "where am I" headline.
export function stageInfo(snap, { pending = false, submitting = false } = {}) {
  const total = 5, at = (n, label) => ({ n, total, label, text: 'Step ' + n + ' of ' + total + ': ' + label });
  if (!snap) return at(1, 'Connect to a site');
  if (snap.state === 'closed' || ['accepted', 'rejected', 'incomplete'].includes(snap.capture?.state)) return at(5, 'Capture finished');
  if (snap.state === 'finalizing' || snap.capture?.state === 'finalizing') return at(5, 'Finishing capture');
  if (['attaching', 'disconnected'].includes(snap.state)) return at(1, snap.state === 'attaching' ? 'Connecting' : 'Disconnected');
  if (submitting || isPreparing(snap) || snap.turn?.send?.state === 'submitting') return at(3, 'Sending your message');
  if (pending || snap.turn?.send?.state === 'uncertain') return at(3, 'Send not confirmed');
  if (messageStarted(snap)) {
    const r = snap.reply?.state;
    if (r === 'ready') return at(5, snap.capture?.state === 'recording' ? 'Reply ready. Still recording' : 'Reply ready');
    return at(4, { waiting: 'Waiting for the reply', streaming: 'Reply streaming', interrupted: 'Reply interrupted' }[r] ?? 'Reply state unknown');
  }
  if (snap.state === 'needs-reconciliation') return at(2, 'Needs checking');
  return canSend(snap, { prompt: 'x' }).ok ? at(3, 'Write your message') : at(2, 'Chat box not ready');
}

// Finish button: one click. While the reply is still coming the label says what you give up.
export function finishControl(snap, { working = false } = {}) {
  if (!snap) return { label: 'Finish capture', early: false, disabled: true };
  const closed = snap.state === 'closed', fin = snap.state === 'finalizing' || snap.capture?.state === 'finalizing';
  const early = !closed && !fin && messageStarted(snap) && ['waiting', 'streaming'].includes(snap.reply?.state);
  return {
    label: fin ? 'Finishing…' : early ? 'Finish anyway (capture will be incomplete)' : 'Finish capture', early,
    disabled: working || fin || closed || ['disconnected', 'attaching'].includes(snap.state),
  };
}
export const evidenceOf = (snap) => snap?.evidence ?? snap?.turn?.evidence ?? snap?.capture?.evidence ?? null;
// Outcome chip and the reasons taken from failed or unknown evidence checks. Null until the capture has finished.
export function finishOutcome(snap) {
  if (!snap) return null;
  const cs = snap.capture?.state;
  if (!(snap.state === 'closed' || ['accepted', 'rejected', 'incomplete'].includes(cs))) return null;
  const gates = Array.isArray(evidenceOf(snap)?.gates) ? evidenceOf(snap).gates : [];
  const reasons = gates.filter((g) => ['failed', 'unknown'].includes(gateValue(g))).map((g) => {
    const note = typeof g?.reason === 'string' && g.reason ? ' (' + reasonText(g.reason).replace(/\.$/, '') + ')' : '';
    return gateLabel(g) + ': ' + gateChip(gateValue(g))[0].toLowerCase() + note;
  });
  if (cs !== 'accepted' && !reasons.length) reasons.push('Studio didn’t report which check caused this. See Details.');
  return { chip: captureChip(cs), reasons, accepted: cs === 'accepted' };
}
export function limitStatus(capture, now = Date.now()) {
  const lines = []; let warn = false;
  if (!capture) return { lines, warn, stopped: null };
  const max = Number(capture.maxBytes), used = Number(capture.bytesWritten);
  if (Number.isFinite(max) && max > 0 && Number.isFinite(used)) {
    lines.push('Recorded ' + mib(used) + ' of ' + mib(max) + '.');
    if (used / max >= 0.8) warn = true;
  }
  const ends = typeof capture.endsAt === 'number' ? capture.endsAt : Date.parse(capture.endsAt ?? '');
  if (Number.isFinite(ends)) {
    const left = Math.max(0, Math.round((ends - now) / 60000));
    lines.push('Time left in the recording budget: about ' + left + ' min.');
    if (ends - now <= 3 * 60000) warn = true;
  }
  return { lines, warn, stopped: capture.limitReason ? word(capture.limitReason) : null };
}
function mib(n) { return (n / 1048576).toFixed(n >= 10485760 ? 0 : 1) + ' MiB'; }
export function shortUrl(u) { try { const x = new URL(u); return x.host + x.pathname + (x.search ? '?…' : ''); } catch { return String(u ?? ''); } }
export function newKey() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16); c?.getRandomValues?.(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('') || String(Date.now()) + Math.random().toString(16).slice(2);
}
export function limitationText(l) { return typeof l === 'string' ? l : l?.message ?? l?.text ?? l?.reason ?? JSON.stringify(l); }
export function targetHint(t) {
  if (t?.recorderOwner) return t.recorderOwner.kind === 'conversation' ? 'Already used by a Studio conversation — can’t use' : 'Already being recorded — can’t use';
  if (!t?.site) return 'Studio doesn’t support this site yet';
  if (t.visibility === 'hidden') return 'In the background — bring it to the front before sending';
  return t.ownedByStudio ? 'Opened by Studio' : '';
}

/* ---------------- browser app ---------------- */
function boot() {
  // `$` is for required controls: a missing one throws here, and the unit test fails first (every id looked up with `$` must exist in chat.html).
  const $ = (sel) => document.querySelector(sel);
  // `opt*` is for purely informational notes only: a missing one is skipped and logged once, never thrown.
  const warnedMissing = new Set();
  const opt = (sel) => {
    const n = document.querySelector(sel);
    if (!n && !warnedMissing.has(sel)) { warnedMissing.add(sel); console.warn('Chat page: optional element ' + sel + ' is missing.'); }
    return n;
  };
  const optText = (sel, text) => { const n = opt(sel); if (n && n.textContent !== text) n.textContent = text; };
  const optHidden = (sel, hidden) => { const n = opt(sel); if (n) n.hidden = hidden; };
  const el = (tag, props = {}, kids = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === false || v == null) continue;
      if (k === 'class') node.className = v; else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of [].concat(kids)) if (kid != null) node.append(kid);
    return node;
  };
  const chip = ([label, tone]) => el('span', { class: 'pill ' + tone }, [tone === 't-rec' || tone === 't-live' ? el('span', { class: 'dot', 'aria-hidden': 'true' }) : null, label]);
  // Polling re-renders often. Anything the reader may be selecting is updated in place, never rebuilt.
  const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  const syncChips = (node, list) => {
    const sig = list.map(([l, t]) => t + ':' + l).join('|');
    if (node.dataset.sig === sig) return;
    node.dataset.sig = sig; node.replaceChildren(...list.map(chip));
  };
  const syncList = (node, lines) => {
    const sig = lines.join('\n');
    if (node.dataset.sig === sig) return;
    node.dataset.sig = sig; node.replaceChildren(...lines.map((l) => el('li', { text: l })));
  };
  const newTabLink = (href, label) => el('a', { class: 'hit', href, target: '_blank', rel: 'noopener' }, [label, el('span', { class: 'sr', text: ' (new tab)' })]);
  const textBlocks = new Map(); // reply block key -> { root, textNode }
  const store = {
    get(area, k) { try { return globalThis[area].getItem(k); } catch { return null; } },
    set(area, k, v) { try { globalThis[area].setItem(k, v); } catch { /* storage unavailable */ } },
    del(area, k) { try { globalThis[area].removeItem(k); } catch { /* storage unavailable */ } },
  };

  const S = {
    targets: { sites: [], targets: [] }, targetsState: 'loading', targetsError: '', list: [], listState: 'loading',
    snap: null, mode: 'new', site: '', targetId: '', connecting: false, submitting: false, working: false,
    openSeq: 0,
    pending: null, timer: null, failures: 0, announced: '', bannerFocus: '',
    focusMessage: false, openBlocks: {}, sentPrompt: '', authExpired: false,
    unknownDetail: '', checkedNote: '', copyState: '', replyTrack: null, finishFocus: false,
  };

  /* ---- api ---- */
  async function api(path, { method = 'GET', body } = {}) {
    let res;
    try {
      res = await fetch(API + path, { method, credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    } catch {
      const e = new Error('Could not reach the Studio. Check that it is still running.'); e.status = 0; throw e;
    }
    let data = {}, malformed = false;
    const text = await res.text();
    if (text) { try { data = JSON.parse(text); } catch { malformed = true; data = { error: 'The Studio sent a reply that was not JSON.' }; } }
    if (res.status === 401 || res.status === 403) setAuth(true); else if (res.ok && S.authExpired) setAuth(false);
    if (!res.ok || malformed) {
      const e = new Error(data?.error || res.statusText || 'Request failed');
      e.status = res.ok ? 200 : res.status; e.data = data; e.malformed = malformed; throw e;
    }
    return data;
  }
  function setAuth(on) {
    S.authExpired = on;
    $('#connectionNote').textContent = on ? 'Studio authorization expired — reopen the original tokenized Studio URL from the local terminal.' : '';
  }
  const describe = (e) => explainError({ status: e.status, code: e.data?.code, message: e.message });
  // Plain text, plus a link node when the error has somewhere to go (for example the busy browser -> /drive).
  function setError(sel, text, link = null) {
    const n = $(sel); n.textContent = text || '';
    if (text && link) n.append(' ', el('a', { href: link.href, text: link.text }));
  }
  const unreadable = () => Object.assign(new Error('The Studio sent a conversation we couldn’t read.'), { status: 200, malformed: true });

  /* ---- snapshot handling ---- */
  function applySnapshot(next) {
    const prevId = S.snap?.id;
    const picked = pickSnapshot(S.snap, next);
    if (picked !== S.snap) {
      if (!S.snap || S.snap.id !== picked.id) {
        S.bannerFocus = ''; S.openBlocks = {}; textBlocks.clear(); S.replyTrack = null;
        S.unknownDetail = ''; S.checkedNote = ''; S.copyState = ''; S.finishFocus = false;
        S.sentPrompt = store.get('sessionStorage', 'chat.sent.' + picked.id) ?? ''; loadPending(picked.id);
        // The user's own unsent text is kept; only a different conversation gets its own saved draft.
        const saved = store.get('sessionStorage', 'chat.draft.' + picked.id) ?? '';
        if (prevId && prevId !== picked.id) $('#prompt').value = saved; else if (!$('#prompt').value) $('#prompt').value = saved;
      }
      S.snap = picked;
      store.set('localStorage', SELECTED_KEY, picked.id);
    }
    if (pendingRegistered(S.pending, S.snap)) {
      S.sentPrompt = S.pending.prompt; store.set('sessionStorage', 'chat.sent.' + S.snap.id, S.sentPrompt);
      clearPending(); S.unknownDetail = '';
    }
    if (messageStarted(S.snap)) store.del('sessionStorage', 'chat.draft.' + S.snap.id);
    const i = S.list.findIndex((c) => c.id === S.snap.id);
    const summary = { id: S.snap.id, site: S.snap.site, state: S.snap.state, revision: S.snap.revision };
    if (i >= 0) S.list[i] = { ...S.list[i], ...summary }; else S.list.unshift(summary);
    render(); schedulePoll();
  }
  function loadPending(id) {
    try { const p = JSON.parse(store.get('sessionStorage', 'chat.pending.' + id) ?? 'null'); S.pending = p && p.key ? p : null; } catch { S.pending = null; }
  }
  function savePending() { if (S.pending) store.set('sessionStorage', 'chat.pending.' + S.pending.convId, JSON.stringify(S.pending)); }
  function clearPending() { if (S.pending) store.del('sessionStorage', 'chat.pending.' + S.pending.convId); S.pending = null; }

  // A response for a conversation the user has since left is dropped.
  const stillOn = (id) => S.snap?.id === id;
  async function refresh(id = S.snap?.id) {
    if (!id) return;
    try {
      const data = await api('/conversations/' + encodeURIComponent(id));
      if (!stillOn(id)) return;
      const c = unwrapConversation(data);
      if (!c) throw unreadable();
      S.failures = 0; showProblem('');
      applySnapshot(c);
    } catch (e) {
      if (!stillOn(id)) return;
      if (e.status === 404) {
        stopPolling();
        if (S.snap?.id === id) { ++S.openSeq; S.snap = null; store.del('localStorage', SELECTED_KEY); }
        showProblem('That conversation is no longer available on the Studio.'); render(); return;
      }
      S.failures++;
      showProblem('Lost contact with the Studio (' + describe(e) + '). Retrying. What you see may be out of date.');
      schedulePoll();
    }
  }
  function stopPolling() { clearTimeout(S.timer); S.timer = null; }
  function schedulePoll() {
    stopPolling();
    const delay = pollDelay(S.snap, { hidden: document.hidden, failures: S.failures });
    if (delay == null) return;
    const id = S.snap.id;
    S.timer = setTimeout(() => { if (S.snap?.id === id) refresh(id); }, delay);
  }
  function showProblem(text) { const p = $('#problem'); p.textContent = text; p.hidden = !text; }

  /* ---- targets and list ---- */
  async function loadTargets() {
    S.targetsState = 'loading'; S.targetsError = ''; renderConnect();
    try {
      const data = await api('/conversation-targets');
      S.targets = { sites: Array.isArray(data.sites) ? data.sites : [], targets: Array.isArray(data.targets) ? data.targets : [] };
      S.targetsState = 'ok';
      if (!S.targets.sites.some((s) => s.id === S.site)) S.site = S.targets.sites[0]?.id ?? '';
      if (!S.targets.targets.some((t) => t.id === S.targetId)) S.targetId = '';
    } catch (e) { S.targetsState = 'error'; S.targetsError = describe(e); }
    renderConnect(); renderChrome();
  }
  async function loadList() {
    S.listState = 'loading'; renderList();
    try {
      const data = await api('/conversations');
      S.list = Array.isArray(data.conversations) ? data.conversations : [];
      S.listState = 'ok';
    } catch (e) { S.listState = 'error:' + describe(e); }
    renderList();
  }
  async function openConversation(id) {
    const requestSeq = ++S.openSeq;
    try {
      const c = unwrapConversation(await api('/conversations/' + encodeURIComponent(id)));
      if (requestSeq !== S.openSeq) return;
      if (!c || c.id !== id) throw unreadable();
      S.failures = 0; showProblem(''); applySnapshot(c);
    } catch (e) {
      if (requestSeq !== S.openSeq) return;
      if (e.status === 404) {
        // An unavailable list entry does not invalidate the different conversation currently on screen.
        if (S.snap?.id === id) {
          stopPolling(); S.snap = null;
          store.del('localStorage', SELECTED_KEY);
          showProblem('That conversation is no longer available. Choose an earlier conversation or connect again.');
        } else showProblem('The requested conversation is unavailable. The previously selected conversation remains visible; no new send was attempted.');
      } else showProblem('Could not open that conversation: ' + describe(e) + '. No new send was attempted.');
      render();
    }
  }

  /* ---- connect ---- */
  const selectedTarget = () => S.targets.targets.find((t) => t.id === S.targetId) ?? null;
  const targetUsable = (t) => !!t?.site && !t.recorderOwner;
  function connectReady() {
    if (S.connecting) return { ok: false, reason: 'Connecting…' };
    if (S.snap && S.snap.state !== 'closed') return { ok: false, reason: 'Finish the current conversation before connecting another.' };
    if (S.targetsState !== 'ok') return { ok: false, reason: S.targetsState === 'loading' ? 'Loading sites and tabs…' : 'Sites and tabs didn’t load. Try Refresh tabs.' };
    if (S.mode === 'new') return S.site ? { ok: true, reason: '' } : { ok: false, reason: 'No known sites are available.' };
    const t = selectedTarget();
    if (!t) return { ok: false, reason: 'Choose a tab to continue.' };
    if (!targetUsable(t)) return { ok: false, reason: targetHint(t) + '.' };
    return { ok: true, reason: '' };
  }
  async function connect() {
    const ready = connectReady(); if (!ready.ok) { renderConnect(); return; }
    const body = S.mode === 'new' ? { site: S.site, freshTab: true } : { site: selectedTarget().site, targetId: S.targetId };
    const known = new Set(S.list.map((c) => c.id));
    S.connecting = true; $('#connectError').textContent = ''; renderConnect();
    try {
      const c = unwrapConversation(await api('/conversations', { method: 'POST', body }));
      if (!c) throw unreadable();
      S.focusMessage = true; showProblem('');
      applySnapshot(c); loadList();
    } catch (e) {
      let msg = (isAmbiguous(e) ? 'We couldn’t confirm the connection: ' : 'Couldn’t connect: ') + describe(e) + ' Studio does not retry by itself.';
      // A failed attach can still leave a conversation that owns the browser. Surface it so it can be finished.
      await loadList();
      const created = S.list.filter((c) => !known.has(c.id) && c.state !== 'closed');
      if (created.length === 1) { await openConversation(created[0].id); msg += ' A conversation was left open. Check it or finish it from the notice below.'; }
      else if (created.length > 1) msg += ' Check “Earlier conversations”.';
      $('#connectError').textContent = msg;
    } finally { S.connecting = false; renderConnect(); renderChrome(); }
  }

  /* ---- send ---- */
  // The only place a turn is posted. One click on Send, always a NEW key (never the key of an earlier attempt),
  // and never from a timer, a poll or a recovery button.
  async function sendMessage() {
    const snap = S.snap; if (!snap || S.submitting || S.pending) return;
    const check = canSend(snap, { prompt: $('#prompt').value, busy: false });
    if (!check.ok) { renderComposer(); return; }
    const prompt = $('#prompt').value.replace(/\s+$/, '');
    S.pending = { convId: snap.id, key: newKey(), prompt, expectedRevision: Number(snap.revision), priorTurnId: snap.turn?.id ?? null };
    savePending();
    const body = { key: S.pending.key, prompt, confirm: true, expectedRevision: S.pending.expectedRevision };
    S.submitting = true; S.checkedNote = ''; S.unknownDetail = '';
    setError('#sendError', ''); render();
    $('#transcript').focus();
    try {
      const c = unwrapConversation(await api('/conversations/' + encodeURIComponent(snap.id) + '/turns', { method: 'POST', body }));
      if (!c) throw Object.assign(new Error('The Studio accepted the request but sent a reply we couldn’t read.'), { status: 200, malformed: true });
      S.sentPrompt = S.pending?.prompt ?? S.sentPrompt; store.set('sessionStorage', 'chat.sent.' + snap.id, S.sentPrompt);
      clearPending(); if (stillOn(snap.id)) applySnapshot(c);
    } catch (e) {
      if (isAmbiguous(e)) {
        // Outcome unknown: the composer stays locked and the banner offers a read-only check or a deliberate Send again.
        S.unknownDetail = describe(e); savePending(); refresh(snap.id);
      } else {
        clearPending();
        const r = sendRejection(e); setError('#sendError', r.text, r.link);
        refresh(snap.id);
      }
    } finally { S.submitting = false; render(); }
  }
  // The user's own choice after an unknown outcome: one click, a new key, the same text.
  function sendAgain() {
    if (!pendingUnknown(S.pending, S.snap, S.submitting) || isUncertain(S.snap)) return;
    const text = S.pending.prompt;
    clearPending(); S.unknownDetail = '';
    const box = $('#prompt'); box.readOnly = false; box.value = text;
    sendMessage();
  }
  async function copyMine() {
    const text = S.pending?.prompt || S.sentPrompt || ''; if (!text) return;
    const clip = globalThis.navigator?.clipboard;
    try { if (!clip?.writeText) throw new Error('no clipboard'); await clip.writeText(text); S.copyState = 'copied'; } catch { S.copyState = 'failed'; }
    $('#announce').textContent = S.copyState === 'copied' ? 'Message copied.' : 'Couldn’t copy the message.';
    render();
  }

  /* ---- reconcile and finish ---- */
  // Read-only: refreshes readiness when nothing was sent, or looks for the earlier send. Never types or sends.
  async function reconcile(errorSel = '#reconcileError') {
    if (!S.snap || S.working) return;
    const id = S.snap.id;
    S.working = true; setError(errorSel, ''); $('#readyChecked').textContent = ''; S.checkedNote = ''; render();
    let released = false;
    try {
      const c = unwrapConversation(await api('/conversations/' + encodeURIComponent(id) + '/reconcile', { method: 'POST', body: { expectedRevision: Number(S.snap.revision) } }));
      if (!stillOn(id)) return;
      if (c) applySnapshot(c); else await refresh(id);
      if (S.snap && checkFoundNoMessage(S.pending, S.snap)) {
        // Read-only evidence: the chat shows no new message from this request. Release the lock; the text stays in the box.
        clearPending(); S.unknownDetail = ''; released = true;
        S.checkedNote = 'Checked: Studio found no new message from you in this chat. You can send it now.';
        $('#announce').textContent = S.checkedNote;
      } else if (S.snap && readinessPanel(S.snap).show) $('#readyChecked').textContent = 'Checked again just now. Studio still can’t send.';
      else if (S.snap && pendingUnknown(S.pending, S.snap)) $('#announce').textContent = 'Checked again. Studio still can’t confirm the message was sent.';
      else if (S.snap && canSend(S.snap, { prompt: 'x' }).ok) $('#announce').textContent = 'Checked. Ready to send.';
    } catch (e) {
      setError(errorSel, e.status === 409 && e.data?.code === 'STALE_REVISION'
        ? 'The conversation changed while checking. It has been refreshed. Press Check again.' : 'Could not check: ' + describe(e), errorLink(e.data?.code));
      if (e.status === 409) refresh(id);
    } finally { S.working = false; render(); if (released) $('#prompt').focus(); }
  }
  async function finish() {
    if (!S.snap || S.working) return;
    const id = S.snap.id;
    const closeTab = !$('#closeTabField').hidden && $('#closeTab').checked && canCloseTab(S.snap);
    S.working = true; S.finishFocus = true; setError('#finishError', ''); render();
    try {
      const c = unwrapConversation(await api('/conversations/' + encodeURIComponent(id) + '/finish', { method: 'POST', body: { closeTab } }));
      if (!stillOn(id)) return;
      if (c) applySnapshot(c); else await refresh(id);
    } catch (e) {
      S.finishFocus = false;
      setError('#finishError', isAmbiguous(e)
        ? 'We couldn’t confirm the capture was finished (' + describe(e) + '). Check status before trying again.'
        : 'Could not finish: ' + describe(e), errorLink(e.data?.code));
      refresh(id);
    } finally { S.working = false; render(); }
  }
  function newConversation() {
    ++S.openSeq;
    stopPolling(); S.snap = null; S.pending = null; S.sentPrompt = ''; S.failures = 0;
    S.unknownDetail = ''; S.checkedNote = ''; S.copyState = ''; S.replyTrack = null; S.finishFocus = false; textBlocks.clear();
    store.del('localStorage', SELECTED_KEY); $('#prompt').value = ''; $('#prompt').readOnly = false;
    $('#detailsKv').replaceChildren(); showProblem(''); render(); loadTargets(); $('#connectBox').open = true;
  }

  /* ---- rendering ---- */
  function renderConnect() {
    const sel = $('#site');
    sel.replaceChildren(...(S.targets.sites.length ? S.targets.sites.map((s) => el('option', { value: s.id, text: s.id, selected: s.id === S.site })) : [el('option', { value: '', text: S.targetsState === 'loading' ? 'Loading sites…' : 'No sites available' })]));
    sel.value = S.site;
    const site = S.targets.sites.find((s) => s.id === S.site);
    $('#siteNote').textContent = site?.url ? 'Opens ' + shortUrl(site.url) : '';
    $('#siteField').hidden = S.mode !== 'new'; $('#existingField').hidden = S.mode !== 'existing';
    const list = $('#targetList');
    if (S.mode === 'existing') {
      if (S.targetsState === 'loading') list.replaceChildren(el('div', { class: 'empty', text: 'Loading tabs…' }));
      else if (S.targetsState === 'error') list.replaceChildren(el('div', { class: 'err pad', text: 'Could not load tabs: ' + S.targetsError }));
      else if (!S.targets.targets.length) list.replaceChildren(el('div', { class: 'empty' }, [
        'No supported tabs found. Open a supported site in the capture browser, then Refresh tabs. ', el('a', { class: 'hit', href: '/', text: 'Open Studio' }),
      ]));
      else list.replaceChildren(...S.targets.targets.map((t, i) => {
        const usable = targetUsable(t), id = 'tg-' + i, hint = targetHint(t);
        const input = el('input', { type: 'radio', name: 'target', id, value: t.id, checked: t.id === S.targetId, disabled: !usable, onchange: () => { S.targetId = t.id; renderConnect(); } });
        return el('label', { class: 'pick target' + (usable ? '' : ' off'), for: id }, [input, el('span', {}, [
          el('span', { class: 't-title', text: t.title || '(untitled)' }), el('br'),
          el('span', { class: 't-sub', text: [t.site, shortUrl(t.url)].filter(Boolean).join(' · ') + (hint ? ' — ' + hint : '') }),
        ])]);
      }));
    }
    const ready = connectReady();
    $('#btnConnect').disabled = !ready.ok;
    $('#btnConnect').textContent = S.connecting ? 'Connecting…' : 'Connect and start recording';
    $('#connectHint').textContent = ready.ok ? '' : ready.reason;
    $('#btnTabs').disabled = S.targetsState === 'loading';
  }
  function renderChrome() {
    const snap = S.snap, box = $('#connectBox');
    $('#connectSummary').textContent = snap && snap.state !== 'closed'
      ? 'Connected: ' + siteName(snap.site) + ' · ' + (ownedByStudio(snap) ? 'Studio’s tab' : 'your tab') + ' · ' + conversationChip(snap.state)[0]
      : 'Connection';
    if (snap && snap.state !== 'closed' && box.dataset.autoClosed !== snap.id) { box.open = false; box.dataset.autoClosed = snap.id; }
    if (!snap) { delete box.dataset.autoClosed; }
  }
  function renderStage(snap) {
    setText($('#stageLine'), stageInfo(snap, { pending: pendingUnknown(S.pending, snap, S.submitting), submitting: S.submitting }).text);
  }
  function renderChips(snap) {
    if (!snap) { syncChips($('#chips'), []); return; }
    const out = [conversationChip(snap.state)];
    const ready = readinessChip(snap);
    if (ready) out.push(ready);
    if (snap.turn) {
      out.push(isPreparing(snap) ? ['Preparing to send', 't-live'] : sendChip(snap.turn.send?.state));
      if (messageStarted(snap) && snap.reply) {
        out.push(replyChip(snap.reply.state));
        // A ready reply with unknown network completion is only interactive readiness. Say so beside the reply chip.
        if (snap.reply.state === 'ready' && !completionKnown(snap.reply.completion)) out.push(completionChip(snap.reply.completion));
      }
    }
    if (snap.capture) out.push(captureChip(snap.capture.state));
    syncChips($('#chips'), out);
  }
  // Reply text nodes are kept and appended to, so a selection inside a streaming reply survives each poll.
  function setNodeText(textNode, next) {
    const prev = textNode.data;
    if (prev === next) return;
    if (next.startsWith(prev)) textNode.appendData(next.slice(prev.length)); else textNode.data = next;
  }
  function makeBlock(b) {
    const textNode = document.createTextNode('');
    const body = el('p', { class: 'body' }, [textNode]);
    if (b.kind === 'answer') return { root: el('div', {}, [body]), textNode };
    const d = el('details', { class: 'blk' }, [el('summary', { text: b.label }), body]);
    d.open = !!S.openBlocks[b.key];
    d.addEventListener('toggle', () => { S.openBlocks[b.key] = d.open; });
    return { root: d, textNode };
  }
  function syncReplyBlocks(blocks, reply) {
    const holder = $('#replyBlocks'), want = [];
    if (!blocks.length) {
      let ph = textBlocks.get('placeholder');
      if (!ph) { ph = { root: el('p', { class: 'note' }) }; textBlocks.set('placeholder', ph); }
      setText(ph.root, reply.state === 'waiting' || reply.state === 'streaming' ? 'Waiting for the reply…' : 'No reply text yet.');
      want.push(ph.root);
    }
    for (const b of blocks) {
      let rec = textBlocks.get(b.key);
      if (!rec) { rec = makeBlock(b); textBlocks.set(b.key, rec); }
      setNodeText(rec.textNode, b.text ?? 'This content is stored in the saved session. Open the session to read it.');
      want.push(rec.root);
    }
    for (const k of [...textBlocks.keys()]) if (k !== 'placeholder' ? !blocks.some((b) => b.key === k) : blocks.length) textBlocks.delete(k);
    const have = Array.from(holder.children);
    if (have.length !== want.length || want.some((n, i) => n !== have[i])) holder.replaceChildren(...want);
  }
  function renderTranscript(snap) {
    const started = messageStarted(snap), preparing = isPreparing(snap);
    const empty = $('#emptyState');
    empty.hidden = !!snap && (started || preparing);
    setText(empty, !snap ? 'No conversation yet. Connect to a site above.'
      : 'Connected. Earlier messages in this chat aren’t shown here. Write your message below.');
    $('#youMsg').hidden = !(started || preparing); $('#phaseLine').hidden = !started; $('#replyMsg').hidden = !started || !snap?.reply;
    if (!(started || preparing)) return;
    setText($('#youText'), S.sentPrompt || $('#prompt').value || 'Your message isn’t kept in this browser tab.');
    setText($('#youNote'), preparing ? 'Not sent yet. Studio is checking the chat box and typing.'
      : (snap.turn.send?.observationSource ? 'Send seen in: ' + word(snap.turn.send.observationSource) + '. ' : '') + 'Studio can’t prove the site received it only once.');
    const copy = $('#btnCopy');
    copy.hidden = !S.sentPrompt;
    setText(copy, S.copyState === 'copied' ? 'Message copied' : S.copyState === 'failed' ? 'Couldn’t copy. Select the text instead' : 'Copy my message');
    if (!started) return;
    syncChips($('#phaseLine'), [sendChip(snap.turn.send?.state), ...(snap.reply ? [replyChip(snap.reply.state)] : [])]);
    const reply = snap.reply; if (!reply) return;
    setText($('#replyHead'), 'Reply from ' + siteName(snap.site));
    const blocks = replyBlocks(reply);
    syncReplyBlocks(blocks, reply);
    syncChips($('#replyChips'), [sourceChip(reply.source), completionChip(reply.completion)]);
    const total = Number(reply.chars), shown = shownChars(blocks), chars = Number.isFinite(total) ? total : shown;
    const now = Date.now(), live = ['waiting', 'streaming'].includes(reply.state);
    if (!S.replyTrack) S.replyTrack = { chars, at: now, changed: false };
    else if (S.replyTrack.chars !== chars) { S.replyTrack.chars = chars; S.replyTrack.at = now; S.replyTrack.changed = true; }
    optText('#replyCount', chars > 0 || shown > 0 ? replyCountText(chars, live || S.replyTrack.changed ? now - S.replyTrack.at : null) : '');
    const partial = replyMayBePartial(reply);
    $('#replyPartial').hidden = !partial; setText($('#replyPartial'), partial ? PARTIAL_TEXT : '');
    optText('#replyTrunc', Number.isFinite(total) && total > shown && blocks.some((b) => b.kind === 'answer' && b.text != null)
      ? 'Showing ' + shown + ' of ' + total + ' characters. The full text is in the saved session.' : '');
  }
  function renderBanners(snap) {
    // One banner for both kinds of "not sure it was sent": the service says so, or our own send request got no answer.
    const pend = pendingUnknown(S.pending, snap, S.submitting), server = !!snap && isUncertain(snap);
    const unc = !!snap && (server || pend);
    const banner = $('#uncertain');
    banner.hidden = !unc;
    if (unc) {
      const sendUnsure = pend || snap.turn?.send?.state === 'uncertain' || snap.diagnostic?.uncertainty === 'send-acknowledgement-lost';
      const v = uncertainView(snap, { pending: pend && !server, detail: S.unknownDetail });
      setText($('#uncertainHead'), v.headline);
      syncList($('#uncertainLines'), v.lines);
      setText($('#chromeGuide'), chromeGuidance(snap, sendUnsure));
    }
    $('#btnReconcile').disabled = S.working;
    // Send again exists only for our own unanswered request. A service-side uncertain turn is never re-sent.
    $('#btnSendAgain').hidden = !(pend && !server); $('#btnSendAgain').disabled = S.working || S.submitting;
    setText($('#checkedNote'), S.checkedNote);
    // The banner takes focus once per transition, not on every poll.
    const focusKey = unc ? snap.id + ':' + (pend ? 'pending:' + S.pending.key : snap.turn?.id ?? '') : '';
    if (unc && S.bannerFocus !== focusKey) { S.bannerFocus = focusKey; banner.focus(); }
    if (!unc) S.bannerFocus = '';
    // Readiness: why sending is off, with a read-only Check again even when no message exists.
    const rp = readinessPanel(snap);
    $('#readyPanel').hidden = !rp.show || pend;
    if (rp.show) {
      $('#readyHead').textContent = rp.heading;
      $('#readyNote').textContent = rp.draft
        ? 'There’s text in the chat box' + (rp.chars != null ? ' (' + rp.chars + ' characters)' : '') + '. Studio never clears it for you. Send or clear it yourself in the Chrome tab, then press Check again (read-only).'
        : 'Fix it in Chrome if needed, then press Check again (read-only).';
      $('#readyReasons').replaceChildren(...rp.lines.map((l) => el('li', { text: l })));
      $('#btnCheck').disabled = S.working;
    } else $('#readyChecked').textContent = '';
  }
  function renderComposer() {
    const snap = S.snap, prompt = $('#prompt');
    const locked = !!S.pending && !!snap && S.pending.convId === snap.id && !pendingRegistered(S.pending, snap);
    // Once the one message has been sent the composer steps aside and Finish becomes the next action.
    $('#composer').hidden = messageStarted(snap);
    if (locked) prompt.value = S.pending.prompt;
    // The text leaves the box only once a send was actually started; a blocked or interrupted attempt keeps it.
    if (messageStarted(snap)) prompt.value = '';
    prompt.disabled = !!snap && (snap.state === 'closed' || (!!snap.turn && !isBlockedTurn(snap)));
    prompt.readOnly = locked || S.submitting;
    const check = canSend(snap, { prompt: prompt.value, busy: S.submitting || locked });
    $('#btnSend').disabled = !check.ok;
    $('#sendHint').textContent = check.ok ? (isBlockedTurn(snap) ? 'Your earlier attempt was stopped before anything was typed or sent.' : '')
      : locked && !S.submitting ? 'Locked: Studio can’t confirm your last message was sent. Use Check again or Send again in the notice above.' : check.reason;
  }
  function renderFinish(snap) {
    const bar = $('#finishBar');
    bar.hidden = !snap;
    if (!snap) return;
    const closed = snap.state === 'closed';
    const ctl = finishControl(snap, { working: S.working }), out = finishOutcome(snap);
    const bits = [];
    if (!out) {
      if (snap.reply?.state === 'ready' && messageStarted(snap) && snap.capture?.state === 'recording') bits.push('Reply ready. Still recording.');
      else if (snap.capture) bits.push(captureChip(snap.capture.state)[0] + '.');
      if (ctl.early) bits.push('The reply isn’t finished. Finishing now will probably leave the capture incomplete.');
      if (snap.capture?.state === 'recording' && !(snap.reply?.state === 'ready' && messageStarted(snap))) bits.push('Recording continues until you finish it' + (limitStatus(snap.capture).lines.length ? ' or the recording budget runs out.' : '.'));
      if (limitStatus(snap.capture).warn) bits.push('The recording limit is close. Finish soon.');
    }
    const fe = finishErrorText(snap.diagnostic?.finishError);
    if (fe) bits.push(fe);
    const showClose = !closed && canCloseTab(snap);
    $('#closeTabField').hidden = !showClose;
    if (!showClose) $('#closeTab').checked = false;
    if (!closed && !showClose) bits.push(isUncertain(snap) || snap.diagnostic?.uncertainty ? 'The tab stays open because the state isn’t confirmed.' : 'Studio won’t close this tab.');
    setText($('#finishNote'), bits.join(' '));
    optHidden('#oneTurnNote', !(messageStarted(snap) && !closed));
    // Outcome: chip, the failed or unknown checks behind it, and the saved session, all in the bar itself.
    setText($('#finishHeading'), out ? 'Result: ' + out.chip[0] : 'Capture');
    $('#finishOutcome').hidden = !out; syncChips($('#finishOutcome'), out ? [out.chip] : []);
    syncList($('#finishReasons'), out ? out.reasons : []);
    const sid = snap.sessionId, links = $('#finishLinks'), linkSig = out && sid ? sid : '';
    if (links.dataset.sig !== linkSig) { links.dataset.sig = linkSig; links.replaceChildren(...(linkSig ? [newTabLink('/#session=' + encodeURIComponent(sid), 'Open saved session'), newTabLink('/#session=' + encodeURIComponent(sid) + '&view=knowledge', 'Explore derived knowledge (may be incomplete)')] : [])); }
    $('#btnFinish').disabled = ctl.disabled;
    setText($('#btnFinish'), ctl.label);
    $('#btnFinish').className = snap.reply?.state === 'ready' && messageStarted(snap) && !closed ? 'primary' : '';
    $('#btnNew').hidden = !closed;
    if (out && S.finishFocus) { S.finishFocus = false; $('#finishHeading').focus(); }
  }
  function renderDetails(snap) {
    const kv = $('#detailsKv');
    if (!snap) kv.replaceChildren(el('dt', { text: 'Status' }), el('dd', { text: 'No conversation selected.' }));
    else {
      const rows = [
        ['Site', siteName(snap.site)], ['State', conversationChip(snap.state)[0]], ['Revision', String(snap.revision)],
        ['Tab', snap.binding?.title || shortUrl(snap.binding?.origin ?? snap.binding?.url) || 'Not reported'],
        ['Tab owner', ownedByStudio(snap) ? 'Studio opened it' : 'You (Studio never closes it)'],
        ['Chat box', readinessText(snap)],
        ['Step', snap.turn?.phase ? word(snap.turn.phase) : '—'],
        ['Integrity check', integrityText(snap.capture)],
      ];
      if (snap.turn?.reason) rows.push(['Turn note', reasonText(snap.turn.reason)]);
      if (snap.diagnostic?.uncertainty) rows.push(['Needs checking', uncertaintyText(snap.diagnostic.uncertainty)]);
      if (snap.diagnostic?.finishPhase && snap.diagnostic.finishPhase !== 'idle') rows.push(['Finish step', word(snap.diagnostic.finishPhase)]);
      if (snap.diagnostic?.finishError) rows.push(['Finish problem', finishErrorText(snap.diagnostic.finishError)]);
      kv.replaceChildren(...rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]));
    }
    const ev = snap?.evidence ?? snap?.turn?.evidence ?? snap?.capture?.evidence ?? null;
    const gates = Array.isArray(ev?.gates) ? ev.gates : [];
    $('#gates').replaceChildren(...(gates.length ? gates.map((g) => {
      const [label, tone] = gateChip(gateValue(g));
      return el('li', {}, [gateLabel(g) + ': ', el('b', { class: tone, text: label })]);
    }) : [el('li', { class: 'muted', text: 'Not checked yet. No evidence checks have run.' })]));
    const unknowns = Array.isArray(ev?.unknowns) ? ev.unknowns : [];
    optText('#unknowns', unknowns.length ? 'Still unknown: ' + unknowns.map(word).join(', ') + '.' : '');
    const lim = limitStatus(snap?.capture);
    optText('#limits', lim.stopped ? 'Capture stopped: ' + lim.stopped + '.' : lim.lines.length ? lim.lines.join(' ') + (lim.warn ? ' The limit is close.' : '') : 'No limits reported.');
    const lims = Array.isArray(snap?.limitations) ? snap.limitations : [];
    $('#limitations').replaceChildren(...(lims.length ? lims.map((l) => el('li', { text: limitationText(l) })) : [el('li', { class: 'muted', text: 'Nothing reported. Traffic from before you connected is never captured.' })]));
    const sid = snap?.sessionId;
    $('#sessionLinks').replaceChildren(...(sid ? [
      newTabLink('/#session=' + encodeURIComponent(sid), 'Open session'),
      newTabLink('/#session=' + encodeURIComponent(sid) + '&view=knowledge', 'Explore derived knowledge (may be incomplete)'),
      el('a', { class: 'hit', href: '/api/sessions/' + encodeURIComponent(sid) + '/transcript', text: 'Download transcript' }),
    ] : []));
  }
  function renderList() {
    const ul = $('#convList'), state = $('#listState');
    if (S.listState === 'loading') { state.textContent = 'Loading…'; ul.replaceChildren(); return; }
    if (S.listState.startsWith('error:')) { state.textContent = 'Could not load conversations: ' + S.listState.slice(6); ul.replaceChildren(); return; }
    state.textContent = S.list.length ? '' : 'No conversations yet.';
    ul.replaceChildren(...S.list.slice(0, 20).map((c) => {
      const [label, tone] = conversationChip(c.state);
      const b = el('button', { type: 'button', onclick: () => openConversation(c.id) }, [el('span', { text: siteName(c.site) || c.id }), el('span', { class: 'pill ' + tone, text: label })]);
      if (S.snap?.id === c.id) b.setAttribute('aria-current', 'true');
      return el('li', {}, [b]);
    }));
  }
  function announce(snap) {
    // Phase changes only. Streaming text is never announced; a ready reply adds its source and completion once.
    const unsure = pendingUnknown(S.pending, snap, S.submitting);
    const ready = replyReadyText(snap);
    const key = snap ? [snap.state, snap.turn?.phase, snap.turn?.send?.state, snap.reply?.state, snap.capture?.state, snap.readiness?.ready, unsure, ready].join('|') : '';
    if (key === S.announced) return;
    S.announced = key;
    if (!snap) { $('#announce').textContent = ''; return; }
    const parts = [conversationChip(snap.state)[0]];
    const rc = readinessChip(snap); if (rc) parts.push(rc[0]);
    if (unsure) parts.push('Send not confirmed');
    if (snap.turn) { parts.push(isPreparing(snap) ? 'Preparing to send' : sendChip(snap.turn.send?.state)[0]); if (messageStarted(snap) && snap.reply) parts.push(ready || replyChip(snap.reply.state)[0]); }
    if (snap.reply?.state === 'ready' && messageStarted(snap) && snap.capture?.state === 'recording') parts.push('Still recording');
    else if (snap.capture) parts.push(captureChip(snap.capture.state)[0]);
    $('#announce').textContent = parts.join('. ') + '.';
  }
  function render() {
    const snap = S.snap;
    renderChrome(); renderStage(snap); renderChips(snap); renderBanners(snap); renderTranscript(snap); renderComposer(); renderFinish(snap);
    renderDetails(snap); renderList(); renderConnect(); announce(snap);
    if (S.focusMessage && snap?.state === 'ready' && !$('#prompt').disabled) { S.focusMessage = false; $('#prompt').focus(); }
  }

  /* ---- wiring ---- */
  document.querySelectorAll('input[name=mode]').forEach((r) => r.addEventListener('change', () => { if (r.checked) { S.mode = r.value; $('#connectError').textContent = ''; renderConnect(); } }));
  $('#site').addEventListener('change', () => { S.site = $('#site').value; renderConnect(); });
  $('#btnTabs').addEventListener('click', loadTargets);
  $('#btnConnect').addEventListener('click', connect);
  // Enter is a plain newline and there is no keyboard shortcut that sends: Send is one deliberate click.
  $('#btnSend').addEventListener('click', sendMessage);
  $('#btnSendAgain').addEventListener('click', sendAgain);
  $('#btnCopy').addEventListener('click', copyMine);
  $('#composer').addEventListener('submit', (e) => e.preventDefault());
  $('#prompt').addEventListener('input', () => {
    if (S.snap && !S.pending) store.set('sessionStorage', 'chat.draft.' + S.snap.id, $('#prompt').value);
    renderComposer();
  });
  $('#btnReconcile').addEventListener('click', () => reconcile('#reconcileError'));
  $('#btnCheck').addEventListener('click', () => reconcile('#readyError'));
  $('#btnFinish').addEventListener('click', finish);
  $('#btnNew').addEventListener('click', newConversation);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedulePoll(); });
  const wide = window.matchMedia?.('(min-width: 1100px)');
  const syncDetails = () => { if (wide?.matches) $('#detailsBox').open = true; };
  wide?.addEventListener?.('change', syncDetails); syncDetails();
  window.addEventListener('pagehide', stopPolling);

  render(); renderConnect();
  (async () => {
    await Promise.allSettled([loadTargets(), loadList()]);
    const saved = store.get('localStorage', SELECTED_KEY);
    const open = S.list.find((c) => c.id === saved)
      ?? S.list.find((c) => c.state === 'needs-reconciliation') ?? S.list.find((c) => c.state && c.state !== 'closed');
    const id = open?.id ?? (S.listState !== 'ok' ? saved : null);
    if (id) await openConversation(id);
    render();
  })();
}

if (typeof document !== 'undefined' && document.getElementById('chatApp')) boot();
