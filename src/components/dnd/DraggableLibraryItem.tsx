import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { DraggableItem } from './DndProvider';
import { ReactNode } from 'react';

interface DraggableLibraryItemProps {
    item: DraggableItem;
    children: ReactNode;
    disabled?: boolean;
}

export function DraggableLibraryItem({ item, children, disabled = false }: DraggableLibraryItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        data: item,
        disabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? 'default' : 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={isDragging ? 'pointer-events-none' : ''}
        >
            {children}
        </div>
    );
}

export default DraggableLibraryItem;
