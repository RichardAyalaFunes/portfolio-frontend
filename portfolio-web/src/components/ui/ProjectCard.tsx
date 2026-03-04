import type { Project } from '../../types';
import { Card, CardContent } from './card';
import { cn } from '../../lib/utils';
import { Play } from 'lucide-react';

/**
 * Props para el componente ProjectCard
 */
interface ProjectCardProps {
  project: Project;
  isSelected?: boolean;
  onSelect: () => void;
  className?: string;
}

/**
 * Componente ProjectCard para la lista "Master"
 */
export const ProjectCard = ({ project, isSelected, onSelect, className }: ProjectCardProps) => {
  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] border-1 relative bg-cover bg-center bg-no-repeat',
        isSelected
          ? 'border-primary shadow-lg ring-1 ring-primary/50'
          : 'border-slate-200 hover:border-primary/50 hover:shadow-lg bg-lightBg-3',
        className
      )}
      onClick={onSelect}
    >
      {/* AI Hover Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#e8fafe] via-[#e2d5ff] to-[#f5f8ff] bg-[length:400%_auto] bg-left opacity-0 group-hover:opacity-100 group-hover:bg-right transition-all duration-1000 ease-in-out pointer-events-none" />

      {/* Background Overlay for Text Readability */}
      <div className="absolute inset-0 bg-white/85 group-hover:bg-white/0 transition-colors duration-500 pointer-events-none" />

      <CardContent className="p-0 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 p-5">
          {/* Main Content Area (Left) */}
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-bold text-darkText group-hover:text-darkText transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-muted-gray mt-1 line-clamp-2">
                {project.shortDescription}
              </p>
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-6 pt-2">
              {/* <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="text-sm font-bold text-darkNavy hover:text-accent-gold transition-colors"
              >
                Details
              </button> */}

              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-sm font-bold text-darkNavy hover:text-accent-gold transition-colors"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Play</span>
                </a>
              )}
            </div>
          </div>

          {/* Tech Stack / Tags Area (Right) */}
          <div className="flex w-full md:w-1/3 flex-row md:flex-col flex-wrap md:flex-nowrap gap-2 justify-start md:justify-center md:items-end">
            {project.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className={cn(
                  'rounded-full bg-gray-300/10 px-3 py-1 text-xs font-medium',
                  'text-muted-gray whitespace-nowrap'
                )}
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="text-xs text-muted-gray">+{project.tags.length - 4} more</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
