import { useState, useRef } from 'react';

const TestRealtimePage = () => {
    const [connectStatus, setConnectStatus] = useState<'notConnect' | 'connecting' | 'connected'>('notConnect');
    const [outputText, setOutputText] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const startConnection = async () => {
        if (connectStatus !== 'notConnect') return;
        setConnectStatus('connecting');
        setLogs([]);

        try {
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (!apiKey) throw new Error("VITE_OPENAI_API_KEY is missing in environment variables.");

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
            });
            const data = await r.json();
            addLog(`Session ID: ${data.id}`);
            setOutputText(JSON.stringify(data, null, 2));
            return data.client_secret.value;
        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
            setConnectStatus('notConnect');
            setOutputText(`Error: ${error.message}`);
        }
    };

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

    const getButtonText = () => {
        if (connectStatus === 'notConnect') return 'Connect';
        if (connectStatus === 'connecting') return 'Connecting...';
        return 'Disconnect';
    };

    const initWebRTC = async () => {
        setConnectStatus('connecting');
        addLog('Starting WebRTC connection...');

        try {
            const EPHEMERAL_KEY = await startConnection();
            addLog('Ephemeral key obtained');

            const pc = new RTCPeerConnection();
            peerConnectionRef.current = pc;

            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            audioEl.style.display = 'none';
            document.body.appendChild(audioEl);
            pc.ontrack = e => {
                audioEl.srcObject = e.streams[0];
                addLog('AI audio track received');
            };

            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = ms;
            pc.addTrack(ms.getTracks()[0], ms);
            addLog('Microphone connected');

            const dc = pc.createDataChannel("oai-events");
            dataChannelRef.current = dc;

            dc.onopen = () => {
                addLog('Data channel opened');
                setConnectStatus('connected');
                setOutputText('Connected! You can speak now.');
            };

            dc.addEventListener("message", (e) => {
                const event = JSON.parse(e.data);
                addLog(`Event: ${event.type}`);
                if (event.type === 'response.audio_transcript.done') {
                    setOutputText(`AI: ${event.transcript}`);
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

            const answer = {
                type: "answer" as RTCSdpType,
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
                        if (connectStatus === 'notConnect') initWebRTC();
                        else if (connectStatus === 'connected') disconnect();
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
                <div style={{ padding: '10px', border: '1px solid #ccc', minHeight: '100px', backgroundColor: '#f5f5f5' }}>
                    {outputText || 'No output yet'}
                </div>
            </div>
            <div>
                <h3>Logs:</h3>
                <div style={{ padding: '10px', border: '1px solid #ccc', maxHeight: '300px', overflow: 'auto', backgroundColor: '#1e1e1e', color: '#00ff00', fontSize: '12px' }}>
                    {logs.length === 0 ? 'No logs yet' : logs.map((log, index) => <div key={index}>{log}</div>)}
                </div>
            </div>
        </div>
    );
};

export default TestRealtimePage;
