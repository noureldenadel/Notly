import { useCallback, useMemo, useEffect } from 'react';
import {
    Tldraw,
    Editor,
    getSnapshot,
    loadSnapshot,
    useEditor,
    TLStoreSnapshot,
    TLRecord,
    TLImageAsset
} from 'tldraw';
import 'tldraw/tldraw.css';
import { useCanvasStore, useSyncStore, useSettingsStore } from '@/stores';
import { CardShapeUtil } from './shapes/CardShape';
import { PDFShapeUtil } from './shapes/PDFShape';
import { HighlightShapeUtil } from './shapes/HighlightShape';
import { MindMapShapeUtil, createDefaultMindMap } from './shapes/MindMapShape';
import { CardTool } from './tools/CardTool';
import { MindMapTool } from './tools/MindMapTool';
import { createLogger } from '@/lib/logger';
import { SHAPE_DEFAULTS, COLORS } from '@/lib/constants';
import { tauriAssetStore } from '@/lib/tldrawAssetStore';
import { useAdobeZoom } from '@/hooks/useAdobeZoom';
import { patchAssetsInSnapshot } from './tldrawUtils';

const log = createLogger('tldraw');

// Custom shape utilities
const customShapeUtils = [CardShapeUtil, PDFShapeUtil, HighlightShapeUtil, MindMapShapeUtil];

interface TldrawWrapperProps {
    boardId?: string;
    initialSnapshot?: string;
    onEditorReady?: (editor: Editor) => void;
    onSnapshotChange?: (snapshot: string) => void;
    className?: string;
}

