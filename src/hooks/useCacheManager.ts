import { useState, useEffect, useCallback, useRef } from 'react';

type CacheKey = 
  | 'balance'
  | 'tokens' 
  | 'transactionHistory'
  | 'all';

interface CacheState {
  [key: string]: {
    isDirty: boolean;
    lastUpdated: number;
  };
}

// Global cache state that persists across component instances
let globalCacheState: CacheState = {
  balance: { isDirty: false, lastUpdated: 0 },
  tokens: { isDirty: false, lastUpdated: 0 },
  transactionHistory: { isDirty: false, lastUpdated: 0 },
};

// Event emitter for cache invalidation
type CacheEventListener = (key: CacheKey) => void;
const cacheEventListeners = new Set<CacheEventListener>();

const emitCacheEvent = (key: CacheKey) => {
  cacheEventListeners.forEach(listener => listener(key));
};

export const useCacheManager = () => {
  const [cacheState, setCacheState] = useState<CacheState>(globalCacheState);
  const listenerRef = useRef<CacheEventListener>();

  // Subscribe to cache events
  useEffect(() => {
    const listener: CacheEventListener = (key) => {
      setCacheState({...globalCacheState});
    };
    
    listenerRef.current = listener;
    cacheEventListeners.add(listener);

    return () => {
      if (listenerRef.current) {
        cacheEventListeners.delete(listenerRef.current);
      }
    };
  }, []);

  const markDirty = useCallback((key: CacheKey) => {
    const now = Date.now();
    
    if (key === 'all') {
      // Mark all caches as dirty
      Object.keys(globalCacheState).forEach(cacheKey => {
        if (cacheKey !== 'all') {
          globalCacheState[cacheKey] = { isDirty: true, lastUpdated: now };
        }
      });
    } else {
      globalCacheState[key] = { isDirty: true, lastUpdated: now };
    }
    
    console.log(`Cache marked dirty: ${key}`, globalCacheState);
    emitCacheEvent(key);
  }, []);

  const markClean = useCallback((key: CacheKey) => {
    if (key === 'all') {
      Object.keys(globalCacheState).forEach(cacheKey => {
        if (cacheKey !== 'all') {
          globalCacheState[cacheKey] = { 
            isDirty: false, 
            lastUpdated: Date.now() 
          };
        }
      });
    } else {
      globalCacheState[key] = { 
        isDirty: false, 
        lastUpdated: Date.now() 
      };
    }
    
    console.log(`Cache marked clean: ${key}`, globalCacheState);
    emitCacheEvent(key);
  }, []);

  const isDirty = useCallback((key: CacheKey): boolean => {
    if (key === 'all') {
      return Object.keys(globalCacheState).some(cacheKey => 
        cacheKey !== 'all' && globalCacheState[cacheKey]?.isDirty
      );
    }
    return globalCacheState[key]?.isDirty ?? false;
  }, [cacheState]);

  const getLastUpdated = useCallback((key: CacheKey): number => {
    if (key === 'all') {
      return Math.max(
        ...Object.keys(globalCacheState)
          .filter(cacheKey => cacheKey !== 'all')
          .map(cacheKey => globalCacheState[cacheKey]?.lastUpdated ?? 0)
      );
    }
    return globalCacheState[key]?.lastUpdated ?? 0;
  }, [cacheState]);

  // Trigger cache invalidation for common scenarios
  const invalidateAfterTransaction = useCallback(() => {
    markDirty('balance');
    markDirty('tokens');
    markDirty('transactionHistory');
  }, [markDirty]);

  const invalidateAfterWalletChange = useCallback(() => {
    markDirty('all');
  }, [markDirty]);

  const invalidateBalanceAndTokens = useCallback(() => {
    markDirty('balance');
    markDirty('tokens');
  }, [markDirty]);

  return {
    markDirty,
    markClean,
    isDirty,
    getLastUpdated,
    invalidateAfterTransaction,
    invalidateAfterWalletChange,
    invalidateBalanceAndTokens,
    cacheState
  };
};

// Export global cache functions for use in non-hook contexts
export const globalCacheManager = {
  markDirty: (key: CacheKey) => {
    const now = Date.now();
    
    if (key === 'all') {
      Object.keys(globalCacheState).forEach(cacheKey => {
        if (cacheKey !== 'all') {
          globalCacheState[cacheKey] = { isDirty: true, lastUpdated: now };
        }
      });
    } else {
      globalCacheState[key] = { isDirty: true, lastUpdated: now };
    }
    
    console.log(`Global cache marked dirty: ${key}`, globalCacheState);
    emitCacheEvent(key);
  },
  
  markClean: (key: CacheKey) => {
    if (key === 'all') {
      Object.keys(globalCacheState).forEach(cacheKey => {
        if (cacheKey !== 'all') {
          globalCacheState[cacheKey] = { 
            isDirty: false, 
            lastUpdated: Date.now() 
          };
        }
      });
    } else {
      globalCacheState[key] = { 
        isDirty: false, 
        lastUpdated: Date.now() 
      };
    }
    
    console.log(`Global cache marked clean: ${key}`, globalCacheState);
    emitCacheEvent(key);
  },
  
  isDirty: (key: CacheKey): boolean => {
    if (key === 'all') {
      return Object.keys(globalCacheState).some(cacheKey => 
        cacheKey !== 'all' && globalCacheState[cacheKey]?.isDirty
      );
    }
    return globalCacheState[key]?.isDirty ?? false;
  }
};