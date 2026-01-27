import {
    BaseBoxShapeUtil,
    HTMLContainer,
    Rectangle2d,
    TLBaseShape,
    TLResizeInfo,
    resizeBox,
    useEditor,
    T,
} from 'tldraw';
import { nanoid } from 'nanoid';
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

export interface MindMapNodeData {
    id: string;
    text: string;
    children?: MindMapNodeData[];
    color?: string;
    collapsed?: boolean;
}

export type MindMapShape = TLBaseShape<
    'mindmap',
    {
        w: number;
        h: number;
        rootNode: MindMapNodeData;
        layout: 'radial' | 'horizontal' | 'vertical'; // Currently only supporting horizontal
        theme?: string;
    }
>;

// --- Constants ---

const BRANCH_COLORS = [
    "#D4A574", // warm tan/amber
    "#E57373", // coral/red
    "#81C784", // green
    "#64B5F6", // blue
    "#BA68C8", // purple
    "#FFB74D", // orange
];

// --- Helpers ---

const findAndUpdateNode = (
    nodes: MindMapNodeData,
    targetId: string,
    updater: (node: MindMapNodeData) => MindMapNodeData
): MindMapNodeData => {
    if (nodes.id === targetId) {
        return updater(nodes);
    }
    if (nodes.children) {
        return {
            ...nodes,
            children: nodes.children.map((child) =>
                findAndUpdateNode(child, targetId, updater)
            ),
        };
    }
    return nodes;
};

const deleteNodeFromTree = (nodes: MindMapNodeData, targetId: string): MindMapNodeData => {
    if (!nodes.children) return nodes;

    return {
        ...nodes,
        children: nodes.children
            .filter((child) => child.id !== targetId)
            .map((child) => deleteNodeFromTree(child, targetId)),
    };
};

function createNode(text: string): MindMapNodeData {
    return {
        id: nanoid(8),
        text,
        children: [],
        collapsed: false,
    };
}

// --- Components ---

interface MindMapNodeProps {
    node: MindMapNodeData;
    level: number;
    isRoot?: boolean;
    branchColor: string;
    onAddChild: (parentId: string) => void;
    onUpdateText: (id: string, text: string) => void;
    onDelete: (id: string) => void;
    onToggleCollapse: (id: string) => void;
}

