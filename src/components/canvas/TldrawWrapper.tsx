import { useCallback, useMemo } from 'react';
import {
    Tldraw,
    Editor,
    TLComponents,
    TLUiOverrides,
    TLStoreEventInfo,
    getSnapshot,
    loadSnapshot,
} from 'tldraw';
import 'tldraw/tldraw.css';
import { useCanvasStore, useSyncStore } from '@/stores';
import { CardShapeUtil } from './shapes/CardShape';
import { PDFShapeUtil } from './shapes/PDFShape';
import { HighlightShapeUtil } from './shapes/HighlightShape';

// Custom shape utilities
const customShapeUtils = [CardShapeUtil, PDFShapeUtil, HighlightShapeUtil];

interface TldrawWrapperProps {
    boardId?: string;
    initialSnapshot?: string;
    onEditorReady?: (editor: Editor) => void;
    onSnapshotChange?: (snapshot: string) => void;
    className?: string;
}

// UI overrides for custom tools
const uiOverrides: TLUiOverrides = {
    tools(editor, tools) {
        // Add custom tools here
        return tools;
    },
};

// Custom components
const components: TLComponents = {
    // Can customize toolbar, menus, etc.
};

export function TldrawWrapper({
    boardId,
    initialSnapshot,
    onEditorReady,
    onSnapshotChange,
    className = '',
}: TldrawWrapperProps) {
    const { setEditorRef, setViewport } = useCanvasStore();
    const { incrementPendingChanges, recordAutoSave } = useSyncStore();

    // Handle editor mount
    const handleMount = useCallback(
        (editor: Editor) => {
            // Store editor reference in Zustand
            setEditorRef(editor);

            // Load initial snapshot if provided
            if (initialSnapshot) {
                try {
                    const parsed = JSON.parse(initialSnapshot);
                    loadSnapshot(editor.store, parsed);
                } catch (e) {
                    console.error('Failed to load canvas snapshot:', e);
                }
            }

            // Subscribe to store changes for auto-save
            const unsubscribe = editor.store.listen(
                (info: TLStoreEventInfo) => {
                    if (info.source === 'user') {
                        incrementPendingChanges();

                        // Debounced snapshot for auto-save
                        if (onSnapshotChange) {
                            const snapshot = getSnapshot(editor.store);
                            onSnapshotChange(JSON.stringify(snapshot));
                            recordAutoSave();
                        }
                    }
                },
                { scope: 'document' }
            );

            // Subscribe to camera/viewport changes
            editor.on('change', () => {
                const camera = editor.getCamera();
                setViewport({
                    x: camera.x,
                    y: camera.y,
                    zoom: camera.z,
                });
            });

            // Notify parent component
            onEditorReady?.(editor);

            console.log('[tldraw] Editor mounted for board:', boardId);

            // Cleanup on unmount
            return () => {
                unsubscribe();
            };
        },
        [boardId, initialSnapshot, onEditorReady, onSnapshotChange, setEditorRef, setViewport, incrementPendingChanges, recordAutoSave]
    );

    // Memoize shape utils array
    const shapeUtils = useMemo(() => customShapeUtils, []);

    return (
        <div className={`w-full h-full ${className}`} style={{ position: 'relative' }}>
            <Tldraw
                shapeUtils={shapeUtils}
                overrides={uiOverrides}
                components={components}
                onMount={handleMount}
                inferDarkMode={true}
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
    const { x = 100, y = 100, cardId, title, content, color = 'highlight-blue' } = options;

    editor.createShape({
        type: 'card',
        x,
        y,
        props: {
            w: 280,
            h: 160,
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
            w: 200,
            h: 260,
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
    const { x = 100, y = 100, highlightId, sourceType, sourceId, content, note, color = 'highlight-yellow', pageNumber } = options;

    editor.createShape({
        type: 'highlight',
        x,
        y,
        props: {
            w: 260,
            h: 120,
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
