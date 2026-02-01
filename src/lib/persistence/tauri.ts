/**
 * Tauri SQLite Persistence Adapter
 * Used when running as Tauri desktop app
 */

import Database from '@tauri-apps/plugin-sql';
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
import { createLogger } from '@/lib/logger';

const log = createLogger('TauriPersistence');

// Helpers for SQL query construction
const now = () => Date.now();

// DB Row Interfaces
interface ProjectRow {
    id: string;
    title: string;
    description: string | null;
    thumbnail_path: string | null;
    color: string | null;
    created_at: number;
    updated_at: number;
    settings: string | null;
}

interface BoardRow {
    id: string;
    project_id: string;
    parent_board_id: string | null;
    title: string;
    position: number;
    tldraw_snapshot: string | null;
    created_at: number;
    updated_at: number;
}

interface CardRow {
    id: string;
    title: string | null;
    content: string;
    content_type: string;
    color: string | null;
    is_hidden: number;
    word_count: number;
    created_at: number;
    updated_at: number;
    metadata: string | null;
}

interface FileRow {
    id: string;
    filename: string;
    file_path: string;
    file_type: string;
    file_size: number | null;
    mime_type: string | null;
    thumbnail_path: string | null;
    import_mode: string;
    created_at: number;
    updated_at: number;
    metadata: string | null;
}


