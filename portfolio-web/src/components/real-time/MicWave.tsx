import { useEffect, useRef, useState } from 'react';

interface MicWaveProps {
    isActive: boolean;
    barCount?: number;
    className?: string;
}

/**
 * Reads the mic via a dedicated (read-only) AudioContext + AnalyserNode.
 * Opening a second getUserMedia stream purely for FFT is safe — the browser
 * multiplexes the same physical mic, so it doesn't interfere with the SDK.
 */
const MicWave: React.FC<MicWaveProps> = ({ isActive, barCount = 28, className = '' }) => {
    const [levels, setLevels] = useState<number[]>(() => new Array(barCount).fill(0));
    const rafRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const ctxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!isActive) {
            setLevels(new Array(barCount).fill(0));
            return;
        }

        let cancelled = false;

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;

                const ctx = new AudioContext();
                ctxRef.current = ctx;

                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                analyser.smoothingTimeConstant = 0.7;
                ctx.createMediaStreamSource(stream).connect(analyser);

                const data = new Uint8Array(analyser.frequencyBinCount);
                const step = Math.floor(data.length / barCount);

                const tick = () => {
                    analyser.getByteFrequencyData(data);
                    const bars = Array.from({ length: barCount }, (_, i) => {
                        const raw = data[Math.min(i * step, data.length - 1)] ?? 0;
                        return raw / 255;
                    });
                    setLevels(bars);
                    rafRef.current = requestAnimationFrame(tick);
                };
                tick();
            } catch {
                // mic denied — stay at zero
            }
        };

        init();

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            ctxRef.current?.close().catch(() => {});
            streamRef.current = null;
            ctxRef.current = null;
        };
    }, [isActive, barCount]);

    const midpoint = barCount / 2;

    return (
        <div className={`flex items-end justify-center ${className}`} style={{ height: 40, gap: 3 }}>
            {levels.map((level, i) => {
                // Mirror symmetry: bars near the center are taller when loud
                const dist = Math.abs(i - midpoint) / midpoint; // 0 at center, 1 at edges
                const shaped = level * (1 - dist * 0.4);         // center bars respond more
                const heightPx = Math.max(3, shaped * 36 + 3);
                const hue = 230 + i * 3;                         // indigo → violet sweep
                const lightness = 55 + shaped * 10;

                return (
                    <div
                        key={i}
                        style={{
                            width: 3,
                            height: `${heightPx}px`,
                            background: `hsl(${hue}, 65%, ${lightness}%)`,
                            borderRadius: 2,
                            opacity: isActive ? 0.5 + shaped * 0.5 : 0.15,
                            transition: 'height 70ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
                            willChange: 'height',
                        }}
                    />
                );
            })}
        </div>
    );
};

export default MicWave;
