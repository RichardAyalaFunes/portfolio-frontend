import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Mic, AlertCircle, Download, StopCircle, UploadCloud } from 'lucide-react';
import GlassCard from './GlassCard';
import MicWave from './MicWave';

interface AudioTestProps {
    onBack: () => void;
    webhookUrl?: string;
    onWebhookResponse?: (response: string) => void;
}

const RealTimeAudioTest: React.FC<AudioTestProps> = ({ onBack, webhookUrl, onWebhookResponse }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isSendingToWebhook, setIsSendingToWebhook] = useState(false);
    const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

    useEffect(() => {
        const fetchDevices = async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioIn = devices.filter(d => d.kind === 'audioinput');
            setAudioDevices(audioIn);
            if (audioIn[0]) setSelectedDeviceId(audioIn[0].deviceId);
        };
        fetchDevices();
    }, []);

    useEffect(() => {
        if (!audioBlob || !audioPlayerRef.current) return;
        const url = URL.createObjectURL(audioBlob);
        audioPlayerRef.current.src = url;
        return () => URL.revokeObjectURL(url);
    }, [audioBlob]);

    const startRecording = async () => {
        try {
            const constraints = selectedDeviceId ? { audio: { deviceId: { exact: selectedDeviceId } } } : { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
                const generatedBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(generatedBlob);
                stream.getTracks().forEach(track => track.stop());

                const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
                setRecordingDuration(finalDuration);

                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                    durationIntervalRef.current = null;
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError(null);

            durationIntervalRef.current = setInterval(() => {
                const elapsed = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
                setRecordingDuration(elapsed);
            }, 1000);

        } catch (err: any) {
            setError(`Error accessing microphone: ${err.message}`);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const downloadAudio = () => {
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
    };

    const sendToWebhook = async () => {
        if (!audioBlob) {
            setError("No hay audio grabado para enviar");
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

            const formData = new FormData();
            let filename = 'recording.webm';
            if (audioBlob.type.includes('wav')) filename = 'recording.wav';
            else if (audioBlob.type.includes('mp3')) filename = 'recording.mp3';
            else if (audioBlob.type.includes('ogg')) filename = 'recording.ogg';

            formData.append('audio', audioBlob, filename);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
            }

            try {
                const result = await response.json();
                const scriptText = result.script || result.text || result.response;
                if (!scriptText) throw new Error("No script received");
                setWebhookResponse(scriptText);
                if (onWebhookResponse) onWebhookResponse(scriptText);
            } catch (jsonErr: any) {
                const textResponse = await response.text();
                if (textResponse) {
                    setWebhookResponse(textResponse);
                    if (onWebhookResponse) onWebhookResponse(textResponse);
                } else {
                    throw new Error("Failed to process webhook response");
                }
            }
        } catch (err: any) {
            setError(`Error enviando al webhook: ${err.message}`);
        } finally {
            setIsSendingToWebhook(false);
        }
    };

    return (
        <GlassCard containerClassName="max-w-2xl" innerClassName="w-full">
            <div className="p-6 md:p-10 w-full flex flex-col items-center">

                {/* Header */}
                <div className="w-full flex items-center justify-between mb-8 pb-6 border-b border-slate-200/50">
                    <div className="flex flex-col">
                        <h1 className="font-light text-2xl tracking-widest text-slate-800">
                            AUDIO<span className="font-medium text-indigo-600">TEST</span>
                        </h1>
                        <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-indigo-500 mt-1">
                            Microphone configuration
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-400 hover:text-slate-600 rounded-full text-[10px] font-semibold tracking-wider transition-all duration-300"
                    >
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                        BACK
                    </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 font-light tracking-wide text-center mb-8">
                    Test your microphone before connecting to the virtual consultant
                </p>

                {/* Device selector */}
                {audioDevices.length > 0 && (
                    <div className="w-full mb-6">
                        <label className="block text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-2">
                            Microphone
                        </label>
                        <select
                            value={selectedDeviceId}
                            onChange={e => setSelectedDeviceId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-colors"
                        >
                            {audioDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Record button + mic wave + status */}
                <div className="w-full flex flex-col items-center space-y-5 mb-8">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`group relative flex items-center justify-center w-20 h-20 rounded-full border-4 transition-all duration-300 will-change-transform ${
                            isRecording
                                ? 'bg-red-50 border-red-200 shadow-[0_0_30px_rgba(239,68,68,0.25)]'
                                : 'bg-white border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02),0_10px_30px_rgba(0,0,0,0.05)] hover:border-indigo-200/70 hover:shadow-[0_10px_40px_rgba(99,102,241,0.15)] hover:-translate-y-1'
                        }`}
                    >
                        {isRecording
                            ? <StopCircle className="w-8 h-8 text-red-400" />
                            : <Mic className="w-8 h-8 text-slate-400 transition-colors duration-300 group-hover:text-indigo-500" />
                        }
                        {isRecording && (
                            <div className="absolute inset-[-10px] border border-red-300/50 rounded-full animate-[ping_2s_infinite]" />
                        )}
                    </button>

                    <MicWave isActive={isRecording} barCount={28} className="w-full max-w-xs" />

                    <div className="text-center space-y-1">
                        <p className={`text-sm font-semibold tracking-widest uppercase ${isRecording ? 'text-red-500' : 'text-slate-600'}`}>
                            {isRecording
                                ? `Recording... ${recordingDuration}s`
                                : (audioBlob ? 'Recording completed' : 'Click to record')}
                        </p>
                        <p className="text-xs text-slate-400 font-light">
                            {isRecording
                                ? 'Click again to stop'
                                : (audioBlob ? 'Play back your recording below' : 'Test your microphone audio')}
                        </p>
                    </div>
                </div>

                {/* Audio playback + actions */}
                {audioBlob && (
                    <div className="w-full flex flex-col items-center gap-5 mb-6 p-5 bg-slate-50/60 rounded-2xl border border-slate-100">
                        <audio ref={audioPlayerRef} controls className="w-full outline-none" />

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={downloadAudio}
                                className="group inline-flex items-center gap-2 px-5 py-2 bg-slate-100 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 hover:shadow-[0_4px_14px_rgba(99,102,241,0.12)]"
                            >
                                <Download className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                Download
                            </button>
                            {webhookUrl && (
                                <button
                                    onClick={sendToWebhook}
                                    disabled={isSendingToWebhook}
                                    className="group inline-flex items-center gap-2 px-5 py-2 bg-slate-100 border border-slate-200 hover:bg-violet-50 hover:border-violet-200 text-slate-500 hover:text-violet-600 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 hover:shadow-[0_4px_14px_rgba(139,92,246,0.12)] disabled:opacity-50"
                                >
                                    <UploadCloud className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                    {isSendingToWebhook ? 'Sending...' : 'Send to Webhook'}
                                </button>
                            )}
                        </div>

                        {webhookResponse && (
                            <div className="w-full p-4 bg-white border border-slate-200 rounded-xl text-left">
                                <p className="text-xs text-slate-600 font-mono leading-relaxed">{webhookResponse}</p>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="w-full p-4 bg-red-50 border border-red-200/60 rounded-xl text-center space-y-1.5">
                        <h3 className="flex items-center justify-center gap-1.5 text-red-500 font-medium text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Error
                        </h3>
                        <p className="text-xs text-red-400">{error}</p>
                    </div>
                )}
            </div>
        </GlassCard>
    );
};

export default RealTimeAudioTest;
