import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Activity, User, ChevronDown } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    order: number;
}

interface ChatWindowProps {
    onOpenTips?: () => void;
}

export const ChatWindow = ({ onOpenTips }: ChatWindowProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [systemLog, setSystemLog] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [showScrollButton, setShowScrollButton] = useState(false);

    useEffect(() => {
        if (!showScrollButton) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, systemLog]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // If we are more than 100px from the bottom, show the button
        if (scrollHeight - scrollTop - clientHeight > 100) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
        }
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Auto-resize textarea
    const handleInput = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            const newHeight = Math.min(textarea.scrollHeight, window.innerHeight * 0.3);
            textarea.style.height = `${newHeight}px`;
        }
    };

    const submitMessage = (text: string) => {
        if (!text.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            content: text,
            sender: 'user',
            timestamp: new Date(),
            order: messages.length + 1
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        // Simulate N8N Webhook and AI response
        simulateWorkflow(newUserMsg.order + 1);
    };

    const handleSend = () => submitMessage(inputValue);

    const handleAskForTips = () => {
        submitMessage("Hi, What can I do in this AI portfolio assistant?");
        if (onOpenTips) onOpenTips();
    };

    const simulateWorkflow = (nextOrder: number) => {
        setIsTyping(true);
        setSystemLog('Triggering N8N workflow...');

        setTimeout(() => {
            setSystemLog('N8N Event: Executing AI completion node...');

            setTimeout(() => {
                setSystemLog(null);
                setIsTyping(false);
                const newAiMsg: Message = {
                    id: Date.now().toString(),
                    content: 'This is a mock response from the AI. In the actual implementation, this would be tied to the portfolio data context!',
                    sender: 'ai',
                    timestamp: new Date(),
                    order: nextOrder
                };
                setMessages(prev => [...prev, newAiMsg]);
            }, 2000);
        }, 1500);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const renderInputArea = () => (
        <div className={`flex items-end gap-2 mx-auto rounded-xl bg-lightBg-3 p-2 focus-within:border-primary/30 transition-all shadow-sm ${messages.length === 0 ? 'w-full max-w-2xl border-2 border-primary/20 shadow-lg' : 'max-w-4xl border border-black/5'}`}>
            <button className="p-2 text-darkText/60 hover:text-primary transition-colors h-10 flex items-center justify-center">
                <Paperclip size={20} />
            </button>
            <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onInput={handleInput}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Ask something about me..."
                className="flex-1 bg-transparent border-none resize-none outline-none max-h-[30vh] min-h-[24px] py-2 text-sm md:text-base text-darkText placeholder:text-darkText/40"
                rows={1}
            />
            {inputValue.trim() ? (
                <button
                    onClick={handleSend}
                    className="p-2 bg-secondary text-lightBg-2 rounded-xl hover:bg-primary hover:text-lightBg-3 transition-colors h-10 flex items-center justify-center"
                >
                    <Send size={18} />
                </button>
            ) : (
                <button className="p-2 text-darkText/60 hover:text-primary transition-colors h-10 flex items-center justify-center">
                    <Mic size={20} />
                </button>
            )}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-background/50 relative">
            {/* System Log / N8N Simulation Banner */}
            {systemLog && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-accent-gold/20 backdrop-blur-sm border-b border-accent-gold/30 p-2 flex items-center justify-center gap-2 text-accent-gold text-xs font-semibold uppercase tracking-wider animate-pulse">
                    <Activity size={14} />
                    {systemLog}
                </div>
            )}

            {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
                    <div className="w-full max-w-2xl text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent-blue rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 shadow-primary/20">
                            <Activity className="text-white w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-darkText mb-4">Welcome visitor</h2>
                        <p className="text-darkText/60 text-md">I'm Richard's AI portfolio assistant.</p>
                    </div>

                    <div className="w-full">
                        {renderInputArea()}
                        <button
                            onClick={handleAskForTips}
                            className="mt-4 mx-auto block text-md text-primary/90 hover:text-primary underline-offset-4 hover:underline transition-all active:scale-95"
                        >
                            What can you ask?
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Message List */}
                    <div
                        onScroll={handleScroll}
                        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-lightBg-3 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-lightBg-3/80"
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                            >
                                {/* Avatar */}
                                <div className="flex-shrink-0 mt-1">
                                    {msg.sender === 'user' ? (
                                        <div className="w-8 h-8 rounded-full bg-light-3 flex items-center justify-center border border-secondary/20">
                                            <User size={16} className="text-secondary" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#ccd6e0] flex items-center justify-center shadow-sm">
                                            <span className="text-[10px] font-bold text-darkText">AI</span>
                                        </div>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-2xl relative ${msg.sender === 'user' ? 'bg-secondary text-white rounded-tr-sm' : 'pt-2 bg-[#e7ebef00] text-darkText'}`}>
                                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {msg.sender === 'user' && (
                                        <div className="flex gap-2 items-center mt-1 px-1 text-[10px] text-darkText/50">
                                            <span>{formatDate(msg.timestamp)}</span>
                                            <span>•</span>
                                            <span>{formatTime(msg.timestamp)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3 max-w-[85%] self-start">
                                {/* Avatar */}
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-light-3 flex items-center justify-center shadow-sm">
                                        <span className="text-[10px] font-bold text-primary">AI</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl relative bg-gray-500 text-white flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} className="h-4" />
                    </div>

                    {/* Scroll to bottom button */}
                    {showScrollButton && (
                        <button
                            onClick={scrollToBottom}
                            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-black/10 text-primary shadow-lg rounded-full p-2 hover:bg-white transition-all z-20 animate-in fade-in slide-in-from-bottom-5"
                        >
                            <ChevronDown size={20} />
                        </button>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white/5 border-t border-white/10 shrink-0">
                        <div className="w-full">
                            {renderInputArea()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
