/**
 * Custom TLDraw Asset Store for Tauri
 * Handles image and video uploads by converting to data URLs
 * This solves the "invalid protocol" error for blob URLs in Tauri
 */

import type { TLAssetStore, TLAsset } from 'tldraw';
import { createLogger } from './logger';

const log = createLogger('TldrawAssetStore');

/**
 * Convert a File/Blob to a data URL (base64)
 */
async function fileToDataUrl(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Fetch a blob URL and convert it to a data URL
 */
async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
    try {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return fileToDataUrl(blob);
    } catch (error) {
        log.error('Failed to convert blob URL to data URL:', error);
        throw error;
    }
}

/**
 * Custom asset store that handles Tauri's blob URL limitations
 * by converting images to data URLs (base64)
 */
export const tauriAssetStore: TLAssetStore = {
    /**
     * Upload handler - converts files to data URLs
     */
    async upload(asset: TLAsset, file: File): Promise<{ src: string }> {
        log.debug('Uploading asset:', asset.id, file.name, file.type);

        try {
            // Convert file to data URL (base64)
            const dataUrl = await fileToDataUrl(file);
            log.debug('Asset converted to data URL, length:', dataUrl.length);
            return { src: dataUrl };
        } catch (error) {
            log.error('Failed to upload asset:', error);
            throw error;
        }
    },

    /**
     * Resolve handler - returns the URL for a given asset
     * For data URLs, just return as-is
     * For blob URLs, convert to data URLs
     */
    async resolve(asset: TLAsset): Promise<string | null> {
        const src = (asset.props as { src?: string }).src;

        if (!src) {
            return null;
        }

        // Data URLs are valid, return as-is
        if (src.startsWith('data:')) {
            return src;
        }

        // HTTP/HTTPS URLs are valid, return as-is
        if (src.startsWith('http://') || src.startsWith('https://')) {
            return src;
        }

        // Tauri asset protocol URLs are valid
        if (src.startsWith('asset://') || src.startsWith('tauri://')) {
            return src;
        }

        // Blob URLs need to be converted to data URLs
        if (src.startsWith('blob:')) {
            log.debug('Converting blob URL to data URL for resolve');
            try {
                return await blobUrlToDataUrl(src);
            } catch (error) {
                log.error('Failed to resolve blob URL:', error);
                return null;
            }
        }

        // Unknown protocol, return as-is and let tldraw handle it
        return src;
    },
};

export default tauriAssetStore;
