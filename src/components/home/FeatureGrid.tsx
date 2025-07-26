import { CiBookmark } from 'react-icons/ci';
import { FaBook } from 'react-icons/fa6';
import { GoDownload } from 'react-icons/go';
import { GrWorkshop } from 'react-icons/gr';



export const FeatureGrid = () => {
	return (
		<div className='grid grid-cols-2 gap-8 mt-6 mb-16 lg:grid-cols-4 lg:gap-5'>
			<div className='flex items-center gap-6'>
				<GoDownload size={40} className='text-slate-600' />

				<div className='space-y-1'>
					<p className='font-semibold'>Descarga sin límites</p>
					<p className='text-sm'>En la mayoría de nuestros libros</p>
				</div>
			</div>

			<div className='flex items-center gap-6'>
				<FaBook size={40} className='text-slate-600' />

				<div className='space-y-1'>
					<p className='font-semibold'>Variedad de libros</p>
					<p className='text-sm'>
						Para todas las especialidades de nuestra institución
					</p>
				</div>
			</div>

			<div className='flex items-center gap-6'>
				<CiBookmark size={40} className='text-slate-600' />

				<div className='space-y-1'>
					<p className='font-semibold'>Reservación</p>
					<p className='text-sm'>
						puedes reservar un libro para su disfrute
					</p>
				</div>
			</div>

			<div className='flex items-center gap-6'>
				<GrWorkshop size={40} className='text-slate-600' />

				<div className='space-y-1'>
					<p className='font-semibold'>Tesis</p>
					<p className='text-sm'>
						Previsualización de tesis
					</p>
				</div>
			</div>
		</div>
	);
};
