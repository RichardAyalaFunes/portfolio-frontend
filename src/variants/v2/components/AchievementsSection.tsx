import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Cpu, Server, Compass, type LucideIcon } from 'lucide-react';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const fadeUpPremium = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT, delay },
  }),
};

// ── Organic blob SVG paths (viewBox="-60 -60 120 120") ────────────────────────
const blobAI = 'M 10 -54 C 36 -54 58 -22 58 6 C 58 34 36 56 8 56 C -20 56 -54 32 -54 4 C -54 -24 -24 -54 10 -54 Z';
const blobBackend = 'M 4 -50 C 30 -56 60 -28 60 4 C 60 36 36 56 4 56 C -28 56 -58 32 -56 2 C -54 -28 -22 -44 4 -50 Z';
const blobProduct = 'M 14 -50 C 42 -56 62 -24 60 8 C 58 40 32 58 2 56 C -28 54 -56 28 -54 -4 C -52 -36 -20 -56 14 -50 Z';

interface Bullet {
  highlight: string;
  detail: string;
}

interface DomainData {
  titleLine1: string;
  titleLine2: string;
  blobPath: string;
  blobColor: string;
  accent: string;
  glow: string;
  Icon: LucideIcon;
  tags: string[];
  bullets: Bullet[];
  reversed: boolean;
}

const domains: DomainData[] = [
  {
    titleLine1: 'AI &',
    titleLine2: 'Agents',
    blobPath: blobAI,
    blobColor: 'rgba(255, 195, 0, 0.22)',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.22)',
    Icon: Cpu,
    tags: ['Claude + MCP', 'LangGraph', 'n8n', 'EU AI Act'],
    bullets: [
      { highlight: '2 production multi-agent systems', detail: 'Claude + MCP · recruiting pipeline & B2B sales · running daily' },
      { highlight: 'RAG chatbot', detail: 'OpenAI · Llama 3.2 · LangChain · LangGraph · n8n · PostgreSQL' },
      { highlight: '15 min → 10 sec', detail: 'workflow automation via OpenAI, Python, n8n' },
      { highlight: 'EU AI Act compliance', detail: 'research for production AI deployments' },
    ],
    reversed: false,
  },
  {
    titleLine1: 'Backend &',
    titleLine2: 'Systems',
    blobPath: blobBackend,
    blobColor: 'rgba(16, 185, 129, 0.22)',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.20)',
    Icon: Server,
    tags: ['FastAPI', 'Clean Architecture', 'Docker', 'Azure'],
    bullets: [
      { highlight: 'ATS backend', detail: 'FastAPI · Clean Architecture · PostgreSQL · pytest · CI/CD' },
      { highlight: 'ETL pipelines & route optimization', detail: 'A* algorithm · Python · GDB · QGIS' },
      { highlight: 'Chrome extension', detail: 'structured data extraction in under 5 seconds' },
      { highlight: 'Cloud & infra', detail: 'Docker · Podman · Red Hat Linux · Digital Ocean · Azure' },
    ],
    reversed: true,
  },
  {
    titleLine1: 'Product &',
    titleLine2: 'Leadership',
    blobPath: blobProduct,
    blobColor: 'rgba(96, 165, 250, 0.26)',
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.20)',
    Icon: Compass,
    tags: ['ATS end-to-end', 'Figma + React', 'SCRUM PO', 'B2B SaaS'],
    bullets: [
      { highlight: 'AI-powered ATS, end-to-end', detail: 'market research → UX (Figma) → production (React, Retool)' },
      { highlight: 'Teams of 2–8', detail: 'across development, processes, and technical audits' },
      { highlight: 'Full software lifecycle', detail: 'requirements · estimation · development · deployment' },
      { highlight: 'Product Owner (SCRUM)', detail: 'cross-functional stakeholder management' },
    ],
    reversed: false,
  },
];

const DomainCard = ({
  titleLine1,
  titleLine2,
  blobPath,
  blobColor,
  accent,
  glow,
  Icon,
  tags,
  bullets,
  reversed,
  animDelay,
}: DomainData & { animDelay: number }) => {
  // Mouse-tracked interaction: 3D tilt + radial spotlight (kept from v1).
  const cardRef = useRef<HTMLDivElement>(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mvY, [-0.5, 0.5], [4, -4]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mvX, [-0.5, 0.5], [-4, 4]), { stiffness: 150, damping: 18 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mvX.set(px - 0.5);
    mvY.set(py - 0.5);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };

  const handleLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  /** Visual panel — title + animated icon blob + tags */
  const visualPanel = (
    <div className="flex flex-col justify-between p-7 md:w-[42%]">
      <div className="mt-2 flex items-center">
        <div className="flex-1">
          <h3 className="text-[44px] font-bold leading-[1.05] text-white" style={{ letterSpacing: '-0.03em' }}>
            {titleLine1}
            <br />
            {titleLine2}
          </h3>
        </div>

        {/* Icon blob — drifts/breathes, soft glow behind, overlaps the title */}
        <div className="relative -ml-12 h-[160px] w-[160px] shrink-0">
          <div className="absolute inset-6 rounded-full opacity-80 blur-2xl" style={{ background: glow }} aria-hidden="true" />
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
            className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/55 transition-all duration-300 hover:-translate-y-0.5 hover:text-white/85"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  /** Achievement bullets */
  const contentPanel = (
    <div className="flex flex-1 flex-col justify-center p-6 md:p-7">
      <ul className="space-y-0.5">
        {bullets.map(({ highlight, detail }) => (
          <li key={highlight} className="group/row relative rounded-xl py-2.5 pl-5 pr-3 transition-colors">
            <span
              className="absolute left-1.5 top-1/2 w-[3px] -translate-y-1/2 rounded-full opacity-50 transition-all"
              style={{ background: accent, height: '34%' }}
            />
            <p className="text-[13px] font-bold leading-snug text-white" style={{ letterSpacing: '-0.01em' }}>
              {highlight}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-white/45">{detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <motion.div custom={animDelay} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={fadeUpPremium}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        whileHover={{ y: -5 }}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_18px_55px_-26px_rgba(0,0,0,0.9)] backdrop-blur-md transition-shadow duration-500 hover:shadow-[0_40px_80px_-28px_rgba(0,0,0,1)]"
      >
        {/* Mouse-tracked radial spotlight in the card's accent hue */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(560px circle at var(--mx, 50%) var(--my, 50%), ${glow}, transparent 45%)` }}
          aria-hidden="true"
        />
        {/* Accent hairline along the top edge */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-90"
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

export const AchievementsSection = () => {
  return (
    <section
      id="achievements"
      className="v2-root relative flex min-h-screen w-full flex-col justify-center overflow-hidden py-24"
    >
      <div className="container relative z-10 mx-auto max-w-5xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40 md:text-left"
        >
          What I Build
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: EASE_OUT, delay: 0.08 }}
          className="mt-3 text-center text-4xl md:text-6xl font-bold tracking-tight text-white md:text-left"
        >
          Achievements
        </motion.h2>

        <div className="mt-12 flex flex-col gap-4">
          {domains.map((domain, idx) => (
            <DomainCard key={domain.titleLine1} {...domain} animDelay={idx * 0.12} />
          ))}
        </div>
      </div>
    </section>
  );
};
