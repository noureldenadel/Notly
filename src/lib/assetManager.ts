/**
 * Asset Manager
 * Handles copying files to app folder and managing asset paths
 * Works in both Tauri (desktop) and web modes
 */

import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { createLogger } from '@/lib/logger';

const log = createLogger('AssetManager');

/**
 * Check if running in Tauri desktop environment
 */
export const isTauri = (): boolean => {
    return typeof window !== 'undefined' && '__TAURI__' in window;
};

/**
 * Copy a file to the app's assets folder (Tauri only)
 * @param sourcePath - Full path to the source file
 * @param fileType - Type of file: 'pdf' | 'image'
 * @returns The relative path within the assets folder
 */
export async function copyFileToAssets(
    sourcePath: string,
    fileType: 'pdf' | 'image'
): Promise<string> {
    if (!isTauri()) {
        log.warn('copyFileToAssets only works in Tauri mode');
        // In web mode, just return the original path (it's likely a blob URL or data URL)
        return sourcePath;
    }

    try {
        const relativePath = await invoke<string>('copy_file_to_assets', {
            sourcePath,
            fileType,
        });
        log.debug('File copied to assets:', relativePath);
        return relativePath;
    } catch (error) {
        log.error('Failed to copy file to assets:', error);
        throw error;
    }
}

/**
 * Delete a file from the assets folder (Tauri only)
 * @param relativePath - Relative path within assets folder (e.g., "pdfs/123_doc.pdf")
 */
export async function deleteAssetFile(relativePath: string): Promise<boolean> {
    if (!isTauri()) {
        log.warn('deleteAssetFile only works in Tauri mode');
        return false;
    }

    try {
        const result = await invoke<boolean>('delete_asset_file', {
            relativePath,
        });
        log.debug('Asset deleted:', relativePath, result);
        return result;
    } catch (error) {
        log.error('Failed to delete asset:', error);
        return false;
    }
}

/**
 * Get the full filesystem path for an asset (Tauri only)
 * @param relativePath - Relative path within assets folder
 * @returns Full filesystem path
 */
export async function getAssetPath(relativePath: string): Promise<string> {
    if (!isTauri()) {
        // In web mode, return as-is
        return relativePath;
    }

    try {
        return await invoke<string>('get_asset_path', { relativePath });
    } catch (error) {
        log.error('Failed to get asset path:', error);
        throw error;
    }
}

/**
 * Get a URL that can be used to load an asset in the browser/webview
 * In Tauri, this converts the file to a data URL (base64)
 * @param relativePath - Relative path within assets folder (e.g., "pdfs/123_doc.pdf")
 */
export async function getAssetUrl(relativePath: string): Promise<string> {
    if (!isTauri()) {
        // In web mode, return as-is (it's likely already a URL)
        return relativePath;
    }

    try {
        // In Tauri, we need to read the file and create a data URL
        // TLDraw doesn't accept blob: URLs, so we use data URLs instead
        const fullPath = await getAssetPath(relativePath);
        log.debug('Getting asset URL for:', fullPath);

        // Read file
        const { readFile } = await import('@tauri-apps/plugin-fs');
        const fileBytes = await readFile(fullPath);

        // Detect MIME type from extension
        const ext = relativePath.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp',
            'pdf': 'application/pdf'
        };
        const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

        // Convert to base64 data URL
        const blob = new Blob([fileBytes], { type: mimeType });
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        log.debug('Created data URL for', relativePath);
        return dataUrl;
    } catch (error) {
        log.error('Failed to get asset URL:', error);
        throw error;
    }
}

/**
 * Get the assets directory path (Tauri only)
 */
export async function getAssetsDir(): Promise<string> {
    if (!isTauri()) {
        return '';
    }

    try {
        return await invoke<string>('get_assets_dir');
    } catch (error) {
        log.error('Failed to get assets dir:', error);
        throw error;
    }
}

/**
 * Helper to create a Data URL for web mode assets
 * We use Data URLs instead of Blob URLs because Tldraw validation
 * can be strict about protocols.
 */
const createWebAssetUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Save file bytes directly to the assets folder (Tauri only)
 * This is used when we have raw file data (e.g., from clipboard paste) without a file path
 * @param file - File object from clipboard/drag-drop
 * @param fileType - 'pdf' | 'image'
 * @returns Object with relative path and URL
 */
export async function saveBytesToAssets(
    file: File,
    fileType: 'pdf' | 'image'
): Promise<{ relativePath: string; url: string }> {
    if (!isTauri()) {
        // In web mode, create Data URL and return it
        const url = await createWebAssetUrl(file);
        log.debug('Web mode: created Data URL for file');
        return { relativePath: url, url };
    }

    try {
        // Efficiently convert to base64 using FileReader
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer]);
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // reader.result is "data:application/octet-stream;base64,BASE64_STRING"
                // We need to strip the prefix
                const dataUrl = reader.result as string;
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // Log size for debugging
        log.debug('Saving bytes to assets:', file.name, 'size:', arrayBuffer.byteLength);

        // Call Rust command to save the data
        const relativePath = await invoke<string>('save_bytes_to_assets', {
            data: base64Data,
            filename: file.name || 'pasted_file',
            fileType,
        });

        // Get URL for the saved file
        const url = await getAssetUrl(relativePath);
        log.debug('Saved bytes to assets:', relativePath, 'url:', url);

        return { relativePath, url };
    } catch (error) {
        log.error('Failed to save bytes to assets:', error);
        throw error;
    }
}

/**
 * Import a file (PDF or image) by copying it to the app's assets folder
 * This is the main entry point for importing files
 * @param file - File object from input or drag/drop
 * @param fileType - 'pdf' | 'image'
 * @returns Object with the new asset path and URL
 */
export async function importFile(
    file: File,
    fileType: 'pdf' | 'image'
): Promise<{ relativePath: string; url: string }> {
    if (!isTauri()) {
        // In web mode, create Data URL and return it
        const url = await createWebAssetUrl(file);
        log.debug('Web mode: created Data URL for file');
        return { relativePath: url, url };
    }

    // In Tauri, we need the file path
    // The file.path property is available when the file comes from Tauri's file dialog
    // @ts-ignore - path is added by Tauri
    const sourcePath = file.path as string | undefined;

    if (!sourcePath) {
        // Fallback: create a temp file from the blob (or just use saveBytesToAssets)
        log.warn('File has no path, falling back to saveBytesToAssets');
        return saveBytesToAssets(file, fileType);
    }

    try {
        const relativePath = await copyFileToAssets(sourcePath, fileType);
        const url = await getAssetUrl(relativePath);
        return { relativePath, url };
    } catch (error) {
        log.error('Failed to import file:', error);
        throw error;
    }
}

export default {
    isTauri,
    copyFileToAssets,
    deleteAssetFile,
    getAssetPath,
    getAssetUrl,
    getAssetsDir,
    saveBytesToAssets,
    importFile,
};
