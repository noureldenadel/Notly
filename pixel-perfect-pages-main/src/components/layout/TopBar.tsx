import { useState } from "react";
import { 
  ChevronDown, 
  Plus, 
  Share, 
  MoreHorizontal,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  PanelRight,
  Settings,
  Keyboard,
  HelpCircle,
  Download,
  Upload,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SettingsModal } from "@/components/settings/SettingsModal";

interface TopBarProps {
  projectName: string;
  boards: { id: string; name: string }[];
  activeBoard: string;
  onBoardChange: (boardId: string) => void;
  zoomLevel: number;
  rightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
}

export const TopBar = ({ projectName, boards, activeBoard, onBoardChange, zoomLevel, rightSidebarOpen, onToggleRightSidebar }: TopBarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "shortcuts" | "support">("general");

  const openSettings = (tab: "general" | "shortcuts" | "support" = "general") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  return (
    <>
      <div className="h-11 bg-card border-b border-border flex items-center px-3 gap-3">
        {/* Project Info */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-accent rounded-md transition-colors group">
            <div className="w-3 h-3 rounded-sm bg-highlight-blue" />
            <span className="text-sm font-medium">{projectName}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>

        {/* Board Tabs */}
        <div className="flex-1 flex items-center">
          <Tabs value={activeBoard} onValueChange={onBoardChange}>
            <TabsList className="h-8 p-0.5 bg-muted/50">
              {boards.map((board) => (
                <TabsTrigger
                  key={board.id}
                  value={board.id}
                  className={cn(
                    "h-7 px-3 text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm",
                    "data-[state=active]:text-foreground"
                  )}
                >
                  {board.name}
                </TabsTrigger>
              ))}
              <button className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </TabsList>
          </Tabs>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* History */}
          <div className="flex items-center gap-0.5 mr-2">
            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground">
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground">
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5 px-2 py-1 bg-muted/50 rounded-md">
            <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-foreground">
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-medium w-10 text-center">{zoomLevel}%</span>
            <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-foreground">
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-foreground">
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Collaborators */}
          <div className="flex -space-x-1.5 mr-2">
            <div className="w-6 h-6 rounded-full bg-highlight-blue flex items-center justify-center text-[10px] font-medium ring-2 ring-card">
              JD
            </div>
            <div className="w-6 h-6 rounded-full bg-highlight-purple flex items-center justify-center text-[10px] font-medium ring-2 ring-card">
              AK
            </div>
          </div>

          {/* Share */}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
            <Share className="w-3.5 h-3.5" />
            Share
          </Button>

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => openSettings("general")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openSettings("shortcuts")}>
                <Keyboard className="w-4 h-4 mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Export Canvas
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="w-4 h-4 mr-2" />
                Import Files
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openSettings("support")}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Right Sidebar Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "w-7 h-7",
              rightSidebarOpen 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={onToggleRightSidebar}
          >
            <PanelRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        defaultTab={settingsTab}
      />
    </>
  );
};