import {
    BaseBoxShapeUtil,
    HTMLContainer,
    Rectangle2d,
    TLBaseShape,
    TLResizeInfo,
    resizeBox,
} from 'tldraw';
import { nanoid } from 'nanoid';

// Mind map node structure
export interface MindMapNode {
    id: string;
    text: string;
    color: string;
    children: MindMapNode[];
    collapsed: boolean;
}

// Define the mind map shape type
export type MindMapShape = TLBaseShape<
    'mindmap',
    {
        w: number;
        h: number;
        rootNode: MindMapNode;
        layout: 'radial' | 'horizontal' | 'vertical';
        theme: string;
    }
>;

// Default node colors
const nodeColors = [
    'hsl(210 90% 65%)',   // Blue
    'hsl(270 70% 65%)',   // Purple
    'hsl(150 70% 50%)',   // Green
    'hsl(45 93% 65%)',    // Yellow
    'hsl(330 80% 65%)',   // Pink
    'hsl(180 70% 50%)',   // Cyan
    'hsl(30 90% 60%)',    // Orange
];

// Create a new node
function createNode(text: string, depth: number = 0): MindMapNode {
    return {
        id: nanoid(8),
        text,
        color: nodeColors[depth % nodeColors.length],
        children: [],
        collapsed: false,
    };
}

// Mind map shape utility class
export class MindMapShapeUtil extends BaseBoxShapeUtil<MindMapShape> {
    static override type = 'mindmap' as const;

    // Default properties for new mind maps
    getDefaultProps(): MindMapShape['props'] {
        return {
            w: 600,
            h: 400,
            rootNode: createNode('Central Topic'),
            layout: 'horizontal',
            theme: 'default',
        };
    }

    // Define the shape's bounds
    override getGeometry(shape: MindMapShape) {
        return new Rectangle2d({
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        });
    }

    // Render the mind map component
    override component(shape: MindMapShape) {
        const { rootNode, layout, w, h } = shape.props;

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: w,
                    height: h,
                    backgroundColor: 'hsl(var(--background) / 0.5)',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: '16px',
                    padding: '20px',
                    pointerEvents: 'all',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                >
                    {/* Render mind map tree */}
                    <MindMapTree
                        node={rootNode}
                        layout={layout}
                        depth={0}
                        shapeId={shape.id}
                    />
                </div>
            </HTMLContainer>
        );
    }

    // Render indicator when selected
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

    // Handle resize
    override onResize(shape: MindMapShape, info: TLResizeInfo<MindMapShape>) {
        return resizeBox(shape, info);
    }

    // Handle double-click to edit
    override onDoubleClick(shape: MindMapShape) {
        // TODO: Open mind map editor modal
        return;
    }

    // Can the shape be edited
    override canEdit() {
        return true;
    }
}

// Mind map tree renderer component
interface MindMapTreeProps {
    node: MindMapNode;
    layout: 'radial' | 'horizontal' | 'vertical';
    depth: number;
    shapeId: string;
}

function MindMapTree({ node, layout, depth, shapeId }: MindMapTreeProps) {
    const isRoot = depth === 0;
    const hasChildren = node.children.length > 0;

    // Calculate node style based on depth
    const nodeStyle: React.CSSProperties = {
        padding: isRoot ? '12px 24px' : '8px 16px',
        borderRadius: isRoot ? '50px' : '12px',
        backgroundColor: `${node.color}20`,
        border: `2px solid ${node.color}`,
        fontSize: isRoot ? '16px' : '13px',
        fontWeight: isRoot ? 600 : 500,
        color: 'hsl(var(--foreground))',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    };

    // Layout container style
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
        gap: layout === 'vertical' ? '20px' : '40px',
    };

    // Children container style
    const childrenStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: layout === 'horizontal' ? 'column' : 'row',
        alignItems: layout === 'horizontal' ? 'flex-start' : 'center',
        gap: '12px',
        marginLeft: layout === 'horizontal' ? '20px' : 0,
        marginTop: layout === 'vertical' ? '20px' : 0,
    };

    return (
        <div style={containerStyle}>
            {/* Node */}
            <div style={{ position: 'relative' }}>
                <div style={nodeStyle}>
                    {/* Collapse indicator */}
                    {hasChildren && (
                        <span
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: node.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                color: 'white',
                                flexShrink: 0,
                            }}
                        >
                            {node.collapsed ? '+' : node.children.length}
                        </span>
                    )}
                    <span>{node.text}</span>
                </div>

                {/* Add child button (shown on hover in real implementation) */}
                {!node.collapsed && (
                    <div
                        style={{
                            position: 'absolute',
                            right: layout === 'horizontal' ? '-8px' : '50%',
                            bottom: layout === 'vertical' ? '-8px' : '50%',
                            transform: layout === 'horizontal'
                                ? 'translateY(-50%)'
                                : 'translateX(50%)',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: 'hsl(var(--muted))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: 'hsl(var(--muted-foreground))',
                            cursor: 'pointer',
                            opacity: 0.5,
                        }}
                    >
                        +
                    </div>
                )}
            </div>

            {/* Children */}
            {hasChildren && !node.collapsed && (
                <div style={childrenStyle}>
                    {/* Connection lines */}
                    <svg
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            top: 0,
                            left: 0,
                        }}
                    >
                        {/* Lines would be rendered here based on layout */}
                    </svg>

                    {/* Child nodes */}
                    {node.children.map((child) => (
                        <MindMapTree
                            key={child.id}
                            node={child}
                            layout={layout}
                            depth={depth + 1}
                            shapeId={shapeId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Export helper function to create a mind map with initial nodes
export function createDefaultMindMap(topic: string = 'Main Topic'): MindMapNode {
    const root = createNode(topic, 0);

    // Add some default children
    root.children = [
        createNode('Subtopic 1', 1),
        createNode('Subtopic 2', 1),
        createNode('Subtopic 3', 1),
    ];

    return root;
}
