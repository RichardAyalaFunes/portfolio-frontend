import { X, Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ChatTipsProps {
    onClose?: () => void;
    highlightTrigger?: number;
}

export const ChatTips = ({ onClose, highlightTrigger = 0 }: ChatTipsProps) => {
    const [isHighlighting, setIsHighlighting] = useState(false);

    useEffect(() => {
        // Automatically trigger after 3s on mount if no external trigger
        let timer: any;
        if (highlightTrigger === 0) {
            timer = setTimeout(() => {
                setIsHighlighting(true);
                setTimeout(() => setIsHighlighting(false), 2500);
            }, 3000);
        } else {
            // Triggered externally
            setIsHighlighting(true);
            timer = setTimeout(() => setIsHighlighting(false), 2500);
        }
        return () => clearTimeout(timer);
    }, [highlightTrigger]);

    return (
        <div className={cn(
            "flex flex-col p-7 m-4 md:m-6 mt-6 md:mt-8 rounded-2xl bg-white/65 backdrop-blur-md shadow-xl",
            "h-[calc(100%-3rem)] md:h-[calc(100%-4rem)] overflow-hidden",
            isHighlighting && "animate-breathe"
        )}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-accent-cyan flex items-center gap-2">
                    <Lightbulb size={24} /> Tips
                </h2>
                {/* Close button for mobile/tablet */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-1 text-darkText hover:text-primary transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
                <div className="rounded-lg">
                    <h3 className="font-semibold text-primary mb-2">What to ask?</h3>
                    <p className="text-sm text-darkText/80 leading-relaxed mb-3">
                        This AI knows everything about my profile, projects and skills.
                    </p>
                    <ul className="text-sm text-darkText/70 space-y-2 list-disc list-inside">
                        <li>"What is your tech stack?"</li>
                        <li>"Tell me about your latest project."</li>
                        <li>"Do you have experience with React?"</li>
                    </ul>
                </div>

                <div className="rounded-lg mt-4">
                    <h3 className="font-semibold text-primary mb-2">Behind the scenes</h3>
                    <p className="text-sm text-darkText/80 leading-relaxed">
                        When you send a message, we simulate a webhook call to N8N, showing you how background workflows might trigger.
                    </p>
                </div>
            </div>
        </div>
    );
};
