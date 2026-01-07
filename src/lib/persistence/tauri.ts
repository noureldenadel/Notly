/**
 * Tauri SQLite Persistence Adapter
 * Used when running as Tauri desktop app
 */

import { invoke } from '@tauri-apps/api/core';
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

// Tauri SQLite Persistence Implementation
export const tauriAdapter: PersistenceAPI = {
    async init() {
        try {
            await invoke('init_database', { dbPath: 'database.db' });
            await invoke('ensure_directory_structure');
            console.log('[Persistence] Initialized Tauri SQLite adapter');
        } catch (e) {
            console.error('[Persistence] Error initializing Tauri adapter:', e);
            throw e;
        }
    },

    // Projects
    async getProjects(): Promise<Project[]> {
        try {
            return await invoke('get_projects');
        } catch (e) {
            console.error('[Persistence] Error getting projects:', e);
            return [];
        }
    },
    async saveProject(project: Project): Promise<void> {
        try {
            await invoke('create_project', {
                id: project.id,
                title: project.title,
                description: project.description,
                color: project.color,
            });
        } catch (e) {
            console.error('[Persistence] Error saving project:', e);
        }
    },
    async deleteProject(id: string): Promise<void> {
        try {
            await invoke('delete_project', { id });
        } catch (e) {
            console.error('[Persistence] Error deleting project:', e);
        }
    },

    // Boards
    async getBoards(projectId?: string): Promise<Board[]> {
        try {
            return await invoke('get_boards', { projectId: projectId || '' });
        } catch (e) {
            console.error('[Persistence] Error getting boards:', e);
            return [];
        }
    },
    async saveBoard(board: Board): Promise<void> {
        try {
            await invoke('create_board', {
                id: board.id,
                projectId: board.projectId,
                title: board.title,
                position: board.position,
            });
        } catch (e) {
            console.error('[Persistence] Error saving board:', e);
        }
    },
    async deleteBoard(_id: string): Promise<void> {
        // Not implemented in Rust yet
        console.warn('[Persistence] deleteBoard not implemented in Tauri');
    },

    // Cards
    async getCards(): Promise<Card[]> {
        try {
            return await invoke('get_cards');
        } catch (e) {
            console.error('[Persistence] Error getting cards:', e);
            return [];
        }
    },
    async saveCard(card: Card): Promise<void> {
        try {
            await invoke('create_card', {
                id: card.id,
                title: card.title,
                content: card.content,
            });
        } catch (e) {
            console.error('[Persistence] Error saving card:', e);
        }
    },
    async deleteCard(id: string): Promise<void> {
        try {
            await invoke('delete_card', { id });
        } catch (e) {
            console.error('[Persistence] Error deleting card:', e);
        }
    },

    // Canvas Snapshots
    async saveCanvasSnapshot(boardId: string, snapshot: string): Promise<void> {
        try {
            await invoke('save_canvas_snapshot', { boardId, snapshot });
        } catch (e) {
            console.error('[Persistence] Error saving canvas snapshot:', e);
        }
    },
    async loadCanvasSnapshot(boardId: string): Promise<string | null> {
        try {
            return await invoke('load_canvas_snapshot', { boardId });
        } catch (e) {
            console.error('[Persistence] Error loading canvas snapshot:', e);
            return null;
        }
    },

    // Files - stub implementations (not fully implemented in Rust yet)
    async getFiles(): Promise<FileEntry[]> {
        return [];
    },
    async saveFile(_file: FileEntry): Promise<void> {
        console.warn('[Persistence] saveFile not implemented in Tauri');
    },
    async deleteFile(_id: string): Promise<void> {
        console.warn('[Persistence] deleteFile not implemented in Tauri');
    },

    // Tags - stub implementations
    async getTags(): Promise<Tag[]> {
        return [];
    },
    async saveTag(_tag: Tag): Promise<void> {
        console.warn('[Persistence] saveTag not implemented in Tauri');
    },
    async deleteTag(_id: string): Promise<void> {
        console.warn('[Persistence] deleteTag not implemented in Tauri');
    },

    // Highlights - stub implementations
    async getHighlights(): Promise<Highlight[]> {
        return [];
    },
    async saveHighlight(_highlight: Highlight): Promise<void> {
        console.warn('[Persistence] saveHighlight not implemented in Tauri');
    },
    async deleteHighlight(_id: string): Promise<void> {
        console.warn('[Persistence] deleteHighlight not implemented in Tauri');
    },

    // Favorites - stub implementations
    async getFavorites(): Promise<Favorite[]> {
        return [];
    },
    async saveFavorite(_favorite: Favorite): Promise<void> {
        console.warn('[Persistence] saveFavorite not implemented in Tauri');
    },
    async deleteFavorite(_id: string): Promise<void> {
        console.warn('[Persistence] deleteFavorite not implemented in Tauri');
    },
};
