import { PreparedBook } from '../../interfaces';
import { CardBook } from '../products/CardBook';
import { PDFViewer } from '../products/PDFViewer';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

interface Props {
	title: string;
	books: PreparedBook[];
	noBooksMessage?: string;
}

export const BookGrid = ({ title, books, noBooksMessage }: Props) => {
	const [selectedBook, setSelectedBook] = useState<PreparedBook | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { isAuthenticated } = useAuth();

	const handleViewDetails = (book: PreparedBook) => {
		console.log('🔍 Abriendo modal desde HomePage:', book.title);
		console.log('📄 URL del PDF:', book.fileUrl);
		setSelectedBook(book);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedBook(null);
	};

	// Filtrar solo libros físicos o virtuales
	const filteredBooks = books.filter(
		book => book.type === 'Físico' || book.type === 'Virtual'
	);

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24 lg:my-32'>
			<h2 className='text-2xl sm:text-3xl font-semibold text-center mb-8 sm:mb-12 md:text-4xl lg:text-5xl text-gray-800'>
				{title}
			</h2>

			{filteredBooks.length === 0 ? (
				<div className="text-center py-12 sm:py-16">
					<div className="text-gray-400 text-6xl mb-4">📚</div>
					<p className='text-gray-500 text-base sm:text-lg'>{noBooksMessage || 'No hay libros disponibles.'}</p>
				</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8'>
					{filteredBooks.map(book => (
						<div key={book.id} className="h-full">
							<CardBook
								img={book.coverImage}
								title={book.title}
								authors={book.authors}
								slug={book.slug}
								speciality={book.speciality}
								type={book.type as 'Fisico' | 'Virtual'}
								fragment={book.fragment}
								fileUrl={book.fileUrl}
								onViewDetails={() => handleViewDetails(book)}
								cantidadDisponible={book.cantidadDisponible}
							/>
						</div>
					))}
				</div>
			)}

			{/* Modal */}
			<AnimatePresence>
			{isModalOpen && selectedBook && (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={handleCloseModal}
				>
					<motion.div
						className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] p-6 sm:p-8 relative flex flex-col overflow-hidden"
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={e => e.stopPropagation()}
					>
						<button
							onClick={handleCloseModal}
							className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
						>
							&times;
						</button>
						
						{/* Título y información del libro */}
						<div className="text-center mb-6 w-full">
							<h3 className="text-xl sm:text-2xl font-bold text-center w-full mb-3 text-gray-800">{selectedBook.title}</h3>
							<div className="flex flex-col sm:flex-row gap-2 sm:gap-6 justify-center text-sm text-gray-600">
								<p><span className="font-semibold">Autor:</span> {selectedBook.authors}</p>
								<p><span className="font-semibold">Tipo:</span> {selectedBook.type}</p>
								<p><span className="font-semibold">Especialidad:</span> {selectedBook.speciality}</p>
							</div>
						</div>
						
						{/* Contenido del modal */}
						<div className="w-full flex-1 min-h-0 mb-6 flex items-center justify-center relative">
							{/* Mostrar PDF si existe, sino mostrar fragmento */}
							{selectedBook.fileUrl ? (
								<div className="w-full h-full">
									<PDFViewer fileUrl={selectedBook.fileUrl} />
								</div>
							) : (
								<div className="text-center max-w-2xl">
									<div className="text-gray-400 text-6xl mb-6">📄</div>
									<p className="text-gray-600 text-lg mb-3">Este libro no tiene PDF disponible</p>
									<p className="text-gray-500 text-sm mb-6">El PDF no está asociado a este libro en la base de datos</p>
									{selectedBook.fragment && (
										<div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
											<p className="text-lg font-semibold text-gray-800 mb-3">Fragmento del libro:</p>
											<p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
												{(selectedBook.fragment || '').replace(/^Capítulo 1:?\s*/i, '') || 'No hay fragmento disponible.'}
											</p>
										</div>
									)}
								</div>
							)}
						</div>
						
						{/* Botones de acción */}
						{selectedBook.fileUrl && (
							<div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
								<button 
									onClick={() => window.open(selectedBook.fileUrl, '_blank')}
									className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium shadow-md"
								>
									Abrir en nueva pestaña
								</button>
								<a 
									href={selectedBook.fileUrl}
									download
									className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium shadow-md text-center"
								>
									Descargar PDF
								</a>
							</div>
						)}
					</motion.div>
				</motion.div>
			)}
			</AnimatePresence>
		</div>
	);
};
