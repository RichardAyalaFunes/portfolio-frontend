import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

/** Page names are plain file slugs like "03-sql-orm"; anything else falls back to the index. */
const PAGE_PATTERN = /^[a-z0-9-]+$/;

/**
 * /dashboard/cheatsheets: the live-coding cheat sheets, served as static HTML from
 * public/cheatsheets so they keep their own expand/collapse and light/dark controls.
 * /dashboard/cheatsheets/<page> opens one sheet directly.
 */
export function Cheatsheets() {
    const frame = useRef<HTMLIFrameElement>(null);
    const params = useParams();
    const page = params['*'] && PAGE_PATTERN.test(params['*']) ? params['*'] : 'index';
    const src = `/cheatsheets/${page}.html`;

    return (
        <div className="h-full flex flex-col">
            <div
                className="flex items-center justify-between px-4 py-2 text-xs"
                style={{ borderBottom: '1px solid var(--db-border)', color: 'var(--db-muted)' }}
            >
                <button type="button" className="font-medium underline underline-offset-4" style={{ color: 'var(--db-accent)' }}
                    onClick={() => { if (frame.current) frame.current.src = '/cheatsheets/index.html'; }}>
                    ← Todos los temas
                </button>
                <a href={src} onClick={(event) => {
                    // Links inside the iframe can navigate independently of the outer route.
                    const current = frame.current?.contentWindow?.location.href;
                    if (current) event.currentTarget.href = current;
                }} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: 'var(--db-accent)' }}>
                    <ExternalLink size={14} />
                    <span>Full screen</span>
                </a>
            </div>
            <iframe ref={frame} key={src} src={src} title="Cheat sheets" className="flex-1 w-full border-0" style={{ minHeight: 0 }} />
        </div>
    );
}
