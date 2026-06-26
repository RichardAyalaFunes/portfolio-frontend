import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';
import { projects } from '@/data/projects';
import type { Project } from '@/types';

/* ──────────────────────────────────────────────────────────────────────────
   Scroll-driven "drive-through" projects gallery.

   The section is tall (one viewport-height slot per project, plus lead-in /
   tail). A sticky stage stays pinned while the user scrolls, and scroll
   progress drives everything:

     • [0   .. 0.12]  the 3D floor + horizon glow rise into view
     • [0.12 .. 0.92] each project card flies in from the RIGHT, grows to the
                      center (info fades in), then shrinks and exits LEFT while
                      the next card flies in from the right — a continuous
                      cross-over. Scrolling up plays it all in reverse, for free,
                      because every value is derived from scrollYProgress.
   ────────────────────────────────────────────────────────────────────────── */

const CATEGORY_LABEL: Record<Project['category'], string> = {
  'AI Project': 'AI',
  'Backend Project': 'Backend',
  'Front-end Project': 'Front-end',
};

/* ── v2-only card backgrounds ───────────────────────────────────────────────
   The shared project data carries a `cardGradient` tuned for the LIGHT "Classic"
   variant. Several of those are pale (cream / lavender) and become unreadable on
   THIS dark "Cinematic" stage — white text on a light card. Rather than edit the
   shared data (which would also change the Classic design at its own URL), this
   variant keeps its OWN backgrounds: dark and lightly translucent like the first
   card, each tinted with an accent colour pulled from that project's image, so
   the card reads as "the same colour as the screenshot". Projects are few and
   stable here, so a small id-keyed map beats threading per-variant colours
   through the data layer. Unmapped ids fall back to the shared gradient. */
const V2_CARD_BG: Record<string, string> = {
  // Real Time Avatars → deep LiveAvatar navy/blue
  'ai-1':
    'radial-gradient(120% 80% at 75% 8%, rgb(90 130 220 / 0.16) 0%, transparent 55%), linear-gradient(140deg, rgb(20 40 96 / 0.84) 0%, rgb(8 14 38 / 0.92) 100%)',
  // Multimodal agent → indigo/violet of the chat "sparkle" accent
  'ai-2':
    'radial-gradient(120% 80% at 78% 8%, rgb(140 109 242 / 0.18) 0%, transparent 55%), linear-gradient(140deg, rgb(46 38 96 / 0.84) 0%, rgb(12 12 34 / 0.92) 100%)',
  // Portfolio → dark hero navy with a gold glow (the hero's accent text)
  'frontend-1':
    'radial-gradient(120% 80% at 80% 6%, rgb(212 168 70 / 0.14) 0%, transparent 52%), linear-gradient(140deg, rgb(26 33 84 / 0.84) 0%, rgb(10 14 40 / 0.92) 100%)',
};

/* ── Shared stage geometry ───────────────────────────────────────────────────
   The card timeline and the page's stage-scroll controller must agree on where
   each "key state" sits inside this section's scroll, so the math lives here and
   is consumed by both. */

// scrollYProgress at which the floor + "Projects" title is fully revealed
// (before any card enters).
export const PROJECTS_TITLE_PROGRESS = 0.1;

// Sub-range of scrollYProgress over which the cards play (0..1 = cardsProgress).
export const CARDS_BAND: [number, number] = [0.12, 0.92];

/** Per-card window half-width (w) and center positions in cardsProgress space. */
export function getCardLayout(total: number) {
  const w = 1 / (1.5 * total + 0.5);
  const centers = Array.from({ length: total }, (_, i) =>
    total === 1 ? 0.5 : w + (i * (1 - 2 * w)) / (total - 1),
  );
  return { w, centers };
}

/** scrollYProgress values where each project is centered + fully grown (focus). */
export function getProjectFocusProgress(total: number): number[] {
  const { centers } = getCardLayout(total);
  const [a, b] = CARDS_BAND;
  return centers.map((c) => a + c * (b - a));
}

