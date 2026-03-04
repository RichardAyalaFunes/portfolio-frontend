# Portfolio System Architecture

This document defines the technical standards, folder structure, and design system for the React + TypeScript Portfolio project.


# Tech Stack
- Framework: React 18+ (Functional Components)
- Language: TypeScript (Strict Mode)
- Styling: Tailwind CSS + Shadcn/ui (Radix UI primitives)
- Icons: Lucide React
- Animation/Interaction: Framer Motion & Intersection Observer API
- State Management: React Context API (for theme/navigation) & Local State (per feature)


# Folder Structure

Following a Component-Centric and Type-Based organization, optimized for simplicity and maintainability in portfolio projects:
```
src/
├── assets/             # Static assets (illustrations, portrait images, SVG)
├── components/         # React Components
│   ├── ui/             # Shadcn/ui base elements (Buttons, Pills, Cards, etc.)
│   ├── layout/         # Persistent UI (Header, Footer, Section wrappers)
│   └── sections/       # Page sections (Hero, Projects, Experience, Contact)
├── data/               # Static content (projects.ts, experience.ts, profile.ts)
├── hooks/              # Global custom hooks (e.g., useScroll, useWindowSize)
├── lib/                # Third-party configurations & utils (utils.ts)
├── styles/             # Global CSS & Tailwind configuration
├── types/              # Global TypeScript interfaces
└── App.tsx             # Main entry point & layout coordinator
```


🎨 Design System: "Minimalist Professional"

## *Color Palette*


- Primary: 
    - #001d3d
    - Deep Navy - Backgrounds, Primary Headers

- Secondary:
    - #003566
    - Professional Blue - Section backgrounds, Borders

- Accent 1:
    - #ffc300
    - Gold - Primary CTAs, Key Highlights

- Accent 2:
    - #ffd60a
    - Yellow - Active Filter states, icons

- Dark Text:
    - #000814
    - High-contrast body text

- Light Text:
    - #fefae0
    - Cream - Text on dark backgrounds, secondary body

## *Typography Scale*

- Hero Title: 72px / Bold (Sans-serif)
- Section Heading: 42px / Bold
- Sub-heading: 24px / Medium
- Body Text: 18px / Regular (Line-height: 1.6)
- Small/Meta: 14px / Regular

## *Component Standards (Shadcn/ui Integration)*

Tailwind Variables: Map the palette above to CSS variables in globals.css so Shadcn components automatically use our brand colors.

Buttons (Pills): Customize Shadcn Button variants to use rounded-full (999px) and our Gold/Blue shades.

Cards: Use Shadcn Card with rounded-2xl (16px) and subtle borders using the Secondary color.


# Architectural Patterns

## *Feature-First Components*

Every section (Hero, Projects, Experience) is a self-contained folder in features/. Each folder should contain:

- [FeatureName].tsx: The UI entry point.
- [FeatureName].hooks.ts: Any specific logic (filtering, animations).
- [FeatureName].types.ts: Local TS interfaces.

## *Component Organization*

Instead of deep feature nesting, components are grouped by their functional role:
- components/ui/: Low-level, generic primitives (Shadcn).
- components/layout/: Structural elements that don't change based on specific content.
- components/sections/: Large, content-heavy blocks. Each section can have its own SectionName.tsx and SectionName.module.css if needed.

## *Static Data Management*

To keep components clean, all portfolio content (descriptions, project lists, job history) resides in src/data/. This allows for easy updates without touching the UI logic.

## *Utility-First Styling*

Use the cn() utility (combining clsx and tailwind-merge) for all component styling to handle conditional classes safely.


# Coding Standards

- No any: All props and data must have interfaces.
- Prop Destructuring: Always destructure props in function signatures.
- Tailwind Class Sorting: Use a consistent order (Layout -> Spacing -> Typography -> Visual).
- Semantic HTML: Use <section>, <header>, <footer>, and <nav> appropriately for SEO and accessibility.