// Tauri SQLite Persistence Implementation
export const tauriAdapter: PersistenceAPI = {
    async init() {
        try {
            // Initialize database tables
            const db = await Database.load('sqlite:database.db');

            // Projects Table
            await db.execute(`
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT,
                    thumbnail_path TEXT,
                    color TEXT,
                    created_at INTEGER,
                    updated_at INTEGER,
                    settings TEXT
                )
            `);

            // Boards Table
            await db.execute(`
                CREATE TABLE IF NOT EXISTS boards (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    parent_board_id TEXT,
                    title TEXT NOT NULL,
                    position INTEGER DEFAULT 0,
                    tldraw_snapshot TEXT,
                    created_at INTEGER,
                    updated_at INTEGER,
                    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
                )
            `);

            // Cards Table
            await db.execute(`
                CREATE TABLE IF NOT EXISTS cards (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    content TEXT,
                    content_type TEXT,
                    color TEXT,
                    is_hidden INTEGER DEFAULT 0,
                    word_count INTEGER DEFAULT 0,
                    created_at INTEGER,
                    updated_at INTEGER,
                    metadata TEXT
                )
            `);

            // Files Table
            await db.execute(`
                CREATE TABLE IF NOT EXISTS files (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_type TEXT,
                    file_size INTEGER,
                    mime_type TEXT,
                    thumbnail_path TEXT,
                    import_mode TEXT,
                    created_at INTEGER,
                    updated_at INTEGER,
                    metadata TEXT
                )
            `);

            // Ensure directory structure (keep using the Rust command for FS ops)
            await invoke('ensure_directory_structure');

            log.info('Initialized Tauri SQLite adapter');
        } catch (e) {
            log.error('Error initializing Tauri adapter:', e);
            throw e;
        }
    },

    // Projects
    async getProjects(): Promise<Project[]> {
        try {
            const db = await Database.load('sqlite:database.db');
            const rows = await db.select<ProjectRow[]>('SELECT * FROM projects ORDER BY updated_at DESC');
            return rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                thumbnailPath: row.thumbnail_path,
                color: row.color,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                settings: row.settings
            }));
        } catch (e) {
            log.error('Error getting projects:', e);
            return [];
        }
    },
    async saveProject(project: Project): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            await db.execute(
                `INSERT OR REPLACE INTO projects (id, title, description, thumbnail_path, color, created_at, updated_at, settings)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    project.id,
                    project.title,
                    project.description,
                    project.thumbnailPath,
                    project.color,
                    project.createdAt,
                    project.updatedAt,
                    project.settings
                ]
            );
        } catch (e) {
            log.error('Error saving project:', e);
        }
    },
    async deleteProject(id: string): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            await db.execute('DELETE FROM projects WHERE id = $1', [id]);
        } catch (e) {
            log.error('Error deleting project:', e);
        }
    },

    // Boards
    async getBoards(projectId?: string): Promise<Board[]> {
        try {
            const db = await Database.load('sqlite:database.db');
            let query = 'SELECT * FROM boards';
            const params: (string | number | null)[] = [];

            if (projectId) {
                query += ' WHERE project_id = $1';
                params.push(projectId);
            }
            query += ' ORDER BY position ASC';

            const rows = await db.select<BoardRow[]>(query, params);
            return rows.map(row => ({
                id: row.id,
                projectId: row.project_id,
                parentBoardId: row.parent_board_id,
                title: row.title,
                position: row.position,
                tldrawSnapshot: row.tldraw_snapshot,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        } catch (e) {
            log.error('Error getting boards:', e);
            return [];
        }
    },
    async saveBoard(board: Board): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            // Check if board exists to preserve snapshot if not provided in update
            // (Though typically saveBoard updates the whole object. For snapshot, we have saveCanvasSnapshot)

            await db.execute(
                `INSERT INTO boards (id, project_id, parent_board_id, title, position, created_at, updated_at, tldraw_snapshot)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT(id) DO UPDATE SET
                    project_id = excluded.project_id,
                    parent_board_id = excluded.parent_board_id,
                    title = excluded.title,
                    position = excluded.position,
                    updated_at = excluded.updated_at
                    -- Don't overwrite snapshot here unless explicitly needed, 
                    -- but typically saveCanvasSnapshot handles the snapshot column separately 
                    -- or we include it if 'board.tldrawSnapshot' is set.
                `,
                [
                    board.id,
                    board.projectId,
                    board.parentBoardId,
                    board.title,
                    board.position,
                    board.createdAt,
                    board.updatedAt,
                    board.tldrawSnapshot
                ]
            );

            // If we have a snapshot, we should ensure it's saved (the ON CONFLICT clause above might skip it if we just did the partial update logic)
            // But simplify: standard upsert
            if (board.tldrawSnapshot) {
                await db.execute(
                    `UPDATE boards SET tldraw_snapshot = $1 WHERE id = $2`,
                    [board.tldrawSnapshot, board.id]
                );
            }

        } catch (e) {
            log.error('Error saving board:', e);
        }
    },
    async deleteBoard(id: string): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            await db.execute('DELETE FROM boards WHERE id = $1', [id]);
        } catch (e) {
            log.error('Error deleting board:', e);
        }
    },

    // Cards
    async getCards(): Promise<Card[]> {
        try {
            const db = await Database.load('sqlite:database.db');
            const rows = await db.select<CardRow[]>('SELECT * FROM cards');
            return rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                color: row.color,
                isHidden: Boolean(row.is_hidden),
                wordCount: row.word_count,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                metadata: row.metadata
            }));
        } catch (e) {
            log.error('Error getting cards:', e);
            return [];
        }
    },
    async saveCard(card: Card): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            await db.execute(
                `INSERT OR REPLACE INTO cards (id, title, content, content_type, color, is_hidden, word_count, created_at, updated_at, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    card.id,
                    card.title,
                    card.content,
                    card.contentType,
                    card.color,
                    card.isHidden ? 1 : 0,
                    card.wordCount,
                    card.createdAt,
                    card.updatedAt,
                    card.metadata
                ]
            );
        } catch (e) {
            log.error('Error saving card:', e);
        }
    },
    async deleteCard(id: string): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            await db.execute('DELETE FROM cards WHERE id = $1', [id]);
        } catch (e) {
            log.error('Error deleting card:', e);
        }
    },

    // Canvas Snapshots
    async saveCanvasSnapshot(boardId: string, snapshot: string): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            await db.execute(
                'UPDATE boards SET tldraw_snapshot = $1, updated_at = $2 WHERE id = $3',
                [snapshot, now(), boardId]
            );
            log.debug('Saved snapshot for board:', boardId);
        } catch (e) {
            log.error('Error saving canvas snapshot:', e);
        }
    },
    async loadCanvasSnapshot(boardId: string): Promise<string | null> {
        try {
            const db = await Database.load('sqlite:database.db');
            const rows = await db.select<any[]>('SELECT tldraw_snapshot FROM boards WHERE id = $1', [boardId]);
            if (rows.length > 0 && rows[0].tldraw_snapshot) {
                return rows[0].tldraw_snapshot;
            }
            return null;
        } catch (e) {
            log.error('Error loading canvas snapshot:', e);
            return null;
        }
    },

    // Files
    async getFiles(): Promise<FileEntry[]> {
        try {
            const db = await Database.load('sqlite:database.db');
            const rows = await db.select<FileRow[]>('SELECT * FROM files ORDER BY created_at DESC');
            return rows.map(row => ({
                id: row.id,
                filename: row.filename,
                filePath: row.file_path,
                fileType: row.file_type,
                fileSize: row.file_size,
                mimeType: row.mime_type,
                thumbnailPath: row.thumbnail_path,
                importMode: row.import_mode,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                metadata: row.metadata
            }));
        } catch (e) {
            log.error('Error getting files:', e);
            return [];
        }
    },
    async saveFile(file: FileEntry): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            await db.execute(
                `INSERT OR REPLACE INTO files (id, filename, file_path, file_type, file_size, mime_type, thumbnail_path, import_mode, created_at, updated_at, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    file.id,
                    file.filename,
                    file.filePath,
                    file.fileType,
                    file.fileSize,
                    file.mimeType,
                    file.thumbnailPath,
                    file.importMode,
                    file.createdAt,
                    file.updatedAt,
                    file.metadata
                ]
            );
        } catch (e) {
            log.error('Error saving file:', e);
        }
    },
    async deleteFile(id: string): Promise<void> {
        try {
            const db = await Database.load('sqlite:database.db');
            await db.execute('DELETE FROM files WHERE id = $1', [id]);
        } catch (e) {
            log.error('Error deleting file:', e);
        }
    },

    // Tags - stub implementations
    async getTags(): Promise<Tag[]> {
        return [];
    },
    async saveTag(_tag: Tag): Promise<void> {
        log.warn('saveTag not implemented');
    },
    async deleteTag(_id: string): Promise<void> {
        log.warn('deleteTag not implemented');
    },

    // Highlights - stub implementations
    async getHighlights(): Promise<Highlight[]> {
        return [];
    },
    async saveHighlight(_highlight: Highlight): Promise<void> {
        log.warn('saveHighlight not implemented');
    },
    async deleteHighlight(_id: string): Promise<void> {
        log.warn('deleteHighlight not implemented');
    },

    // Favorites - stub implementations
    async getFavorites(): Promise<Favorite[]> {
        return [];
    },
    async saveFavorite(_favorite: Favorite): Promise<void> {
        log.warn('saveFavorite not implemented');
    },
    async deleteFavorite(_id: string): Promise<void> {
        log.warn('deleteFavorite not implemented');
    },
};
