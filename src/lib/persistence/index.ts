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

    // Use IndexedDB for better storage capacity (50MB-1GB vs localStorage's 5-10MB)
    // This prevents quota errors with large base64 images in snapshots
    persistenceInstance = indexeddbAdapter;
    log.debug('Using IndexedDB adapter (larger capacity)');

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
    // Ensure directory structure exists (Tauri only)
    if (isTauri()) {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('ensure_directory_structure');
            log.info('Ensured directory structure');
        } catch (e) {
            log.error('Failed to ensure directory structure:', e);
        }
    }

    await getPersistence();
}
