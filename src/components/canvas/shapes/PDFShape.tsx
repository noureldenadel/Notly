import {
    BaseBoxShapeUtil,
    HTMLContainer,
    Rectangle2d,
    TLBaseShape,
    TLResizeInfo,
    resizeBox,
} from 'tldraw';

// Define the PDF shape type
export type PDFShape = TLBaseShape<
    'pdf',
    {
        w: number;
        h: number;
        fileId: string; // Reference to file in fileStore
        filename: string;
        pageNumber: number;
        totalPages: number;
        thumbnailPath?: string;
    }
>;

// PDF shape utility class
export class PDFShapeUtil extends BaseBoxShapeUtil<PDFShape> {
    static override type = 'pdf' as const;

    // Default properties for new PDF shapes
    getDefaultProps(): PDFShape['props'] {
        return {
            w: 200,
            h: 260,
            fileId: '',
            filename: 'Document.pdf',
            pageNumber: 1,
            totalPages: 1,
            thumbnailPath: '', // Use empty string instead of undefined for JSON serialization
        };
    }

    // Define the shape's bounds
    override getGeometry(shape: PDFShape) {
        return new Rectangle2d({
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        });
    }

    // Render the PDF preview component
    override component(shape: PDFShape) {
        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    width: shape.props.w,
                    height: shape.props.h,
                    backgroundColor: 'hsl(220 14% 12%)',
                    border: '2px solid hsl(220 14% 20%)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    pointerEvents: 'all',
                }}
            >
                {/* PDF Thumbnail Area */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'hsl(220 14% 8%)',
                        borderBottom: '1px solid hsl(220 14% 20%)',
                    }}
                >
                    {shape.props.thumbnailPath ? (
                        <img
                            src={shape.props.thumbnailPath}
                            alt={`Page ${shape.props.pageNumber}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    ) : (
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="hsl(0 75% 60%)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <line x1="10" y1="9" x2="8" y2="9" />
                        </svg>
                    )}
                </div>

                {/* PDF Info Footer */}
                <div
                    style={{
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--color-text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {shape.props.filename}
                    </span>
                    <span
                        style={{
                            fontSize: '10px',
                            color: 'var(--color-text-1)',
                        }}
                    >
                        Page {shape.props.pageNumber} of {shape.props.totalPages}
                    </span>
                </div>
            </HTMLContainer>
        );
    }

    // Render indicator when selected
    override indicator(shape: PDFShape) {
        return (
            <rect
                width={shape.props.w}
                height={shape.props.h}
                rx={8}
                ry={8}
                fill="none"
            />
        );
    }

    // Handle resize
    override onResize(shape: PDFShape, info: TLResizeInfo<PDFShape>) {
        return resizeBox(shape, info);
    }

    // Handle double-click to open PDF viewer
    override onDoubleClick(shape: PDFShape) {
        // Will open PDF viewer modal
        console.log('Open PDF viewer for:', shape.props.fileId, 'page:', shape.props.pageNumber);
        return shape;
    }
}
