import { createContext } from 'react';
import { Editor } from 'tldraw';

export interface EditorContextType {
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

export const EditorContext = createContext<EditorContextType | null>(null);
