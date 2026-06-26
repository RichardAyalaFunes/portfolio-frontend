import './styles/variant.css';
import { HeroSection } from './components/HeroSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ProjectsShowcaseSection } from './components/ProjectsShowcaseSection';
import { TrajectorySection } from './components/TrajectorySection';
import { AchievementsSection } from './components/AchievementsSection';
import { SkillsSection } from './components/SkillsSection';
import { useStageScroll } from './hooks/useStageScroll';
import { projects } from '@/data/projects';

/* Which projects design to show. Both use the same scroll mechanic, so flip
   this freely to compare:
     'gallery'  → original cards (banner image on top, content below)
     'showcase' → image poster with a floating glass content panel over it */
const PROJECTS_VARIANT: 'gallery' | 'showcase' = 'showcase';

export default function HomeView() {
  // Page advances one "slice" per scroll intent (hero → each project focus →
  // trajectory → achievements → skills), so only one state shows at a time.
  useStageScroll(projects.length);

  return (
    <div className="v2-root">
      <HeroSection />
      {PROJECTS_VARIANT === 'showcase' ? <ProjectsShowcaseSection /> : <ProjectsSection />}
      <TrajectorySection />
      <AchievementsSection />
      <SkillsSection />
    </div>
  );
}
