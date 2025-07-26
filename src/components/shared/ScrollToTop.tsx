import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar el botón cuando el usuario haya scrolleado 300px
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll suave hacia arriba
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-primary text-white p-3 rounded-full shadow-2xl hover:bg-primary-dark transition-all duration-300 hover:scale-110 animate-fade-in border-2 border-white"
          title="Volver arriba"
          style={{
            boxShadow: '0 10px 25px rgba(0, 35, 87, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.8)',
          }}
        >
          <FaArrowUp size={20} />
        </button>
      )}
    </>
  );
}; 