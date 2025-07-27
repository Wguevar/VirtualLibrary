// Versión alternativa usando pdf-parse (más compatible)
// Esta versión evita completamente los problemas de CORS

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

// Función para extraer metadatos usando una aproximación más simple
export async function extractPDFMetadataAlternative(file: File): Promise<PDFMetadata> {
  try {
    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convertir a string para buscar metadatos
    const pdfString = new TextDecoder('latin1').decode(uint8Array);
    
    const metadata: PDFMetadata = {};
    
    // Buscar metadatos usando expresiones regulares más robustas
    const patterns = {
      title: /\/Title\s*\(([^)]*)\)/i,
      author: /\/Author\s*\(([^)]*)\)/i,
      subject: /\/Subject\s*\(([^)]*)\)/i,
      creator: /\/Creator\s*\(([^)]*)\)/i,
      producer: /\/Producer\s*\(([^)]*)\)/i,
      creationDate: /\/CreationDate\s*\(([^)]*)\)/i,
      modDate: /\/ModDate\s*\(([^)]*)\)/i,
      pageCount: /\/Count\s+(\d+)/i
    };
    
    // Extraer cada metadato
    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = pdfString.match(pattern);
      if (match && match[1]) {
        const value = decodePDFString(match[1]);
        if (value && value.trim()) {
          switch (key) {
            case 'title':
              metadata.title = value;
              break;
            case 'author':
              metadata.author = value;
              break;
            case 'subject':
              metadata.subject = value;
              break;
            case 'creator':
              metadata.creator = value;
              break;
            case 'producer':
              metadata.producer = value;
              break;
            case 'creationDate':
              metadata.creationDate = value;
              break;
            case 'modDate':
              metadata.modificationDate = value;
              break;
            case 'pageCount':
              metadata.numPages = parseInt(value, 10);
              break;
          }
        }
      }
    });
    
    // Extraer texto de la primera página (aproximación)
    const textBlocks = pdfString.match(/\([^)]*\)/g);
    if (textBlocks) {
      const textContent = textBlocks
        .map(block => decodePDFString(block.slice(1, -1)))
        .filter(text => text.length > 10 && text.length < 200) // Filtrar bloques de texto razonables
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500);
      
      if (textContent) {
        metadata.firstPageText = textContent;
      }
    }
    
    return metadata;
  } catch (error) {
    console.error('Error al extraer metadatos del PDF:', error);
    return {};
  }
}

// Función mejorada para decodificar strings de PDF
function decodePDFString(str: string): string {
  try {
    if (!str) return '';
    
    // Decodificar caracteres octales
    let decoded = str.replace(/\\([0-7]{3})/g, (_, oct) => {
      return String.fromCharCode(parseInt(oct, 8));
    });
    
    // Decodificar caracteres de escape
    decoded = decoded.replace(/\\([nrtbf])/g, (_, char) => {
      const escapes: { [key: string]: string } = {
        n: '\n', r: '\r', t: '\t', b: '\b', f: '\f'
      };
      return escapes[char] || char;
    });
    
    // Remover otros caracteres de escape
    decoded = decoded.replace(/\\(.)/g, '$1');
    
    // Limpiar caracteres no imprimibles
    decoded = decoded.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    return decoded.trim();
  } catch (error) {
    return str;
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
  const subject = (metadata.subject || '').toLowerCase();
  
  // Palabras clave para detectar tesis
  const tesisKeywords = ['tesis', 'thesis', 'graduación', 'graduation', 'investigación', 'research'];
  const tesisInText = tesisKeywords.some(keyword => 
    lowerText.includes(keyword) || title.includes(keyword) || subject.includes(keyword)
  );
  
  // Palabras clave para detectar proyectos de investigación
  const proyectoKeywords = ['proyecto', 'project', 'investigación', 'research', 'estudio', 'study'];
  const proyectoInText = proyectoKeywords.some(keyword => 
    lowerText.includes(keyword) || title.includes(keyword) || subject.includes(keyword)
  );
  
  if (tesisInText) return 'Tesis';
  if (proyectoInText) return 'Proyecto de Investigacion';
  
  return 'Virtual'; // Por defecto
} 