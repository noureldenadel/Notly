import { Document, Page, pdfjs } from 'react-pdf';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FileType } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFThumbnailProps {
    filePath: string;
    pageNumber?: number;
    width?: number;
    className?: string;
    onClick?: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

export function PDFThumbnail({
    filePath,
    pageNumber = 1,
    width = 120,
    className = '',
    onClick,
    draggable = false,
    onDragStart,
}: PDFThumbnailProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
        <div
            className={cn(
                'relative rounded-lg overflow-hidden border bg-card transition-all cursor-pointer',
                'hover:ring-2 hover:ring-primary/50 hover:shadow-md',
                draggable && 'cursor-grab active:cursor-grabbing',
                className
            )}
            style={{ width: width + 8 }}
            onClick={onClick}
            draggable={draggable}
            onDragStart={onDragStart}
        >
            {hasError ? (
                <div
                    className="flex flex-col items-center justify-center gap-2 bg-muted aspect-[3/4]"
                    style={{ width }}
                >
                    <FileType className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">PDF</span>
                </div>
            ) : (
                <>
                    {isLoading && (
                        <div
                            className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse"
                        >
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    <Document
                        file={filePath}
                        loading={null}
                        onLoadSuccess={() => setIsLoading(false)}
                        onLoadError={() => {
                            setIsLoading(false);
                            setHasError(true);
                        }}
                    >
                        <Page
                            pageNumber={pageNumber}
                            width={width}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="pointer-events-none"
                        />
                    </Document>
                </>
            )}

            {/* Page number badge */}
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {pageNumber}
            </div>
        </div>
    );
}

// Higher-order function to generate thumbnail as data URL
export async function generatePDFThumbnail(
    filePath: string,
    pageNumber: number = 1,
    width: number = 200
): Promise<string> {
    const loadingTask = pdfjs.getDocument(filePath);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale: 1 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    await page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas,
    }).promise;

    return canvas.toDataURL('image/png');
}

export default PDFThumbnail;
