import { useEffect, useRef } from 'react';
import { Editor } from 'tldraw';

/**
 * Hook to implement Adobe Photoshop-style zoom shortcuts
 * - Ctrl + Space + Click: Zoom In
 * - Ctrl + Alt + Space + Click: Zoom Out
 * - Ctrl + Space + Drag: Scrubby Zoom
 */
export function useAdobeZoom(editor: Editor | null) {
    // Refs to track state without re-renders
    const stateRef = useRef({
        isAdobeMode: false,
        isZoomOut: false,
        isDragging: false,
        startPoint: { x: 0, y: 0 }, // Screen coordinates (Local)
        startPagePoint: { x: 0, y: 0 }, // Page coordinates
        startZoom: 1,
        processedDrag: false,
        isCtrlDown: false,
        isSpaceDown: false,
    });

    useEffect(() => {
        if (!editor) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const state = stateRef.current;

            const isCtrl = e.ctrlKey || e.metaKey;
            // Check if Space is pressed now OR already held down
            const isSpace = e.code === 'Space' || editor.inputs.keys.has('Space') || state.isSpaceDown;
            const isAlt = e.altKey;

            if (e.code === 'Space') state.isSpaceDown = true;
            if (isCtrl) state.isCtrlDown = true;

            if (isCtrl && isSpace) {
                // Determine if we need to prevent default behavior
                // Only prevent if we are initiating the mode
                if (!state.isAdobeMode) {
                    state.isAdobeMode = true;
                }

                state.isZoomOut = isAlt;

                // Override cursor
                editor.setCursor({ type: isAlt ? 'zoom-out' : 'zoom-in', rotation: 0 });

                // Allow Tldraw to see the keys so it knows Space is down (for Hand tool resume)
                // e.stopPropagation();
            } else if (state.isAdobeMode) {
                if (e.key === 'Alt') {
                    state.isZoomOut = true;
                    editor.setCursor({ type: 'zoom-out', rotation: 0 });
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const state = stateRef.current;

            if (e.code === 'Space') state.isSpaceDown = false;
            if (e.key === 'Control' || e.key === 'Meta') state.isCtrlDown = false;

            // Logic to exit mode
            // If EITHER required key is released, we check if we should exit
            if ((!state.isCtrlDown || !state.isSpaceDown) && state.isAdobeMode) {
                // If we are dragging, we keep the mode until drag ends
                if (!state.isDragging) {
                    state.isAdobeMode = false;
                    editor.setCursor({ type: 'default', rotation: 0 });
                }
            }

            if (e.key === 'Alt' && state.isAdobeMode) {
                state.isZoomOut = false;
                editor.setCursor({ type: 'zoom-in', rotation: 0 });
            }
        };

        // Helper to get screen point (Local Container Coordinates)
        const getScreenPoint = (e: PointerEvent) => {
            const container = editor.getContainer();
            const rect = container.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const handlePointerDown = (e: PointerEvent) => {
            const state = stateRef.current;
            if (!state.isAdobeMode) return;

            // Only intercept if interacting with the canvas
            if (!editor.getContainer().contains(e.target as Node)) return;

            e.preventDefault();
            e.stopPropagation();

            state.isDragging = true;
            state.processedDrag = false;

            // screenPoint is now LOCAL to container (0,0 is top-left of canvas)
            const screenPoint = getScreenPoint(e);
            state.startPoint = screenPoint;

            // editor.screenToPage expects Local Screen Coordinates
            state.startPagePoint = editor.screenToPage(screenPoint);
            state.startZoom = editor.getCamera().z;
        };

        const handlePointerMove = (e: PointerEvent) => {
            const state = stateRef.current;

            if (state.isAdobeMode) {
                // Prevent hover effects/other tool interactions if on canvas
                if (editor.getContainer().contains(e.target as Node)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }

            if (state.isAdobeMode && state.isDragging) {
                const screenPoint = getScreenPoint(e); // Local
                const deltaX = screenPoint.x - state.startPoint.x;

                if (Math.abs(deltaX) > 5) {
                    state.processedDrag = true;

                    // Scrubby zoom
                    // Drag Right (positive) -> Zoom In
                    // Drag Left (negative) -> Zoom Out
                    const sensitivity = 0.005;
                    const zoomFactor = 1 + deltaX * sensitivity;

                    // Clamp target zoom
                    const targetZoom = Math.max(0.1, Math.min(8, state.startZoom * zoomFactor));

                    // Use fixed startPagePoint to prevent flickering
                    const p = state.startPagePoint;

                    // sx/sy: Distance from top-left of viewport.
                    // Since startPoint is Local, and Viewport is at 0,0 Local, sx IS startPoint.x
                    const sx = state.startPoint.x;
                    const sy = state.startPoint.y;

                    const newX = p.x - (sx / targetZoom);
                    const newY = p.y - (sy / targetZoom);

                    editor.run(() => {
                        editor.setCamera({ x: newX, y: newY, z: targetZoom });
                    }, { history: 'ignore' });
                }
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            const state = stateRef.current;

            if (state.isAdobeMode && state.isDragging) {
                e.preventDefault();
                e.stopPropagation();

                state.isDragging = false;

                if (!state.processedDrag) {
                    // Click zoom
                    const screenPoint = getScreenPoint(e); // Local
                    const pagePoint = editor.screenToPage(screenPoint);

                    const currentZoom = editor.getCamera().z;
                    const nextZoom = state.isZoomOut ? currentZoom * 0.5 : currentZoom * 2;
                    const clampedZoom = Math.max(0.1, Math.min(8, nextZoom));

                    const sx = screenPoint.x;
                    const sy = screenPoint.y;

                    const newX = pagePoint.x - (sx / clampedZoom);
                    const newY = pagePoint.y - (sy / clampedZoom);

                    editor.run(() => {
                        editor.setCamera({ x: newX, y: newY, z: clampedZoom });
                    }, { history: 'ignore' });
                }

                // Check if we should exit mode (keys might have been released during drag)
                // We trust our tracked state because we might have intercepted keys
                if (!state.isCtrlDown || !state.isSpaceDown) {
                    state.isAdobeMode = false;
                    editor.setCursor({ type: 'default', rotation: 0 });
                }
            }
        };

        // Add window listeners with capture to intercept keys and pointers before Tldraw
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        window.addEventListener('keyup', handleKeyUp, { capture: true });
        window.addEventListener('pointerdown', handlePointerDown, { capture: true });
        window.addEventListener('pointermove', handlePointerMove, { capture: true });
        window.addEventListener('pointerup', handlePointerUp, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            window.removeEventListener('keyup', handleKeyUp, { capture: true });
            window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
            window.removeEventListener('pointermove', handlePointerMove, { capture: true });
            window.removeEventListener('pointerup', handlePointerUp, { capture: true });
        };
    }, [editor]);
}
