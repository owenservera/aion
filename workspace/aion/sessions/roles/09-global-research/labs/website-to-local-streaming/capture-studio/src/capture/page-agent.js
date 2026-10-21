// Runs inside an ISOLATED world of the observed page (separate JS globals, shared DOM).
// Strictly observational: MutationObserver + passive capture-phase listeners. It never writes to
// the DOM, never patches page globals, and never reads input values (only their length).
// Results leave through a CDP binding that exists only in this isolated world.
(function aionCaptureAgent(BINDING, CONFIG) {
  if (globalThis.__aionCapture && globalThis.__aionCapture.version) return 'already';
  const cfg = Object.assign({ flushMs: 100, maxBlockTextBytes: 262144, ignoreTags: ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'] }, CONFIG || {});
  const ignore = new Set(cfg.ignoreTags);
  const ids = new WeakMap();
  const nodes = new Map();
  let nextId = 1;
  const idOf = (el) => { let i = ids.get(el); if (!i) { i = nextId++; ids.set(el, i); nodes.set(i, new WeakRef(el)); } return i; };
  const send = (msg) => { try { globalThis[BINDING](JSON.stringify(msg)); } catch (e) { /* binding gone: detached */ } };

  const BLOCK = new Set(['P', 'LI', 'PRE', 'TD', 'TH', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'ARTICLE', 'SECTION', 'TR', 'TABLE', 'UL', 'OL', 'FIGURE', 'DD', 'DT', 'BUTTON', 'A', 'CODE', 'DIV', 'SPAN', 'IMG', 'FORM', 'MAIN']);
  const sigOf = (el) => {
    if (!el || el.nodeType !== 1) return '';
    const cls = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/).filter((c) => c && !/\d{3,}/.test(c)).slice(0, 2).join('.');
    const role = el.getAttribute('role');
    const attrs = [...el.attributes].filter((a) => a.name.startsWith('data-') && a.value.length < 40 && !/\d{4,}|[0-9a-f]{8}-/.test(a.value)).slice(0, 2).map((a) => `${a.name}=${a.value}`);
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (role ? `[role=${role}]` : '') + attrs.map((a) => `[${a}]`).join('');
  };
  const pathOf = (el, depth = 6) => { const out = []; for (let n = el; n && n.nodeType === 1 && out.length < depth; n = n.parentElement) out.unshift(sigOf(n)); return out.join(' > '); };
  const blockOf = (node) => {
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    while (el && !BLOCK.has(el.tagName)) el = el.parentElement;
    return el;
  };
  const textOf = (el) => {
    const t = el.textContent || '';
    if (t.length > cfg.maxBlockTextBytes) return { text: t.slice(0, cfg.maxBlockTextBytes), truncated: t.length };
    return { text: t };
  };

  // ---- mutations -------------------------------------------------------------------------
  let dirty = new Map();
  let removed = [];
  const mark = (node) => {
    const b = blockOf(node);
    if (!b || ignore.has(b.tagName)) return;
    dirty.set(b, true);
  };
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') mark(r.target);
      else if (r.type === 'childList') {
        if (r.target.nodeType === 1 && ignore.has(r.target.tagName)) continue;
        mark(r.target);
        for (const n of r.removedNodes) if (n.nodeType === 1 && ids.has(n)) removed.push(ids.get(n));
      } else if (r.type === 'attributes') mark(r.target);
    }
  });
  const flush = () => {
    if (!dirty.size && !removed.length) return;
    const items = [];
    // Report the outermost dirty blocks only, to avoid nested duplicates.
    const els = [...dirty.keys()].filter((el) => el.isConnected);
    const set = new Set(els);
    for (const el of els) {
      let p = el.parentElement, nested = false;
      while (p) { if (set.has(p)) { nested = true; break; } p = p.parentElement; }
      if (nested) continue;
      const t = textOf(el);
      items.push({ op: 'changed', id: idOf(el), tag: el.tagName, sig: sigOf(el), path: pathOf(el), text: t.text, truncated: t.truncated, children: el.childElementCount, busy: el.closest('[aria-busy="true"]') ? true : undefined });
    }
    for (const id of removed) items.push({ op: 'removed', id });
    dirty = new Map(); removed = [];
    if (items.length) send({ type: 'dom.batch', url: location.href, items });
  };
  setInterval(flush, cfg.flushMs);

  // ---- user actions (learn by watching) -------------------------------------------------
  const describe = (el) => {
    if (!el || el.nodeType !== 1) return {};
    const label = (el.getAttribute('aria-label') || el.getAttribute('title') || (el.innerText || '').trim()).slice(0, 80);
    return { id: idOf(el), tag: el.tagName, sig: sigOf(el), path: pathOf(el, 4), label, role: el.getAttribute('role') || undefined };
  };
  const act = (kind, el, extra) => send(Object.assign({ type: 'action', kind, url: location.href, target: describe(el) }, extra || {}));
  const opts = { capture: true, passive: true };
  addEventListener('click', (e) => act('click', e.target.closest('a,button,[role=button],[role=tab],[role=menuitem],summary,label,input') || e.target), opts);
  addEventListener('submit', (e) => act('submit', e.target), opts);
  addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) act('enter', e.target, { shift: e.shiftKey || undefined }); }, opts);
  let inputTimer = null;
  addEventListener('input', (e) => { clearTimeout(inputTimer); const el = e.target; inputTimer = setTimeout(() => act('input', el, { length: (el.value ?? el.textContent ?? '').length }), 400); }, opts);
  let scrollTimer = null;
  addEventListener('scroll', (e) => {
    clearTimeout(scrollTimer);
    const el = e.target === document ? document.scrollingElement : e.target;
    scrollTimer = setTimeout(() => act('scroll', el, { top: Math.round(el.scrollTop || 0), height: Math.round(el.scrollHeight || 0) }), 250);
  }, opts);
  addEventListener('toggle', (e) => act('toggle', e.target, { open: !!e.target.open }), opts);
  document.addEventListener('visibilitychange', () => act('visibility', document.documentElement, { state: document.visibilityState }), opts);

  // ---- shape inspection (on demand) -------------------------------------------------------
  const visibleText = (el) => (el.innerText || el.textContent || '').trim();
  function inspect() {
    const proposals = [];
    const root = document.querySelector('main') || document.body;
    // Repeated sibling structures -> collections of records.
    const all = root.querySelectorAll('*');
    const seen = new Set();
    for (const parent of [root, ...all]) {
      if (parent.childElementCount < 3 || ignore.has(parent.tagName)) continue;
      const groups = new Map();
      for (const c of parent.children) { const s = sigOf(c); if (!groups.has(s)) groups.set(s, []); groups.get(s).push(c); }
      for (const [s, items] of groups) {
        if (items.length < 3 || items.length < parent.childElementCount * 0.5) continue;
        const key = idOf(parent) + '|' + s;
        if (seen.has(key)) continue; seen.add(key);
        const sample = items.slice(0, 5);
        const fieldCounts = new Map();
        for (const it of sample) {
          const leafs = it.querySelectorAll('*');
          const local = new Set();
          for (const l of [it, ...leafs]) {
            if (l.childElementCount === 0 && visibleText(l)) local.add('text:' + sigOf(l));
            if (l.tagName === 'A' && l.href) local.add('link:' + sigOf(l));
            if (l.tagName === 'IMG') local.add('image:' + sigOf(l));
            if (l.tagName === 'TIME' || l.hasAttribute('datetime')) local.add('time:' + sigOf(l));
          }
          for (const f of local) fieldCounts.set(f, (fieldCounts.get(f) || 0) + 1);
        }
        const fields = [...fieldCounts].filter(([, n]) => n >= Math.ceil(sample.length * 0.6)).map(([f, n]) => ({ kind: f.split(':')[0], sig: f.slice(f.indexOf(':') + 1), presence: n / sample.length }));
        if (!fields.length) continue;
        proposals.push({ kind: 'collection', parentId: idOf(parent), itemSig: s, count: items.length, path: pathOf(parent), fields: fields.slice(0, 12), sampleIds: sample.map(idOf), sampleText: visibleText(items[0]).slice(0, 160) });
      }
    }
    for (const t of root.querySelectorAll('table')) {
      const headers = [...t.querySelectorAll('thead th, tr:first-child th')].map((h) => visibleText(h).slice(0, 60));
      proposals.push({ kind: 'table', id: idOf(t), rows: t.querySelectorAll('tbody tr, tr').length - (headers.length ? 1 : 0), columns: headers.length || (t.querySelector('tr')?.children.length ?? 0), headers, path: pathOf(t) });
    }
    const pres = root.querySelectorAll('pre');
    if (pres.length) proposals.push({ kind: 'code_blocks', count: pres.length, ids: [...pres].slice(0, 20).map(idOf), languages: [...new Set([...pres].map((p) => (p.querySelector('code')?.className.match(/language-([\w-]+)/) || [])[1]).filter(Boolean))] });
    const heads = root.querySelectorAll('h1,h2,h3,h4,h5,h6');
    if (heads.length) proposals.push({ kind: 'headings', count: heads.length, outline: [...heads].slice(0, 40).map((h) => ({ id: idOf(h), level: Number(h.tagName[1]), text: visibleText(h).slice(0, 100) })) });
    const links = [...root.querySelectorAll('a[href]')].filter((a) => /^https?:/.test(a.href));
    if (links.length) proposals.push({ kind: 'links', count: links.length, external: links.filter((a) => a.host !== location.host).length, sample: links.slice(0, 15).map((a) => ({ id: idOf(a), text: visibleText(a).slice(0, 80), href: a.href })) });
    const forms = root.querySelectorAll('form, textarea, [contenteditable="true"]');
    if (forms.length) proposals.push({ kind: 'inputs', count: forms.length, items: [...forms].slice(0, 10).map(describe) });
    const busy = document.querySelectorAll('[aria-busy="true"], [aria-live]');
    if (busy.length) proposals.push({ kind: 'live_regions', count: busy.length, items: [...busy].slice(0, 10).map(describe) });
    return { url: location.href, title: document.title, at: Date.now(), proposals };
  }

  function snapshot() {
    return { url: location.href, title: document.title, html: document.documentElement.outerHTML, textLength: (document.body?.innerText || '').length };
  }

  globalThis.__aionCapture = { version: 1, inspect, snapshot, node: (id) => nodes.get(id)?.deref() || null, stop: () => mo.disconnect() };
  mo.observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-busy', 'aria-expanded', 'data-state', 'hidden', 'open'] });
  send({ type: 'agent.ready', url: location.href, title: document.title });
  return 'started';
});
