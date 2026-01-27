import { useEffect, useRef } from "react";
import { useProjectStore, useCardStore, useFileStore, useUIStore } from "@/stores";
import { initPersistence } from "@/lib/persistence";
import { setOpenPDFHandler } from "@/lib/pdfEvents";
import { setOpenCardEditorHandler } from "@/lib/cardEvents";
import { createLogger } from "@/lib/logger";

const log = createLogger('AppInitializer');

export const AppInitializer = () => {
    // Selectors
    const loadProjects = useProjectStore(s => s.loadProjects);
    const projectsLoaded = useProjectStore(s => s.isLoaded);

    const loadCards = useCardStore(s => s.loadCards);
    const cardsLoaded = useCardStore(s => s.isLoaded);

    const loadFiles = useFileStore(s => s.loadFiles);
    const filesLoaded = useFileStore(s => s.isLoaded);

    const openModal = useUIStore(s => s.openModal);

    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;

        async function initApp() {
            log.debug('Initializing app...');
            await initPersistence();

            // Load all stores in parallel
            await Promise.all([
                !projectsLoaded && loadProjects(),
                !cardsLoaded && loadCards(),
                !filesLoaded && loadFiles(),
            ]);

            // Validate that active project actually exists after loading
            const state = useProjectStore.getState();
            if (state.activeProjectId) {
                const projectExists = state.projects.some(p => p.id === state.activeProjectId);
                if (!projectExists) {
                    log.warn('Active project ID not found in loaded projects, resetting');
                    state.setActiveProject(null);
                }
            }

            log.debug('All data loaded');
            initialized.current = true;
        }
        initApp();
    }, [loadProjects, loadCards, loadFiles, projectsLoaded, cardsLoaded, filesLoaded]);

    // Register Event Handlers
    useEffect(() => {
        setOpenPDFHandler((pdfUrl, fileName) => {
            log.debug('Opening PDF viewer:', fileName);
            openModal('pdf-viewer', { url: pdfUrl, fileName });
        });

        return () => setOpenPDFHandler(null);
    }, [openModal]);

    useEffect(() => {
        setOpenCardEditorHandler((cardId, shapeId) => {
            log.debug('Opening card editor:', cardId);
            openModal('card-editor', {
                cardId,
                shapeId,
                // We can pass a callback here if needed, but functions in state are tricky with persistence.
                // However, uiStore persistence blacklist might allow it, or we just pass the ID and handle logic elsewhere?
                // Ideally, the CardEditorModal should handle the logic itself or we use a custom event.
                // For now, let's assume we can refetch the shape editor from context or simple pass logic.
                // Wait, functions in Zustand state (especially if persisted) are bad practice.
                // But uiStore creates a ephemeral modal state.
            });
        });

        return () => setOpenCardEditorHandler(null);
    }, [openModal]);

    return null;
};
