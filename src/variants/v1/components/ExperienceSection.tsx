import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Cpu, Server, Compass, ArrowRight, LinkedinIcon, type LucideIcon } from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { LINKEDIN_URL } from '@/config/constants';
import { skills, skillLevelValues } from '@/data/skills';

const PURRFECT_START = new Date(2025, 4, 17);

function calcDuration(start: Date): string {
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  return parts.join(' ') || 'Less than a month';
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as const, delay },
  }),
};

const fadeUpPremium = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const, delay },
  }),
};

// ── Organic blob SVG paths (viewBox="-60 -60 120 120") ────────────────────────
// Each shape is a distinct paint-splash / amoeba form; user can adjust per card.
const blobAI      = 'M 10 -54 C 36 -54 58 -22 58 6 C 58 34 36 56 8 56 C -20 56 -54 32 -54 4 C -54 -24 -24 -54 10 -54 Z';
const blobBackend = 'M 4 -50 C 30 -56 60 -28 60 4 C 60 36 36 56 4 56 C -28 56 -58 32 -56 2 C -54 -28 -22 -44 4 -50 Z';
const blobProduct = 'M 14 -50 C 42 -56 62 -24 60 8 C 58 40 32 58 2 56 C -28 54 -56 28 -54 -4 C -52 -36 -20 -56 14 -50 Z';

// ── Domain card data ──────────────────────────────────────────────────────────
interface Bullet { highlight: string; detail: string }

interface DomainData {
  titleLine1: string;
  titleLine2: string;
  blobPath: string;
  /** CSS rgba/hex color for the blob fill */
  blobColor: string;
  /** Solid accent color (icon, bullet bar, spotlight hue) */
  accent: string;
  /** Soft rgba version of the accent — used for the mouse-tracked glow */
  glow: string;
  Icon: LucideIcon;
  tags: string[];
  bullets: Bullet[];
  /** When true, the visual panel (title + icon) is on the right */
  reversed: boolean;
}

const domains: DomainData[] = [
  {
    titleLine1: 'AI &',
    titleLine2: 'Agents',
    blobPath: blobAI,
    blobColor: 'rgba(255, 195, 0, 0.20)',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.18)',
    Icon: Cpu,
    tags: ['Claude + MCP', 'LangGraph', 'n8n', 'EU AI Act'],
    bullets: [
      { highlight: '2 production multi-agent systems',   detail: 'Claude + MCP · recruiting pipeline & B2B sales · running daily' },
      { highlight: 'RAG chatbot',                        detail: 'OpenAI · Llama 3.2 · LangChain · LangGraph · n8n · PostgreSQL' },
      { highlight: '15 min → 10 sec',                    detail: 'workflow automation via OpenAI, Python, n8n' },
      { highlight: 'EU AI Act compliance',               detail: 'research for production AI deployments' },
    ],
    reversed: false,
  },
  {
    titleLine1: 'Backend &',
    titleLine2: 'Systems',
    blobPath: blobBackend,
    blobColor: 'rgba(34, 197, 94, 0.20)',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.16)',
    Icon: Server,
    tags: ['FastAPI', 'Clean Architecture', 'Docker', 'Azure'],
    bullets: [
      { highlight: 'ATS backend',                          detail: 'FastAPI · Clean Architecture · PostgreSQL · pytest · CI/CD' },
      { highlight: 'ETL pipelines & route optimization',   detail: 'A* algorithm · Python · GDB · QGIS' },
      { highlight: 'Chrome extension',                     detail: 'structured data extraction in under 5 seconds' },
      { highlight: 'Cloud & infra',                        detail: 'Docker · Podman · Red Hat Linux · Digital Ocean · Azure' },
    ],
    reversed: true,
  },
  {
    titleLine1: 'Product &',
    titleLine2: 'Leadership',
    blobPath: blobProduct,
    blobColor: 'rgba(147, 197, 253, 0.35)',
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.16)',
    Icon: Compass,
    tags: ['ATS end-to-end', 'Figma + React', 'SCRUM PO', 'B2B SaaS'],
    bullets: [
      { highlight: 'AI-powered ATS, end-to-end',   detail: 'market research → UX (Figma) → production (React, Retool)' },
      { highlight: 'Teams of 2–8',                 detail: 'across development, processes, and technical audits' },
      { highlight: 'Full software lifecycle',      detail: 'requirements · estimation · development · deployment' },
      { highlight: 'Product Owner (SCRUM)',         detail: 'cross-functional stakeholder management' },
    ],
    reversed: false,
  },
];

