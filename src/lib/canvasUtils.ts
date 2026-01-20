/**
 * Canvas utility functions for common operations with the tldraw editor.
 */

import type { Editor } from 'tldraw';

/**
 * Represents a position on the canvas.
 */
export interface CanvasPosition {
    x: number;
    y: number;
}

/**
 * Calculate the center position of the current viewport for placing a shape.
 * 
 * @param editor - The tldraw editor instance
 * @param shapeWidth - Width of the shape to be placed
 * @param shapeHeight - Height of the shape to be placed
 * @returns The x, y position to place the shape so it's centered in viewport
 */
export function getViewportCenter(
    editor: Editor,
    shapeWidth: number,
    shapeHeight: number
): CanvasPosition {
    const camera = editor.getCamera();
    const viewportBounds = editor.getViewportScreenBounds();

    return {
        x: -camera.x + viewportBounds.width / 2 / camera.z - shapeWidth / 2,
        y: -camera.y + viewportBounds.height / 2 / camera.z - shapeHeight / 2,
    };
}

/**
 * Calculate the center position of the viewport without shape offset.
 * Useful when you need the raw center point.
 * 
 * @param editor - The tldraw editor instance
 * @returns The x, y position of the viewport center
 */
export function getViewportCenterPoint(editor: Editor): CanvasPosition {
    const camera = editor.getCamera();
    const viewportBounds = editor.getViewportScreenBounds();

    return {
        x: -camera.x + viewportBounds.width / 2 / camera.z,
        y: -camera.y + viewportBounds.height / 2 / camera.z,
    };
}

/**
 * Check if an editor instance is valid and ready for operations.
 * 
 * @param editor - The editor instance to check
 * @returns True if the editor is valid and ready
 */
export function isEditorReady(editor: Editor | null): editor is Editor {
    return editor !== null;
}
