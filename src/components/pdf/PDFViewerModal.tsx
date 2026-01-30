import { useState, useRef, useMemo, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Pencil,
  Type,
  Download,
  RotateCw,
  Maximize2,
  X,
  Eraser,
  Eye,
  EyeOff,
  MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PDFAnnotationLayer, AnnotationPath, TextAnnotation } from "./PDFAnnotationLayer";

// ... (pdfjs worker setup stays same)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ... (interfaces stay same)
interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  fileName?: string;
}

type AnnotationTool = "highlight" | "draw" | "text" | "erase" | "select" | null;

const annotationColors = [
  { name: "Yellow", value: "#fde047", class: "bg-yellow-300" }, // Highlighter Yellow
  { name: "Green", value: "#4ade80", class: "bg-green-400" },
  { name: "Blue", value: "#60a5fa", class: "bg-blue-400" },
  { name: "Red", value: "#f87171", class: "bg-red-400" },
  { name: "Black", value: "#000000", class: "bg-black" },
];

const tools = [
  { id: "select" as const, icon: MousePointer2, label: "Select & Move", shortcut: "V" },
  { id: "highlight" as const, icon: Highlighter, label: "Highlight", shortcut: "H" },
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
  const [pageDimensions, setPageDimensions] = useState({ width: 595, height: 842 }); // Default A4, updated on load
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>('');

  // Resolve PDF URL
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      try {
        if (!pdfUrl) return;

        // If it's already a blob/data URL or http, use it
        if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('data:') || pdfUrl.startsWith('http')) {
          if (active) setResolvedPdfUrl(pdfUrl);
          return;
        }

        // Otherwise resolve using asset manager
        const { getAssetUrl } = await import('@/lib/assetManager');
        const url = await getAssetUrl(pdfUrl);
        if (active) setResolvedPdfUrl(url);
      } catch (e) {
        console.error('Failed to resolve PDF URL:', e);
      }
    };
    resolve();
    return () => { active = false; };
  }, [pdfUrl]);


  // Annotation State
  const [activeTool, setActiveTool] = useState<AnnotationTool>(null);
  const [activeColor, setActiveColor] = useState(annotationColors[0].value);
  const [strokeWidth, setStrokeWidth] = useState([2]); // For Highlight this should be larger default?
  const [opacity, setOpacity] = useState([100]); // Highlight logic handles opacity internally usually

  const [paths, setPaths] = useState<AnnotationPath[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toolPopoverOpen, setToolPopoverOpen] = useState(false);

  // Dynamic default settings when tool changes
  const handleToolSelect = (toolId: AnnotationTool) => {
    if (activeTool === toolId) {
      // Toggle off if clicking same tool? Or just open popover?
      // Let's just open/close popover for refinement
      if (toolPopoverOpen) {
        setToolPopoverOpen(false);
        // Optional: Deselect tool? setActiveTool(null);
      } else {
        setToolPopoverOpen(true);
      }
    } else {
      setActiveTool(toolId);
      setToolPopoverOpen(true);

      // Set sane defaults
      if (toolId === 'highlight') {
        setStrokeWidth([20]); // Thick marker
        setOpacity([50]); // Translucent
        if (activeColor === '#000000') setActiveColor('#fde047'); // Yellow default
      } else if (toolId === 'draw') {
        setStrokeWidth([2]); // Thin pen
        setOpacity([100]); // Opaque
        setActiveColor('#000000'); // Black default
      } else if (toolId === 'text') {
        setStrokeWidth([3]); // Acts as Font Size (x5) -> 15px
        setActiveColor('#000000');
      } else if (toolId === 'erase') {
        setStrokeWidth([20]); // Big eraser
      }
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation((prev) => (prev + 90) % 360);

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
          {/* Left Sidebar - Thumbnails */}
          <div className="w-48 border-r border-border bg-muted/5 flex flex-col hidden md:flex">
            <div className="p-3 border-b border-border text-xs font-semibold text-muted-foreground">
              Pages ({numPages})
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {/* Single Document for all thumbnails - avoids loading PDF multiple times */}
                <Document file={resolvedPdfUrl} className="contents">
                  {Array.from(new Array(numPages), (el, index) => (
                    <button
                      key={`page_${index + 1}`}
                      onClick={() => setCurrentPage(index + 1)}
                      className={cn(
                        "w-full flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        currentPage === index + 1 ? "bg-background text-primary shadow-sm ring-1 ring-border" : "hover:bg-background/50 text-muted-foreground"
                      )}
                    >
                      <div className={cn("relative w-full aspect-[1/1.414] bg-background rounded border shadow-sm overflow-hidden pointer-events-none", currentPage === index + 1 ? "border-primary/50" : "border-border")}>
                        <Page
                          pageNumber={index + 1}
                          width={120}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          loading={<div className="w-full h-full bg-muted animate-pulse" />}
                        />
                      </div>
                      <span className="text-xs font-medium">Page {index + 1}</span>
                    </button>
                  ))}
                </Document>
              </div>
            </ScrollArea>
          </div>

          {/* Main PDF View */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/10 relative">
            {/* PDF Viewer */}
            <ScrollArea className="flex-1">
              <div className="flex items-center justify-center p-6 min-h-full">
                <Document
                  file={resolvedPdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="h-96 flex items-center justify-center text-muted-foreground">Loading PDF...</div>}
                >
                  <div className="relative shadow-lg rounded-sm overflow-hidden" style={{ transform: `rotate(${rotation}deg)` }}>
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      rotate={0}
                      className="block"
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      onRenderSuccess={(page) => {
                        // Capture actual page dimensions for annotation layer
                        setPageDimensions({ width: page.width, height: page.height });
                      }}
                    />
                    {/* Overlay */}
                    <PDFAnnotationLayer
                      width={pageDimensions.width * scale}
                      height={pageDimensions.height * scale}
                      scale={scale}
                      page={currentPage}
                      tool={activeTool}
                      activeColor={activeColor}
                      strokeWidth={strokeWidth[0]}
                      opacity={opacity[0]}
                      visible={showAnnotations}
                      annotations={{ paths, texts }}
                      onAnnotationsChange={(newPaths, newTexts) => {
                        setPaths(newPaths);
                        setTexts(newTexts);
                      }}
                    />
                  </div>
                </Document>
              </div>
            </ScrollArea>

            {/* Bottom Controls */}
            <div className="border-t border-border px-4 py-2 flex items-center justify-center bg-background/95 backdrop-blur z-20">
              <div className="flex items-center gap-6">
                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevPage} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm tabular-nums">{currentPage} / {numPages || '-'}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextPage} disabled={currentPage >= numPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <div className="h-4 w-px bg-border" />
                {/* Zoom */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={scale <= 0.5}><ZoomOut className="h-4 w-4" /></Button>
                  <span className="text-sm tabular-nums text-center min-w-[3rem]">{Math.round(scale * 100)}%</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={scale >= 3}><ZoomIn className="h-4 w-4" /></Button>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Rotate Control */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={rotate}
                    title="Rotate Page"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted", !showAnnotations && "opacity-50")}
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    title={showAnnotations ? "Hide Annotations" : "Show Annotations"}
                  >
                    {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Tools */}
          <TooltipProvider delayDuration={0}>
            <div className="w-[56px] border-l border-border bg-card flex flex-col items-center py-4 z-10">
              <div className="flex flex-col gap-2">
                {tools.map((tool) => (
                  tool.id === 'select' ? (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-xl transition-all",
                            activeTool === tool.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => handleToolSelect(tool.id)}
                        >
                          <tool.icon className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">{tool.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Popover
                      key={tool.id}
                      open={activeTool === tool.id && toolPopoverOpen}
                      onOpenChange={(open) => {
                        if (!open) {
                          setToolPopoverOpen(false);
                        }
                      }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-10 w-10 rounded-xl transition-all",
                                activeTool === tool.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                              )}
                              onClick={() => handleToolSelect(tool.id)}
                            >
                              <tool.icon className="h-5 w-5" />
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="left">{tool.label}</TooltipContent>
                      </Tooltip>

                      <PopoverContent side="left" align="start" className="w-[220px] p-3 mx-2" sideOffset={10}>
                        <div className="space-y-4">
                          <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">{tool.label} Settings</span>
                          </div>

                          {/* Tool Preview */}
                          <div className="h-12 w-full bg-muted/30 rounded-md mb-3 flex items-center justify-center border border-border/50 overflow-hidden relative">
                            {(!activeTool || activeTool === 'erase') ? (
                              <div className="rounded-full bg-foreground/10 border border-foreground/20" style={{ width: strokeWidth[0], height: strokeWidth[0], maxWidth: 32, maxHeight: 32 }} />
                            ) : activeTool === 'text' ? (
                              <span style={{ color: activeColor, fontSize: Math.min(32, strokeWidth[0] * 3) }}>Ag</span>
                            ) : (
                              <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <path
                                  d="M 10 20 C 30 5, 70 35, 90 20"
                                  fill="none"
                                  stroke={activeColor}
                                  strokeWidth={strokeWidth[0]}
                                  strokeOpacity={activeTool === 'highlight' ? opacity[0] / 100 : opacity[0] / 100}
                                  strokeLinecap="round"
                                  style={{ mixBlendMode: activeTool === 'highlight' ? 'multiply' : 'normal' }}
                                />
                              </svg>
                            )}
                          </div>

                          {/* Color Picker (Skip for Eraser) */}
                          {tool.id !== 'erase' && (
                            <div className="space-y-2">
                              <span className="text-xs text-muted-foreground uppercase">Color</span>
                              <div className="flex flex-wrap gap-2">
                                {annotationColors.map(c => (
                                  <button
                                    key={c.name}
                                    className={cn("w-6 h-6 rounded-full border-2 transition-all", activeColor === c.value ? "border-foreground scale-110" : "border-transparent")}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => setActiveColor(c.value)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sliders */}
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <span className="text-xs text-muted-foreground flex justify-between">
                                {tool.id === 'text' ? 'Font Size' : 'Stroke Width'}
                                <span>{strokeWidth}px</span>
                              </span>
                              <Slider value={strokeWidth} onValueChange={setStrokeWidth} min={1} max={40} step={1} />
                            </div>

                            {/* Opacity (Skip for Eraser) */}
                            {tool.id !== 'erase' && (
                              <div className="space-y-1.5">
                                <span className="text-xs text-muted-foreground flex justify-between">
                                  Opacity
                                  <span>{opacity}%</span>
                                </span>
                                <Slider value={opacity} onValueChange={setOpacity} min={10} max={100} step={10} />
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )
                ))}
              </div>
            </div>
          </TooltipProvider>

        </div>
      </DialogContent>
    </Dialog>
  );
};
