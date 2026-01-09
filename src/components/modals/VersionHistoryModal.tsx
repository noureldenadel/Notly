import { useState } from 'react';
import { History, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVersionHistoryStore, Version, formatVersionTime } from '@/stores/versionHistoryStore';
import { cn } from '@/lib/utils';

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: Version['entityType'];
    entityId: string;
    onRestore: (snapshot: string) => void;
    currentContent?: string;
}

export function VersionHistoryModal({
    isOpen,
    onClose,
    entityType,
    entityId,
    onRestore,
    currentContent,
}: VersionHistoryModalProps) {
    const { getVersions, deleteVersion } = useVersionHistoryStore();
    const versions = getVersions(entityType, entityId);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [previewId, setPreviewId] = useState<string | null>(null);

    const handleRestore = (version: Version) => {
        if (window.confirm('Restore this version? Current content will be replaced.')) {
            onRestore(version.snapshot);
            onClose();
        }
    };

    const handleDelete = (versionId: string) => {
        if (window.confirm('Delete this version?')) {
            deleteVersion(versionId);
        }
    };

    // Strip HTML for preview
    const getPreviewText = (html: string): string => {
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 200 ? text.substring(0, 200) + '...' : text;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Version History
                    </DialogTitle>
                </DialogHeader>

                <div className="text-sm text-muted-foreground mb-2">
                    {versions.length} version{versions.length !== 1 ? 's' : ''} saved
                </div>

                <ScrollArea className="flex-1 pr-4">
                    {versions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No versions saved yet.
                            <br />
                            Versions are saved when you close the editor.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className={cn(
                                        "p-3 rounded-lg border transition-colors",
                                        previewId === version.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-muted-foreground/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {version.title || `Version ${versions.length - index}`}
                                                </span>
                                                {index === 0 && (
                                                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {formatVersionTime(version.createdAt)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8"
                                                onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
                                            >
                                                {expandedId === version.id ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8"
                                                onClick={() => handleRestore(version)}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(version.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    {expandedId === version.id && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <div className="text-xs text-muted-foreground mb-2">Preview:</div>
                                            <div className="text-sm bg-muted/50 p-3 rounded max-h-40 overflow-auto">
                                                {getPreviewText(version.snapshot)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default VersionHistoryModal;
