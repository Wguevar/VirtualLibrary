import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFViewerProps {
  fileUrl: string;
  onlyFirstPage?: boolean;
}

export const PDFViewer = ({ fileUrl, onlyFirstPage = false }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 600, height: 400 });

  useEffect(() => {
    // Ajustar el tamaño de la página al tamaño del contenedor
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight - 40; // Dejar espacio para las flechas
        setPageSize({ width, height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full h-full overflow-hidden">
      {!onlyFirstPage && (
        <div className="flex items-center justify-center gap-4 mb-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            ←
          </button>
          <span className="text-sm">
            Página {pageNumber} de {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
      <div className="flex-1 flex items-center justify-center w-full h-full overflow-y-auto overflow-x-hidden">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div>Cargando PDF...</div>}
          error={<div>No se pudo cargar el PDF.</div>}
        >
          <Page
            pageNumber={onlyFirstPage ? 1 : pageNumber}
            height={pageSize.height}
            width={pageSize.width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}; 