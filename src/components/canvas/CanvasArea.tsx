import { useCallback, useEffect, useRef } from 'react';
import { Editor, getSnapshot, loadSnapshot, TLStoreSnapshot, TLRecord } from 'tldraw';
import { TldrawWrapper } from './TldrawWrapper';
import { patchAssetsInSnapshot } from './tldrawUtils';
import { useProjectStore } from '@/stores';
import { useEditor } from '@/hooks/useEditor';
import { createLogger } from '@/lib/logger';
import { THUMBNAIL } from '@/lib/constants';

const log = createLogger('CanvasArea');

interface CanvasAreaProps {
  boardId?: string;
}

// Sanitize snapshot before saving: remove absolute paths (src) from assets
// to ensure portability. We only keep 'meta.relativePath'.
const sanitizeSnapshot = (snapshotObj: TLStoreSnapshot) => {
  if (!snapshotObj || !snapshotObj.store) return snapshotObj;

  const store = snapshotObj.store;
  // Clone to avoid mutating original state if it's being used elsewhere
  const cleanStore: Record<string, TLRecord> = {};

  Object.keys(store).forEach(key => {
    const record = { ...store[key] };

    // If it's an image asset with a relativePath, strip the 'src'
    // This forces the app to re-resolve the URL from relativePath on load
    if (record.typeName === 'asset' && record.type === 'image' && record.meta?.relativePath) {
      // We keep the src empty or a placeholder. 
      // On load, patchAssetsInSnapshot will fill it back in.
      // Note: Tldraw might want specific fields, but usually src is required. 
      // We can set it to a placeholder or empty string.
      record.props = { ...record.props, src: '' };
    }

    cleanStore[key] = record;
  });

  return { ...snapshotObj, store: cleanStore };
};

// Save board snapshot to Persistence (SQLite)
const saveBoardSnapshot = async (boardId: string, snapshot: string) => {
  try {
    const { getPersistence } = await import('@/lib/persistence');
    const p = await getPersistence();

    // Parse, sanitize, stringify
    const snapshotObj = JSON.parse(snapshot);
    const cleanSnapshot = sanitizeSnapshot(snapshotObj);

    await p.saveCanvasSnapshot(boardId, JSON.stringify(cleanSnapshot));
  } catch (e) {
    log.error('Failed to save board snapshot:', e);
  }
};

// Load board snapshot from Persistence (SQLite)
const loadBoardSnapshot = async (boardId: string): Promise<string | null> => {
  try {
    const { getPersistence } = await import('@/lib/persistence');
    const p = await getPersistence();
    return await p.loadCanvasSnapshot(boardId);
  } catch (e) {
    log.error('Failed to load board snapshot:', e);
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

    // If no shapes in viewport, capture empty white background
    if (shapesInView.length === 0) {
      const canvas = document.createElement('canvas');
      canvas.width = THUMBNAIL.MAX_WIDTH;
      canvas.height = THUMBNAIL.MAX_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png', THUMBNAIL.QUALITY);
      }
      return null;
    }

    const shapeIds = shapesInView.map(s => s.id);

    // Validate viewport bounds - prevent capturing if too small (can cause SVG errors)
    if (viewportBounds.w < 1 || viewportBounds.h < 1) {
      return null;
    }

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
        const maxWidth = THUMBNAIL.MAX_WIDTH;
        const maxHeight = THUMBNAIL.MAX_HEIGHT;
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
          const dataUrl = canvas.toDataURL('image/png', THUMBNAIL.QUALITY);
          resolve(dataUrl);
        } catch (e) {
          log.warn('Failed to convert canvas to data URL:', e);
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
    log.warn('Failed to capture thumbnail:', e);
    return null;
  }
};

export const CanvasArea = ({ boardId }: CanvasAreaProps) => {
  const { activeBoardId, activeProjectId, updateProject } = useProjectStore();
  const { setEditor } = useEditor();
  const currentBoardId = boardId || activeBoardId || 'default';
  const previousBoardRef = useRef<string | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const thumbnailTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save current board and capture thumbnail when switching away
  useEffect(() => {
    return () => {
      // Clear any pending thumbnail save
      if (thumbnailTimeoutRef.current) {
        clearTimeout(thumbnailTimeoutRef.current);
      }

      // Cleanup: save snapshot when unmounting or board changes
      if (editorRef.current && previousBoardRef.current) {
        const editor = editorRef.current;
        const snapshot = getSnapshot(editor.store);
        saveBoardSnapshot(previousBoardRef.current, JSON.stringify(snapshot));
        log.debug('Saved snapshot for board:', previousBoardRef.current);

        // Capture and save thumbnail for the project
        if (activeProjectId) {
          captureCanvasThumbnail(editor).then((thumbnail) => {
            if (thumbnail !== null) {
              updateProject(activeProjectId, { thumbnailPath: thumbnail });
              log.debug('Saved thumbnail for project:', activeProjectId);
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

  // Save snapshot and thumbnail before page unload (refresh/close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editorRef.current && currentBoardId) {
        const editor = editorRef.current;

        // Synchronously save snapshot (best effort during unload)
        const snapshot = getSnapshot(editor.store);
        // Note: Async calls in beforeunload are effectively cancelled, but we try anyway
        // For robustness, we rely mostly on the auto-save interval
        saveBoardSnapshot(currentBoardId, JSON.stringify(snapshot));
        log.debug('Saved snapshot on beforeunload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentBoardId]);

  // Handle editor ready
  const handleEditorReady = useCallback(async (ed: Editor) => {
    editorRef.current = ed;
    setEditor(ed);

    // Load saved snapshot for this board from SQLite
    const savedSnapshot = await loadBoardSnapshot(currentBoardId);
    if (savedSnapshot) {
      try {
        const parsed = JSON.parse(savedSnapshot);

        // Patch asset URLs (restore images from relative paths)
        await patchAssetsInSnapshot(parsed);

        loadSnapshot(ed.store, parsed);
        log.debug('Loaded snapshot for board from DB:', currentBoardId);
      } catch (e) {
        log.warn('Failed to parse saved snapshot:', e);
      }
    } else {
      log.debug('No saved snapshot found for board:', currentBoardId);
    }

    log.debug('Editor ready for board:', currentBoardId);
  }, [setEditor, currentBoardId]);



  // Handle snapshot changes (for auto-save)
  const handleSnapshotChange = useCallback((snapshot: string) => {
    // Auto-save snapshot to SQLite
    saveBoardSnapshot(currentBoardId, snapshot);

    // Debounced Thumbnail Capture (3 seconds)
    if (thumbnailTimeoutRef.current) {
      clearTimeout(thumbnailTimeoutRef.current);
    }

    thumbnailTimeoutRef.current = setTimeout(() => {
      if (editorRef.current && activeProjectId) {
        captureCanvasThumbnail(editorRef.current).then((thumbnail) => {
          if (thumbnail) {
            updateProject(activeProjectId, { thumbnailPath: thumbnail });
            log.debug('Auto-saved thumbnail');
          }
        });
      }
    }, 3000);

  }, [currentBoardId, activeProjectId, updateProject]);

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