export const ProjectsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const total = projects.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // The animated 3D floor repaints every frame, so only let it run while the
  // section actually owns the viewport. scrollYProgress is clamped to 0 above
  // the section (hero) and 1 below it (footer), and the floor is faded out at
  // both ends anyway — so pausing outside (0,1) costs nothing visually but
  // stops all repaints when the user is elsewhere on the page. Driving the
  // CSS animation-play-state straight off the scroll value keeps it on the
  // GPU/compositor path with zero React re-renders.
  const floorPlayState = useTransform(scrollYProgress, (v) =>
    v > 0.001 && v < 0.999 ? 'running' : 'paused',
  );

  // Floor reveal (first slice of the scroll).
  const meshOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1]);
  const meshRise = useTransform(scrollYProgress, [0, 0.12], [60, 0]);
  const horizonOpacity = useTransform(scrollYProgress, [0.02, 0.14], [0, 1]);
  const titleOpacity = useTransform(
    scrollYProgress,
    [0.02, PROJECTS_TITLE_PROGRESS, 0.16],
    [0, 1, 0],
  );

  // Cards play across the middle band; remap to a clean 0..1 timeline.
  const cardsProgress = useTransform(scrollYProgress, CARDS_BAND, [0, 1]);

  return (
    <section
      ref={containerRef}
      id="projects"
      className="v2-root relative"
      style={{ height: `${(total + 1) * 100}vh` }}
    >
      {/* Pinned stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* 3D floor */}
        <motion.div
          className="v2-grid-wrap absolute inset-0"
          style={{ opacity: meshOpacity, y: meshRise }}
          aria-hidden="true"
        >
          <motion.div className="v2-grid" style={{ animationPlayState: floorPlayState }} />
          <motion.div className="v2-horizon" style={{ opacity: horizonOpacity }} />
        </motion.div>

        <div className="v2-vignette" aria-hidden="true" />

        {/* Section label — appears with the floor, fades as the first card arrives */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="absolute top-[16%] left-1/2 -translate-x-1/2 z-10 text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/40">
            Selected Work
          </p>
          <h2 className="mt-3 text-4xl md:text-6xl font-bold tracking-tight text-white">
            Projects
          </h2>
        </motion.div>

        {/* Card stack */}
        <div className="absolute inset-0 z-20">
          {projects.map((project, i) => (
            <ProjectStage
              key={project.id}
              project={project}
              index={i}
              total={total}
              cardsProgress={cardsProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── A single project card whose whole lifecycle is a function of scroll ──── */
function ProjectStage({
  project,
  index,
  total,
  cardsProgress,
}: {
  project: Project;
  index: number;
  total: number;
  cardsProgress: MotionValue<number>;
}) {
  // Two-phase "depth" choreography — a card moves through Z, not just X:
  //   ph -1  → -0.5 : slides in from the far right to dead-center, staying SMALL
  //                   (it reads as far away, deep in the scene, just travelling)
  //   ph -0.5 → 0   : grows at center → rushes forward toward the viewer (focus)
  //   ph  0  → 0.5  : shrinks at center → recedes back into depth
  //   ph 0.5 → 1    : slides out to the left, small, as the next card enters
  // Centers are spaced 1.5 windows apart so one card's left-exit overlaps the
  // next card's right-entrance exactly — a clean hand-off with no center clash.
  const { w, centers } = getCardLayout(total);
  const c = centers[index];
  const ph = useTransform(cardsProgress, (p) => (p - c) / w);

  const SMALL = 0.18;
  // X only changes on the wings (right→center, then center→left); it holds dead
  // center through the entire grow/shrink so depth and lateral motion never mix.
  const x = useTransform(ph, [-1, -0.5, 0.5, 1], ['60vw', '0vw', '0vw', '-60vw']);
  // Scale only changes at center — the "moving forward / backward" beat.
  const scale = useTransform(ph, [-1, -0.5, 0, 0.5, 1], [SMALL, SMALL, 1, SMALL, SMALL]);
  // Dimmer while far/small, brightest when forward — reinforces the depth read.
  const opacity = useTransform(
    ph,
    [-1, -0.78, -0.5, 0, 0.5, 0.78, 1],
    [0, 0.5, 0.72, 1, 0.72, 0.5, 0],
  );
  // Slight yaw only while travelling on the wings → it banks along the 3D floor.
  const rotateY = useTransform(ph, [-1, -0.5, 0.5, 1], [20, 0, 0, -20]);
  const zIndex = useTransform(ph, (p) => Math.round(100 - Math.abs(p) * 40));

  // Detail content only resolves in near the centered, full-size (forward) state.
  const infoOpacity = useTransform(ph, [-0.26, -0.08, 0.08, 0.26], [0, 1, 1, 0]);
  const infoY = useTransform(ph, [-0.26, 0, 0.26], [16, 0, 16]);
  // Only the focused card receives pointer events (so links are clickable).
  const pointerEvents = useTransform(ph, (p) =>
    Math.abs(p) < 0.14 ? 'auto' : 'none',
  );

  return (
    <motion.div
      style={{ x, scale, opacity, rotateY, zIndex }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <motion.article
        style={{ pointerEvents }}
        className="relative w-[min(90vw,760px)] overflow-hidden rounded-[28px] border border-none shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)]"
      >
        {/* Card surface — dark, image-tinted gradient owned by THIS variant
            (see V2_CARD_BG); falls back to the shared gradient if unmapped. */}
        <div
          className="absolute inset-0"
          style={{ background: V2_CARD_BG[project.id] ?? project.cardGradient ?? '#0b1224' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060912]/35 via-transparent to-[#060912]/55" aria-hidden="true" />

        {/* Banner image */}
        <div className="relative h-44 md:h-56 w-full overflow-hidden">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <span className="absolute left-5 top-5 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm">
            {CATEGORY_LABEL[project.category]}
          </span>
        </div>

        {/* Title — always present (visible even in the small "square" state) */}
        <div className="relative px-7 pt-5">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            {project.title}
          </h3>
        </div>

        {/* Detail block — fades in only when the card owns the center */}
        <motion.div style={{ opacity: infoOpacity, y: infoY }} className="relative px-7 pb-7 pt-3">
          <p className="text-sm md:text-[15px] leading-relaxed text-white/80">
            {project.detailDescription}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>

          {(project.demoUrl || project.githubUrl) && (
            <div className="mt-6 flex items-center gap-3">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  className="group inline-flex items-center gap-2 rounded-full bg-accent-gold px-5 py-2.5 text-sm font-bold text-[#04060d] transition-transform hover:-translate-y-0.5"
                >
                  Live Demo
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white/85 transition-colors hover:border-white/50"
                >
                  <Github className="h-4 w-4" />
                  Code
                </a>
              )}
            </div>
          )}
        </motion.div>
      </motion.article>
    </motion.div>
  );
}
