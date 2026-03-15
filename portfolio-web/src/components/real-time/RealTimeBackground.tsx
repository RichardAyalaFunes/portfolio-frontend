import React, { useState, useEffect, useRef } from 'react';

const RealTimeBackground: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);
    const gradientRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) return;
        let animationFrameId: number;

        const handleMouseMove = (e: MouseEvent) => {
            if (gradientRef.current) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(() => {
                    if (gradientRef.current) {
                        const x = e.clientX;
                        const y = e.clientY;
                        gradientRef.current.style.setProperty('--mouse-x', `${x}px`);
                        gradientRef.current.style.setProperty('--mouse-y', `${y}px`);
                    }
                });
            }
        };

        const handleMouseLeave = () => {
            if (gradientRef.current) {
                gradientRef.current.style.setProperty('--mouse-x', `50vw`);
                gradientRef.current.style.setProperty('--mouse-y', `50vh`);
            }
        };

        handleMouseLeave();
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [isMobile]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ backgroundColor: '#080F1F' }}>
            {/* Primary orb — top-right, deep indigo */}
            <div
                className="absolute -top-[20%] -right-[10%] w-[65vw] h-[65vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.45) 0%, transparent 65%)' }}
            />
            {/* Secondary orb — bottom-left, royal blue */}
            <div
                className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.4) 0%, transparent 65%)' }}
            />
            {/* Accent orb — top-left, purple-indigo */}
            <div
                className="absolute -top-[10%] -left-[15%] w-[45vw] h-[45vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(49,46,129,0.35) 0%, transparent 60%)' }}
            />
            {/* Accent orb — bottom-right, deep blue */}
            <div
                className="absolute -bottom-[10%] -right-[15%] w-[40vw] h-[40vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(30,58,138,0.4) 0%, transparent 60%)' }}
            />
            {/* Center subtle bloom */}
            <div
                className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
            />

            {/* Mouse-tracking cyan highlight */}
            <div
                ref={gradientRef}
                className="pointer-events-none absolute inset-0 z-0 will-change-[background]"
                style={{
                    background: isMobile
                        ? `radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.09) 0%, transparent 60%)`
                        : `radial-gradient(700px circle at var(--mouse-x) var(--mouse-y), rgba(14, 165, 233, 0.07) 0%, transparent 100%)`
                }}
            />
        </div>
    );
};

export default RealTimeBackground;
