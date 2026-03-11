// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { loadTemplate, renderTemplate, updateTemplateElements, toggleElementVisibility, addElementClass, removeElementClass } from '../utils/templateUtils';

interface HomePageProps {
  isLoading: boolean;
  error: string | null;
  status: string;
  onConnectRealistic: () => void;
  onConnectVoice: () => void;
  onAudioTest: () => void;
  onTestRealtime: () => void;
}

/**
 * Componente de la página de inicio
 * Maneja la conexión inicial con el avatar
 */
const HomePage: React.FC<HomePageProps> = ({ isLoading, error, status, onConnectRealistic, onConnectVoice, onAudioTest, onTestRealtime }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHomeTemplate = async () => {
      if (containerRef.current) {
        try {
          const templateHtml = await loadTemplate('/templates/home-page.html');
          renderTemplate(containerRef.current, templateHtml);
          
          // Configurar eventos
          const realisticAvatarButton = containerRef.current.querySelector('#realistic-avatar-button') as HTMLButtonElement;
          const voiceAgentButton = containerRef.current.querySelector('#voice-agent-button') as HTMLButtonElement;
          const audioTestButton = containerRef.current.querySelector('#audio-test-btn') as HTMLButtonElement;
          const testRealtimeButton = containerRef.current.querySelector('#test-realtime-button') as HTMLButtonElement;
          
          if (realisticAvatarButton) {
            realisticAvatarButton.addEventListener('click', (e) => {
              console.log("Realistic avatar button clicked"); // Debug log
              e.preventDefault();
              // Visual feedback
              realisticAvatarButton.style.backgroundColor = '#f5f5f5';
              realisticAvatarButton.style.borderColor = '#352023';
              realisticAvatarButton.style.color = '#352023';
              setTimeout(() => {
                realisticAvatarButton.style.backgroundColor = 'transparent';
                realisticAvatarButton.style.borderColor = '#000000';
                realisticAvatarButton.style.color = '#000000';
              }, 200);
              onConnectRealistic();
            });
          }

          if (voiceAgentButton) {
            voiceAgentButton.addEventListener('click', (e) => {
              console.log("Voice agent button clicked"); // Debug log
              e.preventDefault();
              // Visual feedback
              voiceAgentButton.style.backgroundColor = '#f5f5f5';
              voiceAgentButton.style.borderColor = '#352023';
              voiceAgentButton.style.color = '#352023';
              setTimeout(() => {
                voiceAgentButton.style.backgroundColor = 'transparent';
                voiceAgentButton.style.borderColor = '#000000';
                voiceAgentButton.style.color = '#000000';
              }, 200);
              onConnectVoice();
            });
          }
          
          if (audioTestButton) {
            audioTestButton.addEventListener('click', (e) => {
              console.log("Audio test button clicked"); // Debug log
              e.preventDefault();
              // Visual feedback
              audioTestButton.style.backgroundColor = '#e5e7eb';
              setTimeout(() => {
                audioTestButton.style.backgroundColor = '#f3f4f6';
              }, 200);
              onAudioTest();
            });
          }

          if (testRealtimeButton) {
            testRealtimeButton.addEventListener('click', (e) => {
              console.log("Test Realtime button clicked"); // Debug log
              e.preventDefault();
              // Visual feedback
              testRealtimeButton.style.backgroundColor = 'rgba(255, 107, 0, 0.15)';
              setTimeout(() => {
                testRealtimeButton.style.backgroundColor = 'rgba(255, 107, 0, 0.05)';
              }, 200);
              onTestRealtime();
            });
          }
          
          // Establecer estado inicial de los botones
          if (realisticAvatarButton) {
            realisticAvatarButton.disabled = isLoading;
          }
          if (voiceAgentButton) {
            voiceAgentButton.disabled = isLoading;
          }
        } catch (error) {
          console.error('Error cargando plantilla de inicio:', error);
        }
      }
    };

    loadHomeTemplate();
  }, [onConnectRealistic, onConnectVoice, onAudioTest, onTestRealtime, isLoading]);

  useEffect(() => {
    if (containerRef.current) {
      // Actualizar estado de los botones
      const realisticAvatarButton = containerRef.current.querySelector('#realistic-avatar-button') as HTMLButtonElement;
      const voiceAgentButton = containerRef.current.querySelector('#voice-agent-button') as HTMLButtonElement;
      
      if (realisticAvatarButton) {
        realisticAvatarButton.disabled = isLoading;
      }
      if (voiceAgentButton) {
        voiceAgentButton.disabled = isLoading;
      }

      // Mostrar/ocultar estado de conexión
      toggleElementVisibility(containerRef.current, 'status-container', isLoading);
      if (isLoading && status) {
        updateTemplateElements(containerRef.current, {
          'status-message': status
        });
      }

      // Mostrar/ocultar errores
      toggleElementVisibility(containerRef.current, 'error-container', !!error);
      if (error) {
        updateTemplateElements(containerRef.current, {
          'error-message': error
        });
      }
    }
  }, [isLoading, error, status]);

  return <div ref={containerRef} />;
};

export default HomePage;
