import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TipTapEditor } from './TipTapEditor';
import { useCardStore } from '@/stores';
import { X, Maximize2, Minimize2, Palette } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CardEditorModalProps {
    cardId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (cardId: string) => void;

}

const CARD_COLORS = [
    { id: 'highlight-blue', label: 'Blue', color: 'hsl(210 90% 65%)' },
    { id: 'highlight-purple', label: 'Purple', color: 'hsl(270 70% 65%)' },
    { id: 'highlight-green', label: 'Green', color: 'hsl(150 70% 50%)' },
    { id: 'highlight-yellow', label: 'Yellow', color: 'hsl(45 93% 65%)' },
    { id: 'highlight-pink', label: 'Pink', color: 'hsl(330 80% 65%)' },
];

export function CardEditorModal({
    cardId,
    isOpen,
    onClose,
    onSave,
}: CardEditorModalProps) {
    const { getCard, updateCard } = useCardStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState('highlight-blue');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Load card data when modal opens
    useEffect(() => {
        if (cardId && isOpen) {
            const card = getCard(cardId);
            if (card) {
                setTitle(card.title || '');
                setContent(card.content);
                setColor(card.color || 'highlight-blue');
            }
        }
    }, [cardId, isOpen, getCard]);

    // Handle save
    const handleSave = useCallback(() => {
        if (!cardId) return;

        updateCard(cardId, {
            title: title || undefined,
            content,
            color,
        });

        onSave?.(cardId);
    }, [cardId, title, content, color, updateCard, onSave]);



    // Auto-save on content change (debounced effect in production)
    const handleContentChange = useCallback((newContent: string) => {
        setContent(newContent);
    }, []);

    // Handle blur - auto-save
    const handleBlur = useCallback(() => {
        handleSave();
    }, [handleSave]);

    // Handle close with save
    const handleClose = useCallback(() => {
        handleSave();
        onClose();
    }, [handleSave, onClose]);

    if (!cardId) return null;

    const selectedColor = CARD_COLORS.find(c => c.id === color) || CARD_COLORS[0];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent
                className={cn(
                    'flex flex-col',
                    isFullscreen
                        ? 'max-w-[100vw] w-screen h-screen max-h-screen m-0 rounded-none'
                        : 'max-w-5xl w-full h-[80vh]' // Wider and Taller
                )}
            >
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Color indicator */}
                        <div
                            className="w-3 h-8 rounded-full"
                            style={{ backgroundColor: selectedColor.color }}
                        />

                        {/* Title input */}
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleSave}
                            placeholder="Card title..."
                            className="flex-1 text-lg font-semibold border-none bg-transparent focus-visible:ring-0 px-0"
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            {/* Color picker */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-8 h-8">
                                        <Palette className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {CARD_COLORS.map((c) => (
                                        <DropdownMenuItem
                                            key={c.id}
                                            onClick={() => {
                                                setColor(c.id);
                                                handleSave();
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: c.color }}
                                            />
                                            {c.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Fullscreen toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </Button>



                            {/* Close */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8"
                                onClick={handleClose}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Editor */}
                <div className="flex-1 overflow-auto rounded-lg border border-border bg-background">
                    <TipTapEditor
                        content={content}
                        onChange={handleContentChange}
                        onBlur={handleBlur}
                        placeholder="Start writing your note..."
                        showToolbar={true}
                    />
                </div>

                {/* Footer with word count */}
                <div className="flex-shrink-0 flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                    <span>Auto-save enabled</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CardEditorModal;