export function TldrawWrapper({
    boardId,
    initialSnapshot,
    onEditorReady,
    onSnapshotChange,
    className = '',
}: TldrawWrapperProps) {
    const { setEditorRef, setViewport } = useCanvasStore();
    const { incrementPendingChanges, recordAutoSave } = useSyncStore();
    const { appearance } = useSettingsStore();

    // Handle editor mount
    const handleMount = useCallback(
        (editor: Editor) => {
            // Store editor reference in Zustand
            setEditorRef(editor);

            // Set default font to 'sans' instead of 'draw'
            editor.updateInstanceState({
                stylesForNextShape: {
                    ...editor.getInstanceState().stylesForNextShape,
                    'tldraw:font': 'sans',
                }
            });

            // Register external asset handler to save files to app folder
            // This prevents the "invalid protocol" error for blob URLs
            // and keeps the database small by storing files separately
            editor.registerExternalAssetHandler('file', async ({ file }) => {
                log.debug('Handling external file asset:', file.name, file.type);

                // Import asset manager dynamically
                const { saveBytesToAssets, isTauri } = await import('@/lib/assetManager');

                // Determine asset type
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');

                if (!isImage && !isVideo) {
                    throw new Error(`Unsupported file type: ${file.type}`);
                }

                let src: string;
                let relativePath: string | undefined;

                if (isTauri()) {
                    // In Tauri: save file to app folder and get URL
                    const result = await saveBytesToAssets(file, 'image');
                    src = result.url;
                    relativePath = result.relativePath;
                    log.debug('File saved to assets:', relativePath, 'url:', src);
                } else {
                    // In web mode: use data URL as fallback (can't save to filesystem)
                    src = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    log.debug('Web mode: converted to data URL, length:', src.length);
                }

                if (isImage) {
                    // Get image dimensions
                    const img = new Image();
                    const size = await new Promise<{ w: number; h: number }>((resolve) => {
                        img.onload = () => resolve({ w: img.width, h: img.height });
                        img.onerror = () => resolve({ w: 100, h: 100 }); // fallback
                        img.src = src;
                    });

                    return {
                        id: `asset:${crypto.randomUUID()}` as any,
                        type: 'image',
                        typeName: 'asset',
                        props: {
                            name: file.name,
                            src: src,
                            w: size.w,
                            h: size.h,
                            mimeType: file.type,
                            isAnimated: file.type === 'image/gif',
                        },
                        meta: relativePath ? { relativePath } : {},
                    };
                } else if (isVideo) {
                    // Get video dimensions
                    const video = document.createElement('video');
                    const size = await new Promise<{ w: number; h: number }>((resolve) => {
                        video.onloadedmetadata = () => resolve({ w: video.videoWidth, h: video.videoHeight });
                        video.onerror = () => resolve({ w: 640, h: 480 }); // fallback
                        video.src = src;
                    });

                    return {
                        id: `asset:${crypto.randomUUID()}` as any,
                        type: 'video',
                        typeName: 'asset',
                        props: {
                            name: file.name,
                            src: src,
                            w: size.w,
                            h: size.h,
                            mimeType: file.type,
                            isAnimated: true,
                        },
                        meta: relativePath ? { relativePath } : {},
                    };
                }

                // Should never reach here due to the early check
                throw new Error(`Unsupported file type: ${file.type}`);
            });

            // Load initial snapshot if provided
            if (initialSnapshot) {
                const load = async () => {
                    try {
                        let parsed;
                        try {
                            parsed = JSON.parse(initialSnapshot);
                        } catch (e) {
                            console.error('Failed to parse initial snapshot:', e);
                            return;
                        }

                        // Patch assets with resolved URLs
                        // This ensures that 'tauri://' URLs are valid for the current session/machine
                        await patchAssetsInSnapshot(parsed);

                        // Load into store
                        loadSnapshot(editor.store, parsed);
                    } catch (e) {
                        console.error('Failed to patch assets or load snapshot:', e);
                    }
                };
                load();
            }

            // Subscribe to store changes for auto-save (debounced)
            let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
            const SAVE_DEBOUNCE_MS = 300; // Wait 300ms after last change before saving

            editor.store.listen(
                (info) => {
                    if (info.source === 'user') {
                        incrementPendingChanges();

                        // Debounced snapshot for auto-save
                        if (onSnapshotChange) {
                            // Clear existing timeout
                            if (saveTimeoutId !== null) {
                                clearTimeout(saveTimeoutId);
                            }
                            // Schedule new save after debounce period
                            saveTimeoutId = setTimeout(() => {
                                const snapshot = getSnapshot(editor.store);
                                onSnapshotChange(JSON.stringify(snapshot));
                                recordAutoSave();
                                saveTimeoutId = null;
                            }, SAVE_DEBOUNCE_MS);
                        }
                    }
                },
                { scope: 'document' }
            );

            // Subscribe to camera/viewport changes (throttled with RAF)
            let rafId: number | null = null;
            const updateViewport = () => {
                const camera = editor.getCamera();
                setViewport({
                    x: camera.x,
                    y: camera.y,
                    zoom: camera.z,
                });
                rafId = null;
            };
            editor.on('change', () => {
                if (rafId === null) {
                    rafId = requestAnimationFrame(updateViewport);
                }
            });

            // Notify parent component
            onEditorReady?.(editor);

            log.debug('Editor mounted for board:', boardId);

            // Return cleanup function - crucial for saving before unmount
            return () => {
                // Clear any pending debounced save
                if (saveTimeoutId !== null) {
                    clearTimeout(saveTimeoutId);
                    saveTimeoutId = null;
                }
                // Clear any pending RAF
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                // Immediately save current snapshot before unmount (bypass debounce)
                if (onSnapshotChange) {
                    try {
                        const snapshot = getSnapshot(editor.store);
                        onSnapshotChange(JSON.stringify(snapshot));
                        log.debug('Saved snapshot on unmount for board:', boardId);
                    } catch (e) {
                        log.error('Failed to save snapshot on unmount:', e);
                    }
                }
            };
        },
        [boardId, initialSnapshot, onEditorReady, onSnapshotChange, setEditorRef, setViewport, incrementPendingChanges, recordAutoSave]
    );

    // Sync grid mode with Tldraw editor
    const editor = useCanvasStore((state) => state.editorRef) as Editor | null;

    // Sync grid mode with Tldraw editor
    useEffect(() => {
        if (!editor) return;
        const showGrid = appearance.gridType !== 'none';
        if (editor.getInstanceState().isGridMode !== showGrid) {
            editor.updateInstanceState({ isGridMode: showGrid });
        }
    }, [editor, appearance.gridType]);

    // Enable Adobe-style zoom shortcuts
    useAdobeZoom(editor);

    // Sync dark mode
    useEffect(() => {
        if (!editor) return;

        const updateTheme = () => {
            const scheme = appearance.theme === 'system' ? 'system' : appearance.theme;
            editor.user.updateUserPreferences({ colorScheme: scheme });
        };

        updateTheme();

        if (appearance.theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', updateTheme);
            return () => mediaQuery.removeEventListener('change', updateTheme);
        }
    }, [editor, appearance.theme]);

    // Memoize shape utils array
    const shapeUtils = useMemo(() => customShapeUtils, []);

    // Custom Grid Component
    const CustomGrid = useCallback(({ x, y, z, size }: { x: number; y: number; z: number; size: number }) => {
        // We use the editor hook to get the raw camera coordinates directly
        // This solves parallax issues where the passed 'x/y' props might be pre-normalized
        const editor = useEditor();
        const camera = editor.getCamera();
        const cx = camera.x;
        const cy = camera.y;
        const cz = camera.z;

        if (appearance.gridType === 'none') return null;

        const baseSize = 20; // Standard Tldraw grid unit

        // Define grid sizes based on zoom (z) to match world scale
        const dottedGridSize = baseSize * cz * 2.5;
        const linedGridSize = baseSize * cz * 5;

        // For lined grid
        if (appearance.gridType === 'lined') {
            return (
                <svg className="tl-grid" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern
                            id="grid-lined"
                            width={linedGridSize}
                            height={linedGridSize}
                            patternUnits="userSpaceOnUse"
                            // Lock pattern to world origin by offsetting by screen-space camera position
                            x={(cx * cz) % linedGridSize}
                            y={(cy * cz) % linedGridSize}
                        >
                            <path
                                d={`M ${linedGridSize} 0 L 0 0 0 ${linedGridSize}`}
                                fill="none"
                                stroke="var(--tl-grid-color, currentColor)"
                                strokeWidth="1"
                                opacity="0.8"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-lined)" />
                </svg>
            );
        }

        // Default 'dotted' grid
        return (
            <svg className="tl-grid" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern
                        id="grid-dotted"
                        width={dottedGridSize}
                        height={dottedGridSize}
                        patternUnits="userSpaceOnUse"
                        // Lock pattern to world origin by offsetting by screen-space camera position
                        x={(cx * cz) % dottedGridSize}
                        y={(cy * cz) % dottedGridSize}
                    >
                        <circle cx={1} cy={1} r={1.5 * cz} fill="var(--tl-grid-color, currentColor)" opacity="1" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-dotted)" />
            </svg>
        );
    }, [appearance.gridType]);

    // Components overrides
    const components = useMemo(() => ({
        Grid: CustomGrid,
    }), [CustomGrid]);

    // Memoize tools array
    const tools = useMemo(() => [CardTool, MindMapTool], []);

    return (
        <div
            className={`w-full h-full tldraw-hide-ui ${className}`}
            style={{ position: 'relative' }}
        >
            <Tldraw
                tools={tools}
                shapeUtils={shapeUtils}
                onMount={handleMount}
                inferDarkMode={false}
                components={components}
                assets={tauriAssetStore}
            />
        </div>
    );
}

