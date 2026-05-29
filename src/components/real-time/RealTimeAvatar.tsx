import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, AlertCircle, Mic, User } from 'lucide-react';
import GlassCard from './GlassCard';

interface AvatarViewProps {
    status: string;
    error: string | null;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    onDisconnect: () => void;
    webhookUrl?: string;
    onSendText?: (text: string) => void;
}

const RealTimeAvatar: React.FC<AvatarViewProps> = ({
    status,
    error,
    videoRef,
    onDisconnect,
    webhookUrl,
    onSendText
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [, setAudioBlob] = useState<Blob | null>(null);
    const [transcript, setTranscript] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startRecording = async () => {
        try {
            if (mediaRecorderRef.current) {
                try { mediaRecorderRef.current.stop(); } catch (e) { }
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            };

            let mediaRecorder;
            try {
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (e) {
                mediaRecorder = new MediaRecorder(stream);
            }

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            recordingStartTimeRef.current = Date.now();
            setRecordingDuration(0);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                if (audioChunksRef.current.length === 0) {
                    setIsRecording(false);
                    return;
                }

                try {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    setAudioBlob(blob);

                    stream.getTracks().forEach(track => track.stop());

                    const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
                    setRecordingDuration(finalDuration);

                    if (durationIntervalRef.current) {
                        clearInterval(durationIntervalRef.current);
                        durationIntervalRef.current = null;
                    }

                    setIsRecording(false);
                    setIsProcessing(true);

                    setTimeout(() => {
                        sendAudioDataToWebhook(blob);
                    }, 500);
                } catch (error) {
                    console.error("Error creating audio blob:", error);
                    setIsRecording(false);
                }
            };

            mediaRecorder.start(1000);
            setIsRecording(true);

            durationIntervalRef.current = setInterval(() => {
                const elapsed = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
                setRecordingDuration(elapsed);
            }, 1000);

        } catch (err: any) {
            console.error("Error starting recording:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            try {
                mediaRecorderRef.current.requestData();
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                    durationIntervalRef.current = null;
                }
            } catch (err) { }
        } else {
            setIsRecording(false);
        }
    };

    const sendAudioDataToWebhook = async (audioData: Blob): Promise<void> => {
        try {
            setIsProcessing(true);

            const formData = new FormData();
            let filename = 'recording.webm';
            if (audioData.type.includes('wav')) filename = 'recording.wav';
            else if (audioData.type.includes('mp3')) filename = 'recording.mp3';
            else if (audioData.type.includes('ogg')) filename = 'recording.ogg';

            formData.append('audio', audioData, filename);
            formData.append('filename', filename);
            formData.append('timestamp', new Date().toISOString());
            formData.append('duration', recordingDuration.toString());
            formData.append('fileSize', audioData.size.toString());

            if (!webhookUrl) return;

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error(`Webhook error: ${response.status}`);

            try {
                const result = await response.json();
                if (result.output) {
                    const avatarScript = result.output;
                    setTranscript(avatarScript);
                    setIsProcessing(false);
                    if (onSendText) {
                        onSendText(avatarScript);
                    }
                }
            } catch (jsonErr: any) {
                const textResponse = await response.text();
                if (textResponse && textResponse.trim()) {
                    setTranscript(textResponse);
                    setIsProcessing(false);
                }
            }
        } catch (err: any) {
            setIsProcessing(false);
            console.error(err);
        }
    };

    const cleanupRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            try { mediaRecorderRef.current.stop(); } catch (e) { }
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
        setIsRecording(false);
        setIsProcessing(false);
    };

    useEffect(() => {
        return () => {
            cleanupRecording();
        };
    }, []);

    useEffect(() => {
        const checkForMediaStream = () => {
            if (videoRef.current) {
                const videoElement = videoRef.current;
                videoElement.autoplay = true;
                videoElement.playsInline = true;

                const globalMediaStream = (window as any).mediaStream;
                if (globalMediaStream && !videoElement.srcObject) {
                    videoElement.srcObject = globalMediaStream;
                    videoElement.play().catch(err => console.error("Error playing video:", err));
                }
            }
        };

        checkForMediaStream();
        const intervalId = setInterval(() => {
            if (videoRef.current && !videoRef.current.srcObject) {
                checkForMediaStream();
            }
        }, 2000);

        return () => {
            clearInterval(intervalId);
        };
    }, [status, videoRef]);

    const handleRecordingToggle = () => {
        if (isProcessing) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    let recordingBtnClass = "recording-btn";
    let recordingBtnText = "Start Recording";
    let recordingStatusText = "Click \"Start Recording\" to begin your message";

    if (isRecording) {
        recordingBtnClass += " recording";
        recordingBtnText = "Stop Recording";
        recordingStatusText = `Recording... ${recordingDuration}s (Click "Stop Recording" when finished)`;
    } else if (isProcessing) {
        recordingBtnClass += " processing";
        recordingBtnText = "Processing...";
        recordingStatusText = 'Processing your message... This may take up to 8 seconds';
    }

    return (
        <GlassCard containerClassName="w-full max-w-7xl mx-auto" innerClassName="w-full !p-0 !bg-transparent border-0 shadow-none mt-4">
            <div className="avatar-page-container !max-w-none !h-auto !min-h-[70vh] w-full bg-lightBg-2/40 rounded-[2rem] border border-white/20">
            <div className="avatar-header">
                <h1 className="avatar-title">
                    ENZO<span className="custom-text">CUSTOM</span> <span className="subtitle">Realistic Virtual Consultant</span>
                </h1>
                <button onClick={onDisconnect} className="disconnect-btn">
                    <span className="btn-icon"><PhoneOff className="w-4 h-4" /></span>
                    Disconnect
                </button>
            </div>

            <div className="main-content">
                <div className="unified-panel">
                    <div className="voice-section">
                        <h2 className="section-title">
                            <span className="icon-voice"><Mic className="w-[18px] h-[18px]" strokeWidth={2} /></span> Voice Input
                        </h2>

                        <div className="recording-container">
                            <button
                                className={recordingBtnClass}
                                onClick={handleRecordingToggle}
                                disabled={isProcessing}
                            >
                                <span>{recordingBtnText}</span>
                            </button>
                        </div>

                        <p className="recording-status">
                            {recordingStatusText}
                        </p>
                    </div>

                    <div className="avatar-section">
                        <h2 className="section-title">
                            <span className="icon-avatar"><User className="w-[18px] h-[18px]" strokeWidth={2} /></span> Virtual Consultant
                        </h2>

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="avatar-video"
                        />

                        {transcript && (
                            <div className="transcript-container">
                                <h3>AI Response</h3>
                                <p>"{transcript}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-container">
                    <h3>
                        <span className="icon-error"><AlertCircle className="w-4 h-4" /></span> Error
                    </h3>
                    <p>{error}</p>
                </div>
            )}
            </div>
        </GlassCard>
    );
};

export default RealTimeAvatar;
