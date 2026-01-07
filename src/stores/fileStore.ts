import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { FileEntry } from './types';
import type { FileEntry as PFileEntry } from '@/lib/persistence/types';

// Helper to save file to persistence
async function saveFileToPersistence(file: FileEntry) {
    try {
        const { getPersistence } = await import('@/lib/persistence');
        const p = await getPersistence();
        await p.saveFile({
            id: file.id,
            filename: file.filename,
            filePath: file.filePath,
            fileType: file.fileType,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            thumbnailPath: file.thumbnailPath,
            importMode: file.importMode,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            metadata: file.metadata ? JSON.stringify(file.metadata) : undefined,
        });
        console.log('[FileStore] Saved file:', file.id);
    } catch (e) {
        console.error('[FileStore] Error saving file:', e);
    }
}

interface FileState {
    // Data
    files: FileEntry[];
    isLoaded: boolean;

    // Load from persistence
    loadFiles: () => Promise<void>;

    // Actions
    addFile: (
        filename: string,
        filePath: string,
        fileType: FileEntry['fileType'],
        options?: {
            fileSize?: number;
            mimeType?: string;
            thumbnailPath?: string;
            importMode?: 'copy' | 'link';
            metadata?: Record<string, unknown>;
        }
    ) => FileEntry;
    updateFile: (id: string, updates: Partial<Omit<FileEntry, 'id' | 'createdAt'>>) => void;
    deleteFile: (id: string) => void;
    setThumbnail: (id: string, thumbnailPath: string) => void;

    // Getters
    getFile: (id: string) => FileEntry | undefined;
    getFilesByType: (type: FileEntry['fileType']) => FileEntry[];
    getFilesByPath: (pathPattern: string) => FileEntry[];
    getImages: () => FileEntry[];
    getPDFs: () => FileEntry[];
    searchFiles: (query: string) => FileEntry[];
}

export const useFileStore = create<FileState>()(
    immer((set, get) => ({
        // Initial state
        files: [],
        isLoaded: false,

        // Load from persistence
        loadFiles: async () => {
            if (get().isLoaded) return;
            try {
                const { getPersistence } = await import('@/lib/persistence');
                const p = await getPersistence();
                const files = await p.getFiles();
                set((state) => {
                    state.files = files.map((f: PFileEntry) => ({
                        id: f.id,
                        filename: f.filename,
                        filePath: f.filePath,
                        fileType: f.fileType as FileEntry['fileType'],
                        fileSize: f.fileSize,
                        mimeType: f.mimeType,
                        thumbnailPath: f.thumbnailPath,
                        importMode: f.importMode as 'copy' | 'link',
                        createdAt: f.createdAt,
                        updatedAt: f.updatedAt,
                        metadata: f.metadata ? JSON.parse(f.metadata) : undefined,
                    }));
                    state.isLoaded = true;
                });
                console.log('[FileStore] Loaded', files.length, 'files');
            } catch (e) {
                console.error('[FileStore] Error loading files:', e);
                set((state) => { state.isLoaded = true; });
            }
        },

        // Actions
        addFile: (filename, filePath, fileType, options = {}) => {
            const now = Date.now();
            const file: FileEntry = {
                id: nanoid(),
                filename,
                filePath,
                fileType,
                fileSize: options.fileSize,
                mimeType: options.mimeType,
                thumbnailPath: options.thumbnailPath,
                importMode: options.importMode ?? 'copy',
                createdAt: now,
                updatedAt: now,
                metadata: options.metadata,
            };
            set((state) => {
                state.files.push(file);
            });
            saveFileToPersistence(file);
            return file;
        },

        updateFile: (id, updates) => {
            set((state) => {
                const file = state.files.find((f) => f.id === id);
                if (file) {
                    Object.assign(file, updates, { updatedAt: Date.now() });
                    saveFileToPersistence(file);
                }
            });
        },

        deleteFile: (id) => {
            set((state) => {
                state.files = state.files.filter((f) => f.id !== id);
            });
            // Delete from persistence
            (async () => {
                const { getPersistence } = await import('@/lib/persistence');
                const p = await getPersistence();
                await p.deleteFile(id);
            })();
        },

        setThumbnail: (id, thumbnailPath) => {
            set((state) => {
                const file = state.files.find((f) => f.id === id);
                if (file) {
                    file.thumbnailPath = thumbnailPath;
                    file.updatedAt = Date.now();
                    saveFileToPersistence(file);
                }
            });
        },

        // Getters
        getFile: (id) => get().files.find((f) => f.id === id),

        getFilesByType: (type) => get().files.filter((f) => f.fileType === type),

        getFilesByPath: (pathPattern) =>
            get().files.filter((f) => f.filePath.includes(pathPattern)),

        getImages: () => get().files.filter((f) => f.fileType === 'image'),

        getPDFs: () => get().files.filter((f) => f.fileType === 'pdf'),

        searchFiles: (query) => {
            const lowerQuery = query.toLowerCase();
            return get().files.filter((f) => f.filename.toLowerCase().includes(lowerQuery));
        },
    }))
);
