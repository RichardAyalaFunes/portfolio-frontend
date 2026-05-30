import React, { useEffect, useState } from 'react';
import { PhoneOff, AlertCircle, Mic, Volume2, Phone, Loader2, MicOff } from 'lucide-react';
import GlassCard from './GlassCard';
import MicWave from './MicWave';
import type { CallState } from './RealTimeLayout';

interface AvatarViewProps {
    callState: CallState;
    status: string;
    error: string | null;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    onDisconnect: () => void;
    onStartCall: (inputDeviceId: string, outputDeviceId: string) => void;
    isAvatarSpeaking: boolean;
    userTranscript: string;
    avatarTranscript: string;
}

// ── Device enumeration helper ──────────────────────────────────────────────────
async function getMediaDevices(): Promise<{ inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] }> {
    try {
        // Request mic permission so the browser reveals device labels.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // release immediately

        const all = await navigator.mediaDevices.enumerateDevices();
        return {
            inputs:  all.filter(d => d.kind === 'audioinput'),
            outputs: all.filter(d => d.kind === 'audiooutput'),
        };
    } catch {
        return { inputs: [], outputs: [] };
    }
}

// ── Pre-call setup screen ──────────────────────────────────────────────────────
const PreCallSetup: React.FC<{
    isConnecting: boolean;
    error: string | null;
    status: string;
    onStart: (inputId: string, outputId: string) => void;
    onCancel: () => void;
}> = ({ isConnecting, error, status, onStart, onCancel }) => {
    const [inputs,  setInputs]  = useState<MediaDeviceInfo[]>([]);
    const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
    const [inputId,  setInputId]  = useState('');
    const [outputId, setOutputId] = useState('');
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        getMediaDevices().then(({ inputs, outputs }) => {
            setInputs(inputs);
            setOutputs(outputs);
            if (inputs[0])  setInputId(inputs[0].deviceId);
            if (outputs[0]) setOutputId(outputs[0].deviceId);
            setLoading(false);
        });
    }, []);

    const selectCls =
        "w-full bg-white/80 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 " +
        "focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-colors " +
        "disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="w-full flex flex-col items-center gap-8">

            {/* Header text */}
            <div className="text-center">
                <p className="text-xl font-light tracking-widest text-slate-700">Confirm your settings</p>
                <p className="text-xs text-slate-400 font-light mt-1">Choose the microphone and speaker before joining</p>
            </div>

            {/* Device selectors */}
            <div className={`w-full max-w-sm flex flex-col gap-4 transition-opacity duration-300 ${isConnecting ? 'opacity-30 pointer-events-none' : ''}`}>
                {/* Mic input */}
                <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
                        <Mic className="w-3 h-3" />
                        Microphone
                    </label>
                    {loading ? (
                        <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
                    ) : inputs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No microphone found</p>
                    ) : (
                        <select value={inputId} onChange={e => setInputId(e.target.value)} className={selectCls} disabled={isConnecting}>
                            {inputs.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Audio output */}
                <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
                        <Volume2 className="w-3 h-3" />
                        Speaker
                        <span className="text-slate-300 font-normal normal-case tracking-normal">— Chrome/Edge only</span>
                    </label>
                    {loading ? (
                        <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
                    ) : outputs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Output selection not supported in this browser</p>
                    ) : (
                        <select value={outputId} onChange={e => setOutputId(e.target.value)} className={selectCls} disabled={isConnecting}>
                            {outputs.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Speaker ${d.deviceId.slice(0, 6)}`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Start / loading */}
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                <button
                    onClick={() => onStart(inputId, outputId)}
                    disabled={isConnecting || loading}
                    className="w-full group flex items-center justify-center gap-3 px-6 py-4 rounded-xl border transition-all duration-300 will-change-transform
                        bg-white border-slate-200 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.07)]
                        hover:-translate-y-1 hover:border-indigo-200/70 hover:shadow-[0_8px_24px_rgba(99,102,241,0.18)] hover:text-indigo-600
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    {isConnecting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm font-semibold tracking-wide">{status}</span></>
                        : <><Phone className="w-4 h-4" /><span className="text-sm font-semibold tracking-wide">Start Call</span></>
                    }
                </button>

                <button
                    onClick={onCancel}
                    disabled={isConnecting}
                    className="text-xs text-slate-300 hover:text-slate-500 transition-colors font-medium disabled:opacity-30"
                >
                    Cancel
                </button>
            </div>

            {error && (
                <div className="w-full max-w-sm p-4 bg-red-50 border border-red-200/60 rounded-xl text-center space-y-1">
                    <p className="flex items-center justify-center gap-1.5 text-red-500 font-medium text-xs">
                        <AlertCircle className="w-3.5 h-3.5" /> Connection failed
                    </p>
                    <p className="text-xs text-red-400">{error}</p>
                </div>
            )}
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────────
const RealTimeAvatar: React.FC<AvatarViewProps> = ({
    callState,
    status,
    error,
    videoRef,
    onDisconnect,
    onStartCall,
    isAvatarSpeaking,
    userTranscript,
    avatarTranscript,
}) => {
    const isConnected   = callState === 'connected';
    const isConnecting  = callState === 'connecting';
    const isSetup       = callState === 'setup' || isConnecting;
    const micActive     = isConnected && !isAvatarSpeaking;

    return (
        <GlassCard
            containerClassName="w-full max-w-5xl mx-auto"
            innerClassName="w-full p-6 md:p-10 flex flex-col items-center"
        >
            {/* Header — always visible */}
            <div className="w-full flex items-center justify-between mb-8 pb-6 border-b border-slate-200/50">
                <div className="flex flex-col">
                    <h1 className="font-light text-2xl md:text-4xl tracking-widest text-slate-800">
                        LIVE<span className="font-medium text-indigo-600">AVATAR</span>
                    </h1>
                    <div className="text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold text-indigo-500 mt-1">
                        Real-time AI video experience
                    </div>
                </div>
                <button
                    onClick={onDisconnect}
                    className="group flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-500 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 hover:shadow-[0_4px_14px_rgba(239,68,68,0.15)]"
                >
                    <PhoneOff className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    {isSetup ? 'BACK' : 'DISCONNECT'}
                </button>
            </div>

            {/* ── PRE-CALL: device selection ─────────────────────────────────── */}
            {isSetup && (
                <PreCallSetup
                    isConnecting={isConnecting}
                    error={error}
                    status={status}
                    onStart={onStartCall}
                    onCancel={onDisconnect}
                />
            )}

            {/* ── CONNECTED: avatar + transcript ────────────────────────────── */}
            {isConnected && (
                <div className="w-full flex flex-col lg:flex-row gap-6 items-start">

                    {/* Left: avatar video */}
                    <div className="flex-[2] flex flex-col items-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
                        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-widest text-slate-700 uppercase mb-6">
                            Virtual Consultant
                        </h2>

                        <div className="relative w-full max-w-[480px] aspect-square bg-slate-200/50 rounded-2xl overflow-hidden border border-slate-200/50 shadow-inner">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Speaking badge */}
                            {isAvatarSpeaking && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/90 backdrop-blur-sm rounded-full">
                                    <Volume2 className="w-3 h-3 text-white" />
                                    <span className="text-[10px] font-semibold tracking-widest uppercase text-white">Speaking</span>
                                </div>
                            )}
                        </div>

                        {/* Mic wave + status */}
                        <div className="mt-5 flex flex-col items-center gap-1.5 w-full max-w-[480px]">
                            <MicWave isActive={micActive} barCount={32} className="w-full" />
                            <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-slate-400">
                                {micActive
                                    ? <Mic className="w-3 h-3 text-indigo-400" />
                                    : <MicOff className="w-3 h-3 text-slate-300" />
                                }
                                {isAvatarSpeaking ? 'Avatar responding…' : 'Listening — just speak'}
                            </div>
                            <p className="text-[10px] text-center text-slate-300 font-light">{status}</p>
                        </div>
                    </div>

                    {/* Right: transcript — fixed height, no layout jump */}
                    <div className="flex-1 flex flex-col p-6 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm min-w-0 h-[420px] lg:h-auto lg:self-stretch">
                        <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4 shrink-0">
                            Transcript
                        </h2>

                        {/* Scrollable transcript body — fixed height so it never expands the card */}
                        <div className="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0">
                            {!userTranscript && !avatarTranscript && (
                                <p className="text-xs text-slate-300 italic text-center mt-8">
                                    Conversation will appear here…
                                </p>
                            )}

                            {userTranscript && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">You said</p>
                                    <p className="text-sm text-slate-600 leading-relaxed">"{userTranscript}"</p>
                                </div>
                            )}

                            {avatarTranscript && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold tracking-widest text-violet-400 uppercase">Avatar replied</p>
                                    <p className="text-sm text-slate-600 leading-relaxed">"{avatarTranscript}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </GlassCard>
    );
};

export default RealTimeAvatar;
