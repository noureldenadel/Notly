import { useDraggable } from '@dnd-kit/core';
import { DraggableItem } from './DndProvider';
import { ReactNode } from 'react';

interface DraggableLibraryItemProps {
    item: DraggableItem;
    children: ReactNode;
    disabled?: boolean;
}

export function DraggableLibraryItem({ item, children, disabled = false }: DraggableLibraryItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: item,
        disabled,
    });

    // When dragging, hide the original and let DragOverlay handle the preview
    const style = {
        opacity: isDragging ? 0 : 1,
        cursor: disabled ? 'default' : 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
        >
            {children}
        </div>
    );
}

export default DraggableLibraryItem;

