import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { JobApplication } from '../../api/dashboardApi';
import { historyEntries, returnBanner, shortDate, splittablePostings, todayIso, toneColor } from './returnsModel';

interface RoleHistoryProps {
    application: JobApplication;
    /** Move one posting out into a role of its own. Rejects when the server refuses. */
    onSplit: (postingId: string) => Promise<void>;
}

/**
 * What the detail pane says about a role that came back: a banner with the earlier
 * decision, then the timeline, then the way out when two different roles were merged
 * by mistake. Renders nothing for a role with one posting and no comeback.
 */
export function RoleHistory({ application, onSplit }: RoleHistoryProps) {
    const today = todayIso();
    const banner = returnBanner(application, today);
    const postings = splittablePostings(application);
    if (!banner && postings.length === 0) return null;

    const color = banner ? toneColor(banner.tone) : 'var(--db-muted)';
    return (
        <div className="mt-4 flex flex-col gap-3">
            {banner && (
                <div
                    className="p-3 rounded-xl text-sm"
                    style={{
                        background: `color-mix(in srgb, ${color} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
                    }}
                >
                    <p className="font-medium mb-1" style={{ color }}>
                        ↻ {banner.headline}
                    </p>
                    <p style={{ color: 'var(--db-text)' }}>{banner.detail}</p>
                </div>
            )}
            <History application={application} today={today} />
            {postings.length > 0 && <SplitPostings postings={postings} onSplit={onSplit} today={today} />}
        </div>
    );
}

function History({ application, today }: { application: JobApplication; today: string }) {
    const [open, setOpen] = useState(false);
    const entries = historyEntries(application, today);
    if (entries.length < 2) return null;
    return (
        <div>
            <button onClick={() => setOpen((v) => !v)} className="text-sm underline" style={{ color: 'var(--db-muted)', minHeight: 0 }}>
                {open ? 'Hide history' : `Show history (${entries.length - 1} comeback${entries.length - 1 === 1 ? '' : 's'})`}
            </button>
            {open && (
                <ol className="mt-2 flex flex-col gap-3 text-sm" style={{ borderLeft: '2px solid var(--db-border)', paddingLeft: 12 }}>
                    {entries.map((entry) => (
                        <li key={entry.key}>
                            <p className="font-medium">
                                {shortDate(entry.date, today) ?? 'Unknown date'} · {entry.title}
                                {entry.url && (
                                    <a
                                        href={entry.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex ml-2 align-middle"
                                        style={{ color: 'var(--db-muted)', minHeight: 0 }}
                                        aria-label="Open that posting"
                                    >
                                        <ExternalLink size={13} />
                                    </a>
                                )}
                            </p>
                            {entry.lines.map((line) => (
                                <p key={line} className="text-[13px]" style={{ color: 'var(--db-muted)' }}>
                                    {line}
                                </p>
                            ))}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

function SplitPostings({
    postings,
    onSplit,
    today,
}: {
    postings: JobApplication['postings'];
    onSplit: (postingId: string) => Promise<void>;
    today: string;
}) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);

    async function confirm(postingId: string) {
        setBusy(true);
        setFailed(false);
        try {
            await onSplit(postingId);
            setPending(null);
            setOpen(false);
        } catch {
            setFailed(true);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <button onClick={() => setOpen((v) => !v)} className="text-sm underline" style={{ color: 'var(--db-muted)', minHeight: 0 }}>
                {open ? 'Close' : 'Not the same role? Split a posting off'}
            </button>
            {open && (
                <div className="mt-2 flex flex-col gap-2 text-sm">
                    <p style={{ color: 'var(--db-muted)' }}>
                        Postings are merged when company and title match. If one of these is a different opening, move it to a role of its own. It goes back to your queue; your notes and verdict stay here.
                    </p>
                    {postings.map((posting) => (
                        <div key={posting.id} className="flex items-center justify-between gap-2 p-2 rounded-xl" style={{ background: 'var(--db-surface-2)' }}>
                            <span className="min-w-0 truncate">
                                #{posting.id}
                                {posting.run_date ? ` · found ${shortDate(posting.run_date, today)}` : ''}
                                {posting.source ? ` · ${posting.source}` : ''}
                            </span>
                            {pending === posting.id ? (
                                <span className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => void confirm(posting.id)}
                                        disabled={busy}
                                        className="px-3 py-1 rounded-lg font-medium disabled:opacity-50"
                                        style={{ background: 'var(--db-accent)', color: '#0b0e14', minHeight: 0 }}
                                    >
                                        {busy ? 'Splitting…' : 'Split'}
                                    </button>
                                    <button onClick={() => setPending(null)} disabled={busy} style={{ minHeight: 0 }}>
                                        Cancel
                                    </button>
                                </span>
                            ) : (
                                <button onClick={() => setPending(posting.id)} className="shrink-0 underline" style={{ color: 'var(--db-accent)', minHeight: 0 }}>
                                    Split off
                                </button>
                            )}
                        </div>
                    ))}
                    {failed && (
                        <p role="alert" style={{ color: 'var(--db-band-drop)' }}>
                            Could not split it. Try again.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
