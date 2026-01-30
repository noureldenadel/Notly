import { useEffect, useCallback, useRef } from 'react';

export interface Shortcut {
    id: string;
    keys: string; // e.g., 'ctrl+k', 'cmd+shift+p', 'escape'
    description: string;
    action: () => void;
    scope?: 'global' | 'canvas' | 'editor';
    preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
}

/**
 * Parse a key combination string into a normalized format
 * Supports: ctrl, cmd, alt, shift, meta + any key
 */
function parseKeyCombo(keys: string): {
    ctrl: boolean;
    meta: boolean;
    alt: boolean;
    shift: boolean;
    key: string;
} {
    const parts = keys.toLowerCase().split('+').map(p => p.trim());
    const key = parts[parts.length - 1];

    return {
        ctrl: parts.includes('ctrl') || parts.includes('control'),
        meta: parts.includes('cmd') || parts.includes('meta') || parts.includes('command'),
        alt: parts.includes('alt') || parts.includes('option'),
        shift: parts.includes('shift'),
        key,
    };
}

/**
 * Check if a keyboard event matches a shortcut
 */
function matchesShortcut(event: KeyboardEvent, combo: ReturnType<typeof parseKeyCombo>): boolean {
    // Handle cross-platform: treat Ctrl on Windows as Cmd on Mac
    const ctrlOrMeta = event.ctrlKey || event.metaKey;

    // If shortcut requires ctrl OR meta, accept either
    if (combo.ctrl || combo.meta) {
        if (!ctrlOrMeta) return false;
    } else {
        // If shortcut doesn't require ctrl/meta, reject if pressed
        if (ctrlOrMeta) return false;
    }

    if (combo.alt !== event.altKey) return false;
    if (combo.shift !== event.shiftKey) return false;

    // Handle special keys
    const eventKey = event.key.toLowerCase();
    const comboKey = combo.key.toLowerCase();

    // Map common key names
    const keyMap: Record<string, string[]> = {
        'escape': ['escape', 'esc'],
        'enter': ['enter', 'return'],
        'delete': ['delete', 'del'],
        'backspace': ['backspace'],
        'space': [' ', 'space'],
        'arrowup': ['arrowup', 'up'],
        'arrowdown': ['arrowdown', 'down'],
        'arrowleft': ['arrowleft', 'left'],
        'arrowright': ['arrowright', 'right'],
    };

    // Check if the keys match
    if (eventKey === comboKey) return true;

    // Check aliases
    for (const [canonical, aliases] of Object.entries(keyMap)) {
        if (aliases.includes(comboKey) && (aliases.includes(eventKey) || eventKey === canonical)) {
            return true;
        }
    }

    return false;
}

/**
 * Hook for managing keyboard shortcuts
 * 
 * @param shortcuts Array of shortcuts to register
 * @param options Configuration options
 */
export function useKeyboardShortcuts(
    shortcuts: Shortcut[],
    options: UseKeyboardShortcutsOptions = {}
): void {
    const { enabled = true } = options;
    const shortcutsRef = useRef(shortcuts);

    // Update ref when shortcuts change
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ignore if typing in an input/textarea (unless it's a global shortcut)
        const target = event.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;

        for (const shortcut of shortcutsRef.current) {
            const combo = parseKeyCombo(shortcut.keys);

            if (matchesShortcut(event, combo)) {
                // Determine if we should block this shortcut in an input field
                if (isInputField) {
                    // Always allow Escape
                    if (combo.key === 'escape') {
                        // proceed
                    }
                    // Allow shortcuts with modifiers (Ctrl/Cmd/Alt) in inputs if they are global
                    // e.g. Ctrl+S, Ctrl+Z, Ctrl+K
                    else if (shortcut.scope === 'global' && (combo.ctrl || combo.meta || combo.alt)) {
                        // proceed
                    }
                    // BLOCK single letter shortcuts or unmodified shortcuts in inputs
                    // e.g. 'v', 't', 'delete', 'backspace' (unless controlled explicitly)
                    else {
                        continue;
                    }
                }

                if (shortcut.preventDefault !== false) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                shortcut.action();
                return;
            }
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, handleKeyDown]);
}

