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
        <div className={`relative z-10 w-full md:w-auto min-w-[320px] mx-auto ${containerClassName} rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-white/30 border-t-white/60 shadow-[0_0_80px_rgba(14,165,233,0.35),0_25px_60px_rgba(0,0,0,0.55)] flex flex-col items-center justify-center transition-all duration-300`}>
            <div className={`w-full flex justify-center flex-col items-center relative overflow-hidden ${innerClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
