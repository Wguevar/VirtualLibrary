import { PreparedBook } from '../../interfaces';
import { CardBook } from '../products/CardBook';
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
		<div className='my-32'>
			<h2 className='text-3xl font-semibold text-center mb-8 md:text-4xl lg:text-5xl'>
				{title}
			</h2>

			{filteredBooks.length === 0 ? (
				<p className='text-center text-gray-500 text-lg my-8'>{noBooksMessage || 'No hay libros disponibles.'}</p>
			) : (
				<div className='grid grid-cols-1 gap-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4'>
					{filteredBooks.map(book => (
						<CardBook
							key={book.id}
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
					))}
				</div>
			)}

			{/* Modal */}
			<AnimatePresence>
			{isModalOpen && selectedBook && (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative"
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						<button
							onClick={handleCloseModal}
							className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
						>
							&times;
						</button>
						<h3 className="text-xl font-bold mb-2 text-center">{selectedBook.title}</h3>
						<p className="text-center text-gray-700 mb-2">Autor: {selectedBook.authors}</p>
						<p className="text-lg font-semibold text-center mb-2 text-gray-800">Capítulo 1</p>
						<p className="text-gray-700 whitespace-pre-line mb-4">{(selectedBook.fragment || '').replace(/^Capítulo 1:?\s*/i, '') || 'No hay fragmento disponible.'}</p>
						{isAuthenticated ? (
							<a
								href={selectedBook.fileUrl}
								download
								className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700 transition"
							>
								Descargar libro
							</a>
						) : (
							<p className="text-center text-red-500 font-semibold">Debes iniciar sesión para descargar el libro.</p>
						)}
					</motion.div>
				</motion.div>
			)}
			</AnimatePresence>
		</div>
	);
};
