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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

type AnnotationTool = "highlight" | "underline" | "comment" | "draw" | "text" | null;

const annotationColors = [
  { name: "Yellow", value: "hsl(45 93% 65%)" },
  { name: "Green", value: "hsl(150 70% 50%)" },
  { name: "Blue", value: "hsl(210 90% 65%)" },
  { name: "Pink", value: "hsl(330 80% 65%)" },
  { name: "Purple", value: "hsl(270 70% 65%)" },
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const tools = [
    { id: "highlight" as const, icon: Highlighter, label: "Highlight" },
    { id: "underline" as const, icon: Type, label: "Underline" },
    { id: "comment" as const, icon: MessageSquare, label: "Comment" },
    { id: "draw" as const, icon: Pencil, label: "Draw" },
    { id: "text" as const, icon: Type, label: "Text" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "p-0 gap-0 bg-background border-border overflow-hidden",
          isFullscreen
            ? "max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none"
            : "max-w-5xl w-[90vw] h-[85vh] max-h-[85vh]"
        )}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-medium truncate max-w-[300px]">
              {fileName}
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Page Thumbnails - Left Side */}
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

          {/* Main PDF View */}
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

            {/* Bottom Controls */}
            <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-muted/30 flex-shrink-0">
              {/* Page Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {currentPage} / {numPages || "—"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={goToNextPage}
                  disabled={currentPage >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom & Rotate Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={zoomIn}
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-5 mx-2" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={rotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Active Tool Indicator */}
              <div className="flex items-center gap-2 min-w-[120px] justify-end">
                {activeTool && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: activeColor }}
                    />
                    <span className="text-xs font-medium text-primary capitalize">
                      {activeTool}
                    </span>
                    <button
                      onClick={() => setActiveTool(null)}
                      className="text-primary hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Annotation Tools - Right Side */}
          <div className="w-56 border-l border-border bg-muted/20 flex-shrink-0 flex flex-col">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Annotations</span>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Annotation Tools */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Tools</span>
                  <div className="grid grid-cols-2 gap-2">
                    {tools.map((tool) => (
                      <Button
                        key={tool.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-auto py-3 px-2 flex flex-col items-center gap-1.5 rounded-lg transition-all",
                          activeTool === tool.id
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                        )}
                        onClick={() =>
                          setActiveTool(activeTool === tool.id ? null : tool.id)
                        }
                      >
                        <tool.icon className="h-4 w-4" />
                        <span className="text-[10px] font-medium">{tool.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Color Picker */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Color</span>
                  <div className="flex flex-wrap gap-2">
                    {annotationColors.map((color) => (
                      <button
                        key={color.name}
                        className={cn(
                          "w-8 h-8 rounded-lg transition-all border-2 flex items-center justify-center",
                          activeColor === color.value
                            ? "border-foreground scale-105 shadow-md"
                            : "border-transparent hover:scale-105 hover:shadow-sm"
                        )}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setActiveColor(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Quick Actions</span>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                    >
                      <Bookmark className="h-4 w-4 mr-2" />
                      <span className="text-xs">Add Bookmark</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span className="text-xs">Add Note</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Annotations List */}
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Recent Annotations</span>
                  <div className="text-xs text-muted-foreground/60 text-center py-4 border border-dashed border-border rounded-lg">
                    No annotations yet
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