/**
 * Default shortcuts for the application
 * These should be used with the useKeyboardShortcuts hook
 */
export function createDefaultShortcuts(actions: {
    openSearch?: () => void;
    createCard?: () => void;
    save?: () => void;
    undo?: () => void;
    redo?: () => void;
    duplicate?: () => void;
    deleteSelected?: () => void;
    selectAll?: () => void;
    deselect?: () => void;
    startPresentation?: () => void;
    openSettings?: () => void;
    showShortcuts?: () => void;
    zoomIn?: () => void;
    zoomOut?: () => void;
    resetZoom?: () => void;
    zoomToFit?: () => void;
    insertImage?: () => void;
    insertPDF?: () => void;
    insertMindMap?: () => void;
    copy?: () => void;
    cut?: () => void;
    paste?: () => void;
}): Shortcut[] {
    const shortcuts: Shortcut[] = [];

    if (actions.openSearch) {
        shortcuts.push({
            id: 'search',
            keys: 'ctrl+k',
            description: 'Open global search',
            action: actions.openSearch,
            scope: 'global',
        });
    }

    if (actions.createCard) {
        shortcuts.push({
            id: 'new-card',
            keys: 'ctrl+n',
            description: 'Create new card',
            action: actions.createCard,
            scope: 'global',
        });
    }

    if (actions.save) {
        shortcuts.push({
            id: 'save',
            keys: 'ctrl+s',
            description: 'Save/sync changes',
            action: actions.save,
            scope: 'global',
        });
    }

    if (actions.undo) {
        shortcuts.push({
            id: 'undo',
            keys: 'ctrl+z',
            description: 'Undo',
            action: actions.undo,
            scope: 'global',
        });
    }

    if (actions.redo) {
        shortcuts.push({
            id: 'redo',
            keys: 'ctrl+shift+z',
            description: 'Redo',
            action: actions.redo,
            scope: 'global',
        });
    }

    if (actions.duplicate) {
        shortcuts.push({
            id: 'duplicate',
            keys: 'ctrl+d',
            description: 'Duplicate selected',
            action: actions.duplicate,
            scope: 'canvas',
        });
    }

    if (actions.copy) {
        shortcuts.push({
            id: 'copy',
            keys: 'ctrl+c',
            description: 'Copy selected',
            action: actions.copy,
            scope: 'global',
        });
    }

    if (actions.cut) {
        shortcuts.push({
            id: 'cut',
            keys: 'ctrl+x',
            description: 'Cut selected',
            action: actions.cut,
            scope: 'global',
        });
    }

    if (actions.paste) {
        shortcuts.push({
            id: 'paste',
            keys: 'ctrl+v',
            description: 'Paste',
            action: actions.paste,
            scope: 'global',
        });
    }

    if (actions.deleteSelected) {
        shortcuts.push({
            id: 'delete',
            keys: 'delete',
            description: 'Delete selected',
            action: actions.deleteSelected,
            scope: 'canvas',
        });
        shortcuts.push({
            id: 'delete-backspace',
            keys: 'backspace',
            description: 'Delete selected',
            action: actions.deleteSelected,
            scope: 'canvas',
        });
    }

    if (actions.selectAll) {
        shortcuts.push({
            id: 'select-all',
            keys: 'ctrl+a',
            description: 'Select all',
            action: actions.selectAll,
            scope: 'canvas',
        });
    }

    if (actions.deselect) {
        shortcuts.push({
            id: 'deselect',
            keys: 'escape',
            description: 'Deselect / Close modal',
            action: actions.deselect,
            scope: 'global',
        });
    }

    if (actions.zoomIn) {
        shortcuts.push({
            id: 'zoom-in',
            keys: 'ctrl+=',
            description: 'Zoom in',
            action: actions.zoomIn,
            scope: 'canvas',
        });
        shortcuts.push({
            id: 'zoom-in-plus',
            keys: 'ctrl++',
            description: 'Zoom in',
            action: actions.zoomIn,
            scope: 'canvas',
        });
    }

    if (actions.zoomOut) {
        shortcuts.push({
            id: 'zoom-out',
            keys: 'ctrl+-',
            description: 'Zoom out',
            action: actions.zoomOut,
            scope: 'canvas',
        });
    }

    if (actions.resetZoom) {
        shortcuts.push({
            id: 'reset-zoom',
            keys: 'ctrl+0',
            description: 'Reset zoom',
            action: actions.resetZoom,
            scope: 'canvas',
        });
    }

    if (actions.zoomToFit) {
        shortcuts.push({
            id: 'zoom-to-fit',
            keys: 'ctrl+1',
            description: 'Zoom to fit',
            action: actions.zoomToFit,
            scope: 'canvas',
        });
    }

    if (actions.startPresentation) {
        shortcuts.push({
            id: 'present-f11',
            keys: 'f11',
            description: 'Start presentation',
            action: actions.startPresentation,
            scope: 'global',
        });
        shortcuts.push({
            id: 'present-enter',
            keys: 'ctrl+enter',
            description: 'Start presentation',
            action: actions.startPresentation,
            scope: 'global',
        });
    }

    if (actions.openSettings) {
        shortcuts.push({
            id: 'settings',
            keys: 'ctrl+,',
            description: 'Open settings',
            action: actions.openSettings,
            scope: 'global',
        });
    }

    if (actions.showShortcuts) {
        shortcuts.push({
            id: 'show-shortcuts',
            keys: '?',
            description: 'Show keyboard shortcuts',
            action: actions.showShortcuts,
            scope: 'global',
            preventDefault: false, // Don't prevent ? in inputs
        });
        // Also support Shift+/ which is ? on most keyboards without needing to hold shift if we parse it right
        // But our parser is simple. Let's just catch ? 
    }

    // Tools that are actions
    if (actions.insertImage) {
        shortcuts.push({ id: 'insert-image', keys: 'i', description: 'Insert Image', action: actions.insertImage, scope: 'global' });
    }
    if (actions.insertPDF) {
        shortcuts.push({ id: 'insert-pdf', keys: 'p', description: 'Insert PDF', action: actions.insertPDF, scope: 'global' });
    }
    if (actions.insertMindMap) {
        shortcuts.push({ id: 'insert-mindmap', keys: 'm', description: 'Insert MindMap', action: actions.insertMindMap, scope: 'global' });
    }

    return shortcuts;
}

