/**
 * Categorías de proyectos disponibles
 */
export type ProjectCategory = 'AI Project' | 'Backend Project' | 'Front-end Project';

/**
 * Interfaz para un proyecto en el portfolio
 */
export interface Project {
  id: string;
  category: ProjectCategory;
  title: string;
  image: string; // Used as thumbnail or main image
  shortDescription: string;
  detailDescription: string;
  tags: string[]; // Shown on left column
  techStack?: { name: string; icon: string }[]; // Optional explicit icons for the right column
  demoUrl?: string;
  githubUrl?: string;
  gallery?: string[];
}

/**
 * Interfaz para los highlights del hero section
 */
export interface Highlight {
  id: string;
  text: string;
}

/**
 * Interfaz para la información del perfil profesional
 */
export interface Profile {
  name: string;
  title: string;
  highlights: Highlight[];
  portrait?: string;
}

/**
 * Interfaz para una experiencia laboral
 */
export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string; // Formato: "YYYY-MM" para ordenamiento
  endDate: string | 'Present'; // "YYYY-MM" o "Present"
  description?: string;
  responsibilities: string[];
  recognition?: string;
}

/**
 * Niveles de habilidad disponibles
 */
export type SkillLevel = 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';

/**
 * Interfaz para una habilidad/competencia
 */
export interface Skill {
  id: string;
  domain: string;
  level: SkillLevel;
}

