import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { Footer } from '../components/shared/Footer';
import { Banner } from '../components/home/Banner';
import { useAuth } from '../hooks/useAuth';
import MorosoBlock from '../components/shared/MorosoBlock';

export const RootLayout = () => {
	const { pathname } = useLocation();
	const { user, isUserMoroso, loading, isConfigured } = useAuth();

	// Si el usuario está cargando, mostrar loading
	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
					<p className="mt-4 text-gray-600">Cargando aplicación...</p>
				</div>
			</div>
		);
	}

	// Si Supabase no está configurado, mostrar mensaje de error
	if (!isConfigured) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-xl font-bold text-gray-800 mb-2">Error de Configuración</h2>
					<p className="text-gray-600 mb-4">
						La aplicación no puede conectarse a la base de datos. 
						Verifica que las variables de entorno estén configuradas correctamente.
					</p>
					<div className="bg-gray-100 p-3 rounded text-sm text-gray-700">
						<p><strong>Variables requeridas:</strong></p>
						<p>• VITE_SUPABASE_API_KEY</p>
						<p>• VITE_PROJECT_URL_SUPABASE</p>
					</div>
				</div>
			</div>
		);
	}

	// Si el usuario está autenticado y es moroso, mostrar bloqueo
	if (user && isUserMoroso()) {
		return <MorosoBlock user={user} />;
	}

	return (
		<div className='h-screen flex flex-col font-montserrat'>
			<Navbar />

			{pathname === '/' && <Banner />}

			<main className='flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-8'>
				<Outlet />
			</main>
			<Footer />
		</div>
	);
};
