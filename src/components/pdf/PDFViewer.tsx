import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Download,
    X,
    Highlighter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Import required CSS for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export interface PDFHighlight {
    id: string;
    pageNumber: number;
    text: string;
    color: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

interface PDFViewerProps {
    filePath: string;
    onClose?: () => void;
    onHighlight?: (highlight: Omit<PDFHighlight, 'id'>) => void;
    onPageDrag?: (pageNumber: number, thumbnail: string) => void;
    highlights?: PDFHighlight[];
    initialPage?: number;
    className?: string;
}

export function PDFViewer({
    filePath,
    onClose,
    onHighlight,
    onPageDrag,
    highlights = [],
    initialPage = 1,
    className = '',
}: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [scale, setScale] = useState(1.0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isHighlightMode, setIsHighlightMode] = useState(false);
    const [highlightColor, setHighlightColor] = useState('highlight-yellow');
    const containerRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
        setError(null);
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('PDF load error:', error);
        setError('Failed to load PDF. Please check the file path.');
        setIsLoading(false);
    }, []);

    const goToPrevPage = useCallback(() => {
        setPageNumber(prev => Math.max(1, prev - 1));
    }, []);

    const goToNextPage = useCallback(() => {
        setPageNumber(prev => Math.min(numPages, prev + 1));
    }, [numPages]);

    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(3, prev + 0.25));
    }, []);

    const zoomOut = useCallback(() => {
        setScale(prev => Math.max(0.5, prev - 0.25));
    }, []);

    const fitToWidth = useCallback(() => {
        if (containerRef.current) {
            setScale(1.0);
        }
    }, []);

    // Handle text selection for highlighting
    const handleTextSelection = useCallback(() => {
        if (!isHighlightMode || !onHighlight) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const text = selection.toString().trim();
        if (!text) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (containerRect) {
            onHighlight({
                pageNumber,
                text,
                color: highlightColor,
                position: {
                    x: rect.left - containerRect.left,
                    y: rect.top - containerRect.top,
                    width: rect.width,
                    height: rect.height,
                },
            });

            selection.removeAllRanges();
        }
    }, [isHighlightMode, pageNumber, highlightColor, onHighlight]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                goToPrevPage();
            } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                goToNextPage();
            } else if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToPrevPage, goToNextPage, onClose]);

    const highlightColors = [
        'highlight-yellow',
        'highlight-green',
        'highlight-blue',
        'highlight-purple',
        'highlight-pink',
    ];

    return (
        <div className={cn('flex flex-col h-full bg-background', className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-card/50">
                <div className="flex items-center gap-1">
                    {/* Page navigation */}
                    <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-2 min-w-[80px] text-center">
                        {isLoading ? '...' : `${pageNumber} / ${numPages}`}
                    </span>
                    <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    {/* Zoom controls */}
                    <Button variant="ghost" size="icon" onClick={zoomOut}>
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm px-2 min-w-[60px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="ghost" size="icon" onClick={zoomIn}>
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fitToWidth}>
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    {/* Highlight mode toggle */}
                    <Button
                        variant={isHighlightMode ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => setIsHighlightMode(!isHighlightMode)}
                        className={isHighlightMode ? 'bg-primary' : ''}
                    >
                        <Highlighter className="w-4 h-4" />
                    </Button>

                    {/* Highlight color picker (shown when highlight mode is on) */}
                    {isHighlightMode && (
                        <div className="flex items-center gap-0.5 ml-1">
                            {highlightColors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setHighlightColor(color)}
                                    className={cn(
                                        'w-5 h-5 rounded-full border-2 transition-all',
                                        highlightColor === color ? 'border-foreground scale-110' : 'border-transparent'
                                    )}
                                    style={{
                                        backgroundColor: `hsl(var(--${color}))`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="ml-2">
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* PDF Content */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-4 flex justify-center items-start"
                onMouseUp={handleTextSelection}
            >
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p>{error}</p>
                    </div>
                ) : (
                    <Document
                        file={filePath}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        }
                    >
                        <div className="relative shadow-lg">
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="bg-white"
                            />

                            {/* Render highlights for current page */}
                            {highlights
                                .filter(h => h.pageNumber === pageNumber)
                                .map(highlight => (
                                    <div
                                        key={highlight.id}
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: highlight.position.x * scale,
                                            top: highlight.position.y * scale,
                                            width: highlight.position.width * scale,
                                            height: highlight.position.height * scale,
                                            backgroundColor: `hsl(var(--${highlight.color}) / 0.3)`,
                                        }}
                                    />
                                ))}
                        </div>
                    </Document>
                )}
            </div>

            {/* Page thumbnails strip (optional) */}
            {numPages > 1 && (
                <div className="h-24 border-t bg-card/50 overflow-x-auto flex items-center gap-2 p-2">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setPageNumber(page)}
                            className={cn(
                                'flex-shrink-0 w-14 h-20 rounded border-2 overflow-hidden transition-all',
                                page === pageNumber ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                            )}
                        >
                            <Document file={filePath}>
                                <Page
                                    pageNumber={page}
                                    width={56}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PDFViewer;
