import { motion } from 'framer-motion';
import { Highlight } from '../../types';
import { cn } from '../../lib/utils';

/**
 * Props para el componente HeroSection
 */
interface HeroSectionProps {
  name?: string;
  title?: string;
  highlights?: Highlight[];
  portrait?: string;
}

/**
 * Componente Hero Section (Portrait)
 * Ocupa el 100vh y contiene el texto principal y highlights
 */
export const HeroSection = ({
  name = 'Your Name',
  title = 'Professional Title',
  highlights = [
    { id: '1', text: 'Full Stack Developer' },
    { id: '2', text: 'AI Enthusiast' },
    { id: '3', text: 'Problem Solver' },
  ],
  portrait,
}: HeroSectionProps) => {
  return (
    <section
      id="hero"
      className={cn(
        'relative flex min-h-screen flex-col items-center justify-center',
        'bg-gradient-to-b from-white to-secondary/5',
        'px-4 py-16 md:px-8'
      )}
    >
      <div className="container mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
        {/* Portrait Image/Illustration */}
        {portrait ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-8"
          >
            <img
              src={portrait}
              alt="Portrait"
              className="h-64 w-64 rounded-full object-cover shadow-lg md:h-80 md:w-80"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-8 flex h-64 w-64 items-center justify-center rounded-full bg-secondary/10 md:h-80 md:w-80"
          >
            <span className="text-6xl text-secondary/40 md:text-8xl">👤</span>
          </motion.div>
        )}

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-balance text-5xl font-bold text-darkText md:text-7xl lg:text-8xl"
        >
          {name}
        </motion.h1>

        {/* Professional Title */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xl text-darkText/70 md:text-2xl"
        >
          {title}
        </motion.p>

        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            {highlights.map((highlight, index) => (
              <motion.span
                key={highlight.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className={cn(
                  'rounded-full bg-accent-gold px-6 py-2 text-sm font-medium',
                  'text-darkText shadow-md transition-all hover:scale-105',
                  'md:text-base'
                )}
              >
                {highlight.text}
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

