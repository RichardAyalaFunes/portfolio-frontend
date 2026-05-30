import { skills } from '@/data/skills';

export const SkillsSection = () => {
  return (
    <section id="skills" className="min-h-screen bg-[#0f0f0f] text-white py-24">
      <div className="container mx-auto max-w-5xl px-6">
        <h2 className="text-4xl font-bold mb-12">Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <div
              key={skill.domain}
              className="border border-white/10 rounded-xl p-6 bg-white/5"
            >
              <h3 className="text-lg font-semibold">{skill.domain}</h3>
              <p className="text-white/40 text-sm mt-1">{skill.level}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
