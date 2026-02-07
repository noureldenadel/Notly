import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Editor, AssetRecordType, createShapeId } from 'tldraw';
import { nanoid } from 'nanoid';
// import { useCardStore } from '@/stores'; // Unused in original file based on content analysis? Checking...
// The original file imported useCardStore but didn't seem to use it in the snippet I saw?
// Ah, checking lines 1-10 of original file: "import { useCardStore } from '@/stores';"
// Let's keep imports if they were there, or remove if unused. I'll include it just in case I missed a usage.
import { PDF_FOOTER_HEIGHT } from '@/components/canvas/shapes/PDFShape';
import { createLogger } from '@/lib/logger';

import { SHAPE_DEFAULTS, COLORS, TOOL_MAP, ACTION_TOOLS } from '@/lib/constants';
import { getViewportCenter } from '@/lib/canvasUtils';

const log = createLogger('EditorContext');

import { EditorContext } from '@/context/editor-context';

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

    const [currentUiTool, setCurrentUiTool] = useState<string>('select');
    const currentUiToolRef = React.useRef<string>('select');
    const toolStyles = React.useRef<Record<string, unknown>>({});

    // Helper to get UI tool ID from editor state
    const getUiToolId = useCallback((editor: Editor) => {
        const tldrawToolId = editor.getCurrentToolId();
        if (tldrawToolId === 'note') return 'sticky';
        if (tldrawToolId === 'geo') {
            const styles = editor.getInstanceState().stylesForNextShape;
            return styles['tldraw:geo'] === 'ellipse' ? 'ellipse' : 'rectangle';
        }
        return tldrawToolId;
    }, []);

    const setTool = useCallback((toolId: string) => {
        if (!editor) return;

        // Skip action tools - they have their own handlers
        if (ACTION_TOOLS.includes(toolId)) {
            return;
        }

        const currentStyles = editor.getInstanceState().stylesForNextShape;

        // Save current styles for the previous tool (using Ref for most up-to-date value)
        if (currentUiToolRef.current) {
            toolStyles.current[currentUiToolRef.current] = { ...currentStyles };
        }

        const tldrawTool = TOOL_MAP[toolId] || 'select';

        // Update local state for tracking
        setCurrentUiTool(toolId);
        currentUiToolRef.current = toolId;

        // Prepare styles for the new tool
        let nextStyles = { ...currentStyles }; // Default to current if no saved history

        // If we have saved styles for this specific tool, restore them
        if (toolStyles.current[toolId]) {
            nextStyles = { ...(toolStyles.current[toolId] as Record<string, unknown>) };
        }

        // Handle geo shapes - need to set the specific geo shape type
        // We must merge this *after* restoring styles to ensure the shape type is correct
        if (toolId === 'rectangle' || toolId === 'ellipse') {
            nextStyles['tldraw:geo'] = toolId === 'ellipse' ? 'ellipse' : 'rectangle';

            editor.updateInstanceState({
                stylesForNextShape: nextStyles,
            });
            editor.setCurrentTool('geo');
        } else {
            // Restore styles for other tools
            editor.updateInstanceState({
                stylesForNextShape: nextStyles,
            });
            editor.setCurrentTool(tldrawTool);
        }
    }, [editor]);

    // Sync currentUiTool with editor changes (handles implicit switches like auto-select)
    useEffect(() => {
        if (!editor) return;

        const handleChange = () => {
            const actualTool = getUiToolId(editor);

            // If the tool effectively changed and it wasn't our doing (mismatch with Ref)
            if (actualTool !== currentUiToolRef.current) {
                // Determine if this is a "valid" tool we track
                // If we switched to something we don't track, maybe we shouldn't save?
                // But generally we want to save where we left off.

                // Save styles for the tool we are implicitly leaving
                const currentStyles = editor.getInstanceState().stylesForNextShape;
                if (currentUiToolRef.current) {
                    toolStyles.current[currentUiToolRef.current] = { ...currentStyles };
                }

                // Update our tracker
                currentUiToolRef.current = actualTool;
                setCurrentUiTool(actualTool);
            }
        };

        editor.on('change', handleChange);
        return () => {
            editor.off('change', handleChange);
        };
    }, [editor, getUiToolId]);

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

    // Set zoom to a specific level, zooming toward viewport center
    const setZoom = useCallback((level: number, anchor?: { screenPoint: { x: number; y: number }, pagePoint: { x: number; y: number } }) => {
        if (!editor) return;

        // Clamp zoom level (10% to 400%)
        const clampedLevel = Math.max(10, Math.min(400, level));
        const newZ = clampedLevel / 100;

        // Get viewport center for zoom anchor
        const container = editor.getContainer();
        const rect = container.getBoundingClientRect();

        const viewportPoint = {
            x: container.clientWidth / 2,
            y: container.clientHeight / 2
        };

        const globalPoint = {
            x: rect.left + viewportPoint.x,
            y: rect.top + viewportPoint.y
        };

        // ✅ Use SAME point (globalPoint) for both screenToPage AND camera formula
        // This matches the working wheel zoom pattern in TldrawWrapper.tsx
        const pagePoint = editor.screenToPage(globalPoint);

        // Calculate new camera position - must use SAME coordinates as screenToPage
        const newCamera = {
            x: pagePoint.x - globalPoint.x / newZ,  // ✅ Use globalPoint not viewportPoint!
            y: pagePoint.y - globalPoint.y / newZ,
            z: newZ
        };

        // Use instant zoom for slider drag, animated for buttons
        if (anchor) {
            editor.stopCameraAnimation();
            editor.setCamera(newCamera, { animation: { duration: 0 } });
        } else {
            editor.setCamera(newCamera, { animation: { duration: 200 } });
        }
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
                setZoom,
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
