import React from 'react';
import { User, Mic, Loader2, AlertCircle } from 'lucide-react';
import GlassCard from './GlassCard';

interface RealTimeHomeProps {
    isLoading: boolean;
    error: string | null;
    status: string;
    onConnectRealistic: () => void;
    onConnectVoice: () => void;
    onAudioTest: () => void;
    onTestRealtime: () => void;
}

const RealTimeHome: React.FC<RealTimeHomeProps> = ({
    isLoading,
    error,
    status,
    onConnectRealistic,
    onConnectVoice,
    onAudioTest,
}) => {
    // Background moved to layout

    return (
        <GlassCard containerClassName="max-w-4xl" innerClassName="w-full flex justify-center flex-col items-center mt-2 p-4 md:p-12 space-y-12">
                    <div className="text-center space-y-6">
                        <h1 className="font-light text-3xl md:text-5xl tracking-widest text-slate-800">
                            REAL TIME
                        </h1>
                        <div className="text-xs md:text-sm tracking-[0.4em] uppercase font-bold text-[#073493]">
                            Video & Voice
                        </div>
                    </div>

                    <div className="w-full max-w-md space-y-4">
                        <button
                            className="w-full group flex items-center p-6 bg-white/10 rounded-2xl border border-white/60 shadow-[inset_0_2px_5px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_4px_14px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed will-change-transform"
                            onClick={onConnectRealistic}
                            disabled={isLoading}
                        >
                            <span className="flex items-center justify-center w-12 h-12 rounded-full text-slate-500 transition-all duration-300 shrink-0 group-hover:scale-110 group-hover:text-sky-500">
                                <User className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" strokeWidth={1.5} />
                            </span>
                            <div className="ml-6 text-left flex-1">
                                <div className="text-sm font-semibold tracking-widest text-slate-700 uppercase mb-1 transition-colors duration-300">
                                    Realistic Avatar
                                </div>
                                <div className="text-sm text-slate-500 font-light transition-colors duration-300">
                                    Smart and realistic, but slow answering
                                </div>
                            </div>
                        </button>

                        <button
                            className="w-full group flex items-center p-6 bg-white/50 rounded-2xl border border-white/60 shadow-[inset_0_2px_5px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.02),0_4px_14px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed will-change-transform"
                            onClick={onConnectVoice}
                            disabled={isLoading}
                        >
                            <span className="flex items-center justify-center w-12 h-12 rounded-full text-slate-500 transition-all duration-300 shrink-0 group-hover:scale-110 group-hover:text-indigo-500">
                                <Mic className="w-6 h-6 transition-transform duration-300 group-hover:-rotate-12" strokeWidth={1.5} />
                            </span>
                            <div className="ml-6 text-left flex-1">
                                <div className="text-sm font-semibold tracking-widest text-slate-700 uppercase mb-1 transition-colors duration-300">
                                    Voice Agent
                                </div>
                                <div className="text-sm text-slate-500 font-light transition-colors duration-300">
                                    Fast response without avatar
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="w-full max-w-md pt-10 text-center flex flex-col items-center">
                        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-6">
                            Audio Configuration
                        </p>
                        <button
                            onClick={onAudioTest}
                            className="group inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/60 bg-white/50 hover:bg-white/80 text-slate-600 hover:text-slate-800 rounded-full text-sm font-medium backdrop-blur-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 will-change-transform"
                        >
                            <Mic className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12 group-hover:text-indigo-500" />
                            Test Microphone
                        </button>
                    </div>

                    {isLoading && (
                        <div className="w-full max-w-md flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                            <h3 className="flex items-center justify-center gap-2 text-slate-700 font-medium text-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                                <span className="text-slate-500">{status || "Connection Test..."}</span>
                            </h3>
                        </div>
                    )}

                    {error && (
                        <div className="w-full max-w-md p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-center space-y-2">
                            <h3 className="flex items-center justify-center gap-1.5 text-destructive font-medium text-sm">
                                <AlertCircle className="w-4 h-4" />
                                Error
                            </h3>
                            <p className="text-xs text-destructive/90">{error}</p>
                        </div>
                    )}
        </GlassCard>
    );
};

export default RealTimeHome;
