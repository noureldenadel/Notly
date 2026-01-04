import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SearchResult } from './types';

interface SearchFilters {
    types: string[];
    tags: string[];
    projectId?: string;
    dateFrom?: number;
    dateTo?: number;
}

interface SearchState {
    // Search state
    query: string;
    results: SearchResult[];
    isSearching: boolean;
    filters: SearchFilters;

    // Recent searches
    recentSearches: string[];

    // Actions
    setQuery: (query: string) => void;
    setResults: (results: SearchResult[]) => void;
    setIsSearching: (isSearching: boolean) => void;
    clearResults: () => void;

    // Filter actions
    setFilters: (filters: Partial<SearchFilters>) => void;
    clearFilters: () => void;
    toggleTypeFilter: (type: string) => void;
    toggleTagFilter: (tagId: string) => void;

    // Recent search actions
    addRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;

    // Getters
    hasActiveFilters: () => boolean;
    getFilteredResults: () => SearchResult[];
}

const DEFAULT_FILTERS: SearchFilters = {
    types: [],
    tags: [],
};

const MAX_RECENT_SEARCHES = 10;

export const useSearchStore = create<SearchState>()(
    immer((set, get) => ({
        // Initial state
        query: '',
        results: [],
        isSearching: false,
        filters: { ...DEFAULT_FILTERS },
        recentSearches: [],

        // Actions
        setQuery: (query) => {
            set((state) => {
                state.query = query;
            });
        },

        setResults: (results) => {
            set((state) => {
                state.results = results;
                state.isSearching = false;
            });
        },

        setIsSearching: (isSearching) => {
            set((state) => {
                state.isSearching = isSearching;
            });
        },

        clearResults: () => {
            set((state) => {
                state.results = [];
                state.query = '';
                state.isSearching = false;
            });
        },

        // Filter actions
        setFilters: (filters) => {
            set((state) => {
                Object.assign(state.filters, filters);
            });
        },

        clearFilters: () => {
            set((state) => {
                state.filters = { ...DEFAULT_FILTERS };
            });
        },

        toggleTypeFilter: (type) => {
            set((state) => {
                const index = state.filters.types.indexOf(type);
                if (index >= 0) {
                    state.filters.types.splice(index, 1);
                } else {
                    state.filters.types.push(type);
                }
            });
        },

        toggleTagFilter: (tagId) => {
            set((state) => {
                const index = state.filters.tags.indexOf(tagId);
                if (index >= 0) {
                    state.filters.tags.splice(index, 1);
                } else {
                    state.filters.tags.push(tagId);
                }
            });
        },

        // Recent search actions
        addRecentSearch: (query) => {
            if (!query.trim()) return;
            set((state) => {
                // Remove if exists
                state.recentSearches = state.recentSearches.filter((s) => s !== query);
                // Add to front
                state.recentSearches.unshift(query);
                // Limit size
                if (state.recentSearches.length > MAX_RECENT_SEARCHES) {
                    state.recentSearches = state.recentSearches.slice(0, MAX_RECENT_SEARCHES);
                }
            });
        },

        clearRecentSearches: () => {
            set((state) => {
                state.recentSearches = [];
            });
        },

        // Getters
        hasActiveFilters: () => {
            const { filters } = get();
            return (
                filters.types.length > 0 ||
                filters.tags.length > 0 ||
                filters.projectId !== undefined ||
                filters.dateFrom !== undefined ||
                filters.dateTo !== undefined
            );
        },

        getFilteredResults: () => {
            const { results, filters } = get();
            return results.filter((result) => {
                // Type filter
                if (filters.types.length > 0 && !filters.types.includes(result.entityType)) {
                    return false;
                }
                return true;
            });
        },
    }))
);
