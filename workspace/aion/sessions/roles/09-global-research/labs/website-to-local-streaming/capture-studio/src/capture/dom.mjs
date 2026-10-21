// L3 rendered-DOM observation + user-action timeline, via an isolated-world page agent.
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { scrubText, redactUrl } from './redact.mjs';

const AGENT_SRC = readFileSync(new URL('./page-agent.js', import.meta.url), 'utf8').trim().replace(/;\s*$/, '');

export class DomObserver {
  constructor({ append, profile }) {
    this.append = append;
    this.profile = profile;
    this.worldName = `aion_capture_${randomBytes(4).toString('hex')}`;
    this.binding = `__aionBind_${randomBytes(4).toString('hex')}`;
    this.contexts = new Map(); // frameId -> contextId (our isolated world)
    this.mainFrameId = null;
    this.stats = { batches: 0, mutations: 0, actions: 0, agentStarts: 0 };
  }

  _script() {
    const cfg = { flushMs: this.profile.dom?.flushMs, maxBlockTextBytes: this.profile.dom?.maxBlockTextBytes, ignoreTags: this.profile.dom?.ignoreTags };
    return `${AGENT_SRC}(${JSON.stringify(this.binding)}, ${JSON.stringify(cfg)})`;
  }

  async attach(session) {
    this.session = session;
    session.on('Runtime.executionContextCreated', ({ context }) => {
      if (context.name === this.worldName && context.auxData?.frameId) this.contexts.set(context.auxData.frameId, context.id);
    });
    session.on('Runtime.executionContextsCleared', () => this.contexts.clear());
    session.on('Runtime.bindingCalled', (p) => { if (p.name === this.binding) this._onMessage(p.payload); });
    await session.send('Runtime.enable');
    await session.send('Runtime.addBinding', { name: this.binding, executionContextName: this.worldName });
    // Future documents: the agent starts in our isolated world on every navigation.
    await session.send('Page.addScriptToEvaluateOnNewDocument', { source: this._script(), worldName: this.worldName, runImmediately: false });
    const { frameTree } = await session.send('Page.getFrameTree');
    this.mainFrameId = frameTree.frame.id;
    await this.startInFrame(this.mainFrameId);
  }

  async startInFrame(frameId) {
    const { executionContextId } = await this.session.send('Page.createIsolatedWorld', { frameId, worldName: this.worldName, grantUniveralAccess: false });
    this.contexts.set(frameId, executionContextId);
    const r = await this.session.send('Runtime.evaluate', { expression: this._script(), contextId: executionContextId, returnByValue: true });
    return r.result?.value;
  }

  _onMessage(payload) {
    let msg;
    try { msg = JSON.parse(payload); } catch { return; }
    if (msg.type === 'dom.batch') {
      this.stats.batches++; this.stats.mutations += msg.items.length;
      for (const it of msg.items) if (it.text) { const s = scrubText(it.text); it.text = s.text; if (s.redactions.length) it.redactions = s.redactions.length; }
      this.append({ k: 'dom.batch', url: scrubUrl(msg.url), items: msg.items });
    } else if (msg.type === 'action') {
      this.stats.actions++;
      this.append({ k: 'action', kind: msg.kind, url: scrubUrl(msg.url), target: msg.target, length: msg.length, top: msg.top, height: msg.height, open: msg.open, state: msg.state, shift: msg.shift });
    } else if (msg.type === 'agent.ready') {
      this.stats.agentStarts++;
      this.append({ k: 'lifecycle', event: 'dom_agent_ready', url: scrubUrl(msg.url) });
    }
  }

  async _evalInMain(expression, returnByValue = true) {
    let ctx = this.contexts.get(this.mainFrameId);
    if (!ctx) { await this.startInFrame(this.mainFrameId); ctx = this.contexts.get(this.mainFrameId); }
    const r = await this.session.send('Runtime.evaluate', { expression, contextId: ctx, returnByValue, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result;
  }

  async inspect() { return (await this._evalInMain('globalThis.__aionCapture && globalThis.__aionCapture.inspect()')).value; }

  async snapshot() {
    const v = (await this._evalInMain('globalThis.__aionCapture && globalThis.__aionCapture.snapshot()')).value;
    if (v?.html) { const s = scrubText(v.html); v.html = s.text; v.redactions = s.redactions.length; }
    return v;
  }

  // Visual highlight via the DevTools overlay (draws above the page; does not modify its DOM).
  async highlight(nodeId) {
    const r = await this._evalInMain(`globalThis.__aionCapture && globalThis.__aionCapture.node(${Number(nodeId)})`, false);
    if (!r.objectId) return false;
    try { await this.session.send('DOM.enable'); await this.session.send('Overlay.enable'); } catch { /* already */ }
    await this.session.send('Overlay.highlightNode', { objectId: r.objectId, highlightConfig: { showInfo: true, contentColor: { r: 64, g: 140, b: 255, a: 0.25 }, borderColor: { r: 64, g: 140, b: 255, a: 0.9 } } });
    await this.session.send('Runtime.releaseObject', { objectId: r.objectId }).catch(() => {});
    return true;
  }

  async clearHighlight() { try { await this.session.send('Overlay.hideHighlight'); } catch { /* ignore */ } }
}

function scrubUrl(u) { return u ? redactUrl(u) : u; }
