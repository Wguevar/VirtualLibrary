// Versión final para extraer metadatos de PDF sin dependencias externas
// Esta versión es completamente compatible y no tiene problemas de CORS

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

// Función principal para extraer metadatos de PDF
export async function extractPDFMetadataFinal(file: File): Promise<PDFMetadata> {
  try {
    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convertir a string usando diferentes encodings
    let pdfString = '';
    try {
      pdfString = new TextDecoder('utf-8').decode(uint8Array);
    } catch {
      try {
        pdfString = new TextDecoder('latin1').decode(uint8Array);
      } catch {
        pdfString = new TextDecoder('iso-8859-1').decode(uint8Array);
      }
    }
    
    const metadata: PDFMetadata = {};
    
    // Buscar metadatos usando expresiones regulares
    const titleMatch = pdfString.match(/\/Title\s*\(([^)]*)\)/i);
    if (titleMatch && titleMatch[1]) {
      metadata.title = cleanPDFString(titleMatch[1]);
    }
    
    const authorMatch = pdfString.match(/\/Author\s*\(([^)]*)\)/i);
    if (authorMatch && authorMatch[1]) {
      metadata.author = cleanPDFString(authorMatch[1]);
    }
    
    // Si no se encontró autor en metadatos, buscar en el texto del PDF
    if (!metadata.author) {
      const textContent = extractTextFromPDF(pdfString);
      if (textContent) {
        // Buscar patrones comunes de autor en el texto
        const authorPatterns = [
          /por\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /autor[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /elaborado\s+por\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /presentado\s+por\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /realizado\s+por\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
        ];
        
        for (const pattern of authorPatterns) {
          const match = textContent.match(pattern);
          if (match && match[1]) {
            const potentialAuthor = match[1].trim();
            // Verificar que parece un nombre válido
            if (potentialAuthor.length > 3 && potentialAuthor.length < 50 && 
                /^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$/.test(potentialAuthor)) {
              metadata.author = potentialAuthor;
              break;
            }
          }
        }
      }
    }
    
    const subjectMatch = pdfString.match(/\/Subject\s*\(([^)]*)\)/i);
    if (subjectMatch && subjectMatch[1]) {
      metadata.subject = cleanPDFString(subjectMatch[1]);
    }
    
    const creatorMatch = pdfString.match(/\/Creator\s*\(([^)]*)\)/i);
    if (creatorMatch && creatorMatch[1]) {
      metadata.creator = cleanPDFString(creatorMatch[1]);
    }
    
    const producerMatch = pdfString.match(/\/Producer\s*\(([^)]*)\)/i);
    if (producerMatch && producerMatch[1]) {
      metadata.producer = cleanPDFString(producerMatch[1]);
    }
    
    // Extraer texto de la primera página
    const textContent = extractTextFromPDF(pdfString);
    if (textContent) {
      metadata.firstPageText = textContent;
      
      // Si no hay título en metadatos, intentar extraerlo del texto
      if (!metadata.title) {
        const titlePatterns = [
          /^([A-Z][^.!?]{10,50})/m, // Primera línea que empiece con mayúscula
          /TÍTULO[:\s]+([^.!?\n]{10,100})/i,
          /TITULO[:\s]+([^.!?\n]{10,100})/i
        ];
        
        for (const pattern of titlePatterns) {
          const match = textContent.match(pattern);
          if (match && match[1]) {
            const potentialTitle = cleanPDFString(match[1]).trim();
            if (potentialTitle.length > 5 && potentialTitle.length < 100) {
              metadata.title = potentialTitle;
              break;
            }
          }
        }
      }
    }
    
    // Intentar detectar el número de páginas
    const pageCountMatch = pdfString.match(/\/Count\s+(\d+)/i);
    if (pageCountMatch && pageCountMatch[1]) {
      metadata.numPages = parseInt(pageCountMatch[1], 10);
    }
    
    return metadata;
  } catch (error) {
    console.error('Error al extraer metadatos del PDF:', error);
    return {};
  }
}

