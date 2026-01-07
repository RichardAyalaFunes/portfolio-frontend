import { Project } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '../../lib/utils';

/**
 * Props para el componente ProjectCard
 */
interface ProjectCardProps {
  project: Project;
  className?: string;
}

/**
 * Componente ProjectCard con diseño minimalista profesional
 * Muestra imagen, título y tech stack
 */
export const ProjectCard = ({ project, className }: ProjectCardProps) => {
  return (
    <Card className={cn('overflow-hidden transition-all hover:shadow-lg', className)}>
      {/* Project Image */}
      <div className="relative h-48 w-full overflow-hidden bg-secondary/10">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      <CardHeader>
        <CardTitle className="text-xl">{project.title}</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech, index) => (
            <span
              key={index}
              className={cn(
                'rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium',
                'text-darkText transition-colors hover:bg-accent-gold/20'
              )}
            >
              {tech}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

