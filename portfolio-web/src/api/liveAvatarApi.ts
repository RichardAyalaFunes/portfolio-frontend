/**
 * Backend API client for the LiveAvatar feature.
 *
 * Two endpoints are used by the LITE-mode flow:
 *   - POST /api/avatar/token  → opens a session (keeps the master API key on the server).
 *   - POST /api/avatar/speak  → synthesizes text into LiveAvatar-ready PCM (keeps OpenAI key on the server).
 *
 * The session lifecycle (start / stop / keep-alive) and the LiveAvatar
 * WebSocket are handled by the @heygen/liveavatar-web-sdk directly using
 * the session_token returned below as Bearer auth.
 */

const host = import.meta.env.VITE_BACKEND_HOST || 'localhost:8000';
const BACKEND_URL = host.startsWith('http') ? host : `http://${host}`;

export interface LiteTokenResponse {
    session_id: string;
    session_token: string;
}

export interface SpeakResponse {
    /** Base64-encoded PCM 16-bit / 24 kHz / mono audio. */
    audio_b64: string;
    sample_rate: number;
    duration_ms: number;
}

async function postJson<TResponse>(path: string, body: unknown = {}): Promise<TResponse> {
    const response = await fetch(`${BACKEND_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`POST ${path} failed: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`);
    }
    return (await response.json()) as TResponse;
}

/** Step 1: backend issues a session token using its master API key. */
export const fetchLiteToken = async (): Promise<LiteTokenResponse> => {
    return postJson<LiteTokenResponse>('/api/avatar/token', { max_session_duration: 120 });
};

/**
 * Stop a session server-side via the backend's X-API-KEY-authenticated endpoint.
 * Call this alongside the SDK's session.stop() as a guaranteed server-side kill.
 */
export const stopSession = async (session_id: string): Promise<void> => {
    try {
        await postJson<unknown>('/api/avatar/stop', { session_id, reason: 'USER_CLOSED' });
    } catch {
        // Best-effort — don't throw, local cleanup must still proceed.
        console.warn('[liveAvatarApi] backend stop failed for session', session_id);
    }
};

export const speak = async (text: string, voice?: string): Promise<SpeakResponse> => {
    return postJson<SpeakResponse>('/api/avatar/speak', voice ? { text, voice } : { text });
};
