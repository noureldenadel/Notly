/**
 * Persistence Layer - Main Entry Point
 * Automatically selects localStorage (web) or Tauri SQLite (desktop)
 */

import { localStorageAdapter } from './localStorage';
import { indexeddbAdapter } from './indexeddb';
import type { PersistenceAPI } from './types';
import { createLogger } from '@/lib/logger';

const log = createLogger('Persistence');

// Re-export types
export * from './types';

/**
 * Check if running in Tauri desktop environment
 */
export const isTauri = (): boolean => {
    return typeof window !== 'undefined' && '__TAURI__' in window;
};

/**
 * Get the appropriate persistence adapter
 */
let persistenceInstance: PersistenceAPI | null = null;

// Reverting to localStorage for stability as requested by user
// Previously: Checked isTauri() and used tauriAdapter
export async function getPersistence(): Promise<PersistenceAPI> {
    if (persistenceInstance) {
        return persistenceInstance;
    }

    // Force usage of localStorageAdapter for both Web and Tauri
    // This avoids the complex async SQLite race conditions
    persistenceInstance = localStorageAdapter;
    log.debug('Using localStorage adapter (forced)');

    await persistenceInstance.init();
    return persistenceInstance;
}

/**
 * Synchronous getter for persistence (must call getPersistence/initPersistence first)
 * @throws Error if called before initialization
 */
export function persistence(): PersistenceAPI {
    if (!persistenceInstance) {
        throw new Error(
            'Persistence not initialized. Call initPersistence() or getPersistence() first.'
        );
    }
    return persistenceInstance;
}

/**
 * Initialize persistence layer
 * Call this at app startup
 */
export async function initPersistence(): Promise<void> {
    await getPersistence();
}
