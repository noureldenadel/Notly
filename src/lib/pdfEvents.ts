// Simple event emitter for PDF viewer integration
// Used to communicate between PDFShape (inside tldraw) and PDFViewerModal (in React tree)

type PDFOpenHandler = (pdfUrl: string, fileName: string, pageNumber?: number) => void;

let openPDFHandler: PDFOpenHandler | null = null;

export function setOpenPDFHandler(handler: PDFOpenHandler | null) {
    openPDFHandler = handler;
}

export function openPDFViewer(pdfUrl: string, fileName: string, pageNumber: number = 1) {
    if (openPDFHandler) {
        openPDFHandler(pdfUrl, fileName, pageNumber);
    } else {
        console.warn('[PDFEvents] No PDF viewer handler registered');
    }
}
