import {
    BaseBoxShapeUtil,
    HTMLContainer,
    Rectangle2d,
    TLBaseShape,
    TLResizeInfo,
    resizeBox,
} from 'tldraw';

// Define the highlight shape type
export type HighlightShape = TLBaseShape<
    'highlight',
    {
        w: number;
        h: number;
        highlightId: string; // Reference to highlight in database
        sourceType: 'pdf' | 'card';
        sourceId: string;
        content: string; // The highlighted text/snippet
        note?: string; // User's note on the highlight
        color: string;
        pageNumber?: number; // For PDF highlights
    }
>;

// Highlight shape utility class
export class HighlightShapeUtil extends BaseBoxShapeUtil<HighlightShape> {
    static override type = 'highlight' as const;

    // Default properties for new highlight shapes
    getDefaultProps(): HighlightShape['props'] {
        return {
            w: 260,
            h: 120,
            highlightId: '',
            sourceType: 'pdf',
            sourceId: '',
            content: '',
            note: undefined,
            color: 'highlight-yellow',
            pageNumber: undefined,
        };
    }

    // Define the shape's bounds
    override getGeometry(shape: HighlightShape) {
        return new Rectangle2d({
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        });
    }

    // Render the highlight component
    override component(shape: HighlightShape) {
        const colorMap: Record<string, { bg: string; border: string; accent: string }> = {
            'highlight-yellow': {
                bg: 'hsl(45 93% 65% / 0.15)',
                border: 'hsl(45 93% 55% / 0.4)',
                accent: 'hsl(45 93% 55%)',
            },
            'highlight-green': {
                bg: 'hsl(150 70% 50% / 0.15)',
                border: 'hsl(150 70% 45% / 0.4)',
                accent: 'hsl(150 70% 45%)',
            },
            'highlight-blue': {
                bg: 'hsl(210 90% 65% / 0.15)',
                border: 'hsl(210 90% 55% / 0.4)',
                accent: 'hsl(210 90% 55%)',
            },
            'highlight-pink': {
                bg: 'hsl(330 80% 65% / 0.15)',
                border: 'hsl(330 80% 55% / 0.4)',
                accent: 'hsl(330 80% 55%)',
            },
            'highlight-purple': {
                bg: 'hsl(270 70% 65% / 0.15)',
                border: 'hsl(270 70% 55% / 0.4)',
                accent: 'hsl(270 70% 55%)',
            },
        };

        const colors = colorMap[shape.props.color] || colorMap['highlight-yellow'];

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: shape.props.w,
                    height: shape.props.h,
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.accent}`,
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    pointerEvents: 'all',
                }}
            >
                {/* Source indicator */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                    }}
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={colors.accent}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {shape.props.sourceType === 'pdf' ? (
                            <>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                            </>
                        ) : (
                            <>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </>
                        )}
                    </svg>
                    <span
                        style={{
                            fontSize: '10px',
                            color: colors.accent,
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {shape.props.sourceType === 'pdf'
                            ? `PDF • Page ${shape.props.pageNumber || '?'}`
                            : 'Card Highlight'
                        }
                    </span>
                </div>

                {/* Highlighted content */}
                <blockquote
                    style={{
                        fontSize: '12px',
                        lineHeight: 1.5,
                        color: 'hsl(var(--foreground))',
                        margin: 0,
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        flex: 1,
                    }}
                >
                    "{shape.props.content || 'No content'}"
                </blockquote>

                {/* Note (if present) */}
                {shape.props.note && (
                    <p
                        style={{
                            fontSize: '11px',
                            color: 'hsl(var(--muted-foreground))',
                            margin: '8px 0 0 0',
                            padding: '6px 8px',
                            backgroundColor: 'hsl(var(--muted))',
                            borderRadius: '4px',
                        }}
                    >
                        Note: {shape.props.note}
                    </p>
                )}
            </HTMLContainer>
        );
    }

    // Render indicator when selected
    override indicator(shape: HighlightShape) {
        return (
            <rect
                width={shape.props.w}
                height={shape.props.h}
                rx={6}
                ry={6}
                fill="none"
            />
        );
    }

    // Handle resize
    override onResize(shape: HighlightShape, info: TLResizeInfo<HighlightShape>) {
        return resizeBox(shape, info);
    }

    // Handle double-click to jump to source
    override onDoubleClick(shape: HighlightShape) {
        // Navigate to source (PDF page or card)
        console.log('Navigate to source:', shape.props.sourceType, shape.props.sourceId);
        return shape;
    }
}
