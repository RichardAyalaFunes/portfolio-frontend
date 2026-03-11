// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import AvatarPage from "./components/AvatarPage";
import VoiceAgentPage from "./components/VoiceAgentPage";
import AudioTestPage from "./components/AudioTestPage";
import TestRealtimePage from "./components/TestRealtimePage";
import { fetchSessionToken } from "../api/liveAvatarApi";
import "./RealTimeStyles.css";

// Configuración de conexión - Cambiar a false para deshabilitar conexión real a Heygen
const ENABLE_HEYGEN_CONNECTION = true; // true: use tokens;   false: use mock mode

// Configuración de la API
const API_CONFIG = {
  serverUrl: "https://api.heygen.com",
  token: (import.meta.env.VITE_HEYGEN_API_TOKEN || (window as any).__ENV__?.VITE_HEYGEN_API_TOKEN) || "",
  webhookUrl: (
    // Nota: Vite solo expone variables que comienzan con VITE_
    import.meta.env.VITE_WEBHOOK_N8N_REALISTIC_AVATAR ||
    (window as any).__ENV__?.VITE_WEBHOOK_N8N_REALISTIC_AVATAR ||
    // Compatibilidad con clave antigua inyectada en runtime (sin prefijo VITE_)
    (window as any).__ENV__?.WEBHOOK_N8N_REALISTIC_AVATAR
  ) || "",
  avatarID: "Graham_Chair_Sitting_public", // Default: Wayne_20240711 // Formal (lawyer): Dexter_Lawyer_Sitting_public // Formal (sitting): Graham_Chair_Sitting_public
};

// Variables globales
let sessionInfo: any = null;
let room: any = null;
let mediaStream: MediaStream | null = null;

// Make mediaStream globally accessible for components
if (typeof window !== 'undefined') {
  (window as any).mediaStream = null;
}

// Tipos para el estado de la aplicación (Ya no se usa currentPage, pero lo mantenemos como referencia)
type AppPage = 'home' | 'avatar' | 'voice-agent' | 'audio-test' | 'test-realtime';