const MindMapNode = ({
    node,
    level,
    isRoot = false,
    branchColor,
    onAddChild,
    onUpdateText,
    onDelete,
    onToggleCollapse,
}: MindMapNodeProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(node.text);
    const nodeRef = useRef<HTMLDivElement>(null);
    const childrenContainerRef = useRef<HTMLDivElement>(null);
    const [paths, setPaths] = useState<JSX.Element[]>([]);

    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = node.collapsed;

    // Sync state
    useEffect(() => {
        if (!isEditing) {
            setEditText(node.text);
        }
    }, [node.text, isEditing]);

    // Measure and draw SVG lines
    // We use useLayoutEffect to ensure lines are drawn immediately after layout
    useLayoutEffect(() => {
        if (!hasChildren || isCollapsed || !childrenContainerRef.current) return;

        const updatePaths = () => {
            const container = childrenContainerRef.current;
            if (!container) return;

            // Parent center Y comes from the center of the container's height?
            // The container is `flex items-center` with the parent node? 
            // No, container is the children wrapper.
            // Be careful: Parent Node is locked to the center of the children container vertically?
            // Yes, standard Mind Map layout aligns Parent Center to Children Group Center.
            // So Parent Y = container.offsetHeight / 2.

            const parentY = container.offsetHeight / 2;

            const childElements = Array.from(container.children).filter(
                (c) => c.getAttribute('data-mindmap-child') === 'true'
            ) as HTMLElement[];

            const newPaths = childElements.map((childEl, index) => {
                const childNodeData = node.children![index];
                if (!childNodeData) return null;

                // Child row center Y relative to the container
                const childY = childEl.offsetTop + childEl.offsetHeight / 2;
                const childColor = childNodeData.color || branchColor;

                // Bezier Curve: Start (0, parentY) -> End (40, childY)
                // Control points at x=20 (midpoint)
                const d = `M 0 ${parentY} C 20 ${parentY}, 20 ${childY}, 40 ${childY}`;

                return (
                    <path
                        key={childNodeData.id}
                        d={d}
                        fill="none"
                        stroke={childColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                );
            }).filter(Boolean) as JSX.Element[];

            setPaths(newPaths);
        };

        // Initial draw
        updatePaths();

        // Observe resizes (if text changes size or branches expand)
        const observer = new ResizeObserver(updatePaths);
        observer.observe(childrenContainerRef.current);
        // Also observe children if possible, but observing container size change usually suffices

        return () => observer.disconnect();
    }, [hasChildren, isCollapsed, node.children, branchColor]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditText(node.text);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editText.trim() && editText !== node.text) {
            onUpdateText(node.id, editText.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleBlur();
        } else if (e.key === "Escape") {
            setEditText(node.text);
            setIsEditing(false);
        }
    };

    return (
        <div className="flex items-center">
            {/* Node Content */}
            <div
                ref={nodeRef}
                className={cn(
                    "relative flex items-center group cursor-pointer whitespace-nowrap",
                    "px-3 py-1.5 rounded-lg border bg-card shadow-sm",
                    "hover:shadow-md transition-all duration-200"
                )}
                style={{
                    borderColor: branchColor,
                    backgroundColor: `${branchColor}15`,
                    pointerEvents: 'all'
                }}
                onDoubleClick={handleDoubleClick}
                onPointerDown={(e) => e.stopPropagation()}
            >
                {/* Collapse Button */}
                {hasChildren && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCollapse(node.id);
                        }}
                        className="mr-1 w-4 h-4 flex items-center justify-center rounded hover:bg-muted/50 transition-all"
                    >
                        <ChevronRight
                            className={cn(
                                "w-3 h-3 text-muted-foreground transition-transform duration-200",
                                !isCollapsed && "rotate-90"
                            )}
                        />
                    </button>
                )}

                {/* Text Content */}
                {isEditing ? (
                    <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "bg-transparent border-none outline-none text-foreground min-w-[30px]",
                            isRoot ? "text-base font-medium" : "text-sm"
                        )}
                        style={{ width: `${Math.max(editText.length, 3)}ch` }}
                    />
                ) : (
                    <span
                        className={cn(
                            "text-foreground transition-colors",
                            isRoot ? "text-base font-medium" : "text-sm"
                        )}
                        style={{ userSelect: 'none' }}
                    >
                        {node.text}
                    </span>
                )}

                {/* Actions */}
                <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddChild(node.id);
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted/50 transition-all"
                        style={{ backgroundColor: `${branchColor}30` }}
                    >
                        <Plus className="w-3 h-3 text-muted-foreground" />
                    </button>
                    {!isRoot && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(node.id);
                            }}
                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-destructive/20 transition-all ml-0.5"
                        >
                            <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                    )}
                </div>
            </div>

            {/* Children with Measured SVG Curves */}
            {hasChildren && !isCollapsed && (
                <div className="flex items-center relative">
                    {/* 
                         We wrap the children container.
                         The SVG overlay lives here, positioned in the gap.
                         Gap is ml-10 (40px).
                     */}
                    <div
                        ref={childrenContainerRef}
                        className="flex flex-col ml-10 gap-4 relative"
                    >
                        {/* SVG Canvas for Connectors */}
                        <svg
                            className="absolute -left-10 top-0 w-10 h-full pointer-events-none overflow-visible"
                        >
                            {paths}
                        </svg>

                        {/* Recursive Children */}
                        {node.children!.map((child, index) => (
                            <div
                                key={child.id}
                                data-mindmap-child="true"
                                className="flex items-center"
                            >
                                <MindMapNode
                                    node={child}
                                    level={level + 1}
                                    branchColor={child.color || branchColor}
                                    onAddChild={onAddChild}
                                    onUpdateText={onUpdateText}
                                    onDelete={onDelete}
                                    onToggleCollapse={onToggleCollapse}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Shape Util ---

export class MindMapShapeUtil extends BaseBoxShapeUtil<MindMapShape> {
    static override type = 'mindmap' as const;

    static override props = {
        w: T.number,
        h: T.number,
        rootNode: T.any,
        layout: T.string,
        theme: T.string.optional(),
    };

    override getDefaultProps(): MindMapShape['props'] {
        return {
            w: 800,
            h: 600,
            rootNode: createNode('Central Topic'),
            layout: 'horizontal',
        };
    }

    override getGeometry(shape: MindMapShape) {
        return new Rectangle2d({
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        });
    }

    override component(shape: MindMapShape) {
        const editor = useEditor();
        const { rootNode, w, h } = shape.props;
        const containerRef = useRef<HTMLDivElement>(null);

        const updateRoot = (updater: (root: MindMapNodeData) => MindMapNodeData) => {
            const newRoot = updater(rootNode);
            editor.updateShape({
                id: shape.id,
                type: 'mindmap',
                props: { rootNode: newRoot },
            });
        };

        // Auto-resize logic: Measure content and update shape dimensions
        useLayoutEffect(() => {
            if (!containerRef.current) return;

            const updateSize = () => {
                const content = containerRef.current;
                if (!content) return;

                // Get actual content dimensions
                // We assume the inner div (first child) represents the full content
                const innerContent = content.firstElementChild as HTMLElement;
                if (!innerContent) return;

                const newW = innerContent.scrollWidth + 80; // 40px padding * 2
                const newH = innerContent.scrollHeight + 80;

                // Only update if difference is significant to avoid jitter
                if (Math.abs(newW - shape.props.w) > 5 || Math.abs(newH - shape.props.h) > 5) {
                    editor.updateShape({
                        id: shape.id,
                        type: 'mindmap',
                        props: { w: newW, h: newH },
                    });
                }
            };

            // Observer content size changes
            const observer = new ResizeObserver(updateSize);
            // Observe the inner content wrapper which grows with the tree
            if (containerRef.current.firstElementChild) {
                observer.observe(containerRef.current.firstElementChild);
            }

            // Also run once immediately
            updateSize();

            return () => observer.disconnect();
        }, [editor, shape.id, shape.props.w, shape.props.h, rootNode]); // Re-run when rootNode changes (structure change)

        const handleAddChild = useCallback((parentId: string) => {
            const isRoot = parentId === rootNode.id;
            updateRoot((prevRoot) =>
                findAndUpdateNode(prevRoot, parentId, (node) => {
                    let nextColor = node.color;
                    if (isRoot) {
                        const index = node.children ? node.children.length : 0;
                        nextColor = BRANCH_COLORS[index % BRANCH_COLORS.length];
                    }

                    return {
                        ...node,
                        children: [
                            ...(node.children || []),
                            { ...createNode("New Node"), color: nextColor },
                        ],
                        collapsed: false,
                    };
                })
            );
        }, [editor, shape.id, rootNode]);

        const handleUpdateText = useCallback((id: string, text: string) => {
            updateRoot((prevRoot) =>
                findAndUpdateNode(prevRoot, id, (node) => ({ ...node, text }))
            );
        }, [editor, shape.id, rootNode]);

        const handleDelete = useCallback((id: string) => {
            if (id === rootNode.id) return;
            updateRoot((prevRoot) => deleteNodeFromTree(prevRoot, id));
        }, [editor, shape.id, rootNode]);

        const handleToggleCollapse = useCallback((id: string) => {
            updateRoot((prevRoot) =>
                findAndUpdateNode(prevRoot, id, (node) => ({
                    ...node,
                    collapsed: !node.collapsed,
                }))
            );
        }, [editor, shape.id, rootNode]);

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: w,
                    height: h,
                    backgroundColor: 'hsl(var(--background) / 0.5)',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: '16px',
                    padding: '40px',
                    pointerEvents: 'all',
                    // overflow: 'auto', // Disable scroll since we auto-fit
                    overflow: 'hidden',
                }}
            >
                <div
                    ref={containerRef}
                    className="min-w-full min-h-full flex items-center justify-center"
                >
                    {/* Inner Content Wrapper - We measure THIS */}
                    <div className="flex items-center w-fit h-fit">
                        <MindMapNode
                            node={rootNode}
                            level={0}
                            isRoot={true}
                            branchColor={rootNode.color || "hsl(var(--primary))"}
                            onAddChild={handleAddChild}
                            onUpdateText={handleUpdateText}
                            onDelete={handleDelete}
                            onToggleCollapse={handleToggleCollapse}
                        />
                    </div>
                </div>
            </HTMLContainer>
        );
    }

    override indicator(shape: MindMapShape) {
        return (
            <rect
                width={shape.props.w}
                height={shape.props.h}
                rx={16}
                ry={16}
                fill="none"
            />
        );
    }

    override onResize(shape: MindMapShape, info: TLResizeInfo<MindMapShape>) {
        return resizeBox(shape, info);
    }

    override canEdit() {
        return true;
    }
}

export function createDefaultMindMap(topic: string = 'Mind Map'): MindMapNodeData {
    return createNode(topic);
}
