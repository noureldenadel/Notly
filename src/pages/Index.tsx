import { useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import { TopBar } from "@/components/layout/TopBar";
import { BottomToolbar } from "@/components/layout/BottomToolbar";
import { TextFormattingToolbar } from "@/components/layout/TextFormattingToolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { EditorProvider, useEditor } from "@/hooks/useEditorContext";
import { DndProvider, DraggableItem, CanvasDropZone } from "@/components/dnd";
import { useUIStore, useProjectStore, useCardStore, usePresentationStore } from "@/stores";
import { createCardOnCanvas } from "@/components/canvas/TldrawWrapper";
import { PresentationMode } from "@/components/presentation";
import { useKeyboardShortcuts, createDefaultShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useToast } from "@/hooks/use-toast";
import { createLogger } from "@/lib/logger";
import { DefaultFontStyle } from "tldraw";
import { ModalManager } from "@/components/modals/ModalManager";
import { AppInitializer } from "@/components/AppInitializer";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const log = createLogger('Index');

// Inner component that has access to editor context
function IndexContent() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // UI Actions - using atomic selectors where possible or just the hook if actions are stable
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const openModal = useUIStore(s => s.openModal);

  // Project Actions & State
  const activeProjectId = useProjectStore(s => s.activeProjectId);
  const activeBoardId = useProjectStore(s => s.activeBoardId);
  const setActiveBoard = useProjectStore(s => s.setActiveBoard);
  const isLoaded = useProjectStore(s => s.isLoaded);

  const allBoards = useProjectStore(s => s.boards);

  // Stable boards array
  const boards = useMemo(() => {
    // If not loaded yet, return empty to avoid flicker logic, though LoadingScreen handles this.
    if (!isLoaded) return [];

    // If no active project, return empty (redirect will handle navigation)
    if (!activeProjectId) return [];

    return allBoards
      .filter(b => b.projectId === activeProjectId)
      .sort((a, b) => a.position - b.position)
      .map(b => ({ id: b.id, name: b.title }));
  }, [activeProjectId, allBoards, isLoaded]);

  const activeProjectColor = useProjectStore(s => s.projects.find(p => p.id === s.activeProjectId)?.color);
  const activeProjectTitle = useProjectStore(s => s.projects.find(p => p.id === s.activeProjectId)?.title);

  // Actions
  const createBoard = useProjectStore(s => s.createBoard);
  const updateBoard = useProjectStore(s => s.updateBoard);
  const deleteBoard = useProjectStore(s => s.deleteBoard);
  const updateProject = useProjectStore(s => s.updateProject);
  const reorderBoards = useProjectStore(s => s.reorderBoards);

  // Card Store
  const createCardStore = useCardStore(s => s.createCard);

  // Presentation State
  const startPresentation = usePresentationStore(s => s.startPresentation);

  // Editor Context
  const {
    editor,
    setTool,
    insertImage,
    insertPDF,
    insertCard,
    insertMindMap
  } = useEditor();

  // Set default font to Sans Serif
  useEffect(() => {
    if (editor) {
      editor.setStyleForNextShapes(DefaultFontStyle, 'sans');
    }
  }, [editor]);

  // Create card shortcut handler
  const handleCreateCardShortcut = useCallback(() => {
    if (!editor) return;

    const viewport = editor.getViewportPageBounds();
    const center = viewport.center;

    // Create card in store
    const card = createCardStore('', 'New Card', 'highlight-blue');

    // Add to canvas
    createCardOnCanvas(editor, {
      x: center.x - 140, // Center the card
      y: center.y - 80,
      cardId: card.id,
      title: 'New Card',
      content: '',
      color: 'highlight-blue',
    });
  }, [editor, createCardStore]);

  // Register global shortcuts
  const shortcuts = createDefaultShortcuts({
    openSearch: () => openModal('search'),
    openSettings: () => openModal('settings'),
    showShortcuts: () => openModal('shortcuts'),
    createCard: handleCreateCardShortcut,
    save: () => {
      toast({ title: "Saved", description: "Changes are saved automatically" });
    },
    startPresentation: () => {
      startPresentation([]);
    },
  });

  useKeyboardShortcuts(shortcuts);

  const activeBoard = activeBoardId || "main";

  // Handle drop on canvas
  const handleDropOnCanvas = useCallback((item: DraggableItem, position: { x: number; y: number }) => {
    if (!editor) {
      log.warn('No editor available for drop');
      return;
    }

    log.debug('Dropped item:', item.type, 'at', position);

    const screenPoint = { x: position.x, y: position.y };
    const canvasPoint = editor.screenToPage(screenPoint);

    switch (item.type) {
      case 'card': {
        const card = createCardStore('', item.data.title || 'Dropped Card', item.data.color || 'highlight-blue');
        createCardOnCanvas(editor, {
          x: canvasPoint.x - 140,
          y: canvasPoint.y - 80,
          cardId: card.id,
          title: item.data.title || 'Dropped Card',
          content: item.data.content || '',
          color: item.data.color || 'highlight-blue',
        });
        break;
      }
      case 'file':
      case 'pdf': {
        editor.createShape({
          type: item.type === 'pdf' ? 'pdf' : 'image',
          x: canvasPoint.x - 100,
          y: canvasPoint.y - 130,
          props: {
            w: 200,
            h: 260,
            fileId: item.id,
            filename: item.data.filename || 'File',
            ...(item.type === 'pdf' && { pageNumber: 1, totalPages: 1 }),
          },
        });
        break;
      }
      case 'highlight': {
        editor.createShape({
          type: 'highlight',
          x: canvasPoint.x - 130,
          y: canvasPoint.y - 60,
          props: {
            w: 260,
            h: 120,
            highlightId: item.id,
            sourceType: 'pdf',
            sourceId: '',
            content: item.data.content || '',
            color: item.data.color || 'highlight-yellow',
          },
        });
        break;
      }
      default:
        log.warn('Unknown item type:', item.type);
    }
  }, [editor, createCardStore]);

  // Show loading screen until projects are loaded
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        <DndProvider onDropOnCanvas={handleDropOnCanvas}>
          {/* Top Bar */}
          <TopBar
            projectName={activeProjectTitle || (activeProjectId ? 'Untitled Project' : 'No Project')}
            projectColor={activeProjectColor}
            onProjectRename={(newName) => {
              if (activeProjectId) updateProject(activeProjectId, { title: newName });
            }}
            onProjectColorChange={(newColor) => {
              if (activeProjectId) updateProject(activeProjectId, { color: newColor });
            }}
            boards={boards}
            activeBoard={activeBoard}
            onBoardChange={(boardId) => setActiveBoard(boardId)}
            onAddBoard={() => {
              if (activeProjectId) {
                const board = createBoard(activeProjectId, 'New Board');
                setActiveBoard(board.id);
              }
            }}
            onBoardRename={(boardId, newName) => {
              updateBoard(boardId, { title: newName });
            }}
            onBoardDelete={(boardId) => {
              deleteBoard(boardId);
            }}
            onBoardReorder={(newOrder) => {
              if (activeProjectId) reorderBoards(activeProjectId, newOrder);
            }}
            onBoardDuplicate={(boardId) => {
              if (activeProjectId) {
                const originalBoard = boards.find(b => b.id === boardId);
                if (originalBoard) {
                  const newBoard = createBoard(activeProjectId, `${originalBoard.name} (Copy)`);
                  setActiveBoard(newBoard.id);
                }
              }
            }}
            onNavigateHome={() => navigate("/")}
            onSettingsClick={() => openModal('settings')}
            onSearchClick={() => openModal('search')}
            onImportExportClick={() => openModal('import-export')}
            onShortcutsClick={() => openModal('shortcuts')}
            onPresentationClick={() => startPresentation([])}
          />

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            <CanvasDropZone className="flex-1 relative flex flex-col min-w-0">
              <CanvasArea boardId={activeBoard} />
              <BottomToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onSetTool={setTool}
                onInsertImage={insertImage}
                onInsertPDF={insertPDF}
                onInsertCard={insertCard}
                onInsertMindMap={insertMindMap}
              />
            </CanvasDropZone>
          </div>
        </DndProvider>

        {/* Modal Manager handles all modals */}
        <ModalManager />

        {/* Text Formatting Toolbar - appears above selected text */}
        <TextFormattingToolbar />

        {/* Presentation Mode */}
        <PresentationMode />
      </div>
    </>
  );
}

// Main component wraps with EditorProvider
const Index = () => {
  return (
    <>
      <AppInitializer />
      <EditorProvider>
        <IndexContent />
      </EditorProvider>
    </>
  );
};

export default Index;
