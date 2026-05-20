import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

// Global memory cache to eliminate any async retrieval delay on fast navigations
export const memoryCache: Record<string, any> = {};
export const cacheTimestamps: Record<string, number> = {};

export function clearCacheKey(key: string) {
  delete memoryCache[key];
  delete cacheTimestamps[key];
  SecureStore.deleteItemAsync(`cache_${key}`).catch(() => {});
}

export function clearCachePrefix(prefix: string) {
  Object.keys(memoryCache).forEach((key) => {
    if (key.startsWith(prefix)) {
      delete memoryCache[key];
      delete cacheTimestamps[key];
      SecureStore.deleteItemAsync(`cache_${key}`).catch(() => {});
    }
  });
}

export function useCachedFetch<T>(key: string, fetcher: () => Promise<T>, fallbackData: T) {
  // 1. Initialize immediately with memory cache if available, protecting layout shifts.
  const [data, setData] = useState<T>(() => {
    if (memoryCache[key]) return memoryCache[key];
    return fallbackData;
  });
  
  // Only officially "load" if we have absolutely no memory cache
  const [isLoading, setIsLoading] = useState(!memoryCache[key]);
  const [error, setError] = useState<Error | null>(null);

  // If the key changes, we must sync the state immediately to prevent stale data leaking from a different key
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setData(memoryCache[key] !== undefined ? memoryCache[key] : fallbackData);
    setIsLoading(!memoryCache[key]);
  }

  const fetchData = useCallback(async (silent = true, force = false) => {
    if (!silent && !memoryCache[key]) {
       setIsLoading(true);
    }
    
    // 2. Hydrate from SecureStore immediately if memory is empty
    if (!memoryCache[key]) {
      try {
        const stored = await SecureStore.getItemAsync(`cache_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          memoryCache[key] = parsed;
          setData(parsed);
          setIsLoading(false); // Render UI immediately before network finishes
        }
      } catch (err) {
        // Silently ignore store corruption
      }
    }

    // Optimization: Skip network fetch if it was fetched in the last 15 seconds (unless forced)
    const lastFetch = cacheTimestamps[key] || 0;
    if (!force && memoryCache[key] && (Date.now() - lastFetch < 15000)) {
      setIsLoading(false);
      return;
    }

    // 3. Stale-While-Revalidate network fetch
    try {
      const result = await fetcher();
      cacheTimestamps[key] = Date.now();
      
      // Prevent useless UI rerenders if data is literally equal (simple serialization check for simplicity)
      if (JSON.stringify(memoryCache[key]) !== JSON.stringify(result)) {
        memoryCache[key] = result;
        setData(result);
        
        // Background write 
        SecureStore.setItemAsync(`cache_${key}`, JSON.stringify(result)).catch(() => {});
      }
      
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher]);

  // Execute fetch cycle exactly once on mount, or when key/fetcher dependencies shift
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Expose manual refetch allowing forced spinners if user pulls-to-refresh
  return { 
    data, 
    isLoading, 
    error, 
    refetch: (force = false) => fetchData(false, force) 
  };
}
