// Interaction primitives for driving a live AI web app through CDP.
//
// Design: the generic heuristics below are the primary mechanism and must work with no adapter
// at all; site adapters (src/profiles/sites/<id>.mjs) only refine selector choice. Everything
// here runs over an already-attached page session (the object Recorder exposes as `recorder.page`),
// so `page.send(method, params)` is the only capability assumed.
//
// The chosen composer is remembered in page state (`globalThis.__aionDrive`), never by mutating
// the page's DOM: no marker attributes, no injected elements.
import path from 'node:path';
import { CdpConnection, sleep } from '../cdp/client.mjs';
import { listTargets, browserWsUrl } from '../cdp/discovery.mjs';
import { dataPaths, defaultDataDir, ensureDataDirs } from '../config.mjs';
import { ProfileStore } from '../profiles/profiles.mjs';
import { Recorder } from './recorder.mjs';
import { humanType, humanPressEnter, humanClick, humanIdle, prepareHumanEnvironment, DEFAULT_PACE } from './human.mjs';

// ---------------------------------------------------------------------------------------------
// Shared in-page helpers. Kept free of template-literal syntax so it can be embedded verbatim.
// ---------------------------------------------------------------------------------------------
const IN_PAGE = String.raw`
  const vis = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (!(r.width > 1 && r.height > 1)) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    return true;
  };
  const txt = (el) => String(el.innerText ?? el.textContent ?? '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const store = (el, kind, tag) => { globalThis.__aionDrive = { el: el, kind: kind, tag: tag, at: Date.now() }; return globalThis.__aionDrive; };
  const live = () => { const s = globalThis.__aionDrive; return s && s.el && s.el.isConnected ? s.el : null; };
`;

