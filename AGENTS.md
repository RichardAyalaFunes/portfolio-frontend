# AGENTS.md — Portfolio Frontend

## What Is This Project

This is the frontend for **Richard Xavier Ayala Funes's** personal portfolio. It is a React + Vite SPA that serves two goals:

1. **Technical showcase** — demonstrates frontend skills, design range, and system design thinking.
2. **Design portfolio** — the homepage exists in multiple visual variants so recruiters can browse different aesthetic directions.

The multi-variant system is the most important architectural decision in this codebase. Read the section below before touching any landing page code.

---

## The Multi-Variant System

### Why it exists

The portfolio demonstrates design versatility. Each variant is a completely different visual treatment of the same content (projects, skills, experience). Recruiters can browse variants using left/right arrows. The best design gets URL `/1`, the next gets `/2`, and so on.

**URL numbers = quality ranking, not folder numbers.** `/1` is always the most impressive design. Reordering requires only editing `src/config/variants.ts` — no folder renames.

### The three-file contract

Every variant must have exactly these files:
```
src/variants/vN/
  HomeView.tsx              ← default export, composes sections
  components/
    HeroSection.tsx         ← must have id="hero" on root <section>
    ProjectsSection.tsx     ← must have id="projects" on root <section>
    SkillsSection.tsx       ← must have id="skills" on root <section>
```

The `id` attributes are required because the shared `Header` and `Footer` use them for anchor navigation (`#projects`, `#skills`, `#contact`).

### Adding a new variant — checklist

- [ ] Create `src/variants/vN/` with the three-file contract above
- [ ] Import shared data with `@/data/projects`, `@/data/skills`, `@/data/experience`
- [ ] Use `@/` imports for all shared code — never relative `../../`
- [ ] Add entry to `variantConfig.variants` in `src/config/variants.ts`
- [ ] Add lazy import to the static map in `src/components/VariantLoader.tsx`
- [ ] Set `enabled: false` until the design is complete
- [ ] Set `enabled: true` to make it navigable (arrows appear automatically when 2+ enabled)
- [ ] Update `defaultVariant` in `src/config/variants.ts` if this should be the main landing

### CSS isolation rules

- Variant-specific CSS goes in `src/variants/vN/styles/` — never in `index.css`
- `index.css` CSS variables (`--primary`, `--accent-1`, `.hero-bg`, etc.) are the global base theme — all variants can use them
- Chat and real-time components must never inherit variant styles
- Tailwind utilities are shared globally — safe to use in any variant

### The VariantNavigator

`src/components/ui/VariantNavigator.tsx` renders the left/right arrows. It is mounted by `VariantLoader`, not by individual variants — **variants do not need to import or render it**. It auto-hides when fewer than 2 variants are enabled.

---

## Shared Data (Never Duplicate)

`src/data/` is the single source of truth for all content. Every variant reads from here.

| File | Contents |
|------|----------|
| `projects.ts` | 3 projects with id, category, title, descriptions, tags, techStack, demoUrl, githubUrl, gallery |
| `skills.ts` | 6 skill domains with levels (Basic → Expert) and chart value mappings |
| `experience.ts` | 5 professional experiences with company, role, dates, responsibilities |

**Never copy data into a variant folder.** If you need to transform data for a specific variant's presentation, do it in the component, not in the data file.

---

## Architecture Map

```
src/
  main.tsx                 ← BrowserRouter → App
  App.tsx                  ← Routes: / redirect, /:variantId, /chat, /real-time/*
  
  config/
    variants.ts            ← THE central config. Edit here to add/reorder/enable variants.
    aiPrompts.ts           ← System prompts for AI chat
    constants.ts           ← LinkedIn URL, shared constants

  components/
    VariantLoader.tsx      ← Validates URL param, lazy-loads variant, mounts VariantNavigator
    ui/
      VariantNavigator.tsx ← Left/right arrows (fixed position, only shown when 2+ enabled)
      ProjectCard.tsx      ← Accordion card used by ProjectsSection in v1 (and reusable)
      card.tsx             ← Radix UI base card
    layout/
      Header.tsx           ← Sticky header (appears on scroll past #hero), shared
      Footer.tsx           ← #contact anchor, social links, shared
    sections/              ← LEGACY originals — kept as reference, not imported by App.tsx
    chat/                  ← ChatLayout, ChatWindow, ChatHistory, ChatTips — isolated
    real-time/             ← RealTime* components, LiveAvatar SDK — isolated

  variants/
    v1/                    ← Classic: dark navy, tsparticles, glassmorphic card, SVG logos
    v2/                    ← Storytelling: scroll-driven narrative (skeleton, enabled: false)

  data/                    ← Shared content (projects, skills, experience)
  api/                     ← chatApi.ts (n8n webhook), liveAvatarApi.ts
  lib/
    utils.ts               ← cn() — Tailwind class merger (clsx + tailwind-merge)
  types/
    index.ts               ← Project, Skill, Experience interfaces
```