function RealTimeApp() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>("Listo para conectar");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estados para grabación de audio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false); // Ref para seguimiento del estado actual

  /**
   * Función para iniciar la grabación de audio
   */
  const startRecording = async (): Promise<void> => {
    console.log("startRecording called, current isRecording:", isRecording, "isRecordingRef:", isRecordingRef.current);
    if (isRecordingRef.current) {
      console.log("Already recording, ignoring start request");
      return;
    }

    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, creating audio blob");
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());

        // Ensure state is updated when recording stops
        isRecordingRef.current = false;
        setIsRecording(false);
      };

      console.log("Starting media recorder...");
      mediaRecorder.start();

      // Update both state and ref
      isRecordingRef.current = true;
      setIsRecording(true);

      setStatus("Grabando audio...");
      console.log("Recording started successfully");
    } catch (err: any) {
      console.error("Error al iniciar grabación:", err);
      setError(`Error al acceder al micrófono: ${err.message}`);
    }
  };

  /**
   * Función para detener la grabación de audio
   */
  const stopRecording = (): void => {
    console.log("stopRecording called, current isRecording:", isRecording, "isRecordingRef:", isRecordingRef.current);
    if (mediaRecorderRef.current && (isRecording || isRecordingRef.current)) {
      console.log("Stopping media recorder...");
      mediaRecorderRef.current.stop();

      // Update both state and ref immediately
      isRecordingRef.current = false;
      setIsRecording(false);

      setStatus("Procesando audio...");
      console.log("Recording stopped successfully");
    } else {
      console.log("No active recording to stop");
    }
  };

  /**
   * Función para enviar audio al webhook y procesar respuesta
   */
  const processAudioWithWebhook = async (blob: Blob): Promise<string | undefined> => {
    console.log("processAudioWithWebhook called with blob:", blob);

    if (!blob || blob.size === 0) {
      console.error("Invalid audio blob for webhook processing");
      setError("No hay audio válido para procesar");
      return;
    }

    try {
      console.log("Creating FormData with audio blob, size:", blob.size, "type:", blob.type);
      const formData = new FormData();

      // Use the correct file extension based on MIME type
      let filename = 'recording.webm';
      if (blob.type.includes('wav')) {
        filename = 'recording.wav';
      } else if (blob.type.includes('mp3')) {
        filename = 'recording.mp3';
      } else if (blob.type.includes('ogg')) {
        filename = 'recording.ogg';
      }

      formData.append('audio', blob, filename);

      console.log("Sending request to webhook URL:", API_CONFIG.webhookUrl);
      setStatus("Enviando audio al webhook...");

      const response = await fetch(API_CONFIG.webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error("Webhook response error:", response.status, response.statusText);
        throw new Error(`Error del webhook: ${response.status} ${response.statusText}`);
      }

      console.log("Webhook response received, processing...");

      try {
        const result = await response.json();
        console.log("Webhook response JSON:", result);

        const scriptText = result.script || result.text || result.response;

        if (!scriptText) {
          console.error("No script text found in webhook response:", result);
          throw new Error("El webhook no devolvió un script válido");
        }

        console.log("Script text extracted from response:", scriptText);
        setTranscript(scriptText);
        setStatus(`Script recibido: "${scriptText}"`);

        // Enviar automáticamente el script al avatar en segundo plano (solo si Heygen está habilitado)
        if (sessionInfo && isConnected && ENABLE_HEYGEN_CONNECTION) {
          console.log("Sending script to avatar:", scriptText);
          await sendText(scriptText, "repeat");
          setStatus(`Avatar respondiendo: "${scriptText}"`);
        } else if (!ENABLE_HEYGEN_CONNECTION) {
          console.log("Heygen disabled - not sending to avatar, but webhook processed successfully");
          setStatus(`Webhook processed: "${scriptText}" (Heygen disabled)`);
        } else {
          console.log("Not sending to avatar (no active session)");
        }

        return scriptText;
      } catch (jsonErr: any) {
        console.error("Error parsing webhook response:", jsonErr);

        // Try to get text response if JSON parsing failed
        const textResponse = await response.text();
        console.log("Webhook raw text response:", textResponse);

        if (textResponse) {
          setTranscript(textResponse);
          setStatus(`Respuesta recibida (no JSON): "${textResponse}"`);

          // Enviar automáticamente el script al avatar en segundo plano (solo si Heygen está habilitado)
          if (sessionInfo && isConnected && ENABLE_HEYGEN_CONNECTION) {
            console.log("Sending text response to avatar:", textResponse);
            await sendText(textResponse, "repeat");
            setStatus(`Avatar respondiendo: "${textResponse}"`);
          } else if (!ENABLE_HEYGEN_CONNECTION) {
            console.log("Heygen disabled - not sending to avatar, but webhook processed successfully");
            setStatus(`Webhook processed: "${textResponse}" (Heygen disabled)`);
          }

          return textResponse;
        } else {
          throw new Error("No se pudo procesar la respuesta del webhook");
        }
      }
    } catch (err: any) {
      console.error("Error al procesar audio:", err);
      setError(`Error al procesar audio: ${err.message}`);
      setStatus("Error al procesar audio con el webhook");
    }
  };

  /**
   * Función para probar la conexión con el webhook de n8n
   */
  const testN8nConnection = async (): Promise<boolean> => {
    if (!API_CONFIG.webhookUrl) {
      console.warn("WEBHOOK_N8N_REALISTIC_AVATAR is not configured in environment variables");
      return false;
    }

    try {
      console.log("Testing n8n webhook connection...");
      console.log("Webhook URL:", API_CONFIG.webhookUrl);
      console.log("Environment variable WEBHOOK_N8N_REALISTIC_AVATAR:", API_CONFIG.webhookUrl);
      setStatus("Testing n8n webhook connection...");

      const response = await fetch(API_CONFIG.webhookUrl, {
        method: 'GET',
      });

      console.log("n8n webhook response status:", response.status);

      if (response.status === 200) {
        console.log("n8n webhook connection successful");
        return true;
      } else {
        console.error("n8n webhook returned unexpected status:", response.status);
        setError(`n8n webhook test failed with status ${response.status}. Please check your webhook configuration.`);
        return false;
      }
    } catch (err: any) {
      console.error("Error testing n8n webhook:", err);
      setError(`Failed to connect to n8n webhook: ${err.message}. Please verify the webhook URL is correct and accessible.`);
      return false;
    }
  };

  /**
   * Función para crear una nueva sesión usando la API directa de HeyGen
   */
  const createSession = async () => {
    // -------------------------------------------------------------------------------- //
    // NEW LOGIC: Try fetching the session token through our abstracted API
    try {
      await fetchSessionToken();
    } catch (apiError: any) {
      console.warn("API Token fetch failed as expected (Backend not ready):", apiError);
      // We log it and optionally you could stop here if ENABLE_HEYGEN_CONNECTION block isn't handling it
    }
    // -------------------------------------------------------------------------------- //

    // Siempre probar la conexión con n8n (independientemente del estado de Heygen)
    console.log("Step 1: Testing n8n webhook connection");
    const n8nConnectionOk = await testN8nConnection();
    if (!n8nConnectionOk) {
      console.error("n8n connection test failed, aborting session creation");
      return;
    }

    // Verificar si la conexión a Heygen está habilitada
    if (!ENABLE_HEYGEN_CONNECTION) {
      console.log("Heygen connection disabled - creating mock session");
      try {
        setIsLoading(true);
        setStatus("Creating mock session (Heygen disabled)...");
        setError(null);

        // Create a mock session instead of calling the real API
        console.log("Creating mock session instead of calling HeyGen API");

        // Wait a bit to simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create mock session info
        sessionInfo = {
          data: {
            session_id: "mock_session_" + Date.now(),
            url: "mock://livekit-url",
            access_token: "mock_token"
          }
        };

        console.log("Created mock session:", sessionInfo);
        setStatus("Mock session created");

        // Skip the actual API calls and LiveKit connection
        console.log("Skipping API calls and LiveKit connection");
        setIsConnected(true);

        // Navigate to avatar page
        navigate('/real-time/avatar');

        // Show a message about disabled connection
        setTimeout(() => {
          setStatus("Heygen connection disabled - using mock mode");
        }, 1000);

        return;
      } catch (err: any) {
        console.error("Error in mock session:", err);
        setError(`Error: ${err.message}`);
        setStatus("Connection error");
      } finally {
        setIsLoading(false);
      }
    }

    if (!API_CONFIG.token) {
      setError("VITE_HEYGEN_API_TOKEN is not configured in environment variables");
      return;
    }

    // Wait for LiveKit to load
    console.log("Step 2: Waiting for LiveKit Client to load...");
    setStatus("Checking LiveKit Client...");
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts && (!(window as any).LivekitClient)) {
      console.log(`Attempt ${attempts + 1}/${maxAttempts}: LiveKit not ready yet`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!(window as any).LivekitClient) {
      setError("LiveKit Client failed to load. Please refresh the page and try again.");
      return;
    }

    console.log("LiveKit Client is ready, proceeding with HeyGen session creation");

    try {
      setIsLoading(true);
      setError(null);

      // Crear nueva sesión
      console.log("Step 3: Creating HeyGen session...");
      setStatus("Testing HeyGen API connection...");
      console.log("API Config:", {
        serverUrl: API_CONFIG.serverUrl,
        token: API_CONFIG.token ? "Present" : "Missing"
      });

      const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_CONFIG.token}`,
        },
        body: JSON.stringify({
          version: "v2",
          avatar_id: API_CONFIG.avatarID, // Tu avatar ID específico: Abigail_expressive_2024112501 ; Wayne_20240711
        }),
      });

      console.log("Session creation response status:", response.status);
      console.log("Session creation response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error("HeyGen session creation error:", errorData);
        throw new Error(`HeyGen API connection failed (${response.status}): ${errorData.message || response.statusText}`);
      }

      sessionInfo = await response.json();
      console.log("HeyGen session created successfully:", sessionInfo);
      setStatus("HeyGen session created ✓");

      // Iniciar streaming
      console.log("Step 4: Starting streaming with session ID:", sessionInfo.data.session_id);
      setStatus("Starting avatar stream...");

      const startResponse = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_CONFIG.token}`,
        },
        body: JSON.stringify({
          session_id: sessionInfo.data.session_id,
        }),
      });

      console.log("Streaming start response status:", startResponse.status);
      console.log("Streaming start response headers:", Object.fromEntries(startResponse.headers.entries()));

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        console.error("Streaming start error:", errorData);
        throw new Error(`Failed to start avatar streaming (${startResponse.status}): ${errorData.message || startResponse.statusText}`);
      }

      console.log("Streaming started successfully ✓");
      setStatus("Avatar stream started ✓");

      setStatus("Connecting to LiveKit room...");

      // Check if LiveKit Client is available
      console.log("Checking LiveKit Client availability...");
      console.log("Window object:", typeof window);
      console.log("LiveKit Client:", typeof (window as any).LivekitClient);
      console.log("LiveKit Client object:", (window as any).LivekitClient);

      // Conectar a la sala de LiveKit
      if (typeof window !== 'undefined' && (window as any).LivekitClient) {
        console.log("LiveKit Client is available, creating room...");
        room = new (window as any).LivekitClient.Room();
        console.log("Room created:", room);

        // Configurar eventos de la sala
        room.on((window as any).LivekitClient.RoomEvent.TrackSubscribed, (track: any) => {
          console.log("Track subscribed:", track.kind);
          if (track.kind === "video" || track.kind === "audio") {
            if (!mediaStream) {
              mediaStream = new MediaStream();
              console.log("Created new MediaStream for tracks");

              // Make it globally accessible
              (window as any).mediaStream = mediaStream;
              console.log("Set global mediaStream reference");
            }
            mediaStream.addTrack(track.mediaStreamTrack);
            console.log(`Added ${track.kind} track to MediaStream`);

            // Always update the global reference
            (window as any).mediaStream = mediaStream;

            if (videoRef.current) {
              console.log("Setting srcObject on videoRef.current");
              videoRef.current.srcObject = mediaStream;

              // Ensure video plays automatically
              videoRef.current.autoplay = true;
              videoRef.current.playsInline = true;

              // Try to force play
              videoRef.current.play().catch((err: Error) => {
                console.error("Error auto-playing video:", err);
              });

              console.log("Video element properties after setting srcObject:", {
                srcObject: videoRef.current.srcObject ? "MediaStream present" : "null",
                autoplay: videoRef.current.autoplay,
                paused: videoRef.current.paused
              });
            } else {
              console.error("videoRef.current is null, cannot set srcObject!");
              console.log("MediaStream is available globally as window.mediaStream");
            }
            setStatus("Video stream connected");
          }
        });

        console.log("Connecting to room with URL:", sessionInfo.data.url);
        console.log("Access token:", sessionInfo.data.access_token ? "Present" : "Missing");

        await room.connect(sessionInfo.data.url, sessionInfo.data.access_token);
        console.log("Room connected successfully");
        setIsConnected(true);
        setStatus("All connections successful! ✓");

        // Navigate to avatar page only after all tests pass
        console.log("Step 5: All connection tests passed, navigating to avatar page");
        navigate('/real-time/avatar');

        // Send test text after connection
        setTimeout(() => {
          sendText("Hello, I'm Richard! Ready to chat with you.");
        }, 2000);

      } else {
        console.error("LiveKit Client not available");
        console.error("Window:", typeof window);
        console.error("LiveKit Client:", typeof (window as any).LivekitClient);
        throw new Error("LiveKit Client is not available. Please refresh the page and try again.");
      }

    } catch (err: any) {
      console.error("Connection error:", err);
      setError(`Connection failed: ${err.message}`);
      setStatus("Connection test failed");

      // Clean up session if it was created
      if (sessionInfo) {
        console.log("Cleaning up failed session...");
        try {
          await fetch(`${API_CONFIG.serverUrl}/v1/streaming.stop`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${API_CONFIG.token}`,
            },
            body: JSON.stringify({
              session_id: sessionInfo.data.session_id,
            }),
          });
          sessionInfo = null;
        } catch (cleanupErr) {
          console.error("Error cleaning up session:", cleanupErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Función para enviar texto al avatar
   */
  const sendText = async (text: string, taskType: string = "repeat") => {
    if (!sessionInfo) {
      setError("No active session");
      return;
    }

    // Si la conexión a Heygen está deshabilitada, usar modo mock
    if (!ENABLE_HEYGEN_CONNECTION) {
      console.log("Heygen connection disabled - mock sending text:", text);

      try {
        // Simulate a delay as if we're sending to the API
        await new Promise(resolve => setTimeout(resolve, 500));

        // Just update the status instead of making the API call
        setStatus(`Mock sent: "${text}" (Heygen disabled)`);

        // Display the transcript as if it came from the API
        setTranscript(text);
      } catch (err: any) {
        console.error("Error in mock sendText:", err);
        setError(`Error: ${err.message}`);
      }
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_CONFIG.token}`,
        },
        body: JSON.stringify({
          session_id: sessionInfo.data.session_id,
          text: text,
          task_type: taskType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error sending text: ${errorData.message || response.statusText}`);
      }

      setStatus(`Sent: "${text}" (${taskType})`);
    } catch (err: any) {
      console.error("Error sending text:", err);
      setError(`Error sending text: ${err.message}`);
    }
  };

  /**
   * Función para cerrar la sesión
   */
  const closeSession = async () => {
    if (!sessionInfo) {
      setStatus("No active session");
      return;
    }

    // Si la conexión a Heygen está deshabilitada, usar modo mock
    if (!ENABLE_HEYGEN_CONNECTION) {
      console.log("Heygen connection disabled - mock closing session");

      try {
        // Simulate a delay as if we're closing the session
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clean up references
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        sessionInfo = null;
        room = null;
        mediaStream = null;
        setIsConnected(false);
        setStatus("Mock session closed (Heygen disabled)");
      } catch (err: any) {
        console.error("Error in mock session close:", err);
        setError(`Error: ${err.message}`);
      }
      return;
    }

    try {
      await fetch(`${API_CONFIG.serverUrl}/v1/streaming.stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_CONFIG.token}`,
        },
        body: JSON.stringify({
          session_id: sessionInfo.data.session_id,
        }),
      });

      if (room) {
        room.disconnect();
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      sessionInfo = null;
      room = null;
      mediaStream = null;
      setIsConnected(false);
      setStatus("Session closed");
    } catch (err: any) {
      console.error("Error closing session:", err);
      setError(`Error closing session: ${err.message}`);
    }
  };

  // Cargar LiveKit Client
  useEffect(() => {
    const loadLiveKit = () => {
      // Si la conexión a Heygen está deshabilitada, no cargar LiveKit
      if (!ENABLE_HEYGEN_CONNECTION) {
        console.log("LiveKit loading disabled - Heygen connection disabled");
        setStatus("Ready to connect (Heygen disabled)");
        return;
      }

      console.log("Loading LiveKit Client...");

      // Check if LiveKit is already loaded
      if (typeof window !== 'undefined' && (window as any).LivekitClient) {
        console.log("LiveKit Client already loaded");
        setStatus("LiveKit Client ready");
        return;
      }

      // Load LiveKit Client script
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js';
      script.onload = () => {
        console.log("LiveKit Client loaded successfully");
        console.log("LiveKit Client available:", typeof (window as any).LivekitClient);
        setStatus("LiveKit Client ready");
      };
      script.onerror = () => {
        console.error("Failed to load LiveKit Client");
        setError("Failed to load LiveKit Client");
      };
      document.head.appendChild(script);
    };

    loadLiveKit();
  }, []);

  /**
   * Maneja la desconexión y navegación de vuelta al inicio
   */
  const handleDisconnect = () => {
    closeSession();
    navigate('/real-time');
  };

  /**
   * Maneja la navegación a la página de prueba de audio
   */
  const handleGoToAudioTest = () => {
    console.log("Navigating to audio test page");
    navigate('/real-time/audio-test');
  };

  /**
   * Maneja la navegación de vuelta desde la página de prueba de audio
   */
  const handleBackFromAudioTest = () => {
    console.log("Navigating back from audio test page");
    navigate('/real-time');
  };

  /**
   * Maneja la conexión al avatar realista
   */
  const handleConnectRealistic = () => {
    console.log("Connecting to realistic avatar...");
    createSession();
  };

  /**
   * Maneja la conexión al agente de voz
   */
  const handleConnectVoice = () => {
    console.log("Connecting to voice agent...");
    navigate('/real-time/voice');
  };

  /**
   * Maneja la navegación a la página de prueba de realtime
   */
  const handleTestRealtime = () => {
    console.log("Navigating to test realtime page");
    navigate('/real-time/test-realtime');
  };

  return (
    <div className="real-time-scope root-container w-full h-full flex flex-col">
      <Routes>
        <Route path="/" element={
          <HomePage
            isLoading={isLoading}
            error={error}
            status={status}
            onConnectRealistic={handleConnectRealistic}
            onConnectVoice={handleConnectVoice}
            onAudioTest={handleGoToAudioTest}
            onTestRealtime={handleTestRealtime}
          />
        } />
        <Route path="/avatar" element={
          <AvatarPage
            status={status}
            error={error}
            videoRef={videoRef}
            onDisconnect={handleDisconnect}
            onProcessAudio={processAudioWithWebhook}
            webhookUrl={API_CONFIG.webhookUrl}
            onSendText={sendText}
          />
        } />
        <Route path="/voice" element={
          <VoiceAgentPage
            status={status}
            error={error}
            onDisconnect={handleDisconnect}
            onProcessAudio={processAudioWithWebhook}
            webhookUrl={API_CONFIG.webhookUrl}
            onSendText={sendText}
          />
        } />
        <Route path="/test-realtime" element={
          <TestRealtimePage />
        } />
        <Route path="/audio-test" element={
          <AudioTestPage
            onBack={handleBackFromAudioTest}
            webhookUrl={API_CONFIG.webhookUrl}
            onWebhookResponse={(response: string) => {
              console.log("Webhook response received in App:", response);
              setTranscript(response);
              setStatus(`Respuesta del webhook: "${response}"`);
            }}
          />
        } />
      </Routes>
    </div>
  );
}

export default RealTimeApp;
