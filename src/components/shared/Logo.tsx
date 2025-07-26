import { Link } from 'react-router-dom';

export const Logo = () => {
	return (
		<Link
			to='/'
			className={`flex items-center gap-2 text-2xl font-bold tracking-tighter transition-all`}
		>
			<img src="/img/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
			<p className='hidden lg:block'>
				Biblioteca
				<span className='text-orange-400'>Virtual</span>
			</p>

			<p className='flex text-4xl lg:hidden'>
				<span className='-skew-x-6 text-black'>B</span>
				<span className='text-orange-400 skew-x-6'>V</span>
			</p>
		</Link>
	);
};
