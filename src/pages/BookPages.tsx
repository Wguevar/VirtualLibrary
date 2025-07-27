import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PreparedBook } from '../interfaces';

import { useLocation } from 'react-router-dom';
import { CardBook } from '../components/products/CardBook';
import { ContainerFilter } from '../components/products/ContainerFilter';
import { ReservationModal } from '../components/products/ReservationModal';
import { Pagination } from '../components/shared/Pagination';
import { useAuth } from '../hooks/useAuth';
import { fetchBooks } from '../services/bookService';
import { PDFViewer } from '../components/products/PDFViewer';

import { registerBookReservation } from '../services/bookService';
import { supabase } from '../supabase/client';
import { ScrollToTop } from '../components/shared/ScrollToTop';


export const BookPages = () => {
  const { isAuthenticated, isConfigured, user } = useAuth();

  const location = useLocation();

  const [books, setBooks] = useState<PreparedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<PreparedBook | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([]);
  // Controlar si la selección de especialidad fue hecha por el usuario
  const [userChangedSpeciality, setUserChangedSpeciality] = useState(false);


  const [reservationMessage, setReservationMessage] = useState<string | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedBookForReservation, setSelectedBookForReservation] = useState<PreparedBook | null>(null);
  const [userActiveOrders, setUserActiveOrders] = useState<Set<number>>(new Set());

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const data = await fetchBooks();
        setBooks(data);
      } catch (err: any) {
        setError('Error al cargar los libros');
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  // Cargar órdenes activas del usuario
  useEffect(() => {
    const loadUserActiveOrders = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const { data: ordenesActivas } = await supabase
          .from('ordenes')
          .select('libro_id')
          .eq('usuario_id', user.id)
          .in('estado', ['Pendiente de buscar', 'Prestado', 'Moroso']);
        
        if (ordenesActivas) {
          const libroIds = new Set(ordenesActivas.map(orden => orden.libro_id).filter((id): id is number => id !== null));
          setUserActiveOrders(libroIds);
        }
      } catch (error) {
        console.error('Error al cargar órdenes activas:', error);
      }
    };
    
    loadUserActiveOrders();
  }, [isAuthenticated, user]);



  useEffect(() => {
    // Si hay un parámetro 'carrera' en la URL y el usuario no ha cambiado el filtro manualmente, seleccionarlo automáticamente
    const searchParams = new URLSearchParams(location.search);
    const carreraParam = searchParams.get('carrera');
    if (!userChangedSpeciality) {
      if (carreraParam) {
        setSelectedSpecialities([carreraParam]);
      } else {
        setSelectedSpecialities([]); // Si no hay parámetro, mostrar todos
      }
    }
  }, [location.search, userChangedSpeciality]);

  // Handler para cambios en los filtros de especialidad
  const handleSpecialitiesChange = (specialities: string[]) => {
    setSelectedSpecialities(specialities);
    setUserChangedSpeciality(true);
  };



  // Lista fija de especialidades para los filtros
  const specialitiesForFilterBase = [
    'Ingeniería De Sistemas',
    'Ingeniería Civil',
    'Ingeniería en Mantenimiento Mecánico',
    'Ingeniería Electrónica',
    'Ingeniería Industrial',
    'Ingeniería Eléctrica',
    'Arquitectura',
  ];

  // Si hay parámetro 'carrera' en la URL y no está en la lista, agregarlo temporalmente
  const searchParams = new URLSearchParams(location.search);
  const carreraParam = searchParams.get('carrera');
  let specialitiesForFilter = [...specialitiesForFilterBase];
  if (carreraParam && !specialitiesForFilter.includes(carreraParam)) {
    specialitiesForFilter.push(carreraParam);
  }

  // Función para normalizar textos (ignorar mayúsculas y tildes)
  function normalize(str: string) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina tildes correctamente
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Mostrar todos los libros excepto los de tipo Tesis, Servicio Comunitario, Pasantía(s) y Proyecto de Investigacion
  let filteredBooks = books.filter(
    book =>
      book.type !== 'Tesis' &&
      book.type !== 'Servicio Comunitario' &&
      book.type !== 'Pasantía' &&
      book.type !== 'Pasantias' &&
      book.type !== 'Proyecto de Investigacion'
  );

  // Filtrar por parámetro de búsqueda en la URL
  const searchQuery = searchParams.get('search')?.trim() || '';
  if (searchQuery) {
    filteredBooks = filteredBooks.filter(book => {
      const normalizedTitle = normalize(book.title);
      const normalizedAuthor = normalize(book.authors || book.author || '');
      const normalizedQuery = normalize(searchQuery);
      return (
        normalizedTitle.includes(normalizedQuery) ||
        normalizedAuthor.includes(normalizedQuery)
      );
    });
  }

  // Filtrar por carreras seleccionadas
  if (selectedSpecialities.length > 0) {
    filteredBooks = filteredBooks.filter(book =>
      selectedSpecialities.some(sel =>
        book.speciality && normalize(sel) === normalize(book.speciality)
      )
    );
  }

  // Lógica de paginación
  const totalItems = filteredBooks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBooks = filteredBooks.slice(startIndex, endIndex);

  // Resetear a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSpecialities, searchQuery]);



  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top cuando cambia de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <p className="text-center text-gray-500 text-lg my-8">Cargando libros...</p>;
  }
  if (error) {
    return <p className="text-center text-red-500 text-lg my-8">{error}</p>;
  }

  // Handler para ver detalles


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };



  // Handler para reservar libro físico
  const handleReserve = (book: PreparedBook) => {
    if (!isAuthenticated || !user) {
      setReservationMessage('Debes iniciar sesión para reservar un libro.');
      return;
    }
    if (user.estado === 'Moroso') {
      setReservationMessage('Usted se encuentra bloqueado por morosidad. Por favor, entregue el libro pendiente lo antes posible para restablecer el acceso.');
      return;
    }
    
    // Abrir modal de confirmación
    setSelectedBookForReservation(book);
    setIsReservationModalOpen(true);
  };



  const handleConfirmReservation = async () => {
    if (!selectedBookForReservation || !user) return;
    
    try {
      await registerBookReservation({ 
        libro_id: Number(selectedBookForReservation.id), 
        usuario_id: user.id 
      });
      setReservationMessage('¡Reserva realizada con éxito!');
      
      // Recargar los libros para actualizar las cantidades
      const updatedBooks = await fetchBooks();
      setBooks(updatedBooks);
      
      // Actualizar órdenes activas del usuario
      setUserActiveOrders(prev => new Set([...prev, selectedBookForReservation.id]));
      
    } catch (err: any) {
      // Mostrar mensaje de error específico
      const errorMessage = err.message || 'Error al realizar la reserva.';
      setReservationMessage(errorMessage);
    }
    setTimeout(() => setReservationMessage(null), 4000); // Más tiempo para leer el mensaje
  };

  return (
    <>
      <h1 className='text-3xl sm:text-4xl lg:text-5xl font-semibold text-center mb-8 sm:mb-12'>
        Libros
      </h1>



      {/* Banner informativo para usuarios no autenticados */}
      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Inicia sesión</strong> para poder descargar los libros. Puedes navegar y ver la información sin necesidad de registrarte.
                {!isConfigured && (
                  <span className="block mt-1 text-xs text-blue-600">
                    (Modo simulado: El sistema de autenticación no está configurado)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de confirmación de reserva */}
      {reservationMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-fade-in">
          {reservationMessage}
        </div>
      )}

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
        {/* FILTROS */}
        <ContainerFilter
          selectedSpecialities={selectedSpecialities}
          onChange={handleSpecialitiesChange}
          specialities={specialitiesForFilter}
        />

        <div className='col-span-2 lg:col-span-2 xl:col-span-4 flex flex-col gap-8 sm:gap-12'>
          {filteredBooks.length === 0 ? (
            <div className="my-32">
              <p className="text-center text-gray-500 text-lg my-8">No hay libros disponibles.</p>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 gap-y-8 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                <AnimatePresence>
                  {currentBooks.map(book => (
                    <motion.div
                      key={book.id}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                    >
                      <CardBook
                        title={book.title}
                        authors={book.authors}
                        price={book.price}
                        img={book.coverImage}
                        slug={book.slug}
                        speciality={book.speciality}
                        type={book.type}
                        fragment={book.fragment}
                        fileUrl={book.fileUrl}
                                              cantidadDisponible={book.cantidadDisponible}
                      hasActiveOrder={userActiveOrders.has(book.id)}
                      isAuthenticated={isAuthenticated}
                      onViewDetails={() => {
                        if (!isAuthenticated) {
                          return; // No abrir modal si no está autenticado
                        }
                        setSelectedBook(book);
                        setIsModalOpen(true);
                      }}
                      onReserve={() => handleReserve(book)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Paginación */}
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            </>
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
            onClick={handleCloseModal} // Cerrar al hacer click fuera
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg max-w-4xl w-[95%] max-h-[90vh] p-4 sm:p-6 lg:p-8 relative flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()} // Evitar que el click dentro cierre el modal
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl z-10"
              >
                &times;
              </button>
              {/* Título y visor PDF */}
              <h3 className="text-base sm:text-lg font-bold text-center w-full truncate mb-2 sm:mb-4">{selectedBook.title}</h3>
              
              {/* Contenido del modal */}
              <div className="w-full h-[50vh] sm:h-[60vh] lg:h-[65vh] mb-4 flex items-center justify-center relative">
                {/* Botón flotante para detalles */}
                <BookDetailsPopover book={selectedBook} />
                
                {/* Mostrar PDF si existe, sino mostrar mensaje */}
                {selectedBook.fileUrl ? (
                  <PDFViewer fileUrl={selectedBook.fileUrl} isAuthenticated={isAuthenticated} />
                ) : (
                  <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">📄</div>
                    <p className="text-red-500 text-lg mb-2">Este libro no tiene PDF disponible</p>
                    <p className="text-gray-600 text-sm">El PDF no está asociado a este libro en la base de datos</p>
                    <p className="text-gray-500 text-xs mt-2">Debug: fileUrl = {selectedBook.fileUrl || 'undefined'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Reserva */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          setSelectedBookForReservation(null);
        }}
        onConfirm={handleConfirmReservation}
        bookTitle={selectedBookForReservation?.title || ''}
      />

      {/* Botón de scroll to top */}
      <ScrollToTop />
    </>
  );
}

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
