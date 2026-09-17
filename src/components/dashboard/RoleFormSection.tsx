import { useState } from 'react';
import { Copy, Check, ExternalLink, ChevronDown } from 'lucide-react';
import type { ApplicationFormQuestion, RoleApplicationForm } from '../../api/dashboardApi';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={async () => {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs shrink-0"
            style={{ background: 'var(--db-surface)' }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

function SubstantiveQuestion({ q }: { q: ApplicationFormQuestion }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="p-3 rounded-xl" style={{ background: 'var(--db-surface-2)' }}>
            <button onClick={() => setOpen((v) => !v)} className="w-full flex items-start justify-between gap-2 text-left">
                <span className="text-sm font-medium">{q.question}</span>
                <ChevronDown
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
                />
            </button>
            {open && (
                <div className="mt-2 flex flex-col gap-2">
                    {q.answer_bullets && q.answer_bullets.length > 0 && (
                        <ul className="text-xs list-disc pl-4" style={{ color: 'var(--db-muted)' }}>
                            {q.answer_bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                            ))}
                        </ul>
                    )}
                    {q.answer_draft && (
                        <div className="p-2 rounded-lg text-sm" style={{ background: 'var(--db-surface)' }}>
                            <p className="whitespace-pre-wrap">{q.answer_draft}</p>
                            <div className="flex justify-end mt-1.5">
                                <CopyButton text={q.answer_draft} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function RoleFormSection({ form }: { form: RoleApplicationForm | Record<string, never> }) {
    const [showTrivial, setShowTrivial] = useState(false);

    if (!form || !('apply_type' in form) || !form.apply_type) return null;

    if (form.apply_type === 'easy_apply_skipped') {
        return (
            <div className="mt-5">
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--db-muted)' }}>
                    Application form
                </p>
                <p className="text-xs" style={{ color: 'var(--db-muted)' }}>
                    LinkedIn Easy Apply — skipped by policy, mostly fields you can fill yourself in a minute.
                </p>
            </div>
        );
    }

    const questions = form.questions || [];
    const substantive = questions.filter((q) => q.classification === 'substantive');
    const trivial = questions.filter((q) => q.classification !== 'substantive');

    if (!questions.length && !form.apply_url) return null;

    return (
        <div className="mt-5">
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                    Application form
                </p>
                {form.apply_url && (
                    <a
                        href={form.apply_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: 'var(--db-accent)' }}
                    >
                        Open form <ExternalLink size={11} />
                    </a>
                )}
            </div>

            {substantive.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    {substantive.map((q, i) => (
                        <SubstantiveQuestion key={i} q={q} />
                    ))}
                </div>
            )}

            {trivial.length > 0 && (
                <>
                    <button
                        onClick={() => setShowTrivial((v) => !v)}
                        className="text-xs mt-2"
                        style={{ color: 'var(--db-muted)' }}
                    >
                        {showTrivial ? 'Hide' : 'Also asks'} {trivial.length} simple question
                        {trivial.length > 1 ? 's' : ''} (years of experience, location, etc.)
                    </button>
                    {showTrivial && (
                        <ul className="text-xs mt-1.5 list-disc pl-4" style={{ color: 'var(--db-muted)' }}>
                            {trivial.map((q, i) => (
                                <li key={i}>{q.question}</li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}
