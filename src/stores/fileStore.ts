import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { FileEntry } from './types';

interface FileState {
    // Data
    files: FileEntry[];

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
            return file;
        },

        updateFile: (id, updates) => {
            set((state) => {
                const file = state.files.find((f) => f.id === id);
                if (file) {
                    Object.assign(file, updates, { updatedAt: Date.now() });
                }
            });
        },

        deleteFile: (id) => {
            set((state) => {
                state.files = state.files.filter((f) => f.id !== id);
            });
        },

        setThumbnail: (id, thumbnailPath) => {
            set((state) => {
                const file = state.files.find((f) => f.id === id);
                if (file) {
                    file.thumbnailPath = thumbnailPath;
                    file.updatedAt = Date.now();
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
