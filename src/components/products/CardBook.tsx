import React from 'react';
import { useState } from 'react';

interface Props {
	img: string;
	title: string;
	authors: string;
	price?: number;
	slug: string;
	speciality: string;
	type: string;
	fragment?: string;
	fileUrl?: string;
	onViewDetails?: () => void; // Visualizar PDF
	onShowDetails?: () => void; // Ver detalles
	onReserve?: () => void; // Reservar libro físico
	cantidadDisponible?: number; // Cantidad de ejemplares físicos disponibles
	hasActiveOrder?: boolean; // Si el usuario ya tiene una orden activa para este libro
}

export const CardBook = ({ img, title, authors, slug, speciality, type, fragment, fileUrl, onViewDetails, onShowDetails, onReserve, cantidadDisponible, hasActiveOrder = false }: Props) => {
	const [showNoPdf, setShowNoPdf] = useState(false);
	let hideTimeout: NodeJS.Timeout;

	// Función para normalizar el tipo
	function normalizeType(str: string) {
		return (str || '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '') // Elimina tildes correctamente
			.replace(/\s+/g, '') // Elimina espacios
			.trim();
	}

	const isFisico = type === 'Fisico' || type === 'Físico';
	const noDisponibles = isFisico && (cantidadDisponible === 0 || cantidadDisponible === undefined || cantidadDisponible < 0);
	const yaTieneOrden = isFisico && hasActiveOrder;
	const botonDeshabilitado = noDisponibles || yaTieneOrden;

	return (
		<div className='flex flex-col gap-6 relative border p-4 rounded-lg shadow-md'>
			<div className='flex relative group overflow-hidden '>
				<div className='flex h-[350px] w-full items-center justify-center py-2 lg:h-[250px]'>
					<img
						src={img}
						alt={title}
						className='object-contain h-full w-full'
					/>
				</div>
			</div>

			<div className='flex flex-col gap-1 items-center'>
				<p className='text-[15px] font-semibold'>{title}</p>
				<p className='text-[13px] text-gray-600'>Especialidad: {speciality}</p>
				<p className='text-[13px] text-gray-600'>Tipo: {type}</p>
				{isFisico && (
					<p className='text-[13px] text-gray-600'>Ejemplares disponibles: {cantidadDisponible ?? 'N/D'}</p>
				)}
				{fragment && <p className='text-[12px] text-gray-400 truncate w-full' title={fragment}>Fragmento: {fragment.slice(0, 30)}...</p>}

				<div className='flex flex-col gap-2 mt-2 relative w-full items-center'>
					{/* Botón Visualizar */}
					<button
						onClick={() => {
							if (fileUrl && onViewDetails) {
								onViewDetails();
							} else {
								setShowNoPdf(true);
								clearTimeout(hideTimeout);
								hideTimeout = setTimeout(() => setShowNoPdf(false), 2000);
							}
						}}
						className={`px-3 py-1 rounded text-xs font-medium transition bg-green-600 text-white hover:bg-green-700 w-full`}
					>
						Visualizar
					</button>
					{showNoPdf && (
						<div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-gray-800 text-white text-xs rounded px-3 py-2 shadow z-20 animate-fade-in">
							Este libro no cuenta con un PDF para visualizar.
							<span className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-gray-800 rotate-45"></span>
						</div>
					)}
					{/* Botón Reservar solo si es físico, debajo del de visualizar */}
					{isFisico && (
						<>
							<button
								className={`bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-xs font-medium w-full mt-2 ${botonDeshabilitado ? 'opacity-50 cursor-not-allowed' : ''}`}
								onClick={onReserve}
								disabled={botonDeshabilitado}
							>
								{yaTieneOrden ? 'Ya Reservado' : 'Reservar'}
							</button>
							{noDisponibles && (
								<p className='text-xs text-red-600 mt-1 text-center'>No hay ejemplares disponibles en este momento.</p>
							)}
							{yaTieneOrden && (
								<p className='text-xs text-orange-600 mt-1 text-center'>Ya tienes una orden activa para este libro.</p>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};
