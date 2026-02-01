import { lazy, Suspense } from "react";
import { useUIStore, useCardStore } from "@/stores";
import { useEditor } from '@/hooks/useEditor';
import { GlobalSearch } from "@/components/search";
import type { TLShapeId } from "tldraw";

// Lazy load heavy modal components for code splitting
const SettingsModal = lazy(() =>
    import("@/components/settings/SettingsModal").then(m => ({ default: m.SettingsModal }))
);
const ImportExportModal = lazy(() =>
    import("@/components/modals/ImportExportModal").then(m => ({ default: m.default }))
);
const PDFViewerModal = lazy(() =>
    import("@/components/pdf/PDFViewerModal").then(m => ({ default: m.PDFViewerModal }))
);
const CardEditorModal = lazy(() =>
    import("@/components/editor/CardEditorModal").then(m => ({ default: m.CardEditorModal }))
);

// Simple loading fallback for modals
const ModalLoading = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
        </div>
    </div>
);

export const ModalManager = () => {
    const { modal, closeModal } = useUIStore();
    const { getCard } = useCardStore();
    const { editor } = useEditor();

    const handleClose = () => closeModal();

    const handleCardSave = (cardId: string) => {
        const shapeId = modal.data?.shapeId;
        if (!editor || typeof shapeId !== 'string') return;

        const card = getCard(cardId);
        if (card) {
            editor.updateShape({
                id: shapeId as TLShapeId,
                type: 'card',
                props: {
                    title: card.title,
                    content: card.content,
                    color: card.color,
                },
            });
        }
    };

    return (
        <>
            {/* Settings Modal - lazy loaded */}
            {modal.isOpen && (modal.type === 'settings' || modal.type === 'shortcuts') && (
                <Suspense fallback={<ModalLoading />}>
                    <SettingsModal
                        open={true}
                        onOpenChange={(open) => !open && handleClose()}
                        initialTab={modal.type === 'shortcuts' ? 'shortcuts' : 'appearance'}
                    />
                </Suspense>
            )}

            {/* Import/Export Modal - lazy loaded */}
            {modal.isOpen && modal.type === 'import-export' && (
                <Suspense fallback={<ModalLoading />}>
                    <ImportExportModal
                        open={true}
                        onOpenChange={(open) => !open && handleClose()}
                    />
                </Suspense>
            )}

            {/* Global Search - kept synchronous as it's lightweight */}
            <GlobalSearch
                isOpen={modal.isOpen && modal.type === 'search'}
                onClose={handleClose}
                onResultClick={(result) => {
                    handleClose();
                }}
            />

            {/* PDF Viewer Modal - lazy loaded (heavy component) */}
            {modal.isOpen && modal.type === 'pdf-viewer' && (
                <Suspense fallback={<ModalLoading />}>
                    <PDFViewerModal
                        isOpen={true}
                        onClose={handleClose}
                        pdfUrl={modal.data?.url as string}
                        fileName={modal.data?.fileName as string}
                    />
                </Suspense>
            )}

            {/* Card Editor Modal - lazy loaded */}
            {modal.isOpen && modal.type === 'card-editor' && (
                <Suspense fallback={<ModalLoading />}>
                    <CardEditorModal
                        isOpen={true}
                        cardId={modal.data?.cardId as string}
                        onClose={handleClose}
                        onSave={handleCardSave}
                    />
                </Suspense>
            )}
        </>
    );
};
