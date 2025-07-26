import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

// Configurar el worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// Verificar que el worker esté configurado
console.log('[PDFViewer] Worker configurado:', pdfjs.GlobalWorkerOptions.workerSrc);

interface PDFViewerProps {
  fileUrl: string;
  onlyFirstPage?: boolean;
}

export const PDFViewer = ({ fileUrl, onlyFirstPage = false }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 400, height: 300 });

  // Resetear estado cuando cambia la URL
  useEffect(() => {
    setLoading(true);
    setError(null);
    setNumPages(1);
    setPageNumber(1);
  }, [fileUrl]);

  // Timeout para evitar carga infinita
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setError('El PDF tardó demasiado en cargar. Intenta descargarlo directamente.');
        setLoading(false);
      }
    }, 15000); // 15 segundos

    return () => clearTimeout(timeout);
  }, [loading]);



  useEffect(() => {
    // Ajustar el tamaño de la página al tamaño del contenedor
    const handleResize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth - 20, 600); // Máximo 600px de ancho
        const height = Math.min(containerRef.current.offsetHeight - 60, 400); // Máximo 400px de alto
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
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(`No se pudo cargar el PDF: ${error.message}`);
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full h-full overflow-hidden">
      {/* Controles de navegación */}
      {!onlyFirstPage && numPages > 1 && (
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
      
      {/* Contenedor del PDF */}
      <div className="flex-1 flex items-center justify-center w-full h-full overflow-y-auto overflow-x-hidden">
        {/* Estado de carga */}
        {loading && (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Cargando PDF...</p>
            <p className="text-gray-500 text-sm mb-2">Esto puede tomar unos segundos</p>
            <p className="text-gray-400 text-xs mb-4">URL: {fileUrl}</p>
            <div className="flex gap-2">
              <a 
                href={fileUrl}
                download
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
              >
                Descargar PDF
              </a>
              <button 
                onClick={() => window.open(fileUrl, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
              >
                Abrir en nueva pestaña
              </button>
            </div>
          </div>
        )}
        
        {/* Estado de error */}
        {error && (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-red-500 text-6xl mb-4">📄</div>
            <p className="text-red-500 text-lg mb-2">{error}</p>
            <p className="text-gray-600 text-sm mb-4">URL: {fileUrl}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => window.open(fileUrl, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Abrir en nueva pestaña
              </button>
              <a 
                href={fileUrl}
                download
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Descargar PDF
              </a>
            </div>
          </div>
        )}
        
        {/* PDF renderizado */}
        {!loading && !error && (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div>Cargando PDF...</div>}
            error={<div>No se pudo cargar el PDF.</div>}
            options={{
              cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
              cMapPacked: true,
              standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
              disableFontFace: true,
              disableRange: true,
              disableStream: true,
            }}
          >
            <Page
              pageNumber={onlyFirstPage ? 1 : pageNumber}
              height={pageSize.height}
              width={pageSize.width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              scale={1}
                                        onLoadError={(error) => {
                            setError('Error al renderizar la página del PDF.');
                          }}
            />
          </Document>
        )}
      </div>
    </div>
  );
}; 