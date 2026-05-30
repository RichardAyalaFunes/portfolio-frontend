import { projects } from '@/data/projects';

export const ProjectsSection = () => {
  return (
    <section id="projects" className="min-h-screen bg-[#0a0a0a] text-white py-24">
      <div className="container mx-auto max-w-5xl px-6">
        <h2 className="text-4xl font-bold mb-12">Projects</h2>
        <div className="grid gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-white/10 rounded-2xl p-8 bg-white/5"
            >
              <h3 className="text-2xl font-semibold mb-2">{project.title}</h3>
              <p className="text-white/50">{project.shortDescription}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
