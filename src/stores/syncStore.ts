import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface SyncState {
    // Sync status
    isSyncing: boolean;
    lastSyncTime: number | null;
    pendingChanges: number;
    syncError: string | null;

    // Auto-save state
    autoSaveEnabled: boolean;
    autoSaveInterval: number; // in milliseconds
    lastAutoSaveTime: number | null;

    // Database connection
    isConnected: boolean;
    databasePath: string | null;

    // Version tracking
    currentVersion: number;
    isDirty: boolean;

    // Sync actions
    startSync: () => void;
    endSync: (success: boolean, error?: string) => void;
    setPendingChanges: (count: number) => void;
    incrementPendingChanges: () => void;
    decrementPendingChanges: () => void;

    // Auto-save actions
    setAutoSaveEnabled: (enabled: boolean) => void;
    setAutoSaveInterval: (interval: number) => void;
    recordAutoSave: () => void;

    // Database actions
    setConnected: (connected: boolean, path?: string) => void;
    setDatabasePath: (path: string) => void;

    // Version actions
    incrementVersion: () => void;
    setDirty: (dirty: boolean) => void;
    resetDirty: () => void;
}

const DEFAULT_AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const useSyncStore = create<SyncState>()(
    immer((set) => ({
        // Initial state
        isSyncing: false,
        lastSyncTime: null,
        pendingChanges: 0,
        syncError: null,
        autoSaveEnabled: true,
        autoSaveInterval: DEFAULT_AUTO_SAVE_INTERVAL,
        lastAutoSaveTime: null,
        isConnected: false,
        databasePath: null,
        currentVersion: 0,
        isDirty: false,

        // Sync actions
        startSync: () => {
            set((state) => {
                state.isSyncing = true;
                state.syncError = null;
            });
        },

        endSync: (success, error) => {
            set((state) => {
                state.isSyncing = false;
                if (success) {
                    state.lastSyncTime = Date.now();
                    state.pendingChanges = 0;
                    state.isDirty = false;
                } else if (error) {
                    state.syncError = error;
                }
            });
        },

        setPendingChanges: (count) => {
            set((state) => {
                state.pendingChanges = count;
                state.isDirty = count > 0;
            });
        },

        incrementPendingChanges: () => {
            set((state) => {
                state.pendingChanges += 1;
                state.isDirty = true;
            });
        },

        decrementPendingChanges: () => {
            set((state) => {
                state.pendingChanges = Math.max(0, state.pendingChanges - 1);
                state.isDirty = state.pendingChanges > 0;
            });
        },

        // Auto-save actions
        setAutoSaveEnabled: (enabled) => {
            set((state) => {
                state.autoSaveEnabled = enabled;
            });
        },

        setAutoSaveInterval: (interval) => {
            set((state) => {
                state.autoSaveInterval = interval;
            });
        },

        recordAutoSave: () => {
            set((state) => {
                state.lastAutoSaveTime = Date.now();
            });
        },

        // Database actions
        setConnected: (connected, path) => {
            set((state) => {
                state.isConnected = connected;
                if (path) {
                    state.databasePath = path;
                }
            });
        },

        setDatabasePath: (path) => {
            set((state) => {
                state.databasePath = path;
            });
        },

        // Version actions
        incrementVersion: () => {
            set((state) => {
                state.currentVersion += 1;
            });
        },

        setDirty: (dirty) => {
            set((state) => {
                state.isDirty = dirty;
            });
        },

        resetDirty: () => {
            set((state) => {
                state.isDirty = false;
            });
        },
    }))
);
