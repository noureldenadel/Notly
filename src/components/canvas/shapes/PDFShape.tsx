import * as React from 'react';
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

const PDF_FOOTER_HEIGHT = 50;

// Helper component to resolve and display thumbnail
function PDFThumbnailResolver({ path, pageNumber }: { path: string; pageNumber: number }) {
    const [resolvedSrc, setResolvedSrc] = React.useState<string>('');

    React.useEffect(() => {
        let active = true;
        const resolve = async () => {
            try {
                // If it's already a blob/data URL or http, use it
                if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) {
                    if (active) setResolvedSrc(path);
                    return;
                }

                // Otherwise treat as relative asset path
                const { getAssetUrl } = await import('@/lib/assetManager');
                const url = await getAssetUrl(path);
                if (active) setResolvedSrc(url);
            } catch (e) {
                console.error('Failed to resolve thumbnail:', e);
            }
        };
        resolve();
        return () => { active = false; };
    }, [path]);

    if (!resolvedSrc) return <div className="w-full h-full bg-muted animate-pulse" />;

    return (
        <img
            src={resolvedSrc}
            alt={`Page ${pageNumber}`}
            draggable={false}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                userSelect: 'none',
            }}
        />
    );
}

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
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--border))',
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
                        height: `calc(100% - ${PDF_FOOTER_HEIGHT}px)`,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'hsl(var(--muted))',
                        borderBottom: '1px solid hsl(var(--border))',
                        overflow: 'hidden',
                    }}
                >
                    {shape.props.thumbnailPath ? (
                        <PDFThumbnailResolver path={shape.props.thumbnailPath} pageNumber={shape.props.pageNumber} />
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
                        height: PDF_FOOTER_HEIGHT,
                        padding: '0 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '2px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'hsl(var(--foreground))',
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
                            color: 'hsl(var(--muted-foreground))',
                        }}
                    >
                        Page {shape.props.pageNumber} of {shape.props.totalPages}
                    </span>
                </div>
            </HTMLContainer >
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
        const { initialShape } = info;

        // Calculate the aspect ratio of the CONTENT area (excluding footer)
        const initialContentHeight = Math.max(10, initialShape.props.h - PDF_FOOTER_HEIGHT);
        const aspectRatio = initialShape.props.w / initialContentHeight;

        // Obtain the resized bounds from standard resizeBox logic
        const resized = resizeBox(shape, info);

        // We want to preserve the content aspect ratio.
        // Formula: NewContentHeight = NewWidth / AspectRatio
        //          NewTotalHeight = NewContentHeight + PDF_FOOTER_HEIGHT

        // However, we must respect which handle is being dragged.
        // If dragging top/bottom handles, height drives width? 
        // If dragging left/right handles, width drives height?
        // For simplicity and "card scaling" feel, let's assume width is primary 
        // unless strictly dragging top/bottom edge (in which case we could adjust width, 
        // but that might feel weird if user expects width to stay).
        // Let's standardly drive H from W to ensure consistent footer space + proportional content.

        // Recalculate H based on W
        const newContentHeight = resized.props.w / aspectRatio;
        const targetValues = {
            w: resized.props.w,
            h: newContentHeight + PDF_FOOTER_HEIGHT
        };

        // If we adjust H, we might need to adjust Y if resizing from TOP
        // resizeBox already adjusts XY based on the delta.
        // If our new H is different from resized.props.h, we need to adjust Y if the handle depends on Bottom? 
        // Actually, if we resize from TL, TR, T: Y is adjusted.
        // If we force H, we might need to fix Y if anchor is Bottom.

        // Let's try to just set props and see if tldraw handles the anchor relative to the box?
        // No, 'resizeBox' returns the new shape state. If we modify w/h, we are responsible for x/y.
        // But adjusting x/y is complex.

        // Simpler: Just Update properties. 
        // If user drags Bottom Right: x,y stable. we change w, h.
        // If user drags Top Left: x,y change. w, h change.
        // If we override h, we should ideally check if we need to override y.

        // Let's stick to updating H based on W. 
        // If dragging from TOP, we need to adjust Y so the BOTTOM stays fixed?
        // info.handle points: "top_left", "top", "top_right", "right", "bottom_right", "bottom", "bottom_left", "left"

        if (info.handle.includes('top')) {
            // If resizing from top, we want the bottom to stay roughly where it was relative to the resize?
            // Actually, resizeBox moves Y by delta.
            // If we change H, we need to adjust Y such that (Y + H) is preserved? 
            // Or just let it float?

            // Let's try updating just dimensions first. 
            resized.props.h = targetValues.h;

            // If resizing from top, standard resizeBox moved Y by (oldH - newH) roughly?
            // Actually if we override H, the Y computed by resizeBox corresponds to the H computed by resizeBox.
            // If our H is different, we should probably adjust Y to compensate if we want to "pivot" correctly.
            // But 'resizeBox' logic is complex.

            // Re-run resizeBox logic manually-ish? No.

            // Just returning the constrained props. 
            // Ideally we'd fix the aspect ratio in the `resizeBox` call options if possible? No.
        } else {
            resized.props.h = targetValues.h;
        }

        return resized;
    }

    // Handle double-click to open PDF viewer
    override onDoubleClick(shape: PDFShape) {
        // Import dynamically to avoid circular dependencies
        import('@/lib/pdfEvents').then(({ openPDFViewer }) => {
            openPDFViewer(shape.props.fileId, shape.props.filename, shape.props.pageNumber);
        });
        return shape;
    }
}

// Export for other files to use
export { PDF_FOOTER_HEIGHT };
