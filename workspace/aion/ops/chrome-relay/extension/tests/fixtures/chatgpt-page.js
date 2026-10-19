// Deterministic single-document DOM/mutation/timer fixture. No browser/runtime.
export function pageFixture() {
  let time = 0, seq = 0, opaque = 0;
  const timers = new Map(), observers = new Set(), turns = [], log = [];
  const names = ['document', 'location', 'InputEvent', 'MouseEvent', 'MutationObserver', 'chrome', 'performance', 'setTimeout', 'clearTimeout'];
  const previous = new Map(names.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const clock = {
    now: () => time,
    setTimeout(fn, delay) { const id = ++seq; timers.set(id, { fn, at: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    get pending() { return timers.size; },
    async drain() { for (let i = 0; i < 120; i++) await Promise.resolve(); },
    elapse(ms) { time += ms; },
    async advance(ms) {
      const end = time + ms;
      await clock.drain();
      let count = 0;
      for (;;) {
        const next = [...timers].filter(([, item]) => item.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        if (++count > 10000) throw new Error('runaway timer');
        timers.delete(next[0]); time = next[1].at; next[1].fn(); await clock.drain();
      }
      time = end; await clock.drain();
    },
  };
  function emit(record) {
    for (const observer of [...observers]) {
      observer.records.push(record);
      if (!observer.queued) {
        observer.queued = true;
        queueMicrotask(() => {
          observer.queued = false;
          if (!observer.active) return;
          const records = observer.takeRecords();
          if (records.length) observer.callback(records);
        });
      }
    }
  }
  class FakeObserver {
    constructor(callback) { this.callback = callback; this.records = []; this.active = false; }
    observe() { this.active = true; observers.add(this); log.push('armed'); }
    takeRecords() { const result = this.records; this.records = []; return result; }
    disconnect() { this.active = false; this.records = []; observers.delete(this); log.push('disconnected'); }
  }
  function node(role, text = '') {
    return { role, textContent: text, get innerText() { return this.textContent; }, hidden: false, style: {},
      querySelector() { return null; }, contains(other) { return this === other; },
      matches(selector) {
        if (selector === '[data-message-author-role="user"]') return role === 'user';
        if (selector === '[data-message-author-role="assistant"]') return role === 'assistant';
        if (selector === '[data-testid="stop-button"]') return role === 'stop';
        return false;
      },
      closest() { return null; },
    };
  }
  const editor = { ...node('editor'), getAttribute(key) { return key === 'id' ? 'prompt-textarea' : null; },
    getClientRects() { return [{ width: 500, height: 40 }]; }, getBoundingClientRect() { return { width: 500, height: 40 }; },
    focus() {}, dispatchEvent() { return true; } };
  // Object spread materializes getters; retain a genuine live rendered-text view.
  Object.defineProperty(editor, 'innerText', { get() { return editor.textContent; } });
  const button = { ...node('button', 'Send'), disabled: false, dataTestId: 'send-button',
    getAttribute(key) { return key === 'data-testid' ? this.dataTestId : key === 'aria-label' ? 'Send' : null; },
    getClientRects() { return [{ width: 40, height: 40 }]; }, getBoundingClientRect() { return { x: 0, y: 0, width: 40, height: 40 }; },
    matches(selector) { return selector === '[data-testid="stop-button"]' && this.dataTestId === 'stop-button'; },
    focus() {}, dispatchEvent(event) {
      if (event.type === 'click') { fixture.clicks++; log.push('click'); fixture.onClick?.(); }
      return true;
    } };
  const connectListeners = [];
  const fixture = {
    clock, editor, button, turns, log, observers, clicks: 0, fills: 0, stop: null, onClick: null,
    request(extra = {}) {
      const command = { user_gesture: true, correlation_id: 'task-one', task_id: 'stable-task', operation_key: 'stable-op',
        expected_reply_token: 'ACK-one', timeout_ms: 5000, ...extra };
      return { text: `${command.correlation_id}\nCompute 53 + 29 and return ${command.expected_reply_token}`, ...command };
    },
    add(role, text) {
      const item = node(role, text); turns.push(item);
      emit({ type: 'childList', addedNodes: [item], removedNodes: [] });
      return item;
    },
    user(text) { return fixture.add('user', text); },
    assistant(text) { return fixture.add('assistant', text); },
    change(item, text) { item.textContent = text; emit({ type: 'characterData', target: item }); },
    start() { fixture.stop = node('stop'); emit({ type: 'childList', addedNodes: [fixture.stop], removedNodes: [] }); },
    end() { const stop = fixture.stop; fixture.stop = null; if (stop) emit({ type: 'childList', addedNodes: [], removedNodes: [stop] }); },
    attribute(value) {
      const oldValue = button.dataTestId; button.dataTestId = value;
      emit({ type: 'attributes', attributeName: 'data-testid', oldValue, target: button });
    },
    fast(command) {
      fixture.onClick = () => {
        fixture.user(command.text); editor.textContent = '';
        fixture.start(); fixture.assistant(`${command.correlation_id}\n82\n${command.expected_reply_token}`); fixture.end();
      };
    },
    makeEngine(content, overrides = {}) {
      return content.__testing.createTurnEngine({ ...clock, MutationObserver: FakeObserver,
        randomId: () => `opaque-${++opaque}`, ...overrides });
    },
    port() {
      const handlers = [], replies = [];
      const port = { name: 'aion-chatgpt', closed: false, replies,
        onMessage: { addListener(fn) { handlers.push(fn); } },
        postMessage(value) { if (port.closed) throw new Error('port closed'); replies.push(value); port.onReply?.(value); },
        ask(message) { for (const fn of handlers) fn(message); }, close() { port.closed = true; } };
      for (const fn of connectListeners) fn(port);
      return port;
    },
    installTimers() {
      globalThis.performance = { now: clock.now };
      globalThis.setTimeout = clock.setTimeout; globalThis.clearTimeout = clock.clearTimeout;
    },
    restore() {
      for (const observer of [...observers]) observer.disconnect();
      timers.clear();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
      }
    },
  };
  globalThis.document = {
    documentElement: {}, title: 'fixture',
    querySelector(selector) { return selector === '[data-testid="stop-button"]' ? fixture.stop ?? (button.dataTestId === 'stop-button' ? button : null) : null; },
    querySelectorAll(selector) {
      if (selector === '#prompt-textarea') return [editor];
      if (selector === '.ProseMirror[contenteditable="true"]') return [];
      if (selector === 'button' || selector === 'button[aria-label="Send"]') return [button];
      if (selector === '[data-testid="send-button"]') return button.dataTestId === 'send-button' ? [button] : [];
      if (selector.includes('[data-message-author-role="user"]')) return turns;
      return [];
    },
    execCommand(_name, _ui, text) { fixture.fills++; editor.textContent = text; return true; },
  };
  globalThis.location = { origin: 'https://chatgpt.com', pathname: '/c/fixture' };
  globalThis.InputEvent = class { constructor(type) { this.type = type; } };
  globalThis.MouseEvent = class { constructor(type, values) { this.type = type; Object.assign(this, values); } };
  globalThis.MutationObserver = FakeObserver;
  globalThis.chrome = { runtime: { onConnect: { addListener(fn) { connectListeners.push(fn); } } } };
  return fixture;
}
