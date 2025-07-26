import { useEffect, useState } from 'react';
import { TesisBook } from '../interfaces';
import { CardBook } from '../components/products/CardBook';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchBooks } from '../services/bookService';
import { ContainerFilter } from '../components/products/ContainerFilter';
import { useAuth } from '../hooks/useAuth';
import { PDFViewer } from '../components/products/PDFViewer';
import { PreparedBook } from '../interfaces';
import { BackToHome } from '../components/shared/BackToHome';
import { ScrollToTop } from '../components/shared/ScrollToTop';

export const TesisPages = () => {
  const [books, setBooks] = useState<TesisBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<TesisBook | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const { isAuthenticated } = useAuth();

  // Lista fija de especialidades para los filtros
  const specialitiesForFilter = [
    'Tesis',
    'Pasantías',
    'Proyecto de Investigacion',
  ];

  // Función para normalizar textos (ignorar mayúsculas y tildes)
  function normalize(str: string) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Solo elimina tildes
      .trim();
  }

  // Log para ver los tipos normalizados
  console.log('Tipos normalizados:', books.map(b => b.type && normalize(b.type)));

  // Filtrar solo libros de tipo Tesis, Proyecto de Investigacion o Pasantía(s)
  let filteredBooks = books.filter(
    book =>
      book.type === 'Tesis' ||
      book.type === 'Proyecto de Investigacion' ||
      book.type === 'Pasantía' ||
      book.type === 'Pasantias'
  );

  // Filtrar por tipo seleccionado (igual que BookPages pero usando type)
  if (selectedSpecialities.length > 0) {
    console.log('selectedSpecialities:', selectedSpecialities);
    console.log('Book types:', filteredBooks.map(b => b.type));
    filteredBooks = filteredBooks.filter(book => {
      const result = selectedSpecialities.some(sel =>
        book.type && normalize(sel) === normalize(book.type)
      );
      console.log(
        `Comparando: filtro "${selectedSpecialities[0]}" con libro "${book.title}" (type: "${book.type}") =>`,
        result
      );
      return result;
    });
    console.log('Libros mostrados tras filtrar:', filteredBooks.map(b => ({ title: b.title, type: b.type })));
  }

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const data = await fetchBooks();
        setBooks(data); // Mostrar todos los libros primero
      } catch (err: any) {
        setError('Error al cargar las tesis');
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500 text-lg my-8">Cargando tesis...</p>;
  }
  if (error) {
    return <p className="text-center text-red-500 text-lg my-8">{error}</p>;
  }
  if (filteredBooks.length === 0) {
    return (
      <div className="my-32">
        <h1 className='text-5xl font-semibold text-center mb-12'>Tesis</h1>
        <p className="text-center text-gray-500 text-lg my-8">No hay libros disponibles.</p>
      </div>
    );
  }

  return (
    <div className="my-32">
      <BackToHome />
      <ScrollToTop />
      
      <h2 className="text-3xl font-semibold text-center mb-8 md:text-4xl lg:text-5xl text-primary">
        Proyectos de Investigación
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Caja de filtros */}
        <ContainerFilter
          selectedSpecialities={selectedSpecialities}
          onChange={setSelectedSpecialities}
          specialities={specialitiesForFilter}
        />
        <div className="col-span-2 lg:col-span-3 xl:col-span-4 flex flex-col gap-12">
          {filteredBooks.length === 0 ? (
            <div className="my-32">
              <p className="text-center text-gray-500 text-lg my-8">No hay tesis disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 gap-y-10 xl:grid-cols-4">
              {filteredBooks.map(book => (
                <CardBook
                  key={book.id}
                  title={book.title}
                  authors={book.authors}
                  price={book.price}
                  img={book.coverImage}
                  slug={book.slug}
                  speciality={book.speciality}
                  type={book.type}
                  fragment={book.fragment}
                  fileUrl={book.fileUrl}
                  onViewDetails={() => {
                    setSelectedBook(book);
                    setIsModalOpen(true);
                    setShowPdf(true); // Mostrar PDF directamente
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && selectedBook && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsModalOpen(false);
              setSelectedBook(null);
            }} // Cerrar al hacer click fuera
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-8 relative flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()} // Evitar que el click dentro cierre el modal
            >
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedBook(null);
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl z-10"
              >
                &times;
              </button>
              {/* Título y visor PDF, solo primera página */}
              <h3 className="text-lg font-bold text-center w-full truncate">{selectedBook.title}</h3>
              {showPdf && (
                <div className="w-full text-center text-xs text-gray-500">Primera página</div>
              )}
              {selectedBook.fileUrl && showPdf && (
                <div className="w-full h-[65vh] mb-4 flex items-center justify-center relative">
                  <BookDetailsPopover book={selectedBook} />
                  <PDFViewer fileUrl={selectedBook.fileUrl} onlyFirstPage />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón de scroll to top */}
      <ScrollToTop />
    </div>
  );
};

// Popover de detalles del libro
function BookDetailsPopover({ book }: { book: PreparedBook }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center">
      <button
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center shadow transition"
        onClick={() => setOpen(o => !o)}
        title="Ver detalles"
      >
        <span className="sr-only">Ver detalles</span>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M14 8l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22 }}
            className="mr-2 bg-white rounded-lg shadow-lg p-4 w-64 border border-gray-200 text-sm text-left right-full relative"
            style={{ left: 'auto', right: '100%' }}
          >
            {/* Flecha visual */}
            <span className="absolute top-1/2 right-[-3px] -translate-y-1/2 w-4 h-4">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="0,8 16,0 16,16" fill="#fff" stroke="#e5e7eb" strokeWidth="1" />
              </svg>
            </span>
            <div className="font-bold text-base mb-1 truncate">{book.title}</div>
            <div className="mb-1"><span className="font-semibold">Tipo:</span> {book.type}</div>
            <div className="mb-1"><span className="font-semibold">Especialidad:</span> {book.speciality}</div>
            <div className="mb-1"><span className="font-semibold">Autor:</span> {book.authors || book.author}</div>
            <div className="mb-1"><span className="font-semibold">Sinopsis:</span> <span className="block text-gray-600 max-h-24 overflow-y-auto whitespace-pre-line">{book.description?.content?.[0]?.content?.[0]?.text || 'Sin sinopsis.'}</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
