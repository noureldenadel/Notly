import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Card } from './types';

interface CardState {
    // Data
    cards: Card[];

    // Actions
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

export const useCardStore = create<CardState>()(
    immer((set, get) => ({
        // Initial state
        cards: [],

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
                }
            });
        },

        deleteCard: (id) => {
            set((state) => {
                state.cards = state.cards.filter((c) => c.id !== id);
            });
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
                }
            });
        },

        updateCardTitle: (id, title) => {
            set((state) => {
                const card = state.cards.find((c) => c.id === id);
                if (card) {
                    card.title = title;
                    card.updatedAt = Date.now();
                }
            });
        },

        toggleCardHidden: (id) => {
            set((state) => {
                const card = state.cards.find((c) => c.id === id);
                if (card) {
                    card.isHidden = !card.isHidden;
                    card.updatedAt = Date.now();
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
