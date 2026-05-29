import { useEffect, useState, useMemo } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { motion } from 'framer-motion';

/**
 * Props para el componente HeroSection
 */
interface HeroSectionProps {
  name?: string;
  title?: string;
}

/**
 * Componente Hero Section (Portrait)
 * Ocupa el 100vh y contiene el texto principal y highlights
 */
export const HeroSection = ({
  name = 'Richard',
  title = 'Backend and AI Engineer',
}: HeroSectionProps) => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesOptions: ISourceOptions = useMemo(
    () => ({
      particles: {
        number: {
          value: 100,
          density: {
            enable: true,
          },
        },
        color: {
          value: "#ffffff",
        },
        links: {
          enable: true,
          color: "#ffffff",
          distance: 150,
          opacity: 0.15,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.7,
          direction: "none",
          random: true,
          straight: false,
          outModes: "out",
        },
        size: {
          value: { min: 2, max: 6 },
        },
        opacity: {
          value: { min: 0.1, max: 0.3 },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
        },
        modes: {
          grab: {
            distance: 140,
            links: {
              opacity: 0.3,
            },
          },
        },
      },
      detectRetina: true,
      background: {
        color: "transparent",
      },
      fullScreen: { enable: false },
    }),
    [],
  );

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden hero-bg"
    >
      {/* Particles Graphic */}
      {init && (
        <div className="absolute bottom-0 w-full h-[40%] z-0">
          <Particles id="tsparticles" options={particlesOptions} className="w-full h-full" />
        </div>
      )}

      {/* Card and Floating Elements Wrapper */}
      <div className="relative z-10 w-full max-w-4xl mx-4 flex flex-col items-center">

        {/* Floating Background Elements (SVGs) */}
        {/* 1. AI Typography & Stars (Top right outside card) */}
        <div className="absolute -top-48 -right-56 z-0 flex flex-col items-center opacity-60 pointer-events-none">
          <img src="/logos/ai-with-starts.svg" alt="AI Stars" className="w-72 h-72" />
        </div>

        {/* 2. React Logo (Middle right outside card) */}
        <div className="absolute top-1/2 -right-8 -translate-y-1/2 z-0 opacity-40 pointer-events-none">
          <img src="/logos/react-svgrepo-com.svg" alt="React" className="w-24 h-24 animate-[spin_24s_linear_infinite]" />
        </div>

        {/* 3. Python Logo (Bottom right outside card) */}
        <div className="absolute -bottom-48 -right-12 z-0 opacity-40 pointer-events-none">
          <img src="/logos/python-svgrepo-com.svg" alt="Python" className="w-72 h-72 drop-shadow-2xl" />
        </div>

        {/* Central Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 backdrop-blur-sm border-4 border-transparent rounded-3xl p-10 w-full shadow-2xl flex flex-col items-center"
          style={{
            background: `
            linear-gradient(rgba(0, 0, 0, 0.10), rgba(0, 0, 0, 0.25)) padding-box,
            linear-gradient(to bottom left, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.0) 90%) border-box
          `
          }}
        >
          {/* Typography, Content and Navigation wrapped in Grid */}
          < div className="w-full grid grid-cols-[auto_minmax(0,max-content)_auto] gap-x-6 justify-start">
            {/* Left Bracket */}
            <span className="col-start-1 row-start-1 text-8xl font-thin text-white/20 select-none flex items-center">
              {'{'}
            </span>

            <div className="col-start-2 row-start-1 flex flex-col items-start justify-center py-4 text-left">
              <h1 className="text-[#fefae0] text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                Hi, I'm {name.split(' ')[0]}
              </h1>
              <h2 className="text-[#ffc300] text-3xl md:text-4xl lg:text-5xl font-bold mt-3 drop-shadow-md">
                {title}
              </h2>
              <p className="text-[#fefae0]/60 mt-6 tracking-[0.2em] uppercase text-sm font-medium">
                1% better every day
              </p>
            </div>

            {/* Right Bracket */}
            <span className="col-start-3 row-start-1 text-8xl font-thin text-white/20 select-none flex items-center">
              {'}'}
            </span>

            {/* Card Navigation Menu */}
            <nav className="col-start-2 row-start-2 mt-14 w-full">
              <ul className="flex items-center justify-start gap-6 text-[#fefae0]/80 text-xl font-medium">
                {[
                  { label: 'Projects', href: '#projects' },
                  { label: 'Skills', href: '#skills' },
                  { label: 'Contact Me', href: '#contact' },
                ].map((item, index, arr) => (
                  <li key={item.label} className="flex items-center gap-6 group cursor-pointer">
                    <a href={item.href} className="relative flex items-center transition-colors group-hover:text-[#ffc300]">
                      <span className="absolute -left-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#ffc300] font-bold">
                        &gt;
                      </span>
                      {item.label}
                    </a>
                    {index < arr.length - 1 && (
                      <span className="text-white/20 font-light">|</span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
