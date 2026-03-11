// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { loadTemplate, renderTemplate, updateTemplateElements, toggleElementVisibility, addElementClass, removeElementClass } from '../utils/templateUtils';
import { AI_PROMPTS } from '../constants/aiPrompts';

interface VoiceAgentPageProps {
  status?: string;
  error?: string | null;
  onDisconnect: () => void;
  onProcessAudio?: (audioBlob: Blob) => void;
  webhookUrl?: string;
  onSendText?: (text: string) => void;
}

/**
 * Estado de conexión del agente de voz
 */
type ConnectionState = 'notConnect' | 'connecting' | 'connected';

/**
 * Componente de la página del agente de voz con WebRTC Realtime API
 * Implementa la lógica funcional de TestRealtimePage pero con la interfaz elegante
 */
const VoiceAgentPage: React.FC<VoiceAgentPageProps> = ({
  status = "Listo para conectar",
  error = null,
  onDisconnect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado de conexión WebRTC (usando la lógica funcional de TestRealtimePage)
  const [connectStatus, setConnectStatus] = useState<ConnectionState>('notConnect');
  const [outputText, setOutputText] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Referencias para visualización de audio del AI (siguiendo el patrón del script de referencia)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Configuración de sesión (unified interface approach)
  const sessionConfig = JSON.stringify({
    type: "realtime",
    model: "gpt-4o-realtime-preview-2024-12-17",
    audio: { output: { voice: "marin" } }
  });

  // Helper para agregar logs
  const addLog = (message: string) => {
    console.log(message);
    setLogs((prev: string[]) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // 1. Obtener token efímero de OpenAI (lógica de TestRealtimePage)
  const startConnection = async () => {
    addLog('1. Solicitando token efímero...');

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_OPENAI_API_KEY is missing in environment variables.");
    }

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
      }),
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo token: ${response.statusText}`);
    }

    const data = await response.json();
    addLog('2. Token efímero obtenido exitosamente');

    // Display the returned data in the frontend
    setOutputText(JSON.stringify(data, null, 2));

    return data.client_secret.value;
  };

  // 2. Inicializar WebRTC (lógica funcional de TestRealtimePage)
  const initWebRTC = async () => {
    setConnectStatus('connecting');
    addLog('Starting WebRTC connection...');
    updateStatusText("Connecting to voice agent...");
    updateResponseStatus("Initializing...");

    try {
      const EPHEMERAL_KEY = await startConnection(); // Call the startConnection function to get ephemeral key
      addLog('Ephemeral key obtained');

      // 2. Create a peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // 3. Set up to play remote audio from the model
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioElementRef.current = audioEl;

      pc.ontrack = e => {
        audioEl.srcObject = e.streams[0];
        addLog('AI audio track received');

        // Configurar visualización de audio (siguiendo el patrón del script de referencia)
        setupAIAudioVisualizer(e.streams[0]);
      };

      // 4. Add local audio track for microphone input in the browser
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      localStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0], ms);
      addLog('Microphone connected');

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.onopen = () => {
        addLog('Data channel opened');

        // Send system prompt to configure AI behavior
        const sessionConfig = {
          type: "session.update",
          session: {
            instructions: AI_PROMPTS.VOICE_AGENT_INSTRUCTIONS
          }
        };

        dc.send(JSON.stringify(sessionConfig));
        addLog('System prompt sent: AI configured to be funny and tell jokes');

        setConnectStatus('connected');
        setOutputText('Connected! You can speak now.');
        updateStatusText("Connected - You can start speaking");
        updateResponseStatus("Listening...");
      };

      dc.addEventListener("message", (e) => {
        // Realtime server events appear here!
        const event = JSON.parse(e.data);
        addLog(`Event: ${event.type}`);

        switch (event.type) {
          case 'response.audio_transcript.done':
            setOutputText(`AI: ${event.transcript}`);
            updateStatusText(`AI: "${event.transcript}"`);
            break;
          case 'response.audio.delta':
            // AI is speaking
            updateResponseStatus("AI is speaking...");
            break;
          case 'response.audio.done':
            // AI stopped speaking
            updateResponseStatus("Listening...");
            break;
        }
      });

      // Start the session using the Session Decription Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      addLog('SDP offer created');

      // 7. Send the SDP offer to the OpenAI realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      // 8. Get the SDP answer and set it as the remote description
      const answer: RTCSessionDescriptionInit = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
      addLog('WebRTC connection established');
      updateStatusText("Connected - You can start speaking");
      updateResponseStatus("Listening...");

    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setConnectStatus('notConnect');
      setOutputText(`Error: ${error.message}`);
      updateStatusText(`Error: ${error.message}`);
      updateResponseStatus("Connection error");
    }
  };

  // 3. Desconectar (lógica de TestRealtimePage)
  const disconnect = () => {
    addLog('Desconectando...');

    // Detener visualización de audio
    stopVisualizationLoop();

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      localStreamRef.current = null;
    }

    // Limpiar audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    setConnectStatus('notConnect');
    setOutputText('Disconnected');
    addLog('✅ Disconnected');
    updateStatusText("Disconnected");
    updateResponseStatus("Disconnected");
  };

  /**
   * Configura la visualización de audio del AI usando Web Audio API y Canvas
   * Implementación directa del patrón startBackendVisualizer del script de referencia
   */
  const setupAIAudioVisualizer = (remoteStream: MediaStream) => {
    try {
      if (!containerRef.current) return;

      const canvas = containerRef.current.querySelector('#ai-audio-canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ajustar tamaño del canvas
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Crear AudioContext y Analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const source = audioContext.createMediaStreamSource(remoteStream);
      source.connect(analyser);

      addLog('Canvas audio visualizer configured for AI audio');

      // Loop de dibujo (igual que en el script de referencia)
      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        // Background blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Línea de onda gris
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#555555';
        ctx.beginPath();

        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * canvas.height / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      draw();
    } catch (error) {
      console.error('Error setting up AI audio visualizer:', error);
    }
  };

  /**
   * Detiene el loop de visualización
   */
  const stopVisualizationLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Limpiar el canvas
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('#ai-audio-canvas') as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  };

  // Texto del botón según el estado
  const getButtonText = () => {
    if (connectStatus === 'notConnect') return 'Connect';
    if (connectStatus === 'connecting') return 'Connecting...';
    return 'Disconnect';
  };

  /**
   * Actualiza el texto de estado en la interfaz elegante
   */
  const updateStatusText = (text: string) => {
    if (!containerRef.current) return;
    updateTemplateElements(containerRef.current, {
      'status-text': text
    });
  };

  /**
   * Actualiza el estado de respuesta en la interfaz elegante
   */
  const updateResponseStatus = (text: string) => {
    if (!containerRef.current) return;
    updateTemplateElements(containerRef.current, {
      'response-status-text': text
    });
  };

  /**
   * Actualiza el estado del botón de grabación en la interfaz elegante
   */
  const updateRecordingButton = () => {
    if (!containerRef.current) return;

    const recordingButton = containerRef.current.querySelector('#recording-button');
    const recordingStatus = containerRef.current.querySelector('#recording-status');

    if (recordingButton && recordingStatus) {
      if (connectStatus === 'connected') {
        // Conectado - mostrar indicador activo
        addElementClass(containerRef.current, 'recording-button', 'recording');
        (recordingStatus as HTMLElement).textContent = 'Listening...';
      } else if (connectStatus === 'connecting') {
        (recordingStatus as HTMLElement).textContent = 'Connecting...';
      } else {
        // Desconectado
        removeElementClass(containerRef.current, 'recording-button', 'recording');
        (recordingStatus as HTMLElement).textContent = 'Click to connect';
      }
    }
  };

  /**
   * Maneja el click del botón de grabación (conectar/desconectar)
   */
  const handleRecordingButtonClick = () => {
    console.log("Botón de grabación clickeado, estado actual:", connectStatus);

    if (connectStatus === 'notConnect') {
      initWebRTC();
    } else if (connectStatus === 'connected') {
      disconnect();
    }
  };

  /**
   * Maneja la desconexión completa
   */
  const handleDisconnect = () => {
    console.log("Disconnect button clicked - stopping all connections");

    // Stop all audio recording and AI communication
    disconnect();

    // Call parent disconnect handler
    onDisconnect();
  };

  /**
   * Carga la plantilla y configura los eventos
   */
  useEffect(() => {
    const loadVoiceAgentTemplate = async () => {
      if (containerRef.current) {
        try {
          console.log("Cargando plantilla del agente de voz...");
          const templateHtml = await loadTemplate('/templates/voice-agent-page.html');
          renderTemplate(containerRef.current, templateHtml);

          // Configurar eventos
          const disconnectButton = containerRef.current.querySelector('#disconnect-button');
          const recordingButton = containerRef.current.querySelector('#recording-button');

          if (disconnectButton) {
            disconnectButton.addEventListener('click', handleDisconnect);
          }

          if (recordingButton) {
            recordingButton.addEventListener('click', handleRecordingButtonClick);
          }

          // Actualizar UI inicial
          updateRecordingButton();
          updateStatusText("Ready to connect");
          updateResponseStatus("Click the microphone to start");

          console.log("Plantilla cargada y eventos configurados");
        } catch (error) {
          console.error('Error cargando plantilla del agente de voz:', error);
        }
      }
    };

    loadVoiceAgentTemplate();

    // Cleanup al desmontar el componente
    return () => {
      disconnect();
    };
  }, []);

  /**
   * Actualiza la UI cuando cambia el estado de conexión
   */
  useEffect(() => {
    updateRecordingButton();
  }, [connectStatus]);

  /**
   * Actualiza el estado y los errores desde props
   */
  useEffect(() => {
    if (containerRef.current) {
      // Mostrar/ocultar errores
      toggleElementVisibility(containerRef.current, 'voice-agent-error-container', !!error);
      if (error) {
        updateTemplateElements(containerRef.current, {
          'voice-agent-error-message': error
        });
      }
    }
  }, [status, error]);

  return <div ref={containerRef} />;
};

export default VoiceAgentPage;
