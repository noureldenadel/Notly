/**
 * IndexedDB Persistence Adapter
 * Used when running in web mode (not Tauri) - replaces localStorage for better capacity
 */

import type {
    PersistenceAPI,
    Project,
    Board,
    Card,
    FileEntry,
    Tag,
    Highlight,
    Favorite
} from './types';

const DB_NAME = 'fikri_db';
const DB_VERSION = 1;

const STORES = {
    projects: 'projects',
    boards: 'boards',
    cards: 'cards',
    files: 'files',
    tags: 'tags',
    highlights: 'highlights',
    favorites: 'favorites',
    canvasSnapshots: 'canvasSnapshots',
} as const;

// Helper to open DB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('[Persistence] IndexedDB error:', (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            // Create all object stores
            Object.values(STORES).forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    // Use 'id' as key path for all stores except canvasSnapshots potentially?
                    // Reviewing types: most have 'id'. 
                    // canvasSnapshots interface: { boardId, snapshot } -> we can use boardId as key or composite.
                    // Let's use 'id' for entities. For snapshots, we'll store objects with 'boardId' and use 'boardId' as key.

                    if (storeName === 'canvasSnapshots') {
                        db.createObjectStore(storeName, { keyPath: 'boardId' });
                    } else {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                }
            });
        };
    });
}

// Generic Helpers
async function getAll<T>(storeName: string): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function put<T>(storeName: string, item: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function remove(storeName: string, key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// IndexedDB Persistence Implementation
export const indexeddbAdapter: PersistenceAPI = {
    async init() {
        try {
            await openDB();
            console.log('[Persistence] Initialized IndexedDB adapter');
        } catch (e) {
            console.error('[Persistence] Failed to initialize IndexedDB:', e);
            throw e;
        }
    },

    // Projects
    async getProjects(): Promise<Project[]> {
        return getAll<Project>(STORES.projects);
    },
    async saveProject(project: Project): Promise<void> {
        return put(STORES.projects, project);
    },
    async deleteProject(id: string): Promise<void> {
        return remove(STORES.projects, id);
    },

    // Boards
    async getBoards(projectId?: string): Promise<Board[]> {
        const boards = await getAll<Board>(STORES.boards);
        return projectId ? boards.filter(b => b.projectId === projectId) : boards;
    },
    async saveBoard(board: Board): Promise<void> {
        return put(STORES.boards, board);
    },
    async deleteBoard(id: string): Promise<void> {
        return remove(STORES.boards, id);
    },

    // Cards
    async getCards(): Promise<Card[]> {
        return getAll<Card>(STORES.cards);
    },
    async saveCard(card: Card): Promise<void> {
        return put(STORES.cards, card);
    },
    async deleteCard(id: string): Promise<void> {
        return remove(STORES.cards, id);
    },

    // Canvas Snapshots
    async saveCanvasSnapshot(boardId: string, snapshot: string): Promise<void> {
        return put(STORES.canvasSnapshots, { boardId, snapshot });
    },
    async loadCanvasSnapshot(boardId: string): Promise<string | null> {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.canvasSnapshots, 'readonly');
            const store = transaction.objectStore(STORES.canvasSnapshots);
            const request = store.get(boardId);

            request.onsuccess = () => {
                resolve(request.result?.snapshot || null);
            };
            request.onerror = () => reject(request.error);
        });
    },

    // Files
    async getFiles(): Promise<FileEntry[]> {
        return getAll<FileEntry>(STORES.files);
    },
    async saveFile(file: FileEntry): Promise<void> {
        return put(STORES.files, file);
    },
    async deleteFile(id: string): Promise<void> {
        return remove(STORES.files, id);
    },

    // Tags
    async getTags(): Promise<Tag[]> {
        return getAll<Tag>(STORES.tags);
    },
    async saveTag(tag: Tag): Promise<void> {
        return put(STORES.tags, tag);
    },
    async deleteTag(id: string): Promise<void> {
        return remove(STORES.tags, id);
    },

    // Highlights
    async getHighlights(): Promise<Highlight[]> {
        return getAll<Highlight>(STORES.highlights);
    },
    async saveHighlight(highlight: Highlight): Promise<void> {
        return put(STORES.highlights, highlight);
    },
    async deleteHighlight(id: string): Promise<void> {
        return remove(STORES.highlights, id);
    },

    // Favorites
    async getFavorites(): Promise<Favorite[]> {
        return getAll<Favorite>(STORES.favorites);
    },
    async saveFavorite(favorite: Favorite): Promise<void> {
        return put(STORES.favorites, favorite);
    },
    async deleteFavorite(id: string): Promise<void> {
        return remove(STORES.favorites, id);
    },
};
