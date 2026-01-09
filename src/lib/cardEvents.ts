/**
 * Card events for connecting tldraw shapes to React components
 */

type CardEditHandler = (cardId: string, shapeId: string) => void;

let openCardEditorHandler: CardEditHandler | null = null;

/**
 * Set the handler for opening card editor
 */
export function setOpenCardEditorHandler(handler: CardEditHandler | null) {
    openCardEditorHandler = handler;
}

/**
 * Trigger opening the card editor - called from CardShape
 */
export function openCardEditor(cardId: string, shapeId: string) {
    if (openCardEditorHandler) {
        openCardEditorHandler(cardId, shapeId);
    } else {
        console.warn('[CardEvents] No card editor handler registered');
    }
}
