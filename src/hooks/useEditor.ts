import { useContext } from 'react';
import { EditorContext } from '@/context/editor-context';

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
}

// Optional hook that doesn't throw if not in provider
export function useEditorOptional() {
    return useContext(EditorContext);
}
