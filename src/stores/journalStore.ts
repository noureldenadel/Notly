import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface JournalEntry {
    id: string;
    date: string; // YYYY-MM-DD format
    content: string; // TipTap HTML
    wordCount: number;
    createdAt: number;
    updatedAt: number;
}

interface JournalState {
    // State
    entries: Record<string, JournalEntry>; // Keyed by date
    currentDate: string;
    isLoaded: boolean;

    // Actions
    setCurrentDate: (date: string) => void;
    getEntry: (date: string) => JournalEntry | null;
    saveEntry: (date: string, content: string) => void;
    deleteEntry: (date: string) => void;

    // Helpers
    getDatesWithEntries: (year: number, month: number) => string[];
    getRecentEntries: (limit?: number) => JournalEntry[];
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

// Format date for display
export function formatJournalDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export const useJournalStore = create<JournalState>()(
    persist(
        immer((set, get) => ({
            // Initial state
            entries: {},
            currentDate: getTodayDate(),
            isLoaded: true,

            // Actions
            setCurrentDate: (date) => {
                set((state) => {
                    state.currentDate = date;
                });
            },

            getEntry: (date) => {
                return get().entries[date] || null;
            },

            saveEntry: (date, content) => {
                const now = Date.now();
                const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

                set((state) => {
                    const existing = state.entries[date];
                    if (existing) {
                        existing.content = content;
                        existing.wordCount = wordCount;
                        existing.updatedAt = now;
                    } else {
                        state.entries[date] = {
                            id: crypto.randomUUID(),
                            date,
                            content,
                            wordCount,
                            createdAt: now,
                            updatedAt: now,
                        };
                    }
                });

                console.log('[JournalStore] Saved entry for:', date);
            },

            deleteEntry: (date) => {
                set((state) => {
                    delete state.entries[date];
                });
            },

            // Helpers
            getDatesWithEntries: (year, month) => {
                const entries = get().entries;
                const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
                return Object.keys(entries)
                    .filter(date => date.startsWith(prefix))
                    .sort();
            },

            getRecentEntries: (limit = 10) => {
                return Object.values(get().entries)
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, limit);
            },
        })),
        {
            name: 'visual-thinking-journal',
            version: 1,
        }
    )
);

// Selector hooks
export const useCurrentJournalEntry = () => {
    const { currentDate, entries } = useJournalStore();
    return entries[currentDate] || null;
};

export const useJournalDate = () => useJournalStore((state) => state.currentDate);
