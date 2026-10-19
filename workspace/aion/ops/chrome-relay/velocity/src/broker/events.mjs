// Volatile sanitized event projection for live clients. Durable state lives in AION Bus.
// Never accept payload text, transcripts, auth tokens, paths, or arbitrary event objects.
const EVENT_TYPES = new Set(['operation.admitted','operation.dispatched','operation.settled',
  'operation.refused','capability.changed','runtime.started','runtime.stopped']);
const EVENT_FIELDS = ['operation_id','target','state','reason'];
export function createEventStream({now = () => new Date().toISOString(), capacity = 256} = {}) {
  if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 4096) throw new RangeError('capacity');
  let sequence = 0;
  let log = [];
  const listeners = new Set();
  function publish(type, input = {}) {
    if (!EVENT_TYPES.has(type)) throw new TypeError('event type');
    const safe = Object.fromEntries(EVENT_FIELDS.flatMap(k => {
      const v = input[k];
      return typeof v === 'string' && v.length && v.length <= 128 ? [[k,v]] : [];
    }));
    const item = Object.freeze({schema:'aion.event/1',seq:++sequence,type,observed_utc:now(),...safe});
    log.push(item);
    if (log.length > capacity) log.shift();
    for (const f of listeners) {try {f(item);} catch { /* listener errors cannot affect dispatch */ }}
    return item;
  }
  return Object.freeze({
    publish,
    after(cursor = 0) {
      if (!Number.isSafeInteger(cursor) || cursor < 0) throw new TypeError('cursor');
      return {head:sequence, gap:log.length > 0 && cursor < log[0].seq-1,
        events:log.filter(e => e.seq > cursor)};
    },
    subscribe(fn) {
      if (typeof fn !== 'function') throw new TypeError('listener');
      listeners.add(fn); return () => listeners.delete(fn);
    },
    get head() {return sequence;}
  });
}
