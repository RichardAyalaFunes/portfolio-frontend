import React from 'react';
import { User, Mic, Loader2, AlertCircle, ChevronRight, Home } from 'lucide-react';
import GlassCard from './GlassCard';

interface RealTimeHomeProps {
    isLoading: boolean;
    error: string | null;
    status: string;
    onConnectRealistic: () => void;
    onConnectVoice: () => void;
    onAudioTest: () => void;
    onTestRealtime: () => void;
    onGoHome: () => void;
}

const RealTimeHome: React.FC<RealTimeHomeProps> = ({
    isLoading,
    error,
    status,
    onConnectRealistic,
    onConnectVoice,
    onAudioTest,
    onGoHome,
}) => {
    return (
        <GlassCard containerClassName="max-w-4xl" innerClassName="w-full flex justify-center flex-col items-center mt-2 p-4 md:p-12 space-y-12">

                    <div className="text-center space-y-4">
                        <h1 className="font-light text-3xl md:text-5xl tracking-widest text-slate-800">
                            REAL TIME
                        </h1>
                        <div className="text-xs md:text-sm tracking-[0.4em] uppercase font-bold text-indigo-500">
                            Video & Voice
                        </div>
                        <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400/60 mt-1">
                            by Eng. Richard Ayala
                        </p>
                    </div>

                    <div className="w-full max-w-md space-y-3">

                        {/* Realistic Avatar button */}
                        <button
                            className="w-full group flex items-center gap-4 p-5 bg-slate-100 rounded-xl border border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.07)] transition-all duration-300 hover:bg-white hover:-translate-y-1 hover:border-indigo-200/70 hover:shadow-[0_8px_24px_rgba(99,102,241,0.18),0_2px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed will-change-transform"
                            onClick={onConnectRealistic}
                            disabled={isLoading}
                        >
                            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-100 shadow-sm text-slate-400 transition-all duration-300 shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-500 group-hover:shadow-[0_0_14px_rgba(99,102,241,0.22)]">
                                <User className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                            </span>
                            <div className="text-left flex-1 min-w-0">
                                <div className="text-sm font-semibold tracking-widest text-slate-700 uppercase mb-0.5 transition-colors duration-300 group-hover:text-slate-900">
                                    Realistic Avatar
                                </div>
                                <div className="text-xs text-slate-400 font-light transition-colors duration-300 group-hover:text-slate-500">
                                    Smart and realistic, but slow answering
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 transition-all duration-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 shrink-0" strokeWidth={1.5} />
                        </button>

                        {/* Voice Agent button */}
                        <button
                            className="w-full group flex items-center gap-4 p-5 bg-slate-100 rounded-xl border border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.07)] transition-all duration-300 hover:bg-white hover:-translate-y-1 hover:border-violet-200/70 hover:shadow-[0_8px_24px_rgba(139,92,246,0.18),0_2px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed will-change-transform"
                            onClick={onConnectVoice}
                            disabled={isLoading}
                        >
                            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-slate-100 shadow-sm text-slate-400 transition-all duration-300 shrink-0 group-hover:bg-violet-50 group-hover:border-violet-100 group-hover:text-violet-500 group-hover:shadow-[0_0_14px_rgba(139,92,246,0.22)]">
                                <Mic className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                            </span>
                            <div className="text-left flex-1 min-w-0">
                                <div className="text-sm font-semibold tracking-widest text-slate-700 uppercase mb-0.5 transition-colors duration-300 group-hover:text-slate-900">
                                    Voice Agent
                                </div>
                                <div className="text-xs text-slate-400 font-light transition-colors duration-300 group-hover:text-slate-500">
                                    Fast response without avatar
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 transition-all duration-300 group-hover:text-violet-400 group-hover:translate-x-0.5 shrink-0" strokeWidth={1.5} />
                        </button>

                    </div>

                    <div className="w-full max-w-md text-center flex flex-col items-center gap-3">
                        {/* <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-2">
                            Tools
                        </p> */}
                        <button
                            onClick={onAudioTest}
                            className="text-xs tracking-widest uppercase text-slate-400 hover:text-slate-600 font-semibold transition-colors duration-200 mb-3"
                        >
                            Test Microphone
                        </button>
                        <button
                            onClick={onGoHome}
                            className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-full text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_4px_14px_rgba(99,102,241,0.15)] hover:-translate-y-0.5 will-change-transform"
                        >
                            <Home className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                            Portfolio
                        </button>
                    </div>

                    {isLoading && (
                        <div className="w-full max-w-md flex items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                            <h3 className="flex items-center justify-center gap-2 text-slate-600 font-medium text-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                <span className="text-slate-400">{status || "Connecting..."}</span>
                            </h3>
                        </div>
                    )}

                    {error && (
                        <div className="w-full max-w-md p-4 bg-red-50 border border-red-200/60 rounded-xl text-center space-y-1.5">
                            <h3 className="flex items-center justify-center gap-1.5 text-red-500 font-medium text-sm">
                                <AlertCircle className="w-4 h-4" />
                                Error
                            </h3>
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

        </GlassCard>
    );
};

export default RealTimeHome;
