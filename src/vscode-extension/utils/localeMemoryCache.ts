import { TOKEN } from './constants/commands';
import * as cacheManager from 'cache-manager';

// Factory to create an in-memory cache instance
const createCacheInstance = () => {
  return cacheManager.caching({
    store: 'memory',
    max: 100,
    ttl: 86400, // 1 day in seconds
  });
};

// Strongly typed cache store structure
type CacheStore = Record<string, unknown>;

class LocaleMemoryCache {
  private readonly memory: ReturnType<typeof createCacheInstance> | null =
    createCacheInstance();

  private isCacheAvailable(): boolean {
    return this.memory !== null && typeof this.memory.get === 'function';
  }

  /** Get entire cached store for a token */
  public async getStore(token: TOKEN): Promise<CacheStore | null> {
    if (!this.isCacheAvailable()) {
      return null;
    }
    return (await this.memory!.get(token)) ?? null;
  }

  /** Get specific item by key from cached store */
  public async getItem(token: TOKEN, key: string): Promise<unknown | null> {
    if (!this.isCacheAvailable()) {
      return null;
    }
    const store = await this.memory!.get<CacheStore>(token);
    return store?.[key] ?? null;
  }

  /** Set or update a specific item in the cached store */
  public async setItem(
    token: TOKEN,
    key: string,
    value: unknown
  ): Promise<void> {
    if (!this.isCacheAvailable()) {
      return;
    }
    const store = await this.memory!.get<CacheStore>(token);
    const updatedStore: CacheStore = {
      ...store,
      [key]: value,
    };
    await this.memory!.set(token, updatedStore);
  }

  /** Clear cache for the given token */
  public async clearStore(token: TOKEN): Promise<boolean> {
    if (!this.isCacheAvailable()) {
      return false;
    }
    await this.memory!.del(token);
    return true;
  }
}

const LocaleMemoryCacheInstance = new LocaleMemoryCache();

export { createCacheInstance, LocaleMemoryCache, LocaleMemoryCacheInstance };
