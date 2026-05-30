import { HeroSection } from './components/HeroSection';
import { ProjectsSection } from './components/ProjectsSection';
import { SkillsSection } from './components/SkillsSection';

export default function HomeView() {
  return (
    <>
      <HeroSection />
      <ProjectsSection />
      <SkillsSection />
    </>
  );
}
