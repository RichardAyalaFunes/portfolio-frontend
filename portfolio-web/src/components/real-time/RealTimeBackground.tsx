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

            {/* ── AMBIENT ORBS — diagonal flow: top-right → bottom-left ── */}
            {/* Primary anchor — top-right, deep indigo */}
            <div
                className="absolute -top-[20%] -right-[10%] w-[65vw] h-[65vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.5) 0%, transparent 65%)' }}
            />
            {/* Secondary anchor — bottom-left, royal blue */}
            <div
                className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.45) 0%, transparent 65%)' }}
            />
            {/* Teal/cyan accent — center-bottom, breaks the monotone palette */}
            <div
                className="absolute bottom-[5%] left-[35%] w-[45vw] h-[45vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 65%)' }}
            />
            {/* Mid-diagonal connector — keeps the eye moving along the diagonal */}
            <div
                className="absolute top-[38%] -right-[5%] w-[35vw] h-[35vw] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(49,46,129,0.28) 0%, transparent 60%)' }}
            />

            {/* ── HARD CIRCLES — geometric rings with glow, visible on dark bg ── */}
            {/* Small ring — top-left, indigo */}
            <div
                className="absolute top-[5%] left-[10%] w-32 h-32 rounded-full pointer-events-none"
                style={{
                    background: 'rgba(99,102,241,0.05)',
                    border: '1px solid rgba(99,102,241,0.22)',
                    boxShadow: '0 8px_30px rgba(67,56,202,0.18), inset 0 0 18px rgba(99,102,241,0.08)',
                }}
            />
            {/* Large ring — top-center (partially off-screen), blue */}
            <div
                className="absolute -top-[8%] left-[42%] w-64 h-64 rounded-full pointer-events-none"
                style={{
                    background: 'rgba(59,130,246,0.04)',
                    border: '1px solid rgba(59,130,246,0.18)',
                    boxShadow: '0 12px 40px rgba(29,78,216,0.15), inset 0 0 28px rgba(59,130,246,0.06)',
                }}
            />
            {/* Medium ring — bottom-right, teal accent */}
            <div
                className="absolute bottom-[20%] right-[15%] w-56 h-56 rounded-full pointer-events-none"
                style={{
                    background: 'rgba(6,182,212,0.04)',
                    border: '1px solid rgba(6,182,212,0.18)',
                    boxShadow: '0 12px 40px rgba(6,182,212,0.12), inset 0 0 24px rgba(6,182,212,0.06)',
                }}
            />

            {/* ── NOISE TEXTURE — adds tactile grain depth ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: 0.04,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '200px 200px',
                }}
            />

            {/* ── MOUSE-TRACKING CYAN HIGHLIGHT ── */}
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