---

## Routing Details

React Router v7 with ranked matching. Route order in `App.tsx`:
```
/          → <Navigate to="/{defaultVariant}" replace>
/chat      → <ChatLayout />          (static — matches before /:variantId)
/real-time → <RealTimeLayout />      (static — matches before /:variantId)
/:variantId → <VariantLoader />      (param — catches /1, /2, /3…)
```

Static segments rank higher than params in React Router v7 — `/chat` will never accidentally match `/:variantId`.

---

## Key Patterns

### `@` path alias
Always use `@/` for imports inside `src/`. Relative paths like `../../data/` are banned — they break as files move between folders.
```ts
// ✅ correct
import { projects } from '@/data/projects';
import { cn } from '@/lib/utils';

// ❌ wrong
import { projects } from '../../../data/projects';
```

### Lazy loading
Each variant's `HomeView` is lazy-loaded. Vite code-splits it automatically. Only the active variant's JS/CSS is downloaded. Do not eagerly import variant components anywhere outside `VariantLoader.tsx`.

### Framer Motion
Used for entrance animations and microinteractions throughout v1. Import from `framer-motion`. For new variants, use it consistently — the library is already in the bundle.

### tsparticles (v1 only)
`initParticlesEngine` must be called once per mount with `loadSlim`. The engine init is idempotent — safe across variant navigations. The particles container needs `fullScreen: { enable: false }` and a fixed-height parent.

---

## Implemented Variants

### v1 — Classic (`src/variants/v1/`)
**Status:** Complete, enabled  
**Design:** Dark navy portfolio, interactive particle network, glassmorphic card with `{}` brackets, floating Python/React/AI SVG logos, radar chart skills visualization.  
**Vibe:** Professional developer, structured, tech-forward.

### v2 — Storytelling (`src/variants/v2/`)
**Status:** Skeleton (placeholder), disabled  
**Design intent:** Scroll-driven narrative. The visitor scrolls through Richard's story — each section is a cinematic moment, not a standard section. Think large typography, parallax, reveal-on-scroll, immersive dark atmosphere.  
**To implement:** Replace all placeholder components with the storytelling design. The data imports and section IDs are already wired. Set `enabled: true` in `src/config/variants.ts` when ready.

---

## Design Rules for New Variants

Each variant must feel like a completely different designer made it. Avoid:
- Copying v1's color palette (`#001d3d`, `#ffc300`) into v2, v3, etc.
- Reusing the same layout structure (centered card, same grid)
- Using the same animation style (fade + slide up)

Each variant should have:
- Its own typographic identity
- Its own color story (can use CSS variables as a base, override per variant)
- A spatial composition that is distinctly different
- A mood/tone that matches the variant name

Planned variants (not yet started): Glassmorphism, Minimalist, Futuristic/Terminal.

---

## Sub-Projects (Chat & Avatar)

These are independent features accessible from the landing page navigation. They have their own designs that do not inherit anything from the landing page variants.

| Path | Feature | Design status |
|------|---------|---------------|
| `/chat` | AI-powered text chatbot (n8n backend) | Complete |
| `/real-time/*` | Live AI avatar (LiveAvatar SDK + FastAPI) | Complete |

Do not apply variant CSS to these routes. Do not add them to `variantConfig`.

---

## What to Work On Next

1. **Implement v2 Storytelling** — replace `src/variants/v2/components/` placeholders with the full scroll-driven narrative design. Data and wiring are ready. Set `enabled: true` when done.
2. **Reorder variants** — once v2 is ready, update `variantConfig` so `/1` = v2 (Storytelling) and `/2` = v1 (Classic). This requires only editing `variants.ts`.
3. **Add v3+** — follow the checklist in the "Adding a new variant" section above.
4. **ExperienceSection** — `src/data/experience.ts` has 5 experiences but no variant renders them yet. Wire into v1 or add as a new section.
