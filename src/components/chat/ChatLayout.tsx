import { useState } from 'react';
import { ChatHistory } from './ChatHistory';
import { ChatWindow } from './ChatWindow';
import { ChatTips } from './ChatTips';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Info, X } from 'lucide-react';

export const ChatLayout = () => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isTipsOpen, setIsTipsOpen] = useState(false);
    const [tipsHighlightTrigger, setTipsHighlightTrigger] = useState(0);

    const handleOpenTipsAndHighlight = () => {
        setIsTipsOpen(true);
        setTipsHighlightTrigger(prev => prev + 1);
    };

    return (
        <div className="flex-1 flex w-full h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden z-0">
            {/* Modern Radial Gradients UI overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-[-1]"
                style={{
                    background: `
                        linear-gradient(to bottom, rgba(255, 165, 0, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%),
                        radial-gradient(circle at bottom right, rgba(135, 206, 235, 0.17) 12%, transparent 90%)
                    `
                }}
            />

            {/* Mobile/Tablet Toggles */}
            <div className="absolute top-20 left-4 z-50 md:hidden">
                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-darkText hover:bg-white/20"
                >
                    {isHistoryOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
            <div className="absolute top-20 right-4 z-50 lg:hidden">
                <button
                    onClick={() => setIsTipsOpen(!isTipsOpen)}
                    className="p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-darkText hover:bg-white/20"
                >
                    {isTipsOpen ? <X size={20} /> : <Info size={20} />}
                </button>
            </div>

            {/* Left Column: History (Drawer on mobile, visible on md+) */}
            <AnimatePresence>
                {(isHistoryOpen || window.innerWidth >= 768) && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className={`absolute md:relative z-40 h-full w-72 
              bg-white/5 backdrop-blur-lg border-r border-white/10
              flex-shrink-0 pt-20 
              ${window.innerWidth >= 768 ? '!transform-none !opacity-100' : ''}
            `}
                    >
                        <ChatHistory onClose={() => setIsHistoryOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Middle Column: Chat Window */}
            <div className="flex-1 min-w-0 max-w-[1050px] mx-auto h-full bg-white/2 backdrop-blur-sm flex flex-col pt-24 pb-5">
                <ChatWindow onOpenTips={handleOpenTipsAndHighlight} />
            </div>

            {/* Right Column: Tips (Drawer on mobile/tablet, visible on lg+) */}
            <AnimatePresence>
                {(isTipsOpen || window.innerWidth >= 1024) && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className={`absolute right-0 lg:relative z-40 h-full w-80 
              flex-shrink-0 pt-12 bg-transparent
              ${window.innerWidth >= 1024 ? '!transform-none !opacity-100' : ''}
            `}
                    >
                        <ChatTips onClose={() => setIsTipsOpen(false)} highlightTrigger={tipsHighlightTrigger} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
