import { projects } from '@/data/projects';
import { skills } from '@/data/skills';

export const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#000814] text-white"
    >
      <div className="max-w-3xl text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Storytelling
        </h1>
        <p className="text-xl text-white/60 mb-4">
          Scroll-driven narrative design — coming soon
        </p>
        <p className="text-sm text-white/30">
          {projects.length} projects &middot; {skills.length} skill domains
        </p>
      </div>
    </section>
  );
};
