import type { TreeItemModel } from '../store/types';

type DataSourceCacheDefaultConfig = {
  /**
   * Time To Live for each cache entry in milliseconds.
   * After this time the cache entry will become stale and the next query will result in cache miss.
   * @default 300_000 (5 minutes)
   */
  ttl?: number | undefined;
};

export interface DataSourceCache {
  /**
   * Set the cache entry for the given key.
   * @param key The cache key (typically a parent item ID)
   * @param value The children items to cache
   */
  set: (key: string, value: TreeItemModel[]) => void;
  /**
   * Get the cache entry for the given key.
   * @param key The cache key
   * @returns The cached items, `undefined` if not found, or `-1` if expired
   */
  get: (key: string) => TreeItemModel[] | undefined | -1;
  /**
   * Clear all cache entries.
   */
  clear: () => void;
}

export class DataSourceCacheDefault implements DataSourceCache {
  private cache: Record<string, { value: TreeItemModel[]; expiry: number }>;

  private ttl: number;

  constructor({ ttl = 300_000 }: DataSourceCacheDefaultConfig = {}) {
    this.cache = {};
    this.ttl = ttl;
  }

  set(key: string, value: TreeItemModel[]) {
    const expiry = Date.now() + this.ttl;
    this.cache[key] = { value, expiry };
  }

  get(key: string): TreeItemModel[] | undefined | -1 {
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
