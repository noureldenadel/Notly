import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Card } from './types';
import { indexDocument, removeDocument } from '@/lib/search';
import { createLogger } from '@/lib/logger';

const log = createLogger('CardStore');

interface CardState {
    // Data
    cards: Card[];
    isLoaded: boolean;

    // Actions
    loadCards: () => Promise<void>;
    createCard: (content?: string, title?: string, color?: string) => Card;
    updateCard: (id: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>) => void;
    deleteCard: (id: string) => void;
    duplicateCard: (id: string) => Card | undefined;

    // Content actions
    updateCardContent: (id: string, content: string) => void;
    updateCardTitle: (id: string, title: string) => void;
    toggleCardHidden: (id: string) => void;

    // Getters
    getCard: (id: string) => Card | undefined;
    getCardsByColor: (color: string) => Card[];
    getVisibleCards: () => Card[];
    getHiddenCards: () => Card[];
    searchCards: (query: string) => Card[];
}

// Helper to count words in content
function countWords(content: string): number {
    // Strip HTML/JSON if present and count words
    const text = content.replace(/<[^>]*>/g, ' ').replace(/[{}"[\]:,]/g, ' ');
    return text.split(/\s+/).filter((word) => word.length > 0).length;
}

// Debounced save function
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
async function saveCardToPersistence(card: Card) {
    try {
        const { getPersistence } = await import('@/lib/persistence');
        const p = await getPersistence();
        await p.saveCard({
            id: card.id,
            title: card.title,
            content: card.content,
            contentType: card.contentType || 'tiptap',
            color: card.color,
            isHidden: card.isHidden,
            wordCount: card.wordCount,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
        });
        log.debug('Saved card:', card.id);
    } catch (e) {
        log.error('Error saving card:', e);
    }
}

function debouncedSave(card: Card) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveCardToPersistence(card), 500);
}

// Immediately save card (for new cards)
function immediatelySave(card: Card) {
    saveCardToPersistence(card);
}

// Index card for search
function indexCard(card: Card) {
    indexDocument({
        id: card.id,
        type: 'card',
        title: card.title || 'Untitled',
        content: card.content,
        tags: '',
        preview: card.content.slice(0, 100),
    });
}

export const useCardStore = create<CardState>()(
    immer((set, get) => ({
        // Initial state
        cards: [],
        isLoaded: false,

        // Load cards from persistence
        loadCards: async () => {
            try {
                const { getPersistence } = await import('@/lib/persistence');
                const p = await getPersistence();
                const cards = await p.getCards();
                set((state) => {
                    state.cards = cards.map(c => ({
                        id: c.id,
                        title: c.title,
                        content: c.content,
                        contentType: (c.contentType || 'tiptap') as 'tiptap' | 'markdown' | 'html',
                        color: c.color,
                        isHidden: c.isHidden,
                        wordCount: c.wordCount,
                        createdAt: c.createdAt,
                        updatedAt: c.updatedAt,
                    }));
                    state.isLoaded = true;
                });
                // Index all loaded cards for search
                get().cards.forEach(indexCard);
                log.debug('Loaded', cards.length, 'cards');
            } catch (e) {
                log.error('Error loading cards:', e);
                set((state) => {
                    state.isLoaded = true;
                });
            }
        },

        // Actions
        createCard: (content = '', title, color) => {
            const now = Date.now();
            const card: Card = {
                id: nanoid(),
                title,
                content,
                contentType: 'tiptap',
                color,
                isHidden: false,
                wordCount: countWords(content),
                createdAt: now,
                updatedAt: now,
            };
            set((state) => {
                state.cards.push(card);
            });
            // Persist immediately and index for search
            immediatelySave(card);
            indexCard(card);
            return card;
        },

        updateCard: (id, updates) => {
            set((state) => {
                const card = state.cards.find((c) => c.id === id);
                if (card) {
                    // Recalculate word count if content changed
                    if (updates.content !== undefined) {
                        updates.wordCount = countWords(updates.content);
                    }
                    Object.assign(card, updates, { updatedAt: Date.now() });
                    // Persist and re-index
                    debouncedSave({ ...card });
                    indexCard({ ...card });
                }
            });
        },

        deleteCard: (id) => {
            set((state) => {
                state.cards = state.cards.filter((c) => c.id !== id);
            });
            // Remove from persistence and search index
            (async () => {
                const { getPersistence } = await import('@/lib/persistence');
                const p = await getPersistence();
                await p.deleteCard(id);
            })();
            removeDocument(id);
        },

        duplicateCard: (id) => {
            const original = get().cards.find((c) => c.id === id);
            if (!original) return undefined;

            const now = Date.now();
            const duplicate: Card = {
                ...original,
                id: nanoid(),
                title: original.title ? `${original.title} (Copy)` : undefined,
                createdAt: now,
                updatedAt: now,
            };
            set((state) => {
                state.cards.push(duplicate);
            });
            // Persist and index
            debouncedSave(duplicate);
            indexCard(duplicate);
            return duplicate;
        },

        // Content actions
        updateCardContent: (id, content) => {
            set((state) => {
                const card = state.cards.find((c) => c.id === id);
                if (card) {
                    card.content = content;
                    card.wordCount = countWords(content);
                    card.updatedAt = Date.now();
                    // Persist and re-index
                    debouncedSave({ ...card });
                    indexCard({ ...card });
                }
            });
        },

        updateCardTitle: (id, title) => {
            set((state) => {
                const card = state.cards.find((c) => c.id === id);
                if (card) {
                    card.title = title;
                    card.updatedAt = Date.now();
                    // Persist and re-index
                    debouncedSave({ ...card });
                    indexCard({ ...card });
                }
            });
        },

        toggleCardHidden: (id) => {
            set((state) => {
                const card = state.cards.find((c) => c.id === id);
                if (card) {
                    card.isHidden = !card.isHidden;
                    card.updatedAt = Date.now();
                    // Persist
                    debouncedSave({ ...card });
                }
            });
        },

        // Getters
        getCard: (id) => get().cards.find((c) => c.id === id),

        getCardsByColor: (color) => get().cards.filter((c) => c.color === color),

        getVisibleCards: () => get().cards.filter((c) => !c.isHidden),

        getHiddenCards: () => get().cards.filter((c) => c.isHidden),

        searchCards: (query) => {
            const lowerQuery = query.toLowerCase();
            return get().cards.filter(
                (c) =>
                    c.title?.toLowerCase().includes(lowerQuery) ||
                    c.content.toLowerCase().includes(lowerQuery)
            );
        },
    }))
);
