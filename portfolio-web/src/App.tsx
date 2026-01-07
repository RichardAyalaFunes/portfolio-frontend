import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/sections/HeroSection';
import { ProjectsSection } from './components/sections/ProjectsSection';
import { ExperienceSection } from './components/sections/ExperienceSection';
import { SkillsSection } from './components/sections/SkillsSection';
import './App.css';

/**
 * Componente principal de la aplicación
 * Coordina el layout y las secciones principales
 */
function App() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ProjectsSection />
        <ExperienceSection />
        <SkillsSection />
      </main>
      <Footer />
    </>
  );
}

export default App;
