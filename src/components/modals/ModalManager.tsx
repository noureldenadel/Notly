import { useUIStore, useCardStore } from "@/stores";
import { useEditor } from "@/hooks/useEditorContext";
import { SettingsModal } from "@/components/settings";
import { ImportExportModal } from "@/components/modals";
import { PDFViewerModal } from "@/components/pdf";
import { GlobalSearch } from "@/components/search";
import { CardEditorModal } from "@/components/editor";

export const ModalManager = () => {
    const { modal, closeModal } = useUIStore();
    const { editor } = useEditor();

    const handleClose = () => closeModal();

    return (
        <>
            <SettingsModal
                open={modal.isOpen && (modal.type === 'settings' || modal.type === 'shortcuts')}
                onOpenChange={(open) => !open && handleClose()}
                initialTab={modal.type === 'shortcuts' ? 'shortcuts' : 'appearance'}
            />

            <ImportExportModal
                open={modal.isOpen && modal.type === 'import-export'}
                onOpenChange={(open) => !open && handleClose()}
            />

            {/* ShortcutsCheatsheet removed as it is now part of Settings */}

            <GlobalSearch
                isOpen={modal.isOpen && modal.type === 'search'}
                onClose={handleClose}
                onResultClick={(result) => {
                    // Handle navigation if needed
                    handleClose();
                }}
            />

            <PDFViewerModal
                isOpen={modal.isOpen && modal.type === 'pdf-viewer'}
                onClose={handleClose}
                pdfUrl={modal.data?.url as string}
                fileName={modal.data?.fileName as string}
            />

            <CardEditorModal
                isOpen={modal.isOpen && modal.type === 'card-editor'}
                cardId={modal.data?.cardId as string}
                onClose={handleClose}
                onSave={(cardId) => {
                    const shapeId = modal.data?.shapeId as string;
                    if (editor && shapeId) {
                        const card = useCardStore.getState().getCard(cardId);
                        if (card) {
                            editor.updateShape({
                                id: shapeId as any,
                                type: 'card',
                                props: {
                                    title: card.title,
                                    content: card.content,
                                    color: card.color,
                                },
                            });
                        }
                    }
                }}
            />
        </>
    );
};
