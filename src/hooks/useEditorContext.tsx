import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Editor, AssetRecordType } from 'tldraw';
import { nanoid } from 'nanoid';
import { useCardStore } from '@/stores';
import { createDefaultMindMap } from '@/components/canvas/shapes/MindMapShape';
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

            for (const file of Array.from(files)) {
                try {
                    // Read file as data URL
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const dataUrl = event.target?.result as string;

                        // Create image element to get dimensions
                        const img = new Image();
                        img.src = dataUrl;
                        await new Promise((resolve) => { img.onload = resolve; });

                        // Create asset
                        const assetId = AssetRecordType.createId(nanoid());
                        const asset = AssetRecordType.create({
                            id: assetId,
                            type: 'image',
                            typeName: 'asset',
                            props: {
                                name: file.name,
                                src: dataUrl,
                                w: img.width,
                                h: img.height,
                                mimeType: file.type,
                                isAnimated: file.type === 'image/gif',
                            },
                            meta: {},
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
                        editor.createShape({
                            type: 'image',
                            x,
                            y,
                            props: {
                                assetId,
                                w: scaledWidth,
                                h: scaledHeight,
                            },
                        });
                    };
                    reader.readAsDataURL(file);
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
                // Create object URL for the PDF
                const objectUrl = URL.createObjectURL(file);

                // Load PDF to get page count and generate thumbnail
                const { pdfjs } = await import('react-pdf');
                pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                const loadingTask = pdfjs.getDocument(objectUrl);
                const pdf = await loadingTask.promise;
                const totalPages = pdf.numPages;
                log.debug('PDF loaded, total pages:', totalPages);

                // Generate thumbnail of first page
                let thumbnailPath = '';
                try {
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 0.5 });
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

                // Get center of viewport for placement
                const { x, y } = getViewportCenter(editor, SHAPE_DEFAULTS.PDF.WIDTH, SHAPE_DEFAULTS.PDF.HEIGHT);

                // Create PDF shape with actual metadata
                editor.createShape({
                    type: 'pdf',
                    x,
                    y,
                    props: {
                        w: SHAPE_DEFAULTS.PDF.WIDTH,
                        h: SHAPE_DEFAULTS.PDF.HEIGHT,
                        fileId: String(objectUrl || ''),
                        filename: String(file.name || 'Document.pdf'),
                        pageNumber: 1,
                        totalPages: totalPages,
                        thumbnailPath: thumbnailPath,
                    },
                });

                log.debug('PDF shape created successfully with', totalPages, 'pages');
            } catch (error) {
                log.error('Failed to insert PDF:', error);
            }
        };

        input.click();
    }, [editor]);

    // Insert card at center of viewport
    const insertCard = useCallback(() => {
        log.debug('insertCard called, editor:', !!editor);
        if (!editor) {
            log.error('No editor available for card insert');
            return;
        }

        // Get center of viewport for placement
        const { x, y } = getViewportCenter(editor, SHAPE_DEFAULTS.CARD.WIDTH, SHAPE_DEFAULTS.CARD.HEIGHT);

        // Create card in store (persists and indexes)
        const card = useCardStore.getState().createCard('', 'New Card', COLORS.DEFAULT_CARD);

        // Create card shape on canvas
        editor.createShape({
            type: 'card',
            x,
            y,
            props: {
                w: SHAPE_DEFAULTS.CARD.WIDTH,
                h: SHAPE_DEFAULTS.CARD.HEIGHT,
                cardId: card.id,
                title: card.title || 'New Card',
                content: card.content,
                color: card.color || COLORS.DEFAULT_CARD,
                isEditing: false,
            },
        });

        log.debug('Card created with ID:', card.id);
    }, [editor]);

    // Insert mind map at center of viewport
    const insertMindMap = useCallback(() => {
        log.debug('insertMindMap called, editor:', !!editor);
        if (!editor) {
            log.error('No editor available for mind map insert');
            return;
        }

        // Get center of viewport for placement
        const { x, y } = getViewportCenter(editor, SHAPE_DEFAULTS.MINDMAP.WIDTH, SHAPE_DEFAULTS.MINDMAP.HEIGHT);

        // Create mind map shape on canvas
        editor.createShape({
            type: 'mindmap',
            x,
            y,
            props: {
                w: SHAPE_DEFAULTS.MINDMAP.WIDTH,
                h: SHAPE_DEFAULTS.MINDMAP.HEIGHT,
                rootNode: createDefaultMindMap('Main Topic'),
                layout: 'horizontal',
                theme: 'default',
            },
        });

        log.debug('Mind map created');
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
