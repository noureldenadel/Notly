import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { FileEntry } from './types';
import type { FileEntry as PFileEntry } from '@/lib/persistence/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('FileStore');

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
        log.debug('Saved file:', file.id);
    } catch (e) {
        log.error('Error saving file:', e);
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
                        metadata: (() => {
                            if (!f.metadata) return undefined;
                            try {
                                return JSON.parse(f.metadata);
                            } catch {
                                log.warn('Failed to parse file metadata for:', f.id);
                                return undefined;
                            }
                        })(),
                    }));
                    state.isLoaded = true;
                });
                log.debug('Loaded', files.length, 'files');
            } catch (e) {
                log.error('Error loading files:', e);
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
                }
            });
            // Move async call outside set()
            const updatedFile = get().getFile(id);
            if (updatedFile) {
                saveFileToPersistence(updatedFile);
            }
        },

        deleteFile: (id) => {
            // Capture file for error recovery
            const fileToDelete = get().getFile(id);

            set((state) => {
                state.files = state.files.filter((f) => f.id !== id);
            });

            // Delete from persistence with error recovery
            (async () => {
                try {
                    const { getPersistence } = await import('@/lib/persistence');
                    const p = await getPersistence();
                    await p.deleteFile(id);
                    log.debug('Deleted file:', id);
                } catch (e) {
                    log.error('Failed to delete file from persistence, restoring:', e);
                    if (fileToDelete) {
                        set((state) => {
                            state.files.push(fileToDelete);
                        });
                    }
                }
            })();
        },

        setThumbnail: (id, thumbnailPath) => {
            set((state) => {
                const file = state.files.find((f) => f.id === id);
                if (file) {
                    file.thumbnailPath = thumbnailPath;
                    file.updatedAt = Date.now();
                }
            });
            // Move async call outside set()
            const updatedFile = get().getFile(id);
            if (updatedFile) {
                saveFileToPersistence(updatedFile);
            }
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
