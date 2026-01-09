import { useCallback, useEffect, useRef } from 'react';
import { Editor, getSnapshot, loadSnapshot } from 'tldraw';
import { TldrawWrapper } from './TldrawWrapper';
import { useProjectStore } from '@/stores';
import { useEditor } from '@/hooks/useEditorContext';

interface CanvasAreaProps {
  boardId?: string;
}

// Helper to get storage key for a board
const getBoardStorageKey = (boardId: string) => `visual-thinking-board-${boardId}`;

// Save board snapshot to localStorage
const saveBoardSnapshot = (boardId: string, snapshot: string) => {
  try {
    localStorage.setItem(getBoardStorageKey(boardId), snapshot);
  } catch (e) {
    console.warn('[CanvasArea] Failed to save board snapshot:', e);
  }
};

// Load board snapshot from localStorage
const loadBoardSnapshot = (boardId: string): string | null => {
  try {
    return localStorage.getItem(getBoardStorageKey(boardId));
  } catch (e) {
    console.warn('[CanvasArea] Failed to load board snapshot:', e);
    return null;
  }
};

export const CanvasArea = ({ boardId }: CanvasAreaProps) => {
  const { activeBoardId } = useProjectStore();
  const { setEditor } = useEditor();
  const currentBoardId = boardId || activeBoardId || 'default';
  const previousBoardRef = useRef<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // Save current board when switching away
  useEffect(() => {
    return () => {
      // Cleanup: save snapshot when unmounting or board changes
      if (editorRef.current && previousBoardRef.current) {
        const snapshot = getSnapshot(editorRef.current.store);
        saveBoardSnapshot(previousBoardRef.current, JSON.stringify(snapshot));
        console.log('[CanvasArea] Saved snapshot for board:', previousBoardRef.current);
      }
    };
  }, [currentBoardId]);

  // Track current board
  useEffect(() => {
    previousBoardRef.current = currentBoardId;
  }, [currentBoardId]);

  // Handle editor ready
  const handleEditorReady = useCallback((ed: Editor) => {
    editorRef.current = ed;
    setEditor(ed);

    // Load saved snapshot for this board
    const savedSnapshot = loadBoardSnapshot(currentBoardId);
    if (savedSnapshot) {
      try {
        const parsed = JSON.parse(savedSnapshot);
        loadSnapshot(ed.store, parsed);
        console.log('[CanvasArea] Loaded snapshot for board:', currentBoardId);
      } catch (e) {
        console.warn('[CanvasArea] Failed to parse saved snapshot:', e);
      }
    }

    console.log('[CanvasArea] Editor ready for board:', currentBoardId);
  }, [setEditor, currentBoardId]);

  // Handle snapshot changes (for auto-save)
  const handleSnapshotChange = useCallback((snapshot: string) => {
    // Auto-save to localStorage
    saveBoardSnapshot(currentBoardId, snapshot);
  }, [currentBoardId]);

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* tldraw Canvas - key forces remount when board changes */}
      <TldrawWrapper
        key={currentBoardId}
        boardId={currentBoardId}
        onEditorReady={handleEditorReady}
        onSnapshotChange={handleSnapshotChange}
        className="absolute inset-0"
      />

      {/* Keyboard shortcut hints */}
      <div className="absolute bottom-24 right-8 flex flex-col items-end gap-2 animate-fade-in pointer-events-none z-50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <span>Drag from library to add items</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;

