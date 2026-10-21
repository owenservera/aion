// Temporal operations are explicit; absence never implies a removal.
export function foldRevision(state, revision = {}) {
  for (const [field, value] of Object.entries(revision.values ?? {})) {
    Object.defineProperty(state, field, { value, enumerable: true, writable: true, configurable: true });
  }
  for (const field of Array.isArray(revision.removed) ? revision.removed : []) {
    if (typeof field === 'string' && field) delete state[field];
  }
  return state;
}
