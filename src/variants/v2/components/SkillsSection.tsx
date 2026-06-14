import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { skills, skillLevelValues } from '@/data/skills';
import { LINKEDIN_URL } from '@/config/constants';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const SkillsSection = () => {
  return (
    <section
      id="skills"
      className="v2-root relative w-full overflow-hidden py-28 md:py-36"
    >
      {/* faint floor echo behind the content for continuity with the gallery */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-40"
        style={{
          background:
            'radial-gradient(80% 120% at 50% 120%, rgb(255 195 0 / 0.10) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="container relative z-10 mx-auto max-w-5xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40"
        >
          Capabilities
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: EASE_OUT, delay: 0.08 }}
          className="mt-3 text-4xl md:text-6xl font-bold tracking-tight text-white"
        >
          Skills by domain
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill, i) => {
            const pct = skillLevelValues[skill.level];
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.07 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-500 hover:border-accent-gold/40"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-white">{skill.domain}</h3>
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-gold/80">
                    {skill.level}
                  </span>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: EASE_OUT, delay: 0.2 + i * 0.07 }}
                    className="h-full rounded-full bg-accent-gold"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Contact / LinkedIn anchor — matches the hero "Contact Me" target */}
        <motion.a
          id="contact"
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          whileHover={{ y: -3 }}
          className="group mt-16 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-500 hover:border-accent-gold/50"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Let's build something
            </p>
            <p className="mt-1 text-xl font-bold text-white">
              From idea → <span className="text-accent-gold">To Product</span>
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-gold text-[#04060d] transition-transform duration-500 group-hover:translate-x-1">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </motion.a>
      </div>
    </section>
  );
};
