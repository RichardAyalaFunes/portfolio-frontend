/**
 * Backend API client for the OpenAI Realtime voice feature.
 *
 * POST /api/realtime/session → mints an ephemeral key so the browser
 * can authenticate a WebRTC connection directly to OpenAI without
 * exposing the master API key.
 */

const host = import.meta.env.VITE_BACKEND_HOST || 'localhost:8000';
const BACKEND_URL = host.startsWith('http') ? host : `http://${host}`;

export interface RealtimeSessionResponse {
    client_secret: string;
    expires_at: number; // may be 0 if not returned by the API
}

export const createRealtimeSession = async (
    voice?: string
): Promise<RealtimeSessionResponse> => {
    const response = await fetch(`${BACKEND_URL}/api/realtime/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voice ? { voice } : {}),
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(
            `POST /api/realtime/session failed: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`
        );
    }
    return (await response.json()) as RealtimeSessionResponse;
};
