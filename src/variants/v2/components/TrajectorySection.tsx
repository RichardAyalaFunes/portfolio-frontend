import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const PURRFECT_START = new Date(2025, 4, 17);

function calcDuration(start: Date): string {
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  return parts.join(' ') || 'Less than a month';
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  }),
};

/* Elegant dark glass card — same anatomy as v1's TrajectoryCard (mouse-tracked
   gold spotlight + an automatic mirror sheen sweep + lift on hover), tuned for
   the black theme so it reads as refined glass rather than bright. */
const TrajectoryCard = ({
  period,
  company,
  duration,
  bullets,
  entranceDelay,
  sheenDelay,
}: {
  period: string;
  company: string;
  duration: string;
  bullets: string[];
  entranceDelay: number;
  sheenDelay: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      custom={entranceDelay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="group relative flex-1 overflow-hidden rounded-2xl border border-white/10 px-7 py-6 shadow-[0_16px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md transition-colors duration-500 hover:border-accent-gold/30"
      style={{ background: 'linear-gradient(rgba(255,255,255,0.045), rgba(255,255,255,0.015))' }}
    >
      {/* gold mouse spotlight — fades in on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(360px circle at var(--mx,50%) var(--my,50%), rgba(255,195,0,0.10), transparent 45%)',
        }}
        aria-hidden="true"
      />
      {/* ambient mirror sheen — sweeps automatically across the glass on a loop */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            'linear-gradient(110deg, transparent 38%, rgba(255,255,255,0.08) 50%, transparent 62%)',
        }}
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut', delay: sheenDelay }}
        aria-hidden="true"
      />

      {/* content */}
      <div className="relative z-10">
        <div className="mb-3 h-0.5 w-8 rounded-full bg-accent-gold" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/45">{period}</p>
        <h3 className="mt-1 text-xl font-bold text-white">{company}</h3>
        <p className="mt-0.5 text-sm font-medium text-accent-gold">{duration}</p>
        <ul className="mt-4 space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-white/65">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-gold/60" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export const TrajectorySection = () => {
  return (
    <section
      id="trajectory"
      className="v2-root relative flex min-h-screen w-full flex-col justify-center overflow-hidden py-24"
    >
      {/* faint horizon echo for continuity with the gallery floor */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-40"
        style={{
          background: 'radial-gradient(80% 120% at 50% -10%, rgb(150 200 255 / 0.08) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="container relative z-10 mx-auto max-w-5xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40 md:text-left"
        >
          Where I've been
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: EASE_OUT, delay: 0.08 }}
          className="mt-3 text-center text-4xl md:text-6xl font-bold tracking-tight text-white md:text-left"
        >
          Trajectory
        </motion.h2>

        <div className="mt-14 flex flex-col items-stretch gap-4 md:flex-row md:items-center md:gap-0">
          {/* INDRA */}
          <div className="flex flex-1 flex-col items-stretch md:flex-row md:items-center">
            <TrajectoryCard
              period="Feb 2022 – May 2025"
              company="INDRA"
              duration="3+ years"
              bullets={['3 promotions', 'Global consulting · 46 countries', 'Exceptional Execution Award 2023']}
              entranceDelay={0}
              sheenDelay={0}
            />
            <div className="flex justify-center py-2 md:px-4 md:py-0">
              <ArrowRight className="hidden h-5 w-5 text-white/20 md:block" />
              <div className="h-6 w-px bg-white/10 md:hidden" />
            </div>
          </div>

          {/* PURRFECT HIRE */}
          <TrajectoryCard
            period="May 2025 – Present"
            company="PURRFECT HIRE"
            duration={calcDuration(PURRFECT_START)}
            bullets={['Technical Lead', 'AI-native recruitment startup', 'B2B SaaS · Global operations']}
            entranceDelay={0.15}
            sheenDelay={2.6}
          />
        </div>
      </div>
    </section>
  );
};
