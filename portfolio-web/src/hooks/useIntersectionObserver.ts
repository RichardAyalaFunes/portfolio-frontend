import { useEffect, useState, RefObject } from 'react';

/**
 * Hook personalizado para observar la intersección de un elemento con el viewport
 * 
 * @param ref - Referencia al elemento a observar
 * @param options - Opciones para el IntersectionObserver
 * @returns Boolean indicando si el elemento está visible en el viewport
 */
export function useIntersectionObserver(
  ref: RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      // Si no hay elemento, por defecto asumimos que está visible
      // para asegurar que el header sea visible (error handling)
      setIsIntersecting(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

