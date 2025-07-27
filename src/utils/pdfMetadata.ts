import * as pdfjsLib from 'pdfjs-dist';

// Configurar PDF.js para usar un worker local o deshabilitar el worker
// Esto evita problemas de CORS con CDNs externos
try {
  // Intentar usar un worker local
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();
} catch (error) {
  // Si falla, usar el modo sin worker (más lento pero funcional)
  console.warn('No se pudo cargar el worker de PDF.js, usando modo sin worker');
  (pdfjsLib.GlobalWorkerOptions as any).workerSrc = false;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  numPages?: number;
  firstPageText?: string;
}

export async function extractPDFMetadata(file: File): Promise<PDFMetadata> {
  try {
    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Cargar el PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Obtener metadatos del documento
    const metadata = await pdf.getMetadata();
    
    // Obtener el texto de la primera página para extraer información adicional
    const firstPage = await pdf.getPage(1);
    const textContent = await firstPage.getTextContent();
    const firstPageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .substring(0, 500); // Primeros 500 caracteres
    
    return {
      title: (metadata?.info as any)?.Title || '',
      author: (metadata?.info as any)?.Author || '',
      subject: (metadata?.info as any)?.Subject || '',
      keywords: (metadata?.info as any)?.Keywords || '',
      creator: (metadata?.info as any)?.Creator || '',
      producer: (metadata?.info as any)?.Producer || '',
      creationDate: (metadata?.info as any)?.CreationDate || '',
      modificationDate: (metadata?.info as any)?.ModDate || '',
      numPages: pdf.numPages,
      firstPageText: firstPageText
    };
  } catch (error) {
    console.error('Error al extraer metadatos del PDF:', error);
    return {};
  }
}

// Función para generar sinopsis automática basada en el texto del PDF
export function generateSynopsis(text: string, maxLength: number = 200): string {
  if (!text) return '';
  
  // Limpiar el texto de caracteres especiales y múltiples espacios
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?-]/g, '')
    .trim();
  
  // Tomar los primeros caracteres y cortar en una palabra completa
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  const truncated = cleanText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

// Función para detectar el tipo de documento basado en el contenido
export function detectDocumentType(text: string, metadata: PDFMetadata): string {
  const lowerText = text.toLowerCase();
  const title = (metadata.title || '').toLowerCase();
  
  // Palabras clave para detectar tesis
  const tesisKeywords = ['tesis', 'thesis', 'graduación', 'graduation', 'investigación', 'research'];
  const tesisInText = tesisKeywords.some(keyword => lowerText.includes(keyword) || title.includes(keyword));
  
  // Palabras clave para detectar proyectos de investigación
  const proyectoKeywords = ['proyecto', 'project', 'investigación', 'research', 'estudio', 'study'];
  const proyectoInText = proyectoKeywords.some(keyword => lowerText.includes(keyword) || title.includes(keyword));
  
  if (tesisInText) return 'Tesis';
  if (proyectoInText) return 'Proyecto de Investigacion';
  
  return 'Virtual'; // Por defecto
} 