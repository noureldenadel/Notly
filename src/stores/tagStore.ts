import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Tag, TagRelation } from './types';
import type { Tag as PTag } from '@/lib/persistence/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('TagStore');

// Helper to save tag to persistence
async function saveTagToPersistence(tag: Tag) {
    try {
        const { getPersistence } = await import('@/lib/persistence');
        const p = await getPersistence();
        await p.saveTag({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            groupId: tag.groupId,
            position: tag.position,
            createdAt: tag.createdAt,
        });
        log.debug('Saved tag:', tag.id);
    } catch (e) {
        log.error('Error saving tag:', e);
    }
}

interface TagState {
    // Data
    tags: Tag[];
    relations: TagRelation[];
    isLoaded: boolean;

    // Load from persistence
    loadTags: () => Promise<void>;

    // Tag actions
    createTag: (name: string, color?: string, groupId?: string) => Tag;
    updateTag: (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => void;
    deleteTag: (id: string) => void;
    reorderTags: (tagIds: string[]) => void;

    // Tag relation actions
    addTagToEntity: (tagId: string, entityType: TagRelation['entityType'], entityId: string) => void;
    removeTagFromEntity: (tagId: string, entityType: TagRelation['entityType'], entityId: string) => void;
    clearEntityTags: (entityType: TagRelation['entityType'], entityId: string) => void;

    // Getters
    getTag: (id: string) => Tag | undefined;
    getTagByName: (name: string) => Tag | undefined;
    getTagsByGroup: (groupId: string) => Tag[];
    getEntityTags: (entityType: TagRelation['entityType'], entityId: string) => Tag[];
    getEntitiesByTag: (tagId: string) => TagRelation[];
    getTagUsageCount: (tagId: string) => number;
}

export const useTagStore = create<TagState>()(
    immer((set, get) => ({
        // Initial state
        tags: [],
        relations: [],
        isLoaded: false,

        // Load from persistence
        loadTags: async () => {
            if (get().isLoaded) return;
            try {
                const { getPersistence } = await import('@/lib/persistence');
                const p = await getPersistence();
                const tags = await p.getTags();
                set((state) => {
                    state.tags = tags.map((t: PTag) => ({
                        id: t.id,
                        name: t.name,
                        color: t.color,
                        groupId: t.groupId,
                        position: t.position,
                        createdAt: t.createdAt,
                    }));
                    state.isLoaded = true;
                });
                log.debug('Loaded', tags.length, 'tags');
            } catch (e) {
                log.error('Error loading tags:', e);
                set((state) => { state.isLoaded = true; });
            }
        },

        // Tag actions
        createTag: (name, color, groupId) => {
            const now = Date.now();
            const existingTags = get().tags;
            const tag: Tag = {
                id: nanoid(),
                name,
                color,
                groupId,
                position: existingTags.length,
                createdAt: now,
            };
            set((state) => {
                state.tags.push(tag);
            });
            saveTagToPersistence(tag);
            return tag;
        },

        updateTag: (id, updates) => {
            set((state) => {
                const tag = state.tags.find((t) => t.id === id);
                if (tag) {
                    Object.assign(tag, updates);
                    saveTagToPersistence(tag);
                }
            });
        },

        deleteTag: (id) => {
            set((state) => {
                state.tags = state.tags.filter((t) => t.id !== id);
                state.relations = state.relations.filter((r) => r.tagId !== id);
            });
            // Delete from persistence
            (async () => {
                const { getPersistence } = await import('@/lib/persistence');
                const p = await getPersistence();
                await p.deleteTag(id);
            })();
        },

        reorderTags: (tagIds) => {
            set((state) => {
                tagIds.forEach((id, index) => {
                    const tag = state.tags.find((t) => t.id === id);
                    if (tag) {
                        tag.position = index;
                        saveTagToPersistence(tag);
                    }
                });
            });
        },

        // Tag relation actions
        addTagToEntity: (tagId, entityType, entityId) => {
            const exists = get().relations.some(
                (r) => r.tagId === tagId && r.entityType === entityType && r.entityId === entityId
            );
            if (exists) return;

            set((state) => {
                state.relations.push({
                    tagId,
                    entityType,
                    entityId,
                    createdAt: Date.now(),
                });
            });
            // Note: Tag relations could be persisted separately if needed
        },

        removeTagFromEntity: (tagId, entityType, entityId) => {
            set((state) => {
                state.relations = state.relations.filter(
                    (r) => !(r.tagId === tagId && r.entityType === entityType && r.entityId === entityId)
                );
            });
        },

        clearEntityTags: (entityType, entityId) => {
            set((state) => {
                state.relations = state.relations.filter(
                    (r) => !(r.entityType === entityType && r.entityId === entityId)
                );
            });
        },

        // Getters
        getTag: (id) => get().tags.find((t) => t.id === id),

        getTagByName: (name) => get().tags.find((t) => t.name.toLowerCase() === name.toLowerCase()),

        getTagsByGroup: (groupId) =>
            get()
                .tags.filter((t) => t.groupId === groupId)
                .sort((a, b) => a.position - b.position),

        getEntityTags: (entityType, entityId) => {
            const tagIds = get()
                .relations.filter((r) => r.entityType === entityType && r.entityId === entityId)
                .map((r) => r.tagId);
            return get().tags.filter((t) => tagIds.includes(t.id));
        },

        getEntitiesByTag: (tagId) => get().relations.filter((r) => r.tagId === tagId),

        getTagUsageCount: (tagId) => get().relations.filter((r) => r.tagId === tagId).length,
    }))
);
