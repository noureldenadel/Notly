import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
    id: string;
    children: ReactNode;
    showHandle?: boolean;
}

export function SortableItem({ id, children, showHandle = true }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group ${isDragging ? 'shadow-lg' : ''}`}
        >
            {showHandle && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 opacity-0 group-hover:opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                >
                    <GripVertical className="w-3 h-3 text-muted-foreground" />
                </div>
            )}
            <div {...(!showHandle ? { ...attributes, ...listeners } : {})}>
                {children}
            </div>
        </div>
    );
}

interface SortableListProps {
    items: string[];
    onReorder: (items: string[]) => void;
    children: ReactNode;
}

export function SortableList({ items, onReorder, children }: SortableListProps) {
    return (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {children}
        </SortableContext>
    );
}

// Re-export arrayMove for convenience
export { arrayMove };
