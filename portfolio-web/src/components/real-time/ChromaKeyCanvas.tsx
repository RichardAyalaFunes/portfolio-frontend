import { useEffect, useRef } from 'react';

interface ChromaKeyCanvasProps {
    /** The <video> element whose frames we read and filter. */
    videoRef: React.RefObject<HTMLVideoElement | null>;
    /** Only run the rAF loop when true (connected + stream ready). */
    isActive: boolean;
    className?: string;
    /**
     * Green-screen sensitivity 0–255. Lower = more aggressive removal.
     * 70 works well for LiveAvatar's bright chroma green.
     */
    threshold?: number;
}

/**
 * Reads frames from a hidden <video> element, removes green-screen pixels
 * via per-pixel canvas compositing, and renders the result to a <canvas>.
 *
 * Why this is safe:
 *  - The video srcObject is a WebRTC MediaStream (local object, not a URL).
 *    Canvas operations on MediaStream-sourced video are NOT tainted — no
 *    SecurityError is thrown when calling getImageData().
 *
 * Performance:
 *  - At 480×480 (~230 K pixels) getImageData + pixel loop takes ~3–5 ms on a
 *    modern CPU, well within a 16 ms frame budget.
 *  - willReadFrequently: true hints to the browser to keep pixel data on the CPU.
 */
const ChromaKeyCanvas: React.FC<ChromaKeyCanvasProps> = ({
    videoRef,
    isActive,
    className = '',
    threshold = 70,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        if (!isActive) {
            cancelAnimationFrame(rafRef.current);
            // Clear canvas when inactive so no stale frame shows.
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const draw = () => {
            // Video hasn't decoded the first frame yet — wait.
            if (!video.videoWidth || !video.videoHeight) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            // Resize canvas to match source video (only when dimensions change).
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
                const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const d = frame.data;

                for (let i = 0; i < d.length; i += 4) {
                    const r = d[i];
                    const g = d[i + 1];
                    const b = d[i + 2];

                    // Chroma key condition:
                    //  - green channel is above threshold (not near-black)
                    //  - green dominates red by ≥40%
                    //  - green dominates blue by ≥40%
                    if (g > threshold && g > r * 1.4 && g > b * 1.4) {
                        d[i + 3] = 0; // fully transparent
                    }
                }

                ctx.putImageData(frame, 0, 0);
            } catch {
                // If getImageData is somehow blocked, fall through and show the
                // raw frame rather than crashing the loop.
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(rafRef.current);
    }, [isActive, videoRef, threshold]);

    return <canvas ref={canvasRef} className={className} />;
};

export default ChromaKeyCanvas;
