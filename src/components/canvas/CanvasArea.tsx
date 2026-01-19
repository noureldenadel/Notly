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

// Capture canvas as thumbnail PNG data URL - captures viewport at user's zoom level
const captureCanvasThumbnail = async (editor: Editor): Promise<string | null> => {
  try {
    // Get current viewport bounds (what user is looking at)
    const viewportBounds = editor.getViewportPageBounds();

    // Get all shapes that overlap with viewport
    const shapesInView = editor.getCurrentPageShapes().filter(shape => {
      const shapeBounds = editor.getShapePageBounds(shape);
      if (!shapeBounds) return false;
      // Check if shape overlaps with viewport
      return !(
        shapeBounds.maxX < viewportBounds.minX ||
        shapeBounds.minX > viewportBounds.maxX ||
        shapeBounds.maxY < viewportBounds.minY ||
        shapeBounds.minY > viewportBounds.maxY
      );
    });

    // If no shapes in viewport, return null (don't capture empty view)
    if (shapesInView.length === 0) {
      return null;
    }

    const shapeIds = shapesInView.map(s => s.id);

    // Get SVG element with bounds matching the viewport (preserves zoom level)
    const svgResult = await editor.getSvgElement(shapeIds, {
      bounds: viewportBounds, // Use viewport bounds to match user's view
      padding: 0,
      background: true,
    });

    if (!svgResult?.svg) {
      return null;
    }

    const svg = svgResult.svg;

    // Convert SVG to PNG data URL
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas with limited size for thumbnail
        const maxWidth = 400;
        const maxHeight = 300;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const width = img.width * scale;
        const height = img.height * scale;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        URL.revokeObjectURL(url);

        try {
          const dataUrl = canvas.toDataURL('image/png', 0.8);
          resolve(dataUrl);
        } catch (e) {
          console.warn('[CanvasArea] Failed to convert canvas to data URL:', e);
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } catch (e) {
    console.warn('[CanvasArea] Failed to capture thumbnail:', e);
    return null;
  }
};

export const CanvasArea = ({ boardId }: CanvasAreaProps) => {
  const { activeBoardId, activeProjectId, updateProject } = useProjectStore();
  const { setEditor } = useEditor();
  const currentBoardId = boardId || activeBoardId || 'default';
  const previousBoardRef = useRef<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // Save current board and capture thumbnail when switching away
  useEffect(() => {
    return () => {
      // Cleanup: save snapshot when unmounting or board changes
      if (editorRef.current && previousBoardRef.current) {
        const editor = editorRef.current;
        const snapshot = getSnapshot(editor.store);
        saveBoardSnapshot(previousBoardRef.current, JSON.stringify(snapshot));
        console.log('[CanvasArea] Saved snapshot for board:', previousBoardRef.current);

        // Capture and save thumbnail for the project
        if (activeProjectId) {
          captureCanvasThumbnail(editor).then((thumbnail) => {
            if (thumbnail) {
              updateProject(activeProjectId, { thumbnailPath: thumbnail });
              console.log('[CanvasArea] Saved thumbnail for project:', activeProjectId);
            }
          });
        }
      }
    };
  }, [currentBoardId, activeProjectId, updateProject]);

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
    </div>
  );
};

export default CanvasArea;
