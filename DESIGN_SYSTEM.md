# Design System — Portfolio Frontend

## Architecture overview

This is a single React + Vite app that hosts three visually distinct sub-applications, each living under a separate route prefix. Because they share one build, the global `index.css` (Tailwind base + shared tokens) is always loaded. Each sub-app can additionally import its own CSS file in its top-level layout/view component so that scoped styles only activate on that route.

```
src/
  index.css                    ← global base: Tailwind imports, resets, shared keyframes
  styles/                      ← (recommended) per-sub-app CSS files
    portfolio.css              ← portfolio tokens & utilities (import in HomeView)
    chat.css                   ← chat tokens & utilities (import in ChatLayout)
    real-time.css              ← real-time tokens & animations (import in RealTimeLayout)
  components/
    sections/                  ← Portfolio sub-app components
    chat/                      ← Chat sub-app components
    real-time/                 ← Real-time sub-app components
      RealTimeStyles.css       ← current real-time CSS (precursor to real-time.css)
```

The per-sub-app CSS approach keeps styles scoped to their route — no leakage, no specificity battles. Each file defines its own CSS custom properties, either in `:root` (if the values are unique enough to not conflict) or inside a scoped selector such as `.rt-typography {}` or `[data-app="real-time"] {}`.

---

## Sub-applications

| Route | Name | Theme personality |
|---|---|---|
| `/` | Portfolio | Light, warm, retro — gold & navy palette |
| `/chat` | AI Chat | Clean light gradient — slate-to-blue, indigo accents |
| `/real-time` | Real Time | Dark cinematic — deep navy, glassmorphism, indigo/violet |

---

## Sub-app design tokens

### Portfolio (`/`)

| Token | Value | Usage |
|---|---|---|
| Background layers | `#f3f3f3` / `#fbfbfb` / `#fff` | Section backgrounds (light-bg-1/2/3) |
| Primary | `hsl(210 100% 12%)` — `#001d3d` | Text, borders |
| Accent gold | `hsl(45 100% 50%)` — `#ffc300` | CTAs, highlights, radar fill |
| Accent yellow | `hsl(48 100% 52%)` — `#ffd60a` | Hover states |
| Text dark | `hsl(220 100% 4%)` — `#000814` | Body text |
| Text light | `hsl(52 100% 94%)` — `#fefae0` | Hero text on dark bg |
| Font | System font stack, Georgia serif fallback (hero) | |
| Card radius | `rounded-2xl` | Section cards |
| Pill radius | `rounded-full` | Skill chips, tags |
| Elevation | `shadow-sm` / `shadow-lg` | Card depth |
| Transitions | 300 ms ease | Hover interactions |

### Real Time (`/real-time`)

| Token | Value | Usage |
|---|---|---|
| Background | `#080F1F` | Deep navy — `RealTimeBackground` |
| Orbs | Indigo `#4f46e5`, Blue `#0ea5e9`, Cyan `#06b6d4` | Radial gradient orbs |
| Accent primary | `indigo-500` / `#6366f1` | Buttons, borders, waveform |
| Accent secondary | `violet-400` / `#a78bfa` | Voice page accents |
| Glass card bg | Dual-layer: radial + linear gradient | `GlassCard` component |
| Glass border | `border-white/10`, top rim `border-t-white/55` | `GlassCard` |
| Glass shadow | `0 0 70px rgba(99,102,241,0.35)` + depth layers | `GlassCard` |
| Backdrop blur | `backdrop-blur-2xl` | Glass surfaces |
| Font | "Outfit" (Google Fonts, 300–700) — class `rt-typography` | Applied at `RealTimeLayout` root |
| Button radius | `rounded-xl` | Action buttons |
| Circle buttons | `rounded-full` | Mic button (voice page) |
| Container radius | `rounded-2xl` | Inner panels |
| Heading style | `font-light tracking-widest` + bold accent word | e.g. "VOICE**AGENT**" |
| Transitions | 300 ms | Hover interactions |

**Heading pattern** used across all `/real-time` pages:
```tsx
<h1 className="font-light text-2xl tracking-widest text-slate-800">
  WORD<span className="font-medium text-indigo-600">TWO</span>
</h1>
<div className="text-[10px] tracking-[0.3em] uppercase font-bold text-indigo-500 mt-1">
  Descriptive subtitle
</div>
```

**Pages and their headings:**
| Route | Heading | Subtitle |
|---|---|---|
| `/real-time` | REAL TIME | Video & Voice / _by Eng. Richard Ayala_ |
| `/real-time/avatar` | LIVE**AVATAR** | Real-time AI video experience |
| `/real-time/voice` | VOICE**AGENT** (violet) | Real-time AI voice conversation |
| `/real-time/audio-test` | AUDIO**TEST** | Microphone configuration |

### Chat (`/chat`)

| Token | Value | Usage |
|---|---|---|
| Background | Gradient `slate-50 → white → blue-50` | Layout bg |
| Accent | `indigo-500` | User bubbles (`bg-secondary`), focus rings |
| Panels | `bg-white/5 backdrop-blur-lg` | Sidebar glassmorphism |
| Font | System font stack | |
| Message radius | `rounded-2xl` | Chat bubbles |
| Panel radius | `rounded-xl` | Sidebar panels |
| Animation | Framer Motion spring (0.4 s) | Drawer open/close |
| Transitions | 300 ms | Hover interactions |

---

## Shared utilities (index.css)

- `animate-breathe` — 0.833 s highlight pulse, 3 cycles (used in ChatTips)
- `.hero-bg` — multi-layer radial gradient for the Portfolio hero section
- Recharts outline reset (`recharts-wrapper *`)
- Typography scale: h1 4.5 rem / h2 2.625 rem / h3 1.5 rem / p 1.125 rem

---

## Reusable components across Real Time

| Component | Purpose | Notes |
|---|---|---|
| `RealTimeBackground` | Full-screen dark animated bg | Rendered once in `RealTimeLayout`, shared by all sub-routes |
| `GlassCard` | Primary content container | Glassmorphism card with indigo glow; use for every RT page |
| `RealTimeStyles.css` | RT-scoped CSS | Outfit font import, animation keyframes, `rt-typography` class |

---

## Adding a new sub-app route

1. Choose a route prefix, e.g. `/dashboard`.
2. Create `src/styles/dashboard.css` with scoped tokens.
3. Import it in the top-level layout component (`DashboardLayout.tsx`).
4. Define a heading/color/font personality in this document under a new section.
