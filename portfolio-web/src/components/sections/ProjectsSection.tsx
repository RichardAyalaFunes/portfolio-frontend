import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { projects } from '../../data/projects';
import type { Project } from '../../types';
import { ProjectCard } from '../ui/ProjectCard';
import { cn } from '../../lib/utils';


export const ProjectsSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filter projects by search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const lowerTerm = searchTerm.toLowerCase();
    return projects.filter(p =>
      p.title.toLowerCase().includes(lowerTerm) ||
      p.shortDescription.toLowerCase().includes(lowerTerm) ||
      p.tags.some(t => t.toLowerCase().includes(lowerTerm))
    );
  }, [searchTerm]);

  const aiProjects = filteredProjects.filter((p) => p.category === 'AI Project');
  const backendProjects = filteredProjects.filter((p) => p.category === 'Backend Project');
  const frontendProjects = filteredProjects.filter((p) => p.category === 'Front-end Project');

  const renderCategoryList = (categoryProjects: typeof projects) => {
    if (categoryProjects.length === 0) return null;

    return (
      <div className="mb-10 last:mb-0">
        <div className="flex flex-col gap-8">
          {categoryProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={selectedProject?.id === project.id}
              onSelect={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="projects" className="min-h-screen bg-lightBg-3 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">

        <h2 className="sr-only">Projects</h2>

        <div className="w-full flex justify-center">

          {/* Single Column: Accordion List */}
          <div className="flex flex-col space-y-8 w-full">
            {/* Search Input */}
            <div className="relative w-full max-w-xl mx-auto mb-4">
              <div className={cn("absolute inset-y-0 flex items-center pointer-events-none transition-all duration-300 left-4")}>
                <Search className={cn("transition-all duration-300", searchTerm ? "h-5 w-5 text-gray-700" : "h-4 w-4 text-gray-500")} />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full rounded-full border border-gray-300 bg-white/50 pr-6 py-3 placeholder-muted-gray focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all shadow-sm",
                  searchTerm ? "pl-11 text-darkText" : "pl-10 text-gray-500"
                )}
              />
            </div>

            {/* Project Lists */}
            <div className="w-full">
              {renderCategoryList(aiProjects)}
              {renderCategoryList(backendProjects)}
              {renderCategoryList(frontendProjects)}

              {filteredProjects.length === 0 && (
                <div className="text-center py-12 text-muted-gray">
                  No projects found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
