import { motion } from 'framer-motion';
import { skills, skillLevelScore, SKILL_MAX_SCORE } from '@/data/skills';

/* ──────────────────────────────────────────────────────────────────────────
   Hand-built skills radar (spider) chart — variant 2.

   Deliberately NOT a charting library. v1 uses recharts, whose injected SVG
   brings its own focus outlines, invisible hit-areas and overlay layers that
   make clicks/borders behave unpredictably. Here every line is drawn by us, the
   whole graphic is pointer-events:none, and `focusable=false` kills the IE/Edge
   focus rect — so it is purely presentational and can never steal interaction.

   Geometry: 6 domains on 6 axes (60° apart, first axis at the top), each scored
   0–5. Concentric hexagon rings mark each integer level; the gold polygon is the
   score shape.
   ────────────────────────────────────────────────────────────────────────── */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Canvas / chart geometry (SVG user units; scales fluidly via viewBox).
const VIEW_W = 560;
const VIEW_H = 480;
const CX = VIEW_W / 2;
const CY = 232;
const RADIUS = 150;          // distance from center to the level-5 ring
const LABEL_GAP = 30;        // how far labels sit beyond the outer ring
const LEVELS = SKILL_MAX_SCORE;
const AXES = skills.length;   // 6

/** Angle (radians) of axis `i`, starting straight up and going clockwise. */
const angleOf = (i: number) => (-90 + (360 / AXES) * i) * (Math.PI / 180);

/** Point on axis `i` at a 0..5 value, in SVG coordinates. */
function point(i: number, value: number): [number, number] {
  const r = (value / LEVELS) * RADIUS;
  const a = angleOf(i);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

const toPath = (pts: [number, number][]) =>
  pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export const SkillRadar = () => {
  const scores = skills.map((s) => skillLevelScore[s.level]);

  // Outer ring vertices (level 5) and the score polygon.
  const outer = skills.map((_, i) => point(i, LEVELS));
  const dataPts = skills.map((_, i) => point(i, scores[i]));

  // Concentric grid rings, one per integer level.
  const rings = Array.from({ length: LEVELS }, (_, l) =>
    skills.map((_, i) => point(i, l + 1)),
  );

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="mx-auto block w-auto max-w-full"
      preserveAspectRatio="xMidYMid meet"
      // Size by HEIGHT so the graph fills a chosen slice of the viewport on big
      // screens (width follows from the viewBox aspect, and max-w-full keeps it
      // from overflowing on narrow phones — there height shrinks automatically).
      style={{
        pointerEvents: 'none',
        outline: 'none',
        overflow: 'visible',
        height: 'clamp(300px, 60vh, 660px)',
      }}
      role="img"
      aria-label="Skill levels by domain"
      focusable="false"
    >
      {/* ── Grid rings ──────────────────────────────────────────────────── */}
      {rings.map((ring, l) => (
        <polygon
          key={`ring-${l}`}
          points={toPath(ring)}
          fill="none"
          stroke="rgb(150 200 255 / 0.16)"
          strokeWidth={1}
        />
      ))}

      {/* ── Axis spokes ─────────────────────────────────────────────────── */}
      {outer.map(([x, y], i) => (
        <line
          key={`axis-${i}`}
          x1={CX}
          y1={CY}
          x2={x}
          y2={y}
          stroke="rgb(150 200 255 / 0.18)"
          strokeWidth={1}
        />
      ))}

      {/* ── Score polygon (the spider shape) ────────────────────────────── */}
      <motion.polygon
        points={toPath(dataPts)}
        fill="rgb(255 195 0 / 0.18)"
        stroke="#ffc300"
        strokeWidth={2.5}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />

      {/* ── Vertex dots + per-axis labels ───────────────────────────────── */}
      {skills.map((skill, i) => {
        const [dx, dy] = dataPts[i];
        const a = angleOf(i);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const lx = CX + (RADIUS + LABEL_GAP) * cos;
        const ly = CY + (RADIUS + LABEL_GAP) * sin;

        const anchor = cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle';
        // Nudge top/bottom labels clear of the vertex they sit over/under.
        const dyName = sin < -0.25 ? -6 : sin > 0.25 ? 16 : 4;

        return (
          <g key={skill.id}>
            <motion.circle
              cx={dx}
              cy={dy}
              r={4.5}
              fill="#ffc300"
              stroke="#04060d"
              strokeWidth={2}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.5 + i * 0.06 }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />

            <text x={lx} y={ly + dyName} textAnchor={anchor}>
              <tspan
                fill="#ffffff"
                fontSize={15}
                fontWeight={700}
                style={{ letterSpacing: '0.01em' }}
              >
                {skill.domain}
              </tspan>
              <tspan
                x={lx}
                dy={18}
                fill="rgb(255 195 0 / 0.85)"
                fontSize={12}
                fontWeight={600}
              >
                {skill.level}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
};
