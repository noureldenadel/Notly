import { useEffect, useRef } from 'react';
import { Editor } from 'tldraw';
import { ZOOM_CONFIG } from '@/config/zoomConfig';

/**
 * Hook to implement Adobe Photoshop-style zoom shortcuts
 * - Ctrl + Space + Click: Zoom In
 * - Ctrl + Alt + Space + Click: Zoom Out
 * - Ctrl + Space + Drag: Scrubby Zoom
 */
export function useAdobeZoom(editor: Editor | null) {
    const stateRef = useRef({
        isAdobeMode: false,
        isZoomOut: false,
        isDragging: false,
        startClientPoint: { x: 0, y: 0 },   // ✅ RENAMED: Global screen coords
        startPagePoint: { x: 0, y: 0 },
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
            const isSpace = e.code === 'Space' || state.isSpaceDown;
            const isAlt = e.altKey;

            if (e.code === 'Space') state.isSpaceDown = true;
            if (isCtrl) state.isCtrlDown = true;

            if (isCtrl && isSpace) {
                if (!state.isAdobeMode) {
                    state.isAdobeMode = true;
                }
                state.isZoomOut = isAlt;
                editor.setCursor({
                    type: isAlt ? 'zoom-out' : 'zoom-in',
                    rotation: 0
                });
            } else if (state.isAdobeMode && e.key === 'Alt') {
                state.isZoomOut = true;
                editor.setCursor({ type: 'zoom-out', rotation: 0 });
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const state = stateRef.current;

            if (e.code === 'Space') state.isSpaceDown = false;
            if (e.key === 'Control' || e.key === 'Meta') state.isCtrlDown = false;

            if ((!state.isCtrlDown || !state.isSpaceDown) && state.isAdobeMode) {
                if (!state.isDragging) {
                    state.isAdobeMode = false;
                    // Let Tldraw's native Space key handler set it to 'grab' naturally
                }
            }

            if (e.key === 'Alt' && state.isAdobeMode) {
                state.isZoomOut = false;
                editor.setCursor({ type: 'zoom-in', rotation: 0 });
            }
        };

        const handlePointerDown = (e: PointerEvent) => {
            const state = stateRef.current;
            if (!state.isAdobeMode) return;
            if (!editor.getContainer().contains(e.target as Node)) return;

            e.preventDefault();
            e.stopPropagation();

            state.isDragging = true;
            state.processedDrag = false;

            // ✅ CRITICAL FIX: Use GLOBAL screen coordinates
            const clientPoint = { x: e.clientX, y: e.clientY };
            state.startClientPoint = clientPoint;

            // ✅ screenToPage expects global coords
            state.startPagePoint = editor.screenToPage(clientPoint);
            state.startZoom = editor.getCamera().z;
        };

        const handlePointerMove = (e: PointerEvent) => {
            const state = stateRef.current;

            if (state.isAdobeMode) {
                if (editor.getContainer().contains(e.target as Node)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }

            if (state.isAdobeMode && state.isDragging) {
                const currentClientPoint = { x: e.clientX, y: e.clientY };
                const deltaX = currentClientPoint.x - state.startClientPoint.x;

                if (Math.abs(deltaX) > 3) {
                    state.processedDrag = true;

                    // Exponential zoom feel (like Adobe)
                    const zoomFactor = Math.pow(ZOOM_CONFIG.SCRUBBY_POWER, deltaX);
                    const targetZoom = Math.max(
                        ZOOM_CONFIG.MIN_ZOOM,
                        Math.min(ZOOM_CONFIG.MAX_ZOOM, state.startZoom * zoomFactor)
                    );

                    // ✅ CRITICAL: Now use global coords in formula
                    const p = state.startPagePoint;
                    const c = state.startClientPoint;

                    const newX = p.x - c.x / targetZoom;
                    const newY = p.y - c.y / targetZoom;

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
                    // ✅ Use GLOBAL screen coordinates
                    const clientPoint = { x: e.clientX, y: e.clientY };
                    const pagePoint = editor.screenToPage(clientPoint);

                    const currentZoom = editor.getCamera().z;
                    const multiplier = state.isZoomOut ? 0.5 : 2;
                    const nextZoom = currentZoom * multiplier;
                    const clampedZoom = Math.max(
                        ZOOM_CONFIG.MIN_ZOOM,
                        Math.min(ZOOM_CONFIG.MAX_ZOOM, nextZoom)
                    );

                    // ✅ Use global coords in formula
                    const newX = pagePoint.x - clientPoint.x / clampedZoom;
                    const newY = pagePoint.y - clientPoint.y / clampedZoom;

                    editor.setCamera(
                        { x: newX, y: newY, z: clampedZoom },
                        {
                            animation: { duration: ZOOM_CONFIG.UI_ZOOM_DURATION }
                        }
                    );
                }

                if (!state.isCtrlDown || !state.isSpaceDown) {
                    state.isAdobeMode = false;
                }
            }
        };

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
