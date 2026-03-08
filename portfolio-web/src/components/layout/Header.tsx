import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

/**
 * Componente Header con navegación
 * Se oculta cuando el Hero Section está visible y aparece con efecto blur al hacer scroll
 */
export const Header = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;

    const observeHero = () => {
      const heroElement = document.getElementById('hero');

      if (!heroElement) {
        // If we are on the home page but hero is not yet rendered, retry
        if (location.pathname === '/') {
          timeoutId = setTimeout(observeHero, 100);
        } else {
          // If we are not on the home page (e.g. /chat), always show header
          setIsHeaderVisible(true);
        }
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          // El header es visible cuando el hero NO está visible
          setIsHeaderVisible(!entry.isIntersecting);
        },
        {
          threshold: 0.1,
        }
      );

      observer.observe(heroElement);
    };

    observeHero();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [location.pathname]);

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
        'backdrop-blur-md bg-white/50 border-b border-secondary/10',
        'pointer-events-none',
        isHeaderVisible && 'pointer-events-auto'
      )}
      style={{
        visibility: isHeaderVisible ? 'visible' : 'hidden',
      }}
    >
      <nav className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="text-lg font-semibold text-primary">Richard A.</Link>

        <ul className="flex items-center gap-6">
          <li>
            <Link to="/chat" className="text-sm font-medium text-accent-cyan transition-colors hover:text-accent-gold">
              Chat with AI
            </Link>
          </li>
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
          {/* <li>
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
          </li> */}
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

