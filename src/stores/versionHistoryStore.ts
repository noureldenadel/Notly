import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Version {
    id: string;
    entityType: 'card' | 'journal' | 'board';
    entityId: string;
    snapshot: string; // JSON or HTML content
    title?: string;
    createdAt: number;
}

interface VersionHistoryState {
    // State
    versions: Record<string, Version[]>; // Keyed by `${entityType}:${entityId}`
    maxVersionsPerEntity: number;

    // Actions
    saveVersion: (entityType: Version['entityType'], entityId: string, snapshot: string, title?: string) => void;
    getVersions: (entityType: Version['entityType'], entityId: string) => Version[];
    getVersion: (versionId: string) => Version | null;
    deleteVersion: (versionId: string) => void;
    clearVersions: (entityType: Version['entityType'], entityId: string) => void;

    // Restore
    getLatestVersion: (entityType: Version['entityType'], entityId: string) => Version | null;
}

// Create unique key for entity
function entityKey(entityType: string, entityId: string): string {
    return `${entityType}:${entityId}`;
}

export const useVersionHistoryStore = create<VersionHistoryState>()(
    persist(
        immer((set, get) => ({
            // Initial state
            versions: {},
            maxVersionsPerEntity: 50, // Keep last 50 versions

            // Actions
            saveVersion: (entityType, entityId, snapshot, title) => {
                const now = Date.now();
                const key = entityKey(entityType, entityId);
                const newVersion: Version = {
                    id: crypto.randomUUID(),
                    entityType,
                    entityId,
                    snapshot,
                    title,
                    createdAt: now,
                };

                set((state) => {
                    if (!state.versions[key]) {
                        state.versions[key] = [];
                    }

                    // Add new version at the beginning
                    state.versions[key].unshift(newVersion);

                    // Trim to max versions
                    if (state.versions[key].length > state.maxVersionsPerEntity) {
                        state.versions[key] = state.versions[key].slice(0, state.maxVersionsPerEntity);
                    }
                });

                console.log('[VersionHistory] Saved version for:', key);
            },

            getVersions: (entityType, entityId) => {
                const key = entityKey(entityType, entityId);
                return get().versions[key] || [];
            },

            getVersion: (versionId) => {
                const allVersions = Object.values(get().versions).flat();
                return allVersions.find(v => v.id === versionId) || null;
            },

            deleteVersion: (versionId) => {
                set((state) => {
                    for (const key of Object.keys(state.versions)) {
                        const index = state.versions[key].findIndex(v => v.id === versionId);
                        if (index !== -1) {
                            state.versions[key].splice(index, 1);
                            break;
                        }
                    }
                });
            },

            clearVersions: (entityType, entityId) => {
                const key = entityKey(entityType, entityId);
                set((state) => {
                    delete state.versions[key];
                });
            },

            getLatestVersion: (entityType, entityId) => {
                const versions = get().getVersions(entityType, entityId);
                return versions[0] || null;
            },
        })),
        {
            name: 'visual-thinking-version-history',
            version: 1,
        }
    )
);

// Selector hook for specific entity
export function useVersionsFor(entityType: Version['entityType'], entityId: string) {
    return useVersionHistoryStore((state) => {
        const key = entityKey(entityType, entityId);
        return state.versions[key] || [];
    });
}

// Format relative time
export function formatVersionTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

    return new Date(timestamp).toLocaleDateString();
}
