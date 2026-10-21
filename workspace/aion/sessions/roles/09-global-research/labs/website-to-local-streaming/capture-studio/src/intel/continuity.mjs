// Cross-session continuity: a derived, read-through knowledge view over saved session entities.
// No second mutable truth store: deleting/rederiving a session changes this view automatically.
// Only explicitly keyed identities within the same proven site/type scope are joined.
// Keyless and scope-unknown entities remain session-local to avoid false merges.
import { Session, listSessions } from '../store/session.mjs';
import { siteOf } from '../profiles/profiles.mjs';

export function siteFromSession(meta = {}) {
  try {
    const host = new URL(meta.target?.url).hostname.toLowerCase();
    return host ? siteOf(host) : '';
  } catch { return ''; } // A free-form session label is not a trustworthy site identity.
}

export function continuityTime(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^\d{10,13}$/.test(value)) {
    const n = Number(value);
    return value.length === 10 ? n * 1000 : n;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const byTime = (a, b) => (a.t ?? Infinity) - (b.t ?? Infinity)
  || (a.sessionCreatedAt ?? 0) - (b.sessionCreatedAt ?? 0)
  || a.session.localeCompare(b.session)
  || (a.seq ?? 0) - (b.seq ?? 0)
  || String(a.sid ?? '').localeCompare(String(b.sid ?? ''));

function recordRevisions(entity, sessionId, sessionCreatedAt) {
  const source = Array.isArray(entity.revisions) && entity.revisions.length
    ? entity.revisions
    : [{ t: entity.last ?? entity.first ?? null, seq: null, sid: null,
        changed: Object.keys(entity.attrs ?? {}), values: entity.attrs ?? {},
        provenanceBasis: 'session-final-state-only' }];
  return source.map((r) => ({
    session: sessionId,
    sessionCreatedAt,
    sid: r.sid ?? null,
    seq: r.seq ?? null,
    domId: r.domId ?? null,
    t: continuityTime(r.t),
    changed: r.changed ?? Object.keys(r.values ?? {}),
    values: r.values ?? {},
    provenanceBasis: r.provenanceBasis ?? (r.values === undefined ? 'revision-values-unavailable' : 'recorded-revision'),
  }));
}

function safeJoin(entity, site) {
  return entity.method === 'key' && entity.key !== null && entity.key !== undefined
    && entity.scope === site && !!entity.type && !!entity.eid;
}

// The default is intentionally complete for the selected site: any optional limit applies to
// displayed entities only, not the scan. scan/report sizes are disclosed in stats.
export async function buildSiteContinuity(sessionsDir, {
  site, eid = null, asOf = null, limit = 50, includeHistory = false,
} = {}) {
  if (typeof site !== 'string' || !site.trim()) throw new Error('A verified site scope is required.');
  const requestedAt = asOf === null || asOf === undefined ? null : continuityTime(asOf);
  if (asOf !== null && asOf !== undefined && requestedAt === null) throw new Error('Invalid as-of timestamp.');
  const maxReturn = Number.isInteger(Number(limit)) && Number(limit) >= 1
    ? Math.min(Number(limit), 1000) : 50;
  const sessions = listSessions(sessionsDir).filter((m) => siteFromSession(m) === site);
  const stats = {
    site, sessionsDiscovered: sessions.length, sessionsWithDerivedKnowledge: 0,
    sessionsWithoutKnowledge: [], sessionsWithDerivationError: [],
    sourceEntities: 0, keylessOrUnsafeIsolated: 0, untimedRevisions: 0,
    missingRevisionValues: 0, joinedEntities: 0, entitiesTotal: 0, returned: 0, truncated: 0,
  };
  const groups = new Map();
  for (const meta of sessions) {
    const session = Session.open(sessionsDir, meta.id);
    const model = session.kv.get('MODEL', null);
    if (!model) { stats.sessionsWithoutKnowledge.push(meta.id); continue; }
    if (model.error) { stats.sessionsWithDerivationError.push({ session: meta.id, stage: model.stage ?? null }); continue; }
    stats.sessionsWithDerivedKnowledge++;
    const createdAt = continuityTime(meta.createdAt);
    for await (const e of session.dataset('entities').iterate()) {
      if (!e || typeof e.eid !== 'string') continue;
      stats.sourceEntities++;
      const joinable = safeJoin(e, site);
      if (!joinable) stats.keylessOrUnsafeIsolated++;
      // Verify identity components in addition to eid; a matching hash alone is not proof.
      const groupKey = joinable
        ? JSON.stringify(['key', site, e.type, String(e.key), e.eid])
        : JSON.stringify(['session', meta.id, e.eid]);
      let item = groups.get(groupKey);
      if (!item) {
        item = {
          id: joinable ? e.eid : meta.id + '::' + e.eid,
          eid: e.eid, type: e.type ?? null, typeName: e.typeName ?? null,
          scope: e.scope ?? null, key: e.key ?? null, identityBasis: joinable ? 'exact-site-type-key' : 'session-local',
          confidence: e.confidence ?? null, sessionIds: [], observationCount: 0, history: [],
        };
        groups.set(groupKey, item);
      }
      item.sessionIds.push(meta.id);
      item.observationCount += e.observations ?? 0;
      item.history.push(...recordRevisions(e, meta.id, createdAt));
    }
  }
  const entries = [];
  for (const item of groups.values()) {
    item.history.sort(byTime);
    const revisions = requestedAt === null ? item.history
      : item.history.filter((r) => r.t !== null && r.t <= requestedAt);
    if (!revisions.length) continue;
    const attrs = {};
    for (const rv of revisions) {
      if (rv.t === null) stats.untimedRevisions++;
      if (rv.provenanceBasis === 'revision-values-unavailable') stats.missingRevisionValues++;
      Object.assign(attrs, rv.values);
    }
    item.sessionIds = [...new Set(item.sessionIds)].sort();
    const times = revisions.map((rv) => rv.t).filter((t) => t !== null);
    const result = {
      id: item.id, eid: item.eid, type: item.type, typeName: item.typeName,
      scope: item.scope, key: item.key, identityBasis: item.identityBasis,
      confidence: item.confidence, sessions: item.sessionIds, sessionCount: item.sessionIds.length,
      observations: item.observationCount, revisions: revisions.length,
      firstT: times.length ? times[0] : null, lastT: times.length ? times[times.length - 1] : null,
      attrs,
      ...(includeHistory ? { history: revisions.map(({ sessionCreatedAt, ...r }) => r) } : {}),
    };
    entries.push(result);
    if (item.identityBasis === 'exact-site-type-key' && item.sessionIds.length > 1) stats.joinedEntities++;
  }
  entries.sort((a, b) => b.sessionCount - a.sessionCount || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  stats.entitiesTotal = entries.length;
  const matched = eid ? entries.filter((e) => e.id === eid || e.eid === eid) : entries;
  const returned = matched.slice(0, maxReturn);
  stats.returned = returned.length;
  stats.truncated = matched.length - returned.length;
  return {
    site, asOf: requestedAt, entities: returned, stats,
    limitations: [
      'Joins require exactly matching site, type, keyed value and eid; schema drift is not silently reconciled.',
      'Keyless observations remain separate across sessions; missing observations are not deletions.',
      'Historical state uses saved revision values; missing or untimed evidence cannot establish an as-of state.',
      'No copied knowledge index is stored; results recompute from extant derived session data.',
    ],
  };
}
