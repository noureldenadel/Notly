import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// Backup entry
export interface Backup {
    id: string;
    name: string;
    createdAt: number;
    size: number; // in bytes (estimated)
    data: string; // JSON stringified backup data
}

interface BackupState {
    backups: Backup[];
    lastBackupTime: number | null;
    isBackingUp: boolean;

    // Actions
    createBackup: (name?: string) => string; // returns backup id
    restoreBackup: (backupId: string) => Backup | null;
    deleteBackup: (backupId: string) => void;
    clearOldBackups: (maxBackups: number) => void;
    getBackupById: (id: string) => Backup | undefined;
}

export const useBackupStore = create<BackupState>()(
    persist(
        immer((set, get) => ({
            backups: [],
            lastBackupTime: null,
            isBackingUp: false,

            createBackup: (name?: string) => {
                const id = nanoid();
                const now = Date.now();
                const backupName = name || `Backup ${new Date(now).toLocaleString()}`;

                // Collect all localStorage data for backup
                const backupData: Record<string, unknown> = {};
                const keysToBackup = [
                    'visual-thinking-projects',
                    'visual-thinking-cards',
                    'visual-thinking-files',
                    'visual-thinking-tags',
                    'visual-thinking-ui',
                    'visual-thinking-settings',
                ];

                for (const key of keysToBackup) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            backupData[key] = JSON.parse(data);
                        } catch {
                            backupData[key] = data;
                        }
                    }
                }

                const dataString = JSON.stringify(backupData);

                const backup: Backup = {
                    id,
                    name: backupName,
                    createdAt: now,
                    size: new Blob([dataString]).size,
                    data: dataString,
                };

                set((state) => {
                    state.backups.unshift(backup);
                    state.lastBackupTime = now;
                    state.isBackingUp = false;
                });

                return id;
            },

            restoreBackup: (backupId: string) => {
                const backup = get().backups.find(b => b.id === backupId);
                if (!backup) return null;

                try {
                    const backupData = JSON.parse(backup.data) as Record<string, unknown>;

                    // Restore each key to localStorage
                    for (const [key, value] of Object.entries(backupData)) {
                        localStorage.setItem(key, JSON.stringify(value));
                    }

                    return backup;
                } catch (e) {
                    console.error('Failed to restore backup:', e);
                    return null;
                }
            },

            deleteBackup: (backupId: string) => {
                set((state) => {
                    state.backups = state.backups.filter(b => b.id !== backupId);
                });
            },

            clearOldBackups: (maxBackups: number) => {
                set((state) => {
                    if (state.backups.length > maxBackups) {
                        // Sort by createdAt descending and keep only maxBackups
                        state.backups = state.backups
                            .sort((a, b) => b.createdAt - a.createdAt)
                            .slice(0, maxBackups);
                    }
                });
            },

            getBackupById: (id: string) => {
                return get().backups.find(b => b.id === id);
            },
        })),
        {
            name: 'visual-thinking-backups',
            partialize: (state) => ({
                backups: state.backups,
                lastBackupTime: state.lastBackupTime,
            }),
        }
    )
);

// Helper to format backup size
export function formatBackupSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
