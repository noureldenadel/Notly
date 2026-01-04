import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Editor, AssetRecordType } from 'tldraw';
import { nanoid } from 'nanoid';

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

        // Handle geo shapes - just switch to geo tool
        // tldraw will use the last selected geo shape type
        if (toolId === 'rectangle' || toolId === 'ellipse') {
            editor.setCurrentTool('geo');
        } else {
            editor.setCurrentTool(tldrawTool);
        }
    }, [editor]);

    // Insert image via file dialog
    const insertImage = useCallback(() => {
        console.log('[insertImage] Called, editor:', !!editor);

        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = async (e) => {
            console.log('[insertImage] File selected');
            const files = (e.target as HTMLInputElement).files;
            if (!files || files.length === 0) return;
            if (!editor) {
                console.error('[insertImage] No editor available');
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

                        // Get center of viewport for placement
                        const camera = editor.getCamera();
                        const viewportBounds = editor.getViewportScreenBounds();
                        const x = -camera.x + viewportBounds.width / 2 / camera.z - img.width / 2;
                        const y = -camera.y + viewportBounds.height / 2 / camera.z - img.height / 2;

                        // Create image shape
                        editor.createShape({
                            type: 'image',
                            x,
                            y,
                            props: {
                                assetId,
                                w: Math.min(img.width, 600), // Max width 600
                                h: Math.min(img.height, 600) * (img.height / img.width),
                            },
                        });
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('Failed to insert image:', error);
                }
            }
        };

        input.click();
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
