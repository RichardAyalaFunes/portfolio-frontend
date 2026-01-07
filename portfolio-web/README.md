# Portfolio Web

A modern, minimalist professional portfolio website built with React and TypeScript. This project showcases professional experience, technical projects, and skills through a clean, editorial-grade interface.

## 🎯 Project Overview

This portfolio application serves as a digital showcase for professional work, featuring a responsive design that emphasizes clarity, high contrast, and white space. The application follows a "Minimalist Professional" design philosophy with a carefully curated color palette and smooth, intentional animations.

## ✨ Features

- **Hero Section**: Full-viewport introduction with dynamic header that appears on scroll
- **Project Gallery**: Categorized project showcase (AI, Backend, Frontend) with responsive grid layout
- **Experience Timeline**: Reverse-chronological display of professional history and achievements
- **Skills Visualization**: Interactive spider chart displaying competency levels across technical domains
- **Contact Footer**: Professional contact information with social media links

## 🛠️ Tech Stack

- **Framework**: React 19+ (Functional Components with Hooks)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Build Tool**: Vite
- **State Management**: React Context API & Local State

## 📁 Project Structure

```
src/
├── assets/             # Static assets (images, SVG)
├── components/         
│   ├── ui/             # Base UI components (Shadcn/ui)
│   ├── layout/         # Header, Footer, Section wrappers
│   └── sections/       # Hero, Projects, Experience, Skills
├── data/               # Static content (projects, experience, skills)
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── styles/             # Global CSS & Tailwind config
├── types/              # TypeScript interfaces
└── App.tsx             # Main application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd portfolio-web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📚 Documentation

For detailed information about the project, refer to the documentation in the `documentation/` folder:

- **[architecture.md](./documentation/architecture.md)**: Technical standards, folder structure, design system, and coding guidelines
- **[business_case.md](./documentation/business_case.md)**: Functional requirements, user stories, and acceptance criteria

## 🎨 Design System

The portfolio follows a "Minimalist Professional" design system with:

- **Color Palette**: Deep Navy (#001d3d), Professional Blue (#003566), Gold (#ffc300), Yellow (#ffd60a)
- **Typography**: Sans-serif with clear hierarchy (72px hero titles to 14px meta text)
- **Components**: Soft rounded corners (12-16px), pill-shaped CTAs, high-contrast layouts

## 📝 Development Standards

- **TypeScript-First**: Strict typing with no `any` types
- **Functional Components**: Modern React patterns with Hooks
- **Component Modularity**: Small, reusable components following Atomic Design principles
- **Validation**: All user inputs validated against business rules
- **Accessibility**: Semantic HTML and ARIA-compliant components

## 🤝 Contributing

This is a personal portfolio project. For questions or suggestions, please open an issue or contact the maintainer.

## 📄 License

Private project - All rights reserved.
