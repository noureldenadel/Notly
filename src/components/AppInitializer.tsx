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

            try {
                await initPersistence();
            } catch (e) {
                log.error('Error initializing persistence:', e);
            }

            try {
                await Promise.all([
                    !projectsLoaded && loadProjects(),
                    !cardsLoaded && loadCards(),
                    !filesLoaded && loadFiles(),
                ]);
            } catch (e) {
                log.error('Error loading stores:', e);
            }

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
            openModal('card-editor', { cardId, shapeId });
        });

        return () => setOpenCardEditorHandler(null);
    }, [openModal]);

    return null;
};
