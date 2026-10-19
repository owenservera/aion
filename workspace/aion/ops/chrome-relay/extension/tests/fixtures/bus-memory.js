// In-memory chrome.storage.local stand-in for bus tests. Records every write.
export function memoryStorage(initial = {}) {
  const bag = structuredClone(initial);
  const writes = [];
  return {
    bag, writes,
    async get(key) { return Object.hasOwn(bag, key) ? { [key]: structuredClone(bag[key]) } : {}; },
    async set(value) { writes.push(structuredClone(value)); Object.assign(bag, structuredClone(value)); },
  };
}
