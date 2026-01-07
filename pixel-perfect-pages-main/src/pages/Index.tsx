import { useState } from "react";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomToolbar } from "@/components/layout/BottomToolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";

const Index = () => {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeTool, setActiveTool] = useState("select");
  const [activeBoard, setActiveBoard] = useState("main");
  const [zoomLevel, setZoomLevel] = useState(100);

  const boards = [
    { id: "main", name: "Main Canvas" },
    { id: "research", name: "Research" },
    { id: "planning", name: "Planning" },
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <TopBar
        projectName="Research Notes"
        boards={boards}
        activeBoard={activeBoard}
        onBoardChange={setActiveBoard}
        zoomLevel={zoomLevel}
        rightSidebarOpen={rightSidebarOpen}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
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
          <CanvasArea />
          <BottomToolbar activeTool={activeTool} onToolChange={setActiveTool} />
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
        />
      </div>
    </div>
  );
};

export default Index;
