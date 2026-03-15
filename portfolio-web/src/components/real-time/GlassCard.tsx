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
        <div className={`relative z-10 w-full md:w-auto min-w-[320px] mx-auto ${containerClassName} p-2 sm:p-4 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-white/40 via-white/10 to-white/5 backdrop-blur-md border border-white/40 border-b-white/10 border-r-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] flex flex-col items-center justify-center transition-all duration-300`}>
            {/* Layer 3: Main Inner Card */}
            <div className={`w-full flex justify-center flex-col items-center rounded-[2rem] p-4 md:p-12 relative overflow-hidden bg-lightBg-2/10 ${innerClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
