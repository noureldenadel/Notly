import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { X, MoreVertical, Copy, Pencil, Trash2, Files } from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { createLogger } from '@/lib/logger';

const log = createLogger('DraggableTab');

interface DraggableTabProps {
    board: { id: string; name: string };
    isActive: boolean;
    onClick: () => void;
    onRename: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

export function DraggableTab({
    board,
    isActive,
    onClick,
    onRename,
    onDelete,
    onDuplicate,
}: DraggableTabProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: board.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    // Handle double click for rename
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRename();
    };

    // Handle delete click (the 'X' button)
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent tab switching
        onDelete();
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    ref={setNodeRef}
                    style={style}
                    {...attributes}
                    {...listeners}
                    onClick={onClick}
                    onDoubleClick={handleDoubleClick}
                    className={cn(
                        "group relative flex items-center h-9 px-3 py-1.5 rounded-md text-sm font-medium transition-all select-none cursor-pointer border border-transparent min-w-[120px] max-w-[200px]",
                        isActive
                            ? "bg-background text-foreground shadow-sm border-border"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                >
                    {/* Text with fade mask for overflow */}
                    <span
                        className="flex-1 overflow-hidden whitespace-nowrap mr-6" // reserve space for Close button
                        style={board.name.length > 12 ? {
                            maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
                        } : undefined}
                    >
                        {board.name}
                    </span>

                    {/* Close Button - Appears on hover */}
                    <div
                        role="button"
                        onClick={handleDeleteClick}
                        className={cn(
                            "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-muted-foreground/20 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                            isActive && "opacity-0 group-hover:opacity-100" // Always show on hover even if active
                        )}
                        title="Close tab"
                    >
                        <X size={14} />
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={onRename}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={onDuplicate}>
                    <Files className="mr-2 h-4 w-4" />
                    Duplicate
                </ContextMenuItem>
                <ContextMenuItem onClick={() => {
                    navigator.clipboard.writeText(board.id);
                }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy ID
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
