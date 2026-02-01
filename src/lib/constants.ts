/**
 * Application-wide constants for consistent values across the codebase.
 */

/**
 * Default dimensions for various shape types on the canvas.
 */
export const SHAPE_DEFAULTS = {
    IMAGE: {
        MAX_WIDTH: 600,
        MAX_HEIGHT: 600,
    },
    PDF: {
        WIDTH: 200,
        HEIGHT: 260,
    },
    CARD: {
        WIDTH: 280,
        HEIGHT: 160,
    },
    MINDMAP: {
        WIDTH: 600,
        HEIGHT: 400,
    },
    HIGHLIGHT: {
        WIDTH: 260,
        HEIGHT: 120,
    },
} as const;

/**
 * Thumbnail generation settings.
 */
export const THUMBNAIL = {
    MAX_WIDTH: 400,
    MAX_HEIGHT: 300,
    QUALITY: 0.8,
    DEBOUNCE_MS: 2000,
} as const;

/**
 * PDF rendering settings.
 */
export const PDF = {
    THUMBNAIL_SCALE: 0.5,
} as const;

/**
 * Color presets for shapes.
 */
export const COLORS = {
    DEFAULT_CARD: 'highlight-blue',
    DEFAULT_HIGHLIGHT: 'highlight-yellow',
    DEFAULT_MINDMAP_ROOT: '#4A90D9',
} as const;

/**
 * Card color options for consistent color names across the app.
 */
export const CARD_COLORS = {
    BLUE: 'highlight-blue',
    PURPLE: 'highlight-purple',
    GREEN: 'highlight-green',
    YELLOW: 'highlight-yellow',
    PINK: 'highlight-pink',
    ORANGE: 'highlight-orange',
} as const;

export type CardColor = typeof CARD_COLORS[keyof typeof CARD_COLORS];

/**
 * Modal type identifiers for the modal system.
 */
export const MODAL_TYPES = {
    SETTINGS: 'settings',
    SHORTCUTS: 'shortcuts',
    PDF_VIEWER: 'pdf-viewer',
    CARD_EDITOR: 'card-editor',
    SEARCH: 'search',
    IMPORT_EXPORT: 'import-export',
} as const;

export type ModalType = typeof MODAL_TYPES[keyof typeof MODAL_TYPES];

/**
 * localStorage keys for persistence.
 */
export const STORAGE_KEYS = {
    BOARD_PREFIX: 'visual-thinking-board-',
    LINKS: 'visual-thinking-links',
} as const;

// Tool ID mapping from our UI to tldraw tool IDs
export const TOOL_MAP: Record<string, string> = {
    select: 'select',
    hand: 'hand',
    draw: 'draw',
    eraser: 'eraser',
    arrow: 'arrow',
    text: 'text',
    rectangle: 'geo',
    ellipse: 'geo',
    frame: 'frame',
    sticky: 'note',
    card: 'card',
    pdf: 'pdf',
    mindmap: 'card',
};

// Special actions that aren't tools
export const ACTION_TOOLS = ['image', 'pdf'];
