import type { Project } from '../../types';
import { Card, CardContent } from './card';
import { cn } from '../../lib/utils';
import { Play, X, Code2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        'group cursor-pointer md:overflow-visible overflow-hidden transition-all duration-300 hover:scale-[1.02] border-1 relative bg-cover bg-center bg-no-repeat',
        isSelected
          ? 'border-transparent shadow-lg'
          : 'border-slate-200 hover:border-primary/50 hover:shadow-lg',
        className
      )}
      style={{
        background: project.cardGradient || 'var(--light-bg-3)'
      }}
      onClick={onSelect}
    >
      {/* Container to prevent hover effect from bleeding outside card's border-radius */}
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
        {/* AI Hover Radial Gradient Effect (Outside to Inside) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#e8fafe]/50 via-[#e2d5ff]/20 to-transparent scale-[2] group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-1000 ease-out mix-blend-overlay" />
      </div>

      {/* Close Button (Expanded State) */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 right-4 z-50 p-2 text-darkNavy hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accordion Content Wrapper */}
      <CardContent className="p-0 relative z-10 w-full">
        {/*
          We use a flex layout.
          Left side: Content (Title, desc, tags, buttons)
          Right side: Image (Slightly popping out)
        */}
        <div className="flex flex-col md:flex-row min-h-[220px]">

          {/* LEFT: Info Container */}
          <div className="flex-1 flex flex-col justify-between p-6 md:p-8 md:pr-4">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-darkText drop-shadow-sm">
                {project.title}
              </h3>

              <div className="relative z-10 w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  {!isSelected ? (
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <p className="text-sm text-gray-700 font-medium max-w-xl leading-relaxed">
                        {project.shortDescription}
                      </p>
                      {/* Tags inline */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {project.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs font-semibold text-slate-600 tracking-wider"
                          >
                            {tag}{index < project.tags.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6 pt-2 pb-4"
                    >
                      <p className="text-sm text-gray-800 font-medium leading-relaxed max-w-2xl">
                        {project.detailDescription}
                      </p>

                      {/* Tech Stack */}
                      {project.techStack && (
                        <div className="pt-4">
                          <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Technologies</h4>
                          <div className="flex flex-wrap gap-3">
                            {project.techStack.map((tech) => (
                              <div key={tech.name} className="flex items-center gap-2 bg-white/60 rounded-full px-3 py-1.5 border border-slate-200">
                                {/* Placeholder for actual icon component mapping */}
                                <div className="w-4 h-4 rounded-full bg-slate-300" />
                                <span className="text-xs font-semibold text-slate-800">{tech.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Action Buttons (Bottom Left) */}
            <div className="flex items-center gap-6 pt-6">
              <AnimatePresence mode="wait">
                {!isSelected && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-2 text-sm font-bold text-darkNavy pb-1 select-none whitespace-nowrap hover:scale-[1.02] transition-transform"
                  >
                    <Info className="h-4 w-4" />
                    <span>Details</span>
                  </motion.span>
                )}
              </AnimatePresence>

              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm font-bold text-darkNavy hover:scale-[1.02] transition-transform"
                >
                  <Code2 className="h-4 w-4" />
                  <span>Code</span>
                </a>
              )}

              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm font-bold text-darkNavy hover:scale-[1.02] transition-transform"
                >
                  <Play className="h-4 w-4" />
                  <span>Play</span>
                </a>
              )}
            </div>
          </div>

          {/* RIGHT: Image Container (Collapsed state only) */}
          <AnimatePresence>
            {!isSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full md:w-[45%] lg:w-[40%] relative min-h-[200px] md:min-h-full"
              >
                <div className="absolute inset-0 md:inset-y-0 md:-right-8 md:origin-right flex items-center justify-end z-20 pointer-events-none">
                  <img
                    src={project.image}
                    alt={`${project.title} preview`}
                    className="w-full h-full md:w-auto md:h-[80%] max-w-full object-cover rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transform md:translate-x-8 border border-white/20 transition-transform duration-500 group-hover:-translate-y-2 pointer-events-auto"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* EXPANDED GALLERY (Bottom of Card) */}
        <AnimatePresence>
          {isSelected && project.gallery && project.gallery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="px-6 md:px-8 pb-8 pt-4"
            >
              <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Project Gallery</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.gallery.map((img, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-md group/img">
                    <img
                      src={img}
                      alt={`${project.title} gallery ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
