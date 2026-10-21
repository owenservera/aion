// Cache verified *observations* only. Presence != authenticated action readiness.
import {projectReadiness} from '../readiness.mjs';
export function createCapabilityIndex({now = () => Date.now(), ttlMs = 2000, publish = () => {}} = {}) {
  const cache = new Map();
  const permitted = ['target','endpoint','observed_utc','health','identity_verified',
    'authority','submit_actuation_verified','actions'];
  function record(probe) {
    if (!probe || typeof probe !== 'object' || Array.isArray(probe)
      || typeof probe.target !== 'string' || !/^[a-z0-9][a-z0-9:_-]{1,127}$/.test(probe.target))
      throw new TypeError('invalid target observation');
    const safe = Object.fromEntries(permitted.filter(k => Object.hasOwn(probe,k)).map(k => [k,probe[k]]));
    if (safe.actions && (typeof safe.actions !== 'object' || Array.isArray(safe.actions))) safe.actions = {};
    if (safe.actions) safe.actions = Object.fromEntries(Object.entries(safe.actions)
      .filter(([k,v]) => ['inspect','compose','submit','observe_reply','cancel'].includes(k)
        && typeof v === 'string'));
    const projected = projectReadiness(safe,{now:now(),ttlMs});
    if (projected.state === 'UNKNOWN' && projected.blockers.includes('invalid_observation_time'))
      throw new TypeError('invalid observation time');
    cache.set(probe.target,safe);
    publish('capability.changed',{target:probe.target,state:projected.state});
    return projected;
  }
  return Object.freeze({
    record,
    get(target) {
      return projectReadiness(cache.get(target) ?? null,{now:now(),ttlMs});
    },
    list() {return [...cache.keys()].sort().map(target => this.get(target));},
    invalidate(target) {
      if (!cache.has(target)) return false;
      cache.delete(target);
      publish('capability.changed',{target,state:'UNKNOWN'});
      return true;
    }
  });
}
