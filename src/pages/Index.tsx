import { useCallback, useState, useEffect } from "react";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomToolbar } from "@/components/layout/BottomToolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { EditorProvider, useEditor } from "@/hooks/useEditorContext";
import { DndProvider, DraggableItem, CanvasDropZone } from "@/components/dnd";
import { useUIStore, useProjectStore, useCardStore, useFileStore, useTagStore } from "@/stores";
import { createCardOnCanvas } from "@/components/canvas/TldrawWrapper";
import { SettingsModal } from "@/components/settings";
import { PDFViewerModal } from "@/components/pdf";
import { GlobalSearch } from "@/components/search";
import { setOpenPDFHandler } from "@/lib/pdfEvents";
import { initPersistence } from "@/lib/persistence";

// Inner component that has access to editor context
function IndexContent() {
  const {
    leftSidebarCollapsed,
    setLeftSidebarCollapsed,
    rightSidebarOpen,
    setRightSidebarOpen,
    activeTool,
    setActiveTool,
  } = useUIStore();

  const { activeBoardId, activeProjectId, getBoardsByProject, loadProjects, isLoaded: projectsLoaded } = useProjectStore();
  const { createCard, loadCards, isLoaded: cardsLoaded } = useCardStore();
  const { loadFiles, isLoaded: filesLoaded } = useFileStore();
  const { loadTags, isLoaded: tagsLoaded } = useTagStore();
  const { editor } = useEditor();

  // Modal states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | undefined>(undefined);
  const [activePdfName, setActivePdfName] = useState<string | undefined>(undefined);
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            projectName="Research Notes"
            boards={boards}
            activeBoard={activeBoard}
            onBoardChange={(boardId) => {
              // TODO: Connect to projectStore.setActiveBoard
              console.log('Board changed:', boardId);
            }}
            onSettingsClick={() => setSettingsOpen(true)}
            onSearchClick={() => setSearchOpen(true)}
          />

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <LeftSidebar
              isCollapsed={leftSidebarCollapsed}
              onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            />

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
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

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
