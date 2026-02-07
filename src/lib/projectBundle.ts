/**
 * Project Bundle - Export/Import for .notly files
 * Handles creating and extracting project bundles (ZIP files)
 */

import JSZip from 'jszip';
import { nanoid } from 'nanoid';
import { invoke } from '@tauri-apps/api/core';
import { createLogger } from '@/lib/logger';
import { isTauri, getAssetsDir, saveBytesToAssets, getAssetUrl } from '@/lib/assetManager';
import type { Project, Board, Card } from '@/lib/persistence/types';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

const log = createLogger('ProjectBundle');

// Bundle manifest structure
interface BundleManifest {
    version: '1.0';
    exportedAt: number;
    appVersion: string;
    projectName: string;
    projectId: string;
    boardCount: number;
    assetCount: number;
}

// Project data in bundle
interface BundleProject {
    id: string;
    title: string;
    description?: string;
    color?: string;
    createdAt: number;
    updatedAt: number;
}

// Board data in bundle
interface BundleBoard {
    id: string;
    title: string;
    position: number;
    parentBoardId?: string;
    tldrawSnapshot?: string;
    createdAt: number;
    updatedAt: number;
}

// Asset reference in snapshot
interface AssetReference {
    relativePath: string;
    originalPath: string;
}

// Card data in bundle
interface BundleCard {
    id: string;
    title?: string;
    content: string;
    contentType: string;
    color?: string;
    isHidden: boolean;
    wordCount: number;
    createdAt: number;
    updatedAt: number;
}

/**
 * Export a project as a .notly bundle
 */
