import { Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/sections/HeroSection';
import { ProjectsSection } from './components/sections/ProjectsSection';
import { SkillsSection } from './components/sections/SkillsSection';
import { ChatLayout } from './components/chat/ChatLayout';
import RealTimeApp from './real-time-app/RealTimeApp';
import './App.css';

function HomeView() {
  return (
    <>
      <HeroSection />
      <ProjectsSection />
      <SkillsSection />
    </>
  );
}

function ChatView() {
  return <ChatLayout />;
}

/**
 * Componente principal de la aplicación
 * Coordina el layout y el enrutamiento
 */
function App() {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const isRealTime = location.pathname.startsWith('/real-time');

  return (
    <>
      <Header />
      <main className={`flex-1 flex flex-col ${(isChat || isRealTime) ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/chat" element={<ChatView />} />
          <Route path="/real-time/*" element={<RealTimeApp />} />
        </Routes>
      </main>
      {(!isChat && !isRealTime) && <Footer />}
    </>
  );
}

export default App;
