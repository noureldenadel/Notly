/**
 * localStorage Persistence Adapter
 * Used when running in web mode (not Tauri)
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

const STORAGE_KEYS = {
    projects: 'fikri_projects',
    boards: 'fikri_boards',
    cards: 'fikri_cards',
    files: 'fikri_files',
    tags: 'fikri_tags',
    highlights: 'fikri_highlights',
    favorites: 'fikri_favorites',
    canvasSnapshots: 'fikri_canvas_snapshots',
} as const;

// Generic localStorage helpers
function getItems<T>(key: string): T[] {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`[Persistence] Error reading ${key}:`, e);
        return [];
    }
}

function setItems<T>(key: string, items: T[]): void {
    try {
        localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
        console.error(`[Persistence] Error writing ${key}:`, e);
    }
}

function saveItem<T extends { id: string }>(key: string, item: T): void {
    const items = getItems<T>(key);
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
        items[index] = item;
    } else {
        items.push(item);
    }
    setItems(key, items);
}

function deleteItem(key: string, id: string): void {
    const items = getItems<{ id: string }>(key);
    setItems(key, items.filter(i => i.id !== id));
}

// localStorage Persistence Implementation
export const localStorageAdapter: PersistenceAPI = {
    async init() {
        console.log('[Persistence] Initialized localStorage adapter');
    },

    // Projects
    async getProjects(): Promise<Project[]> {
        return getItems<Project>(STORAGE_KEYS.projects);
    },
    async saveProject(project: Project): Promise<void> {
        saveItem(STORAGE_KEYS.projects, project);
    },
    async deleteProject(id: string): Promise<void> {
        deleteItem(STORAGE_KEYS.projects, id);
    },

    // Boards
    async getBoards(projectId?: string): Promise<Board[]> {
        const boards = getItems<Board>(STORAGE_KEYS.boards);
        return projectId ? boards.filter(b => b.projectId === projectId) : boards;
    },
    async saveBoard(board: Board): Promise<void> {
        saveItem(STORAGE_KEYS.boards, board);
    },
    async deleteBoard(id: string): Promise<void> {
        deleteItem(STORAGE_KEYS.boards, id);
    },

    // Cards
    async getCards(): Promise<Card[]> {
        return getItems<Card>(STORAGE_KEYS.cards);
    },
    async saveCard(card: Card): Promise<void> {
        saveItem(STORAGE_KEYS.cards, card);
    },
    async deleteCard(id: string): Promise<void> {
        deleteItem(STORAGE_KEYS.cards, id);
    },

    // Canvas Snapshots
    async saveCanvasSnapshot(boardId: string, snapshot: string): Promise<void> {
        const snapshots = getItems<{ boardId: string; snapshot: string }>(STORAGE_KEYS.canvasSnapshots);
        const index = snapshots.findIndex(s => s.boardId === boardId);
        if (index >= 0) {
            snapshots[index].snapshot = snapshot;
        } else {
            snapshots.push({ boardId, snapshot });
        }
        setItems(STORAGE_KEYS.canvasSnapshots, snapshots);
    },
    async loadCanvasSnapshot(boardId: string): Promise<string | null> {
        const snapshots = getItems<{ boardId: string; snapshot: string }>(STORAGE_KEYS.canvasSnapshots);
        const found = snapshots.find(s => s.boardId === boardId);
        return found?.snapshot ?? null;
    },

    // Files
    async getFiles(): Promise<FileEntry[]> {
        return getItems<FileEntry>(STORAGE_KEYS.files);
    },
    async saveFile(file: FileEntry): Promise<void> {
        saveItem(STORAGE_KEYS.files, file);
    },
    async deleteFile(id: string): Promise<void> {
        deleteItem(STORAGE_KEYS.files, id);
    },

    // Tags
    async getTags(): Promise<Tag[]> {
        return getItems<Tag>(STORAGE_KEYS.tags);
    },
    async saveTag(tag: Tag): Promise<void> {
        saveItem(STORAGE_KEYS.tags, tag);
    },
    async deleteTag(id: string): Promise<void> {
        deleteItem(STORAGE_KEYS.tags, id);
    },

    // Highlights
    async getHighlights(): Promise<Highlight[]> {
        return getItems<Highlight>(STORAGE_KEYS.highlights);
    },
    async saveHighlight(highlight: Highlight): Promise<void> {
        saveItem(STORAGE_KEYS.highlights, highlight);
    },
    async deleteHighlight(id: string): Promise<void> {
        deleteItem(STORAGE_KEYS.highlights, id);
    },

    // Favorites
    async getFavorites(): Promise<Favorite[]> {
        return getItems<Favorite>(STORAGE_KEYS.favorites);
    },
    async saveFavorite(favorite: Favorite): Promise<void> {
        saveItem(STORAGE_KEYS.favorites, favorite);
    },
    async deleteFavorite(id: string): Promise<void> {
        deleteItem(STORAGE_KEYS.favorites, id);
    },
};
