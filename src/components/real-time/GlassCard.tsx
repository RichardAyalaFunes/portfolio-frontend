import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    containerClassName?: string;
    innerClassName?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
    children, 
    containerClassName = "max-w-4xl", 
    innerClassName = "max-w-3xl" 
}) => {
    return (
        <div
            className={`relative z-10 w-full md:w-auto min-w-[320px] mx-auto ${containerClassName} rounded-[1.75rem] backdrop-blur-2xl border border-white/10 border-t-white/55 shadow-[0_0_70px_rgba(99,102,241,0.35),0_0_130px_rgba(14,165,233,0.12),0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center transition-all duration-300`}
            style={{
                background: `
                    radial-gradient(ellipse at 65% 15%, rgba(186,210,240,0.55) 0%, transparent 55%),
                    linear-gradient(160deg, #c5d8ee 0%, #d9e8f5 25%, #eaf2fb 55%, #f5f9fd 100%)
                `
            }}
        >
            {/* Rim light overlay — faint white at top edge */}
            <div
                className="absolute top-0 left-0 right-0 h-20 rounded-t-[1.75rem] pointer-events-none z-0"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, transparent 100%)' }}
            />
            <div className={`w-full flex justify-center flex-col items-center relative z-10 overflow-hidden ${innerClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