/**
 * Helper to create tool shortcuts
 */
export function createToolShortcuts(setTool: (toolId: string) => void): Shortcut[] {
    return [
        { id: 'tool-select', keys: 'v', description: 'Select tool', action: () => setTool('select'), scope: 'global' },
        { id: 'tool-hand', keys: 'h', description: 'Hand tool', action: () => setTool('hand'), scope: 'global' },
        { id: 'tool-draw', keys: 'd', description: 'Draw tool', action: () => setTool('draw'), scope: 'global' },
        { id: 'tool-eraser', keys: 'e', description: 'Eraser tool', action: () => setTool('eraser'), scope: 'global' },
        { id: 'tool-arrow', keys: 'a', description: 'Arrow tool', action: () => setTool('arrow'), scope: 'global' },
        { id: 'tool-text', keys: 't', description: 'Text tool', action: () => setTool('text'), scope: 'global' },
        { id: 'tool-frame', keys: 'f', description: 'Frame tool', action: () => setTool('frame'), scope: 'global' },
        { id: 'tool-card', keys: 'c', description: 'Card tool', action: () => setTool('card'), scope: 'global' },
        { id: 'tool-rectangle', keys: 'r', description: 'Rectangle tool', action: () => setTool('rectangle'), scope: 'global' },
        { id: 'tool-ellipse', keys: 'o', description: 'Ellipse tool', action: () => setTool('ellipse'), scope: 'global' },
        { id: 'tool-sticky', keys: 's', description: 'Sticky Note tool', action: () => setTool('sticky'), scope: 'global' },
    ];
}

export default useKeyboardShortcuts;