// ── DomainCard component ──────────────────────────────────────────────────────
const DomainCard = ({
  titleLine1, titleLine2,
  blobPath, blobColor, accent, glow,
  Icon, tags, bullets, reversed,
  animDelay,
}: DomainData & { animDelay: number }) => {

  // Mouse-tracked interaction: drives both the 3D tilt and the radial spotlight.
  const cardRef = useRef<HTMLDivElement>(null);
  const mvX = useMotionValue(0); // -0.5 .. 0.5 (horizontal position from center)
  const mvY = useMotionValue(0); // -0.5 .. 0.5 (vertical position from center)
  const rotateX = useSpring(useTransform(mvY, [-0.5, 0.5], [5, -5]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mvX, [-0.5, 0.5], [-5, 5]), { stiffness: 150, damping: 18 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mvX.set(px - 0.5);
    mvY.set(py - 0.5);
    // Spotlight position handed to the radial-gradient overlay via CSS vars.
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };

  const handleLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  /** Left (or right when reversed) — title + icon blob + tags */
  const visualPanel = (
    <div className="flex flex-col justify-between p-8 md:w-[42%]">

      {/* Title row + blob/icon side-by-side */}
      <div className="mt-4 flex items-center">
        <div className="flex-1">
          <h3
            className="text-[48px] font-bold leading-[1.05] text-darkText"
            style={{ letterSpacing: '-0.03em' }}
          >
            {titleLine1}<br />{titleLine2}
          </h3>
        </div>

        {/*
          Icon blob — pulled LEFT with negative margin so it visually overlaps
          into the title area. The blob slowly drifts/breathes, and a soft glow
          sits behind the icon. The blob SVG stays semi-transparent so the title
          remains readable beneath it.
        */}
        <div className="relative -ml-12 h-[160px] w-[160px] shrink-0">
          {/* soft accent glow behind the icon */}
          <div
            className="absolute inset-6 rounded-full opacity-70 blur-2xl"
            style={{ background: glow }}
            aria-hidden="true"
          />
          {/* back blob — slow counter-rotation in the soft accent hue, creating
              an organic, liquid overlap with the front blob */}
          <motion.svg
            viewBox="-60 -60 120 120"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            animate={{ rotate: -360, scale: [1.04, 0.96, 1.04] }}
            transition={{
              rotate: { duration: 48, repeat: Infinity, ease: 'linear' },
              scale: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{ transformOrigin: 'center' }}
          >
            <path d={blobPath} fill={glow} />
          </motion.svg>
          {/* front blob — continuous rotation + breathing scale */}
          <motion.svg
            viewBox="-60 -60 120 120"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
            animate={{ rotate: 360, scale: [1, 1.08, 0.95, 1] }}
            transition={{
              rotate: { duration: 34, repeat: Infinity, ease: 'linear' },
              scale: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{ transformOrigin: 'center' }}
          >
            <path d={blobPath} fill={blobColor} />
          </motion.svg>
          {/* icon — gentle float, lifts on card hover */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon
              className="relative z-10 h-12 w-12 transition-transform duration-500 group-hover:scale-110"
              style={{ color: accent }}
              strokeWidth={1.2}
            />
          </motion.div>
        </div>
      </div>

      {/* Tech tags */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-darkText/15 px-2.5 py-0.5 text-[11px] font-semibold text-darkText/50 transition-all duration-300 hover:-translate-y-0.5 hover:text-darkText/70"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  /** Right (or left when reversed) — achievement bullets */
  const contentPanel = (
    <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
      <ul className="space-y-0.5">
        {bullets.map(({ highlight, detail }) => (
          <li
            key={highlight}
            className="group/row relative rounded-xl py-2.5 pl-5 pr-3 transition-colors"
          >
            {/* accent bar — short by default, extends on row hover to anchor the eye */}
            <span
              className="absolute left-1.5 top-1/2 w-[3px] -translate-y-1/2 rounded-full opacity-40 transition-all "
              style={{ background: accent, height: '34%' }}
            />
            <p
              className="text-[13px] font-bold leading-snug text-darkText"
              style={{ letterSpacing: '-0.01em' }}
            >
              {highlight}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-darkText/45">{detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <motion.div
      custom={animDelay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUpPremium}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        whileHover={{ y: -6 }}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        className="group relative overflow-hidden rounded-3xl border border-darkText/10 bg-white shadow-[0_10px_40px_-18px_rgba(0,0,0,0.18)] transition-shadow duration-500 hover:shadow-[0_34px_70px_-20px_rgba(0,0,0,0.28)]"
      >
        {/* Mouse-tracked radial spotlight in the card's own accent hue */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(560px circle at var(--mx, 50%) var(--my, 50%), ${glow}, transparent 45%)`,
          }}
          aria-hidden="true"
        />
        {/* Accent hairline along the top edge */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-80"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          aria-hidden="true"
        />

        <div className={`relative flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
          {visualPanel}
          {contentPanel}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Trajectory card ───────────────────────────────────────────────────────────
// These cards are NOT clickable, so they earn "life" ambiently: a light sheen
// sweeps across each one on a loop (the mirror/reflex effect from the LinkedIn
// button), plus a gold mouse-spotlight and a lift on hover.
const TrajectoryCard = ({
  period, company, duration, bullets, entranceDelay, sheenDelay,
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
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="group relative flex-1 overflow-hidden rounded-2xl border border-white/10 px-6 py-5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-colors duration-500 hover:border-white/25"
      style={{ background: 'linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}
    >
      {/* gold mouse spotlight — fades in on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(360px circle at var(--mx,50%) var(--my,50%), rgba(255,195,0,0.13), transparent 45%)' }}
        aria-hidden="true"
      />
      {/* ambient mirror sheen — sweeps automatically across the glass on a loop */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{ background: 'linear-gradient(110deg, transparent 38%, rgba(255,255,255,0.13) 50%, transparent 62%)' }}
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut', delay: sheenDelay }}
        aria-hidden="true"
      />

      {/* content */}
      <div className="relative z-10">
        <div className="mb-3 h-0.5 w-8 rounded-full bg-accent-gold" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">{period}</p>
        <h3 className="mt-1 text-xl font-bold text-white">{company}</h3>
        <p className="mt-0.5 text-sm font-medium text-accent-gold">{duration}</p>
        <ul className="mt-4 space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-white/70">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-gold/60" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

// ── Skills radar ──────────────────────────────────────────────────────────────
// Visual summary of skill breadth — folded into Experience (no standalone section).
const SkillsRadar = () => {
  const chartData = skills.map((skill) => ({
    domain: skill.domain,
    value: skillLevelValues[skill.level],
    fullMark: 100,
  }));

  return (
    <motion.div
      className="h-full w-full"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ResponsiveContainer width="100%" height={380} className="focus:outline-none" style={{ outline: 'none' }}>
        <RadarChart data={chartData} margin={{ top: 24, right: 28, bottom: 24, left: 28 }} style={{ outline: 'none' }}>
          <PolarGrid stroke="hsl(var(--secondary))" strokeOpacity={0.3} strokeWidth={1.5} />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: '#000814', fontSize: 14, fontWeight: 600 }}
            tickLine={{ stroke: 'hsl(var(--secondary))', strokeWidth: 1, strokeOpacity: 0.5 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            tickCount={5}
            axisLine={{ stroke: 'hsl(var(--secondary))', strokeWidth: 1.5, strokeOpacity: 0.3 }}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="#ffc300"
            fill="#ffc300"
            fillOpacity={0.7}
            strokeWidth={3}
            animationDuration={1200}
            animationEasing="ease-out"
            label={(props: any) => {
              const { x, y, value } = props;
              let levelStr = '';
              if (value <= 25) levelStr = 'Basic';
              else if (value <= 50) levelStr = 'Intermediate';
              else if (value <= 75) levelStr = 'Advanced';
              else levelStr = 'Expert';
              return (
                <text x={x} y={y} dy={-10} fill="#000814" fontSize={12} fontWeight={600} textAnchor="middle">
                  {levelStr}
                </text>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// ── Main section ──────────────────────────────────────────────────────────────
export const ExperienceSection = () => {
  return (
    <section id="experience" className="bg-lightBg-1">

      {/* ── Trajectory ─────────────────────────────────────────────────────── */}
      <div
        className="w-full px-4 py-14 md:px-8"
        style={{ background: 'linear-gradient(to bottom right, #001f3d 50%, #061632 100%)' }}
      >
        <div className="container mx-auto max-w-5xl">
          <motion.p
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/40"
          >
            Trajectory
          </motion.p>

          <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:gap-0">

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
      </div>

      {/* ── What I Build ───────────────────────────────────────────────────── */}
      <div className="w-full px-4 py-16 md:px-8" style={{ background: '#ebebeb' }}>
        <div className="container mx-auto max-w-5xl">

          <motion.p
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUpPremium}
            className="mb-10 text-xs font-semibold uppercase tracking-[0.2em] text-darkText/40"
          >
            What I Build
          </motion.p>

          <div className="flex flex-col gap-5">
            {domains.map((domain, idx) => (
              <DomainCard
                key={domain.titleLine1}
                {...domain}
                animDelay={idx * 0.12}
              />
            ))}
          </div>

          {/* ── Skills + LinkedIn (integrated) ────────────────────────────── */}
          <div className="mt-12 grid grid-cols-1 gap-8 md:mt-16 md:grid-cols-2 md:items-center md:gap-12">

            {/* Left — expertise quote + LinkedIn CTA */}
            <div className="flex flex-col justify-center gap-8">
              <motion.div
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUpPremium}
              >
                {/* <p className="text-xs font-semibold uppercase tracking-[0.2em] text-darkText/40">Skills</p> */}
                <blockquote className="relative mt-4 pl-7">
                  {/* <span className="absolute -top-3 left-0 select-none font-serif text-6xl leading-none text-accent-gold/40">
                    &ldquo;
                  </span> */}
                  <p className="text-2xl font-semibold leading-snug tracking-tight text-darkText md:text-[26px]">
                    Skills by domain →
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-darkText/40">
                    1% BETTER EVERYDAY
                  </p>
                </blockquote>
              </motion.div>

              <motion.a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                custom={0.12}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUpPremium}
                whileHover={{ y: -3 }}
                className="group relative flex items-center gap-5 overflow-hidden rounded-3xl border border-[#0077B5]/30 bg-white p-6 shadow-[0_10px_40px_-20px_rgba(0,119,181,0.5)] transition-all duration-500 hover:border-[#0077B5]/60 hover:shadow-[0_26px_60px_-22px_rgba(0,119,181,0.6)]"
              >
                {/* blue gradient that fills the card on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'linear-gradient(120deg, #0a66c2 0%, #0077B5 55%, #00a0dc 100%)' }}
                  aria-hidden="true"
                />
                {/* sheen sweep */}
                <div
                  className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-full"
                  style={{ background: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.28) 50%, transparent 65%)' }}
                  aria-hidden="true"
                />

                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#0077B5]/35 text-[#0077B5] transition-colors duration-500 group-hover:border-white/60 group-hover:text-white">
                  <LinkedinIcon className="h-5 w-5" />
                </div>
                <div className="relative z-10 min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0077B5]/70 transition-colors duration-500 group-hover:text-white/80">
                    LinkedIn Profile
                  </p>
                  <p className="mt-0.5 text-base font-bold text-darkText transition-colors duration-500 group-hover:text-white">
                    29+ certifications · Complete career history
                  </p>
                </div>
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0077B5] transition-all duration-500 group-hover:translate-x-1 group-hover:bg-white">
                  <ArrowRight className="h-4 w-4 text-white transition-colors duration-500 group-hover:text-[#0077B5]" />
                </div>
              </motion.a>
            </div>

            {/* Right — skills radar */}
            <motion.div
              custom={0.18}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUpPremium}
              className="rounded-3xl border border-darkText/10 bg-white p-4 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.18)]"
            >
              <SkillsRadar />
            </motion.div>

          </div>

        </div>
      </div>

    </section>
  );
};
