import React, { useEffect, useRef, useState } from 'react';
import { LogOut, Mic, AlertCircle } from 'lucide-react';
import { AI_PROMPTS } from '../../config/aiPrompts';
import GlassCard from './GlassCard';

interface VoiceAgentViewProps {
    status?: string;
    error?: string | null;
    onDisconnect: () => void;
    onProcessAudio?: (audioBlob: Blob) => void;
    webhookUrl?: string;
    onSendText?: (text: string) => void;
}

type ConnectionState = 'notConnect' | 'connecting' | 'connected';

const RealTimeVoice: React.FC<VoiceAgentViewProps> = ({
    error = null,
    onDisconnect
}) => {
    const [connectStatus, setConnectStatus] = useState<ConnectionState>('notConnect');
    const [, setOutputText] = useState<string>('');
    const [, setLogs] = useState<string[]>([]);
    const [statusText, setStatusText] = useState("Ready to connect");
    const [responseStatus, setResponseStatus] = useState("Click the microphone to start");

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const startConnection = async () => {
        addLog('1. Requesting ephemeral token...');
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) throw new Error("VITE_OPENAI_API_KEY is missing in environment variables.");

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

        if (!response.ok) throw new Error(`Error obtaining token: ${response.statusText}`);
        const data = await response.json();
        addLog('2. Ephemeral token obtained successfully');
        setOutputText(JSON.stringify(data, null, 2));
        return data.client_secret.value;
    };

    const initWebRTC = async () => {
        setConnectStatus('connecting');
        addLog('Starting WebRTC connection...');
        setStatusText("Connecting to voice agent...");
        setResponseStatus("Initializing...");

        try {
            const EPHEMERAL_KEY = await startConnection();
            addLog('Ephemeral key obtained');

            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;

            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            audioEl.style.display = 'none';
            document.body.appendChild(audioEl);
            audioElementRef.current = audioEl;

            pc.ontrack = e => {
                audioEl.srcObject = e.streams[0];
                addLog('AI audio track received');
                setupAIAudioVisualizer(e.streams[0]);
            };

            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = ms;
            pc.addTrack(ms.getTracks()[0], ms);
            addLog('Microphone connected');

            const dc = pc.createDataChannel("oai-events");
            dataChannelRef.current = dc;

            dc.onopen = () => {
                addLog('Data channel opened');
                const sessionConfig = {
                    type: "session.update",
                    session: {
                        instructions: AI_PROMPTS.VOICE_AGENT_INSTRUCTIONS
                    }
                };
                dc.send(JSON.stringify(sessionConfig));
                addLog('System prompt sent');
                setConnectStatus('connected');
                setOutputText('Connected! You can speak now.');
                setStatusText("Connected - You can start speaking");
                setResponseStatus("Listening...");
            };

            dc.addEventListener("message", (e) => {
                const event = JSON.parse(e.data);
                addLog(`Event: ${event.type}`);
                switch (event.type) {
                    case 'response.audio_transcript.done':
                        setOutputText(`AI: ${event.transcript}`);
                        setStatusText(`AI: "${event.transcript}"`);
                        break;
                    case 'response.audio.delta':
                        setResponseStatus("AI is speaking...");
                        break;
                    case 'response.audio.done':
                        setResponseStatus("Listening...");
                        break;
                }
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            addLog('SDP offer created');

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

            const answer: RTCSessionDescriptionInit = {
                type: "answer",
                sdp: await sdpResponse.text(),
            };
            await pc.setRemoteDescription(answer);
            addLog('WebRTC connection established');
            setStatusText("Connected - You can start speaking");
            setResponseStatus("Listening...");

        } catch (err: any) {
            addLog(`Error: ${err.message}`);
            setConnectStatus('notConnect');
            setOutputText(`Error: ${err.message}`);
            setStatusText(`Error: ${err.message}`);
            setResponseStatus("Connection error");
        }
    };

    const disconnect = () => {
        addLog('Disconnecting...');
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
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analyserRef.current = null;

        setConnectStatus('notConnect');
        setOutputText('Disconnected');
        setStatusText("Disconnected");
        setResponseStatus("Disconnected");
    };

    const setupAIAudioVisualizer = (remoteStream: MediaStream) => {
        try {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const source = audioContext.createMediaStreamSource(remoteStream);
            source.connect(analyser);

            const draw = () => {
                animationFrameRef.current = requestAnimationFrame(draw);
                analyser.getByteTimeDomainData(dataArray);

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.lineWidth = 2;
                ctx.strokeStyle = '#555555';
                ctx.beginPath();

                const sliceWidth = canvas.width / dataArray.length;
                let x = 0;

                for (let i = 0; i < dataArray.length; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * canvas.height / 2;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
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

    const stopVisualizationLoop = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    };

    const handleRecordingButtonClick = () => {
        if (connectStatus === 'notConnect') initWebRTC();
        else if (connectStatus === 'connected') disconnect();
    };

    const handleDisconnect = () => {
        disconnect();
        onDisconnect();
    };

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    let recordingBtnClass = "recording-btn";
    if (connectStatus === 'connected') recordingBtnClass += " recording";

    return (
        <GlassCard containerClassName="max-w-[480px]" innerClassName="w-full !p-0 !bg-transparent border-0 shadow-none">
            <div className="va-container !h-auto !min-h-[500px] w-full bg-white rounded-[2rem]">
                <div className="va-header">
                    <div className="va-brand">
                        <h1 className="va-title">
                            ENZO <span>CUSTOM</span>
                        </h1>
                        <span className="va-subtitle">VOICE AGENT</span>
                    </div>
                    <button onClick={handleDisconnect} className="va-disconnect-btn">
                        <LogOut className="va-icon-small" />
                        DISCONNECT
                    </button>
                </div>

                <div className="va-main">
                    <div className="va-center-group">
                        <button
                            className={recordingBtnClass}
                            onClick={handleRecordingButtonClick}
                        >
                            <Mic className="va-mic-icon" />
                        </button>
                        <p className="va-connect-text">
                            {connectStatus === 'notConnect' ? 'Click to connect' : connectStatus === 'connecting' ? 'Connecting...' : statusText}
                        </p>

                        {/* Visualizer canvas */}
                        <div className="va-visualizer-container" style={{ display: connectStatus === 'connected' ? 'block' : 'none' }}>
                            <canvas ref={canvasRef} className="va-audio-canvas"></canvas>
                        </div>
                    </div>
                    
                    <div className="va-bottom-text">
                        <p>{responseStatus}</p>
                    </div>
                </div>

                {error && (
                    <div className="va-error-container">
                        <AlertCircle className="va-icon-error" />
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </GlassCard>
    );
};

export default RealTimeVoice;
