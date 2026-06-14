import { useEffect } from 'react';
import { PROJECTS_TITLE_PROGRESS, getProjectFocusProgress } from '../components/ProjectsSection';

/* ──────────────────────────────────────────────────────────────────────────
   Stage / "slice" scroll controller for variant 2.

   Instead of free scrolling, the page advances through a fixed list of key
   states ("stops"), one per scroll intent:

     hero → projects title → project 1 (focus) → project 2 → project 3
          → trajectory → achievements → skills → (free scroll to footer)

   • One wheel/key/swipe = advance exactly one stop.
   • The jump is animated over ANIM_MS so the user *sees* the transition
     (card flying in + growing, or a section easing up).
   • While animating AND for MARGIN_MS afterwards, all scroll input is
     swallowed — so frantic scrolling (or a high-resolution wheel firing 30
     events) can't skip past a project. The user always lands on, and pauses
     at, each state.
   • Scrolling up reverses through the same stops.
   • Past the last staged stop (skills) we hand control back to native scroll
     so the footer / contact stay reachable normally.

   Disabled entirely under prefers-reduced-motion.
   ────────────────────────────────────────────────────────────────────────── */

const ANIM_MS = 800;   // transition duration the user watches
const MARGIN_MS = 700; // extra "ignore input" window after arrival
const SLICE_IDS = ['trajectory', 'achievements', 'skills'] as const;

export function useStageScroll(projectCount: number) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let locked = false;
    let raf = 0;
    let touchStartY = 0;

    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const absTop = (el: HTMLElement) =>
      el.getBoundingClientRect().top + window.scrollY;

    /** Ordered, de-duplicated list of absolute scrollY stop positions. */
    const buildStops = (): number[] => {
      const stops: number[] = [0]; // hero
      const projects = document.getElementById('projects');
      if (projects) {
        const span = Math.max(1, projects.offsetHeight - window.innerHeight);
        const top = absTop(projects);
        stops.push(top + PROJECTS_TITLE_PROGRESS * span);
        for (const p of getProjectFocusProgress(projectCount)) {
          stops.push(top + p * span);
        }
      }
      for (const id of SLICE_IDS) {
        const el = document.getElementById(id);
        if (el) stops.push(absTop(el));
      }
      return [...new Set(stops.map((s) => Math.round(s)))].sort((a, b) => a - b);
    };

    const nearestIndex = (stops: number[], y: number) => {
      let best = 0;
      let bestDist = Infinity;
      stops.forEach((s, i) => {
        const d = Math.abs(s - y);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    };

    const animateTo = (target: number) => {
      const start = window.scrollY;
      const dist = target - start;
      if (Math.abs(dist) < 2) return;
      locked = true;
      let t0: number | null = null;
      const step = (now: number) => {
        if (t0 === null) t0 = now;
        const p = Math.min((now - t0) / ANIM_MS, 1);
        window.scrollTo(0, start + dist * easeInOut(p));
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          window.setTimeout(() => {
            locked = false;
          }, MARGIN_MS);
        }
      };
      raf = requestAnimationFrame(step);
    };

    /** Advance one stop in `dir`; returns false when native scroll should win. */
    const advance = (dir: 1 | -1): boolean => {
      const stops = buildStops();
      const y = window.scrollY;
      const lastStaged = stops[stops.length - 1];
      // Below the last staged stop → free scroll (footer / contact CTA).
      if (y > lastStaged + 8) return false;
      const next = nearestIndex(stops, y) + dir;
      if (next < 0 || next >= stops.length) return false;
      animateTo(stops[next]);
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (locked) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < 1) return;
      if (advance(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
    };

    const BLOCK_KEYS = ['ArrowDown', 'PageDown', ' ', 'Spacebar', 'ArrowUp', 'PageUp', 'Home', 'End'];
    const onKey = (e: KeyboardEvent) => {
      // Ignore typing in inputs (e.g. the project search field).
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (locked) {
        if (BLOCK_KEYS.includes(e.key)) e.preventDefault();
        return;
      }
      if (['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(e.key)) {
        if (advance(1)) e.preventDefault();
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        if (advance(-1)) e.preventDefault();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (locked) {
        e.preventDefault();
        return;
      }
      const dy = touchStartY - (e.touches[0]?.clientY ?? 0); // >0 → scrolling down
      if (Math.abs(dy) > 8) {
        if (advance(dy > 0 ? 1 : -1)) e.preventDefault();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [projectCount]);
}
