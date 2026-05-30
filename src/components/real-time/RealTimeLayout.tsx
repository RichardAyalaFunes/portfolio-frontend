// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import RealTimeHome from "./RealTimeHome";
import RealTimeAvatar from "./RealTimeAvatar";
import RealTimeVoice from "./RealTimeVoice";
import RealTimeAudioTest from "./RealTimeAudioTest";
import TestRealtimePage from "./TestRealtimePage";
import RealTimeBackground from "./RealTimeBackground";
import { fetchLiteToken, stopSession } from "../../api/liveAvatarApi";
import { LiveAvatarSession, SessionEvent, AgentEventsEnum, SessionInteractivityMode } from "@heygen/liveavatar-web-sdk";
import "./RealTimeStyles.css";

/** Phases of the avatar call lifecycle. */
export type CallState = 'idle' | 'setup' | 'connecting' | 'connected';

const KEEP_ALIVE_INTERVAL_MS = 3 * 60 * 1000; // 3 min

function RealTimeLayout() {
    const navigate = useNavigate();

    // ── Call lifecycle ─────────────────────────────────────────────────────────
    const [callState, setCallState] = useState<CallState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("Ready to connect");

    // ── Conversation state ─────────────────────────────────────────────────────
    const [userTranscript, setUserTranscript] = useState<string>("");
    const [avatarTranscript, setAvatarTranscript] = useState<string>("");
    const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
    const [streamReady, setStreamReady] = useState(false);
    const [outputDeviceId, setOutputDeviceId] = useState<string>("");

    // ── Refs ───────────────────────────────────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const sessionRef = useRef<LiveAvatarSession | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const keepAliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Attach SDK stream once both element + stream exist ─────────────────────
    // SESSION_STREAM_READY can fire while the <video> is still unmounted (during
    // 'connecting' the avatar UI shows the pre-call setup, not the video element).
    // This effect re-runs the attach() once the element is mounted in 'connected'.
    useEffect(() => {
        if (callState !== 'connected') return;
        if (!streamReady) return;
        const session = sessionRef.current;
        const el = videoRef.current;
        if (!session || !el) return;
        try {
            session.attach(el);
            el.autoplay = true;
            el.playsInline = true;
            void el.play().catch((e) => console.warn('[Avatar] video.play() blocked:', e));
            if (outputDeviceId && 'setSinkId' in el) {
                void (el as any).setSinkId(outputDeviceId).catch((e: unknown) =>
                    console.warn('[Avatar] setSinkId failed:', e)
                );
            }
            console.log('[Avatar] attach() applied via effect');
        } catch (err) {
            console.warn('[Avatar] effect attach failed:', err);
        }
    }, [callState, streamReady, outputDeviceId]);

    // ── Keep-alive ─────────────────────────────────────────────────────────────
    const stopKeepAlive = () => {
        if (keepAliveTimerRef.current) {
            clearInterval(keepAliveTimerRef.current);
            keepAliveTimerRef.current = null;
        }
    };

    const startKeepAlive = () => {
        stopKeepAlive();
        keepAliveTimerRef.current = setInterval(() => {
            try { sessionRef.current?.keepAlive(); } catch { /* ignore */ }
        }, KEEP_ALIVE_INTERVAL_MS);
    };

    // ── Session teardown ───────────────────────────────────────────────────────
    const closeSession = async () => {
        stopKeepAlive();
        const s = sessionRef.current;
        const sid = sessionIdRef.current;
        sessionRef.current = null;
        sessionIdRef.current = null;

        if (videoRef.current) videoRef.current.srcObject = null;

        try { s?.voiceChat?.stop(); } catch { /* ignore */ }

        await Promise.allSettled([
            s ? s.stop().catch((e: unknown) => console.warn("session.stop failed:", e)) : Promise.resolve(),
            sid ? stopSession(sid) : Promise.resolve(),
        ]);

        setCallState('idle');
        setIsAvatarSpeaking(false);
        setStreamReady(false);
        setStatus("Session closed");
        setUserTranscript("");
        setAvatarTranscript("");
    };

    // ── Session creation ───────────────────────────────────────────────────────
    /**
     * Called by the pre-call screen's "Start Call" button.
     * inputDeviceId  — chosen microphone (passed to voiceChat.start)
     * outputDeviceId — chosen speaker (applied via setSinkId on the video element)
     */
    const startCall = async (inputDeviceId: string, outputDeviceId: string) => {
        if (sessionRef.current) return; // guard against double-tap

        setCallState('connecting');
        setError(null);
        setStreamReady(false);
        setOutputDeviceId(outputDeviceId);

        try {
            setStatus("Obtaining session token…");
            const tokenResponse = await fetchLiteToken();
            console.log('[Avatar] POST /api/avatar/token response:', tokenResponse);
            const { session_id, session_token } = tokenResponse;
            sessionIdRef.current = session_id;

            setStatus("Initializing avatar…");
            const session = new LiveAvatarSession(session_token);
            sessionRef.current = session;

            // ── SDK events ────────────────────────────────────────────────────
            session.on(SessionEvent.SESSION_STREAM_READY, () => {
                console.log('[Avatar] SESSION_STREAM_READY fired');
                setStatus("Stream ready");
                // Mark stream ready; the useEffect handles attach() once <video> is mounted.
                setStreamReady(true);
            });

            session.on(SessionEvent.SESSION_DISCONNECTED, (reason: any) => {
                console.log('[Avatar] SESSION_DISCONNECTED reason:', reason);
                stopKeepAlive();
                setCallState('idle');
                setIsAvatarSpeaking(false);
                setStatus("Session disconnected");
            });

            session.on(AgentEventsEnum.USER_TRANSCRIPTION, (ev: any) => {
                console.log('[Avatar] USER_TRANSCRIPTION raw event:', ev);
                const text = ev?.text ?? ev?.transcription ?? String(ev);
                if (text) setUserTranscript(text);
            });
            session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (ev: any) => {
                console.log('[Avatar] AVATAR_TRANSCRIPTION raw event:', ev);
                const text = ev?.text ?? ev?.transcription ?? String(ev);
                if (text) setAvatarTranscript(text);
            });
            session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, (ev: any) => {
                console.log('[Avatar] AVATAR_SPEAK_STARTED', ev);
                setIsAvatarSpeaking(true);
            });
            session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, (ev: any) => {
                console.log('[Avatar] AVATAR_SPEAK_ENDED', ev);
                setIsAvatarSpeaking(false);
            });
            session.on(AgentEventsEnum.USER_SPEAK_STARTED, (ev: any) => console.log('[Avatar] USER_SPEAK_STARTED', ev));
            session.on(AgentEventsEnum.USER_SPEAK_ENDED,   (ev: any) => console.log('[Avatar] USER_SPEAK_ENDED', ev));

            // ── Start session (video element is already mounted in /avatar) ──
            console.log('[Avatar] calling session.start()…');
            await session.start();
            console.log('[Avatar] session.start() resolved. SessionInfo:', (session as any).sessionInfo ?? '(not exposed)');

            // ── Publish user mic to LiveKit (FULL mode requires this) ─────────
            console.log('[Avatar] calling voiceChat.start() with inputDeviceId:', inputDeviceId || '(default)');
            await session.voiceChat.start({
                mode: SessionInteractivityMode.CONVERSATIONAL,
                ...(inputDeviceId ? { deviceId: inputDeviceId } : {}),
            });
            console.log('[Avatar] voiceChat.start() resolved. voiceChat.state:', session.voiceChat.state);

            startKeepAlive();
            setCallState('connected');
            setStatus("Connected ✓");
            console.log('[Avatar] fully connected. session.state:', session.state);

        } catch (err: any) {
            const message = err?.message ?? String(err);
            setError(`Connection failed: ${message}`);
            setStatus("Connection failed");
            setCallState('setup'); // return to setup so user can retry

            const s = sessionRef.current;
            const sid = sessionIdRef.current;
            sessionRef.current = null;
            sessionIdRef.current = null;
            await Promise.allSettled([
                s ? s.stop().catch(() => {}) : Promise.resolve(),
                sid ? stopSession(sid) : Promise.resolve(),
            ]);
            stopKeepAlive();
        }
    };

    // Cleanup on unmount.
    useEffect(() => {
        return () => { void closeSession(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Navigation handlers ────────────────────────────────────────────────────
    const handleConnectRealistic = () => {
        setCallState('setup');
        navigate('/real-time/avatar');
    };

    const handleDisconnect = () => {
        void closeSession().finally(() => navigate('/real-time'));
    };

    // Mock mode — skips backend, goes straight to avatar UI for UI testing.
    const enterMockMode = () => {
        sessionIdRef.current = 'mock-session';
        setCallState('connected');
        setStatus("Preview mode (no backend)");
        navigate('/real-time/avatar');
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="root-container w-full min-h-screen relative flex flex-col rt-typography bg-background overflow-x-hidden">
            <RealTimeBackground />

            <div className="relative z-10 w-full min-h-screen flex items-center justify-center p-4 py-8 md:p-8">
                <Routes>
                    <Route path="/" element={
                        <RealTimeHome
                            isLoading={false}
                            error={null}
                            status={status}
                            onConnectRealistic={handleConnectRealistic}
                            onConnectVoice={() => navigate('/real-time/voice')}
                            onAudioTest={() => navigate('/real-time/audio-test')}
                            onTestRealtime={() => navigate('/real-time/test-realtime')}
                            onPreviewUI={enterMockMode}
                        />
                    } />

                    <Route path="/avatar" element={
                        <RealTimeAvatar
                            callState={callState}
                            status={status}
                            error={error}
                            videoRef={videoRef}
                            onDisconnect={handleDisconnect}
                            onStartCall={startCall}
                            isAvatarSpeaking={isAvatarSpeaking}
                            userTranscript={userTranscript}
                            avatarTranscript={avatarTranscript}
                        />
                    } />

                    <Route path="/voice" element={
                        <RealTimeVoice error={error} onDisconnect={handleDisconnect} />
                    } />
                    <Route path="/test-realtime" element={<TestRealtimePage />} />
                    <Route path="/audio-test" element={
                        <RealTimeAudioTest onBack={() => navigate('/real-time')} />
                    } />
                </Routes>
            </div>
        </div>
    );
}

export default RealTimeLayout;
