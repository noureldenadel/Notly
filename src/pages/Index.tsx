import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomToolbar } from "@/components/layout/BottomToolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { EditorProvider } from "@/hooks/useEditorContext";
import { useUIStore, useProjectStore } from "@/stores";

const Index = () => {
  const {
    leftSidebarCollapsed,
    setLeftSidebarCollapsed,
    rightSidebarOpen,
    setRightSidebarOpen,
    activeTool,
    setActiveTool,
    zoomLevel
  } = useUIStore();

  const { activeBoardId, activeProjectId, getBoardsByProject } = useProjectStore();

  // Get boards for the active project (or use demo data)
  const boards = activeProjectId
    ? getBoardsByProject(activeProjectId).map(b => ({ id: b.id, name: b.title }))
    : [
      { id: "main", name: "Main Canvas" },
      { id: "research", name: "Research" },
      { id: "planning", name: "Planning" },
    ];

  const activeBoard = activeBoardId || "main";

  return (
    <EditorProvider>
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
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <LeftSidebar
            isCollapsed={leftSidebarCollapsed}
            onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          />

          {/* Canvas Area */}
          <div className="flex-1 relative flex flex-col min-w-0">
            <CanvasArea boardId={activeBoard} />
            <BottomToolbar activeTool={activeTool} onToolChange={setActiveTool} />
          </div>

          {/* Right Sidebar */}
          <RightSidebar
            isOpen={rightSidebarOpen}
            onClose={() => setRightSidebarOpen(false)}
          />
        </div>
      </div>
    </EditorProvider>
  );
};

export default Index;
