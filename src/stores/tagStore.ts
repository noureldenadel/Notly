import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Tag, TagRelation } from './types';

interface TagState {
    // Data
    tags: Tag[];
    relations: TagRelation[];

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
            return tag;
        },

        updateTag: (id, updates) => {
            set((state) => {
                const tag = state.tags.find((t) => t.id === id);
                if (tag) {
                    Object.assign(tag, updates);
                }
            });
        },

        deleteTag: (id) => {
            set((state) => {
                state.tags = state.tags.filter((t) => t.id !== id);
                state.relations = state.relations.filter((r) => r.tagId !== id);
            });
        },

        reorderTags: (tagIds) => {
            set((state) => {
                tagIds.forEach((id, index) => {
                    const tag = state.tags.find((t) => t.id === id);
                    if (tag) {
                        tag.position = index;
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
