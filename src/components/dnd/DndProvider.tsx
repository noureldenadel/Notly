import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, UniqueIdentifier } from '@dnd-kit/core';
import { useState, ReactNode, useCallback } from 'react';

export type DraggableItemType = 'card' | 'file' | 'highlight' | 'pdf';

export interface DraggableItem {
    id: string;
    type: DraggableItemType;
    data: {
        title?: string;
        content?: string;
        filename?: string;
        thumbnailPath?: string;
        color?: string;
        [key: string]: unknown;
    };
}

interface DndProviderProps {
    children: ReactNode;
    onDropOnCanvas?: (item: DraggableItem, position: { x: number; y: number }) => void;
}

export function DndProvider({ children, onDropOnCanvas }: DndProviderProps) {
    const [activeItem, setActiveItem] = useState<DraggableItem | null>(null);

    // Configure sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum drag distance before activation
            },
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const item = active.data.current as DraggableItem | undefined;
        if (item) {
            setActiveItem(item);
        }
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && over.id === 'canvas-drop-zone') {
            // Get drop position from the event coordinates
            const item = active.data.current as DraggableItem | undefined;
            if (item && onDropOnCanvas) {
                // Calculate position based on where the item was dropped
                const dropRect = over.rect;
                const position = {
                    x: dropRect.left + dropRect.width / 2,
                    y: dropRect.top + dropRect.height / 2,
                };
                onDropOnCanvas(item, position);
            }
        }

        setActiveItem(null);
    }, [onDropOnCanvas]);

    const handleDragCancel = useCallback(() => {
        setActiveItem(null);
    }, []);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {children}

            {/* Drag overlay - shows preview of item being dragged */}
            <DragOverlay dropAnimation={null}>
                {activeItem && (
                    <DragPreview item={activeItem} />
                )}
            </DragOverlay>
        </DndContext>
    );
}

// Preview component shown during drag
// Handles both DraggableItem (library items) and sortable items (which may not have full data)
function DragPreview({ item }: { item: DraggableItem | null }) {
    // Safety check - sortable items may not have the full structure
    if (!item || !item.data || !item.type) {
        return (
            <div className="w-48 h-10 bg-card border rounded-lg shadow-lg opacity-90 flex items-center justify-center px-3">
                <span className="text-xs text-foreground truncate">Reordering...</span>
            </div>
        );
    }

    const colorMap: Record<string, string> = {
        'highlight-blue': '210 90% 65%',
        'highlight-purple': '270 70% 65%',
        'highlight-green': '150 70% 50%',
        'highlight-yellow': '45 93% 65%',
        'highlight-pink': '330 80% 65%',
    };

    const hslColor = colorMap[item.data?.color || 'highlight-blue'] || '210 90% 65%';

    switch (item.type) {
        case 'card':
            return (
                <div
                    className="w-56 p-3 rounded-lg border-2 shadow-lg opacity-90"
                    style={{
                        backgroundColor: `hsl(${hslColor} / 0.15)`,
                        borderColor: `hsl(${hslColor} / 0.3)`,
                    }}
                >
                    <p className="text-sm font-medium truncate">{item.data.title || 'Card'}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.data.content || 'Drag to canvas...'}
                    </p>
                </div>
            );

        case 'file':
        case 'pdf':
            return (
                <div className="w-32 h-32 bg-card border-2 border-border rounded-lg shadow-lg opacity-90 flex flex-col items-center justify-center gap-2">
                    {item.data.thumbnailPath ? (
                        <img
                            src={item.data.thumbnailPath}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                        />
                    ) : (
                        <>
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="text-muted-foreground"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                            </svg>
                            <span className="text-xs text-muted-foreground truncate max-w-full px-2">
                                {item.data.filename || 'File'}
                            </span>
                        </>
                    )}
                </div>
            );

        case 'highlight':
            return (
                <div
                    className="w-48 p-2 rounded-md border-l-4 shadow-lg opacity-90"
                    style={{
                        backgroundColor: `hsl(${hslColor} / 0.15)`,
                        borderLeftColor: `hsl(${hslColor})`,
                    }}
                >
                    <p className="text-xs italic line-clamp-3">"{item.data.content}"</p>
                </div>
            );

        default:
            return (
                <div className="w-32 h-16 bg-card border rounded-lg shadow-lg opacity-90 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Dragging...</span>
                </div>
            );
    }
}

export default DndProvider;
