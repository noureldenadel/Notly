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
import {
    Upload,
    Download,
    FolderOpen,
    Check,
    X,
    FileArchive,
    Loader2,
} from 'lucide-react';
import { useProjectStore } from '@/stores';
import { exportProjectBundle, importProjectBundle } from '@/lib/projectBundle';
import { toast } from 'sonner';

interface ImportExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: 'import' | 'export';
}

export function ImportExportModal({ open, onOpenChange, initialTab = 'export' }: ImportExportModalProps) {
    const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { projects, loadProjects } = useProjectStore();

    // Sync active tab when modal opens
    useEffect(() => {
        if (open) {
            setActiveTab(initialTab);
            setImportFile(null);
            setImportStatus('idle');
            setImportError(null);
        }
    }, [open, initialTab]);

    // Handle file selection
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.notly')) {
                toast.error('Please select a .notly file');
                return;
            }
            setImportFile(file);
            setImportStatus('idle');
            setImportError(null);
        }
    }, []);

    // Handle export
    const handleExport = async (projectId: string) => {
        setExporting(true);
        try {
            await exportProjectBundle(projectId);
            toast.success('Project exported successfully!');
        } catch (e) {
            console.error('Export error:', e);
            toast.error('Failed to export project');
        } finally {
            setExporting(false);
        }
    };

    // Handle import
    const handleImport = async () => {
        if (!importFile) return;

        setImporting(true);
        setImportStatus('importing');
        setImportError(null);

        try {
            const newProjectId = await importProjectBundle(importFile);
            setImportStatus('success');
            toast.success('Project imported successfully!');

            // Reload projects to show the new one
            await loadProjects();

            // Close modal after short delay
            setTimeout(() => {
                onOpenChange(false);
            }, 1500);
        } catch (e) {
            console.error('Import error:', e);
            setImportStatus('error');
            setImportError(e instanceof Error ? e.message : 'Unknown error');
            toast.error('Failed to import project');
        } finally {
            setImporting(false);
        }
    };

    // Clear import
    const clearImport = () => {
        setImportFile(null);
        setImportStatus('idle');
        setImportError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileArchive className="w-5 h-5" />
                        Import / Export Project
                    </DialogTitle>
                    <DialogDescription>
                        Export projects as .notly files or import them back
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'import' | 'export')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="export" className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </TabsTrigger>
                        <TabsTrigger value="import" className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Import
                        </TabsTrigger>
                    </TabsList>

                    {/* Export Tab */}
                    <TabsContent value="export" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Select a project to export</Label>
                            <ScrollArea className="h-[250px] rounded-md border p-2">
                                {projects.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        No projects to export
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {projects.map((project) => (
                                            <div
                                                key={project.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{
                                                            backgroundColor: project.color
                                                                ? `hsl(var(--${project.color}))`
                                                                : 'hsl(var(--primary))'
                                                        }}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-sm">{project.title}</p>
                                                        {project.description && (
                                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {project.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleExport(project.id)}
                                                    disabled={exporting}
                                                >
                                                    {exporting ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Download className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* Placeholder to match Import tab button area */}
                        <div className="h-9" />

                        <p className="text-xs text-muted-foreground text-center">
                            Exports include all boards and embedded assets (images, PDFs)
                        </p>
                    </TabsContent>

                    {/* Import Tab */}
                    <TabsContent value="import" className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Select a .notly file to import</Label>
                            {/* File Drop Zone */}
                            <div
                                className={`border-2 border-dashed rounded-lg h-[250px] flex items-center justify-center text-center transition-colors ${importFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".notly"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="notly-import"
                                />

                                {!importFile ? (
                                    <label
                                        htmlFor="notly-import"
                                        className="cursor-pointer flex flex-col items-center gap-3"
                                    >
                                        <FolderOpen className="w-10 h-10 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Click to select a .notly file</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Or drag and drop here
                                            </p>
                                        </div>
                                    </label>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <FileArchive className="w-6 h-6 text-primary" />
                                            <span className="font-medium">{importFile.name}</span>
                                            {importStatus === 'idle' && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={clearImport}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>

                                        {importStatus === 'importing' && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Importing...
                                            </div>
                                        )}

                                        {importStatus === 'success' && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                                <Check className="w-4 h-4" />
                                                Import successful!
                                            </div>
                                        )}

                                        {importStatus === 'error' && (
                                            <div className="text-sm text-red-500">
                                                {importError || 'Import failed'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Import Button - only show when file selected and idle */}
                        {importFile && importStatus === 'idle' ? (
                            <Button
                                onClick={handleImport}
                                disabled={importing}
                                className="w-full"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Import Project
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="h-9" /> /* Placeholder to maintain consistent height */
                        )}

                        <p className="text-xs text-muted-foreground text-center">
                            Importing creates a new project with all boards and assets
                        </p>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

export default ImportExportModal;
