export interface ChatAttachment {
    id: string;
    fileName: string;
    mimeType: string;
    thumbnailLink?: string;
    webContentLink: string;
}

export interface ChatRequestPayload {
    token: string;
    messages: string[];
    config: { model: string };
    chatId?: string;
}

export interface ChatResponsePayload {
    status: 'success' | 'error';
    data?: {
        message: string;
        chatId: string;
        attachements?: ChatAttachment[]; // handle typo in backend payload
        attachments?: ChatAttachment[];
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export const chatApi = {
    async sendMessage(text: string, chatId?: string): Promise<ChatResponsePayload> {
        const url = `${import.meta.env.VITE_API_URL || 'https://famous-talented-chamois.ngrok-free.app/webhook-test'}/master-agent/chat/completions`;
        const payload: ChatRequestPayload = {
            token: 'jwt123',
            messages: [text],
            config: { model: 'gpt-5-nano' },
            chatId
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Chat API Error:', error);
            return {
                status: 'error',
                error: {
                    code: 'NETWORK_ERROR',
                    message: error.message || 'Failed to connect to the AI'
                }
            };
        }
    }
};
