import type { Skill } from '../types';

/**
 * Datos de habilidades y competencias
 * Valores según BC005
 */
export const skills: Skill[] = [
  {
    id: 'ai',
    domain: 'AI',
    level: 'Advanced',
  },
  {
    id: 'backend',
    domain: 'Backend',
    level: 'Advanced',
  },
  {
    id: 'frontend',
    domain: 'Frontend',
    level: 'Intermediate',
  },
  {
    id: 'data-analysis',
    domain: 'Data analysis',
    level: 'Intermediate',
  },
  {
    id: 'devops',
    domain: 'DevOps',
    level: 'Basic',
  },
  {
    id: 'cloud',
    domain: 'Cloud',
    level: 'Intermediate',
  },
];

/**
 * Mapeo de niveles de habilidad a valores numéricos (para visualización)
 */
export const skillLevelValues: Record<Skill['level'], number> = {
  Basic: 25,
  Intermediate: 50,
  Advanced: 75,
  Expert: 100,
};

/**
 * Mapeo de niveles de habilidad a colores
 */
export const skillLevelColors: Record<Skill['level'], string> = {
  Basic: 'bg-secondary/30',
  Intermediate: 'bg-accent-yellow/60',
  Advanced: 'bg-accent-gold',
  Expert: 'bg-accent-gold',
};

