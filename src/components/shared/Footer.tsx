import { Link } from 'react-router-dom';
import { socialLinks } from '../../constants/links';
import { FaFacebook } from 'react-icons/fa6';
import React from 'react';

export const Footer = () => {
	return (
		<footer className='py-16 bg-primary px-12 flex justify-between gap-10 text-white text-sm flex-wrap mt-10 md:flex-nowrap'>
			<Link
				to='/'
				className={`text-2xl font-bold tracking-tighter transition-all text-white flex-1`}
			>
				Politecnico Santiago Mariño
			</Link>

			<div className='flex flex-col gap-4 flex-1'>
				<p className='font-semibold uppercase tracking-tighter'>
					Políticas
				</p>

				<nav className='flex flex-col gap-2 text-xs font-medium'>
					<Link to='/Libros'>Libros</Link>
				</nav>
			</div>

			<div className='flex flex-col gap-4 flex-1'>
				<p className='font-semibold uppercase tracking-tighter'>
					Síguenos
				</p>

				<p className='text-xs leading-6'>
					No te pierdas las novedades que nuestra BibliotecaVirtual tiene para
					ti.
				</p>

				<div className='flex'>
					<a
						href='https://www.facebook.com/psmmaturin'
						target='_blank'
						rel='noreferrer'
						className='text-white border border-secondary w-full h-full py-3.5 flex items-center justify-center transition-all hover:bg-secondary hover:text-white mr-2'
						title='Facebook'
					>
						<FaFacebook size={24} />
					</a>
					{socialLinks.map(link => (
						<a
							key={link.id}
							href={link.title === 'Instagram' ? 'https://www.instagram.com/psmmaturin/' : link.href}
							target='_blank'
							rel='noreferrer'
							className='text-white border border-secondary w-full h-full py-3.5 flex items-center justify-center transition-all hover:bg-secondary hover:text-white'
						>
							{link.title === 'Instagram' ? React.cloneElement(link.icon, { size: 32 }) : link.icon}
						</a>
					))}
				</div>
			</div>
		</footer>
	);
};
