import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Keyboard } from 'lucide-react';

interface ShortcutsCheatsheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const shortcutGroups = [
    {
        title: 'General',
        shortcuts: [
            { keys: 'Ctrl/⌘ + K', description: 'Open global search' },
            { keys: 'Ctrl/⌘ + N', description: 'Create new card' },
            { keys: 'Ctrl/⌘ + S', description: 'Save/sync changes' },
            { keys: 'Ctrl/⌘ + ,', description: 'Open settings' },
            { keys: '?', description: 'Show shortcuts' },
            { keys: 'Escape', description: 'Deselect / Close modal' },
        ],
    },
    {
        title: 'Edit',
        shortcuts: [
            { keys: 'Ctrl/⌘ + Z', description: 'Undo' },
            { keys: 'Ctrl/⌘ + Shift + Z', description: 'Redo' },
            { keys: 'Ctrl/⌘ + D', description: 'Duplicate selected' },
            { keys: 'Delete / Backspace', description: 'Delete selected' },
            { keys: 'Ctrl/⌘ + A', description: 'Select all' },
            { keys: 'Ctrl/⌘ + C', description: 'Copy' },
            { keys: 'Ctrl/⌘ + V', description: 'Paste' },
            { keys: 'Ctrl/⌘ + X', description: 'Cut' },
        ],
    },
    {
        title: 'Canvas Tools',
        shortcuts: [
            { keys: 'V', description: 'Select tool' },
            { keys: 'H', description: 'Hand/pan tool' },
            { keys: 'D', description: 'Draw tool' },
            { keys: 'E', description: 'Eraser tool' },
            { keys: 'A', description: 'Arrow tool' },
            { keys: 'T', description: 'Text tool' },
            { keys: 'F', description: 'Frame tool' },
            { keys: 'C', description: 'Card tool' },
        ],
    },
    {
        title: 'View',
        shortcuts: [
            { keys: 'Ctrl/⌘ + +', description: 'Zoom in' },
            { keys: 'Ctrl/⌘ + -', description: 'Zoom out' },
            { keys: 'Ctrl/⌘ + 0', description: 'Reset zoom' },
            { keys: 'Ctrl/⌘ + 1', description: 'Zoom to fit' },
            { keys: 'F11 / Ctrl/⌘ + Enter', description: 'Start presentation' },
        ],
    },
    {
        title: 'Presentation',
        shortcuts: [
            { keys: '→ / Space', description: 'Next frame' },
            { keys: '←', description: 'Previous frame' },
            { keys: 'Escape', description: 'Exit presentation' },
            { keys: 'L', description: 'Toggle laser pointer' },
        ],
    },
];

export function ShortcutsCheatsheet({ open, onOpenChange }: ShortcutsCheatsheetProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[500px] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {shortcutGroups.map((group, index) => (
                            <div key={group.title} className="space-y-3">
                                <h3 className="font-semibold text-sm text-primary">{group.title}</h3>
                                <div className="space-y-2">
                                    {group.shortcuts.map((shortcut) => (
                                        <div
                                            key={shortcut.keys}
                                            className="flex items-center justify-between gap-4"
                                        >
                                            <span className="text-sm text-muted-foreground">
                                                {shortcut.description}
                                            </span>
                                            <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded shrink-0">
                                                {shortcut.keys}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>
                                {index < shortcutGroups.length - 1 && (
                                    <Separator className="md:hidden mt-4" />
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                        Tip: On macOS, use ⌘ (Command) instead of Ctrl
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ShortcutsCheatsheet;
