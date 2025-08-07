// Cache-first data loading system for instant UI
import { useEffect, useState, useMemo, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  // Cache durations in milliseconds
  private static CACHE_DURATIONS = {
    SHORT: 30 * 1000, // 30 seconds
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 30 * 60 * 1000, // 30 minutes
    PERSISTENT: Infinity, // Never expires
  };

  // Get data from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Set data in cache
  set<T>(
    key: string,
    data: T,
    duration: number = CacheManager.CACHE_DURATIONS.MEDIUM,
  ): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + duration,
    };

    this.cache.set(key, entry);

    // Notify subscribers
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach((callback) => callback(data));
    }
  }

  // Subscribe to cache updates
  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const keySubscribers = this.subscribers.get(key);
      if (keySubscribers) {
        keySubscribers.delete(callback);
        if (keySubscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Clear specific cache entry
  clear(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
  }

  // Check if data is cached and fresh
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      subscribers: this.subscribers.size,
    };
  }

  // Cache with background refresh
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      cacheDuration?: number;
      backgroundRefresh?: boolean;
      fallbackData?: T;
    } = {},
  ): Promise<T> {
    const {
      cacheDuration = CacheManager.CACHE_DURATIONS.MEDIUM,
      backgroundRefresh = true,
      fallbackData,
    } = options;

    // Check cache first
    const cachedData = this.get<T>(key);
    if (cachedData !== null) {
      // If background refresh is enabled, fetch new data in background
      if (backgroundRefresh) {
        fetchFn()
          .then((newData) => this.set(key, newData, cacheDuration))
          .catch((error) => console.warn("Background refresh failed:", error));
      }
      return cachedData;
    }

    // Not in cache, fetch fresh data
    try {
      const data = await fetchFn();
      this.set(key, data, cacheDuration);
      return data;
    } catch (error) {
      console.error("Fetch failed:", error);

      // Return fallback data if available
      if (fallbackData !== undefined) {
        this.set(key, fallbackData, CacheManager.CACHE_DURATIONS.SHORT);
        return fallbackData;
      }

      throw error;
    }
  }

  // Invalidate cache entries by pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Pre-populate cache with data
  preload<T>(key: string, data: T, duration?: number): void {
    this.set(key, data, duration);
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

// Cache keys for different data types
export const CACHE_KEYS = {
  STORE_PRODUCTS: "store:products",
  STORE_SUBSCRIPTION: (userId: string) => `store:subscription:${userId}`,
  STORE_PURCHASES: (userId: string) => `store:purchases:${userId}`,
  STORE_CUSTOMIZATIONS: (userId: string) => `store:customizations:${userId}`,

  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_FRIENDS: (userId: string) => `user:friends:${userId}`,

  ADMIN_STATS: "admin:stats",
  ADMIN_LOGS: "admin:logs",

  CHAT_LIST: (userId: string) => `chat:list:${userId}`,
  CHAT_MESSAGES: (chatId: string) => `chat:messages:${chatId}`,

  SERVERS_LIST: "servers:list",
  CLIENTS_LIST: "clients:list",
};

// Hook for using cache in React components
export function useCache<T>(
  key: string,
  fetchFn?: () => Promise<T>,
  options: {
    cacheDuration?: number;
    backgroundRefresh?: boolean;
    fallbackData?: T;
    immediate?: boolean;
  } = {},
) {
  const [data, setData] = useState<T | null>(() => cacheManager.get(key));
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  const { immediate = true } = options;

  useEffect(() => {
    // Subscribe to cache updates
    const unsubscribe = cacheManager.subscribe(key, (newData: T) => {
      setData(newData);
      setIsLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, [key]);

  useEffect(() => {
    // Fetch data if not in cache and fetchFn provided
    if (!data && fetchFn && immediate) {
      cacheManager
        .getOrFetch(key, fetchFn, options)
        .then((newData) => {
          setData(newData);
          setIsLoading(false);
          setError(null);
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
    } else if (data) {
      setIsLoading(false);
    }
  }, [key, data, fetchFn, immediate, options]);

  const refresh = useCallback(async () => {
    if (!fetchFn) return;

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchFn();
      cacheManager.set(key, newData, options.cacheDuration);
      setData(newData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, key, options.cacheDuration]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}
