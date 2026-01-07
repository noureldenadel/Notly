import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface CanvasDropZoneProps {
    children: ReactNode;
    className?: string;
}

export function CanvasDropZone({ children, className = '' }: CanvasDropZoneProps) {
    const { setNodeRef, isOver, active } = useDroppable({
        id: 'canvas-drop-zone',
    });

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'ring-2 ring-primary ring-inset' : ''}`}
            style={{
                position: 'relative',
                transition: 'box-shadow 0.2s ease',
            }}
        >
            {children}

            {/* Drop indicator overlay */}
            {active && (
                <div
                    className="absolute inset-0 pointer-events-none z-40 transition-opacity duration-200"
                    style={{
                        backgroundColor: isOver ? 'rgba(var(--primary), 0.05)' : 'transparent',
                        border: isOver ? '2px dashed hsl(var(--primary))' : 'none',
                    }}
                >
                    {isOver && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                            Drop to add
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CanvasDropZone;
