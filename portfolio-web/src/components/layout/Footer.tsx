import { Linkedin, Github } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Componente Footer con información de contacto
 * Usa el color primario (#001d3d) como fondo y texto claro (#fefae0)
 */
export const Footer = () => {
  return (
    <footer
      id="contact"
      className={cn(
        'bg-primary text-lightText',
        'px-4 py-12',
        'md:px-8 md:py-16'
      )}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Get in Touch</h2>
          <p className="text-lightText/80">
            Feel free to reach out for professional opportunities or inquiries.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://www.linkedin.com/in/richard-xavier-ayala-funes/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 rounded-full px-6 py-3',
                'bg-accent-gold text-darkText',
                'font-medium transition-all hover:scale-105 hover:shadow-lg',
                'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-primary'
              )}
              aria-label="LinkedIn Profile"
            >
              <Linkedin className="h-5 w-5" />
              <span>LinkedIn</span>
            </a>

            <a
              href="https://github.com/RichardAyalaFunes"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-2 rounded-full px-6 py-3',
                'border-2 border-accent-gold text-lightText',
                'font-medium transition-all hover:scale-105 hover:bg-accent-gold hover:text-darkText',
                'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-primary'
              )}
              aria-label="GitHub Profile"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="mt-8 border-t border-lightText/20 pt-6 text-sm text-lightText/60">
            <p>© {new Date().getFullYear()} Richard Xavier Ayala Funes. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

