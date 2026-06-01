import React, { useState, useEffect, useRef } from 'react';

const RealTimeBackground: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const gradientRef = useRef<HTMLDivElement>(null);
    const mouseXRef = useRef(0.5);
    const mouseYRef = useRef(0.5);
    const rafRef = useRef<number | null>(null);

    // Refs for animated circle positions and sizes
    const orb1PosRef = useRef({ y: 0 });
    const orb2PosRef = useRef({ y: 0 });
    const orb3PosRef = useRef({ y: 0 });
    const orb4PosRef = useRef({ y: 0 });
    const ring1PosRef = useRef({ x: 0, y: 0 });
    const ring2PosRef = useRef({ x: 0, y: 0 });
    const ring3PosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile || !containerRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            mouseXRef.current = e.clientX / window.innerWidth;
            mouseYRef.current = e.clientY / window.innerHeight;
        };

        const animate = () => {
            if (!containerRef.current) return;

            // Orb animations (vertical movement with subtle bounds)
            const targetOrb1Y = -20 + mouseYRef.current * 15;
            const targetOrb2Y = -20 + mouseYRef.current * 12;
            const targetOrb3Y = 5 + mouseYRef.current * 18;
            const targetOrb4Y = 38 + mouseYRef.current * 8;

            orb1PosRef.current.y += (targetOrb1Y - orb1PosRef.current.y) * 0.03;
            orb2PosRef.current.y += (targetOrb2Y - orb2PosRef.current.y) * 0.03;
            orb3PosRef.current.y += (targetOrb3Y - orb3PosRef.current.y) * 0.03;
            orb4PosRef.current.y += (targetOrb4Y - orb4PosRef.current.y) * 0.03;

            // Ring animations (position follows mouse with offset)
            const targetRing1X = 10 + mouseXRef.current * 12;
            const targetRing1Y = 5 + mouseYRef.current * 10;
            const targetRing2X = 42 + mouseXRef.current * 8;
            const targetRing2Y = -8 + mouseYRef.current * 12;
            const targetRing3X = 15 + (1 - mouseXRef.current) * 20;
            const targetRing3Y = 20 + mouseYRef.current * 15;

            ring1PosRef.current.x += (targetRing1X - ring1PosRef.current.x) * 0.04;
            ring1PosRef.current.y += (targetRing1Y - ring1PosRef.current.y) * 0.04;
            ring2PosRef.current.x += (targetRing2X - ring2PosRef.current.x) * 0.04;
            ring2PosRef.current.y += (targetRing2Y - ring2PosRef.current.y) * 0.04;
            ring3PosRef.current.x += (targetRing3X - ring3PosRef.current.x) * 0.04;
            ring3PosRef.current.y += (targetRing3Y - ring3PosRef.current.y) * 0.04;

            // Apply transforms to circles
            const circles = containerRef.current.querySelectorAll('[data-animated-circle]');
            circles.forEach((el: Element, idx: number) => {
                if (idx === 0) {
                    (el as HTMLElement).style.transform = `translateY(${orb1PosRef.current.y}%)`;
                } else if (idx === 1) {
                    (el as HTMLElement).style.transform = `translateY(${orb2PosRef.current.y}%)`;
                } else if (idx === 2) {
                    (el as HTMLElement).style.transform = `translateY(${orb3PosRef.current.y}%)`;
                } else if (idx === 3) {
                    (el as HTMLElement).style.transform = `translateY(${orb4PosRef.current.y}%)`;
                } else if (idx === 4) {
                    (el as HTMLElement).style.transform = `translate(${ring1PosRef.current.x}%, ${ring1PosRef.current.y}%)`;
                } else if (idx === 5) {
                    (el as HTMLElement).style.transform = `translate(${ring2PosRef.current.x}%, ${ring2PosRef.current.y}%)`;
                } else if (idx === 6) {
                    (el as HTMLElement).style.transform = `translate(${ring3PosRef.current.x}%, ${ring3PosRef.current.y}%)`;
                }
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    if (rafRef.current !== null) {
                        cancelAnimationFrame(rafRef.current);
                        rafRef.current = null;
                    }
                }
            },
            { threshold: 0.1 },
        );

        window.addEventListener('mousemove', handleMouseMove);
        observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            observer.disconnect();
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [isMobile]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ backgroundColor: '#080F1F' }}>

            {/* ── AMBIENT ORBS — diagonal flow: top-right → bottom-left ── */}
            {/* Primary anchor — top-right, deep indigo */}
            <div
                data-animated-circle
                className="absolute -top-[20%] -right-[10%] w-[65vw] h-[65vw] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(67,56,202,0.5) 0%, transparent 65%)',
                    willChange: 'transform',
                    transition: 'none',
                }}
            />
            {/* Secondary anchor — bottom-left, royal blue */}
            <div
                data-animated-circle
                className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(29,78,216,0.45) 0%, transparent 65%)',
                    willChange: 'transform',
                    transition: 'none',
                }}
            />
            {/* Teal/cyan accent — center-bottom, breaks the monotone palette */}
            <div
                data-animated-circle
                className="absolute bottom-[5%] left-[35%] w-[45vw] h-[45vw] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 65%)',
                    willChange: 'transform',
                    transition: 'none',
                }}
            />
            {/* Mid-diagonal connector — keeps the eye moving along the diagonal */}
            <div
                data-animated-circle
                className="absolute top-[38%] -right-[5%] w-[35vw] h-[35vw] rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(49,46,129,0.28) 0%, transparent 60%)',
                    willChange: 'transform',
                    transition: 'none',
                }}
            />

            {/* ── HARD CIRCLES — geometric rings with glow, visible on dark bg ── */}
            {/* Small ring — top-left, indigo */}
            <div
                data-animated-circle
                className="absolute top-[5%] left-[10%] w-32 h-32 rounded-full pointer-events-none"
                style={{
                    background: 'rgba(99,102,241,0.05)',
                    border: '1px solid rgba(99,102,241,0.22)',
                    boxShadow: '0 8px_30px rgba(67,56,202,0.18), inset 0 0 18px rgba(99,102,241,0.08)',
                    willChange: 'transform',
                    transition: 'none',
                }}
            />
            {/* Large ring — top-center (partially off-screen), blue */}
            <div
                data-animated-circle
                className="absolute -top-[8%] left-[42%] w-64 h-64 rounded-full pointer-events-none"
                style={{
                    background: 'rgba(59,130,246,0.04)',
                    border: '1px solid rgba(59,130,246,0.18)',
                    boxShadow: '0 12px 40px rgba(29,78,216,0.15), inset 0 0 28px rgba(59,130,246,0.06)',
                    willChange: 'transform',
                    transition: 'none',
                }}
            />
            {/* Medium ring — bottom-right, teal accent */}
            <div
                data-animated-circle
                className="absolute bottom-[20%] right-[15%] w-56 h-56 rounded-full pointer-events-none"
                style={{
                    background: 'rgba(6,182,212,0.04)',
                    border: '1px solid rgba(6,182,212,0.18)',
                    boxShadow: '0 12px 40px rgba(6,182,212,0.12), inset 0 0 24px rgba(6,182,212,0.06)',
                    willChange: 'transform',
                    transition: 'none',
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
