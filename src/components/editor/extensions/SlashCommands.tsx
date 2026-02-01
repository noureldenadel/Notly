import { Extension, Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Code,
    Quote,
    Minus,
    Image,
    Link,
    Table,
} from 'lucide-react';

export interface SlashCommand {
    title: string;
    description: string;
    icon: React.ReactNode;
    command: (editor: Editor) => void;
    keywords?: string[];
}

const defaultCommands: SlashCommand[] = [
    {
        title: 'Heading 1',
        description: 'Large section heading',
        icon: <Heading1 className="w-4 h-4" />,
        keywords: ['h1', 'heading', 'title'],
        command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: <Heading2 className="w-4 h-4" />,
        keywords: ['h2', 'heading', 'subtitle'],
        command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: <Heading3 className="w-4 h-4" />,
        keywords: ['h3', 'heading'],
        command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
        title: 'Bullet List',
        description: 'Create a simple bullet list',
        icon: <List className="w-4 h-4" />,
        keywords: ['ul', 'unordered', 'bullet'],
        command: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: <ListOrdered className="w-4 h-4" />,
        keywords: ['ol', 'ordered', 'numbered'],
        command: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
        title: 'Task List',
        description: 'Create a checklist with todos',
        icon: <CheckSquare className="w-4 h-4" />,
        keywords: ['todo', 'task', 'checkbox'],
        command: (editor: Editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
        title: 'Code Block',
        description: 'Add a code block',
        icon: <Code className="w-4 h-4" />,
        keywords: ['code', 'pre', 'programming'],
        command: (editor: Editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
        title: 'Quote',
        description: 'Add a blockquote',
        icon: <Quote className="w-4 h-4" />,
        keywords: ['blockquote', 'quote'],
        command: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
        title: 'Divider',
        description: 'Add a horizontal rule',
        icon: <Minus className="w-4 h-4" />,
        keywords: ['hr', 'divider', 'separator'],
        command: (editor: Editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
        title: 'Image',
        description: 'Insert an image',
        icon: <Image className="w-4 h-4" />,
        keywords: ['image', 'picture', 'photo'],
        command: (editor: Editor) => {
            const url = window.prompt('Enter image URL');
            if (url) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        },
    },
    {
        title: 'Link',
        description: 'Add a hyperlink',
        icon: <Link className="w-4 h-4" />,
        keywords: ['link', 'url', 'href'],
        command: (editor: Editor) => {
            const url = window.prompt('Enter URL');
            if (url) {
                editor.chain().focus().setLink({ href: url }).run();
            }
        },
    },
    {
        title: 'Table',
        description: 'Insert a table',
        icon: <Table className="w-4 h-4" />,
        keywords: ['table', 'grid'],
        command: (editor: Editor) => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
        },
    },
];

// Component for the slash command menu
interface CommandListProps {
    items: SlashCommand[];
    command: (item: SlashCommand) => void;
}

interface CommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const CommandList = forwardRef<CommandListRef, CommandListProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        useEffect(() => {
            setSelectedIndex(0);
        }, [items]);

        const selectItem = (index: number) => {
            const item = items[index];
            if (item) {
                command(item);
            }
        };

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }) => {
                if (event.key === 'ArrowUp') {
                    setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    setSelectedIndex((prev) => (prev + 1) % items.length);
                    return true;
                }
                if (event.key === 'Enter') {
                    selectItem(selectedIndex);
                    return true;
                }
                return false;
            },
        }));

        if (items.length === 0) {
            return (
                <div className="p-2 text-sm text-muted-foreground">
                    No commands found
                </div>
            );
        }

        return (
            <div className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                {items.map((item, index) => (
                    <button
                        key={item.title}
                        onClick={() => selectItem(index)}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                            selectedIndex === index
                                ? 'bg-primary/10 text-foreground'
                                : 'hover:bg-muted/50 text-foreground'
                        )}
                    >
                        <div className="flex-shrink-0 text-muted-foreground">
                            {item.icon}
                        </div>
                        <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">
                                {item.description}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );
    }
);

CommandList.displayName = 'CommandList';

// Slash commands extension
export const SlashCommands = Extension.create({
    name: 'slashCommands',

    addOptions() {
        return {
            commands: defaultCommands,
            suggestion: {
                char: '/',
                startOfLine: false,
            },
        };
    },

    addProseMirrorPlugins() {
        const extension = this;

        return [
            new Plugin({
                key: new PluginKey('slashCommands'),

                props: {
                    handleKeyDown(view, event) {
                        // Handle slash key to trigger command menu
                        if (event.key === '/') {
                            const { state } = view;
                            const { selection } = state;
                            const { $from } = selection;

                            // Only trigger at start of line or after whitespace
                            const textBefore = $from.nodeBefore?.textContent || '';
                            const charBefore = textBefore.slice(-1);

                            if (textBefore === '' || charBefore === ' ' || charBefore === '\n') {
                                // Will be handled by decoration
                                return false;
                            }
                        }
                        return false;
                    },

                    decorations(state) {
                        const { doc, selection } = state;
                        const { $from } = selection;

                        // Find if we're in a slash command context
                        const textBefore = $from.nodeBefore?.textContent || '';
                        const slashIndex = textBefore.lastIndexOf('/');

                        if (slashIndex >= 0) {
                            const query = textBefore.slice(slashIndex + 1);

                            // Filter commands based on query
                            const filteredCommands = extension.options.commands.filter(
                                (cmd: SlashCommand) =>
                                    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
                                    cmd.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase()))
                            );

                            if (filteredCommands.length > 0) {
                                // Create decoration for menu position
                                const from = $from.pos - query.length - 1;
                                return DecorationSet.create(doc, [
                                    Decoration.widget(from, () => {
                                        const wrapper = document.createElement('span');
                                        wrapper.className = 'slash-command-trigger';
                                        wrapper.setAttribute('data-query', query);
                                        return wrapper;
                                    }),
                                ]);
                            }
                        }

                        return DecorationSet.empty;
                    },
                },
            }),
        ];
    },
});

export default SlashCommands;
