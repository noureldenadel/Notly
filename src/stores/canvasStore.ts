import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CanvasElement } from './types';

interface CanvasState {
    // Canvas viewport state
    viewport: {
        x: number;
        y: number;
        zoom: number;
    };

    // Canvas elements (links to tldraw shapes)
    elements: CanvasElement[];

    // Selection state
    selectedElementIds: string[];

    // tldraw editor reference (set externally)
    editorRef: unknown | null;

    // Viewport actions
    setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
    resetViewport: () => void;

    // Element actions
    addElement: (element: CanvasElement) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    removeElement: (id: string) => void;
    clearElements: () => void;

    // Selection actions
    setSelection: (ids: string[]) => void;
    addToSelection: (id: string) => void;
    removeFromSelection: (id: string) => void;
    clearSelection: () => void;

    // Editor reference
    setEditorRef: (ref: unknown) => void;

    // Getters
    getElementById: (id: string) => CanvasElement | undefined;
    getElementsByBoard: (boardId: string) => CanvasElement[];
    getElementsByType: (type: CanvasElement['elementType']) => CanvasElement[];
}

const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export const useCanvasStore = create<CanvasState>()(
    immer((set, get) => ({
        // Initial state
        viewport: { ...DEFAULT_VIEWPORT },
        elements: [],
        selectedElementIds: [],
        editorRef: null,

        // Viewport actions
        setViewport: (viewport) => {
            set((state) => {
                state.viewport = viewport;
            });
        },

        resetViewport: () => {
            set((state) => {
                state.viewport = { ...DEFAULT_VIEWPORT };
            });
        },

        // Element actions
        addElement: (element) => {
            set((state) => {
                state.elements.push(element);
            });
        },

        updateElement: (id, updates) => {
            set((state) => {
                const element = state.elements.find((e) => e.id === id);
                if (element) {
                    Object.assign(element, updates, { updatedAt: Date.now() });
                }
            });
        },

        removeElement: (id) => {
            set((state) => {
                state.elements = state.elements.filter((e) => e.id !== id);
                state.selectedElementIds = state.selectedElementIds.filter((eid) => eid !== id);
            });
        },

        clearElements: () => {
            set((state) => {
                state.elements = [];
                state.selectedElementIds = [];
            });
        },

        // Selection actions
        setSelection: (ids) => {
            set((state) => {
                state.selectedElementIds = ids;
            });
        },

        addToSelection: (id) => {
            set((state) => {
                if (!state.selectedElementIds.includes(id)) {
                    state.selectedElementIds.push(id);
                }
            });
        },

        removeFromSelection: (id) => {
            set((state) => {
                state.selectedElementIds = state.selectedElementIds.filter((eid) => eid !== id);
            });
        },

        clearSelection: () => {
            set((state) => {
                state.selectedElementIds = [];
            });
        },

        // Editor reference
        setEditorRef: (ref) => {
            set((state) => {
                state.editorRef = ref;
            });
        },

        // Getters
        getElementById: (id) => get().elements.find((e) => e.id === id),
        getElementsByBoard: (boardId) => get().elements.filter((e) => e.boardId === boardId),
        getElementsByType: (type) => get().elements.filter((e) => e.elementType === type),
    }))
);
