import {
    BaseBoxShapeUtil,
    HTMLContainer,
    Rectangle2d,
    TLBaseShape,
    TLResizeInfo,
    resizeBox,
} from 'tldraw';

// Mind map node structure (placeholder)
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

// Placeholder - Mind map shape utility class
export class MindMapShapeUtil extends BaseBoxShapeUtil<MindMapShape> {
    static override type = 'mindmap' as const;

    getDefaultProps(): MindMapShape['props'] {
        return {
            w: 400,
            h: 300,
            rootNode: {
                id: 'root',
                text: 'Mind Map',
                color: '#4A90D9',
                children: [],
                collapsed: false,
            },
            layout: 'horizontal',
            theme: 'default',
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
        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: shape.props.w,
                    height: shape.props.h,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '2px dashed rgba(100,150,255,0.5)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '14px',
                    textAlign: 'center',
                }}
            >
                <div>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧠</div>
                    <div>Mind Map</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Coming Soon</div>
                </div>
            </HTMLContainer>
        );
    }

    override indicator(shape: MindMapShape) {
        return (
            <rect
                width={shape.props.w}
                height={shape.props.h}
                rx={12}
                ry={12}
                fill="none"
            />
        );
    }

    override onResize(shape: MindMapShape, info: TLResizeInfo<MindMapShape>) {
        return resizeBox(shape, info);
    }
}

// Placeholder export for compatibility
export function createDefaultMindMap(topic: string = 'Main Topic'): MindMapNode {
    return {
        id: 'root',
        text: topic,
        color: '#4A90D9',
        children: [],
        collapsed: false,
    };
}
