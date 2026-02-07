import { useState, useRef, useEffect } from "react";
import {
  Plus,
  MoreHorizontal,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Search,
  Keyboard,
  HelpCircle,
  Download,
  Upload,
  FileText,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEditor } from '@/hooks/useEditor';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getColorHex, PROJECT_COLORS } from "@/components/projects/ProjectCard";
import { DraggableTab } from "./DraggableTab";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { createLogger } from '@/lib/logger';

const log = createLogger('TopBar');

const restrictToHorizontalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    y: 0,
  };
};

interface TopBarProps {
  projectName: string;
  projectColor?: string;
  boards: { id: string; name: string }[];
  activeBoard: string;
  onBoardChange: (boardId: string) => void;
  onProjectRename?: (newName: string) => void;
  onAddBoard?: () => void;
  onBoardRename?: (boardId: string, newName: string) => void;
  onBoardDelete?: (boardId: string) => void;
  onBoardReorder?: (newOrder: string[]) => void;
  onBoardDuplicate?: (boardId: string) => void;
  onNavigateHome?: () => void;
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
  onImportExportClick?: () => void;
  onShortcutsClick?: () => void;
  onPresentationClick?: () => void;
  onProjectColorChange?: (newColor: string) => void;
}

export const TopBar = ({
  projectName,
  projectColor,
  boards,
  activeBoard,
  onBoardChange,
  onProjectRename,
  onAddBoard,
  onBoardRename,
  onBoardDelete,
  onBoardReorder,
  onBoardDuplicate,
  onNavigateHome,
  onSettingsClick,
  onSearchClick,
  onImportExportClick,
  onShortcutsClick,
  onPresentationClick,
  onProjectColorChange,
}: TopBarProps) => {
  // State for inline editing
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // State for project name editing
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectEditText, setProjectEditText] = useState("");
  const projectInputRef = useRef<HTMLInputElement>(null);

  // State for color picker
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Focus input when editing starts
  useEffect(() => {
    if (editingBoardId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingBoardId]);

  // Focus project input
  useEffect(() => {
    if (isEditingProject && projectInputRef.current) {
      projectInputRef.current.focus();
      projectInputRef.current.select();
    }
  }, [isEditingProject]);

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

  // Project editing handlers
  const handleStartProjectEdit = () => {
    setProjectEditText(projectName);
    setIsEditingProject(true);
  };

  const handleSaveProjectEdit = () => {
    if (projectEditText.trim() && projectEditText !== projectName) {
      onProjectRename?.(projectEditText.trim());
    }
    setIsEditingProject(false);
  };

  const { editor, undo, redo, canUndo, canRedo, zoomIn, zoomOut, zoomToFit, resetZoom, setZoom, zoomLevel } = useEditor();

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = boards.findIndex((b) => b.id === active.id);
      const newIndex = boards.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(boards.map(b => b.id), oldIndex, newIndex);
        onBoardReorder?.(newOrder);
      }
    }
  };

  return (
    <div className="h-11 bg-card border-b border-border flex items-center px-3 gap-3 relative z-40">
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
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors cursor-text" onDoubleClick={handleStartProjectEdit}>
          {/* Color Square with Popover */}
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <PopoverTrigger asChild>
              <div
                className="w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                style={{ backgroundColor: getColorHex(projectColor) }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsColorPickerOpen(true);
                }}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-3 gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      onProjectColorChange?.(color.value);
                      setIsColorPickerOpen(false);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-md transition-all hover:scale-110",
                      projectColor?.includes(color.value) && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {isEditingProject ? (
            <input
              ref={projectInputRef}
              value={projectEditText}
              onChange={(e) => setProjectEditText(e.target.value)}
              onBlur={handleSaveProjectEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveProjectEdit();
                if (e.key === 'Escape') setIsEditingProject(false);
              }}
              className="h-6 px-1.5 text-sm font-medium bg-card border border-primary rounded-sm outline-none"
              style={{
                width: `${Math.min(Math.max(projectEditText.length * 8 + 24, 100), 300)}px`,
                minWidth: '100px',
                maxWidth: '300px',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm font-medium select-none">{projectName}</span>
          )}
        </div>
      </div>

      {/* Board Tabs */}
      <div className="flex-1 flex items-center overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <Tabs value={activeBoard} onValueChange={onBoardChange} className="w-full">
            <TabsList className="h-8 p-0.5 bg-muted/50 w-full justify-start overflow-x-auto no-scrollbar scroll-smooth overflow-y-hidden">
              <SortableContext
                items={boards.map(b => b.id)}
                strategy={horizontalListSortingStrategy}
              >
                {boards.map((board) => (
                  editingBoardId === board.id ? (
                    <div key={board.id} className="relative flex items-center group">
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
                    </div>
                  ) : (
                    <DraggableTab
                      key={board.id}
                      board={board}
                      isActive={activeBoard === board.id}
                      onClick={() => onBoardChange(board.id)}
                      onRename={() => handleStartEdit(board.id, board.name)}
                      onDelete={() => onBoardDelete?.(board.id)}
                      onDuplicate={() => onBoardDuplicate?.(board.id)}
                    />
                  )
                ))}
              </SortableContext>
              <button
                onClick={onAddBoard}
                className="h-7 w-7 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors ml-1"
                title="New Board"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </TabsList>
          </Tabs>
        </DndContext>
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
                className="text-xs font-medium w-10 text-center hover:text-foreground cursor-ew-resize select-none"
                onPointerDown={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  const startX = e.clientX;
                  const startZoom = zoomLevel;
                  let hasDragged = false;

                  // ✅ Capture BOTH anchor points at start
                  if (!editor) return;

                  // ✅ Use VIEWPORT-RELATIVE center like zoom buttons do
                  const container = editor.getContainer();
                  const viewportCenter = {
                    x: container.clientWidth / 2,
                    y: container.clientHeight / 2
                  };

                  // For screenToPage, we need global coordinates
                  const rect = container.getBoundingClientRect();
                  const globalCenter = {
                    x: rect.left + viewportCenter.x,
                    y: rect.top + viewportCenter.y
                  };

                  const anchor = {
                    screenPoint: viewportCenter,  // Viewport-relative for formula
                    pagePoint: editor.screenToPage(globalCenter)  // Global for screenToPage
                  };

                  console.log('');
                  console.log('═══════════════════════════════════════════');
                  console.log('🎯 ZOOM SLIDER DRAG START');
                  console.log('═══════════════════════════════════════════');
                  console.log('Viewport center (from getViewportScreenCenter):', viewportCenter);
                  console.log('Page point:', anchor.pagePoint);
                  console.log('Starting zoom:', startZoom);
                  console.log('═══════════════════════════════════════════');
                  console.log('');

                  const handleMove = (moveEvent: PointerEvent) => {
                    const deltaX = moveEvent.clientX - startX;

                    // Only consider it a drag if moved more than 3 pixels
                    if (Math.abs(deltaX) > 3) {
                      hasDragged = true;

                      let sensitivity = 0.5; // Default: 0.5% per pixel
                      if (moveEvent.shiftKey) sensitivity = 1.0;  // Shift = 2x faster
                      if (moveEvent.ctrlKey) sensitivity = 0.125; // Ctrl = 4x slower

                      const newZoom = startZoom + deltaX * sensitivity;

                      console.log('🔄 ZOOM SLIDER MOVE:', {
                        deltaX,
                        sensitivity,
                        newZoom: Math.round(newZoom),
                        anchor,
                        currentCamera: editor.getCamera()
                      });

                      // ✅ Don't pass anchor - use same code path as buttons
                      setZoom(Math.round(newZoom));
                    }
                  };

                  const handleUp = () => {
                    target.releasePointerCapture(e.pointerId);
                    window.removeEventListener('pointermove', handleMove);
                    window.removeEventListener('pointerup', handleUp);

                    // Only reset zoom if it was a click (no drag)
                    if (!hasDragged) {
                      resetZoom();
                    }
                  };

                  window.addEventListener('pointermove', handleMove);
                  window.addEventListener('pointerup', handleUp);
                }}
              >
                {zoomLevel}%
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Drag to zoom • Click to reset</TooltipContent>
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

      </div>
    </div>
  );
};
