import { SchemaNode, schemaDiff } from '../intel/schema.mjs';

// Cumulative sufficient statistics plus independent fixed-size windows for drift detection.
// Missing fields in a window mean observed schema drift, never deletion of entity state.
export class OnlineSchemaProfiler {
  constructor({ windowSize = 100, minWindow = 10, maxGroups = 256 } = {}) {
    if (!Number.isInteger(windowSize) || windowSize < 2 || !Number.isInteger(maxGroups) || maxGroups < 1) throw new RangeError('Invalid profiler bounds');
    this.windowSize = windowSize; this.minWindow = Math.max(2, Math.min(windowSize, minWindow));
    this.maxGroups = maxGroups; this.groups = new Map(); this.evictedGroups = 0;
  }
  observe(group, value, source = {}) {
    group = String(group);
    let entry = this.groups.get(group);
    if (!entry) {
      if (this.groups.size >= this.maxGroups) { this.groups.delete(this.groups.keys().next().value); this.evictedGroups++; }
      entry = { group, total: new SchemaNode(), current: new SchemaNode(), previous: null, windows: 0, lastSource: null };
    } else this.groups.delete(group);
    this.groups.set(group, entry);
    if (entry.current.count >= this.windowSize) {
      entry.previous = entry.current.describe(); entry.current = new SchemaNode(); entry.windows++;
    }
    entry.total.observe(value); entry.current.observe(value);
    entry.lastSource = { session: source.session, sid: source.sid, seq: source.seq, t: source.t };
    return this;
  }
  describe(group) {
    const e = this.groups.get(String(group)); if (!e) return null;
    const current = e.current.describe();
    return { group: e.group, observations: e.total.count, completedWindows: e.windows, windowObservations: e.current.count,
      schema: e.total.describe(), currentSchema: current, source: e.lastSource,
      drift: e.previous && e.current.count >= this.minWindow ? schemaDiff(e.previous, current) : null,
      driftBasis: e.previous ? 'adjacent independent observation windows' : 'insufficient windows' };
  }
  report() { return { groups: [...this.groups.keys()].map((key) => this.describe(key)), evictedGroups: this.evictedGroups,
    maxGroups: this.maxGroups, windowSize: this.windowSize, minWindow: this.minWindow }; }
  groupKeys() { return [...this.groups.keys()]; }
  // Resumable state (plain JSON). Group order is LRU order and is preserved.
  toState() {
    return { format: 'capture-studio.schema-profiler/1', windowSize: this.windowSize, minWindow: this.minWindow,
      maxGroups: this.maxGroups, evictedGroups: this.evictedGroups,
      groups: [...this.groups.values()].map((e) => ({ group: e.group, total: e.total.toState(), current: e.current.toState(),
        previous: e.previous ?? null, windows: e.windows, lastSource: e.lastSource ?? null })) };
  }
  static fromState(state, overrides = {}) {
    if (!state || !Array.isArray(state.groups)) throw new TypeError('Invalid schema profiler state');
    const p = new OnlineSchemaProfiler({ windowSize: state.windowSize ?? 100, minWindow: state.minWindow ?? 10,
      maxGroups: Math.max(state.maxGroups ?? 256, overrides.maxGroups ?? 0) });
    p.evictedGroups = state.evictedGroups ?? 0;
    for (const g of state.groups) {
      const group = String(g.group);
      p.groups.set(group, { group, total: SchemaNode.fromState(g.total), current: SchemaNode.fromState(g.current),
        previous: g.previous ?? null, windows: g.windows ?? 0, lastSource: g.lastSource ?? null });
    }
    return p;
  }
}

// Export a portable draft-2020-12 schema from observed descriptions. Required means observed
// in every sampled object, not a guarantee about future server payloads.
export function toJsonSchema(description, { includeExamples = false } = {}) {
  const convert = (d) => {
    if (!d) return {};
    const out = {}, type = d.type;
    if (type === 'union') {
      const kinds = d.union?.map((v) => v.kind).filter((k) => ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'].includes(k)) ?? [];
      if (d.nullable && !kinds.includes('null')) kinds.push('null');
      if (kinds.length) out.type = kinds;
    } else if (['string', 'number', 'integer', 'boolean', 'object', 'array', 'null', 'map'].includes(type)) {
      const actual = type === 'map' ? 'object' : type;
      out.type = d.nullable && actual !== 'null' ? [actual, 'null'] : actual;
    }
    const fields = d.fields ?? d.object?.fields;
    if (fields) {
      out.properties = Object.fromEntries(Object.entries(fields).map(([key, child]) => [key, convert(child)]));
      const required = Object.entries(fields).filter(([, child]) => child.required).map(([key]) => key);
      if (required.length) out.required = required;
      out.additionalProperties = true;
    }
    if (d.array) out.items = convert(d.array.items);
    if (d.map) out.additionalProperties = convert(d.map.values);
    if (d.string) {
      // Enum is descriptive, not a closed server contract; keep it as an annotation.
      if (d.string.enum) out['x-observed-enum'] = d.string.enum.map((item) => item.value);
      const formats = d.string.formats ?? {};
      if (formats.uuid) out.format = 'uuid'; else if (formats.email) out.format = 'email';
      else if (formats.iso_time) out['x-observed-format'] = 'iso_time';
      if (includeExamples) out.examples = d.string.examples;
    }
    if (d.presence !== undefined) out['x-observed-presence'] = d.presence;
    out['x-observations'] = d.count ?? 0;
    return out;
  };
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', ...convert(description) };
}
