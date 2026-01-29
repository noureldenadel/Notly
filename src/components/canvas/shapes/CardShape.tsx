import {
    BaseBoxShapeUtil,
    HTMLContainer,
    Rectangle2d,
    TLBaseShape,
    TLResizeInfo,
    resizeBox,
} from 'tldraw';
import { openCardEditor } from '@/lib/cardEvents';
import { createLogger } from '@/lib/logger';

const log = createLogger('CardShape');

// Define the card shape type
export type CardShape = TLBaseShape<
    'card',
    {
        w: number;
        h: number;
        cardId: string; // Reference to card in cardStore
        title: string;
        content: string;
        color: string;
        isEditing: boolean;
    }
>;

// Card shape utility class
export class CardShapeUtil extends BaseBoxShapeUtil<CardShape> {
    static override type = 'card' as const;

    // Default properties for new cards
    getDefaultProps(): CardShape['props'] {
        return {
            w: 280,
            h: 160,
            cardId: '',
            title: 'New Card',
            content: '',
            color: 'highlight-blue',
            isEditing: false,
        };
    }

    // Define the shape's bounds
    override getGeometry(shape: CardShape) {
        return new Rectangle2d({
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        });
    }

    // Render the card component
    override component(shape: CardShape) {
        const colorMap: Record<string, string> = {
            'highlight-blue': '210 90% 65%',
            'highlight-purple': '270 70% 65%',
            'highlight-green': '150 70% 50%',
            'highlight-yellow': '45 93% 65%',
            'highlight-pink': '330 80% 65%',
        };

        const hslColor = colorMap[shape.props.color] || '210 90% 65%';

        // Strip HTML tags for preview
        const textContent = shape.props.content
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const wordCount = textContent.split(/\s+/).filter(Boolean).length;

        // Handler for double-click to open editor
        const handleDoubleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            log.debug('Double-click handler triggered, cardId:', shape.props.cardId);
            openCardEditor(shape.props.cardId || '', shape.id);
        };

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: shape.props.w,
                    height: shape.props.h,
                    backgroundColor: 'hsl(var(--card))', // Solid opaque background
                    border: `1px solid hsl(var(--border))`, // First set base border
                    borderTop: `3px solid hsl(${hslColor})`, // Then override top with accent
                    borderTopWidth: '3px',
                    borderRadius: '8px', // Slightly tighter radius
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    pointerEvents: 'all', // Capture events ourselves
                    userSelect: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)', // Enhanced shadow
                }}
                onDoubleClick={handleDoubleClick}
            >
                {/* Card Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '8px',
                        pointerEvents: 'none', // Pass through
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={`hsl(${hslColor})`}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginTop: '2px', flexShrink: 0 }}
                    >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <h3
                        style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            lineHeight: 1.3,
                            color: 'hsl(var(--foreground))',
                            margin: 0,
                        }}
                    >
                        {shape.props.title || 'Untitled Card'}
                    </h3>
                </div>

                {/* Card Content Preview */}
                <p
                    style={{
                        fontSize: '12px',
                        lineHeight: 1.5,
                        color: 'hsl(var(--muted-foreground))',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        flex: 1,
                        pointerEvents: 'none',
                    }}
                >
                    {textContent || 'Double-click to edit...'}
                </p>

                {/* Card Footer */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: 'auto',
                        paddingTop: '12px',
                        pointerEvents: 'none',
                    }}
                >
                    <span
                        style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            backgroundColor: 'hsl(var(--muted))',
                            borderRadius: '999px',
                            color: 'hsl(var(--muted-foreground))',
                        }}
                    >
                        {wordCount} words
                    </span>
                </div>
            </HTMLContainer>
        );
    }

    // Render indicator when selected
    override indicator(shape: CardShape) {
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

    // Handle resize
    override onResize(shape: CardShape, info: TLResizeInfo<CardShape>) {
        return resizeBox(shape, info);
    }

    // Handle double-click to open editor modal
    override onDoubleClick(shape: CardShape) {
        log.debug('onDoubleClick triggered, cardId:', shape.props.cardId, 'shapeId:', shape.id);

        // Open the card editor modal via event system
        // Try to open even if cardId is empty - we'll handle it in the modal
        openCardEditor(shape.props.cardId || '', shape.id);

        // Return void to prevent default tldraw editing behavior
        return;
    }

    // Don't use Tldraw's internal edit mode - we open a modal instead
    override canEdit() {
        return false;
    }
}
