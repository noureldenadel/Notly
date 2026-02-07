import { useState, useCallback } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('SnapshotCache');

/**
 * Hook to cache board snapshots in memory for instant loading
 */
export const useSnapshotCache = () => {
    const [cache] = useState<Map<string, string>>(new Map());

    /**
     * Get snapshot from cache
     */
    const getCached = useCallback((boardId: string): string | null => {
        return cache.get(boardId) || null;
    }, [cache]);

    /**
     * Store snapshot in cache
     */
    const setCache = useCallback((boardId: string, snapshot: string) => {
        cache.set(boardId, snapshot);
        log.debug('Cached snapshot for board:', boardId);
    }, [cache]);

    /**
     * Remove snapshot from cache
     */
    const removeFromCache = useCallback((boardId: string) => {
        cache.delete(boardId);
        log.debug('Removed snapshot from cache:', boardId);
    }, [cache]);

    /**
     * Clear entire cache
     */
    const clearCache = useCallback(() => {
        cache.clear();
        log.debug('Cleared snapshot cache');
    }, [cache]);

    return {
        getCached,
        setCache,
        removeFromCache,
        clearCache
    };
};
