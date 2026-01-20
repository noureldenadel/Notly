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
 * localStorage keys for persistence.
 */
export const STORAGE_KEYS = {
    BOARD_PREFIX: 'visual-thinking-board-',
    LINKS: 'visual-thinking-links',
} as const;
