import { X, Linkedin } from 'lucide-react';
import { LINKEDIN_URL } from '../../config/constants';

interface ChatHistoryProps {
    onClose?: () => void;
}

export const ChatHistory = ({ onClose }: ChatHistoryProps) => {
    // Dummy data for history
    const historyItems = [
        { id: 1, title: 'Discussion about Next.js' },
        { id: 2, title: 'Portfolio Architecture' },
        { id: 3, title: 'Typescript Tips' },
    ];

    return (
        <div className="h-full flex flex-col p-4 relative">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm uppercase font-bold text-secondary pl-3">Chat History</h2>
                {/* Only show close button on mobile */}
                <button
                    onClick={onClose}
                    className="md:hidden p-1 text-darkText hover:text-primary transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pb-4 px-2 -mx-2">
                {historyItems.map((item) => (
                    <button
                        key={item.id}
                        className="group w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/90 border border-white/5 hover:border-white transition-all duration-200 hover:shadow-lg truncate hover:scale-[1.01]"
                    >
                        <span className="text-sm text-darkText/90 transition-all duration-300 group-hover:text-darkText">{item.title}</span>
                    </button>
                ))}
            </div>

            {/* Floating Contact Information Card */}
            <div className="mt-4 pt-4 border-t border-white/5">
                <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl bg-lightBg-3 border border-black/5 backdrop-blur-md shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-secondary/80 hover:border-white/10 group"
                >
                    <p className="text-xs text-darkText/60 group-hover:text-white/80 mb-2 uppercase tracking-wider font-semibold transition-colors">Contact me</p>
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                            <Linkedin size={20} className="text-primary group-hover:text-white/80 transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-primary group-hover:text-white/90 transition-colors">Richard Ayala</span>
                    </div>
                </a>
            </div>
        </div>
    );
};
