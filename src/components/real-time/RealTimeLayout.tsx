// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import RealTimeHome from "./RealTimeHome";
import RealTimeAvatar from "./RealTimeAvatar";
import RealTimeVoice from "./RealTimeVoice";
import RealTimeAudioTest from "./RealTimeAudioTest";
import TestRealtimePage from "./TestRealtimePage";
import RealTimeBackground from "./RealTimeBackground";
import { fetchSessionToken } from "../../api/liveAvatarApi";
import "./RealTimeStyles.css";

const ENABLE_HEYGEN_CONNECTION = false;

const API_CONFIG = {
    serverUrl: "https://api.heygen.com",
    token: import.meta.env.VITE_HEYGEN_API_TOKEN || "",
    webhookUrl: import.meta.env.VITE_WEBHOOK_N8N_REALISTIC_AVATAR || "",
    avatarID: "Graham_Chair_Sitting_public",
};

let sessionInfo: any = null;
let room: any = null;
let mediaStream: MediaStream | null = null;

if (typeof window !== 'undefined') {
    (window as any).mediaStream = null;
}

function RealTimeLayout() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState<string>("Ready to connect");
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [transcript, setTranscript] = useState<string>("");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isRecordingRef = useRef<boolean>(false);

    const startRecording = async (): Promise<void> => {
        if (isRecordingRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
                isRecordingRef.current = false;
                setIsRecording(false);
            };
                
            mediaRecorder.start();
            isRecordingRef.current = true;
            setIsRecording(true);
            setStatus("Grabando audio...");
        } catch (err: any) {
            setError(`Error al acceder al micrófono: ${err.message}`);
        }
    };

    const stopRecording = (): void => {
        if (mediaRecorderRef.current && (isRecording || isRecordingRef.current)) {
            mediaRecorderRef.current.stop();
            isRecordingRef.current = false;
            setIsRecording(false);
            setStatus("Procesando audio...");
        }
    };

    const processAudioWithWebhook = async (blob: Blob): Promise<string | undefined> => {
        if (!blob || blob.size === 0) {
            setError("No hay audio válido para procesar");
            return;
        }

        try {
            const formData = new FormData();
            let filename = 'recording.webm';
            if (blob.type.includes('wav')) filename = 'recording.wav';
            else if (blob.type.includes('mp3')) filename = 'recording.mp3';
            else if (blob.type.includes('ogg')) filename = 'recording.ogg';

            formData.append('audio', blob, filename);
            setStatus("Enviando audio al webhook...");

            const response = await fetch(API_CONFIG.webhookUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error(`Error del webhook: ${response.status} ${response.statusText}`);

            try {
                const result = await response.json();
                const scriptText = result.script || result.text || result.response;
                if (!scriptText) throw new Error("El webhook no devolvió un script válido");

                setTranscript(scriptText);
                setStatus(`Script recibido: "${scriptText}"`);

                if (sessionInfo && isConnected && ENABLE_HEYGEN_CONNECTION) {
                    await sendText(scriptText, "repeat");
                    setStatus(`Avatar respondiendo: "${scriptText}"`);
                } else if (!ENABLE_HEYGEN_CONNECTION) {
                    setStatus(`Webhook processed: "${scriptText}" (Heygen disabled)`);
                }

                return scriptText;
            } catch (jsonErr: any) {
                const textResponse = await response.text();
                if (textResponse) {
                    setTranscript(textResponse);
                    setStatus(`Respuesta recibida: "${textResponse}"`);

                    if (sessionInfo && isConnected && ENABLE_HEYGEN_CONNECTION) {
                        await sendText(textResponse, "repeat");
                        setStatus(`Avatar respondiendo: "${textResponse}"`);
                    }
                    return textResponse;
                } else {
                    throw new Error("No se pudo procesar la respuesta del webhook");
                }
            }
        } catch (err: any) {
            setError(`Error al procesar audio: ${err.message}`);
            setStatus("Error al procesar audio con el webhook");
        }
    };

    const testN8nConnection = async (): Promise<boolean> => {
        if (!API_CONFIG.webhookUrl) return false;

        try {
            setStatus("Testing n8n webhook connection...");
            const response = await fetch(API_CONFIG.webhookUrl, { method: 'GET' });
            if (response.status === 200) return true;
            setError(`n8n webhook test failed with status ${response.status}.`);
            return false;
        } catch (err: any) {
            setError(`Failed to connect to n8n webhook: ${err.message}.`);
            return false;
        }
    };

    const createSession = async () => {
        try { await fetchSessionToken(); } catch (apiError: any) { }

        if (ENABLE_HEYGEN_CONNECTION) {
            const n8nConnectionOk = await testN8nConnection();
            if (!n8nConnectionOk) return;
        }

        if (!ENABLE_HEYGEN_CONNECTION) {
            try {
                setIsLoading(true);
                setStatus("Creating mock session (Heygen disabled)...");
                setError(null);

                await new Promise(resolve => setTimeout(resolve, 1000));
                sessionInfo = {
                    data: {
                        session_id: "mock_session_" + Date.now(),
                        url: "mock://livekit-url",
                        access_token: "mock_token"
                    }
                };

                setStatus("Mock session created");
                setIsConnected(true);
                navigate('/real-time/avatar');
                setTimeout(() => setStatus("Heygen connection disabled - using mock mode"), 1000);
                return;
            } catch (err: any) {
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

        setStatus("Checking LiveKit Client...");
        let attempts = 0;
        while (attempts < 10 && (!(window as any).LivekitClient)) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (!(window as any).LivekitClient) {
            setError("LiveKit Client failed to load.");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setStatus("Testing HeyGen API connection...");

            const response = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_CONFIG.token}`,
                },
                body: JSON.stringify({
                    version: "v2",
                    avatar_id: API_CONFIG.avatarID,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HeyGen API connection failed (${response.status}): ${errorData.message}`);
            }

            sessionInfo = await response.json();
            setStatus("HeyGen session created ✓");
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

            if (!startResponse.ok) {
                const errorData = await startResponse.json();
                throw new Error(`Failed to start avatar streaming (${startResponse.status}): ${errorData.message}`);
            }

            setStatus("Avatar stream started ✓");
            setStatus("Connecting to LiveKit room...");

            if (typeof window !== 'undefined' && (window as any).LivekitClient) {
                room = new (window as any).LivekitClient.Room();

                room.on((window as any).LivekitClient.RoomEvent.TrackSubscribed, (track: any) => {
                    if (track.kind === "video" || track.kind === "audio") {
                        if (!mediaStream) {
                            mediaStream = new MediaStream();
                            (window as any).mediaStream = mediaStream;
                        }
                        mediaStream.addTrack(track.mediaStreamTrack);
                        (window as any).mediaStream = mediaStream;

                        if (videoRef.current) {
                            videoRef.current.srcObject = mediaStream;
                            videoRef.current.autoplay = true;
                            videoRef.current.playsInline = true;
                            videoRef.current.play().catch(() => { });
                        }
                        setStatus("Video stream connected");
                    }
                });

                await room.connect(sessionInfo.data.url, sessionInfo.data.access_token);
                setIsConnected(true);
                setStatus("All connections successful! ✓");

                navigate('/real-time/avatar');
                setTimeout(() => {
                    sendText("Hello, I'm Richard! Ready to chat with you.");
                }, 2000);

            } else {
                throw new Error("LiveKit Client is not available.");
            }

        } catch (err: any) {
            setError(`Connection failed: ${err.message}`);
            setStatus("Connection test failed");

            if (sessionInfo) {
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
                } catch (cleanupErr) { }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const sendText = async (text: string, taskType: string = "repeat") => {
        if (!sessionInfo) {
            setError("No active session");
            return;
        }

        if (!ENABLE_HEYGEN_CONNECTION) {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                setStatus(`Mock sent: "${text}" (Heygen disabled)`);
                setTranscript(text);
            } catch (err: any) {
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
                throw new Error(`Error sending text: ${errorData.message}`);
            }

            setStatus(`Sent: "${text}" (${taskType})`);
        } catch (err: any) {
            setError(`Error sending text: ${err.message}`);
        }
    };

    const closeSession = async () => {
        if (!sessionInfo) {
            setStatus("No active session");
            return;
        }

        if (!ENABLE_HEYGEN_CONNECTION) {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                if (videoRef.current) videoRef.current.srcObject = null;
                sessionInfo = null;
                room = null;
                mediaStream = null;
                setIsConnected(false);
                setStatus("Mock session closed (Heygen disabled)");
            } catch (err: any) {
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

            if (room) room.disconnect();
            if (videoRef.current) videoRef.current.srcObject = null;

            sessionInfo = null;
            room = null;
            mediaStream = null;
            setIsConnected(false);
            setStatus("Session closed");
        } catch (err: any) {
            setError(`Error closing session: ${err.message}`);
        }
    };

    useEffect(() => {
        const loadLiveKit = () => {
            if (!ENABLE_HEYGEN_CONNECTION) {
                setStatus("Ready to connect (Heygen disabled)");
                return;
            }
            if (typeof window !== 'undefined' && (window as any).LivekitClient) {
                setStatus("LiveKit Client ready");
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js';
            script.onload = () => setStatus("LiveKit Client ready");
            script.onerror = () => setError("Failed to load LiveKit Client");
            document.head.appendChild(script);
        };

        loadLiveKit();
    }, []);

    const handleDisconnect = () => {
        closeSession();
        navigate('/real-time');
    };

    return (
        <div className="root-container w-full min-h-screen relative flex flex-col rt-typography bg-background overflow-x-hidden">
            <RealTimeBackground />
            
            <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4 py-8 md:p-8">
                <Routes>
                    <Route path="/" element={
                        <RealTimeHome
                            isLoading={isLoading}
                            error={error}
                            status={status}
                            onConnectRealistic={() => createSession()}
                            onConnectVoice={() => navigate('/real-time/voice')}
                            onAudioTest={() => navigate('/real-time/audio-test')}
                            onTestRealtime={() => navigate('/real-time/test-realtime')}
                        />
                    } />
                    <Route path="/avatar" element={
                        <RealTimeAvatar
                            status={status}
                            error={error}
                            videoRef={videoRef}
                            onDisconnect={handleDisconnect}
                            webhookUrl={API_CONFIG.webhookUrl}
                            onSendText={sendText}
                        />
                    } />
                    <Route path="/voice" element={
                        <RealTimeVoice
                            error={error}
                            onDisconnect={handleDisconnect}
                        />
                    } />
                    <Route path="/test-realtime" element={<TestRealtimePage />} />
                    <Route path="/audio-test" element={
                        <RealTimeAudioTest
                            onBack={() => navigate('/real-time')}
                            webhookUrl={API_CONFIG.webhookUrl}
                            onWebhookResponse={(response: string) => {
                                setTranscript(response);
                                setStatus(`Respuesta del webhook: "${response}"`);
                            }}
                        />
                    } />
                </Routes>
            </div>
        </div>
    );
}

export default RealTimeLayout;
