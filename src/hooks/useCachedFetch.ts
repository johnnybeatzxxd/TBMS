import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

// Global memory cache to eliminate any async retrieval delay on fast navigations
const memoryCache: Record<string, any> = {};

export function useCachedFetch<T>(key: string, fetcher: () => Promise<T>, fallbackData: T) {
  // 1. Initialize immediately with memory cache if available, protecting layout shifts.
  const [data, setData] = useState<T>(() => {
    if (memoryCache[key]) return memoryCache[key];
    return fallbackData;
  });
  
  // Only officially "load" if we have absolutely no memory cache
  const [isLoading, setIsLoading] = useState(!memoryCache[key]);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (silent = true) => {
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

    // 3. Stale-While-Revalidate network fetch
    try {
      const result = await fetcher();
      
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
    refetch: () => fetchData(false) 
  };
}
