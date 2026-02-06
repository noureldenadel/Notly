export const ZOOM_CONFIG = {
    // Animation durations
    UI_ZOOM_DURATION: 200,        // Buttons & keyboard shortcuts
    GESTURE_ZOOM_DURATION: 0,     // Trackpad & wheel (instant)

    // Zoom limits
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 8,

    // Zoom steps
    // Standard zoom levels: 25%, 50%, 75%, 100%, 150%, 200%, 400%, 800%
    ZOOM_LEVELS: [0.25, 0.5, 0.75, 1, 1.5, 2, 4, 8],

    // Sensitivity
    SCRUBBY_POWER: 1.01,
    WHEEL_ZOOM_FACTOR: 0.01,
} as const;
