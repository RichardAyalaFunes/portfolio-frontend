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
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-700 ease-out bg-background">
            <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0f7fd 0%, #c6e3fa 100%)' }}>
                <div className="absolute top-[5%] left-[10%] w-32 h-32 rounded-full shadow-[0_8px_30px_rgba(59,130,246,0.2)]" style={{ background: 'linear-gradient(135deg, #e1f1fc 0%, #9bcff9 100%)' }} />
                <div className="absolute top-[-10%] left-[45%] w-64 h-64 rounded-full shadow-[0_12px_40px_rgba(59,130,246,0.25)]" style={{ background: 'linear-gradient(225deg, #d0e9fa 0%, #6ab7f7 100%)' }} />
                <div className="absolute top-[15%] right-[20%] w-16 h-16 rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.15)]" style={{ background: 'linear-gradient(45deg, #ebf4fd 0%, #aed9fa 100%)' }} />
                <div className="absolute top-[35%] right-[5%] w-48 h-48 rounded-full shadow-[0_10px_35px_rgba(59,130,246,0.2)]" style={{ background: 'linear-gradient(315deg, #bfe0f8 0%, #3a9ef4 100%)' }} />
                <div className="absolute bottom-[20%] right-[15%] w-56 h-56 rounded-full shadow-[0_12px_40px_rgba(59,130,246,0.25)]" style={{ background: 'linear-gradient(170deg, #e1f1fc 0%, #9bcff9 100%)' }} />
                <div className="absolute bottom-[25%] left-[25%] w-12 h-12 rounded-full shadow-[0_4px_15px_rgba(59,130,246,0.15)]" style={{ background: 'linear-gradient(60deg, #d0e9fa 0%, #6ab7f7 100%)' }} />
                <div className="absolute bottom-[10%] left-[35%] w-24 h-24 rounded-full shadow-[0_6px_25px_rgba(59,130,246,0.2)]" style={{ background: 'linear-gradient(200deg, #ebf4fd 0%, #aed9fa 100%)' }} />
                <div className="absolute bottom-[-10%] left-[5%] w-40 h-40 rounded-full shadow-[0_8px_30px_rgba(59,130,246,0.2)]" style={{ background: 'linear-gradient(85deg, #bfe0f8 0%, #3a9ef4 100%)' }} />
                <div className="absolute top-[35%] left-[2%] w-48 h-48 rounded-full shadow-[0_10px_35px_rgba(59,130,246,0.2)]" style={{ background: 'linear-gradient(260deg, #e1f1fc 0%, #9bcff9 100%)' }} />
                <div className="absolute top-[55%] right-[25%] w-20 h-20 rounded-full shadow-[0_6px_25px_rgba(59,130,246,0.15)]" style={{ background: 'linear-gradient(15deg, #d0e9fa 0%, #6ab7f7 100%)' }} />
                <div className="absolute top-[25%] left-[30%] w-24 h-24 rounded-full shadow-[0_6px_25px_rgba(59,130,246,0.2)]" style={{ background: 'linear-gradient(290deg, #ebf4fd 0%, #aed9fa 100%)' }} />
                <div className="absolute bottom-[5%] right-[35%] w-12 h-12 rounded-full shadow-[0_4px_15px_rgba(59,130,246,0.15)]" style={{ background: 'linear-gradient(110deg, #bfe0f8 0%, #3a9ef4 100%)' }} />
            </div>

            <div
                ref={gradientRef}
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 will-change-[background]"
                style={{
                    background: isMobile
                        ? `radial-gradient(circle at 50% 50%, rgba(255, 219, 181, 0.3) 0%, transparent 60%), radial-gradient(circle at 50% 50%, rgba(255, 209, 160, 0.2) 0%, transparent 50%)`
                        : `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgb(241 243 213 / 30%) 0%, transparent 100%), radial-gradient(100vw circle at calc(70vw - var(--mouse-x, 70vw)) calc(100vh - var(--mouse-y, 100vh)), rgb(232 207 243 / 25%) 0%, transparent 100%)`
                }}
            />
        </div>
    );
};

export default RealTimeBackground;
