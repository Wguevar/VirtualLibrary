import { useEffect, useState } from 'react';
import { Brands } from '../components/home/Brands';
import { FeatureGrid } from '../components/home/FeatureGrid';
import { BookGrid } from '../components/home/BookGrid';
import { fetchBooks } from '../services/bookService';
import { PreparedBook } from '../interfaces';


export const HomePage = () => {
	const [books, setBooks] = useState<PreparedBook[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	

	useEffect(() => {
		const loadBooks = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await fetchBooks();
				setBooks(data);
			} catch (err: any) {
				console.error('Error al cargar libros:', err);
				if (err.message.includes('Supabase no está configurado')) {
					setError('Error de configuración: La aplicación no puede conectarse a la base de datos');
				} else if (err.message.includes('base de datos')) {
					setError('Error de conexión: No se pudo cargar los libros desde la base de datos');
				} else {
					setError('Error inesperado al cargar los libros. Por favor, intenta de nuevo.');
				}
			} finally {
				setLoading(false);
			}
		};
		loadBooks();
	}, []);



	return (
		<div>
			<FeatureGrid />

			<Brands />
			{loading ? (
				<div className="text-center py-8 sm:py-12">
					<div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
					<p className="text-gray-500 text-base sm:text-lg">Cargando libros...</p>
				</div>
			) : error ? (
				<div className="text-center py-8 sm:py-12">
					<div className="text-red-500 text-4xl sm:text-6xl mb-3 sm:mb-4">📚</div>
					<p className="text-red-500 text-base sm:text-lg mb-2">{error}</p>
					<button 
						onClick={() => window.location.reload()} 
						className="mt-3 sm:mt-4 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 transition text-sm sm:text-base"
					>
						Reintentar
					</button>
				</div>
			) : (
				<BookGrid
					title="Libros disponibles"
					books={books}
					noBooksMessage="No hay libros disponibles en este momento"
				/>
			)}
		</div>
	);
};
