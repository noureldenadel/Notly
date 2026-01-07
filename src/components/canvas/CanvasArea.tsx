import { useCallback } from 'react';
import { Editor } from 'tldraw';
import { TldrawWrapper } from './TldrawWrapper';
import { useProjectStore } from '@/stores';
import { useEditor } from '@/hooks/useEditorContext';

interface CanvasAreaProps {
  boardId?: string;
}

export const CanvasArea = ({ boardId }: CanvasAreaProps) => {
  const { activeBoardId } = useProjectStore();
  const { setEditor } = useEditor();

  // Handle editor ready
  const handleEditorReady = useCallback((ed: Editor) => {
    setEditor(ed);
    console.log('[CanvasArea] Editor ready');
  }, [setEditor]);

  // Handle snapshot changes (for auto-save)
  const handleSnapshotChange = useCallback((snapshot: string) => {
    // Will be connected to database save later
    console.log('[CanvasArea] Snapshot changed, size:', snapshot.length);
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* tldraw Canvas (UI hidden - using our own) */}
      <TldrawWrapper
        boardId={boardId || activeBoardId || undefined}
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
