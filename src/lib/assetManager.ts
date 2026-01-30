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
 * In Tauri, this converts the file path to a tauri:// protocol URL
 * @param relativePath - Relative path within assets folder (e.g., "pdfs/123_doc.pdf")
 */
export async function getAssetUrl(relativePath: string): Promise<string> {
    if (!isTauri()) {
        // In web mode, return as-is (it's likely already a URL)
        return relativePath;
    }

    try {
        const fullPath = await getAssetPath(relativePath);
        // Convert to tauri asset protocol URL
        return convertFileSrc(fullPath);
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
        // In web mode, create object URL and return it
        const url = URL.createObjectURL(file);
        log.debug('Web mode: created object URL for file');
        return { relativePath: url, url };
    }

    // In Tauri, we need the file path
    // The file.path property is available when the file comes from Tauri's file dialog
    // @ts-ignore - path is added by Tauri
    const sourcePath = file.path as string | undefined;

    if (!sourcePath) {
        // Fallback: create a temp file from the blob
        log.warn('File has no path, creating from blob is not yet supported');
        const url = URL.createObjectURL(file);
        return { relativePath: url, url };
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
    importFile,
};
