import { useEffect, useRef } from 'react';
import { Linkedin, Github } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LINKEDIN_URL } from '../../config/constants';

export const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const inner = innerRef.current;
    if (!footer || !inner) return;

    const update = () => {
      const { top } = footer.getBoundingClientRect();
      const vh = window.innerHeight;
      const fh = footer.offsetHeight;
      const ih = inner.offsetHeight;

      // progress: 0 = footer just entering from bottom, 1 = footer top at viewport top
      const progress = Math.max(0, Math.min(1, (vh - top) / vh));

      // endY: translateY needed to visually center the inner block in the footer
      const endY = Math.max(0, (fh - ih) / 2);

      inner.style.transform = `translateY(${endY * progress}px)`;
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <footer
      ref={footerRef}
      id="contact"
      className="bg-primary text-lightText px-4 md:px-8"
      style={{ minHeight: '80vh' }}
    >
      <div ref={innerRef} className="container mx-auto max-w-6xl will-change-transform">
        <div className="flex flex-col items-center justify-center gap-6 text-center py-12 md:py-16">
          <h2 className="text-3xl font-bold md:text-4xl">Get in Touch</h2>
          <p className="text-lightText/80">
            Feel free to reach out for professional opportunities or inquiries.
          </p>

          <div className="flex items-center gap-6">
            <a
              href={LINKEDIN_URL}
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

          <div className="mt-8 border-t border-lightText/20 pt-6 text-sm text-lightText/60">
            <p>© {new Date().getFullYear()} Richard Xavier Ayala Funes. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
