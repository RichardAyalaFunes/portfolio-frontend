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
import {
  PROJECTS_TITLE_PROGRESS,
  CARDS_BAND,
  getCardLayout,
} from './ProjectsSection';

/* ──────────────────────────────────────────────────────────────────────────
   Projects — "poster" variant (alternative to the gallery in ProjectsSection).

   Same scroll-driven drive-through mechanic (cards fly in from the right, grow
   to focus, recede), so it slots straight into the page-level stage-scroll
   controller without any changes — it imports the SHARED geometry from
   ProjectsSection. Only the CARD itself is redesigned:

     • the project IMAGE is the whole card — a tall rounded "poster" with a soft
       border (Word-style rounded picture), used as the backdrop for the content
     • a SMALLER, rounded, lightly-translucent glass panel floats OVER the lower
       part of the poster, holding the title, description, tags and buttons — you
       can faintly see the image through it
     • the category badge (AI / Front-end / Backend) is gone

   Toggle between this and the gallery from HomeView.
   ────────────────────────────────────────────────────────────────────────── */

export const ProjectsShowcaseSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const total = projects.length;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Pause the floor's repaint loop whenever the section is off-screen.
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

        {/* Section label */}
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
            <PosterStage
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

/* ── A single project "poster" whose lifecycle is a function of scroll ─────── */
function PosterStage({
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
  // Identical depth choreography to the gallery variant (see ProjectsSection).
  const { w, centers } = getCardLayout(total);
  const c = centers[index];
  const ph = useTransform(cardsProgress, (p) => (p - c) / w);

  const SMALL = 0.18;
  const x = useTransform(ph, [-1, -0.5, 0.5, 1], ['60vw', '0vw', '0vw', '-60vw']);
  const scale = useTransform(ph, [-1, -0.5, 0, 0.5, 1], [SMALL, SMALL, 1, SMALL, SMALL]);
  const opacity = useTransform(
    ph,
    [-1, -0.78, -0.5, 0, 0.5, 0.78, 1],
    [0, 0.5, 0.72, 1, 0.72, 0.5, 0],
  );
  const rotateY = useTransform(ph, [-1, -0.5, 0.5, 1], [20, 0, 0, -20]);
  const zIndex = useTransform(ph, (p) => Math.round(100 - Math.abs(p) * 40));

  // Detail content resolves in near the centered, full-size (forward) state.
  const infoOpacity = useTransform(ph, [-0.26, -0.08, 0.08, 0.26], [0, 1, 1, 0]);
  const infoY = useTransform(ph, [-0.26, 0, 0.26], [16, 0, 16]);
  const pointerEvents = useTransform(ph, (p) =>
    Math.abs(p) < 0.14 ? 'auto' : 'none',
  );

  return (
    <motion.div
      style={{ x, scale, opacity, rotateY, zIndex }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {/* The poster IS the image — and it is WIDER than the content laid over it.
          Wide screens: a ~58vw landscape poster (the image gets room to breathe).
          Mobile: a near-full-width portrait poster instead, which suits a phone's
          tall viewport and the screenshots' focal centres far better. */}
      <motion.article
        style={{ pointerEvents }}
        className="relative aspect-[4/5] w-[88vw] max-w-[440px] overflow-hidden rounded-[30px] ring-1 ring-white/12 shadow-[0_50px_140px_-35px_rgba(0,0,0,0.9)] md:aspect-[16/10] md:w-[58vw] md:max-w-[1000px]"
      >
        <img
          src={project.image}
          alt={project.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
        {/* Legibility wash — darkens the lower poster so the glass panel reads. */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"
          aria-hidden="true"
        />

        {/* Floating glass content panel — centred and narrower than the poster
            (~75% of its width on desktop), rounded to match, lightly translucent
            so the image shows faintly through it and around its sides. */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center md:bottom-6">
          <div className="w-[90%] rounded-[22px] border border-white/15 bg-[#070b16]/45 p-5 backdrop-blur-xl md:w-[75%] md:p-6">
          {/* Title — always present (visible even in the small state) */}
          <h3 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] md:text-[28px]">
            {project.title}
          </h3>

          {/* Detail block — fades in only when the poster owns the center */}
          <motion.div style={{ opacity: infoOpacity, y: infoY }}>
            <p className="mt-2 text-[13px] leading-relaxed text-white/80 md:text-sm">
              {project.detailDescription}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/75"
                >
                  {tag}
                </span>
              ))}
            </div>

            {(project.demoUrl || project.githubUrl) && (
              <div className="mt-5 flex items-center gap-3">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    className="group inline-flex items-center gap-2 rounded-full bg-accent-gold px-4 py-2 text-sm font-bold text-[#04060d] transition-transform hover:-translate-y-0.5"
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
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:border-white/50"
                  >
                    <Github className="h-4 w-4" />
                    Code
                  </a>
                )}
              </div>
            )}
          </motion.div>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}
