import './styles/variant.css';
import { HeroSection } from './components/HeroSection';
import { ProjectsSection } from './components/ProjectsSection';
import { TrajectorySection } from './components/TrajectorySection';
import { AchievementsSection } from './components/AchievementsSection';
import { SkillsSection } from './components/SkillsSection';
import { useStageScroll } from './hooks/useStageScroll';
import { projects } from '@/data/projects';

export default function HomeView() {
  // Page advances one "slice" per scroll intent (hero → each project focus →
  // trajectory → achievements → skills), so only one state shows at a time.
  useStageScroll(projects.length);

  return (
    <div className="v2-root">
      <HeroSection />
      <ProjectsSection />
      <TrajectorySection />
      <AchievementsSection />
      <SkillsSection />
    </div>
  );
}
