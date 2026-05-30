import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Footer } from './components/layout/Footer';
import { ChatLayout } from './components/chat/ChatLayout';
import RealTimeLayout from './components/real-time/RealTimeLayout';
import { VariantLoader } from './components/VariantLoader';
import { variantConfig } from './config/variants';
import './App.css';

function App() {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const isRealTime = location.pathname.startsWith('/real-time');

  return (
    <>
      <main className={`flex-1 flex flex-col ${(isChat || isRealTime) ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${variantConfig.defaultVariant}`} replace />} />
          <Route path="/chat" element={<ChatLayout />} />
          <Route path="/real-time/*" element={<RealTimeLayout />} />
          <Route path="/:variantId" element={<VariantLoader />} />
        </Routes>
      </main>
      {(!isChat && !isRealTime) && <Footer />}
    </>
  );
}

export default App;
