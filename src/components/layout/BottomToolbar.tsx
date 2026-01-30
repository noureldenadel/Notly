import React from 'react';
import {
  MousePointer2,
  Hand,
  Pencil,
  Eraser,
  ArrowRight,
  Type,
  Square,
  Circle,
  Frame,
  StickyNote,
  FileText,
  Image,
  FileType,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ToolSettingsPanel } from "./ToolSettingsPanel";


interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const ToolButton = ({ icon, label, shortcut, isActive, onClick }: ToolButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          "w-9 h-9 relative transition-all",
          isActive
            ? "bg-primary/20 text-primary hover:bg-primary/30"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        {icon}
        {isActive && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
        )}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top" className="flex items-center gap-2">
      <span>{label}</span>
      {shortcut && (
        <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{shortcut}</kbd>
      )}
    </TooltipContent>
  </Tooltip>
);

interface BottomToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  // Editor actions
  onSetTool: (toolId: string) => void;
  onInsertImage: () => void;
  onInsertPDF: () => void;
  onInsertCard: () => void;
  onInsertMindMap: () => void;
  // Placement mode for active state
  placementMode?: 'card' | 'mindmap' | null;
}

export const BottomToolbar = ({
  activeTool,
  onToolChange,
  onSetTool,
  onInsertImage,
  onInsertPDF,
  onInsertCard,
  onInsertMindMap,
  placementMode
}: BottomToolbarProps) => {
  // Use props instead of hook to avoid context issues
  const [drawToolClickCount, setDrawToolClickCount] = React.useState(0);

  // Handle tool change - sync with both local state and tldraw
  const handleToolChange = (toolId: string) => {
    // Track draw tool clicks for settings panel visibility
    if (toolId === 'draw') {
      setDrawToolClickCount(prev => prev + 1);
    }
    // Special handling for image - triggers file dialog instead of tool switch
    if (toolId === 'image') {
      onInsertImage();
      return;
    }

    // Special handling for PDF - triggers file dialog instead of tool switch
    if (toolId === 'pdf') {
      onInsertPDF();
      return;
    }

    // Special handling for card - creates card at viewport center
    if (toolId === 'card') {
      onToolChange('card');
      onInsertCard();
      return;
    }

    // Special handling for mind map - creates mind map at viewport center
    if (toolId === 'mindmap') {
      onToolChange('mindmap');
      onInsertMindMap();
      return;
    }

    onToolChange(toolId);
    onSetTool(toolId);
  };

  const coreTools = [
    { id: "select", icon: <MousePointer2 className="w-4 h-4" />, label: "Select", shortcut: "V" },
    { id: "hand", icon: <Hand className="w-4 h-4" />, label: "Hand", shortcut: "H" },
    { id: "draw", icon: <Pencil className="w-4 h-4" />, label: "Draw", shortcut: "D" },
    { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Eraser", shortcut: "E" },
    { id: "arrow", icon: <ArrowRight className="w-4 h-4" />, label: "Arrow", shortcut: "A" },
    { id: "text", icon: <Type className="w-4 h-4" />, label: "Text", shortcut: "T" },
  ];

  const shapeTools = [
    { id: "rectangle", icon: <Square className="w-4 h-4" />, label: "Rectangle", shortcut: "R" },
    { id: "ellipse", icon: <Circle className="w-4 h-4" />, label: "Ellipse", shortcut: "O" },
    { id: "frame", icon: <Frame className="w-4 h-4" />, label: "Frame", shortcut: "F" },
    { id: "sticky", icon: <StickyNote className="w-4 h-4" />, label: "Sticky Note", shortcut: "S" },
  ];

  const customTools = [
    { id: "card", icon: <FileText className="w-4 h-4" />, label: "Card", shortcut: "C" },
    { id: "image", icon: <Image className="w-4 h-4" />, label: "Insert Image", shortcut: "I" },
    { id: "pdf", icon: <FileType className="w-4 h-4" />, label: "PDF", shortcut: "P" },
    { id: "mindmap", icon: <Sparkles className="w-4 h-4" />, label: "Mind Map", shortcut: "M" },
  ];

  return (
    <>
      {/* Tool Settings Panel - appears above toolbar when draw tool is active */}
      <ToolSettingsPanel activeTool={activeTool} drawToolClickCount={drawToolClickCount} />

      {/* Main Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 p-1.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
          {/* Core Tools */}
          <div className="flex items-center gap-0.5">
            {coreTools.map((tool) => (
              <ToolButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                shortcut={tool.shortcut}
                isActive={activeTool === tool.id}
                onClick={() => handleToolChange(tool.id)}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Shape Tools */}
          <div className="flex items-center gap-0.5">
            {shapeTools.map((tool) => (
              <ToolButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                shortcut={tool.shortcut}
                isActive={activeTool === tool.id}
                onClick={() => handleToolChange(tool.id)}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Custom Tools */}
          <div className="flex items-center gap-0.5">
            {customTools.map((tool) => (
              <ToolButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                shortcut={tool.shortcut}
                isActive={activeTool === tool.id || (tool.id === 'card' && placementMode === 'card') || (tool.id === 'mindmap' && placementMode === 'mindmap')}
                onClick={() => handleToolChange(tool.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
