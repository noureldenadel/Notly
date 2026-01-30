import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Editor, AssetRecordType, TLShapeId, createShapeId } from 'tldraw';
import { nanoid } from 'nanoid';
import { useCardStore } from '@/stores';
import { createDefaultMindMap } from '@/components/canvas/shapes/MindMapShape';
import { PDF_FOOTER_HEIGHT } from '@/components/canvas/shapes/PDFShape';
import { createLogger } from '@/lib/logger';

import { SHAPE_DEFAULTS, COLORS } from '@/lib/constants';
import { getViewportCenter } from '@/lib/canvasUtils';

const log = createLogger('EditorContext');

interface EditorContextType {
    editor: Editor | null;
    setEditor: (editor: Editor | null) => void;

    // Tool actions
    setTool: (toolId: string) => void;

    // History actions
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // Zoom actions
    zoomIn: () => void;
    zoomOut: () => void;
    zoomToFit: () => void;
    resetZoom: () => void;
    zoomLevel: number;

    // Asset actions
    insertImage: () => void;
    insertPDF: () => void;
    insertCard: () => void;
    insertMindMap: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

// Tool ID mapping from our UI to tldraw tool IDs
const TOOL_MAP: Record<string, string> = {
    select: 'select',
    hand: 'hand',
    draw: 'draw',
    eraser: 'eraser',
    arrow: 'arrow',
    text: 'text',
    rectangle: 'geo',
    ellipse: 'geo',
    frame: 'frame',
    sticky: 'note',
    card: 'card',
    pdf: 'pdf',
    mindmap: 'card', // Will be custom later
};

// Special actions that aren't tools
const ACTION_TOOLS = ['image', 'pdf'];

export function EditorProvider({ children }: { children: ReactNode }) {
    const [editor, setEditorState] = useState<Editor | null>(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    const setEditor = useCallback((newEditor: Editor | null) => {
        setEditorState(newEditor);

        if (newEditor) {
            // Subscribe to history changes
            const updateHistoryState = () => {
                setCanUndo(newEditor.getCanUndo());
                setCanRedo(newEditor.getCanRedo());
            };

            // Subscribe to camera changes
            const updateZoom = () => {
                const camera = newEditor.getCamera();
                setZoomLevel(Math.round(camera.z * 100));
            };

            newEditor.on('change', () => {
                updateHistoryState();
                updateZoom();
            });

            // Initial state
            updateHistoryState();
            updateZoom();
        }
    }, []);



    const setTool = useCallback((toolId: string) => {
        if (!editor) return;

        // Skip action tools - they have their own handlers
        if (ACTION_TOOLS.includes(toolId)) {
            return;
        }

        const tldrawTool = TOOL_MAP[toolId] || 'select';

        // Handle geo shapes - need to set the specific geo shape type
        if (toolId === 'rectangle' || toolId === 'ellipse') {
            // Access the internal styles directly via updateInstanceState
            const currentStyles = editor.getInstanceState().stylesForNextShape;
            editor.updateInstanceState({
                stylesForNextShape: {
                    ...currentStyles,
                    'tldraw:geo': toolId === 'ellipse' ? 'ellipse' : 'rectangle',
                },
            });
            editor.setCurrentTool('geo');
        } else {
            editor.setCurrentTool(tldrawTool);
        }
    }, [editor]);

    // Insert image via file dialog
    const insertImage = useCallback(() => {
        log.debug('insertImage called, editor:', !!editor);
        if (editor) editor.setCurrentTool('select'); // Force select tool

        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = async (e) => {
            log.debug('File selected');
            const files = (e.target as HTMLInputElement).files;
            if (!files || files.length === 0) return;
            if (!editor) {
                log.error('No editor available');
                return;
            }

            // Dynamically import asset manager
            const { importFile } = await import('@/lib/assetManager');

            for (const file of Array.from(files)) {
                try {
                    // Import file (copys to assets folder in Tauri)
                    const { url, relativePath } = await importFile(file, 'image');

                    // Create image element to get dimensions
                    const img = new Image();
                    img.src = url;
                    await new Promise((resolve) => { img.onload = resolve; });

                    // Create asset
                    const assetId = AssetRecordType.createId(nanoid());
                    const asset = AssetRecordType.create({
                        id: assetId,
                        type: 'image',
                        typeName: 'asset',
                        props: {
                            name: file.name,
                            src: url, // Use the resolved URL (blob: or tauri://)
                            w: img.width,
                            h: img.height,
                            mimeType: file.type,
                            isAnimated: file.type === 'image/gif',
                        },
                        meta: {
                            relativePath, // Store relative path for portability/recovery
                        },
                    });

                    // Add asset to store
                    editor.createAssets([asset]);

                    // Calculate scaled dimensions
                    const scaledWidth = Math.min(img.width, SHAPE_DEFAULTS.IMAGE.MAX_WIDTH);
                    const aspectRatio = img.height / img.width;
                    const scaledHeight = scaledWidth * aspectRatio;

                    // Get center of viewport for placement
                    const { x, y } = getViewportCenter(editor, scaledWidth, scaledHeight);

                    // Create image shape at center of viewport
                    const shapeId = createShapeId();
                    editor.createShape({
                        id: shapeId,
                        type: 'image',
                        x,
                        y,
                        props: {
                            assetId,
                            w: scaledWidth,
                            h: scaledHeight,
                        },
                    });

                    // Auto-select the new image
                    editor.select(shapeId);
                } catch (error) {
                    log.error('Failed to insert image:', error);
                }
            }
        };

        input.click();
    }, [editor]);

    // Insert PDF via file dialog
    const insertPDF = useCallback(() => {
        log.debug('insertPDF called, editor:', !!editor);
        if (editor) editor.setCurrentTool('select'); // Force select tool

        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,application/pdf';
        input.multiple = false;

        input.onchange = async (e) => {
            log.debug('PDF file selected');
            const files = (e.target as HTMLInputElement).files;
            if (!files || files.length === 0) return;
            if (!editor) {
                log.error('No editor available for PDF insert');
                return;
            }

            const file = files[0];

            try {
                // Import file via asset manager
                const { importFile } = await import('@/lib/assetManager');
                const { url, relativePath } = await importFile(file, 'pdf');

                // Load PDF to get page count and generate thumbnail
                const { pdfjs } = await import('react-pdf');
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                const loadingTask = pdfjs.getDocument(url);
                const pdf = await loadingTask.promise;
                const totalPages = pdf.numPages;
                log.debug('PDF loaded, total pages:', totalPages);

                // Generate thumbnail of first page
                let thumbnailPath = '';
                let viewport = null;
                try {
                    const page = await pdf.getPage(1);
                    viewport = page.getViewport({ scale: 0.5 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const context = canvas.getContext('2d');
                    if (context) {
                        await page.render({
                            canvasContext: context,
                            viewport: viewport,
                            canvas: canvas,
                        }).promise;
                        thumbnailPath = canvas.toDataURL('image/png');
                        log.debug('Thumbnail generated');
                    }
                } catch (thumbError) {
                    log.warn('Failed to generate thumbnail:', thumbError);
                }

                // Calculate dimensions based on page aspect ratio
                // Default to A4 ratio (1 / 1.414) if calculation fails
                const pageAspectRatio = (viewport && viewport.width && viewport.height)
                    ? viewport.width / viewport.height
                    : 1 / 1.414;

                const width = SHAPE_DEFAULTS.PDF.WIDTH;
                const contentHeight = width / pageAspectRatio;
                const totalHeight = contentHeight + PDF_FOOTER_HEIGHT;

                // Get center of viewport for placement
                const { x, y } = getViewportCenter(editor, width, totalHeight);

                // Create PDF shape with actual metadata
                const shapeId = createShapeId();
                editor.createShape({
                    id: shapeId,
                    type: 'pdf',
                    x,
                    y,
                    props: {
                        w: width,
                        h: totalHeight,
                        fileId: relativePath, // Store relative path! PDFViewerModal now resolves this.
                        filename: String(file.name || 'Document.pdf'),
                        pageNumber: 1,
                        totalPages: totalPages,
                        thumbnailPath: thumbnailPath, // Keep base64 for thumbnail for now
                    },
                });

                // Auto-select the new PDF
                editor.select(shapeId);

                log.debug('PDF shape created successfully with', totalPages, 'pages');
            } catch (error) {
                log.error('Failed to insert PDF:', error);
            }
        };

        input.click();
    }, [editor]);

    // Insert card - Use native tool
    const insertCard = useCallback(() => {
        if (!editor) return;
        editor.setCurrentTool('card');
    }, [editor]);

    // Insert mind map - Use native tool
    const insertMindMap = useCallback(() => {
        if (!editor) return;
        editor.setCurrentTool('mindmap');
    }, [editor]);

    const undo = useCallback(() => {
        if (editor?.getCanUndo()) {
            editor.undo();
        }
    }, [editor]);

    const redo = useCallback(() => {
        if (editor?.getCanRedo()) {
            editor.redo();
        }
    }, [editor]);

    const zoomIn = useCallback(() => {
        if (!editor) return;
        editor.zoomIn();
    }, [editor]);

    const zoomOut = useCallback(() => {
        if (!editor) return;
        editor.zoomOut();
    }, [editor]);

    const zoomToFit = useCallback(() => {
        if (!editor) return;
        editor.zoomToFit();
    }, [editor]);

    const resetZoom = useCallback(() => {
        if (!editor) return;
        editor.resetZoom();
    }, [editor]);

    return (
        <EditorContext.Provider
            value={{
                editor,
                setEditor,
                setTool,
                undo,
                redo,
                canUndo,
                canRedo,
                zoomIn,
                zoomOut,
                zoomToFit,
                resetZoom,
                zoomLevel,
                insertImage,
                insertPDF,
                insertCard,
                insertMindMap,
            }}
        >
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
}

// Optional hook that doesn't throw if not in provider
export function useEditorOptional() {
    return useContext(EditorContext);
}
