import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind CSS de forma segura, resolviendo conflictos
 * y permitiendo clases condicionales.
 * 
 * @param inputs - Clases de Tailwind CSS a combinar
 * @returns String con las clases combinadas y resueltas
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

