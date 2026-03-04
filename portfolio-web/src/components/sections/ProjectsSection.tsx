import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Code2, Play, Box, Server, Database, LayoutTemplate, Braces, Terminal, X } from 'lucide-react';
import { projects } from '../../data/projects';
import type { Project, ProjectCategory } from '../../types';
import { ProjectCard } from '../ui/ProjectCard';
import { cn } from '../../lib/utils';

const categoryTitles: Record<ProjectCategory, string> = {
  'AI Project': 'AI PROJECTS',
  'Backend Project': 'BACKEND PROJECTS',
  'Front-end Project': 'FRONTEND PROJECTS',
};

// Map string icon names to Lucide components (simple fallback mapping)
const getTechIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    python: Terminal,
    tensorflow: Box,
    scikitlearn: Box,
    huggingface: Braces,
    spacy: Braces,
    nodejs: Server,
    postgresql: Database,
    redis: Database,
    react: LayoutTemplate,
    typescript: Code2,
    tailwindcss: LayoutTemplate
  };
  return iconMap[iconName.toLowerCase()] || Box;
};

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

  const renderCategoryList = (categoryProjects: typeof projects, category: ProjectCategory) => {
    if (categoryProjects.length === 0) return null;

    return (
      <div className="mb-10 last:mb-0">
        <h3 className="mb-4 inline-block pb-1 border-b-2 border-accent-gold text-xs font-black uppercase tracking-widest text-secondary">
          {categoryTitles[category]}
        </h3>
        <div className="flex flex-col gap-4">
          {categoryProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={selectedProject?.id === project.id}
              onSelect={() => setSelectedProject(project)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="projects" className="min-h-screen bg-lightBg-1 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">

        <h2 className="sr-only">Projects</h2>

        <div className={cn(
          "grid gap-8 transition-all duration-500",
          selectedProject ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-4xl mx-auto"
        )}>

          {/* Left Column: Master List */}
          <div className="flex flex-col space-y-8">
            {/* Search Input */}
            <div className="relative w-full">
              <div className={cn("absolute inset-y-0 flex items-center pointer-events-none transition-all duration-300 left-4")}>
                <Search className={cn("transition-all duration-300", searchTerm ? "h-5 w-5 text-gray-700" : "h-4 w-4 text-gray-500")} />
              </div>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full rounded-full border border-gray-300 bg-white/50 pr-6 py-2 placeholder-muted-gray focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold transition-all",
                  searchTerm ? "pl-11 text-darkText" : "pl-10 text-gray-500"
                )}
              />
            </div>

            {/* Project Lists */}
            <div>
              {renderCategoryList(aiProjects, 'AI Project')}
              {renderCategoryList(backendProjects, 'Backend Project')}
              {renderCategoryList(frontendProjects, 'Front-end Project')}

              {filteredProjects.length === 0 && (
                <div className="text-center py-12 text-muted-gray">
                  No projects found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detail Panel */}
          <AnimatePresence mode="wait">
            {selectedProject && (
              <motion.div
                key={selectedProject.id}
                initial={{ opacity: 0, y: 20, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="sticky top-24 h-fit rounded-3xl bg-white p-8 shadow-xl border border-gray-100 flex flex-col"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-6 right-6 text-muted-gray hover:text-darkNavy transition-colors"
                  aria-label="Close project details"
                >
                  <X className="h-6 w-6" />
                </button>

                {/* Project Header */}
                <h2 className="text-3xl md:text-4xl font-bold text-darkNavy mb-4 pr-12 lg:pr-0">
                  {selectedProject.title}
                </h2>
                <hr className="w-full border-t border-gray-200 mb-6" />

                {/* Project Description */}
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  {selectedProject.detailDescription}
                </p>

                {/* Timestamp placeholder since it's not in the data yet, but requested */}
                <p className="text-xs text-muted-gray mb-8">
                  Last updated: Feb 11, 2026
                </p>

                {/* Technologies List */}
                {selectedProject.techStack && selectedProject.techStack.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-darkNavy uppercase mb-4 tracking-wider">
                      Technologies Used
                    </h4>
                    <ul className="space-y-3">
                      {selectedProject.techStack.map((tech, idx) => {
                        const Icon = getTechIcon(tech.icon);
                        return (
                          <li key={idx} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-darkNavy">
                              <Icon className="h-4 w-4" />
                            </div>
                            {tech.name}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 mb-10">
                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border-2 border-darkNavy bg-transparent px-6 py-2.5 font-bold text-darkNavy transition-all hover:bg-darkNavy hover:text-white"
                    >
                      <Code2 className="h-4 w-4" />
                      &lt;/&gt; Code
                    </a>
                  )}
                  {selectedProject.demoUrl && (
                    <a
                      href={selectedProject.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border-2 border-darkNavy bg-transparent px-6 py-2.5 font-bold text-darkNavy transition-all hover:bg-darkNavy hover:text-white"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      &gt; Play
                    </a>
                  )}
                </div>

                {/* Media Gallery */}
                {selectedProject.gallery && selectedProject.gallery.length > 0 && (
                  <div className="space-y-6 mt-auto">
                    {selectedProject.gallery.map((imgUrl, idx) => (
                      <div key={idx} className="overflow-hidden rounded-2xl shadow-md border border-gray-100">
                        <img
                          src={imgUrl}
                          alt={`${selectedProject.title} screenshot ${idx + 1}`}
                          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
