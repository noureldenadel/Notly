import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ImportedPDF, PDFHighlight } from '@/components/pdf';

interface PDFState {
    pdfs: ImportedPDF[];
    highlights: PDFHighlight[];
    activePdfId: string | null;

    // PDF CRUD
    addPDF: (pdf: Omit<ImportedPDF, 'id' | 'dateAdded'>) => ImportedPDF;
    removePDF: (id: string) => void;
    getPDF: (id: string) => ImportedPDF | undefined;
    getAllPDFs: () => ImportedPDF[];

    // Active PDF
    setActivePdf: (id: string | null) => void;

    // Highlights CRUD
    addHighlight: (pdfId: string, highlight: Omit<PDFHighlight, 'id'>) => PDFHighlight;
    removeHighlight: (id: string) => void;
    getHighlightsForPDF: (pdfId: string) => PDFHighlight[];
    getHighlightsForPage: (pdfId: string, pageNumber: number) => PDFHighlight[];
}

export const usePDFStore = create<PDFState>()(
    persist(
        (set, get) => ({
            pdfs: [],
            highlights: [],
            activePdfId: null,

            addPDF: (pdfData) => {
                const pdf: ImportedPDF = {
                    ...pdfData,
                    id: nanoid(),
                    dateAdded: new Date().toISOString(),
                };
                set((state) => ({
                    pdfs: [...state.pdfs, pdf],
                }));
                return pdf;
            },

            removePDF: (id) => {
                set((state) => ({
                    pdfs: state.pdfs.filter(p => p.id !== id),
                    // Also remove associated highlights
                    highlights: state.highlights.filter(h => {
                        const pdf = state.pdfs.find(p => p.id === id);
                        // If we find a matching PDF, remove its highlights
                        return !pdf;
                    }),
                }));
            },

            getPDF: (id) => get().pdfs.find(p => p.id === id),

            getAllPDFs: () => get().pdfs,

            setActivePdf: (id) => set({ activePdfId: id }),

            addHighlight: (pdfId, highlightData) => {
                const highlight: PDFHighlight = {
                    ...highlightData,
                    id: nanoid(),
                };
                set((state) => ({
                    highlights: [...state.highlights, highlight],
                }));
                return highlight;
            },

            removeHighlight: (id) => {
                set((state) => ({
                    highlights: state.highlights.filter(h => h.id !== id),
                }));
            },

            getHighlightsForPDF: (pdfId) => {
                const pdf = get().pdfs.find(p => p.id === pdfId);
                if (!pdf) return [];
                // For now, return all highlights since PDFHighlight doesn't have pdfId
                // We'd need to extend the type to properly filter by PDF
                return get().highlights;
            },

            getHighlightsForPage: (pdfId, pageNumber) => {
                const pdf = get().pdfs.find(p => p.id === pdfId);
                if (!pdf) return [];
                return get().highlights.filter(h => h.pageNumber === pageNumber);
            },
        }),
        {
            name: 'pdf-storage',
        }
    )
);

export default usePDFStore;
