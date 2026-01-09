import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Editor } from 'tldraw';
import { usePresentationStore } from '@/stores';
import { useCanvasStore } from '@/stores';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    X,
    Circle,
    MousePointer2,
} from 'lucide-react';

interface LaserPoint {
    x: number;
    y: number;
    id: number;
}

export function PresentationMode() {
    const {
        isPresenting,
        currentFrameIndex,
        frames,
        laserEnabled,
        laserColor,
        exitPresentation,
        nextFrame,
        previousFrame,
        goToFrame,
        toggleLaser,
    } = usePresentationStore();

    const { editorRef } = useCanvasStore();
    const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
    const laserIdRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isPresenting) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    nextFrame();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    previousFrame();
                    break;
                case 'Escape':
                    e.preventDefault();
                    exitPresentation();
                    break;
                case 'l':
                case 'L':
                    toggleLaser();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPresenting, nextFrame, previousFrame, exitPresentation, toggleLaser]);

    // Handle laser pointer
    useEffect(() => {
        if (!isPresenting || !laserEnabled) return;

        const handleMouseMove = (e: MouseEvent) => {
            const id = laserIdRef.current++;
            setLaserPoints(prev => [...prev, { x: e.clientX, y: e.clientY, id }]);

            // Remove old points
            setTimeout(() => {
                setLaserPoints(prev => prev.filter(p => p.id !== id));
            }, 500);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isPresenting, laserEnabled]);

    // Navigate to frame when it changes
    useEffect(() => {
        if (!isPresenting || !editorRef || frames.length === 0) return;

        const editor = editorRef as Editor;
        const frameId = frames[currentFrameIndex];
        if (frameId) {
            // Use tldraw's zoomToFit or similar to focus on frame
            try {
                const shape = editor.getShape(frameId as never);
                if (shape) {
                    editor.zoomToSelection();
                }
            } catch (e) {
                console.error('Failed to navigate to frame:', e);
            }
        }
    }, [isPresenting, currentFrameIndex, frames, editorRef]);

    if (!isPresenting) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={containerRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background"
                style={{ cursor: laserEnabled ? 'none' : 'default' }}
            >
                {/* Canvas area - would integrate with tldraw */}
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <p className="text-lg">
                            Frame {currentFrameIndex + 1} of {frames.length}
                        </p>
                        <p className="text-sm mt-2">
                            {frames.length === 0
                                ? 'No frames found. Add frames to your canvas to present.'
                                : 'Use arrow keys or buttons to navigate'
                            }
                        </p>
                    </div>
                </div>

                {/* Laser pointer trail */}
                {laserEnabled && (
                    <svg className="fixed inset-0 pointer-events-none z-[100]">
                        {laserPoints.map((point, i) => (
                            <motion.circle
                                key={point.id}
                                cx={point.x}
                                cy={point.y}
                                r={6}
                                fill={laserColor}
                                initial={{ opacity: 1, scale: 1 }}
                                animate={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.5 }}
                            />
                        ))}
                        {laserPoints.length > 0 && (
                            <circle
                                cx={laserPoints[laserPoints.length - 1]?.x}
                                cy={laserPoints[laserPoints.length - 1]?.y}
                                r={8}
                                fill={laserColor}
                            />
                        )}
                    </svg>
                )}

                {/* Controls overlay */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]"
                >
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-background/80 backdrop-blur-md border shadow-lg">
                        {/* Previous */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={previousFrame}
                            disabled={currentFrameIndex === 0}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>

                        {/* Frame indicators */}
                        <div className="flex items-center gap-2">
                            {frames.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToFrame(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentFrameIndex
                                        ? 'bg-primary w-4'
                                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Next */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextFrame}
                            disabled={currentFrameIndex === frames.length - 1}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>

                        {/* Divider */}
                        <div className="w-px h-6 bg-border" />

                        {/* Laser toggle */}
                        <Button
                            variant={laserEnabled ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={toggleLaser}
                            title="Toggle laser pointer (L)"
                        >
                            <MousePointer2 className="w-5 h-5" style={{ color: laserEnabled ? laserColor : undefined }} />
                        </Button>

                        {/* Exit */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={exitPresentation}
                            title="Exit presentation (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </motion.div>

                {/* Frame counter */}
                <div className="fixed top-4 right-4 z-[60] px-3 py-1 rounded-md bg-background/80 backdrop-blur-sm text-sm text-muted-foreground">
                    {currentFrameIndex + 1} / {frames.length || 1}
                </div>

                {/* Keyboard hint */}
                <div className="fixed bottom-4 left-4 z-[60] text-xs text-muted-foreground/50">
                    ← → Navigate • Space Next • L Laser • Esc Exit
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default PresentationMode;
