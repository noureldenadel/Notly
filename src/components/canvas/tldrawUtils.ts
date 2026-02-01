
import { Editor, createShapeId, TLStoreSnapshot, TLRecord, TLAsset, TLShape, TLImageAsset } from 'tldraw';
import { PDFShape } from './shapes/PDFShape';
import { nanoid } from 'nanoid';
import { SHAPE_DEFAULTS } from '@/lib/constants';

// Helper to patch assets in a snapshot with resolved URLs
// This is used to ensure that asset paths (relativePath) are converted to 
// valid URLs (tauri://...) before loading into the editor
export async function patchAssetsInSnapshot(snapshot: TLStoreSnapshot) {
    if (!snapshot || !snapshot.store) return;

    try {
        // Dynamically import to avoid build issues in non-browser envs if needed
        const { getAssetUrl } = await import('@/lib/assetManager');
        const records = snapshot.store;

        const promises = Object.values(records).map(async (r) => {
            const record = r as TLRecord;
            // Check for image assets with relativePath meta
            if (record.typeName === 'asset' && record.type === 'image' && record.meta?.relativePath) {
                try {
                    const url = await getAssetUrl(record.meta.relativePath as string);
                    if (url) {
                        (record as TLImageAsset).props.src = url;
                    }
                } catch (e) {
                    console.error('Failed to resolve asset path:', e);
                }
            }
            // Check for PDF shapes with fileId (relativePath)
            if (record.typeName === 'shape' && record.type === 'pdf' && (record as unknown as PDFShape).props?.fileId) {
                // We don't need to patch the URL here because PDFViewerModal resolves it 
                // using the fileId (actually relativePath) directly.
                // But if we wanted to pre-resolve it, we could.
            }
        });

        await Promise.all(promises);
    } catch (e) {
        console.error('Failed to patch assets in snapshot:', e);
    }
}

// Helper function to create a card shape programmatically
// Helper function to create a card shape programmatically
export function createCardOnCanvas(
    editor: Editor,
    props: {
        x: number;
        y: number;
        cardId?: string;
        title?: string;
        content?: string;
        color?: string;
        width?: number;
        height?: number;
    }
) {
    if (!editor) return;

    const id = createShapeId();

    editor.createShape({
        id,
        type: 'card',
        x: props.x,
        y: props.y,
        props: {
            w: props.width ?? SHAPE_DEFAULTS.CARD.WIDTH,
            h: props.height ?? SHAPE_DEFAULTS.CARD.HEIGHT,
            title: props.title || '',
            content: props.content || '',
            color: props.color || 'white',
        },
    });

    return id;
}
