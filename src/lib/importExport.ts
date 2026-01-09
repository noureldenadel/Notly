/**
 * Import/Export utilities for the Visual Thinking app
 * Handles Markdown, JSON, and ZIP export/import
 */

import type { Card } from '@/stores/types';
import { nanoid } from 'nanoid';

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Convert a card to Markdown format
 */
export function cardToMarkdown(card: Card): string {
    const lines: string[] = [];

    // Title
    if (card.title) {
        lines.push(`# ${card.title}`);
        lines.push('');
    }

    // Content - handle TipTap JSON or plain text
    if (card.contentType === 'tiptap' && card.content) {
        try {
            const json = JSON.parse(card.content);
            lines.push(tiptapToMarkdown(json));
        } catch {
            lines.push(card.content);
        }
    } else {
        lines.push(card.content);
    }

    // Metadata footer
    lines.push('');
    lines.push('---');
    lines.push(`Created: ${new Date(card.createdAt).toISOString()}`);
    lines.push(`Updated: ${new Date(card.updatedAt).toISOString()}`);

    return lines.join('\n');
}

/**
 * Convert multiple cards to a Markdown document
 */
export function cardsToMarkdown(cards: Card[]): string {
    return cards.map(cardToMarkdown).join('\n\n---\n\n');
}

/**
 * Convert TipTap JSON to Markdown (simplified)
 */
function tiptapToMarkdown(doc: { type: string; content?: unknown[] }): string {
    if (!doc.content) return '';

    return doc.content.map((node: unknown) => {
        const n = node as { type: string; attrs?: Record<string, unknown>; content?: unknown[]; text?: string; marks?: Array<{ type: string }> };
        switch (n.type) {
            case 'paragraph':
                return n.content?.map((c: unknown) => nodeToText(c)).join('') || '';
            case 'heading':
                const level = (n.attrs?.level || 1) as number;
                const heading = '#'.repeat(level);
                return `${heading} ${n.content?.map((c: unknown) => nodeToText(c)).join('') || ''}`;
            case 'bulletList':
                return n.content?.map((item: unknown) => `- ${nodeToText(item)}`).join('\n') || '';
            case 'orderedList':
                return n.content?.map((item: unknown, i: number) => `${i + 1}. ${nodeToText(item)}`).join('\n') || '';
            case 'taskList':
                return n.content?.map((item: unknown) => {
                    const taskItem = item as { attrs?: { checked?: boolean }; content?: unknown[] };
                    const checked = taskItem.attrs?.checked ? 'x' : ' ';
                    return `- [${checked}] ${taskItem.content?.map((c: unknown) => nodeToText(c)).join('') || ''}`;
                }).join('\n') || '';
            case 'codeBlock':
                return '```\n' + (n.content?.map((c: unknown) => nodeToText(c)).join('') || '') + '\n```';
            case 'blockquote':
                return '> ' + (n.content?.map((c: unknown) => nodeToText(c)).join('') || '');
            case 'horizontalRule':
                return '---';
            default:
                return nodeToText(n);
        }
    }).join('\n\n');
}

function nodeToText(node: unknown): string {
    const n = node as { type?: string; text?: string; content?: unknown[]; marks?: Array<{ type: string }> };
    if (typeof n === 'string') return n;
    if (n.type === 'text') {
        let text = n.text || '';
        if (n.marks) {
            for (const mark of n.marks) {
                if (mark.type === 'bold') text = `**${text}**`;
                if (mark.type === 'italic') text = `*${text}*`;
                if (mark.type === 'code') text = `\`${text}\``;
                if (mark.type === 'strike') text = `~~${text}~~`;
            }
        }
        return text;
    }
    if (n.content) {
        return n.content.map(nodeToText).join('');
    }
    return '';
}

/**
 * Export data as a downloadable file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType = 'text/plain'): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export cards as Markdown file
 */
export function exportCardsAsMarkdown(cards: Card[], filename = 'cards.md'): void {
    const markdown = cardsToMarkdown(cards);
    downloadFile(markdown, filename, 'text/markdown');
}

/**
 * Export data as JSON file
 */
export function exportAsJson(data: unknown, filename = 'export.json'): void {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, filename, 'application/json');
}

/**
 * Export project as a JSON backup
 */
export function exportProjectBackup(projectId: string): void {
    const backupData: Record<string, unknown> = {};
    const keysToBackup = [
        'visual-thinking-projects',
        'visual-thinking-cards',
        'visual-thinking-files',
        'visual-thinking-tags',
        'visual-thinking-ui',
        'visual-thinking-settings',
    ];

    for (const key of keysToBackup) {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                backupData[key] = JSON.parse(data);
            } catch {
                backupData[key] = data;
            }
        }
    }

    const filename = `visual-thinking-backup-${projectId}-${new Date().toISOString().split('T')[0]}.json`;
    exportAsJson(backupData, filename);
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Parse Markdown content into card data
 */
export function markdownToCard(markdown: string): Partial<Card> {
    const lines = markdown.split('\n');
    let title = '';
    const contentLines: string[] = [];

    // Extract title from first H1
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('# ') && !title) {
            title = line.slice(2).trim();
        } else if (line === '---' && i > 0) {
            // Stop at metadata section
            break;
        } else if (title || !line.startsWith('#')) {
            contentLines.push(line);
        }
    }

    const content = contentLines.join('\n').trim();
    const now = Date.now();

    return {
        id: nanoid(),
        title: title || 'Imported Card',
        content,
        contentType: 'markdown',
        isHidden: false,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Read a file as text
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Read a file as data URL (for images)
 */
export function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Import markdown files as cards
 */
export async function importMarkdownFiles(files: File[]): Promise<Partial<Card>[]> {
    const cards: Partial<Card>[] = [];

    for (const file of files) {
        if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
            const content = await readFileAsText(file);
            const card = markdownToCard(content);
            card.title = card.title || file.name.replace(/\.(md|markdown)$/, '');
            cards.push(card);
        }
    }

    return cards;
}

/**
 * Import a JSON backup file
 */
export async function importJsonBackup(file: File): Promise<Record<string, unknown> | null> {
    try {
        const content = await readFileAsText(file);
        const data = JSON.parse(content) as Record<string, unknown>;

        // Restore each key to localStorage
        for (const [key, value] of Object.entries(data)) {
            if (key.startsWith('visual-thinking-')) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        }

        return data;
    } catch (e) {
        console.error('Failed to import JSON backup:', e);
        return null;
    }
}

/**
 * Get accepted file types for import
 */
export const IMPORT_ACCEPT = {
    markdown: '.md,.markdown',
    images: 'image/*',
    pdfs: '.pdf',
    json: '.json',
    all: '.md,.markdown,.pdf,.json,image/*',
};

/**
 * Determine file type category
 */
export function getFileType(file: File): 'markdown' | 'image' | 'pdf' | 'json' | 'unknown' {
    const name = file.name.toLowerCase();
    if (name.endsWith('.md') || name.endsWith('.markdown')) return 'markdown';
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.json')) return 'json';
    if (file.type.startsWith('image/')) return 'image';
    return 'unknown';
}
