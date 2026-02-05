import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import SLASH_COMMANDS from './extensions/SlashCommands';
const SlashCommands = SLASH_COMMANDS; // re-assign for clearer usage in array
import { useCallback, useEffect } from 'react';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Minus,
    Link as LinkIcon,
    Highlighter,
    Heading1,
    Heading2,
    Heading3,
    Undo,
    Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TipTapEditorProps {
    content: string;
    onChange?: (content: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    editable?: boolean;
    showToolbar?: boolean;
    className?: string;
}

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick: () => void;
    disabled?: boolean;
}

const ToolbarButton = ({ icon, label, isActive, onClick, disabled }: ToolbarButtonProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                onClick={onClick}
                disabled={disabled}
                className={cn(
                    'w-8 h-8',
                    isActive && 'bg-accent text-accent-foreground'
                )}
            >
                {icon}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
);

export function TipTapEditor({
    content,
    onChange,
    onBlur,
    placeholder = 'Start writing...',
    editable = true,
    showToolbar = true,
    className = '',
}: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder,
            }),
            Highlight.configure({
                multicolor: true,
            }),
            TextStyle,
            Color,
            Underline,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            SlashCommands,
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        onBlur: () => {
            onBlur?.();
        },
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px]',
                    'prose-headings:font-semibold prose-headings:text-foreground',
                    'prose-p:text-foreground prose-p:leading-relaxed',
                    'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
                    'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
                    'prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-lg',
                    'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
                    'prose-ul:text-foreground prose-ol:text-foreground',
                    className
                ),
            },
        },
    });

    // Update content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="flex flex-col">
            {/* Toolbar */}
            {showToolbar && (
                <div className="flex items-center gap-0.5 p-1 border-b border-border bg-muted/30 rounded-t-lg flex-wrap">
                    {/* History */}
                    <ToolbarButton
                        icon={<Undo className="w-4 h-4" />}
                        label="Undo"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    />
                    <ToolbarButton
                        icon={<Redo className="w-4 h-4" />}
                        label="Redo"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    />

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Headings */}
                    <ToolbarButton
                        icon={<Heading1 className="w-4 h-4" />}
                        label="Heading 1"
                        isActive={editor.isActive('heading', { level: 1 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    />
                    <ToolbarButton
                        icon={<Heading2 className="w-4 h-4" />}
                        label="Heading 2"
                        isActive={editor.isActive('heading', { level: 2 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    />
                    <ToolbarButton
                        icon={<Heading3 className="w-4 h-4" />}
                        label="Heading 3"
                        isActive={editor.isActive('heading', { level: 3 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    />

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Text formatting */}
                    <ToolbarButton
                        icon={<Bold className="w-4 h-4" />}
                        label="Bold"
                        isActive={editor.isActive('bold')}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    />
                    <ToolbarButton
                        icon={<Italic className="w-4 h-4" />}
                        label="Italic"
                        isActive={editor.isActive('italic')}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    />
                    <ToolbarButton
                        icon={<UnderlineIcon className="w-4 h-4" />}
                        label="Underline"
                        isActive={editor.isActive('underline')}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    />
                    <ToolbarButton
                        icon={<Strikethrough className="w-4 h-4" />}
                        label="Strikethrough"
                        isActive={editor.isActive('strike')}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    />
                    <ToolbarButton
                        icon={<Code className="w-4 h-4" />}
                        label="Code"
                        isActive={editor.isActive('code')}
                        onClick={() => editor.chain().focus().toggleCode().run()}
                    />
                    <ToolbarButton
                        icon={<Highlighter className="w-4 h-4" />}
                        label="Highlight"
                        isActive={editor.isActive('highlight')}
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                    />

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Lists */}
                    <ToolbarButton
                        icon={<List className="w-4 h-4" />}
                        label="Bullet List"
                        isActive={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    />
                    <ToolbarButton
                        icon={<ListOrdered className="w-4 h-4" />}
                        label="Numbered List"
                        isActive={editor.isActive('orderedList')}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    />
                    <ToolbarButton
                        icon={<CheckSquare className="w-4 h-4" />}
                        label="Task List"
                        isActive={editor.isActive('taskList')}
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                    />

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Block elements */}
                    <ToolbarButton
                        icon={<Quote className="w-4 h-4" />}
                        label="Blockquote"
                        isActive={editor.isActive('blockquote')}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    />
                    <ToolbarButton
                        icon={<Minus className="w-4 h-4" />}
                        label="Horizontal Rule"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    />
                    <ToolbarButton
                        icon={<LinkIcon className="w-4 h-4" />}
                        label="Link"
                        isActive={editor.isActive('link')}
                        onClick={setLink}
                    />
                </div>
            )}

            {/* Editor Content */}
            <div className={cn('p-4', !showToolbar && 'pt-0')}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

export default TipTapEditor;