const norm = (v) => String(v ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------------------------
export async function evaluate(page, expression, { awaitPromise = true, returnByValue = true } = {}) {
  const r = await page.send('Runtime.evaluate', { expression, awaitPromise, returnByValue, userGesture: true });
  if (r?.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error(d.exception?.description ?? d.text ?? 'Runtime.evaluate failed');
  }
  return returnByValue ? r?.result?.value : r?.result;
}

async function tryEval(page, expression) {
  try { return { ok: true, value: await evaluate(page, expression) }; }
  catch (e) { return { ok: false, error: String(e?.message ?? e) }; }
}

// ---------------------------------------------------------------------------------------------
// Composer discovery + focus
// ---------------------------------------------------------------------------------------------
export async function findComposer(page, adapter = null) {
  const selectors = Array.isArray(adapter?.composer?.selectors) ? adapter.composer.selectors : [];
  const expr = String.raw`(() => { ${IN_PAGE}
    const adapterSels = ${JSON.stringify(selectors)};
    const kindOf = (el) => el.tagName === 'TEXTAREA' ? 'textarea'
      : el.tagName === 'INPUT' ? 'input'
      : el.isContentEditable ? 'contenteditable'
      : 'textbox';
    const blocked = (el) => el.disabled === true || el.readOnly === true || el.getAttribute('aria-disabled') === 'true';
    const usable = (el) => vis(el) && !blocked(el);

    for (const sel of adapterSels) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { els = []; }
      for (const el of els) {
        if (!usable(el)) continue;
        store(el, kindOf(el), el.tagName.toLowerCase());
        return { found: true, kind: kindOf(el), tag: el.tagName.toLowerCase(), reason: 'adapter selector: ' + sel };
      }
    }

    const genericSels = ['textarea', '[contenteditable="true"]', '[contenteditable=""]', '[role="textbox"]'];
    const cands = [];
    for (const sel of genericSels) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
      for (const el of els) {
        if (!usable(el)) continue;
        if (el.closest('dialog,[aria-hidden="true"]')) continue;
        const r = el.getBoundingClientRect();
        cands.push({ el: el, area: r.width * r.height, sel: sel });
      }
    }
    if (!cands.length) {
      globalThis.__aionDrive = null;
      return { found: false, kind: null, tag: null, reason: 'no visible composer matched (adapter selectors and generic heuristic both failed)' };
    }
    cands.sort((a, b) => b.area - a.area);
    const pick = cands[0].el;
    store(pick, kindOf(pick), pick.tagName.toLowerCase());
    return { found: true, kind: kindOf(pick), tag: pick.tagName.toLowerCase(), reason: 'generic heuristic: ' + cands[0].sel + ' (' + cands.length + ' candidate(s))' };
  })()`;
  const r = await tryEval(page, expr);
  if (!r.ok) return { found: false, kind: null, tag: null, reason: `composer probe failed: ${r.error}` };
  return r.value ?? { found: false, kind: null, tag: null, reason: 'composer probe returned nothing' };
}

// Browsers need a moment after navigation: retry discovery until a deadline instead of failing
// on the first paint (a tab opened with /json/new returns before the app has mounted its composer).
export async function waitForComposer(page, adapter = null, { timeoutMs = 20000, intervalMs = 400 } = {}) {
  const deadline = Date.now() + Math.max(1000, timeoutMs);
  let last = null;
  for (;;) {
    last = await findComposer(page, adapter);
    if (last?.found) return { ...last, waitedMs: timeoutMs - Math.max(0, deadline - Date.now()) };
    if (Date.now() >= deadline) {
      return { ...(last ?? { found: false, kind: null, tag: null }), timedOut: true, reason: `${last?.reason ?? 'no composer'} (waited ${timeoutMs} ms)` };
    }
    await sleep(intervalMs);
  }
}

// `target` may be a findComposer() result, an adapter, or nothing at all.
export async function focusComposer(page, target = null) {
  const found = target && typeof target === 'object' && 'found' in target
    ? target
    : await findComposer(page, target && target.composer ? target : null);
  if (!found?.found) return { ok: false, method: null, reason: found?.reason ?? 'no composer found' };

  const box = await tryEval(page, String.raw`(() => { ${IN_PAGE}
    const el = live(); if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: r.width, h: r.height };
  })()`);

  const b = box.ok ? box.value : null;
  let method = 'focus';
  if (b && b.w > 1) {
    try {
      await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
      await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
      method = 'click+focus';
    } catch { method = 'focus'; }
  }

  const st = await tryEval(page, String.raw`(() => { ${IN_PAGE}
    const el = live(); if (!el) return { ok: false };
    try { el.focus({ preventScroll: true }); } catch (e) { /* read-only or detached */ }
    const a = document.activeElement;
    const ok = a === el || (a && el.contains(a));
    return { ok: !!ok, tag: el.tagName.toLowerCase() };
  })()`);
  return { ok: !!(st.ok && st.value?.ok), method, tag: st.value?.tag ?? found.tag, reason: st.ok ? undefined : st.error };
}

async function composerText(page) {
  const r = await tryEval(page, String.raw`(() => { ${IN_PAGE}
    const el = live(); if (!el) return '';
    return el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? String(el.value ?? '') : String(el.innerText ?? el.textContent ?? '');
  })()`);
  return r.ok ? String(r.value ?? '') : '';
}

// Clear a composer that still holds a draft (select-all + Backspace as real key input).
export async function clearComposer(page) {
  const before = await composerText(page);
  if (!norm(before)) return { ok: true, cleared: false, before: '' };
  const ctrl = { modifiers: 2, windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, key: 'a', code: 'KeyA' };
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', ...ctrl });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...ctrl });
  await sleep(120);
  const bs = { windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8, key: 'Backspace', code: 'Backspace' };
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', ...bs });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...bs });
  await sleep(250);
  const after = await composerText(page);
  return { ok: !norm(after), cleared: true, before, after };
}

// ---------------------------------------------------------------------------------------------
// Typing (human-paced real key input) + sending
// ---------------------------------------------------------------------------------------------
// Human-paced typing. Real key input (Input.dispatchKeyEvent per character, keyDown+keyUp) is
// used instead of setting value/textContent, because rich composers (ProseMirror, Lexical, Slate)
// keep their own editor state: a DOM write shows text the app does not believe exists, so Enter
// silently does nothing. The pacing itself lives in src/capture/human.mjs.
export async function typeText(page, text, { human = true, pace = DEFAULT_PACE } = {}) {
  const s = String(text ?? '');
  if (!s) return { ok: false, typed: '', method: 'none' };

  const focus = await tryEval(page, String.raw`(() => { ${IN_PAGE}
    let el = live();
    if (!el) {
      const a = document.activeElement;
      if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT' || a.isContentEditable || a.getAttribute('role') === 'textbox')) el = a;
    }
    if (!el) return { ok: false };
    store(el, el.isContentEditable ? 'contenteditable' : 'value', el.tagName.toLowerCase());
    try { el.focus({ preventScroll: true }); } catch (e) { /* read-only or detached */ }
    return { ok: true, kind: el.isContentEditable ? 'contenteditable' : el.tagName.toLowerCase() };
  })()`);
  if (!focus.ok || !focus.value?.ok) return { ok: false, typed: '', method: 'none', reason: focus.ok ? 'no composer focused or remembered' : focus.error };

  const before = await composerText(page);
  const res = await humanType(page, s, { pace, human });
  const after = res.typed ?? await composerText(page);
  return {
    ok: !!res.ok,
    typed: after,
    method: res.method,
    kind: focus.value?.kind ?? null,
    expectedChars: s.length,
    grewBy: String(after ?? '').length - String(before ?? '').length,
    stats: res.stats ?? null,
    reason: res.reason,
    errors: res.errors ?? [],
  };
}

async function clickStored(page, globalName) {
  const box = await tryEval(page, String.raw`(() => { const el = globalThis.${globalName}; if (!el || !el.isConnected) return null;
    el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: r.width }; })()`);
  const b = box.ok ? box.value : null;
  if (!b || !(b.w > 1)) return false;
  try {
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    return true;
  } catch { return false; }
}

async function pressEnter(page) {
  // keyDown(no text) + char('\r') + keyUp: exactly one submit, and one newline in a multi-line
  // composer. The keyDown{text}+char{text} shape submits twice (ChatGPT received the prompt
  // twice); keyDown{text} alone loses the payload on some editors.
  const base = { windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' };
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
  await page.send('Input.dispatchKeyEvent', { type: 'char', ...base, text: '\r', unmodifiedText: '\r' });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
}

export async function sendMessage(page, adapter = null) {
  const strategy = adapter?.send?.strategy ?? 'both';
  const btn = await tryEval(page, String.raw`(() => { ${IN_PAGE}
    const sels = ${JSON.stringify(Array.isArray(adapter?.send?.buttonSelectors) ? adapter.send.buttonSelectors : [])};
    for (const sel of sels) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
      for (const el of els) {
        if (!vis(el)) continue;
        const b = el.closest('button,[role="button"],input[type="submit"]') || el;
        if (b.disabled === true) continue;
        if (b.getAttribute('aria-disabled') === 'true') continue;
        globalThis.__aionSendBtn = b;
        return { found: true, selector: sel, tag: b.tagName.toLowerCase() };
      }
    }
    globalThis.__aionSendBtn = null;
    return { found: false };
  })()`);
  const button = btn.ok ? btn.value : null;

  if (strategy === 'button' && button?.found && await clickStored(page, '__aionSendBtn')) {
    await sleep(500);
    return { ok: true, method: 'button', cleared: !norm(await composerText(page)) };
  }

  try {
    await pressEnter(page);
  } catch (e) {
    if (button?.found && await clickStored(page, '__aionSendBtn')) return { ok: true, method: 'button-after-enter-error' };
    return { ok: false, method: 'enter-failed', reason: String(e?.message ?? e) };
  }

  await sleep(700);
  let cleared = !norm(await composerText(page));
  let streaming = false;
  try { streaming = (await isStreaming(page, adapter)).streaming; } catch { /* ignore */ }
  if (!cleared && !streaming && button?.found) {
    if (await clickStored(page, '__aionSendBtn')) {
      await sleep(500);
      cleared = !norm(await composerText(page));
      try { streaming = (await isStreaming(page, adapter)).streaming; } catch { /* ignore */ }
      return { ok: cleared || streaming, method: 'button-fallback', cleared };
    }
  }
  return { ok: cleared || streaming, method: 'enter', cleared };
}

// ---------------------------------------------------------------------------------------------
// Transcript + streaming state
// ---------------------------------------------------------------------------------------------
export async function readTranscript(page, adapter = null) {
  const r = await tryEval(page, String.raw`(() => { ${IN_PAGE}
    const turns = [];
    const seen = new Set();
    const push = (role, text) => {
      const t = String(text || '').trim();
      if (!t) return;
      const key = role + ':' + t.slice(0, 120);
      if (seen.has(key)) return;
      seen.add(key);
      turns.push({ role: role, text: t });
    };

    const authored = [...document.querySelectorAll('[data-message-author-role]')];
    if (authored.length) {
      for (const el of authored) {
        const role = el.getAttribute('data-message-author-role');
        if (role !== 'user' && role !== 'assistant') continue;
        if (!vis(el)) continue;
        push(role, txt(el));
      }
      if (turns.some((t) => t.role === 'assistant')) return { turns: turns, reason: 'data-message-author-role' };
    }
    turns.length = 0; seen.clear();

    for (const sel of ${JSON.stringify(Array.isArray(adapter?.assistant?.containerSelectors) ? adapter.assistant.containerSelectors : [])}) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
      for (const el of els) { if (vis(el)) push('assistant', txt(el)); }
      if (turns.length) return { turns: turns, reason: 'adapter containers: ' + sel };
    }

    for (const el of document.querySelectorAll('[data-testid*="assistant" i]')) { if (vis(el)) push('assistant', txt(el)); }
    if (turns.length) return { turns: turns, reason: 'data-testid assistant' };

    // Modern chat UIs no longer use data-message-author-role. ChatGPT (2026) marks a rendered
    // answer with data-markdown-text-style="assistant-message" and wraps the turn in
    // data-content-search-unit-key="...:assistant"; the user turn uses the same key with
    // ":user". Claude/Gemini style UIs use their own data-testid variants.
    const assistantSels = [
      '[data-markdown-text-style="assistant-message"]',
      '[data-content-search-unit-key$="assistant"]',
      '[data-chatgpt-search-unit-key$="assistant"]',
      '[data-message-author-role="assistant"]',
      '[data-testid="assistant-message"]',
      '[data-testid*="assistant-turn" i]',
      '[data-testid*="model-response" i]',
    ];
    for (const sel of assistantSels) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
      for (const el of els) { if (vis(el)) push('assistant', txt(el)); }
      if (turns.length) return { turns: turns, reason: 'assistant container: ' + sel };
    }

    const userSels = [
      '[data-content-search-unit-key$="user"]',
      '[data-chatgpt-search-unit-key$="user"]',
      '[data-markdown-text-style="user-message"]',
      '[data-testid="user-message"]',
    ];
    for (const sel of userSels) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
      for (const el of els) { if (vis(el)) push('user', txt(el)); }
    }
    if (turns.length) return { turns: turns, reason: 'turn-scoped containers' };

    const composer = live();
    const root = document.querySelector('main') || document.body;
    if (!root) return { turns: [], reason: 'no document body' };
    const blocks = [];
    for (const el of root.querySelectorAll('p,li,pre,blockquote,h1,h2,h3,h4,td')) {
      if (composer && (el === composer || el.contains(composer))) continue;
      if (!vis(el)) continue;
      if (el.closest('nav,aside,header,footer,script,style')) continue;
      const t = txt(el);
      if (t.length < 2) continue;
      blocks.push({ t: t, top: el.getBoundingClientRect().top + window.scrollY });
    }
    blocks.sort((a, b) => a.top - b.top);
    const joined = blocks.map((b) => b.t).join('\n').slice(-12000);
    if (joined) return { turns: [{ role: 'assistant', text: joined }], reason: 'generic text blocks (no assistant container matched)' };
    return { turns: [], reason: 'no assistant text found' };
  })()`);
  if (!r.ok) return { turns: [], reason: `transcript read failed: ${r.error}` };
  return { turns: r.value?.turns ?? [], reason: r.value?.reason ?? 'unknown' };
}

export async function isStreaming(page, adapter = null) {
  const r = await tryEval(page, String.raw`(() => { ${IN_PAGE}
    // English and Spanish labels: a localised UI must still be readable as "stop generating".
    const stopLabel = /stop (generating|streaming|responding|response|output|replying)|stop generation|detener (la )?(generaci|respuesta)|parar de generar/i;
    const strong = (el) => {
      const b = el.closest('button,[role="button"]');
      const label = String((b ? (b.getAttribute('aria-label') || b.innerText || '') : (el.getAttribute('aria-label') || '')) || '').trim();
      return !!b && stopLabel.test(label);
    };

    // Turn-state markers are stronger than a button label: ChatGPT marks a finished turn
    // data-talvt-turn-state="complete", so any other value means the turn is still running.
    for (const el of document.querySelectorAll('[data-talvt-turn-state]')) {
      const state = String(el.getAttribute('data-talvt-turn-state') || '').trim();
      if (state && state !== 'complete') return { streaming: true, evidence: 'turn state: ' + state };
    }
    for (const el of document.querySelectorAll('[data-turn-state],[data-message-state="streaming"],[data-streaming="true"]')) {
      if (!vis(el)) continue;
      return { streaming: true, evidence: 'stream state attribute: ' + (el.getAttribute('data-turn-state') || el.getAttribute('data-message-state') || el.getAttribute('data-streaming')) };
    }

    const weak = [];
    for (const sel of ${JSON.stringify(Array.isArray(adapter?.assistant?.streamingSelectors) ? adapter.assistant.streamingSelectors : [])}) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
      for (const el of els) {
        if (!vis(el)) continue;
        if (strong(el)) return { streaming: true, evidence: 'adapter selector: ' + sel };
        weak.push(sel);
      }
    }

    for (const b of document.querySelectorAll('button,[role="button"]')) {
      if (!vis(b)) continue;
      const label = String((b.getAttribute('aria-label') || '') + ' ' + (b.innerText || '')).trim();
      if (stopLabel.test(label)) return { streaming: true, evidence: 'stop control: ' + label.slice(0, 60) };
    }

    for (const el of document.querySelectorAll('[aria-busy="true"]')) { if (vis(el)) return { streaming: true, evidence: 'aria-busy' }; }

    // Weak matches (broad class selectors such as [class*="loading"]) are reported but not counted:
    // they are common on idle pages, and waitForCompletion's text-stability gate is authoritative.
    return { streaming: false, evidence: weak.length ? 'weak match only (' + weak.slice(0, 3).join(', ') + '); text stability decides' : 'none' };
  })()`);
  if (!r.ok) return { streaming: false, evidence: `streaming check failed: ${r.error}` };
  return { streaming: !!r.value?.streaming, evidence: r.value?.evidence ?? 'none' };
}

export async function waitForCompletion(page, adapter = null, { timeoutMs = 120000, stableMs = 2500, pollMs = 400 } = {}) {
  const startedAt = Date.now();
  let lastText = '';
  let lastChangeAt = startedAt;
  let lastStreamingAt = 0;
  let evidence = 'none';
  let text = '';

  for (;;) {
    const now = Date.now();
    const stream = await isStreaming(page, adapter);
    evidence = stream.evidence;
    const tr = await readTranscript(page, adapter);
    const last = [...(tr.turns ?? [])].reverse().find((t) => t.role === 'assistant');
    text = last?.text ?? '';

    if (text && text !== lastText) { lastText = text; lastChangeAt = now; }
    if (stream.streaming) lastStreamingAt = now;

    const quietFor = now - Math.max(lastChangeAt, lastStreamingAt);
    if (!stream.streaming && text && quietFor >= stableMs) {
      return { done: true, ms: Date.now() - startedAt, text, reason: `settled: no change for ${quietFor} ms` };
    }
    if (now - startedAt >= timeoutMs) {
      return { done: false, ms: Date.now() - startedAt, text, reason: `timeout after ${timeoutMs} ms (${evidence}${stream.streaming ? ', still streaming' : ''})` };
    }
    await sleep(pollMs);
  }
}

// ---------------------------------------------------------------------------------------------
// Auth wall
// ---------------------------------------------------------------------------------------------
export async function detectAuthWall(page, adapter = null) {
  const r = await tryEval(page, String.raw`(() => { ${IN_PAGE}
    const composer = live();
    const hasComposer = !!(composer && composer.isConnected);
    const hits = [];
    for (const sel of ${JSON.stringify(Array.isArray(adapter?.preflight?.authWallSelectors) ? adapter.preflight.authWallSelectors : [])}) {
      let els = [];
      try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
      for (const el of els) { if (vis(el)) { hits.push(sel); break; } }
    }

    const url = location.href;
    let pathname = '';
    try { pathname = new URL(url).pathname.toLowerCase(); } catch (e) { pathname = ''; }
    const urlWall = /(^|\/)(login|log-in|signin|sign-in|auth|authorize|signup|register)(\/|$)/.test(pathname);
    const body = String((document.body && document.body.innerText) || '').slice(0, 4000);
    const wall = /(sign in to continue|log in to continue|you need to sign in|please sign in|you must be signed in|continue with google|continue with email|enter your email|verify you are human|create an account or sign in)/i;
    const m = body.match(wall);

    if (hasComposer && !urlWall) return { blocked: false, reason: hits.length ? 'auth-like selectors present but a composer is usable' : 'composer available' };
    if (urlWall) return { blocked: true, reason: 'login URL: ' + url };
    if (hits.length && !hasComposer) return { blocked: true, reason: 'auth wall selector matched, no composer: ' + hits.slice(0, 3).join(', ') };
    if (m && !hasComposer) return { blocked: true, reason: 'login wall text: ' + m[0] };
    return { blocked: false, reason: hasComposer ? 'composer available' : 'no composer found, no login wall detected' };
  })()`);
  if (!r.ok) return { blocked: false, reason: `auth check unavailable: ${r.error}` };
  return { blocked: !!r.value?.blocked, reason: r.value?.reason ?? 'unknown' };
}

// ---------------------------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------------------------
function hostMatches(adapter, url) {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase(); } catch { return false; }
  const bare = host.replace(/^www\./, '');
  for (const raw of adapter?.hosts ?? []) {
    const w = String(raw).toLowerCase().replace(/^www\./, '');
    if (!w) continue;
    if (bare === w || bare.endsWith(`.${w}`)) return true;
  }
  return false;
}

async function openTab(port, url) {
  const endpoint = `http://127.0.0.1:${port}/json/new?${encodeURI(url)}`;
  let res = await fetch(endpoint, { method: 'PUT' });
  if (res.status === 405) res = await fetch(endpoint);
  if (!res.ok) throw new Error(`HTTP ${res.status} from /json/new`);
  return res.json();
}

async function waitForTargetId(port, id, { timeoutMs = 20000, intervalMs = 300 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const targets = await listTargets({ port }).catch(() => []);
    const hit = id ? targets.find((t) => t.id === id) : null;
    if (hit && hit.url !== 'about:blank') return hit;
    if (Date.now() >= deadline) return hit ?? null;
    await sleep(intervalMs);
  }
}

// Drive one live site: resolve the tab, check the login wall, record, type, send, wait, read back.
// Site-level problems are returned, never thrown.
export async function driveSite({ adapter, prompt, port = 9222, dataDir, record = true, timeoutMs = 120000, humanPace = true, onEvent = null } = {}) {
  const startedAt = Date.now();
  const errors = [];
  const result = {
    ok: false, blocked: false, site: adapter?.id ?? null, sessionId: null, ms: 0,
    prompt: String(prompt ?? ''), reply: '', target: null, errors,
  };
  const emit = (ev) => { try { onEvent?.(ev); } catch { /* a listener must never break the drive */ } };

  let recorder = null;
  let conn = null;
  let page = null;

  const cleanup = async () => {
    if (recorder) {
      try { await recorder.stop({ reason: 'drive_complete' }); }
      catch (e) { errors.push(`recorder stop failed: ${String(e?.message ?? e)}`); }
      recorder = null;
    }
    if (conn) { try { conn.close(); } catch { /* already closed */ } conn = null; }
    result.ms = Date.now() - startedAt;
  };

  const openSession = async (target) => {
    if (record) {
      const dir = dataDir ? path.resolve(dataDir) : defaultDataDir();
      const paths = dataPaths(dir);
      ensureDataDirs(paths);
      const store = new ProfileStore(paths.profiles);
      // A site without a matching capture profile still records: 'generic' is the documented fallback.
      let profileName;
      try { profileName = store.selectFor(target.url)?.name; } catch { profileName = 'generic'; }
      recorder = new Recorder({ sessionsDir: paths.sessions, profileStore: store, port, tabs: 'one', follow: false });
      recorder.on('warn', (e) => errors.push(String(e?.message ?? e)));
      const session = await recorder.start({ target: target.id, profile: profileName, label: adapter?.id, tabs: 'one', follow: false });
      result.sessionId = session.id;
      return recorder.page;
    }
    conn = await CdpConnection.connect(await browserWsUrl({ port }), { requestTimeoutMs: 15000 });
    return conn.attach(target.id);
  };

  const run = async () => {
    let targets;
    try { targets = await listTargets({ port }); }
    catch (e) { result.reason = 'no-browser'; errors.push(`DevTools endpoint unreachable on 127.0.0.1:${port}: ${String(e?.message ?? e)}`); return; }

    let target = targets.find((t) => hostMatches(adapter, t.url)) ?? null;
    if (target) emit({ type: 'target', reused: true, id: target.id, url: target.url });
    else {
      const openUrl = adapter?.url ?? (adapter?.hosts?.[0] ? `https://${adapter.hosts[0]}/` : null);
      if (!openUrl) { errors.push('adapter has no url or hosts to open'); return; }
      emit({ type: 'tab', opening: openUrl });
      try {
        const created = await openTab(port, openUrl);
        target = await waitForTargetId(port, created?.id);
        if (!target) { errors.push(`opened ${openUrl} but no page target appeared`); return; }
      } catch (e) { errors.push(`could not open ${openUrl}: ${String(e?.message ?? e)}`); return; }
      emit({ type: 'target', reused: false, id: target.id, url: target.url });
    }
    result.target = { id: target.id, url: target.url, title: target.title ?? null };

    // Login wall + composer first, on a short-lived connection, so a blocked or still-loading
    // site never creates an empty session.
    let probe = null;
    let composerFound = null;
    try {
      probe = await CdpConnection.connect(await browserWsUrl({ port }), { requestTimeoutMs: 15000 });
      const probePage = await probe.attach(target.id);
      const auth = await detectAuthWall(probePage, adapter);
      result.authWall = auth;
      emit({ type: 'auth', blocked: auth.blocked, reason: auth.reason });
      if (auth.blocked) { result.blocked = true; result.reason = auth.reason; return; }
      composerFound = await waitForComposer(probePage, adapter, { timeoutMs: 20000 });
      emit({ type: 'composer', ...composerFound });
      if (!composerFound.found) { errors.push(composerFound.reason ?? 'no composer found'); result.reason = 'no-composer'; return; }
    } catch (e) {
      errors.push(`auth probe failed: ${String(e?.message ?? e)}`);
    } finally {
      try { probe?.close(); } catch { /* detached */ }
    }

    page = await openSession(target);
    emit({ type: 'recording', sessionId: result.sessionId, profile: recorder?.profile?.name ?? null });

    // A background tab reports document.hasFocus() === false, which some sites read as
    // "not a real user". Focus emulation + bringToFront makes the page behave like a visible one.
    const env = await prepareHumanEnvironment(page, { focus: true });
    result.env = env;
    emit({ type: 'env', webdriver: env.webdriver, hasFocus: env.hasFocus, notes: env.notes });

    // Re-derive on the recording connection when the probe did not resolve one; the page-level
    // selection survives, so this is normally a single fast lookup.
    const found = composerFound ?? await findComposer(page, adapter);
    emit({ type: 'composer', ...found });
    if (!found.found) { errors.push(found.reason ?? 'no composer found'); result.reason = 'no-composer'; return; }

    const focus = await focusComposer(page, found);
    emit({ type: 'focus', ...focus });
    if (!focus.ok) errors.push(`could not focus the composer (${focus.reason ?? focus.method ?? 'unknown'})`);

    const cleared = await clearComposer(page);
    emit({ type: 'clear', ...cleared });
    if (!cleared.ok) errors.push('composer still holds a draft after select-all + Backspace');

    const typed = await typeText(page, result.prompt, { human: humanPace });
    emit({ type: 'typed', ok: typed.ok, method: typed.method, chars: String(typed.typed ?? '').length, grewBy: typed.grewBy });
    if (!typed.ok) { errors.push(`typing failed (${typed.method ?? 'unknown'}): ${typed.reason ?? ''}`.trim()); result.reason = 'type-failed'; return; }

    // A person looks at what they typed before pressing send.
    if (humanPace) await humanIdle(page, { pace: DEFAULT_PACE });
    else await sleep(150);

    const sent = await sendMessage(page, adapter);
    emit({ type: 'sent', ...sent });
    if (!sent.ok) { errors.push(`send did not take (${sent.method})`); result.reason = 'send-failed'; return; }

    const wait = await waitForCompletion(page, adapter, { timeoutMs });
    emit({ type: 'completion', done: wait.done, ms: wait.ms, reason: wait.reason });
    result.reply = wait.text ?? '';
    result.done = wait.done;
    if (!wait.done) { errors.push(wait.reason); result.reason = 'timeout'; return; }
    result.ok = true;
  };

  try { await run(); }
  catch (e) { errors.push(String(e?.message ?? e)); result.reason ??= 'drive-error'; }
  finally { await cleanup(); }

  return result;
}
