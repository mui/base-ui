type DataSourceCacheDefaultConfig = {
  /**
   * Time To Live for each cache entry in milliseconds.
   * After this time the cache entry will become stale and the next query will result in cache miss.
   * @default 300_000 (5 minutes)
   */
  ttl?: number | undefined;
};

export interface DataSourceCache<TItem = any> {
  /**
   * Set the cache entry for the given key.
   * @param key The cache key (typically a parent item ID)
   * @param value The children items to cache
   */
  set: (key: string, value: TItem[]) => void;
  /**
   * Get the cache entry for the given key.
   * @param key The cache key
   * @returns The cached items, `undefined` if not found, or `-1` if expired
   */
  get: (key: string) => TItem[] | undefined | -1;
  /**
   * Clear all cache entries.
   */
  clear: () => void;
}

export class DataSourceCacheDefault<TItem = any> implements DataSourceCache<TItem> {
  private cache: Record<string, { value: TItem[]; expiry: number }>;

  private ttl: number;

  constructor({ ttl = 300_000 }: DataSourceCacheDefaultConfig = {}) {
    this.cache = {};
    this.ttl = ttl;
  }

  set(key: string, value: TItem[]) {
    const expiry = Date.now() + this.ttl;
    this.cache[key] = { value, expiry };
  }

  get(key: string): TItem[] | undefined | -1 {
    const entry = this.cache[key];
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiry) {
      delete this.cache[key];
      return -1;
    }
    return entry.value;
  }

  clear() {
    this.cache = {};
  }
}