export async function exportProjectBundle(projectId: string): Promise<void> {
    log.info('Exporting project:', projectId);

    const { getPersistence } = await import('@/lib/persistence');
    const persistence = await getPersistence();

    // Get project data
    const projects = await persistence.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    // Get boards for this project
    const allBoards = await persistence.getBoards(projectId);
    const boards = allBoards.filter(b => b.projectId === projectId);

    // Create ZIP
    const zip = new JSZip();

    // Collect assets from board snapshots
    const assets: AssetReference[] = [];
    const boardsData: BundleBoard[] = [];

    for (const board of boards) {
        // Load tldraw snapshot
        const snapshot = await persistence.loadCanvasSnapshot(board.id);

        let processedSnapshot = snapshot;

        // Extract and collect asset references from snapshot
        if (snapshot) {
            const { processed, assetRefs } = await extractAssetsFromSnapshot(snapshot, zip);
            processedSnapshot = processed;
            assets.push(...assetRefs);
        }

        boardsData.push({
            id: board.id,
            title: board.title,
            position: board.position,
            parentBoardId: board.parentBoardId,
            tldrawSnapshot: processedSnapshot || undefined,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
        });
    }

    // Collect cardIds from all board snapshots
    const cardIds = new Set<string>();
    for (const board of boardsData) {
        if (board.tldrawSnapshot) {
            const ids = extractCardIdsFromSnapshot(board.tldrawSnapshot);
            ids.forEach(id => cardIds.add(id));
        }
    }

    // Get cards from persistence
    const allCards = await persistence.getCards();
    const cardsData: BundleCard[] = allCards
        .filter(c => cardIds.has(c.id))
        .map(c => ({
            id: c.id,
            title: c.title,
            content: c.content,
            contentType: c.contentType,
            color: c.color,
            isHidden: c.isHidden,
            wordCount: c.wordCount,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));

    // Create manifest
    const manifest: BundleManifest = {
        version: '1.0',
        exportedAt: Date.now(),
        appVersion: '1.1.0-beta',
        projectName: project.title,
        projectId: project.id,
        boardCount: boardsData.length,
        assetCount: assets.length,
    };

    // Add manifest
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Add project data
    const projectData: BundleProject = {
        id: project.id,
        title: project.title,
        description: project.description,
        color: project.color,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };
    zip.file('project.json', JSON.stringify(projectData, null, 2));

    // Add boards
    const boardsFolder = zip.folder('boards');
    for (const board of boardsData) {
        boardsFolder?.file(`${board.id}.json`, JSON.stringify(board, null, 2));
    }

    // Add cards
    if (cardsData.length > 0) {
        zip.file('cards.json', JSON.stringify(cardsData, null, 2));
        log.info('Exported', cardsData.length, 'cards');
    }

    // Generate blob
    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `${sanitizeFilename(project.title)}.notly`;

    if (isTauri()) {
        try {
            // Open native save dialog
            const filePath = await save({
                defaultPath: filename,
                filters: [{
                    name: 'Notly Project',
                    extensions: ['notly']
                }]
            });

            if (filePath) {
                // Convert blob to Uint8Array/ArrayBuffer for writing
                const buffer = await blob.arrayBuffer();
                const bytes = new Uint8Array(buffer);

                // Write file to selected path
                await writeFile(filePath, bytes);
                log.info('Project saved to:', filePath);
                // Return explicitly to avoid falling through to downloadBlob
                return;
            } else {
                log.info('Export cancelled by user');
                return;
            }
        } catch (e) {
            log.error('Failed to save file via native dialog:', e);
            // Fallback to default download if dialog fails
        }
    }

    // Fallback / Web mode: Download via browser API
    downloadBlob(blob, filename);

    log.info('Export complete:', project.title);
}

/**
 * Extract assets from a tldraw snapshot and add them to the ZIP
 */
async function extractAssetsFromSnapshot(
    snapshot: string,
    zip: JSZip
): Promise<{ processed: string; assetRefs: AssetReference[] }> {
    const assetRefs: AssetReference[] = [];

    try {
        const data = JSON.parse(snapshot);

        // Look for assets in the tldraw store
        if (data.store) {
            for (const [key, value] of Object.entries(data.store)) {
                if (key.startsWith('asset:') && value && typeof value === 'object') {
                    const asset = value as any;
                    if (asset.props?.src) {
                        const src = asset.props.src;

                        // Handle data URLs (base64 encoded assets)
                        if (src.startsWith('data:')) {
                            try {
                                // Extract base64 data from data URL
                                const base64Match = src.match(/^data:([^;]+);base64,(.+)$/);
                                if (base64Match) {
                                    const mimeType = base64Match[1];
                                    const base64Data = base64Match[2];

                                    // Convert base64 to binary
                                    const binaryString = atob(base64Data);
                                    const bytes = new Uint8Array(binaryString.length);
                                    for (let i = 0; i < binaryString.length; i++) {
                                        bytes[i] = binaryString.charCodeAt(i);
                                    }

                                    // Determine file extension from MIME type
                                    const ext = mimeType.split('/')[1] || 'bin';
                                    const filename = `asset-${nanoid(10)}.${ext}`;
                                    const zipPath = `assets/${filename}`;

                                    zip.file(zipPath, bytes);

                                    // Update the snapshot to use bundle reference
                                    asset.props.src = `bundle://${zipPath}`;
                                    assetRefs.push({
                                        relativePath: zipPath,
                                        originalPath: src.substring(0, 50) + '...', // Truncate for logging
                                    });
                                }
                            } catch (e) {
                                log.warn('Failed to extract data URL asset:', e);
                            }
                        }
                        // Handle local asset paths (tauri:// or https://asset.localhost)
                        else if (src.includes('asset.localhost') || src.startsWith('tauri://')) {
                            const fileData = await readAssetByUrl(src);
                            if (fileData) {
                                const filename = extractFilenameFromUrl(src) || `asset-${nanoid(6)}`;
                                const zipPath = `assets/${filename}`;
                                zip.file(zipPath, fileData);

                                // Update the snapshot to use bundle reference
                                asset.props.src = `bundle://${zipPath}`;
                                assetRefs.push({
                                    relativePath: zipPath,
                                    originalPath: src,
                                });
                            }
                        }
                    }
                }
            }
        }

        return { processed: JSON.stringify(data), assetRefs };
    } catch (e) {
        log.error('Error processing snapshot:', e);
        return { processed: snapshot, assetRefs: [] };
    }
}

/**
 * Extract all cardIds from card shapes in a tldraw snapshot
 */
function extractCardIdsFromSnapshot(snapshot: string): string[] {
    const cardIds: string[] = [];
    try {
        const data = JSON.parse(snapshot);
        if (data.store) {
            for (const [key, value] of Object.entries(data.store)) {
                // Card shapes have keys like "shape:xxx" with type "card"
                if (key.startsWith('shape:') && value && typeof value === 'object') {
                    const shape = value as any;
                    if (shape.type === 'card' && shape.props?.cardId) {
                        cardIds.push(shape.props.cardId);
                    }
                }
            }
        }
    } catch (e) {
        log.warn('Error extracting cardIds from snapshot:', e);
    }
    return cardIds;
}

/**
 * Extract filename from a tauri asset URL
 */
function extractFilenameFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathname = decodeURIComponent(urlObj.pathname);
        const parts = pathname.split(/[/\\]/);
        return parts[parts.length - 1] || null;
    } catch {
        return null;
    }
}