// Función para limpiar strings de PDF
function cleanPDFString(str: string): string {
  if (!str) return '';
  
  try {
    // Decodificar caracteres octales
    let cleaned = str.replace(/\\([0-7]{3})/g, (_, oct) => {
      return String.fromCharCode(parseInt(oct, 8));
    });
    
    // Decodificar caracteres de escape
    cleaned = cleaned.replace(/\\([nrtbf])/g, (_, char) => {
      const escapes: { [key: string]: string } = {
        n: '\n', r: '\r', t: '\t', b: '\b', f: '\f'
      };
      return escapes[char] || char;
    });
    
    // Remover otros caracteres de escape
    cleaned = cleaned.replace(/\\(.)/g, '$1');
    
    // Limpiar caracteres no imprimibles y caracteres extraños
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Remover caracteres extraños que aparecen en PDFs
    cleaned = cleaned.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ.,!?;:()\-]/g, ' ');
    
    // Limpiar espacios múltiples
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned.trim();
  } catch (error) {
    return str.trim();
  }
}

// Función para extraer texto del PDF
function extractTextFromPDF(pdfString: string): string {
  try {
    // Buscar bloques de texto en el PDF usando diferentes patrones
    let textBlocks: string[] = [];
    
    // Patrón 1: Buscar texto entre paréntesis (más común)
    const pattern1 = pdfString.match(/\([^)]*\)/g);
    if (pattern1) textBlocks.push(...pattern1);
    
    // Patrón 2: Buscar texto después de operadores de texto
    const pattern2 = pdfString.match(/Tj\s*\([^)]*\)/g);
    if (pattern2) textBlocks.push(...pattern2);
    
    // Patrón 3: Buscar texto en arrays
    const pattern3 = pdfString.match(/\[[^\]]*\]\s*TJ/g);
    if (pattern3) textBlocks.push(...pattern3);
    
    if (textBlocks.length === 0) return '';
    
    // Procesar cada bloque de texto
    const textParts = textBlocks
      .map(block => {
        let content = '';
        
        // Extraer contenido según el patrón
        if (block.startsWith('(') && block.endsWith(')')) {
          content = block.slice(1, -1);
        } else if (block.includes('Tj')) {
          const match = block.match(/Tj\s*\(([^)]*)\)/);
          content = match ? match[1] : '';
        } else if (block.includes('TJ')) {
          const match = block.match(/\[([^\]]*)\]/);
          content = match ? match[1] : '';
        }
        
        const cleaned = cleanPDFString(content);
        return cleaned;
      })
      .filter(text => {
        // Filtrar solo bloques de texto legibles
        return text.length > 3 && 
               text.length < 200 && 
               /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(text) && // Debe contener letras (incluyendo acentos)
               !/^[0-9\s\-_.,]+$/.test(text) && // No solo números, espacios y caracteres especiales
               !/^[a-zA-Z0-9]{20,}$/.test(text) && // No strings muy largos sin espacios
               !text.includes('\\') && // No strings con muchos escapes
               text.split(' ').length > 1; // Debe tener al menos 2 palabras
      })
      .join(' ');
    
    // Limpiar y limitar el texto
    const finalText = textParts
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 800); // Aumentar a 800 caracteres para mejor contexto
    
    return finalText;
  } catch (error) {
    console.error('Error al extraer texto del PDF:', error);
    return '';
  }
}

// Función para generar sinopsis automática basada en el texto del PDF
export function generateSynopsis(text: string, maxLength: number = 200): string {
  if (!text) return '';
  
  // Limpiar el texto de caracteres especiales y múltiples espacios
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ.,!?;:()\-]/g, ' ')
    .trim();
  
  // Buscar frases que parezcan introducción
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) {
    // Si no hay frases claras, tomar los primeros caracteres
    if (cleanText.length <= maxLength) {
      return cleanText;
    }
    
    const truncated = cleanText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
  
  // Tomar las primeras frases que parezcan introducción
  let synopsis = '';
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length > 10 && !trimmedSentence.toLowerCase().includes('página')) {
      if ((synopsis + trimmedSentence).length <= maxLength) {
        synopsis += (synopsis ? '. ' : '') + trimmedSentence;
      } else {
        break;
      }
    }
  }
  
  // Si no se pudo construir una sinopsis con frases, usar el método anterior
  if (!synopsis) {
    if (cleanText.length <= maxLength) {
      return cleanText;
    }
    
    const truncated = cleanText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }
  
  return synopsis + (synopsis.length >= maxLength ? '...' : '');
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