export default TldrawWrapper;



// Helper function to create a card shape programmatically
export function createCardOnCanvas(
    editor: Editor,
    options: {
        x?: number;
        y?: number;
        cardId: string;
        title: string;
        content: string;
        color?: string;
    }
) {
    const { x = 100, y = 100, cardId, title, content, color = COLORS.DEFAULT_CARD } = options;

    editor.createShape({
        type: 'card',
        x,
        y,
        props: {
            w: SHAPE_DEFAULTS.CARD.WIDTH,
            h: SHAPE_DEFAULTS.CARD.HEIGHT,
            cardId,
            title,
            content,
            color,
            isEditing: false,
        },
    });
}

// Helper function to create a PDF shape programmatically
export function createPDFOnCanvas(
    editor: Editor,
    options: {
        x?: number;
        y?: number;
        fileId: string;
        filename: string;
        pageNumber?: number;
        totalPages?: number;
        thumbnailPath?: string;
    }
) {
    const { x = 100, y = 100, fileId, filename, pageNumber = 1, totalPages = 1, thumbnailPath } = options;

    editor.createShape({
        type: 'pdf',
        x,
        y,
        props: {
            w: SHAPE_DEFAULTS.PDF.WIDTH,
            h: SHAPE_DEFAULTS.PDF.HEIGHT,
            fileId,
            filename,
            pageNumber,
            totalPages,
            thumbnailPath,
        },
    });
}

// Helper function to create a highlight shape programmatically
export function createHighlightOnCanvas(
    editor: Editor,
    options: {
        x?: number;
        y?: number;
        highlightId: string;
        sourceType: 'pdf' | 'card';
        sourceId: string;
        content: string;
        note?: string;
        color?: string;
        pageNumber?: number;
    }
) {
    const { x = 100, y = 100, highlightId, sourceType, sourceId, content, note, color = COLORS.DEFAULT_HIGHLIGHT, pageNumber } = options;

    editor.createShape({
        type: 'highlight',
        x,
        y,
        props: {
            w: SHAPE_DEFAULTS.HIGHLIGHT.WIDTH,
            h: SHAPE_DEFAULTS.HIGHLIGHT.HEIGHT,
            highlightId,
            sourceType,
            sourceId,
            content,
            note,
            color,
            pageNumber,
        },
    });
}

// Helper function to create a mind map shape programmatically
export function createMindMapOnCanvas(
    editor: Editor,
    options: {
        x?: number;
        y?: number;
        topic?: string;
        layout?: 'radial' | 'horizontal' | 'vertical';
    }
) {
    const { x = 100, y = 100, topic = 'Main Topic', layout = 'horizontal' } = options;

    editor.createShape({
        type: 'mindmap',
        x,
        y,
        props: {
            w: SHAPE_DEFAULTS.MINDMAP.WIDTH,
            h: SHAPE_DEFAULTS.MINDMAP.HEIGHT,
            rootNode: createDefaultMindMap(topic),
            layout,
            theme: 'default',
        },
    });
}
