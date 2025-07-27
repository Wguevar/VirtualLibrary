import { Link } from 'react-router-dom';

const brands = [
  {
    image: '/img/brands/architecture-building-castle-svgrepo-com.svg',
    alt: 'Arquitectura',
    label: 'Arquitectura',
  },
  {
    image: '/img/brands/cap-civil-engineer-construction-svgrepo-com.svg',
    alt: 'Ingeniería Civil',
    label: 'Ingeniería Civil',
  },
  {
    image: '/img/brands/factory-svgrepo-com.svg',
    alt: 'Ingeniería Industrial',
    label: 'Ingenieria Industrial',
  },
  {
    image: '/img/brands/programming-monitor-svgrepo-com.svg',
    alt: 'Ingeniería en Sistemas',
    label: 'Ingenieria en Sistemas',
  },
  {
    image: '/img/brands/tech-circuit-svgrepo-com.svg',
    alt: 'Ingeniería Electrónica',
    label: 'Ingenieria Electrónica',
  },
  {
    image: '/img/brands/toolbox-svgrepo-com.svg',
    alt: 'Mantenimiento Mecánico',
    label: 'Ingeniería en Mantenimiento Mecánico',
  },
  {
    image: '/img/brands/voltmeter-svgrepo-com.svg',
    alt: 'Ingeniería Eléctrica',
    label: 'Ingenieria Eléctrica',
  },
];

export const Brands = () => {
  return (
    <div className="flex flex-col items-center gap-3 pt-16 pb-12">
      <h2 className="font-bold text-2xl">Libros para todas las especialidades</h2>

      <p className="w-2/3 text-center text-sm md:text-base">
        Tenemos mucha información en nuestros libros que pueden ser de ayuda
      </p>

      <div className="flex flex-wrap justify-center gap-6 mt-8 max-w-full">
        {brands.map((brand, index) => (
          <Link
            key={index}
            to={`/libros?carrera=${encodeURIComponent(brand.label)}`}
            className="w-20 flex flex-col items-center justify-center hover:scale-105 transition-transform"
          >
            <img
              src={brand.image}
              alt={brand.alt}
              className="max-w-full max-h-16 object-contain cursor-pointer"
            />
            <span className="mt-2 text-center text-sm font-medium">
              {brand.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};