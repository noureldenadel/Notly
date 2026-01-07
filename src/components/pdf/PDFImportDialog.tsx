import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '@/lib/utils';
import { FileType, Upload, Link, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type PDFImportMode = 'copy' | 'link';

export interface ImportedPDF {
    id: string;
    filename: string;
    filePath: string;
    mode: PDFImportMode;
    numPages: number;
    thumbnail?: string;
    dateAdded: string;
}

interface PDFImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (pdf: Omit<ImportedPDF, 'id' | 'dateAdded'>) => void;
}

export function PDFImportDialog({ isOpen, onClose, onImport }: PDFImportDialogProps) {
    const [filePath, setFilePath] = useState('');
    const [filename, setFilename] = useState('');
    const [importMode, setImportMode] = useState<PDFImportMode>('link');
    const [numPages, setNumPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFilename(file.name);
        setIsLoading(true);
        setError(null);

        // For browser testing, use object URL
        const objectUrl = URL.createObjectURL(file);
        setFilePath(objectUrl);
    }, []);

    const handleDocumentLoad = useCallback(async ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
    }, []);

    const handleDocumentError = useCallback((error: Error) => {
        console.error('PDF load error:', error);
        setError('Failed to load PDF. Please check the file.');
        setIsLoading(false);
    }, []);

    const handleImport = useCallback(() => {
        if (!filePath || !filename) return;

        onImport({
            filename,
            filePath,
            mode: importMode,
            numPages,
            thumbnail: thumbnail || undefined,
        });

        // Reset state
        setFilePath('');
        setFilename('');
        setNumPages(0);
        setThumbnail(null);
        onClose();
    }, [filePath, filename, importMode, numPages, thumbnail, onImport, onClose]);

    const handleClose = useCallback(() => {
        setFilePath('');
        setFilename('');
        setNumPages(0);
        setThumbnail(null);
        setError(null);
        onClose();
    }, [onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileType className="w-5 h-5 text-primary" />
                        Import PDF
                    </DialogTitle>
                    <DialogDescription>
                        Add a PDF to your library for viewing and annotation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* File Selection */}
                    <div className="space-y-2">
                        <Label>Select PDF File</Label>
                        <div className="flex gap-2">
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4" />
                                {filename || 'Choose file...'}
                            </Button>
                        </div>
                    </div>

                    {/* PDF Preview */}
                    {filePath && !error && (
                        <div className="border rounded-lg p-2 bg-muted/30">
                            <div className="flex items-start gap-3">
                                <div className="w-16 h-20 bg-white rounded border overflow-hidden flex-shrink-0">
                                    <Document
                                        file={filePath}
                                        onLoadSuccess={handleDocumentLoad}
                                        onLoadError={handleDocumentError}
                                        loading={
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                                            </div>
                                        }
                                    >
                                        <Page
                                            pageNumber={1}
                                            width={64}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                        />
                                    </Document>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{filename}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isLoading ? 'Loading...' : `${numPages} page${numPages !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    {/* Import Mode */}
                    <div className="space-y-2">
                        <Label>Import Mode</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={importMode === 'link' ? 'default' : 'outline'}
                                className="justify-start gap-2"
                                onClick={() => setImportMode('link')}
                            >
                                <Link className="w-4 h-4" />
                                Link File
                            </Button>
                            <Button
                                variant={importMode === 'copy' ? 'default' : 'outline'}
                                className="justify-start gap-2"
                                onClick={() => setImportMode('copy')}
                            >
                                <Copy className="w-4 h-4" />
                                Copy File
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {importMode === 'link'
                                ? 'Reference the original file. Changes to the original will be reflected.'
                                : 'Copy the file to your project folder. The copy is independent of the original.'
                            }
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!filePath || !filename || isLoading}
                        >
                            Import PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PDFImportDialog;
