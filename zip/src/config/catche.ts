interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function getCache(key: string): unknown {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: unknown, ttlSeconds: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function deleteCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
