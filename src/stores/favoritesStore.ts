import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type FavoriteType = 'card' | 'file' | 'project' | 'board' | 'tag';

export interface Favorite {
    id: string;
    type: FavoriteType;
    title: string;
    addedAt: number;
}

export interface RecentItem {
    id: string;
    type: FavoriteType;
    title: string;
    accessedAt: number;
}

interface FavoritesState {
    // State
    favorites: Favorite[];
    recents: RecentItem[];

    // Favorite actions
    addFavorite: (id: string, type: FavoriteType, title: string) => void;
    removeFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
    getFavoritesByType: (type: FavoriteType) => Favorite[];
    reorderFavorites: (fromIndex: number, toIndex: number) => void;

    // Recent actions
    addRecent: (id: string, type: FavoriteType, title: string) => void;
    removeRecent: (id: string) => void;
    clearRecents: () => void;
    getRecentsByType: (type?: FavoriteType) => RecentItem[];
}

const MAX_RECENTS = 20;

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        immer((set, get) => ({
            // Initial state
            favorites: [],
            recents: [],

            // Favorite actions
            addFavorite: (id, type, title) => {
                set((state) => {
                    // Don't add if already exists
                    if (state.favorites.some(f => f.id === id)) return;

                    state.favorites.push({
                        id,
                        type,
                        title,
                        addedAt: Date.now(),
                    });
                });
            },

            removeFavorite: (id) => {
                set((state) => {
                    state.favorites = state.favorites.filter(f => f.id !== id);
                });
            },

            isFavorite: (id) => {
                return get().favorites.some(f => f.id === id);
            },

            getFavoritesByType: (type) => {
                return get().favorites.filter(f => f.type === type);
            },

            reorderFavorites: (fromIndex, toIndex) => {
                set((state) => {
                    const [removed] = state.favorites.splice(fromIndex, 1);
                    state.favorites.splice(toIndex, 0, removed);
                });
            },

            // Recent actions
            addRecent: (id, type, title) => {
                set((state) => {
                    // Remove if exists (we'll add it fresh at the top)
                    state.recents = state.recents.filter(r => r.id !== id);

                    // Add to front
                    state.recents.unshift({
                        id,
                        type,
                        title,
                        accessedAt: Date.now(),
                    });

                    // Limit size
                    if (state.recents.length > MAX_RECENTS) {
                        state.recents = state.recents.slice(0, MAX_RECENTS);
                    }
                });
            },

            removeRecent: (id) => {
                set((state) => {
                    state.recents = state.recents.filter(r => r.id !== id);
                });
            },

            clearRecents: () => {
                set((state) => {
                    state.recents = [];
                });
            },

            getRecentsByType: (type) => {
                const recents = get().recents;
                if (!type) return recents;
                return recents.filter(r => r.type === type);
            },
        })),
        {
            name: 'visual-thinking-favorites',
            version: 1,
        }
    )
);

// Selector hooks for convenience
export const useFavorites = () => useFavoritesStore((state) => state.favorites);
export const useRecents = () => useFavoritesStore((state) => state.recents);
