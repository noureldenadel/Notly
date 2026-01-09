import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

export type LinkType = 'reference' | 'embed' | 'mention';

export interface Link {
    id: string;
    sourceId: string;    // The card containing the link
    targetId: string;    // The card being linked to
    sourceType: 'card';  // Source entity type
    targetType: 'card' | 'file' | 'tag';  // Target entity type
    linkType: LinkType;
    context?: string;    // Text around the link for context
    createdAt: number;
    updatedAt: number;
}

interface LinkState {
    // State
    links: Link[];
    isLoaded: boolean;

    // Actions
    createLink: (
        sourceId: string,
        targetId: string,
        options?: {
            targetType?: Link['targetType'];
            linkType?: LinkType;
            context?: string;
        }
    ) => Link;
    deleteLink: (linkId: string) => void;
    deleteLinkBetween: (sourceId: string, targetId: string) => void;
    updateLink: (linkId: string, updates: Partial<Pick<Link, 'linkType' | 'context'>>) => void;

    // Bulk operations
    deleteLinksForEntity: (entityId: string) => void;

    // Getters
    getLink: (linkId: string) => Link | undefined;
    getLinksFrom: (sourceId: string) => Link[];
    getBacklinks: (targetId: string) => Link[];
    getLinkBetween: (sourceId: string, targetId: string) => Link | undefined;
    hasLinkTo: (sourceId: string, targetId: string) => boolean;

    // Analysis
    getMostLinkedCards: (limit?: number) => { id: string; count: number }[];
    getOrphanCards: (allCardIds: string[]) => string[];
}

export const useLinkStore = create<LinkState>()(
    persist(
        immer((set, get) => ({
            // Initial state
            links: [],
            isLoaded: true,

            // Actions
            createLink: (sourceId, targetId, options = {}) => {
                const {
                    targetType = 'card',
                    linkType = 'reference',
                    context,
                } = options;

                // Don't create duplicate links
                const existing = get().getLinkBetween(sourceId, targetId);
                if (existing) {
                    return existing;
                }

                // Don't allow self-links
                if (sourceId === targetId) {
                    throw new Error('Cannot create a link to self');
                }

                const now = Date.now();
                const link: Link = {
                    id: nanoid(),
                    sourceId,
                    targetId,
                    sourceType: 'card',
                    targetType,
                    linkType,
                    context,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => {
                    state.links.push(link);
                });

                console.log('[LinkStore] Created link:', sourceId, '->', targetId);
                return link;
            },

            deleteLink: (linkId) => {
                set((state) => {
                    state.links = state.links.filter(l => l.id !== linkId);
                });
            },

            deleteLinkBetween: (sourceId, targetId) => {
                set((state) => {
                    state.links = state.links.filter(
                        l => !(l.sourceId === sourceId && l.targetId === targetId)
                    );
                });
            },

            updateLink: (linkId, updates) => {
                set((state) => {
                    const link = state.links.find(l => l.id === linkId);
                    if (link) {
                        Object.assign(link, updates, { updatedAt: Date.now() });
                    }
                });
            },

            deleteLinksForEntity: (entityId) => {
                set((state) => {
                    state.links = state.links.filter(
                        l => l.sourceId !== entityId && l.targetId !== entityId
                    );
                });
            },

            // Getters
            getLink: (linkId) => get().links.find(l => l.id === linkId),

            getLinksFrom: (sourceId) =>
                get().links.filter(l => l.sourceId === sourceId),

            getBacklinks: (targetId) =>
                get().links.filter(l => l.targetId === targetId),

            getLinkBetween: (sourceId, targetId) =>
                get().links.find(l => l.sourceId === sourceId && l.targetId === targetId),

            hasLinkTo: (sourceId, targetId) =>
                get().links.some(l => l.sourceId === sourceId && l.targetId === targetId),

            // Analysis
            getMostLinkedCards: (limit = 10) => {
                const counts = new Map<string, number>();

                for (const link of get().links) {
                    if (link.targetType === 'card') {
                        counts.set(link.targetId, (counts.get(link.targetId) || 0) + 1);
                    }
                }

                return Array.from(counts.entries())
                    .map(([id, count]) => ({ id, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, limit);
            },

            getOrphanCards: (allCardIds) => {
                const linkedIds = new Set<string>();

                for (const link of get().links) {
                    linkedIds.add(link.sourceId);
                    if (link.targetType === 'card') {
                        linkedIds.add(link.targetId);
                    }
                }

                return allCardIds.filter(id => !linkedIds.has(id));
            },
        })),
        {
            name: 'visual-thinking-links',
            version: 1,
        }
    )
);

// Utility function to extract [[wiki-links]] from text
export function extractWikiLinks(text: string): string[] {
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    const matches: string[] = [];
    let match;

    while ((match = wikiLinkRegex.exec(text)) !== null) {
        matches.push(match[1]);
    }

    return matches;
}

// Utility function to replace [[wiki-links]] with actual links
export function processWikiLinks(
    text: string,
    cardTitleToId: Map<string, string>
): { text: string; links: { title: string; id: string | null }[] } {
    const links: { title: string; id: string | null }[] = [];

    const processedText = text.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
        const id = cardTitleToId.get(title.toLowerCase()) || null;
        links.push({ title, id });
        return id ? `[[${title}]]` : `[[${title}]]`; // Keep original syntax
    });

    return { text: processedText, links };
}

// Selector hooks
export const useLinksFrom = (cardId: string) =>
    useLinkStore((state) => state.links.filter(l => l.sourceId === cardId));

export const useBacklinks = (cardId: string) =>
    useLinkStore((state) => state.links.filter(l => l.targetId === cardId));
