// @ts-nocheck
import { useState, useRef } from 'react';

/**
 * Página de prueba aislada para WebRTC con OpenAI Realtime API
 * Implementa el enfoque de interfaz unificada (unified interface)
 */
const TestRealtimePage = () => {
  const [connectStatus, setConnectStatus] = useState<'notConnect' | 'connecting' | 'connected'>('notConnect');
  const [outputText, setOutputText] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Configuración de sesión (unified interface approach)
  const sessionConfig = JSON.stringify({
    type: "realtime",
    model: "gpt-4o-realtime-preview-2024-12-17",
    audio: { output: { voice: "marin" } }
  });

  // Helper para agregar logs
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // 1. Enviar SDP al servidor backend (unified interface)
  const sendSDPToServer = async (pc: RTCPeerConnection, offer: RTCSessionDescriptionInit) => {
    addLog('Enviando SDP al servidor backend...');

    const response = await fetch('/session', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        'Content-Type': 'application/sdp',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }

    const sdpAnswer = await response.text();
    addLog('8. SDP de respuesta recibido del servidor');

    const answer: RTCSessionDescriptionInit = {
      type: 'answer',
      sdp: sdpAnswer,
    };

    await pc.setRemoteDescription(answer);
    addLog('9. Remote description establecida');
    addLog('✅ Conexión WebRTC completada exitosamente');
  };

  // 2. Manejar eventos de OpenAI
  const handleOpenAIEvent = (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    const { type } = message;

    addLog(`Evento recibido: ${type}`);

    switch (type) {
      case 'session.created':
        addLog('✅ Sesión creada en OpenAI');
        break;
      case 'input_audio_buffer.speech_started':
        setOutputText('🎤 Escuchando...');
        break;
      case 'input_audio_buffer.speech_stopped':
        setOutputText('⏸️ Procesando...');
        break;
      case 'response.audio_transcript.delta':
        if (message.delta) {
          setOutputText(prev => prev + message.delta);
        }
        break;
      case 'response.audio_transcript.done':
        setOutputText(`AI: ${message.transcript}`);
        addLog(`Transcripción: ${message.transcript}`);
        break;
      case 'response.done':
        addLog('✅ Respuesta completada');
        break;
      case 'error':
        addLog(`❌ Error: ${message.error?.message}`);
        break;
    }
  };

  // 3. Conectar a OpenAI WebRTC (unified interface approach)
  const startConnection = async () => {
    if (connectStatus !== 'notConnect') {
      return;
    }

    setConnectStatus('connecting');
    setLogs([]);

    try {
      // 1. Start sessions - Get an ephemeral key from your server
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_OPENAI_API_KEY is missing in environment variables.");
      }

      const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "alloy",
        }),
      })
      const data = await r.json();
      const sessionId = data.id;
      addLog(`Session ID: ${sessionId}`);

      // Display the returned data in the frontend
      setOutputText(JSON.stringify(data, null, 2));

      return data.client_secret.value;

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setConnectStatus('notConnect');
      setOutputText(`Error: ${error.message}`);
    }
  };

  // 4. Desconectar
  const disconnect = () => {
    addLog('Desconectando...');

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setConnectStatus('notConnect');
    setOutputText('Desconectado');
    addLog('✅ Desconectado');
  };

  // Texto del botón según el estado
  const getButtonText = () => {
    if (connectStatus === 'notConnect') return 'Connect';
    if (connectStatus === 'connecting') return 'Connecting...';
    return 'Disconnect';
  };

  // Initialize WebRTC connection
  const initWebRTC = async () => {
    setConnectStatus('connecting');
    addLog('Starting WebRTC connection...');

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
      pc.ontrack = e => {
        audioEl.srcObject = e.streams[0];
        addLog('AI audio track received');
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
        setConnectStatus('connected');
        setOutputText('Connected! You can speak now.');
      };

      dc.addEventListener("message", (e) => {
        // Realtime server events appear here!
        const event = JSON.parse(e.data);
        addLog(`Event: ${event.type}`);
        if (event.type === 'response.audio_transcript.done') {
          setOutputText(`AI: ${event.transcript}`);
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
      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
      addLog('WebRTC connection established');

    } catch (error: any) {
      addLog(`Error: ${error.message}`);
      setConnectStatus('notConnect');
      setOutputText(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>OpenAI Realtime Test Page (Unified Interface)</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            if (connectStatus === 'notConnect') {
              initWebRTC();
            } else if (connectStatus === 'connected') {
              disconnect();
            }
          }}
          disabled={connectStatus === 'connecting'}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: connectStatus === 'connecting' ? 'wait' : 'pointer'
          }}
        >
          {getButtonText()}
        </button>
        <span style={{ marginLeft: '20px' }}>
          Status: <strong>{connectStatus}</strong>
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Output:</h3>
        <div style={{
          padding: '10px',
          border: '1px solid #ccc',
          minHeight: '100px',
          backgroundColor: '#f5f5f5'
        }}>
          {outputText || 'No output yet'}
        </div>
      </div>

      <div>
        <h3>Logs:</h3>
        <div style={{
          padding: '10px',
          border: '1px solid #ccc',
          maxHeight: '300px',
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          color: '#00ff00',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? 'No logs yet' : logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Instructions: Click Connect, allow microphone access, and start speaking.</p>
        <p>The AI will respond automatically when you stop talking.</p>
        <p><strong>Approach:</strong> Unified Interface (uses /session endpoint)</p>
      </div>
    </div>
  );
};

export default TestRealtimePage;
