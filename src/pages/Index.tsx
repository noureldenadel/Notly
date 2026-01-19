import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomToolbar } from "@/components/layout/BottomToolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { EditorProvider, useEditor } from "@/hooks/useEditorContext";
import { DndProvider, DraggableItem, CanvasDropZone } from "@/components/dnd";
import { useUIStore, useProjectStore, useCardStore, useFileStore, useTagStore, usePresentationStore } from "@/stores";
import { createCardOnCanvas } from "@/components/canvas/TldrawWrapper";
import { SettingsModal } from "@/components/settings";
import { ImportExportModal, ShortcutsCheatsheet } from "@/components/modals";
import { PresentationMode } from "@/components/presentation";
import { PDFViewerModal } from "@/components/pdf";
import { CardEditorModal } from "@/components/editor";
import { GlobalSearch } from "@/components/search";
import { setOpenPDFHandler } from "@/lib/pdfEvents";
import { setOpenCardEditorHandler } from "@/lib/cardEvents";
import { initPersistence } from "@/lib/persistence";
import { useKeyboardShortcuts, createDefaultShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useToast } from "@/hooks/use-toast";

// Inner component that has access to editor context
function IndexContent() {
  const navigate = useNavigate();
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    activeTool,
    setActiveTool,
  } = useUIStore();

  const {
    activeBoardId,
    activeProjectId,
    getBoardsByProject,
    loadProjects,
    isLoaded: projectsLoaded,
    setActiveBoard,
    createBoard,
    createProject,
    setActiveProject,
    getProject,
  } = useProjectStore();
  const { createCard, loadCards, isLoaded: cardsLoaded } = useCardStore();
  const { loadFiles, isLoaded: filesLoaded } = useFileStore();
  const { loadTags, isLoaded: tagsLoaded } = useTagStore();
  const { editor } = useEditor();

  // Modal states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | undefined>(undefined);
  const [activePdfName, setActivePdfName] = useState<string | undefined>(undefined);
  const [searchOpen, setSearchOpen] = useState(false);

  // Card editor state
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeShapeId, setActiveShapeId] = useState<string | null>(null);

  const { isPresenting } = usePresentationStore();

  // Initialize persistence and load all data on mount
  useEffect(() => {
    async function initApp() {
      await initPersistence();

      // Load all stores in parallel
      await Promise.all([
        !projectsLoaded && loadProjects(),
        !cardsLoaded && loadCards(),
        !filesLoaded && loadFiles(),
        !tagsLoaded && loadTags(),
      ]);

      console.log('[App] All data loaded');
    }
    initApp();
  }, [loadProjects, loadCards, loadFiles, loadTags, projectsLoaded, cardsLoaded, filesLoaded, tagsLoaded]);

  // Register PDF open handler for double-click on PDF shapes
  useEffect(() => {
    setOpenPDFHandler((pdfUrl, fileName, _pageNumber) => {
      console.log('[PDFEvents] Opening PDF viewer:', fileName);
      setActivePdfUrl(pdfUrl);
      setActivePdfName(fileName);
      setPdfViewerOpen(true);
    });

    return () => {
      setOpenPDFHandler(null);
    };
  }, []);

  // Register Card editor handler for double-click on card shapes
  useEffect(() => {
    setOpenCardEditorHandler((cardId, shapeId) => {
      console.log('[CardEvents] Opening card editor:', cardId);
      setActiveCardId(cardId);
      setActiveShapeId(shapeId);
      setCardEditorOpen(true);
    });

    return () => {
      setOpenCardEditorHandler(null);
    };
  }, []);

  const { toast } = useToast();
  const { startPresentation } = usePresentationStore();

  // Create card shortcut handler
  const handleCreateCardShortcut = useCallback(() => {
    if (!editor) return;

    const viewport = editor.getViewportPageBounds();
    const center = viewport.center;

    // Create card in store
    const card = createCard('', 'New Card', 'highlight-blue');

    // Add to canvas
    createCardOnCanvas(editor, {
      x: center.x - 140, // Center the card
      y: center.y - 80,
      cardId: card.id,
      title: 'New Card',
      content: '',
      color: 'highlight-blue',
    });

    // Optional: Select the new shape to allow immediate editing? 
    // Usually handled by createCardOnCanvas returning ID or we can find it.
  }, [editor, createCard]);

  // Register global shortcuts
  const shortcuts = createDefaultShortcuts({
    openSearch: () => setSearchOpen(true),
    openSettings: () => setSettingsOpen(true),
    showShortcuts: () => setShortcutsOpen(true),
    createCard: handleCreateCardShortcut,
    save: () => {
      // Manual save trigger / confidence boost for user
      toast({ title: "Saved", description: "Changes are saved automatically" });
    },
    startPresentation: () => {
      startPresentation([]);
    },
  });

  useKeyboardShortcuts(shortcuts);

  // Get boards for the active project (or use demo data)
  const boards = activeProjectId
    ? getBoardsByProject(activeProjectId).map(b => ({ id: b.id, name: b.title }))
    : [
      { id: "main", name: "Main Canvas" },
      { id: "research", name: "Research" },
      { id: "planning", name: "Planning" },
    ];

  const activeBoard = activeBoardId || "main";

  // Handle drop on canvas from library
  const handleDropOnCanvas = useCallback((item: DraggableItem, position: { x: number; y: number }) => {
    if (!editor) {
      console.warn('[DnD] No editor available for drop');
      return;
    }

    console.log('[DnD] Dropped item:', item.type, 'at', position);

    // Convert screen position to canvas coordinates
    const screenPoint = { x: position.x, y: position.y };
    const canvasPoint = editor.screenToPage(screenPoint);

    switch (item.type) {
      case 'card': {
        // Create card in store
        const card = createCard('', item.data.title || 'Dropped Card', item.data.color || 'highlight-blue');

        // Add to canvas
        createCardOnCanvas(editor, {
          x: canvasPoint.x - 140, // Center the card
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
        // Create image/PDF shape
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
        console.warn('[DnD] Unknown item type:', item.type);
    }
  }, [editor, createCard]);

  return (
    <>
      <DndProvider onDropOnCanvas={handleDropOnCanvas}>
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
          {/* Top Bar - connected to tldraw */}
          <TopBar
            projectName={activeProjectId ? (getProject(activeProjectId)?.title || 'Untitled Project') : 'No Project'}
            projectColor={activeProjectId ? getProject(activeProjectId)?.color : undefined}
            boards={boards}
            activeBoard={activeBoard}
            onBoardChange={(boardId) => {
              console.log('[Board] Switching to:', boardId);
              setActiveBoard(boardId);
            }}
            onAddBoard={() => {
              if (activeProjectId) {
                const board = createBoard(activeProjectId, 'New Board');
                setActiveBoard(board.id);
                console.log('[Board] Created new board:', board.title);
              } else {
                console.warn('[Board] No active project to add board to');
              }
            }}
            onNavigateHome={() => navigate("/")}
            onSettingsClick={() => setSettingsOpen(true)}
            onSearchClick={() => setSearchOpen(true)}
            onImportExportClick={() => setImportExportOpen(true)}
            onShortcutsClick={() => setShortcutsOpen(true)}
            onPresentationClick={() => {
              const { startPresentation } = usePresentationStore.getState();
              startPresentation([]);
            }}
            rightSidebarOpen={rightSidebarOpen}
            onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
          />

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Canvas Area with Drop Zone */}
            <CanvasDropZone className="flex-1 relative flex flex-col min-w-0">
              <CanvasArea boardId={activeBoard} />
              <BottomToolbar activeTool={activeTool} onToolChange={setActiveTool} />
            </CanvasDropZone>

            {/* Right Sidebar */}
            <RightSidebar
              isOpen={rightSidebarOpen}
              onClose={() => setRightSidebarOpen(false)}
            />
          </div>
        </div>
      </DndProvider>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {/* Import/Export Modal */}
      <ImportExportModal
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
      />

      {/* Shortcuts Cheatsheet */}
      <ShortcutsCheatsheet
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {/* Presentation Mode */}
      <PresentationMode />

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false);
          setActivePdfUrl(undefined);
          setActivePdfName(undefined);
        }}
        pdfUrl={activePdfUrl}
        fileName={activePdfName}
      />

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onResultClick={(result) => {
          console.log('[Search] Navigate to:', result.type, result.id);
          // TODO: Navigate to result based on type
        }}
      />

      {/* Card Editor Modal */}
      <CardEditorModal
        cardId={activeCardId}
        isOpen={cardEditorOpen}
        onClose={() => {
          setCardEditorOpen(false);
          setActiveCardId(null);
          setActiveShapeId(null);
        }}
        onSave={(cardId) => {
          // Sync shape with card store data
          if (editor && activeShapeId) {
            const card = useCardStore.getState().getCard(cardId);
            if (card) {
              editor.updateShape({
                id: activeShapeId as any,
                type: 'card',
                props: {
                  title: card.title,
                  content: card.content,
                  color: card.color,
                },
              });
            }
          }
        }}
      />
    </>
  );
}

// Main component wraps with EditorProvider
const Index = () => {
  return (
    <EditorProvider>
      <IndexContent />
    </EditorProvider>
  );
};

export default Index;
