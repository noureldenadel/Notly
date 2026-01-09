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
                // Skip if in input field unless it's global or escape
                if (isInputField && shortcut.scope !== 'global' && combo.key !== 'escape') {
                    continue;
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
    deselect?: () => void;
    startPresentation?: () => void;
    openSettings?: () => void;
    showShortcuts?: () => void;
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

    if (actions.deselect) {
        shortcuts.push({
            id: 'deselect',
            keys: 'escape',
            description: 'Deselect / Close modal',
            action: actions.deselect,
            scope: 'global',
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
    }

    return shortcuts;
}

export default useKeyboardShortcuts;
