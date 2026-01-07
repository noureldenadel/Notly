/**
 * Persistence Types
 * Shared types for the persistence layer
 */

// Core entity types matching the SQLite schema
export interface Project {
    id: string;
    title: string;
    description?: string;
    thumbnailPath?: string;
    color?: string;
    createdAt: number;
    updatedAt: number;
    settings?: string; // JSON
}

export interface Board {
    id: string;
    projectId: string;
    parentBoardId?: string;
    title: string;
    position: number;
    tldrawSnapshot?: string; // JSON
    createdAt: number;
    updatedAt: number;
}

export interface Card {
    id: string;
    title?: string;
    content: string;
    contentType: string;
    color?: string;
    isHidden: boolean;
    wordCount: number;
    createdAt: number;
    updatedAt: number;
    metadata?: string; // JSON
}

export interface FileEntry {
    id: string;
    filename: string;
    filePath: string;
    fileType: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailPath?: string;
    importMode: string;
    createdAt: number;
    updatedAt: number;
    metadata?: string; // JSON
}

export interface Tag {
    id: string;
    name: string;
    color?: string;
    groupId?: string;
    position: number;
    createdAt: number;
}

export interface Highlight {
    id: string;
    sourceType: string;
    sourceId: string;
    highlightType?: string;
    content?: string;
    note?: string;
    color?: string;
    pageNumber?: number;
    position?: string; // JSON
    createdAt: number;
    updatedAt: number;
}

export interface Favorite {
    id: string;
    entityType: string;
    entityId: string;
    folderId?: string;
    position: number;
    createdAt: number;
}

// Persistence API interface
export interface PersistenceAPI {
    // Initialization
    init(): Promise<void>;

    // Projects
    getProjects(): Promise<Project[]>;
    saveProject(project: Project): Promise<void>;
    deleteProject(id: string): Promise<void>;

    // Boards
    getBoards(projectId?: string): Promise<Board[]>;
    saveBoard(board: Board): Promise<void>;
    deleteBoard(id: string): Promise<void>;

    // Cards
    getCards(): Promise<Card[]>;
    saveCard(card: Card): Promise<void>;
    deleteCard(id: string): Promise<void>;

    // Canvas Snapshots
    saveCanvasSnapshot(boardId: string, snapshot: string): Promise<void>;
    loadCanvasSnapshot(boardId: string): Promise<string | null>;

    // Files
    getFiles(): Promise<FileEntry[]>;
    saveFile(file: FileEntry): Promise<void>;
    deleteFile(id: string): Promise<void>;

    // Tags
    getTags(): Promise<Tag[]>;
    saveTag(tag: Tag): Promise<void>;
    deleteTag(id: string): Promise<void>;

    // Highlights
    getHighlights(): Promise<Highlight[]>;
    saveHighlight(highlight: Highlight): Promise<void>;
    deleteHighlight(id: string): Promise<void>;

    // Favorites
    getFavorites(): Promise<Favorite[]>;
    saveFavorite(favorite: Favorite): Promise<void>;
    deleteFavorite(id: string): Promise<void>;
}
