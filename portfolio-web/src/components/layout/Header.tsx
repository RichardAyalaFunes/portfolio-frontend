import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Componente Header con navegación
 * Se oculta cuando el Hero Section está visible y aparece con efecto blur al hacer scroll
 */
export const Header = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  useEffect(() => {
    const heroElement = document.getElementById('hero');
    if (!heroElement) {
      // Si no hay hero, mostrar el header por defecto (error handling)
      setIsHeaderVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // El header es visible cuando el hero NO está visible
        setIsHeaderVisible(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(heroElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{
        opacity: isHeaderVisible ? 1 : 0,
        y: isHeaderVisible ? 0 : -20,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'backdrop-blur-md bg-white/80 border-b border-secondary/10',
        'pointer-events-none',
        isHeaderVisible && 'pointer-events-auto'
      )}
      style={{
        visibility: isHeaderVisible ? 'visible' : 'hidden',
      }}
    >
      <nav className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <div className="text-lg font-semibold text-primary">Portfolio</div>
        
        <ul className="flex items-center gap-6">
          <li>
            <a
              href="#projects"
              className="text-sm font-medium text-darkText transition-colors hover:text-accent-gold"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Projects
            </a>
          </li>
          <li>
            <a
              href="#experience"
              className="text-sm font-medium text-darkText transition-colors hover:text-accent-gold"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Experience
            </a>
          </li>
          <li>
            <a
              href="#contact"
              className="text-sm font-medium text-darkText transition-colors hover:text-accent-gold"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </motion.header>
  );
};

