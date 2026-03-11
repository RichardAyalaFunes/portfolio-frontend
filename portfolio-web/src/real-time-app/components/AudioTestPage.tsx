// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { loadTemplate, renderTemplate, updateTemplateElements, toggleElementVisibility } from '../utils/templateUtils';

interface AudioTestPageProps {
  onBack: () => void;
  webhookUrl?: string;
  onWebhookResponse?: (response: string) => void;
}

/**
 * Componente de prueba de audio
 * Permite probar la funcionalidad del micrófono sin conectar al avatar
 */
const AudioTestPage: React.FC<AudioTestPageProps> = ({ onBack, webhookUrl, onWebhookResponse }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eventListenersAdded = useRef(false);
  
  // Estados para grabación de audio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSendingToWebhook, setIsSendingToWebhook] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Inicia la grabación de audio
   */
  const startRecording = async (): Promise<void> => {
    console.log("Starting audio test recording...");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, creating audio blob");
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log("Audio blob created:", { size: audioBlob.size, type: audioBlob.type });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        
        // Calcular duración final
        const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(finalDuration);
        
        // Limpiar intervalo
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        console.log("Audio blob state updated, should trigger UI update");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      
      // Iniciar contador de duración
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
      
      console.log("Audio test recording started successfully");
    } catch (err: any) {
      console.error("Error starting audio test recording:", err);
      setError(`Error accessing microphone: ${err.message}`);
    }
  };

  /**
   * Detiene la grabación de audio
   */
  const stopRecording = (): void => {
    console.log("Stopping audio test recording...");
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("Audio test recording stopped successfully");
      console.log("Current audioBlob state:", audioBlob);
    }
  };

  /**
   * Descarga el archivo de audio grabado
   */
  const downloadAudio = (): void => {
    if (!audioBlob) {
      setError("No audio recorded to download");
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-test-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("Audio file downloaded");
  };

  /**
   * Envía el archivo de audio grabado al webhook configurado
   */
  const sendToWebhook = async (): Promise<void> => {
    if (!audioBlob) {
      setError("No hay audio grabado para enviar al webhook");
      return;
    }

    if (!webhookUrl) {
      setError("URL del webhook no configurada");
      return;
    }

    try {
      setIsSendingToWebhook(true);
      setError(null);
      setWebhookResponse(null);
      
      console.log("Enviando audio al webhook:", webhookUrl);
      
      const formData = new FormData();
      
      // Usar la extensión correcta basada en el tipo MIME
      let filename = 'recording.webm';
      if (audioBlob.type.includes('wav')) {
        filename = 'recording.wav';
      } else if (audioBlob.type.includes('mp3')) {
        filename = 'recording.mp3';
      } else if (audioBlob.type.includes('ogg')) {
        filename = 'recording.ogg';
      }
      
      formData.append('audio', audioBlob, filename);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error del webhook: ${response.status} ${response.statusText}`);
      }
      
      try {
        const result = await response.json();
        console.log("Respuesta del webhook:", result);
        
        const scriptText = result.script || result.text || result.response;
        
        if (!scriptText) {
          throw new Error("El webhook no devolvió un script válido");
        }
        
        setWebhookResponse(scriptText);
        
        // Llamar al callback si está disponible
        if (onWebhookResponse) {
          onWebhookResponse(scriptText);
        }
        
        console.log("Audio enviado al webhook exitosamente");
      } catch (jsonErr: any) {
        console.error("Error parseando respuesta del webhook:", jsonErr);
        
        // Intentar obtener respuesta de texto si falla el parseo JSON
        const textResponse = await response.text();
        console.log("Respuesta de texto del webhook:", textResponse);
        
        if (textResponse) {
          setWebhookResponse(textResponse);
          
          // Llamar al callback si está disponible
          if (onWebhookResponse) {
            onWebhookResponse(textResponse);
          }
        } else {
          throw new Error("No se pudo procesar la respuesta del webhook");
        }
      }
    } catch (err: any) {
      console.error("Error enviando audio al webhook:", err);
      setError(`Error enviando al webhook: ${err.message}`);
    } finally {
      setIsSendingToWebhook(false);
    }
  };

  /**
   * Carga la plantilla y configura los eventos
   */
  useEffect(() => {
    const loadAudioTestTemplate = async () => {
      console.log("Loading audio test template...");
      if (containerRef.current && !eventListenersAdded.current) {
        try {
          console.log("Fetching audio test template HTML...");
          const templateHtml = await loadTemplate('/templates/audio-test-page.html');
          console.log("Template loaded, rendering...");
          renderTemplate(containerRef.current, templateHtml);
          console.log("Template rendered successfully");
          
          // Configurar eventos
          const startBtn = containerRef.current.querySelector('#start-recording-btn');
          const stopBtn = containerRef.current.querySelector('#stop-recording-btn');
          const downloadBtn = containerRef.current.querySelector('#download-btn');
          const webhookBtn = containerRef.current.querySelector('#webhook-btn');
          const backBtn = containerRef.current.querySelector('#back-btn');

          if (startBtn) {
            startBtn.addEventListener('click', (e) => {
              e.preventDefault();
              startRecording();
            });
          }

          if (stopBtn) {
            stopBtn.addEventListener('click', (e) => {
              e.preventDefault();
              stopRecording();
            });
          }

          if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
              e.preventDefault();
              downloadAudio();
            });
          }

          if (webhookBtn) {
            webhookBtn.addEventListener('click', (e) => {
              e.preventDefault();
              sendToWebhook();
            });
          }

          if (backBtn) {
            backBtn.addEventListener('click', (e) => {
              e.preventDefault();
              onBack();
            });
          }

          eventListenersAdded.current = true;
        } catch (error) {
          console.error('Error loading audio test template:', error);
        }
      }
    };

    loadAudioTestTemplate();
  }, [onBack]);

  /**
   * Actualiza la interfaz según el estado
   */
  useEffect(() => {
    console.log("UI update effect triggered:", {
      isRecording,
      audioBlob: !!audioBlob,
      recordingDuration,
      error: !!error,
      isSendingToWebhook,
      webhookResponse: !!webhookResponse
    });
    
    if (containerRef.current) {
      // Actualizar botones de grabación
      toggleElementVisibility(containerRef.current, 'start-recording-btn', !isRecording);
      toggleElementVisibility(containerRef.current, 'stop-recording-btn', isRecording);

      // Actualizar estado de grabación
      const statusElement = containerRef.current.querySelector('#recording-status');
      if (statusElement) {
        if (isRecording) {
          statusElement.textContent = `Recording... ${recordingDuration}s`;
        } else if (audioBlob) {
          statusElement.textContent = 'Recording completed';
        } else {
          statusElement.textContent = 'Ready to record';
        }
      }

      // Mostrar/ocultar controles de audio
      toggleElementVisibility(containerRef.current, 'audio-controls', !!audioBlob);

      // Actualizar estado del botón de webhook
      const webhookBtn = containerRef.current.querySelector('#webhook-btn') as HTMLButtonElement;
      console.log("Webhook button found:", !!webhookBtn);
      if (webhookBtn) {
        webhookBtn.disabled = !audioBlob || isSendingToWebhook;
        webhookBtn.textContent = isSendingToWebhook ? 'Enviando...' : '📤 Send to Webhook';
        // Asegurar que el botón sea visible cuando hay audio
        webhookBtn.style.display = audioBlob ? 'inline-block' : 'none';
        console.log("Webhook button visibility updated:", {
          audioBlob: !!audioBlob,
          isSendingToWebhook,
          display: webhookBtn.style.display,
          disabled: webhookBtn.disabled,
          textContent: webhookBtn.textContent
        });
      } else {
        console.error("Webhook button not found in DOM!");
      }

      // Configurar reproductor de audio
      if (audioBlob) {
        const audioPlayer = containerRef.current.querySelector('#audio-player') as HTMLAudioElement;
        if (audioPlayer) {
          const url = URL.createObjectURL(audioBlob);
          audioPlayer.src = url;
        }

        // Actualizar información de grabación
        updateTemplateElements(containerRef.current, {
          'duration': recordingDuration.toString(),
          'file-size': Math.round(audioBlob.size / 1024).toString()
        });
      }

      // Mostrar/ocultar respuesta del webhook
      toggleElementVisibility(containerRef.current, 'webhook-response', !!webhookResponse);
      if (webhookResponse) {
        updateTemplateElements(containerRef.current, {
          'webhook-response-text': webhookResponse
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
  }, [isRecording, audioBlob, recordingDuration, error, isSendingToWebhook, webhookResponse]);

  return <div ref={containerRef} />;
};

export default AudioTestPage;
