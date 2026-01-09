/**
 * SQLite FTS5 Full-Text Search Integration
 * Provides frontend wrapper for FTS5 search commands via Tauri
 */

import { invoke } from '@tauri-apps/api/core';

export interface FTSSearchResult {
    entityType: string;
    entityId: string;
    title: string;
    snippet: string;
    rank: number;
}

export interface FTSSearchFilters {
    types?: string[];
    dateFrom?: number;
    dateTo?: number;
    limit?: number;
}

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * Full-text search using SQLite FTS5
 */
export async function ftsSearch(
    query: string,
    filters: FTSSearchFilters = {}
): Promise<FTSSearchResult[]> {
    if (!isTauri) {
        console.warn('[FTS5] Not running in Tauri, returning empty results');
        return [];
    }

    if (!query.trim()) {
        return [];
    }

    try {
        const results = await invoke<FTSSearchResult[]>('fts_search', {
            query: query.trim(),
            types: filters.types || [],
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            limit: filters.limit || 50,
        });

        console.log('[FTS5] Search results:', results.length);
        return results;
    } catch (error) {
        console.error('[FTS5] Search error:', error);
        return [];
    }
}

/**
 * Index a single card in FTS5
 */
export async function ftsIndexCard(cardId: string, title: string, content: string, tags: string[] = []): Promise<void> {
    if (!isTauri) return;

    try {
        await invoke('fts_index_entity', {
            entityType: 'card',
            entityId: cardId,
            title,
            content: stripHtml(content),
            tags: tags.join(', '),
        });
        console.log('[FTS5] Indexed card:', cardId);
    } catch (error) {
        console.error('[FTS5] Index card error:', error);
    }
}

/**
 * Index a journal entry in FTS5
 */
export async function ftsIndexJournal(date: string, content: string): Promise<void> {
    if (!isTauri) return;

    try {
        await invoke('fts_index_entity', {
            entityType: 'journal',
            entityId: date,
            title: `Journal: ${date}`,
            content: stripHtml(content),
            tags: '',
        });
        console.log('[FTS5] Indexed journal:', date);
    } catch (error) {
        console.error('[FTS5] Index journal error:', error);
    }
}

/**
 * Remove an entity from FTS5 index
 */
export async function ftsRemoveEntity(entityType: string, entityId: string): Promise<void> {
    if (!isTauri) return;

    try {
        await invoke('fts_remove_entity', { entityType, entityId });
        console.log('[FTS5] Removed from index:', entityType, entityId);
    } catch (error) {
        console.error('[FTS5] Remove entity error:', error);
    }
}

/**
 * Rebuild entire FTS5 index
 */
export async function ftsRebuildIndex(): Promise<void> {
    if (!isTauri) return;

    try {
        await invoke('fts_rebuild_index');
        console.log('[FTS5] Index rebuilt successfully');
    } catch (error) {
        console.error('[FTS5] Rebuild index error:', error);
    }
}

// Helper: Strip HTML tags from content
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
