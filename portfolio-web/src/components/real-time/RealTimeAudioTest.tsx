import React, { useRef, useState } from 'react';
import { ArrowLeft, Mic, AlertCircle, Download, StopCircle, UploadCloud } from 'lucide-react';
import GlassCard from './GlassCard';

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

    const startRecording = async () => {
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
                const generatedBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                setAudioBlob(generatedBlob);
                stream.getTracks().forEach(track => track.stop());

                const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
                setRecordingDuration(finalDuration);

                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                    durationIntervalRef.current = null;
                }

                if (audioPlayerRef.current) {
                    audioPlayerRef.current.src = URL.createObjectURL(generatedBlob);
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
        <GlassCard containerClassName="max-w-4xl" innerClassName="w-full">
            <div className="p-4 md:p-12 w-full text-center flex flex-col items-center">
                
                {/* Logo */}
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-serif tracking-[0.1em] text-black">
                        <span className="font-extrabold">ENZO</span><span className="font-normal text-slate-800">CUSTOM</span>
                    </h1>
                    <div className="text-[10px] md:text-xs tracking-[0.3em] font-sans text-gray-500 mt-4 uppercase">
                        Bespoke Tailoring
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-serif text-black mb-6">
                    Audio Configuration
                </h2>
                <p className="text-xs md:text-sm text-gray-500 mb-10 font-mono tracking-wide">
                    Test your microphone functionality before connecting to the virtual consultant
                </p>

                {/* Controls */}
                <div className="flex flex-col items-center justify-center space-y-6 mb-10">
                    {!isRecording ? (
                        <button 
                            onClick={startRecording} 
                            className="border border-black px-8 py-3 flex items-center justify-center space-x-3 text-xs font-mono uppercase tracking-widest hover:bg-gray-50 transition-colors"
                        >
                            <Mic className="w-4 h-4" />
                            <span>Start Recording</span>
                        </button>
                    ) : (
                        <button 
                            onClick={stopRecording} 
                            className="border border-black bg-black text-white px-8 py-3 flex items-center justify-center space-x-3 text-xs font-mono uppercase tracking-widest hover:bg-gray-800 transition-colors"
                        >
                            <StopCircle className="w-4 h-4" />
                            <span>Stop Recording</span>
                        </button>
                    )}

                    <div className="bg-[#f8f9fa] w-full max-w-xl py-4 text-xs font-mono text-gray-600 uppercase tracking-[0.1em] font-medium">
                        {isRecording ? `Recording... ${recordingDuration}s` : (audioBlob ? 'Recording completed' : 'Ready to record')}
                    </div>
                    
                    {audioBlob && (
                        <div className="w-full flex flex-col items-center gap-6 mt-6">
                            <audio ref={audioPlayerRef} controls className="w-full max-w-xl outline-none" />
                            
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <button onClick={downloadAudio} className="border border-gray-300 px-6 py-2 flex items-center space-x-2 text-xs font-mono uppercase tracking-widest hover:bg-gray-50 transition-colors">
                                    <Download className="w-3 h-3" />
                                    <span>Download</span>
                                </button>
                                {webhookUrl && (
                                    <button 
                                        onClick={sendToWebhook}
                                        disabled={isSendingToWebhook}
                                        className="border border-gray-300 px-6 py-2 flex items-center space-x-2 text-xs font-mono uppercase tracking-widest hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        <UploadCloud className="w-3 h-3" />
                                        <span>{isSendingToWebhook ? 'Sending...' : 'Send to Webhook'}</span>
                                    </button>
                                )}
                            </div>
                            
                            {webhookResponse && (
                                <div className="mt-4 p-4 bg-[#f8f9fa] border border-gray-200 text-left w-full max-w-xl font-mono text-xs overflow-auto max-h-40">
                                    <p className="text-gray-700">{webhookResponse}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {error && (
                        <div className="w-full max-w-xl bg-red-50 border border-red-100 text-red-600 p-4 flex items-center justify-center space-x-2 font-mono text-xs">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <hr className="border-t border-gray-200 mb-10 w-full max-w-xl mx-auto" />

                <button 
                    onClick={onBack} 
                    className="border border-black px-6 py-3 flex items-center justify-center space-x-3 text-xs font-mono uppercase tracking-widest hover:bg-gray-50 transition-colors mx-auto"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Main App</span>
                </button>
            </div>
        </GlassCard>
    );
};

export default RealTimeAudioTest;
