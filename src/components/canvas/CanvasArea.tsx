import { useCallback, useState } from 'react';
import { Editor } from 'tldraw';
import { TldrawWrapper, createCardOnCanvas } from './TldrawWrapper';
import { useProjectStore, useCardStore } from '@/stores';
import { useEditor } from '@/hooks/useEditorContext';
import { Plus } from 'lucide-react';

interface CanvasAreaProps {
  boardId?: string;
}

export const CanvasArea = ({ boardId }: CanvasAreaProps) => {
  const { activeBoardId } = useProjectStore();
  const { createCard } = useCardStore();
  const { editor, setEditor } = useEditor();

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

  // Create a new card and add it to canvas
  const handleCreateCard = useCallback(() => {
    if (!editor) return;

    // Create card in store
    const card = createCard('', 'New Card', 'highlight-blue');

    // Get center of viewport
    const camera = editor.getCamera();
    const viewportBounds = editor.getViewportScreenBounds();
    const x = -camera.x + viewportBounds.width / 2 / camera.z - 140;
    const y = -camera.y + viewportBounds.height / 2 / camera.z - 80;

    // Add to canvas
    createCardOnCanvas(editor, {
      x,
      y,
      cardId: card.id,
      title: card.title || 'New Card',
      content: card.content,
      color: card.color || 'highlight-blue',
    });
  }, [editor, createCard]);

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* tldraw Canvas (UI hidden - using our own) */}
      <TldrawWrapper
        boardId={boardId || activeBoardId || undefined}
        onEditorReady={handleEditorReady}
        onSnapshotChange={handleSnapshotChange}
        className="absolute inset-0"
      />

      {/* Floating Create Button */}
      <div className="absolute bottom-24 left-8 z-50">
        <button
          onClick={handleCreateCard}
          className="w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-glow hover:scale-110 transition-all duration-200 flex items-center justify-center group"
          title="Create Card (C)"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="absolute bottom-24 right-8 flex flex-col items-end gap-2 animate-fade-in pointer-events-none z-50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-medium">C</kbd>
          <span>to create a card</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <span>Drag from library to add items</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
