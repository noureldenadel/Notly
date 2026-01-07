/**
 * Persistence Layer - Main Entry Point
 * Automatically selects localStorage (web) or Tauri SQLite (desktop)
 */

import { localStorageAdapter } from './localStorage';
import type { PersistenceAPI } from './types';

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

export async function getPersistence(): Promise<PersistenceAPI> {
    if (persistenceInstance) {
        return persistenceInstance;
    }

    if (isTauri()) {
        // Dynamically import Tauri adapter to avoid errors in web mode
        const { tauriAdapter } = await import('./tauri');
        persistenceInstance = tauriAdapter;
        console.log('[Persistence] Using Tauri SQLite adapter');
    } else {
        persistenceInstance = localStorageAdapter;
        console.log('[Persistence] Using localStorage adapter');
    }

    await persistenceInstance.init();
    return persistenceInstance;
}

/**
 * Synchronous getter for persistence (must call getPersistence first)
 */
export function persistence(): PersistenceAPI {
    if (!persistenceInstance) {
        // Fallback to localStorage if not initialized
        persistenceInstance = localStorageAdapter;
        console.warn('[Persistence] Using localStorage (not initialized yet)');
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
