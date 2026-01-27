import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Upload,
    Download,
    FileText,
    Image,
    FileJson,
    File,
    Check,
    X,
    AlertCircle,
} from 'lucide-react';
import { useCardStore, useFileStore } from '@/stores';
import {
    importMarkdownFiles,
    importJsonBackup,
    exportCardsAsMarkdown,
    exportAsJson,
    exportProjectBackup,
    getFileType,
    IMPORT_ACCEPT,
} from '@/lib/importExport';
import type { Card } from '@/stores/types';

interface ImportExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: 'import' | 'export';
}

interface ImportedFile {
    file: File;
    type: ReturnType<typeof getFileType>;
    status: 'pending' | 'importing' | 'success' | 'error';
    error?: string;
}

export function ImportExportModal({ open, onOpenChange, initialTab = 'import' }: ImportExportModalProps) {
    const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab);

    // Reset tab when opening
    if (open && activeTab !== initialTab) {
        // We use a ref or effect usually, but for simple modal logic:
        // Actually, better to use useEffect to sync when open changes to true
    }
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { cards, createCard } = useCardStore();
    const { addFile } = useFileStore();

    // Sync active tab when modal opens
    useEffect(() => {
        if (open) {
            setActiveTab(initialTab);
        }
    }, [open, initialTab]);

    // Handle file selection
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newFiles: ImportedFile[] = Array.from(files).map(file => ({
            file,
            type: getFileType(file),
            status: 'pending' as const,
        }));

        setImportedFiles(prev => [...prev, ...newFiles]);
    }, []);

    // Process imports
    const processImports = async () => {
        setImporting(true);
        const total = importedFiles.filter(f => f.status === 'pending').length;
        let processed = 0;

        const updatedFiles = [...importedFiles];

        for (let i = 0; i < updatedFiles.length; i++) {
            const importedFile = updatedFiles[i];
            if (importedFile.status !== 'pending') continue;

            updatedFiles[i] = { ...importedFile, status: 'importing' };
            setImportedFiles([...updatedFiles]);

            try {
                switch (importedFile.type) {
                    case 'markdown': {
                        const cardsData = await importMarkdownFiles([importedFile.file]);
                        for (const card of cardsData) {
                            createCard(card.content || '', card.title, card.color);
                        }
                        updatedFiles[i] = { ...importedFile, status: 'success' };
                        break;
                    }
                    case 'json': {
                        const result = await importJsonBackup(importedFile.file);
                        if (result) {
                            updatedFiles[i] = { ...importedFile, status: 'success' };
                        } else {
                            updatedFiles[i] = { ...importedFile, status: 'error', error: 'Invalid JSON format' };
                        }
                        break;
                    }
                    case 'image':
                    case 'pdf': {
                        // Add file to store
                        addFile(
                            importedFile.file.name,
                            importedFile.file.name, // Would be actual path in Tauri
                            importedFile.type,
                            {
                                fileSize: importedFile.file.size,
                                mimeType: importedFile.file.type,
                                importMode: 'copy',
                            }
                        );
                        updatedFiles[i] = { ...importedFile, status: 'success' };
                        break;
                    }
                    default:
                        updatedFiles[i] = { ...importedFile, status: 'error', error: 'Unsupported file type' };
                }
            } catch (e) {
                updatedFiles[i] = {
                    ...importedFile,
                    status: 'error',
                    error: e instanceof Error ? e.message : 'Unknown error'
                };
            }

            processed++;
            setImportProgress((processed / total) * 100);
            setImportedFiles([...updatedFiles]);
        }

        setImporting(false);
        setTimeout(() => setImportProgress(0), 1000);
    };

    // Clear import list
    const clearImports = () => {
        setImportedFiles([]);
        setImportProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Toggle card selection
    const toggleCardSelection = (cardId: string) => {
        setSelectedCards(prev => {
            const next = new Set(prev);
            if (next.has(cardId)) {
                next.delete(cardId);
            } else {
                next.add(cardId);
            }
            return next;
        });
    };

    // Select all cards
    const selectAllCards = () => {
        setSelectedCards(new Set(cards.map(c => c.id)));
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedCards(new Set());
    };

    // Export selected cards as Markdown
    const handleExportMarkdown = () => {
        const selectedCardsData = cards.filter(c => selectedCards.has(c.id));
        if (selectedCardsData.length > 0) {
            exportCardsAsMarkdown(selectedCardsData, 'cards-export.md');
        }
    };

    // Export as JSON
    const handleExportJson = () => {
        const selectedCardsData = cards.filter(c => selectedCards.has(c.id));
        exportAsJson(selectedCardsData, 'cards-export.json');
    };

    // Export full backup
    const handleExportBackup = () => {
        exportProjectBackup('default');
    };

    // Get file icon
    const getFileIcon = (type: ReturnType<typeof getFileType>) => {
        switch (type) {
            case 'markdown': return <FileText className="w-4 h-4" />;
            case 'image': return <Image className="w-4 h-4" />;
            case 'json': return <FileJson className="w-4 h-4" />;
            default: return <File className="w-4 h-4" />;
        }
    };

    // Get status icon
    const getStatusIcon = (status: ImportedFile['status']) => {
        switch (status) {
            case 'success': return <Check className="w-4 h-4 text-green-500" />;
            case 'error': return <X className="w-4 h-4 text-red-500" />;
            case 'importing': return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
            default: return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {activeTab === 'import' ? <Upload className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                        Import / Export
                    </DialogTitle>
                    <DialogDescription>
                        Import files or export your notes and data
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'import' | 'export')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="import" className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Import
                        </TabsTrigger>
                        <TabsTrigger value="export" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </TabsTrigger>
                    </TabsList>

                    {/* Import Tab */}
                    <TabsContent value="import" className="space-y-4 mt-4">
                        {/* File Input */}
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept={IMPORT_ACCEPT.all}
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-import"
                            />
                            <label
                                htmlFor="file-import"
                                className="cursor-pointer flex flex-col items-center gap-2"
                            >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <p className="text-sm font-medium">Click to select files</p>
                                <p className="text-xs text-muted-foreground">
                                    Supports: Markdown, Images, PDFs, JSON backups
                                </p>
                            </label>
                        </div>

                        {/* Import Progress */}
                        {importing && (
                            <Progress value={importProgress} className="w-full" />
                        )}

                        {/* File List */}
                        {importedFiles.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Selected Files ({importedFiles.length})</Label>
                                    <Button variant="ghost" size="sm" onClick={clearImports}>
                                        Clear All
                                    </Button>
                                </div>
                                <ScrollArea className="h-[150px] rounded-md border p-2">
                                    <div className="space-y-2">
                                        {importedFiles.map((f, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {getFileIcon(f.type)}
                                                    <span className="text-sm truncate max-w-[200px]">
                                                        {f.file.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {f.error && (
                                                        <span className="text-xs text-red-500">{f.error}</span>
                                                    )}
                                                    {getStatusIcon(f.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <Button
                                    onClick={processImports}
                                    disabled={importing || importedFiles.every(f => f.status !== 'pending')}
                                    className="w-full"
                                >
                                    {importing ? 'Importing...' : 'Import Files'}
                                </Button>
                            </div>
                        )}

                        {/* Empty state */}
                        {importedFiles.length === 0 && (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                                Select files to import
                            </div>
                        )}
                    </TabsContent>

                    {/* Export Tab */}
                    <TabsContent value="export" className="space-y-4 mt-4">
                        {/* Card Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Select Cards to Export ({selectedCards.size})</Label>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={selectAllCards}>
                                        Select All
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                                        Clear
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[150px] rounded-md border p-2">
                                {cards.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                        No cards to export
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cards.map((card) => (
                                            <div
                                                key={card.id}
                                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                                            >
                                                <Checkbox
                                                    checked={selectedCards.has(card.id)}
                                                    onCheckedChange={() => toggleCardSelection(card.id)}
                                                />
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm truncate">
                                                    {card.title || 'Untitled Card'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* Export Options */}
                        <div className="space-y-2">
                            <Label>Export Format</Label>
                            <div className="grid grid-cols-1 gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleExportMarkdown}
                                    disabled={selectedCards.size === 0}
                                    className="justify-start"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Export as Markdown (.md)
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleExportJson}
                                    disabled={selectedCards.size === 0}
                                    className="justify-start"
                                >
                                    <FileJson className="w-4 h-4 mr-2" />
                                    Export as JSON (.json)
                                </Button>
                            </div>
                        </div>

                        {/* Full Backup */}
                        <div className="pt-4 border-t space-y-2">
                            <Label className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Full Backup
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Export all your data including projects, cards, files, and settings
                            </p>
                            <Button variant="secondary" onClick={handleExportBackup} className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Export Full Backup
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

export default ImportExportModal;
