import { projects } from '../../data/projects';
import type { ProjectCategory } from '../../types';
import { ProjectCard } from '../ui/ProjectCard';
import { cn } from '../../lib/utils';

/**
 * Mapeo de categorías a títulos de sección
 */
const categoryTitles: Record<ProjectCategory, string> = {
  'AI Project': 'AI Projects',
  'Backend Project': 'Backend Projects',
  'Front-end Project': 'Frontend Projects',
};

/**
 * Componente ProjectsSection
 * Muestra proyectos agrupados por categoría en un grid responsivo
 */
export const ProjectsSection = () => {
  // Filtrar proyectos por categoría
  const aiProjects = projects.filter((p) => p.category === 'AI Project');
  const backendProjects = projects.filter((p) => p.category === 'Backend Project');
  const frontendProjects = projects.filter((p) => p.category === 'Front-end Project');

  /**
   * Renderiza una sección de proyectos por categoría
   */
  const renderCategorySection = (
    categoryProjects: typeof projects,
    category: ProjectCategory
  ) => {
    if (categoryProjects.length === 0) return null;

    return (
      <div className="mb-16 last:mb-0">
        <h2 className="mb-8 text-center text-3xl font-bold text-darkText md:text-4xl">
          {categoryTitles[category]}
        </h2>
        <div
          className={cn(
            'grid grid-cols-1 gap-6',
            'md:grid-cols-2',
            'lg:grid-cols-3'
          )}
        >
          {categoryProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <section
      id="projects"
      className={cn(
        'container mx-auto max-w-6xl px-4 py-16',
        'md:px-8 md:py-24'
      )}
    >
      <h1 className="mb-12 text-center text-4xl font-bold text-darkText md:text-5xl">
        Projects
      </h1>

      {renderCategorySection(aiProjects, 'AI Project')}
      {renderCategorySection(backendProjects, 'Backend Project')}
      {renderCategorySection(frontendProjects, 'Front-end Project')}
    </section>
  );
};

