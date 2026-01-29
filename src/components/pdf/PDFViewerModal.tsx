import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Highlighter,
  MessageSquare,
  Pencil,
  Type,
  Bookmark,
  Download,
  RotateCw,
  Maximize2,
  X,
  Underline,
  StickyNote,
  Eraser
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  fileName?: string;
}

type AnnotationTool = "highlight" | "underline" | "comment" | "draw" | "text" | "note" | "erase" | null;

const annotationColors = [
  { name: "Yellow", value: "hsl(45 93% 65%)", class: "bg-yellow-400" },
  { name: "Green", value: "hsl(150 70% 50%)", class: "bg-green-400" },
  { name: "Blue", value: "hsl(210 90% 65%)", class: "bg-blue-400" },
  { name: "Pink", value: "hsl(330 80% 65%)", class: "bg-pink-400" },
  { name: "Purple", value: "hsl(270 70% 65%)", class: "bg-purple-400" },
];

const tools = [
  { id: "highlight" as const, icon: Highlighter, label: "Highlight", shortcut: "H" },
  { id: "underline" as const, icon: Underline, label: "Underline", shortcut: "U" },
  { id: "comment" as const, icon: MessageSquare, label: "Comment", shortcut: "C" },
  { id: "note" as const, icon: StickyNote, label: "Note", shortcut: "N" },
  { id: "draw" as const, icon: Pencil, label: "Draw", shortcut: "D" },
  { id: "text" as const, icon: Type, label: "Text", shortcut: "T" },
  { id: "erase" as const, icon: Eraser, label: "Eraser", shortcut: "E" },
];

export const PDFViewerModal = ({
  isOpen,
  onClose,
  pdfUrl = "/sample.pdf",
  fileName = "Document.pdf",
}: PDFViewerModalProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [activeTool, setActiveTool] = useState<AnnotationTool>(null);
  const [activeColor, setActiveColor] = useState(annotationColors[0].value);
  const [strokeWidth, setStrokeWidth] = useState([2]);
  const [opacity, setOpacity] = useState([100]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toolPopoverOpen, setToolPopoverOpen] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToolSelect = (toolId: AnnotationTool) => {
    if (activeTool === toolId) {
      setToolPopoverOpen((prev) => !prev);
    } else {
      setActiveTool(toolId);
      setToolPopoverOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex flex-col max-w-5xl w-[90vw] h-[85vh] max-h-[85vh] p-0 gap-0 bg-background border-border overflow-hidden",
          isFullscreen && "max-w-[100vw] w-screen h-screen max-h-screen rounded-none border-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <h2 className="text-sm font-medium truncate max-w-[300px]">
              {fileName}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Page Thumbnails - Left Side - ORIGINAL */}
          <div className="w-32 border-r border-border bg-muted/20 flex-shrink-0 flex flex-col">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pages</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {numPages > 0 ? (
                  Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-full rounded-lg border-2 transition-all overflow-hidden",
                        currentPage === pageNum
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="bg-card p-1">
                        <Document file={pdfUrl} loading={null} error={null}>
                          <Page
                            pageNumber={pageNum}
                            width={100}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="pointer-events-none"
                          />
                        </Document>
                      </div>
                      <div className={cn(
                        "text-xs py-1 text-center",
                        currentPage === pageNum
                          ? "bg-primary/10 text-primary font-medium"
                          : "bg-muted/50 text-muted-foreground"
                      )}>
                        {pageNum}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="space-y-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="w-full aspect-[3/4] rounded-lg bg-muted/50 animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main PDF View - ORIGINAL */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* PDF Viewer */}
            <ScrollArea className="flex-1">
              <div className="flex items-center justify-center p-6 min-h-full">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <div className="text-muted-foreground text-sm">
                        Loading PDF...
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center h-96 gap-3">
                      <div className="text-muted-foreground text-sm">
                        Failed to load PDF
                      </div>
                      <p className="text-xs text-muted-foreground/60">
                        Make sure the PDF file exists at: {pdfUrl}
                      </p>
                    </div>
                  }
                  noData={
                    <div className="flex flex-col items-center justify-center h-96 gap-3">
                      <div className="w-16 h-20 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">PDF</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No PDF file selected
                      </p>
                    </div>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    rotate={rotation}
                    className="shadow-lg rounded-sm overflow-hidden"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              </div>
            </ScrollArea>

            {/* Bottom Controls - Centered & Styled */}
            <div className="border-t border-border px-4 py-2 flex items-center justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 z-20">
              <div className="flex items-center gap-6">

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums min-w-[50px] text-center">
                    {currentPage} / {numPages || "—"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={goToNextPage}
                    disabled={currentPage >= numPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="h-4 w-[1px] bg-border" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums min-w-[3rem] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={zoomIn}
                    disabled={scale >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                <div className="h-4 w-[1px] bg-border" />

                {/* Rotate Control */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={rotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>

              </div>
            </div>
          </div>

          {/* Right Sidebar - Vertical Tools - NEW */}
          <TooltipProvider delayDuration={0}>
            <div className="w-[56px] border-l border-border bg-muted/10 flex flex-col items-center py-4 z-10 transition-all">
              <div className="flex flex-col gap-2">
                {tools.map((tool) => (
                  <Popover
                    key={tool.id}
                    open={activeTool === tool.id && toolPopoverOpen}
                    onOpenChange={(open) => {
                      if (!open) setToolPopoverOpen(false);
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-10 w-10 rounded-xl transition-all duration-200",
                              activeTool === tool.id
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                            onClick={() => handleToolSelect(tool.id)}
                          >
                            <tool.icon className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="flex items-center gap-2">
                        {tool.label} <kbd className="text-[9px] bg-muted/20 px-1 rounded ml-1">{tool.shortcut}</kbd>
                      </TooltipContent>
                    </Tooltip>

                    <PopoverContent side="left" align="start" className="w-[220px] p-3 mx-2" sideOffset={10}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <span className="text-sm font-semibold">{tool.label}</span>
                          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tool.shortcut}</kbd>
                        </div>

                        {/* Color Selection */}
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Color</span>
                          <div className="flex flex-wrap gap-2">
                            {annotationColors.map((color) => (
                              <button
                                key={color.name}
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 transition-all",
                                  activeColor === color.value ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: color.value }}
                                onClick={() => setActiveColor(color.value)}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Stroke/Opacity sliders (common for most tools) */}
                        {tool.id !== 'text' && tool.id !== 'note' && (
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Stroke</span>
                                <span className="font-mono">{strokeWidth[0]}px</span>
                              </div>
                              <Slider value={strokeWidth} onValueChange={setStrokeWidth} min={1} max={20} step={1} />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Opacity</span>
                                <span className="font-mono">{opacity[0]}%</span>
                              </div>
                              <Slider value={opacity} onValueChange={setOpacity} min={10} max={100} step={10} />
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
          </TooltipProvider>

        </div>
      </DialogContent>
    </Dialog>
  );
};
