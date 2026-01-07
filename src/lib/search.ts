import MiniSearch, { SearchResult } from 'minisearch';

// Document types that can be indexed
export type SearchableType = 'card' | 'file' | 'highlight' | 'project' | 'board';

// Document structure for search index
export interface SearchDocument {
    id: string;
    type: SearchableType;
    title: string;
    content: string;
    tags: string;
    filename?: string;
    preview?: string;
    projectId?: string;
    createdAt?: number;
    updatedAt?: number;
}

// Search result with additional metadata
export interface SearchResultItem extends SearchResult {
    type: SearchableType;
    title: string;
    preview?: string;
}

// Search options for filtering
export interface SearchOptions {
    types?: SearchableType[];
    projectId?: string;
    limit?: number;
}

// Initialize MiniSearch with configuration
const searchIndex = new MiniSearch<SearchDocument>({
    fields: ['title', 'content', 'tags', 'filename'], // Fields to index for search
    storeFields: ['id', 'type', 'title', 'preview', 'projectId'], // Fields to return in results
    searchOptions: {
        boost: { title: 3, tags: 2, content: 1 }, // Title matches are most important
        fuzzy: 0.2, // Allow fuzzy matching with 20% tolerance
        prefix: true, // Enable prefix search (search as you type)
    },
});

// Track indexed document IDs
const indexedIds = new Set<string>();

/**
 * Add a document to the search index
 */
export function indexDocument(doc: SearchDocument): void {
    if (indexedIds.has(doc.id)) {
        // Update existing document
        searchIndex.replace(doc);
    } else {
        // Add new document
        searchIndex.add(doc);
        indexedIds.add(doc.id);
    }
}

/**
 * Add multiple documents to the search index
 */
export function indexDocuments(docs: SearchDocument[]): void {
    docs.forEach(doc => indexDocument(doc));
}

/**
 * Remove a document from the search index
 */
export function removeDocument(id: string): void {
    if (indexedIds.has(id)) {
        searchIndex.discard(id);
        indexedIds.delete(id);
    }
}

/**
 * Clear all documents from the search index
 */
export function clearIndex(): void {
    searchIndex.removeAll();
    indexedIds.clear();
}

/**
 * Search the index with optional filters
 */
export function search(query: string, options: SearchOptions = {}): SearchResultItem[] {
    if (!query.trim()) {
        return [];
    }

    const results = searchIndex.search(query, {
        fuzzy: 0.2,
        prefix: true,
    }) as SearchResultItem[];

    // Apply type filter
    let filtered = results;
    if (options.types && options.types.length > 0) {
        filtered = filtered.filter(r => options.types!.includes(r.type));
    }

    // Apply project filter
    if (options.projectId) {
        filtered = filtered.filter(r => r.projectId === options.projectId);
    }

    // Apply limit
    if (options.limit) {
        filtered = filtered.slice(0, options.limit);
    }

    return filtered;
}

/**
 * Get search suggestions based on partial query
 */
export function getSuggestions(query: string, limit = 5): string[] {
    if (!query.trim()) {
        return [];
    }

    const results = searchIndex.autoSuggest(query, { fuzzy: 0.2 });
    return results.slice(0, limit).map(r => r.suggestion);
}

/**
 * Group search results by type
 */
export function groupResultsByType(results: SearchResultItem[]): Record<SearchableType, SearchResultItem[]> {
    const grouped: Record<SearchableType, SearchResultItem[]> = {
        card: [],
        file: [],
        highlight: [],
        project: [],
        board: [],
    };

    results.forEach(result => {
        grouped[result.type].push(result);
    });

    return grouped;
}

/**
 * Get the total number of indexed documents
 */
export function getIndexSize(): number {
    return indexedIds.size;
}

// Export the search index for advanced usage
export { searchIndex };
