import { useState, useRef, useEffect } from "react";
import {
  Plus,
  MoreHorizontal,
  MoreVertical,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Search,
  PanelRight,
  Keyboard,
  HelpCircle,
  Download,
  Upload,
  FileText,
  Home,
  Pencil,
  Trash2,
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
import { useEditor } from "@/hooks/useEditorContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getColorHex } from "@/components/projects/ProjectCard";

interface TopBarProps {
  projectName: string;
  projectColor?: string;
  boards: { id: string; name: string }[];
  activeBoard: string;
  onBoardChange: (boardId: string) => void;
  onAddBoard?: () => void;
  onBoardRename?: (boardId: string, newName: string) => void;
  onBoardDelete?: (boardId: string) => void;
  onNavigateHome?: () => void;
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
  onImportExportClick?: () => void;
  onShortcutsClick?: () => void;
  onPresentationClick?: () => void;
  rightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
}

export const TopBar = ({
  projectName,
  projectColor,
  boards,
  activeBoard,
  onBoardChange,
  onAddBoard,
  onBoardRename,
  onBoardDelete,
  onNavigateHome,
  onSettingsClick,
  onSearchClick,
  onImportExportClick,
  onShortcutsClick,
  onPresentationClick,
  rightSidebarOpen = true,
  onToggleRightSidebar,
}: TopBarProps) => {
  // State for inline editing
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingBoardId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingBoardId]);

  const handleStartEdit = (boardId: string, boardName: string) => {
    setEditingBoardId(boardId);
    setEditText(boardName);
  };

  const handleSaveEdit = () => {
    if (editingBoardId && editText.trim()) {
      onBoardRename?.(editingBoardId, editText.trim());
    }
    setEditingBoardId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingBoardId(null);
    setEditText("");
  };

  const { undo, redo, canUndo, canRedo, zoomIn, zoomOut, zoomToFit, resetZoom, zoomLevel } = useEditor();

  return (
    <div className="h-11 bg-card border-b border-border flex items-center px-3 gap-3">
      {/* Home Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            onClick={onNavigateHome}
          >
            <Home className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          All Projects
        </TooltipContent>
      </Tooltip>

      {/* Project Info */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColorHex(projectColor) }}
          />
          <span className="text-sm font-medium">{projectName}</span>
        </div>
      </div>

      {/* Board Tabs */}
      <div className="flex-1 flex items-center">
        <Tabs value={activeBoard} onValueChange={onBoardChange}>
          <TabsList className="h-8 p-0.5 bg-muted/50">
            {boards.map((board) => (
              <div key={board.id} className="relative flex items-center group">
                {editingBoardId === board.id ? (
                  <input
                    ref={inputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="h-7 px-3 text-xs font-medium bg-card border border-primary rounded-md outline-none"
                    style={{
                      width: `${Math.min(Math.max(editText.length * 7 + 24, 60), 200)}px`,
                      minWidth: '60px',
                      maxWidth: '200px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <TabsTrigger
                      value={board.id}
                      className={cn(
                        "h-7 px-3 text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center",
                        "data-[state=active]:text-foreground pr-12 min-w-[60px] max-w-[150px] overflow-hidden"
                      )}
                      onDoubleClick={() => handleStartEdit(board.id, board.name)}
                      title={board.name}
                    >
                      <span
                        className="whitespace-nowrap block flex-1 overflow-hidden max-w-full"
                        style={board.name.length > 12 ? {
                          // Fade only the last three characters, leaving space for the menu button
                          maskImage: 'linear-gradient(to right, black 0%, black calc(100% - 3ch), transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to right, black 0%, black calc(100% - 3ch), transparent 100%)',
                          paddingRight: '1.5rem'
                        } : undefined}
                      >
                        {board.name}
                      </span>
                    </TabsTrigger>
                    {/* Board dropdown menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36">
                        <DropdownMenuItem onClick={() => handleStartEdit(board.id, board.name)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onBoardDelete?.(board.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}
            <button
              onClick={onAddBoard}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </TabsList>
        </Tabs>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* History - wired to tldraw */}
        <div className="flex items-center gap-0.5 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-7 h-7",
                  canUndo ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
                )}
                onClick={undo}
                disabled={!canUndo}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Undo</span>
              <kbd className="ml-2 text-[10px] bg-muted px-1 py-0.5 rounded">Ctrl+Z</kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-7 h-7",
                  canRedo ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
                )}
                onClick={redo}
                disabled={!canRedo}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span>Redo</span>
              <kbd className="ml-2 text-[10px] bg-muted px-1 py-0.5 rounded">Ctrl+Y</kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Zoom Controls - wired to tldraw */}
        <div className="flex items-center gap-0.5 px-2 py-1 bg-muted/50 rounded-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 text-muted-foreground hover:text-foreground"
                onClick={zoomOut}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom Out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-xs font-medium w-10 text-center hover:text-foreground"
                onClick={resetZoom}
              >
                {zoomLevel}%
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset Zoom (Click)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 text-muted-foreground hover:text-foreground"
                onClick={zoomIn}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom In</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 text-muted-foreground hover:text-foreground"
                onClick={zoomToFit}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom to Fit</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={onSearchClick}
            >
              <Search className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Search</span>
            <kbd className="ml-2 text-[10px] bg-muted px-1 py-0.5 rounded">⌘K</kbd>
          </TooltipContent>
        </Tooltip>

        {/* More Menu (3 dots) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShortcutsClick}>
              <Keyboard className="w-4 h-4 mr-2" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onImportExportClick}>
              <Download className="w-4 h-4 mr-2" />
              Export Canvas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImportExportClick}>
              <Upload className="w-4 h-4 mr-2" />
              Import Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPresentationClick}>
              <FileText className="w-4 h-4 mr-2" />
              Start Presentation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HelpCircle className="w-4 h-4 mr-2" />
              Help & Support
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Right Sidebar Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {rightSidebarOpen ? "Hide Right Sidebar" : "Show Right Sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