/**
 * Read asset file content by its URL (Tauri only)
 */
async function readAssetByUrl(url: string): Promise<Uint8Array | null> {
    if (!isTauri()) return null;

    try {
        // Fetch the asset using the tauri asset URL
        const response = await fetch(url);
        if (!response.ok) {
            log.warn('Could not fetch asset:', url);
            return null;
        }
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    } catch (e) {
        log.warn('Could not read asset:', url, e);
        return null;
    }
}

/**
 * Import a .notly bundle and create a new project
 */
export async function importProjectBundle(file: File): Promise<string> {
    log.info('Importing bundle:', file.name);

    const zip = await JSZip.loadAsync(file);

    // Read manifest
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
        throw new Error('Invalid bundle: missing manifest.json');
    }
    const manifest: BundleManifest = JSON.parse(await manifestFile.async('string'));

    // Validate version
    if (manifest.version !== '1.0') {
        throw new Error(`Unsupported bundle version: ${manifest.version}`);
    }

    // Read project data
    const projectFile = zip.file('project.json');
    if (!projectFile) {
        throw new Error('Invalid bundle: missing project.json');
    }
    const projectData: BundleProject = JSON.parse(await projectFile.async('string'));

    // Generate new IDs for the imported project
    const newProjectId = nanoid();
    const boardIdMap = new Map<string, string>(); // old ID -> new ID

    // Get persistence
    const { getPersistence } = await import('@/lib/persistence');
    const persistence = await getPersistence();

    // Extract assets first
    const assetPathMap = new Map<string, string>(); // bundle path -> new asset URL
    const assetFiles = Object.keys(zip.files).filter(p => p.startsWith('assets/') && !p.endsWith('/'));

    for (const assetPath of assetFiles) {
        const assetFile = zip.file(assetPath);
        if (assetFile) {
            const data = await assetFile.async('uint8array');
            const filename = assetPath.split('/').pop() || `imported-${nanoid(6)}`;

            // Save to app assets folder
            const newUrl = await saveImportedAsset(data, filename);
            if (newUrl) {
                assetPathMap.set(`bundle://${assetPath}`, newUrl);
            }
        }
    }

    // Read and process boards
    const boardFiles = Object.keys(zip.files).filter(p => p.startsWith('boards/') && p.endsWith('.json'));
    const boards: BundleBoard[] = [];

    for (const boardPath of boardFiles) {
        const boardFile = zip.file(boardPath);
        if (boardFile) {
            const boardData: BundleBoard = JSON.parse(await boardFile.async('string'));

            // Generate new board ID
            const newBoardId = nanoid();
            boardIdMap.set(boardData.id, newBoardId);

            boards.push({
                ...boardData,
                id: newBoardId,
            });
        }
    }

    // Update parent board references
    for (const board of boards) {
        if (board.parentBoardId && boardIdMap.has(board.parentBoardId)) {
            board.parentBoardId = boardIdMap.get(board.parentBoardId);
        }
    }

    // Create project
    const now = Date.now();
    const newProject: Project = {
        id: newProjectId,
        title: projectData.title,
        description: projectData.description,
        color: projectData.color,
        createdAt: now,
        updatedAt: now,
    };
    await persistence.saveProject(newProject);

    // Create boards and restore snapshots
    for (const board of boards) {
        // Update asset references in snapshot
        let snapshot = board.tldrawSnapshot;
        if (snapshot) {
            for (const [bundlePath, localUrl] of assetPathMap) {
                snapshot = snapshot.split(bundlePath).join(localUrl);
            }
        }

        const newBoard: Board = {
            id: board.id,
            projectId: newProjectId,
            parentBoardId: board.parentBoardId,
            title: board.title,
            position: board.position,
            createdAt: now,
            updatedAt: now,
        };
        await persistence.saveBoard(newBoard);

        // Save snapshot if exists
        if (snapshot) {
            await persistence.saveCanvasSnapshot(board.id, snapshot);
        }
    }

    // Import cards if they exist in bundle
    const cardsFile = zip.file('cards.json');
    const cardIdMap = new Map<string, string>(); // old ID -> new ID

    if (cardsFile) {
        const cardsData: BundleCard[] = JSON.parse(await cardsFile.async('string'));

        for (const card of cardsData) {
            const newCardId = nanoid();
            cardIdMap.set(card.id, newCardId);

            // Save card with new ID
            const newCard: Card = {
                id: newCardId,
                title: card.title,
                content: card.content,
                contentType: card.contentType,
                color: card.color,
                isHidden: card.isHidden,
                wordCount: card.wordCount,
                createdAt: now,
                updatedAt: now,
            };
            await persistence.saveCard(newCard);
        }

        log.info('Imported', cardsData.length, 'cards');

        // Update cardId references in board snapshots
        if (cardIdMap.size > 0) {
            for (const board of boards) {
                const existingSnapshot = await persistence.loadCanvasSnapshot(board.id);
                if (existingSnapshot) {
                    let updatedSnapshot = existingSnapshot;
                    for (const [oldId, newId] of cardIdMap) {
                        // Replace cardId in shape props
                        updatedSnapshot = updatedSnapshot.split(`"cardId":"${oldId}"`).join(`"cardId":"${newId}"`);
                    }
                    if (updatedSnapshot !== existingSnapshot) {
                        await persistence.saveCanvasSnapshot(board.id, updatedSnapshot);
                    }
                }
            }
        }
    }

    log.info('Import complete:', newProject.title, 'with', boards.length, 'boards');

    return newProjectId;
}

/**
 * Save an imported asset to the app's assets folder
 */
async function saveImportedAsset(data: Uint8Array, filename: string): Promise<string | null> {
    try {
        if (!isTauri()) {
            // In web mode, create a data URL
            const blob = new Blob([data as unknown as BlobPart]);
            return URL.createObjectURL(blob);
        }

        // Determine file type from extension
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
        const fileType = isImage ? 'image' : 'pdf';

        // Create a File object from the data
        const file = new File([data as unknown as BlobPart], filename, {
            type: isImage ? `image/${ext}` : 'application/pdf'
        });

        // Use the existing saveBytesToAssets function
        const { url } = await saveBytesToAssets(file, fileType);
        return url;
    } catch (e) {
        log.error('Error saving imported asset:', e);
        return null;
    }
}

/**
 * Helper to download a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Sanitize a filename
 */
function sanitizeFilename(name: string): string {
    return name
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
}
