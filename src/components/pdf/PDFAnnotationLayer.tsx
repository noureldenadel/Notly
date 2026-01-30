import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface AnnotationPoint {
    x: number;
    y: number;
    pressure?: number;
}

export interface AnnotationPath {
    id: string;
    type: 'draw' | 'highlight';
    points: AnnotationPoint[];
    color: string;
    strokeWidth: number;
    opacity: number;
    page: number;
}

export interface TextAnnotation {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    fontSize: number;
    page: number;
}

export interface PDFAnnotationLayerProps {
    width: number;
    height: number;
    scale: number;
    page: number;
    tool: 'draw' | 'highlight' | 'text' | 'erase' | 'select' | null;
    activeColor: string;
    strokeWidth: number;
    opacity: number;
    visible: boolean;
    annotations: {
        paths: AnnotationPath[];
        texts: TextAnnotation[];
    };
    onAnnotationsChange: (paths: AnnotationPath[], texts: TextAnnotation[]) => void;
}

export const PDFAnnotationLayer = React.memo(({
    width,
    height,
    scale,
    page,
    tool,
    activeColor,
    strokeWidth,
    opacity,
    visible,
    annotations,
    onAnnotationsChange,
}: PDFAnnotationLayerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<AnnotationPath | null>(null);
    const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);

    // Helper to get coordinates
    const getCoords = (e: React.PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left), // / scale, // Store in unscaled or scaled? 
            // Better to store in "Page Pixels" (unscaled) or "Viewport Pixels"?
            // If we store in Viewport Pixels, we have to scale everytime zoom changes.
            // Let's store in Normalized Page Coordinates? Or just Page Points (unscaled)?
            // The canvas width/height passed in ARE the scaled dimensions.
            // Let's store coords relative to the CURRENT viewport (scaled). 
            // Wait, if we zoom out, the coordinates needs to shrink (or we re-render canvas at new scale).
            // Standard approach: Store in "PDF Page Points" (unscaled 100%).
            // Render: Scale points by 'scale'.
            y: (e.clientY - rect.top), // / scale
        };
    };

    // --- Render Logic ---
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Render Scale Factor
        // If we store points as normalized (0-1) or unscaled?
        // Let's assume we store points in Scaled Viewport Pixels for this session (simpler for now).
        // Actually, if we zoom, we lose data if we don't rescale. 
        // Let's TRY to store unscaled points.
        // x_stored = x_screen / scale.

        const renderPath = (path: AnnotationPath) => {
            if (path.points.length < 1) return;

            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.strokeWidth * scale; // Scale stroke visually
            ctx.globalAlpha = path.opacity / 100;

            if (path.type === 'highlight') {
                ctx.globalCompositeOperation = 'multiply';
                ctx.lineCap = 'butt'; // Highlighters usually flat edges? Or round? Round is safe.
            } else {
                ctx.globalCompositeOperation = 'source-over';
            }

            const first = path.points[0];
            ctx.moveTo(first.x * scale, first.y * scale);

            for (let i = 1; i < path.points.length; i++) {
                const p = path.points[i];
                ctx.lineTo(p.x * scale, p.y * scale);
            }
            ctx.stroke();
        };

        // Render saved paths for THIS page
        annotations.paths.filter(p => p.page === page).forEach(renderPath);

        // Render current path (being drawn)
        if (currentPath) {
            renderPath(currentPath);
        }

        // Reset context
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        // Render Text (Canvas Text)
        ctx.textBaseline = 'top';
        annotations.texts.filter(t => t.page === page).forEach(text => {
            ctx.fillStyle = text.color;
            ctx.font = `${text.fontSize * scale}px sans-serif`;
            ctx.fillText(text.text, text.x * scale, text.y * scale);
        });

    }, [width, height, scale, page, annotations, currentPath]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);


    // --- Interaction Logic ---
    const onPointerDown = (e: React.PointerEvent) => {
        if (!tool || tool === 'text') return;

        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        const unscaledX = x / scale;
        const unscaledY = y / scale;

        if (tool === 'erase') {
            // Instant erase check on click
            handleErase(unscaledX, unscaledY);
            return;
        }

        setCurrentPath({
            id: Math.random().toString(36).substr(2, 9),
            type: tool as 'draw' | 'highlight',
            points: [{ x: unscaledX, y: unscaledY, pressure: e.pressure }],
            color: activeColor,
            strokeWidth: strokeWidth,
            opacity: opacity,
            page: page
        });
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;

        const { x, y } = getCoords(e);
        const unscaledX = x / scale;
        const unscaledY = y / scale;

        if (tool === 'erase') {
            handleErase(unscaledX, unscaledY);
            return;
        }

        if (currentPath) {
            setCurrentPath(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    points: [...prev.points, { x: unscaledX, y: unscaledY, pressure: e.pressure }]
                };
            });
        }
    };

    const onPointerUp = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        setIsDrawing(false);
        e.currentTarget.releasePointerCapture(e.pointerId);

        if (tool === 'erase') return;

        if (currentPath) {
            onAnnotationsChange(
                [...annotations.paths, currentPath],
                annotations.texts
            );
            setCurrentPath(null);
        }
    };

    const handleErase = (x: number, y: number) => {
        // Eraser radius (scaled back)
        const radius = (strokeWidth * 2) / scale;

        // Find paths colliding with this point
        const remainingPaths = annotations.paths.filter(path => {
            if (path.page !== page) return true;
            // Simple bounding box + point check optimization could go here
            // Detailed point distance check
            return !path.points.some(p => Math.hypot(p.x - x, p.y - y) < radius);
        });

        // Detect collision with texts
        const remainingTexts = annotations.texts.filter(text => {
            if (text.page !== page) return true;
            // Approx text box check
            // height approx fontSize, width approx text.length * fontSize * 0.6
            const w = text.text.length * text.fontSize * 0.6;
            const h = text.fontSize;
            return !(x >= text.x && x <= text.x + w && y >= text.y && y <= text.y + h);
        });

        if (remainingPaths.length !== annotations.paths.length || remainingTexts.length !== annotations.texts.length) {
            onAnnotationsChange(remainingPaths, remainingTexts);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (tool !== 'text') return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const navEvent = e.nativeEvent as MouseEvent;
        const x = (navEvent.clientX - rect.left);
        const y = (navEvent.clientY - rect.top);

        setTextInput({
            x: x, // Keep screen coords for input pos
            y: y,
            text: ''
        });
    };

    const handleTextSubmit = () => {
        if (textInput && textInput.text.trim()) {
            onAnnotationsChange(
                annotations.paths,
                [...annotations.texts, {
                    id: Math.random().toString(),
                    x: textInput.x / scale,
                    y: textInput.y / scale,
                    text: textInput.text,
                    color: activeColor,
                    fontSize: strokeWidth * 5, // Font size derived from stroke slider? Or fixed?
                    // Let's make "Stroke" slider act as "Font Size" when Text tool is active
                    page: page,
                }]
            );
        }
        setTextInput(null);
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: (tool && visible) ? 'auto' : 'none',
            zIndex: 10,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
        }}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onClick={handleCanvasClick}
                style={{ width: '100%', height: '100%', touchAction: 'none' }}
            />
            {textInput && (
                <textarea
                    autoFocus
                    value={textInput.text}
                    onChange={e => setTextInput({ ...textInput, text: e.target.value })}
                    onBlur={handleTextSubmit}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleTextSubmit();
                        }
                        if (e.key === 'Escape') setTextInput(null);
                    }}
                    style={{
                        position: 'absolute',
                        left: textInput.x,
                        top: textInput.y,
                        color: activeColor,
                        fontSize: `${strokeWidth * 5 * scale}px`, // Visual preview scale
                        background: 'transparent',
                        border: '1px dashed #ccc',
                        outline: 'none',
                        padding: 0,
                        margin: 0,
                        minWidth: '100px',
                        resize: 'none',
                        lineHeight: 1,
                        overflow: 'hidden'
                    }}
                />
            )}
        </div>
    );
});

PDFAnnotationLayer.displayName = 'PDFAnnotationLayer';
