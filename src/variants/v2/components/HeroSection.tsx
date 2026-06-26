import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PROJECTS_TITLE_PROGRESS } from './ProjectsSection';

interface HeroSectionProps {
  name?: string;
  title?: string;
}

/** Custom easing — quart/expo out, never the default browser curves. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const NAV_ITEMS = [
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact Me', href: '#contact' },
];

export const HeroSection = ({
  name = 'Richard',
  title = 'Backend and AI Engineer',
}: HeroSectionProps) => {

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDone, setVideoDone] = useState(false);

  /** Free the decoder, GPU surface and download buffer the moment the clip ends. */
  const releaseVideo = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.removeAttribute('src');
      v.load(); // detaches the media resource so the browser can reclaim it
    }
  }, []);

  const handleEnded = useCallback(() => {
    releaseVideo();
    setVideoDone(true); // unmount the <video>; the section's black bg takes over
  }, [releaseVideo]);

  /** Compress the clip to ~2.7s so the white→smoke→black intro is punchy. */
  const handleVideoLoaded = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    video.playbackRate = video.duration / 2.7;
  }, []);

  // Safety net: also release if the user navigates away mid-playback.
  useEffect(() => releaseVideo, [releaseVideo]);

  const smoothScroll = useCallback((targetId: string) => {
    const element = document.querySelector(targetId);
    if (!element) {
      // No matching anchor (e.g. #contact) → ease to the very bottom (footer).
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    // The projects section is a tall scroll-driven stage: its top is
    // scrollYProgress = 0, where the floor/title are still hidden (the title
    // only reaches full opacity at PROJECTS_TITLE_PROGRESS). Landing on the raw
    // top therefore shows a black screen. Scroll instead to the same "title
    // stop" the wheel/stage controller snaps to, so a click reveals exactly
    // what a manual scroll would. Other anchors (#skills, #contact) are normal
    // sections — top-align is correct.
    if (targetId === '#projects') {
      const projects = element as HTMLElement;
      const span = Math.max(1, projects.offsetHeight - window.innerHeight);
      const top = projects.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + PROJECTS_TITLE_PROGRESS * span,
        behavior: 'smooth',
      });
      return;
    }

    (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // The hero → projects hand-off (and every other stage jump) is now owned by
  // the page-level stage-scroll controller in HomeView (useStageScroll).

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#04060d]"
    >
      {/* ── Cinematic video backdrop ──────────────────────────────────────────
          White → smoke → full black (~2.7s). Muted + playsInline so it never
          emits sound and autoplays on mobile. Plays once and holds its final
          black frame, which becomes the seamless lead-in to the dark projects
          section below. */}
      {!videoDone && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/background-video.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={handleVideoLoaded}
          onEnded={handleEnded}
          aria-hidden="true"
        />
      )}

      {/* Legibility layer — keeps the white text readable while the video is
          still in its bright (white/smoke) phase, then disappears into black. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 45%, rgba(4,6,13,0.15) 0%, rgba(4,6,13,0.55) 60%, rgba(4,6,13,0.8) 100%)',
        }}
      />

      {/* ── Hero content (mirrors v1: name, title, phrase, nav) ──────────────── */}
      <div className="relative z-10 w-full max-w-4xl mx-4 flex flex-col items-center">
        <div className="w-full grid grid-cols-[auto_minmax(0,max-content)_auto] gap-x-6 justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 1.0 }}
            className="col-start-1 row-start-1 text-8xl font-thin text-white select-none flex items-center"
          >
            {'{'}
          </motion.span>

          <div className="col-start-2 row-start-1 flex flex-col items-start justify-center py-4 text-left">
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 1.0 }}
              className="text-white text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]"
            >
              Hi, I'm {name.split(' ')[0]}
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 1.18 }}
              className="text-accent-gold text-3xl md:text-4xl lg:text-5xl font-bold mt-3 drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)]"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 1.36 }}
              className="mt-6 tracking-[0.2em] uppercase text-sm font-medium"
            >
              <strong>
                <span className="text-white">From idea →</span>{' '}
                <span className="text-accent-gold">To Product</span>
              </strong>
            </motion.p>
          </div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 1.0 }}
            className="col-start-3 row-start-1 text-8xl font-thin text-white select-none flex items-center"
          >
            {'}'}
          </motion.span>

          <nav className="col-start-2 row-start-2 mt-14 w-full">
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: 1.55 }}
              className="flex items-center justify-start gap-6 text-white/80 text-xl font-medium"
            >
              {NAV_ITEMS.map((item, index, arr) => (
                <li key={item.label} className="flex items-center gap-6 group cursor-pointer">
                  <button
                    onClick={() => smoothScroll(item.href)}
                    className="relative flex items-center transition-colors group-hover:text-accent-gold bg-none border-none p-0 font-inherit"
                  >
                    <span className="absolute -left-5 opacity-0 group-hover:opacity-100 transition-opacity text-accent-gold font-bold">
                      &gt;
                    </span>
                    {item.label}
                  </button>
                  {index < arr.length - 1 && <span className="text-white/20 font-light">|</span>}
                </li>
              ))}
            </motion.ul>
          </nav>
        </div>
      </div>

      {/* Scroll cue — invites the single scroll that hands off to the floor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: EASE_OUT, delay: 2.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/45">Scroll</span>
        <svg className="v2-scrollcue h-5 w-5 text-white/55" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </section>
  );
};
