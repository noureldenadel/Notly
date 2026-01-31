/**
 * SQLite FTS5 Full-Text Search Integration
 * Provides frontend wrapper for FTS5 search commands via Tauri
 */

import { invoke } from '@tauri-apps/api/core';
import { createLogger } from '@/lib/logger';

const log = createLogger('FTS5');

export interface FTSSearchResult {
    entityType: string;
    entityId: string;
    title: string;
    snippet: string;
    rank: number;
}

export interface FTSSearchFilters {
    types?: string[];
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
        log.warn('Not running in Tauri, returning empty results');
        return [];
    }

    if (!query.trim()) {
        return [];
    }

    try {
        const results = await invoke<FTSSearchResult[]>('fts_search', {
            query: query.trim(),
            types: filters.types || [],
            limit: filters.limit || 50,
        });

        log.debug('Search results:', results.length);
        return results;
    } catch (error) {
        log.error('Search error:', error);
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
        log.debug('Indexed card:', cardId);
    } catch (error) {
        log.error('Index card error:', error);
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
        log.debug('Indexed journal:', date);
    } catch (error) {
        log.error('Index journal error:', error);
    }
}

/**
 * Remove an entity from FTS5 index
 */
export async function ftsRemoveEntity(entityType: string, entityId: string): Promise<void> {
    if (!isTauri) return;

    try {
        await invoke('fts_remove_entity', { entityType, entityId });
        log.debug('Removed from index:', entityType, entityId);
    } catch (error) {
        log.error('Remove entity error:', error);
    }
}

/**
 * Rebuild entire FTS5 index
 */
export async function ftsRebuildIndex(): Promise<void> {
    if (!isTauri) return;

    try {
        await invoke('fts_rebuild_index');
        log.debug('Index rebuilt successfully');
    } catch (error) {
        log.error('Rebuild index error:', error);
    }
}

// Helper: Strip HTML tags from content
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
